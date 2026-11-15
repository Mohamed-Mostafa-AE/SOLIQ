/** Reviewed proposal code: pure parsers only; NOT NASA raster download or independently verified source. */
#!/usr/bin/env node
/**
 * SOLIQ (FieldShift) — Tested Earth-Observation Adapters, Agronomy Water Bucket,
 * Interval-Regret Comparators (B1/B2/B3) & Seventh Field Game Evidence Contracts
 *
 * Addresses GitHub Issues #5 & #6 and coordinates with Codex dev-server.mjs API routes.
 * Run self-test:
 *   node soliq_eo_science_adapters.mjs
 * Prepare & push PR branch on local clone:
 *   node soliq_eo_science_adapters.mjs --prepare-pr
 */

import crypto from 'node:crypto';
import assert from 'node:assert/strict';

// ============================================================================
// 1. REPRODUCIBLE PROVENANCE MANIFEST BUILDER (SHA-256 + Native Support)
// ============================================================================
export function createEvidenceManifestRecord({
  source_id,
  product,
  product_version,
  temporal_window,
  time_standard = 'UTC',
  spatial_support,
  units,
  delivery_state, // 'LIVE' | 'CACHED' | 'UNAVAILABLE'
  evidence_kind,  // 'OBSERVED' | 'DERIVED' | 'ASSUMED' | 'SIMULATED'
  qa_summary,
  raw_payload,
  license = 'NASA Open Data / Public Domain',
  limitations = []
}) {
  if (!['LIVE', 'CACHED', 'UNAVAILABLE'].includes(delivery_state)) {
    throw new Error(`Invalid delivery_state: ${delivery_state}`);
  }
  if (!['OBSERVED', 'DERIVED', 'ASSUMED', 'SIMULATED'].includes(evidence_kind)) {
    throw new Error(`Invalid evidence_kind: ${evidence_kind}`);
  }
  const canonicalBytes = raw_payload === undefined || raw_payload === null ? null
    : (Buffer.isBuffer(raw_payload) || raw_payload instanceof Uint8Array ? raw_payload : (typeof raw_payload === 'string' ? raw_payload : JSON.stringify(raw_payload)));
  if (delivery_state === 'LIVE' && (raw_payload === undefined || raw_payload === null)) throw new Error('LIVE evidence requires raw source bytes');
  const raw_sha256 = canonicalBytes !== null
    ? crypto.createHash('sha256').update(canonicalBytes).digest('hex')
    : null;

  return {
    manifest_schema: 'SOLIQ_EO_MANIFEST_V1.0',
    source_id,
    product,
    product_version,
    temporal_window,
    time_standard,
    spatial_support,
    units,
    delivery_state,
    evidence_kind,
    qa_summary,
    raw_sha256,
    retrieved_at_utc: new Date().toISOString(),
    license,
    limitations
  };
}

// ============================================================================
// 2. PATHWAY 1: NASA POWER ADAPTER & TIE-CORRECTED MANN-KENDALL (Manuscript III/IV)
// ============================================================================
export function parseNasaPowerDailyResponse(rawJson, { variable = 'T2M_MAX', fillValue = -999 } = {}) {
  const paramBlock = rawJson?.properties?.parameter?.[variable];
  if (!paramBlock || typeof paramBlock !== 'object') {
    return {
      status: 'UNAVAILABLE',
      reason: `Missing parameter ${variable} in NASA POWER response`,
      series: [],
      null_count: 0
    };
  }
  const headerVersion = rawJson?.header?.api?.version || null;
  const timeStandard = rawJson?.header?.time_standard ?? null;
  if (timeStandard !== 'UTC') return { status: 'UNAVAILABLE', reason: 'UTC source time standard not confirmed', series: [], null_count: 0 };
  const entries = Object.entries(paramBlock).sort(([a], [b]) => a.localeCompare(b));

  const series = [];
  let nullCount = 0;
  for (const [dateKey, rawVal] of entries) {
    const num = rawVal === null || rawVal === undefined || rawVal === '' ? NaN : Number(rawVal);
    // Missing values stay null, NEVER coerced to zero
    if (!/^\d{8}$/.test(dateKey) || !Number.isFinite(num) || num === fillValue || num === -999 || num === -99) {
      series.push({ date: dateKey, value: null, qa: 'MISSING_FILL_VALUE' });
      nullCount++;
    } else {
      series.push({ date: dateKey, value: num, qa: 'VALID' });
    }
  }

  return {
    status: series.length > nullCount ? 'PARSED_SOURCE_UNVERIFIED' : 'ALL_MISSING',
    product: 'NASA_POWER_AG_DAILY',
    product_version: headerVersion,
    time_standard: timeStandard,
    spatial_support: '0.5 deg x 0.625 deg gridded meteorology (regional context, not field gauge)',
    variable_label: variable === 'T2M_MAX'
      ? 'Daily Maximum Air Temperature at 2m (°C)'
      : variable,
    total_days: series.length,
    valid_days: series.length - nullCount,
    null_days: nullCount,
    series
  };
}

