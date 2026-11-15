# SOLIQ: THE SEVENTH FIELD — الأرض السابعة
## Creative Direction V3 / Game-Product Contract / NASA Space Apps 2026 / 15 November 2026
**Status: design and engineering specification, NOT an implemented AAA or browser game.**
**Source authority:** current SOLIQ core v17 (spec.md, constitution.md), uploaded FieldShift: Evidence-Aware Crop-Rotation Planning Across Climate and Water Regimes (11-page research manuscript), Waterkeepers V2, and existing source code. This document does not invent a measured crop benefit. Project's primary workflow remains a practical farmer/adviser crop-rotation comparison. Game is an integrated, optional entry to explain and explore the same science, never an account/login gate.

## 0. The signature idea (different from generic farming management)
**"ست غيطان، وسبع حكايات. الغيط السابع هو المستقبل اللي لسه ما اتزرعش."**
Six physically walkable village fields exist. The *seventh field* is a **Time Echo**: a transparent artistic overlay that shows **multiple hypothetical futures** for the *same* land based on player decisions, annotated "SIMULATION — NOT SATELLITE OBSERVATION." It is neither a literal private farm nor fake NASA imaging. Players make choices, revisit the same field under a different scenario, and discover whether the evidence distinguishes an option or whether the responsible action is to request a soil test and say "we don't know."

**Hook:** open mid-action: dawn in a real-seeming Egyptian village, engine ignition and **"المية وصلت!"**. Farmers are irrigating simultaneously if the canal is on and infrastructure allows. Nada, our protagonist, takes a soil sample beside a family-held field; she notices that two neighboring plots with equally green satellite appearances can tell different stories. A short radio bulletin describes a local practical choice: plant another rice/forage rotation, diversify crops, or wait for soil evidence. The dramatic mystery is *not* "the water is always missing" but "what can we responsibly know before the next planting?"

**Three unique playable mechanics:**
1. **Earth Lens — three registers, one world:** physically hold an in-world tablet next to the crop to toggle **Ground / Observed NASA / Modelled Future**. NASA POWER regional weather is a dated context layer; available HLS/IMERG imagery only when processed and quality-checked; ASF scene catalogue is a list, not pixels. Future visual is clearly synthetic. Misreading a source is a gameplay mistake with an explanation.
2. **Soil Memory — literally dig into history:** walk to a field, use a soil sampler and an interview, unfold previous crop/calendar/irrigation notes as a physical flipbook on the ground. History is OBSERVED only when entered or verified with provenance; otherwise a labeled illustrative scenario. Root-zone water/crop assumptions carry through seasons; no magical reset after harvest.
3. **Time Echo — the seventh field:** walk through a ghost-like alternate version of the same field with one different crop/irrigation decision. Side-by-side factual ledgers show water, cover opportunity, labor feasibility and uncertainty; exact same initial state, weather forcing and horizon. Uncertainty can make the scene deliberately blurry/locked (comparison_only). What happens in the cinematic echoes derives from real scenario run outputs, never a fixed "36% more water saved."

## 1. Genre, market and WOW factor
A **grounded rural open-zone narrative simulation**, in the spirit of GTA's free traversal, memorable human characters, environmental storytelling and mission variety, blended with a serious *evidence investigation*. No crime/combat/violence and no 50km map. Small **1 richly authored village (approx. 250×180m fictional scale)**, 6 irregular fields, a real-shaped canal, pump house, rural market alley, drainage ditch, workshop, field lab/learning center, and a shaded village meeting area. Third-person avatar, 2 camera modes, optional tractor/motorbike **only if physics/rules allow**, foot exploration first. At every corner a character can tell a different story.

**Premium visual identity:** cinematic Egyptian Delta realism with PBR soil, varied crop rows, semi-turbid moving water, rust/wear on equipment, palms and reeds, dust haze, real human body proportions, cloth wrinkles, plausible facial motion and lip sync where technically possible. A memorable single field with high-quality cinematography beats a huge procedural low-poly map. Performance and WebGL fallbacks are design constraints. Scene must use real licensed/original 3D assets, not SVG 3D or static photos passed off as gameplay.

