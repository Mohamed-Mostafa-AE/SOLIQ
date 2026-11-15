import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtemp,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {LocalEvidenceStore,sha256,canonical} from './lib/evidence-store.js';
import {createSessionAuth} from './lib/session.js';
import {createEvidenceService} from './lib/evidence-service.js';
import {createEvidenceHandler} from './lib/evidence-router.js';
import {createBackendRuntime} from './lib/session-runtime.js';
import {computeSnapshot,receipt} from './lib/run-service.js';

const geometry={type:'Point',coordinates:[31,30]};
const timeRange={start:'2026-01-01',end:'2026-01-02'};
const product={product:'fixture/NASA-test',version:'test-v1',qa:{mask:'strict'}};
const raw=Buffer.from([0,1,2,255,13,10]);
function fixture(request){return {rawBytes:raw,manifest:{product:request.product,version:request.version,geometry:request.geometry,timeRange:request.timeRange,kind:'simulated',delivery:'live',spatialSupport:{nativeGrid:'test-grid',resolution:null},units:{rainfall:'mm'},qa:{usable:true},coverage:{fraction:0.5},rawSha256:sha256(raw),missingReason:null,provider:'test fixture, not NASA observation',retrievedAt:'2026-01-03T00:00:00.000Z'}};}
async function setup(t,options={}){
 const directory=await mkdtemp(join(tmpdir(),'soliq-test-'));let clock=Date.now();
 const store=await new LocalEvidenceStore({directory,now:()=>clock,...options.storeOptions}).init();
 const auth=createSessionAuth({store,secret:'a'.repeat(48),origin:'http://localhost',secure:true});
 const service=createEvidenceService({store,adapters:{[product.product+'@'+product.version]:fixture,...options.adapters},timeoutMs:options.timeoutMs??1000});
 const handler=createEvidenceHandler({store,auth,service});
 t.after(async()=>{await rm(directory,{recursive:true,force:true});});
 async function request(path,method='GET',body,session,headers={},wireBody){
  const req=Readable.from(wireBody===undefined?(body===undefined?[]:[Buffer.from(JSON.stringify(body))]):[Buffer.from(wireBody)]);
  req.url=path;req.method=method;req.headers={origin:'http://localhost',...(body!==undefined?{'content-type':'application/json'}:{}),...(session?{cookie:session.cookie,'x-csrf-token':session.csrfToken}:{}),...headers};
  const responseHeaders=new Headers();let text='';
  const res={statusCode:200,setHeader:(name,value)=>responseHeaders.set(name,value),end:value=>{text=value??'';}};
  await handler(req,res);let data;try{data=JSON.parse(text);}catch{data=text;}
  return {status:res.statusCode,data,text,headers:responseHeaders};
 }
 async function session(){const r=await request('/api/sessions','POST',{});assert.equal(r.status,201);return {...r.data,cookie:r.headers.get('set-cookie').split(';')[0]};}
 async function farm(s,body={geometry,saveLocation:true},headers){return request('/api/farms','POST',body,s,headers);}
 async function job(s,extra={}){const f=await farm(s);assert.equal(f.status,201);return request('/api/evidence/jobs','POST',{farmId:f.data.id,timeRange,products:[product],...extra},s);}
 async function run(s){const j=await job(s);assert.equal(j.status,202);return request('/api/runs','POST',{jobId:j.data.id},s);}
 return {store,auth,service,directory,request,session,farm,job,run,advance:ms=>clock+=ms};
}

