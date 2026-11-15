/**
 * @file adapters/hls-optical.js
 * @description NASA Harmonized Landsat Sentinel-2 (HLS v2.0 `HLSL30` / `HLSS30`) adapter
 * with separate single-band Cloud-Optimized GeoTIFF (`B04` + `B05`/`B8A` + `Fmask`) assembly,
 * scene date/tile/alignment verification, SHA-256 hashing, and all PR #17 safety guards.
 */

import {
  decodeHlsFmaskByte,
  decodeHlsGeoTiffBinary,
  decodeSingleBandHlsGeoTiff,
  encodeSingleBandHlsGeoTiff,
  encodeHlsGeoTiffBandTriplet,
  encodeHlsGeoTiffBinaryScene,
  parseHlsAssetNomenclature,
  isGeoTiffBinary,
  HLS_REFLECTANCE_SCALE_FACTOR,
  HLS_REFLECTANCE_FILL_VALUE,
  HLS_FMASK_FILL_VALUE
} from './hls-geotiff-reader.js';

export const HLS_V2_SPEC = Object.freeze({
  version: '2.0',
  collections: {
    landsat30m: {
      shortName: 'HLSL30',
      doi: '10.5067/HLS/HLSL30.002',
      resolutionMeters: 30,
      redBand: 'B04',
      nirBand: 'B05'
    },
    sentinel30m: {
      shortName: 'HLSS30',
      doi: '10.5067/HLS/HLSS30.002',
      resolutionMeters: 30,
      redBand: 'B04',
      nirBand: 'B8A'
    }
  },
  cmrGranulesEndpoint: 'https://cmr.earthdata.nasa.gov/search/granules.json',
  scaleFactor: HLS_REFLECTANCE_SCALE_FACTOR,
  fillValue: HLS_REFLECTANCE_FILL_VALUE,
  fmaskFillValue: HLS_FMASK_FILL_VALUE,
  minClearPixelRatio: 0.7
});

export function decodeHlsFmask(fmaskByte) {
  return decodeHlsFmaskByte(fmaskByte);
}

export function scaleAndValidateReflectance(rawOrScaledValue, options = {}) {
  const isAlreadyScaled = Boolean(options.isAlreadyScaled);
  if (
    rawOrScaledValue === null ||
    rawOrScaledValue === undefined ||
    typeof rawOrScaledValue !== 'number' ||
    !Number.isFinite(rawOrScaledValue)
  ) {
    return { valid: false, reflectance: null, reason: 'non_numeric_or_null' };
  }

  if (!isAlreadyScaled && Math.abs(rawOrScaledValue - HLS_REFLECTANCE_FILL_VALUE) < 1) {
    return { valid: false, reflectance: null, reason: 'hls_fill_value' };
  }

  const scaled = isAlreadyScaled
    ? rawOrScaledValue
    : Number((rawOrScaledValue * HLS_REFLECTANCE_SCALE_FACTOR).toFixed(6));

  if (scaled <= 0 || scaled > 1.0) {
    return { valid: false, reflectance: null, reason: 'out_of_physical_reflectance_bounds' };
  }

  return { valid: true, reflectance: scaled, reason: null };
}

