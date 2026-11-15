/**
 * @file adapters/hls-geotiff-reader.js
 * @description Genuine NASA HLS v2.0 (`HLSL30` & `HLSS30`) separate single-band Cloud-Optimized
 * GeoTIFF (COG) reader and scene-triplet assembler.
 *
 * Addresses PR #17 Review Comment #issuecomment-6897616390:
 * 1. NASA HLS L30/S30 distributes separate single-band COGs per granule:
 *    - `HLSL30` (Landsat 8/9 OLI): `<granuleId>.B04.tif` (Red Int16), `<granuleId>.B05.tif` (NIR Int16), `<granuleId>.Fmask.tif` (QA UInt8)
 *    - `HLSS30` (Sentinel-2 MSI): `<granuleId>.B04.tif` (Red Int16), `<granuleId>.B8A.tif` (NIR Narrow Int16), `<granuleId>.Fmask.tif` (QA UInt8)
 * 2. Never treats a single arbitrary `.tif` file as all three sources! Passing a single `.tif`
 *    to `decodeHlsGeoTiffBinary` or `assembleHlsSceneBandTriplet` fails closed (`incomplete_hls_band_triplet`).
 * 3. Verifies across the 3 separate band COGs:
 *    - Identical granule prefix, sensor (`L30` vs `S30`), MGRS tile (`T36RUV`), acquisition timestamp, and version (`v2.0`)
 *    - Correct band codes (`B04` for Red, `B05` for L30 NIR or `B8A`/`B08` for S30 NIR, and `Fmask` for QA)
 *    - Exact spatial alignment: identical `width`, `height`, `epsgCode` (`32636`), `pixelScaleMeters` (`[30, 30]`), and UTM tiepoint `(ulEastingM, ulNorthingM)`
 *    - Target location / MGRS tile consistency
 * 4. Computes individual SHA-256 hashes (`redSha256`, `nirSha256`, `fmaskSha256`) and combined `rawSha256`.
 */

import crypto from 'node:crypto';
import zlib from 'node:zlib';

export const TIFF_MAGIC_LE = Buffer.from([0x49, 0x49, 0x2a, 0x00]); // "II*\0"
export const TIFF_MAGIC_BE = Buffer.from([0x4d, 0x4d, 0x00, 0x2a]); // "MM\0*"

export const TIFF_TAGS = Object.freeze({
  ImageWidth: 256,
  ImageLength: 257,
  BitsPerSample: 258,
  Compression: 259,
  PhotometricInterpretation: 262,
  ImageDescription: 270,
  StripOffsets: 273,
  SamplesPerPixel: 277,
  RowsPerStrip: 278,
  StripByteCounts: 279,
  TileWidth: 322,
  TileLength: 323,
  TileOffsets: 324,
  TileByteCounts: 325,
  SampleFormat: 339,
  ModelPixelScaleTag: 33550,
  ModelTiepointTag: 33922,
  GeoKeyDirectoryTag: 34735,
  GDAL_NODATA: 42113
});

export const HLS_REFLECTANCE_SCALE_FACTOR = 0.0001;
export const HLS_REFLECTANCE_FILL_VALUE = -9999;
export const HLS_FMASK_FILL_VALUE = 255;

/**
 * Decodes an 8-bit HLS v2.0 `Fmask` pixel value into explicit bit flags.
 */
export function decodeHlsFmaskByte(fmaskByte) {
  if (
    !Number.isInteger(fmaskByte) ||
    fmaskByte < 0 ||
    fmaskByte > 255 ||
    fmaskByte === HLS_FMASK_FILL_VALUE
  ) {
    return {
      rawByte: fmaskByte,
      isFill: true,
      cirrus: false,
      cloud: false,
      adjacentToCloud: false,
      cloudShadow: false,
      snowIce: false,
      water: false,
      aerosolLevel: 'unknown',
      usableClearLand: false
    };
  }

  const cirrus = Boolean(fmaskByte & (1 << 0));
  const cloud = Boolean(fmaskByte & (1 << 1));
  const adjacentToCloud = Boolean(fmaskByte & (1 << 2));
  const cloudShadow = Boolean(fmaskByte & (1 << 3));
  const snowIce = Boolean(fmaskByte & (1 << 4));
  const water = Boolean(fmaskByte & (1 << 5));
  const aerosolCode = (fmaskByte >> 6) & 0b11;
  const aerosolLevels = ['climatology', 'low', 'moderate', 'high'];
  const aerosolLevel = aerosolLevels[aerosolCode];

  const usableClearLand =
    !cirrus &&
    !cloud &&
    !adjacentToCloud &&
    !cloudShadow &&
    !snowIce &&
    !water &&
    aerosolLevel !== 'high';

  return {
    rawByte: fmaskByte,
    isFill: false,
    cirrus,
    cloud,
    adjacentToCloud,
    cloudShadow,
    snowIce,
    water,
    aerosolCode,
    aerosolLevel,
    usableClearLand
  };
}

/**
 * Checks whether a buffer begins with a valid TIFF / GeoTIFF magic signature (`II*\0` or `MM\0*`).
 */
