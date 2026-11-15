import test from 'node:test';
import assert from 'node:assert/strict';
import {auditDecision} from './decision-audit.js';
test('paired losses detect reversal and compute regret by scenario',()=>{
 const r=auditDecision([{id:'a',status:'conditional',scenarioDeficits:{reference:1,drier:8,lowerKc:2,higherKc:4}},{id:'b',status:'conditional',scenarioDeficits:{reference:3,drier:5,lowerKc:2,higherKc:6}}]);
 assert.deepEqual(r.reversals,[['a','b']]);assert.deepEqual(r.candidates.map(x=>[x.wins,x.worstRegret]),[[3,3],[2,2]]);
});
test('excluded and unreviewed options cannot enter audit',()=>{
 assert.equal(auditDecision([{id:'x',status:'needs_review'}]).status,'insufficient_candidates');
 assert.throws(()=>auditDecision([{id:'x',status:'conditional',scenarioDeficits:{reference:NaN}}]));
});
