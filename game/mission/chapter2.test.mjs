import test from 'node:test';
import assert from 'node:assert/strict';
import { Chapter2EvidenceMission, EVIDENCE_CLASSES } from './chapter2.js';

const completedChapter1 = () => ({
  phase: 'result',
  result: {
    ending: 'tail_shortfall', planId: 'B', strategy: 'head_first',
    soilCoverScore: 4, tailUnmet: 3, priority: 'fairness', previousOutcome: 'bottleneck',
  },
});

test('Chapter 2 is gated by actual completion of Chapter 1', () => {
  assert.throws(() => new Chapter2EvidenceMission({ phase: 'planning' }), /Complete Chapter 1/);
  assert.equal(new Chapter2EvidenceMission(completedChapter1()).phase, 'classify');
});

test('three distinct evidence classes must be matched; mistakes cannot fabricate observations', () => {
  const mission = new Chapter2EvidenceMission(completedChapter1());
  assert.equal(mission.classify('power', EVIDENCE_CLASSES.OBSERVED).correct, false);
  assert.equal(mission.classify('soil', EVIDENCE_CLASSES.ASSUMED).correct, true);
  assert.equal(mission.classify('trial', EVIDENCE_CLASSES.SIMULATED).correct, true);
  assert.equal(mission.phase, 'classify');
  assert.throws(() => mission.decide('defer'), /classify all/);
  assert.equal(mission.classify('power', EVIDENCE_CLASSES.UNAVAILABLE).correct, true);
  assert.equal(mission.phase, 'council');
  assert.deepEqual(mission.getProvenance(), {
    power: 'UNAVAILABLE', soil: 'ASSUMED', trial: 'SIMULATED',
  });
});

test('post-puzzle actions have different explicit simulated consequences', () => {
  const before = completedChapter1();
  const cautious = new Chapter2EvidenceMission(before);
  for (const [id, category] of [['power', 'UNAVAILABLE'], ['soil', 'ASSUMED'], ['trial', 'SIMULATED']]) cautious.classify(id, category);
  const deferred = cautious.decide('defer');
  assert.equal(deferred.ending, 'evidence_pause');
  assert.equal(deferred.readyForFieldAdvice, false);
  assert.equal(deferred.sourceClass, 'SIMULATED');
  assert.match(deferred.summary.en, /measurement/);

  const pilot = new Chapter2EvidenceMission(before);
  for (const [id, category] of [['power', 'UNAVAILABLE'], ['soil', 'ASSUMED'], ['trial', 'SIMULATED']]) pilot.classify(id, category);
  const bounded = pilot.decide('fictional_trial');
  assert.equal(bounded.ending, 'fictional_trial');
  assert.notEqual(bounded.councilTrust, deferred.councilTrust);
  assert.equal(bounded.readyForFieldAdvice, false);
  assert.match(bounded.summary.en, /fictional/);
});

test('replay resets puzzle without mutating Chapter 1 or retaining sensitive data', () => {
  const previous = completedChapter1();
  const priorJson = JSON.stringify(previous);
  const mission = new Chapter2EvidenceMission(previous);
  mission.classify('soil', 'ASSUMED');
  mission.replay();
  assert.equal(mission.phase, 'classify');
  assert.equal(mission.getProgress().correct, 0);
  assert.equal(JSON.stringify(previous), priorJson);
  assert.throws(() => mission.classify('power', 'OBSERVED_PRIVATE_LOCATION'), /Invalid/);
});