export function isGeoTiffBinary(rawBytes) {
  const buf = Buffer.isBuffer(rawBytes)
    ? rawBytes
    : rawBytes instanceof Uint8Array
      ? Buffer.from(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength)
      : null;
  if (!buf || buf.byteLength < 8) {
    return false;
  }
  return buf.subarray(0, 4).equals(TIFF_MAGIC_LE) || buf.subarray(0, 4).equals(TIFF_MAGIC_BE);
}

/**
 * Parses an official NASA HLS v2.0 asset filename or granule identifier:
 * e.g. `HLS.L30.T36RUV.2026045T083011.v2.0.B04.tif`
 */
export function parseHlsAssetNomenclature(nameOrHref = '') {
  const base = String(nameOrHref || '').split('/').pop().split('?')[0];
  const m = /^HLS\.(L30|S30)\.T([0-9]{2}[A-Z]{3})\.([0-9]{7}T[0-9]{6})\.v([0-9]+\.[0-9]+)\.([A-Za-z0-9]+)\.(tif|tiff)$/i.exec(
    base
  );
  if (!m) {
    return { valid: false, rawName: base };
  }
  const sensorCode = m[1].toUpperCase();
  const product = sensorCode === 'L30' ? 'HLSL30' : 'HLSS30';
  const mgrsTile = m[2].toUpperCase();
  const timestampToken = m[3].toUpperCase();
  const version = m[4];
  const bandName = m[5];
  const granuleId = `HLS.${sensorCode}.T${mgrsTile}.${timestampToken}.v${version}`;

  // Convert YYYYDDD in timestampToken to YYYY-MM-DD UTC
  const year = Number(timestampToken.slice(0, 4));
  const doy = Number(timestampToken.slice(4, 7));
  const dateUtc = new Date(Date.UTC(year, 0, doy)).toISOString().slice(0, 10);

  return {
    valid: true,
    rawName: base,
    sensorCode,
    product,
    mgrsTile,
    timestampToken,
    acquisitionDate: dateUtc,
    version,
    bandName,
    granuleId
  };
}

/**
 * Encodes a single-band GeoTIFF / COG buffer (`SamplesPerPixel = 1`):
 * - For reflectance bands (`B04`, `B05`, `B8A`, `B08`): `Int16` (`BitsPerSample = 16`, `SampleFormat = 2`, `GDAL_NODATA = "-9999"`)
 * - For `Fmask` band: `UInt8` (`BitsPerSample = 8`, `SampleFormat = 1`, `GDAL_NODATA = "255"`)
 */
