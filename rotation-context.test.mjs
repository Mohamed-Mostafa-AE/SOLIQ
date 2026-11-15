import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, demoWeather } from './engine.js';
import { projectSeason } from './outlook-core.js';
import { defaultFarmContext, readFarmContext, soilCapacity, contextStrategies, rotationDecisionCards, conditionalOrder } from './rotation-context.js';
import { farmContextFields, decisionCardsView } from './farm-context-view.js';
import { readOptions } from './lib/outlook-service.js';
const weather=demoWeather(2026).slice(0,210);
const history=Object.fromEntries(Array.from({length:10},(_,i)=>[2016+i,demoWeather(2016+i)]));
function reviewed(){const c=defaultFarmContext();c.baselineConfirmed=true;c.domain='non_flooded';c.soil={...c.soil,origin:'measured',source:'Lab sample A',date:'2026-01-05'};c.checks=c.checks.map(()=>({seed:'yes',equipment:'yes',market:'yes',local:'yes'}));return c;}
test('whole-soil volumetric measurements produce mm with no double rock correction',()=>{
 const c=reviewed();c.soil={...c.soil,depthCm:100,fieldCapacityPct:30,wiltingPointPct:15};
 assert.equal(soilCapacity(readFarmContext(c)),150);
 assert.equal(readOptions({context:JSON.stringify(c),capacity:300}).capacity,150);
 c.soil.wiltingPointPct=35;assert.throws(()=>readFarmContext(c),/exceed/);
 c.soil.wiltingPointPct=null;assert.throws(()=>readFarmContext(c),/together/);
});
test('unreviewed and infeasible strategies cannot enter the conditional preference order',()=>{
 const projection=projectSeason(weather,history,DEFAULTS),unknown=defaultFarmContext();
 assert.deepEqual(conditionalOrder(rotationDecisionCards(weather,projection,unknown),projection,'water'),[]);
 const context=reviewed();context.checks[1].market='no';
 const cards=rotationDecisionCards(weather,projection,context);
 assert.equal(cards[1].status,'excluded');assert.ok(!conditionalOrder(cards,projection,'water').includes('R1'));
});
test('edited baseline reaches the physics and identical alternatives are flagged',()=>{
 const context=reviewed();context.calendars[0]=Array(12).fill('fallow');context.calendars[1]=[...context.calendars[0]];
 const projection=projectSeason(weather,history,DEFAULTS,contextStrategies(context));
 const cards=rotationDecisionCards(weather,projection,context);
 assert.equal(projection.results[0].coverDays,0);assert.equal(cards[0].plannedFallowDays,365);
 assert.equal(cards[0].rainDuringPlannedFallowMm,weather.reduce((s,r)=>s+r.rain,0));
 assert.ok(cards[1].missing.includes('distinct_calendar'));assert.equal(cards[1].status,'needs_review');
});
test('farmer priority changes ordering without changing physical model outputs',()=>{
 const context=reviewed(),projection=projectSeason(weather,history,DEFAULTS,contextStrategies(context));
 const before=JSON.stringify(projection);const cards=rotationDecisionCards(weather,projection,context);
 const order=conditionalOrder(cards,projection,'cover');const min=Math.min(...cards.map(c=>c.plannedFallowDays));
 assert.equal(cards.find(c=>c.id===order[0]).plannedFallowDays,min);assert.equal(JSON.stringify(projection),before);
});
test('unsupported water processes block the outlook and malformed context is rejected',()=>{
 const context=reviewed();context.domain='unsupported';assert.throws(()=>readOptions({context}),/model domain/);
 for(const edit of [c=>c.calendars[1][0]='__proto__',c=>c.checks[0].market='probably',c=>c.baselineConfirmed='true']){const c=reviewed();edit(c);assert.throws(()=>readFarmContext(c));}
});
test('six-part cards and Arabic fields preserve unknowns and escape soil source text',()=>{
 const c=defaultFarmContext();c.soil.source='<img src=x onerror=alert(1)>';
 const html=farmContextFields(c,'ar');assert.ok(html.includes('تربتك'));assert.ok(!html.includes('<img src=x'));
 const projection=projectSeason(weather,history,DEFAULTS);const cards=rotationDecisionCards(weather,projection,c);
 const rendered=decisionCardsView({decisionCards:cards,conditionalComparison:{eligibleOrder:[]}},'en');
 for(const label of ['Why it appears','Supporting evidence','Possible soil benefits','Information gaps','Risks and limits','Review with an agronomist'])assert.ok(rendered.includes(label));
 assert.ok(rendered.includes('not confirmed bare ground'));
});
