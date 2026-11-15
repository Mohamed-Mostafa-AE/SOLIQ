/**
 * @file adapters/gpm-imerg.js
 * @description NASA GPM IMERG V07 adapter with genuine NetCDF-4 / HDF5 (`h5py`/`netCDF4`) and
 * Unidata NetCDF-3 (`CDF\x01`/`CDF\x02` from NASA GES DISC OPeNDAP subsetting) support.
 *
 * Preserves all PR #17 safety guards and addresses #issuecomment-6897616390:
 * - Uses official NASA GES DISC OPeNDAP bounded subset URL (`buildImergOpendapSubsetUrl`).
 * - Never allows caller-supplied flags or mocked `fetchImpl` to certify local fixtures as live NASA observations.
 */

import {
  decodeImergNetCdf4Binary,
  encodeImergNetCdf4BinaryGranule,
  buildStandardNetCdf3TestGranule,
  parseNetCdf3BinaryBuffer,
  buildImergOpendapSubsetUrl,
  snapToImergGridCenter,
  computeRawSha256,
  toRawBuffer
} from './imerg-netcdf4-reader.js';

export const GPM_IMERG_V07_SPEC = Object.freeze({
  version: '07',
  collections: {
    dailyFinal: {
      shortName: 'GPM_3IMERGDF',
      conceptId: 'C2723754864-GES_DISC',
      doi: '10.5067/GPM/IMERGDF/DAY/07',
      nativeUnit: 'mm/day',
      finalRunCutoffDate: '2025-09-30'
    },
    dailyLate: {
      shortName: 'GPM_3IMERGDL',
      doi: '10.5067/GPM/IMERGDL/DAY/07',
      nativeUnit: 'mm/day'
    },
    halfHourlyFinal: {
      shortName: 'GPM_3IMERGHH',
      doi: '10.5067/GPM/IMERG/3B-HH/07',
      nativeUnit: 'mm/hr'
    }
  },
  cmrGranulesEndpoint: 'https://cmr.earthdata.nasa.gov/search/granules.json',
  gesDiscOpendapBase: 'https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3',
  spatialResolutionDeg: 0.1,
  maxHalfHourlySamplesPerDay: 48,
  minAcceptableSamplesPerDay: 36,
  rateCapMmHr: 200.0,
  dailyCapMmDay: 1500.0,
  fillValue: -9999.9
});

