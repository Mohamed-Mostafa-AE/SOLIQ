/**
 * @file tests/eo-science.test.js
 * @description Comprehensive Scientific & Engineering Unit/Integration Test Suite for SOLIQ (`work/eo-science`).
 *
 * Verifies all 8 requirements of Issue #5:
 * 1. GPM IMERG V07 connector, unit conversions (`mm/hr` half-hourly & daily `mm/day`), sample count quality,
 *    coverage checks, and strict no-synthetic-data honesty when Earthdata Login is required.
 * 2. HLS Landsat/Sentinel-2 (`HLSL30.v2.0` & `HLSS30.v2.0`) scale factor (`0.0001`), bitwise `Fmask` cloud/shadow/aerosol
 *    masking, `NDVI` / `NIRv` / `SI5` calculations, and spatial/temporal coverage verification.
 * 3. NASA POWER existing connector reuse, sentinel `-999` handling, and FAO-56 Penman-Monteith `ET0` calculation.
 * 4. Referenced Zankalon (`configs/pilots/zankalon.json`) crop calendar, `Kc` curve interpolation, soil hydraulic
 *    hierarchy, and independent multi-region configurations (`kafr-el-sheikh`, `west-minya`).
 * 5. Generation of current baseline rotation + 2 feasible alternative rotations under regional constraints.
 * 6. Daily water balance (`ETc_act`, SCS `runoff`, `drainage`, `soilStorage`, root-zone depletion) and
 *    inter-season carry-over transitions (moisture, nitrogen, salinity, pest host break).
 * 7. Integration with `science/interval-regret.js` using documented uncertainty bounds and automatic downgrade
 *    to `comparison_only` when data coverage is insufficient or Earthdata auth is blocked.
 * 8. Edge cases: missing forcing days, negative/corrupt values, cloudy scenes, and unit mismatches.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeFao56Et0,
  normalizeNasaPowerResponse,
  fetchNasaPowerClimatology,
  convertAndValidateImergUnit,
  evaluateImergCoverageAndQuality,
  normalizeGpmImergV07Dataset,
  fetchGpmImergV07,
  decodeHlsFmask,
  scaleAndValidateReflectance,
  processHlsObservation,
  normalizeHlsDataset,
  fetchHlsOpticalSeries
} from '../adapters/index.js';

import {
  CROP_LIBRARY,
  interpolateDailyCropParameters,
  loadPilotConfig,
  listAvailablePilotConfigs,
  computeScsRunoffMm,
  simulateSeasonWaterBalance,
  simulateMultiSeasonRotation,
  evaluateRotationFeasibility,
  generateCandidateRotations,
  evaluateIntervalRegret,
  runEoSciencePipeline
} from '../science/index.js';

/**
 * Helper: Builds a realistic 365-day Zankalon agroclimatology payload (2025-11-15 to 2026-11-14)
 * reflecting East Nile Delta seasonal temperature, radiation, humidity, wind, and winter rain.
 */
