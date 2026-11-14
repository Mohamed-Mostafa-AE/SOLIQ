import test from 'node:test';
import assert from 'node:assert/strict';
import { arabic } from './i18n.js';
import { changedMonths, guidedOverview } from './guided.js';
import { analyze, demoWeather, DEFAULTS, STRATEGIES } from './engine.js';

test('changing crops is derived from actual calendar differences',()=>{
  assert.deepEqual(changedMonths(STRATEGIES[0],STRATEGIES[0]),[]);
  assert.deepEqual(changedMonths(STRATEGIES[0],STRATEGIES[1]),[5,6,7,8,9]);
});

test('Arabic translates critical plain-language copy and preserves identifiers',()=>{
  assert.equal(arabic('Plan your next crop.'),'خطّط لمحصولك القادم.');
  assert.equal(arabic('Wheat'),'قمح');
  assert.equal(arabic('R0 / 2024'),'R0 / 2024');
  assert.equal(arabic('Different crop this month'),'محصول مختلف هذا الشهر');
  assert.equal(arabic('Your current plan'),'خطتك الحالية');
  assert.equal(arabic('Research view'),'العرض البحثي');
  assert.equal(arabic('Daily water budget closes'),'الميزانية المائية اليومية مغلقة حسابياً');
  assert.ok(!arabic('All sequences use 366 days and the same starting water and irrigation budget.').includes('All sequences'));
});

test('guided rendering cannot mutate the shared scientific output',()=>{
  const output=analyze(demoWeather(2024),DEFAULTS);
  const before=JSON.stringify(output);
  const state={config:DEFAULTS,source:{kind:'synthetic'},output,strategies:STRATEGIES,selectedMonth:5,selectedStrategy:1,months:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']};
  const html=guidedOverview(state,{esc:String,fmt:String,progressPanel:()=>''});
  assert.ok(html.includes('Grain legume'));
  assert.ok(html.includes('not predicted plant growth'));
  assert.equal(JSON.stringify(output),before);
});
