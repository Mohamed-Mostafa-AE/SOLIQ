/**
 * @file science/eo-pipeline.js
 * @description End-to-End NASA Earth Observation + Scientific Crop Rotation & Water Balance Pipeline.
 *
 * Orchestrates:
 * 1. Pilot region configuration loading (`configs/pilots/zankalon.json` or other independent regions).
 * 2. Ingestion & validation of NASA POWER, GPM IMERG V07, and HLS Landsat/Sentinel-2 v2.0.
 * 3. Harmonization of daily meteorological forcing (merging GPM IMERG V07 validated daily precipitation
 *    with NASA POWER ET0 and temperature without inventing synthetic data).
 * 4. Generation of the current baseline rotation + 2 feasible alternatives (`science/rotation-generator.js`).
 * 5. Multi-season daily water balance simulation (`science/water-balance.js`).
 * 6. Interval regret & uncertainty propagation (`science/interval-regret.js`), automatically downgrading
 *    to `comparison_only` whenever satellite data coverage is insufficient or Earthdata auth is missing.
 */

import {
  fetchNasaPowerClimatology,
  fetchGpmImergV07,
  fetchHlsOpticalSeries
} from '../adapters/index.js';
import { loadPilotConfig } from './crop-library.js';
import { generateCandidateRotations, evaluateRotationFeasibility } from './rotation-generator.js';
import { simulateMultiSeasonRotation } from './water-balance.js';
import { evaluateIntervalRegret } from './eo-interval-regret.js';

/**
 * Merges validated NASA POWER daily records and validated GPM IMERG V07 daily precipitation records
 * into a unified daily forcing series, preferring GPM IMERG V07 high-quality satellite precipitation
 * when available and falling back to NASA POWER `PRECTOTCORR` only when explicitly marked.
 *
 * @param {Object} nasaPowerResult - Output of `fetchNasaPowerClimatology` or `normalizeNasaPowerResponse`
 * @param {Object} gpmImergResult - Output of `fetchGpmImergV07` or `normalizeGpmImergV07Dataset`
 * @returns {{
 *   dailyForcing: Array<Object>,
 *   metCoverageRatio: number,
 *   imergCoverageRatio: number
 * }}
 */
export function harmonizeDailyForcing(nasaPowerResult = {}, gpmImergResult = {}) {
  const powerRecords = Array.isArray(nasaPowerResult.dailyRecords)
    ? nasaPowerResult.dailyRecords
    : [];
  const imergRecords = Array.isArray(gpmImergResult.records)
    ? gpmImergResult.records
    : [];

  const imergByDate = new Map();
  for (const rec of imergRecords) {
    if (rec && rec.date && rec.valid && Number.isFinite(rec.precipMmDay)) {
      imergByDate.set(rec.date, rec);
    }
  }

  const dailyForcing = [];
  for (const pRec of powerRecords) {
    const imergRec = imergByDate.get(pRec.date);
    const precipMmDay = imergRec
      ? imergRec.precipMmDay
      : Number.isFinite(pRec.precipMmDay)
        ? pRec.precipMmDay
        : null;

    dailyForcing.push({
      date: pRec.date,
      tMeanC: pRec.tMeanC,
      tMaxC: pRec.tMaxC,
      tMinC: pRec.tMinC,
      et0MmDay: pRec.et0MmDay,
      precipMmDay,
      precipSource: imergRec
        ? 'GPM_IMERG_V07'
        : Number.isFinite(pRec.precipMmDay)
          ? 'NASA_POWER_PRECTOTCORR'
          : 'missing'
    });
  }

  const metCoverageRatio = nasaPowerResult?.coverage?.coverageRatio ?? 0;
  const imergCoverageRatio = gpmImergResult?.coverage?.temporalCoverageRatio ?? 0;

  return {
    dailyForcing,
    metCoverageRatio,
    imergCoverageRatio
  };
}

/**
 * Executes the full SOLIQ EO + Scientific modeling workflow for a pilot region.
 *
 * @param {Object} options
 * @param {string|Object} [options.pilot='zankalon'] - Pilot ID or custom pilot config object
 * @param {string} [options.startDate='2025-11-15']
 * @param {string} [options.endDate='2026-11-14']
 * @param {Object} [options.nasaPowerPayload] - Pre-fetched / verified NASA POWER payload
 * @param {Object} [options.gpmImergPayload] - Pre-fetched / verified GPM IMERG V07 payload
 * @param {Object} [options.hlsPayload] - Pre-fetched / verified HLS v2.0 payload
 * @param {Function} [options.existingPowerConnector] - Existing NASA POWER connector to reuse
 * @param {Function} [options.fetchImpl] - Custom fetch implementation
 * @param {string} [options.earthdataToken] - Optional NASA Earthdata Login Bearer token
 * @returns {Promise<Object>} Complete scientific evaluation bundle with provenance, coverage, simulations, and interval regret
 */
