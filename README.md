# Soliq — Earth observations. Grounded decisions.

Soliq is a coined brand combining **soil + IQ**: informed decisions about soil, water and crops. This is the team’s adopted brand interpretation.

Authors: Mohamed Mostafa, Youssef Mohamed, Aya Abdelnabi and Mohamed Abdelrahman.

Development repository: https://github.com/Mohamed-Mostafa-AE/SOLIQ. See BENCHMARKS.md and RELEASE_CHECKLIST.md for evidence standards and the final release process.

Working browser application with no build dependencies. Run a local static server
from the repository root and open index.html over HTTP. Run `node --test *.test.mjs`
from the repository root for scientific-engine tests.

## Implemented

- Five responsive workspaces: overview, rotations, evidence, research and field settings.
- Live NASA POWER daily point request (T2M_MIN, T2M_MAX, PRECTOTCORR; UTC).
- Complete-year POWER JSON and daily CSV imports; invalid or missing records rejected.
- Three editable monthly sequences, constant Kc assumptions, soil storage and irrigation budget.
- Hargreaves reference ET and exploratory stress/bucket accounting with daily conservation.
- Historical exposure counts, monthly charts, planned crop duration, transparent priorities.
- Bounded rainfall sensitivity, model card, source ledger and SHA-256 dataset fingerprint.
- JSON reproducibility export, input/daily CSV exports and browser print report.
- Browser-local settings/calendar drafts. Weather is reset on context changes and refresh;
  export full data/results to preserve a run. Crop coefficients persist in exports only.

## Evidence limits

Starts with clearly labeled synthetic weather. No actual NASA response is bundled.
NASA loading requires browser internet access and provider availability; failure keeps
the previous dataset visibly labeled. Imported records are not automatically verified.

Crop calendars and Kc defaults are illustrative assumptions. No independently validated
farm recommendation, complete multi-year agronomic model, profit, yield, soil-carbon,
nitrogen or pest prediction is supplied. The manuscript's interval-regret certificate
is not implemented in this release; finite rainfall sensitivity does not replace it.

IMERG, Landsat, SMAP, ECOSTRESS, soil-survey adapters, polygons, authentication,
shared project storage and experimental cohort evaluation remain future work.

## Method references

NASA POWER Daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
FAO-56 meteorological data: https://www.fao.org/4/x0490e/x0490e07.htm
FAO-56 coefficients: https://www.fao.org/4/x0490e/x0490e0b.htm

No visual brand endorsement by NASA or IEEE is claimed.

## Guided and research views

Use Guided view for plain-language monthly baseline/alternative crop changes. Use Research view for methods, physical metrics, data provenance, diagnostics and exports. Select Arabic for the RTL interface. Both views share the same calculations; see ACCURACY_AND_LANGUAGE.md for validation limits.

Run `npm test` and `npm run benchmark`. GitHub workflow: .github/workflows/benchmarks.yml. The included benchmark snapshot is local execution, not a GitHub run.
