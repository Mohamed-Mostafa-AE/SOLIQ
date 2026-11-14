import test from 'node:test';
import assert from 'node:assert/strict';
import { setupProgress, monthSummary } from './visuals.js';

test('setup progress reflects completed actions and loaded weather', () => {
  assert.equal(setupProgress({}, 'synthetic').percent, 0);
  assert.equal(setupProgress({fieldSaved:true}, 'nasa').percent, 50);
  assert.equal(setupProgress({fieldSaved:true, calendarReviewed:true, exported:true}, 'import').percent, 100);
});

test('weather reset removes its completion step', () => {
  assert.equal(setupProgress({fieldSaved:true}, 'synthetic').completed, 1);
});

test('season panel aggregates the selected month only and uses final storage', () => {
  const daily = [
    {date:'2024-01-01',crop:'wheat',rain:5,irrigation:0,storage:40},
    {date:'2024-01-31',crop:'wheat',rain:2,irrigation:3,storage:50},
    {date:'2024-02-01',crop:'barley',rain:99,irrigation:0,storage:80},
  ];
  assert.deepEqual(monthSummary({daily},0,100),{crop:'wheat',storage:50,storagePercent:50,rain:7,irrigation:3});
  assert.throws(()=>monthSummary({daily},3,100),/No model/);
});