export function convertAndValidateImergUnit(input = {}) {
  const unitRaw = typeof input.unit === 'string' ? input.unit.trim().toLowerCase() : '';
  if (!unitRaw) {
    return {
      valid: false,
      precipMmDay: null,
      nativeValue: null,
      nativeUnit: input.unit ?? null,
      convertedUnit: 'mm/day',
      qualityFlag: 'invalid_unit',
      reason: 'Missing explicit precipitation unit'
    };
  }

  if (
    Array.isArray(input.halfHourlyRatesMmHr) &&
    (unitRaw === 'mm/hr' || unitRaw === 'mm/h' || unitRaw === 'mm hr-1')
  ) {
    const validSamples = input.halfHourlyRatesMmHr.filter(
      (v) =>
        typeof v === 'number' &&
        Number.isFinite(v) &&
        v > GPM_IMERG_V07_SPEC.fillValue + 1 &&
        v >= 0 &&
        v <= GPM_IMERG_V07_SPEC.rateCapMmHr
    );
    if (validSamples.length < GPM_IMERG_V07_SPEC.minAcceptableSamplesPerDay) {
      return {
        valid: false,
        precipMmDay: null,
        nativeValue: null,
        nativeUnit: input.unit,
        convertedUnit: 'mm/day',
        validSamplesCount: validSamples.length,
        qualityFlag: 'insufficient_half_hourly_samples'
      };
    }
    const meanRateMmHr =
      validSamples.reduce((acc, v) => acc + v, 0) / validSamples.length;
    const precipMmDay = Number((meanRateMmHr * 24.0).toFixed(4));
    return {
      valid: true,
      precipMmDay,
      nativeValue: Number(meanRateMmHr.toFixed(4)),
      nativeUnit: input.unit,
      convertedUnit: 'mm/day',
      validSamplesCount: validSamples.length,
      qualityFlag: 'ok_good'
    };
  }

  const rawValue = input.value !== undefined ? input.value : input.precipitation;
  if (
    rawValue === null ||
    rawValue === undefined ||
    typeof rawValue !== 'number' ||
    !Number.isFinite(rawValue) ||
    Math.abs(rawValue - GPM_IMERG_V07_SPEC.fillValue) < 1.0 ||
    rawValue < 0
  ) {
    return {
      valid: false,
      precipMmDay: null,
      nativeValue: null,
      nativeUnit: input.unit,
      convertedUnit: 'mm/day',
      qualityFlag: 'missing_fill_value'
    };
  }

  if (unitRaw === 'mm/day' || unitRaw === 'mm d-1' || unitRaw === 'mm/d') {
    if (rawValue > GPM_IMERG_V07_SPEC.dailyCapMmDay) {
      return {
        valid: false,
        precipMmDay: null,
        nativeValue: rawValue,
        nativeUnit: input.unit,
        convertedUnit: 'mm/day',
        qualityFlag: 'exceeds_physical_daily_cap'
      };
    }
    return {
      valid: true,
      precipMmDay: Number(rawValue.toFixed(4)),
      nativeValue: Number(rawValue.toFixed(4)),
      nativeUnit: input.unit,
      convertedUnit: 'mm/day',
      qualityFlag: 'ok_good'
    };
  }

  if (unitRaw === 'mm/hr' || unitRaw === 'mm/h' || unitRaw === 'mm hr-1') {
    const validHalfHourlySamples =
      input.validHalfHourlySamples !== undefined ? Number(input.validHalfHourlySamples) : 48;
    if (
      rawValue > GPM_IMERG_V07_SPEC.rateCapMmHr ||
      validHalfHourlySamples < GPM_IMERG_V07_SPEC.minAcceptableSamplesPerDay
    ) {
      return {
        valid: false,
        precipMmDay: null,
        nativeValue: rawValue,
        nativeUnit: input.unit,
        convertedUnit: 'mm/day',
        qualityFlag:
          validHalfHourlySamples < GPM_IMERG_V07_SPEC.minAcceptableSamplesPerDay
            ? 'insufficient_half_hourly_samples'
            : 'exceeds_physical_rate_cap'
      };
    }
    return {
      valid: true,
      precipMmDay: Number((rawValue * 24.0).toFixed(4)),
      nativeValue: Number(rawValue.toFixed(4)),
      nativeUnit: input.unit,
      convertedUnit: 'mm/day',
      qualityFlag: 'ok_good'
    };
  }

  return {
    valid: false,
    precipMmDay: null,
    nativeValue: rawValue,
    nativeUnit: input.unit,
    convertedUnit: 'mm/day',
    qualityFlag: 'invalid_unit'
  };
}

export function evaluateImergCoverageAndQuality(params = {}) {
  const {
    records = [],
    startDate = '2025-01-01',
    endDate = '2025-01-01',
    latitude = 30.5833,
    longitude = 31.4333,
    minCoverageRatio = 0.8
  } = params;

  const startMs = Date.parse(`${startDate}T00:00:00Z`);
  const endMs = Date.parse(`${endDate}T00:00:00Z`);
  const expectedDays =
    Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs
      ? Math.round((endMs - startMs) / 86400000) + 1
      : Math.max(1, records.length);

  const validRecords = records.filter((r) => r && r.valid === true && Number.isFinite(r.precipMmDay));
  const coverageRatio = expectedDays > 0 ? Number((validRecords.length / expectedDays).toFixed(4)) : 0;
  const gridCenter = snapToImergGridCenter(latitude, longitude);

  return {
    expectedDays,
    validDaysCount: validRecords.length,
    missingDaysCount: Math.max(0, expectedDays - validRecords.length),
    coverageRatio,
    fraction: coverageRatio,
    passesCoverageThreshold: coverageRatio >= minCoverageRatio && validRecords.length > 0,
    gridCenter
  };
}

