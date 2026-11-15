/**
 * @file tests/eo-science.test.js
 * @description Core unit test suite for SOLIQ EO adapters and agronomic science models.
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

test('NASA POWER adapter normalizes daily meteorology, preserves -999 as null, and computes FAO-56 ET0', () => {
  const samplePayload = {
    header: { time_standard: 'UTC' },
    geometry: { coordinates: [31.4333, 30.5833, 11.0] },
    properties: {
      parameter: {
        T2M_MAX: { '20251115': 26.4, '20251116': -999.0 },
        T2M_MIN: { '20251115': 14.2, '20251116': -999.0 },
        T2M: { '20251115': 19.8, '20251116': -999.0 },
        PRECTOTCORR: { '20251115': 1.2, '20251116': -999.0 },
        ALLSKY_SFC_SW_DWN: { '20251115': 16.5, '20251116': -999.0 },
        RH2M: { '20251115': 58.0, '20251116': -999.0 },
        WS2M: { '20251115': 2.1, '20251116': -999.0 }
      }
    }
  };

  const normalized = normalizeNasaPowerResponse(samplePayload);
  assert.equal(normalized.dailyRecords.length, 2);
  assert.equal(normalized.dailyRecords[0].valid, true);
  assert.ok(normalized.dailyRecords[0].et0MmDay > 2.0 && normalized.dailyRecords[0].et0MmDay < 6.0);
  assert.equal(normalized.dailyRecords[1].valid, false);
  assert.equal(normalized.dailyRecords[1].tMaxC, null);
  assert.equal(normalized.dailyRecords[1].precipMmDay, null);
  assert.equal(normalized.dailyRecords[1].et0MmDay, null);
});

test('GPM IMERG V07 unit converter handles mm/day and half-hourly mm/hr arrays while rejecting -9999.9 fill values', () => {
  const dailyValid = convertAndValidateImergUnit({ value: 8.5, unit: 'mm/day' });
  assert.equal(dailyValid.valid, true);
  assert.equal(dailyValid.precipMmDay, 8.5);

  const halfHourlyRates = Array.from({ length: 48 }, () => 0.25);
  const hhValid = convertAndValidateImergUnit({ halfHourlyRatesMmHr: halfHourlyRates, unit: 'mm/hr' });
  assert.equal(hhValid.valid, true);
  assert.equal(hhValid.precipMmDay, 6.0);

  const fillCheck = convertAndValidateImergUnit({ value: -9999.9, unit: 'mm/day' });
  assert.equal(fillCheck.valid, false);
  assert.equal(fillCheck.precipMmDay, null);
});

test('HLS v2.0 Fmask decoder and reflectance scaler mask clouds/shadows and compute valid NDVI', () => {
  const clearFmask = decodeHlsFmask(0b01000000); // low aerosol, clear land
  assert.equal(clearFmask.usableClearLand, true);

  const cloudyFmask = decodeHlsFmask(0b00000010); // bit 1 = cloud
  assert.equal(cloudyFmask.usableClearLand, false);
  assert.equal(cloudyFmask.cloud, true);

  const obsClear = processHlsObservation({
    date: '2026-02-14',
    B04: 800,
    B08: 4200,
    fmask: 64
  });
  assert.equal(obsClear.valid, true);
  assert.equal(obsClear.ndvi, 0.68);
  assert.equal(obsClear.canInferBareSoilDirectly, false);
});

test('Pilot configs and daily water balance close mass conservation within <= 1e-6 mm', () => {
  const pilots = listAvailablePilotConfigs();
  assert.deepEqual(pilots, ['kafr-el-sheikh', 'west-minya', 'zankalon']);

  const zankalon = loadPilotConfig('zankalon');
  const forcing = [
    { date: '2026-01-01', et0MmDay: 3.2, precipMmDay: 0.0, tMaxC: 20 },
    { date: '2026-01-02', et0MmDay: 3.4, precipMmDay: 12.0, tMaxC: 19 },
    { date: '2026-01-03', et0MmDay: 3.1, precipMmDay: 0.0, tMaxC: 21 }
  ];

  const sim = simulateSeasonWaterBalance({
    crop: 'wheat',
    sowingDate: '2026-01-01',
    harvestDate: '2026-01-03',
    soil: zankalon.soil,
    waterManagement: zankalon.waterManagement,
    dailyForcing: forcing
  });

  assert.equal(sim.massBalanceClosed, true);
  assert.ok(sim.maxClosureResidualMm <= 1e-6);
  assert.equal(sim.canIssueFieldAdvice, false);
});

test('End-to-end EO science pipeline generates R0/R1/R2 and abstains to comparison_only on uncalibrated/offline inputs', async () => {
  const result = await runEoSciencePipeline({
    pilotId: 'zankalon',
    startDate: '2025-11-15',
    endDate: '2025-11-20',
    fetchImpl: null
  });

  assert.equal(result.simulatedRotations.length, 3);
  assert.equal(result.regretEvaluation.decisionMode, 'comparison_only');
  assert.equal(result.canIssueFieldAdvice, false);
  assert.equal(result.parametersEvidenceStatus, 'ASSUMED');
});
