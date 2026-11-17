import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCanalTurns, toggleCanalGate, runCanalTurn, resetCanalTurns,
  CANAL_TURN_DEMANDS, CANAL_TURN_SUPPLY,
} from './canal-turns.js';

test('canal controls require opening the main intake and at least one branch', () => {
  const initial = createCanalTurns();
  const blocked = runCanalTurn(initial);
  assert.equal(blocked.acted, false);
  assert.equal(blocked.state.round, 0);
  const mainOnly = toggleCanalGate(initial, 'gate_head');
  assert.equal(runCanalTurn(mainOnly).acted, false);
  assert.throws(() => toggleCanalGate(initial, 'unknown_gate'), /Unknown gate/);
});

test('two real solver-backed fictional turns respond to physical branch gate choices', () => {
  let state = createCanalTurns();
  state = toggleCanalGate(state, 'gate_head');
  state = toggleCanalGate(state, 'gate_hassan');
  const first = runCanalTurn(state);
  assert.equal(first.acted, true);
  assert.equal(first.state.round, 1);
  assert.equal(first.state.gates.gate_hassan, true);
  assert.equal(first.state.gates.gate_maryam, false);
  assert.ok(first.state.delivered.slice(0, 3).some(x => x > 0));
  assert.deepEqual(first.state.delivered.slice(3), [0, 0, 0]);
  assert.ok(first.result.deliveredTotal <= CANAL_TURN_SUPPLY + 1e-6);
  assert.equal(first.result.provenance.kind, 'simulated');
  // There is a real remaining-need calculation. It cannot add water or invent
  // science measurements when the second gate opens.
  state = toggleCanalGate(first.state, 'gate_hassan');
  state = toggleCanalGate(state, 'gate_maryam');
  const second = runCanalTurn(state);
  assert.equal(second.acted, true);
  assert.equal(second.state.round, 2);
  assert.equal(second.state.complete, true);
  assert.ok(second.state.delivered.slice(3).some(x => x > 0));
  assert.ok(second.state.totalDelivered <= 2 * CANAL_TURN_SUPPLY + 1e-6);
  for (let i = 0; i < CANAL_TURN_DEMANDS.length; i++) {
    assert.ok(second.state.delivered[i] >= first.state.delivered[i]);
    assert.ok(second.state.delivered[i] <= CANAL_TURN_DEMANDS[i] + 1e-6);
    assert.ok(Math.abs(second.state.remaining[i] + second.state.delivered[i] - CANAL_TURN_DEMANDS[i]) < 1e-6);
  }
  assert.ok(second.state.balance >= 0 && second.state.balance <= 1);
  assert.equal(runCanalTurn(second.state).acted, false);
  assert.throws(() => toggleCanalGate(second.state, 'gate_maryam'), /completed/);
});

test('canal challenge restart restores fictional turn state without storage or GPS', () => {
  let state = toggleCanalGate(createCanalTurns(), 'gate_head');
  state = toggleCanalGate(state, 'gate_maryam');
  state = runCanalTurn(state).state;
  assert.deepEqual(resetCanalTurns(), createCanalTurns());
  assert.equal(JSON.stringify(state).includes('latitude'), false);
  assert.equal(JSON.stringify(state).includes('longitude'), false);
  assert.equal(JSON.stringify(state).includes('nasa'), false);
});
