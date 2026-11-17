# Soil-IQ · The Seventh Field — Egyptian cinematic art research

**16 November 2026 · Reference / production contract, not an assertion that the assets are installed.**

The main product remains the NASA Field Shift crop-rotation decision-support workflow. The Seventh Field is its optional, scientifically honest **English-first** narrative 3D companion. The Egyptian Delta setting, sustainability trade-offs and screen-reader/keyboard equivalent must survive every visual update.

## Creative thesis — rural Egyptian cinema, original people

The target is the **humanity and sense of place** of Egyptian rural cinema, not a licensed film adaptation. Build original characters with modern lives, clear motivations and visual personalities. Do **not** copy an actor's identifiable face, a film character, wardrobe design one-to-one, footage, dialogue, soundtrack or publicity still into the shipped app. Film pages are research references only; seek separate permission before using any film material.

**Original look-dev moodboard:** [Nada, Hassan and Maryam — first concept pass](../game/assets/concepts/egyptian-delta-triad-concept-v1.jpg). Generated specifically for this project with OpenAI ImageGen on 2026-11-16. This is *fictional concept art, not gameplay or proof of a working GLB model*, and has not been loaded into the 3D scene. It helps the character artist match silhouettes, clothes and the canal mood; all actual runtime meshes still need to be modeled/rigged and tested.

