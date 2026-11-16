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
| `nada.glb` | `58ecb10617df774aad62679cd5160ef7bfd5c31b05c42b8726dfdd390b68990e` | 506532 | 17 | Idle, Walk, Run, Talk, Interact |
| `hassan.glb` | `a85bbfa428ca8940c5e1a465ab8644785631207b18c9e6b7a66ad50aef5a3c30` | 512180 | 17 | Idle, Walk, Run, Talk, Interact |
| `maryam.glb` | `38747e91a28c22d0add982d5c3bab08101cf160f61712ad3e76845aa89b88131` | 504796 | 17 | Idle, Walk, Run, Talk, Interact |

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