export async function runEoSciencePipeline(options = {}) {
  const {
    pilot = 'zankalon',
    startDate = '2025-11-15',
    endDate = '2026-11-14',
    nasaPowerPayload = null,
    gpmImergPayload = null,
    hlsPayload = null,
    existingPowerConnector = null,
    fetchImpl = globalThis.fetch,
    earthdataToken = process.env.EARTHDATA_TOKEN || null
  } = options;

  const pilotConfig = loadPilotConfig(pilot);
  const { latitude, longitude } = pilotConfig.coordinates;

  // 1. Fetch / validate all 3 NASA EO streams concurrently
  const [powerData, imergData, hlsData] = await Promise.all([
    fetchNasaPowerClimatology({
      latitude,
      longitude,
      startDate,
      endDate,
      existingConnector: existingPowerConnector,
      cachedPayload: nasaPowerPayload,
      fetchImpl
    }),
    fetchGpmImergV07({
      latitude,
      longitude,
      startDate,
      endDate,
      verifiedGranulePayload: gpmImergPayload,
      earthdataToken,
      fetchImpl
    }),
    fetchHlsOpticalSeries({
      latitude,
      longitude,
      startDate,
      endDate,
      verifiedHlsPayload: hlsPayload,
      earthdataToken,
      fetchImpl
    })
  ]);

  // 2. Harmonize daily meteorological & precipitation forcing
  const { dailyForcing, metCoverageRatio, imergCoverageRatio } = harmonizeDailyForcing(
    powerData,
    imergData
  );

  // Build map of verified clear-sky HLS NDVI by date
  const hlsNdviByDate = new Map();
  if (Array.isArray(hlsData.observations)) {
    for (const obs of hlsData.observations) {
      if (obs.passesSpatialCoverage && typeof obs.ndvi === 'number') {
        hlsNdviByDate.set(obs.date, obs.ndvi);
      }
    }
  }

  // 3. Generate current baseline rotation + 2 feasible alternatives
  const rotationCandidates = generateCandidateRotations(pilotConfig);

  // 4. Simulate multi-season daily water balance & carry-over state for each candidate
  const simulatedRotations = [];
  for (const candidate of rotationCandidates.allCandidates) {
    const sim = simulateMultiSeasonRotation({
      rotation: candidate,
      pilotConfig,
      dailyForcing,
      hlsNdviByDate
    });
    const postSimFeasibility = evaluateRotationFeasibility(
      candidate,
      pilotConfig,
      sim
    );
    simulatedRotations.push({
      ...sim,
      role: candidate.role,
      rationale: candidate.rationale || 'Baseline farmer rotation',
      postSimulationFeasibility: postSimFeasibility
    });
  }

  // 5. Evaluate Coverage Diagnostics & Interval Regret
  const noVerifiableRemoteProvenance =
    Boolean(nasaPowerPayload || gpmImergPayload || hlsPayload) ||
    [powerData, imergData, hlsData].some(x => x?.status !== 'ok');

  const hasAuthOrNetworkBlocker =
    powerData.status !== 'ok' && !Array.isArray(powerData.dailyRecords)
      ? true
      : imergData.status && imergData.status !== 'ok'
        ? true
        : hlsData.status && hlsData.status !== 'ok'
          ? true
          : false;

  const coverageDiagnostics = {
    metCoverageRatio,
    imergCoverageRatio,
    hlsClearSceneRatio: hlsData?.coverage?.clearSceneRatio ?? 0,
    hasAuthOrNetworkBlocker: hasAuthOrNetworkBlocker || noVerifiableRemoteProvenance,
    streamStatuses: {
      nasaPower: powerData.status || 'ok',
      gpmImergV07: imergData.status || 'ok',
      hlsOpticalV2: hlsData.status || 'ok'
    },
    streamDiagnostics: {
      nasaPower: powerData.reason || null,
      gpmImergV07: imergData.diagnostics || null,
      hlsOpticalV2: hlsData.diagnostics || null
    }
  };

  let regretEvaluation = evaluateIntervalRegret({
    simulatedRotations,
    uncertaintyBounds: pilotConfig.UncertaintyBoundsConfig,
    coverageDiagnostics,
    pilotConfig
  });

  // Zero-filling a missing daily climate forcing is diagnostic-only, never decision-ready,
  // even when overall coverage exceeds the preliminary 85% remote-source threshold.
  const missingDailyForcing = simulatedRotations.some(r =>
    r.overallForcingCoverageRatio < 1 ||
    r.seasonResults?.some(s => s.missingForcingDays > 0));
  if (missingDailyForcing) {
    regretEvaluation = {
      ...regretEvaluation,
      status: 'comparison_only',
      decisionMode: 'comparison_only',
      isComparisonOnly: true,
      recommendedStrategyId: null,
      comparisonOnlyReasons: [
        ...(regretEvaluation.comparisonOnlyReasons || []),
        'missing_daily_forcing_zero_imputation_diagnostic_only'
      ]
    };
  }

  return {
    pilotId: pilotConfig.pilotId,
    regionName: pilotConfig.regionName,
    calibrationStatus: pilotConfig.calibrationStatus,
    syntheticDataGenerated: false,
    sourceVerification: noVerifiableRemoteProvenance ? 'unverified_or_unavailable' : 'provider_response_unindependently_audited',
    eoStreams: {
      nasaPower: {
        source: powerData.source,
        status: powerData.status || 'ok',
        coverage: powerData.coverage || null,
        units: powerData.units || null
      },
      gpmImergV07: {
        source: imergData.source,
        shortName: imergData.shortName,
        version: imergData.version,
        status: imergData.status || 'ok',
        coverage: imergData.coverage || null,
        diagnostics: imergData.diagnostics || null
      },
      hlsOpticalV2: {
        source: hlsData.source,
        collectionsUsed: hlsData.collectionsUsed,
        status: hlsData.status || 'ok',
        coverage: hlsData.coverage || null,
        diagnostics: hlsData.diagnostics || null
      }
    },
    rotationSet: {
      currentRotationId: rotationCandidates.currentRotation.rotationId,
      alternativeIds: rotationCandidates.alternatives.map((a) => a.rotationId),
      totalCandidatesCount: rotationCandidates.allCandidates.length
    },
    simulatedRotations,
    regretEvaluation,
    references: pilotConfig.references
  };
}
