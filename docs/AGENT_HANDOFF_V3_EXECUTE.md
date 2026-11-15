# SOLIQ — SEND THESE ASSIGNMENTS TODAY
**Design authority:** docs/GAME_DESIGN_THE_SEVENTH_FIELD_V3.md (this PR #10). **Science authority:** uploaded FieldShift paper + SOLIQ constitution.md/spec.md R01–R16. **Shipping authority:** docs/SUBMISSION_NOW_SPACEAPPS_2026.md. These are work instructions, NOT proof of implementation.

## Shared engineering rule for ALL agents
Repository https://github.com/Mohamed-Mostafa-AE/SOLIQ . PR #2 is already merged into **main**. First check latest main and your existing active PRs (backend #11). Work on a separate topic branch based on current main or deliberately rebase an already in-progress branch. Never overwrite others or auto-merge. Accept a task only with changed files, passing tests, actual browser recording for UI and recorded blockers. Distinguish observed/derived/assumed/simulated and live/cached/unavailable. No fake NASA pixel or water savings. Do not call a design document a 3D game.

## ASSIGNMENT A — Antigravity game director and Babylon engineer
TASKS #7 plus G-V3-02:
- Read V3 GDD end to end and read current experience/engine.js, experience/app.js, dev-server.mjs and science/interval-regret.js.
- Produce **runnable** /experience/play/ world (not /pitch-3d/): localized, dense Nile Delta village, Nada walking, 2 interactive farmers, pump, canal, 6 organic plots; one complete 6–9 minute mission "المية وصلت!" with user agency in 10s.
- Stage progression: explore -> inspect pump/source -> speak with Hassan/Maryam -> choose feasible irrigation action -> real water window solver -> visual fields/NPC reactions -> Time Echo alternative replay -> source-bound receipt. Add Earth Lens and Soil Memory mechanic. Clearly label simulated.
- Read outputs of Codex #12 solver; never calculate physical flows twice or show water when model says OFF. Avoid hardcoded numbers/NASA imagery. Add mobile 360px/WebGL fallback/Arabic & English/subtitles/reduced motion/caption/focus. Tests Playwright capture at least three endings plus ON adequate/OFF zero, and screen recording **of actual running software**.
- Own experience/play/**, game/mission/**, game/ui/**, game/world/** for code; coordinate with art owner on assets. Do not touch general API/provenance backend and third-party adapters. PR to main after review.

## ASSIGNMENT B — Codex water/simulation engineer
TASK #12, owner: science/mesqa-window.js + tests + docs/contracts/mesqa-game-v3.md:
- Realistic time windows ON/OFF, explicit optional storage, pump capacity/failed state, concurrent and turn schedule, positive area, mm to m3, efficiency once, time-sliced supply/demand/unused/loss ledger.
- ON with sufficient available water lets 6 farms irrigate. OFF with no storage delivers exactly zero. Pump failure and pressure-limited scenario affects state only when selected. Do not invent forced conflict or fixed savings.
- Serialize immutable event snapshots/seed; return per-field and per-time flows to renderer, scenario source/units/QA/uncertainty. Tests: ON enough, OFF none, stored OFF conservation, pump fault, schedule vs simultaneous, invalid area/units, null evidence, replay, deterministic equality. Submit PR and consumable function contract before art stages depend on it.

## ASSIGNMENT C — 3D character art (Antigravity + Blender specialist)
TASK #13, owner: game/assets/** (coordinate before game/world edits):
- One premium realistic rigged protagonist Nada, close-up Hassan/Maryam, 4 mid-distance characters and realistic Egyptian pump/canal/soil/vegetation buildings. Original PBR materials GLB, idle/walk/gesture animation, facial/eye/hand animation and LODs. Per-asset source/license and redistribution rights (no blanket 'Quaternius CC0' claim).
- Deliver inspectable runnable WebGL character/scene, 3 game screenshot angles showing faces, lip/captions, actual measured load/FPS at desktop/phone; reject cube characters or static PNG figures presented as final. Hand off GLB and animation/coordinate convention to game engineer. No copying protected games' assets.

## ASSIGNMENT D — Gemini science and Earth observations
TASK #5 plus paper source QA:
- Prioritize original SOLIQ R01–R16: real-source NASA POWER/IMERG/HLS quality and provenance; crop calendars locally sourced, water storage across seasons, equal-horizon feasible rotations, bounded uncertainty interval-regret (B1/B2/B3).
- The manuscript proposes H1–H4 and has synthetic 40,401-point math test, no empirical field benefit. Code/manifest must never say NASA proves rotation saves water.
- Make a 9-chapter 'source vs simulated vs unavailable' evidence matrix, provide actual granule/QA/checksum only when accessible. Ask agronomist/farmer to verify local assumptions. Own adapters/imerg*, adapters/hls*, configs/pilots and science crop modelling only; coordinate with Codex on shared science files. Provide exact test receipt and PR.

## ASSIGNMENT E — Codex backend/integration + second SAR worker
Backend TASK #4, PR #11 pending (target branch feat/omni-earth-prototypes-20261115 **already merged into main earlier** — review/rebase deliberately). Own API/lib, durable evidence storage, ownership/consent, hashes and replay. Do not claim local file store is durable production Vercel storage. Real SAR worker TASK #6 owns compatible ASF scene pair QA/actual pixel path or explicit UNAVAILABLE. No pixel fake. Integration owner TASK #8 merges PRs after CI and live source sanity.

## ASSIGNMENT F — Team Lead / NASA Submission
**MUST NOT WAIT FOR A GTA-scale game.** Official 2026 Space Apps project submission closes Nov 15 23:59 local: Team page Project > required fields > **Submit**. Use public GitHub main + verified deployed site and **real app** video <=30s OR max 7 slides, English narration/subtitles/field text as required. Current pitch-3d/ has 8 slides; do not submit this unmodified as a 7-slide deck. Include original challenge Field Shift, source/AI/legal credits, actual authors, research limitations. Save confirmation receipt. The agent cannot know your external NASA Team Project page status without access.

## Acceptance gate summary
**Can submit now**: documented functional prototype, public repo, actual app screens, source-verified dated NASA POWER context and honest limitations. **Cannot claim ready now**: photoreal free-roam 3D mission, complete operational farm decision support, real NASA/ASF SAR change pixels, validated HLS/IMERG processing, production durable serverless evidence, scientific measured crop benefits, official submission receipt. Never mark these DONE based on design alone.
