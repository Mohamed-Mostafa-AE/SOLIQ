import {fetchTrend} from "../lib/trend-service.js";
import {DEFAULTS,powerUrl,parsePower} from '../engine.js';
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET")return res.status(405).json({error:"GET required",code:"METHOD_NOT_ALLOWED"});
 if(req.query?.mode==='power-year'){
  try{
   const config={...DEFAULTS,lat:Number(req.query.lat),lon:Number(req.query.lon),year:Number(req.query.year)};
   const url=powerUrl(config);
   const response=await fetch(url,{signal:AbortSignal.timeout(25000)});
   if(!response.ok)throw Error('NASA POWER HTTP '+response.status);
   const raw=await response.text(),data=JSON.parse(raw);
   if(data.header?.time_standard!=='UTC'||!data.parameters)throw Error('Missing source metadata');
   parsePower(data,config.year);
   res.statusCode=200;res.setHeader('Content-Type','application/json');return res.end(raw);
  }catch(error){return res.status(502).json({code:'NASA_SOURCE_UNAVAILABLE',error:error.message,replacedWithDemo:false});}
 }
 try{return res.status(200).json(await fetchTrend(req.query??{}));}
 catch(error){const invalid=/Invalid|Unsupported|Select/.test(error.message);return res.status(invalid?400:502).json({error:error.message,code:invalid?"BAD_QUERY":"NASA_SOURCE_UNAVAILABLE",retryable:!invalid});}
}
