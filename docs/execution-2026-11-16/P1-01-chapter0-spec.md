# P1-01 Implementation Specification: Deepen Chapter 0 Choices (*The Seventh Field*)

**Repository:** `https://github.com/Mohamed-Mostafa-AE/SOLIQ`
**Target Integration Branch:** `release/soil-iq-unified-20261116` (baseline SHA `11c6369eae86cc9b76ba471487e30d532c9f1bab`, PR `#38`, Execution Board `#39`)
**Task ID:** `P1-01` (Depends on `P0-02`; feeds `P1-03` Checkpoint & `P1-04` Chapter 1)
**Owners:** Narrative & Systems Spec (Gemini) -> Code Integration (Codex)

### Implementation reconciliation — reviewed 2026-11-16

This document is the **target narrative and systems specification**, not a claim that every scripted line or all Chapters 1–6 have shipped. The actual Chapter 0 code is [P1-01 PR #46](https://github.com/Mohamed-Mostafa-AE/SOLIQ/pull/46) and the optional local save/resume/reset implementation [P1-03 PR #48](https://github.com/Mohamed-Mostafa-AE/SOLIQ/pull/48) was merged **into the P1-01 feature branch only**. Neither is yet part of the release integration branch or production.

Code-level parity already implemented in PR #46: stable Hassan/Maryam/Seventh Field choice IDs, conditional cover-buffered Council option, assumed/simulated scenario receipts, English default with optional Arabic, text-only/3D choice rendering, `flags.relationships`, strict versioned snapshot serialization, and regression tests. PR #48 adds an **explicit user-action-only** local browser checkpoint; saving does not happen automatically and no GPS/NASA raw payload is included.

**Remaining acceptance review:** the Field 7 opening dialogue currently explains both hypotheses generically; its combined Hassan/Maryam-specific entry line below remains a narrative target. PR #46 now stores and serializes `cropHypothesis` (`cover_first`, `water_saving`, `deferred_for_nasa`), emits distinct **simulated** receipts, and consumes it in the *later bilingual Canal Council opening dialogue*: Calendar A prompts an untested soil-cover question, Calendar B prompts an untested lower-peak-demand question, and deferral says real NASA/soil evidence is still needed. **This is narrative branching only.** The chosen crop hypothesis does **not** change Council choice IDs, hydraulic solver policy, demand vectors, or calculated outcomes; those remain determined by the Council action and separate soil-cover unlock conditions. PR #46 includes Node A/B dialogue assertions and Playwright Calendar B follow-up, all maintaining simulated/NASA-honest labels. PR #46 also now makes the final Council-selected solver policy authoritative in `flags.selectedPolicy`, with contradictory Hassan/Maryam proposal regression tests. The chapter's fictional head-first negotiation does **not** model measured head-to-tail canal pressure. Manual screen-reader/device checks, actual GLB human animation, and the full browser CI remain release gates.

Runnable coverage belongs to `e2e/chapter0-consequences.spec.mjs` (PR #46), `e2e/chapter0-checkpoint.spec.mjs` (PR #48), and the continuing `e2e/play-3d.spec.mjs` regression suite. The detailed examples in Section 6 are **acceptance illustrations**: use the implementation's actual localized phrasing and current selectors when running them.

---

## 1. Executive Scope & Design Boundaries

This specification deepens Chapter 0 (*The Seventh Field* / *الغيط السابع*) so that every player decision—starting from the dawn prologue (`OpeningHook`) through conversations with Uncle Hassan (`hassan`) and Maryam (`maryam`), inspecting The Seventh Field (`timeEcho` / `f7`), and convening at The Canal Council (`pumpStation`)—creates **visible, stateful consequences** in later dialogue, available council options, simulated mesqa water distribution, and sustainability trade-off receipts.

### Hard Constraints (Preserved from `constitution.md` & `spec.md`)
1. **Preserve Core Cast & Story:** Retain Nada (`nada`), Uncle Hassan (`hassan`), and Maryam (`maryam`), and the six-family Nile Delta mesqa setting.
2. **No Artificial Gates or Fake Impact Claims:** No mandatory safety-equipment inspections, no fictional sustainability certification, and no claims of measured real-world impact. All story outcomes remain strictly `dataClass: 'simulated'`, `evidenceClass: 'simulated'`, `hashKind: 'noncryptographic_display_id'`, and `realWorldImpactVerified: false`.
3. **Strict NASA Evidence Separation:** Real NASA POWER / EO data is never fabricated inside Chapter 0. When a player requests real evidence or opens Earth Lens (`nasa`), the game explicitly states that no dated, SHA-256-receipted NASA record is loaded in the game session (`unavailable`), and routes the player to `../../#rotations` for real NASA-backed crop-rotation analysis.
4. **English-First with Optional Egyptian Arabic:** Default `lang` is `'en'`. All new dialogue, choices, receipts, and `aria-live` announcements include natural English and authentic Egyptian Delta Arabic (`'ar'`).
5. **3D + Accessible Text/Caption Parity:** Every choice, emotion/gesture cue, and consequence works identically in 3D (`GameHUD` + `PlayerController`) and in `AccessibleStoryDesk` (`story-desk.js` / `story.html`) via keyboard-only navigation, captions, and reduced motion.
6. **Backward Compatibility:** Existing unit tests (`game/core/season-story.test.mjs`, `game/core/sustainability.test.mjs`) and existing Playwright assertions (`e2e/play-3d.spec.mjs`) must continue to pass without breaking existing selectors or `OUTCOMES` values.

### Additional Repo Paths for Codex to Inspect During Integration
The handoff package covers the core mission, UI, and tests. During code integration, Codex should also inspect these exact paths on `release/soil-iq-unified-20261116`:
- `experience/play/story.html` (standalone text-only DOM shell)
- `game/ui/hud.js` (dialogue modal rendering, receipt card rendering, telemetry toasts)
- `game/world/controls.js` (keyboard/raycast interaction triggers)
- `game/world/water-simulation.js` (Babylon visual water engine wrapping `runGameWaterWindow`)
- `game/world/time-echo.js` (Seventh Field visual & `getScenarioComparison()` data)
- `science/mesqa-window.js` (underlying `simulateWaterWindow` solver)

---

## 2. Game-State Schema Extensions (`Chapter0Mission`)

Extend `this.flags` in `game/mission/chapter0.js` while keeping all existing boolean/string keys intact for `P1-03` (versioned local checkpoint, no GPS/PII) and existing tests.

| Key | Type & Default | Allowed Values | Purpose & Downstream Effect |
| :--- | :--- | :--- | :--- |
| `firstClue` | `string \| null` (`null`) | `'water'`, `'soil'` | Existing. Shapes opening framing for Hassan, Maryam, and `season-story.js`. |
| `talkedToHassan` | `boolean` (`false`) | `true`, `false` | Existing. Tracks whether Hassan's gate scene was completed. |
| `talkedToMaryam` | `boolean` (`false`) | `true`, `false` | Existing. Tracks whether Maryam's gate scene was completed. |
| `inspectedSoil` | `boolean` (`false`) | `true`, `false` | Existing. Now unlocks soil-moisture context in Maryam's scene and enables the conditional **Cover-Buffered Turn** at the Canal Council if paired with `soilCoverChoice === 'living_cover'`. |
| `questionedFuture` | `boolean` (`false`) | `true`, `false` | Existing. Tracks whether The Seventh Field (`timeEcho` / `f7`) was examined. |
| `pumpStarted` | `boolean` (`false`) | `true`, `false` | Existing. `true` for `equilibrium` and `bottleneck`, `false` for `deferral`. |
| `selectedPolicy` | `string` (`'proportional'`) | `'proportional'`, `'capacity_limited'` | Existing. Now actively updated by Hassan/Maryam/Council choices. |
| `hassanStance` | `string \| null` (`null`) | `'cooperative'`, `'cautious'`, `'head_priority'` | **New.** Records what Nada promised or prioritized with Hassan; alters Maryam's opening line, choices, and Council framing. |
| `maryamStance` | `string \| null` (`null`) | `'aligned'`, `'cover_advocate'`, `'skeptical_stress_test'` | **New.** Records Maryam's alignment after Gate 2; alters Seventh Field reflection and Council dynamics. |
| `livelihoodPriority` | `string` (`'balanced'`) | `'balanced'`, `'immediate_cash'`, `'risk_averse'` | **New.** Captures farmer debt/cash-flow pressure vs. seasonal resilience. |
| `soilCoverChoice` | `string \| null` (`null`) | `'living_cover'`, `'moisture_checked'`, `'bare_fallow_risk'` | **New.** Tracks soil-cover commitment; unlocks the 4th Council option when combined with `inspectedSoil`. |
| `cropHypothesis` | `string \| null` (`null`) | `'cover_first'`, `'water_saving'`, `'deferred_for_nasa'` | **New.** Captures the tentative Seventh Field hypothesis and shapes subsequent **English/Arabic Council explanatory dialogue only**; does not change the solver, demand vector, or measured evidence. |
| `cooperationRiskFlag` | `boolean` (`false`) | `true`, `false` | **New.** Set when the player stress-tests simultaneous gate opening or backs `head_priority`; triggers tail-end warning in Council. |
| `evidenceRequested` | `boolean` (`false`) | `true`, `false` | **New.** Set when the player refuses to guess at The Seventh Field without NASA POWER context; highlights `deferral` and `../../#rotations`. |
| `relationships` | `object` | `{ hassanTrust: 0..2, maryamTrust: 0..2 }` | **New.** Integer trust delta (`0` neutral, `1` heard, `2` deeply aligned); never blocks progress, only enriches NPC tone and Council readiness. |
| `councilMode` | `string \| null` (`null`) | `'standard_proportional'`, `'cover_buffered_turn'`, `'bottleneck_overload'`, `'evidence_deferral'` | **New.** Distinguishes standard `equilibrium` from `cover_buffered_turn` while keeping `this.activeOutcome` within `OUTCOMES`. |

### Serialization Rule for `P1-03` Compatibility
Add `getSerializableState()` and `restoreState(snapshot)` on `Chapter0Mission` returning `{ version: 1, stage, activeOutcome, flags, notebookReceipts }`. Never store coordinates, device info, or real-world user identifiers.

---

## 3. Scene-by-Scene Implementation Specification

### Scene 0: Dawn Prologue (`game/ui/opening-hook.js` & `game/ui/story-desk.js`)
**Narrative Goal:** Ground the player immediately in a pre-dawn Nile Delta mesqa before the diesel pump starts. Six families share one branch canal; fertilizer and harvest debts are due; the Seventh Field sits fallow between two untested plans.

- **Trigger:** Clicking `#btn-start-game` opens `#opening-hook` (3D) or `#story-thread` (in `story.html` / `AccessibleStoryDesk`).
- **Choices (Preserving `#hook-clue-water` / `#hook-clue-soil` & `#story-thread-water` / `#story-thread-soil`):**
  1. **Follow the Canal Ledger (`clue = 'water'`)**
     - **EN:** `"Six families, one diesel pump, and dawn is already breaking. Who gets left dry at the tail end if we open the gates at once?"`
     - **AR:** `"ست عائلات على طلمبة ديزل واحدة والفجر بيطلع. مين اللي هيتظلم في آخر المسقة لو الكل فتح البوابات سوا؟"`
     - **State Mutation:** `beginInvestigation('water')` -> `flags.firstClue = 'water'`, adds receipt `STORY_CLUE_WATER` (`"Water-turn question"` / `"سؤال دورة المياه"`).
  2. **Follow the Soil Cover (`clue = 'soil'`)**
     - **EN:** `"The Seventh Field's soil is bare and heating fast. Can living clover cover hold enough moisture to spare a whole irrigation turn?"`
     - **AR:** `"تربة الغيط السابع مكشوفة وبتسخن بسرعة. هل غطاء البرسيم يقدر يحفظ رطوبة تكفي وتوفر رية كاملة؟"`
     - **State Mutation:** `beginInvestigation('soil')` -> `flags.firstClue = 'soil'`, adds receipt `STORY_CLUE_SOIL` (`"Soil-cover question"` / `"سؤال غطاء التربة"`).
- **Accessibility & Audio/Visual Parity:** `#opening-hook` traps focus, sets `inert` on `#game-ui-container`, supports `Escape` / `#hook-skip`, and provides `#hook-text-story` (`href="story.html"`).

---

### Scene 1: Uncle Hassan — Gate 1, Wheat Plot (`target.id === 'hassan'`)
**Emotional Core:** Uncle Hassan (elder farmer, striped galabeya, cane) has a wheat plot near the headgate, but his nephew farms the tail end. He is torn between his own overdue seed/fertilizer loan and protecting the tail-end families.

#### Branching Entry Line (Based on `flags.firstClue`)
- If `firstClue === 'water'`:
  - **EN:** `"You came straight from the headgate ledger, Nada. Good. Everyone thinks the pump solves everything—until the tail end cracks dry while my wheat loan comes due next week."`
  - **AR:** `"جيتي من عند دفتر البوابة على طول يا ندى، كويس. الكل فاكر إن الطلمبة بتحل كل حاجة، لحد ما آخر المسقة ينشف وقسط التقاوي والسماد عليا الأسبوع الجاي."`
- If `firstClue === 'soil'`:
  - **EN:** `"Looking at the dirt before the diesel? That is rare. My wheat looks thirsty on top, Nada, and I have bills due—tell me honestly if waiting hurts my harvest."`
  - **AR:** `"بتبصي على التراب قبل الديزل؟ ده نادر. القمح باين عطشان من فوق يا ندى والديون بتجري، قوليلي بصراحة لو استنينا محصولي هيتأثر؟"`
- If `firstClue === null` (skipped prologue):
  - **EN:** `"Dawn is slipping away, Nada. Six families are watching this gate, and my wheat plot needs to pay off this season's credit."`
  - **AR:** `"الفجر بيجري يا ندى. ست عائلات عينهم على البوابة دي، وغيط القمح ده لازم يسد مصاريف الموسم."`

#### Choices at Gate 1 (`hassan`)
| Choice ID | Label (EN / AR) | Emotion & Gesture | State Mutations | Receipt Added |
| :--- | :--- | :--- | :--- | :--- |
| `hassan_pledge_fair_turn` | **EN:** `"Let's lock a shared proportional turn—head and tail share the drop."`<br>**AR:** `"خلينا نثبت دورة نسبية عادلة—أول المسقة وآخرها يتقاسموا النقص."` | `EMOTIONS.HOPEFUL` / `GESTURES.GREET` | `talkedToHassan = true`<br>`hassanStance = 'cooperative'`<br>`selectedPolicy = 'proportional'`<br>`livelihoodPriority = 'balanced'`<br>`relationships.hassanTrust += 1`<br>`stage = talkedToMaryam ? 'pump_ready' : 'meet_maryam'` | `REC_HASSAN_AGREEMENT` (`"Hassan: Shared-Turn Pledge"`) |
| `hassan_inspect_soil_first` | **EN:** `"Hold the gate—let's check root-zone moisture under the crust before promising water."`<br>**AR:** `"استنى قبل البوابة—خلينا نفحص رطوبة الجذور تحت القشرة الأول قبل ما نوعد بالمياه."` | `EMOTIONS.EXPLAINING` / `GESTURES.INSPECT` | `talkedToHassan = true`<br>`inspectedSoil = true`<br>`hassanStance = 'cautious'`<br>`soilCoverChoice = 'moisture_checked'`<br>`relationships.hassanTrust += 1`<br>`stage = talkedToMaryam ? 'pump_ready' : 'meet_maryam'` | `REC_SOIL_INSPECT` (`"Simulated Root-Zone Check (24% assumed)"`) |
| `hassan_prioritize_wheat_livelihood` | **EN:** `"Your loan is real, Uncle. Back a head-first turn so your wheat doesn't take the hit."`<br>**AR:** `"قسطك حقيقة يا عم حسن. خلينا نبدأ بيك الأول عشان القمح ما يتأثرش."` | `EMOTIONS.CONCERNED` / `GESTURES.THINK` | `talkedToHassan = true`<br>`hassanStance = 'head_priority'`<br>`selectedPolicy = 'capacity_limited'`<br>`livelihoodPriority = 'immediate_cash'`<br>`cooperationRiskFlag = true`<br>`relationships.hassanTrust += 1`<br>`stage = talkedToMaryam ? 'pump_ready' : 'meet_maryam'` | `REC_HASSAN_LIVELIHOOD` (`"Hassan: Head-First Livelihood Pressure"`) |

---

### Scene 2: Maryam — Gate 2, Berseem Clover Plot (`target.id === 'maryam'`)
**Emotional Core:** Maryam (indigo dress, terracotta tarha, field clipboard) manages berseem clover and tracks every family's turn. She reacts **directly** to what Nada did at Gate 1 (`hassanStance` & `inspectedSoil`) as well as `firstClue`.

#### Branching Entry Line (Based on `hassanStance`, `inspectedSoil`, `firstClue`)
- If `hassanStance === 'head_priority'`:
  - **EN:** `"Word travels fast along the mesqa, Nada. Hassan says you're backing a head-first turn for his wheat. Look at the tail-end ledger—who pays for that if the diesel supply drops?"`
  - **AR:** `"الكلام بيجري بسرعة على المسقة يا ندى. عم حسن بيقول إنك مأيدة يبدأ بيه عشان القمح. بصي على دفتر آخر المسقة—مين هيدفع التمن لو الديزل قل؟"`
- Else if `inspectedSoil === true`:
  - **EN:** `"Hassan waved from Gate 1—he said you actually checked below the soil crust instead of guessing. That changes how we can plan the berseem cover."`
  - **AR:** `"عم حسن شاورلي من البوابة الأولى—قال إنك فحصتي تحت قشرة التربة بدل التخمين. ده بيغير طريقة تخطيطنا لغطاء البرسيم."`
- Else if `hassanStance === 'cooperative'`:
  - **EN:** `"Hassan just sent word that you both agreed to share any shortage proportionally. If we pair that with soil cover, the tail end might actually breathe."`
  - **AR:** `"عم حسن بعتلي إنكم اتفقتم تتقاسموا أي نقص بالتساوي. لو ربطنا ده بغطاء التربة، آخر المسقة ممكن ياخد نفسه."`
- Else (`!talkedToHassan`, player visited Maryam first):
  - **EN:** `firstClue === 'soil'` ? `"You're following the soil clues first, Nada. My berseem holds moisture longer than bare dirt—but Hassan hasn't weighed in yet."` : `"My clipboard shows 180 fictional units on a tight day, Nada. Before we decide, we still need Hassan's voice from Gate 1."`
  - **AR:** `firstClue === 'soil'` ? `"ماشية ورا التربة الأول يا ندى. البرسيم بيحفظ الرطوبة أطول من الأرض المكشوفة—بس لسه ما سمعناش عم حسن."` : `"كراستي بتقول 180 وحدة افتراضية في اليوم الصعب يا ندى. قبل ما نقرر، لسه محتاجين نسمع عم حسن."`

#### Choices at Gate 2 (`maryam`)
| Choice ID | Availability Condition | Label (EN / AR) | Emotion & Gesture | State Mutations | Receipt Added |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `maryam_align_proportional` | Always available | **EN:** `hassanStance === 'head_priority'` ? `"You're right—let's bring Hassan back into a transparent proportional ledger."` : `"Lock the proportional ledger for all six families—no hidden side-turns."`<br>**AR:** `hassanStance === 'head_priority'` ? `"عندك حق—خلينا نرجع نقنع عم حسن بدفتر نسبي شفاف للكل."` : `"نثبت التوزيع النسبي للست عائلات—مفيش أدوار جانبية."` | `EMOTIONS.SATISFIED` / `GESTURES.EXPLAINING` | `talkedToMaryam = true`<br>`maryamStance = 'aligned'`<br>`selectedPolicy = 'proportional'`<br>`cooperationRiskFlag = false`<br>`relationships.maryamTrust += 1`<br>`stage = talkedToHassan ? 'pump_ready' : 'meet_hassan'` | `REC_MARYAM_LEDGER` (`"Maryam: Proportional Mesqa Ledger (180 units simulated)"`) |
| `maryam_soil_cover_pact` | Always available (enriched if `inspectedSoil`) | **EN:** `inspectedSoil` ? `"Use the root-zone moisture we just checked—keep living berseem cover to cut evaporation."` : `"Keep living berseem cover between seasons so the soil stops baking."`<br>**AR:** `inspectedSoil` ? `"نبني على رطوبة الجذور اللي فحصناها—نسيب غطاء البرسيم الحي يقلل البخر."` : `"نحافظ على غطاء البرسيم الحي بين المواسم عشان التربة ما تتحرقش."` | `EMOTIONS.HOPEFUL` / `GESTURES.INSPECT` | `talkedToMaryam = true`<br>`maryamStance = 'cover_advocate'`<br>`soilCoverChoice = 'living_cover'`<br>`relationships.maryamTrust += 1`<br>`stage = talkedToHassan ? 'pump_ready' : 'meet_hassan'` | `REC_MARYAM_COVER` (`inspectedSoil ? "Cover + Root Moisture Pact (Simulated)" : "Berseem Soil-Cover Pact (Simulated)"`) |
| `maryam_stress_test_rush` | Always available | **EN:** `"What happens if all six gates open at once during peak heat?"`<br>**AR:** `"إيه اللي هيحصل لو الست بوابات اتفتحوا في نفس اللحظة وقت الحر؟"` | `EMOTIONS.CONCERNED` / `GESTURES.DISAGREE` | `talkedToMaryam = true`<br>`maryamStance = 'skeptical_stress_test'`<br>`cooperationRiskFlag = true`<br>`stage = talkedToHassan ? 'pump_ready' : 'meet_hassan'` | `REC_MARYAM_STRESS_TEST` (`"Stress-Test Warning: Simultaneous Gate Risk"`) |

---

### Scene 3: The Seventh Field (`target.id === 'timeEcho'` or `'f7'`)
**Emotional Core:** Two shimmering, *untested* seasonal futures hang over the fallow seventh plot:
- **Calendar A:** Extended Berseem Cover -> Maize (holds soil moisture and nitrogen, slower early cash return).
- **Calendar B:** Short-Season Barley -> Early Cash Crop (lower peak water demand, faster cash for debt, leaves soil exposed longer).

#### Branching Entry Line
- If `maryamStance === 'cover_advocate'` and `hassanStance === 'head_priority'`:
  - **EN:** `"Two futures shimmer over the fallow field: Maryam's soil-cover rotation versus Hassan's fast-cash barley. Neither has been tested against real NASA weather yet."`
  - **AR:** `"مستقبلين بيلمعوا فوق الأرض البور: دورة غطاء التربة بتاعة مريم قصاد شعير عم حسن السريع. ولا واحد اتجرب على طقس NASA الحقيقي."`
- Else:
  - **EN:** `"SIMULATION — NOT SATELLITE OBSERVATION. Two untested crop calendars overlap here: longer soil cover versus lower peak water demand. Which assumption do you want to test—or should we refuse to guess?"`
  - **AR:** `"محاكاة — ليست رصدًا فضائيًا. تقويمين غير مختبرين بيتقاطعوا هنا: غطاء تربة أطول قصاد احتياج مائي أقل. تحبي تختبري أي فرضية—ولا نرفض التخمين؟"`

#### Choices at The Seventh Field (`timeEcho` / `f7`)
| Choice ID | Label (EN / AR) | State Mutations | Receipt Added |
| :--- | :--- | :--- | :--- |
| `f7_hypothesis_cover` | **EN:** `"Test Calendar A hypothesis: prioritize living soil cover and moisture retention."`<br>**AR:** `"نختبر فرضية التقويم (أ): أولوية لغطاء التربة الحي وحفظ الرطوبة."` | `questionedFuture = true`<br>`cropHypothesis = 'cover_first'` | `FUTURE_ROTATION_COVER` (`"Hypothesis: Cover-First Calendar (comparison_only)"`) |
| `f7_hypothesis_water_saving` | **EN:** `"Test Calendar B hypothesis: lower peak water demand and faster livelihood turnover."`<br>**AR:** `"نختبر فرضية التقويم (ب): تقليل ذروة سحب المياه ودورة دخل أسرع."` | `questionedFuture = true`<br>`cropHypothesis = 'water_saving'` | `FUTURE_ROTATION_WATER` (`"Hypothesis: Low-Peak-Demand Calendar (comparison_only)"`) |
| `f7_refuse_guess_nasa` | **EN:** `"Refuse to pick a winner here—flag this for real NASA POWER & Crop Rotation comparison."`<br>**AR:** `"نرفض نختار فائز هنا—نسجلها للمقارنة ببيانات NASA POWER الحقيقية."` | `questionedFuture = true`<br>`cropHypothesis = 'deferred_for_nasa'`<br>`evidenceRequested = true` | `FUTURE_ROTATION_MYSTERY` (`"Uncertainty Logged: Needs NASA POWER Context"`) |

---

### Scene 4: The Canal Council (`target.id === 'pumpStation'` / `'pumpTrigger'` / `'pump'`)
**Emotional Core:** All six families gather at the diesel pump. The Council dialogue **dynamically adapts** its opening summary and available choices based on `hassanStance`, `maryamStance`, `inspectedSoil`, `soilCoverChoice`, and `evidenceRequested`.

#### Dynamic Council Summary Line
- Shows `voicesHeard = Number(talkedToHassan) + Number(talkedToMaryam)` plus a contextual status tag:
  - If `evidenceRequested`: notes that Nada flagged the Seventh Field as needing real NASA weather data.
  - Else if `cooperationRiskFlag`: warns that unresolved head-vs-tail pressure threatens tail-end equity.
  - Else if `inspectedSoil && soilCoverChoice === 'living_cover'`: notes that root-zone inspection + berseem cover unlocked a **Cover-Buffered Proportional Turn** option.
- Independently append an **untested, simulated hypothesis** caption in both languages based on `cropHypothesis`: A focuses on living-cover assumptions; B on peak-demand assumptions; `deferred_for_nasa` explains actual NASA weather/soil context is unavailable. This changes only Council **dialogue**, never choices or solver inputs.

#### Council Choices & `executeOutcome` Mapping
*(Choices 1–3 are always present so existing 3-choice tests pass; Choice 4 is conditionally appended when `inspectedSoil && soilCoverChoice === 'living_cover'`.)*

1. **Coordinated Proportional Turn -> `executeOutcome('equilibrium')`**
   - **Label EN:** `maryamStance === 'aligned' || hassanStance === 'cooperative'` ? `"Run the agreed proportional turn across all 6 gates (235 m³/h simulated)"` : `"Propose a proportional turn across all 6 gates (235 m³/h simulated)"`
   - **Label AR:** `"تشغيل الدورة النسبية المتفق عليها للست بوابات (235 م³/س محاكاة)"`
   - **Simulation:** `waterEngine.runSimulation(235, [35, 45, 60, 40, 25, 30], 'proportional')`, `councilMode = 'standard_proportional'`.
2. **Simultaneous / Head-Priority Overload -> `executeOutcome('bottleneck')`**
   - **Label EN:** `hassanStance === 'head_priority'` ? `"Back Hassan's head-first turn under tight diesel supply (120 m³/h simulated)"` : `"Open gates simultaneously under limited supply (120 m³/h simulated)"`
   - **Label AR:** `"فتح البوابات معًا / أولوية أول المسقة مع نقص الإمداد (120 م³/س محاكاة)"`
   - **Simulation:** If `hassanStance === 'head_priority'`, runs `waterEngine.runSimulation(120, [45, 50, 60, 40, 25, 30], 'capacity_limited')`; otherwise `(120, [35, 45, 60, 40, 25, 30], 'capacity_limited')`. `councilMode = 'bottleneck_overload'`.
3. **Conservative Deferral Pending NASA Evidence -> `executeOutcome('deferral')`**
   - **Label EN:** `evidenceRequested` ? `"Defer pumping as planned and open Crop Rotation with NASA POWER context"` : `"Hold the pump and request real NASA weather & crop-rotation data first"`
   - **Label AR:** `"تأجيل الطلمبة وطلب بيانات طقس NASA وتقويم المحاصيل الحقيقي أولًا"`
   - **Simulation:** `pumpStarted = false`, `councilMode = 'evidence_deferral'`, `metrics: null`.
4. **[Conditional Unlock: `inspectedSoil && soilCoverChoice === 'living_cover'`] Cover-Buffered Proportional Turn -> `executeOutcome('equilibrium', { mode: 'cover_buffered_turn' })`**
   - **Label EN:** `"Run Cover-Buffered Proportional Turn (235 m³/h vs. simulated lower-evaporation demands)"`
   - **Label AR:** `"تشغيل دورة نسبية مدعومة بغطاء التربة (235 م³/س مع فرضية بخر أقل)"`
   - **Simulation:** Runs `waterEngine.runSimulation(235, [32, 41, 54, 37, 23, 28], 'proportional')`, sets `councilMode = 'cover_buffered_turn'`, and adds a distinct simulated receipt noting that the lower demand vector is a *story assumption*, not field-calibrated data.

---

## 4. Sustainability Trade-Offs & `season-story.js` Updates

### `game/core/sustainability.js`
Extend `sustainabilityLesson(outcome, result, context = {})` **without breaking existing positional arguments or assertions in `sustainability.test.mjs`**:
- Keep `realWorldImpactVerified: false`, `evidenceClass: 'simulated'`, `themes` length `4` (`SDG 2`, `SDG 6`, `SDG 12`, `SDG 13`), and `metrics: { simulatedDeliveredM3, simulatedJainFairness } | null`.
- Add optional `tradeoffAxes` object to the returned lesson:
  - `waterFairness`: `'high_simulated' | 'simulated_allocation_shortfall' | 'untested_deferred'` (the solver models aggregate limited-capacity allocation, **not** verified head-to-tail hydraulic pressure or measured tail-field deprivation)
  - `soilCover`: `context.soilCoverChoice || 'unspecified'`
  - `livelihoodTension`: `context.livelihoodPriority || 'balanced'`
  - `uncertaintyNoteEn` / `uncertaintyNoteAr`: explicitly reminds the player that simulated Chapter 0 choices explore trade-offs and require real NASA POWER data in `../../#rotations`.

### `game/core/season-story.js`
Keep `getSeasonStoryBeat(flags, activeOutcome)` backward-compatible with `season-story.test.mjs` (`'arrival'`, `'thread'`, `'investigation'`, `'mystery'`, `'council'`, `'decision-recorded'`), while enriching `'investigation'`, `'council'`, and `'decision-recorded'` text when `hassanStance`, `maryamStance`, `soilCoverChoice`, or `evidenceRequested` are populated.

---

## 5. Accessibility & Localization Parity (`story-desk.js`, `localization.js`)

1. **`AccessibleStoryDesk` (`game/ui/story-desk.js`):**
   - Already calls `this.mission.getDialogueForTarget({ id: targetId })`, so all dynamic branching in `Chapter0Mission` automatically surfaces in `#story-choice-list`.
   - Update `_renderDialogue(targetId)` to announce speaker emotion/gesture as text captions in `#story-announcement` (`aria-live="polite"`), e.g., `"Uncle Hassan (explaining, inspecting soil): ..."` / `"عم حسن (بيشرح وبيفحص التربة): ..."`, so deaf/hard-of-hearing and non-3D players receive the same emotional cues as 3D animations and audio chimes.
   - Add a `data-choice-id` attribute on each rendered button in `#story-choice-list` and `.dialogue-choice-btn` in `hud.js` for deterministic keyboard/screen-reader and Playwright targeting.
2. **Localization (`game/ui/localization.js`):**
   - Preserve default `lang = 'en'` and toggleable `'ar'` via `#select-lang` (3D HUD) and `#story-language` (`story.html`).

---

## 6. Playwright E2E Acceptance Examples (adapt to exact implementation)

These are illustrative acceptance examples; executable P1-01 tests are tracked in `e2e/chapter0-consequences.spec.mjs` and should run alongside `e2e/play-3d.spec.mjs`. They verify that **early decisions visibly change later NPC dialogue, available Council options, and simulated sustainability receipts**, across both English and Arabic, using accessible keyboard controls.

```javascript
  test('P1-01 Branch A: soil clue + soil inspection + cover pact unlocks Cover-Buffered Council turn', async ({ page }) => {
    await page.goto('/experience/play/story.html');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // 1. Choose soil clue in prologue
    await page.locator('#story-thread-soil').press('Enter');
    await expect(page.locator('#story-beat-title')).toContainText('Follow the soil');

    // 2. Uncle Hassan: choose soil inspection (choice index 1 / hassan_inspect_soil_first)
    await page.locator('[data-story-target="hassan"]').click();
    await page.locator('[data-choice-id="hassan_inspect_soil_first"]').press('Enter');

    // 3. Maryam's opening line must reflect Hassan's soil inspection
    await page.locator('[data-story-target="maryam"]').click();
    await expect(page.locator('#story-dialogue-text')).toContainText('checked below the soil crust');
    await page.locator('[data-choice-id="maryam_soil_cover_pact"]').press('Enter');

    // 4. Seventh Field: pick cover hypothesis
    await page.locator('[data-story-target="timeEcho"]').click();
    await page.locator('[data-choice-id="f7_hypothesis_cover"]').press('Enter');

    // 5. Canal Council must now unlock the 4th conditional option (Cover-Buffered Turn)
    await page.locator('[data-story-target="pumpStation"]').click();
    await expect(page.locator('#story-choice-list button')).toHaveCount(4);
    await page.locator('[data-choice-id="council_cover_buffered"]').press('Enter');

    const state = await page.evaluate(() => {
      const { mission, water } = window.__soilIqTextGame;
      return {
        outcome: mission.activeOutcome,
        councilMode: mission.flags.councilMode,
        inspectedSoil: mission.flags.inspectedSoil,
        soilCoverChoice: mission.flags.soilCoverChoice,
        fairness: water.currentSimulation?.fairness,
      };
    });
    expect(state.outcome).toBe('equilibrium');
    expect(state.councilMode).toBe('cover_buffered_turn');
    expect(state.inspectedSoil).toBe(true);
    expect(state.soilCoverChoice).toBe('living_cover');
    expect(state.fairness).toBeGreaterThan(0.9);
    await expect(page.locator('#text-receipts')).toContainText('SIMULATED');
  });

  test('P1-01 Branch B: head-first livelihood choice triggers Maryam pushback, NASA deferral, and Arabic parity', async ({ page }) => {
    await page.goto('/experience/play/story.html');

    // 1. Choose water clue
    await page.locator('#story-thread-water').press('Enter');

    // 2. Uncle Hassan: back immediate wheat livelihood pressure
    await page.locator('[data-story-target="hassan"]').click();
    await page.locator('[data-choice-id="hassan_prioritize_wheat_livelihood"]').press('Enter');

    // 3. Maryam must react directly to the head-first decision
    await page.locator('[data-story-target="maryam"]').click();
    await expect(page.locator('#story-dialogue-text')).toContainText('head-first proposal');
    await page.locator('[data-choice-id="maryam_stress_test_rush"]').press('Enter');

    // 4. Seventh Field: refuse to guess without NASA POWER context
    await page.locator('[data-story-target="timeEcho"]').click();
    await page.locator('[data-choice-id="f7_refuse_guess_nasa"]').press('Enter');

    // 5. Canal Council keeps standard 3 choices (no soil-cover unlock) and executes deferral
    await page.locator('[data-story-target="pumpStation"]').click();
    await expect(page.locator('#story-choice-list button')).toHaveCount(3);
    await page.locator('[data-choice-id="council_deferral"]').press('Enter');

    const state = await page.evaluate(() => {
      const { mission } = window.__soilIqTextGame;
      return {
        outcome: mission.activeOutcome,
        hassanStance: mission.flags.hassanStance,
        evidenceRequested: mission.flags.evidenceRequested,
        cooperationRiskFlag: mission.flags.cooperationRiskFlag,
        pumpStarted: mission.flags.pumpStarted,
      };
    });
    expect(state.outcome).toBe('deferral');
    expect(state.hassanStance).toBe('head_priority');
    expect(state.evidenceRequested).toBe(true);
    expect(state.cooperationRiskFlag).toBe(true);
    expect(state.pumpStarted).toBe(false);

    // 6. Switch to Arabic and verify Egyptian Arabic localization remains active
    await page.locator('#story-language').selectOption('ar');
    await expect(page.locator('#text-progress')).toContainText('قرار المياه');
    await expect(page.locator('#story-desk-title')).toContainText('الموسم');
  });
```

---

## 7. Codex Integration & Verification Checklist

1. **Implementation Order:**
   - Update `game/mission/chapter0.js` (new `flags`, `relationships`, branching dialogues, `data-choice-id` metadata on choices, `councilMode`, `getSerializableState`/`restoreState`).
   - Update `game/core/season-story.js` and `game/core/sustainability.js` (preserving all existing exports & test assertions).
   - Update `game/ui/story-desk.js` and `game/ui/hud.js` (render `data-choice-id`, surface emotion/gesture captions in `#story-announcement`).
   - Append the two `P1-01` E2E tests in `e2e/play-3d.spec.mjs`.
2. **Verification Commands (run before merging to `release/soil-iq-unified-20261116`):**
   - `node --test game/core/season-story.test.mjs game/core/sustainability.test.mjs`
   - `npm test`
   - `npx playwright test e2e/play-3d.spec.mjs`
