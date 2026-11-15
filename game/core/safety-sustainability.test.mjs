import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAFETY_CHECKS, assessPumpReadiness, completeSafetyCheck, sustainabilityLesson,
} from './safety-sustainability.js';

test('pump remains blocked until all three fictional learning checks are recorded', () => {
  let flags = { talkedToHassan: true };
  let assessment = assessPumpReadiness(flags);
  assert.equal(assessment.readyForFictionalMission, false);
  assert.equal(assessment.completed, 0);
  assert.equal(assessment.realWorldApproval, false);
  for (const step of SAFETY_CHECKS) {
    const next = completeSafetyCheck(flags, step.id);
    assert.notEqual(next, flags);
    assert.equal(next.talkedToHassan, true);
    flags = next;
  }
  assessment = assessPumpReadiness(flags);
  assert.equal(assessment.readyForFictionalMission, true);
  assert.equal(assessment.completed, 3);
  assert.equal(assessment.realWorldApproval, false);
});

test('unknown training step fails closed', () => {
  assert.throws(() => completeSafetyCheck({}, 'ignoreSafety'), RangeError);
  assert.equal(assessPumpReadiness({ pumpInspected: 1 }).readyForFictionalMission, false);
});

test('outcome lessons never invent field-validated sustainability achievements', () => {
  for (const outcome of ['equilibrium', 'bottleneck', 'deferral']) {
    const lesson = sustainabilityLesson(outcome, { deliveredTotal: 10, fairness: 0.8 });
    assert.equal(lesson.realWorldImpactVerified, false);
    assert.equal(lesson.evidenceClass, 'simulated');
    assert.ok(lesson.textEn.length > 40);
    assert.equal(lesson.themes.length, 4);
    assert.equal(lesson.metrics.simulatedDeliveredM3, 10);
    assert.equal(lesson.metrics.simulatedJainFairness, 0.8);
  }
  assert.equal(sustainabilityLesson('deferral').metrics, null);
  assert.equal(sustainabilityLesson('equilibrium', { deliveredTotal: NaN, fairness: 1 }).metrics, null);
  assert.throws(() => sustainabilityLesson('invented-success'), RangeError);
});
