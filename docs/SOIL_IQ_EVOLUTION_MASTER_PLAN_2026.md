# Soil-IQ Product + The Seventh Field — Evolution Master Plan
**Design/engineering baseline:** 2026-11-16 · Starting main: `2f196da66c38024b2e5f2c740807940945960417`

## Non-negotiable boundaries
- **Keep Soil-IQ as it is, then improve it.** Do not replace existing scientific screens, Guided, Research, crop screening, Living Farm, data exports, or the landing site with a game.
- **The Seventh Field remains an ambitious standalone 3D game inside the same platform.** The player's personal **My Farm** is ONE meaningful subsystem inside that game, not the entire game or the site's homepage.
- **Game: English by default** (titles, controls, prompts, subtitles, notebook, missions and narration). Retain an optional Arabic localization; do not break the application's independent English/Arabic choices.
- Never mutate the NASA 2026 submission or the archived `archive/soil-iq-spaceapps-2026-11-15` branch. Never force-push, overwrite third-party work or deploy unreviewed changes to production.
- Treat NASA POWER weather, NASA GIBS browse imagery, CMR discovery metadata, lab/survey inputs, calculated estimates, invented game scenarios, and unavailable sources as DIFFERENT evidence classes. No game visualization may be passed off as measured field outcomes.
- Agricultural science and mission gameplay may **share** tested engines, but the game must never invent actual crop suitability, yield, pesticide advice, salinity, field geometry or crop failure rates.

## Audited starting point
| Capability | Found on main | Gap |
|---|---|---|
| Main app | Guided & Research, bilingual UI, field setup, crop plans, crop analyzer, maps and exports | Visual and interaction consistency; usability studies |
| Research | NASA POWER daily forcing, Hargreaves + bucket water balance, sensitivity, 2026 analogue scenarios | Agricultural field calibration and prospective validation |
| Earth observation | GIBS imagery browse, CMR metadata discovery, conditional HLS ingestion tooling | End-to-end quality-controlled pixel products in the user workflow |
| Seventh Field | Babylon.js Nile Delta village, six fields, canal, pump, Nada/Hassan/Maryam, Chapter 0, water solver, Earth Lens, Time Echo | Multi-chapter gameplay, richer mechanics, graphics, accessibility, authentic environmental detail |
| Safety | Some uncertainty disclosures and risk checks in farm-data tools | Playable occupational safety learning and game safeguards |
| Voice | Optional AI explanation endpoint; no verified integrated game speech pipeline | Opt-in speech accessibility, localized scripting, fail-closed AI grounding |
| Deployment | Production Vercel SHA `312e5809` | main is `2f196da6`; newer production not verified |
| Visual PR | Draft PR #33; draft PR #32 demonstration/evidence | Review/CI/merge decisions; no blanket merge |

**Not a complete farm advisory platform yet.** Current data cannot infer a real farmer's property boundaries, laboratory soil status, pesticide needs, health risk, or actual harvest from device location alone.

## Experience architecture — ONE platform, distinct experiences
**Entry:** polished Soil-IQ website with scientific identity and clear navigation.
1. **Field Workspace (existing):** farmer enters/consents to an analysis point and checks actual field context. Animated maps and crop comparisons explain **modelled** trade-offs, preserving provenance and exports.
2. **Research Lab (existing):** raw context, source timestamps, methods, uncertainty ranges, scenario controls, diagnostics, QA and reproducible files.
3. **The Seventh Field (game):** narrative third-person Delta world, exploration, NPC conversations, equipment, seasons, missions, environmental puzzles, optional My Farm and Crop Worlds. Play should work as a fictional learning game even when NASA APIs are offline.
4. **Evidence Bridge:** a versioned, read-only scenario contract passes only properly labelled calculations into game displays. Neither game XP nor dialog changes scientific facts.

## The Seventh Field — full narrative arc (target, not all implemented)
**Chapter 0: The Water Has Arrived!** Nada meets Uncle Hassan and Maryam. Inspect the pump, protect canal access and consider outdoor heat BEFORE playing any powered-pump turn. Choose coordinated, capacity-limited or evidence-first deferral. View the six-field ledger; make room for fairness, shortage, and practical limitations. Existing Chapter 0 now includes a first educational safety gate on this PR.

