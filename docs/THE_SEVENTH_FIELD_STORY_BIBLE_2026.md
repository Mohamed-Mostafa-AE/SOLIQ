# The Seventh Field — Narrative Bible, Sustainability Mechanics & Inclusive Design
**Product:** Soil-IQ · **Revision:** 2026-11-16 · **Status:** Blueprint + Chapter 0 vertical slice

## Critical reset: what went wrong and what stays
The initial "check the pump, then start the pump" arc did **not** carry the user's vision. It turned the whole game into equipment-compliance trivia, had no strong mystery, made the first choice obvious, and gave the farmers no human motivation. It also mistook a mention of **sustainability** for a mandate to make occupational safety the plot. We removed that compulsory gate from the unmerged game PR.

The game remains a major playable part **inside** the existing Soil-IQ website/app. It must coexist with Guided/Research, crop rotation models, 2026 Living Farm, OMNI-EARTH research, Argon judge, NASA EO browsing and optional future simulations. The game may connect to these by **evidence contracts and consented navigation**, not by making up values or absorbing every other feature into one screen.

### Short high-concept pitch
**"The Seventh Field: The Season That Hasn't Happened Yet."** Nada returns to a Delta village at dawn. Six families share a canal. In a weathered ledger she discovers **two incompatible plans for the next season**, both defended with conviction. The seventh field is a mysterious, *explicitly fictional* place that visualizes divergent futures—not a supernatural prediction or a NASA satellite image. To discover which plan is more defensible, Nada must hear different families, inspect what is actually known about water/soil/weather, model alternatives, and defend a choice with its limitations.

**Genre:** hopeful environmental mystery + cooperative narrative adventure + evidence-based systems puzzles, with stylized-realistic 3D exploration and a text-first parallel route.

**Emotional question:** "What do we owe each other—and the soil—when we cannot know next season yet?"

## Design pillars (criticize each feature against these)
1. **Consequential player agency:** more than one defensible action; a choice alters ledger outputs, NPC trust/understanding, available questions, or future options. No fake win button.
2. **Sustainability in tension:** water efficiency, soil cover, crop diversity, farmer livelihoods, climate uncertainty and fairness can conflict. Do not collapse them into a single SDG score.
3. **Evidence over mysticism:** NASA POWER/HLS/GIBS provenance remains separate from artist-authored future scenes; explicit OBSERVED/DERIVED/ASSUMED/SIMULATED/UNAVAILABLE classes.
4. **Place and humanity:** Delta bridges, canal soundscapes, seasonal light, working villages, field-scale textures and community routines—not generic green tech UI.
5. **Equal narrative access:** core choices usable with keyboard, readable text, captions and an alternative for those unable to navigate 3D; progressively audit more disabilities.
6. **No challenge swallowing:** Field Shift crop rotations stay the primary scientific decision support; other NASA-inspired experiences enrich optional research/learning, not claim new validated scientific capability.

## Chapter arc and implementation truth

| Chapter | Story conflict & player verb | Sustainable trade-off / evidence | Status |
|---|---|---|---|
| Prologue / 0: An Unwritten Season | Discover contradictory calendars, hear Hassan and Maryam, inspect the seventh field, choose community water-turn scenarios or defer | Six-field solver; fictional delivery, shortfall, fairness, no verified rotation winner | **Playable vertical slice** in 3D and text-first route; story depth/visual polish still preliminary |
| 1: My Farm, My Responsibility | Visit a personal in-game plot; review soil unknowns; choose first crop and observe possible—not certain—conditions | Farmer priorities, crop coefficients, soil assumptions, explicit opt-in location-inspired setting | **Planned**; My Farm is only a subsystem |
| 2: The Sky's False Promise | A beautiful forecast painting contradicts a missing/revised NASA data record; investigate before acting | Gridded context vs field reality; uncertainty, heat/rainfall, source timestamps | **Planned** |
| 3: Beneath the Roots | Which unseen soil condition changes what is feasible? Test a simplified water balance; seek lab/soil survey input | Texture, moisture, capacity, unknown salinity and drainage; no invented field probes | **Planned** |
| 4: A Season in Two Directions | Compare baseline and alternative crop calendars; observe why the preferred choice flips when farmer priorities/assumptions shift | Field Shift core; rotations, water, soil cover, crop suitability gates, decision-flip explanation | **Planned** in game; working crop comparison exists in scientific app |
| 5: The Canal Council | Six households negotiate an increasingly complex multi-turn season with competing interests | Co-designed schedules; shortage/fairness/collective decisions under water constraints | **Planned extension**; Chapter 0 has a single modeled turn |
| Finale / 6: The Field of Possibilities | Reconcile plans, explain assumptions, return to people; multiple endings with honest uncertainty | No magic perfect plan; record what changed, what is unknown, and what must be verified | **Planned** |

