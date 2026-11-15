import { CROPS, STRATEGIES, datesInYear } from './engine.js';

export const CONTEXT_VERSION='farm-context-1';
export const CONTEXT_REFERENCES={
 water:'https://www.fao.org/4/r4082e/r4082e03.htm',
 rotation:'https://www.fao.org/4/v9926e/v9926e06.htm',
 cover:'https://www.fao.org/conservation-agriculture/in-practice/soil-organic-cover/en'
};
export function defaultFarmContext() {
 return {version:CONTEXT_VERSION,baselineConfirmed:false,soil:{origin:'assumed',source:'',date:'',depthCm:null,fieldCapacityPct:null,wiltingPointPct:null},domain:'unconfirmed',priority:'water',calendars:STRATEGIES.map(s=>[...s.crops]),checks:STRATEGIES.map(()=>({seed:'unknown',equipment:'unknown',market:'unknown',local:'unknown'}))};
}
export function readFarmContext(raw) {
 if(raw==null||raw==='')return defaultFarmContext();
 let value=raw;
 if(typeof raw==='string'){if(raw.length>12000)throw Error('Invalid farm context size');try{value=JSON.parse(raw);}catch{throw Error('Invalid farm context JSON');}}
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid farm context');
 const defaults=defaultFarmContext();
 const context={...defaults,...value,soil:{...defaults.soil,...value.soil}};
 if(typeof context.baselineConfirmed!=='boolean')throw Error('Invalid baseline confirmation');
 if(!['water','cover','diversity'].includes(context.priority))throw Error('Invalid farmer priority');
 if(!['unconfirmed','non_flooded','unsupported'].includes(context.domain))throw Error('Invalid water-model domain');
 if(!['assumed','measured','survey'].includes(context.soil.origin))throw Error('Invalid soil origin');
 for(const key of ['source','date'])if(typeof context.soil[key]!=='string'||context.soil[key].length>(key==='source'?180:10))throw Error('Invalid soil source/date');
 if(context.soil.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(context.soil.date)||(!Number.isFinite(Date.parse(context.soil.date+'T00:00:00Z'))||new Date(context.soil.date+'T00:00:00Z').toISOString().slice(0,10)!==context.soil.date)||context.soil.date>new Date().toISOString().slice(0,10)))throw Error('Invalid soil date');
 const numbers=['depthCm','fieldCapacityPct','wiltingPointPct'];
 for(const key of numbers){const x=context.soil[key];if(x!==null&&(!Number.isFinite(x)||x<0||x>(key==='depthCm'?300:80)))throw Error('Invalid soil '+key);}
 const supplied=numbers.filter(k=>context.soil[k]!==null).length;
 if(supplied&&supplied!==3)throw Error('Provide depth, field capacity and wilting point together');
 if(supplied&&(context.soil.depthCm<=0||context.soil.fieldCapacityPct<=context.soil.wiltingPointPct))throw Error('Field capacity must exceed wilting point and depth must be positive');
 if(!Array.isArray(context.calendars)||context.calendars.length!==3||context.calendars.some(c=>!Array.isArray(c)||c.length!==12||c.some(key=>typeof key!=='string'||!Object.hasOwn(CROPS,key))))throw Error('Three calendars of 12 known crop entries are required');
 if(!Array.isArray(context.checks)||context.checks.length!==3||context.checks.some(c=>!c||['seed','equipment','market','local'].some(k=>!['yes','no','unknown'].includes(c[k]))))throw Error('Invalid feasibility checks');
 // Keep the accepted schema small; unknown input fields never reach the analysis or export.
 return {version:CONTEXT_VERSION,baselineConfirmed:context.baselineConfirmed,soil:{origin:context.soil.origin,source:context.soil.source,date:context.soil.date,...Object.fromEntries(numbers.map(k=>[k,context.soil[k]]))},domain:context.domain,priority:context.priority,calendars:context.calendars.map(c=>[...c]),checks:context.checks.map(c=>Object.fromEntries(['seed','equipment','market','local'].map(k=>[k,c[k]])))};
}
export function soilCapacity(context) {
 const soil=context.soil;
 if(soil.depthCm===null)return null;
 // Whole-soil volumetric percentages. No extra rock correction is applied.
 const capacity=(soil.fieldCapacityPct-soil.wiltingPointPct)/100*soil.depthCm*10;
 if(capacity<10||capacity>500)throw Error('Derived soil capacity is outside this model’s 10–500 mm domain');
 return capacity;
}
export function contextStrategies(context) {
 return STRATEGIES.map((s,i)=>({...s,name:i===0?'Current calendar':'Alternative '+i,crops:[...context.calendars[i]]}));
}
export function rotationDecisionCards(weather,projection,context) {
 const dates=datesInYear(projection.targetYear),baseline=projection.results[0];
 return projection.results.map((result,index)=>{
  const checks=context.checks[index],excluded=Object.entries(checks).filter(([,v])=>v==='no').map(([k])=>k),missing=Object.entries(checks).filter(([,v])=>v==='unknown').map(([k])=>k);
  if(!context.baselineConfirmed)missing.push('baseline');
  if(index>0&&projection.results.slice(0,index).some(previous=>previous.crops.every((crop,m)=>crop===result.crops[m])))missing.push('distinct_calendar');
  if(context.soil.origin==='assumed'||!context.soil.source||!context.soil.date)missing.push('soil_evidence');
  if(context.domain!=='non_flooded')missing.push('model_domain');
  const windows=[];let current=null;
  for(const date of dates){const crop=result.crops[Number(date.slice(5,7))-1];if(crop==='fallow'){if(!current)current={start:date,end:date,days:0};current.end=date;current.days++;}else if(current){windows.push(current);current=null;}}
  if(current)windows.push(current);
  const exposed=weather.filter(r=>result.crops[Number(r.date.slice(5,7))-1]==='fallow');
  const families=[...new Set(result.crops.filter(c=>c!=='fallow'&&c!=='cover').map(c=>CROPS[c].family))];
  const status=excluded.length?'excluded':missing.length?'needs_review':'conditional';
  const mechanisms=[];
  if(result.crops.includes('legume'))mechanisms.push('legume_opportunity');
  if(result.crops.includes('cover'))mechanisms.push('cover_opportunity');
  if(families.length===1)mechanisms.push('same_family');
  if(families.length>1)mechanisms.push('family_diversity');
  return {id:result.id,status,excluded,missing,baseline:index===0,changedMonths:result.crops.map((c,m)=>c!==baseline.crops[m]?m:null).filter(m=>m!==null),fallowWindows:windows,plannedFallowDays:windows.reduce((s,w)=>s+w.days,0),rainDuringPlannedFallowMm:exposed.reduce((s,r)=>s+r.rain,0),rainDaysDuringPlannedFallow:exposed.filter(r=>r.rain>=1).length,weatherThrough:weather.at(-1).date,families,familyCount:families.length,mechanisms,deficitDifferenceMm:result.deficit.p50-baseline.deficit.p50,priority:context.priority,references:CONTEXT_REFERENCES,notes:'Calendar-based screening. Fallow may retain residues; it is not satellite-confirmed bare soil. Family diversity is not a pest-control guarantee. Soil benefits are hypotheses for local review.'};
 });
}
export function conditionalOrder(cards,projection,priority) {
 const results=new Map(projection.results.map(r=>[r.id,r]));
 return cards.filter(c=>c.status==='conditional').sort((a,b)=>{
  if(priority==='cover'&&a.plannedFallowDays!==b.plannedFallowDays)return a.plannedFallowDays-b.plannedFallowDays;
  if(priority==='diversity'&&a.familyCount!==b.familyCount)return b.familyCount-a.familyCount;
  return results.get(a.id).deficit.p50-results.get(b.id).deficit.p50||a.id.localeCompare(b.id);
 }).map(c=>c.id);
}
