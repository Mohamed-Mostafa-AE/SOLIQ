/**
 * @file science/water-balance.js
 * @description Daily Soil Water Balance, Actual Evapotranspiration (ETc_act),
 * Surface Runoff (SCS Curve Number), Deep Percolation / Drainage, Soil Water Storage,
 * Root-Zone Depletion, and Multi-Season Carry-Over State Transition Engine.
 *
 * Scientific & Hydrological Formulation (FAO-56 Chapter 8 & Soil Water Balance):
 * - Root-zone Total Available Water (TAW in mm):
 *     `TAW(t) = 1000 * (theta_FC - theta_WP) * Zr(t)`
 * - Readily Available Water (RAW in mm):
 *     `RAW(t) = p_adj(t) * TAW(t)`
 *   where `p_adj(t) = clamp(p + 0.04 * (5 - ETc_pot(t)), 0.1, 0.8)` (FAO-56 Eq. 83 footnote).
 * - Water Stress Coefficient (`Ks` in [0, 1]):
 *     `Ks(t) = (TAW(t) - Dr_prev) / ((1 - p_adj(t)) * TAW(t))` when `Dr_prev > RAW(t)`, else `1.0`.
 * - Actual Evapotranspiration (`ETc_act` in mm/day):
 *     `ETc_pot(t) = Kc(t) * ET0(t)`
 *     `ETc_act(t) = Ks(t) * ETc_pot(t)`
 * - Surface Runoff (`RO` in mm/day) via USDA-SCS Curve Number (adjusted for antecedent moisture):
 *     `S = 25400 / CN - 254`, `Ia = 0.2 * S`
 *     `RO(t) = (P(t) - Ia)^2 / (P(t) - Ia + S)` for `P(t) > Ia`, else `0`.
 * - Deep Percolation / Drainage (`DP` in mm/day):
 *   When water inputs (`P_eff + Irrig`) exceed current root-zone depletion `Dr_prev`, excess water
 *   above field capacity drains according to the soil drainage coefficient `tau` (or all excess
 *   beyond `TAW=0` drains out of the root zone within the daily step, plus paddy percolation when applicable).
 * - Daily Root-Zone Depletion Update (FAO-56 Eq. 85):
 *     `Dr(t) = clamp(Dr(t-1) - (P(t) - RO(t)) - Irrig_net(t) + ETc_act(t) + DP(t), 0, TAW(t))`
 * - Multi-Season Carry-Over State Transition:
 *   Propagates ending soil moisture storage (`soilStorageMm`, `thetaEnding`), root-zone depletion `Dr`,
 *   cumulative soil nitrogen delta (`kg N/ha`), and root-zone salinity (`ECe` in `dS/m` via leaching-evaporation
 *   mass balance) seamlessly from Season `k` into Season `k+1`.
 */

import { CROP_LIBRARY, interpolateDailyCropParameters } from './crop-library.js';

/**
 * Computes daily SCS Curve Number surface runoff (mm/day) from daily precipitation (mm/day).
 * Adjusts Curve Number (CN II -> CN I / CN III) based on relative root-zone wetness.
 *
 * @param {number} precipMm - Daily precipitation (mm/day)
 * @param {number} baseCurveNumber - SCS CN II (e.g., 84 for Zankalon clay loam)
 * @param {number} relativeWetness - Fraction of available water (`0` = wilting point, `1` = field capacity)
 * @returns {number} Surface runoff in mm/day
 */
export function computeScsRunoffMm(precipMm, baseCurveNumber = 84, relativeWetness = 0.5) {
  if (!Number.isFinite(precipMm) || precipMm <= 0) return 0.0;

  const cn2 = Math.max(30, Math.min(98, baseCurveNumber));
  // Antecedent Moisture Condition (AMC) adjustment (Hawkins et al., 1985 / FAO-56)
  const cn1 = cn2 / (2.281 - 0.01281 * cn2);
  const cn3 = cn2 / (0.427 + 0.00573 * cn2);

  const w = Math.max(0, Math.min(1, Number.isFinite(relativeWetness) ? relativeWetness : 0.5));
  const cnEffective = w < 0.35 ? cn1 : w > 0.75 ? cn3 : cn2;

  const S = 25400 / cnEffective - 254; // Maximum potential retention (mm)
  const Ia = 0.2 * S; // Initial abstraction (mm)

  if (precipMm <= Ia) return 0.0;

  const runoff = Math.pow(precipMm - Ia, 2) / (precipMm - Ia + S);
  return Number(Math.min(precipMm, Math.max(0, runoff)).toFixed(4));
}

