/**
 * @file science/crop-library.js
 * @description Referenced FAO-56 & Egyptian Nile Delta (Zankalon, Sharkia) Crop Library,
 * Growth-Stage Crop Coefficients (Kc_ini, Kc_mid, Kc_end), Root Depth Progression,
 * Salinity Thresholds (Maas-Hoffman ECe), Nitrogen Carry-Over Parameters,
 * and Independent Multi-Region Pilot Configuration Loader.
 *
 * Scientific References:
 * 1. Allen, R. G., Pereira, L. S., Raes, D., & Smith, M. (1998). FAO Irrigation and Drainage Paper No. 56
 *    (Tables 11, 12, 17, 22: Crop stage lengths, Kc values, rooting depths, depletion fraction p, salinity tolerance).
 * 2. Ayyad, S., Karimi, P., Ribbe, L., & Becker, M. (2024). Potential Improvements in Crop Production in Egypt
 *    and Implications for Future Water and Land Demand: The Zankalon Region Benchmark Case Study.
 * 3. Abd El Baki, H. M., Fujimaki, H., et al. (2021). Irrigation scheme & Zankalon hydraulic parameters. Water, 13(16), 2181.
 * 4. Nile Delta Eddy Covariance ET Consortium (2017). Crop evapotranspiration in the Nile Delta under different
 *    irrigation methods (rice, maize, cotton, sugar beet, berseem, wheat, fava beans).
 *
 * Calibration Notice:
 * Parameters are literature-derived from FAO-56 and published Zankalon/Nile Delta field studies.
 * They do NOT claim independent field-level agronomic calibration without human verification.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CROP_LIBRARY = Object.freeze({
  wheat: {
    cropId: 'wheat',
    nameEn: 'Bread Wheat (Sakha 95 / Giza 171)',
    nameAr: 'قمح الخبز الشتوي',
    botanicalFamily: 'Poaceae',
    photosyntheticPathway: 'C3',
    seasonType: 'winter',
    typicalSowingMonthDay: '11-15',
    stagesDays: {
      initial: 30,
      development: 45,
      midSeason: 55,
      lateSeason: 35,
      total: 165
    },
    kc: {
      ini: 0.35,
      mid: 1.15,
      end: 0.25
    },
    rootDepthM: {
      ini: 0.25,
      max: 1.20
    },
    depletionFractionP: 0.55,
    yieldResponseFactorKy: 1.05,
    salinityTolerance: {
      thresholdEcDsm: 6.0,
      slopePctPerDsm: 7.1
    },
    heatStressThresholdC: 32.0,
    nitrogenBalanceKgHa: -95.0, // Net soil N extraction without legume precede
    pestHostGroup: 'winter_cereal_aphid_rust',
    referenceBaselineYieldTonHa: 6.3, // Ayyad et al. (2024) Zankalon 5-yr average
    referenceWaterProductivityKgM3: 1.05,
    grossMarginAnchorUsdHa: 1420,
    citations: ['fao56_allen_1998', 'ayyad_2024_zankalon']
  },

  berseem_clover: {
    cropId: 'berseem_clover',
    nameEn: 'Egyptian Berseem Clover (Multi-cut Forage)',
    nameAr: 'برسيم مصري مسقاوي (بقولي مثبت للنيتروجين)',
    botanicalFamily: 'Fabaceae',
    photosyntheticPathway: 'C3',
    seasonType: 'winter',
    typicalSowingMonthDay: '10-25',
    stagesDays: {
      initial: 25,
      development: 35,
      midSeason: 75,
      lateSeason: 30,
      total: 165
    },
    kc: {
      ini: 0.40,
      mid: 1.05,
      end: 0.85
    },
    rootDepthM: {
      ini: 0.20,
      max: 0.90
    },
    depletionFractionP: 0.50,
    yieldResponseFactorKy: 0.90,
    salinityTolerance: {
      thresholdEcDsm: 1.5,
      slopePctPerDsm: 5.7
    },
    heatStressThresholdC: 33.0,
    nitrogenBalanceKgHa: +110.0, // Symbiotic Rhizobium N fixation carry-over
    pestHostGroup: 'legume_forage',
    referenceBaselineYieldTonHa: 9.2, // Dry matter t/ha in Zankalon (Ayyad et al., 2024)
    referenceWaterProductivityKgM3: 1.20,
    grossMarginAnchorUsdHa: 1550,
    citations: ['fao56_allen_1998', 'ayyad_2024_zankalon', 'nile_delta_eddy_et_2017']
  },

  faba_bean: {
    cropId: 'faba_bean',
    nameEn: 'Faba Bean (Giza 843)',
    nameAr: 'فول بلدي (بقولي موفر للمياه ومثبت للنيتروجين)',
    botanicalFamily: 'Fabaceae',
    photosyntheticPathway: 'C3',
    seasonType: 'winter',
    typicalSowingMonthDay: '11-10',
    stagesDays: {
      initial: 25,
      development: 35,
      midSeason: 55,
      lateSeason: 30,
      total: 145
    },
    kc: {
      ini: 0.40,
      mid: 1.10,
      end: 0.35
    },
    rootDepthM: {
      ini: 0.25,
      max: 0.85
    },
    depletionFractionP: 0.45,
    yieldResponseFactorKy: 1.10,
    salinityTolerance: {
      thresholdEcDsm: 1.6,
      slopePctPerDsm: 9.6
    },
    heatStressThresholdC: 31.0,
    nitrogenBalanceKgHa: +85.0,
    pestHostGroup: 'winter_grain_legume',
    referenceBaselineYieldTonHa: 3.6,
    referenceWaterProductivityKgM3: 1.12,
    grossMarginAnchorUsdHa: 1490,
    citations: ['fao56_allen_1998', 'nile_delta_eddy_et_2017', 'minya_legume_wheat_2026']
  },

  sugar_beet: {
    cropId: 'sugar_beet',
    nameEn: 'Sugar Beet (Halotolerant Winter Root Crop)',
    nameAr: 'بنجر السكر (متحمل للملوحة والجفاف)',
    botanicalFamily: 'Amaranthaceae',
    photosyntheticPathway: 'C3',
    seasonType: 'winter',
    typicalSowingMonthDay: '10-20',
    stagesDays: {
      initial: 30,
      development: 45,
      midSeason: 65,
      lateSeason: 40,
      total: 180
    },
    kc: {
      ini: 0.35,
      mid: 1.20,
      end: 0.70
    },
    rootDepthM: {
      ini: 0.25,
      max: 1.10
    },
    depletionFractionP: 0.55,
    yieldResponseFactorKy: 0.85,
    salinityTolerance: {
      thresholdEcDsm: 7.0, // High salinity tolerance (FAO-56 Table 22)
      slopePctPerDsm: 5.9
    },
    heatStressThresholdC: 34.0,
    nitrogenBalanceKgHa: -65.0,
    pestHostGroup: 'chenopod_root',
    referenceBaselineYieldTonHa: 52.0,
    referenceWaterProductivityKgM3: 9.5,
    grossMarginAnchorUsdHa: 1680,
    citations: ['fao56_allen_1998', 'nile_delta_eddy_et_2017']
  },

  paddy_rice: {
    cropId: 'paddy_rice',
    nameEn: 'Paddy Rice (Sakha 108 / Giza 179)',
    nameAr: 'أرز صيفي (مستهلك عالي للمياه - غمر)',
    botanicalFamily: 'Poaceae',
    photosyntheticPathway: 'C3',
    seasonType: 'summer',
    typicalSowingMonthDay: '05-15',
    stagesDays: {
      initial: 30,
      development: 30,
      midSeason: 45,
      lateSeason: 25,
      total: 130
    },
    kc: {
      ini: 1.05, // Flooded paddy initial Kc (FAO-56 Table 12)
      mid: 1.20,
      end: 0.75
    },
    rootDepthM: {
      ini: 0.20,
      max: 0.60
    },
    depletionFractionP: 0.20,
    yieldResponseFactorKy: 1.20,
    salinityTolerance: {
      thresholdEcDsm: 3.0,
      slopePctPerDsm: 12.0
    },
    standingWaterPercolationAdditionMmDay: 2.2, // Submerged paddy extra seepage
    heatStressThresholdC: 36.0,
    nitrogenBalanceKgHa: -105.0,
    pestHostGroup: 'summer_cereal_stem_borer',
    referenceBaselineYieldTonHa: 8.0,
    referenceWaterProductivityKgM3: 0.85,
    grossMarginAnchorUsdHa: 1520,
    citations: ['fao56_allen_1998', 'ayyad_2024_zankalon', 'nile_delta_eddy_et_2017']
  },

  grain_maize: {
    cropId: 'grain_maize',
    nameEn: 'Hybrid Grain Maize (Giza 131 / Single Cross 168)',
    nameAr: 'ذرة شامية هجينة (مسار C4)',
    botanicalFamily: 'Poaceae',
    photosyntheticPathway: 'C4',
    seasonType: 'summer',
    typicalSowingMonthDay: '05-15',
    stagesDays: {
      initial: 20,
      development: 35,
      midSeason: 40,
      lateSeason: 25,
      total: 120
    },
    kc: {
      ini: 0.30,
      mid: 1.20,
      end: 0.40
    },
    rootDepthM: {
      ini: 0.25,
      max: 1.15
    },
    depletionFractionP: 0.55,
    yieldResponseFactorKy: 1.25,
    salinityTolerance: {
      thresholdEcDsm: 1.7,
      slopePctPerDsm: 12.0
    },
    heatStressThresholdC: 37.5,
    nitrogenBalanceKgHa: -115.0,
    pestHostGroup: 'summer_cereal_stem_borer',
    referenceBaselineYieldTonHa: 7.8,
    referenceWaterProductivityKgM3: 1.15,
    grossMarginAnchorUsdHa: 1460,
    citations: ['fao56_allen_1998', 'abdelbaki_2021_zankalon_soil', 'ayyad_2024_zankalon']
  },

  grain_sorghum: {
    cropId: 'grain_sorghum',
    nameEn: 'Grain Sorghum (Dorado / Giza 15 - Drought & Heat Resilient C4)',
    nameAr: 'ذرة رفيعة حبوب (محصول C4 عالي الكفاءة المائية والحرارية)',
    botanicalFamily: 'Poaceae',
    photosyntheticPathway: 'C4',
    seasonType: 'summer',
    typicalSowingMonthDay: '05-20',
    stagesDays: {
      initial: 20,
      development: 30,
      midSeason: 40,
      lateSeason: 25,
      total: 115
    },
    kc: {
      ini: 0.30,
      mid: 1.00, // FAO-56 Table 12 grain sorghum Kc_mid = 1.00–1.05
      end: 0.55
    },
    rootDepthM: {
      ini: 0.25,
      max: 1.35
    },
    depletionFractionP: 0.60,
    yieldResponseFactorKy: 0.90,
    salinityTolerance: {
      thresholdEcDsm: 6.8, // High salinity tolerance among cereals
      slopePctPerDsm: 16.0
    },
    heatStressThresholdC: 40.0,
    nitrogenBalanceKgHa: -75.0,
    pestHostGroup: 'sorghum_c4_resilient',
    referenceBaselineYieldTonHa: 6.4,
    referenceWaterProductivityKgM3: 1.48,
    grossMarginAnchorUsdHa: 1410,
    citations: ['fao56_allen_1998']
  },

  soybean: {
    cropId: 'soybean',
    nameEn: 'Soybean (Giza 111 - Summer Oilseed Legume)',
    nameAr: 'فول صويا (بقولي صيفي كاسر لدورة آفات الحبوب ومثبت للنيتروجين)',
    botanicalFamily: 'Fabaceae',
    photosyntheticPathway: 'C3',
    seasonType: 'summer',
    typicalSowingMonthDay: '05-15',
    stagesDays: {
      initial: 20,
      development: 30,
      midSeason: 45,
      lateSeason: 20,
      total: 115
    },
    kc: {
      ini: 0.40,
      mid: 1.15,
      end: 0.50
    },
    rootDepthM: {
      ini: 0.20,
      max: 1.00
    },
    depletionFractionP: 0.50,
    yieldResponseFactorKy: 0.85,
    salinityTolerance: {
      thresholdEcDsm: 5.0,
      slopePctPerDsm: 20.0
    },
    heatStressThresholdC: 36.5,
    nitrogenBalanceKgHa: +75.0,
    pestHostGroup: 'summer_oilseed_legume',
    referenceBaselineYieldTonHa: 3.4,
    referenceWaterProductivityKgM3: 0.92,
    grossMarginAnchorUsdHa: 1580,
    citations: ['fao56_allen_1998']
  },

  short_season_cowpea: {
    cropId: 'short_season_cowpea',
    nameEn: 'Short-Duration Forage/Green Cowpea Cover Shield',
    nameAr: 'لوبيا/غطاء بقولي قصير العمر (حماية التربة من البوار الخريفي)',
    botanicalFamily: 'Fabaceae',
    photosyntheticPathway: 'C3',
    seasonType: 'fallow_window',
    typicalSowingMonthDay: '09-22',
    stagesDays: {
      initial: 12,
      development: 15,
      midSeason: 16,
      lateSeason: 10,
      total: 53
    },
    kc: {
      ini: 0.35,
      mid: 0.95,
      end: 0.45
    },
    rootDepthM: {
      ini: 0.20,
      max: 0.70
    },
    depletionFractionP: 0.55,
    yieldResponseFactorKy: 0.85,
    salinityTolerance: {
      thresholdEcDsm: 4.9,
      slopePctPerDsm: 12.0
    },
    heatStressThresholdC: 37.0,
    nitrogenBalanceKgHa: +42.0,
    pestHostGroup: 'short_cover_legume',
    referenceBaselineYieldTonHa: 2.1,
    referenceWaterProductivityKgM3: 1.35,
    grossMarginAnchorUsdHa: 540,
    citations: ['fao56_allen_1998']
  },

  bare_fallow: {
    cropId: 'bare_fallow',
    nameEn: 'Unplanted Bare Fallow Soil Window',
    nameAr: 'أرض عارية بدون زراعة (فترة بوار بين المواسم)',
    botanicalFamily: 'None',
    photosyntheticPathway: 'None',
    seasonType: 'fallow_window',
    typicalSowingMonthDay: '09-22',
    stagesDays: {
      initial: 15,
      development: 15,
      midSeason: 15,
      lateSeason: 9,
      total: 54
    },
    kc: {
      ini: 0.22,
      mid: 0.18,
      end: 0.15
    },
    rootDepthM: {
      ini: 0.15,
      max: 0.15
    },
    depletionFractionP: 0.70,
    yieldResponseFactorKy: 0.0,
    salinityTolerance: {
      thresholdEcDsm: 99.0,
      slopePctPerDsm: 0.0
    },
    heatStressThresholdC: 99.0,
    nitrogenBalanceKgHa: -18.0, // Volatilization & mineralization leaching loss on bare soil
    pestHostGroup: 'bare_soil_weeds',
    referenceBaselineYieldTonHa: 0.0,
    referenceWaterProductivityKgM3: 0.0,
    grossMarginAnchorUsdHa: 0,
    citations: ['fao56_allen_1998']
  }
});

/**
 * Computes daily crop coefficient `Kc`, effective root depth `Zr` (m), and growth stage label
 * for day `dayAfterSowing` (1-indexed) according to the FAO-56 four-stage linear curve.
 * Also supports optional remote-sensing NDVI-assisted Kc blending (`Kc_RS = 1.25 * NDVI + 0.1`
 * or Egypt Delta calibration `Kc = 2 * NDVI - 0.2` bounded by physical stage envelope) when
 * verified clear-sky HLS NDVI is available on that date.
 *
 * @param {string|Object} cropOrId - Crop ID in `CROP_LIBRARY` or custom crop definition object
 * @param {number} dayAfterSowing - 1-indexed day within the crop season
 * @param {Object} [options]
 * @param {number|null} [options.observedNdvi=null] - Verified clear-sky HLS NDVI on this day
 * @param {number} [options.ndviBlendWeight=0.25] - Weight given to observed HLS NDVI adjustment
 * @returns {{
 *   cropId: string,
 *   dayAfterSowing: number,
 *   stage: string,
 *   kcTabular: number,
 *   kcAdjusted: number,
 *   rootDepthM: number,
 *   depletionFractionP: number,
 *   ndviConstraintApplied: boolean
 * }}
 */
