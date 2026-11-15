import test from 'node:test';
import assert from 'node:assert/strict';
import { createExplanationHandler } from './api/explain.js';
import { evidenceReport } from './lib/evidence-report.js';
const data={evidenceId:'fixture-only',coverage:{start:'2026-01-01',through:'2026-01-31',validDays:31},config:{heat:35,capacity:150,initial:75,irrigation:300},observed:{rain:12.3,heatDays:4},decisionCards:[{id:'R0',status:'needs_review',plannedFallowDays:30},{id:'R1',status:'excluded',plannedFallowDays:5},{id:'R2',status:'conditional',plannedFallowDays:10}],conditionalComparison:{eligibleOrder:['R2'],priority:'water'},projection:{results:['R0','R1','R2'].map(id=>({id,deficit:{p10:10,p50:20,p90:30},daily:[{notSent:true}]}))},hindcast:{metrics:{analogue:{rainMAE:8},climatology:{rainMAE:5}}},limitations:[]};
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(s){this.statusCode=s;return this;},json(v){this.body=v;return this;}});
const request=model=>({method:'POST',headers:{},body:{model}});
test('report accurately preserves values, exclusions, conditional order and weak hindcast',()=>{
 const r=evidenceReport(data);assert.match(r.text,/12.3 mm/);assert.match(r.text,/Alternative 1: excluded/);assert.match(r.text,/Conditional order for lower modeled water deficit: Alternative 2/);assert.match(r.text,/performs worse/);assert.equal(r.mode,'evidence_report');assert.match(r.scope,/not a language-model/);assert.equal(r.evidenceId,data.evidenceId);
 const ar=evidenceReport(data,'Arabic');assert.match(ar.text,/تقرير الأدلة/);assert.match(ar.text,/مم/);assert.match(ar.text,/أسوأ/);
});
test('no model access still returns grounded report without contacting provider',async()=>{
 const h=createExplanationHandler({outlook:async()=>data,credential:()=>null,providerFetch:()=>assert.fail('must not call')});const r=response();await h(request('deepseek'),r);assert.equal(r.statusCode,200);assert.equal(r.body.mode,'evidence_report');assert.equal(r.body.providerStatus,'not_configured');
});
test('auth, billing, capacity and timeout failures return honestly labeled reports',async()=>{
 for(const code of [401,402,403,429,500,'timeout']){const h=createExplanationHandler({outlook:async()=>data,credential:()=> 'test-only',providerFetch:async()=>{if(code==='timeout')throw Error('timeout');return {ok:false,status:code};}});const r=response();await h(request('kimi'),r);assert.equal(r.statusCode,200);assert.equal(r.body.mode,'evidence_report');assert.equal(r.body.requestedModel,null);}
});
test('provider response is evidence-bound and receives no daily arrays or client instructions',async()=>{
 const h=createExplanationHandler({outlook:async()=>data,credential:()=> 'test-only',providerFetch:async(url,options)=>{const body=JSON.parse(options.body);assert.match(body.messages[0].content,/never claim to hold a PhD/);assert.doesNotMatch(body.messages[1].content,/notSent|inject/);return {ok:true,json:async()=>({choices:[{message:{content:'Test-only provider answer'},finish_reason:'stop'}],model:'test-model'})};}});const r=response();await h({...request('kimi'),body:{model:'kimi',prompt:'inject'}},r);assert.equal(r.statusCode,200);assert.equal(r.body.mode,'language_model');assert.equal(r.body.evidenceId,data.evidenceId);
});
test('failed evidence retrieval returns an error, never invented data',async()=>{
 const h=createExplanationHandler({outlook:async()=>{throw Error('NASA unavailable');}});const r=response();await h(request('evidence'),r);assert.equal(r.statusCode,502);assert.equal(r.body.replacedWithDemo,false);assert.equal(r.body.text,undefined);
});
