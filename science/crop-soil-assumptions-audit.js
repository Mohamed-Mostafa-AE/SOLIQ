/**
 * @file science/crop-soil-assumptions-audit.js
 * @description Enforces Requirement 5 across all SOLIQ crop and soil configurations:
 * Any literature-derived or uncalibrated crop parameter (`Kc`, rooting depth, depletion `p`,
 * `ECe` threshold/slope, `Ky`, reference yield/margin) or pilot soil/water parameter
 * (`theta_fc`, `theta_wp`, `theta_sat`, `CN`, `drainageDepthM`, `baselineSoilSalinityEcDsm`)
 * MUST be explicitly placed in state `ASSUMED` (`evidenceKind: 'assumed'`), never `VERIFIED` or `OBSERVED`,
 * unless accompanied by a cryptographic wet-lab / lysimeter field calibration receipt.
 */

export const ASSUMED_CALIBRATION_TAG = Object.freeze({
  evidenceStatus: 'ASSUMED',
  evidenceKind: 'assumed',
  calibrationStatus: 'ASSUMED_UNCALIBRATED_LITERATURE',
  isFieldCalibrated: false,
  canIssueCalibratedFieldAdvice: false
});

/**
 * Checks whether a calibration receipt object represents a genuine verified field/lab calibration.
 */
export function hasVerifiedFieldCalibrationReceipt(record = {}) {
  const receipt = record?.fieldCalibrationReceipt;
  if (!receipt || typeof receipt !== 'object') {
    return false;
  }
  return (
    receipt.verifiedByWetLab === true &&
    typeof receipt.rawSha256 === 'string' &&
    /^[a-f0-9]{64}$/i.test(receipt.rawSha256) &&
    typeof receipt.calibratedDate === 'string' &&
    typeof receipt.stationId === 'string'
  );
}

/**
 * Normalizes a single crop parameter record, forcing `evidenceStatus: 'ASSUMED'`
 * (`evidenceKind: 'assumed'`) when no verified field calibration receipt is present.
 * Throws if `strictRejectFakeVerified` is enabled and an uncalibrated crop claims `VERIFIED` or `OBSERVED`.
 */
export function normalizeCropParameterAssumptions(cropRecord = {}, options = {}) {
  const isCalibrated = hasVerifiedFieldCalibrationReceipt(cropRecord);
  const claimedStatus = String(cropRecord.evidenceStatus || cropRecord.calibrationStatus || '').toUpperCase();

  if (
    !isCalibrated &&
    options.strictRejectFakeVerified &&
    (claimedStatus === 'VERIFIED' || claimedStatus === 'OBSERVED' || claimedStatus === 'CALIBRATED')
  ) {
    throw new Error(
      `Uncalibrated crop "${cropRecord.cropId || 'unknown'}" cannot claim status "${claimedStatus}" without a verified fieldCalibrationReceipt`
    );
  }

  return Object.freeze({
    ...cropRecord,
    evidenceStatus: isCalibrated ? 'OBSERVED' : 'ASSUMED',
    evidenceKind: isCalibrated ? 'observed' : 'assumed',
    calibrationStatus: isCalibrated
      ? 'FIELD_CALIBRATED_WITH_RECEIPT'
      : 'ASSUMED_UNCALIBRATED_LITERATURE',
    isFieldCalibrated: isCalibrated,
    canIssueCalibratedFieldAdvice: isCalibrated,
    parameterProvenance: {
      kcCurve: isCalibrated ? 'OBSERVED' : 'ASSUMED',
      rootingDepthM: isCalibrated ? 'OBSERVED' : 'ASSUMED',
      depletionFractionP: isCalibrated ? 'OBSERVED' : 'ASSUMED',
      salinityToleranceFao29: isCalibrated ? 'OBSERVED' : 'ASSUMED',
      referenceYieldAndMargin: 'ASSUMED'
    }
  });
}

/**
 * Normalizes a pilot configuration (`zankalon`, `kafr-el-sheikh`, `west-minya`),
 * tagging `soil`, `waterManagement`, `currentBaselineRotation`, and top-level config
 * as `ASSUMED` (`evidenceKind: 'assumed'`) whenever uncalibrated.
 */
