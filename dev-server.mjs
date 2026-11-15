import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import outlook from './api/outlook.js';
import explain from './api/explain.js';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 try {
  if(url.pathname.startsWith('/api/')){
   const handler=url.pathname==='/api/outlook'?outlook:url.pathname==='/api/explain'?explain:null;
   if(!handler){res.writeHead(404).end();return;}
   req.query=Object.fromEntries(url.searchParams);let text='';for await(const part of req){text+=part;if(text.length>5000)throw Error('Body too large');}req.body=text?JSON.parse(text):undefined;
   res.status=code=>{res.statusCode=code;return res;};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};await handler(req,res);return;
  }
  const path=resolve('.','.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
  if(!path.startsWith(resolve('.')+'/')){res.writeHead(403).end();return;}
  const file=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});res.end(file);
 }catch(error){res.writeHead(404,{'Content-Type':'text/plain'});res.end(error.message);}
}).listen(4173,'0.0.0.0',()=>console.log('Soliq preview: http://127.0.0.1:4173'));
