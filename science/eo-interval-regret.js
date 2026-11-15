/**
 * @file science/interval-regret.js
 * @description Interval Regret & Documented Uncertainty Propagation Engine for SOLIQ.
 *
 * Implements minimax interval regret analysis (`maxRegret`, `minRegret`, `utilityInterval [L_i, U_i]`)
 * across multi-season crop rotation strategies using documented physical & observational uncertainty bounds:
 * - Reference Evapotranspiration (`ET0`) uncertainty: ±10% (Allen et al., 1998, FAO-56)
 * - Crop Coefficient (`Kc`) stage estimation uncertainty: ±8% (FAO-56 Table 12 / Dual-Kc)
 * - GPM IMERG V07 daily satellite precipitation uncertainty: `randomError` variable or ±18% (Huffman et al., 2023)
 * - HLS v2.0 surface reflectance & NDVI uncertainty: ±0.04 NDVI units (LP DAAC HLS V2.0 User Guide)
 * - Soil hydraulic storage (`TAW` / `Theta_FC - Theta_WP`) spatial variability: ±12% (Abd El Baki et al., 2021)
 *
 * Decision Mode Policy (Requirement #7):
 * - When all required Earth observation streams meet minimum coverage & quality thresholds AND interval
 *   regret identifies a dominating or low-regret strategy, `decisionMode` is `'actionable_advisory'`
 *   (still requiring local human agronomic verification).
 * - Whenever any critical dataset (`NASA POWER`, `GPM IMERG V07`, or `HLS v2.0`) has insufficient
 *   temporal/spatial coverage, missing authentication (`auth_required`), or wide overlapping uncertainty
 *   intervals that prevent reliable ranking, `decisionMode` is strictly downgraded to `'comparison_only'`.
 * - Never claims independent field-level agronomic calibration without human verification.
 */

export const DEFAULT_UNCERTAINTY_BOUNDS = Object.freeze({
  et0RelativeUncertainty: 0.10,
  kcRelativeUncertainty: 0.08,
  imergPrecipRelativeUncertainty: 0.18,
  hlsNdviAbsoluteUncertainty: 0.04,
  soilAvailableWaterRelativeUncertainty: 0.12,
  minMetCoverageRatio: 0.85,
  minImergCoverageRatio: 0.80,
  minHlsClearSceneRatio: 0.35
});

/**
 * Propagates documented physical & satellite observational uncertainties into lower and upper
 * bounds `[lower, upper]` for seasonal water demand, net nitrogen balance, salinity, and composite utility.
 *
 * Using first-order root-sum-square (RSS) error propagation for independent components and
 * worst-case interval widening when data coverage is degraded:
 * - Combined ETc relative uncertainty:
 *     `sigma_ETc = sqrt(sigma_ET0^2 + sigma_Kc^2 + (1.2 * sigma_NDVI)^2)`
 * - Combined Root-Zone Water Deficit uncertainty:
 *     `sigma_Water = sqrt(sigma_ETc^2 + (0.5 * sigma_Soil)^2 + (0.25 * sigma_IMERG)^2)`
 *
 * @param {Object} simResult - Output of `simulateMultiSeasonRotation`
 * @param {Object} [boundsConfig=DEFAULT_UNCERTAINTY_BOUNDS]
 * @param {Object} [coverageDiagnostics={}] - Coverage metrics from POWER, IMERG, and HLS
 * @param {Object} [pilotConfig={}]
 * @returns {Object} Interval metrics and composite utility interval `[utilityLower, utilityUpper]`
 */
