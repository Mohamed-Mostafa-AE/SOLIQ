/**
 * @file science/rotation-generator.js
 * @description Agronomic crop-rotation feasibility checker and candidate generator (`R0`, `R1`, `R2`).
 */

import { CROP_LIBRARY } from './crop-library.js';

/**
 * Checks agronomic feasibility of a candidate rotation sequence (`sequence` array).
 */
export function evaluateRotationFeasibility(rotation = {}, pilotConfig = {}) {
  const sequence = Array.isArray(rotation.sequence) ? rotation.sequence : [];
  const violations = [];
  let cumulativeNitrogenKgHa = 0;

  for (let i = 0; i < sequence.length; i += 1) {
    const curr = sequence[i];
    const crop = CROP_LIBRARY[curr.cropId];
    if (!crop) {
      violations.push(`Unknown cropId "${curr.cropId}" at step ${i}`);
      continue;
    }
    cumulativeNitrogenKgHa += crop.nitrogenBalanceKgHa;

    // Check botanical family succession (prevent consecutive Poaceae cereal monoculture when pest break required)
    if (i > 0 && pilotConfig.constraints?.requirePestHostBreak) {
      const prevCrop = CROP_LIBRARY[sequence[i - 1].cropId];
      if (
        prevCrop &&
        crop.botanicalFamily !== 'None' &&
        prevCrop.botanicalFamily === crop.botanicalFamily &&
        crop.botanicalFamily === 'Poaceae' &&
        !rotation.allowBaselineMonoculture
      ) {
        violations.push(
          `Consecutive Poaceae cereal crops (${prevCrop.cropId} -> ${crop.cropId}) violate pest/disease host break constraint`
        );
      }
    }
  }

  return {
    rotationId: rotation.rotationId || 'candidate',
    feasible: violations.length === 0,
    feasibility: violations.length === 0 ? 'eligible' : 'requires_review',
    cumulativeNitrogenKgHa,
    evidenceStatus: 'ASSUMED',
    violations
  };
}

/**
 * Generates the three standard FieldShift rotations (`R0`, `R1`, `R2`) for a given pilot config.
 */
export function generateCandidateRotations(pilotConfig = {}) {
  const baseline = pilotConfig.currentBaselineRotation || {
    rotationId: 'R0_baseline_cereal',
    name: 'R0: Baseline Cereal Sequence (Wheat -> Paddy Rice -> Bare Fallow)',
    sequence: [
      { season: 'winter', cropId: 'wheat', sowingDate: '2025-11-15', harvestDate: '2026-04-29' },
      { season: 'summer', cropId: 'paddy_rice', sowingDate: '2026-05-15', harvestDate: '2026-09-21' },
      { season: 'fallow_window', cropId: 'bare_fallow', sowingDate: '2026-09-22', harvestDate: '2026-11-14' }
    ]
  };

  const r0 = {
    ...baseline,
    strategyCode: 'R0',
    allowBaselineMonoculture: true,
    evidenceStatus: 'ASSUMED'
  };

  const r1 = {
    rotationId: 'R1_legume_water_saving_shift',
    strategyCode: 'R1',
    name: 'R1: Water-Saving Legume Pulse Shift (Faba Bean -> Grain Sorghum -> Cowpea Cover)',
    nameAr: 'البديل الأول (R1): دورة البقوليات الموفرة للمياه والمثبتة للنيتروجين',
    evidenceStatus: 'ASSUMED',
    sequence: [
      { season: 'winter', cropId: 'faba_bean', sowingDate: '2025-11-15', harvestDate: '2026-04-03' },
      { season: 'summer', cropId: 'grain_sorghum', sowingDate: '2026-05-15', harvestDate: '2026-09-11' },
      { season: 'fallow_window', cropId: 'short_season_cowpea', sowingDate: '2026-09-15', harvestDate: '2026-11-14' }
    ]
  };

  const r2 = {
    rotationId: 'R2_salinity_buffer_forage_shift',
    strategyCode: 'R2',
    name: 'R2: Salinity-Buffer & Forage Shift (Sugar Beet -> Soybean -> Bare Fallow)',
    nameAr: 'البديل الثاني (R2): دورة تحمل الملوحة وتوازن الدخل',
    evidenceStatus: 'ASSUMED',
    sequence: [
      { season: 'winter', cropId: 'sugar_beet', sowingDate: '2025-11-15', harvestDate: '2026-05-08' },
      { season: 'summer', cropId: 'soybean', sowingDate: '2026-05-20', harvestDate: '2026-09-16' },
      { season: 'fallow_window', cropId: 'bare_fallow', sowingDate: '2026-09-17', harvestDate: '2026-11-14' }
    ]
  };

  return [r0, r1, r2].map((rot) => ({
    ...rot,
    feasibilityCheck: evaluateRotationFeasibility(rot, pilotConfig)
  }));
}
