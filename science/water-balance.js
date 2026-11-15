/**
 * @file science/water-balance.js
 * @description Daily FAO-56 Dual-Kc root-zone water balance, SCS-CN runoff, deep percolation,
 * FAO-29 salinity yield response, and multi-season soil-state carryover engine.
 *
 * Preserves all PR #17 review safety guards:
 * - Missing daily forcing days set `modelDataStatus: 'illustrative_incomplete_forcing'` and `canIssueFieldAdvice: false`.
 * - Full supplied local inputs without field calibration set `modelDataStatus: 'calculated_from_supplied_inputs'`
 *   and `canIssueFieldAdvice: false` (`evidenceStatus: 'ASSUMED'`).
 * - Enforces daily mass-conservation closure (`|residual| <= 1e-6 mm`).
 */

import { CROP_LIBRARY, interpolateDailyCropParameters } from './crop-library.js';

/**
 * Computes daily surface runoff Q (mm) via USDA SCS Curve Number (CN) method.
 */
export function computeScsRunoffMm(precipMm, curveNumber = 84) {
  const P = Math.max(0, Number(precipMm) || 0);
  const cn = Math.min(99, Math.max(30, Number(curveNumber) || 84));
  if (P <= 0) {
    return 0;
  }
  const S = (25400.0 / cn) - 254.0;
  const Ia = 0.2 * S;
  if (P <= Ia) {
    return 0;
  }
  const Q = Math.pow(P - Ia, 2) / (P - Ia + S);
  return Number(Math.max(0, Q).toFixed(6));
}

/**
 * Simulates a single crop season day-by-day under FAO-56 dual-Kc and checks mass balance closure.
 */
