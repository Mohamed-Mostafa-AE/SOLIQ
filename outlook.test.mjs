import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, STRATEGIES, demoWeather } from './engine.js';
import { dayRange, parsePowerRange, projectSeason, chooseAnalogues, hindcast, quantile } from './outlook-core.js';
import { readOptions } from './lib/outlook-service.js';
import explain, { explanationEvidence } from './api/explain.js';

function power(rows) {
 const p={T2M_MIN:{},T2M_MAX:{},PRECTOTCORR:{}};
 for(const r of rows){const key=r.date.replaceAll('-','');p.T2M_MIN[key]=r.tmin;p.T2M_MAX[key]=r.tmax;p.PRECTOTCORR[key]=r.rain;}
 return {header:{time_standard:'UTC',fill_value:-999},parameters:{T2M_MIN:{units:'C'},T2M_MAX:{units:'C'},PRECTOTCORR:{units:'mm/day'}},properties:{parameter:p}};
}
const history=Object.fromEntries(Array.from({length:10},(_,i)=>[2016+i,demoWeather(2016+i).map(r=>({...r,rain:r.rain*(i+1)/5,tmax:r.tmax+i/4}))]));
const current=demoWeather(2026).slice(0,200);
test('2026 coverage accepts publication delay but rejects interior gaps and wrong units',()=>{
 const json=power(current);
 assert.equal(parsePowerRange(json,'2026-01-01','2026-07-25',true).length,200);
 assert.throws(()=>parsePowerRange(json,'2026-01-01','2026-07-25'),/Incomplete/);
 delete json.properties.parameter.T2M_MIN['20260102'];
 assert.throws(()=>parsePowerRange(json,'2026-01-01','2026-07-25',true),/Interior/);
 json.parameters.T2M_MIN.units='K';assert.throws(()=>parsePowerRange(json,'2026-01-01','2026-07-25',true),/unit/);
});
test('scenarios retain identical observed forcing and diverge only after its cutoff',()=>{
 const report=projectSeason(current,history,DEFAULTS);
 assert.equal(report.targetYear,2026);assert.equal(report.ensembleSize,5);assert.equal(report.futureDays,165);
 for(const r of report.results){
  assert.equal(r.daily.length,365);
  for(const d of r.daily.slice(0,current.length)){assert.equal(d.projected,false);assert.equal(d.storage.p10,d.storage.p90);}
  assert.equal(r.daily[200].projected,true);assert.ok(r.maxResidual<1e-9);
  for(const d of r.daily){assert.ok(d.storage.p10<=d.storage.p50&&d.storage.p50<=d.storage.p90);assert.ok(d.storage.p10>=0&&d.storage.p90<=DEFAULTS.capacity);}
 }
 assert.ok(report.analogueYears.every(a=>a.year<2026));
});
test('future 2026 weather never enters analogue selection',()=>{
 const before=chooseAnalogues(current,history);
 assert.deepEqual(chooseAnalogues(structuredClone(current),history),before);
 assert.throws(()=>projectSeason(current,{...history,2026:demoWeather(2026)},DEFAULTS),/precede/);
 assert.throws(()=>projectSeason(current.slice(1),history,DEFAULTS),/contiguous/);
});
test('retrospective evaluation reports both analogue and climatology errors without claiming forward validation',()=>{
 const report=hindcast(history,'07-19');assert.equal(report.folds,10);assert.equal(report.notForwardChained,true);
 assert.ok(Number.isFinite(report.metrics.analogue.rainMAE));assert.ok(Number.isFinite(report.metrics.climatology.rainMAE));
 assert.equal(quantile([4,1,2,3],.5),2.5);assert.equal(dayRange('2024-02-28','2024-03-01').length,3);
});
test('server rejects unsupported location and soil assumptions',()=>{
 for(const input of [{lat:85},{lon:181},{capacity:0},{initial:151},{irrigation:-1},{lat:'oops'}])assert.throws(()=>readOptions(input),/Invalid/);
 assert.equal(readOptions({year:2030}).year,2026);
});
test('AI cannot accept an arbitrary model or cross-origin request',async()=>{
 let code,body;const res={setHeader(){},status(c){code=c;return this;},json(b){body=b;return this;}};
 await explain({method:'POST',headers:{host:'soliq.test',origin:'https://other.test'},body:{model:'kimi'}},res);assert.equal(code,403);
 await explain({method:'POST',headers:{host:'soliq.test'},body:{model:'untrusted'}},res);assert.equal(code,400);
 assert.equal(body.error,'Select Kimi or DeepSeek');
});
