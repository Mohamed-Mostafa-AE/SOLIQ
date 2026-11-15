# SOLIQ OMNI-EARTH — Integration state and next acceptance gates

Updated: 2026-11-15. Applies to the feature branch, not a deployed release.

## Implemented on this branch
- experience/: interactive lab with four research points, six-farm water game, nitrogen scenario, month replay, six stress hypotheses, six safety cards and simulated assistant messaging.
- lib/trend-service.js and api/trends.js: bounded NASA POWER Daily requests; complete-year annual summaries; Sen and exploratory tie-corrected MK. Raw source hash is retained, but raw source bytes are not durably stored. Serial correlation is not corrected.
- lib/radar-service.js and api/radar-scenes.js: bounded ASF catalogue metadata discovery. No pixel SAR or verified radar change detection.
- dev-server.mjs: localhost by default, public asset allowlist, limited request body, routes and error states.
- Tests for water balance allocation, nitrogen ledger, trend parser, radar catalogue and preview server. Always check CI for latest commit.
- No existing user workspaces replaced. Sidebar links to the experience.

## Nine outstanding mandatory workstreams (NOT nine finished task IDs)
1. Durable evidence provenance, immutable data/run storage, session ownership, explicit consent, retention and cross-session security.
2. Actual GPM IMERG V07 retrieval, correct temporal integration, spatial support and quality checks (not catalogue-only).
3. Actual HLS/Landsat ingestion, cloud/shadow masks, pixel/field aggregation, properly scoped vegetation/cover indicators.
4. Real compatible NISAR/Sentinel-1 pair selection, bounded raster transfer, QA, change detection and map overlay.
5. Sourced local crop/soil/irrigation assumptions, feasible rotations, domain guards, qualified agricultural review.
6. Paper's interval-regret evidence sufficiency with explicit comparison_only, not just finite scenario ranking.
7. Complete coherent RTL/English experience, polygon/area confirmation, interactive time machine tied to immutable runs, accessibility and 360px device QA.
8. Live-source and end-to-end acceptance, independent science/user review, release/rollback verification.
9. Actual deployed URL and submission evidence: official challenge, public demo, credits, video/deck, team membership and confirmation.

The earlier 56 partial / 9 not done tally is a task status heuristic. A partial task is NOT DONE. These nine workstreams span numerous task IDs and need test evidence individually.

## Non-negotiable rules
- Never present fixture/example values as NASA observations or field validation.
- Four study locations represent reference points, NOT consented private farms or validated local soil samples.
- No unsupported water savings, yield, carbon, salinity, fertilizer dose, profit or medical WBGT claims.
- Missing source data returns unavailable, not a fake success.
- Preserve all latest changes to main by the other collaborator; merge via reviewed Pull Request.

## Verify on an internet-connected workstation
1. Node 22+: npm test
2. npm run benchmark
3. npm run dev and open http://127.0.0.1:4173/experience/
4. Validate /api/trends and /api/radar-scenes against live providers and record actual data and QA.
Mocked parser tests do not verify live provider integration.
## Paper-derived research engine (added in this branch)

- science/interval-regret.js implements conservative lower/upper regret enclosures and the strict sufficient separation rule from manuscript equations (13)–(15), with tests referencing synthetic Table III.
- The Experience Lab lets judges widen synthetic utility intervals and watch a conditional R2 distinction become comparison_only.
- The numerical proof is conditional on **justified interval bounds**, eligibility and normalization. It does NOT certify real crop efficacy or make actual field recommendations. Local crop and uncertainty calibration still unfinished.
