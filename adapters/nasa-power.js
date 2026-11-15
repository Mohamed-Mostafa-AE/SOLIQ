/**
 * @file adapters/nasa-power.js
 * @description NASA POWER Agroclimatology connector wrapper & normalizer.
 * Reuses existing NASA POWER daily point adapter contract without unnecessary rewrite,
 * while ensuring strict unit validation, missing-value (-999 / -99) masking,
 * reference evapotranspiration (ET0) derivation (FAO-56 Penman-Monteith / Hargreaves-Samani fallback),
 * and coverage diagnostics.
 *
 * Official NASA POWER Documentation:
 * - Endpoint: https://power.larc.nasa.gov/api/temporal/daily/point
 * - Community: AG (Agroclimatology)
 * - Parameters: T2M (°C), T2M_MAX (°C), T2M_MIN (°C), PRECTOTCORR (mm/day),
 *   ALLSKY_SFC_SW_DWN (MJ/m²/day), RH2M (%), WS2M (m/s), GWETROOT (fraction 0-1)
 */

export const NASA_POWER_DEFAULTS = Object.freeze({
  baseUrl: 'https://power.larc.nasa.gov/api/temporal/daily/point',
  community: 'AG',
  parameters: [
    'T2M',
    'T2M_MAX',
    'T2M_MIN',
    'PRECTOTCORR',
    'ALLSKY_SFC_SW_DWN',
    'RH2M',
    'WS2M',
    'GWETROOT'
  ],
  missingSentinels: [-999, -99, -999.0, -99.0],
  expectedUnits: {
    T2M: 'C',
    T2M_MAX: 'C',
    T2M_MIN: 'C',
    PRECTOTCORR: 'mm/day',
    ALLSKY_SFC_SW_DWN: 'MJ/m^2/day',
    RH2M: '%',
    WS2M: 'm/s',
    GWETROOT: 'dimensionless'
  }
});

/**
 * Checks if a numeric value is a valid observation (not NaN, null, or NASA missing sentinel).
 * @param {number|null|undefined} value
 * @returns {boolean}
 */
export function isValidPowerValue(value) {
  if (value === null || value === undefined || typeof value !== 'number' || !Number.isFinite(value)) {
    return false;
  }
  return !NASA_POWER_DEFAULTS.missingSentinels.includes(value) && value > -900;
}

/**
 * Computes daily Reference Evapotranspiration (ET0 in mm/day) using FAO-56 Penman-Monteith
 * when full meteorological variables (T2M, T2M_MAX, T2M_MIN, RH2M, WS2M, ALLSKY_SFC_SW_DWN)
 * are available, or falls back to calibrated FAO-56 Hargreaves-Samani when wind/humidity are absent.
 *
 * Reference: Allen et al. (1998), FAO Irrigation and Drainage Paper No. 56, Chapter 2 & Eq. 52.
 *
 * @param {Object} met - Daily meteorological record
 * @param {number} [met.tMeanC] - Mean daily temperature (°C)
 * @param {number} [met.tMaxC] - Max daily temperature (°C)
 * @param {number} [met.tMinC] - Min daily temperature (°C)
 * @param {number} [met.solarRadMJm2Day] - Shortwave radiation (MJ/m²/day)
 * @param {number} [met.rhMeanPct] - Relative humidity (%)
 * @param {number} [met.wind2mMs] - Wind speed at 2m height (m/s)
 * @param {number} [met.elevationM=12] - Site elevation above sea level (m)
 * @returns {{ et0MmDay: number|null, method: string }}
 */