function erfApprox(x) {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}

export function computeTieCorrectedMannKendall(annualRecords, valueKey = 'T2M_MAX_ann') {
  // Reject null/missing years and never label partial years complete
  if (!Array.isArray(annualRecords)) throw new Error('Annual records must be an array');
  const clean = annualRecords.filter(r =>
    r && Number.isFinite(r.year) && r[valueKey] !== null && Number.isFinite(r[valueKey]) && r.complete_year !== false
  );
  const n = clean.length;
  if (n < 8) {
    return { status: 'INSUFFICIENT_COVERAGE', n, reason: 'At least 8 complete annual records required' };
  }
  clean.sort((a,b)=>a.year-b.year);
  if (clean.some(r => !Number.isInteger(r.year)) || new Set(clean.map(r=>r.year)).size !== clean.length) throw new Error('Annual trend requires unique integer years');
  const x = clean.map(r => r[valueKey]);
  const t = clean.map(r => r.year);

  let S = 0;
  const slopes = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (x[j] > x[i]) S += 1;
      else if (x[j] < x[i]) S -= 1;
      if (t[j] !== t[i]) {
        slopes.push(((x[j] - x[i]) / (t[j] - t[i])) * 10.0); // per decade
      }
    }
  }

  // Tie correction on variance
  const freq = new Map();
  for (const val of x) {
    const key = Number(val.toFixed(6));
    freq.set(key, (freq.get(key) || 0) + 1);
  }
  let tieSum = 0;
  for (const k of freq.values()) {
    if (k > 1) tieSum += k * (k - 1) * (2 * k + 5);
  }
  const variance = (n * (n - 1) * (2 * n + 5) - tieSum) / 18.0;
  const Z = variance > 0
    ? (S > 0 ? (S - 1) / Math.sqrt(variance) : (S < 0 ? (S + 1) / Math.sqrt(variance) : 0))
    : 0;
  const p_two_sided = 1 - erfApprox(Math.abs(Z) / Math.SQRT2);

  // True median for both odd and even slope counts
  slopes.sort((a, b) => a - b);
  const mid = Math.floor(slopes.length / 2);
  const sen_per_decade = slopes.length % 2 === 1
    ? slopes[mid]
    : (slopes[mid - 1] + slopes[mid]) / 2.0;

  return {
    status: 'COMPUTED',
    n,
    S,
    Z: Number(Z.toFixed(6)),
    p_two_sided: Number(p_two_sided.toFixed(6)),
    sen_per_decade: Number(sen_per_decade.toFixed(6)),
    unique_values: freq.size,
    serial_correlation_note: 'Original two-sided tie-corrected Mann-Kendall without prewhitening; serial correlation can inflate significance.'
  };
}

// ============================================================================
// 3. PATHWAY 2: GPM IMERG V07 FINAL PRECIPITATION ADAPTER & QA
// ============================================================================
export function validateImergPrecipitationSubset(records, { productVersion = 'V07B_FINAL', sourceUnits = null, sourceVerified = false } = {}) {
  if (!Array.isArray(records) || records.length === 0) {
    return { status: 'UNAVAILABLE', reason: 'Empty IMERG subset' };
  }
  if(sourceUnits !== 'mm/day') return {status:'UNAVAILABLE',reason:'IMERG source units missing or incompatible'};
  const validated = [];
  let missingCount = 0;
  for (const rec of records) {
    const p = rec.precipitationCal;
    const qi = rec.precipitationQualityIndex;
    if (p === null || p === undefined || !Number.isFinite(p) || p < 0 || (qi !== undefined && qi < 0.2)) {
      validated.push({ date: rec.date, P_mm: null, qa: 'FLAGGED_OR_MISSING' });
      missingCount++;
    } else {
      validated.push({ date: rec.date, P_mm: Number(p.toFixed(3)), qa: 'VALID_GAUGE_ADJUSTED' });
    }
  }
  return {
    status: validated.length > missingCount ? (sourceVerified?'PARSED_VERIFIED_SOURCE':'PARSED_SOURCE_UNVERIFIED') : 'UNUSABLE_PRECIP_SUBSET',
    product: 'GPM_3IMERGDF',
    product_version: productVersion,
    spatial_support: '0.1 deg (~10 km) grid; not a field rain gauge',
    latency_note: 'IMERG Final has ~3.5 month post-observation latency; historical analysis only, not real-time forecast',
    units: 'mm/day (UTC window)',
    total_days: validated.length,
    valid_days: validated.length - missingCount,
    missing_days: missingCount,
    series: validated
  };
}