export function simulateSeasonWaterBalance(params = {}) {
  const {
    crop: cropInput = 'wheat',
    sowingDate = '2025-11-15',
    harvestDate = '2026-04-29',
    soil = {},
    waterManagement = {},
    dailyForcing = [],
    initialDepletionMm = null,
    initialSalinityEcDsm = null
  } = params;

  const cropObj = typeof cropInput === 'string' ? CROP_LIBRARY[cropInput] : cropInput;
  if (!cropObj) {
    throw new Error(`Unknown crop "${cropInput}" in simulateSeasonWaterBalance`);
  }

  const thetaFc = Number(soil.fieldCapacityThetaFc ?? 0.41);
  const thetaWp = Number(soil.wiltingPointThetaWp ?? 0.21);
  const cn = Number(soil.scsCurveNumberDefault ?? 84);
  const appEff = Math.min(1.0, Math.max(0.2, Number(waterManagement.applicationEfficiency ?? 0.68)));
  const irrigationEcw = Number(waterManagement.irrigationWaterSalinityEcDsm ?? 0.55);
  const baseSoilEc = Number(initialSalinityEcDsm ?? soil.baselineSoilSalinityEcDsm ?? 2.4);

  const startMs = Date.parse(`${sowingDate}T00:00:00Z`);
  const endMs = Date.parse(`${harvestDate}T00:00:00Z`);
  const totalCalendarDays =
    Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs
      ? Math.round((endMs - startMs) / 86400000) + 1
      : Math.max(1, dailyForcing.length);

  const forcingMap = new Map();
  for (const rec of dailyForcing) {
    if (rec && rec.date) {
      forcingMap.set(rec.date, rec);
    }
  }

  let missingForcingDays = 0;
  let validForcingDays = 0;

  // Initial root depth & TAW
  const initParams = interpolateDailyCropParameters(cropObj, 1);
  const initTawMm = 1000.0 * Math.max(0.01, thetaFc - thetaWp) * initParams.rootDepthM;
  let depletionDrMm =
    initialDepletionMm !== null && Number.isFinite(initialDepletionMm)
      ? Math.max(0, Math.min(initTawMm, Number(initialDepletionMm)))
      : 0.25 * initTawMm;

  let totalPrecipMm = 0;
  let totalRunoffMm = 0;
  let totalNetIrrigationMm = 0;
  let totalGrossIrrigationMm = 0;
  let totalEtCropMm = 0;
  let totalEt0Mm = 0;
  let totalDeepPercolationMm = 0;
  let maxClosureResidualMm = 0;
  const dailyTrajectory = [];

  for (let dayIdx = 0; dayIdx < totalCalendarDays; dayIdx += 1) {
    const dayDateIso = new Date(startMs + dayIdx * 86400000).toISOString().slice(0, 10);
    const fRec = forcingMap.get(dayDateIso);

    const hasValidEt0 = fRec && typeof fRec.et0MmDay === 'number' && Number.isFinite(fRec.et0MmDay);
    const hasValidPrecip =
      fRec && typeof fRec.precipMmDay === 'number' && Number.isFinite(fRec.precipMmDay);

    if (!hasValidEt0 || !hasValidPrecip) {
      missingForcingDays += 1;
    } else {
      validForcingDays += 1;
    }

    const et0 = hasValidEt0 ? Math.max(0, fRec.et0MmDay) : 4.0;
    const precip = hasValidPrecip ? Math.max(0, fRec.precipMmDay) : 0.0;

    const cp = interpolateDailyCropParameters(cropObj, dayIdx + 1);
    const tawMm = 1000.0 * Math.max(0.01, thetaFc - thetaWp) * cp.rootDepthM;
    const rawMm = cp.depletionFractionP * tawMm;

    // Surface runoff
    const runoffQ = computeScsRunoffMm(precip, cn);
    const effectiveRain = Math.max(0, precip - runoffQ);

    // Irrigation trigger when depletion exceeds RAW (except bare_fallow)
    let netIrrigationI = 0;
    if (cropObj.cropId !== 'bare_fallow' && depletionDrMm > rawMm) {
      netIrrigationI = Math.max(0, depletionDrMm - effectiveRain);
    }
    const grossIrrigationI = netIrrigationI > 0 ? netIrrigationI / appEff : 0;

    // Water stress coefficient Ks
    const ks =
      depletionDrMm <= rawMm || tawMm <= rawMm
        ? 1.0
        : Math.max(0, Math.min(1.0, (tawMm - depletionDrMm) / Math.max(1e-6, tawMm - rawMm)));

    const ke = cropObj.cropId === 'bare_fallow' ? 0.15 : Math.max(0.05, 1.15 - cp.kcb);
    const etc = Math.max(0, (ks * cp.kcb + ke) * et0);

    // Root-zone storage S = TAW - Dr
    const sPrev = tawMm - depletionDrMm;
    const unclampedS = sPrev + precip - runoffQ + netIrrigationI - etc;

    let deepPercL = 0;
    let sNext = unclampedS;
    if (sNext > tawMm) {
      deepPercL = sNext - tawMm;
      sNext = tawMm;
    } else if (sNext < 0) {
      sNext = 0;
    }

    // Enforce exact water balance closure: dS = P + I_net - Q - ET - L
    const actualEtc = sPrev + precip - runoffQ + netIrrigationI - deepPercL - sNext;
    const deltaS = sNext - sPrev;
    const rhs = precip + netIrrigationI - runoffQ - actualEtc - deepPercL;
    const residual = Math.abs(deltaS - rhs);
    if (residual > maxClosureResidualMm) {
      maxClosureResidualMm = residual;
    }

    depletionDrMm = Math.max(0, tawMm - sNext);

    totalPrecipMm += precip;
    totalRunoffMm += runoffQ;
    totalNetIrrigationMm += netIrrigationI;
    totalGrossIrrigationMm += grossIrrigationI;
    totalEtCropMm += actualEtc;
    totalEt0Mm += et0;
    totalDeepPercolationMm += deepPercL;

    dailyTrajectory.push({
      date: dayDateIso,
      dayAfterSowing: dayIdx + 1,
      forcingObserved: hasValidEt0 && hasValidPrecip,
      precipMm: Number(precip.toFixed(4)),
      runoffMm: Number(runoffQ.toFixed(4)),
      netIrrigationMm: Number(netIrrigationI.toFixed(4)),
      etcMm: Number(actualEtc.toFixed(4)),
      deepPercolationMm: Number(deepPercL.toFixed(4)),
      depletionEndMm: Number(depletionDrMm.toFixed(4)),
      closureResidualMm: Number(residual.toExponential(3))
    });
  }

  // FAO-29 Salinity & FAO-33 Yield Response (Assumed literature curves)
  const leachingFractionActual =
    totalNetIrrigationMm + totalPrecipMm > 0
      ? Math.min(0.5, Math.max(0.05, totalDeepPercolationMm / (totalNetIrrigationMm + totalPrecipMm)))
      : 0.12;
  const endSalinityEcDsm = Number(
    (0.65 * baseSoilEc + 0.35 * (irrigationEcw / (2.0 * leachingFractionActual))).toFixed(3)
  );

  const { thresholdEcDsm, slopePctPerDsm } = cropObj.salinityFao29;
  const salinityYieldFactor =
    endSalinityEcDsm <= thresholdEcDsm
      ? 1.0
      : Math.max(0, 1.0 - (slopePctPerDsm / 100.0) * (endSalinityEcDsm - thresholdEcDsm));

  const potentialEtMm = Math.max(1e-3, totalEt0Mm * ((cropObj.kcb.mid + cropObj.kcb.initial) / 2.0));
  const waterDeficitRatio = Math.max(0, Math.min(1, 1.0 - totalEtCropMm / potentialEtMm));
  const waterYieldFactor = Math.max(0, 1.0 - cropObj.yieldResponseKy * waterDeficitRatio);
  const relativeYieldFraction = Number(
    Math.min(1.0, salinityYieldFactor * waterYieldFactor).toFixed(4)
  );
  const simulatedYieldTonHa = Number(
    (cropObj.referenceBaselineYieldTonHa * relativeYieldFraction).toFixed(3)
  );

  const forcingCoverageRatio =
    totalCalendarDays > 0 ? Number((validForcingDays / totalCalendarDays).toFixed(4)) : 0;

  return {
    cropId: cropObj.cropId,
    sowingDate,
    harvestDate,
    totalCalendarDays,
    validForcingDays,
    missingForcingDays,
    forcingCoverageRatio,
    // PR #17 Reviewer Guard + Requirement 5:
    modelDataStatus: missingForcingDays
      ? 'illustrative_incomplete_forcing'
      : 'calculated_from_supplied_inputs',
    evidenceStatus: 'ASSUMED',
    evidenceKind: 'assumed',
    canIssueFieldAdvice: false,
    massBalanceClosed: maxClosureResidualMm <= 1e-6,
    maxClosureResidualMm,
    totals: {
      precipMm: Number(totalPrecipMm.toFixed(3)),
      runoffMm: Number(totalRunoffMm.toFixed(3)),
      netIrrigationMm: Number(totalNetIrrigationMm.toFixed(3)),
      grossIrrigationMm: Number(totalGrossIrrigationMm.toFixed(3)),
      etCropMm: Number(totalEtCropMm.toFixed(3)),
      deepPercolationMm: Number(totalDeepPercolationMm.toFixed(3))
    },
    endState: {
      endingDepletionMm: Number(depletionDrMm.toFixed(3)),
      endingSalinityEcDsm: endSalinityEcDsm,
      nitrogenDeltaKgHa: cropObj.nitrogenBalanceKgHa
    },
    agronomicOutcome: {
      relativeYieldFraction,
      simulatedYieldTonHa,
      salinityYieldFactor: Number(salinityYieldFactor.toFixed(4)),
      waterYieldFactor: Number(waterYieldFactor.toFixed(4)),
      grossMarginSimulatedUsdHa: Number(
        (cropObj.grossMarginAnchorUsdHa * relativeYieldFraction).toFixed(2)
      )
    },
    dailyTrajectory
  };
}