**Player fantasy:** "I can help my community understand a hard decision." Not "I am a magical irrigation officer" and not "I can infer soil from space perfectly." The best choice may be an honest deferral.

## 2. Dramatic characters / human writing
- **Nada** (playable): young engineer with a personal arc from overconfident in clean dashboards to an investigator who learns that field evidence matters; dialogues can challenge her.
- **Hassan** (elder farmer): alive with experience, patience and field-specific memory. He is not a greedy antagonist; sometimes corrects Nada's overinterpretation.
- **Maryam** (farmer at another plot): fully competent collaborator. On normal water turns she irrigates normally; only scenario-specific mechanical constraints create timing problems.
- **Mostafa** (pump mechanic): loves restoring an aging pump and collecting accurate meter data; maintenance, diesel and electricity missions.
- **Salma** (agronomy specialist): questions seed availability, salinity guesses, drainage/flooded domain, nitrogen models and the danger of universal Kc values.
- **Omar** (vegetables & market): crop labor windows, equipment and logistics; potential tradeoff with water scheduling.
- **Amina** (livestock/forage): household feed and local market constraints.
- **Sara** (facilitator): cooperative meeting, informed consent and communication.
  
NPC AI: finite authored quest/dialogue graph **driven by explicit flags and tested outcomes**, not unsupervised LLM making free agronomic or medical assertions. Relationship = remembered consent/promises, requested data and task completion, not arbitrary trust percentage. Player can admit uncertainty, ask permission to examine private data, earn credibility through honest evidence. Egyptian Arabic dialogue with accurate English subtitles; fictional people only.

