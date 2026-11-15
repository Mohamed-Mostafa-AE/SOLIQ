import {randomUUID} from 'node:crypto';
import {ApiError,check,canonical,sha256,objectId} from './evidence-store.js';
import {fields,geometry,timeRange,products,manifest} from './evidence-validation.js';
import {makeRun,replayRun,receipt} from './run-service.js';
const terminal=new Set(['succeeded','partial','failed','cancelled']);
function owned(collection,id){objectId(id);const obj=collection[id];check(obj,'not_found',404);return obj;}
function unavailable(request,reason,now){return {...request,kind:'observed',delivery:'unavailable',spatialSupport:{nativeGrid:'unavailable',resolution:null},units:{},qa:{usable:false},coverage:{fraction:0},rawSha256:null,missingReason:reason,provider:'unavailable',retrievedAt:new Date(now).toISOString()};}
export function createEvidenceService({store,adapters={},timeoutMs=45000}){
 const controllers=new Map();
 async function mutation(owner,scope,key,body,fn){
  if(key!==undefined)check(typeof key==='string'&&/^[a-zA-Z0-9._:-]{1,128}$/.test(key),'invalid_idempotency_key');
  return store.transaction(owner,async state=>{
   const id=sha256(scope+':'+(key??randomUUID())),fingerprint=sha256(canonical(body));
   const prior=state.idempotency[id];
   if(key&&prior){check(prior.fingerprint===fingerprint,'idempotency_conflict',409);return {...prior.result,reused:true};}
   const result=await fn(state);
   check(Object.keys(state.idempotency).length<256,'quota_exceeded',429);
   if(key)state.idempotency[id]={fingerprint,result};return {...result,reused:false};
  });
 }
 return {
  store,
  async farm(owner,body,key){
   fields(body,['geometry','saveLocation']);check(body.saveLocation===true,'location_consent_required',403);geometry(body.geometry);
   return mutation(owner,'farms',key,body,state=>{
    check(Object.keys(state.farms).length<16,'quota_exceeded',429);
    const farm={id:randomUUID(),geometry:body.geometry,createdAt:new Date(store.now()).toISOString(),consent:{saveLocation:true,policy:'api-v1'}};state.farms[farm.id]=farm;return {status:201,body:farm};
   });
  },
  async job(owner,body,key){
   fields(body,['farmId','timeRange','products']);objectId(body.farmId);timeRange(body.timeRange);products(body.products);
   const created=await mutation(owner,'jobs',key,body,state=>{
    const farm=owned(state.farms,body.farmId);check(Object.keys(state.jobs).length<64,'quota_exceeded',429);
    const at=new Date(store.now()).toISOString(),job={id:randomUUID(),state:'queued',createdAt:at,updatedAt:at,evidence:[],errors:[],request:{geometry:farm.geometry,timeRange:body.timeRange,products:body.products}};
    state.jobs[job.id]=job;return {status:202,body:job};
   });
   if(!created.reused)await this.execute(owner,created.body.id);
   return {status:202,body:await this.getJob(owner,created.body.id)};
  },
  async execute(owner,id){
   const controller=new AbortController();controllers.set(owner+id,controller);
   try{
    const job=await store.transaction(owner,state=>{const j=owned(state.jobs,id);check(j.state==='queued','invalid_job_transition',409);j.state='running';j.updatedAt=new Date(store.now()).toISOString();return j;});
    for(const product of job.request.products){
     if(controller.signal.aborted)break;
     const request={...product,geometry:job.request.geometry,timeRange:job.request.timeRange};
     let output,errorCode=null;
     const cached=await store.transaction(owner,state=>{
      for(const j of Object.values(state.jobs)){
       if(!['succeeded','partial'].includes(j.state)||canonical(j.request.geometry)!==canonical(request.geometry)||canonical(j.request.timeRange)!==canonical(request.timeRange))continue;
       const index=j.request.products.findIndex(p=>canonical(p)===canonical(product));
       const m=j.evidence[index];if(index>=0&&m&&m.delivery!=='unavailable'&&m.qa.usable)return m;
      }return null;
     });
     const adapter=adapters[product.product+'@'+product.version];
     if(cached)output={manifest:{...cached,delivery:'cached'},cached:true};
     else if(!adapter)output={manifest:unavailable(request,'adapter_not_configured',store.now()),rawBytes:null};
     else{
      let timer;
      const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(timeoutMs)]);
      try{
       output=await Promise.race([Promise.resolve().then(()=>adapter({...JSON.parse(canonical(request)),signal})),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new ApiError(504,'provider_timeout')),timeoutMs);signal.addEventListener('abort',()=>reject(new ApiError(504,'provider_aborted')),{once:true});})]);
       check(output&&typeof output==='object','adapter_contract',502);manifest(output.manifest,request,output.rawBytes);
      }catch(e){errorCode=e.code==='adapter_contract'?'adapter_contract':'provider_unavailable';output={manifest:unavailable(request,errorCode,store.now()),rawBytes:null};}
      finally{clearTimeout(timer);}
     }
     await store.transaction(owner,async state=>{
      const j=owned(state.jobs,id);if(j.state!=='running')return;
      const m=JSON.parse(canonical(output.manifest));
      if(output.cached)await store.verifyRaw(owner,m.rawSha256);
      else if(m.delivery!=='unavailable'){
       const bytes=output.rawBytes;const hash=sha256(bytes);
       check(m.rawSha256===null||m.rawSha256===hash,'checksum_mismatch',409);
       // Bound retained source bytes per anonymous session.
       const used=Object.values(state.jobs).reduce((n,x)=>n+(x.rawBytes??0),0);
       check(used+bytes.byteLength<=64*1024*1024,'quota_exceeded',429);
       m.rawSha256=await store.putRaw(owner,bytes);
      }
      const rawByteLength=output.rawBytes?.byteLength??0;
      j.evidence.push(m);j.rawBytes=(j.rawBytes??0)+rawByteLength;
      if(errorCode)j.errors.push({product:product.product,code:errorCode});
      j.updatedAt=new Date(store.now()).toISOString();
     });
    }
    await store.transaction(owner,state=>{
     const j=owned(state.jobs,id);if(j.state!=='running')return;
     const count=j.evidence.filter(m=>m.delivery!=='unavailable'&&m.qa.usable).length;
     j.state=count===j.request.products.length?'succeeded':count>0?'partial':'failed';j.updatedAt=new Date(store.now()).toISOString();
    });
   }catch(e){
    if(e.status===401)return;
    await store.transaction(owner,state=>{
     const j=owned(state.jobs,id);if(j.state!=='running')return;
     j.state='failed';j.errors.push({product:'job',code:e.code??'provider_unavailable'});j.updatedAt=new Date(store.now()).toISOString();
     for(let index=j.evidence.length;index<j.request.products.length;index++)j.evidence.push(unavailable({...j.request.products[index],geometry:j.request.geometry,timeRange:j.request.timeRange},e.code??'provider_unavailable',store.now()));
    }).catch(()=>{});
   }finally{controllers.delete(owner+id);}
  },
  async getJob(owner,id){return store.transaction(owner,state=>owned(state.jobs,id));},
  async cancel(owner,id){return store.transaction(owner,state=>{const j=owned(state.jobs,id);check(!terminal.has(j.state),'invalid_job_transition',409);j.state='cancelled';j.updatedAt=new Date(store.now()).toISOString();controllers.get(owner+id)?.abort();return {status:200,body:j};});},
  async run(owner,body,key){
   fields(body,['jobId']);objectId(body.jobId);
   return mutation(owner,'runs',key,body,async state=>{
    const job=owned(state.jobs,body.jobId);check(terminal.has(job.state),'job_not_terminal',409);
    check(job.state!=='cancelled','job_cancelled',409);
    const snapshot={request:job.request,evidence:job.evidence};
    return {status:201,body:await makeRun(store,owner,state,snapshot)};
   });
  },
  async getRun(owner,id){return store.transaction(owner,state=>owned(state.runs,id));},
  async replay(owner,id,body,key){
   fields(body,[]);objectId(id);
   return mutation(owner,'replay/'+id,key,body,async state=>({status:201,body:await replayRun(store,owner,state,owned(state.runs,id))}));
  },
  async receipt(owner,id,format){return store.transaction(owner,async state=>{
   const run=owned(state.runs,id),snapshot=state.snapshots[run.snapshotSha256];
   check(snapshot&&sha256(canonical(snapshot))===run.snapshotSha256,'checksum_mismatch',409);
   for(const m of snapshot.evidence)if(m.rawSha256)await store.verifyRaw(owner,m.rawSha256);
   return receipt(run,snapshot,format);
  });}
 };
}
