import test from 'node:test';
import assert from 'node:assert/strict';
import {createArgonChallenge,ARGON_EVENTS} from './argon-challenge.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('adequate canal supplies six fictional wheat plots with conservative mass ledger',()=>{
 const x=createArgonChallenge();const r=x.result();near(r.water.deliveredTotal,235);near(r.water.ledger.residualM3,0);
 assert.equal(r.status,'comparison_only');assert.equal(r.source,'illustrative_not_observed');
 assert.equal(r.water.outcome,'all_served');
});
test('OFF and disabled pump deliver no new irrigation without a storage declaration',()=>{
 const x=createArgonChallenge();x.canal(false);near(x.result().water.deliveredTotal,0);
 x.canal(true);x.pump(false);near(x.result().water.deliveredTotal,0);
});
test('limited capacity is not falsely labelled downstream head/tail starvation',()=>{
 const x=createArgonChallenge();x.supply(120);const r=x.result();near(r.water.deliveredTotal,120);
 near(r.water.shortfall.reduce((a,b)=>a+b,0),115);near(r.water.ledger.residualM3,0);
 assert.equal(r.status,'comparison_only');
});
test('crop changes, typed events and Time Echo preserve a real before/after snapshot',()=>{
 const events=[];const x=createArgonChallenge((e)=>events.push(e));x.saveBaseline();
 x.crop(0,'maize');x.supply(120);const c=x.compare();
 assert.notEqual(c.baseline.water.deliveredTotal,c.current.water.deliveredTotal);
 assert.equal(c.baseline.demands[0],35);assert.equal(c.current.demands[0],42);
 assert.ok(events.includes(ARGON_EVENTS.crop)&&events.includes(ARGON_EVENTS.policy));
});
test('unknown soil stays unknown; manually entered thresholds only screen risk',()=>{
 const x=createArgonChallenge();assert.equal(x.result().drainage,'measurement_missing');
 x.soil(50,20);assert.equal(x.result().drainage,'request_professional_review');
 x.soil(90,8);assert.equal(x.result().drainage,'screening_only');
 assert.throws(()=>x.soil(-1,10),/invalid_soil/);
});