export function computeStrategyUncertaintyIntervals(
  simResult,
  boundsConfig = DEFAULT_UNCERTAINTY_BOUNDS,
  coverageDiagnostics = {},
  pilotConfig = {}
) {
  const bounds = { ...DEFAULT_UNCERTAINTY_BOUNDS, ...boundsConfig };

  const metCov = coverageDiagnostics.metCoverageRatio ?? simResult.overallForcingCoverageRatio ?? 1.0;
  const imergCov = coverageDiagnostics.imergCoverageRatio ?? 1.0;
  const hlsCov = coverageDiagnostics.hlsClearSceneRatio ?? 0.5;

  // Coverage penalty inflation factor (widens uncertainty interval when satellite coverage drops)
  const coverageInflation =
    1.0 +
    Math.max(0, bounds.minMetCoverageRatio - metCov) * 1.5 +
    Math.max(0, bounds.minImergCoverageRatio - imergCov) * 1.2 +
    Math.max(0, bounds.minHlsClearSceneRatio - hlsCov) * 1.0;

  const sigmaEtcRel =
    Math.sqrt(
      Math.pow(bounds.et0RelativeUncertainty, 2) +
        Math.pow(bounds.kcRelativeUncertainty, 2) +
        Math.pow(bounds.hlsNdviAbsoluteUncertainty * 1.2, 2)
    ) * coverageInflation;

  const sigmaGrossIrrigRel =
    Math.sqrt(
      Math.pow(sigmaEtcRel, 2) +
        Math.pow(bounds.soilAvailableWaterRelativeUncertainty * 0.6, 2) +
        Math.pow(bounds.imergPrecipRelativeUncertainty * 0.25, 2)
    );

  const nominalGrossIrrigMm = simResult.aggregateTotalsMm.grossIrrigation;
  const grossIrrigLowerMm = Number(
    Math.max(0, nominalGrossIrrigMm * (1 - sigmaGrossIrrigRel)).toFixed(2)
  );
  const grossIrrigUpperMm = Number(
    (nominalGrossIrrigMm * (1 + sigmaGrossIrrigRel)).toFixed(2)
  );

  const nominalEtcActMm = simResult.aggregateTotalsMm.etcActual;
  const etcActLowerMm = Number(Math.max(0, nominalEtcActMm * (1 - sigmaEtcRel)).toFixed(2));
  const etcActUpperMm = Number((nominalEtcActMm * (1 + sigmaEtcRel)).toFixed(2));

  const nominalMarginUsdHa = simResult.totalGrossMarginUsdHa;
  const marginRelUncertainty = Math.min(0.45, sigmaGrossIrrigRel * 1.15);
  const grossMarginLowerUsdHa = Number(
    Math.max(0, nominalMarginUsdHa * (1 - marginRelUncertainty)).toFixed(2)
  );
  const grossMarginUpperUsdHa = Number(
    (nominalMarginUsdHa * (1 + marginRelUncertainty)).toFixed(2)
  );

  const nominalSalinityDsm = simResult.finalCarryOverState.endingSalinityEcDsm;
  const salinityUncertaintyDsm = Number((0.25 * coverageInflation).toFixed(3));
  const salinityLowerDsm = Number(
    Math.max(0.5, nominalSalinityDsm - salinityUncertaintyDsm).toFixed(3)
  );
  const salinityUpperDsm = Number((nominalSalinityDsm + salinityUncertaintyDsm).toFixed(3));

  // Multi-objective Agronomic Utility Score (0..100 scale):
  // Rewards: Water savings vs quota, Economic gross margin, Positive nitrogen carry-over, Pest break, Low salinity
  const waterQuotaMm = pilotConfig?.constraints?.maxAnnualWaterUseMm ?? 1350;
  const maxSalinityDsm = pilotConfig?.constraints?.maxAllowableSoilSalinityEcDsm ?? 4.0;
  const nBalance = simResult.finalCarryOverState.endingNitrogenBalanceKgHa;
  const pestBonus = simResult.pestManagementSummary.interruptsPestCycles ? 8.0 : -6.0;
  const nScore = Math.max(-15, Math.min(15, nBalance * 0.1));

  // Lower utility bound occurs under high water use (grossIrrigUpperMm), low gross margin, and high salinity
  const waterScoreLower = Math.max(
    -25,
    Math.min(40, ((waterQuotaMm - grossIrrigUpperMm) / waterQuotaMm) * 45 + 15)
  );
  const waterScoreUpper = Math.max(
    -25,
    Math.min(40, ((waterQuotaMm - grossIrrigLowerMm) / waterQuotaMm) * 45 + 15)
  );

  const econScoreLower = Math.min(40, (grossMarginLowerUsdHa / 3500) * 35);
  const econScoreUpper = Math.min(40, (grossMarginUpperUsdHa / 3500) * 35);

  const salinityPenaltyUpper =
    salinityUpperDsm > maxSalinityDsm ? (salinityUpperDsm - maxSalinityDsm) * 8.0 : 0.0;
  const salinityPenaltyLower =
    salinityLowerDsm > maxSalinityDsm ? (salinityLowerDsm - maxSalinityDsm) * 8.0 : 0.0;

  const utilityLower = Number(
    (waterScoreLower + econScoreLower + nScore + pestBonus - salinityPenaltyUpper).toFixed(3)
  );
  const utilityUpper = Number(
    (waterScoreUpper + econScoreUpper + nScore + pestBonus - salinityPenaltyLower).toFixed(3)
  );
  const utilityMidpoint = Number((0.5 * (utilityLower + utilityUpper)).toFixed(3));

  return {
    rotationId: simResult.rotationId,
    name: simResult.name,
    nameAr: simResult.nameAr,
    uncertaintyFactors: {
      sigmaEtcRelative: Number(sigmaEtcRel.toFixed(4)),
      sigmaGrossIrrigRelative: Number(sigmaGrossIrrigRel.toFixed(4)),
      coverageInflationFactor: Number(coverageInflation.toFixed(4))
    },
    intervals: {
      grossIrrigationMm: [grossIrrigLowerMm, grossIrrigUpperMm],
      etcActualMm: [etcActLowerMm, etcActUpperMm],
      grossMarginUsdHa: [grossMarginLowerUsdHa, grossMarginUpperUsdHa],
      endingSalinityEcDsm: [salinityLowerDsm, salinityUpperDsm],
      utilityScore: [
        Math.min(utilityLower, utilityUpper),
        Math.max(utilityLower, utilityUpper)
      ]
    },
    utilityLower: Math.min(utilityLower, utilityUpper),
    utilityUpper: Math.max(utilityLower, utilityUpper),
    utilityMidpoint
  };
}

