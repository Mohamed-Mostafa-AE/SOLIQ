# Contributing to Soliq

Thank you for helping improve Soliq. The project is an exploratory research
demonstrator, so changes should keep the interface understandable and the
scientific limits visible.

## Before opening a pull request

1. Start from the latest `main` branch and create a focused feature branch.
2. Keep changes small enough to review. Separate interface work from changes to
   scientific calculations when practical.
3. Run the checks below and describe any check that could not be run.
4. Explain visible changes and include the evidence behind any new scientific
   claim. Do not describe a software test as field validation.

## Local setup

Use Node.js 22 or newer.

```bash
node dev-server.mjs
```

Open the local URL printed by the development server. The static browser
application can also be served from the repository root, but API-backed
features such as the 2026 outlook and evidence explanation require the server.

## Checks

```bash
npm test
npm run benchmark
node --check app.js
```

The GitHub Actions workflow also runs the Chromium browser suite for English
and Arabic, plus the live NASA outlook and Sakha benchmark checks. Live network
checks can depend on NASA service availability; report failures accurately
rather than replacing missing observations with synthetic data.

## Code and interface conventions

- Keep the Guided view in short, everyday language. Put equations, model
  terminology and detailed assumptions in the Research workspace.
- Keep English and Arabic interface copy together in `i18n.js` or in the
  relevant bilingual view catalogue. Preserve RTL behavior.
- Use the shared Soliq design tokens and responsive layouts. Avoid adding a
  second, unrelated visual theme.
- Keep crop illustrations in `crop-art.js` and their shared presentation in
  `plant-art.css`. Label them as illustrations, not field observations.
- Preserve keyboard access, visible focus states, readable contrast and
  reduced-motion support.
- Do not add external assets or dependencies without a clear reason.

## Scientific and data integrity

- Preserve source names, units, time standards, date coverage and data
  provenance.
- Never silently fill missing weather days or convert unsupported units.
- Keep user-declared inputs separate from remotely observed data.
- Document assumptions where they are applied, not only in presentation copy.
- A closed water balance demonstrates arithmetic consistency; it does not
  demonstrate agricultural accuracy.
- Do not add claims of yield, profit, soil-carbon, nitrogen or crop-suitability
  prediction unless the required process is implemented and independently
  validated.
- Keep synthetic fixtures visibly distinct from NASA or imported observations.
- Never commit API keys, credentials, private farm records or unredacted
  location data.

## Pull request checklist

- [ ] The change has a clear scope and does not silently alter unrelated model behavior.
- [ ] `npm test` passes.
- [ ] `npm run benchmark` passes when calculation code changes.
- [ ] Browser tests pass when interface behavior changes.
- [ ] English and Arabic wording and layouts have been reviewed.
- [ ] Scientific assumptions and limitations are documented.
- [ ] Screenshots or a preview link are included for visual changes.
