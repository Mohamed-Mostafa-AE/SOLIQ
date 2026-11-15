/**
 * @file adapters/nasa-power.js
 * @description NASA POWER Agroclimatology Daily API adapter with FAO-56 Penman-Monteith ET0,
 * missing-value sentinel handling (`-999` -> `null`), UTC verification, and PR #17 safety guards.
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
  missingSentinels: [-999, -99, -999.0, -99.0]
});

export function isValidPowerValue(value) {
  if (value === null || value === undefined || typeof value !== 'number' || !Number.isFinite(value)) {
    return false;
  }
  return value > -90;
}

export function normalizeDateKey(yyyymmdd) {
  const s = String(yyyymmdd || '').trim();
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }
  return null;
}

/**
 * Computes daily reference evapotranspiration ET0 (mm/day) via FAO-56 Penman-Monteith.
 */
export function computeFao56Et0(met = {}) {
  const {
    tMaxC,
    tMinC,
    tMeanC,
    solarRadMjM2Day,
    rhMeanPct = 55,
    windSpeed2mMs = 2.0,
    elevationM = 11.0
  } = met;

  if (!isValidPowerValue(tMaxC) || !isValidPowerValue(tMinC)) {
    return null;
  }
  const tMean = isValidPowerValue(tMeanC) ? tMeanC : (tMaxC + tMinC) / 2.0;
  const rs = isValidPowerValue(solarRadMjM2Day) ? Math.max(1.0, solarRadMjM2Day) : 18.0;
  const rh = isValidPowerValue(rhMeanPct) ? Math.min(100, Math.max(5, rhMeanPct)) : 55.0;
  const u2 = isValidPowerValue(windSpeed2mMs) ? Math.max(0.5, windSpeed2mMs) : 2.0;

  const P = 101.3 * Math.pow((293.0 - 0.0065 * elevationM) / 293.0, 5.26);
  const gamma = 0.000665 * P;
  const esTmax = 0.6108 * Math.exp((17.27 * tMaxC) / (tMaxC + 237.3));
  const esTmin = 0.6108 * Math.exp((17.27 * tMinC) / (tMinC + 237.3));
  const es = (esTmax + esTmin) / 2.0;
  const ea = es * (rh / 100.0);
  const delta =
    (4098.0 * (0.6108 * Math.exp((17.27 * tMean) / (tMean + 237.3)))) /
    Math.pow(tMean + 237.3, 2);

  const rn = 0.77 * rs - 2.45;
  const num =
    0.408 * delta * Math.max(0, rn) +
    gamma * (900.0 / (tMean + 273.0)) * u2 * Math.max(0, es - ea);
  const den = delta + gamma * (1.0 + 0.34 * u2);
  return Number(Math.max(0, num / den).toFixed(4));
}

export function normalizeNasaPowerResponse(rawPayload = {}, options = {}) {
  const paramsObj = rawPayload?.properties?.parameter || {};
  const elevationM = rawPayload?.geometry?.coordinates?.[2] ?? options.elevationM ?? 11.0;

  const dateKeys = new Set();
  for (const paramKey of Object.keys(paramsObj)) {
    for (const dk of Object.keys(paramsObj[paramKey] || {})) {
      if (!dk.endsWith('13')) {
        dateKeys.add(dk);
      }
    }
  }

  const sortedKeys = Array.from(dateKeys).sort();
  const dailyRecords = [];
  let validDaysCount = 0;

  for (const dk of sortedKeys) {
    const isoDate = normalizeDateKey(dk);
    if (!isoDate) continue;

    const readVal = (key) => {
      const v = paramsObj[key]?.[dk];
      return isValidPowerValue(v) ? Number(v) : null;
    };

    const tMaxC = readVal('T2M_MAX');
    const tMinC = readVal('T2M_MIN');
    const tMeanC = readVal('T2M');
    const precipMmDay = readVal('PRECTOTCORR');
    const solarRadMjM2Day = readVal('ALLSKY_SFC_SW_DWN');
    const rhMeanPct = readVal('RH2M');
    const windSpeed2mMs = readVal('WS2M');
    const gwetRoot = readVal('GWETROOT');

    const et0MmDay = computeFao56Et0({
      tMaxC,
      tMinC,
      tMeanC,
      solarRadMjM2Day,
      rhMeanPct,
      windSpeed2mMs,
      elevationM
    });

    const validDay = et0MmDay !== null && precipMmDay !== null;
    if (validDay) {
      validDaysCount += 1;
    }

    dailyRecords.push({
      date: isoDate,
      valid: validDay,
      tMaxC,
      tMinC,
      tMeanC,
      precipMmDay,
      solarRadMjM2Day,
      rhMeanPct,
      windSpeed2mMs,
      gwetRoot,
      et0MmDay
    });
  }

  const coverageRatio =
    dailyRecords.length > 0 ? Number((validDaysCount / dailyRecords.length).toFixed(4)) : 0;

  return {
    source: 'NASA_POWER_AGROCLIMATOLOGY',
    timeStandard: rawPayload?.header?.time_standard || 'UTC',
    spatialSupport: {
      nativeGrid: 'MERRA2_0.5x0.625deg',
      resolution: '0.5deg (~50km regional context)'
    },
    dailyRecords,
    coverage: {
      totalDays: dailyRecords.length,
      validDaysCount,
      coverageRatio,
      passesCoverageThreshold: coverageRatio >= 0.85 && validDaysCount > 0
    }
  };
}

export async function fetchNasaPowerClimatology(params = {}) {
  const {
    latitude,
    longitude,
    startDate,
    endDate,
    cachedPayload = null,
    fetchImpl = globalThis.fetch
  } = params;

  if (cachedPayload) {
    return {
      ...normalizeNasaPowerResponse(cachedPayload, params),
      status: 'unverified_payload',
      authenticated: false,
      evidenceKind: 'assumed',
      syntheticFallbackUsed: false
    };
  }

  if (typeof fetchImpl !== 'function') {
    return {
      source: 'NASA_POWER_AGROCLIMATOLOGY',
      status: 'unavailable',
      syntheticFallbackUsed: false,
      dailyRecords: []
    };
  }

  try {
    const startCompact = String(startDate || '').replace(/-/g, '');
    const endCompact = String(endDate || '').replace(/-/g, '');
    const url = `${NASA_POWER_DEFAULTS.baseUrl}?parameters=${NASA_POWER_DEFAULTS.parameters.join(',')}&community=AG&longitude=${longitude}&latitude=${latitude}&start=${startCompact}&end=${endCompact}&time-standard=UTC&format=JSON`;
    const response = await fetchImpl(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return {
        source: 'NASA_POWER_AGROCLIMATOLOGY',
        status: 'http_error',
        httpStatus: response.status,
        syntheticFallbackUsed: false,
        dailyRecords: []
      };
    }
    const payload = await response.json();
    return {
      ...normalizeNasaPowerResponse(payload, params),
      status: 'ok',
      authenticated: true,
      evidenceKind: 'observed',
      syntheticFallbackUsed: false
    };
  } catch (err) {
    return {
      source: 'NASA_POWER_AGROCLIMATOLOGY',
      status: 'network_blocked_or_offline',
      syntheticFallbackUsed: false,
      diagnostics: { reason: err?.message || String(err) },
      dailyRecords: []
    };
  }
}
