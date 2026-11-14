import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePower, analyze, DEFAULTS, STRATEGIES, CROPS, demoWeather } from './engine.js';

test('POWER metadata cannot silently change units or the daily time standard', () => {
  const json = {header:{time_standard:'LST'},properties:{parameter:{}}};
  assert.throws(()=>parsePower(json,2024),/UTC/);
  json.header.time_standard='UTC';
  json.parameters={T2M_MIN:{units:'K'},T2M_MAX:{units:'C'},PRECTOTCORR:{units:'mm/day'}};
  assert.throws(()=>parsePower(json,2024),/temperature unit/);
  json.parameters.T2M_MIN.units='C';json.parameters.PRECTOTCORR.units='inch/day';
  assert.throws(()=>parsePower(json,2024),/mm\/day/);
});

test('prototype keys and duplicated strategy IDs cannot corrupt calculations', () => {
  const weather=demoWeather(2024);
  const calendar={...STRATEGIES[0],crops:Array(12).fill('__proto__')};
  assert.throws(()=>analyze(weather,DEFAULTS,[calendar]),/known crop/);
  assert.throws(()=>analyze(weather,DEFAULTS,[STRATEGIES[0],STRATEGIES[0]]),/unique/);
});

test('nonfinite crop coefficients fail before returning model results', () => {
  const previous=CROPS.wheat.kc;
  try {CROPS.wheat.kc=NaN;assert.throws(()=>analyze(demoWeather(2024),DEFAULTS),/coefficient/);}
  finally {CROPS.wheat.kc=previous;}
});