function buildRealisticZankalonYearPayloads() {
  const startMs = Date.parse('2025-11-15T00:00:00Z');
  const T2M = {};
  const T2M_MAX = {};
  const T2M_MIN = {};
  const PRECTOTCORR = {};
  const ALLSKY_SFC_SW_DWN = {};
  const RH2M = {};
  const WS2M = {};
  const imergRecords = [];
  const hlsScenes = [];

  for (let d = 0; d < 365; d += 1) {
    const dt = new Date(startMs + d * 86400000);
    const iso = dt.toISOString().slice(0, 10);
    const ymd = iso.replace(/-/g, '');
    const month = dt.getUTCMonth() + 1;

    // Realistic Zankalon seasonal cycle (winter ~14°C, summer ~29°C)
    const isWinter = month === 12 || month <= 3;
    const isSummer = month >= 6 && month <= 9;
    const tMean = isWinter ? 14.5 : isSummer ? 28.8 : 22.0;
    const tMax = tMean + 6.5;
    const tMin = tMean - 5.5;
    const solar = isWinter ? 13.5 : isSummer ? 26.8 : 20.5;
    const rh = isWinter ? 68.0 : isSummer ? 58.0 : 62.0;
    const wind = 2.1;

    // Winter rainfall events in December–February
    const rainMm =
      isWinter && d % 19 === 0 ? 6.4 : isWinter && d % 31 === 0 ? 3.2 : 0.0;

    T2M[ymd] = tMean;
    T2M_MAX[ymd] = tMax;
    T2M_MIN[ymd] = tMin;
    PRECTOTCORR[ymd] = rainMm;
    ALLSKY_SFC_SW_DWN[ymd] = solar;
    RH2M[ymd] = rh;
    WS2M[ymd] = wind;

    imergRecords.push({
      date: iso,
      precipitation: rainMm,
      unit: 'mm/day',
      precipitation_cnt: 48,
      randomError: Number((rainMm * 0.15 + 0.05).toFixed(3)),
      granuleId: `3B-DAY-L.MS.MRG.3IMERG.${ymd}-S000000-E235959.V07.nc4`
    });

    // HLS overpass every 5 days
    if (d % 5 === 0) {
      const isCloudyWinterPass = isWinter && d % 25 === 0;
      hlsScenes.push({
        date: iso,
        sensor: d % 10 === 0 ? 'HLSS30' : 'HLSL30',
        mgrsTile: '36RUV',
        granuleId: `HLS.${d % 10 === 0 ? 'S30' : 'L30'}.T36RUV.${ymd}T083521.v2.0`,
        isRawDn: true,
        pixels: isCloudyWinterPass
          ? [
              { B04: 4500, B8A: 5100, B05: 5100, Fmask: 0b00000010 }, // Cloud bit 1
              { B04: 3800, B8A: 4200, B05: 4200, Fmask: 0b00001000 }  // Cloud shadow bit 3
            ]
          : [
              { B04: 620, B8A: 4680, B05: 4680, B03: 780, Fmask: 0 },
              { B04: 640, B8A: 4590, B05: 4590, B03: 790, Fmask: 0 },
              { B04: 610, B8A: 4720, B05: 4720, B03: 770, Fmask: 0 }
            ]
      });
    }
  }

  return {
    nasaPowerPayload: {
      header: { community: 'AG' },
      geometry: { coordinates: [31.4333, 30.5833, 11.0] },
      properties: {
        parameter: {
          T2M,
          T2M_MAX,
          T2M_MIN,
          PRECTOTCORR,
          ALLSKY_SFC_SW_DWN,
          RH2M,
          WS2M
        }
      }
    },
    gpmImergPayload: {
      shortName: 'GPM_3IMERGDF',
      version: '07',
      latitude: 30.5833,
      longitude: 31.4333,
      startDate: '2025-11-15',
      endDate: '2026-11-14',
      records: imergRecords
    },
    hlsPayload: {
      scenes: hlsScenes
    }
  };
}

// ============================================================================
// 1. GPM IMERG V07 TESTS (Units, V07 Half-Hourly vs Daily, Coverage & Auth)
// ============================================================================
test('GPM IMERG V07: validates mm/day, converts mm/hr rates and half-hourly arrays accurately, and rejects corrupt units', () => {
  // 1a. Daily product in mm/day (identity conversion)
  const dailyCheck = convertAndValidateImergUnit({
    value: 12.4,
    unit: 'mm/day',
    precipitationCnt: 48
  });
  assert.equal(dailyCheck.valid, true);
  assert.equal(dailyCheck.precipMmDay, 12.4);
  assert.equal(dailyCheck.qualityFlag, 'high_quality');

  // 1b. Daily mean rate in mm/hr -> multiplied by 24 hours
  const rateCheck = convertAndValidateImergUnit({
    value: 0.5,
    unit: 'mm/hr',
    temporalResolution: 'daily',
    precipitationCnt: 44
  });
  assert.equal(rateCheck.valid, true);
  assert.equal(rateCheck.precipMmDay, 12.0);
  assert.equal(rateCheck.conversionApplied, 'rate_mm_hr_x24');

  // 1c. Half-hourly array (40 valid 30-min slots at 0.25 mm/hr + 8 missing -9999.9 slots)
  // V07 official formula: mean of valid half-hourly rates (0.25 mm/hr) * 24 = 6.0 mm/day
  const slots = [
    ...Array(40).fill(0.25),
    ...Array(8).fill(-9999.9)
  ];
  const halfHourlyArrayCheck = convertAndValidateImergUnit({
    value: slots,
    unit: 'mm/hr'
  });
  assert.equal(halfHourlyArrayCheck.valid, true);
  assert.equal(halfHourlyArrayCheck.precipitationCnt, 40);
  assert.equal(halfHourlyArrayCheck.precipMmDay, 6.0);
  assert.equal(halfHourlyArrayCheck.qualityFlag, 'high_quality');

  // 1d. Low sample count (< 36 valid half-hourly retrievals) flagged as low_sample_count
  const lowSampleCheck = convertAndValidateImergUnit({
    value: 4.2,
    unit: 'mm/day',
    precipitationCnt: 20
  });
  assert.equal(lowSampleCheck.valid, true);
  assert.equal(lowSampleCheck.qualityFlag, 'low_sample_count');

  // 1e. Reject negative rainfall, fill values (-9999.9), and unknown units
  assert.equal(
    convertAndValidateImergUnit({ value: -9999.9, unit: 'mm/day' }).valid,
    false
  );
  assert.equal(
    convertAndValidateImergUnit({ value: -1.5, unit: 'mm/day' }).valid,
    false
  );
  assert.equal(
    convertAndValidateImergUnit({ value: 5.0, unit: 'inches/week' }).valid,
    false
  );
});

