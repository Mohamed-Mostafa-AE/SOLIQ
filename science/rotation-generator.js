/**
 * @file science/rotation-generator.js
 * @description Agronomic & Hydrological Crop Rotation Generator.
 *
 * Generates the current baseline rotation plus up to two feasible alternative rotations
 * (3 rotation strategies total) where regional water, soil salinity, nitrogen carry-over,
 * and botanical pest-break constraints permit.
 *
 * Strategy Archetypes (aligned with NASA Field Shift Challenge & Zankalon Benchmark):
 * 1. `current_baseline`: Farmer's current rotation from pilot config (e.g., Wheat -> Paddy Rice -> Bare Fallow).
 * 2. `alternative_1_c4_water_thermal_shift`: Replaces high-water summer C3 crop or exhaustive cereal with
 *    a drought/heat-resilient C4 crop (`grain_sorghum` or `grain_maize`) and replaces bare autumn fallow
 *    with a short-season legume cover shield (`short_season_cowpea`) to eliminate bare-soil evaporation.
 * 3. `alternative_2_salinity_nitrogen_regeneration`: Introduces halotolerant or N-fixing winter crop
 *    (`sugar_beet`, `berseem_clover`, or `faba_bean`) paired with summer legume/C4 crop (`soybean` or `grain_sorghum`)
 *    and cover crop shield, restoring soil nitrogen and keeping root-zone salinity within threshold.
 *
 * Constraint Verification:
 * Every generated alternative is evaluated against:
 * - `maxAnnualWaterUseMm` (gross irrigation water quota)
 * - `maxAllowableSoilSalinityEcDsm` (root-zone ECe threshold)
 * - `requirePestHostBreak` (no two consecutive seasons with identical botanical pest host group)
 * - `allowedCrops` whitelist in the pilot configuration.
 */

import { CROP_LIBRARY } from './crop-library.js';

/**
 * Checks whether a candidate crop sequence satisfies regional agronomic constraints
 * before or after water-balance simulation.
 *
 * @param {Object} rotationCandidate
 * @param {Object} pilotConfig
 * @param {Object} [simulationResult] - Optional simulated water balance result for hard numerical checks
 * @returns {{
 *   feasible: boolean,
 *   violations: string[],
 *   constraintMargins: Object
 * }}
 */
export function evaluateRotationFeasibility(rotationCandidate, pilotConfig, simulationResult = null) {
  const constraints = pilotConfig?.constraints || {};
  const allowedCrops = new Set(
    constraints.allowedCrops || Object.keys(CROP_LIBRARY)
  );
  const violations = [];

  const seq = rotationCandidate?.sequence || [];
  if (seq.length === 0) {
    violations.push('empty_crop_sequence');
  }

  let prevPestGroup = null;
  let netExpectedNitrogenKgHa = 0;

  for (const step of seq) {
    const crop = CROP_LIBRARY[step.cropId];
    if (!crop) {
      violations.push(`unknown_crop:${step.cropId}`);
      continue;
    }
    if (step.cropId !== 'bare_fallow' && !allowedCrops.has(step.cropId)) {
      violations.push(`crop_not_allowed_in_pilot:${step.cropId}`);
    }
    if (
      constraints.requirePestHostBreak &&
      prevPestGroup &&
      crop.cropId !== 'bare_fallow' &&
      prevPestGroup === crop.pestHostGroup
    ) {
      violations.push(`consecutive_pest_host_violation:${crop.pestHostGroup}`);
    }
    if (crop.cropId !== 'bare_fallow') {
      prevPestGroup = crop.pestHostGroup;
    }
    netExpectedNitrogenKgHa += crop.nitrogenBalanceKgHa;
  }

  if (
    constraints.requirePositiveOrNeutralNitrogenTrend &&
    netExpectedNitrogenKgHa < -150
  ) {
    violations.push(
      `severe_nitrogen_depletion:${netExpectedNitrogenKgHa.toFixed(1)}kgN/ha`
    );
  }

  const constraintMargins = {
    expectedNitrogenDeltaKgHa: Number(netExpectedNitrogenKgHa.toFixed(2)),
    grossIrrigationWaterMarginMm: null,
    salinityMarginDsm: null
  };

  if (simulationResult) {
    const maxWaterMm = constraints.maxAnnualWaterUseMm ?? Infinity;
    const grossIrrigMm = simulationResult.aggregateTotalsMm.grossIrrigation;
    constraintMargins.grossIrrigationWaterMarginMm = Number(
      (maxWaterMm - grossIrrigMm).toFixed(2)
    );
    if (grossIrrigMm > maxWaterMm) {
      violations.push(
        `exceeds_water_quota:${grossIrrigMm.toFixed(1)}mm_gt_${maxWaterMm}mm`
      );
    }

    const maxSalinity = constraints.maxAllowableSoilSalinityEcDsm ?? Infinity;
    const endingSalinity = simulationResult.finalCarryOverState.endingSalinityEcDsm;
    constraintMargins.salinityMarginDsm = Number(
      (maxSalinity - endingSalinity).toFixed(3)
    );
    if (endingSalinity > maxSalinity) {
      violations.push(
        `exceeds_salinity_limit:${endingSalinity.toFixed(2)}dSm_gt_${maxSalinity}dSm`
      );
    }
  }

  return {
    feasible: violations.length === 0,
    violations,
    constraintMargins
  };
}

