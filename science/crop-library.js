/**
 * @file science/crop-library.js
 * @description Sourced Egyptian agronomic crop library (FAO-56 dual Kc, rooting depth,
 * depletion fraction p, FAO-29 salinity threshold & slope, yield response Ky) and pilot loader.
 *
 * Calibration & Evidence Policy (Requirement 5):
 * Every literature-derived crop entry and pilot soil/water configuration without a cryptographic
 * wet-lab/lysimeter calibration receipt is explicitly tagged with:
 *   evidenceStatus: "ASSUMED"
 *   evidenceKind: "assumed"
 *   calibrationStatus: "ASSUMED_UNCALIBRATED_LITERATURE"
 *   isFieldCalibrated: false
 *   canIssueCalibratedFieldAdvice: false
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeCropParameterAssumptions,
  normalizePilotSoilAndWaterAssumptions
} from './crop-soil-assumptions-audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_CROP_LIBRARY = {
  wheat: {
    cropId: 'wheat',
    nameEn: 'Bread Wheat (Triticum aestivum)',
    nameAr: 'قمح الخبز الشتوي',
    botanicalFamily: 'Poaceae',
    seasonCategory: 'winter',
    isNitrogenFixer: false,
    nitrogenBalanceKgHa: -45,
    stagesDays: { initial: 30, development: 45, midSeason: 55, lateSeason: 35, total: 165 },
    kcb: { initial: 0.15, mid: 1.1, end: 0.25 },
    rootDepthM: { initial: 0.2, max: 1.2 },
    depletionFractionP: 0.55,
    yieldResponseKy: 1.05,
    salinityFao29: { thresholdEcDsm: 6.0, slopePctPerDsm: 7.1 },
    maxHeightM: 1.0,
    referenceBaselineYieldTonHa: 6.8,
    referenceWaterProductivityKgM3: 1.35,
    grossMarginAnchorUsdHa: 1150,
    citations: ['fao56_allen_1998', 'fao29_ayers_westcot_1985', 'ayyad_2024_zankalon']
  },
  paddy_rice: {
    cropId: 'paddy_rice',
    nameEn: 'Paddy Rice (Oryza sativa)',
    nameAr: 'أرز صيفي مغمور',
    botanicalFamily: 'Poaceae',
    seasonCategory: 'summer',
    isNitrogenFixer: false,
    nitrogenBalanceKgHa: -55,
    stagesDays: { initial: 30, development: 30, midSeason: 45, lateSeason: 25, total: 130 },
    kcb: { initial: 1.0, mid: 1.15, end: 0.7 },
    rootDepthM: { initial: 0.15, max: 0.6 },
    depletionFractionP: 0.2,
    yieldResponseKy: 1.2,
    salinityFao29: { thresholdEcDsm: 3.0, slopePctPerDsm: 12.0 },
    maxHeightM: 0.95,
    referenceBaselineYieldTonHa: 9.2,
    referenceWaterProductivityKgM3: 0.72,
    grossMarginAnchorUsdHa: 1320,
    citations: ['fao56_allen_1998', 'fao29_ayers_westcot_1985', 'nile_delta_eddy_et_2017']
  },
  grain_maize: {
    cropId: 'grain_maize',
    nameEn: 'Grain Maize (Zea mays)',
    nameAr: 'ذرة شامية صيفية',
    botanicalFamily: 'Poaceae',
    seasonCategory: 'summer',
    isNitrogenFixer: false,
    nitrogenBalanceKgHa: -60,
    stagesDays: { initial: 20, development: 35, midSeason: 40, lateSeason: 30, total: 125 },
    kcb: { initial: 0.15, mid: 1.15, end: 0.35 },
    rootDepthM: { initial: 0.2, max: 1.2 },
    depletionFractionP: 0.55,
    yieldResponseKy: 1.25,
    salinityFao29: { thresholdEcDsm: 1.7, slopePctPerDsm: 12.0 },
    maxHeightM: 2.1,
    referenceBaselineYieldTonHa: 8.4,
    referenceWaterProductivityKgM3: 1.18,
    grossMarginAnchorUsdHa: 1180,
    citations: ['fao56_allen_1998', 'fao29_ayers_westcot_1985', 'ayyad_2024_zankalon']
  },
  grain_sorghum: {
    cropId: 'grain_sorghum',
    nameEn: 'Grain Sorghum (Sorghum bicolor)',
    nameAr: 'ذرة رفيعة مقاومة للجفاف والملوحة',
    botanicalFamily: 'Poaceae',
    seasonCategory: 'summer',
    isNitrogenFixer: false,
    nitrogenBalanceKgHa: -30,
    stagesDays: { initial: 20, development: 30, midSeason: 40, lateSeason: 30, total: 120 },
    kcb: { initial: 0.15, mid: 1.0, end: 0.35 },
    rootDepthM: { initial: 0.25, max: 1.4 },
    depletionFractionP: 0.55,
    yieldResponseKy: 0.9,
    salinityFao29: { thresholdEcDsm: 6.8, slopePctPerDsm: 16.0 },
    maxHeightM: 1.8,
    referenceBaselineYieldTonHa: 6.1,
    referenceWaterProductivityKgM3: 1.32,
    grossMarginAnchorUsdHa: 1090,
    citations: ['fao56_allen_1998', 'fao29_ayers_westcot_1985']
  },
  berseem_clover: {
    cropId: 'berseem_clover',
    nameEn: 'Egyptian Berseem Clover (Trifolium alexandrinum)',
    nameAr: 'برسيم مصري مسقاوي مثبت للنيتروجين',
    botanicalFamily: 'Fabaceae',
    seasonCategory: 'winter',
    isNitrogenFixer: true,
    nitrogenBalanceKgHa: 85,
    stagesDays: { initial: 25, development: 35, midSeason: 65, lateSeason: 25, total: 150 },
    kcb: { initial: 0.3, mid: 1.05, end: 0.85 },
    rootDepthM: { initial: 0.2, max: 0.9 },
    depletionFractionP: 0.5,
    yieldResponseKy: 0.95,
    salinityFao29: { thresholdEcDsm: 1.5, slopePctPerDsm: 5.7 },
    maxHeightM: 0.65,
    referenceBaselineYieldTonHa: 55.0,
    referenceWaterProductivityKgM3: 2.1,
    grossMarginAnchorUsdHa: 1260,
    citations: ['fao_berseem_x7660e', 'fao56_allen_1998', 'nile_delta_eddy_et_2017']
  },
  faba_bean: {
    cropId: 'faba_bean',
    nameEn: 'Faba Bean (Vicia faba)',
    nameAr: 'فول بلدي شتوي',
    botanicalFamily: 'Fabaceae',
    seasonCategory: 'winter',
    isNitrogenFixer: true,
    nitrogenBalanceKgHa: 65,
    stagesDays: { initial: 25, development: 35, midSeason: 50, lateSeason: 30, total: 140 },
    kcb: { initial: 0.15, mid: 1.1, end: 0.3 },
    rootDepthM: { initial: 0.2, max: 0.85 },
    depletionFractionP: 0.45,
    yieldResponseKy: 1.1,
    salinityFao29: { thresholdEcDsm: 1.6, slopePctPerDsm: 9.6 },
    maxHeightM: 0.9,
    referenceBaselineYieldTonHa: 3.9,
    referenceWaterProductivityKgM3: 1.15,
    grossMarginAnchorUsdHa: 1210,
    citations: ['fao56_allen_1998', 'fao29_ayers_westcot_1985', 'nile_delta_eddy_et_2017']
  },
  sugar_beet: {
    cropId: 'sugar_beet',
    nameEn: 'Sugar Beet (Beta vulgaris)',
    nameAr: 'بنجر السكر المتحمل للملوحة',
    botanicalFamily: 'Amaranthaceae',
    seasonCategory: 'winter',
    isNitrogenFixer: false,
    nitrogenBalanceKgHa: -35,
    stagesDays: { initial: 30, development: 45, midSeason: 60, lateSeason: 40, total: 175 },
    kcb: { initial: 0.15, mid: 1.15, end: 0.6 },
    rootDepthM: { initial: 0.2, max: 1.1 },
    depletionFractionP: 0.55,
    yieldResponseKy: 0.85,
    salinityFao29: { thresholdEcDsm: 7.0, slopePctPerDsm: 5.9 },
    maxHeightM: 0.5,
    referenceBaselineYieldTonHa: 52.0,
    referenceWaterProductivityKgM3: 1.65,
    grossMarginAnchorUsdHa: 1290,
    citations: ['fao56_allen_1998', 'fao29_ayers_westcot_1985', 'nile_delta_eddy_et_2017']
  },
  soybean: {
    cropId: 'soybean',
    nameEn: 'Soybean (Glycine max)',
    nameAr: 'فول صويا صيفي',
    botanicalFamily: 'Fabaceae',
    seasonCategory: 'summer',
    isNitrogenFixer: true,
    nitrogenBalanceKgHa: 55,
    stagesDays: { initial: 20, development: 30, midSeason: 45, lateSeason: 25, total: 120 },
    kcb: { initial: 0.15, mid: 1.1, end: 0.35 },
    rootDepthM: { initial: 0.2, max: 1.0 },
    depletionFractionP: 0.5,
    yieldResponseKy: 0.85,
    salinityFao29: { thresholdEcDsm: 5.0, slopePctPerDsm: 20.0 },
    maxHeightM: 0.85,
    referenceBaselineYieldTonHa: 3.4,
    referenceWaterProductivityKgM3: 0.82,
    grossMarginAnchorUsdHa: 1120,
    citations: ['fao56_allen_1998', 'fao29_ayers_westcot_1985']
  },
  short_season_cowpea: {
    cropId: 'short_season_cowpea',
    nameEn: 'Short-Season Cowpea / Nili Pulse (Vigna unguiculata)',
    nameAr: 'لوبيا نيلى قصيرة العمر مثبتة للنيتروجين',
    botanicalFamily: 'Fabaceae',
    seasonCategory: 'fallow_window',
    isNitrogenFixer: true,
    nitrogenBalanceKgHa: 40,
    stagesDays: { initial: 15, development: 20, midSeason: 25, lateSeason: 15, total: 75 },
    kcb: { initial: 0.15, mid: 0.95, end: 0.35 },
    rootDepthM: { initial: 0.18, max: 0.75 },
    depletionFractionP: 0.55,
    yieldResponseKy: 0.9,
    salinityFao29: { thresholdEcDsm: 4.9, slopePctPerDsm: 12.0 },
    maxHeightM: 0.55,
    referenceBaselineYieldTonHa: 2.2,
    referenceWaterProductivityKgM3: 0.95,
    grossMarginAnchorUsdHa: 640,
    citations: ['fao56_allen_1998', 'fao29_ayers_westcot_1985']
  },
  bare_fallow: {
    cropId: 'bare_fallow',
    nameEn: 'Bare Soil Fallow Window',
    nameAr: 'فترة راحة التربة (بور)',
    botanicalFamily: 'None',
    seasonCategory: 'fallow_window',
    isNitrogenFixer: false,
    nitrogenBalanceKgHa: 0,
    stagesDays: { initial: 15, development: 15, midSeason: 15, lateSeason: 10, total: 55 },
    kcb: { initial: 0.0, mid: 0.0, end: 0.0 },
    rootDepthM: { initial: 0.15, max: 0.15 },
    depletionFractionP: 0.6,
    yieldResponseKy: 0.0,
    salinityFao29: { thresholdEcDsm: 12.0, slopePctPerDsm: 0.0 },
    maxHeightM: 0.0,
    referenceBaselineYieldTonHa: 0.0,
    referenceWaterProductivityKgM3: 0.0,
    grossMarginAnchorUsdHa: 0,
    citations: ['fao56_allen_1998']
  }
};

export const CROP_LIBRARY = Object.freeze(
  Object.fromEntries(
    Object.entries(RAW_CROP_LIBRARY).map(([k, v]) => [k, normalizeCropParameterAssumptions(v)])
  )
);

/**
 * Interpolates daily FAO-56 basal crop coefficient (`Kcb`), rooting depth (`Zr`),
 * and depletion fraction (`p`) for day after sowing (`dayAfterSowing`, 1-indexed).
 */
