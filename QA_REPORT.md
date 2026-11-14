# Verification record

Verified during implementation on 14 November 2026.

## Automated checks

Eleven Node test groups pass. They cover complete/leap-year records; sentinel,
nonfinite and physically invalid weather; NASA JSON parsing and UTC requests;
CSV round trips and blanks; configuration limits; an independent approximate
equinox Hargreaves calculation; daily conservation, storage and irrigation limits
over extreme input combinations; zero-water behavior; identical calendars;
priority isolation; malformed calendars; and sensitivity at rainfall bounds.

JavaScript syntax check passed for the application module.

## Browser checks

- Dashboard, rotation calendar, field settings, evidence and research pages render.
- Real NASA POWER request at 30.05 N, 31.23 E returned 366 daily records for 2024.
- Loaded output showed 95.09 mm annual POWER precipitation. This is a point-query
  data integration check, not an agricultural pilot or independent validation.
- Calendar edit changed the sequence used by subsequent calculations.
- Field name edit saved and appeared in the overview.
- Research JSON downloaded and was inspected locally: 366 raw daily records,
  three sequences, source metadata, daily results and 64-character SHA-256 hash.
- Maximum water-budget residual in that exported run was 1.74e-14 mm or less.
- The exported weather was converted to a CSV and imported successfully through
  the file chooser; the source label changed to imported weather.
- Mobile viewport 390 x 844 showed readable cards and bottom navigation without
  page-wide horizontal overflow. Temporary viewport override was reset.
- No application console errors were observed during the checked flows.

## Limits

No independent field-accuracy, crop-suitability, farmer usability or agronomic
benefit evaluation has been completed. Authentication, remote project storage,
multi-product satellite fusion and the paper's full decision method are not
implemented. Browser print was not independently reviewed as a generated PDF.
Provider outages, every browser/device and screen-reader operation were not tested.

## Visual update — 15 November 2026

Added editorial photographs, four-step setup progress, image-led rotation cards, water/cover meters and an interactive monthly crop/storage explorer. All three photographs loaded in browser checks. Selecting December updated all three storage summaries; marking calendars reviewed changed setup completion from 0% to 25%. Desktop and 390-pixel mobile layouts were inspected without page-wide overflow; viewport override reset. No application console errors observed. Fourteen automated test groups passed, including three new progress/month-summary checks. Setup completion is explicitly distinct from agronomic validation.

## Guided and Arabic update - 15 November 2026

Twenty automated tests passed, covering the existing engine, stronger POWER metadata/strategy validation, derived crop-calendar differences, critical Arabic labels and guided rendering without mutation of shared scientific outputs. The numerical benchmark passed all 81 configurations again. Static HTTP/module checks passed. A generated guided page was checked for untranslated static English copy; only the Unsplash provider identifier remained. The browser-control connection timed out on both preview attempts and on inventory retrieval, so no rendered Arabic/RTL or new interactive browser verification is claimed for this revision. A native-speaker and user review remains required.