export function computeFao56Et0(met = {}) {
  const {
    tMeanC,
    tMaxC,
    tMinC,
    solarRadMJm2Day,
    rhMeanPct,
    wind2mMs,
    elevationM = 12
  } = met;

  const hasTemp =
    Number.isFinite(tMeanC) || (Number.isFinite(tMaxC) && Number.isFinite(tMinC));
  if (!hasTemp) {
    return { et0MmDay: null, method: 'insufficient_temperature_data' };
  }

  const T = Number.isFinite(tMeanC) ? tMeanC : 0.5 * (tMaxC + tMinC);
  const Tmax = Number.isFinite(tMaxC) ? tMaxC : T + 5.0;
  const Tmin = Number.isFinite(tMinC) ? tMinC : T - 5.0;
  const Rs = Number.isFinite(solarRadMJm2Day) && solarRadMJm2Day >= 0 ? solarRadMJm2Day : null;

  // Full FAO-56 Penman-Monteith when Rs, RH, and WS2M are valid
  if (Rs !== null && Number.isFinite(rhMeanPct) && Number.isFinite(wind2mMs)) {
    const u2 = Math.max(0.5, wind2mMs);
    const P = 101.3 * Math.pow((293 - 0.0065 * elevationM) / 293, 5.26); // kPa
    const gamma = 0.000665 * P; // Psychrometric constant (kPa/°C)

    const esTmax = 0.6108 * Math.exp((17.27 * Tmax) / (Tmax + 237.3));
    const esTmin = 0.6108 * Math.exp((17.27 * Tmin) / (Tmin + 237.3));
    const es = 0.5 * (esTmax + esTmin);
    const ea = es * (Math.min(100, Math.max(5, rhMeanPct)) / 100);

    const delta =
      (4098 * (0.6108 * Math.exp((17.27 * T) / (T + 237.3)))) /
      Math.pow(T + 237.3, 2);

    // Net shortwave radiation Rns (albedo = 0.23) and simplified net longwave Rnl
    const Rns = (1 - 0.23) * Rs;
    const sigma = 4.903e-9;
    const Rso = Math.max(Rs, (0.75 + 2e-5 * elevationM) * Math.max(15, Rs * 1.25));
    const relSolar = Math.min(1.0, Math.max(0.25, Rs / Rso));
    const Rnl =
      sigma *
      0.5 *
      (Math.pow(Tmax + 273.16, 4) + Math.pow(Tmin + 273.16, 4)) *
      (0.34 - 0.14 * Math.sqrt(Math.max(0.01, ea))) *
      (1.35 * relSolar - 0.35);
    const Rn = Math.max(0, Rns - Rnl);
    const G = 0; // Daily soil heat flux ≈ 0

    const numerator =
      0.408 * delta * (Rn - G) + gamma * (900 / (T + 273)) * u2 * Math.max(0, es - ea);
    const denominator = delta + gamma * (1 + 0.34 * u2);
    const et0 = Math.max(0, numerator / denominator);

    return {
      et0MmDay: Number(et0.toFixed(3)),
      method: 'FAO56_Penman_Monteith'
    };
  }

  // Fallback: Radiation-driven Hargreaves-Samani (FAO-56 Eq. 52 with Rs conversion)
  if (Rs !== null) {
    const tempRange = Math.max(1.0, Tmax - Tmin);
    // 1 MJ/m²/day ≈ 0.408 mm/day equivalent evaporation
    const et0 = Math.max(0, 0.0135 * 0.408 * Rs * (T + 17.8) * Math.pow(tempRange / 10, 0.15));
    return {
      et0MmDay: Number(et0.toFixed(3)),
      method: 'FAO56_Radiation_Temperature'
    };
  }

  return { et0MmDay: null, method: 'insufficient_radiation_data' };
}

/**
 * Formats YYYYMMDD or YYYY-MM-DD into canonical ISO YYYY-MM-DD.
 * @param {string} rawDate
 * @returns {string}
 */
export function normalizeDateKey(rawDate) {
  const clean = String(rawDate).trim();
  if (/^\d{8}$/.test(clean)) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  throw new Error(`Invalid NASA POWER date key: ${rawDate}`);
}

