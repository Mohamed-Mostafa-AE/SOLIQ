import test from 'node:test';
import assert from 'node:assert/strict';
import { guidedOverview, guidedRotations } from './guided.js';
import { DEFAULTS, STRATEGIES } from './engine.js';

function sampleDaily(year) {
  const rows = [];
  const date = new Date(Date.UTC(year, 0, 1));
  while (date.getUTCFullYear() === year) {
    rows.push({
      date: date.toISOString().slice(0, 10),
      storage: 72,
      rain: 1,
      irrigation: 0,
    });
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return rows;
}

test('Guided view uses short everyday labels and keeps research terms out of the overview', () => {
  const daily = sampleDaily(2024);
  const state = {
    config: { ...DEFAULTS, year: 2024, name: 'Test field', capacity: 150 },
    source: { kind: 'synthetic' },
    output: {
      results: [
        { daily, deficit: 120, coverDays: 280 },
        { daily, deficit: 90, coverDays: 300 },
        { daily, deficit: 105, coverDays: 290 },
      ],
    },
    strategies: STRATEGIES,
    selectedMonth: 5,
    selectedStrategy: 1,
    months: Array.from({ length: 12 }, (_, i) =>
      new Date(Date.UTC(2024, i, 1)).toLocaleString('en', { month: 'long', timeZone: 'UTC' })),
  };
  const html = guidedOverview(state, {
    esc: value => String(value).replace(/[&<>"]/g, ''),
    fmt: value => Number(value).toFixed(1),
    progressPanel: () => '<div class="setup-progress"></div>',
  });

  for (const phrase of [
    'Plan what to grow next.',
    'Compare crop plans',
    'Compare with',
    'Water left in soil',
    'Before you decide',
    'How to read this comparison',
  ]) assert.ok(html.includes(phrase), 'Missing simple Guided copy: ' + phrase);

  assert.ok(!html.includes('data-go="analyzer"'));
  assert.ok(!html.includes('data-go="evidence"'));
  assert.ok(!html.includes('data-go="research"'));

  for (const term of ['Hargreaves', 'evapotranspiration', 'phenology', 'Kc =']) {
    assert.ok(!html.includes(term), 'Research wording leaked into Guided view: ' + term);
  }
});

test('Guided crop-plan editor is farmer-facing and exposes all monthly crop choices', () => {
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(2024, i, 1)).toLocaleString('en', { month: 'long', timeZone: 'UTC' }));
  const html = guidedRotations({
    config: { ...DEFAULTS, year: 2024, name: 'Test field' },
    source: { kind: 'synthetic' },
    output: { results: [] },
    strategies: STRATEGIES,
    months,
  }, {
    esc: value => String(value).replace(/[&<>"']/g, ''),
    fmt: value => Number(value).toFixed(1),
  });

  assert.ok(html.includes('Choose what you plan to grow.'));
  assert.ok(html.includes('How to use your crop plans'));
  assert.equal((html.match(/data-crop=/g) || []).length, 36);
  for (const term of ['Hargreaves', 'evapotranspiration', 'phenology', 'boundary conditions', 'Kc =']) {
    assert.ok(!html.includes(term), 'Research wording leaked into Guided crop plans: ' + term);
  }
});