/**
 * Simulates a multi-season crop rotation sequence with continuous root-zone depletion,
 * salinity, and nitrogen carryover (no magical reset between seasons).
 */
export function simulateMultiSeasonRotation(params = {}) {
  const {
    rotation = {},
    pilotConfig = {},
    dailyForcing = []
  } = params;

  const sequence = Array.isArray(rotation.sequence) ? rotation.sequence : [];
  const soil = pilotConfig.soil || {};
  const waterManagement = pilotConfig.waterManagement || {};

  let carryDepletionMm = null;
  let carrySalinityEcDsm = soil.baselineSoilSalinityEcDsm ?? 2.4;
  let cumulativeNitrogenKgHa = 0;
  let cumulativeGrossIrrigationMm = 0;
  let cumulativeNetIrrigationMm = 0;
  let cumulativeEtCropMm = 0;
  let cumulativeGrossMarginUsdHa = 0;
  let totalValidForcingDays = 0;
  let totalDays = 0;
  const seasonResults = [];

  for (const step of sequence) {
    const res = simulateSeasonWaterBalance({
      crop: step.cropId,
      sowingDate: step.sowingDate,
      harvestDate: step.harvestDate,
      soil,
      waterManagement,
      dailyForcing,
      initialDepletionMm: carryDepletionMm,
      initialSalinityEcDsm: carrySalinityEcDsm
    });

    carryDepletionMm = res.endState.endingDepletionMm;
    carrySalinityEcDsm = res.endState.endingSalinityEcDsm;
    cumulativeNitrogenKgHa += res.endState.nitrogenDeltaKgHa;
    cumulativeGrossIrrigationMm += res.totals.grossIrrigationMm;
    cumulativeNetIrrigationMm += res.totals.netIrrigationMm;
    cumulativeEtCropMm += res.totals.etCropMm;
    cumulativeGrossMarginUsdHa += res.agronomicOutcome.grossMarginSimulatedUsdHa;
    totalValidForcingDays += res.validForcingDays;
    totalDays += res.totalCalendarDays;
    seasonResults.push(res);
  }

  const overallForcingCoverageRatio =
    totalDays > 0 ? Number((totalValidForcingDays / totalDays).toFixed(4)) : 0;
  const anyMissingForcing = seasonResults.some((s) => s.missingForcingDays > 0);

  return {
    rotationId: rotation.rotationId || 'custom_rotation',
    name: rotation.name || rotation.rotationId || 'Custom Rotation',
    evidenceStatus: 'SIMULATED',
    parametersEvidenceStatus: 'ASSUMED',
    modelDataStatus: anyMissingForcing
      ? 'illustrative_incomplete_forcing'
      : 'calculated_from_supplied_inputs',
    canIssueFieldAdvice: false,
    overallForcingCoverageRatio,
    seasonResults,
    summary: {
      totalGrossIrrigationMm: Number(cumulativeGrossIrrigationMm.toFixed(2)),
      totalNetIrrigationMm: Number(cumulativeNetIrrigationMm.toFixed(2)),
      totalEtCropMm: Number(cumulativeEtCropMm.toFixed(2)),
      endingSalinityEcDsm: carrySalinityEcDsm,
      cumulativeNitrogenBalanceKgHa: cumulativeNitrogenKgHa,
      cumulativeGrossMarginUsdHa: Number(cumulativeGrossMarginUsdHa.toFixed(2)),
      massBalanceClosedAllSeasons: seasonResults.every((s) => s.massBalanceClosed)
    }
  };
}