export function interpolateDailyCropParameters(cropOrId, dayAfterSowing = 1, options = {}) {
  const crop = typeof cropOrId === 'string' ? CROP_LIBRARY[cropOrId] : cropOrId;
  if (!crop) {
    throw new Error(`Unknown cropId: "${cropOrId}"`);
  }

  const d = Math.max(1, Number(dayAfterSowing) || 1);
  const { initial, development, midSeason, lateSeason, total } = crop.stagesDays;
  const endInit = initial;
  const endDev = initial + development;
  const endMid = endDev + midSeason;

  let kcb = crop.kcb.initial;
  let stageName = 'initial';

  if (d <= endInit) {
    kcb = crop.kcb.initial;
    stageName = 'initial';
  } else if (d <= endDev) {
    const frac = (d - endInit) / Math.max(1, development);
    kcb = crop.kcb.initial + frac * (crop.kcb.mid - crop.kcb.initial);
    stageName = 'development';
  } else if (d <= endMid) {
    kcb = crop.kcb.mid;
    stageName = 'midSeason';
  } else {
    const frac = Math.min(1, (d - endMid) / Math.max(1, lateSeason));
    kcb = crop.kcb.mid + frac * (crop.kcb.end - crop.kcb.mid);
    stageName = 'lateSeason';
  }

  const rootFrac = Math.min(1, d / Math.max(1, endDev));
  const rootDepthM =
    crop.rootDepthM.initial + rootFrac * (crop.rootDepthM.max - crop.rootDepthM.initial);

  return {
    cropId: crop.cropId,
    dayAfterSowing: d,
    totalSeasonDays: total,
    stageName,
    kcb: Number(kcb.toFixed(4)),
    rootDepthM: Number(rootDepthM.toFixed(4)),
    depletionFractionP: crop.depletionFractionP,
    maxHeightM: crop.maxHeightM,
    evidenceStatus: crop.evidenceStatus, // Always 'ASSUMED' unless field-calibrated
    evidenceKind: crop.evidenceKind,
    isFieldCalibrated: crop.isFieldCalibrated
  };
}

