import test from 'node:test';
import assert from 'node:assert/strict';
import { farmSVG } from './art.js';

test('every original pitch field illustration carries a distinct Nile Delta mesqa and bridge', () => {
  for (const mode of ['mixed', 'dry', 'layers', 'documents']) {
    const svg = farmSVG(mode);
    assert.match(svg, /data-art="delta-canal"/);
    assert.match(svg, /data-art="mesqa-bridge"/);
    assert.match(svg, /data-art="sakia-wheel"/);
    assert.match(svg, /concept illustration|Conceptual/i);
    assert.doesNotMatch(svg, /(?:href|src)="https?:\/\//, 'The illustration must use only locally authored SVG');
    assert.equal((svg.match(/<svg\b/g) ?? []).length, 1);
    assert.equal((svg.match(/<\/svg>/g) ?? []).length, 1);
  }
});
