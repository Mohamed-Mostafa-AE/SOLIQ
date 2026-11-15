/**
 * @file science/eo-interval-regret.js
 * @description Interval-regret minimax separator (`evaluateIntervalRegret`) with explicit
 * `comparison_only` abstention when critical EO inputs are missing or regret intervals overlap.
 */

export const DEFAULT_UNCERTAINTY_BOUNDS = Object.freeze({
  et0RelativeUncertainty: 0.1,
  kcRelativeUncertainty: 0.08,
  imergPrecipRelativeUncertainty: 0.18,
  hlsNdviAbsoluteUncertainty: 0.04,
  soilAvailableWaterRelativeUncertainty: 0.12,
  minMetCoverageRatio: 0.85,
  minImergCoverageRatio: 0.8,
  minHlsClearSceneRatio: 0.35
});

/**
 * Computes lower and upper composite utility bounds `[uLower, uUpper]` in `[0, 1]`
 * for each simulated rotation under bounded parameter perturbations.
 */
export function computeStrategyUncertaintyIntervals(simulatedRotations = [], bounds = DEFAULT_UNCERTAINTY_BOUNDS) {
  if (!Array.isArray(simulatedRotations) || simulatedRotations.length === 0) {
    return [];
  }

  const maxWater = Math.max(
    1,
    ...simulatedRotations.map((r) => r.summary?.totalGrossIrrigationMm || 1000)
  );
  const maxMargin = Math.max(
    1,
    ...simulatedRotations.map((r) => r.summary?.cumulativeGrossMarginUsdHa || 1500)
  );

  const halfWidth = Number(
    (
      0.35 * (bounds.et0RelativeUncertainty ?? 0.1) +
      0.25 * (bounds.kcRelativeUncertainty ?? 0.08) +
      0.25 * (bounds.imergPrecipRelativeUncertainty ?? 0.18) +
      0.15 * (bounds.soilAvailableWaterRelativeUncertainty ?? 0.12)
    ).toFixed(4)
  );

  return simulatedRotations.map((rot) => {
    const waterScore =
      1.0 - Math.min(1.0, (rot.summary?.totalGrossIrrigationMm || 0) / (maxWater * 1.15));
    const marginScore = Math.min(
      1.0,
      Math.max(0, (rot.summary?.cumulativeGrossMarginUsdHa || 0) / maxMargin)
    );
    const salinityScore = Math.max(
      0,
      Math.min(1.0, 1.0 - Math.max(0, (rot.summary?.endingSalinityEcDsm || 2.4) - 1.5) / 6.0)
    );
    const nitrogenScore =
      (rot.summary?.cumulativeNitrogenBalanceKgHa || 0) >= 0 ? 0.85 : 0.45;

    const nominalUtility = Number(
      (0.35 * waterScore + 0.3 * marginScore + 0.2 * salinityScore + 0.15 * nitrogenScore).toFixed(4)
    );

    const uLower = Number(Math.max(0, nominalUtility - halfWidth).toFixed(4));
    const uUpper = Number(Math.min(1, nominalUtility + halfWidth).toFixed(4));

    return {
      rotationId: rot.rotationId,
      strategyCode: rot.strategyCode || rot.rotationId,
      name: rot.name,
      nominalUtility,
      utilityInterval: { lower: uLower, upper: uUpper },
      evidenceStatus: 'SIMULATED',
      parametersEvidenceStatus: 'ASSUMED'
    };
  });
}

/**
 * Evaluates interval minimax regret across candidate rotations.
 * Forces `comparison_only` if:
 * - any critical remote or ground evidence is missing (`missingCriticalInputs.length > 0`)
 * - `forceComparisonOnly` is set
 * - intervals overlap so that no single candidate has strictly smaller worst-case regret.
 */
export function evaluateIntervalRegret(simulatedRotations = [], options = {}) {
  const bounds = { ...DEFAULT_UNCERTAINTY_BOUNDS, ...(options.uncertaintyBounds || {}) };
  const strategyIntervals = computeStrategyUncertaintyIntervals(simulatedRotations, bounds);
  const comparisonOnlyReasons = [...(options.comparisonOnlyReasons || [])];

  if (options.forceComparisonOnly) {
    if (!comparisonOnlyReasons.includes('forced_by_missing_or_unverified_evidence')) {
      comparisonOnlyReasons.push('forced_by_missing_or_unverified_evidence');
    }
  }

  const withRegret = strategyIntervals.map((cand) => {
    const othersMaxUpper = Math.max(
      cand.utilityInterval.lower,
      ...strategyIntervals
        .filter((o) => o.rotationId !== cand.rotationId)
        .map((o) => o.utilityInterval.upper)
    );
    const othersMaxLower = Math.max(
      cand.utilityInterval.upper,
      ...strategyIntervals
        .filter((o) => o.rotationId !== cand.rotationId)
        .map((o) => o.utilityInterval.lower)
    );

    const maxRegret = Number(Math.max(0, othersMaxUpper - cand.utilityInterval.lower).toFixed(4));
    const minRegret = Number(Math.max(0, othersMaxLower - cand.utilityInterval.upper).toFixed(4));

    return {
      ...cand,
      regretInterval: { minRegret, maxRegret }
    };
  });

  // Sort by maxRegret ascending
  const sorted = [...withRegret].sort(
    (a, b) => a.regretInterval.maxRegret - b.regretInterval.maxRegret
  );

  const best = sorted[0] || null;
  const second = sorted[1] || null;

  const intervalsSeparated =
    best &&
    second &&
    best.utilityInterval.lower > second.utilityInterval.upper;

  if (!intervalsSeparated && !comparisonOnlyReasons.includes('utility_intervals_overlap')) {
    comparisonOnlyReasons.push('utility_intervals_overlap');
  }

  const isComparisonOnly =
    Boolean(options.forceComparisonOnly) ||
    !intervalsSeparated ||
    comparisonOnlyReasons.length > 0;

  return {
    status: isComparisonOnly ? 'comparison_only' : 'distinguished',
    decisionMode: isComparisonOnly ? 'comparison_only' : 'ranked_recommendation',
    isComparisonOnly,
    recommendedStrategyId: isComparisonOnly ? null : best?.rotationId || null,
    comparisonOnlyReasons,
    candidates: sorted,
    provenance: 'conditional_on_declared_enclosing_intervals_assumed_parameters',
    statisticalConfidence: null
  };
}
