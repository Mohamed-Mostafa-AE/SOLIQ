# SOLIQ — حكاية الأرض | THE LIVING LAND
## Game Design Bible v2.0 · REALISM-FIRST REWORK · 15 November 2026
**Supersedes:** \`docs/GAME_DESIGN_WATERKEEPERS.md\` v1 narrative assumptions. Retains all original SOLIQ functional scope. **Design and research only — not implemented 3D gameplay.**
**One sentence:** An authored, human-centered rural adventure where the player lives through a real irrigation turn and multiple growing seasons, learns what NASA can and cannot show, and helps neighbors make defensible crop/soil/water decisions. **No artificially permanent shortage.**

## 0 — Reality corrections: 2026 literature, not a generalized crisis plot
The previous GDD assumed an automatic conflict in which an F1 upstream farmer takes water and F6 is always dry. **That is NOT a universal description of Nile Delta irrigation; do not make it the game's default truth.**

**Field research evidence:**
- FAO \`Towards integrated planning of irrigation and drainage in Egypt\`: case-study farmers report continuous water in an improved mesqa and no year-round irrigation shortage; users distribute water by agreement, share pumping fees and may resolve disagreement in village meetings. https://www.fao.org/4/a0021e/a0021e0a.htm
- FAO head-tail case: older unimproved mesqas/branch canals *can* have inequity, diesel pump conflicts and poor levels; this is a **conditional incident**, not an always-on conflict for all rural communities. https://www.fao.org/4/a0021e/a0021e06.htm
- Nile Delta water practice field study: after a scarce period multiple valves may be opened concurrently to meet backlog; rice planting demand sometimes causes informal pump use and negotiated deviations from schedules, and electric pump outages can disrupt turns. https://www.academia.edu/35541158/Understanding_Mesqa_and_Marwa_Water_Management_Practices_in_IIP_areas_of_the_Nile_Delta_Final_Report
- OECD 2026 and Egyptian WUA descriptions: mesqa management and pump/turn schedules vary by location and infrastructure. Use explicit configurable \`supplyMode\` instead of assuming every area works identically. https://www.oecd.org/content/dam/oecd/en/publications/reports/2026/03/policies-for-the-future-of-farming-and-food-in-egypt_6392e0d9/cab0cefd-en.pdf
- World Bank modernization outcomes are studies of specific projects and may inform **plot conflicts or improvements** but MUST NOT be hardcoded as universal player rewards. https://www.worldbank.org/en/results/2020/04/01/modernizing-irrigation-improved-water-security-for-farmers-in-egypt

**Default opening configuration for fictional Zankalon-like demo:** \`ROTATIONAL_ON_OFF\`: water arrives on the declared local turn, many farmers try to irrigate during that window; when supply is off, shared canal supply is 0 and nobody can conjure water. The player plans crop scheduling, safe pump operation, turnaround, drainage, fairness if capacity constrained, energy/maintenance and future seasons. If actual local data are absent, interval/flow values are declared *fictional scenario inputs*.

Alternative modes: \`CONTINUOUS_IMPROVED\`, \`ON_DEMAND_IMPROVED\`, \`ROTATIONAL_ON_OFF\`, \`LOW_PRESSURE_CONDITIONAL\`. Selected at mission set-up and displayed as local assumption, not assumed from lat/lon or a real person's farm.

## 1 — Better hook: THE CALL / "المية وصلت"
No villain. No obligatory shortage. The core dramatic rule is **every opportunity has a season, and choices made while things look fine affect what happens later**.

**Cold open — player agency within the first 10 seconds:** first-person near the village entrance: motor starts, someone shouts **"المية وصلت!"**. All six families prepare to irrigate, some pumps operate at once. The village feels alive and productive — not suddenly drought-ravaged. Player can run to a gate, knock on a pump door, walk into crop rows, speak to people. The camera reveals one human question: *"كلنا هنروي، بس يا ترى حنروي صح؟"*.

The lead character is **ندى (Nada)**, a young agricultural engineering graduate who has returned to work alongside her family during harvest/planting time. The player controls Nada (alternative avatar selection supported); she is neither a state irrigation officer with magic powers nor a stranger who orders local people around. Her mission is to earn credibility through **listening, measurement and helping families make plans**, not through arbitrary trust-meter manipulation. She can be wrong and admit uncertainty.

Use original real-voice-or-licensed dialogue; dramatic but authentic rural Egyptian Arabic with professional localization, not caricature accents. Fictional field boundaries, people and household stories. The village is inspired by the Nile Delta but is NOT a real person's property.

**Emotional objective:** leave the season with a village that understands the trade-offs, an evidence notebook everyone can inspect, six family stories that evolve, and a credible next-season decision. A great ending can be "no recommendation yet — go measure the soil" when evidence is insufficient.

## 2 — What makes it a GAME, not an animated dashboard
Every 60–120 seconds the player should: **move physically** -> **meet a character with a real constraint** -> **use one gameplay tool** -> **choose between feasible actions** -> **see the world react and remember** -> **unlock a new question**.
No "press run to get the fixed best green result." Outcomes depend on the actual simulation state; characters react to observable changes rather than a scripted happiness animation. New events are replayable from an immutable snapshot. A mission has alternative outcomes; progress rewards thoughtfulness, not over-pumping.

Genres combined:
- Third-person narrative adventure (small richly dressed 3D map with a protagonist, interactive tools and conversations)
- Village systems game (water windows, pump availability, crop calendars, soil, labor, finance and risk)
- NASA Earth Detective (evidence and uncertainty are actual mechanics)
- Strategy puzzle and consequence replay (compare honest outcomes before committing)

## 3 — The human cast: distinct face, agency and evolving concerns
**Nada (protagonist):** young field engineer returned to her family; curious, warm and sometimes overconfident with screens. Development arc: learn to verify ground truth and earn respect, not replace traditional knowledge with an algorithm.
**Hassan (F1):** experienced farmer who recognizes actual arrival and pump behavior; helps the player learn what the instruments don't say. Not a greedy villain. Strong silhouette, textured clothing, work-calloused hand close-ups.
**Maryam (F6):** works with family on forage and food crops; confident and competent. On abundant water days her field irrigates normally; on pressure/canal/pump failures she raises concerns. Not a permanent victim.
**Mostafa (pump operator):** oversees engine/fuel/electricity, hydraulic limits and pump-maintenance choices. A credible mechanic, not comic relief.
**Salma (agricultural specialist):** brings crop rotation, soil sampling, salt/drainage limitations and uncertainty discussions; her personal arc tests the difference between lab models and local farmer experience.
**Omar (crop grower):** depends on a transplanting/harvest labor window and market delivery; sometimes "all at once" planting matters more than water quantity.
**Amina (livestock and forage farmer):** forage quality, livestock feed and family labour constraints become real scene interactions.
**Sara (mentor/WUA meeting lead):** chairs a cooperative village meeting, explains optional group agreements, checks evidence credibility and helps decide when to postpone a decision.

NPCs have \`goals\`, \`knowledge\`, \`calendar\`, \`consent\`, \`memory\`, \`relationship\`, \`confidenceInEvidence\`; not just \`trust=100\`. Dynamic dialogue requires a validated event/flag state, authored outcomes and coherent subtitles. Do not use real farmers' faces/voices without permission.

## 4 — Six-season story; ALL SOLIQ modules become meaningful gameplay
| Chapter / actual PLAY objective | SOLIQ module integrated | What the player DOES / what changes |
|---|---|---|
| **0. المية وصلت!** | Living Farm, location, six-field cooperative game | Walk the lane, inspect turn board, open a pump with operator, try simultaneous field requests; if adequate supply all irrigate, if limited show measured bottleneck; learn conservation and the difference between supply ON/OFF |
| **1. يوم الماتور عطّل** | Cooperative Mesqa, pumps, diesel/energy, timeline | During a legal turn a motor/power fault shortens remaining available duration; repair/borrow/reroute/wait within evidence; cannot irrigate on off-days without a documented alternative store/source |
| **2. حكاية الأرض القديمة** | Soil Memory, past 3 seasons, harvest & crop calendars | Interview older farmer, inspect previous crop history and agronomist file; player flags missing soil data before changing proposed rotation; 3 past seasons *observed only if real data exists*, otherwise illustrative |
| **3. أخضر مش معناه سليم** | NASA POWER, GPM IMERG, HLS, Trend Detective, SAR Explorer, six-path stress triage | Walk to a field, see ambiguous visible stress; choose plausible tests and source layers; HLS/SAR can't alone prove salinity. Rewards resisting an unsupported diagnosis |
| **4. الطردة والصرف** | Drainage Safety Gate, soil salinity, groundwater uncertainty | After watering a wet patch persists; inspect drains and request sample/water-table check; block unsafe "flush more" action until safe constraints known |
| **5. العروة اللي جاية** | Rotation Lab 4 strategies, cover, legumes/N ledger, economic/forage & carbon/soil hypotheses, Interval Regret | Compare R0–R3 with consistent horizon and labor/market/crop constraints, edit a sowing calendar, witness simulated field/household consequences; if regret overlaps must output comparison_only |
| **6. ساعة الضهر** | Heat/crop stress, Farmer Bio-Safety Shield | Outdoor work during hot weather; choose shaded timing/rest/safe gear; no fake WBGT/medical advice; real T2M context if sourced |
| **7. اجتماع القرية** | Cooperative governance, Mesqa game, explanation assistant, WhatsApp/SMS simulation, reports | Discuss alternative schedule and priorities, record dissent and consent, approve feasible shared rules. NPC simulated messages are clearly marked and not actually sent |
| **8. رجوع الزمن** | Time Machine, annual trends, interactive judge tour, receipts | Rewind same initial state, test planned rotation across future simulated seasons, compare allocation, crop cover/storage/provenance and create auditable JSON/HTML receipt |
| **World map transitions** | International research regions and 53-source library | Discover other agricultural settings through research terminal (Zankalon, Sidi Ghazi, Mallawi, Diamond Valley) with explicit region-scoped models and provenance; no default transplant of Egypt crops to Nevada |

Each chapter has a playable scene, character, player interactions, changing deterministic state, evidence question, visible consequences, uncertainty gate, and replay hook. **No feature can be silently removed from the catalogue even if real external service is unavailable; display its independent demo state transparently.**

## 5 — Water model: the central realism correction
Build a **time-sliced hydraulic and crop-demand simulator**, not just split one arbitrary tank.

State:
\`\`\`
type SupplyMode =
  'ROTATIONAL_ON_OFF'|'CONTINUOUS_IMPROVED'|'ON_DEMAND_IMPROVED'|'LOW_PRESSURE_CONDITIONAL';
type Window = {startISO:string,endISO:string,waterAvailable:boolean,mainChannelFlowM3h:number|null,source:'declared_illustrative'|'measured'|'operator_record',quality:string};
type Pump = {maxFlowM3h:number,enabled:boolean,powerAvailable:boolean,efficiency:number,maintenanceState:'ok'|'degraded'|'failed'};
type IrrigationField = {id:'F1'|'F2'|'F3'|'F4'|'F5'|'F6',areaM2:number|null,needMm:number|null,plannedHours:number,requestedM3:number|null,cropStage:string,drainageState:'unknown'|'clear'|'blocked',startHour:number};
type WaterDecision = {windows:Window[],pump:Pump,fields:IrrigationField[],policy:'simultaneous'|'turns'|'verified_coordinated',safetyFlags:string[]};
\`\`\`

**Rules, not fixed outcomes:**
- For time interval \`t\`, \`Q_available(t)=0\` whenever the branch canal is OFF, except an **explicit independently tracked** approved storage/other water source with volume and cost/quality. ON means potential access, not a guarantee all 6 pumps can exceed hydraulic capacity.
- For simultaneous irrigators, \`sum(Q_farm_extracted(t)) <= min(Q_canal(t), Q_pump_system(t), Q_distribution(t))\`. If demand is below capacity **all fields can water with no invented conflict**. Pump failure reduces capacity; scheduled turns change concurrent flow but cannot create water.
- Each field: \`deliveredM3_i = sum_t(Q_to_field_i(t) * deltaHours)\`, field demand in \`m3\` requires \`needMm_i * areaM2_i / 1000\`; apply field irrigation efficiency once and separate diverted from effective root-zone water.
- Pump ON/OFF and time to irrigate govern energy (if validated motor data exist), not arbitrary diesel percentage counters. A valve position is a *fictional control interface*, not guaranteed physical equivalent to a specific local mesqa layout.
- When all water needs are met (all demand <= supply) do NOT invent shortage; optional challenges become soil health, planting windows, energy, unsafe drainage, missed rainfall, observation uncertainty and market/labor.
- A week with no canal water does NOT automatically mean all crops die: carry over root-zone storage, previous irrigation, rainfall and crop stages under justified soil assumptions; missing local soil values may require \`comparison_only\`.
- Pump not working, low pressure, electricity outage, field labor conflict, timing overlap and drain blockage are **scenario event cards**, selected by scenario seed and not asserted as actual incidents.
- Every time-step records input, supply/demand, served/shortfall, unused, runoff/drainage where modeled, unit conversion, conservation residual and status. \`Jain\` fairness calculated from transparent comparable fulfillment fractions; don't maximize fairness if all crop needs can already be met, and don't assume fairness itself proves agronomic optimality.
- Three meaningful policy outcomes: good all-served, feasible coordinated partial, unavoidable deficit/unknown. "Measure/consult and defer" is a legitimate best decision when data are missing.
- **Regression tests mandatory**: supply ON adequate yields zero deficit; OFF no storage yields delivered=0; OFF with explicit pre-stored water cannot exceed storage; pump failure cuts flow; simultaneous vs staggered respects capacity; conversion of mm to m³ needs real/declared area; no negative flux; replay deterministic; inadequate evidence abstains; no fixed 36%, 0.985 or 2.88.

## 6 — New core loop and player mechanics
1. Explore with third-person movement in a **small high-quality village**, not a giant procedural island. NPC routine animations and moving farm animals.
2. Ask a person -> understand constraints (crop stage, labor, pump access, evidence).
3. Inspect **physical tool**: shared turn board, fuel meter, pressure gauge, irrigation spade, crop leaves, drainage well, soil probe, phone messages, lab sample, NASA field notebook.
4. Make a consequential action in-world: record operator's arrival window, inspect maintenance, negotiate a time slot, schedule sowing, approve a soil sample, toggle gate only when water is ON.
5. Simulate *one turn/one phase* and observe resulting active pump, flow meter, field wetness, realistic gestures, changing dialogue and memory; no impossible overnight magically full-grown crops.
6. View competing objectives and consequences through the character's **physical field notebook**, not a full-screen spreadsheet.
7. Rewind from an immutable checkpoint -> try another lawful/feasible route -> compare outcomes -> save evidence receipt.
8. Unlock next human story or separate research scene. No arbitrary coins/energy; achievements reward better-grounded choices, safe procedures, good collaboration and discovered evidence, not pumping more water.

## 7 — Photoreal-but-playable art direction; faces are the quality bar
**Not voxel. Not low-poly placeholder as shipping artwork. Not cartoon if user wants realism.** Target: grounded cinematic rural realism, art-directed by actual Delta references. A single curated 3D map with 6 organic fields; roadside reeds, irregular canal bank, pump house, pipes, weathered gates, shaded clay-brick buildings, crop rows with varied heights, birds, farmers' clothes showing real-world fabric wear, plausible tools and ambient daylight.
- **Face quality matters most**: 1 high-quality protagonist and **2 close-up dialogue NPCs** first, then 4 additional mid-distance rigs. Unique age/complexion/body proportions, authentic neutral clothing, hand gestures, gaze targets, natural idle shifts and silent-to-voiced lip/audio synced only where feasible. Female characters have agency, not costume stereotypes. No borrowed facial likeness of real villagers.
- Art pipeline: reference photographs -> model/sculpt -> retopo + UV -> PBR 2k/1k textures -> glTF/GLB + LOD -> rig to skeleton -> Mixamo/Blender animation retargeting -> facial blendshapes/portrait cut-ins -> Babylon scene -> browser profiling. Dialog close-ups may use premium prerendered **original** portraits while the interactive 3D world uses optimized LOD human models, but characters must remain interactive, not PNG cardboard people.
- World performance via Babylon.js WebGL fallback with PBR and selective post effects. Optimize texture compression, mesh instance/LOD, batched crop rows, budgeted shadow cascades, reduced motion, low-end 720p/30fps target; 60fps desktop **aspiration**, verified only after real tests. Load world lazily from \`/experience/play/\` so base SOLIQ pages load quickly.
- Camera: third person exploration (walk/interact), immersive shoulder conversation (realistic facial framing), strategy high-angle overview, overhead evidence map. Camera modes animate smoothly, and a voice/text fallback lets everyone follow.
- Environmental sounds: pump ignition, valve clicks, water rushing only when model says supply ON, distant birds, market/pickup sounds, footwear on dirt, wind through crops; captions when sound conveys information.
- Artistic simulation does NOT constitute field validation. Vary animations based on modeled state but show simulated labels.
- **Asset license correction (2026):** Quaternius FAQ says CC0 for older assets, but **2026-08-28 Quaternius Asset License (QAL)** now governs assets covered by that version. No blanket statement "all Quaternius are CC0". Record exact per-pack license/version and ensure game redistribution complies. Poly Haven assets currently CC0. Mixamo allows characters/animations in video games but licenses restrict redistribution as standalone assets. Check all downloaded files and game releases. Reference links:
  - https://quaternius.com/license.html
  - https://quaternius.com/faq.html
  - https://polyhaven.com/license
  - https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html
  - https://www.metahuman.com/license (potential original high-fidelity character pipeline but check export and runtime size)
  - https://www.babylonjs.com/specifications/

## 8 — Team/model choice: environment > a single AI model
| Role | Model/tool | Owns | Cannot claim |
|---|---|---|---|
| **Game director/architecture reviewer** | Antigravity **Orchestrator (Carbon)** if on Ultra; else **Orchestrator (Argon)** on eligible Pro | reads full GDD, plans systems, architecture, cross-branch reviews; delegates execution | "Carbon automatically produces photorealistic art" |
| **Gameplay frontend implementer** | Antigravity **Argon + Hydrogen** worker pipeline | Babylon world, locomotion, cameras, NPC logic, dialogue, menus, scene performance | certified water science |
| **Human/technical artist** | Blender + legal character rig/texture sources; optional Mixamo animation pipeline; Antigravity facilitates scripts | 1 hero+2 priority realistic rigs, clothing/face PBR, landscape/props, sounds, rig and LOD | AAA quality with primitives alone |
| **Engine correctness** | Codex | time-sliced water-window solver, state snapshots, conservation/area/efficiency, regression tests, backend event API | choosing artistic identity without review |
| **Science and field realism** | Gemini/other researcher + local agronomist/farmer interview where possible | crop/calendar/supply variants, NASA provenance, distinguish field observation from fiction | treating historic scripted numerical results as actual data |
| **Visual QA and performance** | Antigravity /browser + Playwright + real mobile device | animations, tap targets, scene defects, fps, audio captions, AR/EN | declaring pass without screenshots/measurements |

Official Antigravity docs show Carbon oriented toward deep longer-horizon research/verification, Argon toward advanced engineering, and Orchestrator agents delegating execution to Hydrogen. Actual access depends on plan; choose strongest **available** model and do not start two AI agents editing the same file.

- https://antigravity.google/blog/gemini-4-carbon-in-google-antigravity/
- https://antigravity.google/docs/models
- https://antigravity.google/docs/features
- https://antigravity.google/docs/browser/

## 9 — Implementable tasks (replace generic old game G01–G12 acceptance, don't delete other SOLIQ tasks)
**W01 — Reality specification, led by Codex+scientific reviewer:** build configurable supply mode and on/off scenario fixture, pump capacity, timeline and turn schedule with no hardcoded scarcity or false hydraulic outputs. Test sufficient on, no-water off, capacity, stored water, missing area and outages.
**W02 — Visual target, art director:** 2–3 **realistic** original hero character faces/rigs, clothing, glTF and animation, plus a **3-scene composition board** (irrigation arrival, farmer closeup, evidence/soil sampling). Review in browser before expanding.
**W03 — One authored walkable world, Antigravity:** physical lane and canal, genuine gates + pump, six organically bounded fields, landscaping and interactable objects; mobile graceful fallback.
**W04 — Character NPC system, Antigravity:** six people + lead+mentor, authored dialogue tree, memories, choices tied to water/soil states; no handwavy trust=100.
**W05 — Complete Chapter 0 "المية وصلت", Antigravity+Codex:** all six families irrigate on adequate ON mode; optional pump bottleneck changes choice; OFF mode shows water absent; inspect/plan/act/consequence/replay/end. True interactive game loop.
**W06 — Crop/soil/rotation chapters, Science+Antigravity:** Soil Memory, 3 seasons evidence, root-zone state, 4 rotation alternatives and interval regret under uncertainty; actual crop coefficients only with a source, else documented illustrative.
**W07 — Satellite & detective chapters, Data+SAR+Antigravity:** NASA POWER observed context, HLS/IMERG verified subset, compatible SAR pair or unavailable, six plausible stress explanations and a player test choice; no pixel fiction.
**W08 — Bio-Safety and drainage storyline, Antigravity+Science:** safe choices, heat task/labor timing, drainage investigation locks unsafe actions.
**W09 — Village council, assistant and messaging, Antigravity+Backend:** conflicting constraints or no conflict depending on availability; negotiable schedule, simulated notices vs real opt-in messages, evidence citations.
**W10 — Persistent Time Machine, Backend+Antigravity:** immutable seeds, snapshots, event logs, 3 ending paths, export and comparison.
**W11 — Film, sound, UX & perf, Art+QA:** sound authored/licensed, 3rd-person/strategy/evidence cameras, 360px fallback, AR/EN subtitles, 30fps phone target, 60fps desktop aspiration, measured file loads.
**W12 — Judge demo & shipping gate, Integration Lead:** one complete reviewed chapter plus clear prototypes to all remaining modules; prove live endpoints, no blocked label hidden, last commit CI green, video capturing **actual interactive game** (not an AI-rendered fake screenshot).

## 10 — Exact QA to reject poor implementation
1. Startup shows *full-quality environment and playable protagonist* in a real WebGL canvas, not photo background + floating UI or six material-color cubes.
2. At least two **human** characters have unique 3D silhouettes, face portraits, idle/walk or conversation gestures, context-aware real Egyptian-Arabic subtitles and one meaningful branching response.
3. Player walks to a real canal/pump, interacts with "water arrived" physical state and sees NPCs responding.
4. Default ON & **adequate** supply case gives all six households their feasible allocation, with zero shortage. This must be a happy productive scene, not a game over.
5. OFF with no defined storage supplies ZERO new canal water; the game cannot render channel flow while solver gives zero.
6. ON-but-capacity-limited, pump failure, and reduced window yield different defensible outcomes; actions change realistic world state and ledger, not pre-canned green success.
7. A replay from identical initial state shows at least two different routes and result receipts.
8. Evidence notebook identifies source names, dates, spatial support and observed/derived/simulated/unavailable. Real NASA cannot be implied from a generated map texture.
9. No unsupported fixed 36% saving, 0.985 fairness, 2.88 salinity flip, guaranteed income/carbon, SAR salinity, medical WBGT or soil profile.
10. Low-graphics fallback; keyboard, touch, subtitles, Arabic RTL and English, no crashing no-WebGL phone, no console errors, actual browser QA video/screenshot.
11. **Performance budget is measured**, not asserted: mobile minimum playable during a tested 90-second mission and no catastrophic first-frame stall.
12. Existing SOLIQ main app, AI assistant, trends and research views still work after game installation.

**Definition of a shipped GAME = one complete visually convincing chapter with 5+ consequential physical interactions, 2+ expressive NPCs, reliable ON/OFF water model, conditional outcomes and replay, plus a clear roadmap and prototypes for the other story chapters.** No game is "complete" from an AI mockup. More chapters depend on real data/validation.

## 11 — Revised 100-second scene outline (internal demo, not submission-specific)
- 0:00–0:08: dawn over realistic fields, waterpump starts, a voice from the lane: **"المية وصلت!"**
- 0:08–0:22: player moves through animated village, sees families irrigating simultaneously. Warm human encounter; no default shortage.
- 0:22–0:38: operator explains pump and turn window; player examines interactive valve and pressure meter.
- 0:38–0:56: player compares two feasible water plans; game previews supply, delivered, labor and possible bottlenecks.
- 0:56–1:12: model advances; real water material animates; six field wetness indicators and family reactions change.
- 1:12–1:22: scripted incident? If player selected "pump fault", issue appears **as a scenario**, not fabricated observed event.
- 1:22–1:34: rewind to previous state and choose an alternative; see a changed outcome or correct "no difference".
- 1:34–1:40: village evidence notebook, credible limits, SOLIQ identity and next science mystery.

## 12 — External validation: talk to actual farmers before pretending realism
Five quick grounded questions a teammate can ask **with consent**, separately from game fictional story: "What tells you the turn arrived?" "Do all farmers pump together or take turns?" "What happens when a pump/electricity fails?" "How is drainage inspected?" "Who decides rotation/repair locally?". Do not record names/faces/locations without permission; document site-specific variance. The user's firsthand statement is a real design constraint until local details are verified.

**Game design v2 is ready to implement. It is NOT implemented gameplay. Implementation must proceed as W01–W12 with tests, license review and actual scene recordings.**
