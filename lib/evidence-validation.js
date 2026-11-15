import {check,canonical} from './evidence-store.js';
export function fields(x,allowed,required=allowed){
 check(x&&typeof x==='object'&&!Array.isArray(x));
 check(Object.keys(x).every(k=>allowed.includes(k))&&required.every(k=>Object.hasOwn(x,k)));
}
export function geometry(g){
 fields(g,['type','coordinates']);
 const point=p=>Array.isArray(p)&&p.length===2&&p.every(v=>typeof v==='number'&&Number.isFinite(v))&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
 if(g.type==='Point'){check(point(g.coordinates));return;}
 check(g.type==='Polygon'&&Array.isArray(g.coordinates)&&g.coordinates.length===1);
 const ring=g.coordinates[0];check(Array.isArray(ring)&&ring.length>=4&&ring.length<=100&&ring.every(point));
 check(canonical(ring[0])===canonical(ring.at(-1)));
 const xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]);check(Math.max(...xs)-Math.min(...xs)<=2&&Math.max(...ys)-Math.min(...ys)<=2);
 check(new Set(ring.map(canonical)).size>=3);
 let area=0;for(let i=1;i<ring.length;i++)area+=ring[i-1][0]*ring[i][1]-ring[i][0]*ring[i-1][1];check(Math.abs(area)>1e-12);
}
export function timeRange(t){
 fields(t,['start','end']);
 for(const d of [t.start,t.end])check(typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d);
 const days=(Date.parse(t.end)-Date.parse(t.start))/86400000+1;check(days>0&&days<=366);
}
export const text=(x,max=200)=>typeof x==='string'&&x.length>0&&x.length<=max&&!/[\x00-\x1f]/.test(x);
export function products(items){
 check(Array.isArray(items)&&items.length>0&&items.length<=8);
 for(const p of items){fields(p,['product','version','qa']);check(text(p.product)&&text(p.version)&&p.qa&&typeof p.qa==='object'&&!Array.isArray(p.qa)&&canonical(p.qa).length<=2000);}
 check(new Set(items.map(p=>p.product+'@'+p.version)).size===items.length);
}
export function manifest(value,request,rawBytes){
 const keys=['product','version','kind','delivery','geometry','timeRange','spatialSupport','units','qa','coverage','rawSha256','missingReason','provider','retrievedAt'];
 fields(value,keys);
 check(value.product===request.product&&value.version===request.version&&canonical(value.geometry)===canonical(request.geometry)&&canonical(value.timeRange)===canonical(request.timeRange),'adapter_contract',502);
 check(['observed','derived','assumed','simulated'].includes(value.kind)&&['live','cached','unavailable'].includes(value.delivery),'adapter_contract',502);
 check(text(value.provider)&&text(value.retrievedAt)&&Number.isFinite(Date.parse(value.retrievedAt)),'adapter_contract',502);
 check(value.spatialSupport&&text(value.spatialSupport.nativeGrid)&&value.units&&typeof value.units==='object'&&!Array.isArray(value.units),'adapter_contract',502);
 check(value.qa&&typeof value.qa.usable==='boolean'&&value.coverage&&typeof value.coverage.fraction==='number'&&Number.isFinite(value.coverage.fraction)&&value.coverage.fraction>=0&&value.coverage.fraction<=1,'adapter_contract',502);
 if(value.delivery==='unavailable')check(text(value.missingReason)&&value.rawSha256===null&&rawBytes==null&&value.qa.usable===false,'adapter_contract',502);
 else check(value.missingReason===null&&rawBytes instanceof Uint8Array,'adapter_contract',502);
 // Manifests are metadata, never signed URLs, credentials or provider payloads.
 check(canonical(value).length<=12000&&!/https?:\/\/|bearer\s|signedurl|access_token|authorization|password|secret/i.test(canonical(value)),'adapter_contract',502);
 return value;
}
