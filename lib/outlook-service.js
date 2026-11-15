import { createHash } from 'node:crypto';
import { DEFAULTS, STRATEGIES, datesInYear } from '../engine.js';
import { powerRangeUrl, parsePowerRange, projectSeason, summarizeWeather, hindcast } from '../outlook-core.js';

const cache=new Map();
async function retrieve(url,start,end,trailing=false) {
  const hit=cache.get(url);
  if (hit&&hit.expires>Date.now()) return hit.value;
  const response=await fetch(url,{signal:AbortSignal.timeout(45000)});
  if (!response.ok) throw Error('NASA POWER request failed (HTTP '+response.status+')');
  const json=await response.json(),rows=parsePowerRange(json,start,end,trailing);
  const value={rows,header:json.header,parameters:json.parameters,request:url,retrievedAt:new Date().toISOString()};
  if (cache.size>40) cache.clear();
  cache.set(url,{value,expires:Date.now()+3600000});
  return value;
}
export function readOptions(input={}) {
  const numeric=(key,fallback,min,max)=>{const value=input[key]===undefined?fallback:Number(input[key]);if(!Number.isFinite(value)||value<min||value>max)throw Error('Invalid '+key);return value;};
  const lat=numeric('lat',30.05,-60,60),lon=numeric('lon',31.23,-180,180);
  const capacity=numeric('capacity',150,10,500),initial=numeric('initial',75,0,capacity);
  return {...DEFAULTS,lat,lon,capacity,initial,irrigation:numeric('irrigation',300,0,3000),heat:numeric('heat',35,0,60),year:2026};
}
export async function getOutlook(input={},now=new Date()) {
  const config=readOptions(input),year=2026;
  // Three-day offset follows POWER's documented meteorological publication latency.
  const lagged=new Date(now.getTime()-3*86400000).toISOString().slice(0,10);
  const end=lagged<`${year}-12-31`?lagged:`${year}-12-31`,start=`${year}-01-01`;
  if (end<start) throw Error('2026 observations are not available yet');
  const historyStart='2016-01-01',historyEnd='2025-12-31';
  const current=await retrieve(powerRangeUrl(config.lat,config.lon,start,end),start,end,true);
  const historical=await retrieve(powerRangeUrl(config.lat,config.lon,historyStart,historyEnd),historyStart,historyEnd);
  const history=Object.fromEntries(Array.from({length:10},(_,i)=>{const y=2016+i;return [y,historical.rows.filter(r=>r.date.startsWith(String(y)))];}));
  const projection=projectSeason(current.rows,history,config,STRATEGIES),cutoff=projection.cutoff.slice(5);
  const matched=Object.values(history).map(rows=>summarizeWeather(rows.filter(r=>r.date.slice(5)<=cutoff),config.heat));
  const coverage={start,through:projection.cutoff,requestedThrough:end,validDays:current.rows.length,calendarDays:datesInYear(year).length,missingTailDays:Math.round((Date.parse(end)-Date.parse(projection.cutoff))/86400000)};
  const id=createHash('sha256').update(JSON.stringify({weather:current.rows,history:historical.rows,config,method:projection.method})).digest('hex');
  return {evidenceId:id,generatedAt:new Date().toISOString(),config,coverage,observed:summarizeWeather(current.rows,config.heat),samePeriodBaseline:{period:'2016–2025',rainMedian:matched.map(x=>x.rain).sort((a,b)=>a-b).slice(4,6).reduce((a,b)=>a+b)/2},monthly:Array.from({length:12},(_,month)=>{const rows=current.rows.filter(r=>Number(r.date.slice(5,7))===month+1);return {month,observedDays:rows.length,...summarizeWeather(rows,config.heat)};}),weather:current.rows,projection,hindcast:hindcast(history,cutoff,config.heat),sources:[{...current,rows:undefined},{...historical,rows:undefined}],limitations:['NASA POWER meteorological grid is about 0.5° × 0.625°, not a field sensor or field-scale satellite image.','Recent data can be revised as near-real-time GEOS-IT is replaced by MERRA-2.','Soil storage, crop coefficients, monthly calendars and irrigation rules are declared assumptions.','Analogue scenarios are not seasonal weather forecasts or validated predictions of yield, profit, pests, nitrogen or soil carbon.','Percentiles across five selected historical years do not establish calibrated probabilities.']};
}