test('signed HttpOnly Strict Secure sessions, CSRF and origin checks',async t=>{
 const x=await setup(t),s=await x.session();
 const created=await x.request('/api/sessions','POST',{});assert.match(created.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);assert.match(created.headers.get('set-cookie'),/; Secure/);
 assert.equal((await x.farm(s,undefined,{'x-csrf-token':'wrong'})).status,403);
 assert.equal((await x.farm(s,undefined,{origin:'https://attacker.test'})).status,403);
 assert.equal((await x.request('/api/sessions','POST',{},undefined,{origin:'null'})).status,403);
 assert.equal((await x.farm({...s,cookie:s.cookie+'tampered'})).status,401);
 assert.equal((await x.request('/api/sessions','GET',undefined,s)).data.csrfToken,s.csrfToken);
});
test('explicit location consent; invalid coordinates, dates, products and unknown fields',async t=>{
 const x=await setup(t),s=await x.session();
 assert.equal((await x.farm(s,{geometry,saveLocation:false})).status,403);
 for(const g of [{type:'Point',coordinates:[181,30]},{type:'Point',coordinates:['31',30]},{type:'Polygon',coordinates:[[[0,0],[5,0],[0,1],[0,0]]]}])assert.equal((await x.farm(s,{geometry:g,saveLocation:true})).status,400);
 const f=await x.farm(s);assert.equal(f.status,201);
 for(const extra of [{timeRange:{start:'2026-02-30',end:'2026-03-01'}},{timeRange:{start:'2024-01-01',end:'2026-01-01'}},{products:[]},{products:[product,product]},{owner:'fake'}]){
  const r=await x.request('/api/evidence/jobs','POST',{farmId:f.data.id,timeRange,products:[product],...extra},s);assert.equal(r.status,400);
 }
 const owner=s.cookie.slice('soliq_session='.length).split('.')[0];
 const state=JSON.parse(await readFile(join(x.store.folder(owner),'state.json'),'utf8'));assert.equal(Object.keys(state.farms).length,1);
});
test('two sessions cannot read, mutate, replay, export or attach each other objects',async t=>{
 const x=await setup(t),a=await x.session(),b=await x.session(),f=await x.farm(a),j=await x.job(a),r=await x.run(a);
 assert.equal((await x.request('/api/evidence/jobs','POST',{farmId:f.data.id,timeRange,products:[product]},b)).status,404);
 for(const [path,method,body] of [[`/api/evidence/jobs/${j.data.id}`,'GET'],[`/api/evidence/jobs/${j.data.id}`,'DELETE'],['/api/runs','POST',{jobId:j.data.id}],[`/api/runs/${r.data.id}`,'GET'],[`/api/runs/${r.data.id}/replay`,'POST',{}],...['json','csv','html'].map(format=>[`/api/receipts/${r.data.id}?format=${format}`,'GET'])])assert.equal((await x.request(path,method,body,b)).status,404,path);
 assert.equal((await x.request('/api/runs/'+randomUUID(),'GET',undefined,a)).status,404);
});
test('exact binary bytes and metadata survive restart; replay is immutable and deterministic',async t=>{
 const x=await setup(t),s=await x.session(),r=await x.run(s);assert.equal(r.status,201);
 const owner=s.cookie.slice(14).split('.')[0];assert.deepEqual(await x.store.verifyRaw(owner,sha256(raw)),raw);
 const restarted=await new LocalEvidenceStore({directory:x.directory}).init();const service=createEvidenceService({store:restarted});
 const replay=await service.replay(owner,r.data.id,{});assert.notEqual(replay.body.id,r.data.id);assert.equal(replay.body.replayOf,r.data.id);assert.equal(replay.body.snapshotSha256,r.data.snapshotSha256);assert.deepEqual(replay.body.metrics,r.data.metrics);
 assert.deepEqual(await service.getRun(owner,r.data.id),r.data);
 const json=await service.receipt(owner,r.data.id,'json');assert.equal(json.body,(await service.receipt(owner,r.data.id,'json')).body);
 const exported=JSON.parse(json.body);assert.equal(exported.evidence[0].kind,'simulated');assert.equal(exported.evidence[0].rawSha256,sha256(raw));assert.equal(exported.metrics.sources[0].coverage,0.5);
 for(const format of ['json','csv','html']){
  const a=await x.request(`/api/receipts/${r.data.id}?format=${format}`,'GET',undefined,s),b=await x.request(`/api/receipts/${r.data.id}?format=${format}`,'GET',undefined,s);
  assert.equal(a.status,200);assert.equal(a.text,b.text);assert.ok(a.text.includes('comparison_only'));assert.ok(!a.text.includes(s.csrfToken));assert.ok(!a.text.includes(owner));assert.equal(a.headers.get('cache-control'),'no-store');
 }
});
test('idempotency is atomic under concurrency, route scoped and rejects changed bodies',async t=>{
 const x=await setup(t),s=await x.session(),headers={'idempotency-key':'farm-1'};
 const [a,b]=await Promise.all([x.farm(s,undefined,headers),x.farm(s,undefined,headers)]);assert.equal(a.data.id,b.data.id);
 assert.equal((await x.farm(s,{geometry:{type:'Point',coordinates:[32,30]},saveLocation:true},headers)).status,409);
 const farm=a.data,body={farmId:farm.id,timeRange,products:[product]};
 const [j,k]=await Promise.all([x.request('/api/evidence/jobs','POST',body,s,{'idempotency-key':'j'}),x.request('/api/evidence/jobs','POST',body,s,{'idempotency-key':'j'})]);assert.equal(j.data.id,k.data.id);
 const runBody={jobId:j.data.id};const r=await x.request('/api/runs','POST',runBody,s,{'idempotency-key':'r'});assert.equal(r.status,201);assert.equal((await x.request('/api/runs','POST',runBody,s,{'idempotency-key':'r'})).data.id,r.data.id);
 const replayPath=`/api/runs/${r.data.id}/replay`;const rp=await x.request(replayPath,'POST',{},s,headers);assert.equal((await x.request(replayPath,'POST',{},s,headers)).data.id,rp.data.id);
});
test('partial and failed jobs preserve unavailable sources as null, never zero',async t=>{
 const x=await setup(t),s=await x.session(),unknown={product:'unconfigured',version:'1',qa:{}};
 const j=await x.job(s,{products:[product,unknown]});assert.equal(j.data.state,'partial');assert.equal(j.data.evidence[1].delivery,'unavailable');assert.equal(j.data.evidence[1].rawSha256,null);
 const r=await x.request('/api/runs','POST',{jobId:j.data.id},s);assert.equal(r.data.metrics.sources[1].coverage,null);assert.equal(r.data.metrics.decisionStatus,'comparison_only');
 const failed=await x.job(s,{products:[unknown]});assert.equal(failed.data.state,'failed');assert.equal(failed.data.evidence[0].missingReason,'adapter_not_configured');
});
test('provider failures, contract violations and timeouts produce explicit failed evidence',async t=>{
 const key=product.product+'@'+product.version;
 for(const adapter of [async()=>{throw Error('secret upstream URL');},async r=>({...fixture(r),manifest:{...fixture(r).manifest,geometry:{type:'Point',coordinates:[0,0]}}}),async()=>new Promise(()=>{})]){
  const x=await setup(t,{adapters:{[key]:adapter},timeoutMs:20}),s=await x.session(),j=await x.job(s);assert.equal(j.data.state,'failed');assert.equal(j.data.evidence[0].delivery,'unavailable');assert.ok(!JSON.stringify(j.data).includes('secret upstream'));
 }
});
test('geometry/time/product/version/QA and session partition cache keys',async t=>{
 let calls=0;const x=await setup(t,{adapters:{[product.product+'@'+product.version]:async r=>{calls++;return fixture(r);}}}),a=await x.session(),b=await x.session();
 await x.job(a);const cached=await x.job(a);assert.equal(cached.data.evidence[0].delivery,'cached');assert.equal(calls,1);
 await x.job(b);assert.equal(calls,2);
 await x.job(a,{products:[{...product,qa:{mask:'other'}}]});assert.equal(calls,3);
 await x.job(a,{timeRange:{start:'2026-01-02',end:'2026-01-03'}});assert.equal(calls,4);
 const f=await x.farm(a,{geometry:{type:'Point',coordinates:[32,30]},saveLocation:true});await x.request('/api/evidence/jobs','POST',{farmId:f.data.id,timeRange,products:[product]},a);assert.equal(calls,5);
});
test('checksum corruption prevents replay and all receipt formats',async t=>{
 const x=await setup(t),s=await x.session(),r=await x.run(s),owner=s.cookie.slice(14).split('.')[0];
 await writeFile(join(x.store.folder(owner),'raw',sha256(raw)),'corrupt');
 assert.equal((await x.request(`/api/runs/${r.data.id}/replay`,'POST',{},s)).status,409);
 for(const f of ['json','csv','html'])assert.equal((await x.request(`/api/receipts/${r.data.id}?format=${f}`,'GET',undefined,s)).status,409);
});
test('snapshot corruption and unknown engine cannot silently replay',async t=>{
 const x=await setup(t),s=await x.session(),r=await x.run(s),owner=s.cookie.slice(14).split('.')[0];
 await x.store.transaction(owner,state=>{state.snapshots[r.data.snapshotSha256].evidence[0].coverage.fraction=1;});
 const rp=await x.request(`/api/runs/${r.data.id}/replay`,'POST',{},s);assert.equal(rp.status,409);assert.equal(rp.data.error.code,'checksum_mismatch');
 assert.throws(()=>computeSnapshot({evidence:[]},'unknown'),/engine_unavailable/);
});
test('session deletion removes raw files, snapshots, runs and idempotency records',async t=>{
 const x=await setup(t),s=await x.session(),r=await x.run(s),owner=s.cookie.slice(14).split('.')[0];
 assert.equal((await x.request('/api/sessions','DELETE',undefined,s)).status,204);
 assert.ok(!(await readdir(x.directory)).includes(owner));assert.equal((await x.request('/api/runs/'+r.data.id,'GET',undefined,s)).status,401);
});
test('TTL denies access immediately, purges files and permits a new session',async t=>{
 const x=await setup(t,{storeOptions:{ttlMs:100}}),s=await x.session();await x.run(s);x.advance(101);
 assert.equal((await x.request('/api/sessions','GET',undefined,s)).status,401);assert.equal((await readdir(x.directory)).length,0);
 assert.equal((await x.request('/api/sessions','POST',{},s)).status,201);
});
test('queued/running cancellation is terminal and late provider results are discarded',async t=>{
 let started,finish;const signalStarted=new Promise(r=>started=r),pending=new Promise(r=>finish=r);
 const x=await setup(t,{adapters:{[product.product+'@'+product.version]:async r=>{started();await pending;return fixture(r);}}}),s=await x.session(),f=await x.farm(s),owner=s.cookie.slice(14).split('.')[0];
 const response=x.request('/api/evidence/jobs','POST',{farmId:f.data.id,timeRange,products:[product]},s);
 await signalStarted;const jobs=await x.store.transaction(owner,state=>Object.values(state.jobs));const id=jobs[0].id;
 assert.equal((await x.request('/api/evidence/jobs/'+id,'DELETE',undefined,s)).data.state,'cancelled');finish();assert.equal((await response).data.state,'cancelled');
 assert.equal((await x.request('/api/evidence/jobs/'+id,'DELETE',undefined,s)).status,409);assert.equal((await x.request('/api/runs','POST',{jobId:id},s)).status,409);
 assert.equal((await x.service.getJob(owner,id)).evidence.length,0);
});
test('body bounds, malformed inputs, methods and paths fail safely',async t=>{
 const x=await setup(t),s=await x.session();
 assert.equal((await x.request('/api/farms','POST',{geometry,saveLocation:true,pad:'x'.repeat(21000)},s)).status,413);
 assert.equal((await x.request('/api/farms','POST',{},s,{'content-type':'text/plain'})).status,415);
 assert.equal((await x.request('/api/farms','GET',undefined,s)).status,405);
 assert.equal((await x.request('/api/runs/nope','GET',undefined,s)).status,404);
 assert.equal((await x.request('/api/runs/nope/replay','GET',undefined,s)).status,405);
 assert.equal((await x.request('/api/receipts/nope/replay','POST',{},s)).status,404);
 assert.equal((await x.request('/api/farms','POST',{},s,{},'{broken')).data.error.code,'malformed_json');
 assert.equal((await x.farm(s,undefined,{'idempotency-key':'bad key'})).status,400);
});
test('recovery after interrupted worker retains every requested source as unavailable',async t=>{
 const x=await setup(t),s=await x.session(),owner=s.cookie.slice(14).split('.')[0],id=randomUUID();
 await x.store.transaction(owner,state=>{state.jobs[id]={id,state:'running',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z',errors:[],evidence:[],request:{geometry,timeRange,products:[product]}};});
 const restarted=await new LocalEvidenceStore({directory:x.directory}).init(),service=createEvidenceService({store:restarted});
 const j=await service.getJob(owner,id);assert.equal(j.state,'failed');assert.equal(j.evidence.length,1);assert.equal(j.evidence[0].missingReason,'worker_interrupted');
 const run=await service.run(owner,{jobId:id});assert.equal(run.body.metrics.sources[0].coverage,null);
});
test('provider checksum mismatch fails without saving unverified bytes',async t=>{
 const x=await setup(t,{adapters:{[product.product+'@'+product.version]:async r=>({...fixture(r),manifest:{...fixture(r).manifest,rawSha256:'0'.repeat(64)}})}}),s=await x.session(),j=await x.job(s),owner=s.cookie.slice(14).split('.')[0];
 assert.equal(j.data.state,'failed');assert.equal(j.data.evidence[0].missingReason,'checksum_mismatch');assert.equal((await readdir(join(x.store.folder(owner),'raw'))).length,0);
});
test('expiry and deletion while adapter runs cannot recreate private data',async t=>{
 let started,finish;const ready=new Promise(r=>started=r),pending=new Promise(r=>finish=r);
 const x=await setup(t,{adapters:{[product.product+'@'+product.version]:async r=>{started();await pending;return fixture(r);}}}),s=await x.session(),f=await x.farm(s),owner=s.cookie.slice(14).split('.')[0];
 const job=x.request('/api/evidence/jobs','POST',{farmId:f.data.id,timeRange,products:[product]},s);await ready;
 assert.equal((await x.request('/api/sessions','DELETE',undefined,s)).status,204);finish();assert.equal((await job).status,401);
 assert.ok(!(await readdir(x.directory)).includes(owner));
});
test('HTML escaping, CSV formula neutralization and deployment fail closed',async()=>{
 const run={id:'test',metrics:{decisionStatus:'comparison_only',value:'=CMD()',tag:'<script>alert(1)</script>'}},snapshot={evidence:[]};
 assert.ok(!receipt(run,snapshot,'html').body.includes('<script>'));assert.ok(receipt(run,snapshot,'csv').body.includes("'=CMD()"));
 for(const env of [{VERCEL:'1'},{NODE_ENV:'production'}])await assert.rejects(createBackendRuntime({env}),e=>e.status===503&&e.code==='storage_unavailable');
 assert.throws(()=>createSessionAuth({store:{},secret:'short',origin:'http://localhost'}),/signing_secret_required/);
});
