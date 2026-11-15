import test from 'node:test';
import assert from 'node:assert/strict';
import {rankVectors,GUIDANCE,MODEL} from './adviser/knowledge.js';
test('semantic retrieval ranks normalized vectors and keeps source identities',()=>{
 const result=rankVectors([1,0],[[0,1],[1,0],[-1,0]]);assert.deepEqual(result.map(x=>x.index),[1,0,2]);
 assert.equal(MODEL.revision.length,40);assert.equal(GUIDANCE.length,6);assert.ok(GUIDANCE.every(x=>x.url&&x.source&&x.ar));
});
