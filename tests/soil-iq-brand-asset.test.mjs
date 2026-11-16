import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';

const asset = new URL('../soil-iq-logo.png', import.meta.url);
const source = new URL('../soil-iq-logo.svg', import.meta.url);

test('shared Soil-IQ PNG has a complete, decodable RGBA pixel stream', () => {
  const png = readFileSync(asset);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  let index = 8;
  let width = 0;
  let height = 0;
  let hasIend = false;
  const imageChunks = [];
  while (index + 12 <= png.length) {
    const size = png.readUInt32BE(index);
    const type = png.toString('ascii', index + 4, index + 8);
    assert.ok(index + size + 12 <= png.length, `${type} chunk is complete`);
    if (type === 'IHDR') {
      width = png.readUInt32BE(index + 8);
      height = png.readUInt32BE(index + 12);
      assert.equal(png[index + 17], 6, 'RGBA color type');
    }
    if (type === 'IDAT') imageChunks.push(png.subarray(index + 8, index + 8 + size));
    index += size + 12;
    if (type === 'IEND') {
      hasIend = true;
      break;
    }
  }
  assert.equal(index, png.length, 'no truncated or trailing chunks');
  assert.ok(hasIend && imageChunks.length, 'complete PNG image');
  assert.equal(width, 1120);
  assert.equal(height, 320);
  const pixels = inflateSync(Buffer.concat(imageChunks));
  assert.equal(pixels.length, height * (1 + 4 * width), 'uncompressed raster is complete');
});

test('brand vector exposes the exact Soil-IQ wordmark', () => {
  const svg = readFileSync(source, 'utf8');
  assert.match(svg, /<title[^>]*>Soil-IQ<\/title>/);
  assert.match(svg, />Soil-IQ<\/text>/);
});
