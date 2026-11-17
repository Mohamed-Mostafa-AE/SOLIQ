# Soil-IQ Gap-to-Code Board · 2026-11-16

**Baseline:** GitHub [PR #38](https://github.com/Mohamed-Mostafa-AE/SOLIQ/pull/38), green 3-job CI for `fba1976972dfc7884e9f648a76140f24ee5ac6e8`; Vercel preview `READY`, HTML routes verified. This does **not** certify fully interactive 3D or production backend. Some P0 improvements below were written in the next shared worktree and require a NEW exact-commit CI run.

**Status vocabulary:** `BUILT` = implemented and exercised; `PARTIAL` = code exists but spec incomplete; `IN PROGRESS` = worktree code not yet in a reviewed PR; `PLANNED` = not implemented; `BLOCKED` = external account/data/consent/art needed.

## Reality inventory

| Capability | Status | Source/evidence | Remaining boundary |
|---|---|---|---|
| NASA POWER daily and historical climate context | BUILT | `app.js`, `lib/outlook-service.js`, `lib/trend-service.js` | Not ground-truth weather at a private field; no local calibration |
| Rotation screening, water balance, Guided/Research, exports | BUILT exploratory | `engine.js`, `rotation-context.js`, `crop-analysis.js` | Field validity/agronomic review and demo with real dated receipt |
| NASA GIBS browse and CMR scene catalogue | BUILT discovery | `api/eo-browse.js`, `api/eo-catalogue.js` | Not HLS/IMERG/SAR scientific pixels |
| Standalone authenticated HLS download / NDVI scripts | PARTIAL | `tools/nasa_hls_ingest.py`, `tools/hls_point_ndvi.py` | No production in-app real granule + QA workflow |
| Location picker | BUILT point/consent | `location-picker.js` | Not farm ownership, parcel boundary or field sensor |
| The Seventh Field Babylon world and Chapter 0 | PARTIAL game | `experience/play/`, `game/mission/chapter0.js` | Chapters 1–6, checkpoints, consequential follow-on systems |
| Canal-water temporal solver and fictional receipts | BUILT simulated | `game/core/water-window-adapter.js`, `game/core/sustainability.js` | Not measured farm irrigation |
| Egyptian human characters | PARTIAL placeholders | `game/world/characters.js` | No production rigged human GLBs, faces, cloth, gestures |
| Original Egyptian concept art / material references | BUILT research | `game/assets/concepts/`, `game/assets/asset-reference-registry.json` | Image/reference is not a shipped 3D asset |
| Game English/text-first Chapter 0 | PARTIAL inclusion | `game/ui/localization.js`, `experience/play/story.html` | Manual assistive-tech QA and later chapters |
| 3D Pitch | BUILT SVG/CSS presentation | `pitch-3d/` | Not itself 3D game; mobile reading accessibility gap |
| Vercel preview, routes | BUILT preview | PR #38 and its immutable SHA | Production remains separate; route UI interaction and storage need gates |
| Backend Vercel persistence | BLOCKED | `lib/session-runtime.js` returns 503 | Durable transactional/object store and protected credentials |
| Voice AI and speech in game | PLANNED | Text-only `api/explain.js` | Consent, capture, speech fallback, grounded provider, budget |
| PWA/native application | PLANNED | No manifest/service worker/native shell | Native app is optional; start with installable PWA |

## Priority 0 · must work before an honest unified release

| ID | Depends | Complexity 1–7 | Owner/tool | Required code & verification | Status |
|---|---|---:|---|---|---|
| P0-01 Release source-of-truth | — | 3 | Codex Integration | Keep PR #38 and one exact HEAD; CI 3 jobs, immutable Vercel preview, route smoke, rollback link | PARTIAL |
| P0-02 Fix game keyboard ownership | — | 3 | Codex Game | `game/world/controls.js`, HUD hint and Node/E2E: Tab focuses UI, camera toggle C on canvas | IN PROGRESS (worktree implemented) |
| P0-03 English-first NASA game overlay | — | 3 | Codex UI | `game/ui/nasa-browse-overlay.js`; language switch and visible source limitations; browser test | IN PROGRESS (worktree implemented) |
| P0-04 Fix Welcome navigation/repo URLs | — | 2 | Codex Web | `welcome/index.html`, `welcome/paper.html` real SOLIQ repo and Guided entry; Node/browser | IN PROGRESS (worktree implemented) |
| P0-05 Evidence-first farmer walkthrough | — | 5 | Codex + scientific reviewer | One real POWER dated request, 2 crop rotations, user soil assumptions, sensitivity, export, screenshot, offline error | PLANNED validation slice |
| P0-06 Cohesive entry between all surfaces | P0-04 | 5 | Antigravity UX + Codex | One map of paths and shared primary CTAs; tests from Welcome -> Guided/Research -> game/pitch | PLANNED |
| P0-07 Clear NASA versus scenario states on every surface | P0-05 | 4 | Codex Scientific UI | OBSERVED/DERIVED/ASSUMED/SIMULATED/UNAVAILABLE labels in screenshot and downloads | PARTIAL |
| P0-08 Actual mobile-readable Pitch | — | 5 | UI/UX agent + Codex | `/pitch-3d/` 360px reading view, keyboard nav, exporter still 7 slides | PLANNED |
| P0-09 Production persistent session schema | — | 6 | Codex Backend | Durable DB with ownership, atomic operations, indexes and restart/concurrency tests; no paid creation by default | BLOCKED on selected provider |
| P0-10 Private evidence blobs, retention, delete | P0-09 | 5 | Codex Backend | Immutable SHA-verified bytes and cross-session/TTL tests | PLANNED |
| P0-11 Wire production session and smoke | P0-10 | 3 | Codex + Vercel | `POST /api/sessions` 201, restore/read, `DELETE` 204, log safety | BLOCKED until storage configured |

## Priority 1 · distinctive game + research depth

| ID | Depends | Complexity 1–7 | Owner/tool | Required code & verification | Status |
|---|---|---:|---|---|---|
| P1-01 Deepen Chapter 0 choices | P0-02 | 5 | Gemini Pro narrative + Codex | Choice changes next playable question/NPC relationship, with two branch E2E tests | PLANNED |
| P1-02 Time Echo paired rotation bridge | P0-05 | 6 | Codex + geospatial reviewer | Same scientific engine, two plans/assumptions/provenance or comparison_only; no fake future | PLANNED |
| P1-03 Versioned local game checkpoint | P1-01 | 5 | Codex Game | Save non-sensitive flags without GPS; deterministic resume/reset/old-version tests | PLANNED |
| P1-04 Chapter 1 fictional My Farm | P1-03 | 6 | Codex Game + Gemini story | Optional fictional region, plot/crop selection, water/soil learning; real location only opt-in | PLANNED |
| P1-05 Maize crop-learning room | P1-04 | 5 | Codex Science/Game | Seasonal heat and irrigation sensitivity from declared crop assumptions; no pest prescription | PLANNED |
| P1-06 Original rigged Nada GLB | P1-01 | 6 | Antigravity + Blender technical artist | Rights-cleared original model, skin/LOD, idle/walk, in-engine video + phone performance | BLOCKED on approved art asset |
| P1-07 Hassan/Maryam acting pass | P1-06 | 6 | Antigravity + Blender | Original faces, clothes, two dialogue gestures, captions, three live screenshots | PLANNED |
| P1-08 Delta hero scene and season feedback | P1-06 | 6 | Antigravity technical art | Human-scale canal/bridge/plant textures; animated seasonal consequences, licensed assets, WebGL fallback | BUILT procedural technical-art |
| P1-09 Shared design tokens and motion | P0-06 | 6 | Gemini Pro designer + Windsurf/Codex | Color/typography tokens, coherent navigation/states, 360px screenshots, contrast >=4.5:1 | PLANNED |
| P1-10 Accessibility & reduced 3D motion | P0-02 | 6 | Accessibility specialist + Codex | NVDA/VoiceOver/TalkBack/manual, equivalent cues, no 3D camera motion on opt-out | PARTIAL |
| P1-11 3D mobile performance profiling | P1-08 | 5 | Antigravity Babylon engineer | Real FPS, asset budget, load waterfall, three quality presets without unsupported targets | PLANNED |
| P1-12 PWA offline honesty | P0-06 | 5 | Codex Web | Install manifest, cache static UI, show DATA UNAVAILABLE offline, update flows | PLANNED |
| P1-13 Consented field polygon | P0-05 | 5 | Codex Geo + Antigravity UI | WGS84 polygon draw/edit and area, explicit consent, point ≠ owned parcel | PLANNED |
| P1-14 HLS actual granule acquisition | — | 5 | Gemini EO | Same-scene original B04/NIR/Fmask bytes, auth/size/hash/source manifest | BLOCKED on verified Earthdata granule |
| P1-15 HLS cloud-masked NDVI QA | P1-14 | 5 | Gemini EO + Codex Science | Native 30m support, Fmask/reflectance checks, observed source class or abstain | PLANNED |
| P1-16 HLS Research integration | P1-15 | 5 | Codex UI | Dated quality-controlled layer, source/coverage/missing labels, no RGB substitution | PLANNED |
| P1-17 Real IMERG granule decoder | — | 6 | Gemini Earth Science | Verified product/version/units/duration/fill masks, source manifest and tests | BLOCKED on source/data |
| P1-18 Agronomy review and uncertainty | P0-05 | 5 | Agronomist + Codex | Review local crop calendars/soil assumptions, documented limitations; stop unvalidated claims | BLOCKED on expert evidence |
| P1-19 Production API rate/cost controls | P0-09 | 4 | Codex Security | Bounded requests, auth/rate limits, tests for AI/provider failures | PLANNED |

## Priority 2 · progressive expansion, not a launch blocker for the core Field Shift tool

| ID | Depends | Complexity 1–7 | Owner/tool | Required code & verification | Status |
|---|---|---:|---|---|---|
| P2-01 Chapter 2 climate evidence puzzle | P1-04 | 6 | Gemini narrative + Codex | PLAYABLE weather-source discrepancy and consequence, no forecast fiction | PLANNED |
| P2-02 Chapter 3 soil clues | P2-01 | 6 | Gemini + Codex + agronomist | Infiltration/cover illustration, unknown salinity clearly unavailable | PLANNED |
| P2-03 Chapter 4 rotations conflict | P1-02, P2-02 | 6 | Codex Science/Game | Working paired crop plan outcomes with interval uncertainty | PLANNED |
| P2-04 Chapter 5 multiple canal turns | P2-03 | 6 | Gemini + Codex | Repeated fictional turn choices with inherited pact, never forced fake shortages; see `chapter5-6-acceptance.md` | IN REVIEW · PR #75; field-realism remains open |
| P2-05 Finale with alternate evidence-bound endings | P2-04 | 6 | Gemini + Codex | Three evidence-bound alternate fictional endings, local receipt, downstream replay invalidation; see `chapter5-6-acceptance.md` | IN REVIEW · PR #75; device QA pending |
| P2-06 Scripted narration, optional audio | P1-10 | 4 | Creative/audio agent + Codex | Captions, original/licensed English tracks, mute, no audio-only clue | PLANNED |
| P2-07 Microphone permission and speech pipeline | P2-06, P1-19 | 5 | Voice engineer + Codex | Opt-in, visible recording indicator, stop/delete, text fallback | PLANNED |
| P2-08 Grounded Voice AI explanations | P2-07, P0-05 | 6 | Codex AI + Gemini QA | Source-bound, bounded cost, uncertainty refusal, no unsupported pesticide/soil advice | PLANNED |
| P2-09 Real SAR pair and pixel QA | P1-14 | 6 + 6 (split acquisition/QA) | GIS specialist/Gemini | Compatible passes/pol/product + native QA, else unavailable | PLANNED |
| P2-10 Native Android/iOS wrapper | P1-12 | 6 | Mobile engineer + Codex | Only after PWA, consent and offline security; release to stores is separate approval | PLANNED |

## Agent ownership and non-overlap

- **Codex — product/science integrator:** `engine.js`, `rotation-context.js`, `app.js`, reports, `api/*`, `lib/*`, tests. Keep proof with every crop claim. One backend and one crop owner must coordinate common files.
- **Gemini Pro — Earth-data specialist and narrative writer:** `adapters/*`, `science/*`, `configs/pilots/*`, source ledgers and chapter content proposals. Actual source download/license receipts required; cannot mark external research verified from synthetic tests.
- **Antigravity + Blender/technical artist — game/world and art:** `game/world/*`, `game/assets/*`, Babylon performance and original GLB deliverables. Match existing story/solver contracts; no generic low-poly placeholder as final human.
- **Windsurf or Codex Web — shared visual language:** `welcome/*`, `style.css`, `website-theme.css`, `pitch-3d/*`, optional `experience/*`; avoid overlapping active game/UI files without ownership agreement.
- **Accessibility/domain reviewers:** manual NVDA/VoiceOver/TalkBack and local agronomist/farmer studies cannot be replaced by a code assistant.
- **Release lead:** only one integrator updates PR #38 / next candidate; reviewers inspect exact SHA/CI, Vercel project and rollback. Nobody independently pushes `main` or silently deploys a new site.

Every work packet: branch from the *current integration branch head* after confirming SHA; change only owned files; open PR targeting integration branch; include screenshot for UI/GLB, scientific source receipt where relevant, unit + Playwright tests, and a one-paragraph `KNOWN LIMITATIONS`. The historic issues [#3](https://github.com/Mohamed-Mostafa-AE/SOLIQ/issues/3), [#5](https://github.com/Mohamed-Mostafa-AE/SOLIQ/issues/5), [#7](https://github.com/Mohamed-Mostafa-AE/SOLIQ/issues/7), [#13](https://github.com/Mohamed-Mostafa-AE/SOLIQ/issues/13) and [#14](https://github.com/Mohamed-Mostafa-AE/SOLIQ/issues/14) remain relevant; do not declare them closed merely because PR #38 builds.