export function interpolateDailyCropParameters(cropOrId, dayAfterSowing, options = {}) {
  const crop =
    typeof cropOrId === 'string' ? CROP_LIBRARY[cropOrId] : cropOrId;

  if (!crop) {
    throw new Error(`Unknown crop identifier: ${String(cropOrId)}`);
  }

  const { initial, development, midSeason, lateSeason, total } = crop.stagesDays;
  const d = Math.max(1, Math.min(total, Math.round(dayAfterSowing)));

  let stage = 'initial';
  let kcTabular = crop.kc.ini;

  const endInit = initial;
  const endDev = initial + development;
  const endMid = initial + development + midSeason;

  if (d <= endInit) {
    stage = 'initial';
    kcTabular = crop.kc.ini;
  } else if (d <= endDev) {
    stage = 'development';
    const frac = (d - endInit) / Math.max(1, development);
    kcTabular = crop.kc.ini + frac * (crop.kc.mid - crop.kc.ini);
  } else if (d <= endMid) {
    stage = 'mid_season';
    kcTabular = crop.kc.mid;
  } else {
    stage = 'late_season';
    const frac = (d - endMid) / Math.max(1, lateSeason);
    kcTabular = crop.kc.mid + frac * (crop.kc.end - crop.kc.mid);
  }

  // Linear root depth growth from ini to max over (initial + development) stages (FAO-56 Annex 8)
  const rootGrowthDays = Math.max(1, endDev);
  const rootFrac = Math.min(1.0, d / rootGrowthDays);
  const rootDepthM =
    crop.rootDepthM.ini + rootFrac * (crop.rootDepthM.max - crop.rootDepthM.ini);

  // Optional bounded HLS NDVI observation assimilation
  let kcAdjusted = kcTabular;
  let ndviConstraintApplied = false;
  const { observedNdvi = null, ndviBlendWeight = 0.25 } = options;

  if (
    crop.cropId !== 'bare_fallow' &&
    typeof observedNdvi === 'number' &&
    Number.isFinite(observedNdvi) &&
    observedNdvi >= 0.05 &&
    observedNdvi <= 0.95
  ) {
    const kcFromNdvi = Math.max(0.15, Math.min(1.25, 1.25 * observedNdvi + 0.1));
    const w = Math.max(0, Math.min(0.5, ndviBlendWeight));
    kcAdjusted = (1 - w) * kcTabular + w * kcFromNdvi;
    ndviConstraintApplied = true;
  }

  return {
    cropId: crop.cropId,
    dayAfterSowing: d,
    stage,
    kcTabular: Number(kcTabular.toFixed(4)),
    kcAdjusted: Number(kcAdjusted.toFixed(4)),
    rootDepthM: Number(rootDepthM.toFixed(3)),
    depletionFractionP: crop.depletionFractionP,
    ndviConstraintApplied
  };
}

