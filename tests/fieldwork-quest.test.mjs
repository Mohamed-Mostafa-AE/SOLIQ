import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshFieldworkState, fieldworkTarget, advanceFieldwork, chooseFieldworkCover,
} from '../game/core/fieldwork-quest.js';

test('tool pickup is required before simulated soil inspection', () => {
  const initial = freshFieldworkState();
  assert.equal(fieldworkTarget(initial), 'fieldwork_tool');
  const premature = advanceFieldwork(initial, 'fieldwork_sample');
  assert.equal(premature.handled, false);
  assert.deepEqual(premature.state, initial);
  assert.equal(chooseFieldworkCover(initial, 'straw').handled, false);

  const pickup = advanceFieldwork(initial, 'fieldwork_tool');
  assert.equal(pickup.handled, true);
  assert.equal(pickup.state.hasProbe, true);
  assert.equal(fieldworkTarget(pickup.state), 'fieldwork_sample');

  const inspection = advanceFieldwork(pickup.state, 'fieldwork_sample');
  assert.equal(inspection.handled, true);
  assert.equal(inspection.state.sampled, true);
  assert.equal(fieldworkTarget(inspection.state), 'fieldwork_cover');
});

test('straw and bare choices have distinct deterministic outcomes', () => {
  let state = freshFieldworkState();
  state = advanceFieldwork(state, 'fieldwork_tool').state;
  state = advanceFieldwork(state, 'fieldwork_sample').state;
  assert.equal(advanceFieldwork(state, 'fieldwork_cover').event, 'choose_cover');
  assert.equal(chooseFieldworkCover(state, 'flood').handled, false);
  for (const choice of ['straw', 'bare']) {
    const result = chooseFieldworkCover(state, choice);
    assert.equal(result.handled, true);
    assert.equal(result.state.stage, 'done');
    assert.equal(result.state.coverChoice, choice);
    assert.equal(fieldworkTarget(result.state), null);
    assert.equal(advanceFieldwork(result.state, 'fieldwork_tool').handled, false);
  }
  assert.equal(state.stage, 'cover', 'choice comparison must not mutate source state');
  assert.deepEqual(freshFieldworkState(), {
    stage: 'tool', hasProbe: false, sampled: false, coverChoice: null,
  });
});