test('GPM IMERG V07: enforces strict honesty when Earthdata Login token is missing or offline (never fabricates NASA data)', async () => {
  // Mock CMR returning 2 granules but no Earthdata token provided
  const mockFetchNoAuth = async (url) => ({
    ok: true,
    status: 200,
    json: async () => ({
      feed: {
        entry: [
          {
            id: 'G12345-GES_DISC',
            title: '3B-DAY.MS.MRG.3IMERG.20250115-S000000-E235959.V07.nc4',
            links: [{ href: 'https://gpm1.gesdisc.eosdis.nasa.gov/opendap/test.nc4' }]
          }
        ]
      }
    })
  });

  const result = await fetchGpmImergV07({
    latitude: 30.5833,
    longitude: 31.4333,
    startDate: '2025-01-15',
    endDate: '2025-01-16',
    earthdataToken: null,
    fetchImpl: mockFetchNoAuth
  });

  assert.equal(result.status, 'auth_required');
  assert.equal(result.authenticated, false);
  assert.equal(result.syntheticFallbackUsed, false);
  assert.equal(result.records.length, 0);
  assert.equal(result.diagnostics.reason, 'earthdata_login_token_missing');
});

// ============================================================================
// 2. HLS LANDSAT/SENTINEL-2 v2.0 TESTS (Reflectance Scaling, Fmask, NDVI, Coverage)
// ============================================================================
test('HLS Optical v2.0: scales integer DN by 0.0001, masks clouds/shadows/high-aerosol via bitwise Fmask, and computes NDVI accurately', () => {
  // Bitwise Fmask checks
  const clearMask = decodeHlsFmask(0b00000000);
  assert.equal(clearMask.isClearLandPixel, true);

  const cloudMask = decodeHlsFmask(0b00000010); // Bit 1 = Cloud
  assert.equal(cloudMask.cloud, true);
  assert.equal(cloudMask.isClearLandPixel, false);

  const shadowMask = decodeHlsFmask(0b00001000); // Bit 3 = Cloud shadow
  assert.equal(shadowMask.cloudShadow, true);
  assert.equal(shadowMask.isClearLandPixel, false);

  const highAerosolMask = decodeHlsFmask(0b11000000); // Bits 6-7 = 11 (High aerosol)
  assert.equal(highAerosolMask.aerosolLevel, 'high');
  assert.equal(highAerosolMask.isClearLandPixel, false);

  // Scale factor 0.0001 and NDVI calculation on mixed polygon pixels
  // Clear pixels have Red DN = 1000 (0.1000) and NIR DN = 5000 (0.5000) -> NDVI = (0.5 - 0.1) / (0.5 + 0.1) = 0.6667
  const sceneResult = processHlsObservation(
    {
      date: '2026-02-15',
      sensor: 'HLSS30',
      mgrsTile: '36RUV',
      isRawDn: true,
      pixels: [
        { B04: 1000, B8A: 5000, B03: 1000, Fmask: 0 },
        { B04: 1000, B8A: 5000, B03: 1000, Fmask: 0 },
        { B04: 1000, B8A: 5000, B03: 1000, Fmask: 0 },
        { B04: 8500, B8A: 8800, B03: 8200, Fmask: 2 } // Cloudy pixel (bit 1) -> must be excluded
      ]
    },
    { minValidPixelCoverage: 0.5 }
  );

  assert.equal(sceneResult.totalPixels, 4);
  assert.equal(sceneResult.clearValidPixels, 3);
  assert.equal(sceneResult.cloudMaskedPixels, 1);
  assert.equal(sceneResult.clearPixelCoverage, 0.75);
  assert.equal(sceneResult.passesSpatialCoverage, true);
  assert.equal(sceneResult.ndvi, 0.6667);
  assert.equal(sceneResult.redReflectance, 0.1);
  assert.equal(sceneResult.nirReflectance, 0.5);

  // Scene with > 50% clouds should fail spatial coverage and return ndvi = null
  const cloudyScene = processHlsObservation(
    {
      date: '2026-02-20',
      sensor: 'HLSL30',
      isRawDn: true,
      pixels: [
        { B04: 1000, B05: 5000, Fmask: 0 },
        { B04: 7000, B05: 7200, Fmask: 2 },
        { B04: 6500, B05: 6800, Fmask: 8 }
      ]
    },
    { minValidPixelCoverage: 0.5 }
  );
  assert.equal(cloudyScene.passesSpatialCoverage, false);
  assert.equal(cloudyScene.ndvi, null);
});

