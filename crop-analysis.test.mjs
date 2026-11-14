import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, STRATEGIES, demoWeather } from './engine.js';
import { PROFILES, defaultScreening, stageCoefficient, screenCrops } from './crop-analysis.js';
import { cropAnalyzerView } from './crop-analysis-view.js';

const weather=demoWeather(2024);
function confirmed(){const plan=defaultScreening(2024);plan.soilConfirmed=true;Object.values(plan.checks).forEach(check=>Object.keys(check).forEach(key=>check[key]='yes'));return plan;}

test('stage coefficients follow initial, development, middle and late segments',()=>{
  const durations=[20,30,40,30],kc=[.3,1.2,.35];
  assert.equal(stageCoefficient(0,durations,kc),.3);
  assert.equal(stageCoefficient(20,durations,kc),.3);
  assert.ok(Math.abs(stageCoefficient(35,durations,kc)-.75)<1e-12);
  assert.equal(stageCoefficient(50,durations,kc),1.2);
  assert.equal(stageCoefficient(90,durations,kc),1.2);
  assert.ok(stageCoefficient(119,durations,kc)>.35);
  assert.equal(stageCoefficient(120,durations,kc),null);
});

test('unknown constraints and synthetic forcing cannot generate a shortlist',()=>{
  const out=screenCrops(weather,DEFAULTS,defaultScreening(2024),STRATEGIES[0]);
  assert.equal(out.shortlist.length,0);assert.equal(out.results.length,6);
  assert.ok(out.results.every(row=>row.status==='needs_review'&&row.missing.includes('observed_weather')));
  assert.equal(screenCrops(weather,DEFAULTS,confirmed(),STRATEGIES[0],'synthetic').shortlist.length,0);
});

test('explicit market, seed, equipment and local-review refusals exclude candidates',()=>{
  for(const key of ['market','seed','equipment','local']){
    const plan=confirmed();plan.checks.soybean[key]='no';
    const out=screenCrops(weather,DEFAULTS,plan,STRATEGIES[0],'import');
    const soybean=out.results.find(row=>row.id==='soybean');
    assert.equal(soybean.status,'excluded');assert.equal(soybean.metrics,undefined);
    assert.ok(!out.shortlist.includes('soybean'));assert.deepEqual(soybean.excluded,[key]);
  }
});

test('unsupported soil/water processes block simulation and ranking',()=>{
  const plan=confirmed();plan.unsupportedProcesses=true;
  const out=screenCrops(weather,DEFAULTS,plan,STRATEGIES[0],'nasa');
  assert.equal(out.shortlist.length,0);assert.equal(out.baselineResult.modeled,false);
  assert.ok(out.results.every(row=>row.status==='excluded'&&!row.metrics));
});

test('confirmed options are ordered by the declared criterion only',()=>{
  const out=screenCrops(weather,DEFAULTS,confirmed(),STRATEGIES[0],'import');
  const deficits=out.shortlist.map(id=>out.results.find(row=>row.id===id).metrics.deficit);
  assert.deepEqual(deficits,[...deficits].sort((a,b)=>a-b));
  const plan=confirmed();plan.objective='family';
  const family=screenCrops(weather,DEFAULTS,plan,STRATEGIES[0],'import');
  assert.ok(['soybean','sunflower'].includes(family.shortlist[0]));
  assert.equal(out.status,'conditional_comparison');
});

test('water is conserved daily and independently across the entire horizon',()=>{
  for(const capacity of [30,150,400])for(const irrigation of [0,300,1000]){
    const config={...DEFAULTS,capacity,initial:capacity/2,irrigation};
    for(const row of screenCrops(weather,config,confirmed(),STRATEGIES[0],'import').results){
      const m=row.metrics;
      assert.ok(m.maxResidual<1e-9);assert.ok(m.irrigation<=irrigation+1e-9);
      assert.ok(m.daily.every(day=>day.storage>=0&&day.storage<=capacity+1e-9));
      assert.ok(Math.abs(m.finalStorage-config.initial-m.rain+m.runoff-m.irrigation+m.drainage+m.actual)<1e-8);
    }
  }
});

test('baseline profile exactly reproduces baseline water outputs',()=>{
  const plan=confirmed();const out=screenCrops(weather,DEFAULTS,plan,STRATEGIES[0],'import');
  const same=out.results.find(row=>row.id===plan.baseline);
  assert.deepEqual(same.metrics,out.baselineResult);assert.equal(same.baselineDifference,0);
  assert.equal(same.metrics.daily.find(day=>day.date===plan.start).crop,plan.baseline);
  assert.equal(same.metrics.daily[0].crop,'wheat');
});

test('stage changes never silently extend beyond the available year',()=>{
  for(const override of [{start:'2024-02-30'},{start:'2025-01-01'},{start:'2024-12-01'},{stages:[0,30,40,30]},{stages:[20.5,30,40,30]}]){
    assert.throws(()=>screenCrops(weather,DEFAULTS,{...confirmed(),...override},STRATEGIES[0],'import'));
  }
});

test('unknown provenance and malformed confirmations cannot pass evidence gates',()=>{
  assert.throws(()=>screenCrops(weather,DEFAULTS,confirmed(),STRATEGIES[0],'trusted'));
  const plan=confirmed();plan.soilConfirmed='false';assert.throws(()=>screenCrops(weather,DEFAULTS,plan,STRATEGIES[0],'nasa'));
  const next=confirmed();next.checks.maize.market='maybe';assert.throws(()=>screenCrops(weather,DEFAULTS,next,STRATEGIES[0],'nasa'));
});

test('Arabic crop analyzer renders actual names and exposes the validation limits',()=>{
  const plan=confirmed(),report=screenCrops(weather,DEFAULTS,plan,STRATEGIES[0],'import');
  const html=cropAnalyzerView({config:DEFAULTS,plan,report,language:'ar'},{esc:String,fmt:String});
  assert.ok(html.includes('فول صويا'));assert.ok(html.includes('ليست فترات ثقة'));
  assert.ok(html.includes('crop-screen-form'));assert.equal(PROFILES.length,6);
});