/**
 * Generates the current baseline rotation and up to 2 feasible alternative rotations
 * tailored to the pilot configuration's climate, soil salinity, water quota, and allowed crops.
 *
 * @param {Object} pilotConfig - Validated pilot config (e.g., Zankalon, Kafr El-Sheikh, West Minya)
 * @returns {{
 *   pilotId: string,
 *   currentRotation: Object,
 *   alternatives: Array<Object>,
 *   allCandidates: Array<Object>,
 *   rejectedCandidates: Array<Object>
 * }}
 */
export function generateCandidateRotations(pilotConfig) {
  if (!pilotConfig || !pilotConfig.currentBaselineRotation) {
    throw new Error('generateCandidateRotations requires a pilotConfig with currentBaselineRotation');
  }

  const baseline = structuredClone(pilotConfig.currentBaselineRotation);
  baseline.role = 'current_baseline';

  const winterSlot = baseline.sequence[0] || {
    season: 'winter',
    sowingDate: '2025-11-15',
    harvestDate: '2026-04-29'
  };
  const summerSlot = baseline.sequence[1] || {
    season: 'summer',
    sowingDate: '2026-05-15',
    harvestDate: '2026-09-21'
  };
  const fallowSlot = baseline.sequence[2] || {
    season: 'fallow_window',
    sowingDate: '2026-09-22',
    harvestDate: '2026-11-14'
  };

  const allowed = new Set(
    pilotConfig.constraints?.allowedCrops || Object.keys(CROP_LIBRARY)
  );
  const highBaselineSalinity = (pilotConfig.soil?.baselineSoilSalinityEcDsm ?? 2.0) >= 3.5;

  // Candidate Pool of scientifically designed alternatives
  const candidatePool = [
    {
      rotationId: `${pilotConfig.pilotId}_alt1_c4_hydro_shield`,
      role: 'alternative_1',
      name: 'C3-to-C4 Water-Saving Shift + Autumn Legume Cover Shield (Wheat -> Grain Sorghum -> Short Cowpea)',
      nameAr: 'البديل الأول: التحول الأيضي الموفر للمياه وكسر البوار (قمح شتوي -> ذرة رفيعة C4 -> غطاء لوبيا بقولي)',
      rationale:
        'Replaces high-transpiration summer crop with drought/salt-tolerant C4 Grain Sorghum and covers the autumn bare-field window with nitrogen-fixing Cowpea to suppress bare-soil evaporation and replenish N.',
      sequence: [
        {
          season: 'winter',
          cropId: allowed.has('wheat') ? 'wheat' : 'berseem_clover',
          sowingDate: winterSlot.sowingDate,
          harvestDate: winterSlot.harvestDate
        },
        {
          season: 'summer',
          cropId: allowed.has('grain_sorghum') ? 'grain_sorghum' : 'grain_maize',
          sowingDate: summerSlot.sowingDate,
          harvestDate: '2026-09-06'
        },
        {
          season: 'fallow_window',
          cropId: allowed.has('short_season_cowpea') ? 'short_season_cowpea' : 'bare_fallow',
          sowingDate: '2026-09-07',
          harvestDate: fallowSlot.harvestDate
        }
      ]
    },
    {
      rotationId: `${pilotConfig.pilotId}_alt2_bio_salinity_recovery`,
      role: 'alternative_2',
      name: highBaselineSalinity
        ? 'Halotolerant & Nitrogen-Fixing Bio-Recovery (Sugar Beet -> Grain Sorghum -> Berseem/Cowpea Shield)'
        : 'Legume-Integrated Soil & Nitrogen Recovery (Berseem Clover -> Hybrid Maize/Sorghum -> Short Cowpea)',
      nameAr: highBaselineSalinity
        ? 'البديل الثاني: معالجة الملوحة وإحياء النيتروجين (بنجر سكر متحمل للملوحة -> ذرة رفيعة -> غطاء بقولي)'
        : 'البديل الثاني: إحياء خصوبة التربة والنيتروجين (برسيم مصري -> ذرة C4 -> غطاء لوبيا بقولي)',
      rationale: highBaselineSalinity
        ? 'Deploys halotolerant Sugar Beet (ECe threshold 7.0 dS/m) in winter followed by C4 Sorghum and a short legume cover crop to reduce irrigation demand, leach root-zone salts, and break cereal pest cycles.'
        : 'Integrates symbiotic N-fixing Berseem Clover (+110 kg N/ha) in winter followed by C4 grain crop and short legume cover, eliminating synthetic N deficit and interrupting cereal pest cycles.',
      sequence: [
        {
          season: 'winter',
          cropId:
            highBaselineSalinity && allowed.has('sugar_beet')
              ? 'sugar_beet'
              : allowed.has('berseem_clover')
                ? 'berseem_clover'
                : 'faba_bean',
          sowingDate: winterSlot.sowingDate,
          harvestDate: winterSlot.harvestDate
        },
        {
          season: 'summer',
          cropId: allowed.has('soybean') && !highBaselineSalinity
            ? 'soybean'
            : allowed.has('grain_sorghum')
              ? 'grain_sorghum'
              : 'grain_maize',
          sowingDate: summerSlot.sowingDate,
          harvestDate: '2026-09-06'
        },
        {
          season: 'fallow_window',
          cropId: allowed.has('short_season_cowpea') ? 'short_season_cowpea' : 'bare_fallow',
          sowingDate: '2026-09-07',
          harvestDate: fallowSlot.harvestDate
        }
      ]
    },
    {
      rotationId: `${pilotConfig.pilotId}_alt3_legume_cereal_balance`,
      role: 'alternative_fallback',
      name: 'Low-Water Pulse & C4 Cereal Rotation (Faba Bean -> Grain Sorghum -> Short Cowpea)',
      nameAr: 'بديل الترشيد المائي الأقصى (فول بلدي -> ذرة رفيعة C4 -> غطاء لوبيا)',
      rationale:
        'Minimizes winter and summer consumptive water use under tight canal or groundwater quotas while fixing atmospheric nitrogen.',
      sequence: [
        {
          season: 'winter',
          cropId: allowed.has('faba_bean') ? 'faba_bean' : 'berseem_clover',
          sowingDate: winterSlot.sowingDate,
          harvestDate: '2026-04-08'
        },
        {
          season: 'summer',
          cropId: allowed.has('grain_sorghum') ? 'grain_sorghum' : 'grain_maize',
          sowingDate: summerSlot.sowingDate,
          harvestDate: '2026-09-06'
        },
        {
          season: 'fallow_window',
          cropId: allowed.has('short_season_cowpea') ? 'short_season_cowpea' : 'bare_fallow',
          sowingDate: '2026-09-07',
          harvestDate: fallowSlot.harvestDate
        }
      ]
    }
  ];

  const feasibleAlternatives = [];
  const rejectedCandidates = [];

  for (const cand of candidatePool) {
    const check = evaluateRotationFeasibility(cand, pilotConfig);
    if (check.feasible && feasibleAlternatives.length < 2) {
      feasibleAlternatives.push({
        ...cand,
        role: `alternative_${feasibleAlternatives.length + 1}`,
        preSimulationFeasibility: check
      });
    } else if (!check.feasible) {
      rejectedCandidates.push({
        ...cand,
        preSimulationFeasibility: check
      });
    }
  }

  const baselineCheck = evaluateRotationFeasibility(baseline, pilotConfig);
  const currentRotation = {
    ...baseline,
    preSimulationFeasibility: baselineCheck
  };

  return {
    pilotId: pilotConfig.pilotId,
    currentRotation,
    alternatives: feasibleAlternatives,
    allCandidates: [currentRotation, ...feasibleAlternatives],
    rejectedCandidates
  };
}