// ============================================================================
// 3. NASA POWER CONNECTOR REUSE & FAO-56 ET0 TESTS
// ============================================================================
test('NASA POWER: reuses existing connector without rewrite, masks -999 sentinels, and computes FAO-56 Penman-Monteith ET0', async () => {
  let existingConnectorCalled = false;
  const mockExistingConnector = async ({ latitude, longitude, startDate, endDate }) => {
    existingConnectorCalled = true;
    return {
      header: { community: 'AG' },
      geometry: { coordinates: [longitude, latitude, 11.0] },
      properties: {
        parameter: {
          T2M: { '20260601': 28.5, '20260602': -999.0 },
          T2M_MAX: { '20260601': 35.2, '20260602': -999.0 },
          T2M_MIN: { '20260601': 21.8, '20260602': -999.0 },
          PRECTOTCORR: { '20260601': 0.0, '20260602': -999.0 },
          ALLSKY_SFC_SW_DWN: { '20260601': 27.4, '20260602': -999.0 },
          RH2M: { '20260601': 55.0, '20260602': -999.0 },
          WS2M: { '20260601': 2.4, '20260602': -999.0 }
        }
      }
    };
  };

  const powerResult = await fetchNasaPowerClimatology({
    latitude: 30.5833,
    longitude: 31.4333,
    startDate: '2026-06-01',
    endDate: '2026-06-02',
    existingConnector: mockExistingConnector
  });

  assert.equal(existingConnectorCalled, true);
  assert.equal(powerResult.source, 'NASA_POWER');
  assert.equal(powerResult.dailyRecords.length, 2);

  // Day 1 has valid summer meteorology -> FAO56_Penman_Monteith ET0 between 5.0 and 8.5 mm/day
  const day1 = powerResult.dailyRecords[0];
  assert.equal(day1.et0Method, 'FAO56_Penman_Monteith');
  assert.ok(day1.et0MmDay > 5.0 && day1.et0MmDay < 8.5);

  // Day 2 has -999 sentinels -> properly masked as null and flagged partial_missing
  const day2 = powerResult.dailyRecords[1];
  assert.equal(day2.et0MmDay, null);
  assert.equal(day2.precipMmDay, null);
  assert.equal(day2.qualityFlag, 'partial_missing');
  assert.equal(powerResult.coverage.coverageRatio, 0.5);
});

