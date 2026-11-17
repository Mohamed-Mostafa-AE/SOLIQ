# The Seventh Field · Chapters 5 and 6 acceptance receipt

**Scope:** PR #75 → `release/soil-iq-unified-20261116`. This is an interactive
fictional game extension, not an agronomic or NASA data claim.

## Chapter 5 — Three Canal Turns

- Only unlocks after a valid, completed Chapter 4 council pact.
- Three sequential NPC situations (Hassan / Farida / Maryam) require an action.
- Players choose fairness, ground-cover work or questions to record; results
  change deterministic **narrative counters**, with livelihood-effort trade-offs.
- Chapter 4 pledge distribution is inherited. Different choices produce
  different scene descriptions, scores and Chapter 5 ending IDs.
- No random/fabricated canal shortage, water units, yields, NASA records or
  environmental sensor readings. Replaying resets all turns.

## Chapter 6 — The Open Future

- Only unlocks after three Chapter 5 decisions are complete.
- Presents the exact three player decisions and their fictional story scores.
- Three choices produce different endings: defer real-world action until
  evidence, share a clearly fictional rehearsal, or listen to unheard voices.
- Local JSON download includes only story decisions, explicit provenance
  classifications, empty source receipts and the scientific walkthrough link.
- Earlier chapter replay deletes descendant Chapter 5/6 instances. No
  server-side story, identity or location persistence exists in these chapters.

## Verification matrix

| Check | Test / proof | State |
| --- | --- | --- |
| Deterministic choice and input validation | `game/mission/chapter5-6.test.mjs` | Node PASS locally |
| Whole Node suite | `npm test` | 289/289 PASS locally |
| Browser EN, replay and JSON download | `e2e/chapter5-6-future.spec.mjs` | GitHub Actions required |
| Arabic at 360px, keyboard and reduced motion | `e2e/chapter5-6-future.spec.mjs` | GitHub Actions required |
| Real text route 0–6 and descendant invalidation | `e2e/chapter5-6-future.spec.mjs` | GitHub Actions required |
| Babylon 0–6 and six-button mobile dock | `e2e/chapter-full-journey.spec.mjs` | GitHub Actions required |
| Browser-native DOM smoke (UI mount/actions/close) | ephemeral Happy DOM check | PASS locally |

The local container's Chromium cannot launch because its OS denies
`socket()`; this is not evidence that browser checks passed. Use exact-head
GitHub Actions reports and screenshots. Manual NVDA/VoiceOver/TalkBack and
low-power Android WebGL testing remain open.

## Not delivered by this slice

GTA-scale free-roam physics, original rigged human GLBs, measured canal flow,
real NASA EO granules, validated agronomic advice, voice/microphone AI,
durable production storage, a public release or a production deployment.