**Chapter 1: My Farm, My Responsibility.** The player can choose an imaginary district or opt into a location-inspired *game setting*; GPS never silently identifies real land ownership. Inspect soil, choose a crop, manage a plot and open a crop exploration room. One crop world explores maize planting, irrigation demand and weather exposure; subsequent worlds may cover wheat, clover and other plants. No hardcoded yield promises.

**Chapter 2: Heat Over the Fields.** During a fictional hot spell, the player must plan worker shade/water/rest, decide when to pause exposed tasks, and discuss observed vs modelled weather. Do not turn health guidance into a diagnostic or invented heat index.

**Chapter 3: Soil Underfoot.** The player inspects texture, infiltration and waterlogging clues, labels unknown salinity and groundwater data as unknown, and uses a laboratory/survey evidence gate before major choices. Educational soil cross-sections are not field sensor readings.

**Chapter 4: Fields in Balance.** Crop rotations, plant diversity, pest scouting, local expert consultations, equipment costs, labour and markets matter. Pest scenes teach recognition and safe escalation; never recommend an unverified pesticide, dose or spray schedule.

**Chapter 5: The Canal Council.** Farm families negotiate an uncertain water turn; six fields reveal different dependencies. Let transparent quantities from the shared water engine inform collaboration. A fairness score is only one metric, not a guaranteed good social outcome.

**Final Chapter: The Seventh Field.** Integrate evidence, community impacts, climate adaptation and player choices into multiple grounded fictional endings. No fabricated NASA endorsement or claim of verified SDG achievement.

## Sustainability is GAMEPLAY, not branding
Relevant United Nations goals are **learning links**, not earned certifications:
- **SDG 2.4:** resilient and sustainable agriculture — compare crop plans, expose missing evidence.
- **SDG 6.4:** water-use efficiency and scarcity — examine canal supply, modeled shortfall and irrigation allocation.
- **SDG 12.2:** responsible natural-resource use — see avoidable waste, equipment considerations and trade-offs.
- **SDG 13.1:** climate resilience — replay heat/rainfall scenarios with clear source labels.
- **SDG 3 & SDG 8:** worker well-being and safe work practices — heat exposure, equipment and water hazards. These are safety-awareness tasks, not occupational clearance.
- **SDG 15:** land ecosystems — explore soil cover and habitat without fabricating carbon, biodiversity or restoration metrics.

Mission outcomes should distinguish **resource delivery**, **shortfall**, **fairness**, **worker-safety learning**, and **unknowns**. Avoid a single “sustainability score” that hides trade-offs. Unsafe fictional pump-operation choices are blocked until safety-awareness steps are completed; an evidence-first deferral stays available.

Sources: https://sdgs.un.org/goals ; https://sdgs.un.org/goals/goal2 ; https://sdgs.un.org/goals/goal6 ; ILO agricultural OSH guidance https://www.ilo.org/sites/default/files/wcmsp5/groups/public/%40ed_dialogue/%40lab_admin/documents/genericdocument/wcms_828873.pdf

## Visual direction — credible, distinctive, accessible
**Website & app:** Keep existing Soil-IQ hierarchy. Improve spacing, responsive layouts, charts, bilingual typography, motion easing, map selection, and data-loading skeletons. Every motion must clarify a state change. Avoid “all 3D” dashboards or dark patterns.

**Game:** a richly detailed, stylized-realistic Nile Delta with local architectural details, varied mud/silt and wet-ground roughness, canals, bridges, irrigation equipment, field crops, authored characters and readable missions. Use existing Babylon PBR framework, procedural vegetation, three actors and real game-engine animations as a base; review Draft PR #33 against this target. Aim for clear human-scale camera and grounded colors rather than neon overlays. Seasonal shifts, wind and ambient audio are design elements, not evidence of real weather.

