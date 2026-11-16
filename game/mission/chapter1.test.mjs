import test from 'node:test';
import assert from 'node:assert/strict';
import { Chapter1Mission } from './chapter1.js';

const previous = (activeOutcome = 'equilibrium', overrides = {}) => ({
  activeOutcome,
  flags: {
    soilCoverChoice: 'living_cover',
    hassanStance: 'cooperative',
    maryamStance: 'cover_advocate',
    cropHypothesis: 'cover_first',
    ...overrides,
  },
});

test('chapter one is locked until a real Chapter 0 story decision, without treating it as NASA evidence', () => {
  const mission = new Chapter1Mission(previous('none'));
  assert.equal(mission.start(), false);
  assert.equal(mission.phase, 'locked');
  assert.throws(() => mission.commit(), /Chapter 0/i);
  const open = new Chapter1Mission(previous('equilibrium'));
  assert.equal(open.start(), true);
  assert.equal(open.phase, 'planning');
  assert.equal(open.getComparison().evidenceClass, 'SIMULATED');
  assert.equal(open.getComparison().weatherSource, 'UNAVAILABLE');
});

test('two editable two-season crop calendars produce different transparent game-only water and cover trade-offs', () => {
  const mission = new Chapter1Mission(previous());
  mission.start();
  const before = mission.getComparison();
  assert.equal(before.plans.length, 2);
  assert.equal(before.plans[0].seasons.length, 2);
  assert.ok(before.plans[0].totalDemand < before.plans[1].totalDemand);
  assert.ok(before.plans[0].coverScore > before.plans[1].coverScore);
  mission.editSlot('B', 0, 0, 'cover');
  const after = mission.getComparison();
  assert.ok(after.plans[1].totalDemand < before.plans[1].totalDemand);
  assert.ok(after.plans[1].coverScore > before.plans[1].coverScore);
  assert.deepEqual(before.plans[0], after.plans[0], 'editing B cannot mutate A');
});

test('earlier Chapter 0 bottleneck affects fictional Chapter 1 budget and tail-end risk', () => {
  const supported = new Chapter1Mission(previous('equilibrium'));
  const constrained = new Chapter1Mission(previous('bottleneck'));
  supported.start(); constrained.start();
  assert.ok(supported.getComparison().supplyPerSeason > constrained.getComparison().supplyPerSeason);
  assert.ok(supported.getComparison().plans[1].shortfall < constrained.getComparison().plans[1].shortfall);
  constrained.chooseStrategy('head_first');
  const head = constrained.getComparison();
  constrained.chooseStrategy('balanced');
  const fair = constrained.getComparison();
  assert.ok(fair.plans[1].fairness > head.plans[1].fairness);
  assert.ok(head.plans[1].tailUnmet > fair.plans[1].tailUnmet);
});

test('chapter one records a consequence/replay and never mints field advice or calibrated yield', () => {
  const mission = new Chapter1Mission(previous('deferral', { cropHypothesis: 'deferred_for_nasa' }));
  mission.start();
  mission.choosePlan('B');
  mission.chooseStrategy('tail_buffer');
  mission.choosePriority('soil');
  const result = mission.commit();
  assert.equal(result.evidenceClass, 'SIMULATED');
  assert.equal(result.previousOutcome, 'deferral');
  assert.equal(result.planId, 'B');
  assert.match(result.disclaimer, /not.*NASA.*observation/i);
  assert.equal(result.hasRealWorldRecommendation, false);
  assert.equal(result.fieldMeasurement, null);
  assert.equal(mission.phase, 'result');
  assert.throws(() => mission.editSlot('B', 0, 0, 'cash'), /planning/i);
  mission.replay();
  assert.equal(mission.phase, 'planning');
  assert.equal(mission.getComparison().plans.length, 2);
  assert.equal(JSON.stringify(mission.getComparison()).toLowerCase().includes('latitude'), false);
});

test('chapter one rejects invalid/tampered crop, strategy and priorities', () => {
  const mission = new Chapter1Mission(previous());
  mission.start();
  assert.throws(() => mission.editSlot('fake', 0, 0, 'cover'), /plan/i);
  assert.throws(() => mission.editSlot('A', 2, 0, 'cover'), /season/i);
  assert.throws(() => mission.editSlot('A', 0, 3, 'cover'), /plot/i);
  assert.throws(() => mission.editSlot('A', 0, 0, 'miracle_crop'), /crop/i);
  assert.throws(() => mission.chooseStrategy('magic_water'), /strategy/i);
  assert.throws(() => mission.choosePriority('yield_guarantee'), /priority/i);
});
