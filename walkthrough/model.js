import {DEFAULTS,VERSION,CROPS,analyze,parsePower,powerUrl,sensitivity} from '../engine.js';
export const LIMITATIONS=['NASA POWER is gridded regional context, not a field sensor or a forecast.','Soil storage, irrigation, runoff, crop coefficients and calendars are ASSUMED and require local review.','SIMULATED water deficits are not measured yield losses. Planned crop days are not observed soil cover.','Sensitivity ranges are scenario envelopes, not confidence intervals or calibrated probabilities.','No validated crop suitability, profit, nitrogen, carbon or irrigation prescription is provided.'];
export async function retrieve(config,{fetcher=fetch,signal}={}){
 const url=powerUrl(config),response=await fetcher(url,{signal,cache:'no-store'});
 if(!response.ok)throw Error('NASA POWER HTTP '+response.status);
 const raw=await response.text(),json=JSON.parse(raw);
 if(json.header?.time_standard!=='UTC'||!json.parameters)throw Error('Required NASA units/time metadata unavailable');
 const weather=parsePower(json,config.year);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
 return {kind:'OBSERVED',delivery:'retrieved',provider:'NASA POWER',requestUrl:url,retrievedAt:new Date().toISOString(),period:{start:weather[0].date,end:weather.at(-1).date},point:{lat:config.lat,lon:config.lon},spatialSupport:'Native POWER grid; not a measured parcel',units:json.parameters,header:json.header,geometry:json.geometry,coverage:{validDays:weather.length,missingDays:0},rawSha256:[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join(''),rawResponse:raw,weather};
}
export function compare(receipt,inputs,plans){
 if(!receipt||receipt.kind!=='OBSERVED')throw Error('Retrieved weather required');
 if(receipt.point.lat!==inputs.lat||receipt.point.lon!==inputs.lon||receipt.period.start!==inputs.year+'-01-01')throw Error('Weather does not match query; retrieve again');
 if(plans.length!==2)throw Error('Exactly two rotations required');
 const config={...DEFAULTS,...inputs,rainScale:1,tempShift:0};
 const output=analyze(receipt.weather,config,plans),scenarios=sensitivity(receipt.weather,config,plans);
 return {schemaVersion:'soil-iq-walkthrough-v1',engineVersion:VERSION,status:'comparison_only',generatedAt:new Date().toISOString(),evidence:receipt,assumptions:{kind:'ASSUMED',config,plans,cropCoefficients:CROPS},priorities:{water:config.waterWeight,plannedCover:config.coverWeight,interpretation:'Preference score, not validated suitability'},outputs:{kind:'SIMULATED',...output},sensitivity:{kind:'SIMULATED',parameter:'rainfall multiplier',values:[0.75,1,1.25],scenarios,envelopes:plans.map(p=>({id:p.id,minDeficit:Math.min(...scenarios.map(s=>s.results.find(r=>r.id===p.id).deficit)),maxDeficit:Math.max(...scenarios.map(s=>s.results.find(r=>r.id===p.id).deficit))}))},limitations:LIMITATIONS};
}

