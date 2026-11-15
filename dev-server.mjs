/** Local preview only. Production uses Vercel Functions and static hosting. */
import http from "node:http";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {extname,resolve,sep} from "node:path";
import outlook from "./api/outlook.js";
import explain from "./api/explain.js";
import trends from "./api/trends.js";
import radar from "./api/radar-scenes.js";

const ROOT=resolve(fileURLToPath(new URL(".",import.meta.url)));
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png"};
const APP_ASSETS=new Set(["index.html","app.js","audience.js","crop-art.js","style.css","website-theme.css","plant-art.css","season-motion.css","outlook.css","soliq-logo.svg","soliq-mark.svg","crop-analysis-view.js","crop-analysis.js","decision-audit.js","engine.js","farm-context-view.js","guided.js","i18n.js","location-picker.js","outlook-core.js","outlook-view.js","rotation-context.js","season-motion.js","team-regions.js","visuals.js"]);
const STATIC=new Set([...APP_ASSETS,"welcome/index.html","welcome/paper.html","welcome/site.css","welcome/site.js","outlook/index.html","adviser/index.html","adviser/app.js","adviser/worker.js","adviser/knowledge.js","adviser/style.css","experience/index.html","experience/app.js","experience/engine.js","experience/style.css","science/interval-regret.js"]);
const API=new Map([["/api/outlook",outlook],["/api/explain",explain],["/api/trends",trends],["/api/radar-scenes",radar]]);
function json(res,status,payload){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});res.end(JSON.stringify(payload));}
export function resolvePublicPath(pathname){
 let path;
 try{path=decodeURIComponent(pathname).replace(/^\/+/,"");}catch{return null;}
 if(path.includes("\0")||path.includes("\\")||path.split("/").some(x=>x.startsWith(".")||x===".."))return null;
 if(!path||path.endsWith("/"))path+="index.html";
 if(!STATIC.has(path))return null;
 const abs=resolve(ROOT,path);
 return abs.startsWith(ROOT+sep)?abs:null;
}
export async function handleRequest(req,res){
 res.setHeader("X-Content-Type-Options","nosniff");
 let url;
 try{url=new URL(req.url,"http://127.0.0.1");}catch{return json(res,400,{error:"Bad URL"});}
 const handler=API.get(url.pathname);
 if(url.pathname.startsWith("/api/")){
  if(!handler)return json(res,404,{error:"Unknown API"});
  req.query=Object.fromEntries(url.searchParams);
  if(req.method==="POST"){
   if((req.headers["content-type"]??"").split(";")[0]!=="application/json")return json(res,415,{error:"JSON body required"});
   let body="",bytes=0;
   try{
    for await(const part of req){bytes+=part.length;if(bytes>20000)return json(res,413,{error:"Request too large"});body+=part;}
    req.body=body?JSON.parse(body):{};
   }catch{return json(res,400,{error:"Malformed JSON"});}
  }
  res.status=code=>{res.statusCode=code;return res;};
  res.json=value=>{res.setHeader("Content-Type","application/json; charset=utf-8");res.end(JSON.stringify(value));return res;};
  try{await handler(req,res);}catch{if(!res.writableEnded)json(res,502,{error:"Service unavailable"});}
  return;
 }
 if(!["GET","HEAD"].includes(req.method))return json(res,405,{error:"Method not allowed"});
 const path=resolvePublicPath(url.pathname);
 if(!path)return json(res,404,{error:"Not found"});
 try{
  const file=await readFile(path);
  res.writeHead(200,{"Content-Type":TYPES[extname(path)]??"application/octet-stream","Cache-Control":"no-cache","X-Content-Type-Options":"nosniff"});
  res.end(req.method==="HEAD"?undefined:file);
 }catch{json(res,404,{error:"Not found"});}
}
export function createLocalServer(){return http.createServer((req,res)=>{handleRequest(req,res).catch(()=>{if(!res.writableEnded)json(res,500,{error:"Server error"});});});}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const host=process.env.HOST??"127.0.0.1",port=Number(process.env.PORT)||4173;
 createLocalServer().listen(port,host,()=>console.log("SOLIQ local preview: http://"+host+":"+port+"/"));
}
