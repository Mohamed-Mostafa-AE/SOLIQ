> **V2 SUPERSEDES THIS FIRST DRAFT.** Read [GAME_DESIGN_WATERKEEPERS_V2.md](./GAME_DESIGN_WATERKEEPERS_V2.md) for the research-grounded ON/OFF supply model, a non-forced human conflict, full SOLIQ storyline, realistic character art pipeline, corrected 2026 asset licensing and W01–W12 acceptance. This v1 file is retained solely as design history.

# SOLIQ — حكاية المسقة | THE WATERKEEPERS
## Game Design Bible · GDD v1.0 · 15 November 2026

> **This is the approved design target and implementation brief, NOT a claim that these mechanics have been coded.** The existing /experience/ page is a menu of numerical prototypes; this design transforms it into an actual game. It must never replace working SOLIQ analytical tools or imply scientific field validation.

### Source heritage and inspiration
- SOLIQ master playbook: Cooperative Mesqa Chessboard F1–F6, independent vs coordinated allocation, six seasons S1–S6, 4 rotations, water-fairness/Jain, Time Machine, six-path soil detective, Drainage Safety Gate, Farmer Safety Shield and an 8-stop judge walkthrough. Historic hardcoded outcomes (e.g., 36% saving / Jain 0.985 / salinity flip 2.88) are **script/reference examples**, not certified real simulation outputs.
- Current feature branch: \`experience/engine.js\` implements deterministic six-field allocation, \`experience/app.js\` renders form controls; \`science/interval-regret.js\` provides illustrative conditional regret proof; \`api/trends.js\` is NASA POWER annual source; \`api/radar-scenes.js\` is ASF **catalogue-only**.
- Research inspirations (study mechanics, DO NOT copy protected art/UI/story): Timberborn — visible water networks and controls; Terra Nil — satisfying environmental transformation; Farming Simulator 25 — approachable human farm life, voiced tutorial NPCs; Against the Storm — competing needs and escalating seasonal events; Mini Motorways — frictionless network interactions; UNEP-DHI Aqua Republica — scientifically grounded water-management choices; University of Twente River Basin Game — head/tail competition and cooperation.
- Technical sources: Babylon.js supports WebGL 2, scene picking, cameras, GLTF assets, animation and mobile web; Phaser/PixiJS are good alternatives for 2D, but **this target is a compact 3D/2.5D environment**. Avoid framework rewrite: the game is a lazily loaded route on top of the present Node/Vercel site, no mandatory registration.

## 1. One sentence
The player is a newly appointed **water-turn coordinator** in a fictional Nile Delta farming community: talk to six neighboring farmers, observe their land and the shared canal, inspect Earth data, negotiate planting/irrigation decisions and play through a season where one family's extra water can cost another family's crop. **The player makes visible trade-offs in a living world.**

Genre: story-driven, 3D/isometric rural management adventure + cooperative resource puzzle; playable single-user web; nonviolent; environmental and human stakes, not a generic farm dashboard.

Working title: **SOLIQ — حكاية المسقة | The Waterkeepers**.
Tagline: "المية واحدة... والقرار بيأثر على الكل."
Setting: Research-inspired East Delta landscape around Zankalon, **fictional people, fictional field boundaries and simulated scenarios**, not real privately recorded farmers or satellite imagery unless separately verified.

## 2. Mandatory design pillars
1. **LIVING WORLD:** A continuous walkable scene (not six cubes or sliding cards): organic fields, rows of realistic crops, a meandering main mesqa canal with visible water, mud-brick farmhouses, irrigation pumps, trees, utility wires, dust, moving NPCs and changing daylight.
2. **HUMAN CONSEQUENCES:** Six farmers with recognizable faces, distinct voices/needs and conditional reactions; one decision makes a person grateful and someone else concerned. No arbitrary villain or "perfect" mathematical choice.
3. **PLAYER AGENCY:** Walk/inspect/converse/turn physical gate controls/mark crop dates/schedule canal turns. The season advances ONLY when player chooses; pause/replay possible.
4. **SCIENTIFIC HONESTY:** All visual outcomes trace to declared deterministic simulation state or a real source record. NASA data informs weather context, not a magical forecast or field observation. Unsupported yield/health/soil claims never displayed as fact.
5. **LEARN THROUGH CONSEQUENCES:** Give a role, mission, constraints, experiment, consequence and debrief. Never force the player to read a lecture to advance.

## 3. Art direction (NOT blockworld)
- **Premium stylized realism**, warm Nile Delta gold/teal palette; 2.5D/3D camera 35–55°; cinematic atmospheric perspective; planted crop rows, textured wet/dry soil, pump pipes, lush field edges, palms, village roofs, cloudy skies, moving shadows and visible irrigation channels. Use believable human scale.
- No geometric cube city, untextured rectangles masquerading as fields, emoji farmers, random voxel islands or floating KPI cards covering the world.
- Focus on **one densely art-directed map**, not fake giant open world. Organic polygons with beveled terraces; patches and growth stages from asset meshes/sprites, not repeated identical square crops.
- 3D view via Babylon.js + licensed optimized GLB assets and environment textures. Fallback low graphics and clear no-WebGL notification. Character locomotion/gesture clips; close-up NPC portrait dialogue cards with short voice lines (optional; accessible captions mandatory).
- Camera has THREE intentional states:
  1. **Walk**: third-person avatar, WASD/touch stick/click-to-move, follow camera; click near an NPC, canal gate, field or soil sample for interaction.
  2. **Strategy**: smooth orbit/pan/zoom isometric overview with individual field boundary highlights, crop calendar ribbons and pump/valve controls.
  3. **Earth Evidence**: overhead satellite-style map, source badges & science overlays; REAL imagery only when actual verified products exist; otherwise clearly "catalogue metadata" or unavailable.
- No copyrighted copied assets/maps from reference games. Use CC0 models/textures with recorded per-asset source/license: Quaternius compatible character/crop/nature packs (check pack-level CC0 and scale) and Poly Haven CC0 HDRI/PBR textures. Original silhouettes, Egyptian farming props, gates and canal geometry are authored for SOLIQ. Record optional audio license.

## 4. Core loop (every ~1–3 min, for an 8–12 minute first vertical slice)
**Explore** -> **hear a human problem** -> **inspect evidence** -> **negotiate/plan** -> **simulate a water turn** -> **watch physical + social consequences** -> **rewind and change course** -> **receipt & unlock next chapter**.

On player action, the local simulation engine runs: \`simulateTurn(currentState, playerDecision)\` -> immutable event, allocation, delivered/shortfall, Jain fairness, budget ledger and assumptions. Animation simply interprets those results. Never compute a separate "pretty number" for the screen.

Real NASA year/period and source metadata may supply context cards. A historical observation may change the **scenario settings** only if the player explicitly chooses that dataset; no silent replacement of simulated events.

## 5. Fictional human characters, with differentiated needs
- **Player / Amal or Youssef (chosen avatar)** — field water coordinator. Not a magic farmer; earns trust through explanations and fair decisions.
- **Hajj Hassan, F1/head** — older upstream farmer, early rice window, accustomed to taking first turn; technically experienced; skeptical of a new schedule.
- **Maryam, F6/tail** — young farmer running a shared family holding; losing her water turn exposes unfairness in the policy. Strong agency, not helpless.
- **Mostafa, F3/midstream** — operates diesel pump with limited fuel; cares about cost and timing, willing to cooperate for predictable schedule.
- **Salma, F4** — agronomy graduate; understands legume rotation and soil sampling; warns when decision is made with uncertain lab evidence.
- **Omar, F2** — vegetable grower with labor window; asks for reliably timed irrigation, not maximum volume.
- **Amina, F5** — livestock and forage household; a skipped forage watering affects feed planning.
- **Eng. Sara / local mentor** — guides the player to POWER weather source, soil evidence and safety check; admits missing data and shows how to request a field measurement.

All personas are **fictional**, not assertions about actual Egyptian residents. No genuine person's name, likeness or voice without written consent. Narrative and dialogue available in Egyptian Arabic with thoughtful English translation.

Each NPC has \`trust:0..100\`, declared objectives, preferred irrigation dates, last interaction, and conditional response. Trust is a **fictional game relation**; it cannot become a real social-impact result or scientific score.

## 6. Starter mission: "ليلة قبل الدور"
### Opening cutscene (~20–30s)
Sunset over the canal. Tractor returns; birds; water against a gate. Phone notification: "بكرة دور المية... والطلب أكبر من اللي موجود." Maryam says "المية بتخلص قبل ما توصل لنا". Hassan says "لو أخّرتني يوم المحصول هيخسر". Sara: "ما تاخدش رقم من غير ما تعرف مصدره. تعالى نشوف الخيارات."

### Player does, in order (not passive slideshow)
1. Walk 10–20 meters to the gate; inspect an actual water pressure/turn indicator; snap strategy camera.
2. Talk to Hassan and Maryam (two choices each). Read their declared crop/area/time constraints in pop-up **not as hard-coded verified agriculture**.
3. Visit the Earth Evidence board and select one NASA POWER historical day/period when available; otherwise choose "illustrative mission" overtly. SAR panel may show metadata only, NOT fake pixels.
4. Select a water plan (first-come, proportional, or schedule turns by time). Turning the in-world gate toggles the proposed plan; player can drag irrigation blocks on a calendar track. One constraint: can't exceed canal supply. An infeasible plan triggers a warning but can be previewed before committing.
5. Press **Start Turn**. Water shader/particles travel from head to tail with volume/segment state based on \`allocation.delivered\`. Crop row appearance uses **scenario** state, not a live satellite measurement. NPC idle gestures, pump audio, and field label update. F6 can remain dry under upstream-first, with Maryam reacting.
6. Hold **Rewind** to replay the same initial state under a different plan. Compare outcome using a cinematic split-screen/ghost-water memory, not by re-entering all inputs.
7. The end scene has Hassan and Maryam at the gate. Player sees water supply, shortage, fairness and farmer trust side by side, plus an evidence receipt. No guaranteed win if the actual scenario has too little supply; choosing to state the uncertainty is legitimate.

**MISSION SUCCESS:** The player completes evidence inspection, makes and revises a plan, keeps all hard constraints respected, records an honest receipt and explains consequences. High fairness is an optional multiobjective achievement, not proof of agronomic optimum.

## 7. Chapters / progression
- **Episode 0 — Tutorial / The Water Turn (8–12 min):** six neighboring fields, explain crop demand and fair allocation through physical gates.
- **Episode 1 — A Season of Choices:** 4 crop rotation strategies, crop calendar changes, timing of winter/summer crops, root-zone storage; consequences at week/month snapshots. If crop configs are not sourced, use declared synthetic scenario cards.
- **Episode 2 — What the Satellite Saw:** NASA POWER weather context + HLS/IMERG when real and QC'd + SAR scene pair when processed. Player chooses which measurement to request, avoids guessing that stress is automatically salinity, and can defer actions.
- **Episode 3 — The Blocked Drain:** complaint at F4, a visually wet field but unknown groundwater. Safe choice is inspect drainage, **not** flush extra water. Drainage Safety Gate actively blocks unsafe modeled recommendation.
- **Episode 4 — The Village Meeting:** six NPCs negotiate priorities, fair allocation, diesel cost, farming/labor constraints. Player proposes a repeatable schedule, sees distribution of impacts and obtains a decision receipt.
- **Episode 5 — Next Season / Time Machine:** alternate source period and rotation scenarios; events branch and water/soil memory carries over only as supported by the modeled state; no climate forecast invented.
- **Different research regions:** select Zankalon, Sidi Ghazi, Mallawi and Diamond Valley in future expansion **only after** artwork/conditions truly differ and data configs are region-scoped. Do not recolor the same map and call it a validated Nevada field.

## 8. State and event contract
\`\`\`ts
type EvidenceKind = 'observed' | 'derived' | 'assumed' | 'simulated' | 'illustrative' | 'unavailable';
type WaterUnit = 'm3' | 'mm'; // cannot interconvert without area
interface FarmGameState {
 gameVersion:string; missionId:string; tick:number; playerPosition:[number,number,number];
 selectedFarmId:string|null; cameraMode:'walk'|'strategy'|'evidence';
 weatherContext:{kind:EvidenceKind;sourceId:string|null;period:string;rawSha256:string|null};
 water:{supply:number;unit:WaterUnit;validFrom:string|null;farmDemand:number[];farmDelivered:number[];runId:string|null};
 farms:{id:string;geometryId:string|null;areaM2:number|null;cropId:string|null;stage:string;constraintSource:string|null;trust:number}[];
 npcMemory:{id:string;trust:number;lastDialogNode:string;lastOutcome:string}[];
 missionFlags:string[]; assumptions:string[]; saveVersion:number;
}
interface GameTurnResult {
 stateBeforeHash:string; stateAfterHash:string; action:string; delivered:number[];
 shortfall:number[]; fairness:number|null; unmetDemand:number;
 dataClass:EvidenceKind; scientificBlockers:string[];
}
\`\`\`

- Solver stays pure and testable under \`experience/engine.js\` / backend; renderer only maps state -> world feedback.
- No fair allocation over field demand, no negative supply and no display of a physical unit if inputs are abstract units.
- A conservation budget for every turn is mandatory: delivered + unused <= available. The existing prototype implements proportional and upstream priority; do not claim "scheduled" allocation until time-slot solver/test actually exists.
- Real crop stress, true economic/yield outcome, salinity depth, farmers' health and fairness-to-social-outcome links are **NOT validated** by current code. For prototypes, use transparent storytelling consequences and no fabricated agronomic yield changes.
- Save exact input/source/scenario/engine version; timeline replay changes its snapshot instead of mutating real historical NASA data.
- External API outage should leave the fictional mission playable with labeled illustrative conditions; no mocked NASA "live" claim.

## 9. User controls and minimum UI
- PC: WASD / arrows move, mouse drag orbit, wheel zoom, E to interact, Tab strategy view, V evidence, Space pause/play, R rewind, Esc settings. Mouse-only click-to-move alternative.
- Mobile: thumb joystick with accessible tap-to-interact, map pinch/zoom, large confirm/undo, 360px HUD, landscape recommendation but portrait must remain usable.
- UI layers: diegetic signboards/irrigation ledger and 1 minimal top status bar; details only open when player taps a character, field, gate or evidence terminal. Large raw KPI dashboards remain in existing SOLIQ analytical workspace.
- AR/EN language switch, subtitles on by default, audio optional and never required for understanding, reduced motion and graphics quality selector.

## 10. 3D scene construction and asset specification
**Camera and geometry:** 1 handcrafted ~300×180m **fictional demonstration scale**, 6 nonrectangular organic plot meshes, main mesqa with bends, gates, footbridges, 3–5 rural buildings, realistic crop rows and field boundaries, 7–8 rigged characters on simple navmesh/walk paths.

**Art asset checklist:** 1 animated avatar (idle/walk/interact), 6 distinct portrait/head/clothing identities, 6+ crop growth appearances, wet/dry soil materials, water material and direction particles, 2 gate mechanisms, 1 hand water gauge, tractor or pump prop, reeds/trees, birds/ambient villagers, clouds/dust/sun lighting, dialogue portraits/subtitles, distinct UI buttons, map texture, spatial audio. **No unlicensed screenshots or imported protected assets from Timberborn/Terra Nil/Farming Simulator/GTA.**

**Asset sources to inspect:** Quaternius packs (CC0 pack-by-pack; character/crop/farm props; check GLB format/scale), Poly Haven CC0 HDRI/PBR textures. A game's own official screenshot is reference only and must not become an in-game texture. Maintain \`game/assets/ATTRIBUTIONS.md\` with source URL, author, license, date and transformations.

**Performance target (acceptance on real tested device):** initial on-demand game bundle under ~15 MB compressed if assets permit, first interactive scene quickly, >=30 fps on midrange phone at low preset and 60 fps target desktop; GPU instancing/LOD, baked ambient occlusion, reduced particles on low and disabled postprocessing on poor devices. Record actual tested hardware instead of declaring success from a machine not run.

## 11. Technical architecture — integrate, don't rewrite
- Existing SOLIQ app is a Node.js ESM/Vercel-compatible site. Keep \`/\`, \`/outlook/\` and old adviser fully working. Add \`/experience/play/\` as a lazily loaded game (3D library only fetched when game entered). Retain \`/experience/\` as informational hub and link the play action.
- Recommended renderer: **Babylon.js** for GLB 3D world, cameras, picking, animation and WebGL. Build one environment. Phaser/PixiJS are 2D alternatives if graphics constraints force fallback; do not implement a 3D world using CSS boxes.
- Separate \`game/world/scene.ts|js\`, \`game/characters/\`, \`game/systems/interactions\`, \`game/systems/water-view\`, \`game/systems/mission\`, \`game/ui/dialogue\`, \`game/ui/hud\`, \`game/state/save\`, and \`game/assets\`.
- Simulation input comes from shared \`allocateWater\` & versioned server runs; no duplicate numeric computation inside shader/animation. Implement real schedule solver in science owner territory with tests before claiming "cooperative turn staggering."
- Expose stable events: \`npc:talk\`, \`gate:inspect\`, \`gate:propose\`, \`schedule:edit\`, \`turn:commit\`, \`turn:result\`, \`run:replay\`, \`evidence:opened\`, \`mission:complete\`. Use deterministic event log and explicit scenario seeds.
- In-world visual interpolation (water movement) can be artistically simplified, but the underlying distribution/amounts are from ledger and clearly labeled. Visual time is accelerated game time, not actual physical hydrodynamics.

## 12. Antigravity development tasks (G01–G12), parallel art and science owners
| ID | Owner | Task / files | Required demonstration and test |
|---|---|---|---|
| G01 | Antigravity | \`game/world/*\`, \`experience/play/*\`: standalone Babylon scene, lazy route, camera and player walking/picking | Navigable continuous world, at least F1–F6, path, canal, gates, no boxes as primary art; Playwright enter/exit |
| G02 | Art/Antigravity | \`game/assets/*\`: CC0 GLB characters, landscape, crops, material/lighting, ambient | Human characters with idle/walk/interact; day/night/weather art and asset LICENSE ledger |
| G03 | Antigravity | \`game/characters/*\`: 6 farmers + mentor, portraits, animations, in-world dialogue | Distinct human requests and 2 branching choices; transcripts/AR/EN |
| G04 | Antigravity | \`game/systems/mission/*\`: tutorial + 1 complete human dilemma mission | Opening -> talk -> inspect -> negotiate -> choose -> simulate -> consequence -> replay -> end |
| G05 | Science/Codex | \`game/systems/solver-bridge/*\` to engine | No fake values, conservation unit test, same inputs -> same scenario outcome |
| G06 | Antigravity | \`game/systems/water-view/*\`: gate controls, flow particle/mat, wet/dry field changes | Visible, smooth flow to F6; supply/delivery faithfully maps to simulation result |
| G07 | Antigravity | \`game/ui/*\`: strategy/calendar/evidence/notebook HUD | Inputs via immersive overlay, not dashboard takeover, keyboard/mouse/touch |
| G08 | Backend | Save/replay integration \`game/state/*\`, per-run snapshots | Rewind restores initial state and creates new run, no cross-session leak |
| G09 | SAR/Data | NASA context in \`game/systems/evidence/*\` | Correct historical POWER source; SAR catalogue vs processed pixel status distinct |
| G10 | Antigravity | Animation/VFX/music/sound + polish | Weather ambience, gate sounds, camera ease, human reaction, captions and reduced motion |
| G11 | QA | Browser tests for gameplay, performance, bilingual and privacy | 360px mobile keyboard, pointer/touch, no-WebGL fallback, tests for 3 distinct outcomes, user cannot fake NASA |
| G12 | Team/Delivery | Film actual vertical slice, link judge tour and report | Reproducible 60–90s internal gameplay showcase plus whatever official submission duration requires; no video of unfinished features claimed as live |

**Priority order with little time:** G01+G02 (one world) -> G03+G04 (mission) -> G05+G06 (real consequences) -> G07+G08 (readable and replayable) -> G09–G12 (satellite/fit+finish). A 1-map fully playable chapter is preferable to 12 fake scenes.

## 13. Hard acceptance criteria — reject "spreadsheet in 3D"
A build can be called **playable vertical slice** only if:
- [ ] A player-controlled 3D avatar physically reaches and interacts with two distinct NPCs and one gate.
- [ ] A complete bespoke farm environment exists with curved mesqa, six fields and substantial environment art; not cubes/colored tiles and empty sky.
- [ ] Two dialogue branches change world state or subsequent interaction.
- [ ] Changing allocation strategy causes a nontrivial, measured difference in deliveries/shortage/fairness AND world/NPC reactions.
- [ ] Water is seen traveling from head to tail; no field receives more than its demand or supply conservation allows.
- [ ] Replay under the *same initial state* shows alternate consequence; one of three meaningful endings can be reached.
- [ ] NPC voice if present has accurate caption/text and a mute option. No copyrighted character/asset duplication.
- [ ] Evidence notebook distinguishes NASA observations, model-derived, fictional missions and blocked data; real SAR imagery requires verified QA pair.
- [ ] Devtools show no runtime exceptions, audio-autoplay block handled, performance and 360px fallback tested.
- [ ] No claim that a 3D animation validates agriculture; game indicates simulation and model limitations.
- [ ] Final Playwright screenshot/video of ACTUAL runnable game attached to PR; no static AI mockup accepted as implementation.

## 14. Two-minute proof playthrough script
0:00 sunset flyover, canal, human voice "الدور الليلة"; 0:12 player walks to a farmer; 0:30 two opposing needs; 0:50 evidence notebook with real/source badges; 1:05 opens gate and advances simulation; 1:20 water travels and F6 reacts; 1:35 replay with fairer policy, different outcome; 1:50 source receipt and title SOLIQ. This is an internal gameplay demo, NOT an official competition submission duration.

## 15. Explicit boundary between source and game
Historic NASA POWER / actual optical / SAR scenes are observed or derived geographic evidence with published native support; game walkable geometry/NPC/mission/water shader/fictional dialogue are an **artistic simulation**; the allocation engine is deterministic but uncalibrated unless supply/crop configs are validated. All three are allowed together only with clear labels.

No real farmers' identities/voices, faces, farm boundaries, drainage hazards or health states are inserted without consent. Real NASA observations may be used as scenario forcing with appropriate data licenses and provenance, never asserted to predict a unique future or measure individual crop yield.

## External studies / tooling
- Timberborn official Steam: https://store.steampowered.com/app/1062090/Timberborn/
- Terra Nil official: https://www.terranil.com/
- Farming Simulator 25 GIANTS: https://press.giants-software.com/category/fs25
- Against the Storm official: https://wiki.hoodedhorse.com/Against_the_Storm/Against_the_Storm
- Mini Motorways Steam: https://store.steampowered.com/app/1127500/Mini_Motorways/
- UNEP-DHI Aqua Republica: https://unepdhi.org/aqua-republica/
- University of Twente River Basin Game: https://www.waterfootprint.org/resources/multimedia-hub/
- Babylon.js engine: https://www.babylonjs.com/specifications/
- Poly Haven license: https://polyhaven.com/license
- Quaternius licensing: https://quaternius.com/faq.html

**END OF DESIGN TARGET.** The live project has not yet implemented G01–G12. Review and merge this design spec before coding the vertical slice; then track actual assets and tests rather than comparing screenshots to the target.
