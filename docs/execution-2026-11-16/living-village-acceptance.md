# The Seventh Field · Living-village mission slice

17 November 2026 — implementation acceptance criteria. This improves the original, intentionally stylized educational game; it does not claim GTA-scale graphics, a validated farm model or live village behavior.

| Task | Depends on | Complexity /10 | Objective and verification |
| --- | --- | --- | --- |
| GAME-LIVE-01 | Public canal release #82 | 5 | Hassan and Maryam autonomously walk short bounded, deterministic routes beside their gates. They stop for dialogue, reaction animations and reduced-motion preference. Their real-time interaction positions follow their moving roots. Unit tests for progress, bounds, pause and determinism; browser presence check. |
| GAME-LIVE-02 | GAME-LIVE-01 | 4 | A two-turn outcome appears near the top of the game panel: success or retry and the narrative consequence for both farming families, clearly labeled fictional. Includes a direct link to the separate NASA historical-weather walkthrough. E2E checks win/retry, mobile Arabic and no user-data storage. |
| GAME-LIVE-03 | GAME-LIVE-02 | 3 | While the canal mission is open, suppress the unrelated soil-probe training panel; restore it when the mission is closed. Visual and E2E check at desktop and 360px. |

Non-goals: realistic hydraulics, multi-agent navigation mesh, multiplayer, GTA branding/assets, farming prescriptions, accounts or persistence. The science engine and all existing chapters remain untouched. Preserve original 3D GLB animation/fallbacks and text-only story route.
