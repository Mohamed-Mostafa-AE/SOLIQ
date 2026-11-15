export const ENGINE_VERSION='mesqa-window-v1';
const fail=code=>{throw new Error(code);};
const valid=(ok,code='invalid_input')=>{if(!ok)fail(code);};
const number=x=>{valid(x!==null&&x!==undefined,'missing_data');valid(typeof x==='number'&&Number.isFinite(x)&&x>=0);return x;};
const clone=x=>JSON.parse(JSON.stringify(x));
const EPS=1e-9;
const keys=(x,allowed)=>valid(x&&typeof x==='object'&&Object.keys(x).every(k=>allowed.includes(k)),'unsupported_field');
function windows(list,min,max,contiguous=false){
 valid(Array.isArray(list)&&list.length>0&&list.length<=1000);
 let end=min;
 for(const w of list){number(w.startHour);number(w.endHour);valid(w.startHour>=end&&w.endHour>w.startHour&&w.endHour<=max);if(contiguous)valid(w.startHour===end);end=w.endHour;}
 if(contiguous)valid(end===max);
}
function validate(s,actions){
 valid(s&&typeof s==='object');valid(['ROTATIONAL_ON_OFF','CONTINUOUS_IMPROVED','ON_DEMAND_IMPROVED','LOW_PRESSURE_CONDITIONAL'].includes(s.mode));
 keys(s,['mode','provenance','seed','intervals','pump','storage','farms']);
 keys(s.provenance,['kind','delivery','source']);keys(s.pump,['maxFlowM3h','efficiency']);keys(s.storage,['initialM3','source']);
 valid(s.provenance&&['simulated','assumed','observed','derived'].includes(s.provenance.kind)&&['live','cached','unavailable'].includes(s.provenance.delivery)&&typeof s.provenance.source==='string'&&s.provenance.source.length>0);
 valid(!(s.provenance.kind==='observed'&&s.provenance.delivery==='unavailable'),'missing_data');valid(typeof s.seed==='string');
 valid(Array.isArray(s.intervals)&&s.intervals.length>0);
 const min=number(s.intervals[0].startHour),max=number(s.intervals.at(-1).endHour);valid(max-min<=24*366);windows(s.intervals,min,max,true);
 for(const w of s.intervals){keys(w,['startHour','endHour','on','flowM3h']);valid(typeof w.on==='boolean');number(w.flowM3h);valid(w.on||w.flowM3h===0);if(s.mode.includes('IMPROVED'))valid(w.on);}
 valid(s.pump&&s.storage,'missing_data');number(s.pump.maxFlowM3h);number(s.pump.efficiency);valid(s.pump.efficiency>0&&s.pump.efficiency<=1);number(s.storage.initialM3);valid(typeof s.storage.source==='string'&&s.storage.source.length>0);
 valid(Array.isArray(s.farms)&&s.farms.length===6);valid(new Set(s.farms.map(f=>f.id)).size===6);
 for(const f of s.farms){keys(f,['id','areaM2','needMm','cropStage','maxFlowM3h','windows']);valid(typeof f.id==='string'&&/^[A-Za-z0-9_-]{1,40}$/.test(f.id));number(f.areaM2);valid(f.areaM2>0);number(f.needMm);number(f.maxFlowM3h);valid(typeof f.cropStage==='string');windows(f.windows,min,max);f.windows.forEach(w=>keys(w,['startHour','endHour']));valid(Number.isFinite(f.areaM2*f.needMm/1000/s.pump.efficiency));}
 valid(Array.isArray(actions)&&actions.length<=1000);
 for(const a of actions){valid(a&&['pump','valve'].includes(a.type));windows([a],min,max);
  keys(a,a.type==='valve'?['type','farmId','startHour','endHour']:['type','startHour','endHour','factor','reason','kind']);
  if(a.type==='valve')valid(s.farms.some(f=>f.id===a.farmId));
  else {number(a.factor);valid(a.factor<=1&&['failure','maintenance','degraded'].includes(a.reason));valid(a.kind==='simulated'&&s.provenance.kind!=='observed','fictional_event_requires_scenario');}
 }
 for(const id of ['pump',...s.farms.map(f=>f.id)]){const group=actions.filter(a=>id==='pump'?a.type==='pump':a.type==='valve'&&a.farmId===id).sort((a,b)=>a.startHour-b.startHour);if(group.length)windows(group,min,max);}
 return {min,max};
}
/** Pure event-driven allocation. All scenario rates are explicit assumptions. */
export function simulateWaterWindow(initialState,actions=[]){
 const {min,max}=validate(initialState,actions),s=clone(initialState),aa=clone(actions),eff=s.pump.efficiency;
 const farms=[...s.farms].sort((a,b)=>a.id.localeCompare(b.id,'en'));
 const remaining=farms.map(f=>f.areaM2*f.needMm/1000/eff),initial=[...remaining];
 let storage=s.storage.initialM3;
 const cuts=[...new Set([min,max,...s.intervals.flatMap(w=>[w.startHour,w.endHour]),...farms.flatMap(f=>f.windows.flatMap(w=>[w.startHour,w.endHour])),...aa.flatMap(a=>[a.startHour,a.endHour])])].sort((a,b)=>a-b);
 const events=aa.map(a=>({type:a.type==='valve'?'valve:proposed':a.reason==='maintenance'?'pump:maintenance':'pump:failed',hour:a.startHour,kind:a.kind??s.provenance.kind,...(a.farmId?{farmId:a.farmId}:{})}));
 s.intervals.forEach((w,i)=>{if(w.on&&(!i||!s.intervals[i-1].on))events.push({type:'water:arrived',hour:w.startHour,kind:s.provenance.kind});if(w.on&&(!s.intervals[i+1]?.on))events.push({type:'window:closed',hour:w.endHour,kind:s.provenance.kind});});
 const flowByTimestep=[];
 for(let k=0;k<cuts.length-1;k++){
  let t=cuts[k];const end=cuts[k+1];
  const window=s.intervals.find(w=>w.startHour<=t&&w.endHour>t),canal=window.on?window.flowM3h:0;
  const fault=aa.find(a=>a.type==='pump'&&a.startHour<=t&&a.endHour>t),pump=s.pump.maxFlowM3h*(fault?.factor??1);
  while(t<end-EPS){
   const active=farms.map((f,i)=>remaining[i]>EPS&&f.windows.some(w=>w.startHour<=t&&w.endHour>t)&&aa.some(a=>a.type==='valve'&&a.farmId===f.id&&a.startHour<=t&&a.endHour>t));
   const rates=farms.map(()=>0);let capacity=Math.min(pump,storage>EPS?pump:canal),pending=farms.map((_,i)=>i).filter(i=>active[i]&&farms[i].maxFlowM3h>0);
   // Equal-share water filling with redistribution at each cap.
   while(pending.length&&capacity>EPS){const share=capacity/pending.length,capped=pending.filter(i=>farms[i].maxFlowM3h<=share);if(!capped.length){pending.forEach(i=>rates[i]=share);break;}for(const i of capped){rates[i]=farms[i].maxFlowM3h;capacity-=rates[i];}pending=pending.filter(i=>!capped.includes(i));}
   const rate=rates.reduce((a,b)=>a+b,0);let dt=end-t;
   for(let i=0;i<farms.length;i++)if(rates[i]>0)dt=Math.min(dt,remaining[i]/rates[i]);
   if(rate>canal&&storage>EPS)dt=Math.min(dt,storage/(rate-canal));
   valid(dt>0&&Number.isFinite(dt),'numerical_resolution');
   const opening=storage,gross=rate*dt,canalAvailableM3=canal*dt,canalDivertedM3=Math.min(gross,canalAvailableM3),storageDrawM3=Math.max(0,gross-canalDivertedM3);
   storage=Math.max(0,storage-storageDrawM3);
   const fields=farms.map((f,i)=>{const grossM3=rates[i]*dt;remaining[i]=Math.max(0,remaining[i]-grossM3);return {id:f.id,grossM3,effectiveM3:grossM3*eff,flowM3h:rates[i]};});
   const effectiveM3=gross*eff,lossM3=gross-effectiveM3,unusedM3=canalAvailableM3-canalDivertedM3;
   const slice={startHour:t,endHour:t+dt,canalAvailableM3h:canal,pumpCapacityM3h:pump,canalDivertedM3,storageDrawM3,deliveredM3:effectiveM3,lossM3,unusedM3,storageRemainingM3:storage,residualM3:canalAvailableM3+opening-effectiveM3-lossM3-unusedM3-storage,fields};
   valid(Math.abs(slice.residualM3)<=1e-7*Math.max(1,canalAvailableM3+opening),'conservation_error');flowByTimestep.push(slice);
   for(const f of fields)if(f.grossM3>0)events.push({type:'irrigation:delivered',hour:t,farmId:f.id,effectiveM3:f.effectiveM3,kind:s.provenance.kind});
   t+=dt;
  }
 }
 const waterByField=farms.map((f,i)=>{const demandM3=initial[i]*eff,unmetM3=remaining[i]*eff,deliveredM3=demandM3-unmetM3;return {id:f.id,areaM2:f.areaM2,demandM3,deliveredM3,unmetM3,fulfillment:demandM3>0?deliveredM3/demandM3:null,npcResponse:demandM3===0?'no_demand':unmetM3<=EPS?'all_served':'unmet_demand'};});
 const sum=key=>flowByTimestep.reduce((n,x)=>n+x[key],0),fractions=waterByField.filter(f=>f.demandM3>0).map(f=>f.fulfillment),squares=fractions.reduce((n,x)=>n+x*x,0);
 const ledger={canalAvailableM3:s.intervals.reduce((n,w)=>n+w.flowM3h*(w.endHour-w.startHour),0),canalDivertedM3:sum('canalDivertedM3'),initialStorageM3:s.storage.initialM3,finalStorageM3:storage,effectiveM3:sum('deliveredM3'),lossM3:sum('lossM3'),unusedM3:sum('unusedM3')};
 ledger.residualM3=ledger.canalAvailableM3+ledger.initialStorageM3-ledger.finalStorageM3-ledger.effectiveM3-ledger.lossM3-ledger.unusedM3;
 return {engineVersion:ENGINE_VERSION,provenance:s.provenance,seed:s.seed,decisionStatus:'comparison_only',flowByTimestep,waterByField,ledger,fairness:squares>0?fractions.reduce((n,x)=>n+x,0)**2/(fractions.length*squares):null,outcome:waterByField.every(f=>f.unmetM3<=EPS)?'all_served':'unmet_demand',events:events.sort((a,b)=>a.hour-b.hour||a.type.localeCompare(b.type,'en')||(a.farmId??'').localeCompare(b.farmId??'','en'))};
}