// ============================================================================
// 4. PATHWAY 3: LANDSAT C2 L2 / NASA HLS v2.0 SURFACE REFLECTANCE & CLOUD QA
// ============================================================================
export function screenOpticalReflectanceObservation({
  sensor = 'LANDSAT_C2_L2', // 'LANDSAT_C2_L2' | 'HLS_V2'
  red_raw,
  nir_raw,
  is_scaled = false,
  qa_pixel_cloud,
  qa_pixel_shadow,
  qa_pixel_dilated_cloud,
  qa_radsat
}) {
  if (!['LANDSAT_C2_L2','HLS_V2'].includes(sensor)) return { usable:false, ndvi:null, screening_label:'UNSUPPORTED_SENSOR' };
  if ([qa_pixel_cloud,qa_pixel_shadow,qa_pixel_dilated_cloud,qa_radsat].some(v=>typeof v!=='boolean')) return { usable:false, ndvi:null, screening_label:'QA_NOT_SUPPLIED' };
  if (qa_pixel_cloud || qa_pixel_shadow || qa_pixel_dilated_cloud || qa_radsat) {
    return {
      usable: false,
      ndvi: null,
      screening_label: 'EXCLUDED_CLOUD_OR_SATURATION',
      reason: 'Pixel masked by cloud, cloud shadow, dilated cloud, or radiometric saturation'
    };
  }
  if (red_raw === null || nir_raw === null || !Number.isFinite(red_raw) || !Number.isFinite(nir_raw)) {
    return {
      usable: false,
      ndvi: null,
      screening_label: 'MISSING_REFLECTANCE',
      reason: 'Missing band value preserved as null'
    };
  }
  // Apply official Landsat Collection 2 Level-2 scale & additive offset if integer DN supplied
  const rho_red = is_scaled
    ? red_raw
    : (sensor === 'LANDSAT_C2_L2' ? red_raw * 0.0000275 - 0.2 : red_raw * 0.0001);
  const rho_nir = is_scaled
    ? nir_raw
    : (sensor === 'LANDSAT_C2_L2' ? nir_raw * 0.0000275 - 0.2 : nir_raw * 0.0001);

  if (rho_red <= 0 || rho_nir <= 0 || rho_red > 1.0 || rho_nir > 1.0) {
    return {
      usable: false,
      ndvi: null,
      screening_label: 'OUT_OF_RANGE_REFLECTANCE',
      reason: `Transformed surface reflectance outside (0, 1]: red=${rho_red.toFixed(4)}, nir=${rho_nir.toFixed(4)}`
    };
  }
  const denom = rho_nir + rho_red;
  if (Math.abs(denom) < 1e-6) {
    return {
      usable: false,
      ndvi: null,
      screening_label: 'NEAR_ZERO_DENOMINATOR',
      reason: 'NDVI denominator near zero'
    };
  }
  const ndvi = Number(((rho_nir - rho_red) / denom).toFixed(4));
  return {
    usable: true,
    sensor,
    spatial_support: '30 m pixel reflectance (mixed pixel risk on <0.5 feddan holdings)',
    rho_red: Number(rho_red.toFixed(4)),
    rho_nir: Number(rho_nir.toFixed(4)),
    ndvi,
    screening_label: ndvi < 0.22
      ? 'LOW_GREENNESS_CANDIDATE_SCREENING_ONLY'
      : 'ACTIVE_CANOPY_SCREENING',
    scientific_boundary: 'Low NDVI is candidate low-cover screening only; does NOT confirm bare soil, crop species, residue absence, or soil organic carbon change.'
  };
}

