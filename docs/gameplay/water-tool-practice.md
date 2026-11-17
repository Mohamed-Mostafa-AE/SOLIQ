# Optional water-can practice · 2026-11-17

## Player loop

From the existing Seventh Field 3D world, find the turquoise practice watering can near the village pump. Walk near it and press `E` (or tap Interact). Nada now visibly carries it. Visit the amber-ringed practice planter and interact again. Choose one of two actions:

1. **Illustrate watering**: seven lightweight, animated turquoise droplets appear over the planter. This is a fictional visual exercise, **not** a calibrated quantity of water, an irrigation recommendation, or plant-response data.
2. **Wait for evidence**: no droplets appear and the panel explains why soil observations, crop needs and an agreed canal schedule are still missing.

Replay removes the drops, unequips the can and restores the first in-world interactable. The activity uses English-first labels, Arabic RTL copy, native buttons, screen-reader status text, 360px layout and reduced-motion freezing. It does not read GPS, save browser/backend data, or call the scientific water solver.

## Verification

- Pure state-machine Node tests for order, invalid actions, two outcomes and replay.
- Babylon 9.35 `NullEngine` test: real mesh instantiation, equipped-parent state, seven simulated droplets, frozen animation in reduced motion and replay reset.
- Playwright tests (CI browser required) for pickup by physical proximity, choice rendering, no scientific ledger mutation, Arabic 360px deferral and one real browser screenshot: `test-results/seventh-field-carried-water-can-and-practice.png`.
- The primary product remains the evidence-first crop rotation comparison and NASA provenance interface. The no-WebGL story route remains available for the core choices; this side activity is an optional spatial illustration.

## Known limitations

The watering can and effects are stylized procedural meshes without cinematic animation, realistic soil hydraulics or manual assistive-technology testing. All outcomes are explicitly fictional, not independent field validation or advice. No dedicated mobile-device FPS measurements have been collected for this side activity.