export function processHlsObservation(obs = {}) {
  if (obs.fmask === undefined || obs.fmask === null) {
    return {
      date: obs.date || null,
      valid: false,
      usableClear: false,
      ndvi: null,
      qualityFlag: 'missing_fmask_qa',
      canInferBareSoilDirectly: false,
      canInferSalinityDirectly: false
    };
  }

  const fmaskDecoded = decodeHlsFmask(Number(obs.fmask));
  if (!fmaskDecoded.usableClearLand) {
    return {
      date: obs.date || null,
      valid: false,
      usableClear: false,
      ndvi: null,
      fmask: fmaskDecoded,
      qualityFlag: 'masked_by_fmask_qa',
      canInferBareSoilDirectly: false,
      canInferSalinityDirectly: false
    };
  }

  const isAlreadyScaled = Boolean(obs.isAlreadyScaled);
  const redRes = scaleAndValidateReflectance(
    obs.red !== undefined ? obs.red : obs.B04,
    { isAlreadyScaled }
  );
  const nirRes = scaleAndValidateReflectance(
    obs.nir !== undefined ? obs.nir : obs.B08 ?? obs.B8A ?? obs.B05,
    { isAlreadyScaled }
  );

  if (!redRes.valid || !nirRes.valid) {
    return {
      date: obs.date || null,
      valid: false,
      usableClear: false,
      ndvi: null,
      fmask: fmaskDecoded,
      qualityFlag: redRes.reason || nirRes.reason || 'invalid_band_reflectance',
      canInferBareSoilDirectly: false,
      canInferSalinityDirectly: false
    };
  }

  const denom = nirRes.reflectance + redRes.reflectance;
  if (denom <= 1e-6) {
    return {
      date: obs.date || null,
      valid: false,
      usableClear: false,
      ndvi: null,
      fmask: fmaskDecoded,
      qualityFlag: 'invalid_ndvi_denominator',
      canInferBareSoilDirectly: false,
      canInferSalinityDirectly: false
    };
  }

  const ndvi = Number(((nirRes.reflectance - redRes.reflectance) / denom).toFixed(4));
  return {
    date: obs.date || null,
    valid: true,
    usableClear: true,
    redSurfaceReflectance: redRes.reflectance,
    nirSurfaceReflectance: nirRes.reflectance,
    ndvi,
    fmask: fmaskDecoded,
    qualityFlag: 'clear_qa_verified',
    canInferBareSoilDirectly: false,
    canInferSalinityDirectly: false
  };
}

export function normalizeHlsDataset(rawDataset = {}, options = {}) {
  const rawList = Array.isArray(rawDataset.observations)
    ? rawDataset.observations
    : Array.isArray(rawDataset.records)
      ? rawDataset.records
      : [];

  const processed = rawList.map((item) => processHlsObservation(item));
  const validClear = processed.filter((p) => p.valid && p.usableClear);
  const clearRatio =
    processed.length > 0 ? Number((validClear.length / processed.length).toFixed(4)) : 0;

  return {
    source: 'NASA_HLS_V2',
    version: '2.0',
    observations: processed,
    records: processed,
    coverage: {
      totalOverpassScenes: processed.length,
      validClearScenesCount: validClear.length,
      clearSceneRatio: clearRatio,
      fraction: clearRatio,
      passesCoverageThreshold: clearRatio >= (options.minClearSceneRatio ?? 0.35) && validClear.length > 0
    }
  };
}

/**
 * Queries NASA LPCLOUD CMR / COG storage and assembles the 3 separate band COGs
 * (`B04.tif`, `B05.tif`/`B8A.tif`, `Fmask.tif`) for the same scene.
 *
 * Safety guards:
 * - Never treats a single `.tif` file as all three HLS bands.
 * - Never allows `authenticatedLiveTransport` or any caller boolean to turn local fixtures into `observed`/`live`.
 */
