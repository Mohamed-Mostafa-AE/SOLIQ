import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import vm from 'node:vm';
import {resolve} from 'node:path';
import {createLocalServer} from '../dev-server.mjs';

const root=resolve(import.meta.dirname,'..');
const read=path=>readFile(resolve(root,path),'utf8');

test('install manifest is scoped to the existing Soil-IQ application, with real square PNG icons',async()=>{
 const manifest=JSON.parse(await read('manifest.webmanifest'));
 assert.equal(manifest.name,'Soil-IQ — Crop Rotation Explorer');
 assert.equal(manifest.start_url,'/');
 assert.equal(manifest.scope,'/');
 assert.equal(manifest.display,'standalone');
 for(const size of [192,512]){
  const icon=manifest.icons.find(item=>item.sizes===`${size}x${size}`);
  assert.ok(icon,`Missing ${size}px install icon`);
  assert.equal(icon.type,'image/png');
  const bytes=await readFile(resolve(root,icon.src.replace(/^\//,'')));
  assert.equal(bytes.subarray(1,4).toString(),'PNG');
  assert.equal(bytes.readUInt32BE(16),size);
  assert.equal(bytes.readUInt32BE(20),size);
 }
 const page=await read('index.html');
 assert.match(page,/rel="manifest" href="\/manifest\.webmanifest"/);
 assert.match(page,/id="install-soiliq"/);
 assert.match(page,/src="\/pwa\/install\.js"/);
});

function bootWorker(){
 const handlers=new Map(),cachedFiles=[];
 const offlineResponse={type:'offline-unavailable'};
 const cached={type:'cached-static'};
 const storage={
  open:async()=>({addAll:async items=>cachedFiles.push(...items)}),
  keys:async()=>['old-site-cache','soil-iq-ui-shell-v0'],
  delete:async()=>true,
  match:async key=>{
   const path=typeof key==='string'?key:new URL(key.url).pathname;
   return path==='/pwa/offline.html'?offlineResponse:path==='/pwa/install.css'?cached:null;
  },
 };
 const scope={
  URL,
  self:{location:{origin:'https://soil-iq.example'},addEventListener:(event,fn)=>handlers.set(event,fn),clients:{claim:async()=>{}},skipWaiting:async()=>{}},
  caches:storage,
  fetch:async()=>{throw new TypeError('Offline: network unavailable');},
 };
 return read('service-worker.js').then(source=>{vm.runInNewContext(source,scope);return {handlers,cachedFiles,offlineResponse,cached};});
}

test('service worker never intercepts API requests or cross-origin NASA observations',async()=>{
 const {handlers}=await bootWorker();
 const cases=[
  {url:'https://soil-iq.example/api/trends?mode=annual',mode:'cors',method:'GET'},
  {url:'https://soil-iq.example/api/sessions',mode:'cors',method:'POST'},
  {url:'https://power.larc.nasa.gov/api/temporal/daily/point',mode:'cors',method:'GET'},
  {url:'https://soil-iq.example/app.js',mode:'cors',method:'GET'},
 ];
 for(const request of cases){
  let intercepted=false;
  handlers.get('fetch')({request,respondWith:()=>{intercepted=true;}});
  assert.equal(intercepted,false,`${request.url} must not be served from cache`);
 }
});

test('offline navigation always yields an explicit UNAVAILABLE screen, not stale app or NASA results',async()=>{
 const {handlers,offlineResponse,cached}=await bootWorker();
 let response;
 handlers.get('fetch')({request:{url:'https://soil-iq.example/',mode:'navigate',method:'GET'},respondWith:promise=>response=promise});
 assert.equal(await response,offlineResponse);
 handlers.get('fetch')({request:{url:'https://soil-iq.example/pwa/install.css',mode:'cors',method:'GET'},respondWith:promise=>response=promise});
 assert.equal(await response,cached);
 const page=await read('pwa/offline.html');
 assert.match(page,/DATA UNAVAILABLE/);
 assert.match(page,/NASA POWER/);
 assert.match(page,/not.*observation/i);
});

test('install step precaches only explicit immutable UI shell files, never app data',async()=>{
 const {handlers,cachedFiles}=await bootWorker();
 let installed;
 handlers.get('install')({waitUntil:promise=>installed=promise});
 await installed;
 assert.ok(cachedFiles.includes('/pwa/offline.html'));
 assert.ok(cachedFiles.includes('/pwa/install.css'));
 for(const resource of cachedFiles){
  assert.ok(resource.startsWith('/'),'All UI shell resources must be same-origin');
  assert.ok(!/api|NASA|POWER|receipt|weather|evidence|\.json(?:\?|$)/i.test(resource),`Disallowed cache resource: ${resource}`);
 }
});

test('local preview serves manifest, worker, shell and both install icons without widening private routes',async t=>{
 const server=createLocalServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base=`http://127.0.0.1:${server.address().port}`;
 for(const path of ['/manifest.webmanifest','/service-worker.js','/pwa/install.js','/pwa/install.css','/pwa/offline.html','/pwa/icon-192.png','/pwa/icon-512.png']){
  const response=await fetch(base+path);
  assert.equal(response.status,200,`${path} is essential to install and offline fallback`);
  assert.ok(response.headers.get('x-content-type-options')==='nosniff');
  await response.arrayBuffer();
 }
 const blocked=await fetch(base+'/private-config.json');
 assert.equal(blocked.status,404);
 const icons=await Promise.all(['pwa/icon-192.png','pwa/icon-512.png'].map(x=>stat(resolve(root,x))));
 assert.ok(icons.every(x=>x.size>200));
});