/**
 * Loads a pilot region configuration by pilot name/filename (`zankalon`, `kafr-el-sheikh`, `west-minya`)
 * or validates an inline pilot configuration object for any independent region.
 *
 * @param {string|Object} pilotIdOrConfig
 * @returns {Object} Validated pilot configuration object
 */
export function loadPilotConfig(pilotIdOrConfig = 'zankalon') {
  let config;
  if (typeof pilotIdOrConfig === 'string') {
    const cleanName = pilotIdOrConfig.replace(/\.json$/i, '');
    const filePath = path.resolve(
      __dirname,
      '..',
      'configs',
      'pilots',
      `${cleanName}.json`
    );
    if (!fs.existsSync(filePath)) {
      throw new Error(`Pilot configuration file not found: ${filePath}`);
    }
    config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } else if (pilotIdOrConfig && typeof pilotIdOrConfig === 'object') {
    config = structuredClone(pilotIdOrConfig);
  } else {
    throw new Error('loadPilotConfig requires a pilot name string or configuration object');
  }

  // Validate required structural sections
  if (!config.pilotId || !config.coordinates || !config.soil || !config.waterManagement) {
    throw new Error(
      `Invalid pilot configuration '${config.pilotId || 'unknown'}': missing coordinates, soil, or waterManagement`
    );
  }

  const { fieldCapacityThetaFc, wiltingPointThetaWp, saturationThetaSat } = config.soil;
  if (
    !(wiltingPointThetaWp > 0 &&
      fieldCapacityThetaFc > wiltingPointThetaWp &&
      saturationThetaSat >= fieldCapacityThetaFc)
  ) {
    throw new Error(
      `Invalid soil hydraulic hierarchy in '${config.pilotId}': require 0 < Theta_WP (${wiltingPointThetaWp}) < Theta_FC (${fieldCapacityThetaFc}) <= Theta_Sat (${saturationThetaSat})`
    );
  }

  return config;
}

/**
 * Lists all built-in pilot region configurations available in `configs/pilots/`.
 * @returns {string[]}
 */
export function listAvailablePilotConfigs() {
  const pilotsDir = path.resolve(__dirname, '..', 'configs', 'pilots');
  if (!fs.existsSync(pilotsDir)) return [];
  return fs
    .readdirSync(pilotsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/i, ''))
    .sort();
}
