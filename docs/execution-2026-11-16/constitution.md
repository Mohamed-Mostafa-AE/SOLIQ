# Soil-IQ Execution Constitution · 2026-11-16

This governs new work after the frozen 2026 NASA Space Apps submission. It is a release checklist, not evidence that features are complete.

1. **Field Shift first.** Soil-IQ's primary deliverable is a decision-support tool for comparing crop rotations with NASA Earth observations, declared local soil inputs, crop characteristics and farmer priorities. The Seventh Field is a substantial optional 3D game, not the app's replacement.
2. **Preserve the existing product.** Keep Guided, Research, NASA POWER weather, benchmark, crop analyzer, Living Farm, EO browse, exports, Welcome, Experience Lab, and 3D Pitch. Never confuse demo/game data with a farmer's actual field.
3. **Evidence classes are mandatory:** OBSERVED, DERIVED, ASSUMED, SIMULATED and UNAVAILABLE. No RGB imagery is a verified HLS NDVI reading; geolocation is a *point*, not a parcel or ownership claim; historical weather is not a calibrated seasonal forecast.
4. **Sustainability drives game choices.** Water efficiency, crop diversity, soil cover, fairness and livelihoods can conflict. Avoid fictional sustainability certification and mandatory equipment-inspection gates. The player can defer a decision pending evidence.
5. **English-first game; bilingual platform.** Game controls, dialogue, status, captions, accessibility and errors default to English with optional Arabic. The scientific app retains its own language settings and accessible RTL.
6. **Inclusive by design.** Keyboard/focus, 360px layouts, screen-reader-labelled content, captions, reduced motion, muted audio and a working no-WebGL story path. Actual disability-user and device checks are still required before claiming full compliance.
7. **Authentic original Egyptian art.** Use Egyptian Delta references for architecture, environment and original fictional characters, not recognizable film actor/character likenesses or copied footage/music/models. Every imported asset needs a verifiable redistribution license and live rendering proof.
8. **Privacy and security before persistence.** Never infer farm ownership or silently store GPS; obtain explicit consent, use private durable storage and per-session authorization, delete with tested retention. No secrets in client code or paid-service provisioning without appropriate authority.
9. **One controlled release.** Every contributor uses a separate branch/PR, an explicit file-ownership boundary and a unique acceptance test. No force pushes or blind merges. Stage on Vercel with exact Git SHA, verify actual routes and mobile gameplay, promote only the approved consolidated release, preserve rollback.
10. **Honest progress.** A design bible, image concept, green unit suite, Vercel `READY`, functional prototype and production-ready feature mean different things. Mark each task DONE only after code, meaningful tests and, for UI/3D, real runtime screenshots or device evidence.

Canonical integration candidate: [PR #38](https://github.com/Mohamed-Mostafa-AE/SOLIQ/pull/38) (`release/soil-iq-unified-20261116`, originally `fba1976972dfc7884e9f648a76140f24ee5ac6e8`). Original archived challenge submission must remain unchanged.
