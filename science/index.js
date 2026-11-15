/**
 * @file science/index.js
 * @description Unified barrel exports for SOLIQ Scientific Models (`science/`).
 */

export {
  CROP_LIBRARY,
  interpolateDailyCropParameters,
  loadPilotConfig,
  listAvailablePilotConfigs
} from './crop-library.js';

export {
  computeScsRunoffMm,
  simulateSeasonWaterBalance,
  simulateMultiSeasonRotation
} from './water-balance.js';

export {
  evaluateRotationFeasibility,
  generateCandidateRotations
} from './rotation-generator.js';

export {
  DEFAULT_UNCERTAINTY_BOUNDS,
  computeStrategyUncertaintyIntervals,
  evaluateIntervalRegret
} from './eo-interval-regret.js';

export {
  harmonizeDailyForcing,
  runEoSciencePipeline
} from './eo-pipeline.js';
