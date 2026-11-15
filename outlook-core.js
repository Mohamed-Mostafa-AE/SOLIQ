import { CROPS, DEFAULTS, STRATEGIES, datesInYear, simulate, validateConfig, validateWeather } from './engine.js';

const dayMs = 86400000;
export function dayRange(start, end) {
  const result = [];
  for (let time = Date.parse(start+'T00:00:00Z'); time <= Date.parse(end+'T00:00:00Z'); time += dayMs) result.push(new Date(time).toISOString().slice(0,10));
  return result;
}
export function powerRangeUrl(lat, lon, start, end) {
  if (!Number.isFinite(lat)||Math.abs(lat)>60||!Number.isFinite(lon)||Math.abs(lon)>180) throw Error('Coordinates outside supported range');
  return 'https://power.larc.nasa.gov/api/temporal/daily/point?'+new URLSearchParams({parameters:'T2M_MIN,T2M_MAX,PRECTOTCORR',community:'AG',latitude:String(lat),longitude:String(lon),start:start.replaceAll('-',''),end:end.replaceAll('-',''),format:'JSON','time-standard':'UTC'});
}
// Only a trailing publication delay is accepted. Interior gaps are never imputed.
export function parsePowerRange(json, start, end, allowTrailing = false) {
  if (json?.header?.time_standard !== 'UTC') throw Error('Expected NASA POWER UTC daily data');
  for (const key of ['T2M_MIN','T2M_MAX']) if (!['C','degC','°C'].includes(json.parameters?.[key]?.units)) throw Error('Unsupported temperature unit');
  if (!['mm/day','mm/d'].includes(json.parameters?.PRECTOTCORR?.units)) throw Error('Expected precipitation in mm/day');
  const p=json.properties?.parameter;
  if (!p) throw Error('Missing NASA POWER parameters');
  const rows=[];let gap=false;
  for (const date of dayRange(start,end)) {
    const key=date.replaceAll('-','');
    const row={date,tmin:p.T2M_MIN?.[key],tmax:p.T2M_MAX?.[key],rain:p.PRECTOTCORR?.[key]};
    const values=[row.tmin,row.tmax,row.rain];
    const missing=values.some(v=>v==null||v===json.header.fill_value||v===-999);
    if (missing) {if (!allowTrailing) throw Error('Incomplete NASA data on '+date);gap=true;continue;}
    if (gap) throw Error('Interior weather gap before '+date+'; projection stopped');
    if (values.some(v=>!Number.isFinite(v))||row.tmin < -80||row.tmax > 65||row.tmax < row.tmin||row.rain < 0||row.rain > 2000) throw Error('Invalid NASA weather on '+date);
    rows.push(row);
  }
  if (!rows.length) throw Error('No valid NASA weather in the requested period');
  return rows;
}
export function quantile(values, p) {
  const a=[...values].sort((a,b)=>a-b),x=(a.length-1)*p,i=Math.floor(x);
  if (!a.length) return null;
  return a[i]+(a[Math.ceil(x)]-a[i])*(x-i);
}
const average=a=>a.reduce((s,x)=>s+x,0)/Math.max(1,a.length);
function windowFeatures(rows) {return [average(rows.map(r=>r.tmin)),average(rows.map(r=>r.tmax)),Math.log1p(rows.reduce((s,r)=>s+r.rain,0))];}
function mappedYear(rows, year) {
  const lookup=new Map(rows.map(r=>[r.date.slice(5),r]));
  return datesInYear(year).map(date=>{
    let source=lookup.get(date.slice(5));
    // Leap day needs an explicit rule when the donor year is not a leap year.
    if (!source&&date.endsWith('02-29')) {const a=lookup.get('02-28'),b=lookup.get('03-01');source={tmin:(a.tmin+b.tmin)/2,tmax:(a.tmax+b.tmax)/2,rain:(a.rain+b.rain)/2};}
    if (!source) throw Error('Incomplete historical donor year');
    return {...source,date};
  });
}
export function chooseAnalogues(current, history, count=5) {
  const recent=current.slice(-60),months=new Set(recent.map(r=>r.date.slice(5))),target=windowFeatures(recent);
  const candidates=Object.entries(history).map(([year,rows])=>({year:Number(year),features:windowFeatures(rows.filter(r=>months.has(r.date.slice(5))))}));
  const scales=[0,1,2].map(i=>{const mean=average(candidates.map(c=>c.features[i]));return Math.max(i===2?0.1:1,Math.sqrt(average(candidates.map(c=>(c.features[i]-mean)**2))));});
  return candidates.map(c=>({...c,distance:Math.sqrt(c.features.reduce((s,x,i)=>s+((x-target[i])/scales[i])**2,0))})).sort((a,b)=>a.distance-b.distance||a.year-b.year).slice(0,count).map(({year,distance})=>({year,distance}));
}
export function projectSeason(current, history, config, strategies=STRATEGIES) {
  const year=Number(current[0]?.date.slice(0,4));
  validateConfig({...config,year:Math.min(year-1,new Date().getUTCFullYear()-1)});
  const expected=datesInYear(year);
  for(const r of current)if(!Number.isFinite(r.tmin)||!Number.isFinite(r.tmax)||!Number.isFinite(r.rain)||r.tmin < -80||r.tmax > 65||r.tmax < r.tmin||r.rain < 0||r.rain > 2000)throw Error('Invalid current weather');
  if (current.length<60||current.some((r,i)=>r.date!==expected[i])) throw Error('Projection requires at least 60 contiguous days from January 1');
  if (Object.keys(history).length<6) throw Error('At least six complete historical years are required');
  if (Object.keys(history).some(y=>Number(y)>=year)) throw Error('Historical donors must precede the target year');
  for (const [y,rows] of Object.entries(history)) {
    validateWeather(rows,Number(y));
  }
  if (!Array.isArray(strategies)||strategies.length!==3||new Set(strategies.map(s=>s.id)).size!==3||strategies.some(s=>!Array.isArray(s.crops)||s.crops.length!==12||s.crops.some(c=>!Object.hasOwn(CROPS,c)))) throw Error('Three distinct strategy calendars are required');
  const selected=chooseAnalogues(current,history),cutoff=current.at(-1).date;
  const members=selected.map(({year:donor})=>({year:donor,rows:mappedYear(history[donor],year).map((row,i)=>i<current.length?current[i]:row)}));
  const interval=values=>({p10:quantile(values,.1),p50:quantile(values,.5),p90:quantile(values,.9)});
  const results=strategies.map(strategy=>{
    const runs=members.map(m=>simulate(m.rows,config,strategy));
    return {id:strategy.id,name:strategy.name,crops:strategy.crops,deficit:interval(runs.map(r=>r.deficit)),irrigation:interval(runs.map(r=>r.irrigation)),demand:interval(runs.map(r=>r.demand)),finalStorage:interval(runs.map(r=>r.finalStorage)),coverDays:runs[0].coverDays,maxResidual:Math.max(...runs.map(r=>r.maxResidual)),daily:expected.map((date,i)=>({date,crop:runs[0].daily[i].crop,projected:date>cutoff,storage:interval(runs.map(r=>r.daily[i].storage)),demand:interval(runs.map(r=>r.daily[i].demand))}))};
  });
  return {method:'nearest-historical-weather-analogue-v1',targetYear:year,cutoff,analogueYears:selected,windowDays:60,ensembleSize:members.length,rangeMeaning:'10th–90th percentiles across selected historical scenarios, not a calibrated probability interval',futureDays:expected.length-current.length,results};
}
export function summarizeWeather(rows,heat=35) {
  return {days:rows.length,rain:rows.reduce((s,r)=>s+r.rain,0),heatDays:rows.filter(r=>r.tmax>=heat).length,meanTmax:average(rows.map(r=>r.tmax))};
}
// Leave-one-year-out hindcasts assess the weather analogue, not crop yield accuracy.
export function hindcast(history, cutoffMonthDay, heat=35) {
  const errors={analogue:[],climatology:[]};
  for (const [year,rows] of Object.entries(history)) {
    const prefix=rows.filter(r=>r.date.slice(5)<=cutoffMonthDay),truth=rows.filter(r=>r.date.slice(5)>cutoffMonthDay);
    if (prefix.length<60||truth.length<14) continue;
    const training=Object.fromEntries(Object.entries(history).filter(([y])=>y!==year));
    const selected=chooseAnalogues(prefix,training).map(a=>String(a.year));
    const actual=summarizeWeather(truth,heat);
    for (const [model,donors] of Object.entries({analogue:selected,climatology:Object.keys(training)})) {
      const summaries=donors.map(y=>summarizeWeather(training[y].filter(r=>r.date.slice(5)>cutoffMonthDay),heat));
      const estimate={rain:quantile(summaries.map(x=>x.rain),.5),heatDays:quantile(summaries.map(x=>x.heatDays),.5)};
      errors[model].push({rain:Math.abs(estimate.rain-actual.rain),heatDays:Math.abs(estimate.heatDays-actual.heatDays)});
    }
  }
  return {type:'leave-one-year-out retrospective weather hindcast',folds:errors.analogue.length,cutoffMonthDay,notForwardChained:true,metrics:Object.fromEntries(Object.entries(errors).map(([key,values])=>[key,{rainMAE:average(values.map(x=>x.rain)),heatDaysMAE:average(values.map(x=>x.heatDays))}])),scope:'Future-period rainfall and heat-day errors only; no yield or field validation. Each target year is excluded, but other folds may use later historical years.'};
}
export { DEFAULTS, STRATEGIES };