export function encodeSingleBandHlsGeoTiff(spec = {}) {
  const {
    width = 4,
    height = 4,
    bandName = 'B04',
    product = 'HLSL30',
    version = '2.0',
    mgrsTile = '36RUV',
    timestampToken = '2026045T083011',
    acquisitionDate = '2026-02-14',
    epsgCode = 32636,
    pixelScaleMeters = 30.0,
    ulEastingM = 349800.0,
    ulNorthingM = 3384600.0,
    compression = 8, // Deflate by default
    values = []
  } = spec;

  const isFmask = /^fmask$/i.test(bandName);
  const bitsPerSample = isFmask ? 8 : 16;
  const sampleFormat = isFmask ? 1 : 2; // 1 = uint, 2 = int
  const nodataStr = isFmask ? '255\0' : '-9999\0';
  const sensorCode = product === 'HLSS30' ? 'S30' : 'L30';
  const granuleId = spec.granuleId || `HLS.${sensorCode}.T${mgrsTile}.${timestampToken}.v${version}`;
  const assetFileName = `${granuleId}.${isFmask ? 'Fmask' : bandName}.tif`;

  const numPixels = width * height;
  const rawPixelBuf = Buffer.alloc(numPixels * (isFmask ? 1 : 2));
  for (let i = 0; i < numPixels; i += 1) {
    const v = values[i] !== undefined ? Number(values[i]) : isFmask ? 64 : 800;
    if (isFmask) {
      rawPixelBuf.writeUInt8(v & 0xff, i);
    } else {
      rawPixelBuf.writeInt16LE(v, i * 2);
    }
  }

  const stripPayload = compression === 8 ? zlib.deflateSync(rawPixelBuf) : rawPixelBuf;
  const descJson = JSON.stringify({
    assetFileName,
    granuleId,
    product,
    version,
    mgrsTile,
    timestampToken,
    acquisitionDate,
    timeStandard: 'UTC',
    bandName: isFmask ? 'Fmask' : bandName,
    scaleFactor: isFmask ? 1.0 : HLS_REFLECTANCE_SCALE_FACTOR,
    fillValue: isFmask ? HLS_FMASK_FILL_VALUE : HLS_REFLECTANCE_FILL_VALUE
  });
  const descBuf = Buffer.from(`${descJson}\0`, 'utf8');
  const nodataBuf = Buffer.from(nodataStr, 'ascii');

  const pixelScaleBuf = Buffer.alloc(24);
  pixelScaleBuf.writeDoubleLE(Number(pixelScaleMeters), 0);
  pixelScaleBuf.writeDoubleLE(Number(pixelScaleMeters), 8);
  pixelScaleBuf.writeDoubleLE(0.0, 16);

  const tiepointBuf = Buffer.alloc(48);
  tiepointBuf.writeDoubleLE(0.0, 0);
  tiepointBuf.writeDoubleLE(0.0, 8);
  tiepointBuf.writeDoubleLE(0.0, 16);
  tiepointBuf.writeDoubleLE(Number(ulEastingM), 24);
  tiepointBuf.writeDoubleLE(Number(ulNorthingM), 32);
  tiepointBuf.writeDoubleLE(0.0, 40);

  const geoKeyBuf = Buffer.alloc(16);
  geoKeyBuf.writeUInt16LE(1, 0);
  geoKeyBuf.writeUInt16LE(1, 2);
  geoKeyBuf.writeUInt16LE(0, 4);
  geoKeyBuf.writeUInt16LE(1, 6);
  geoKeyBuf.writeUInt16LE(3072, 8);
  geoKeyBuf.writeUInt16LE(0, 10);
  geoKeyBuf.writeUInt16LE(1, 12);
  geoKeyBuf.writeUInt16LE(Number(epsgCode), 14);

  const numEntries = 14;
  const ifdOffset = 8;
  const ifdSize = 2 + numEntries * 12 + 4;
  let heapOffset = ifdOffset + ifdSize;

  const allocHeap = (b) => {
    const start = heapOffset;
    heapOffset += b.byteLength;
    if (heapOffset % 2 !== 0) heapOffset += 1;
    return start;
  };

  const descOffset = allocHeap(descBuf);
  const pixelScaleOffset = allocHeap(pixelScaleBuf);
  const tiepointOffset = allocHeap(tiepointBuf);
  const geoKeyOffset = allocHeap(geoKeyBuf);
  const nodataOffset = allocHeap(nodataBuf);
  const stripDataOffset = allocHeap(stripPayload);

  const out = Buffer.alloc(heapOffset, 0);
  TIFF_MAGIC_LE.copy(out, 0);
  out.writeUInt32LE(ifdOffset, 4);
  out.writeUInt16LE(numEntries, ifdOffset);

  const entries = [
    { tag: TIFF_TAGS.ImageWidth, type: 4, count: 1, valueOrOffset: width },
    { tag: TIFF_TAGS.ImageLength, type: 4, count: 1, valueOrOffset: height },
    { tag: TIFF_TAGS.BitsPerSample, type: 3, count: 1, valueOrOffset: bitsPerSample },
    { tag: TIFF_TAGS.Compression, type: 3, count: 1, valueOrOffset: compression },
    { tag: TIFF_TAGS.ImageDescription, type: 2, count: descBuf.byteLength, valueOrOffset: descOffset },
    { tag: TIFF_TAGS.StripOffsets, type: 4, count: 1, valueOrOffset: stripDataOffset },
    { tag: TIFF_TAGS.SamplesPerPixel, type: 3, count: 1, valueOrOffset: 1 },
    { tag: TIFF_TAGS.RowsPerStrip, type: 4, count: 1, valueOrOffset: height },
    { tag: TIFF_TAGS.StripByteCounts, type: 4, count: 1, valueOrOffset: stripPayload.byteLength },
    { tag: TIFF_TAGS.SampleFormat, type: 3, count: 1, valueOrOffset: sampleFormat },
    { tag: TIFF_TAGS.ModelPixelScaleTag, type: 12, count: 3, valueOrOffset: pixelScaleOffset },
    { tag: TIFF_TAGS.ModelTiepointTag, type: 12, count: 6, valueOrOffset: tiepointOffset },
    { tag: TIFF_TAGS.GeoKeyDirectoryTag, type: 3, count: 8, valueOrOffset: geoKeyOffset },
    { tag: TIFF_TAGS.GDAL_NODATA, type: 2, count: nodataBuf.byteLength, valueOrOffset: nodataOffset }
  ];

  let entryPos = ifdOffset + 2;
  for (const e of entries) {
    out.writeUInt16LE(e.tag, entryPos);
    out.writeUInt16LE(e.type, entryPos + 2);
    out.writeUInt32LE(e.count, entryPos + 4);
    if (e.type === 3 && e.count === 1) {
      out.writeUInt16LE(e.valueOrOffset, entryPos + 8);
    } else {
      out.writeUInt32LE(e.valueOrOffset, entryPos + 8);
    }
    entryPos += 12;
  }
  out.writeUInt32LE(0, entryPos);

  descBuf.copy(out, descOffset);
  pixelScaleBuf.copy(out, pixelScaleOffset);
  tiepointBuf.copy(out, tiepointOffset);
  geoKeyBuf.copy(out, geoKeyOffset);
  nodataBuf.copy(out, nodataOffset);
  stripPayload.copy(out, stripDataOffset);

  return out;
}