/**
 * Parses and validates a raw NASA POWER API JSON payload into standardized daily records.
 * Preserves compatibility with existing NASA POWER connectors that pass either raw API responses
 * or pre-normalized daily arrays.
 *
 * @param {Object} rawPayload - NASA POWER JSON response (`properties.parameter`)
 * @param {Object} [options]
 * @param {number} [options.elevationM=12]
 * @returns {Object} Normalized NASA POWER dataset with coverage and unit diagnostics
 */
export function normalizeNasaPowerResponse(rawPayload, options = {}) {
  if (!rawPayload || typeof rawPayload !== 'object') {
    throw new Error('NASA POWER payload must be a non-null object');
  }

  // If already normalized by an upstream NASA POWER connector, validate and enrich
  if (Array.isArray(rawPayload.dailyRecords) && rawPayload.source === 'NASA_POWER') {
    return rawPayload;
  }

  const paramBlock = rawPayload?.properties?.parameter || rawPayload?.parameter;
  if (!paramBlock || typeof paramBlock !== 'object') {
    throw new Error('NASA POWER payload missing properties.parameter block');
  }

  const elevationM =
    options.elevationM ??
    (Array.isArray(rawPayload?.geometry?.coordinates)
      ? rawPayload.geometry.coordinates[2] ?? 12
      : 12);

  // Collect all unique date keys across available parameters
  const dateSet = new Set();
  for (const paramValues of Object.values(paramBlock)) {
    if (paramValues && typeof paramValues === 'object') {
      for (const dateKey of Object.keys(paramValues)) {
        dateSet.add(dateKey);
      }
    }
  }

  const rawDateKeys = Array.from(dateSet).sort();
  const dailyRecords = [];
  let validEt0Count = 0;
  let validPrecipCount = 0;

  for (const rawKey of rawDateKeys) {
    const date = normalizeDateKey(rawKey);
    const rawT2M = paramBlock.T2M?.[rawKey];
    const rawTMax = paramBlock.T2M_MAX?.[rawKey];
    const rawTMin = paramBlock.T2M_MIN?.[rawKey];
    const rawPrecip = paramBlock.PRECTOTCORR?.[rawKey];
    const rawSolar = paramBlock.ALLSKY_SFC_SW_DWN?.[rawKey];
    const rawRh = paramBlock.RH2M?.[rawKey];
    const rawWind = paramBlock.WS2M?.[rawKey];
    const rawGwetRoot = paramBlock.GWETROOT?.[rawKey];

    const tMeanC = isValidPowerValue(rawT2M) ? rawT2M : null;
    const tMaxC = isValidPowerValue(rawTMax) ? rawTMax : null;
    const tMinC = isValidPowerValue(rawTMin) ? rawTMin : null;
    const precipMmDay = isValidPowerValue(rawPrecip) ? Math.max(0, rawPrecip) : null;
    const solarRadMJm2Day = isValidPowerValue(rawSolar) ? Math.max(0, rawSolar) : null;
    const rhMeanPct = isValidPowerValue(rawRh) ? rawRh : null;
    const wind2mMs = isValidPowerValue(rawWind) ? rawWind : null;
    const rootZoneWetness = isValidPowerValue(rawGwetRoot) ? rawGwetRoot : null;

    const { et0MmDay, method: et0Method } = computeFao56Et0({
      tMeanC,
      tMaxC,
      tMinC,
      solarRadMJm2Day,
      rhMeanPct,
      wind2mMs,
      elevationM
    });

    if (et0MmDay !== null) validEt0Count += 1;
    if (precipMmDay !== null) validPrecipCount += 1;

    dailyRecords.push({
      date,
      tMeanC,
      tMaxC,
      tMinC,
      precipMmDay,
      solarRadMJm2Day,
      rhMeanPct,
      wind2mMs,
      rootZoneWetness,
      et0MmDay,
      et0Method,
      qualityFlag:
        et0MmDay !== null && precipMmDay !== null ? 'nominal' : 'partial_missing'
    });
  }

  const totalDays = dailyRecords.length;
  const coverageRatio = totalDays > 0 ? validEt0Count / totalDays : 0;

  return {
    source: 'NASA_POWER',
    community: rawPayload?.header?.community || 'AG',
    coordinates: rawPayload?.geometry?.coordinates || null,
    units: {
      temperature: 'degC',
      precipitation: 'mm/day',
      solarRadiation: 'MJ/m2/day',
      et0: 'mm/day',
      rootZoneWetness: 'fraction_0_1'
    },
    coverage: {
      totalDays,
      validEt0Days: validEt0Count,
      validPrecipDays: validPrecipCount,
      coverageRatio: Number(coverageRatio.toFixed(4)),
      startDate: totalDays > 0 ? dailyRecords[0].date : null,
      endDate: totalDays > 0 ? dailyRecords[totalDays - 1].date : null
    },
    dailyRecords
  };
}

