/**
 * @file adapters/index.js
 * @description Unified barrel exports for SOLIQ NASA Earth Observation Adapters
 * (`NASA POWER`, `GPM IMERG V07`, `HLS Landsat/Sentinel-2 v2.0`).
 */

export {
  NASA_POWER_DEFAULTS,
  isValidPowerValue,
  computeFao56Et0,
  normalizeDateKey,
  normalizeNasaPowerResponse,
  fetchNasaPowerClimatology
} from './nasa-power.js';

export {
  GPM_IMERG_V07_SPEC,
  convertAndValidateImergUnit,
  evaluateImergCoverageAndQuality,
  normalizeGpmImergV07Dataset,
  fetchGpmImergV07
} from './gpm-imerg.js';

export {
  HLS_V2_SPEC,
  decodeHlsFmask,
  scaleAndValidateReflectance,
  processHlsObservation,
  normalizeHlsDataset,
  fetchHlsOpticalSeries
} from './hls-optical.js';