/**
 * Builds a complete 3-file HLS v2.0 scene band triplet (`{ redCogBytes, nirCogBytes, fmaskCogBytes, ... }`)
 * where Red (`B04`), NIR (`B05` for `HLSL30` or `B8A` for `HLSS30`), and `Fmask` are three
 * separate single-band Cloud-Optimized GeoTIFF buffers.
 * Note: For decoder unit testing only — never marked as a live NASA observation.
 */
export function encodeHlsGeoTiffBandTriplet(spec = {}) {
  const {
    width = 4,
    height = 4,
    product = 'HLSL30',
    version = '2.0',
    mgrsTile = '36RUV',
    timestampToken = '2026045T083011',
    acquisitionDate = '2026-02-14',
    epsgCode = 32636,
    pixelScaleMeters = 30.0,
    ulEastingM = 349800.0,
    ulNorthingM = 3384600.0,
    compression = 8,
    redScaledValues = null,
    nirScaledValues = null,
    fmaskBytes = null
  } = spec;

  const numPixels = width * height;
  const redArr =
    Array.isArray(redScaledValues) && redScaledValues.length === numPixels
      ? redScaledValues
      : Array.from({ length: numPixels }, (_, idx) => 800 + (idx % 4) * 10);
  const nirArr =
    Array.isArray(nirScaledValues) && nirScaledValues.length === numPixels
      ? nirScaledValues
      : Array.from({ length: numPixels }, (_, idx) => 4200 + (idx % 4) * 30);
  const fmaskArr =
    Array.isArray(fmaskBytes) && fmaskBytes.length === numPixels
      ? fmaskBytes
      : Array.from({ length: numPixels }, () => 64);

  const sensorCode = product === 'HLSS30' ? 'S30' : 'L30';
  const nirBandName = spec.nirBandName || (product === 'HLSS30' ? 'B8A' : 'B05');
  const granuleId = spec.granuleId || `HLS.${sensorCode}.T${mgrsTile}.${timestampToken}.v${version}`;

  const common = {
    width,
    height,
    product,
    version,
    mgrsTile,
    timestampToken,
    acquisitionDate,
    granuleId,
    epsgCode,
    pixelScaleMeters,
    ulEastingM,
    ulNorthingM,
    compression
  };

  return {
    granuleId,
    product,
    mgrsTile,
    acquisitionDate,
    redAssetName: `${granuleId}.B04.tif`,
    nirAssetName: `${granuleId}.${nirBandName}.tif`,
    fmaskAssetName: `${granuleId}.Fmask.tif`,
    redCogBytes: encodeSingleBandHlsGeoTiff({ ...common, bandName: 'B04', values: redArr }),
    nirCogBytes: encodeSingleBandHlsGeoTiff({ ...common, bandName: nirBandName, values: nirArr }),
    fmaskCogBytes: encodeSingleBandHlsGeoTiff({ ...common, bandName: 'Fmask', values: fmaskArr })
  };
}

// Keep alias returning the 3-band triplet object
export const encodeHlsGeoTiffBinaryScene = encodeHlsGeoTiffBandTriplet;

/**
 * Decodes a single-band GeoTIFF / COG buffer and extracts its IFD metadata, spatial tags, and pixel array.
 */
