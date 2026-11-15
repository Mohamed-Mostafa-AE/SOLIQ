import {fetchTrend} from "../lib/trend-service.js";
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET")return res.status(405).json({error:"GET required",code:"METHOD_NOT_ALLOWED"});
 try{return res.status(200).json(await fetchTrend(req.query??{}));}
 catch(error){const invalid=/Invalid|Unsupported|Select/.test(error.message);return res.status(invalid?400:502).json({error:error.message,code:invalid?"BAD_QUERY":"NASA_SOURCE_UNAVAILABLE",retryable:!invalid});}
}