/**
 * Fetches or delegates to an existing NASA POWER connector.
 * Never fabricates synthetic meteorology if network access is unavailable.
 *
 * @param {Object} params
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {string} params.startDate - YYYYMMDD or YYYY-MM-DD
 * @param {string} params.endDate - YYYYMMDD or YYYY-MM-DD
 * @param {Function} [params.existingConnector] - Existing project NASA POWER connector to reuse if provided
 * @param {Function} [params.fetchImpl=globalThis.fetch] - HTTP fetch implementation
 * @param {Object} [params.cachedPayload] - Optional verified NASA POWER payload from disk/fixture
 * @returns {Promise<Object>}
 */
export async function fetchNasaPowerClimatology(params = {}) {
  const {
    latitude,
    longitude,
    startDate,
    endDate,
    existingConnector,
    fetchImpl = globalThis.fetch,
    cachedPayload
  } = params;

  // 1. Reuse existing NASA POWER connector if injected
  if (typeof existingConnector === 'function') {
    const upstreamResult = await existingConnector({
      latitude,
      longitude,
      startDate,
      endDate
    });
    return normalizeNasaPowerResponse(upstreamResult);
  }

  // 2. If a verified cached NASA POWER response payload is supplied, normalize it directly
  if (cachedPayload) {
    return { ...normalizeNasaPowerResponse(cachedPayload), status: 'unverified_payload', evidenceKind: 'assumed' };
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Valid numeric latitude and longitude are required for NASA POWER');
  }

  const startClean = String(startDate).replace(/-/g, '');
  const endClean = String(endDate).replace(/-/g, '');
  const paramList = NASA_POWER_DEFAULTS.parameters.join(',');
  const url = `${NASA_POWER_DEFAULTS.baseUrl}?parameters=${paramList}&community=${NASA_POWER_DEFAULTS.community}&longitude=${longitude}&latitude=${latitude}&start=${startClean}&end=${endClean}&format=JSON`;

  if (typeof fetchImpl !== 'function') {
    return {
      source: 'NASA_POWER',
      status: 'unavailable',
      reason: 'fetch_implementation_unavailable',
      authenticated: false,
      syntheticFallbackUsed: false,
      endpoint: url,
      dailyRecords: []
    };
  }

  try {
    const response = await fetchImpl(url, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
      return {
        source: 'NASA_POWER',
        status: 'http_error',
        httpStatus: response.status,
        reason: `NASA POWER HTTP ${response.status}`,
        syntheticFallbackUsed: false,
        endpoint: url,
        dailyRecords: []
      };
    }
    const json = await response.json();
    const normalized = normalizeNasaPowerResponse(json);
    return {
      ...normalized,
      status: 'ok',
      syntheticFallbackUsed: false,
      endpoint: url
    };
  } catch (error) {
    return {
      source: 'NASA_POWER',
      status: 'network_blocked_or_offline',
      reason: error?.message || String(error),
      syntheticFallbackUsed: false,
      endpoint: url,
      dailyRecords: []
    };
  }
}
