import test from 'node:test';
import assert from 'node:assert/strict';
import { Chapter3SoilMission } from './chapter3.js';

const chapter2 = ending => ({
  phase: 'result', result: {
    chapter: 2, ending, sourceClass: 'SIMULATED', readyForFieldAdvice: false,
    councilTrust: ending === 'evidence_pause' ? 3 : 1, previousPlanId: 'B',
  },
});

test('Chapter 3 cannot be played before the evidence-gap decision is complete', () => {
  assert.throws(() => new Chapter3SoilMission({phase: 'classify'}), /Finish Chapter 2/);
  assert.equal(new Chapter3SoilMission(chapter2('evidence_pause')).phase, 'planning');
});

test('each soil-cover and irrigation choice changes two fictional plots but never measured data', () => {
  const game = new Chapter3SoilMission(chapter2('fictional_trial'));
  const before = game.compare();
  assert.equal(before.evidenceClass, 'SIMULATED');
  assert.equal(before.salinityEvidence, 'UNAVAILABLE');
  assert.equal(before.soilMeasurement, null);
  game.setPractice('head', 'living_cover');
  const changed = game.compare();
  assert.notEqual(changed.coverTokens, before.coverTokens);
  assert.notEqual(changed.livelihoodTokens, before.livelihoodTokens);
  game.setTurn('single_fast');
  assert.notEqual(game.compare().runoffRiskTokens, changed.runoffRiskTokens);
  const soilScore = game.compare().narrativeScore;
  game.setPriority('livelihood');
  assert.notEqual(game.compare().narrativeScore, soilScore);
  assert.throws(() => game.setPractice('head', '__proto__'), /Unknown/);
  assert.throws(() => game.setTurn('actual_nasa_irrigation'), /Unknown/);
});

test('work budget prevents impossible all-benefits strategy, and alternative outcomes differ', () => {
  const impossible = new Chapter3SoilMission(chapter2('evidence_pause'));
  impossible.setPractice('head', 'living_cover');
  impossible.setPractice('tail', 'living_cover');
  impossible.setTurn('gentle_pulses');
  assert.equal(impossible.compare().canCommit, false);
  assert.throws(() => impossible.commit(), /work-token budget/);

  impossible.setPractice('tail', 'bare_fallow');
  const balanced = impossible.commit();
  assert.equal(balanced.evidenceClass, 'SIMULATED');
  assert.equal(balanced.realWorldRecommendation, false);
  assert.equal(balanced.ending, 'prepared_for_measurement');
  assert.deepEqual(balanced.missingEvidence,
    ['local_infiltration_test', 'local_soil_salinity_check', 'dated_nasa_weather']);

  const rushed = new Chapter3SoilMission(chapter2('fictional_trial'));
  rushed.setPractice('head', 'bare_fallow');
  rushed.setPractice('tail', 'bare_fallow');
  rushed.setTurn('single_fast');
  const risky = rushed.commit();
  assert.equal(risky.ending, 'runoff_warning');
  assert.notEqual(risky.runoffRiskTokens, balanced.runoffRiskTokens);

  const samePriorDifferentChoice = new Chapter3SoilMission(chapter2('evidence_pause'));
  samePriorDifferentChoice.setPractice('head', 'bare_fallow');
  samePriorDifferentChoice.setPractice('tail', 'bare_fallow');
  samePriorDifferentChoice.setTurn('single_fast');
  assert.equal(samePriorDifferentChoice.commit().ending, 'runoff_warning');
  assert.notEqual(samePriorDifferentChoice.result.ending, balanced.ending,
    'Chapter 3 choices must matter even after Chapter 2 elected to pause for evidence');
});

test('planner is deterministic, replayable, self-contained and does not alter Chapter 2', () => {
  const previous = chapter2('fictional_trial');
  const serialized = JSON.stringify(previous);
  const game = new Chapter3SoilMission(previous);
  game.setPractice('tail', 'mulch');
  const first = game.compare();
  assert.deepEqual(first, game.compare());
  game.commit();
  assert.throws(() => game.setTurn('gentle_pulses'), /planning/);
  game.replay();
  assert.equal(game.phase, 'planning');
  assert.equal(game.result, null);
  assert.deepEqual(game.compare(), first);
  assert.equal(JSON.stringify(previous), serialized);
});
