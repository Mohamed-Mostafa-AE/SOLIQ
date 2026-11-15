import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {getOutlook,readOptions} from './lib/outlook-service.js';
import {chooseAnalogues} from './outlook-core.js';
import {simulate,datesInYear} from './engine.js';
import {defaultFarmContext} from './rotation-context.js';
import {evidenceReport} from './lib/evidence-report.js';

const directory=process.env.EGYPT_BENCHMARK_DIR||'artifacts/egypt-sakha';
await mkdir(directory,{recursive:true});
const started=performance.now(),asOf=new Date(process.env.BENCHMARK_AS_OF||'2026-11-15T12:00:00Z');
const location={name:'Sakha area, Kafr El Sheikh, Egypt',lat:31+5/60,lon:30+56/60,precision:'Approximate study-area point, not a verified farm polygon',reference:'https://doi.org/10.3389/fpls.2023.1165113'};
const input={lat:location.lat,lon:location.lon};
const data=await getOutlook(input,asOf),raw=[];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const median=values=>{const a=[...values].sort((a,b)=>a-b),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;};
const mean=values=>values.reduce((a,b)=>a+b,0)/values.length;

// A second parser and aggregate implementation checks the application's output.
for(const [i,source] of data.sources.entries()){
 const response=await fetch(source.request,{signal:AbortSignal.timeout(60000)});assert.equal(response.status,200);
 const bytes=await response.text(),json=JSON.parse(bytes),p=json.properties.parameter;
 assert.equal(json.header.time_standard,'UTC');assert.ok(['mm/day','mm/d'].includes(json.parameters.PRECTOTCORR.units));
 const rows=Object.keys(p.PRECTOTCORR).sort().filter(key=>[p.PRECTOTCORR[key],p.T2M_MIN[key],p.T2M_MAX[key]].every(Number.isFinite)&&p.PRECTOTCORR[key]>=0&&p.T2M_MIN[key]>-999&&p.T2M_MAX[key]>-999).map(key=>({date:key.slice(0,4)+'-'+key.slice(4,6)+'-'+key.slice(6),rain:p.PRECTOTCORR[key],tmin:p.T2M_MIN[key],tmax:p.T2M_MAX[key]}));
 assert.ok(rows.every((r,j)=>r.tmin<=r.tmax&&(j===0||Date.parse(r.date)-Date.parse(rows[j-1].date)===86400000)));
 const filename=i===0?'nasa-power-2026-raw.json':'nasa-power-2016-2025-raw.json';await writeFile(directory+'/'+filename,bytes);
 raw.push({filename,sha256:hash(bytes),request:source.request,retrievedAt:new Date().toISOString(),rows});
}
assert.deepEqual(raw[0].rows,data.weather);
const rain=raw[0].rows.reduce((sum,r)=>sum+r.rain,0),hot=raw[0].rows.filter(r=>r.tmax>=35).length;
assert.ok(Math.abs(rain-data.observed.rain)<1e-10);assert.equal(hot,data.observed.heatDays);
assert.equal(raw[1].rows.length,3653);
const history=Object.fromEntries(Array.from({length:10},(_,i)=>[2016+i,raw[1].rows.filter(r=>r.date.startsWith(String(2016+i)))]));
for(const [year,rows] of Object.entries(history))assert.equal(rows.length,datesInYear(Number(year)).length);

// Independently sum daily storage and fluxes for each full-year strategy/member pair.
let maxDailyClosure=0,maxAnnualClosure=0,maxSummaryError=0;
const allRuns=[];
for(const strategy of data.projection.results){
 const runs=[];
 for(const member of data.projection.analogueYears){
  const lookup=new Map(history[member.year].map(r=>[r.date.slice(5),r]));
  const forcing=datesInYear(2026).map((date,index)=>index<data.weather.length?data.weather[index]:{...lookup.get(date.slice(5)),date});
  assert.deepEqual(forcing.slice(0,data.weather.length),data.weather);
  const run=simulate(forcing,data.config,strategy);let previous=data.config.initial,sumI=0,sumET=0,sumD=0,sumP=0,sumR=0;
  for(const day of run.daily){const runoff=day.rain*data.config.runoff;const closure=previous+day.rain+day.irrigation-runoff-day.drainage-day.et-day.storage;maxDailyClosure=Math.max(maxDailyClosure,Math.abs(closure));previous=day.storage;sumI+=day.irrigation;sumET+=day.et;sumD+=day.drainage;sumP+=day.rain;sumR+=runoff;assert.ok(day.storage>=-1e-9&&day.storage<=data.config.capacity+1e-9);}
  maxAnnualClosure=Math.max(maxAnnualClosure,Math.abs(data.config.initial+sumP+sumI-sumR-sumD-sumET-run.finalStorage));assert.ok(sumI<=data.config.irrigation+1e-9);
  runs.push(run);allRuns.push({strategy:strategy.id,donor:member.year,deficit:run.deficit,irrigation:sumI,finalStorage:run.finalStorage});
 }
 maxSummaryError=Math.max(maxSummaryError,Math.abs(median(runs.map(r=>r.deficit))-strategy.deficit.p50));
}
assert.ok(maxDailyClosure<1e-9&&maxAnnualClosure<1e-8&&maxSummaryError<1e-8);

