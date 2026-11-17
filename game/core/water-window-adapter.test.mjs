import test from 'node:test';
import assert from 'node:assert/strict';
import { runGameWaterWindow, GAME_WATER_SOURCE } from './water-window-adapter.js';

const DEMANDS = [35, 45, 60, 40, 25, 30];
const total = xs => xs.reduce((a,b) => a+b, 0);
const near = (got, expected) => assert.ok(Math.abs(got-expected)<1e-6, String(got)+' != '+String(expected));

test('actual time-sliced solver serves all six farms with adequate ON supply', () => {
 const r=runGameWaterWindow({supplyM3h:235,demandsM3:DEMANDS});
 near(r.deliveredTotal,235);
 near(total(r.shortfall),0);
 assert.equal(r.outcome,'all_served');
 assert.ok(r.fairness>0.999);
 assert.equal(r.engineVersion,'mesqa-window-v1');
 assert.equal(r.inputAssumptions.realFarmValidation,false);
 assert.equal(r.provenance.kind,'simulated');
 assert.match(r.provenance.source,/fictional/);
 assert.ok(r.flowByTimestep.some(s=>s.canalDivertedM3>0));
 assert.ok(r.flowByTimestep.some(s=>s.canalAvailableM3h===0));
});
test('canal OFF and no storage deliver exactly zero, even if valves request water', () => {
 const r=runGameWaterWindow({supplyM3h:235,demandsM3:DEMANDS,turnOn:false});
 near(r.deliveredTotal,0);
 near(total(r.shortfall),235);
 near(r.ledger.canalDivertedM3,0);
});
test('pump OFF prevents new canal water delivery', () => {
 const r=runGameWaterWindow({supplyM3h:235,demandsM3:DEMANDS,pumpOn:false});
 near(r.deliveredTotal,0);
 near(total(r.shortfall),235);
});
test('scenario-specific pump failure prevents delivery without inventing an always-failing pump', () => {
 const a=runGameWaterWindow({supplyM3h:235,demandsM3:DEMANDS,pumpFailure:true});
 const b=runGameWaterWindow({supplyM3h:235,demandsM3:DEMANDS,pumpFailure:false});
 near(a.deliveredTotal,0);
 near(b.deliveredTotal,235);
 assert.ok(a.events.some(e=>e.type==='pump:failed'));
});
test('capacity-limited ON turn has real unmet demand but no fabricated downstream policy', () => {
 const r=runGameWaterWindow({supplyM3h:120,demandsM3:DEMANDS});
 near(r.deliveredTotal,120);
 near(total(r.shortfall),115);
 assert.equal(r.outcome,'unmet_demand');
 assert.ok(r.waterByField.some(f=>f.unmetM3>0));
});
test('fictional selectable branch valves use the physical time-window solver without hidden water', () => {
 const a=runGameWaterWindow({supplyM3h:120,demandsM3:DEMANDS,openFields:[true,true,true,false,false,false]});
 const b=runGameWaterWindow({supplyM3h:120,demandsM3:DEMANDS,openFields:[false,false,false,true,true,true]});
 assert.ok(a.delivered.slice(0,3).some(value=>value>0));
 assert.deepEqual(a.delivered.slice(3),[0,0,0]);
 assert.ok(b.delivered.slice(3).some(value=>value>0));
 assert.deepEqual(b.delivered.slice(0,3),[0,0,0]);
 near(a.ledger.residualM3,0);
 near(b.ledger.residualM3,0);
 assert.deepEqual(a.inputAssumptions.openFields,[true,true,true,false,false,false]);
 assert.throws(()=>runGameWaterWindow({supplyM3h:120,demandsM3:DEMANDS,openFields:[true]}),/Six explicitly/);
});
test('conservation residual per slice and overall water ledger are zero', () => {
 for(const supplyM3h of [0,120,235,400]){
  const r=runGameWaterWindow({supplyM3h,demandsM3:DEMANDS});
  near(r.ledger.residualM3,0);
  r.flowByTimestep.forEach(s=>near(s.residualM3,0));
 }
});
test('immutable deterministic replay of same scenario', () => {
 const input={supplyM3h:190,demandsM3:DEMANDS,seed:'repeat-1'};
 const a=runGameWaterWindow(input),b=runGameWaterWindow(input);
 assert.deepEqual(a,b);
 assert.deepEqual(DEMANDS,[35,45,60,40,25,30]);
});
test('refuse invalid demand inputs instead of silently assuming water', () => {
 for(const demandsM3 of [[1,2], [1,2,3,4,5,-1], [1,2,3,4,5,NaN],null]){
  assert.throws(()=>runGameWaterWindow({supplyM3h:100,demandsM3}),/Six finite/);
 }
 assert.throws(()=>runGameWaterWindow({supplyM3h:-1,demandsM3:DEMANDS}),/Six finite/);
});
test('no real NASA or field observation claimed by simulation fixture',()=>{
 const r=runGameWaterWindow({supplyM3h:235,demandsM3:DEMANDS});
 assert.match(GAME_WATER_SOURCE,/NOT measured/);
 assert.equal(r.provenance.delivery,'unavailable');
 assert.equal(r.decisionStatus,'comparison_only');
});