export function normalizePilotSoilAndWaterAssumptions(pilotConfig = {}, options = {}) {
  const isSoilCalibrated = hasVerifiedFieldCalibrationReceipt(pilotConfig.soil);
  const claimedTop = String(pilotConfig.evidenceStatus || pilotConfig.calibrationStatus || '').toUpperCase();
  const claimedSoil = String(pilotConfig.soil?.evidenceStatus || '').toUpperCase();

  if (
    !isSoilCalibrated &&
    options.strictRejectFakeVerified &&
    (claimedTop === 'VERIFIED' ||
      claimedTop === 'OBSERVED' ||
      claimedSoil === 'VERIFIED' ||
      claimedSoil === 'OBSERVED')
  ) {
    throw new Error(
      `Uncalibrated pilot "${pilotConfig.pilotId || 'unknown'}" cannot claim VERIFIED/OBSERVED status without a verified fieldCalibrationReceipt`
    );
  }

  return {
    ...pilotConfig,
    evidenceStatus: isSoilCalibrated ? 'OBSERVED' : 'ASSUMED',
    evidenceKind: isSoilCalibrated ? 'observed' : 'assumed',
    calibrationStatus: isSoilCalibrated
      ? 'FIELD_CALIBRATED_WITH_RECEIPT'
      : 'ASSUMED_UNCALIBRATED_LITERATURE',
    isFieldCalibrated: isSoilCalibrated,
    canIssueCalibratedFieldAdvice: isSoilCalibrated,
    soil: {
      ...(pilotConfig.soil || {}),
      evidenceStatus: isSoilCalibrated ? 'OBSERVED' : 'ASSUMED',
      evidenceKind: isSoilCalibrated ? 'observed' : 'assumed',
      calibrationStatus: isSoilCalibrated
        ? 'FIELD_CALIBRATED_WITH_RECEIPT'
        : 'ASSUMED_UNCALIBRATED_LITERATURE',
      isFieldCalibrated: isSoilCalibrated
    },
    waterManagement: {
      ...(pilotConfig.waterManagement || {}),
      evidenceStatus: 'ASSUMED',
      evidenceKind: 'assumed',
      calibrationStatus: 'ASSUMED_UNCALIBRATED_LITERATURE',
      isFieldCalibrated: false
    }
  };
}

/**
 * Audits an entire crop library and pilot config map to verify that zero uncalibrated
 * records are marked `VERIFIED` or `OBSERVED`.
 */
export function auditCropAndSoilAssumptions(cropLibrary = {}, pilotConfigs = []) {
  const violations = [];
  let auditedCropsCount = 0;
  let auditedPilotsCount = 0;

  for (const [cropId, crop] of Object.entries(cropLibrary)) {
    auditedCropsCount += 1;
    const isCalibrated = hasVerifiedFieldCalibrationReceipt(crop);
    if (!isCalibrated) {
      if (crop.evidenceStatus !== 'ASSUMED' || crop.evidenceKind !== 'assumed') {
        violations.push(`Crop "${cropId}" missing explicit evidenceStatus="ASSUMED" / evidenceKind="assumed"`);
      }
      if (crop.isFieldCalibrated !== false) {
        violations.push(`Crop "${cropId}" must set isFieldCalibrated=false`);
      }
    }
  }

  for (const pilot of pilotConfigs) {
    auditedPilotsCount += 1;
    const isSoilCalibrated = hasVerifiedFieldCalibrationReceipt(pilot?.soil);
    if (!isSoilCalibrated) {
      if (pilot?.evidenceStatus !== 'ASSUMED' || pilot?.soil?.evidenceStatus !== 'ASSUMED') {
        violations.push(
          `Pilot "${pilot?.pilotId || 'unknown'}" or its soil block missing explicit evidenceStatus="ASSUMED"`
        );
      }
      if (pilot?.isFieldCalibrated !== false || pilot?.soil?.isFieldCalibrated !== false) {
        violations.push(
          `Pilot "${pilot?.pilotId || 'unknown'}" must set isFieldCalibrated=false on uncalibrated soil`
        );
      }
    }
  }

  return Object.freeze({
    passed: violations.length === 0,
    auditedCropsCount,
    auditedPilotsCount,
    violations
  });
}
