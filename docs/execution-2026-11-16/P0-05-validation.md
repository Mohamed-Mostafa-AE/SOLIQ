# P0-05: evidence-first walkthrough

Branch base: 11c6369eae86cc9b76ba471487e30d532c9f1bab, release/soil-iq-unified-20261116.
Read constitution/spec/tasks and CONTRIBUTING before implementation. No AGENTS.md was found in the checkout.

## Delivered
Open /walkthrough/ from the existing application navigation. Confirm a query point, declare soil/management inputs, edit two monthly calendars, retrieve one complete historical year, compare and export JSON. No scientific equations were changed: engine.js analyze/sensitivity are reused. Priorities affect the existing score only. Outputs remain comparison_only.

The existing GET /api/trends retains its original behavior and adds mode=power-year for a bounded same-origin annual POWER request. NASA hostname and parameters are fixed server-side; coordinates/year pass existing validation. Timeout and metadata/coverage checks fail closed. No additional serverless function, production deployment, storage provider or dependency was added.

Export contains exact raw NASA response text, SHA-256, query URL, timestamp, native metadata, parsed daily records, all assumptions/calendars/crop coefficients, engine version, simulated outputs and sensitivity scenarios. Changing inputs disables stale exports; changing query/consent cancels pending retrieval and clears evidence.

## Actual live acceptance
Browser retrieval: 2026-11-16T14:42:38.297Z. Point: 31.09 N, 30.94 E (declared example, not private parcel). Period: 2024-01-01 through 2024-12-31 UTC, 366 valid days.
Raw SHA-256: c011c6a4c6db708bb54fb217267bcbbe426378c34d4da935b58bb756ba566ac7.
The independently downloaded earlier response has a different hash because NASA response metadata can change; each receipt pins its own exact raw bytes.
See ../evidence/p0-05/p005-live-browser-export.json and the desktop/mobile screenshots. These use a real network request, not Playwright route fixtures.

## Tests
- New Node tests: 4/4 passed, including raw-byte retention, strict missing/unit checks, safe proxy URL construction, query mismatch, unchanged engine outputs and priority semantics.
- Full Node: 200/203 passed on Windows Node 26.13.1. Three existing failures reproduced on unchanged base: two IMERG tests cannot launch the scipy fixture generator; game route test assumes forward-slash filesystem paths. No tests were weakened or skipped to hide these.
- Benchmark passed; engine SHA-256 ae25a82418e4e9083dddbbeae6db44fe6b0fd759f249f786ae00a3141a68f16c unchanged.
- Three focused Playwright cases reported passed: live NASA flow/export, synthetic-fixture interaction/invalidation, and API-error/offline refusal. Explicit P005_LIVE=1 enables the real request; ordinary CI keeps live acceptance opt-in. Browser screenshot review performed for desktop and 360px mobile.
- Initial direct browser NASA access failed; the final same-origin flow passed. Windows Playwright runner teardown remained slow/hanging after reporting case results; passing cases are not a claim of a clean full-suite exit. Full unrelated browser regression suite was not run in this task.

## Known limitations
English walkthrough copy; the existing bilingual application is unchanged. A regional POWER point is not observed weather at a surveyed field. Crop calendars/coefficient values and soil capacity are assumed and uncalibrated; calendars do not establish local agronomic feasibility. Sensitivity is a rainfall scenario envelope, not a confidence interval. No yield/profit/soil-carbon/salinity recommendation. No persistent private receipt storage. Offline use refuses new results rather than loading synthetic weather. Local runtime proof does not establish deployment/production readiness. The frozen challenge archive is untouched.
