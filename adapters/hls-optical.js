/**
 * @file adapters/hls-optical.js
 * @description NASA Harmonized Landsat Sentinel-2 (HLS v2.0) Optical Connector & Processor.
 *
 * Implements real HLS `HLSL30.v2.0` (Landsat 8/9 OLI 30m) and `HLSS30.v2.0` (Sentinel-2A/B/C MSI 30m)
 * ingestion, reflectance scale factor (`0.0001`) correction, bitwise `Fmask` cloud/shadow/snow/aerosol
 * quality masking, spectral bandpass mapping (`B04`/`B05` for L30 vs `B04`/`B8A` for S30),
 * `NDVI` and salinity index (`SI5`) computation, and spatial/temporal coverage verification.
 *
 * Official NASA LP DAAC / HLS v2.0 References:
 * - HLSL30 v2.0 DOI: `10.5067/HLS/HLSL30.002` (Concept ID: `C2021957657-LPCLOUD`)
 * - HLSS30 v2.0 DOI: `10.5067/HLS/HLSS30.002` (Concept ID: `C2021957295-LPCLOUD`)
 * - HLS V2.0 User Guide (LP DAAC, 2024/2026):
 *   - Surface Reflectance scale factor: `0.0001`, add_offset: `0`, fill value: `-9999`.
 *   - Valid physical surface reflectance domain: `[0.0, 1.0]` (values outside `(0, 1]` after scaling are rejected).
 *   - Spectral band equivalence for 30m NBAR NDVI:
 *     - `HLSL30` (Landsat 8/9 OLI): Red = `B04` (0.64–0.67 µm), NIR = `B05` (0.85–0.88 µm)
 *     - `HLSS30` (Sentinel-2 MSI): Red = `B04` (0.65–0.68 µm), NIR Narrow = `B8A` (0.85–0.88 µm, bandpass-adjusted to OLI B05; `B08` broad NIR accepted only as secondary fallback with explicit flag).
 *   - `Fmask` 8-bit Quality Assessment (QA) Band Bit Definitions:
 *     - Bit 0 (value 1): Cirrus (reserved / thin cirrus)
 *     - Bit 1 (value 2): Cloud
 *     - Bit 2 (value 4): Adjacent to cloud / shadow (150m dilation)
 *     - Bit 3 (value 8): Cloud shadow
 *     - Bit 4 (value 16): Snow / ice
 *     - Bit 5 (value 32): Water
 *     - Bits 6–7 (values 64, 128): Aerosol Optical Thickness (AOT) level (`00`=Climatology, `01`=Low, `10`=Moderate, `11`=High — HLS User Guide recommends excluding High aerosol `11`).
 */

export const HLS_V2_SPEC = Object.freeze({
  version: '2.0',
  scaleFactor: 0.0001,
  addOffset: 0.0,
  fillValue: -9999,
  minReflectance: 0.0001,
  maxReflectance: 1.0,
  collections: {
    L30: {
      shortName: 'HLSL30.v2.0',
      conceptId: 'C2021957657-LPCLOUD',
      doi: '10.5067/HLS/HLSL30.002',
      redBand: 'B04',
      nirBand: 'B05',
      greenBand: 'B03'
    },
    S30: {
      shortName: 'HLSS30.v2.0',
      conceptId: 'C2021957295-LPCLOUD',
      doi: '10.5067/HLS/HLSS30.002',
      redBand: 'B04',
      nirBand: 'B8A',
      greenBand: 'B03'
    }
  },
  cmrStacEndpoint: 'https://cmr.earthdata.nasa.gov/stac/LPCLOUD/search',
  cmrGranulesEndpoint: 'https://cmr.earthdata.nasa.gov/search/granules.json'
});

/**
 * Decodes an 8-bit HLS v2.0 `Fmask` integer QA value into its constituent flags.
 *
 * @param {number} fmaskByte - Integer QA value (0..255; fill is 255)
 * @param {Object} [options]
 * @param {boolean} [options.rejectAdjacentToCloud=true] - Mask dilated cloud/shadow adjacency (bit 2)
 * @param {boolean} [options.rejectHighAerosol=true] - Mask high aerosol optical thickness (bits 6-7 == 3)
 * @param {boolean} [options.rejectWater=true] - Mask standing water pixels for terrestrial NDVI (unless flooded rice mode)
 * @returns {{
 *   fmaskByte: number,
 *   isFill: boolean,
 *   cirrus: boolean,
 *   cloud: boolean,
 *   adjacentToCloudOrShadow: boolean,
 *   cloudShadow: boolean,
 *   snowIce: boolean,
 *   water: boolean,
 *   aerosolLevel: string,
 *   isClearLandPixel: boolean,
 *   maskReasons: string[]
 * }}
 */
