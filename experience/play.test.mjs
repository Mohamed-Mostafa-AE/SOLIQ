import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateWater } from './engine.js';
import { runGameWaterWindow } from '../game/core/water-window-adapter.js';
import { sharedEvents, EMOTIONS, GESTURES, OUTCOMES, GameEventManager } from '../game/core/events.js';
import { Chapter0Mission } from '../game/mission/chapter0.js';
import { TimeEchoSystem } from '../game/world/time-echo.js';
import { EarthLensSystem } from '../game/world/earth-lens.js';
import { resolvePublicPath } from '../dev-server.mjs';

test('Dev server allows /experience/play/ and game/ assets', () => {
  assert.ok(resolvePublicPath('/experience/play/'));
  assert.ok(resolvePublicPath('/experience/play/index.html'));
  assert.ok(resolvePublicPath('/experience/play/main.js'));
  assert.ok(resolvePublicPath('/experience/play/style.css'));
  assert.ok(resolvePublicPath('/game/render/engine-setup.js'));
  assert.ok(resolvePublicPath('/game/world/village.js'));
  assert.ok(resolvePublicPath('/game/assets/ATTRIBUTIONS.md'));

  // Ensure security boundaries are strictly preserved
  assert.equal(resolvePublicPath('/.gitignore'), null);
  assert.equal(resolvePublicPath('/package.json'), null);
  assert.equal(resolvePublicPath('/dev-server.mjs'), null);
});

test('Codex allocateWater contract integrates with 6 village fields', () => {
  const demands = [35, 45, 60, 40, 25, 30]; // Sum = 235
  const supply = 180;

  // 1. Proportional Allocation (Outcome 1)
  const resProp = allocateWater(demands, supply, 'proportional');
  assert.equal(resProp.supply, 180);
  assert.equal(resProp.deliveredTotal, 180);
  assert.ok(resProp.fairness > 0.95, 'Jain fairness should be > 95% in proportional mode');
  resProp.delivered.forEach((amt, i) => {
    assert.ok(amt > 0 && amt <= demands[i], `Field ${i + 1} received invalid water`);
  });

  // 2. Priority Allocation (Outcome 2)
  const resPrio = allocateWater(demands, supply, 'priority');
  assert.equal(resPrio.delivered[0], 35, 'Head field gets full demand');
  assert.equal(resPrio.delivered[1], 45, 'Second field gets full demand');
  assert.ok(resPrio.delivered[5] < demands[5], 'Tail field suffers deficit');
});

test('Game Core Event Manager correctly dispatches and cancels listeners', () => {
  const manager = new GameEventManager();
  let received = null;

  const unsubscribe = manager.on('test_event', (payload) => {
    received = payload;
  });

  manager.emit('test_event', { status: 'ok', value: 42 });
  assert.deepEqual(received, { status: 'ok', value: 42 });

  // Unsubscribe
  unsubscribe();
  manager.emit('test_event', { status: 'changed' });
  assert.deepEqual(received, { status: 'ok', value: 42 }, 'Listener should not fire after unsubscribe');
});

test('Time Echo correctly validates Seventh Field boundaries and uncertainty certificate', () => {
  const mockScene = {};
  const mockVillage = {};

  // Test scenario comparison directly
  const echo = new TimeEchoSystem(mockScene, mockVillage);
  const comparison = echo.getScenarioComparison();

  assert.equal(comparison.notice, 'SIMULATION — NOT SATELLITE OBSERVATION');
  assert.equal(comparison.certificate.status, 'comparison_only');
  assert.match(comparison.certificate.reasonAr, /لا توجد فترات عدم يقين محسوبة/);
  assert.match(comparison.baseline.waterDemand, /not calculated/);
  assert.match(comparison.alternative.waterDemand, /not calculated/);

  // Bounds test
  assert.equal(echo.checkPlayerInside({ x: 68, y: 0, z: 0 }), true, 'Inside field 7');
  assert.equal(echo.checkPlayerInside({ x: 0, y: 0, z: 0 }), false, 'Outside field 7');
});

