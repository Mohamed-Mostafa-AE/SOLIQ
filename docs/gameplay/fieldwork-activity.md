# P1-13 · Hands-on 3D fieldwork activity (prototype)

Purpose: make the existing playable Nile Delta world more than a walking-and-dialogue tour. This is an original educational interaction, not a GTA clone or a claim about any real Egyptian field.

## Acceptance loop

1. Move Nada to the amber objective by the starting path. Press E/Space on focused game canvas or tap the existing Interact button to pick up a visible soil probe. The tool attaches to Nada.
2. Move to a fictional soil patch. Interact to inspect the soil's appearance, with explicit caveat that moisture, salinity and fertility require local measurements.
3. Move to the trial bed. Interact, then choose straw surface cover or leave it bare. The 3D bed gains straw rows or stays exposed. The decision summary is bilingual and marked SIMULATED.
4. Restart the fieldwork activity in place without reloading the actual Chapter 0 mission.

Tests: `tests/fieldwork-quest.test.mjs` (pure deterministic transition cases) and `e2e/fieldwork-activity.spec.mjs` (3D proximity, tool, world meshes, screen reader state, 360px RTL, replay, no quest storage).

## Evidence and privacy

- The game's locations, trial bed and treatment outcome are **fictional/simulated**.
- No soil sensor, satellite pixel or historical farm record is used for the task.
- No numerical soil health, crop yield or water-saving percentage is invented.
- No device GPS, database, login or localStorage is read or written by the activity.
- The original deterministic canal-water solver, Chapter 0/1/2/3/4 missions, scientific walkthrough, and NASA POWER request flow remain unchanged.

## Still not shipped under this task

Full open-world physics, crowds/NPC schedules, equipment vehicles, all six playable chapters, richer cinematic animations, actual field validation, formal mobile performance audit, full no-WebGL parity for this **optional** mini activity, and a production-ready immersive art pipeline. A green CI job is required before release.
