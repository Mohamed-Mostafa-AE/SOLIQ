import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULTS,STRATEGIES,demoWeather,analyze} from './engine.js';
import {retrieve,compare} from './walkthrough/model.js';
import handler from './api/trends.js';
test('same-origin year proxy preserves raw bytes and rejects invalid queries without fetching',async(t)=>{
 let calls=0;const raw=JSON.stringify(fixture());t.mock.method(globalThis,'fetch',async url=>{calls++;assert.match(url,/^https:\/\/power.larc.nasa.gov\/api\/temporal\/daily\/point\?/);return new Response(raw);});
 const response=()=>({setHeader(){},status(n){this.statusCode=n;return this;},json(data){this.body=data;return this;},end(data){this.body=data;}});
 const good=response();await handler({method:'GET',query:{mode:'power-year',lat:'31.09',lon:'30.94',year:'2024'}},good);assert.equal(good.statusCode,200);assert.equal(good.body,raw);
 const bad=response();await handler({method:'GET',query:{mode:'power-year',lat:'999',lon:'30',year:'2024'}},bad);assert.equal(bad.statusCode,502);assert.equal(calls,1);assert.equal(bad.body.replacedWithDemo,false);
});
export function fixture(){const rows=demoWeather(2024),parameter={T2M_MIN:{},T2M_MAX:{},PRECTOTCORR:{}};for(const r of rows){const d=r.date.replaceAll('-','');parameter.T2M_MIN[d]=r.tmin;parameter.T2M_MAX[d]=r.tmax;parameter.PRECTOTCORR[d]=r.rain;}return {header:{time_standard:'UTC'},parameters:{T2M_MIN:{units:'C'},T2M_MAX:{units:'C'},PRECTOTCORR:{units:'mm/day'}},properties:{parameter}};}
const config={...DEFAULTS},plans=STRATEGIES.slice(0,2);
test('retrieval preserves exact bytes, date, URL and hash (synthetic transport fixture only)',async()=>{const raw=JSON.stringify(fixture());const r=await retrieve(config,{fetcher:async url=>{assert.match(url,/20240101/);return new Response(raw);}});assert.equal(r.rawResponse,raw);assert.equal(r.coverage.validDays,366);assert.match(r.rawSha256,/^[a-f0-9]{64}$/);assert.ok(r.retrievedAt);});
test('missing units, missing days and HTTP failures fail closed',async()=>{for(const mutate of [x=>delete x.parameters,x=>delete x.properties.parameter.T2M_MIN['20240101']]){const x=fixture();mutate(x);await assert.rejects(retrieve(config,{fetcher:async()=>new Response(JSON.stringify(x))}));}await assert.rejects(retrieve(config,{fetcher:async()=>new Response('',{status:503})}),/503/);});
test('reuse actual engine, immutable provenance, priorities affect only scores; query mismatch rejected',async()=>{const r=await retrieve(config,{fetcher:async()=>new Response(JSON.stringify(fixture()))});const a=compare(r,config,plans);assert.deepEqual(a.outputs.results,analyze(r.weather,config,plans).results);const b=compare(r,{...config,waterWeight:0,coverWeight:100},plans);assert.equal(a.outputs.results[0].deficit,b.outputs.results[0].deficit);assert.notEqual(a.outputs.results[0].score,b.outputs.results[0].score);assert.deepEqual(r.weather,demoWeather(2024));assert.equal(a.sensitivity.scenarios.length,3);assert.equal(a.status,'comparison_only');assert.throws(()=>compare(r,{...config,lat:1},plans),/retrieve again/);assert.throws(()=>compare(null,config,plans));assert.throws(()=>compare(r,config,[plans[0]]));});

