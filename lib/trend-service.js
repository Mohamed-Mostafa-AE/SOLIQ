import {createHash} from "node:crypto";
import {trendStats} from "../experience/engine.js";

const VARIABLES={T2M:{units:["C","degC","°C"],output:"°C",aggregation:"mean"},PRECTOTCORR:{units:["mm/day","mm/d"],output:"mm",aggregation:"sum"}};
const cache=new Map();
const daysInYear=year=>(new Date(Date.UTC(year+1,0,1))-new Date(Date.UTC(year,0,1)))/86400000;
function validYear(y){return Number.isInteger(y)&&y>=1981&&y<=new Date().getUTCFullYear()-1;}
export function readTrendQuery(q={}){
 const lat=Number(q.lat??30.5806),lon=Number(q.lon??31.4333),startYear=Number(q.startYear??2016),endYear=Number(q.endYear??2025),parameter=q.parameter??"T2M";
 if(!Number.isFinite(lat)||Math.abs(lat)>60||!Number.isFinite(lon)||Math.abs(lon)>180)throw Error("Invalid latitude or longitude");
 if(!Object.hasOwn(VARIABLES,parameter))throw Error("Unsupported POWER variable");
 if(!validYear(startYear)||!validYear(endYear)||endYear<startYear+3||endYear-startYear>39)throw Error("Select 4 to 40 completed calendar years");
 return {lat,lon,startYear,endYear,parameter};
}
export function trendUrl(q){
 const x=readTrendQuery(q);
 return "https://power.larc.nasa.gov/api/temporal/daily/point?"+new URLSearchParams({community:"AG",parameters:x.parameter,latitude:String(x.lat),longitude:String(x.lon),start:x.startYear+"0101",end:x.endYear+"1231",format:"JSON","time-standard":"UTC"});
}
export function parseTrend(json,q){
 const x=readTrendQuery(q),series=json?.properties?.parameter?.[x.parameter],units=json?.parameters?.[x.parameter]?.units;
 if(!series||typeof series!=="object")throw Error("POWER daily observations missing");
 if(!VARIABLES[x.parameter].units.includes(units))throw Error("Unexpected POWER source units");
 if(json?.header?.time_standard!=="UTC")throw Error("POWER UTC time standard not verified");
 const annual=[];
 for(let year=x.startYear;year<=x.endYear;year++){
  const count=daysInYear(year),vals=[];
  for(let day=0;day<count;day++){
   const date=new Date(Date.UTC(year,0,day+1)),key=date.toISOString().slice(0,10).replaceAll("-","");
   const v=series[key];
   if(v==null||v===-999||v===json.header.fill_value)continue;
   if(typeof v!=="number"||!Number.isFinite(v)||x.parameter==="PRECTOTCORR"&&v<0)throw Error("Invalid source value on "+key);
   vals.push(v);
  }
  annual.push({year,value:vals.length===count?(x.parameter==="T2M"?vals.reduce((a,b)=>a+b,0)/count:vals.reduce((a,b)=>a+b,0)):null,coverage:vals.length/count,validDays:vals.length,expectedDays:count,missingReason:vals.length===count?null:"incomplete_year"});
 }
 const complete=annual.filter(x=>x.value!==null);
 return {annual,completeYears:complete.length,statistics:complete.length>=4?trendStats(complete):null,parameter:x.parameter,unit:VARIABLES[x.parameter].output,interpretation:"Exploratory regional gridded annual trend. No serial-correlation correction or independent field validation."};
}
export async function fetchTrend(q={},fetchFn=fetch){
 const x=readTrendQuery(q),url=trendUrl(x),cached=cache.get(url);
 if(cached&&Date.now()-cached.at<3600000)return {...cached.result,transport:"cached"};
 const response=await fetchFn(url,{signal:AbortSignal.timeout(45000),headers:{Accept:"application/json"}});
 if(!response.ok)throw Error("NASA POWER unavailable: HTTP "+response.status);
 const raw=await response.text();
 if(raw.length>8_000_000)throw Error("POWER payload too large");
 const data=JSON.parse(raw),out=parseTrend(data,x);
 const result={...out,source:{provider:"NASA POWER",product:"Daily API",url,retrievedAt:new Date().toISOString(),rawSha256:createHash("sha256").update(raw).digest("hex"),rawPersisted:false,spatialSupport:"native gridded regional, not point field sensor"},transport:"live"};
 cache.set(url,{at:Date.now(),result});if(cache.size>35)cache.clear();return result;
}
