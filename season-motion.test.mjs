import test from 'node:test';
import assert from 'node:assert/strict';
import {seasonFrame} from './season-motion.js';
test('animation reads actual selected daily output without changing scientific results',()=>{
 const r={daily:[{date:'2024-01-01',storage:20,crop:'maize'},{date:'2024-01-02',storage:70,crop:'soybean'}]};const saved=structuredClone(r);
 assert.equal(seasonFrame(r,1,100).waterPercent,70);assert.equal(seasonFrame(r,999,100).date,'2024-01-02');assert.deepEqual(r,saved);assert.throws(()=>seasonFrame(r,0,0));
});