// Chronological holdouts supplement the app's leave-one-year-out diagnostics.
const folds=[];
for(let year=2022;year<=2025;year++){
 const training=Object.fromEntries(Object.entries(history).filter(([y])=>Number(y)<year));
 const target=history[year],cutoff=data.coverage.through.slice(5),prefix=target.filter(r=>r.date.slice(5)<=cutoff),tail=target.filter(r=>r.date.slice(5)>cutoff);
 assert.ok(Object.keys(training).every(y=>Number(y)<year));
 const selected=chooseAnalogues(prefix,training),actual={rain:tail.reduce((a,r)=>a+r.rain,0),heatDays:tail.filter(r=>r.tmax>=35).length};
 const summary={year,trainingYears:Object.keys(training).map(Number),donors:selected.map(x=>x.year),truthDays:tail.length,actual};
 for(const [name,years] of Object.entries({analogue:selected.map(x=>x.year),climatology:Object.keys(training)})){
  const totals=years.map(y=>training[y].filter(r=>r.date.slice(5)>cutoff));const forecast={rain:median(totals.map(rows=>rows.reduce((a,r)=>a+r.rain,0))),heatDays:median(totals.map(rows=>rows.filter(r=>r.tmax>=35).length))};
  summary[name]={estimate:forecast,rainError:Math.abs(forecast.rain-actual.rain),heatError:Math.abs(forecast.heatDays-actual.heatDays)};
 }
 folds.push(summary);
}
const chronological={folds,metrics:Object.fromEntries(['analogue','climatology'].map(key=>[key,{rainMAE:mean(folds.map(f=>f[key].rainError)),heatMAE:mean(folds.map(f=>f[key].heatError))}]))};
const unsupported=defaultFarmContext();unsupported.domain='unsupported';assert.throws(()=>readOptions({...input,context:unsupported}),/Invalid model domain/);
assert.equal(data.conditionalComparison.eligibleOrder.length,0);assert.ok(data.decisionCards.every(c=>c.status==='needs_review'));
const english=evidenceReport(data,'English'),arabic=evidenceReport(data,'Arabic');assert.equal(english.evidenceId,arabic.evidenceId);assert.match(english.text,/No preference order/);assert.match(arabic.text,/تقرير الأدلة/);
const monthly=data.monthly.filter(m=>m.observedDays);
const summary={type:'Real NASA point-data and software benchmark; not a field-validation study',location,asOf:asOf.toISOString(),generatedAt:new Date().toISOString(),commit:process.env.GITHUB_SHA||null,coverage:data.coverage,evidenceId:data.evidenceId,observed:data.observed,matchedHistoricalRainMedian:data.samePeriodBaseline.rainMedian,checks:{rawParserAgreement:true,rawHistoryDays:3653,scenarioRuns:allRuns.length,scenarioDays:allRuns.length*365,maxDailyClosureMm:maxDailyClosure,maxAnnualClosureMm:maxAnnualClosure,maxSummaryErrorMm:maxSummaryError,unsupportedDomainBlocked:true,unconfirmedPreferencesWithheld:true},chronological,appRetrospectiveHindcast:data.hindcast,scenarioResults:data.projection.results.map(({daily,...r})=>r),assumptions:data.config,monthly,raw:raw.map(({rows,...r})=>r),elapsedMs:performance.now()-started,scope:'Three illustrative calendars. Not observed farm history. No measured soil/irrigation or station validation. Flooded rice, salinity and groundwater are outside model scope. No yield, profit or soil-health forecast.'};
await writeFile(directory+'/summary.json',JSON.stringify(summary,null,2));await writeFile(directory+'/outlook-evidence.json',JSON.stringify(data,null,2));await writeFile(directory+'/adviser-en.txt',english.text);await writeFile(directory+'/adviser-ar.txt',arabic.text);
await writeFile(directory+'/weather-2026.csv','date,tmin_C,tmax_C,rain_mm_per_day\n'+data.weather.map(r=>[r.date,r.tmin,r.tmax,r.rain].join(',')).join('\n'));
await writeFile(directory+'/scenario-members.csv','strategy,donor,unmet_demand_mm,irrigation_mm,final_storage_mm\n'+allRuns.map(r=>Object.values(r).join(',')).join('\n'));
const f=(x,d=2)=>Number(x).toFixed(d),h=chronological.metrics;
const md=`# Soil-IQ: Sakha / Kafr El Sheikh benchmark\n\nRun: ${summary.generatedAt}. Commit: ${summary.commit||'local; see GitHub run'}.\n\n**Scope:** ${summary.type}. Approximate study-area point ${f(location.lat,6)} N, ${f(location.lon,6)} E. Coordinates follow the experimental-site description in https://doi.org/10.3389/fpls.2023.1165113. FAO documents agricultural water-productivity activity in Kafr El Sheikh: https://www.fao.org/egypt/news/detail/A-high-level-visit-to-identify-the-progress-of-Enhancing-Water-Productivity-in-Agriculture-project-in-Kafr-El-Sheikh-/en\n\n## Real NASA weather\n\n| Metric | Result |\n|---|---:|\n| Coverage | ${data.coverage.start} to ${data.coverage.through} |\n| Valid 2026 daily records | ${data.coverage.validDays} |\n| Precipitation accumulation | ${f(rain)} mm |\n| Maximum temperature at least 35 C | ${hot} days |\n| Mean daily maximum temperature | ${f(data.observed.meanTmax)} C |\n| Same-period 2016–2025 precipitation median | ${f(data.samePeriodBaseline.rainMedian)} mm |\n| Complete historical records | 3,653 days |\n\n## Independent numerical checks\n\nRaw date coverage, units, time standard and aggregates agree with the application. All 15 full-year strategy/member runs preserve the observed prefix, storage bounds and the irrigation budget. Maximum independently calculated daily closure: ${maxDailyClosure.toExponential(4)} mm; annual closure: ${maxAnnualClosure.toExponential(4)} mm. These residuals measure bookkeeping, not field accuracy.\n\n## Illustrative calendars under shared assumptions\n\nCapacity ${data.config.capacity} mm, initial storage ${data.config.initial} mm, annual effective irrigation budget ${data.config.irrigation} mm, runoff fraction ${data.config.runoff}; all assumed. All local crop and soil checks remain unknown. Calendar R0 is a demo baseline, not a measured Sakha rotation.\n\n| Calendar | Median modeled unmet demand (mm) | P10–P90 across five historical members (mm) | Planned crop days |\n|---|---:|---:|---:|\n${summary.scenarioResults.map(r=>`| ${r.id} | ${f(r.deficit.p50)} | ${f(r.deficit.p10)}–${f(r.deficit.p90)} | ${r.coverDays} |`).join('\n')}\n\nFull month-by-month calendars and coefficients are in summary.json. No crop is recommended: unknown feasibility withholds the preference order. Flooded rice, salinity and groundwater interactions require different, validated models; the unsupported-domain guard passed.\n\n## Chronological weather holdouts\n\nFour target years, 2022–2025, each trained only on earlier years from 2016. Same calendar-date cutoff as 2026; remaining-period weather is held out. This is retrospective, with only four folds.\n\n| Predictor | Remaining-period rainfall MAE (mm) | Heat-day MAE (days) |\n|---|---:|---:|\n| Five analog years | ${f(h.analogue.rainMAE)} | ${f(h.analogue.heatMAE)} |\n| All prior years, median climatology | ${f(h.climatology.rainMAE)} | ${f(h.climatology.heatMAE)} |\n\n${h.analogue.rainMAE>h.climatology.rainMAE?'Analog rainfall predictions are WORSE than climatology in this test. No predictive advantage is demonstrated.':'The analog method has lower rainfall MAE in this small test; this does not establish general superiority or calibrated probabilities.'}\n\n## Evidence and limits\n\nNASA POWER is regional gridded weather, not a field sensor. The cited Sakha study reports both saline and non-saline sites; its old soil values were not imported as current farm measurements. There is no independent 2026 weather station or soil/irrigation record in this benchmark, so field accuracy and crop outcomes cannot be established. Scenario quantiles are not calibrated probabilities. English and Arabic deterministic adviser reports use the same evidence hash; actual neural retrieval is tested separately in GitHub browser checks.\n\nEvidence SHA-256: ${data.evidenceId}. Raw responses, request URLs, units, timestamps and checksums are retained in this folder. No synthetic weather is substituted.\n`;
await writeFile(directory+'/REPORT.md',md);console.log(md);