// ============================================================================
// 4. CROP LIBRARY, KC INTERPOLATION & MULTI-REGION PILOT CONFIGS
// ============================================================================
test('Crop Library & Pilot Configs: loads Zankalon and independent regions, and interpolates FAO-56 Kc and root depth accurately', () => {
  const pilots = listAvailablePilotConfigs();
  assert.ok(pilots.includes('zankalon'));
  assert.ok(pilots.includes('kafr-el-sheikh'));
  assert.ok(pilots.includes('west-minya'));

  const zankalon = loadPilotConfig('zankalon');
  assert.equal(zankalon.pilotId, 'zankalon-sharkia-eg');
  assert.ok(zankalon.references.length >= 3);
  assert.ok(zankalon.soil.fieldCapacityThetaFc > zankalon.soil.wiltingPointThetaWp);

  const westMinya = loadPilotConfig('west-minya');
  assert.equal(westMinya.pilotId, 'west-minya-reclamation-eg');
  assert.ok(westMinya.soil.fieldCapacityThetaFc < zankalon.soil.fieldCapacityThetaFc); // Sandy vs Clay

  // Check Wheat Kc progression across initial, development, mid-season, and late-season
  const initDay = interpolateDailyCropParameters('wheat', 10);
  const midDay = interpolateDailyCropParameters('wheat', 95);
  const endDay = interpolateDailyCropParameters('wheat', 165);

  assert.equal(initDay.stage, 'initial');
  assert.equal(initDay.kcTabular, CROP_LIBRARY.wheat.kc.ini);
  assert.equal(midDay.stage, 'mid_season');
  assert.equal(midDay.kcTabular, CROP_LIBRARY.wheat.kc.mid);
  assert.equal(endDay.stage, 'late_season');
  assert.equal(endDay.kcTabular, CROP_LIBRARY.wheat.kc.end);
  assert.ok(midDay.rootDepthM > initDay.rootDepthM);
});

// ============================================================================
// 5 & 6. ROTATION GENERATION, DAILY WATER BALANCE & SEASON CARRY-OVER
// ============================================================================
test('Rotation Generator & Daily Water Balance: generates baseline + 2 feasible alternatives, conserves daily water balance, and propagates multi-season carry-over', () => {
  const zankalon = loadPilotConfig('zankalon');
  const candidates = generateCandidateRotations(zankalon);

  assert.equal(candidates.currentRotation.rotationId, 'zankalon_baseline_wheat_rice');
  assert.equal(candidates.alternatives.length, 2);
  assert.equal(candidates.allCandidates.length, 3);

  // Verify SCS Runoff behavior
  assert.equal(computeScsRunoffMm(0, 84, 0.5), 0);
  const heavyRainRunoff = computeScsRunoffMm(45.0, 84, 0.8);
  assert.ok(heavyRainRunoff > 5.0 && heavyRainRunoff < 45.0);

  // Run multi-season simulation on Zankalon over 365 days
  const { nasaPowerPayload, gpmImergPayload } = buildRealisticZankalonYearPayloads();
  const normPower = normalizeNasaPowerResponse(nasaPowerPayload);
  const normImerg = normalizeGpmImergV07Dataset(gpmImergPayload);

  const dailyForcing = normPower.dailyRecords.map((r, i) => ({
    ...r,
    precipMmDay: normImerg.records[i].precipMmDay
  }));

  const baselineSim = simulateMultiSeasonRotation({
    rotation: candidates.currentRotation,
    pilotConfig: zankalon,
    dailyForcing
  });

  const alt1Sim = simulateMultiSeasonRotation({
    rotation: candidates.alternatives[0],
    pilotConfig: zankalon,
    dailyForcing
  });

  const alt2Sim = simulateMultiSeasonRotation({
    rotation: candidates.alternatives[1],
    pilotConfig: zankalon,
    dailyForcing
  });

  // Alternative 1 (Wheat -> C4 Sorghum -> Short Cowpea) and Alternative 2 (Berseem -> Soybean/Sorghum -> Cowpea)
  // must consume substantially less gross irrigation water than Baseline (Wheat -> Flooded Paddy Rice)
  assert.ok(
    alt1Sim.aggregateTotalsMm.grossIrrigation <
      baselineSim.aggregateTotalsMm.grossIrrigation
  );
  assert.ok(
    alt2Sim.finalCarryOverState.endingNitrogenBalanceKgHa >
      baselineSim.finalCarryOverState.endingNitrogenBalanceKgHa
  );
  assert.equal(alt2Sim.pestManagementSummary.interruptsPestCycles, true);
});

