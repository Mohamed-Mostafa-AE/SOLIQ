import test from 'node:test';
import assert from 'node:assert/strict';
import { Chapter0Mission } from './chapter0.js';

function makeMission() {
  const calls = [];
  const water = {
    currentSimulation: null,
    setPumpState(...args) { calls.push(['pump', ...args]); },
    runSimulation(supply, demands, policy) {
      calls.push(['simulate', supply, [...demands], policy]);
      return (this.currentSimulation = {
        deliveredTotal: supply,
        fairness: 1,
        shortfall: [0, 0, 0, 0, 0, 0],
      });
    },
    applySimulationToWorld() {},
  };
  const mission = new Chapter0Mission(
    { setGateOpen() {} },
    { setActorEmotion() {} },
    water,
    { playNotebookChime() {}, playGateTurnSFX() {} },
  );
  function choose(target, id) {
    const dialogue = mission.getDialogueForTarget({ id: target });
    const matching = dialogue.choices.filter(choice => choice.id === id);
    assert.equal(matching.length, 1, `Expected one ${id} in ${target}`);
    matching[0].onSelect();
    return dialogue;
  }
  return { mission, water, calls, choose };
}

test('Chapter 0 soil-investigation and cover pact unlock an evidence-labelled council action', () => {
  const { mission, calls, choose } = makeMission();
  mission.beginInvestigation('soil');
  choose('hassan', 'hassan_inspect_soil_first');
  assert.equal(mission.flags.inspectedSoil, true);
  choose('maryam', 'maryam_soil_cover_pact');
  assert.equal(mission.flags.soilCoverChoice, 'living_cover');
  choose('timeEcho', 'f7_hypothesis_cover');
  const council = mission.getDialogueForTarget({ id: 'pumpStation' });
  assert.equal(council.choices.length, 4);
  choose('pumpStation', 'council_cover_buffered');
  assert.equal(mission.activeOutcome, 'equilibrium');
  assert.equal(mission.flags.councilMode, 'cover_buffered_turn');
  assert.deepEqual(calls.find(row => row[0] === 'simulate').slice(1),
    [235, [32, 41, 54, 37, 23, 28], 'proportional']);
  assert.ok(mission.notebookReceipts.some(receipt => receipt.id === 'COVER_BUFFERED_ASSUMPTION'));
  assert.equal(mission.notebookReceipts.every(r => r.dataClass === 'simulated'), true);
});

test('Livelihood priority creates an explicit risk, and NASA-evidence deferral never starts pump', () => {
  const { mission, calls, choose } = makeMission();
  choose('hassan', 'hassan_prioritize_wheat_livelihood');
  assert.equal(mission.flags.cooperationRiskFlag, true);
  const maryam = mission.getDialogueForTarget({ id: 'maryam' });
  assert.match(maryam.textEn, /head-first|headgate/i);
  choose('maryam', 'maryam_stress_test_rush');
  choose('timeEcho', 'f7_refuse_guess_nasa');
  assert.equal(mission.flags.evidenceRequested, true);
  choose('pumpStation', 'council_deferral');
  assert.equal(mission.activeOutcome, 'deferral');
  assert.equal(mission.flags.pumpStarted, false);
  assert.equal(mission.flags.councilMode, 'evidence_deferral');
  assert.equal(calls.some(([action]) => action === 'simulate'), false);
});

test('Choice IDs are stable, unique and do not imply a measured NASA result', () => {
  const { mission } = makeMission();
  for (const id of ['hassan', 'maryam', 'timeEcho', 'pumpStation']) {
    const dialogue = mission.getDialogueForTarget({ id });
    const ids = dialogue.choices.map(choice => choice.id);
    assert.equal(new Set(ids).size, ids.length, id);
    assert.equal(ids.every(choiceId => /^[a-z0-9_]+$/.test(choiceId)), true, id);
  }
  assert.ok(mission.getDialogueForTarget({ id: 'pumpStation' }).choices.every(
    choice => choice.id !== 'council_cover_buffered'));
});

test('Versioned Chapter 0 state round-trips deterministic choices without storing location', () => {
  const { mission, choose } = makeMission();
  mission.beginInvestigation('soil');
  choose('hassan', 'hassan_inspect_soil_first');
  choose('maryam', 'maryam_soil_cover_pact');
  choose('timeEcho', 'f7_hypothesis_cover');
  const snapshot = mission.getSerializableState();
  assert.equal(snapshot.version, 1);
  assert.deepEqual(snapshot.flags.relationships, { hassanTrust: 1, maryamTrust: 1 });
  assert.deepEqual(Object.keys(snapshot).sort(), ['version', 'stage', 'activeOutcome', 'flags', 'notebookReceipts'].sort());
  assert.doesNotMatch(JSON.stringify(snapshot), /latitude|longitude|coordinates|deviceId|gps/i);
  const restored = makeMission().mission;
  restored.restoreState(snapshot);
  assert.deepEqual(restored.getSerializableState(), snapshot);
  snapshot.flags.relationships.hassanTrust = 0;
  assert.equal(restored.flags.relationships.hassanTrust, 1, 'snapshot cannot mutate mission by reference');
});

test('Chapter 0 rejects malformed, future-version and injected snapshots without partial mutation', () => {
  const { mission } = makeMission();
  const fresh = mission.getSerializableState();
  const bad = (modify) => {
    const snapshot = structuredClone(fresh);
    modify(snapshot);
    assert.throws(() => mission.restoreState(snapshot), /Invalid|Unsupported|Unsafe/i);
    assert.deepEqual(mission.getSerializableState(), fresh, 'invalid restore is atomic');
  };
  bad(s => { s.version = 2; });
  bad(s => { s.flags.latitude = 30.9; });
  bad(s => { s.flags.relationships.hassanTrust = 3; });
  bad(s => { s.flags.councilMode = 'magic_impact_certified'; });
  bad(s => { s.notebookReceipts[0].detailsEn = '<img src=x onerror=alert(1)>'; });
  bad(s => { s.activeOutcome = 'equilibrium'; }); // inconsistent with non-executed stage
});

test('Completed fictional council outcome restores as a receipt-only checkpoint without replaying pump effects', () => {
  const { mission, choose } = makeMission();
  choose('pumpStation', 'council_proportional');
  const snapshot = mission.getSerializableState();
  const next = makeMission();
  next.mission.restoreState(snapshot);
  assert.equal(next.mission.stage, 'executed');
  assert.equal(next.mission.activeOutcome, 'equilibrium');
  assert.equal(next.mission.flags.pumpStarted, true);
  assert.deepEqual(next.calls, [], 'restore must not restart world pump or recalculate evidence');
  assert.deepEqual(next.mission.getSerializableState(), snapshot);
});
