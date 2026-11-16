import test from 'node:test';
import assert from 'node:assert/strict';
import { Chapter0Mission } from '../mission/chapter0.js';
import { Chapter0Checkpoint, CHAPTER0_CHECKPOINT_KEY } from './chapter-checkpoint.js';

function mission() {
  const water = {
    currentSimulation: null, setPumpState() {}, applySimulationToWorld() {},
    runSimulation() { return (this.currentSimulation = { deliveredTotal: 100, fairness: 1, shortfall: Array(6).fill(0) }); },
  };
  return new Chapter0Mission(
    { setGateOpen() {} }, { setActorEmotion() {} }, water,
    { playNotebookChime() {}, playGateTurnSFX() {} },
  );
}

function memoryStore() {
  const map = new Map();
  const calls = [];
  return {
    map, calls,
    getItem(key) { calls.push(['get', key]); return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { calls.push(['set', key]); map.set(key, value); },
    removeItem(key) { calls.push(['remove', key]); map.delete(key); },
  };
}

test('Chapter checkpoint never auto-reads or writes until an explicit save/resume/reset action', () => {
  const storage = memoryStore();
  const point = new Chapter0Checkpoint(mission(), { storageProvider: () => storage });
  assert.deepEqual(storage.calls, []);
  assert.equal(storage.map.size, 0);
  assert.deepEqual(point.resume(), { ok: false, reason: 'not_found' });
  assert.deepEqual(storage.calls, [['get', CHAPTER0_CHECKPOINT_KEY]]);
});

test('Explicit save and resume restore authored Chapter 0 choices without storing NASA or location data', () => {
  const storage = memoryStore();
  const first = mission();
  first.beginInvestigation('soil');
  first.getDialogueForTarget({ id: 'hassan' }).choices.find(c => c.id === 'hassan_inspect_soil_first').onSelect();
  first.getDialogueForTarget({ id: 'maryam' }).choices.find(c => c.id === 'maryam_soil_cover_pact').onSelect();
  const saved = new Chapter0Checkpoint(first, { storageProvider: () => storage });
  assert.deepEqual(saved.save(), { ok: true });
  const bytes = storage.map.get(CHAPTER0_CHECKPOINT_KEY);
  assert.ok(bytes.length > 200);
  assert.doesNotMatch(bytes, /latitude|longitude|coordinates|deviceId|accessToken|NASA POWER daily|gps/i);
  assert.equal(JSON.parse(bytes).version, 1);
  const second = mission();
  const resume = new Chapter0Checkpoint(second, { storageProvider: () => storage });
  assert.deepEqual(resume.resume(), { ok: true });
  assert.deepEqual(second.getSerializableState(), first.getSerializableState());
  assert.equal(second.flags.soilCoverChoice, 'living_cover');
});

test('Explicit reset removes only Chapter 0 key and restores the original fictional story', () => {
  const storage = memoryStore();
  storage.map.set('unrelated', 'keep me');
  const chapter = mission();
  const checkpoint = new Chapter0Checkpoint(chapter, { storageProvider: () => storage });
  chapter.beginInvestigation('water');
  checkpoint.save();
  assert.deepEqual(checkpoint.reset(), { ok: true });
  assert.equal(storage.map.has(CHAPTER0_CHECKPOINT_KEY), false);
  assert.equal(storage.map.get('unrelated'), 'keep me');
  assert.equal(chapter.flags.firstClue, null);
  assert.equal(chapter.notebookReceipts.length, 1);
});

test('Corrupt, malicious, and outdated checkpoint data never partially mutates the mission', () => {
  const storage = memoryStore();
  const chapter = mission();
  const checkpoint = new Chapter0Checkpoint(chapter, { storageProvider: () => storage });
  const initial = chapter.getSerializableState();
  const bad = (raw, reason) => {
    storage.map.set(CHAPTER0_CHECKPOINT_KEY, raw);
    assert.deepEqual(checkpoint.resume(), { ok: false, reason });
    assert.deepEqual(chapter.getSerializableState(), initial);
  };
  bad('invalid-json', 'invalid_checkpoint');
  bad(JSON.stringify({ ...initial, version: 0 }), 'unsupported_version');
  bad(JSON.stringify({ ...initial, version: 99 }), 'unsupported_version');
  bad(JSON.stringify({ ...initial, flags: { ...initial.flags, gps: [1, 2] } }), 'invalid_checkpoint');
  assert.deepEqual(checkpoint.reset(), { ok: true });
  assert.equal(storage.map.has(CHAPTER0_CHECKPOINT_KEY), false);
});

test('Browser storage refusal is an honest error, never a phantom checkpoint', () => {
  const chapter = mission();
  const bad = new Chapter0Checkpoint(chapter, {
    storageProvider() { throw new Error('SecurityError'); },
  });
  assert.deepEqual(bad.save(), { ok: false, reason: 'storage_unavailable' });
  assert.deepEqual(bad.resume(), { ok: false, reason: 'storage_unavailable' });
  assert.deepEqual(bad.reset(), { ok: false, reason: 'storage_unavailable' });
});

test('3D rehydration reuses fictional solver inputs but never duplicates notebook receipts', () => {
  const saved = mission();
  saved.flags.inspectedSoil = true;
  saved.flags.soilCoverChoice = 'living_cover';
  saved.executeOutcome('equilibrium', { mode: 'cover_buffered_turn' });
  const snapshot = saved.getSerializableState();
  const calls = [];
  const water = {
    currentSimulation: null,
    setPumpState(active) { calls.push(['pump', active]); },
    runSimulation(supply, demands, policy) {
      calls.push(['simulate', supply, demands, policy]);
      return (this.currentSimulation = { deliveredTotal: 215, fairness: 1, shortfall: Array(6).fill(0) });
    },
    applySimulationToWorld() { calls.push(['apply']); },
  };
  const resumed = new Chapter0Mission({ setGateOpen() {} }, { setActorEmotion() {} }, water,
    { playNotebookChime() {}, playGateTurnSFX() {} });
  resumed.restoreState(snapshot);
  assert.deepEqual(calls, [], 'state restore alone must remain side-effect free');
  const before = resumed.notebookReceipts.length;
  resumed.rehydrateWorldEffects();
  assert.deepEqual(calls.find(([type]) => type === 'simulate'),
    ['simulate', 235, [32, 41, 54, 37, 23, 28], 'proportional']);
  assert.equal(resumed.notebookReceipts.length, before);
});
