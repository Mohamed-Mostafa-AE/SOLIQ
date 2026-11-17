/**
 * SOLIQ Seventh Field — physically time-sliced water bridge.
 * The six fields and supply values are explicitly fictional scenario inputs, not
 * observed Egyptian pump capacities. Source of truth: science/mesqa-window.js.
 */
import { simulateWaterWindow, ENGINE_VERSION } from '../../science/mesqa-window.js';

export const GAME_WATER_SOURCE = 'SOLIQ fictional six-field irrigation training scenario — NOT measured';
const isValidNumber = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;

/**
 * Adapt an existing chapter's six demands in m³ and canal available rate m³/h.
 * Duration is 1 hour ON + 1 hour OFF; area=1,000m² and efficiency=1 are openly
 * stated classroom simplifications. All six valves can open together.
 * "priority" is a legacy UI label, NOT head-to-tail hydraulic physics.
 */
export function runGameWaterWindow({
  supplyM3h,
  demandsM3,
  openFields = [true, true, true, true, true, true],
  turnOn = true,
  pumpOn = true,
  pumpFailure = false,
  seed = 'seven-fields-demo-v1',
} = {}) {
  if (!isValidNumber(supplyM3h) || !Array.isArray(demandsM3) ||
      demandsM3.length !== 6 || !demandsM3.every(isValidNumber)) {
    throw new TypeError('Six finite nonnegative demand volumes and a supply rate are required');
  }
  if (!Array.isArray(openFields) || openFields.length !== 6 ||
      !openFields.every(value => typeof value === 'boolean')) {
    throw new TypeError('Six explicitly opened or closed fictional field valves are required');
  }
  if (typeof turnOn !== 'boolean' || typeof pumpOn !== 'boolean' ||
      typeof pumpFailure !== 'boolean' || typeof seed !== 'string') {
    throw new TypeError('Invalid turn/pump state or replay seed');
  }

  const ids = demandsM3.map((_, i) => 'F' + (i + 1));
  const initialState = {
    mode: 'ROTATIONAL_ON_OFF',
    provenance: {kind: 'simulated', delivery: 'unavailable', source: GAME_WATER_SOURCE},
    seed,
    intervals: [
      {startHour: 0, endHour: 1, on: turnOn, flowM3h: turnOn ? supplyM3h : 0},
      {startHour: 1, endHour: 2, on: false, flowM3h: 0},
    ],
    pump: {maxFlowM3h: pumpOn ? supplyM3h : 0, efficiency: 1},
    storage: {initialM3: 0, source: 'no_declared_storage'},
    farms: ids.map((id, i) => ({
      id,
      areaM2: 1000,       // hypothetical scenario; not inferred from a real farm
      needMm: demandsM3[i],// 1,000m² × mm / 1,000 => m³
      cropStage: 'illustrative',
      maxFlowM3h: supplyM3h,
      windows: [{startHour: 0, endHour: 2}],
    })),
  };
  const actions = ids.filter((_, i) => openFields[i]).map(farmId => ({
    type: 'valve', farmId, startHour: 0, endHour: 2,
  }));
  if (pumpFailure) {
    actions.push({
      type: 'pump', startHour: 0, endHour: 1,
      factor: 0, reason: 'failure', kind: 'simulated',
    });
  }

  const physical = simulateWaterWindow(initialState, actions);
  const byId = new Map(physical.waterByField.map(f => [f.id, f]));
  const ordered = ids.map(id => byId.get(id));
  return {
    supply: physical.ledger.canalAvailableM3,
    totalDemand: demandsM3.reduce((a,b)=>a+b,0),
    mode: 'time-sliced ON/OFF — fictional scenario',
    delivered: ordered.map(f => f.deliveredM3),
    shortfall: ordered.map(f => f.unmetM3),
    deliveredTotal: physical.ledger.effectiveM3,
    fairness: physical.fairness,
    waterByField: ordered,
    ledger: physical.ledger,
    flowByTimestep: physical.flowByTimestep,
    events: physical.events,
    outcome: physical.outcome,
    provenance: physical.provenance,
    decisionStatus: physical.decisionStatus,
    engineVersion: ENGINE_VERSION,
    inputAssumptions: {
      durationHours: 1, areaPerFieldM2: 1000, efficiency: 1,
      waterDemandUnit: 'm3', canalRateUnit: 'm3/h',
      openFields: [...openFields],
      realFarmValidation: false,
    },
  };
}
