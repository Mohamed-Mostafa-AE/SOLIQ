import { defaultScreening, screenCrops } from './crop-analysis.js';
/** Reproducible software diagnostics. These fixtures are not field validation. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { DEFAULTS, STRATEGIES, demoWeather, analyze } from './engine.js';

const root = new URL('.', import.meta.url);
const destination = new URL('./artifacts/', root);
mkdirSync(destination, { recursive: true });
const sha256 = text => createHash('sha256').update(text).digest('hex');
const fixtures = [];
let dailyRecords = 0;
let largestResidual = 0;
let largestIndependentClosureError = 0;

for (const latitude of [-30, 0, 45]) {
  for (const capacity of [50, 150, 300]) {
    for (const irrigation of [0, 300, 1000]) {
      for (const rainScale of [0.5, 1, 1.5]) {
        const config = { ...DEFAULTS, lat: latitude, capacity, initial: capacity / 2, irrigation, rainScale };
        const weather = demoWeather(config.year);
        const result = analyze(weather, config);
        for (const strategy of result.results) {
          assert.ok(strategy.maxResidual < 1e-9, 'Daily conservation failed');
          assert.ok(strategy.irrigation <= irrigation + 1e-9, 'Irrigation budget exceeded');
          assert.ok(strategy.daily.every(day => day.storage >= -1e-9 && day.storage <= capacity + 1e-9));
          // Independent integrated closure from reported flux totals and end storage.
          const effectiveRain = strategy.daily.reduce((sum, day) => sum + day.rain * (1 - config.runoff), 0);
          const closure = strategy.finalStorage - config.initial - effectiveRain - strategy.irrigation + strategy.drainage + strategy.et;
          assert.ok(Math.abs(closure) < 1e-8, 'Integrated water budget failed');
          largestResidual = Math.max(largestResidual, strategy.maxResidual);
          largestIndependentClosureError = Math.max(largestIndependentClosureError, Math.abs(closure));
          dailyRecords += strategy.daily.length;
        }
        fixtures.push({ latitude, capacity, irrigation, rainScale, weatherSHA256: sha256(JSON.stringify(weather)), results: result.results.map(({ id, et, deficit, finalStorage, coverDays }) => ({ id, et, deficit, finalStorage, coverDays })) });
      }
    }
  }
}

const cropFixtures=[];
let cropConfigurations=0,cropProfileRuns=0,cropDailyRecords=0,cropMaxResidual=0;
for(const capacity of [50,150,300])for(const irrigation of [0,300,1000])for(const month of ['01','05']){
 const config={...DEFAULTS,capacity,initial:capacity/2,irrigation};
 const plan=defaultScreening(config.year);plan.start=`${config.year}-${month}-01`;
 const result=screenCrops(demoWeather(config.year),config,plan,STRATEGIES[0],'synthetic');
 assert.equal(result.shortlist.length,0,'Synthetic evidence must never create a shortlist');
 for(const row of result.results){
  const m=row.metrics;
  assert.ok(m.irrigation<=irrigation+1e-9&&m.maxResidual<1e-9);
  assert.ok(Math.abs(m.finalStorage-config.initial-m.rain+m.runoff-m.irrigation+m.drainage+m.actual)<1e-8);
  cropFixtures.push({capacity,irrigation,start:plan.start,crop:row.id,demandMm:m.demand,unmetDemandMm:m.deficit,endStorageMm:m.finalStorage,maxResidualMm:m.maxResidual});
  cropProfileRuns++;cropDailyRecords+=m.daily.length;cropMaxResidual=Math.max(cropMaxResidual,m.maxResidual);
 }
 cropConfigurations++;
}

const forcing = demoWeather(DEFAULTS.year);
const baseline = analyze(forcing, DEFAULTS);
const repeat = analyze(forcing, DEFAULTS);
assert.deepEqual(baseline, repeat, 'Repeated calculations are not deterministic');
const permutation = analyze(forcing, DEFAULTS, [...STRATEGIES].reverse());
for (const expected of baseline.results) assert.deepEqual(permutation.results.find(row => row.id === expected.id), expected);
const dry = forcing.map(row => ({ ...row, rain: 0 }));
assert.ok(analyze(dry, { ...DEFAULTS, initial: 0, irrigation: 0 }).results.every(row => row.et === 0));

for (let i = 0; i < 5; i++) analyze(forcing, DEFAULTS);
const timings = [];
for (let i = 0; i < 30; i++) {
  const start = performance.now();
  analyze(forcing, DEFAULTS);
  timings.push(performance.now() - start);
}
const sorted = [...timings].sort((a, b) => a - b);
const enginePath = existsSync(new URL('./dist/engine.js', root)) ? './dist/engine.js' : './engine.js';
const report = {
  project: 'Soliq', schemaVersion: 1,
  evidenceClass: 'synthetic_software_diagnostics',
  generatedAt: new Date().toISOString(),
  provenance: {
    commit: process.env.GITHUB_SHA || null,
    workingTreeDirty: process.env.GITHUB_ACTIONS === 'true' ? false : null,
    engineSHA256: sha256(readFileSync(new URL(enginePath, root))),
    cropModelSHA256: sha256(readFileSync(new URL('./crop-analysis.js',root))),
    fixture: 'demoWeather(year=2024); deterministic, invented daily values',
    githubRun: process.env.GITHUB_RUN_ID || null,
    runtime: process.version, platform: process.platform, architecture: process.arch,
    cpu: os.cpus()[0]?.model || 'unknown',
  },
  checks: {
    configurationCases: fixtures.length,
    strategyRuns: fixtures.length * STRATEGIES.length,
    dailyRecords,
    largestDailyResidualMm: largestResidual,
    largestIntegratedClosureErrorMm: largestIndependentClosureError,
    conservationPassed: true, irrigationLimitsPassed: true, storageBoundsPassed: true,
    deterministic: true, candidateOrderInvariant: true, zeroWaterCheckPassed: true,
  },
  cropScreening:{fixtures:cropFixtures,configurationCases:cropConfigurations,profileRuns:cropProfileRuns,dailyRecords:cropDailyRecords,largestDailyResidualMm:cropMaxResidual,integratedClosurePassed:true,syntheticShortlistBlocked:true},
  performance: { warmups: 5, repetitions: 30, medianMs: (sorted[14] + sorted[15]) / 2, p95Ms: sorted[28], samplesMs: timings, scope: 'Three strategies over 366 days; excludes downloads, rendering and exports. Machine-specific, not a comparative speed claim.' },
  independentAgronomicValidation: { status: 'not_performed', yield: null, soilCarbon: null, waterSavings: null },
  fixtures,
};
writeFileSync(new URL('crop-fixtures.csv',destination),'capacity_mm,irrigation_mm,start,crop,demand_mm,unmet_demand_mm,end_storage_mm,residual_mm\n'+cropFixtures.map(r=>[r.capacity,r.irrigation,r.start,r.crop,r.demandMm,r.unmetDemandMm,r.endStorageMm,r.maxResidualMm].join(',')).join('\n'));
writeFileSync(new URL('benchmark.json', destination), JSON.stringify(report, null, 2));
writeFileSync(new URL('fixtures.csv', destination), 'latitude,capacity_mm,irrigation_mm,rain_multiplier,strategy,et_mm,deficit_mm,final_storage_mm,planned_crop_days\n' + fixtures.flatMap(f => f.results.map(r => [f.latitude, f.capacity, f.irrigation, f.rainScale, r.id, r.et, r.deficit, r.finalStorage, r.coverDays].join(','))).join('\n'));
const markdown = `# Soliq software benchmark\n\nEvidence class: **synthetic software diagnostics**. No field performance claim.\n\n| Check | Result |\n|---|---:|\n| Configurations | ${fixtures.length} |\n| Strategy runs | ${report.checks.strategyRuns} |\n| Daily model records | ${dailyRecords} |\n| Crop-screening configurations | ${cropConfigurations} |\n| Crop-profile runs | ${cropProfileRuns} |\n| Crop daily records | ${cropDailyRecords} |\n| Crop largest daily residual | ${cropMaxResidual.toExponential(3)} mm |\n| Largest daily residual | ${largestResidual.toExponential(3)} mm |\n| Largest integrated closure error | ${largestIndependentClosureError.toExponential(3)} mm |\n| Conservation / storage / irrigation | Passed |\n| Determinism / order invariance / zero-water check | Passed |\n| Median calculation time (30 repeats) | ${report.performance.medianMs.toFixed(2)} ms |\n| p95 calculation time | ${report.performance.p95Ms.toFixed(2)} ms |\n\nNode ${process.version}; ${process.platform}/${process.arch}. Commit: ${report.provenance.commit || 'unavailable'}. Working tree dirty: ${report.provenance.workingTreeDirty}.\nEngine SHA-256: ${report.provenance.engineSHA256}.\n\nTiming excludes acquisition, UI and exports and varies with hardware. Synthetic conservation and stability do not establish agronomic accuracy, soil-health improvement or superiority to another tool. Full inputs and per-fixture outputs are in benchmark.json and fixtures.csv.\n`;
writeFileSync(new URL('benchmark.md', destination), markdown);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
console.log(markdown);