export function normalizeGpmImergV07Dataset(rawDataset = {}, options = {}) {
  const productVersion = String(rawDataset.version || rawDataset.productVersion || '07');
  if (!productVersion.startsWith('07') && !productVersion.startsWith('V07')) {
    throw new Error(`Unsupported GPM IMERG version "${productVersion}"; V07 required`);
  }

  const rawRecords = Array.isArray(rawDataset.records) ? rawDataset.records : [];
  const normalizedRecords = rawRecords.map((rec) => {
    const unitToUse = rec.unit !== undefined ? rec.unit : rawDataset.unit;
    const conv = convertAndValidateImergUnit({
      value: rec.precipitation !== undefined ? rec.precipitation : rec.value,
      halfHourlyRatesMmHr: rec.halfHourlyRatesMmHr,
      unit: unitToUse,
      validHalfHourlySamples: rec.validHalfHourlySamples
    });
    return {
      date: rec.date,
      ...conv,
      qualityIndex: rec.qualityIndex ?? null
    };
  });

  const coverage = evaluateImergCoverageAndQuality({
    records: normalizedRecords,
    startDate: options.startDate || rawRecords[0]?.date || '2025-01-01',
    endDate: options.endDate || rawRecords[rawRecords.length - 1]?.date || '2025-01-01',
    latitude: options.latitude ?? 30.5833,
    longitude: options.longitude ?? 31.4333
  });

  return {
    source: 'NASA_GPM_IMERG_V07',
    version: '07',
    records: normalizedRecords,
    observations: normalizedRecords,
    coverage
  };
}