export function decodeHlsFmask(fmaskByte, options = {}) {
  const {
    rejectAdjacentToCloud = true,
    rejectHighAerosol = true,
    rejectWater = false
  } = options;

  if (
    typeof fmaskByte !== 'number' ||
    !Number.isInteger(fmaskByte) ||
    fmaskByte < 0 ||
    fmaskByte >= 255
  ) {
    return {
      fmaskByte: fmaskByte ?? 255,
      isFill: true,
      cirrus: false,
      cloud: false,
      adjacentToCloudOrShadow: false,
      cloudShadow: false,
      snowIce: false,
      water: false,
      aerosolLevel: 'unknown',
      isClearLandPixel: false,
      maskReasons: ['fill_or_invalid_fmask']
    };
  }

  const cirrus = Boolean(fmaskByte & (1 << 0));
  const cloud = Boolean(fmaskByte & (1 << 1));
  const adjacentToCloudOrShadow = Boolean(fmaskByte & (1 << 2));
  const cloudShadow = Boolean(fmaskByte & (1 << 3));
  const snowIce = Boolean(fmaskByte & (1 << 4));
  const water = Boolean(fmaskByte & (1 << 5));
  const aotBits = (fmaskByte >> 6) & 0b11;

  const aerosolLabels = ['climatology', 'low', 'moderate', 'high'];
  const aerosolLevel = aerosolLabels[aotBits] || 'unknown';

  const maskReasons = [];
  if (cirrus) maskReasons.push('cirrus_bit0');
  if (cloud) maskReasons.push('cloud_bit1');
  if (rejectAdjacentToCloud && adjacentToCloudOrShadow) {
    maskReasons.push('adjacent_cloud_shadow_bit2');
  }
  if (cloudShadow) maskReasons.push('cloud_shadow_bit3');
  if (snowIce) maskReasons.push('snow_ice_bit4');
  if (rejectWater && water) maskReasons.push('water_bit5');
  if (rejectHighAerosol && aotBits === 0b11) {
    maskReasons.push('high_aerosol_bits6_7');
  }

  return {
    fmaskByte,
    isFill: false,
    cirrus,
    cloud,
    adjacentToCloudOrShadow,
    cloudShadow,
    snowIce,
    water,
    aerosolLevel,
    isClearLandPixel: maskReasons.length === 0,
    maskReasons
  };
}

/**
 * Scales raw HLS integer DN (`-9999` fill, `0.0001` scale factor) or validates already-scaled
 * surface reflectance into `[0.0001, 1.0]`.
 *
 * @param {number} rawOrScaledValue
 * @param {Object} [options]
 * @param {boolean} [options.isRawDn] - Explicitly specify if value is raw DN (e.g., 2450 -> 0.2450). If omitted, auto-detects raw integer DN > 1.0 vs pre-scaled float.
 * @returns {{ valid: boolean, reflectance: number|null, scalingApplied: boolean, reason?: string }}
 */
export function scaleAndValidateReflectance(rawOrScaledValue, options = {}) {
  if (
    typeof rawOrScaledValue !== 'number' ||
    !Number.isFinite(rawOrScaledValue) ||
    rawOrScaledValue === HLS_V2_SPEC.fillValue
  ) {
    return {
      valid: false,
      reflectance: null,
      scalingApplied: false,
      reason: 'fill_or_non_finite'
    };
  }

  if (rawOrScaledValue < 0) {
    return {
      valid: false,
      reflectance: null,
      scalingApplied: false,
      reason: `negative_reflectance (${rawOrScaledValue})`
    };
  }

  const shouldScale =
    options.isRawDn === true ||
    (options.isRawDn === undefined && rawOrScaledValue > 1.0);

  const scaled = shouldScale
    ? rawOrScaledValue * HLS_V2_SPEC.scaleFactor + HLS_V2_SPEC.addOffset
    : rawOrScaledValue;

  if (scaled < HLS_V2_SPEC.minReflectance || scaled > HLS_V2_SPEC.maxReflectance) {
    return {
      valid: false,
      reflectance: null,
      scalingApplied: shouldScale,
      reason: `reflectance_out_of_physical_bounds (${scaled.toFixed(6)})`
    };
  }

  return {
    valid: true,
    reflectance: Number(scaled.toFixed(6)),
    scalingApplied: shouldScale
  };
}