## 3. Open-world mechanics with meaningful agency
- **Movement & vehicles:** 3rd-person walk, jog, approach/inspect/talk, camera zoom, optional controlled slow tractor sample; believable collision, idle locomotion, NPC paths. Avoid spending 90% of time on cars instead of decisions.
- **Physical tools:** turn-board chalk marks; pump switch only when canal ON; pressure dial; sample cup; drain inspection hatch; soil clipboard; regional NASA tablet; field boundary survey; weather radio; crop calendar ribbons; market notice; consent notebook.
- **Water world rules:** ON adequate = all six may water. OFF with no explicitly stored/alternative source = zero new canal supply. Simultaneous requests obey flow/pump limit. Pump faults, pressure loss and repairs require a scenario event. No rigid upstream-vs-tail stereotype. Three honest outcomes: all served; capacity limited but coordination helps; shortage unavoidable or uncertain. Water math from Codex time-sliced solver (#12).
- **Soil/crop world rules:** crop calendars across 3 past + 3 future seasons, root-zone storage tracked through transitions only when data/assumptions are supported; real product version/qa visible. Visual growth is a simulation of declared assumptions; never a measured or proven yield.
- **Evidence ethics:** visible source statuses: OBSERVED, DERIVED, ASSUMED, SIMULATED, UNAVAILABLE; and transport LIVE, CACHED, UNAVAILABLE. Missing results provoke an alternative task (obtain a sample, choose a conservative comparison), not a fake green NASA panel.
- **Choice consequence:** dialogues, budget, planting feasibility, narrative commitments, field irrigation/shortfall, modelled cover and *uncertainty* respond. A fixed save/win percentage and false soil health accuracy are strictly prohibited.
- **Time Echo:** all replay same initial state + scenario seed + code/config version; save a new immutable run and evidence receipt. Show two worlds side by side with a labeled hypothetical overlay.
- **Progression:** journal of genuine discovered evidence, reusable tools, village relationships and chapters unlocked by completing tasks, not coin grinding. Player can revisit any mission with different assumptions.
- **NPC emotional reactions:** actual recorded simulation outcomes + author-authored character motivations determine animation/dialogue; no artificial sadness if all farms were supplied normally.

## 4. Nine interconnected playable arcs — EVERY SOLIQ capability has narrative purpose
| Quest | What the player physically does | App component exercised | Legitimate outcome |
|---|---|---|---|
| 0. **المية وصلت** | run to pump, inspect ON window, talk to 2 farmers, plan 6 requests, open gate, see real-time response | Geolocation demo region; Mesqa Game; WaterBalance; evidence status | all water successfully if sufficient; alternative bottleneck if scenario selected |
| 1. **الميكانيكي والساعة** | walk to workshop, diagnose pump/electric cut and schedule remaining turn | pump time-slot solver, cooperative decisions, time windows | finite recovery, no impossible water creation |
| 2. **الأرض بتفتكر** | inspect actual crop-history page, seek permission, take sample, build past 3 seasons | Soil Memory, consent, crop-history, root-zone water | clear observed vs illustrative data; can require sample |
| 3. **اللون الكاذب** | watch HLS/IMERG/SAR evidence at field via Earth Lens; collect field clues and test alternative stress hypotheses | HLS, NASA POWER, GPM IMERG, Trend Detective, SAR Explorer, Six-Path Stress | avoid equating low NDVI or SAR backscatter with salinity |
| 4. **الطردة المسدودة** | spot waterlogging, inspect drain, refuse unsafe leaching until inspected | Drainage Safety Gate, salinity/groundwater limitations | safe deferral is a reward |
| 5. **موسم تاني** | design baseline + two feasible crop rotations, track crop family/soil moisture/cost/cover from reliable inputs | Rotation Lab, Kc/ET, nitrogen, crop cover, interval-regret, comparison_only | conditional comparison, no guaranteed benefit |
| 6. **ساعة الضهر** | choose work rest/shade schedule and discuss farmer safety | Heat indicators, Farmer Safety Shield | general preventive guidance, no medical WBGT prediction |
| 7. **مجلس المسقة** | attend community meeting, present contrasting evidence, coordinate water schedule, write clear result | evidence reports, AI explanation grounded in sources, simulated messaging | consensus or disclosed disagreement |
| 8. **الغيط السابع** | enter alternate season echo, replay three decisions and inspect complete research receipt | Time Machine, historical trends, NASA source ledger, replay | compare observed history vs derived model vs hypothetical scenario, explain fragility |

International pilots: four study regions are *story research terminals*, not all one Egyptian map re-skinned. International expansion requires source-specific configs and never presents Egypt's crops as validated for Nevada.

## 5. The game's core academic claim & testable "research proof"
The uploaded manuscript **FieldShift** explicitly proposes support-aware observation provenance + crop-transition water accounting + conservative interval regret, and explicitly says agricultural outcomes / full public-data study were NOT demonstrated in the supplied manuscript. The game must *demonstrate those methods*, **not claim the game's animation proves empirically that a rotation saves water or improves soil**.

Make the science a detective mechanic with **research-baseline rounds**:
- **B1**: fixed point-estimate decision -> player sees apparently confident rank.
- **B2**: same strategies with uncertainty intervals but still point-minimax rank -> player sees a fragile winner.
- **B3**: same inputs with interval-regret separation, \`comparison_only\` if overlap/critical evidence absent -> player learns when to defer. Compute a scientifically honest **conditional distinction**, not "B3 empirically better" without independent field outcomes.
- **H1, H2, H3, H4** from the paper are evaluation hypotheses, **not confirmed wins**. The game can demonstrate methods and collect opt-in comprehension tests H3; actual empirical H1/H2 need independent observations, H4 needs configured public data & assumptions; recording gameplay doesn't prove hypotheses. No player-visible invented A/B performance.
- Show **the honest negative benchmark** from current \`pitch-3d/content.js\`: Sakha NASA 2026 316 daily values through Nov 12 (for that reported snapshot), chronological rainfall analog MAE **20.32mm**, climatology **15.29mm** (analog WORSE), presented as "here is why we show uncertainty" rather than quietly hiding a weakness. Verify hashes/date for any external publication.
- Real 2026 Sakha data in pitch: weather demonstration, not a licensed/consented farm. Shared source support and date range must be disclosed. Paper 40,401 uncertainty settings are SYNTHETIC verification of a mathematical certificate, NOT 40,401 real farm measurements.
- Example mechanics: if a rain satellite cell does not cover the exact field, NPC asks "ده قياس هنا ولا فوق منطقة كبيرة؟"; if SAR has only catalogue metadata, engineer says "لسه ما عنديش صورة أقدر أحكم منها"; if a predicted strategy wins only on assumptions, the ledger displays \`comparison_only\`.

**Evidence Acceptance:** each scientific gameplay screen has an inspectable receipt \`{source,product,version,geography,validTime,rawSha256,quality,spatialSupport,units,status,assumptions,codeVersion,simulationVersion}\`; unknown fields are null with reasons, never substituted.

## 6. Technical architecture & performance
- Keep current Node/Vercel SOLIQ \`/\`, \`/experience/\`, \`/outlook/\`, \`/adviser/\` unchanged. \`/pitch-3d/\` is a presentation, NOT an actual 3D game. Game route **\`/experience/play/\`** loads separately.
- Babylon.js WebGL2/WebGPU or WebGL fallback because it fits the current JavaScript site with glTF, PBR, animation, collision, picking and instancing. Do not switch entire current codebase to Unreal just to imply AAA; Unreal native would be a separate distribution with massive new production scope. For later native production, evaluate Unreal+MetaHuman separately.
- Art pipeline: one small organic scene + 3 important human meshes, rigged GLB, actual facial expressions/eye direction/hand gesture + mobile LOD. Blender real art assets + licensed textures/animations + source ledger, avoid voxel/cubes/flat placeholders at final gate.
- \`game/mission\` owns authored narrative/event graph, \`game/world\` owns geometry and camera, \`game/npc\` owns finite-state characters, \`game/evidence\` reads strict source records, \`game/water-view\` only displays time-sliced physical ledger, \`game/state\` stores deterministic initial/after/replay, \`game/ui\` keeps diegetic notebook and captions; no equation duplicated in front-end.
- **Time budget priority:** one cinematic, fully interactive **6–9 minute chapter 0** with Nada, Hassan, Maryam, the pump, six realistic fields, ON/OFF, 3 genuinely different outcomes, Time Echo and evidence receipt before spreading effort to 9 chapters. The remaining chapter cards must be navigable prototype entries, honestly labeled. **Full GTA-sized world cannot honestly be built/validated in a few hours**.
- Performance acceptance target on measured hardware, not assumed: game loads after user clicks, 360px accessible fallback, 30 fps low preset midrange phone and 60 fps desktop aspiration, graphics preset, subtitles and mute, optional motion reductions; no mandatory audio/GPU for accessing SOLIQ core.

## 7. Specific atomic work orders (owners and exact acceptance)
### G-V3-01 — **Antigravity + Blender | Art**
OWN \`game/assets/**\`, \`game/world/**\`, \`game/npc/meshes/**\`. Build 1 dense realistic demo world and Nad/Hassan/Maryam full rigs, crop rows, engine, pipes, canal. Record actual art URL/license per asset. Tests: walk near NPC, look at face/eyes, no flat mockup, mobile LOD FPS numbers/screenshots.
### G-V3-02 — **Antigravity / game coding**
OWN \`experience/play/**\`, \`game/mission/**\`, \`game/ui/**\`. Playable mission: 10s control, 2 dynamic conversations, 1 pump, evidence lens, commit turn, animated results, Time Echo replay, debrief. Browser Playwright E2E. Must preserve original SOLIQ main routes.
### G-V3-03 — **Codex / irrigation engine**
OWN \`science/mesqa-window.*\`, tests, contracts. Implement #12 ON/OFF, no artificial scarcity, simultaneous/turns, hydraulic capacity, conversion mm*area_m2/1000, pump fault, conservation, optional storage, deterministic immutable events. 9 acceptance scenarios.
### G-V3-04 — **Gemini / FieldShift scientific audit**
OWN \`configs/pilots/**\`, \`science/**\` only after coordinating Codex ownership, scientific QA and source ledger; implement real documented weather/IMERG/HLS or label blocked; validate crop/soil and eligibility. Compare B1/B2/B3 on synthetic fixture separately from live outcome evaluation.
### G-V3-05 — **SAR teammate**
OWN \`adapters/sar/**\`, \`science/sar/**\`. Verify compatible real SAR pair or output \`unavailable\`; never render fake space raster as observed.
### G-V3-06 — **Backend Codex / storage**
OWN \`api/**\`, \`lib/**\`, durable run ownership and evidence receipts; PR #11 pending review; production durability intentionally fail-closed until provider provisioned.
### G-V3-07 — **Submission lead**
Own official NASA project page, public code/release URL, 30s video OR max 7-slide deck, correct NASA source and AI credit. 2026 official submission closes **2026-11-15 23:59 local**; submit verified prototype rather than waiting for speculative AAA completion. Current \`pitch-3d/\` deck has **8 slides** and must be reduced to 7 or replaced by ≤30s video for submission. Only actual implemented scenes may appear unambiguously as gameplay.

**DONE conditions per item:** specific code+assets+license+source evidence, passing exact-commit Node+Playwright, user-visible video/screenshot from real running app, replay fidelity and no faux NASA claims. Leave incomplete gates open and ship the verified subset rather than claim complete.

## 8. "Beat GTA in our lane" creative QA
The target is **GTA-like density of encounters**, not a ludicrous promise to reproduce GTA's open world, budget or realism in browser. A judge should remember:
1. A *human face* and her choice, not a color-coded dashboard;
2. Water actually arriving and turning off, not a water animation detached from supply;
3. A remarkable "six fields / seventh future" reveal in the same physical location;
4. An adversarial science scene where the game refuses to claim a soil diagnosis from SAR metadata;
5. A replay revealing how two good-faith choices affect people differently;
6. An evidence receipt proving what is observed versus assumed.

**Prototype proof level vs real-world research validity are separate.** A game can prove that the code implements the scientific decision protocol and teach its limits; it cannot establish agronomic effectiveness without independent farm outcomes and validation.

## 9. References consulted and scope control
- Uploaded original: \`FieldShift_Research_Package.pdf\` (11-page methods manuscript). Exact abstract and Section VIII show synthetic-only analytical verification and H1–H4 prospective studies.
- Current repo \`spec.md\` / \`constitution.md\` attached to project: R01–R16 and core farmer journey; game optional to farmer, mandatory as a product prototype per user's latest directive.
- Current \`pitch-3d/content.js\`: reported NASA Sakha benchmark and honest negative rainfall analog result; \`pitch-3d/\` is presentation only.
- FAO Egypt mesqa case reports: https://www.fao.org/4/a0021e/a0021e05.htm ; https://www.fao.org/4/a0021e/a0021e06.htm .
- Egyptian canal operations and coordinated turns https://horizon.documentation.ird.fr/exl-doc/pleins_textes/divers16-02/010066348.pdf — schedules and ad-hoc irrigation vary by context.
- Serious-game example: https://unepdhi.org/aqua-republica/ (science-driven basin decisions in a fictitious world; now unavailable).
- Babylon engine https://www.babylonjs.com/specifications/ ; Godot Web restrictions https://docs.godotengine.org/en/latest/tutorials/export/exporting_for_web.html .
- NASA deadline: https://www.spaceappschallenge.org/2026/ ; https://www.spaceappschallenge.org/2026/local-events/poznan/?tab=details .
- Asset libraries require **per-asset** license review. Do not assume all Quaternius packs CC0 given 2026 QAL; Poly Haven CC0 per current license. No copied GTA, FS25 or other proprietary art.
