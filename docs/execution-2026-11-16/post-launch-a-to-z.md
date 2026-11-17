# Soil-IQ / The Seventh Field — post-launch A–Z completion audit

**Date:** 17 November 2026 · **Baseline:** public Vercel production of merge `75f5315` · **Status:** interactive judged prototype, **not** a validated field advisory or GTA-scale game.

This is a **delivery audit**, not a claim that every item in the historical task table is missing or finished. The original `tasks.md` predates several merged PRs (#75–#78); its labels are not current production evidence. NASA-observed data, declared assumptions and fictional game simulation must remain distinguishable.

| Workstream | Evidence already shipped | Still needed for A–Z maturity | Why / dependency |
| --- | --- | --- | --- |
| A. Product/UX | Welcome, science app, no-input NASA walkthrough, optional game and 3D pitch; bilingual platform | Independent usability tests with farmers, judges and first-time players; task-success analytics only with consent | Automated route checks cannot show whether a user understands the product |
| B. Game interaction | Babylon village, three original rigged characters, Chapters 0–6, soil probe, watering can, story outcomes, alternate text path | **Immediate playable canal-control loop** (this branch), then discoverable objectives, in-world NPC feedback, repeatable consequences, cohesive progression and more expressive acting | The previous gate meshes were interactables with no direct action in the game orchestrator |
| C. Visual quality | Custom Delta materials, procedural vegetation and animated world reactions | Asset/lighting pass, licensed detailed models and acting animations, authored sound, photorealism if desired | Current art is intentionally stylized; GTA fidelity would demand a separate team-scale production |
| D. Science | Dated NASA POWER daily historical retrieval + hash, model uncertainty, two crop plans, provenance labels | Independently measured soil/crop calibration, Egyptian agronomist review, holdout validation, uncertainty auditing | Gridded regional weather cannot establish a particular farm's soil, irrigation or future yield |
| E. Earth observation | NASA POWER and honest browse/discovery routes | Verifiable original HLS reflectance/Fmask, IMERG granule QA, compatible SAR pairs and pixel-level QA manifests | No verified granules/quality masks means *UNAVAILABLE*, not fabricated NDVI or flood detections |
| F. Privacy/backend | No automatic GPS or account requirement in demo; controlled API errors | Durable session/auth/encryption/deletion only **if an opt-in saved-project product is separately approved** | User expressly requested a no-storage prototype; database persistence is not an implied requirement |
| G. Accessibility | Captions, keyboard controls, reduced-motion support, 360px E2E, non-WebGL story mode | Manual NVDA/VoiceOver/TalkBack testing, disabled-user review, focus/contrast regression pass | Automated accessibility checks are necessary but not a manual certification |
| H. Performance/reliability | 4/4 GitHub release CI, 298/298 baseline Node, production Vercel `READY`, 10/10 post-launch route smoke | Real low-power Android/iOS frame-rate and memory benchmarks, long-session/browser compatibility, error-budget telemetry | Hosted Playwright and desktop screenshots are not representative phone profiling |
| I. Voice/AI | Text explanations and existing research paths | Consent-first mic UX, captions, stop/delete, grounded AI refusal, cost ceilings/rate abuse controls | Speech and advisory outputs are higher-risk and require explicit opt-in and tested source bounds |
| J. Native apps/commercialization | Installable PWA shell, public Vercel domain | Optional native Android/iOS packaging, store review, legal/consent and on-call runbooks | Separate product release, not needed for a judged web prototype |

## Immediate playable fix: two-turn canal operation

1. On the game loader select **Play now: operate the canal gates**; a keyboard/mobile-accessible panel opens without mandatory dialogue.
2. Toggle the physical main intake and Hassan/Maryam branch gate meshes from the panel or by walking up to a gate and pressing **E**.
3. Start a *fictional* one-hour turn with 120 m³ assumed supply and declared six-field demands `[35,45,60,40,25,30]` m³. The existing time-sliced water model only opens the selected valves; it computes actual training deliveries instead of cosmetic button scores.
4. Watch the sluice plates and six field hydration states react; change gate configuration for the second turn and inspect cumulative delivery, unmet demand, demand coverage and a clearly simulated Jain-style balance score.
5. Replay from the beginning; no GPS, real field readings, crop prescription, personal data or persistence. The scientific crop-rotation tool remains independent.

**Acceptance checks:** core red-green Node tests for gate validation, no-water-on-closed branches, physically conserved two turns and replay; English and 360px Arabic Playwright interaction, hydration, animations, keyboard focus and screenshot; exact-head GitHub CI; immutable Vercel preview and route smoke before merging to production. Local Chromium may be blocked by host socket permissions; that is not a browser-pass claim.

**External inspiration, not copied assets:** [NASA International Space Apps 2025 Global Winners](https://www.spaceappschallenge.org/2025/awards/global-winners/) includes farming and art/technology examples. Soil-IQ must implement its own original interaction and verify its science.
