# Soil-IQ Acceptance Specification · 2026-11-16

All stories describe target behavior; an item listed here is **not** automatically delivered. Compare to `tasks.md` for verified implementation status.

## US-01 · Farmer-first Field Shift decision
As a farmer, I can review a proposed point, declare field and soil assumptions, load dated NASA POWER context, edit at least two crop calendars, set priorities, compare water and cover trade-offs on the same horizon, understand uncertainty, and export assumptions plus receipts. With missing evidence I see an explicit limitation rather than invented suitability or yield.

## US-02 · Real Earth observations with provenance
As a reviewer, I can distinguish NASA POWER weather from GIBS RGB browse, CMR discovery records, authenticated raw HLS/IMERG/SAR, and model-derived estimates; each available scientific output names its source, coverage, time, unit, QA and missing-reason. Live pixel analytics must have a tested raw-data path and manifest before a map claims they exist.

## US-03 · Voluntary location-inspired farm
As a player, I may choose a fictional Delta region without giving device location. If I opt into location, the point is previewed and confirmed, without automatic ownership/parcel identification. A separate plot in the *game* offers crop exploration, but the scientific app continues to operate independently.

## US-04 · A compelling, consequential game
As Nada, I meet Egyptian farmers, investigate two competing crop plans, experience choices affecting a subsequent playable scene, and observe *simulated* canal resource consequences. Chapters 1–6 require playable actions, real progress/checkpoints and an honest scientific bridge; a story outline alone is not done.

## US-05 · Human, performant 3D art
As a player, I encounter visibly original rigged human characters and a believable Delta canal scene with meaningful idle/walk/talk animation. A screenshot must show actual GLB models loaded in Babylon, recorded asset licenses, desktop and low-power phone performance. A concept JPEG or procedural cylinder is not delivery.

## US-06 · Inclusive access to the same core choices
As someone unable to hear, see or navigate 3D, I can follow captions, use a keyboard/text alternative for the relevant chapters, avoid motion effects, and get feedback from every choice. The game starts in English, with Arabic selectable, and no cue depends only on sound or color.

## US-07 · Cohesive and clear multi-surface experience
As a visitor, I can move reliably among Welcome, crop-rotation application, Research, Experience Lab, The Seventh Field, and Pitch; pages share Soil-IQ branding, readable contrast, responsive hierarchy and calibrated animation. No broken links or misleading navigation. Native Android/iOS is a separate optional product, not assumed from a mobile website.

## US-08 · Private working backend
As a consenting user, I can create a private session, store an immutable source receipt, replay a run, export and delete it. The session survives a server instance restart without allowing cross-user reads. If an external durable store is unconfigured, the API must visibly return `storage_unavailable` rather than pretend to save.

## US-09 · Controlled single-release deployment
As the owner, I can inspect an immutable preview with passing Node/NASA/Playwright checks and a route smoke matrix, then promote **one** consolidated build to the existing Soil-IQ Vercel project. A production rollback target is documented. Post-deadline code is not retroactively claimed as part of the submitted NASA archive.

## US-10 · Optional voice and assistive AI
As a player who consents to microphone use, I can use a text-first scripted companion and (when deliberately enabled and funded) speech in/out with captions and stop/pause. AI advice must be grounded to declared data, clearly cite provenance and fail closed; a text-only `/api/explain` endpoint does not satisfy this story.