| Film / primary film-industry reference | What to study | What not to carry into Soil-IQ |
|---|---|---|
| [*The Land / Al-Ard* (Youssef Chahine, 1969)](https://www.acmi.net.au/works/94389--the-land-al-ard/) · [BFI analysis](https://www.bfi.org.uk/features/where-begin-with-youssef-chahine) | Group framing, agricultural land as a lived home, conflicting but dignified farmers, canal and meeting-place visual language | Its 1930s political conflict and forced irrigation restrictions are **not** our game's default 2026 water physics; no Abu Swelam likeness, actor face, scene or film dialogue |
| [*The Second Wife / Al-Zawga Al-Tanya* (Salah Abu Seif, 1967)](https://africultures.com/films/?no=11054) | Rural silhouettes, courtyard staging, naturalistic social interaction, cloth folds | Its plot, identifiable characters, exploitative power dynamics, performances or costume replicas |
| [*El Haram* (Henry Barakat, 1965)](https://www.festival-cannes.com/en/f/el-haram/) | Documentary-style framing of agricultural daily labor and human emotion | Film's trauma or specific story events; do not import violence into this learning experience |

### Original character design — **not actor lookalikes**

| Character | Visual silhouette and motion | Emotional progression / gameplay |
|---|---|---|
| **Nada**, late-20s agricultural engineer | Earth-green cotton field overshirt, sand-toned practical trousers, canvas satchel with source notebook; readable face and eyes; brisk walk but pauses to listen | Begins confident in dashboards, learns to say *unknown* when NASA resolution cannot identify field soil |
| **Hassan**, experienced farmer | Worn but dignified contemporary galabeya with textured fabric and rolled sleeves; strong hands; measured, economical gestures | Remembers past rotations, questions overconfident claims and prioritizes household reliability |
| **Maryam**, grower and cooperative organizer | Original workwear that suits her tasks and personal choice; distinct indigo/ochre palette and clipboard; decisive eye contact and open gestures | Discusses soil cover, labor and family priorities rather than being a secondary quest marker |
| **Mostafa**, pump mechanic | Practical sun-faded shirt, folded rag, metal notebook; precise wrist movements | Tests mechanical capacity only when a scenario actually has a fault; no forced equipment-safety tutorial |
| **Salma**, agronomist | Weathered lab/field vest and soil-sample kit; attentive inspect gestures | Challenges false soil diagnoses and requests field evidence |

Dialogue: polished **English UI/subtitles first**; authored Egyptian-Arabic voice is optional with an independent, accurately captioned English track. Original performers, written consent and recorded license are required for voice assets. For players who do not hear, every audio cue gets a visual/text equivalent. For players who cannot see or operate 3D, preserve and expand the existing `/experience/play/story.html` route.

## Visual references that may be used as source assets after review

The structured candidate list is [`game/assets/asset-reference-registry.json`](../game/assets/asset-reference-registry.json). A candidate is **not** part of the game merely because its license permits use.

| Priority | Source | Use | License assessment / gate |
|---|---|---|---|
| **1** | [MakeHuman/MPFB core assets](https://www.makehumancommunity.org/about/license.html), [system and target packs](https://static.makehumancommunity.org/assets/assetpacks.html) | Original Egyptian-proportioned base humans to sculpt/retopologize, **not** an instant ready-made Egyptian likeness | Core assets CC0; third-party/downloaded community clothing/skins may have different licenses. Export GLB via Blender; art-review faces, rig, topology and texture before shipping |
| **1** | [Adobe Mixamo](https://www.mixamo.com/) · [official FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) | Retarget idle, walk, listening, handing a notebook and discussion motions | Official FAQ allows royalty-free video-game use; verify character/animation and distribution restrictions for the actual downloaded item; do not redistribute loose source packs |
| **1** | [Rokoko everyday idle](https://www.rokoko.com/resources/rokoko-mocap-10-free-everyday-idle-animations) and [walk/run cycles](https://www.rokoko.com/resources/rokoko-mocap-16-free-walk-and-run-cycle-animations) | Stronger human body language and transitions | Official pages mention commercial project use. Review current download terms per chosen pack before bundling |
| **1** | [Poly Haven dirt](https://polyhaven.com/a/dirt), [wet mud](https://polyhaven.com/a/mud_forest), [HDRIs](https://polyhaven.com/hdris) · [license](https://polyhaven.com/license) | PBR soil roughness/normal, muddy banks and physically plausible dawn ambience | CC0; bundle optimized 1–2K textures, not 8K originals; record individual asset IDs and SHA-256 |
| **1** | [ambientCG](https://ambientcg.com/) · [license](https://docs.ambientcg.com/license/) | Brick, compacted earth, concrete, dry/wet soil detail | CC0; sample exact downloadable assets and hash before integrating |
| **2** | [Fab](https://www.fab.com/) · [EULA](https://www.fab.com/eula) | Quality pump, rural architecture and vegetation when available in Blender/glTF-compatible format | Per-listing rights and Standard vs Reference-Only tier must be verified; cost/technical fit undecided; **not approved for download yet** |
| **2** | [ActorCore](https://actorcore.reallusion.com/) · [Reallusion support](https://kb.reallusion.com/ExportPDF53026.aspx) | Professional actors/motions if original/CC0 work cannot meet art review | Paid license and allowed redistribution/export must be checked item by item. Not automatically approved |

**Never download by automated scraping or include a commercial/game/film model solely because an image preview is public.** MakeHuman is a *base mesh and asset generator*, Mixamo/Rokoko are animation sources, and Poly Haven/ambientCG provide scene materials. They are not interchangeable. A downloadable image/video reference has no automatic software asset license.

## Game mechanics and presentation references (study, never copy assets)

| Reference | Design lesson for The Seventh Field | Integration |
|---|---|---|
| [*SEASON: A letter to the future*](https://vibeavenue.com/season/) | Personal evidence journal; record place, voices and ambiguous memories | Existing Chapter 0 notebook gains dated testimony, provenance and replay; no imported art |
| [*Terra Nil*](https://store.steampowered.com/app/1593030/Terra_Nil/) | Make environmental improvement visually legible and consequence-based | A clearly **simulated** before/after soil-cover/irrigation echo, never measured yield or carbon claims |
| [*Farming Simulator 25*](https://www.farming-simulator.com/about.php?platform=pc) | Crop/soil material fidelity, equipment scale, authentic landscape density | Not a vehicle grinding game; no copied 3D models, textures or UI |
| [Xbox Accessibility Guidelines](https://learn.microsoft.com/en-us/xbox/accessibility/guidelines) · [Subtitle guidance](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/104) | Equivalence of captions and subtitles, remappable/keyboard controls | Test deaf/nonvisual paths alongside every newly introduced scene or sound |
| [Babylon glTF loader and art pipeline](https://doc.babylonjs.com/preparingArtForBabylon/dccToGltf) | Ship authored `.glb` with real skinning, animation groups and morph targets | Preserve the current lightweight procedural fallback until real assets pass visual and device QA |

## The first 20 seconds — production storyboard

1. **0–4s, cold open**: camera at human eye level behind Nada; a *visible* curving canal, palm silhouettes, irrigated/dry crop geometry and real village facades. No cinematic video masquerading as WebGL. Sound optional; caption **“A question crossed the canal before sunrise.”**
2. **4–9s, human hook**: Hassan holds a notebook page; Maryam compares two planting calendars. A *specific but unverified* disagreement, not a blanket drought or a forced emergency.
3. **9–14s, evidence tension**: Nada sees a regional NASA weather pixel on her tablet and realizes it says nothing direct about this plot's salinity. Screen label `OBSERVED — REGIONAL WEATHER` only when live verified weather is present; otherwise `EXAMPLE / UNAVAILABLE`.
4. **14–20s, consequential choice**: **Follow the Water / Follow the Soil / Skip**; route affects authored initial dialogue and evidence receipts, not an invented 'winning crop'. All options available in text-first mode.

Keep the opening choice fully keyboardable and skippable, with reduced-motion fallback. Direct the player toward one believable question and one discoverable evidence gap, not a wall of tutorial prompts.

## Rendering + quality gates

- 1 hero composition shot of the canal, a field and recognizably original Nada, Hassan or Maryam in the **actual running Babylon app**. Current screenshot **fails** this gate: flat horizon, primitive human and canal outside the frame.
- One conversation close-up with believable eye line, articulated clothing and authored idle/listen/gesture loops; asset owner and license receipt present.
- `glTF 2.0 / GLB` in a *local* asset directory with named rigs, unit scale, clean rest pose, one idle and walk animation, and tested interaction root; original mesh fallback remains available when GPU/assets fail.
- Verify material maps (baseColor, ORM, normal, UV), LOD, draw calls, file weight, fps on a real midrange phone, desktop screenshots and 360px view. **Targets** (not achieved claims): 30 fps phone low preset, 60 fps desktop; optimize measured bottlenecks.
- Deliver a live-scene 10–20s clip plus a 360px/no-WebGL transcript; measure comprehension and contrast. No claim of disability certification before NVDA/VoiceOver and user testing.
- Every *downloaded asset* must have creator, item URL, exact license snapshot, allowed redistribution, modified file SHA-256 and committed attribution; run the included `asset-reference-registry.test.mjs` release gate.

## Work orders, dependency and proof

| Task | Depends | Complexity | Done when |
|---|---|---|---|
| ART-01 Original Egyptian triad look-dev | cinema references | 4/10 | Three distinct turnaround/portrait approvals, no actor copies |
| ART-02 MakeHuman/Blender GLB rig proofs | ART-01 | 6/10 | Nada glTF skin, textures, named bones, idle/walk imported in Babylon |
| ART-03 Acting and costume variants | ART-02 | 6/10 | Hassan/Maryam and 2 dialogue close-ups in live scene |
| ART-04 Canal/fields architecture hero shot | PBR/source audit | 6/10 | Actual browser image shows water/bank, palms, crops and houses, with measurable density |
| ART-05 Performance/accessibility gate | ART-02–04 | 6/10 | Low/mobile fallback, reduced motion, captions/text route and benchmark evidence |
| GAME-06 Deep story and My Farm option | Chapter 0 and scientific contracts | 7/10 | New arc tested without changing NASA crop-rotation workspace or faking field ownership |

**No direct film/IP source is approved for production.** Preserve the existing Field Shift research and frozen 2026 submission evidence; development after its deadline is future work, not retroactively submitted proof.
