import test from 'node:test';
import assert from 'node:assert/strict';
import {newWaterPractice, waterPracticeTarget, interactWaterPractice, chooseWaterPractice} from './water-practice.js';

test('water-can miniquest requires an actual pick-up and a second reachable interaction', () => {
  const start = newWaterPractice();
  assert.equal(start.stage, 'pickup');
  assert.equal(waterPracticeTarget(start), 'practice_can');
  assert.equal(interactWaterPractice(start, 'practice_bed').handled, false);
  const picked = interactWaterPractice(start, 'practice_can');
  assert.equal(picked.handled, true);
  assert.equal(picked.state.hasCan, true);
  assert.equal(start.hasCan, false);
  assert.equal(waterPracticeTarget(picked.state), 'practice_bed');
  const arrived = interactWaterPractice(picked.state, 'practice_bed');
  assert.equal(arrived.event, 'choose_action');
  assert.equal(waterPracticeTarget(arrived.state), null);
});

test('simulated watering and deferral are distinct, valid, replayable choices', () => {
  const picked = interactWaterPractice(newWaterPractice(), 'practice_can').state;
  const ready = interactWaterPractice(picked, 'practice_bed').state;
  assert.equal(chooseWaterPractice(ready, 'invalid').handled, false);
  const water = chooseWaterPractice(ready, 'illustrate_watering');
  const defer = chooseWaterPractice(ready, 'defer');
  assert.equal(water.state.action, 'illustrate_watering');
  assert.equal(defer.state.action, 'defer');
  assert.equal(water.state.stage, 'done');
  assert.equal(defer.state.stage, 'done');
  assert.equal(chooseWaterPractice(water.state, 'defer').handled, false);
  assert.deepEqual(newWaterPractice(), {stage: 'pickup', hasCan: false, action: null});
});
