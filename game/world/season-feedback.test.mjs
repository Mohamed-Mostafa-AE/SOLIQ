import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SeasonFeedbackEngine, SEASONAL_FEEDBACK_STATUS } from './season-feedback.js';

function createMockVillage() {
  const fields = [
    { id: 'f1', crop: 'wheat', demand: 35, hydration: 0.1 },
    { id: 'f2', crop: 'berseem', demand: 45, hydration: 0.1 },
    { id: 'f3', crop: 'rice', demand: 60, hydration: 0.1 },
    { id: 'f4', crop: 'corn', demand: 40, hydration: 0.1 },
    { id: 'f5', crop: 'beans', demand: 25, hydration: 0.1 },
    { id: 'f6', crop: 'wheat', demand: 30, hydration: 0.1 },
    { id: 'f7', crop: 'future_echo', demand: 0, hydration: 0.0 },
  ];
  return {
    fields,
    palms: [
      { trunk: { rotation: { z: 0 } }, fronds: [{ rotation: { x: 0.45 } }] },
    ],
    updateCalls: [],
    updateFieldHydration(idx, h, s) {
      this.updateCalls.push({ idx, h, s });
      if (this.fields[idx]) {
        this.fields[idx].hydration = h;
        this.fields[idx].salinity = s;
      }
    },
  };
}

test('SeasonFeedbackEngine initializes field states with simulated labels', () => {
  const village = createMockVillage();
  const engine = new SeasonFeedbackEngine(village, {});

  const feedbacks = engine.getAllFieldFeedbacks();
  assert.equal(feedbacks.length, 7);
  assert.equal(engine.getFieldFeedback('f1').crop, 'wheat');
  assert.equal(engine.getFieldFeedback('f2').crop, 'berseem');
});

test('applyIrrigationOutcome sets thriving posture for well-irrigated fields and wilted for dry shortfall', () => {
  const village = createMockVillage();
  const engine = new SeasonFeedbackEngine(village, {});

  // Simulate outcome: f1 fully supplied (35m3), f2 deficit (10m3 of 45), f3 zero water (0m3 of 60)
  const outcome = engine.applyIrrigationOutcome({
    delivered: [35, 10, 0, 40, 25, 30],
    shortfall: [0, 35, 60, 0, 0, 0],
  });

  assert.equal(outcome.status, SEASONAL_FEEDBACK_STATUS);
  assert.equal(outcome.evidenceClass, 'simulated');
  assert.equal(outcome.realMeasurementCertified, false);

  const f1 = engine.getFieldFeedback('f1');
  assert.equal(f1.posture, 'thriving');
  assert.equal(f1.delivered, 35);

  const f2 = engine.getFieldFeedback('f2');
  assert.equal(f2.posture, 'stressed');

  const f3 = engine.getFieldFeedback('f3');
  assert.equal(f3.posture, 'wilted');
  assert.ok(f3.salinity > 0.3, 'severe unwashed shortfall increases simulated salinity efflorescence risk');

  assert.equal(village.updateCalls.length, 6);
  assert.ok(village.updateCalls[0].h >= 0.99);
  assert.ok(village.updateCalls[2].h === 0);
});

test('tick applies environmental wind sway and respects reducedMotion option', () => {
  const village = createMockVillage();
  const engine = new SeasonFeedbackEngine(village, {}, { reducedMotion: false });

  engine.tick(0.5);
  const initialZ = village.palms[0].trunk.rotation.z;
  assert.notEqual(initialZ, 0, 'wind sway should rotate trunk');

  // Now enable reduced motion
  engine.setReducedMotion(true);
  const frozenZ = village.palms[0].trunk.rotation.z;
  engine.tick(1.0);
  assert.equal(village.palms[0].trunk.rotation.z, frozenZ, 'reduced motion must freeze wind sway');
});
