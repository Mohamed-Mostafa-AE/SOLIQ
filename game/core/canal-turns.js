/**
 * The Seventh Field: optional hands-on canal-control puzzle.
 * All volumes and field demands are FICTIONAL classroom inputs (m³), never
 * observed canal flow, real soil readings, or agronomic recommendations.
 * Each press resolves a one-hour turn through the SAME time-sliced solver as
 * the existing chapter, with the player's selected valves actually respected.
 * Nothing is persisted or sent to a server.
 */
import {runGameWaterWindow} from './water-window-adapter.js';

export const CANAL_TURN_DEMANDS = Object.freeze([35, 45, 60, 40, 25, 30]);
export const CANAL_TURN_SUPPLY = 120;
export const CANAL_TURN_COUNT = 2;
export const CANAL_GATE_IDS = Object.freeze(['gate_head', 'gate_hassan', 'gate_maryam']);

export function createCanalTurns() {
  return {
    round: 0,
    complete: false,
    gates: {gate_head: false, gate_hassan: false, gate_maryam: false},
    delivered: CANAL_TURN_DEMANDS.map(() => 0),
    remaining: [...CANAL_TURN_DEMANDS],
    totalDelivered: 0,
    coverage: 0,
    balance: 0,
  };
}

export const resetCanalTurns = createCanalTurns;

export function toggleCanalGate(state, gateId) {
  if (!CANAL_GATE_IDS.includes(gateId)) throw new RangeError('Unknown gate');
  if (state.complete) throw new Error('Challenge completed; reset to operate gates');
  return {...state, gates: {...state.gates, [gateId]: !state.gates[gateId]}};
}

function fairnessForCoverage(delivered) {
  const coverage = delivered.map((n, i) => CANAL_TURN_DEMANDS[i] > 0 ? n / CANAL_TURN_DEMANDS[i] : 1);
  const sum = coverage.reduce((a, b) => a + b, 0);
  const squares = coverage.reduce((a, b) => a + b * b, 0);
  return squares ? (sum * sum) / (coverage.length * squares) : 0;
}

export function runCanalTurn(state) {
  if (state.complete) return {acted: false, reason: 'complete', state};
  if (!state.gates.gate_head) return {acted: false, reason: 'main_closed', state};
  if (!state.gates.gate_hassan && !state.gates.gate_maryam) {
    return {acted: false, reason: 'branches_closed', state};
  }
  const openFields = CANAL_TURN_DEMANDS.map((_, i) => i < 3
    ? state.gates.gate_hassan : state.gates.gate_maryam);
  const result = runGameWaterWindow({
    supplyM3h: CANAL_TURN_SUPPLY,
    demandsM3: state.remaining,
    openFields,
    seed: `seventh-field-canal-turn-${state.round + 1}`,
  });
  const delivered = state.delivered.map((previous, i) => previous + result.delivered[i]);
  const remaining = CANAL_TURN_DEMANDS.map((required, i) => Math.max(0, required - delivered[i]));
  const totalDelivered = delivered.reduce((sum, n) => sum + n, 0);
  return {
    acted: true,
    result,
    state: {
      ...state,
      round: state.round + 1,
      complete: state.round + 1 === CANAL_TURN_COUNT,
      delivered,
      remaining,
      totalDelivered,
      coverage: totalDelivered / CANAL_TURN_DEMANDS.reduce((sum, n) => sum + n, 0),
      balance: fairnessForCoverage(delivered),
    },
  };
}