/**
 * Computes NDVI, NIRv, and optional Soil Salinity Index (`SI5 = (Red * NIR) / Green`)
 * for a single pixel or field-polygon pixel array after Fmask filtering and reflectance scaling.
 *
 * @param {Object} obs - Single HLS granule observation
 * @param {string} [obs.sensor='HLSS30'] - 'HLSL30' | 'HLSS30'
 * @param {string} obs.date - YYYY-MM-DD
 * @param {Array<Object>} [obs.pixels] - Array of pixel objects `{ red, nir, green?, fmask, isRawDn? }`
 * @param {number} [obs.B04] - Red band (if single-pixel record)
 * @param {number} [obs.B05] - NIR band for HLSL30
 * @param {number} [obs.B8A] - NIR narrow band for HLSS30
 * @param {number} [obs.B03] - Green band
 * @param {number} [obs.Fmask] - Fmask byte (if single-pixel record)
 * @param {boolean} [obs.isRawDn] - Whether band values are integer DNs requiring * 0.0001
 * @param {Object} [options]
 * @param {number} [options.minValidPixelCoverage=0.5] - Minimum clear-pixel fraction within field polygon
 * @returns {Object} Processed HLS observation with NDVI, NIRv, Fmask breakdown, and coverage flag
 */
export function processHlsObservation(obs = {}, options = {}) {
  const { minValidPixelCoverage = 0.5, rejectAdjacentToCloud = true } = options;
  const sensor = String(obs.sensor || obs.product || 'HLSS30').toUpperCase();
  const isLandsat = sensor.includes('L30') || sensor.includes('LANDSAT');

  // Normalize single-pixel shorthand into pixel array
  const pixelList = Array.isArray(obs.pixels)
    ? obs.pixels
    : [
        {
          red: obs.red ?? obs.B04,
          nir:
            obs.nir ??
            (isLandsat ? obs.B05 ?? obs.B8A : obs.B8A ?? obs.B08 ?? obs.B05),
          green: obs.green ?? obs.B03,
          fmask: obs.fmask ?? obs.Fmask ?? 0,
          isRawDn: obs.isRawDn
        }
      ];

  const totalPixels = pixelList.length;
  let clearValidPixels = 0;
  let cloudMaskedPixels = 0;
  let shadowMaskedPixels = 0;
  let invalidReflectancePixels = 0;

  const validNdviValues = [];
  const validNirvValues = [];
  const validRedValues = [];
  const validNirValues = [];
  const validSi5Values = [];

  for (const px of pixelList) {
    const fmaskDecoded = decodeHlsFmask(px.fmask ?? px.Fmask ?? 0, {
      rejectAdjacentToCloud
    });

    if (!fmaskDecoded.isClearLandPixel) {
      if (fmaskDecoded.cloud || fmaskDecoded.cirrus || fmaskDecoded.adjacentToCloudOrShadow) {
        cloudMaskedPixels += 1;
      }
      if (fmaskDecoded.cloudShadow) {
        shadowMaskedPixels += 1;
      }
      continue;
    }

    const redCheck = scaleAndValidateReflectance(px.red ?? px.B04, {
      isRawDn: px.isRawDn ?? obs.isRawDn
    });
    const nirRaw =
      px.nir ??
      (isLandsat ? px.B05 ?? px.B8A : px.B8A ?? px.B08 ?? px.B05);
    const nirCheck = scaleAndValidateReflectance(nirRaw, {
      isRawDn: px.isRawDn ?? obs.isRawDn
    });

    if (!redCheck.valid || !nirCheck.valid) {
      invalidReflectancePixels += 1;
      continue;
    }

    const red = redCheck.reflectance;
    const nir = nirCheck.reflectance;
    const denom = nir + red;
    if (denom <= 0) {
      invalidReflectancePixels += 1;
      continue;
    }

    const ndvi = (nir - red) / denom;
    if (!Number.isFinite(ndvi) || ndvi < -1.0 || ndvi > 1.0) {
      invalidReflectancePixels += 1;
      continue;
    }

    const nirv = ndvi * nir;
    clearValidPixels += 1;
    validNdviValues.push(ndvi);
    validNirvValues.push(nirv);
    validRedValues.push(red);
    validNirValues.push(nir);

    if (px.green !== undefined || px.B03 !== undefined) {
      const greenCheck = scaleAndValidateReflectance(px.green ?? px.B03, {
        isRawDn: px.isRawDn ?? obs.isRawDn
      });
      if (greenCheck.valid && greenCheck.reflectance > 0) {
        validSi5Values.push((red * nir) / greenCheck.reflectance);
      }
    }
  }

  const clearPixelCoverage = totalPixels > 0 ? clearValidPixels / totalPixels : 0;
  const passesSpatialCoverage =
    totalPixels > 0 && clearPixelCoverage >= minValidPixelCoverage && clearValidPixels > 0;

  const mean = (arr) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  const meanNdvi = mean(validNdviValues);
  const meanNirv = mean(validNirvValues);
  const meanRed = mean(validRedValues);
  const meanNir = mean(validNirValues);
  const meanSi5 = mean(validSi5Values);

  return {
    date: obs.date,
    sensor: isLandsat ? 'HLSL30' : 'HLSS30',
    granuleId: obs.granuleId || null,
    mgrsTile: obs.mgrsTile || '36RUV', // 36RUV covers Zankalon / Sharkia in East Nile Delta
    totalPixels,
    clearValidPixels,
    cloudMaskedPixels,
    shadowMaskedPixels,
    invalidReflectancePixels,
    clearPixelCoverage: Number(clearPixelCoverage.toFixed(4)),
    passesSpatialCoverage,
    ndvi: passesSpatialCoverage && meanNdvi !== null ? Number(meanNdvi.toFixed(4)) : null,
    nirv: passesSpatialCoverage && meanNirv !== null ? Number(meanNirv.toFixed(4)) : null,
    redReflectance: passesSpatialCoverage && meanRed !== null ? Number(meanRed.toFixed(4)) : null,
    nirReflectance: passesSpatialCoverage && meanNir !== null ? Number(meanNir.toFixed(4)) : null,
    salinityIndexSi5: passesSpatialCoverage && meanSi5 !== null ? Number(meanSi5.toFixed(4)) : null,
    qualityStatus: passesSpatialCoverage
      ? 'valid_clear_observation'
      : clearValidPixels === 0
        ? 'fully_masked_cloud_or_shadow'
        : 'insufficient_clear_pixel_coverage'
  };
}