export async function fetchGpmImergV07(params = {}) {
  const {
    latitude,
    longitude,
    startDate,
    endDate,
    earthdataToken = process.env.EARTHDATA_TOKEN || process.env.NASA_EARTHDATA_TOKEN || null,
    verifiedGranulePayload = null,
    binaryGranuleBytes = null,
    fetchImpl = globalThis.fetch
  } = params;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('fetchGpmImergV07 requires finite numeric latitude and longitude');
  }

  // Guard 1: Caller-supplied JSON fixture is never authenticated as live NASA
  if (verifiedGranulePayload) {
    const normalized = normalizeGpmImergV07Dataset(verifiedGranulePayload, {
      latitude,
      longitude,
      startDate,
      endDate
    });
    return {
      ...normalized,
      status: 'unverified_payload',
      authenticated: false,
      evidenceKind: 'assumed',
      delivery: 'cached',
      syntheticFallbackUsed: false,
      diagnostics: {
        accessMode: 'external_payload_unverified',
        earthdataLoginRequired: true,
        message: 'Validated caller-supplied GPM IMERG V07 payload as unverified/assumed.'
      }
    };
  }

  // Guard 2: Caller-supplied binary NetCDF/HDF5 buffer is decoded for unit/QA check, never marked live/observed
  if (binaryGranuleBytes) {
    const decoded = decodeImergNetCdf4Binary(binaryGranuleBytes, {
      latitude,
      longitude,
      startDate,
      endDate
    });
    if (!decoded.valid) {
      return {
        ...decoded,
        source: 'NASA_GPM_IMERG_V07',
        authenticated: false,
        evidenceKind: 'assumed',
        delivery: 'unavailable',
        syntheticFallbackUsed: false
      };
    }
    return {
      ...decoded,
      status: 'unverified_payload',
      authenticated: false,
      evidenceKind: 'assumed',
      delivery: 'cached',
      syntheticFallbackUsed: false,
      diagnostics: {
        accessMode: 'binary_netcdf_local_unverified_origin',
        earthdataLoginRequired: true,
        message: 'Decoded local NetCDF/HDF5 granule with units, QA, and SHA-256; marked unverified_payload/assumed.'
      }
    };
  }

  const bbox = `${(longitude - 0.05).toFixed(3)},${(latitude - 0.05).toFixed(3)},${(longitude + 0.05).toFixed(3)},${(latitude + 0.05).toFixed(3)}`;
  const shortName =
    endDate > GPM_IMERG_V07_SPEC.collections.dailyFinal.finalRunCutoffDate
      ? 'GPM_3IMERGDL'
      : 'GPM_3IMERGDF';
  const cmrUrl = `${GPM_IMERG_V07_SPEC.cmrGranulesEndpoint}?short_name=${shortName}&version=07&temporal=${startDate}T00:00:00Z,${endDate}T23:59:59Z&bounding_box=${bbox}&page_size=366`;

  if (typeof fetchImpl !== 'function') {
    return {
      source: 'NASA_GPM_IMERG_V07',
      shortName,
      version: '07',
      status: 'unavailable',
      authenticated: Boolean(earthdataToken),
      syntheticFallbackUsed: false,
      diagnostics: {
        reason: 'fetch_implementation_unavailable',
        earthdataLoginRequired: true,
        cmrQueryUrl: cmrUrl,
        message:
          'No HTTP fetch implementation available; refusing to generate synthetic GPM IMERG V07 rainfall.'
      },
      coverage: evaluateImergCoverageAndQuality({
        records: [],
        startDate,
        endDate,
        latitude,
        longitude
      }),
      records: []
    };
  }

  try {
    const cmrResp = await fetchImpl(cmrUrl, {
      headers: { Accept: 'application/json' }
    });
    if (!cmrResp.ok) {
      return {
        source: 'NASA_GPM_IMERG_V07',
        shortName,
        version: '07',
        status: 'cmr_http_error',
        httpStatus: cmrResp.status,
        authenticated: Boolean(earthdataToken),
        syntheticFallbackUsed: false,
        diagnostics: {
          reason: `CMR search returned HTTP ${cmrResp.status}`,
          earthdataLoginRequired: true,
          cmrQueryUrl: cmrUrl
        },
        coverage: evaluateImergCoverageAndQuality({
          records: [],
          startDate,
          endDate,
          latitude,
          longitude
        }),
        records: []
      };
    }

    const cmrJson = await cmrResp.json();
    const entries = cmrJson?.feed?.entry || [];

    if (entries.length === 0) {
      return {
        source: 'NASA_GPM_IMERG_V07',
        shortName,
        version: '07',
        status: 'no_granules_found',
        authenticated: Boolean(earthdataToken),
        syntheticFallbackUsed: false,
        diagnostics: {
          reason: 'zero_cmr_granules_in_window',
          earthdataLoginRequired: true,
          cmrQueryUrl: cmrUrl
        },
        coverage: evaluateImergCoverageAndQuality({
          records: [],
          startDate,
          endDate,
          latitude,
          longitude
        }),
        records: []
      };
    }

    if (!earthdataToken) {
      return {
        source: 'NASA_GPM_IMERG_V07',
        shortName,
        version: '07',
        status: 'auth_required',
        authenticated: false,
        syntheticFallbackUsed: false,
        discoveredGranulesCount: entries.length,
        sampleGranuleId: entries[0]?.title || entries[0]?.id || null,
        diagnostics: {
          reason: 'earthdata_login_token_missing',
          earthdataLoginRequired: true,
          cmrQueryUrl: cmrUrl,
          message:
            'CMR discovered GPM IMERG V07 granules, but NASA GES DISC requires Earthdata Login (EARTHDATA_TOKEN). Refusing to generate synthetic data.'
        },
        coverage: evaluateImergCoverageAndQuality({
          records: [],
          startDate,
          endDate,
          latitude,
          longitude
        }),
        records: []
      };
    }

    const firstEntry = entries[0];
    const opendapLink = (firstEntry.links || []).find(
      (l) => l.href && l.href.includes('opendap')
    );
    const directNc4Link = (firstEntry.links || []).find(
      (l) => l.href && l.href.endsWith('.nc4')
    );

    const targetUrl = opendapLink
      ? buildImergOpendapSubsetUrl(opendapLink.href, {
          latitude,
          longitude,
          formatExtension: 'nc'
        })
      : directNc4Link
        ? directNc4Link.href
        : cmrUrl;

    const dataResp = await fetchImpl(targetUrl, {
      headers: {
        Authorization: `Bearer ${earthdataToken}`,
        Accept: 'application/x-netcdf, application/octet-stream, application/json'
      }
    });

    if (dataResp.status === 401 || dataResp.status === 403) {
      return {
        source: 'NASA_GPM_IMERG_V07',
        shortName,
        version: '07',
        status: 'auth_rejected',
        httpStatus: dataResp.status,
        authenticated: false,
        syntheticFallbackUsed: false,
        discoveredGranulesCount: entries.length,
        diagnostics: {
          reason: `GES DISC rejected Earthdata token with HTTP ${dataResp.status}`,
          earthdataLoginRequired: true,
          cmrQueryUrl: cmrUrl
        },
        coverage: evaluateImergCoverageAndQuality({
          records: [],
          startDate,
          endDate,
          latitude,
          longitude
        }),
        records: []
      };
    }

    const responseType = (dataResp.headers?.get?.('content-type') || '').toLowerCase();
    if (!responseType.includes('json')) {
      if (typeof dataResp.arrayBuffer === 'function') {
        const rawBuf = Buffer.from(await dataResp.arrayBuffer());
        const decoded = decodeImergNetCdf4Binary(rawBuf, {
          latitude,
          longitude,
          startDate,
          endDate
        });
        if (decoded.valid) {
          const isRealGlobalFetch = fetchImpl === globalThis.fetch;
          return {
            ...decoded,
            status: isRealGlobalFetch ? 'ok' : 'unverified_payload',
            authenticated: isRealGlobalFetch,
            evidenceKind: isRealGlobalFetch ? 'observed' : 'assumed',
            delivery: isRealGlobalFetch ? 'live' : 'cached',
            rawBytes: rawBuf,
            syntheticFallbackUsed: false
          };
        }
      }
      return {
        status: 'binary_decoder_required',
        source: 'NASA_GPM_IMERG_V07',
        authenticated: Boolean(earthdataToken),
        syntheticFallbackUsed: false,
        diagnostics: {
          reason: 'native_binary_requires_bounded_parser',
          cmrQueryUrl: cmrUrl,
          message:
            'GPM NetCDF/OPeNDAP product cannot be parsed as JSON; valid NetCDF-3/NetCDF-4/HDF5 stream required.'
        },
        records: [],
        observations: []
      };
    }

    const payload = await dataResp.json();
    const normalized = normalizeGpmImergV07Dataset(payload, {
      latitude,
      longitude,
      startDate,
      endDate
    });
    const isRealGlobalFetch = fetchImpl === globalThis.fetch;
    return {
      ...normalized,
      status: isRealGlobalFetch ? 'ok' : 'unverified_payload',
      authenticated: isRealGlobalFetch,
      evidenceKind: isRealGlobalFetch ? 'observed' : 'assumed',
      syntheticFallbackUsed: false
    };
  } catch (error) {
    return {
      source: 'NASA_GPM_IMERG_V07',
      shortName,
      version: '07',
      status: 'network_blocked_or_offline',
      authenticated: Boolean(earthdataToken),
      syntheticFallbackUsed: false,
      diagnostics: {
        reason: `Outbound network access blocked or failed: ${error?.message || String(error)}`,
        earthdataLoginRequired: true,
        cmrQueryUrl: cmrUrl,
        message:
          'Cannot reach NASA Earthdata CMR / GES DISC from sandbox environment; no synthetic data substituted.'
      },
      coverage: evaluateImergCoverageAndQuality({
        records: [],
        startDate,
        endDate,
        latitude,
        longitude
      }),
      records: []
    };
  }
}

export {
  decodeImergNetCdf4Binary,
  encodeImergNetCdf4BinaryGranule,
  buildStandardNetCdf3TestGranule,
  parseNetCdf3BinaryBuffer,
  buildImergOpendapSubsetUrl,
  snapToImergGridCenter,
  computeRawSha256,
  toRawBuffer
};
