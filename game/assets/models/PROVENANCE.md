# Soil-IQ original human models — reproducible asset record

Three authored GLB 2.0 meshes are bundled for the *fictional* game characters
Nada, Hassan and Maryam. They were generated locally by the repository's
`tools/build-original-delta-characters.py` with Blender 4.3.2. No commercial
film imagery, actor likenesses, stock models, external textures, recorded audio,
motion packs, scanned humans or online asset services were used. These models
are original Soil-IQ project materials. No standalone third-party reuse license
is granted by this provenance record; contact the repository owner for any
redistribution beyond this project.

| Asset | SHA-256 | Bytes | Skin joints | Named animations |
| --- | --- | ---: | ---: | --- |
| `nada.glb` | `ec887942a4662d994264231123b9e1b196a8cf226539dcf9db99ddfab5fb0f15` | 505528 | 17 | Idle, Walk, Run, Talk, Interact |
| `hassan.glb` | `f8ddff64423a857f4c9579c94cd8ce15b5f29533da60d84063f854cd22c49bf4` | 513952 | 17 | Idle, Walk, Run, Talk, Interact |
| `maryam.glb` | `53e77bd31ddeb7fa64f7890f963d4c534237e6e4d29ed0d14ae436e8a79d7684` | 501152 | 17 | Idle, Walk, Run, Talk, Interact |

Geometry: stylized skin-weighted segmented parts with sculpted faces, clothing,
hair and authentic fictional Delta-inspired accessories, **not continuous-film
quality anatomy**, facial mocap, sampled human performances or cloth simulation.
Each GLB has an armature skin and five body animation clips; local asset fallback
remains available when WebGL or GLB loading is unavailable. Total budget is
1.52MB transferred and around 30k combined triangles in full quality.

To reproduce assets:

```sh
blender -b -noaudio --python tools/build-original-delta-characters.py
node --test game/world/character-models.test.mjs
```

Check the hash after rebuilding; the asset digest is not guaranteed stable
across different Blender exporter versions.
