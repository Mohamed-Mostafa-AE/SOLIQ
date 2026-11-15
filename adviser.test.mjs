import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './api/explain.js';
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(s){this.statusCode=s;return this;},json(v){this.body=v;return this;}};}
test('adviser rejects cross-origin requests before retrieval or provider access',async()=>{
 const res=response();await handler({method:'POST',headers:{origin:'https://attacker.example',host:'soil.example'},body:{model:'deepseek'}},res);
 assert.equal(res.statusCode,403);assert.equal(res.headers['Cache-Control'],'no-store');
});
test('adviser rejects model substitution and oversized requests',async()=>{
 for(const body of [{model:'attacker/model'},{model:'deepseek',context:'x'.repeat(20001)}]){const res=response();await handler({method:'POST',headers:{},body},res);assert.equal(res.statusCode,400);}
});