/**
 * Simulates a single season's daily water balance for a given crop, soil profile,
 * daily meteorological/precipitation records, and optional HLS NDVI observations.
 *
 * @param {Object} params
 * @param {string|Object} params.crop - Crop ID or definition object
 * @param {string} params.sowingDate - YYYY-MM-DD
 * @param {string} params.harvestDate - YYYY-MM-DD
 * @param {Object} params.soil - Soil hydraulic parameters from pilot config
 * @param {Object} params.waterManagement - Irrigation efficiency, salinity, and quota config
 * @param {Array<Object>} params.dailyForcing - Daily climate & precipitation array `{ date, et0MmDay, precipMmDay, tMaxC }`
 * @param {Map<string, number>|Object} [params.hlsNdviByDate] - Optional map/object of `{ [date]: ndvi }`
 * @param {Object} [params.initialState] - Carry-over state from preceding season
 * @param {boolean} [params.autoIrrigate=true] - Trigger irrigation when depletion reaches RAW
 * @returns {Object} Complete seasonal water balance ledger, daily trajectory, and ending carry-over state
 */
export function simulateSeasonWaterBalance(params = {}) {
  const {
    crop: cropInput,
    sowingDate,
    harvestDate,
    soil,
    waterManagement,
    dailyForcing = [],
    hlsNdviByDate = null,
    initialState = null,
    autoIrrigate = true
  } = params;

  const crop = typeof cropInput === 'string' ? CROP_LIBRARY[cropInput] : cropInput;
  if (!crop) {
    throw new Error(`Unknown crop in simulateSeasonWaterBalance: ${String(cropInput)}`);
  }
  if (!soil || !waterManagement) {
    throw new Error('simulateSeasonWaterBalance requires both soil and waterManagement configs');
  }

  const thetaFc = soil.fieldCapacityThetaFc;
  const thetaWp = soil.wiltingPointThetaWp;
  const thetaSat = soil.saturationThetaSat;
  const tauDrainage = soil.drainageCoefficientTauDay ?? 0.3;
  const baseCn = soil.scsCurveNumberDefault ?? 82;
  const appEfficiency = Math.max(0.35, Math.min(0.98, waterManagement.applicationEfficiency ?? 0.68));
  const irrigSalinityEc = waterManagement.irrigationWaterSalinityEcDsm ?? 0.6;
  const leachingReq = waterManagement.leachingFractionRequirement ?? 0.1;

  // Index forcing and HLS NDVI by ISO date
  const forcingMap = new Map();
  for (const rec of dailyForcing) {
    if (rec && rec.date) forcingMap.set(rec.date, rec);
  }
  const getNdvi = (date) => {
    if (!hlsNdviByDate) return null;
    if (hlsNdviByDate instanceof Map) return hlsNdviByDate.get(date) ?? null;
    return hlsNdviByDate[date] ?? null;
  };

  const startMs = Date.parse(`${sowingDate}T00:00:00Z`);
  const endMs = Date.parse(`${harvestDate}T00:00:00Z`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    throw new Error(`Invalid season date window: ${sowingDate} to ${harvestDate}`);
  }

  const totalSeasonDays = Math.round((endMs - startMs) / 86400000) + 1;

  // Initial root depth & TAW at day 1
  const day1Params = interpolateDailyCropParameters(crop, 1);
  let prevRootDepthM = day1Params.rootDepthM;
  const initialTawMm = 1000 * (thetaFc - thetaWp) * prevRootDepthM;

  // Initialize root-zone water content & depletion from carry-over state if present
  let currentDepletionMm;
  if (initialState && Number.isFinite(initialState.endingTheta)) {
    const clampedTheta = Math.max(thetaWp, Math.min(thetaFc, initialState.endingTheta));
    currentDepletionMm = Math.max(
      0,
      Math.min(initialTawMm, 1000 * (thetaFc - clampedTheta) * prevRootDepthM)
    );
  } else if (initialState && Number.isFinite(initialState.endingDepletionFraction)) {
    currentDepletionMm =
      Math.max(0, Math.min(1, initialState.endingDepletionFraction)) * initialTawMm;
  } else {
    // Default start at 25% of TAW depleted
    currentDepletionMm = 0.25 * initialTawMm;
  }

  let currentSalinityEcDsm =
    initialState?.endingSalinityEcDsm ?? soil.baselineSoilSalinityEcDsm ?? 2.4;
  let cumulativeNitrogenKgHa = initialState?.endingNitrogenBalanceKgHa ?? 0.0;

  const dailyTrajectory = [];
  let totalPrecipMm = 0;
  let totalEffectivePrecipMm = 0;
  let totalRunoffMm = 0;
  let totalNetIrrigationMm = 0;
  let totalGrossIrrigationMm = 0;
  let totalEtcPotMm = 0;
  let totalEtcActMm = 0;
  let totalDrainageMm = 0;
  let missingForcingDays = 0;
  let heatStressDays = 0;
  let waterStressDays = 0;
  let hlsAssimilatedDays = 0;

  const initialSoilStorageMm = Math.max(0, initialTawMm - currentDepletionMm);

  for (let dayIdx = 1; dayIdx <= totalSeasonDays; dayIdx += 1) {
    const currentMs = startMs + (dayIdx - 1) * 86400000;
    const isoDate = new Date(currentMs).toISOString().slice(0, 10);

    const forcing = forcingMap.get(isoDate);
    const observedNdvi = getNdvi(isoDate);

    const cropParams = interpolateDailyCropParameters(crop, dayIdx, {
      observedNdvi
    });
    if (cropParams.ndviConstraintApplied) hlsAssimilatedDays += 1;

    const Zr = cropParams.rootDepthM;
    const tawMm = 1000 * (thetaFc - thetaWp) * Zr;
    const maxSaturationAboveFcMm = 1000 * (thetaSat - thetaFc) * Zr;

    // When roots deepen into subsoil during development stage, account for water held in newly entered layer
    if (Zr > prevRootDepthM) {
      const deltaZr = Zr - prevRootDepthM;
      const subsoilTheta = initialState?.endingTheta ?? (thetaWp + 0.65 * (thetaFc - thetaWp));
      const addedDepletionMm =
        1000 * Math.max(0, thetaFc - Math.min(thetaFc, subsoilTheta)) * deltaZr;
      currentDepletionMm = Math.min(tawMm, currentDepletionMm + addedDepletionMm);
    }
    prevRootDepthM = Zr;

    // Handle missing forcing transparently without inventing fake weather
    const hasValidEt0 = forcing && Number.isFinite(forcing.et0MmDay) && forcing.et0MmDay >= 0;
    const hasValidPrecip =
      forcing && Number.isFinite(forcing.precipMmDay) && forcing.precipMmDay >= 0;

    if (!hasValidEt0 || !hasValidPrecip) {
      missingForcingDays += 1;
    }

    const et0MmDay = hasValidEt0 ? forcing.et0MmDay : 0.0;
    const precipMmDay = hasValidPrecip ? forcing.precipMmDay : 0.0;
    const tMaxC = forcing && Number.isFinite(forcing.tMaxC) ? forcing.tMaxC : null;

    if (tMaxC !== null && tMaxC > crop.heatStressThresholdC && crop.cropId !== 'bare_fallow') {
      heatStressDays += 1;
    }

    // 1. Surface Runoff (SCS Curve Number)
    const relativeWetness = tawMm > 0 ? Math.max(0, 1 - currentDepletionMm / tawMm) : 0.5;
    const runoffMm = computeScsRunoffMm(precipMmDay, baseCn, relativeWetness);
    const effectivePrecipMm = Math.max(0, precipMmDay - runoffMm);

    // 2. Potential Crop Evapotranspiration (ETc_pot)
    const etcPotMm = cropParams.kcAdjusted * et0MmDay;

    // 3. Readily Available Water (RAW) & Irrigation Scheduling
    const pAdj = Math.max(
      0.1,
      Math.min(0.8, cropParams.depletionFractionP + 0.04 * (5.0 - etcPotMm))
    );
    const rawMm = pAdj * tawMm;

    let netIrrigationMm = 0.0;
    let grossIrrigationMm = 0.0;

    const preIrrigDepletion = currentDepletionMm - effectivePrecipMm;
    if (
      autoIrrigate &&
      crop.cropId !== 'bare_fallow' &&
      cropParams.stage !== 'late_season' &&
      preIrrigDepletion >= rawMm
    ) {
      // Refill root zone back to field capacity plus leaching requirement fraction
      netIrrigationMm = preIrrigDepletion * (1.0 + 0.5 * leachingReq);
      grossIrrigationMm = netIrrigationMm / appEfficiency;
    }

    // 4. Water Stress Coefficient (Ks) and Salinity Stress Coefficient (Ks_salt)
    const depletionBeforeEt = Math.max(0, preIrrigDepletion - netIrrigationMm);
    let ksWater = 1.0;
    if (depletionBeforeEt > rawMm && tawMm > rawMm) {
      ksWater = Math.max(
        0,
        Math.min(1.0, (tawMm - depletionBeforeEt) / ((1 - pAdj) * tawMm))
      );
    }

    // Maas-Hoffman salinity reduction factor (FAO-56 Eq. 89)
    let ksSalt = 1.0;
    if (
      crop.cropId !== 'bare_fallow' &&
      currentSalinityEcDsm > crop.salinityTolerance.thresholdEcDsm
    ) {
      const saltPenalty =
        (crop.salinityTolerance.slopePctPerDsm / 100) *
        (currentSalinityEcDsm - crop.salinityTolerance.thresholdEcDsm);
      ksSalt = Math.max(0.25, 1.0 - saltPenalty);
    }

    const ksCombined = Math.min(ksWater, ksSalt);
    if (ksCombined < 0.92 && crop.cropId !== 'bare_fallow') {
      waterStressDays += 1;
    }

    const etcActMm = ksCombined * etcPotMm;

    // 5. Deep Percolation / Drainage (DP) and Paddy Percolation
    // Water balance before drainage: Dr_temp = Dr_prev - P_eff - Irrig_net + ETc_act
    const tentativeDepletionMm =
      currentDepletionMm - effectivePrecipMm - netIrrigationMm + etcActMm;

    let drainageMm = 0.0;
    if (tentativeDepletionMm < 0) {
      // Excess water above field capacity (negative depletion)
      const excessWaterAboveFcMm = -tentativeDepletionMm;
      // Free-draining fraction + excess beyond saturation
      const immediateOverflow = Math.max(0, excessWaterAboveFcMm - maxSaturationAboveFcMm);
      const gravityDrain =
        tauDrainage * Math.min(excessWaterAboveFcMm, maxSaturationAboveFcMm);
      drainageMm = immediateOverflow + gravityDrain + (1 - tauDrainage) * excessWaterAboveFcMm;
    }

    if (crop.standingWaterPercolationAdditionMmDay && autoIrrigate) {
      const paddySeepage = crop.standingWaterPercolationAdditionMmDay;
      drainageMm += paddySeepage;
      netIrrigationMm += paddySeepage;
      grossIrrigationMm += paddySeepage / appEfficiency;
    }

    // 6. Final Daily Root-Zone Depletion and Soil Storage Update
    currentDepletionMm = Math.max(
      0,
      Math.min(
        tawMm,
        currentDepletionMm - effectivePrecipMm - netIrrigationMm + etcActMm + drainageMm
      )
    );

    const soilStorageMm = Math.max(0, tawMm - currentDepletionMm);
    const volumetricTheta = thetaFc - currentDepletionMm / (1000 * Zr);

    // 7. Daily Root-Zone Salinity Mass Balance Update
    // Irrigation adds dissolved salts; drainage leaches salts; bare-soil evaporation concentrates salts
    const saltAdditionDsm = (netIrrigationMm / Math.max(150, tawMm)) * irrigSalinityEc * 0.35;
    const saltLeachingDsm =
      (drainageMm / Math.max(150, tawMm)) * currentSalinityEcDsm * 0.65;
    const bareEvapSaltRiseDsm =
      crop.cropId === 'bare_fallow' && et0MmDay > 3.5 ? 0.0045 * et0MmDay : 0.0;

    currentSalinityEcDsm = Math.max(
      0.8,
      Math.min(
        18.0,
        currentSalinityEcDsm + saltAdditionDsm - saltLeachingDsm + bareEvapSaltRiseDsm
      )
    );

    totalPrecipMm += precipMmDay;
    totalEffectivePrecipMm += effectivePrecipMm;
    totalRunoffMm += runoffMm;
    totalNetIrrigationMm += netIrrigationMm;
    totalGrossIrrigationMm += grossIrrigationMm;
    totalEtcPotMm += etcPotMm;
    totalEtcActMm += etcActMm;
    totalDrainageMm += drainageMm;

    dailyTrajectory.push({
      date: isoDate,
      dayAfterSowing: dayIdx,
      stage: cropParams.stage,
      kc: cropParams.kcAdjusted,
      rootDepthM: Zr,
      precipMm: Number(precipMmDay.toFixed(3)),
      runoffMm: Number(runoffMm.toFixed(3)),
      effectivePrecipMm: Number(effectivePrecipMm.toFixed(3)),
      netIrrigationMm: Number(netIrrigationMm.toFixed(3)),
      grossIrrigationMm: Number(grossIrrigationMm.toFixed(3)),
      et0Mm: Number(et0MmDay.toFixed(3)),
      etcPotMm: Number(etcPotMm.toFixed(3)),
      etcActMm: Number(etcActMm.toFixed(3)),
      drainageMm: Number(drainageMm.toFixed(3)),
      depletionMm: Number(currentDepletionMm.toFixed(3)),
      tawMm: Number(tawMm.toFixed(3)),
      soilStorageMm: Number(soilStorageMm.toFixed(3)),
      volumetricTheta: Number(volumetricTheta.toFixed(4)),
      ksCombined: Number(ksCombined.toFixed(4)),
      salinityEcDsm: Number(currentSalinityEcDsm.toFixed(3))
    });
  }

  // FAO-33 / FAO-56 Relative Yield response to water & salinity:
  // `1 - Ya/Ym = Ky * (1 - ETc_act / ETc_pot)`
  const seasonalEtRatio = totalEtcPotMm > 0 ? Math.min(1.0, totalEtcActMm / totalEtcPotMm) : 1.0;
  const yieldFraction =
    crop.cropId === 'bare_fallow'
      ? 0.0
      : Math.max(0.15, Math.min(1.0, 1.0 - crop.yieldResponseFactorKy * (1.0 - seasonalEtRatio)));
  const heatPenaltyFactor =
    heatStressDays > 10 ? Math.max(0.75, 1.0 - 0.008 * (heatStressDays - 10)) : 1.0;
  const estimatedYieldTonHa = Number(
    (crop.referenceBaselineYieldTonHa * yieldFraction * heatPenaltyFactor).toFixed(3)
  );

  const endingDay = dailyTrajectory[dailyTrajectory.length - 1];
  const endingSoilStorageMm = endingDay ? endingDay.soilStorageMm : initialSoilStorageMm;
  const deltaSoilStorageMm = endingSoilStorageMm - initialSoilStorageMm;

  // Update nitrogen carry-over balance
  cumulativeNitrogenKgHa = Number(
    (cumulativeNitrogenKgHa + crop.nitrogenBalanceKgHa).toFixed(2)
  );

  const forcingCoverageRatio =
    totalSeasonDays > 0 ? (totalSeasonDays - missingForcingDays) / totalSeasonDays : 0;

  return {
    cropId: crop.cropId,
    cropNameEn: crop.nameEn,
    cropNameAr: crop.nameAr,
    photosyntheticPathway: crop.photosyntheticPathway,
    sowingDate,
    harvestDate,
    totalSeasonDays,
    missingForcingDays,
    forcingCoverageRatio: Number(forcingCoverageRatio.toFixed(4)),
    hlsAssimilatedDays,
    totalsMm: {
      precipitation: Number(totalPrecipMm.toFixed(2)),
      effectivePrecipitation: Number(totalEffectivePrecipMm.toFixed(2)),
      runoff: Number(totalRunoffMm.toFixed(2)),
      netIrrigation: Number(totalNetIrrigationMm.toFixed(2)),
      grossIrrigation: Number(totalGrossIrrigationMm.toFixed(2)),
      etcPotential: Number(totalEtcPotMm.toFixed(2)),
      etcActual: Number(totalEtcActMm.toFixed(2)),
      drainage: Number(totalDrainageMm.toFixed(2)),
      initialSoilStorage: Number(initialSoilStorageMm.toFixed(2)),
      endingSoilStorage: Number(endingSoilStorageMm.toFixed(2)),
      deltaSoilStorage: Number(deltaSoilStorageMm.toFixed(2))
    },
    agronomicPerformance: {
      seasonalEtRatio: Number(seasonalEtRatio.toFixed(4)),
      waterStressDays,
      heatStressDays,
      estimatedYieldTonHa,
      estimatedGrossMarginUsdHa: Number(
        (crop.grossMarginAnchorUsdHa * yieldFraction * heatPenaltyFactor).toFixed(2)
      )
    },
    endingCarryOverState: {
      endingTheta: endingDay ? endingDay.volumetricTheta : thetaFc,
      endingDepletionMm: endingDay ? endingDay.depletionMm : 0,
      endingDepletionFraction:
        endingDay && endingDay.tawMm > 0
          ? Number((endingDay.depletionMm / endingDay.tawMm).toFixed(4))
          : 0,
      endingSoilStorageMm: Number(endingSoilStorageMm.toFixed(2)),
      endingSalinityEcDsm: Number(currentSalinityEcDsm.toFixed(3)),
      endingNitrogenBalanceKgHa: cumulativeNitrogenKgHa,
      previousPestHostGroup: crop.pestHostGroup
    },
    dailyTrajectory
  };
}

