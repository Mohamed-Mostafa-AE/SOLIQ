# Soil-IQ: 3D pitch

Open https://soliq-delta.vercel.app/pitch-3d/ . Seven slides, 16:9 on desktop, with isometric field/soil artwork, CSS 3D depth transitions, keyboard navigation, fullscreen and speaker notes. Use arrow keys or the bottom buttons; N toggles notes and F requests full screen. Honor reduced motion. The fields are conceptual illustrations, not observed imagery or predicted crop growth.

At 700px and narrower, the same seven slides switch to natural-sized vertical reading cards with a visible illustration, wrapped comparison cards, a stacked benchmark chart and two-row, minimum-44px navigation controls. The active slide is announced to screen readers; a Skip to presentation link and visible focus styles are provided. The slide counter stays at `N / 7`. This is a responsive reading layout, not a substitute for manual VoiceOver/TalkBack testing.

PowerPoint exports a seven-slide PPTX with editable text and speaker notes; its field illustrations are rendered at 2x resolution. Animation and perspective transitions are presented in the live web deck; the PPTX contains static 3D-style artwork. Print / PDF exports the full seven-slide deck using landscape print sizing.

The text records the project's implemented scope at this snapshot. Sakha values are taken from the 15 November 2026 benchmark: 316 daily NASA records through November 12, 48.14 mm precipitation, 112 days at/above 35 C, 20.32 mm analog versus 15.29 mm climatology chronological rainfall MAE. Local crop calendars and soils remain assumptions. AI retrieves reviewed guidance; free-form model generation remains provider-gated. BUC is an event venue, not an assumed affiliation or endorsement. The paper is a methods draft.

CI tests navigation, content bounds, numerical labels, mobile overflow, native PPTX slide/note counts, and PDF page count. Screenshots, PDF and PPTX are retained in the browser-test artifact. Export loads the pinned PptxGenJS 3.12.0 browser bundle; ordinary presentation navigation needs no external dependency.
