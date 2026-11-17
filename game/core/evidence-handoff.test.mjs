import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGameEvidenceHandoff, parseGameEvidenceHandoff } from './evidence-handoff.js';

test('only an explicit fictional game context reaches the scientific workspace', () => {
  const handoff = buildGameEvidenceHandoff('cover_first');
  assert.equal(handoff, '../../walkthrough/?from=seventh-field&hypothesis=cover_first');
  assert.deepEqual(parseGameEvidenceHandoff('?from=seventh-field&hypothesis=cover_first'), {
    hypothesis: 'cover_first', source: 'the-seventh-field', dataClass: 'SIMULATED',
  });
  assert.deepEqual(parseGameEvidenceHandoff('?from=seventh-field'), {
    hypothesis: null, source: 'the-seventh-field', dataClass: 'SIMULATED',
  });
});

test('external query cannot inject farm coordinates, assumptions, NASA receipts or unknown story state', () => {
  for (const search of [
    '?from=seventh-field&hypothesis=water_saving&lat=42',
    '?from=seventh-field&hypothesis=bad',
    '?from=seventh-field&hypothesis=cover_first&hypothesis=water_saving',
    '?from=seventh-field&receipt=NASA-FAKE',
    '?from=another-game&hypothesis=cover_first',
  ]) assert.equal(parseGameEvidenceHandoff(search), null, search);
  assert.equal(buildGameEvidenceHandoff('malicious&lat=10'), '../../walkthrough/?from=seventh-field');
});
