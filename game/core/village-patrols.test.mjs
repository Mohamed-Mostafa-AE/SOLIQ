import test from 'node:test';
import assert from 'node:assert/strict';
import {createVillagePatrols, advanceVillagePatrols, VILLAGER_PATROL_ROUTES} from './village-patrols.js';

function runSeconds(seconds, opts = {}) {
  let state = createVillagePatrols();
  for (let i = 0; i < seconds * 20; i++) state = advanceVillagePatrols(state, 0.05, opts);
  return state;
}

test('villagers begin at authored gate anchors and actually walk along bounded routes', () => {
  const start = createVillagePatrols();
  const end = runSeconds(5);
  for (const id of ['hassan', 'maryam']) {
    assert.deepEqual(start[id].position, VILLAGER_PATROL_ROUTES[id][0]);
    assert.notDeepEqual(end[id].position, start[id].position);
    assert.ok(['walk', 'idle'].includes(end[id].motion));
  }
  assert.deepEqual(createVillagePatrols(), start, 'pure state must not be mutated');
});

test('deterministic closed routes never wander outside small local gate areas', () => {
  let state = createVillagePatrols();
  for (let frame = 0; frame < 4000; frame++) {
    state = advanceVillagePatrols(state, 0.05);
    for (const id of ['hassan', 'maryam']) {
      const route = VILLAGER_PATROL_ROUTES[id];
      assert.ok(state[id].position.x >= Math.min(...route.map(p => p.x)) - 1e-9);
      assert.ok(state[id].position.x <= Math.max(...route.map(p => p.x)) + 1e-9);
      assert.ok(state[id].position.z >= Math.min(...route.map(p => p.z)) - 1e-9);
      assert.ok(state[id].position.z <= Math.max(...route.map(p => p.z)) + 1e-9);
    }
  }
  assert.deepEqual(runSeconds(5), runSeconds(5));
});

test('dialogue and reduced motion pause NPC travel without a large tab-resume leap', () => {
  const before = runSeconds(3);
  const talk = advanceVillagePatrols(before, 0.05, {pauseIds: ['hassan']});
  assert.deepEqual(talk.hassan.position, before.hassan.position);
  assert.equal(talk.hassan.motion, 'idle');
  assert.notDeepEqual(talk.maryam, before.maryam);
  const still = advanceVillagePatrols(before, 0.05, {reducedMotion:true});
  assert.deepEqual(still.hassan.position, before.hassan.position);
  assert.deepEqual(still.maryam.position, before.maryam.position);
  const resumed = advanceVillagePatrols(before, 30);
  const maxStep = 0.85 * 0.05 + 1e-6;
  assert.ok(Math.hypot(resumed.hassan.position.x - before.hassan.position.x,
    resumed.hassan.position.z - before.hassan.position.z) <= maxStep);
  assert.throws(() => advanceVillagePatrols(before, -1), /nonnegative finite/);
});