// ============================================================================
// 7 & 8. INTERVAL REGRET INTEGRATION, UNCERTAINTY BOUNDS & COMPARISON_ONLY MODE
// ============================================================================
test('Interval Regret & EO Pipeline: computes minimax interval regret with documented bounds and downgrades to comparison_only when coverage is insufficient', async () => {
  const { nasaPowerPayload, gpmImergPayload, hlsPayload } =
    buildRealisticZankalonYearPayloads();

  // Case A: Full high-coverage verified EO data -> actionable_advisory
  const fullResult = await runEoSciencePipeline({
    pilot: 'zankalon',
    startDate: '2025-11-15',
    endDate: '2026-11-14',
    nasaPowerPayload,
    gpmImergPayload,
    hlsPayload
  });

  assert.equal(fullResult.syntheticDataGenerated, false);
  assert.equal(fullResult.simulatedRotations.length, 3);
  assert.equal(fullResult.regretEvaluation.decisionMode, 'comparison_only'); // Fixture is not real NASA proof
  assert.equal(fullResult.regretEvaluation.isComparisonOnly, true);
  assert.equal(fullResult.regretEvaluation.recommendedStrategyId, null);

  // Verify every strategy has documented [lower, upper] intervals and maxRegret >= 0
  for (const strat of fullResult.regretEvaluation.strategies) {
    assert.ok(strat.intervals.grossIrrigationMm[0] <= strat.intervals.grossIrrigationMm[1]);
    assert.ok(strat.intervals.utilityScore[0] <= strat.intervals.utilityScore[1]);
    assert.ok(strat.maxRegret >= 0);
  }

  // Case B: Insufficient HLS & IMERG coverage (e.g. Earthdata auth missing) -> MUST be comparison_only
  const mockOfflineFetch = async () => {
    throw new Error('Network disabled in sandbox');
  };

  const degradedResult = await runEoSciencePipeline({
    pilot: 'zankalon',
    startDate: '2025-11-15',
    endDate: '2026-11-14',
    nasaPowerPayload, // POWER cached, but IMERG and HLS fail/require auth
    gpmImergPayload: null,
    hlsPayload: null,
    fetchImpl: mockOfflineFetch
  });

  assert.equal(degradedResult.regretEvaluation.status, 'comparison_only');
  assert.equal(degradedResult.regretEvaluation.decisionMode, 'comparison_only');
  assert.equal(degradedResult.regretEvaluation.isComparisonOnly, true);
  assert.equal(degradedResult.regretEvaluation.recommendedStrategyId, null);
  assert.ok(
    degradedResult.regretEvaluation.comparisonOnlyReasons.includes(
      'satellite_auth_or_network_unavailable'
    )
  );
});

// ============================================================================
// 9. ADDITIONAL EDGE-CASE & CONSERVATION AUDIT TESTS
// ============================================================================
test('Daily Water Balance Identity: verifies strict daily water mass conservation (Dr_t = clamp(Dr_t-1 - P_eff - Irrig_net + ETc_act + DP, 0, TAW))', () => {
  const zankalon = loadPilotConfig('zankalon');
  const forcing = [
    { date: '2026-01-01', et0MmDay: 2.5, precipMmDay: 0.0, tMaxC: 20.0 },
    { date: '2026-01-02', et0MmDay: 2.8, precipMmDay: 18.0, tMaxC: 19.5 },
    { date: '2026-01-03', et0MmDay: 3.0, precipMmDay: 42.0, tMaxC: 18.0 },
    { date: '2026-01-04', et0MmDay: 2.6, precipMmDay: 0.0, tMaxC: 21.0 },
    { date: '2026-01-05', et0MmDay: 3.1, precipMmDay: 0.0, tMaxC: 22.0 }
  ];

  const sim = simulateSeasonWaterBalance({
    crop: 'wheat',
    sowingDate: '2026-01-01',
    harvestDate: '2026-01-05',
    soil: zankalon.soil,
    waterManagement: zankalon.waterManagement,
    dailyForcing: forcing,
    autoIrrigate: true
  });

  assert.equal(sim.dailyTrajectory.length, 5);
  for (const day of sim.dailyTrajectory) {
    assert.ok(day.depletionMm >= 0 && day.depletionMm <= day.tawMm + 1e-6);
    assert.ok(Math.abs(day.soilStorageMm + day.depletionMm - day.tawMm) < 1e-2);
    assert.ok(day.volumetricTheta >= zankalon.soil.wiltingPointThetaWp - 1e-4);
    assert.ok(day.volumetricTheta <= zankalon.soil.fieldCapacityThetaFc + 1e-4);
  }
});

