import {mkdir,readFile,writeFile,rename,rm,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';

export class ApiError extends Error {
 constructor(status,code,message=code){super(message);this.status=status;this.code=code;}
}
export const check=(ok,code='invalid_input',status=400)=>{if(!ok)throw new ApiError(status,code);};
export function canonical(value){
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
}
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export function objectId(id){check(typeof id==='string'&&uuid.test(id),'not_found',404);return id;}
const clone=value=>JSON.parse(canonical(value));

/** Single-process local provider. Never use this as a serverless store. */
export class LocalEvidenceStore {
 constructor({directory,now=Date.now,ttlMs=86400000}={}){
  check(typeof directory==='string'&&directory.length>0,'storage_unavailable',503);
  check(Number.isInteger(ttlMs)&&ttlMs>0&&ttlMs<=86400000);
  this.directory=resolve(directory);this.now=now;this.ttlMs=ttlMs;this.tail=Promise.resolve();
 }
 async locked(fn){const previous=this.tail;let release;this.tail=new Promise(r=>release=r);await previous;try{return await fn();}finally{release();}}
 async init(){await mkdir(this.directory,{recursive:true,mode:0o700});await this.sweep();await this.recoverInterrupted();return this;}
 folder(id){return join(this.directory,objectId(id));}
 async atomic(file,value){const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,canonical(value),{mode:0o600,flag:'wx'});await rename(temp,file);}
 async load(id){
  let state;try{state=JSON.parse(await readFile(join(this.folder(id),'state.json'),'utf8'));}
  catch(error){if(error.code==='ENOENT')throw new ApiError(401,'session_expired');throw error;}
  if(state.expiresAt<=this.now()){await rm(this.folder(id),{recursive:true,force:true});throw new ApiError(401,'session_expired');}
  return state;
 }
 async createSession(){return this.locked(async()=>{
  const id=randomUUID(),createdAt=this.now(),state={id,createdAt,expiresAt:createdAt+this.ttlMs,farms:{},jobs:{},runs:{},snapshots:{},idempotency:{}};
  await mkdir(join(this.folder(id),'raw'),{recursive:true,mode:0o700});await this.atomic(join(this.folder(id),'state.json'),state);return clone(state);
 });}
 async transaction(id,fn){return this.locked(async()=>{
  const state=await this.load(id),result=await fn(state);
  await this.atomic(join(this.folder(id),'state.json'),state);return clone(result??null);
 });}
 async session(id){return this.locked(async()=>{const s=await this.load(id);return {expiresAt:s.expiresAt};});}
 async deleteSession(id){return this.locked(async()=>{await this.load(id);await rm(this.folder(id),{recursive:true,force:true});});}
 async sweep(){return this.locked(async()=>{
  await mkdir(this.directory,{recursive:true,mode:0o700});let removed=0;
  for(const id of await readdir(this.directory)){
   if(!uuid.test(id))continue;
   try{const s=JSON.parse(await readFile(join(this.folder(id),'state.json'),'utf8'));if(s.expiresAt<=this.now()){await rm(this.folder(id),{recursive:true,force:true});removed++;}}
   catch(e){if(e.code!=='ENOENT')throw e;}
  }return removed;
 });}
 async recoverInterrupted(){return this.locked(async()=>{
  for(const id of await readdir(this.directory)){
   if(!uuid.test(id))continue;const state=await this.load(id);let changed=false;
   for(const job of Object.values(state.jobs))if(['queued','running'].includes(job.state)){
    job.state='failed';job.updatedAt=new Date(this.now()).toISOString();job.errors.push({product:'job',code:'worker_interrupted'});changed=true;
    // Do not lose missing products or misrepresent incomplete work as zero.
    for(let i=job.evidence.length;i<job.request.products.length;i++){
     const p=job.request.products[i];job.evidence.push({...p,geometry:job.request.geometry,timeRange:job.request.timeRange,kind:'observed',delivery:'unavailable',spatialSupport:{nativeGrid:'unavailable',resolution:null},units:{},qa:{usable:false},coverage:{fraction:0},rawSha256:null,missingReason:'worker_interrupted',provider:'unavailable',retrievedAt:job.updatedAt});
    }
   }
   if(changed)await this.atomic(join(this.folder(id),'state.json'),state);
  }
 });}
 async putRaw(id,bytes){
  check(bytes instanceof Uint8Array&&bytes.byteLength>0&&bytes.byteLength<=8*1024*1024,'invalid_raw');
  const hash=sha256(bytes),file=join(this.folder(id),'raw',hash);
  try{await writeFile(file,bytes,{flag:'wx',mode:0o600});}catch(e){if(e.code!=='EEXIST')throw e;check(sha256(await readFile(file))===hash,'checksum_mismatch',409);}
  return hash;
 }
 async verifyRaw(id,hash){
  check(/^[a-f0-9]{64}$/.test(hash),'checksum_mismatch',409);
  let bytes;try{bytes=await readFile(join(this.folder(id),'raw',hash));}catch{throw new ApiError(409,'checksum_mismatch');}
  check(sha256(bytes)===hash,'checksum_mismatch',409);return bytes;
 }
}