// ============================================================================
// 5. PATHWAY 4: NISAR / SENTINEL-1 SAR SCENE-PAIR & EXPLICIT UNAVAILABILITY
// ============================================================================
export function evaluateSarScenePairOrUnavailability(sceneRef, sceneSec) {
  if (!sceneRef || !sceneSec) {
    return {
      usable: false,
      status: 'DOCUMENTED_UNAVAILABILITY',
      reason: 'No validated and co-registered SAR pair was supplied',
      blocked_claims: [
        'Cannot claim measured field soil moisture or salinity from radar catalog metadata',
        'Cannot interchange L-band NISAR (24 cm) with C-band Sentinel-1 (5.6 cm)'
      ]
    };
  }
  const errors = [];
  const mandatory=['band','pass_direction','polarization','incidence_deg','product','scene_id'];
  for (const key of mandatory) {
    if(sceneRef[key]===undefined || sceneSec[key]===undefined || sceneRef[key]===null || sceneSec[key]===null) errors.push('Missing required SAR metadata: '+key);
  }
  if (sceneRef.partial_file || sceneSec.partial_file) {
    errors.push('Quarantined partial HDF5 download cannot be ingested as valid SAR observations');
  }
  if (sceneRef.band !== sceneSec.band) {
    errors.push(`Wavelength band mismatch (${sceneRef.band} vs ${sceneSec.band})`);
  }
  if (sceneRef.pass_direction !== sceneSec.pass_direction) {
    errors.push(`Orbit pass direction mismatch (${sceneRef.pass_direction} vs ${sceneSec.pass_direction})`);
  }
  if (sceneRef.polarization !== sceneSec.polarization) {
    errors.push(`Polarization mismatch (${sceneRef.polarization} vs ${sceneSec.polarization})`);
  }
  if (Number.isFinite(sceneRef.incidence_deg) && Number.isFinite(sceneSec.incidence_deg) && Math.abs(sceneRef.incidence_deg - sceneSec.incidence_deg) > 1.5) {
    errors.push('Incidence angle difference > 1.5 deg');
  }
  if (errors.length > 0) {
    return {
      usable: false,
      status: 'REJECTED_INCOMPATIBLE_PAIR',
      errors,
      blocked_claims: ['Incompatible SAR pair rejected before backscatter differencing']
    };
  }
  return {
    usable: true,
    status: 'METADATA_COMPATIBLE_PIXELS_UNVERIFIED',
    band: sceneRef.band,
    pass_direction: sceneRef.pass_direction,
    polarization: sceneRef.polarization
  };
}

// ============================================================================
// 6. PATHWAY 5: DAILY WATER BUCKET (Manuscript Eq. 4–8) & MASS CONSERVATION
// ============================================================================
export function runDailyWaterBalanceBucket({
  S_init_mm,
  S_max_mm,
  daily_forcings // [{ day, P_mm, Q_mm, I_eff_mm, ET0_mm, Kcb, Ke, Ks }]
}) {
  if (!(S_max_mm > 0) || !(S_init_mm >= 0 && S_init_mm <= S_max_mm)) {
    throw new Error('Invalid soil bucket capacity S_max_mm or initial storage S_init_mm');
  }
  let S_t = S_init_mm;
  const trajectory = [];
  let maxAbsResidual = 0;

  if(!Array.isArray(daily_forcings)||daily_forcings.length===0) throw new Error('Daily forcings required');
  for (const step of daily_forcings) {
    const P=step?.P_mm, Q=step?.Q_mm, I_eff=step?.I_eff_mm, ET0=step?.ET0_mm;
    const Kcb=step?.Kcb, Ke=step?.Ke, Ks=step?.Ks;
    if (![P,Q,I_eff,ET0,Kcb,Ke,Ks].every(v=>Number.isFinite(v))) throw new Error('Missing daily flux or crop coefficient — comparison_only');
    if(Ks<0||Ks>1||Ke<0||Kcb<0) throw new Error('Invalid crop or stress coefficient');

    if (Q < 0 || Q > P + 1e-9 || P < 0 || I_eff < 0 || ET0 < 0) {
      throw new Error(`Invalid flux on day ${step.day}: fluxes must be nonnegative and 0 <= Q <= P`);
    }

    // Manuscript Eq. 4-8 (Drainage-first order)
    const A_t = S_t + P - Q + I_eff;
    const L_t = Math.max(0, A_t - S_max_mm);
    const ET_star = (Ks * Kcb + Ke) * ET0;
    const ET_t = Math.min(ET_star, A_t - L_t);
    const S_next = A_t - L_t - ET_t;

    // Mass balance closure check: dS - (P - Q + I_eff - L_t - ET_t) == 0
    const dS = S_next - S_t;
    const netFlux = P - Q + I_eff - L_t - ET_t;
    const residual = Math.abs(dS - netFlux);
    if (residual > maxAbsResidual) maxAbsResidual = residual;

    trajectory.push({
      day: step.day,
      S_start_mm: Number(S_t.toFixed(6)),
      A_t_mm: Number(A_t.toFixed(6)),
      L_t_mm: Number(L_t.toFixed(6)),
      ET_star_mm: Number(ET_star.toFixed(6)),
      ET_t_mm: Number(ET_t.toFixed(6)),
      S_end_mm: Number(S_next.toFixed(6)),
      residual_mm: residual
    });

    S_t = S_next;
  }

  return {
    model_domain: 'NON_FLOODED_FIXED_DEPTH_BUCKET',
    omitted_processes: ['capillary_rise_C', 'lateral_subsurface_flow', 'perched_water_table', 'salinity_osmotic_feedback'],
    S_init_mm,
    S_final_mm: Number(S_t.toFixed(6)),
    max_abs_closure_residual_mm: maxAbsResidual,
    conservation_passed: maxAbsResidual <= 1e-6,
    trajectory
  };
}

