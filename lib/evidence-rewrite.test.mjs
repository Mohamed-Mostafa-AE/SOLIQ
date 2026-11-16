import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEvidenceRequestUrl} from './evidence-rewrite.js';

test('evidence gateway preserves legacy paths and receipt format queries',()=>{
 assert.equal(normalizeEvidenceRequestUrl('/api/sessions'),'/api/sessions');
 assert.equal(normalizeEvidenceRequestUrl('/api/evidence?__evidenceRoute=/api/runs/abc/replay'),'/api/runs/abc/replay');
 assert.equal(normalizeEvidenceRequestUrl('/api/evidence?__evidenceRoute=/api/receipts/r123&format=pdf'),'/api/receipts/r123?format=pdf');
 assert.equal(normalizeEvidenceRequestUrl('/api/evidence/jobs/job-001'),'/api/evidence/jobs/job-001');
});

test('evidence gateway will not forward arbitrary or malformed paths',()=>{
 for(const path of ['/api/evidence','/api/evidence?__evidenceRoute=/api/trends','/api/evidence?__evidenceRoute=/api/runs/abc/else','/api/../admin']){
  assert.equal(normalizeEvidenceRequestUrl(path),null,path);
 }
});
