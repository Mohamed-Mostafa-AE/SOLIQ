import test from "node:test";
import assert from "node:assert/strict";
import {allocateWater,trendStats,nitrogenLedger} from "./engine.js";

test("proportional water allocations conserve available supply",()=>{
 const r=allocateWater([20,40,30,10,50,60],100);
 assert.ok(Math.abs(r.deliveredTotal-100)<1e-9);
 assert.ok(r.delivered.every((v,i)=>v>=0&&v<=r.shortfall[i]+v+1e-9));
 assert.ok(r.fairness>0&&r.fairness<=1);
 assert.equal(r.dataClass,"simulated");
});
test("priority water allocations still preserve supply and sequence",()=>{
 const r=allocateWater([20,40,30,10,50,60],100,"priority");
 assert.deepEqual(r.delivered,[20,40,30,10,0,0]);
});
test("sufficient water and empty demand are handled without dividing by zero",()=>{
 const r=allocateWater([1,2,3],100);
 assert.equal(r.deliveredTotal,6);
 assert.equal(r.fairness,1);
 const empty=allocateWater([0,0],0);
 assert.equal(empty.deliveredTotal,0);
 assert.equal(empty.fairness,1);
});
test("impossible water requests are refused",()=>{
 assert.throws(()=>allocateWater([1,2],-1));
 assert.throws(()=>allocateWater([1,2],4,"unknown"));
 assert.throws(()=>allocateWater([1,NaN],4));
});
test("Mann-Kendall and Sen compute actual-year pairwise slopes",()=>{
 const t=trendStats([{year:2000,value:1},{year:2001,value:2},{year:2003,value:4},{year:2006,value:7}]);
 assert.equal(t.senPerYear,1);
 assert.equal(t.senPerDecade,10);
 assert.ok(t.p>=0&&t.p<=1);
 assert.equal(t.serialCorrelationCorrected,false);
});
test("constant series returns no evidence of a trend",()=>{
 const t=trendStats([1,2,3,4].map(year=>({year,value:3})));
 assert.equal(t.S,0);
 assert.equal(t.p,1);
});
test("duplicate years and missing data are refused",()=>{
 assert.throws(()=>trendStats([{year:2001,value:1},{year:2001,value:2},{year:2002,value:3},{year:2003,value:4}]));
 assert.throws(()=>trendStats([{year:1,value:1}]));
});
test("nitrogen ledger exposes deficit rather than inventing nitrogen",()=>{
 const n=nitrogenLedger({initial:10,fertilizer:0,fixation:2,mineralization:0,uptake:30,loss:1});
 assert.equal(n.ending,-19);
 assert.equal(n.deficit,19);
 assert.equal(n.closureResidual,0);
 assert.throws(()=>nitrogenLedger({initial:10,fertilizer:-2,fixation:2,mineralization:0,uptake:30,loss:1}));
});