// ============================================================================
// 7. PATHWAY 6: INTERVAL-REGRET COMPARATORS B1, B2, B3 (Manuscript Eq. 10–19)
// ============================================================================
export function evaluateIntervalRegretComparators({
  utilityMatrix, // { R0: [u_s1, u_s2...], R1: [...], R2: [...] }
  halfWidth_h = 0.008,
  tolerance_delta = 0.010,
  missingCriticalInput = false
}) {
  if(!utilityMatrix || typeof utilityMatrix!=='object' || Array.isArray(utilityMatrix)) throw new Error('Invalid utility matrix');
  if(!Number.isFinite(halfWidth_h)||halfWidth_h<0||!Number.isFinite(tolerance_delta)||tolerance_delta<0) throw new Error('Invalid interval width/tolerance');
  const candidates = Object.keys(utilityMatrix);
  if (candidates.length === 0) {
    return { mode: 'NO_ELIGIBLE_CANDIDATES', preferred: null };
  }

  const numScenarios = utilityMatrix[candidates[0]]?.length;
  if(!Number.isInteger(numScenarios)||numScenarios<1||candidates.some(r=> !Array.isArray(utilityMatrix[r])||utilityMatrix[r].length!==numScenarios||utilityMatrix[r].some(v=>!Number.isFinite(v)||v<0||v>1)))throw Error('Invalid scenario values/shape');
  const pointMaxRegret = {};
  const lowerMaxRegret = {};
  const upperMaxRegret = {};

  for (const r of candidates) {
    let maxReg = 0;
    for (let s = 0; s < numScenarios; s++) {
      let bestOther = -Infinity;
      for (const j of candidates) {
        if (j !== r && utilityMatrix[j][s] > bestOther) {
          bestOther = utilityMatrix[j][s];
        }
      }
      const reg_rs = Math.max(0, bestOther - utilityMatrix[r][s]);
      if (reg_rs > maxReg) maxReg = reg_rs;
    }
    pointMaxRegret[r] = Number(maxReg.toFixed(6));
    lowerMaxRegret[r] = Number(Math.max(0, maxReg - 2 * halfWidth_h).toFixed(6));
    upperMaxRegret[r] = Number((maxReg + 2 * halfWidth_h).toFixed(6));
  }

  const sortedByPoint = [...candidates].sort((a, b) => pointMaxRegret[a] - pointMaxRegret[b]);
  const bestCandidate = sortedByPoint[0];
  const runnerUp = sortedByPoint[1];

  // Separation condition (Manuscript Eq. 16-19): UpperRegret(best) + delta < LowerRegret(j) for all j != best
  const strictMargin = runnerUp
    ? lowerMaxRegret[runnerUp] - (upperMaxRegret[bestCandidate] + tolerance_delta)
    : -1;
  const isSeparated = !missingCriticalInput && strictMargin > 1e-12;

  return {
    B1_fixed_point_choice: bestCandidate,
    B2_point_minimax_choice: bestCandidate,
    B3_interval_regret_decision: isSeparated ? bestCandidate : 'ABSTAIN_COMPARISON_ONLY',
    separated: isSeparated,
    halfWidth_h,
    tolerance_delta,
    four_h_plus_delta: Number((4 * halfWidth_h + tolerance_delta).toFixed(6)),
    point_regret_gap: runnerUp ? Number((pointMaxRegret[runnerUp] - pointMaxRegret[bestCandidate]).toFixed(6)) : 0,
    pointMaxRegret,
    lowerMaxRegret,
    upperMaxRegret
  };
}

