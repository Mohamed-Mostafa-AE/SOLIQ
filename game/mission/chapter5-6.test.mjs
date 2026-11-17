import test from 'node:test';
import assert from 'node:assert/strict';
import { Chapter5WaterTurns, Chapter6FutureMission, createChapter6StoryExport } from './chapter5-6.js';

const council = (overrides = {}) => ({
  phase: 'result',
  result: {
    chapter: 4, ending: 'difficult_balance', mandate: 'fictional_rehearsal',
    pledges: { water: 2, soil: 2, livelihood: 1 },
    previousPlanId: 'B', priorSoilEnding: 'shared_soil_cover',
    evidenceClass: 'SIMULATED', realWorldRecommendation: false,
    observedWeather: null, missingEvidence: ['dated_nasa_weather', 'local_infiltration_test'],
    ...overrides,
  },
});

test('Chapter 5 requires a valid completed fictional Chapter 4, never an invented observation', () => {
  assert.throws(() => new Chapter5WaterTurns({ phase: 'planning' }), /Chapter 4/);
  assert.throws(() => new Chapter5WaterTurns(council({ evidenceClass: 'OBSERVED' })), /invalid Chapter 4/);
  assert.throws(() => new Chapter5WaterTurns(council({ realWorldRecommendation: true })), /invalid Chapter 4/);
  assert.throws(() => new Chapter5WaterTurns(council({ pledges: { water: 4, soil: 0, livelihood: 0 } })), /invalid Chapter 4/);
});

test('Three playable canal turns have replayable, distinct and inherited fictional consequences', () => {
  const m = new Chapter5WaterTurns(council());
  assert.equal(m.view().turn, 1);
  assert.equal(m.view().phase, 'turns');
  assert.throws(() => m.choose('invented_weather'), /Invalid canal choice/);
  m.choose('share_turn');
  assert.equal(m.view().turn, 2);
  assert.equal(m.view().scores.tail, 4);
  m.choose('share_turn');
  assert.equal(m.view().turn, 3);
  const first = m.choose('ask_for_records');
  assert.equal(first.chapter, 5);
  assert.equal(first.ending, 'shared_turns');
  assert.deepEqual(first.choices, ['share_turn','share_turn','ask_for_records']);
  assert.equal(first.priorPactEnding, 'difficult_balance');
  assert.equal(first.evidenceClass, 'SIMULATED');
  assert.equal(first.realWorldRecommendation, false);
  assert.equal(first.observedWeather, null);
  assert.throws(() => m.choose('protect_cover'), /replay/);
  m.replay();
  assert.equal(m.view().turn, 1);
  m.choose('protect_cover');
  m.choose('protect_cover');
  const second = m.choose('ask_for_records');
  assert.equal(second.ending, 'covered_ground');
  assert.notDeepEqual(second.scores, first.scores);
});

test('The final chapter preserves the three turns and never asserts an actual field outcome', () => {
  const water = new Chapter5WaterTurns(council({ mandate: 'evidence_first' }));
  water.choose('ask_for_records');
  water.choose('protect_cover');
  water.choose('share_turn');
  const finale = new Chapter6FutureMission(water);
  assert.throws(() => finale.choose('best_crop'), /Invalid future choice/);
  const evidence = finale.choose('seek_evidence');
  assert.equal(evidence.chapter, 6);
  assert.equal(evidence.ending, 'measure_before_action');
  assert.equal(evidence.previousChapterEnding, 'mixed_tradeoffs');
  assert.deepEqual(evidence.canalChoices, ['ask_for_records','protect_cover','share_turn']);
  assert.equal(evidence.dataClassification.nasaWeather, 'UNAVAILABLE');
  assert.equal(evidence.realWorldRecommendation, false);
  const exportPayload = JSON.parse(JSON.stringify(createChapter6StoryExport(finale)));
  assert.equal(exportPayload.schema, 'soil-iq.seventh-field.local-story.v2');
  assert.equal(exportPayload.sourceReceipts.length, 0);
  assert.equal(exportPayload.location, undefined);
  assert.equal(exportPayload.userIdentity, undefined);
  assert.equal(exportPayload.result.ending, 'measure_before_action');
  finale.replay();
  assert.throws(() => createChapter6StoryExport(finale), /Finish Chapter 6/);
  assert.equal(finale.choose('rehearse_together').ending, 'shared_rehearsal');
  assert.throws(() => finale.choose('seek_evidence'), /replay/);
});

test('The finale rejects unfinished or forged water turns', () => {
  const water = new Chapter5WaterTurns(council());
  assert.throws(() => new Chapter6FutureMission(water), /Finish Chapter 5/);
  water.choose('share_turn');water.choose('share_turn');water.choose('share_turn');
  const forged = { phase: 'result', result: { ...water.result, observedWeather: { temperature: 32 } } };
  assert.throws(() => new Chapter6FutureMission(forged), /invalid Chapter 5/);
});