export function decodeSingleBandHlsGeoTiff(rawBytes) {
  const buf = Buffer.isBuffer(rawBytes)
    ? rawBytes
    : rawBytes instanceof Uint8Array
      ? Buffer.from(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength)
      : rawBytes instanceof ArrayBuffer
        ? Buffer.from(rawBytes)
        : null;

  if (!buf || !isGeoTiffBinary(buf)) {
    return { valid: false, reason: 'invalid_tiff_magic_header' };
  }

  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  const isLE = buf.subarray(0, 4).equals(TIFF_MAGIC_LE);
  const readU16 = (off) => (isLE ? buf.readUInt16LE(off) : buf.readUInt16BE(off));
  const readI16 = (off) => (isLE ? buf.readInt16LE(off) : buf.readInt16BE(off));
  const readU32 = (off) => (isLE ? buf.readUInt32LE(off) : buf.readUInt32BE(off));
  const readF64 = (off) => (isLE ? buf.readDoubleLE(off) : buf.readDoubleBE(off));

  const ifdOffset = readU32(4);
  if (ifdOffset < 8 || ifdOffset + 2 > buf.byteLength) {
    return { valid: false, reason: 'invalid_ifd_offset' };
  }
  const numEntries = readU16(ifdOffset);
  if (ifdOffset + 2 + numEntries * 12 > buf.byteLength) {
    return { valid: false, reason: 'truncated_ifd_directory' };
  }

  const tags = {};
  for (let i = 0; i < numEntries; i += 1) {
    const pos = ifdOffset + 2 + i * 12;
    const tag = readU16(pos);
    const type = readU16(pos + 2);
    const count = readU32(pos + 4);
    const valOrOff = readU32(pos + 8);
    tags[tag] = { tag, type, count, valOrOff, rawPos: pos + 8 };
  }

  const getScalar = (tagId, defVal = null) => {
    const t = tags[tagId];
    if (!t) return defVal;
    if (t.type === 3 && t.count === 1) return readU16(t.rawPos);
    return t.valOrOff;
  };

  const width = getScalar(TIFF_TAGS.ImageWidth, 0);
  const height = getScalar(TIFF_TAGS.ImageLength, 0);
  const bitsPerSample = getScalar(TIFF_TAGS.BitsPerSample, 16);
  const compression = getScalar(TIFF_TAGS.Compression, 1);
  const samplesPerPixel = getScalar(TIFF_TAGS.SamplesPerPixel, 1);
  const stripOffset = getScalar(TIFF_TAGS.StripOffsets, getScalar(TIFF_TAGS.TileOffsets, 0));
  const stripByteCount = getScalar(
    TIFF_TAGS.StripByteCounts,
    getScalar(TIFF_TAGS.TileByteCounts, 0)
  );

  if (samplesPerPixel !== 1) {
    return {
      valid: false,
      reason: `Expected single-band HLS COG (SamplesPerPixel=1), got SamplesPerPixel=${samplesPerPixel}`
    };
  }

  if (width <= 0 || height <= 0 || stripOffset <= 0 || stripOffset + stripByteCount > buf.byteLength) {
    return { valid: false, reason: 'out_of_bounds_strip_offset' };
  }

  let pixelScaleX = null;
  let pixelScaleY = null;
  const scaleTag = tags[TIFF_TAGS.ModelPixelScaleTag];
  if (scaleTag && scaleTag.count >= 2 && scaleTag.valOrOff + 16 <= buf.byteLength) {
    pixelScaleX = readF64(scaleTag.valOrOff);
    pixelScaleY = readF64(scaleTag.valOrOff + 8);
  }

  let ulEastingM = null;
  let ulNorthingM = null;
  const tieTag = tags[TIFF_TAGS.ModelTiepointTag];
  if (tieTag && tieTag.count >= 6 && tieTag.valOrOff + 48 <= buf.byteLength) {
    ulEastingM = readF64(tieTag.valOrOff + 24);
    ulNorthingM = readF64(tieTag.valOrOff + 32);
  }

  let epsgCode = null;
  const geoKeyTag = tags[TIFF_TAGS.GeoKeyDirectoryTag];
  if (geoKeyTag && geoKeyTag.count >= 8 && geoKeyTag.valOrOff + geoKeyTag.count * 2 <= buf.byteLength) {
    const numKeys = readU16(geoKeyTag.valOrOff + 6);
    for (let k = 0; k < numKeys; k += 1) {
      const kOff = geoKeyTag.valOrOff + 8 + k * 8;
      if (kOff + 8 <= buf.byteLength) {
        const keyId = readU16(kOff);
        const keyVal = readU16(kOff + 6);
        if (keyId === 3072 || keyId === 2048) epsgCode = keyVal;
      }
    }
  }

  let meta = {};
  const descTag = tags[TIFF_TAGS.ImageDescription];
  if (descTag && descTag.count > 1 && descTag.valOrOff + descTag.count <= buf.byteLength) {
    const s = buf
      .subarray(descTag.valOrOff, descTag.valOrOff + descTag.count)
      .toString('utf8')
      .replace(/\0+$/, '');
    try {
      meta = JSON.parse(s);
    } catch {
      meta = { rawDescription: s };
    }
  }

  let nodataValue = bitsPerSample === 8 ? HLS_FMASK_FILL_VALUE : HLS_REFLECTANCE_FILL_VALUE;
  const ndTag = tags[TIFF_TAGS.GDAL_NODATA];
  if (ndTag && ndTag.count > 0 && ndTag.valOrOff + ndTag.count <= buf.byteLength) {
    const ndNum = Number(
      buf
        .subarray(ndTag.valOrOff, ndTag.valOrOff + ndTag.count)
        .toString('ascii')
        .replace(/\0+$/, '')
    );
    if (Number.isFinite(ndNum)) nodataValue = ndNum;
  }

  const rawSlice = buf.subarray(stripOffset, stripOffset + stripByteCount);
  let decompressed;
  try {
    decompressed = compression === 8 ? zlib.inflateSync(rawSlice) : rawSlice;
  } catch (err) {
    return { valid: false, reason: `deflate_error: ${err?.message || 'unknown'}` };
  }

  const numPixels = width * height;
  const bytesPerPixel = bitsPerSample === 8 ? 1 : 2;
  if (decompressed.byteLength < numPixels * bytesPerPixel) {
    return { valid: false, reason: 'truncated_pixel_buffer' };
  }

  const pixels = new Array(numPixels);
  for (let i = 0; i < numPixels; i += 1) {
    if (bitsPerSample === 8) {
      pixels[i] = decompressed.readUInt8(i);
    } else {
      pixels[i] = isLE ? decompressed.readInt16LE(i * 2) : decompressed.readInt16BE(i * 2);
    }
  }

  return {
    valid: true,
    sha256,
    byteLength: buf.byteLength,
    rawBuffer: buf,
    width,
    height,
    bitsPerSample,
    pixelScaleX,
    pixelScaleY,
    ulEastingM,
    ulNorthingM,
    epsgCode,
    nodataValue,
    meta,
    pixels
  };
}