test('Earth Lens System toggles modes and reports faithful NASA telemetry', () => {
  const mockScene = { clearColor: { set: () => {} } };
  const mockVillage = { fields: [] };

  const lens = new EarthLensSystem(mockScene, mockVillage);

  // Ground mode
  assert.equal(lens.setMode('ground').mode, 'ground');
  assert.equal(lens.getTelemetry(), null);

  // NASA mode
  const nasa = lens.setMode('nasa');
  assert.equal(nasa.mode, 'nasa');
  assert.equal(nasa.telemetry.dataClass, 'unavailable');
  assert.match(nasa.telemetry.station, /Sakha/);
  assert.match(nasa.telemetry.annual_rain, /unavailable/);
  assert.equal(nasa.telemetry.rawSha256, null);

  // Future mode
  const future = lens.setMode('future');
  assert.equal(future.mode, 'future');
  assert.equal(future.telemetry.dataClass, 'simulated');
  assert.equal(future.telemetry.disclaimer, 'SIMULATION — NOT SATELLITE OBSERVATION');
});

test('Chapter 0 Mission state machine executes all three outcomes and stamps receipts', () => {
  const mockVillage = {
    setPumpRunning: () => {},
    setGateOpen: () => {},
    updateFieldHydration: () => {},
    fields: [
      { demand: 35 }, { demand: 45 }, { demand: 60 },
      { demand: 40 }, { demand: 25 }, { demand: 30 }
    ],
  };
  const mockChars = {
    setActorEmotion: () => {},
    setActorState: () => {},
  };
  const mockWater = {
    setPumpState: () => {},
    runSimulation: (supply, demands, policy) => runGameWaterWindow({supplyM3h:supply,demandsM3:demands}),
    applySimulationToWorld: () => {},
  };
  const mockAudio = {
    playNotebookChime: () => {},
    playGateTurnSFX: () => {},
  };

  const mission = new Chapter0Mission(mockVillage, mockChars, mockWater, mockAudio);

  // Initial receipt exists
  assert.ok(mission.notebookReceipts.length >= 1);
  assert.equal(mission.notebookReceipts[0].id, 'REC_CH0_START');

  // Hassan interaction
  const hassanDlg = mission.getDialogueForTarget({ id: 'hassan' });
  assert.ok(hassanDlg);
  assert.equal(hassanDlg.choices.length, 2);
  hassanDlg.choices[0].onSelect(); // Choose coordinated turns
  assert.equal(mission.flags.talkedToHassan, true);

  // Maryam interaction
  const maryamDlg = mission.getDialogueForTarget({ id: 'maryam' });
  assert.ok(maryamDlg);
  maryamDlg.choices[0].onSelect();
  assert.equal(mission.flags.talkedToMaryam, true);

  // The simulated pump cannot start without teaching the three safety checks.
  assert.equal(mission.executeOutcome(OUTCOMES.EQUILIBRIUM), false);
  assert.equal(mission.activeOutcome, OUTCOMES.NONE);
  const pumpReview = mission.getDialogueForTarget({ id: 'pumpStation' });
  assert.equal(pumpReview.speakerEn, 'Safety Check — Before the Pump');
  for (const key of ['pumpInspected', 'canalAccessSecured', 'heatPrecautionsReviewed']) {
    mission.completeSafetyTraining(key);
  }
  assert.equal(mission.getDialogueForTarget({ id: 'pumpStation' }).choices.length, 3);

  // Outcome 1: Equilibrium
  mission.executeOutcome(OUTCOMES.EQUILIBRIUM);
  assert.equal(mission.activeOutcome, OUTCOMES.EQUILIBRIUM);
  const r1 = mission.notebookReceipts.find(r => r.id === 'OUTCOME_1_EQUILIBRIUM');
  assert.ok(r1, 'Outcome 1 receipt generated');
  assert.ok(r1.hash, 'Receipt has cryptographic hash');
  assert.equal(r1.dataClass, 'simulated');

  // Outcome 2: Bottleneck
  mission.executeOutcome(OUTCOMES.BOTTLENECK);
  assert.equal(mission.activeOutcome, OUTCOMES.BOTTLENECK);
  const r2 = mission.notebookReceipts.find(r => r.id === 'OUTCOME_2_BOTTLENECK');
  assert.ok(r2, 'Outcome 2 receipt generated');

  // Outcome 3: Deferral
  mission.executeOutcome(OUTCOMES.DEFERRAL);
  assert.equal(mission.activeOutcome, OUTCOMES.DEFERRAL);
  const r3 = mission.notebookReceipts.find(r => r.id === 'OUTCOME_3_DEFERRAL');
  assert.ok(r3, 'Outcome 3 receipt generated');
  assert.equal(r3.dataClass, 'simulated');
});
