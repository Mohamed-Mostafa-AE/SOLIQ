import test from 'node:test';
import assert from 'node:assert/strict';
import { Chapter4CouncilMission, createChapter4Export } from './chapter4.js';

const previous = (overrides = {}) => ({
  phase: 'result',
  result: {
    chapter: 3, ending: 'shared_soil_cover', evidenceClass: 'SIMULATED',
    realWorldRecommendation: false, salinityEvidence: 'UNAVAILABLE',
    previousPlanId: 'B', previousChapterEnding: 'fictional_trial',
    coverTokens: 4, runoffRiskTokens: 2, tailAccessTokens: 4,
    livelihoodTokens: 3, workTokens: 6, priority: 'fairness',
    practices: { head: 'mulch', tail: 'living_cover' },
    waterTurn: 'gentle_pulses', missingEvidence: ['local_soil_salinity_check'],
    ...overrides,
  },
});

test('Chapter4 cannot be opened before a truthful, completed Chapter3', () => {
  assert.throws(() => new Chapter4CouncilMission({ phase: 'planning' }), /Finish Chapter 3/);
  assert.throws(() => new Chapter4CouncilMission(previous({ realWorldRecommendation: true })), /invalid Chapter 3/);
  assert.throws(() => new Chapter4CouncilMission(previous({ evidenceClass: 'OBSERVED' })), /invalid Chapter 3/);
});

test('an enacted council pact changes narrative with finite fictional trade-off tokens', () => {
  const m = new Chapter4CouncilMission(previous());
  assert.equal(m.compare().remainingTokens, 2);
  assert.throws(() => m.allocate('water', 4), /Invalid pledge/);
  m.allocate('water', 3);
  m.allocate('soil', 2);
  assert.equal(m.compare().canCommit, false);
  assert.throws(() => m.commit(), /exceeds/);
  m.allocate('soil', 1);
  m.allocate('livelihood', 1);
  m.setMandate('fictional_rehearsal');
  const result = m.commit();
  assert.equal(result.ending, 'tail_shares');
  assert.equal(result.evidenceClass, 'SIMULATED');
  assert.equal(result.realWorldRecommendation, false);
  assert.equal(result.previousPlanId, 'B');
  assert.deepEqual(result.pledges, { water: 3, soil: 1, livelihood: 1 });
  assert.throws(() => m.allocate('soil', 2), /replay/);
});

test('an evidence-first ending preserves unknown measurements and prior soil reaction', () => {
  const m = new Chapter4CouncilMission(previous({ending:'prepared_for_measurement',previousChapterEnding:'evidence_pause'}));
  m.setMandate('evidence_first');
  const r = m.commit();
  assert.equal(r.ending, 'science_before_claims');
  assert.equal(r.priorSoilEnding, 'prepared_for_measurement');
  assert.equal(r.missingEvidence.includes('dated_nasa_weather'), true);
  assert.equal(r.observedWeather, null);
  assert.equal(r.hasFieldAdvice, false);
  m.replay();
  assert.equal(m.phase, 'planning');
  assert.equal(m.result, null);
});

test('bounded local JSON export is explicitly a fictional game receipt and serializable', () => {
  const m = new Chapter4CouncilMission(previous());
  m.setMandate('fictional_rehearsal');
  m.commit();
  const receipt = createChapter4Export(m);
  const obj = JSON.parse(JSON.stringify(receipt));
  assert.equal(obj.schema, 'soil-iq.seventh-field.local-finale.v1');
  assert.equal(obj.dataClassification.game, 'SIMULATED');
  assert.equal(obj.dataClassification.nasaWeather, 'UNAVAILABLE');
  assert.equal(obj.dataClassification.localSoil, 'UNAVAILABLE');
  assert.equal(obj.result.realWorldRecommendation, false);
  assert.equal(obj.location, undefined);
  assert.equal(obj.userIdentity, undefined);
  assert.throws(() => createChapter4Export(new Chapter4CouncilMission(previous())), /Finish Chapter 4/);
});