**Performance:** mobile quality presets, level of detail, instancing, frustum culling, texture budgets, shader fallbacks, screen-reader/keyboard pathways, subtitles, muted audio and reduced motion. Set verified platform budgets through device profiling; don't claim 60fps before measurement. Use original or correctly licensed assets and record provenance.

**Voice:** English as the default game language. Optional Arabic subtitles/audio. Begin with scripted audio/text; only add opt-in speech input and grounded, bounded AI responses after private-session, consent, cost, accessibility and failure-mode design. No secrets in browser code.

## Technical boundaries
- `engine.js`, `outlook-core.js`, `experience/engine.js`, and `game/core/water-window-adapter.js` must have one documented source of truth per physical quantity. Reuse pure calculations; never duplicate them in render code.
- Define a typed scenario contract: `{ sourceType, sourceUrl, observedAt, retrievedAt, assumptions, units, calculationVersion, scenarioId, values }`. Reject absent/invalid provenance where an observed claim would be implied.
- Game save state is separate from consented field contexts. No passive GPS; no storing precise real location by default; no sync of farmer records without disclosure and security design.
- Protect user data, rate-limit server calls, bound model tokens/cost, and fail closed on unavailable NASA or AI providers.
- Preserve `main` and Production until checked PR + CI + real-device/manual visual QA.

## Release sequence / Codex work packages
**P0 / integration and baseline:** inventory PR #33, #32, #30 and overlapping visual/evidence work; compare diffs; run all Node tests, benchmarks and Playwright; fix season-motion navigation; verify actual deployed commit and staging strategy. Deliver a reproducible release ledger. No force-push.

**P1 / English, safety, sustainability (this PR):** English default on game loader and HUD, optional Arabic, pump training gate, SDG evidence notebook receipts, tests. Manual QA of game dialogue, input focus, mobile, accessibility and scenario honesty before merge.

**P2 / visual quality pass:** use a *separate* review branch for PR #33's ground textures, closer camera, character animation, crop detail, lighting, original assets. Capture before/after real browser frames, mobile perf, no invented NASA pixels. Don't merge visuals without performance + screenshot review.

**P3 / content pipeline:** author multi-chapter quest/state schemas with branching, repeatable tests, saved checkpoints and no dialogue regressions. Vertical-slice Chapter 1 before broad asset creation.

**P4 / My Farm subsystem (inside game only):** farm selection (fictional or permissioned location-inspired), crop cards, maize learning scene, soil-water choices, shared-engine preview, accessible re-entry to story. Do NOT replace Guided/Research.

**P5 / immersive UX + voice:** progressive ambient audio, subtitles/captions, graphics settings, accessibility, optional mic with no silent recording; scripted fallback and grounded AI explorer.

**P6 / scientific & safety evidence:** better crop/soil pilots, provenance audits, quality-controlled satellite adapter where justified, privacy and security review, ILO/SDG learning validation, farmer and educator usability studies.

**P7 / deployment:** modularize APIs for host limits, verified staging, end-to-end smoke suite, measured performance and gradual rollout; attach domain only once stable. Keep NASA archive unchanged.

## Definition of Done for any Codex PR
- Small scope, based on current `main` or deliberately documented dependency; no force-push.
- Real working behavior, not decorative buttons, fake screenshots or promises.
- `npm test` and `npm run benchmark`, plus relevant Playwright tests pass **for that commit**; report any known baseline failures, don't mask them.
- English-first game and Arabic optional locale visibly verified; app bilingual preserved.
- Safety choices have observable effect and no false operational approval; optional no-data/deferral path always exists.
- Distinguish OBSERVED / DERIVED / ASSUMED / SIMULATED / UNAVAILABLE in UI, exports and dialogue.
- WCAG-minded keyboard/focus, no overflow at 360px, reduced motion and accessible text alternatives.
- Human review of screenshots on desktop and mobile; evidence logs retained; no new production deployment until approved.
- Short implementation notes and a release/rollback plan in every PR.

**First executable slice in this branch:** safety-sustainability module + tests, safety-gated pump dialogue and receipts, English-first game loader/HUD, and game E2E regression coverage. Future phases remain planned, not delivered.
