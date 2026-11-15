# Gemini/Argon scientific deliveries — merged review notes (2026-11-15)

**State:** This is a **DRAFT integration branch** based on latest `main`. It does **not** imply all NASA raster adapters are production ready or any crop recommendations are field validated. Issue #5 and #6 remain open.

## Artifacts included without replacing team code
- Earlier Gemini package (uploaded `soliq-work-eo-science.tar.gz`, its patch and manifest) reviewed and safely staged here as 17 files: `adapters/**`, `science/**`, `configs/pilots/**`, `tests/**`, and supporting `docs/**`. **No edits** to original `package.json`, `science/interval-regret.js`, `dev-server.mjs` or existing UI.
- Most recent Gemini/Argon delivery `soliq_eo_science_adapters.text` is staged as a **review-only** `science/eo-science-review.mjs`, with risky auto-commit/push removed, import side-effects removed, missing source dates/QA/monthly forcing checks tightened, two blank SAR scenes rejected, and 'pixel pair validated' claim removed.
- Latest scientific game matrix `docs/research/GEMINI_SUBMITTED_EO_GAME_MATRIX.md` is preserved verbatim below an editorial unverified status banner; it must not silently override the canonical V3 nine-arc storyline.
- Added 14 adversarial unit tests in `tests/eo-science-review.test.mjs` and 2 focused incomplete-forcing safety tests. Prior earlier package passed 16 isolated Node tests; latest standalone script passed its 7 local self-test cases; 14 added guard tests passed in isolation. **GitHub Actions on exact branch SHA must be checked before any merge.**

## What was actually fixed
1. Safe merging: preserve main package scripts and the existing conservative `science/interval-regret.js`; additional EO engine is under a separate name.
2. The earlier code can no longer call raw NetCDF4/GeoTIFF imagery `response.json()` and pretend it decoded NASA pixels; until a true decoder is implemented it returns `binary_decoder_required`.
3. User-supplied fixtures do not produce 'verified NASA' status; missing units and source-derived uncertainty defaults are refused. Unsupported/blocked EO sources lead to `comparison_only`.
4. The newest science helper now rejects unknown UTC standard, null-as-zero, missing optical QA, blank SAR metadata, missing crop forcing and invalid utility shapes.
5. Incomplete daily forcing is explicitly `illustrative_incomplete_forcing`, never `canIssueFieldAdvice`, and forces pipeline `comparison_only` even if ordinary coverage thresholds happen to pass.
6. Scientific claims of NDVI vs true soil cover, SAR vs salinity, 40yr hypothetical weather and H1–H4 are bounded; unverified historical archives are reference material, not verified raw NASA bytes.

## What remains blocked (cannot truthfully mark DONE)
- **GPM IMERG V07**: actual authenticated time/area subset acquisition, NetCDF/HDF parser, physical units and QA, raw file hash/source and valid date coverage. NASA Earthdata authentication/EULA and internet are external requirements. Final V07 availability across late 2025–26 requires current product choice.
- **HLS v2 / Landsat**: actual authenticated COG/GeoTIFF window decoding and Fmask/clear pixel aggregation, field polygon+native 30m coverage, raw checksum and example granule receipt.
- **SAR**: compatible acquisition/footprint/pass/polarization/georeference pair and real pixel processing/QA; catalogue matching and metadata screening are insufficient. See #6.
- **Regional crop science**: actual crop calendar/soil properties validated by local experts, farmer data permission, balance calibration and measured farm outcomes; no implicit claim of crop yield, carbon benefit or guaranteed savings. None of this can be fixed by static source edits alone.
- **Production integration**: backend PR #11 has not been merged; durable storage provider configuration, token handling, deployed API/UI/receipts/anonymous security acceptance remain separate. Game #7 and Game Core #14 remain independent workstreams.
- **Cross-workstream conflicts**: Owner must reconcile PR #11 and #15 targeting old feature branches with already-merged main, inspect PR #9 visual edits, and run integration/smoke tests. No blind merge.

## Next contributor command
1. Review this **draft PR** first; if CI is red, fix red tests before merging.
2. On Gemini/Argon machine with authorized Earthdata credential locally only, implement real bounded NetCDF4/GeoTIFF readers and an actual source evidence manifest with downloaded bytes/QA and test.
3. Run `npm test`, `npm run benchmark` and app/browser E2E on latest integrated tree. Do not submit a dummy NASA success.
4. Then ask Codex to connect data contracts to private backend and have reviewer validate crop-science claims.

**GitHub push now exists for these code files via connector. The PR is review/draft only. Do not use uploaded old `--prepare-pr` script or old branch instructions to overwrite any teammate's work.**