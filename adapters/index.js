/**
 * @file adapters/index.js
 * @description Unified barrel exports for SOLIQ NASA Earth Observation Adapters
 * (`NASA POWER`, `GPM IMERG V07` + NetCDF4/HDF5/OPeNDAP reader, `HLS v2.0` + 3-band GeoTIFF/COG reader,
 * and Codex Backend #4 `EvidenceEnvelope` adapter registry).
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
  fetchGpmImergV07,
  decodeImergNetCdf4Binary,
  encodeImergNetCdf4BinaryGranule,
  buildStandardNetCdf3TestGranule,
  parseNetCdf3BinaryBuffer,
  buildImergOpendapSubsetUrl,
  snapToImergGridCenter,
  computeRawSha256
} from './gpm-imerg.js';

export {
  HLS_V2_SPEC,
  decodeHlsFmask,
  decodeHlsFmaskByte,
  scaleAndValidateReflectance,
  processHlsObservation,
  normalizeHlsDataset,
  fetchHlsOpticalSeries,
  decodeHlsGeoTiffBinary,
  decodeSingleBandHlsGeoTiff,
  encodeSingleBandHlsGeoTiff,
  encodeHlsGeoTiffBandTriplet,
  encodeHlsGeoTiffBinaryScene,
  parseHlsAssetNomenclature,
  isGeoTiffBinary
} from './hls-optical.js';

export {
  REQUIRED_MANIFEST_KEYS,
  validateContractGeometry,
  validateContractTimeRange,
  validateBackendEvidenceEnvelope,
  buildUnavailableEnvelope,
  createBackendEvidenceAdapters,
  adapters
} from './backend-registry.js';
