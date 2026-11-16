import test from 'node:test';
import assert from 'node:assert/strict';
import { sustainabilityLesson } from './sustainability.js';

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
