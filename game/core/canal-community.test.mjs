import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanalTurns, toggleCanalGate, runCanalTurn} from './canal-turns.js';
import {summarizeCanalCommunity, canalNpcFeedback} from './canal-community.js';

test('community response begins with an explicit fictional objective and no invented NPC evidence', () => {
  const initial = summarizeCanalCommunity(createCanalTurns());
  assert.equal(initial.status, 'not_started');
  assert.equal(initial.goalMet, false);
  assert.deepEqual(initial.branches.map(branch => branch.coverage), [0, 0]);
  assert.equal(canalNpcFeedback(createCanalTurns(), 'hassan'), null);
  assert.equal(canalNpcFeedback(createCanalTurns(), 'maryam'), null);
});

test('a closed branch makes that fictional farmer respond with actual solver-derived zero delivery', () => {
  let state = createCanalTurns();
  state = toggleCanalGate(toggleCanalGate(state, 'gate_head'), 'gate_hassan');
  state = runCanalTurn(state).state;
  const response = summarizeCanalCommunity(state);
  assert.equal(response.status, 'in_progress');
  assert.ok(response.branches[0].coverage > 0);
  assert.equal(response.branches[1].coverage, 0);
  const maryam = canalNpcFeedback(state, 'maryam');
  assert.equal(maryam.emotion, 'concerned');
  assert.match(maryam.textEn, /no water/i);
  assert.match(maryam.textEn, /fictional/i);
  assert.match(maryam.textAr, /افتراضي/);
  const hassan = canalNpcFeedback(state, 'hassan');
  assert.match(hassan.textEn, /\d+%/);
  assert.equal(canalNpcFeedback(state, 'nada'), null);
});

test('two open-branch turns can meet an understandable shared-water goal', () => {
  let state = createCanalTurns();
  for (const gate of ['gate_head', 'gate_hassan', 'gate_maryam']) state = toggleCanalGate(state, gate);
  state = runCanalTurn(state).state;
  state = runCanalTurn(state).state;
  const response = summarizeCanalCommunity(state);
  assert.equal(response.status, 'shared_success');
  assert.equal(response.goalMet, true);
  assert.ok(response.coverage >= 0.9);
  assert.ok(response.branches.every(branch => branch.coverage >= 0.8));
  assert.match(canalNpcFeedback(state, 'hassan').textEn, /fictional/i);
  assert.match(canalNpcFeedback(state, 'maryam').textAr, /الهدف الافتراضي المشترك/);
  assert.equal(summarizeCanalCommunity(createCanalTurns()).status, 'not_started');
});

test('two-turn one-branch strategy remains a replayable shortfall, not a fabricated success', () => {
  let state = createCanalTurns();
  state = toggleCanalGate(toggleCanalGate(state, 'gate_head'), 'gate_hassan');
  state = runCanalTurn(runCanalTurn(state).state).state;
  const response = summarizeCanalCommunity(state);
  assert.equal(response.status, 'needs_review');
  assert.equal(response.goalMet, false);
  assert.equal(response.branches[1].coverage, 0);
  assert.throws(() => summarizeCanalCommunity({delivered:[1],round:1,complete:false}), /six fictional fields/i);
});
