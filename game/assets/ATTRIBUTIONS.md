# Soil-IQ: The Seventh Field — Actual Asset and Prototype Art Status

**Audited 2026-11-16.** This file describes the code currently shipping in the *development branch*, not our art goals. Proposed film, model, animation and texture references are in the [art research bible](../../docs/EGYPTIAN_CINEMATIC_ART_REFERENCE_BIBLE_2026.md) and [candidate registry](asset-reference-registry.json). They are **not yet downloaded, licensed per item or bundled**.

**Concept-only art disclosure:** `game/assets/concepts/egyptian-delta-triad-concept-v1.jpg` was generated with OpenAI ImageGen on 2026-11-16 from an original prompt for fictional Nada, Hassan and Maryam; 1200px JPEG export of the original concept. It is for *art direction only* and is **not** used by the 3D runtime or represented as NASA/field evidence, real actors or completed 3D models.

## 1. Compliance Statement & Ethics
The project's source and rights principles:
- No copied or ripped commercial assets from GTA, Farming Simulator, or proprietary software.
- No synthetic pseudo-3D images or static cards disguised as a 3D environment.
- Current environment and character meshes are original **procedural prototypes**, not licensed human scans or finished game-ready cinematic art. No third-party art rights have been certified by NASA.

---

## 2. 3D Engine & Runtimes
- **Babylon.js**:
  - Version: locally vendored runtime at `game/assets/vendor/babylon.js` and `babylonjs.loaders.min.js`; record exact vendor hash when upgrading.
  - License: Apache License 2.0 (https://github.com/BabylonJS/Babylon.js/blob/master/license.md)
  - Authors: Babylon.js Team / Microsoft and open-source contributors
  - Usage: Browser 3D scene, PBR appearance and transform-based character animation. Presence of a glTF loader does not mean actual humanoid GLB skinning has been imported.

---

## 3. Characters & Skeletal Rigs — CURRENT LIMITATION
- **Nada, Hassan and Maryam** are original fictional Egyptian Delta character concepts, not actress/actor likenesses.
- `game/world/characters.js` animates articulated Babylon `TransformNode` chains with **disconnected sphere/box/cylinder body parts**. `game/world/character-detail.js` adds sculpted geometric pieces, simple facial features and costume hints.
- The previous claim of a **high-poly anatomical mesh with smooth vertex skinning weights** was incorrect. No continuous human skin mesh, weight-painted skeleton, professionally rigged GLB, facial mocap, blendshapes or production quality cloth is installed yet.
- Source code and procedural geometry were authored for this project. Actual license for distributed code follows the repository license; future third-party human assets must have individual verified rights and attribution.

---

## 4. Environment & Cultural Delta Architecture — PROTOTYPE (P1-08 Technical Art Pass)
- `game/world/village.js` creates an illustrative heightmap-based terrain, mesqa canal with visible banks, timber-and-stone footbridge (`planCanalBridge`), diesel pump station, sluice gates, planted crop plots, mudbrick houses with reed pergolas, clay water jars (الزير - Zir), and date palms with fruit clusters.
- `game/world/delta-procedural-textures.js` generates source-authored procedural canvas textures: alluvial soil, canal footpaths, wet silt, crop loam, saline crust efflorescence, puddle mud, mudbrick patterns, timber grain, and terracotta clay.
- `game/world/season-feedback.js` coordinates simulated irrigation outcomes and seasonal consequences across fields (perked vs wilted crops, glistening wet mud vs saline crust) and drives gentle palm/water wind sway respecting reduced-motion preferences.
- `game/render/engine-setup.js` provides golden dawn lighting, warm Nile morning mist fog, inverted sky dome (`nileSkyDome`), and `prefers-reduced-motion` support.
- These are **not** real surveyed farm boundaries, physical 3D scans, licensed Egyptian buildings or finished production 3D models. The environment is an authentic original fictional technical-art illustration of the Egyptian Nile Delta.
- All future real-world 3D meshes and texture downloads require their own creator/URL/license/digest entries, not blanket claims under MIT.

---

## 5. Water Shading, Seasonal Feedback & PBR Materials
- `game/world/water-simulation.js` renders a PBR-colored water tube with dynamic ripple oscillations and flow velocity driven by the canal time-sliced solver (`science/mesqa-window.js`).
- Dry/wet terrain albedo, puddle specular highlights, and white saline efflorescence crust convey **simulated visual state** only; they cannot be read as field-measured soil moisture, groundwater depth, salinity or NASA observation.
- The Seventh Field Time Echo (`game/world/time-echo.js`) renders dual-scenario holographic volumes (Scenario A Monoculture vs Scenario B Balanced Rotation) with explicit `SIMULATED` and `comparison_only` labels.

---

## 6. Procedural Audio Synthesis (Web Audio API)
- `game/world/audio.js` uses a local Web Audio graph without external audio files: filtered engine oscillators, filtered **white** noise for water, low-pass wind noise, and short oscillator cues for gate/notebook actions.
- The previous references to recorded birds, multi-pole pink noise, physically modeled 4-stroke jitter and metal-groan sample libraries were overstated. Voice acting, signed actor permissions, external sounds and sound-equivalent captions are separate future tasks.

---

## 7. Scientific Data & Earth Observation Context
- **NASA POWER**:
  - Data: Regional gridded weather context requested for the illustrative Sakha / Kafr El Sheikh **coordinate point** (31.08°N, 30.94°E). This is not an independently surveyed or authenticated farm station.
  - Attribution: NASA Langley Research Center POWER Project funded through the NASA Earth Science/Applied Science Program.
  - Ethical labeling: Displayed as historical regional weather context, not real-time localized soil telemetry.
