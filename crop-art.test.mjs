import test from 'node:test';
import assert from 'node:assert/strict';
import { cropBotanicalSVG, cropFieldSVG, cropRowSVG } from './crop-art.js';

const crops = [
  'wheat', 'barley', 'maize', 'sorghum',
  'legume', 'sunflower', 'cover', 'fallow',
];

test('every crop profile renders complete accessible botanical, field and row SVGs', () => {
  for (const crop of crops) {
    const botanical = cropBotanicalSVG(crop, crop + ' plant');
    const field = cropFieldSVG(crop, { kind: 'card', label: crop + ' field' });
    const row = cropRowSVG(crop, crop + ' crop row');

    for (const svg of [botanical, field, row]) {
      assert.match(svg, /^<svg\b/);
      assert.match(svg, /<\/svg>$/);
      assert.match(svg, /role="img"/);
      assert.match(svg, /aria-label="/);
      assert.doesNotMatch(svg, /undefined|NaN/);
    }
  }
});

test('crop aliases used by the analyzer map to their matching illustrations', () => {
  for (const [alias, label] of [
    ['spring_wheat', 'spring wheat'],
    ['grain_maize', 'grain maize'],
    ['soybean', 'soybean'],
    ['grain_sorghum', 'grain sorghum'],
  ]) {
    assert.match(cropBotanicalSVG(alias, label), /aria-label="/);
    assert.match(cropFieldSVG(alias, { kind: 'card', label }), /aria-label="/);
  }
});

test('each rendered field illustration receives distinct SVG definition IDs', () => {
  const first = cropFieldSVG('wheat', { kind: 'card' });
  const second = cropFieldSVG('maize', { kind: 'card' });
  const firstId = first.match(/id="([^"]+-sky)"/)?.[1];
  const secondId = second.match(/id="([^"]+-sky)"/)?.[1];
  assert.ok(firstId);
  assert.ok(secondId);
  assert.notEqual(firstId, secondId);
});