// ============================================================================
// 8. SEVENTH FIELD GAME EVIDENCE CONTRACT VALIDATOR
// ============================================================================
const PROHIBITED_CLAIM_PATTERNS = [
  /NASA proves this sequence will save water/i,
  /certified carbon credit/i,
  /measured field salinity from radar alone/i,
  /guaranteed yield increase/i,
  /verified ground truth ET/i
];

export function validateGameMissionEvidenceContract(missionPayload) {
  const violations = [];
  if (!missionPayload || typeof missionPayload !== 'object') {
    return { valid: false, violations: ['Mission payload must be an object'] };
  }
  const textToScan = JSON.stringify(missionPayload.ui_claims || []);
  if(!['OBSERVED','DERIVED','ASSUMED','SIMULATED','UNAVAILABLE'].includes(missionPayload.evidence_kind)) violations.push('Evidence kind is required');
  if (missionPayload.evidence_kind === 'OBSERVED' && !missionPayload.raw_sha256) violations.push('Observed evidence requires independently verified raw source hash');
  for (const pat of PROHIBITED_CLAIM_PATTERNS) {
    if (pat.test(textToScan)) {
      violations.push(`Blocked unscientific claim matching pattern: ${pat}`);
    }
  }
  if (missionPayload.water_volume_m3 !== null && missionPayload.water_volume_m3 !== undefined) {
    if (!(missionPayload.confirmed_area_m2 > 0)) {
      violations.push('Cannot output water volume (m3) without a confirmed positive farm area (m2)');
    }
  }
  return {
    valid: violations.length === 0,
    mission_id: missionPayload.mission_id,
    violations
  };
}

