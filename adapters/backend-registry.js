/**
 * @file adapters/backend-registry.js
 * @description Codex Backend #4 (`docs/contracts/api-v1.md` on `work/backend-evidence`)
 * compliant EO/SAR adapter registry (`createEvidenceService({ store, adapters })` / `SOLIQ_ADAPTER_MODULE`).
 *
 * Addresses PR #17 Review Comment #issuecomment-6897616390:
 * 1. Completely eliminates `options.authenticatedLiveTransport` and any caller-supplied boolean
 *    that could mark an injected local fixture (`imergRawBytes`, `hlsBandTriplet`, `nasaPowerRawBytes`)
 *    or a mocked `fetchImpl` response as `observed` / `live`!
 * 2. Splits trusted live NASA acquisition (`fetchImpl === globalThis.fetch` against official `*.nasa.gov`
 *    HTTPS origins) from offline fixture evaluation (`delivery: 'cached'`, `kind: 'assumed'`).
 * 3. Requires 3 separate single-band COGs (`B04.tif`, `B05.tif`/`B8A.tif`, `Fmask.tif`) for HLS (`HLSL30@2.0`, `HLSS30@2.0`).
 * 4. Uses official NASA GES DISC OPeNDAP bounded subsetting for IMERG (`GPM_3IMERGDF@07`, `GPM_3IMERGDL@07`).
 */

import crypto from 'node:crypto';
import {
  decodeImergNetCdf4Binary,
  buildImergOpendapSubsetUrl,
  toRawBuffer,
  MAX_RAW_GRANULE_BYTES
} from './imerg-netcdf4-reader.js';
import { decodeHlsGeoTiffBinary } from './hls-geotiff-reader.js';

export const REQUIRED_MANIFEST_KEYS = Object.freeze([
  'product',
  'version',
  'kind',
  'delivery',
  'geometry',
  'timeRange',
  'spatialSupport',
  'units',
  'qa',
  'coverage',
  'rawSha256',
  'missingReason',
  'provider',
  'retrievedAt'
]);

const FORBIDDEN_MANIFEST_KEY_PATTERNS = [
  /token/i,
  /secret/i,
  /password/i,
  /authorization/i,
  /signedurl/i,
  /fetchurl/i,
  /cmrqueryurl/i,
  /bearer/i
];

export function validateContractGeometry(geometry) {
  if (!geometry || typeof geometry !== 'object') {
    throw new Error('Invalid geometry: must be a GeoJSON Point or Polygon object');
  }

  if (geometry.type === 'Point') {
    const coords = geometry.coordinates;
    if (
      !Array.isArray(coords) ||
      coords.length < 2 ||
      !Number.isFinite(coords[0]) ||
      !Number.isFinite(coords[1]) ||
      coords[0] < -180 ||
      coords[0] > 180 ||
      coords[1] < -90 ||
      coords[1] > 90
    ) {
      throw new Error('Invalid Point coordinates: expected [lon, lat] in WGS84 bounds');
    }
    return {
      valid: true,
      centroidLat: Number(coords[1]),
      centroidLon: Number(coords[0]),
      bboxSpanLon: 0,
      bboxSpanLat: 0
    };
  }

  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates;
    if (!Array.isArray(rings) || rings.length !== 1) {
      throw new Error('Invalid Polygon: must contain exactly one linear ring (no interior holes)');
    }
    const ring = rings[0];
    if (!Array.isArray(ring) || ring.length < 4 || ring.length > 100) {
      throw new Error('Invalid Polygon ring: must have between 4 and 100 vertices');
    }

    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    for (let i = 0; i < ring.length; i += 1) {
      const pt = ring[i];
      if (
        !Array.isArray(pt) ||
        pt.length < 2 ||
        !Number.isFinite(pt[0]) ||
        !Number.isFinite(pt[1]) ||
        pt[0] < -180 ||
        pt[0] > 180 ||
        pt[1] < -90 ||
        pt[1] > 90
      ) {
        throw new Error(`Invalid Polygon vertex at index ${i}`);
      }
      minLon = Math.min(minLon, pt[0]);
      maxLon = Math.max(maxLon, pt[0]);
      minLat = Math.min(minLat, pt[1]);
      maxLat = Math.max(maxLat, pt[1]);
    }

    const spanLon = maxLon - minLon;
    const spanLat = maxLat - minLat;
    if (spanLon > 2.0 || spanLat > 2.0) {
      throw new Error(
        `Polygon bounding box (${spanLon.toFixed(3)}° x ${spanLat.toFixed(3)}°) exceeds 2.0° contract limit`
      );
    }

    return {
      valid: true,
      centroidLat: Number(((minLat + maxLat) / 2).toFixed(6)),
      centroidLon: Number(((minLon + maxLon) / 2).toFixed(6)),
      bboxSpanLon: Number(spanLon.toFixed(6)),
      bboxSpanLat: Number(spanLat.toFixed(6))
    };
  }

  throw new Error(`Unsupported geometry type: "${geometry.type}" (only Point and Polygon allowed)`);
}

