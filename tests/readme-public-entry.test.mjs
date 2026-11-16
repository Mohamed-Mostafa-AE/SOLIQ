import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const readme = readFileSync(fileURLToPath(new URL('../README.md', import.meta.url)), 'utf8');

test('public README uses the Soil-IQ brand and stable production entry', () => {
  assert.match(readme, /^# Soil-IQ — Earth observations\. Grounded decisions\.$/m);
  assert.match(readme, /^\*\*Current production application \(not the unreleased integration candidate\):\*\* https:\/\/soliq-delta\.vercel\.app\/$/m);
  assert.doesNotMatch(readme, /soliq-[a-z0-9]+-mohamedhussam09-9067\.vercel\.app/);
  assert.doesNotMatch(readme, /utm_source=chatgpt\.com/);
});
