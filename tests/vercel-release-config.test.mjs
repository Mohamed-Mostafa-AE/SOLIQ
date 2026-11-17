import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const config=JSON.parse(await readFile(resolve(root,'vercel.json'),'utf8'));
const evidenceUrls=[
 '/api/sessions',
 '/api/farms',
 '/api/evidence/jobs',
 '/api/evidence/jobs/:id',
 '/api/runs',
 '/api/runs/:id',
 '/api/runs/:id/replay',
 '/api/receipts/:id',
];

async function serverlessEntries(directory){
 const files=await readdir(directory,{withFileTypes:true});
 const nested=await Promise.all(files.map(async file=>{
  if(file.isDirectory())return serverlessEntries(resolve(directory,file.name));
  return file.name.endsWith('.js')?[file.name]:[];
 }));
 return nested.flat();
}

test('Hobby release stays below its 12-function deployment budget',async()=>{
 const entries=await serverlessEntries(resolve(root,'api'));
 assert.ok(entries.length<=12,`Expected at most 12 serverless functions, found ${entries.length}`);
});

test('Every legacy evidence endpoint is retained through the shared gateway',()=>{
 for(const source of evidenceUrls){
  const matches=(config.rewrites??[]).filter(rewrite=>rewrite.source===source);
  assert.equal(matches.length,1,`Missing or ambiguous evidence rewrite: ${source}`);
  assert.ok(matches[0].destination.startsWith('/api/evidence?__evidenceRoute='),source);
 }
 assert.equal(config.git.deploymentEnabled.main,true);
 assert.equal(config.git.deploymentEnabled['release/soil-iq-unified-20261116'],true);
});