export async function fetchHlsOpticalSeries(params = {}) {
  const {
    latitude,
    longitude,
    startDate,
    endDate,
    earthdataToken = process.env.EARTHDATA_TOKEN || process.env.NASA_EARTHDATA_TOKEN || null,
    verifiedHlsPayload = null,
    binaryGeoTiffBytes = null,
    binaryBandTriplet = null,
    fetchImpl = globalThis.fetch
  } = params;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('fetchHlsOpticalSeries requires finite numeric latitude and longitude');
  }

  // Guard 1: Caller-supplied JSON fixture is never authenticated as live NASA
  if (verifiedHlsPayload) {
    const normalized = normalizeHlsDataset(verifiedHlsPayload, params);
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
        message: 'Processed caller-supplied HLS payload as unverified/assumed.'
      }
    };
  }

  // Guard 2: Caller-supplied binary GeoTIFF triplet (or single .tif rejected by decodeHlsGeoTiffBinary)
  const localBinaryInput = binaryBandTriplet || binaryGeoTiffBytes;
  if (localBinaryInput) {
    const decoded = decodeHlsGeoTiffBinary(localBinaryInput, params);
    if (!decoded.valid) {
      return {
        ...decoded,
        source: 'NASA_HLS_V2',
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
        accessMode: 'binary_geotiff_triplet_local_unverified_origin',
        earthdataLoginRequired: true,
        message:
          'Decoded local 3-band HLS GeoTIFF triplet (Red + NIR + Fmask); marked unverified_payload/assumed because it was not fetched from live Earthdata.'
      }
    };
  }

  const bbox = `${(longitude - 0.01).toFixed(4)},${(latitude - 0.01).toFixed(4)},${(longitude + 0.01).toFixed(4)},${(latitude + 0.01).toFixed(4)}`;
  const cmrUrl = `${HLS_V2_SPEC.cmrGranulesEndpoint}?short_name[]=HLSL30&short_name[]=HLSS30&version=2.0&temporal=${startDate}T00:00:00Z,${endDate}T23:59:59Z&bounding_box=${bbox}&page_size=200`;

  if (typeof fetchImpl !== 'function') {
    return {
      source: 'NASA_HLS_V2',
      status: 'unavailable',
      authenticated: Boolean(earthdataToken),
      syntheticFallbackUsed: false,
      diagnostics: {
        reason: 'fetch_implementation_unavailable',
        earthdataLoginRequired: true,
        cmrQueryUrl: cmrUrl,
        message: 'No HTTP fetch implementation available; refusing to fabricate HLS NDVI.'
      },
      coverage: {
        totalOverpassScenes: 0,
        validClearScenesCount: 0,
        passesCoverageThreshold: false
      },
      observations: []
    };
  }

  try {
    const cmrResp = await fetchImpl(cmrUrl, {
      headers: { Accept: 'application/json' }
    });
    if (!cmrResp.ok) {
      return {
        source: 'NASA_HLS_V2',
        status: 'cmr_http_error',
        httpStatus: cmrResp.status,
        authenticated: Boolean(earthdataToken),
        syntheticFallbackUsed: false,
        diagnostics: {
          reason: `LPCLOUD CMR returned HTTP ${cmrResp.status}`,
          earthdataLoginRequired: true,
          cmrQueryUrl: cmrUrl
        },
        coverage: {
          totalOverpassScenes: 0,
          validClearScenesCount: 0,
          passesCoverageThreshold: false
        },
        observations: []
      };
    }

    const cmrJson = await cmrResp.json();
    const entries = cmrJson?.feed?.entry || [];

    if (entries.length === 0) {
      return {
        source: 'NASA_HLS_V2',
        status: 'no_granules_found',
        authenticated: Boolean(earthdataToken),
        syntheticFallbackUsed: false,
        diagnostics: {
          reason: 'zero_hls_granules_in_window',
          earthdataLoginRequired: true,
          cmrQueryUrl: cmrUrl
        },
        coverage: {
          totalOverpassScenes: 0,
          validClearScenesCount: 0,
          passesCoverageThreshold: false
        },
        observations: []
      };
    }

    if (!earthdataToken) {
      return {
        source: 'NASA_HLS_V2',
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
            'LPCLOUD CMR discovered HLSL30/HLSS30 v2.0 granules, but reading Cloud Optimized GeoTIFF (COG) bands requires NASA Earthdata Login Bearer token (EARTHDATA_TOKEN). No synthetic NDVI generated.'
        },
        coverage: {
          totalOverpassScenes: entries.length,
          validClearScenesCount: 0,
          passesCoverageThreshold: false
        },
        observations: []
      };
    }

    const firstEntry = entries[0];
    const links = firstEntry.links || [];
    const redLink = links.find((l) => l.href && /\.B04\.tif$/i.test(l.href.split('?')[0]));
    const nirLink = links.find(
      (l) => l.href && /\.(B05|B8A|B08)\.tif$/i.test(l.href.split('?')[0])
    );
    const fmaskLink = links.find((l) => l.href && /\.Fmask\.tif$/i.test(l.href.split('?')[0]));

    const primaryUrl = redLink ? redLink.href : fmaskLink ? fmaskLink.href : cmrUrl;
    const cogResp = await fetchImpl(primaryUrl, {
      headers: { Authorization: `Bearer ${earthdataToken}` }
    });

    if (cogResp.status === 401 || cogResp.status === 403) {
      return {
        source: 'NASA_HLS_V2',
        status: 'auth_rejected',
        httpStatus: cogResp.status,
        authenticated: false,
        syntheticFallbackUsed: false,
        discoveredGranulesCount: entries.length,
        diagnostics: {
          reason: `LP DAAC Cumulus rejected Earthdata token with HTTP ${cogResp.status}`,
          earthdataLoginRequired: true,
          cmrQueryUrl: cmrUrl
        },
        coverage: {
          totalOverpassScenes: entries.length,
          validClearScenesCount: 0,
          passesCoverageThreshold: false
        },
        observations: []
      };
    }

    const responseType = (cogResp.headers?.get?.('content-type') || '').toLowerCase();
    if (!responseType.includes('json')) {
      // A complete HLS scene requires all 3 separate band links (Red B04, NIR B05/B8A, Fmask)
      // AND binary arrayBuffer() support on all 3 responses!
      if (
        redLink &&
        nirLink &&
        fmaskLink &&
        typeof cogResp.arrayBuffer === 'function'
      ) {
        const [nirResp, fmaskResp] = await Promise.all([
          fetchImpl(nirLink.href, { headers: { Authorization: `Bearer ${earthdataToken}` } }),
          fetchImpl(fmaskLink.href, { headers: { Authorization: `Bearer ${earthdataToken}` } })
        ]);
        if (
          nirResp.ok &&
          fmaskResp.ok &&
          typeof nirResp.arrayBuffer === 'function' &&
          typeof fmaskResp.arrayBuffer === 'function'
        ) {
          const [redBuf, nirBuf, fmaskBuf] = await Promise.all([
            cogResp.arrayBuffer().then((ab) => Buffer.from(ab)),
            nirResp.arrayBuffer().then((ab) => Buffer.from(ab)),
            fmaskResp.arrayBuffer().then((ab) => Buffer.from(ab))
          ]);
          const decoded = decodeHlsGeoTiffBinary(
            {
              redCogBytes: redBuf,
              nirCogBytes: nirBuf,
              fmaskCogBytes: fmaskBuf,
              redAssetName: redLink.href,
              nirAssetName: nirLink.href,
              fmaskAssetName: fmaskLink.href
            },
            params
          );
          if (decoded.valid) {
            const isRealGlobalFetch = fetchImpl === globalThis.fetch;
            return {
              ...decoded,
              status: isRealGlobalFetch ? 'ok' : 'unverified_payload',
              authenticated: isRealGlobalFetch,
              evidenceKind: isRealGlobalFetch ? 'observed' : 'assumed',
              delivery: isRealGlobalFetch ? 'live' : 'cached',
              syntheticFallbackUsed: false
            };
          }
        }
      }

      return {
        status: 'binary_decoder_required',
        source: 'NASA_HLS_V2',
        authenticated: Boolean(earthdataToken),
        syntheticFallbackUsed: false,
        diagnostics: {
          reason: 'native_binary_requires_bounded_parser',
          cmrQueryUrl: cmrUrl,
          message:
            'HLS GeoTIFF product cannot be parsed as JSON; requires all three separate band COGs (Red B04, NIR B05/B8A, and Fmask) with verified spatial alignment.'
        },
        records: [],
        observations: []
      };
    }

    const payload = await cogResp.json();
    const normalized = normalizeHlsDataset(payload, params);
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
      source: 'NASA_HLS_V2',
      status: 'network_blocked_or_offline',
      authenticated: Boolean(earthdataToken),
      syntheticFallbackUsed: false,
      diagnostics: {
        reason: `Outbound network access blocked or failed: ${error?.message || String(error)}`,
        earthdataLoginRequired: true,
        cmrQueryUrl: cmrUrl,
        message:
          'Cannot reach NASA LPCLOUD CMR / COG storage from sandbox environment; no synthetic HLS data substituted.'
      },
      coverage: {
        totalOverpassScenes: 0,
        validClearScenesCount: 0,
        passesCoverageThreshold: false
      },
      observations: []
    };
  }
}

export {
  decodeHlsFmaskByte,
  decodeHlsGeoTiffBinary,
  decodeSingleBandHlsGeoTiff,
  encodeSingleBandHlsGeoTiff,
  encodeHlsGeoTiffBandTriplet,
  encodeHlsGeoTiffBinaryScene,
  parseHlsAssetNomenclature,
  isGeoTiffBinary
};