/**
 * Computes Minimax Interval Regret across candidate strategies and determines whether
 * the output is `'comparison_only'` or `'actionable_advisory'`.
 *
 * Interval Regret Definition (Savage / Minimax Interval Regret):
 * For candidate strategy `i` with utility interval `[L_i, U_i]`, the maximum possible regret
 * incurred by choosing `i` instead of the best alternative `j != i` is:
 *   `maxRegret(i) = max(0, max_{j != i} (U_j - L_i))`
 * And the minimum guaranteed regret is:
 *   `minRegret(i) = max(0, max_{j != i} (L_j - U_i))`
 *
 * @param {Object} params
 * @param {Array<Object>} params.simulatedRotations - Array of `simulateMultiSeasonRotation` outputs
 * @param {Object} [params.uncertaintyBounds=DEFAULT_UNCERTAINTY_BOUNDS]
 * @param {Object} [params.coverageDiagnostics={}]
 * @param {Object} [params.pilotConfig={}]
 * @returns {Object} Full interval regret ranking, decision status (`comparison_only` vs `actionable_advisory`), and uncertainty audit
 */
export function evaluateIntervalRegret(params = {}) {
  const {
    simulatedRotations = [],
    uncertaintyBounds = DEFAULT_UNCERTAINTY_BOUNDS,
    coverageDiagnostics = {},
    pilotConfig = {}
  } = params;

  if (!Array.isArray(simulatedRotations) || simulatedRotations.length === 0) {
    return {
      status: 'comparison_only',
      decisionMode: 'comparison_only',
      comparisonOnlyReasons: ['no_simulated_rotations_provided'],
      calibrationDisclaimer:
        'Literature-parameterized model; requires local agronomic human verification before field execution.',
      strategies: [],
      recommendedStrategyId: null
    };
  }

  const bounds = {
    ...DEFAULT_UNCERTAINTY_BOUNDS,
    ...(pilotConfig.UncertaintyBoundsConfig || {}),
    ...uncertaintyBounds
  };

  const metCov = coverageDiagnostics.metCoverageRatio ?? 0;
  const imergCov = coverageDiagnostics.imergCoverageRatio ?? 0;
  const hlsCov = coverageDiagnostics.hlsClearSceneRatio ?? 0;
  const hasAuthOrNetworkBlocker = Boolean(coverageDiagnostics.hasAuthOrNetworkBlocker);

  const comparisonOnlyReasons = [];

  if (hasAuthOrNetworkBlocker) {
    comparisonOnlyReasons.push('satellite_auth_or_network_unavailable');
  }
  if (metCov < bounds.minMetCoverageRatio) {
    comparisonOnlyReasons.push(
      `insufficient_nasa_power_coverage:${metCov.toFixed(2)}_lt_${bounds.minMetCoverageRatio}`
    );
  }
  if (imergCov < bounds.minImergCoverageRatio) {
    comparisonOnlyReasons.push(
      `insufficient_gpm_imerg_v07_coverage:${imergCov.toFixed(2)}_lt_${bounds.minImergCoverageRatio}`
    );
  }
  if (hlsCov < bounds.minHlsClearSceneRatio) {
    comparisonOnlyReasons.push(
      `insufficient_hls_optical_clear_coverage:${hlsCov.toFixed(2)}_lt_${bounds.minHlsClearSceneRatio}`
    );
  }

  const strategyIntervals = simulatedRotations.map((sim) =>
    computeStrategyUncertaintyIntervals(sim, bounds, coverageDiagnostics, pilotConfig)
  );

  // Compute minimax interval regret for each strategy i against all j != i
  const evaluatedStrategies = strategyIntervals.map((item, idx) => {
    let worstAlternativeUpper = -Infinity;
    let bestAlternativeLower = -Infinity;

    for (let j = 0; j < strategyIntervals.length; j += 1) {
      if (j === idx) continue;
      if (strategyIntervals[j].utilityUpper > worstAlternativeUpper) {
        worstAlternativeUpper = strategyIntervals[j].utilityUpper;
      }
      if (strategyIntervals[j].utilityLower > bestAlternativeLower) {
        bestAlternativeLower = strategyIntervals[j].utilityLower;
      }
    }

    const maxRegret =
      worstAlternativeUpper === -Infinity
        ? 0
        : Number(Math.max(0, worstAlternativeUpper - item.utilityLower).toFixed(3));
    const minRegret =
      bestAlternativeLower === -Infinity
        ? 0
        : Number(Math.max(0, bestAlternativeLower - item.utilityUpper).toFixed(3));

    return {
      ...item,
      maxRegret,
      minRegret,
      strictlyDominated: minRegret > 0
    };
  });

  // Sort strategies by lowest maxRegret (minimax regret criterion), breaking ties by highest utilityMidpoint
  const rankedStrategies = [...evaluatedStrategies].sort((a, b) => {
    if (Math.abs(a.maxRegret - b.maxRegret) > 1e-6) {
      return a.maxRegret - b.maxRegret;
    }
    return b.utilityMidpoint - a.utilityMidpoint;
  });

  // Check if uncertainty intervals between #1 and #2 overlap so heavily that no clear separation exists
  if (rankedStrategies.length >= 2) {
    const first = rankedStrategies[0];
    const second = rankedStrategies[1];
    const intervalWidth = first.utilityUpper - first.utilityLower;
    const midpointSeparation = Math.abs(first.utilityMidpoint - second.utilityMidpoint);
    if (midpointSeparation < 0.15 * intervalWidth) {
      comparisonOnlyReasons.push('high_uncertainty_interval_overlap_between_top_strategies');
    }
  }

  const isComparisonOnly = comparisonOnlyReasons.length > 0;
  const decisionMode = isComparisonOnly ? 'comparison_only' : 'actionable_advisory';

  return {
    status: decisionMode,
    decisionMode,
    isComparisonOnly,
    comparisonOnlyReasons,
    documentedUncertaintyBounds: bounds,
    calibrationDisclaimer:
      'All model parameters are literature-derived (FAO-56, Ayyad et al. 2024, Abd El Baki et al. 2021). Outputs do not claim independent field-level agronomic calibration and require human agronomic verification.',
    recommendedStrategyId: isComparisonOnly
      ? null
      : rankedStrategies[0]?.rotationId || null,
    bestMinimaxCandidateId: rankedStrategies[0]?.rotationId || null,
    strategies: rankedStrategies
  };
}
