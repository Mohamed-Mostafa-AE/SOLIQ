/**
 * @file science/eo-pipeline.js
 * @description End-to-end SOLIQ EO Science Pipeline combining NASA POWER, GPM IMERG V07
 * (including binary NetCDF4), HLS v2.0 (including binary GeoTIFF/COG), multi-season water balance,
 * and interval-regret evaluation with all PR #17 reviewer safety guards preserved.
 */

import { fetchNasaPowerClimatology } from '../adapters/nasa-power.js';
import { fetchGpmImergV07 } from '../adapters/gpm-imerg.js';
import { fetchHlsOpticalSeries } from '../adapters/hls-optical.js';
import { loadPilotConfig } from './crop-library.js';
import { simulateMultiSeasonRotation } from './water-balance.js';
import { generateCandidateRotations } from './rotation-generator.js';
import { evaluateIntervalRegret } from './eo-interval-regret.js';

/**
 * Harmonizes daily meteorological forcing from NASA POWER and GPM IMERG V07.
 * Never fabricates missing dates as numeric zero; preserves missing days so
 * `simulateSeasonWaterBalance` counts `missingForcingDays` accurately.
 */
export function harmonizeDailyForcing(nasaPowerResult = {}, gpmImergResult = {}) {
  const powerMap = new Map();
  for (const r of nasaPowerResult.dailyRecords || []) {
    if (r && r.date) {
      powerMap.set(r.date, r);
    }
  }

  const imergMap = new Map();
  for (const r of gpmImergResult.records || []) {
    if (r && r.date) {
      imergMap.set(r.date, r);
    }
  }

  const allDates = Array.from(new Set([...powerMap.keys(), ...imergMap.keys()])).sort();
  const dailyForcing = [];

  for (const date of allDates) {
    const pRec = powerMap.get(date);
    const iRec = imergMap.get(date);

    const precipMmDay =
      iRec && iRec.valid && Number.isFinite(iRec.precipMmDay)
        ? iRec.precipMmDay
        : pRec && Number.isFinite(pRec.precipMmDay)
          ? pRec.precipMmDay
          : null;

    dailyForcing.push({
      date,
      et0MmDay: pRec?.et0MmDay ?? null,
      precipMmDay,
      tMaxC: pRec?.tMaxC ?? null,
      tMinC: pRec?.tMinC ?? null,
      precipSource:
        iRec && iRec.valid && Number.isFinite(iRec.precipMmDay)
          ? 'GPM_IMERG_V07'
          : pRec && Number.isFinite(pRec.precipMmDay)
            ? 'NASA_POWER_PRECTOTCORR'
            : 'MISSING'
    });
  }

  return dailyForcing;
}

/**
 * Executes the complete EO Science Pipeline while preserving all PR #17 reviewer guards:
 * - Any caller-supplied fixture (`nasaPowerPayload`, `gpmImergPayload`, `hlsPayload`, or offline binary bytes)
 *   sets `noVerifiableRemoteProvenance = true` and forces `comparison_only`.
 * - Any missing daily forcing day (`missingForcingDays > 0` or `overallForcingCoverageRatio < 1`)
 *   forces `comparison_only` with reason `'missing_daily_forcing_zero_imputation_diagnostic_only'`.
 * - Uncalibrated crop and soil parameters remain explicitly tagged `ASSUMED`.
 */
export async function runEoSciencePipeline(options = {}) {
  const {
    pilotId = 'zankalon',
    startDate = '2025-11-15',
    endDate = '2026-11-14',
    earthdataToken = process.env.EARTHDATA_TOKEN || process.env.NASA_EARTHDATA_TOKEN || null,
    nasaPowerPayload = null,
    gpmImergPayload = null,
    hlsPayload = null,
    imergBinaryBytes = null,
    hlsBinaryBytes = null,
    fetchImpl = globalThis.fetch
  } = options;

  const pilot = loadPilotConfig(pilotId);
  const { latitude, longitude } = pilot.coordinates;

  const [powerData, imergData, hlsData] = await Promise.all([
    fetchNasaPowerClimatology({
      latitude,
      longitude,
      startDate,
      endDate,
      cachedPayload: nasaPowerPayload,
      fetchImpl
    }),
    fetchGpmImergV07({
      latitude,
      longitude,
      startDate,
      endDate,
      earthdataToken,
      verifiedGranulePayload: gpmImergPayload,
      binaryGranuleBytes: imergBinaryBytes,
      fetchImpl
    }),
    fetchHlsOpticalSeries({
      latitude,
      longitude,
      startDate,
      endDate,
      earthdataToken,
      verifiedHlsPayload: hlsPayload,
      binaryGeoTiffBytes: hlsBinaryBytes,
      fetchImpl
    })
  ]);

  const dailyForcing = harmonizeDailyForcing(powerData, imergData);
  const candidateRotations = generateCandidateRotations(pilot);
  const simulatedRotations = candidateRotations.map((rot) => ({
    ...rot,
    ...simulateMultiSeasonRotation({
      rotation: rot,
      pilotConfig: pilot,
      dailyForcing
    })
  }));

  // PR #17 Reviewer Provenance & Auth / Network Guards
  const noVerifiableRemoteProvenance =
    Boolean(nasaPowerPayload || gpmImergPayload || hlsPayload || imergBinaryBytes || hlsBinaryBytes) ||
    [powerData, imergData, hlsData].some((x) => x?.status !== 'ok');

  const hasAuthOrNetworkBlocker =
    powerData.status !== 'ok' && !Array.isArray(powerData.dailyRecords)
      ? true
      : imergData.status && imergData.status !== 'ok'
        ? true
        : hlsData.status && hlsData.status !== 'ok'
          ? true
          : false;

  const comparisonOnlyReasons = [];
  if (noVerifiableRemoteProvenance) {
    comparisonOnlyReasons.push('unverified_or_incomplete_remote_eo_provenance');
  }
  if (hasAuthOrNetworkBlocker) {
    comparisonOnlyReasons.push('remote_eo_auth_or_network_blocker');
  }
  if (!pilot.isFieldCalibrated) {
    comparisonOnlyReasons.push('crop_and_soil_parameters_assumed_uncalibrated');
  }

  let regretEvaluation = evaluateIntervalRegret(simulatedRotations, {
    uncertaintyBounds: pilot.UncertaintyBoundsConfig,
    forceComparisonOnly: noVerifiableRemoteProvenance || hasAuthOrNetworkBlocker || !pilot.isFieldCalibrated,
    comparisonOnlyReasons
  });

  // PR #17 Reviewer Guard: Zero-filling a missing daily climate forcing is diagnostic-only, never decision-ready
  const missingDailyForcing = simulatedRotations.some(
    (r) =>
      r.overallForcingCoverageRatio < 1 ||
      r.seasonResults?.some((s) => s.missingForcingDays > 0)
  );
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
    pilot,
    evidenceSources: {
      nasaPower: powerData,
      gpmImerg: imergData,
      hlsOptical: hlsData
    },
    dailyForcingCount: dailyForcing.length,
    simulatedRotations,
    regretEvaluation,
    canIssueFieldAdvice: false,
    parametersEvidenceStatus: 'ASSUMED'
  };
}