## Prologue — shot/interaction sequence (implement before more unrelated features)
1. **Playable cold open (implemented):** after the 3D loader, a visually layered sunrise/canal composition frames the question "Six fields. One canal. One missing answer." Text is sufficient; sound is not needed. A large chapter title, three clear stakes and two hypothesis cards replace the passive splash.
2. **The object and first agency (implemented in prologue, further scene art planned):** Nada finds a torn ledger and two untested plans. Choose **Follow the Water** (Hassan's schedule question) or **Follow the Soil** (Maryam's crop-calendar question), or skip to free-roam without choosing. Either branch records a *simulated research question*, changes the first story beat and never declares a scientific winner. Later routes remain open.
3. **First person, Hassan:** he wants reliable water timing. His voice is not 'the truth'; listening unlocks context and a notebook receipt.
4. **Second person, Maryam:** she worries about the next season and sustaining soil cover. Her trade-off is not a fixed fertilizer/carbon claim.
5. **Player choice:** follow a crop-calendar mystery, test a coordinated fictional water turn, test a constrained fictional one, or defer to request field evidence.
6. **Consequence:** the existing temporal solver changes six delivery/shortfall values; a readable ledger and village visual feedback show the result without asserting real farm benefits.
7. **The hook:** in the seventh field, the alternate season remains uncertain. The game directs the player to the real Crop Rotation Workspace for source-labelled NASA weather context and declared soil/crop parameters.
8. **Re-engagement:** research cannot make the mystery vanish automatically; future chapters expose new stakeholder priorities. Chapter ends with a meaningful question, not a fictional "safety cleared" badge.

**Accessible equivalent implemented:** `/experience/play/story.html` offers the **same two opening investigation questions** (or optional skip by visiting a character), Chapter 0 dialogue choices and water solver without WebGL, audio or device location; English default, Arabic optional. The 3D HUD includes Story Mode. Chapter 0 is **not** a complete audio-described or independently WCAG-certified 3D game.

## NPC motives / conflict (future writing expansion)
- **Nada:** wants to reconcile satellite-derived context with knowledge of farmers; grows from "the model knows" to "the evidence has limits".
- **Uncle Hassan:** livelihood and scheduling certainty; fears a schedule that looks mathematically fair but ignores timing and labor.
- **Maryam:** soil health and future crop options; fears over-promising water reductions by removing protective crops.
- **Four other households (not yet authored):** each gets a distinctive need/constraint and a reason to disagree; no caricature of 'ignorant farmer' versus 'smart AI'.

There is no villain; the antagonist is uncertainty, conflicting priorities and a limited shared resource. The seventh field represents the ethical cost of pretending a single forecast is a guarantee.

## Artistic direction to earn attention, not '3D everywhere'
- **Implemented:** coherent opening title treatment, painted-in-CSS canal/field geometry and sunrise glow with a functional reduced-motion fallback, tactile paired plan cards and mobile-first scrolling.
- **Still planned:** author an actual 3D opening camera move, animated paper ledger, more believable field boundaries, human-scale scene lighting and ambient day/night variations. Do not describe CSS illustration as 3D cinematics.
- Add readable reactions and small activity loops for named characters; avoid generic idle skeleton animations after dialogue.
- Keep a mobile-balanced tier with measured frame time, optional reduced motion, real subtitles and low-texture graphics fallback.
- Original/licensed assets only. Source evidence thumbnails must never be mistaken for painted fields or NASA observational pixels.

## Inclusive experience — actual scope vs remaining gaps