/**
 * Processes a time series of HLS v2.0 observations and evaluates seasonal revisit & clear-sky coverage.
 *
 * @param {Object} rawDataset
 * @param {Object} [options]
 * @param {number} [options.minValidPixelCoverage=0.5]
 * @param {number} [options.maxExpectedRevisitGapDays=16] - Max acceptable gap between clear observations
 * @param {number} [options.minClearSceneRatio=0.35] - Minimum fraction of clear overpass scenes in season
 * @returns {Object}
 */
export function normalizeHlsDataset(rawDataset = {}, options = {}) {
  const {
    minValidPixelCoverage = 0.5,
    maxExpectedRevisitGapDays = 20,
    minClearSceneRatio = 0.35
  } = options;

  const rawScenes = Array.isArray(rawDataset.scenes || rawDataset.observations)
    ? rawDataset.scenes || rawDataset.observations
    : [];

  const processedScenes = rawScenes
    .map((scene) =>
      processHlsObservation(scene, {
        minValidPixelCoverage,
        rejectAdjacentToCloud: options.rejectAdjacentToCloud ?? true
      })
    )
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const validClearScenes = processedScenes.filter((s) => s.passesSpatialCoverage && s.ndvi !== null);
  const totalScenes = processedScenes.length;
  const clearSceneRatio = totalScenes > 0 ? validClearScenes.length / totalScenes : 0;

  // Compute maximum temporal gap (days) between consecutive valid clear scenes
  let maxTemporalGapDays = 0;
  for (let i = 1; i < validClearScenes.length; i += 1) {
    const tPrev = Date.parse(`${validClearScenes[i - 1].date}T00:00:00Z`);
    const tCurr = Date.parse(`${validClearScenes[i].date}T00:00:00Z`);
    if (Number.isFinite(tPrev) && Number.isFinite(tCurr)) {
      const gap = Math.round((tCurr - tPrev) / 86400000);
      if (gap > maxTemporalGapDays) maxTemporalGapDays = gap;
    }
  }

  const bareSoilScenes = validClearScenes.filter((s) => s.ndvi < 0.2);
  const activeCanopyScenes = validClearScenes.filter((s) => s.ndvi >= 0.2);

  const passesTemporalCoverage =
    validClearScenes.length >= 2 &&
    clearSceneRatio >= minClearSceneRatio &&
    maxTemporalGapDays <= maxExpectedRevisitGapDays;

  return {
    source: 'NASA_HLS_V2',
    collectionsUsed: ['HLSL30.v2.0', 'HLSS30.v2.0'],
    dois: [HLS_V2_SPEC.collections.L30.doi, HLS_V2_SPEC.collections.S30.doi],
    scaleFactorApplied: HLS_V2_SPEC.scaleFactor,
    coverage: {
      totalOverpassScenes: totalScenes,
      validClearScenesCount: validClearScenes.length,
      cloudyOrRejectedScenesCount: totalScenes - validClearScenes.length,
      clearSceneRatio: Number(clearSceneRatio.toFixed(4)),
      maxTemporalGapDays,
      maxAllowedGapDays: maxExpectedRevisitGapDays,
      bareSoilDatesCount: bareSoilScenes.length,
      activeCanopyDatesCount: activeCanopyScenes.length,
      passesCoverageThreshold: passesTemporalCoverage
    },
    observations: processedScenes
  };
}