/**
 * Assembles and validates the 3 separate single-band HLS COGs (`redCogBytes`, `nirCogBytes`, `fmaskCogBytes`)
 * for the same scene, checking band nomenclature (`B04` + `B05`/`B8A` + `Fmask`), scene date/tile identity,
 * and spatial alignment (`width`, `height`, `30m` scale, `epsgCode`, and UTM tiepoint).
 *
 * Rejects any single `.tif` passed alone!
 */
export function decodeHlsGeoTiffBinary(inputTripletOrSingle, options = {}) {
  // Reviewer Guard (#issuecomment-6897616390 Point 2):
  // Never treat a single arbitrary .tif as all three HLS sources (Red + NIR + Fmask)!
  if (
    Buffer.isBuffer(inputTripletOrSingle) ||
    inputTripletOrSingle instanceof Uint8Array ||
    inputTripletOrSingle instanceof ArrayBuffer ||
    !inputTripletOrSingle ||
    typeof inputTripletOrSingle !== 'object'
  ) {
    return {
      valid: false,
      status: 'incomplete_hls_band_triplet',
      reason:
        'NASA HLS L30/S30 requires three separate band-specific COGs (Red B04, NIR B05/B8A, and 8-bit Fmask) for the same granule; a single .tif cannot represent all three sources.',
      rawSha256: null,
      observations: []
    };
  }

  const {
    redCogBytes,
    nirCogBytes,
    fmaskCogBytes,
    redAssetName = null,
    nirAssetName = null,
    fmaskAssetName = null
  } = inputTripletOrSingle;

  if (!redCogBytes || !nirCogBytes || !fmaskCogBytes) {
    return {
      valid: false,
      status: 'incomplete_hls_band_triplet',
      reason: 'Missing one or more required HLS band COGs (redCogBytes, nirCogBytes, fmaskCogBytes required)',
      rawSha256: null,
      observations: []
    };
  }

  const redBand = decodeSingleBandHlsGeoTiff(redCogBytes);
  const nirBand = decodeSingleBandHlsGeoTiff(nirCogBytes);
  const fmaskBand = decodeSingleBandHlsGeoTiff(fmaskCogBytes);

  if (!redBand.valid || !nirBand.valid || !fmaskBand.valid) {
    return {
      valid: false,
      status: 'binary_decoder_required',
      reason: `Band COG decode failed: red=${redBand.reason || 'ok'}, nir=${nirBand.reason || 'ok'}, fmask=${fmaskBand.reason || 'ok'}`,
      rawSha256: null,
      observations: []
    };
  }

  // Verify Fmask is 8-bit UInt8 and Red/NIR are 16-bit Int16
  if (redBand.bitsPerSample !== 16 || nirBand.bitsPerSample !== 16 || fmaskBand.bitsPerSample !== 8) {
    return {
      valid: false,
      status: 'hls_band_bit_depth_mismatch',
      reason: `Expected Red(16-bit), NIR(16-bit), Fmask(8-bit); got ${redBand.bitsPerSample}, ${nirBand.bitsPerSample}, ${fmaskBand.bitsPerSample}`,
      rawSha256: null,
      observations: []
    };
  }

  // Parse nomenclature from asset filenames or embedded ImageDescription metadata
  const redNom = parseHlsAssetNomenclature(redAssetName || redBand.meta.assetFileName || '');
  const nirNom = parseHlsAssetNomenclature(nirAssetName || nirBand.meta.assetFileName || '');
  const fmaskNom = parseHlsAssetNomenclature(fmaskAssetName || fmaskBand.meta.assetFileName || '');

  const product = redNom.valid ? redNom.product : redBand.meta.product || options.product || 'HLSL30';
  const rBandCode = redNom.valid ? redNom.bandName : redBand.meta.bandName;
  const nBandCode = nirNom.valid ? nirNom.bandName : nirBand.meta.bandName;
  const fBandCode = fmaskNom.valid ? fmaskNom.bandName : fmaskBand.meta.bandName;

  if (rBandCode !== 'B04') {
    return {
      valid: false,
      status: 'hls_band_nomenclature_mismatch',
      reason: `Red COG must be band B04, got "${rBandCode}"`,
      rawSha256: null,
      observations: []
    };
  }
  const validNirForProduct =
    product === 'HLSL30' ? nBandCode === 'B05' : nBandCode === 'B8A' || nBandCode === 'B08';
  if (!validNirForProduct) {
    return {
      valid: false,
      status: 'hls_band_nomenclature_mismatch',
      reason: `Invalid NIR band "${nBandCode}" for product "${product}" (expected B05 for HLSL30, B8A/B08 for HLSS30)`,
      rawSha256: null,
      observations: []
    };
  }
  if (!/^fmask$/i.test(String(fBandCode || ''))) {
    return {
      valid: false,
      status: 'hls_band_nomenclature_mismatch',
      reason: `QA COG must be band Fmask, got "${fBandCode}"`,
      rawSha256: null,
      observations: []
    };
  }

  // Verify scene identity (granuleId, MGRS tile, date, product) across all 3 separate band COGs
  const rGranule = redNom.valid ? redNom.granuleId : redBand.meta.granuleId;
  const nGranule = nirNom.valid ? nirNom.granuleId : nirBand.meta.granuleId;
  const fGranule = fmaskNom.valid ? fmaskNom.granuleId : fmaskBand.meta.granuleId;

  const rTile = redNom.valid ? redNom.mgrsTile : redBand.meta.mgrsTile;
  const nTile = nirNom.valid ? nirNom.mgrsTile : nirBand.meta.mgrsTile;
  const fTile = fmaskNom.valid ? fmaskNom.mgrsTile : fmaskBand.meta.mgrsTile;

  const rDate = redNom.valid ? redNom.acquisitionDate : redBand.meta.acquisitionDate;
  const nDate = nirNom.valid ? nirNom.acquisitionDate : nirBand.meta.acquisitionDate;
  const fDate = fmaskNom.valid ? fmaskNom.acquisitionDate : fmaskBand.meta.acquisitionDate;

  if (
    !rGranule ||
    rGranule !== nGranule ||
    rGranule !== fGranule ||
    !rTile ||
    rTile !== nTile ||
    rTile !== fTile ||
    !rDate ||
    rDate !== nDate ||
    rDate !== fDate
  ) {
    return {
      valid: false,
      status: 'hls_scene_date_or_tile_mismatch',
      reason: `Scene identity mismatch across Red/NIR/Fmask COGs: granules=(${rGranule}, ${nGranule}, ${fGranule}), tiles=(${rTile}, ${nTile}, ${fTile}), dates=(${rDate}, ${nDate}, ${fDate})`,
      rawSha256: null,
      observations: []
    };
  }

  // Optional expected MGRS tile check if provided by pilot config
  if (options.expectedMgrsTile && options.expectedMgrsTile.replace(/^T/i, '') !== rTile.replace(/^T/i, '')) {
    return {
      valid: false,
      status: 'hls_location_tile_mismatch',
      reason: `Scene MGRS tile "${rTile}" does not match expected pilot tile "${options.expectedMgrsTile}"`,
      rawSha256: null,
      observations: []
    };
  }

  // Verify exact spatial alignment across all 3 separate COGs
  const sameDimensions =
    redBand.width === nirBand.width &&
    redBand.width === fmaskBand.width &&
    redBand.height === nirBand.height &&
    redBand.height === fmaskBand.height;
  const sameResolution =
    redBand.pixelScaleX === 30 &&
    redBand.pixelScaleY === 30 &&
    nirBand.pixelScaleX === 30 &&
    nirBand.pixelScaleY === 30 &&
    fmaskBand.pixelScaleX === 30 &&
    fmaskBand.pixelScaleY === 30;
  const sameCrs =
    redBand.epsgCode !== null &&
    redBand.epsgCode === nirBand.epsgCode &&
    redBand.epsgCode === fmaskBand.epsgCode;
  const sameTiepoint =
    redBand.ulEastingM !== null &&
    Math.abs(redBand.ulEastingM - nirBand.ulEastingM) <= 1e-3 &&
    Math.abs(redBand.ulEastingM - fmaskBand.ulEastingM) <= 1e-3 &&
    Math.abs(redBand.ulNorthingM - nirBand.ulNorthingM) <= 1e-3 &&
    Math.abs(redBand.ulNorthingM - fmaskBand.ulNorthingM) <= 1e-3;

  if (!sameDimensions || !sameResolution || !sameCrs || !sameTiepoint) {
    return {
      valid: false,
      status: 'hls_spatial_alignment_mismatch',
      reason:
        'Spatial grid, 30m resolution, EPSG code, or UTM tiepoint mismatch across Red, NIR, and Fmask COGs',
      rawSha256: null,
      observations: []
    };
  }

  // Combined canonical buffer and SHA-256 across the 3 band COGs
  const combinedRawBytes = Buffer.concat([
    redBand.rawBuffer,
    nirBand.rawBuffer,
    fmaskBand.rawBuffer
  ]);
  const rawSha256 = crypto.createHash('sha256').update(combinedRawBytes).digest('hex');

  const totalPixels = redBand.width * redBand.height;
  let validClearPixels = 0;
  let cloudMaskedPixels = 0;
  let shadowMaskedPixels = 0;
  let adjacentOrCirrusPixels = 0;
  let waterOrSnowPixels = 0;
  let nodataPixels = 0;
  const validNdviValues = [];
  const validRedValues = [];
  const validNirValues = [];

  for (let i = 0; i < totalPixels; i += 1) {
    const rawRed = redBand.pixels[i];
    const rawNir = nirBand.pixels[i];
    const rawFmask = fmaskBand.pixels[i];

    const fmask = decodeHlsFmaskByte(rawFmask);
    if (fmask.isFill || rawRed === redBand.nodataValue || rawNir === nirBand.nodataValue) {
      nodataPixels += 1;
      continue;
    }
    if (fmask.cloud) {
      cloudMaskedPixels += 1;
      continue;
    }
    if (fmask.cloudShadow) {
      shadowMaskedPixels += 1;
      continue;
    }
    if (fmask.adjacentToCloud || fmask.cirrus || fmask.aerosolLevel === 'high') {
      adjacentOrCirrusPixels += 1;
      continue;
    }
    if (fmask.water || fmask.snowIce) {
      waterOrSnowPixels += 1;
      continue;
    }

    const redRefl = Number((rawRed * HLS_REFLECTANCE_SCALE_FACTOR).toFixed(6));
    const nirRefl = Number((rawNir * HLS_REFLECTANCE_SCALE_FACTOR).toFixed(6));
    const denom = nirRefl + redRefl;

    if (redRefl <= 0 || redRefl > 1.0 || nirRefl <= 0 || nirRefl > 1.0 || denom <= 1e-6) {
      nodataPixels += 1;
      continue;
    }

    const ndvi = Number(((nirRefl - redRefl) / denom).toFixed(4));
    if (ndvi < -1.0 || ndvi > 1.0) {
      nodataPixels += 1;
      continue;
    }

    validClearPixels += 1;
    validNdviValues.push(ndvi);
    validRedValues.push(redRefl);
    validNirValues.push(nirRefl);
  }

  const validCoverageFraction =
    totalPixels > 0 ? Number((validClearPixels / totalPixels).toFixed(4)) : 0;
  const cloudFraction =
    totalPixels > 0
      ? Number(
          ((cloudMaskedPixels + shadowMaskedPixels + adjacentOrCirrusPixels) / totalPixels).toFixed(4)
        )
      : 0;
  const minClearCoverageRatio = options.minClearCoverageRatio ?? 0.7;
  const usable = validCoverageFraction >= minClearCoverageRatio && validClearPixels > 0;

  const mean = (arr) =>
    arr.length > 0 ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(4)) : null;

  const observation = {
    date: rDate,
    granuleId: rGranule,
    product,
    version: '2.0',
    mgrsTile: rTile,
    bandsJoined: { red: rBandCode, nir: nBandCode, qa: 'Fmask' },
    bandSha256: {
      red: redBand.sha256,
      nir: nirBand.sha256,
      fmask: fmaskBand.sha256
    },
    valid: usable,
    usableClear: usable,
    ndvi: usable ? mean(validNdviValues) : null,
    redSurfaceReflectance: usable ? mean(validRedValues) : null,
    nirSurfaceReflectance: usable ? mean(validNirValues) : null,
    validCoverageFraction,
    cloudFraction,
    canInferBareSoilDirectly: false,
    canInferSalinityDirectly: false,
    qualityFlag: usable ? 'clear_qa_verified' : 'masked_cloud_or_low_coverage'
  };

  return {
    valid: true,
    status: 'ok',
    binaryDecoded: true,
    binaryFormat: 'GEOTIFF_COG_SEPARATE_BAND_TRIPLET',
    source: 'NASA_HLS_V2',
    product,
    version: '2.0',
    granuleId: rGranule,
    mgrsTile: rTile,
    acquisitionDate: rDate,
    bandsJoined: { red: rBandCode, nir: nBandCode, qa: 'Fmask' },
    bandSha256: {
      red: redBand.sha256,
      nir: nirBand.sha256,
      fmask: fmaskBand.sha256
    },
    rawSha256,
    rawByteLength: combinedRawBytes.byteLength,
    rawBytes: combinedRawBytes,
    timeStandard: 'UTC',
    units: 'surface_reflectance_and_ndvi_unitless',
    spatialSupport: {
      nativeGrid: `UTM_MGRS_${rTile}`,
      epsgCode: redBand.epsgCode,
      resolution: '30m',
      pixelScaleMeters: [redBand.pixelScaleX, redBand.pixelScaleY],
      ulEastingM: redBand.ulEastingM,
      ulNorthingM: redBand.ulNorthingM,
      rasterDimensions: { width: redBand.width, height: redBand.height, totalPixels },
      coveredAreaM2: totalPixels * 900
    },
    qa: {
      usable,
      fmaskApplied: true,
      separateBandsVerified: true,
      spatialAlignmentVerified: true,
      scaleFactorApplied: HLS_REFLECTANCE_SCALE_FACTOR,
      totalPixels,
      validClearPixels,
      cloudMaskedPixels,
      shadowMaskedPixels,
      adjacentOrCirrusPixels,
      waterOrSnowPixels,
      nodataPixels,
      canInferBareSoilDirectly: false,
      canInferSalinityDirectly: false
    },
    coverage: {
      fraction: validCoverageFraction,
      cloudFraction,
      validClearPixels,
      totalPixels,
      totalOverpassScenes: 1,
      validClearScenesCount: usable ? 1 : 0,
      passesCoverageThreshold: usable
    },
    observations: [observation],
    records: [observation]
  };
}