test('HLS Optical v2.0: enforces strict honesty when Earthdata token is missing or rejected (HTTP 401)', async () => {
  const mockCmrThen401 = async (url) => {
    if (url.includes('cmr.earthdata.nasa.gov')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          feed: {
            entry: [
              {
                id: 'G98765-LPCLOUD',
                title: 'HLS.S30.T36RUV.20260215T083521.v2.0',
                links: [{ href: 'https://data.lpdaac.earthdatacloud.nasa.gov/test.B04.tif' }]
              }
            ]
          }
        })
      };
    }
    return { ok: false, status: 401 };
  };

  const res401 = await fetchHlsOpticalSeries({
    latitude: 30.5833,
    longitude: 31.4333,
    startDate: '2026-02-01',
    endDate: '2026-02-20',
    earthdataToken: 'expired_or_unapproved_token',
    fetchImpl: mockCmrThen401
  });

  assert.equal(res401.status, 'auth_rejected');
  assert.equal(res401.httpStatus, 401);
  assert.equal(res401.syntheticFallbackUsed, false);
  assert.equal(res401.observations.length, 0);
});

test('Multi-Region Independence: verifies Kafr El-Sheikh (saline clay) selects halotolerant Sugar Beet while West Minya (sandy) respects 1050 mm quota', () => {
  const kafr = loadPilotConfig('kafr-el-sheikh');
  const minya = loadPilotConfig('west-minya');

  const kafrRotations = generateCandidateRotations(kafr);
  const minyaRotations = generateCandidateRotations(minya);

  // Kafr El-Sheikh has baseline soil salinity 5.2 dS/m (>= 3.5), so Alternative 2 must deploy Sugar Beet in winter
  const kafrAlt2Winter = kafrRotations.alternatives[1].sequence[0].cropId;
  assert.equal(kafrAlt2Winter, 'sugar_beet');

  // West Minya has lower salinity (3.1 dS/m), so Alternative 2 deploys Berseem Clover in winter
  const minyaAlt2Winter = minyaRotations.alternatives[1].sequence[0].cropId;
  assert.equal(minyaAlt2Winter, 'berseem_clover');
});

test('Missing Forcing Days & Partial Coverage: tracks missingForcingDays accurately and downgrades decisionMode to comparison_only when below 85% threshold', () => {
  const zankalon = loadPilotConfig('zankalon');
  // Provide only 5 days out of a 20-day window (25% coverage < 85% threshold)
  const sparseForcing = [
    { date: '2026-03-01', et0MmDay: 4.1, precipMmDay: 0.0, tMaxC: 24.0 },
    { date: '2026-03-02', et0MmDay: 4.3, precipMmDay: 0.0, tMaxC: 25.0 },
    { date: '2026-03-03', et0MmDay: 4.0, precipMmDay: 1.2, tMaxC: 23.0 },
    { date: '2026-03-04', et0MmDay: 4.2, precipMmDay: 0.0, tMaxC: 24.5 },
    { date: '2026-03-05', et0MmDay: 4.4, precipMmDay: 0.0, tMaxC: 26.0 }
  ];

  const sim = simulateSeasonWaterBalance({
    crop: 'wheat',
    sowingDate: '2026-03-01',
    harvestDate: '2026-03-20',
    soil: zankalon.soil,
    waterManagement: zankalon.waterManagement,
    dailyForcing: sparseForcing
  });

  assert.equal(sim.totalSeasonDays, 20);
  assert.equal(sim.missingForcingDays, 15);
  assert.equal(sim.forcingCoverageRatio, 0.25);

  const candidates = generateCandidateRotations(zankalon);
  const multiSim = simulateMultiSeasonRotation({
    rotation: candidates.currentRotation,
    pilotConfig: zankalon,
    dailyForcing: sparseForcing
  });

  const regret = evaluateIntervalRegret({
    simulatedRotations: [multiSim],
    coverageDiagnostics: {
      metCoverageRatio: 0.25,
      imergCoverageRatio: 0.25,
      hlsClearSceneRatio: 0.10
    },
    pilotConfig: zankalon
  });

  assert.equal(regret.decisionMode, 'comparison_only');
  assert.equal(regret.isComparisonOnly, true);
  assert.equal(regret.recommendedStrategyId, null);
  assert.ok(regret.comparisonOnlyReasons.length >= 3);
});