// ============================================================================
// 9. AUTOMATED VERIFICATION TEST SUITE (Runs when executed directly)
// ============================================================================
function runSelfTests() {
  console.log('[SOLIQ-EO-SCIENCE] Running automated verification suite...');

  // Test 1: NASA POWER adapter & missing value handling
  const mockPower = {
    header: { api: { version: 'v2.5.0' }, time_standard: 'UTC' },
    properties: {
      parameter: {
        T2M_MAX: { '20240501': 36.4, '20240502': -999, '20240503': 38.1 }
      }
    }
  };
  const parsedPower = parseNasaPowerDailyResponse(mockPower);
  assert.equal(parsedPower.valid_days, 2);
  assert.equal(parsedPower.null_days, 1);
  assert.equal(parsedPower.series[1].value, null);

  // Test 2: Tie-corrected Mann-Kendall against Zankalon 40-year fixture
  const zankalonTmax = [42.78,44.2,44.05,47.38,43.54,42.79,42.7,44.59,44.15,44.15,46.47,43.97,44.3,45.17,43.9,45.51,44.05,46.76,45.2,44.77,44.44,43.41,45.47,44.53,43.57,46.43,43.96,43.82,46.21,44.98,45.88,46.38,44.17,44.36,46.3,43.83,44.7,45.73,45.08,47.13];
  const records = zankalonTmax.map((v, i) => ({ year: 1985 + i, T2M_MAX_ann: v, complete_year: true }));
  const mk = computeTieCorrectedMannKendall(records, 'T2M_MAX_ann');
  assert.equal(mk.n, 40);
  assert.equal(mk.S, 194);
  assert.ok(Math.abs(mk.Z - 2.248955) < 1e-4);
  assert.ok(Math.abs(mk.p_two_sided - 0.024515) < 1e-4);
  assert.ok(Math.abs(mk.sen_per_decade - 0.415395) < 1e-4);

  // Test 3: Optical Landsat C2 L2 scaling & cloud mask screening
  const cloudy = screenOpticalReflectanceObservation({ red_raw: 12000, nir_raw: 18000, qa_pixel_cloud: true });
  assert.equal(cloudy.usable, false);
  assert.equal(cloudy.ndvi, null);
  const clearLowCover = screenOpticalReflectanceObservation({ sensor: 'LANDSAT_C2_L2', red_raw: 12500, nir_raw: 14000, qa_pixel_cloud:false, qa_pixel_shadow:false, qa_pixel_dilated_cloud:false, qa_radsat:false });
  assert.equal(clearLowCover.usable, true);
  assert.equal(clearLowCover.screening_label, 'LOW_GREENNESS_CANDIDATE_SCREENING_ONLY');

  // Test 4: SAR pair compatibility & partial download rejection
  const partialSar = evaluateSarScenePairOrUnavailability({ band: 'L', partial_file: true }, { band: 'L' });
  assert.equal(partialSar.usable, false);
  assert.equal(partialSar.status, 'REJECTED_INCOMPATIBLE_PAIR');

  // Test 5: Daily Water Bucket closure residual <= 1e-6 mm & drainage-first vs ET-first check
  const bucket = runDailyWaterBalanceBucket({
    S_init_mm: 90,
    S_max_mm: 100,
    daily_forcings: [
      { day: 1, P_mm: 30, Q_mm: 0, I_eff_mm: 0, ET0_mm: 5, Kcb: 0.8, Ke: 0.2, Ks: 1.0 }
    ]
  });
  // Manuscript page 5 verification: S_t=90, P=30, S_max=100, ET*=5 -> Drainage-first drains 20 mm and ends at 95 mm!
  assert.equal(bucket.trajectory[0].L_t_mm, 20);
  assert.equal(bucket.S_final_mm, 95);
  assert.equal(bucket.conservation_passed, true);

  // Test 6: Manuscript Table III Interval-Regret threshold 4h + delta < 0.045
  const table3 = {
    R0: [0.625, 0.520, 0.390, 0.580],
    R1: [0.740, 0.550, 0.445, 0.755],
    R2: [0.700, 0.665, 0.605, 0.640]
  };
  const sepPass = evaluateIntervalRegretComparators({ utilityMatrix: table3, halfWidth_h: 0.008, tolerance_delta: 0.010 });
  assert.equal(sepPass.pointMaxRegret.R0, 0.215);
  assert.equal(sepPass.pointMaxRegret.R1, 0.160);
  assert.equal(sepPass.pointMaxRegret.R2, 0.115);
  assert.equal(sepPass.B3_interval_regret_decision, 'R2');

  const sepAbstain = evaluateIntervalRegretComparators({ utilityMatrix: table3, halfWidth_h: 0.010, tolerance_delta: 0.010 });
  // 4*(0.010) + 0.010 = 0.050 > 0.045 -> MUST ABSTAIN!
  assert.equal(sepAbstain.B3_interval_regret_decision, 'ABSTAIN_COMPARISON_ONLY');

  // Test 7: Game Evidence Contract Validator blocks prohibited claims
  const badContract = validateGameMissionEvidenceContract({
    mission_id: 'M1',
    confirmed_area_m2: 0,
    water_volume_m3: 450,
    ui_claims: ['NASA proves this sequence will save water here']
  });
  assert.equal(badContract.valid, false);
  assert.ok(badContract.violations.length>=2);

  console.log('[SOLIQ-EO-SCIENCE] PASS: All 7 scientific & Earth-observation test suites passed 100%!');
}

if (process.argv.includes('--run-tests')) runSelfTests();

/* Disabled self-committing and pushing on import.
if (process.argv.includes('--prepare-pr')) {
  const branch = 'science/eo-adapters-issues-5-6';
  console.log(`\n[SOLIQ-PR] Preparing branch ${branch} for Issues #5 & #6...`);
  try {
    execSync(`git checkout -b ${branch}`, { stdio: 'inherit' });
    execSync('git add soliq_eo_science_adapters.mjs SOLIQ_SCIENCE_AND_SEVENTH_FIELD_MATRIX.md', { stdio: 'inherit' });
    execSync('git commit -m "feat(science): add verified EO adapters, H1-H4 boundaries & Seventh Field science-to-game matrix (Issues #5, #6)"', { stdio: 'inherit' });
    execSync(`git push -u origin ${branch}`, { stdio: 'inherit' });
  } catch (e) {
    console.error('[SOLIQ-PR] Run inside your authenticated git clone of Mohamed-Mostafa-AE/SOLIQ:', e.message);
  }
}
*/
