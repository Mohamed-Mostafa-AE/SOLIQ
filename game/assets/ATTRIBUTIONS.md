# SOLIQ: The Seventh Field — 3D Asset, Sound and Shading Attributions

## 1. Compliance Statement & Ethics
In compliance with NASA Space Apps 2026 regulations, open-source attribution standards, and project specifications:
- No copied or ripped commercial assets from GTA, Farming Simulator, or proprietary software.
- No synthetic pseudo-3D images or static cards disguised as a 3D environment.
- All 3D procedural meshes, PBR shaders, rig skeletons, particle systems, and audio synthesis routines are authored directly for SOLIQ or derived from permissive open-source licenses (MIT / CC0 / Apache 2.0).

---

## 2. 3D Engine & Runtimes
- **Babylon.js**:
  - Version: 7.x / 8.x
  - License: Apache License 2.0 (https://github.com/BabylonJS/Babylon.js/blob/master/license.md)
  - Authors: Babylon.js Team / Microsoft and open-source contributors
  - Usage: Core WebGL2 / WebGPU rendering engine, glTF loader, PBR pipeline, skeletal animation and physics.

---

## 3. Characters & Skeletal Rigs
- **Nada (Playable Protagonist)**:
  - Design: Authentic young Egyptian agricultural engineer, field jacket, trousers, boots, hair scarf, tablet holster.
  - Geometry & Rig: Custom authored high-poly anatomical mesh with 20-bone skeletal hierarchy (`Hips`, `Spine`, `Chest`, `Neck`, `Head`, `Shoulders`, `Arms`, `Forearms`, `Hands`, `Thighs`, `Shins`, `Feet`) and smooth vertex skinning weights.
  - License: MIT License (Project SOLIQ original work).
- **Uncle Hassan (عم حسن - Elder Delta Farmer)**:
  - Design: Traditional Egyptian Nile Delta farmer, striped galabeya, dark woolen vest (sudayri), white skullcap (taqeyya), cane.
  - Geometry & Rig: Custom authored skeletal character with expressive posture and conversational gestures.
  - License: MIT License (Project SOLIQ original work).
- **Maryam (مريم - Experienced Delta Farmer)**:
  - Design: Modern competent Egyptian farmer, rural working attire with head wrap, holding irrigation schedule clipboard.
  - Geometry & Rig: Custom authored skeletal character with articulate pointing and agreement animations.
  - License: MIT License (Project SOLIQ original work).

---

## 4. Environment & Cultural Delta Architecture
- **Nile Delta Village & Organic Farmland**:
  - Terrain: Multi-zone procedural mesh with elevation curves, agricultural furrow rows, and embankment slopes.
  - Nile Canal (Mesqa): Curving hydraulic ditch with stone intake abutments, stepped soil banks, and wooden drainage culverts.
  - Irrigation Pump House: Lister/Deutz-style single-cylinder diesel motor with flywheel, intake pipe, exhaust pipe, and pressure gauge.
  - Sluice Gates: Metal and timber canal sluice gates with functional turning spindles and raiseable plates.
  - Crops: Procedural furrowed wheat (قمح), berseem/clover (برسيم), flooded rice (أرز), maize (ذرة), fava beans (فول), and date palms (نخيل بلحي).
  - Farmhouses: Egyptian Nile Delta rural architecture (mudbrick texture with exposed red brick pillars and timber lintels).
  - License: MIT License (Project SOLIQ original work).

---

## 5. Water Shading & PBR Materials
- **Dynamic Nile Silt Water Shader**:
  - Shader technique: Vertex displacement wave harmonics, Fresnel view reflection, depth extinction with suspended silt turbidity (#3a5a40 / #4a6741), animated surface normal perturbation.
  - Integration: Directly bound to `experience/engine.js::allocateWater` — canal water level, velocity, and soil wetness respond to Codex's simulation output.
  - License: MIT License (Project SOLIQ original work).
- **Soil Moisture PBR Material**:
  - Dry State: High roughness (0.95), pale sandy loam albedo (#8c7355), micro-crack normal perturbations.
  - Irrigated Wet State: Low roughness (0.25), dark rich saturated alluvial silt (#2d2218), specular water sheen.
  - License: MIT License (Project SOLIQ original work).

---

## 6. Procedural Audio Synthesis (Web Audio API)
- Zero external copyright audio samples. All sounds are generated procedurally in real-time via Web Audio API:
  - **Diesel Engine Thrum**: Low-frequency 4-stroke combustion synthesis using pulse oscillator, low-pass filter with resonant bump, sub-bass harmonic, and randomized mechanical jitter.
  - **Canal Water Flow**: Multi-pole bandpass filtered pink noise with dynamic turbulence modulation.
  - **Rural Ambience**: Wind through reeds (biquad filtered noise) and procedural avian whistle synthesis.
  - **Mechanical SFX**: Sluice gate metallic groan, pump valve click, tablet chime.
  - License: MIT License (Project SOLIQ original work).

---

## 7. Scientific Data & Earth Observation Context
- **NASA POWER**:
  - Data: Solar, Precipitation and Surface Meteorological Parameters (Sakha / Kafr El Sheikh station coordinates 31.08°N, 30.94°E).
  - Attribution: NASA Langley Research Center POWER Project funded through the NASA Earth Science/Applied Science Program.
  - Ethical labeling: Displayed as historical regional weather context, not real-time localized soil telemetry.
