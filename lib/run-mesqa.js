import {randomUUID} from 'node:crypto';
import {canonical,sha256,check,objectId} from './evidence-store.js';
import {simulateWaterWindow,ENGINE_VERSION} from '../science/mesqa-window.js';
// Server-only bridge: ownership is the authenticated session, never a body field.
export function createMesqaRuns(store){
 async function save(owner,input,replayOf=null){
  const snapshot=JSON.parse(canonical(input));
  const result=simulateWaterWindow(snapshot.initialState,snapshot.actions);
  const hash=sha256(canonical(snapshot));
  return store.transaction(owner,state=>{
   state.mesqaRuns??={};state.mesqaSnapshots??={};
   check(Object.keys(state.mesqaRuns).length<128,'quota_exceeded',429);
   const run={id:randomUUID(),snapshotSha256:hash,engineVersion:ENGINE_VERSION,replayOf,result};
   state.mesqaSnapshots[hash]=snapshot;state.mesqaRuns[run.id]=run;return run;
  });
 }
 return {
  create:(owner,initialState,actions)=>save(owner,{engineVersion:ENGINE_VERSION,initialState,actions}),
  async replay(owner,id){
   objectId(id);
   const input=await store.transaction(owner,state=>{const run=state.mesqaRuns?.[id];check(run,'not_found',404);check(run.engineVersion===ENGINE_VERSION,'engine_unavailable',409);const snapshot=state.mesqaSnapshots?.[run.snapshotSha256];check(snapshot&&sha256(canonical(snapshot))===run.snapshotSha256,'checksum_mismatch',409);return snapshot;});
   const run=await save(owner,input,id);
   // Replay provenance is outside physical results, preserving exact equality.
   return {...run,replayEvent:{type:'run:replayed',from:id,to:run.id}};
  }
 };
}
