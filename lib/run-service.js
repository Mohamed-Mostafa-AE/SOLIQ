import {randomUUID} from 'node:crypto';
import {check,canonical,sha256} from './evidence-store.js';
export const ENGINE_VERSION='evidence-summary-v1';
export function computeSnapshot(snapshot,engine=ENGINE_VERSION){
 check(engine===ENGINE_VERSION,'engine_unavailable',409);
 const sources=snapshot.evidence.map(m=>({product:m.product,version:m.version,kind:m.kind,delivery:m.delivery,usable:m.delivery!=='unavailable'&&m.qa.usable,coverage:m.delivery==='unavailable'?null:m.coverage.fraction,rawSha256:m.rawSha256,missingReason:m.missingReason}));
 return {decisionStatus:'comparison_only',usableSources:sources.filter(s=>s.usable).length,unavailableSources:sources.filter(s=>!s.usable).length,sources};
}
export async function makeRun(store,owner,state,snapshot,engine=ENGINE_VERSION,replayOf=null){
 const snapshotSha256=sha256(canonical(snapshot));
 for(const m of snapshot.evidence)if(m.rawSha256)await store.verifyRaw(owner,m.rawSha256);
 const run={id:randomUUID(),snapshotSha256,engineVersion:engine,metrics:computeSnapshot(snapshot,engine),replayOf};
 check(Object.keys(state.runs).length<128,'quota_exceeded',429);
 state.snapshots[snapshotSha256]=snapshot;state.runs[run.id]=run;return run;
}
export async function replayRun(store,owner,state,run){
 const snapshot=state.snapshots[run.snapshotSha256];
 check(snapshot&&sha256(canonical(snapshot))===run.snapshotSha256,'checksum_mismatch',409);
 return makeRun(store,owner,state,snapshot,run.engineVersion,run.id);
}
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const csvCell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
export function receipt(run,snapshot,format='json'){
 const data={schemaVersion:'1',...run,evidence:snapshot.evidence};
 const json=canonical(data);
 if(format==='json')return {type:'application/json; charset=utf-8',body:json};
 if(format==='html')return {type:'text/html; charset=utf-8',body:'<!doctype html><html lang="en"><meta charset="utf-8"><title>SOLIQ evidence receipt</title><h1>Evidence receipt</h1><p>comparison_only — no agricultural efficacy certificate</p><pre>'+escapeHtml(json)+'</pre></html>'};
 check(format==='csv','invalid_format');
 // Long-form fields preserve all JSON metrics/provenance without lossy columns.
 const rows=[['field','value']];
 function flatten(value,key){
  if(value&&typeof value==='object')for(const k of Object.keys(value).sort())flatten(value[k],key?key+'.'+k:k);
  else rows.push([key,value===null?'null':value]);
 }flatten(data,'');
 return {type:'text/csv; charset=utf-8',body:rows.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n'};
}
