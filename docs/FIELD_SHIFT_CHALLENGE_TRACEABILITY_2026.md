# Soil-IQ — NASA Field Shift Challenge Compliance & Demo Contract
**Working branch:** `feat/english-safety-sustainability-foundation-20261116` · **Prepared:** 2026-11-16

## The single product promise
Help a farmer **compare alternative crop rotations** under NASA-derived weather context, **declared local soil conditions**, **crop characteristics** and **farmer priorities**, with visible trade-offs, uncertainty and exportable evidence. The Seventh Field is an additional interactive educational game inside Soil-IQ; it is **not** a replacement for the decision-support application.

Challenge statement: [NASA Space Apps 2026 — Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/). This checklist is a project quality gate based on the publicly visible challenge statement, not an official certification or an assertion of passing NASA judging.

## Challenge-to-code traceability

| Field Shift expectation | Existing Soil-IQ implementation | Product integrity / remaining work |
|---|---|---|
| NASA Earth observations or derived NASA weather data | The main workspace requests NASA POWER daily `T2M_MIN`, `T2M_MAX`, `PRECTOTCORR`; Research documents provenance; HLS acquisition safeguards and GIBS/CMR browsing are separate research capabilities | Data availability is not evidence of local soil status or ownership. Distinguish POWER weather grids from HLS pixels and illustrative game visuals. Do not claim full farm-scale HLS production integration. |
| Farmer's local soil information | Field setup accepts soil-water capacity, initial storage, runoff and irrigation assumptions | Defaults are **assumptions**, not measured soil values. Real soil profiles, salinity and field surveys need verification. |
| Crop characteristics | Monthly rotation calendars use editable exploratory crop coefficients; the analyzer screens six crop profiles with declared phenological stages and evidence gates | Crop Kc values are starting assumptions, not locally validated yields or disease forecasts. |
| Farmer priorities | Guided/Research rotation comparison exposes preference weights and crop plan editing; the crop analyzer asks about local access, labor/equipment and agronomic constraints | Preference score is **not** yield, profit, a sustainability certification or crop suitability proof. |
| Compare rotations and adaptation scenarios | Deterministic daily soil-water accounting compares crop calendars with shared forcing and management assumptions, water demand, shortfall, irrigation, drainage and cover; sensitivity cases test rainfall and Kc assumptions | Show the *paired* evidence and physical units before ranking scenarios. Avoid declaring one rotation universally optimal. |
| Usability and clear decisions | Main English/Arabic Guided and Research workspace, exports, transparent methods, separate 3D game and now a direct in-game notebook link to `/#rotations` | Verify touch, keyboard, accessibility and performance on actual devices. |
| Scientific reliability | Benchmark, numerical mass-balance residual checks, weather coverage/reproducibility checks, unit/browser test suite | Reproducible code is not field calibration. Add independent plot-level validation, reviewed local agronomy and farmer testing before decision claims. |

## Player experience: optional, never the whole product

1. Open Soil-IQ, select **Guided view → Field setup**. User supplies/consents to an analysis point; location is a weather context, **not** proof of owning a field.
2. Load a complete NASA POWER weather year or a documented CSV. Preserve source, date coverage, units and checksum where supported.
3. Open **Crop plans**, compare baseline and alternative crop rotations under the same assumptions and user priorities. Interpret shortfall and irrigation rather than promise future harvest or automatic farm actions.
4. Switch to **Research view** to inspect source limitations, sensitivity, derived metrics and evidence export.
5. Optionally enter **The Seventh Field** 3D village. Hear the farmer perspectives, investigate the seventh-field crop-calendar mystery and test coordinated, limited, or deferred fictional water turns. SDG learning is about trade-offs, not verified achievements.
6. From the game **Evidence Notebook → Sources & Limits**, open **Crop Rotation Workspace**. This navigates to the actual scientific app; it **does not** silently mix game simulation with the user's field data. Anyone who cannot use 3D can also choose the no-WebGL text-first story from the game splash screen.

## Evidence categories and hard-stop rules

- **OBSERVED:** an actual dated, retrievable sensor/data product with source context; NASA POWER is regional meteorology, never a ground-truth soil probe.
- **DERIVED:** a reproducible calculation with declared inputs, model version and units.
- **ASSUMED:** user-specified agronomic inputs, crop calendars and scenario coefficients.
- **SIMULATED:** fictional characters, village pump flows, safety-awareness scenes, SDG learning cards and illustrated future worlds.
- **UNAVAILABLE:** a required source or model output that is not loaded or is unverified. UI must say so explicitly.
- No mandatory equipment-inspection gate appears in the central game narrative. Never fabricate pest treatment instructions, soil measurements, saving percentages, carbon credits, yield, or NASA/UN endorsement.

## Acceptance tests / release gate

| Gate | Observable proof |
|---|---|
| Scientific core | `npm test`, `npm run benchmark`, NASA POWER historical coverage and numerical validation jobs pass. |
| Real browser workflow | Playwright runs the crop workflow, seasons, English/Arabic language, 3D world, safety interactions and the live crop-rotation navigation. |
| Dialogue accessibility | A real click on each canal-council choice must work; desktop joystick hitboxes cannot intercept it. Chapter 0 has a keyboard/screen-reader companion and a no-WebGL route; independent accessibility testing remains necessary. |
| Evidence integrity | Simulated receipt identifiers are marked `SIM ID`, never misrepresented as SHA hashes or observed measurements. |
| Deployment | Keep NASA submission/archive and production unchanged until reviewed; record immutable commit/CI evidence. |
| Visual quality | Review screenshots at desktop and 360px; check animation, text contrast, focus, overflow, reduced-motion, WebGL error paths and frame-time on real devices. |

## Prioritized next work after this narrow PR

- **P0:** close all failing browser checks and perform manual desktop/mobile verification; review overlapping feature PRs before integration.
- **P1:** run an end-to-end farmer demo with two genuine crop sequences, real NASA POWER date receipts and explicit soil assumptions; surface a reviewer-friendly evidence export.
- **P2:** improve low-power graphics and original 3D environmental detail without degrading access, motion or scientific truthfulness.
- **P3:** build Chapter 1 **My Farm** as one part of the larger game, with fictional/local-inspired opt-in world selection and crop-choice loops backed by clearly classified calculations.
- **P4:** validate with local agronomists and farmers; establish pilot soil/irrigation measurements, error bars and research comparison notebooks.

**Submission boundary:** the NASA Space Apps 2026 project submission window ended on 2026-11-15 at 23:59 local time. Changes made to this development PR after that point are future product work and must not be described as part of the frozen hackathon submission unless the official process explicitly permits updates. Being a local award winner is not identical to being announced a Global Nominee; verify the team's actual nomination status through the event rather than guessing.