export function validateContractTimeRange(timeRange) {
  if (!timeRange || typeof timeRange !== 'object') {
    throw new Error('Invalid timeRange: must be an object with { start, end }');
  }
  const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRe.test(String(timeRange.start || '')) || !isoDateRe.test(String(timeRange.end || ''))) {
    throw new Error('Invalid timeRange format: start and end must be YYYY-MM-DD');
  }
  const startMs = Date.parse(`${timeRange.start}T00:00:00Z`);
  const endMs = Date.parse(`${timeRange.end}T00:00:00Z`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    throw new Error('Invalid timeRange: end date must be >= start date');
  }
  const days = Math.round((endMs - startMs) / 86400000) + 1;
  if (days > 366) {
    throw new Error(`timeRange span (${days} days) exceeds 366-day contract maximum`);
  }
  return { valid: true, days };
}

export function validateBackendEvidenceEnvelope(envelope) {
  const errors = [];
  if (!envelope || typeof envelope !== 'object') {
    return { valid: false, errors: ['Envelope must be an object'] };
  }
  const { manifest, rawBytes } = envelope;
  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Envelope missing manifest object'] };
  }

  for (const key of REQUIRED_MANIFEST_KEYS) {
    if (!(key in manifest)) {
      errors.push(`Manifest missing required key: ${key}`);
    }
  }

  const inspectKeys = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;
    for (const k of Object.keys(obj)) {
      for (const pat of FORBIDDEN_MANIFEST_KEY_PATTERNS) {
        if (pat.test(k)) {
          errors.push(`Forbidden credential/URL key in manifest: ${path}${k}`);
        }
      }
      if (typeof obj[k] === 'string' && /Bearer\s+(?!token\b)[A-Za-z0-9._-]{8,}/i.test(obj[k])) {
        errors.push(`Forbidden Bearer token string leaked in manifest.${path}${k}`);
      }
      if (typeof obj[k] === 'object' && obj[k] !== null) {
        inspectKeys(obj[k], `${path}${k}.`);
      }
    }
  };
  inspectKeys(manifest);

  if (manifest.delivery === 'unavailable') {
    if (typeof manifest.missingReason !== 'string' || manifest.missingReason.trim().length === 0) {
      errors.push('Unavailable manifest must include a non-empty missingReason');
    }
    if (manifest.rawSha256 !== null) {
      errors.push('Unavailable manifest must have rawSha256: null');
    }
    if (rawBytes !== null && rawBytes !== undefined) {
      errors.push('Unavailable envelope must not return rawBytes');
    }
    if (manifest.qa?.usable !== false) {
      errors.push('Unavailable manifest must set qa.usable: false');
    }
  } else {
    const buf = toRawBuffer(rawBytes);
    if (!buf || buf.byteLength === 0) {
      errors.push(`Delivery "${manifest.delivery}" requires non-empty rawBytes Buffer/Uint8Array`);
    } else if (buf.byteLength > MAX_RAW_GRANULE_BYTES) {
      errors.push(`rawBytes (${buf.byteLength} bytes) exceeds 8 MiB limit`);
    } else {
      const actualHash = crypto.createHash('sha256').update(buf).digest('hex');
      if (manifest.rawSha256 !== actualHash) {
        errors.push(`manifest.rawSha256 (${manifest.rawSha256}) does not match rawBytes SHA-256 (${actualHash})`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function buildUnavailableEnvelope({
  product,
  version,
  geometry,
  timeRange,
  spatialSupport,
  units,
  provider,
  missingReason,
  retrievedAt = new Date().toISOString()
}) {
  return {
    manifest: {
      product,
      version,
      kind: 'observed',
      delivery: 'unavailable',
      geometry,
      timeRange,
      spatialSupport,
      units,
      qa: {
        usable: false,
        status: 'unavailable'
      },
      coverage: {
        fraction: 0
      },
      rawSha256: null,
      missingReason: String(missingReason || 'upstream_source_unavailable'),
      provider,
      retrievedAt
    },
    rawBytes: null
  };
}

/**
 * Creates the Backend #4 adapter registry keyed by `product@version`.
 *
 * Security & Provenance Rule (#issuecomment-6897616390 Point 3):
 * - `options.authenticatedLiveTransport` is BANNED and ignored.
 * - Any caller-injected fixture (`imergRawBytes`, `hlsBandTriplet`, `nasaPowerRawBytes`) or
 *   custom `fetchImpl` (`fetchImpl !== globalThis.fetch`) is strictly constrained to
 *   `kind: 'assumed'` and `delivery: 'cached'` — it can NEVER emit `kind: 'observed'` or `delivery: 'live'`.
 */
export function createBackendEvidenceAdapters(options = {}) {
  const getTimestamp = () => options.fixedTimestampIso || new Date().toISOString();

  // Explicitly strip/ignore any caller-supplied spoofing booleans
  if (options.strictRejectSpoofFlags && (options.authenticatedLiveTransport || options.sourceVerified)) {
    throw new Error(
      'Security Violation: caller-supplied authenticatedLiveTransport / sourceVerified flags are forbidden'
    );
  }

  const runImergAdapter = async ({ geometry, timeRange, product, version, signal }) => {
    const geo = validateContractGeometry(geometry);
    const tr = validateContractTimeRange(timeRange);
    const spatialSupport = {
      nativeGrid: 'WGS84_0.1deg_GPM_L3',
      resolution: '0.1deg (~10km)'
    };

    // Offline injected binary test fixture -> ALWAYS kind: 'assumed', delivery: 'cached'
    if (options.imergRawBytes) {
      const rawBuf = toRawBuffer(options.imergRawBytes);
      const decoded = decodeImergNetCdf4Binary(rawBuf, {
        latitude: geo.centroidLat,
        longitude: geo.centroidLon
      });
      if (!decoded.valid) {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'mm/day',
          provider: 'NASA_GES_DISC_IMERG',
          missingReason: `IMERG NetCDF/HDF5 binary check failed: ${decoded.reason}`,
          retrievedAt: getTimestamp()
        });
      }
      return {
        manifest: {
          product,
          version,
          kind: 'assumed',
          delivery: 'cached',
          geometry,
          timeRange,
          spatialSupport: decoded.spatialSupport,
          units: decoded.units,
          qa: {
            ...decoded.qa,
            provenanceOrigin: 'injected_local_fixture_unverified'
          },
          coverage: {
            fraction: decoded.coverage.fraction,
            validDaysCount: decoded.coverage.validDaysCount,
            totalDaysInWindow: tr.days
          },
          rawSha256: decoded.rawSha256,
          missingReason: null,
          provider: 'NASA_GES_DISC_IMERG',
          retrievedAt: getTimestamp()
        },
        rawBytes: rawBuf
      };
    }

    const token = options.earthdataToken || process.env.EARTHDATA_TOKEN || process.env.NASA_EARTHDATA_TOKEN || null;
    if (!token) {
      return buildUnavailableEnvelope({
        product,
        version,
        geometry,
        timeRange,
        spatialSupport,
        units: 'mm/day',
        provider: 'NASA_GES_DISC_IMERG',
        missingReason:
          'BLOCKED_EARTHDATA_TOKEN_MISSING: NASA GES DISC requires Earthdata Login authentication for IMERG V07 NetCDF4 granules',
        retrievedAt: getTimestamp()
      });
    }

    const fetchFn = options.fetchImpl !== undefined ? options.fetchImpl : globalThis.fetch;
    if (typeof fetchFn !== 'function') {
      return buildUnavailableEnvelope({
        product,
        version,
        geometry,
        timeRange,
        spatialSupport,
        units: 'mm/day',
        provider: 'NASA_GES_DISC_IMERG',
        missingReason: 'BLOCKED_FETCH_UNAVAILABLE: No HTTP fetch implementation available',
        retrievedAt: getTimestamp()
      });
    }

    const isGenuinePlatformFetch = fetchFn === globalThis.fetch;

    try {
      const bbox = `${(geo.centroidLon - 0.05).toFixed(3)},${(geo.centroidLat - 0.05).toFixed(3)},${(geo.centroidLon + 0.05).toFixed(3)},${(geo.centroidLat + 0.05).toFixed(3)}`;
      const cmrUrl = `https://cmr.earthdata.nasa.gov/search/granules.json?short_name=${product}&version=${version}&temporal=${timeRange.start}T00:00:00Z,${timeRange.end}T23:59:59Z&bounding_box=${bbox}&page_size=366`;
      const cmrResp = await fetchFn(cmrUrl, { headers: { Accept: 'application/json' }, signal });
      if (!cmrResp.ok) {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'mm/day',
          provider: 'NASA_GES_DISC_IMERG',
          missingReason: `CMR granule search returned HTTP ${cmrResp.status}`,
          retrievedAt: getTimestamp()
        });
      }
      const cmrJson = await cmrResp.json();
      const entries = cmrJson?.feed?.entry || [];
      if (entries.length === 0) {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'mm/day',
          provider: 'NASA_GES_DISC_IMERG',
          missingReason: 'Zero GPM IMERG V07 granules found in CMR for requested window',
          retrievedAt: getTimestamp()
        });
      }
      const opendapLink = (entries[0].links || []).find((l) => l.href && l.href.includes('opendap'));
      const nc4Link = (entries[0].links || []).find((l) => l.href && l.href.endsWith('.nc4'));
      if (!opendapLink && !nc4Link) {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'mm/day',
          provider: 'NASA_GES_DISC_IMERG',
          missingReason: 'Discovered CMR granule lacked a direct .nc4 / OPeNDAP link',
          retrievedAt: getTimestamp()
        });
      }
      const targetUrl = opendapLink
        ? buildImergOpendapSubsetUrl(opendapLink.href, {
            latitude: geo.centroidLat,
            longitude: geo.centroidLon,
            formatExtension: 'nc'
          })
        : nc4Link.href;

      const dataResp = await fetchFn(targetUrl, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      });
      if (!dataResp.ok || typeof dataResp.arrayBuffer !== 'function') {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'mm/day',
          provider: 'NASA_GES_DISC_IMERG',
          missingReason: `GES DISC granule fetch returned HTTP ${dataResp.status || 'invalid_stream'}`,
          retrievedAt: getTimestamp()
        });
      }
      const rawBuf = Buffer.from(await dataResp.arrayBuffer());
      const decoded = decodeImergNetCdf4Binary(rawBuf, {
        latitude: geo.centroidLat,
        longitude: geo.centroidLon
      });
      if (!decoded.valid) {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'mm/day',
          provider: 'NASA_GES_DISC_IMERG',
          missingReason: `Binary NetCDF/HDF5 decode failed: ${decoded.reason}`,
          retrievedAt: getTimestamp()
        });
      }
      return {
        manifest: {
          product,
          version,
          kind: isGenuinePlatformFetch ? 'observed' : 'assumed',
          delivery: isGenuinePlatformFetch ? 'live' : 'cached',
          geometry,
          timeRange,
          spatialSupport: decoded.spatialSupport,
          units: decoded.units,
          qa: decoded.qa,
          coverage: {
            fraction: decoded.coverage.fraction,
            validDaysCount: decoded.coverage.validDaysCount,
            totalDaysInWindow: tr.days
          },
          rawSha256: decoded.rawSha256,
          missingReason: null,
          provider: 'NASA_GES_DISC_IMERG',
          retrievedAt: getTimestamp()
        },
        rawBytes: rawBuf
      };
    } catch (err) {
      return buildUnavailableEnvelope({
        product,
        version,
        geometry,
        timeRange,
        spatialSupport,
        units: 'mm/day',
        provider: 'NASA_GES_DISC_IMERG',
        missingReason: `BLOCKED_OUTBOUND_NETWORK_UNAVAILABLE: ${err?.message || 'network failure'}`,
        retrievedAt: getTimestamp()
      });
    }
  };

  const runHlsAdapter = async ({ geometry, timeRange, product, version, signal }) => {
    validateContractGeometry(geometry);
    validateContractTimeRange(timeRange);
    const spatialSupport = {
      nativeGrid: 'UTM_MGRS_30m',
      resolution: '30m'
    };

    const localHlsInput = options.hlsBandTriplet || options.hlsRawBytes;
    if (localHlsInput) {
      const decoded = decodeHlsGeoTiffBinary(localHlsInput, { product, version });
      if (!decoded.valid) {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'surface_reflectance_and_ndvi_unitless',
          provider: 'NASA_LPCLOUD_HLS',
          missingReason: `HLS 3-band GeoTIFF check failed: ${decoded.reason}`,
          retrievedAt: getTimestamp()
        });
      }
      return {
        manifest: {
          product,
          version,
          kind: 'assumed',
          delivery: 'cached',
          geometry,
          timeRange,
          spatialSupport: decoded.spatialSupport,
          units: decoded.units,
          qa: {
            ...decoded.qa,
            provenanceOrigin: 'injected_local_fixture_unverified'
          },
          coverage: {
            fraction: decoded.coverage.fraction,
            cloudFraction: decoded.coverage.cloudFraction,
            validClearPixels: decoded.coverage.validClearPixels,
            totalPixels: decoded.coverage.totalPixels
          },
          rawSha256: decoded.rawSha256,
          missingReason: null,
          provider: 'NASA_LPCLOUD_HLS',
          retrievedAt: getTimestamp()
        },
        rawBytes: decoded.rawBytes
      };
    }

    const token = options.earthdataToken || process.env.EARTHDATA_TOKEN || process.env.NASA_EARTHDATA_TOKEN || null;
    if (!token) {
      return buildUnavailableEnvelope({
        product,
        version,
        geometry,
        timeRange,
        spatialSupport,
        units: 'surface_reflectance_and_ndvi_unitless',
        provider: 'NASA_LPCLOUD_HLS',
        missingReason:
          'BLOCKED_EARTHDATA_TOKEN_MISSING: NASA LPCLOUD requires Earthdata Login authentication for HLS v2.0 COG granules',
        retrievedAt: getTimestamp()
      });
    }

    const fetchFn = options.fetchImpl !== undefined ? options.fetchImpl : globalThis.fetch;
    if (typeof fetchFn !== 'function') {
      return buildUnavailableEnvelope({
        product,
        version,
        geometry,
        timeRange,
        spatialSupport,
        units: 'surface_reflectance_and_ndvi_unitless',
        provider: 'NASA_LPCLOUD_HLS',
        missingReason: 'BLOCKED_FETCH_UNAVAILABLE: No HTTP fetch implementation available',
        retrievedAt: getTimestamp()
      });
    }

    const isGenuinePlatformFetch = fetchFn === globalThis.fetch;

    try {
      const geo = validateContractGeometry(geometry);
      const bbox = `${(geo.centroidLon - 0.01).toFixed(4)},${(geo.centroidLat - 0.01).toFixed(4)},${(geo.centroidLon + 0.01).toFixed(4)},${(geo.centroidLat + 0.01).toFixed(4)}`;
      const cmrUrl = `https://cmr.earthdata.nasa.gov/search/granules.json?short_name=${product}&version=${version}&temporal=${timeRange.start}T00:00:00Z,${timeRange.end}T23:59:59Z&bounding_box=${bbox}&page_size=50`;
      const cmrResp = await fetchFn(cmrUrl, { headers: { Accept: 'application/json' }, signal });
      if (!cmrResp.ok) {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'surface_reflectance_and_ndvi_unitless',
          provider: 'NASA_LPCLOUD_HLS',
          missingReason: `LPCLOUD CMR returned HTTP ${cmrResp.status}`,
          retrievedAt: getTimestamp()
        });
      }
      const cmrJson = await cmrResp.json();
      const entries = cmrJson?.feed?.entry || [];
      if (entries.length === 0) {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'surface_reflectance_and_ndvi_unitless',
          provider: 'NASA_LPCLOUD_HLS',
          missingReason: 'Zero HLS v2.0 granules found in LPCLOUD CMR for requested window',
          retrievedAt: getTimestamp()
        });
      }

      const links = entries[0].links || [];
      const redLink = links.find((l) => l.href && /\.B04\.tif$/i.test(l.href.split('?')[0]));
      const nirLink = links.find(
        (l) => l.href && /\.(B05|B8A|B08)\.tif$/i.test(l.href.split('?')[0])
      );
      const fmaskLink = links.find((l) => l.href && /\.Fmask\.tif$/i.test(l.href.split('?')[0]));

      if (!redLink || !nirLink || !fmaskLink) {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'surface_reflectance_and_ndvi_unitless',
          provider: 'NASA_LPCLOUD_HLS',
          missingReason:
            'Discovered HLS granule lacked complete 3-band COG links (.B04.tif, .B05/.B8A.tif, and .Fmask.tif required)',
          retrievedAt: getTimestamp()
        });
      }

      const [redResp, nirResp, fmaskResp] = await Promise.all([
        fetchFn(redLink.href, { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetchFn(nirLink.href, { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetchFn(fmaskLink.href, { headers: { Authorization: `Bearer ${token}` }, signal })
      ]);

      if (
        !redResp.ok ||
        !nirResp.ok ||
        !fmaskResp.ok ||
        typeof redResp.arrayBuffer !== 'function' ||
        typeof nirResp.arrayBuffer !== 'function' ||
        typeof fmaskResp.arrayBuffer !== 'function'
      ) {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'surface_reflectance_and_ndvi_unitless',
          provider: 'NASA_LPCLOUD_HLS',
          missingReason: 'LPCLOUD band COG fetch failed on one or more band files',
          retrievedAt: getTimestamp()
        });
      }

      const [redBuf, nirBuf, fmaskBuf] = await Promise.all([
        redResp.arrayBuffer().then((ab) => Buffer.from(ab)),
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
        { product, version }
      );

      if (!decoded.valid) {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'surface_reflectance_and_ndvi_unitless',
          provider: 'NASA_LPCLOUD_HLS',
          missingReason: `3-band HLS GeoTIFF decode failed: ${decoded.reason}`,
          retrievedAt: getTimestamp()
        });
      }

      return {
        manifest: {
          product,
          version,
          kind: isGenuinePlatformFetch ? 'observed' : 'assumed',
          delivery: isGenuinePlatformFetch ? 'live' : 'cached',
          geometry,
          timeRange,
          spatialSupport: decoded.spatialSupport,
          units: decoded.units,
          qa: decoded.qa,
          coverage: {
            fraction: decoded.coverage.fraction,
            cloudFraction: decoded.coverage.cloudFraction,
            validClearPixels: decoded.coverage.validClearPixels,
            totalPixels: decoded.coverage.totalPixels
          },
          rawSha256: decoded.rawSha256,
          missingReason: null,
          provider: 'NASA_LPCLOUD_HLS',
          retrievedAt: getTimestamp()
        },
        rawBytes: decoded.rawBytes
      };
    } catch (err) {
      return buildUnavailableEnvelope({
        product,
        version,
        geometry,
        timeRange,
        spatialSupport,
        units: 'surface_reflectance_and_ndvi_unitless',
        provider: 'NASA_LPCLOUD_HLS',
        missingReason: `BLOCKED_OUTBOUND_NETWORK_UNAVAILABLE: ${err?.message || 'network failure'}`,
        retrievedAt: getTimestamp()
      });
    }
  };

  const runNasaPowerAdapter = async ({
    geometry,
    timeRange,
    product = 'NASA_POWER',
    version = 'daily-v9',
    signal
  }) => {
    const geo = validateContractGeometry(geometry);
    const tr = validateContractTimeRange(timeRange);
    const spatialSupport = {
      nativeGrid: 'MERRA2_0.5x0.625deg',
      resolution: '0.5deg (~50km regional context)'
    };

    if (options.nasaPowerRawBytes) {
      const rawBuf = toRawBuffer(options.nasaPowerRawBytes);
      const rawSha256 = crypto.createHash('sha256').update(rawBuf).digest('hex');
      let parsed;
      try {
        parsed = JSON.parse(rawBuf.toString('utf8'));
      } catch {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'degC_MJm2day_mmday',
          provider: 'NASA_LaRC_POWER',
          missingReason: 'Unparsable NASA POWER JSON payload bytes',
          retrievedAt: getTimestamp()
        });
      }
      if (parsed?.header?.time_standard !== 'UTC') {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'degC_MJm2day_mmday',
          provider: 'NASA_LaRC_POWER',
          missingReason: 'NASA POWER payload missing explicit header.time_standard="UTC"',
          retrievedAt: getTimestamp()
        });
      }
      const tMaxObj = parsed?.properties?.parameter?.T2M_MAX || {};
      const keys = Object.keys(tMaxObj);
      const validCount = keys.filter(
        (k) => typeof tMaxObj[k] === 'number' && Number.isFinite(tMaxObj[k]) && tMaxObj[k] > -900
      ).length;
      const frac = keys.length > 0 ? Number((validCount / keys.length).toFixed(4)) : 0;

      return {
        manifest: {
          product,
          version,
          kind: 'assumed',
          delivery: 'cached',
          geometry,
          timeRange,
          spatialSupport,
          units: 'degC_MJm2day_mmday',
          qa: {
            usable: frac >= 0.85 && validCount > 0,
            timeStandardVerifiedUtc: true,
            validDaysCount: validCount,
            totalDays: keys.length,
            provenanceOrigin: 'injected_local_fixture_unverified'
          },
          coverage: {
            fraction: frac,
            validDaysCount: validCount,
            totalDaysInWindow: tr.days
          },
          rawSha256,
          missingReason: null,
          provider: 'NASA_LaRC_POWER',
          retrievedAt: getTimestamp()
        },
        rawBytes: rawBuf
      };
    }

    const fetchFn = options.fetchImpl !== undefined ? options.fetchImpl : globalThis.fetch;
    if (typeof fetchFn !== 'function') {
      return buildUnavailableEnvelope({
        product,
        version,
        geometry,
        timeRange,
        spatialSupport,
        units: 'degC_MJm2day_mmday',
        provider: 'NASA_LaRC_POWER',
        missingReason: 'BLOCKED_FETCH_UNAVAILABLE: No HTTP fetch implementation available',
        retrievedAt: getTimestamp()
      });
    }

    const isGenuinePlatformFetch = fetchFn === globalThis.fetch;

    try {
      const startCompact = timeRange.start.replace(/-/g, '');
      const endCompact = timeRange.end.replace(/-/g, '');
      const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,RH2M,WS2M&community=AG&longitude=${geo.centroidLon}&latitude=${geo.centroidLat}&start=${startCompact}&end=${endCompact}&time-standard=UTC&format=JSON`;
      const resp = await fetchFn(url, { headers: { Accept: 'application/json' }, signal });
      if (!resp.ok || typeof resp.arrayBuffer !== 'function') {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'degC_MJm2day_mmday',
          provider: 'NASA_LaRC_POWER',
          missingReason: `NASA POWER API returned HTTP ${resp.status || 'invalid_stream'}`,
          retrievedAt: getTimestamp()
        });
      }
      const rawBuf = Buffer.from(await resp.arrayBuffer());
      const rawSha256 = crypto.createHash('sha256').update(rawBuf).digest('hex');
      const parsed = JSON.parse(rawBuf.toString('utf8'));
      if (parsed?.header?.time_standard !== 'UTC') {
        return buildUnavailableEnvelope({
          product,
          version,
          geometry,
          timeRange,
          spatialSupport,
          units: 'degC_MJm2day_mmday',
          provider: 'NASA_LaRC_POWER',
          missingReason: 'NASA POWER live payload missing explicit header.time_standard="UTC"',
          retrievedAt: getTimestamp()
        });
      }
      const tMaxObj = parsed?.properties?.parameter?.T2M_MAX || {};
      const keys = Object.keys(tMaxObj);
      const validCount = keys.filter(
        (k) => typeof tMaxObj[k] === 'number' && Number.isFinite(tMaxObj[k]) && tMaxObj[k] > -900
      ).length;
      const frac = keys.length > 0 ? Number((validCount / keys.length).toFixed(4)) : 0;

      return {
        manifest: {
          product,
          version,
          kind: isGenuinePlatformFetch ? 'observed' : 'assumed',
          delivery: isGenuinePlatformFetch ? 'live' : 'cached',
          geometry,
          timeRange,
          spatialSupport,
          units: 'degC_MJm2day_mmday',
          qa: {
            usable: frac >= 0.85 && validCount > 0,
            timeStandardVerifiedUtc: true,
            validDaysCount: validCount,
            totalDays: keys.length
          },
          coverage: {
            fraction: frac,
            validDaysCount: validCount,
            totalDaysInWindow: tr.days
          },
          rawSha256,
          missingReason: null,
          provider: 'NASA_LaRC_POWER',
          retrievedAt: getTimestamp()
        },
        rawBytes: rawBuf
      };
    } catch (err) {
      return buildUnavailableEnvelope({
        product,
        version,
        geometry,
        timeRange,
        spatialSupport,
        units: 'degC_MJm2day_mmday',
        provider: 'NASA_LaRC_POWER',
        missingReason: `BLOCKED_OUTBOUND_NETWORK_UNAVAILABLE: ${err?.message || 'network failure'}`,
        retrievedAt: getTimestamp()
      });
    }
  };

  const runSarAdapter = async ({ geometry, timeRange, product, version }) => {
    validateContractGeometry(geometry);
    validateContractTimeRange(timeRange);
    return buildUnavailableEnvelope({
      product,
      version,
      geometry,
      timeRange,
      spatialSupport: {
        nativeGrid: product.startsWith('NISAR') ? 'NISAR_L_BAND_GCOV_20m' : 'SENTINEL1_C_BAND_RTC_20m',
        resolution: '20m'
      },
      units: 'gamma0_linear_and_dB',
      provider: 'NASA_ASF_DAAC_SAR',
      missingReason:
        'BLOCKED_SAR_RASTER_PAIR_UNVERIFIED: Catalogue metadata alone does not verify pixel-level SAR backscatter; requires authenticated ASF Earthdata GCOV/RTC GeoTIFF pair download',
      retrievedAt: getTimestamp()
    });
  };

  return Object.freeze({
    'NASA_POWER@daily-v9': runNasaPowerAdapter,
    'GPM_3IMERGDF@07': (req) => runImergAdapter({ ...req, product: 'GPM_3IMERGDF', version: '07' }),
    'GPM_3IMERGDL@07': (req) => runImergAdapter({ ...req, product: 'GPM_3IMERGDL', version: '07' }),
    'HLSL30@2.0': (req) => runHlsAdapter({ ...req, product: 'HLSL30', version: '2.0' }),
    'HLSS30@2.0': (req) => runHlsAdapter({ ...req, product: 'HLSS30', version: '2.0' }),
    'SENTINEL1_RTC@1.0': (req) => runSarAdapter({ ...req, product: 'SENTINEL1_RTC', version: '1.0' }),
    'NISAR_L2_GCOV@1.0': (req) => runSarAdapter({ ...req, product: 'NISAR_L2_GCOV', version: '1.0' })
  });
}

export const adapters = createBackendEvidenceAdapters();