| User need | Current implementation | Next acceptance test |
|---|---|---|
| Deaf/Hard of hearing | All current authored dialogue as visible text; audio can be muted; English/Arabic mode | Confirm no auditory-only clue, verify future sound cues have captions |
| Blind/screen-reader | Keyboard-accessible text-first Chapter 0 with equivalent opening investigation, role labels, live updates and focusable choices; accessible launcher before Babylon runs | Manual NVDA/VoiceOver/TalkBack tests, reading order, focus loops, robust no-JS/error behavior |
| Motor limitation | Keyboard alternative to moving a character; focus indicators, buttons with spoken labels | Keyboard-only and switch-control evaluation, adjustable hold times |
| Motion sensitivity | Functional UI reduced-motion setting, CSS OS preference, no-WebGL text route | Audit 3D camera/particle motion and add a scene-level reduced-motion mode |
| Low vision / color perception | Non-color-only text labels in story, zoom allowed, distinct class names | Contrast audit and 200–400% zoom on real devices |
| Cognitive load / language | Short scene menu, linear chapter stages, English and Arabic | Readability/usability sessions, progress save, optional reading assistance |

**Do not claim complete accessibility** or blindness support for free-roam 3D until independently tested. The text alternative is a meaningful first accessible slice.

## Architecture and must-pass contracts
- `game/core/season-story.js`: pure narrative stage selection; test 'arrival → investigation → council/mystery → recorded' without invented NASA observations.
- `game/mission/chapter0.js`: one source of truth for authored dialogue and outcome changes shared by visual and text routes.
- `game/core/water-window-adapter.js`: shared temporal water solver; do not invent new physical calculations in UI.
- `game/ui/story-desk.js`: semantic HTML controller using the mission, keyboard/focus/ARIA and localization, no canvas dependency itself.
- `game/ui/opening-hook.js`: modal, keyboard-accessible hypothesis choice with source disclaimers, localized English/Arabic copy and a direct text-only link; receives the same `Chapter0Mission` rather than creating a separate result.
- `experience/play/story-only.js`: no-WebGL adaptor with no-op visuals and the actual solver; no extra scientific engine.
- Main application `/#rotations`: real crop-rotation decision support; explicit separate source context, not game-derived values.
- Future `scenario contract`: `{sourceType,sourceUrl,observedAt,retrievedAt,assumptions,units,calculationVersion,scenarioId,values}` and fail-closed provenance validation.
- Save-game contract planned: versioned, non-sensitive story flags only; do not store GPS/consented real farm details in game progress by default.

## Immediate engineering tasks (no task > 7 complexity)
| ID | Depends | Scope (1–10) | Verify |
|---|---|---:|---|
| T0 | — | 3 | Update story and remove mandatory safety gate; Node + E2E |
| T1 | T0 | 4 | Text story companion and no-WebGL route use identical solver; browser functional test |
| T2 | T1 | 3 | English/Arabic captions, keyboard focus, reduced-motion UI, a11y QA |
| T2a | T1 | 4 | Playable first-clue opening hook, distinct story branches and traceable simulated receipts; unit + browser |
| T3 | T0 | 5 | Persistent chapter progress / replay with consentless local save; unit / browser |
| T4 | T3 | 6 | Chapter 1 My Farm opt-in subsystem with actual field evidence bridge; integration tests |
| T5 | T4 | 6 | Chapter 4 paired crop rotation puzzles driven by real scientific calculations; no-data tests |
| T6 | T1 | 5 | Desktop/mobile visual pass, staged assets and motion performance budgets; screenshots and device QA |
| T7 | T6 | 4 | Vercel preview/production deployment only after a green PR and owner approval |

**Current delivery:** T0, T1 and T2a are implemented in draft PR #34, with parts of T2; **T2 manual accessibility validation is not complete**. T3–T7 are not complete. Existing scientific app and NASA 2026 submission/archive remain unchanged. T2a does not imply that all subsequent narrative chapters or fully accessible 3D free-roam are complete.

## Submission and global-quality reality check
2026 NASA Space Apps submission ended on 15 November. Post-deadline code is future product work unless official judging permits evaluating live updated URLs. Awards are not guaranteed by features or 3D alone. Best chances come from demonstrable challenge relevance, impact, scientific validity, novelty, user-centered accessibility and compelling evidence-led storytelling—not claiming every NASA challenge was solved by one product.
