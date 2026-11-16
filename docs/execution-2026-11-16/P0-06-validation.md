# P0-06 · Cohesive project journey · review packet

This is a navigation and information-architecture change, not a change to the scientific engine, game simulation or NASA data providers.

## What changed

- `/explore/` is a small, responsive project map with direct links to six distinct destinations: evidence-first rotation comparison, Guided, Research, 3D game, text story/Experience Lab, and the seven-slide Pitch.
- Visible links return visitors to the map from Welcome, the main workspace (both audience modes), the evidence walkthrough, the game splash and text route, Experience Lab, and Pitch.
- The new page distinguishes **OBSERVED NASA weather**, **ASSUMED crop and soil inputs**, **DERIVED calculations**, and **SIMULATED game outcomes**. It does not say the team has certified farm outcomes.
- The local development server explicitly serves only `explore/index.html` and `explore/style.css`, not internal test files.

## Local verification

- `node --test explore/navigation.test.mjs`: **4/4 passed**, including actual local HTTP responses for all 11 public navigation paths and explicit denial of the internal test file.
- `npm test`: full baseline and project suite passed after the initial change (281/281); rerun before release to include the HTTP matrix test.
- `npm run benchmark`: unchanged numerical engine; synthetic benchmark passed at baseline before this navigation-only change.
- `SOILIQ_CHROMIUM_PATH=/usr/bin/chromium npx playwright test e2e/project-journey.spec.mjs --reporter=line`: **not completed locally**. Chromium aborts on launch in this environment with `socket() failed: Operation not permitted`. This is a browser sandbox limitation, not a passing Playwright result. The three new cases must pass in GitHub Actions at the exact PR SHA before this task is marked BUILT.

## Acceptance gates / known limitations

1. Check the three new Playwright cases: Welcome → Guided → Research → map → Pitch; accessible game text → map → science walkthrough; and keyboard/overflow at 360px.
2. Capture actual desktop and 360px route-map screenshots from a running browser before declaring visual QA complete. Static HTML/CSS review does not replace a screenshot.
3. The Research route opens the existing app, where a visitor explicitly chooses **Research view**. It does not silently change saved audience preferences.
4. This task does not enable Vercel production, create a storage service, provide field-validated recommendations, or change any existing private-data boundaries.
