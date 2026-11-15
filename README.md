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

## Conditional crop analyzer

Open Crop analyzer to compare six sourced crop profiles, review seed/equipment/market/local constraints, change assumed growth-stage lengths and inspect water sensitivity. The rest of your baseline calendar stays in place. See CROP_ANALYZER.md.

Browser checks run in GitHub Actions with a pinned test runner. To reproduce: `npm install --no-save --package-lock=false @playwright/test@1.65.1`, `npx playwright install --with-deps chromium`, then `npx playwright test`. Numerical tests remain dependency-free.


## 2026 Living Farm and model explanations

Open `/outlook/`, `/welcome/#living-farm` or **2026 Living Farm** in the app. Run `node dev-server.mjs` for local development with the API; a static server alone cannot provide the new endpoints. Vercel runs `api/outlook.js` and `api/explain.js` as Node functions.

- `/api/outlook` retrieves 2026 NASA POWER UTC temperature and rainfall through the server's current date minus three days (or December 31 after 2026). Exact returned coverage and retrieval timestamps are displayed. It also retrieves complete 2016–2025 daily histories. A trailing publication gap is reported; an interior gap rejects the dataset. There is no synthetic fallback.
- Five nearest historical weather years, selected using the last 60 available days, provide alternative remaining-year weather sequences. The bucket model starts on January 1 and carries water and irrigation consumption through the observation/scenario boundary. P10/P50/P90 are empirical historical-scenario percentiles, not calibrated confidence intervals. Calendar illustrations do not predict growth or yield.
- A ten-fold retrospective, leave-one-year-out rainfall/heat-day check compares the analogue method with historical median climatology. These are retrospective weather checks, not forward-chained evaluation or crop-outcome validation. Small samples, station comparisons, independent locations and prospective validation remain necessary.
- `api/explain.js` offers Kimi K3.1 Pro (`moonshotai/kimi-k3.1-pro`) and DeepSeek V4.1 Flash (`deepseek/deepseek-v4.1-flash`), verified against the live Gateway catalog on 2026-11-15. These are hosted open-weight models; this project does not self-host their weights. Hosted inference may cost money. The numerical model supplies the evidence, and the language model explains trade-offs. No free-form client prompt or client-computed metrics enter the model request.
- Vercel deployment OIDC authenticates to AI Gateway through the platform's per-request `x-vercel-oidc-token` header (or a local environment token). Local tests can use an uncommitted `AI_GATEWAY_API_KEY`. Never place credentials in browser code. Account activation/credits are required if Gateway reports 402/403. Provider failures remain visible; they never become a made-up AI response. Explanations may still be inaccurate and require human review.
- In-memory request throttling and explanation caching are per function instance; production traffic needs a durable limit or platform firewall policy. No account, private farm-record database or provider-specific data-retention guarantee is implemented.

The 2026 outlook currently supports latitude −60° to 60° because the existing ET model is restricted to that range. Its weather is regional gridded context, not field-scale soil moisture, crop classification or ground truth. The existing complete-year workspace and its synthetic starting example remain separate and visibly labeled.

## Team material integration and farm context

See `TEAM_DATA_REVIEW.md` and `data/team-review-summary.json` for the supplied Drive material audit and explicit challenge coverage. The old annual telemetry is not used as daily NASA weather or verified local soil information.

The 2026 form now accepts actual monthly calendars, farmer priorities, dated soil-source declarations, optional volumetric hydraulic inputs and option-specific feasibility declarations. Decision cards expose planned fallow/rainfall overlap and sourced soil-protection mechanisms. Unknown or refused inputs cannot produce a preferred option. These declarations do not establish independent field validation. The new point/map chooser does not save precise device location automatically; the user confirms the analysis point before new weather retrieval. Study locations import only coordinates and names from the team's files. Check the evidence export for the exact context and model assumptions.
