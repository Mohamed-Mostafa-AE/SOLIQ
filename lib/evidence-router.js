import {ApiError,check,canonical} from './evidence-store.js';
import {fields} from './evidence-validation.js';
export function isEvidencePath(path){return /^\/api\/(sessions|farms|evidence\/jobs|runs|receipts)(\/|$)/.test(path);}
async function body(req){
 check((req.headers['content-type']??'').split(';')[0]==='application/json','json_required',415);
 if(req.body!==undefined){check(Buffer.byteLength(canonical(req.body)??'')<=20000,'request_too_large',413);return req.body;}
 const parts=[];let bytes=0;
 for await(const part of req){bytes+=Buffer.byteLength(part);check(bytes<=20000,'request_too_large',413);parts.push(Buffer.from(part));}
 try{return JSON.parse(Buffer.concat(parts).toString('utf8')||'{}');}catch{throw new ApiError(400,'malformed_json');}
}
export function createEvidenceHandler({store,auth,service}){
 return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Vary','Cookie, Origin');
  const send=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(status===204?undefined:JSON.stringify(data));};
  try{
   const url=new URL(req.url,auth.origin),path=url.pathname,method=req.method;
   const match=path.match(/^\/api\/(evidence\/jobs|runs|receipts)\/([^/]+)(\/replay)?$/);
   const allowed=path==='/api/sessions'?['GET','POST','DELETE']:path==='/api/farms'||path==='/api/evidence/jobs'||path==='/api/runs'?['POST']:match?(match[3]?(match[1]==='runs'?['POST']:[]):match[1]==='evidence/jobs'?['GET','DELETE']:['GET']):[];
   check(allowed.length>0,'not_found',404);check(allowed.includes(method),'method_not_allowed',405);
   await store.sweep();
   if(path==='/api/sessions'&&method==='POST'){
    auth.verifyOrigin(req);fields(await body(req),[]);
    // Creating a new session must not abandon existing retained private data.
    if((req.headers.cookie??'').includes('soliq_session=')){
     try{await auth.authenticate(req);throw new ApiError(409,'session_already_exists');}catch(e){if(e.status!==401)throw e;}
    }
    const session=await auth.create();res.setHeader('Set-Cookie',session.cookie);return send(201,session.body);
   }
   const owner=await auth.authenticate(req,!['GET','HEAD'].includes(method));
   if(path==='/api/sessions'){
    if(method==='GET')return send(200,await auth.describe(owner));
    await store.deleteSession(owner);res.setHeader('Set-Cookie',auth.clearCookie());return send(204);
   }
   const key=req.headers['idempotency-key'];let result;
   if(path==='/api/farms')result=await service.farm(owner,await body(req),key);
   else if(path==='/api/evidence/jobs')result=await service.job(owner,await body(req),key);
   else if(path==='/api/runs')result=await service.run(owner,await body(req),key);
   else if(match[1]==='evidence/jobs')result=method==='GET'?{status:200,body:await service.getJob(owner,match[2])}:await service.cancel(owner,match[2]);
   else if(match[1]==='runs')result=match[3]?await service.replay(owner,match[2],await body(req),key):{status:200,body:await service.getRun(owner,match[2])};
   else{
    const output=await service.receipt(owner,match[2],url.searchParams.get('format')??'json');
    res.statusCode=200;res.setHeader('Content-Type',output.type);res.setHeader('Content-Security-Policy',"default-src 'none'; sandbox");
    res.setHeader('Content-Disposition',`attachment; filename="soliq-${match[2]}.${url.searchParams.get('format')??'json'}"`);res.end(output.body);return;
   }
   return send(result.status,result.body);
  }catch(e){if(e.status===401)res.setHeader('Set-Cookie',auth.clearCookie());return send(e.status??500,{error:{code:e.status?e.code:'internal_error',message:e.status?e.code:'Internal error'}});}
 };
}