/**
 * Simulates a complete multi-season crop rotation sequence, propagating the ending soil moisture,
 * root-zone depletion, salinity (`ECe`), nitrogen carry-over (`kg N/ha`), and pest host history
 * from each season directly into the initial conditions of the next season.
 *
 * Also handles inter-season transition gaps (if there is an unmodeled gap between harvest of
 * season `i` and sowing of season `i+1`, simulates bare-soil transition evaporation/rainfall).
 *
 * @param {Object} params
 * @param {Object} params.rotation - Rotation definition `{ rotationId, name, sequence: [...] }`
 * @param {Object} params.pilotConfig - Loaded pilot config (`soil`, `waterManagement`, etc.)
 * @param {Array<Object>} params.dailyForcing - Daily climate & precipitation array
 * @param {Map<string, number>|Object} [params.hlsNdviByDate]
 * @returns {Object} Full multi-season rotation water balance and carry-over ledger
 */
export function simulateMultiSeasonRotation(params = {}) {
  const {
    rotation,
    pilotConfig,
    dailyForcing = [],
    hlsNdviByDate = null
  } = params;

  if (!rotation || !Array.isArray(rotation.sequence) || rotation.sequence.length === 0) {
    throw new Error('simulateMultiSeasonRotation requires a rotation with a non-empty sequence');
  }

  let carryOverState = {
    endingTheta:
      pilotConfig.soil.wiltingPointThetaWp +
      0.75 * (pilotConfig.soil.fieldCapacityThetaFc - pilotConfig.soil.wiltingPointThetaWp),
    endingDepletionFraction: 0.25,
    endingSalinityEcDsm: pilotConfig.soil.baselineSoilSalinityEcDsm ?? 2.4,
    endingNitrogenBalanceKgHa: 0.0,
    previousPestHostGroup: null
  };

  const seasonResults = [];
  let pestCycleBrokenCount = 0;
  let consecutiveHostPenaltyCount = 0;

  for (let i = 0; i < rotation.sequence.length; i += 1) {
    const step = rotation.sequence[i];

    // Check if there is an inter-season transition gap > 1 day between previous harvest and current sowing
    if (i > 0) {
      const prevHarvestMs = Date.parse(`${rotation.sequence[i - 1].harvestDate}T00:00:00Z`);
      const currSowingMs = Date.parse(`${step.sowingDate}T00:00:00Z`);
      const gapDays = Math.round((currSowingMs - prevHarvestMs) / 86400000) - 1;
      if (gapDays >= 2) {
        const gapStart = new Date(prevHarvestMs + 86400000).toISOString().slice(0, 10);
        const gapEnd = new Date(currSowingMs - 86400000).toISOString().slice(0, 10);
        const transitionSim = simulateSeasonWaterBalance({
          crop: 'bare_fallow',
          sowingDate: gapStart,
          harvestDate: gapEnd,
          soil: pilotConfig.soil,
          waterManagement: pilotConfig.waterManagement,
          dailyForcing,
          hlsNdviByDate,
          initialState: carryOverState,
          autoIrrigate: false
        });
        carryOverState = transitionSim.endingCarryOverState;
      }
    }

    const prevHost = carryOverState.previousPestHostGroup;
    const seasonSim = simulateSeasonWaterBalance({
      crop: step.cropId,
      sowingDate: step.sowingDate,
      harvestDate: step.harvestDate,
      soil: pilotConfig.soil,
      waterManagement: pilotConfig.waterManagement,
      dailyForcing,
      hlsNdviByDate,
      initialState: carryOverState,
      autoIrrigate: step.cropId !== 'bare_fallow'
    });

    const currentCrop = CROP_LIBRARY[step.cropId];
    if (
      prevHost &&
      currentCrop &&
      currentCrop.cropId !== 'bare_fallow' &&
      prevHost !== 'bare_soil_weeds'
    ) {
      if (prevHost === currentCrop.pestHostGroup) {
        consecutiveHostPenaltyCount += 1;
      } else {
        pestCycleBrokenCount += 1;
      }
    }

    carryOverState = seasonSim.endingCarryOverState;
    seasonResults.push(seasonSim);
  }

  // Aggregate multi-season totals
  const aggregateTotalsMm = seasonResults.reduce(
    (acc, s) => {
      acc.precipitation += s.totalsMm.precipitation;
      acc.effectivePrecipitation += s.totalsMm.effectivePrecipitation;
      acc.runoff += s.totalsMm.runoff;
      acc.netIrrigation += s.totalsMm.netIrrigation;
      acc.grossIrrigation += s.totalsMm.grossIrrigation;
      acc.etcPotential += s.totalsMm.etcPotential;
      acc.etcActual += s.totalsMm.etcActual;
      acc.drainage += s.totalsMm.drainage;
      return acc;
    },
    {
      precipitation: 0,
      effectivePrecipitation: 0,
      runoff: 0,
      netIrrigation: 0,
      grossIrrigation: 0,
      etcPotential: 0,
      etcActual: 0,
      drainage: 0
    }
  );

  for (const key of Object.keys(aggregateTotalsMm)) {
    aggregateTotalsMm[key] = Number(aggregateTotalsMm[key].toFixed(2));
  }

  const totalGrossMarginUsdHa = Number(
    seasonResults
      .reduce((acc, s) => acc + s.agronomicPerformance.estimatedGrossMarginUsdHa, 0)
      .toFixed(2)
  );

  const totalDays = seasonResults.reduce((acc, s) => acc + s.totalSeasonDays, 0);
  const totalMissingDays = seasonResults.reduce((acc, s) => acc + s.missingForcingDays, 0);
  const overallForcingCoverageRatio =
    totalDays > 0 ? Number(((totalDays - totalMissingDays) / totalDays).toFixed(4)) : 0;

  return {
    rotationId: rotation.rotationId,
    name: rotation.name,
    nameAr: rotation.nameAr || rotation.name,
    pilotId: pilotConfig.pilotId,
    overallForcingCoverageRatio,
    aggregateTotalsMm,
    totalGrossMarginUsdHa,
    finalCarryOverState: carryOverState,
    pestManagementSummary: {
      pestCycleBrokenCount,
      consecutiveHostPenaltyCount,
      interruptsPestCycles: consecutiveHostPenaltyCount === 0 && pestCycleBrokenCount > 0
    },
    seasonResults
  };
}
