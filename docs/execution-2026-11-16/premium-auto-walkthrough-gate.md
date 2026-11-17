# Premium Field Decision Studio + zero-input NASA entry · 17 Nov 2026

This integration forward-ports the original, CI-green premium UI work in PR #70 onto the current consolidated release, after the release added a one-click NASA demo in PR #72. Directly merging the older UI branch had three conflicts in `walkthrough/index.html`, `style.css` and `view.js`; resolving them by taking only one side would have discarded a working feature.

## Kept together

- Original SVG Delta illustration with **not satellite imagery** provenance, coherent forest/cream design, mobile navigation, accessible source receipt, editable plan cards, results cards and full comparison table.
- One-click "/walkthrough/?demo=1" public historical example, no typed numbers, no account, no automatic GPS collection, no backend player-data storage.
- Visible OBSERVED NASA source status with date and response SHA-256; ASSUMED soil/calendar data; SIMULATED outcomes and priority-only ranking; UNAVAILABLE/error without invented fallback.
- Beginner priority buttons and optional permission-based location; original explicit-consent advanced form and export remain intact.
- The `/explore/` project map, primary scientific app and game/pitch navigation all remain accessible.

## Release gates

Node contracts cover both old/new DOM and combined receipt/auto-demo logic. Existing Playwright suites `auto-nasa-prototype.spec.mjs` and `walkthrough-premium.spec.mjs` must both pass on the **same exact HEAD**. Verify at 360px as well as desktop, NASA API-error display, export, contrast/focus order and no layout overflow. Real API screenshot and field accuracy require separate review; an API fixture proves UI behavior, not live Earth observations.

The 360px visual artifact intentionally captures one viewport after CSS reduced motion; a headless-browser whole-page screenshot of the long advanced form can exceed the CI screenshot protocol's raster budget. The separate DOM and responsive-overflow assertions still cover the full document, while the desktop comparison retains its full-page artifact.

Current Vercel release preview creation is blocked by the project account's HTTP 402 daily deployment quota. **Do not promote main or claim production updated until an exact-SHA preview and post-deploy public-domain route matrix pass.**