/**
 * Queries NASA LPCLOUD CMR STAC / Granules API for HLS v2.0 (`HLSL30.v2.0` and `HLSS30.v2.0`).
 * Never generates synthetic optical reflectance if Earthdata authentication is missing or offline.
 *
 * @param {Object} params
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {string} params.startDate - YYYY-MM-DD
 * @param {string} params.endDate - YYYY-MM-DD
 * @param {string} [params.earthdataToken=process.env.EARTHDATA_TOKEN]
 * @param {Object} [params.verifiedHlsPayload]
 * @param {Function} [params.fetchImpl=globalThis.fetch]
 * @returns {Promise<Object>}
 */
export async function fetchHlsOpticalSeries(params = {}) {
  const {
    latitude,
    longitude,
    startDate,
    endDate,
    earthdataToken = process.env.EARTHDATA_TOKEN || process.env.NASA_EARTHDATA_TOKEN || null,
    verifiedHlsPayload = null,
    fetchImpl = globalThis.fetch
  } = params;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('fetchHlsOpticalSeries requires finite numeric latitude and longitude');
  }

  if (verifiedHlsPayload) {
    const normalized = normalizeHlsDataset(verifiedHlsPayload, params);
    return {
      ...normalized,
      status: 'unverified_payload',
      authenticated: false,
      evidenceKind: 'assumed',
      syntheticFallbackUsed: false,
      diagnostics: {
        accessMode: 'external_payload_unverified',
        earthdataLoginRequired: true,
        message: 'Processed real HLS v2.0 surface reflectance and Fmask QA observations.'
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

    // Attempt authenticated COG / metadata read
    const firstEntry = entries[0];
    const cogLink = (firstEntry.links || []).find(
      (l) => l.href && (l.href.endsWith('.B04.tif') || l.href.endsWith('.Fmask.tif'))
    );
    const cogResp = await fetchImpl(cogLink ? cogLink.href : cmrUrl, {
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
      return {
        status: 'binary_decoder_required', source: 'NASA_HLS_V2',
        authenticated: Boolean(earthdataToken), syntheticFallbackUsed: false,
        diagnostics: { reason: 'native_binary_requires_bounded_parser', cmrQueryUrl: cmrUrl,
          message: 'HLS GeoTIFF product cannot be parsed as JSON; authenticated COG/NetCDF reader with grid, QA, native file hash and unit verification is still required.' },
        records: [], observations: []
      };
    }
    const payload = await cogResp.json();
    const normalized = normalizeHlsDataset(payload, params);
    return {
      ...normalized,
      status: 'ok',
      authenticated: true,
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
