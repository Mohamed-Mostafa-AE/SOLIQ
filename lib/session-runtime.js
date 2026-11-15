import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {LocalEvidenceStore,ApiError} from './evidence-store.js';
import {createSessionAuth} from './session.js';
import {createEvidenceService} from './evidence-service.js';
import {createEvidenceHandler} from './evidence-router.js';

// Explicit deployment gate. A local filesystem cannot implement cross-instance
// transactions, durable retention or reliable deletion on Vercel.
export async function createBackendRuntime({env=process.env,adapters,store,secret}={}){
 if((env.VERCEL||env.NODE_ENV==='production')&&(!store||store instanceof LocalEvidenceStore||store.durable!==true))throw new ApiError(503,'storage_unavailable');
 if(!store){
  const directory=env.SOLIQ_DATA_DIR??join(tmpdir(),'soliq-evidence-local');
  store=await new LocalEvidenceStore({directory}).init();
 }
 secret??=env.SOLIQ_SESSION_SECRET;
 if(!secret){
  if(env.VERCEL||env.NODE_ENV==='production')throw new ApiError(503,'signing_secret_required');
  await mkdir(store.directory,{recursive:true,mode:0o700});
  const file=join(store.directory,'signing-key');
  try{await writeFile(file,randomBytes(48).toString('base64url'),{flag:'wx',mode:0o600});}catch(e){if(e.code!=='EEXIST')throw e;}
  secret=await readFile(file,'utf8');
 }
 const origin=env.SOLIQ_ORIGIN??`http://127.0.0.1:${Number(env.PORT)||4173}`;
 // Trusted operator-owned module only. Never accept module paths from HTTP.
 if(!adapters&&env.SOLIQ_ADAPTER_MODULE){const module=await import(pathToFileURL(resolve(env.SOLIQ_ADAPTER_MODULE)).href);adapters=module.adapters;}
 if(adapters!==undefined&&(!adapters||typeof adapters!=='object'||Object.values(adapters).some(a=>typeof a!=='function')))throw new ApiError(503,'adapter_configuration_invalid');
 const auth=createSessionAuth({store,secret,origin,secure:!!env.VERCEL||env.NODE_ENV==='production'});
 const service=createEvidenceService({store,adapters:adapters??{}});
 return {store,auth,service,handler:createEvidenceHandler({store,auth,service})};
}
let runtime;
export async function backendHandler(req,res){
 try{runtime??=createBackendRuntime().catch(e=>{runtime=undefined;throw e;});await (await runtime).handler(req,res);}
 catch(e){res.statusCode=e.status??503;res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:{code:e.code??'storage_unavailable',message:'Backend unavailable'}}));}
}
