import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('./view.js', import.meta.url), 'utf8');

test('premium walkthrough keeps zero-input NASA demo and the full editable scientific workflow', () => {
  assert.match(html, /class="field-hero"/);
  assert.match(html, /class="hero-primary" href="\?demo=1"/);
  for (const id of ['demo-status', 'demo-controls', 'auto-summary', 'advanced', 'walkthrough', 'source', 'receipt-state', 'receipt-url', 'calendars', 'compare', 'results', 'export', 'limits']) {
    assert.match(html, new RegExp(`id="${id}"`), `${id} must remain after combining the designs`);
  }
  assert.match(html, /href="\.\.\/explore\/"/);
  assert.match(html, /href="\.\.\/pitch-3d\/"/);
  assert.match(html, /NOT SATELLITE IMAGERY/);
});

test('premium receipt and automatic demo use the same verified NASA retrieval and derived model', () => {
  assert.match(js, /const autoDemo=new URLSearchParams/);
  assert.match(js, /receipt\('observed'/);
  assert.match(js, /demoStatus\('NASA POWER · OBSERVED '/);
  assert.match(js, /result\.rawSha256/);
  assert.match(js, /if\(autoDemo\)form\.requestSubmit\(\)/);
  assert.match(js, /renderDemoSummary\(\)/);
  assert.match(js, /if\(!\$\('#consent'\)\.checked&&!publicSample&&!pointRequestAuthorized\)/);
  assert.doesNotMatch(js, /localStorage|sessionStorage|https:\/\/.*fake-data/i);
});