export const interpolatedDailyCropParameters = interpolateDailyCropParameters;

/**
 * Loads a pilot configuration JSON file (`zankalon`, `kafr-el-sheikh`, `west-minya`)
 * and enforces `evidenceStatus: 'ASSUMED'` on all uncalibrated soil/water parameters.
 */
export function loadPilotConfig(pilotIdOrConfig = 'zankalon', options = {}) {
  let rawConfig;
  if (typeof pilotIdOrConfig === 'object' && pilotIdOrConfig !== null) {
    rawConfig = JSON.parse(JSON.stringify(pilotIdOrConfig));
  } else {
    const cleanName = String(pilotIdOrConfig || 'zankalon').replace(/\.json$/i, '');
    const filePath = path.resolve(__dirname, '../configs/pilots', `${cleanName}.json`);
    const fileText = fs.readFileSync(filePath, 'utf8');
    rawConfig = JSON.parse(fileText);
  }

  if (!rawConfig.pilotId || !rawConfig.coordinates || !rawConfig.soil || !rawConfig.waterManagement) {
    throw new Error('Invalid pilot config: missing pilotId, coordinates, soil, or waterManagement');
  }

  const { wiltingPointThetaWp, fieldCapacityThetaFc, saturationThetaSat } = rawConfig.soil;
  if (
    !(wiltingPointThetaWp > 0) ||
    !(fieldCapacityThetaFc > wiltingPointThetaWp) ||
    !(saturationThetaSat >= fieldCapacityThetaFc)
  ) {
    throw new Error('Invalid soil hydraulic parameters: expected 0 < Theta_WP < Theta_FC <= Theta_Sat');
  }

  return normalizePilotSoilAndWaterAssumptions(rawConfig, options);
}

/**
 * Lists all available pilot config files in `configs/pilots/`.
 */
export function listAvailablePilotConfigs() {
  const pilotsDir = path.resolve(__dirname, '../configs/pilots');
  if (!fs.existsSync(pilotsDir)) {
    return [];
  }
  return fs
    .readdirSync(pilotsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/i, ''))
    .sort();
}
