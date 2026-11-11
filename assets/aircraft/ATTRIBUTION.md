# Cessna 172 imported 3D model attribution

**Asset:** `assets/aircraft/c172-e737-optimized.glb`

**Original model:** [“Cessna 172” by e737](https://sketchfab.com/3d-models/cessna-172-64cddaee5aff470682659a8c08525046), published on Sketchfab.

**Original license:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). This permits commercial reuse and adaptation with attribution.

**Optimized source:** [gods-eye-view, public/models/c172.glb](https://github.com/bilawalsidhu/gods-eye-view/blob/main/public/models/c172.glb), and its [model license and provenance table](https://github.com/bilawalsidhu/gods-eye-view/blob/main/public/models/README.md).

**Upstream adaptation:** Gods Eye View simplified geometry/materials, resized textures to WebP, baked the orientation and metres scale, and centred the source model. Those are modifications made by the upstream repository and acknowledged here.

**Academy adaptation:** Loaded and drawn as indexed glTF geometry; the original −X nose axis is transformed to the Academy's +Z aircraft axis. Materials and base-colour images are preserved; the model is not asserted to be an OEM-certified Cessna 172 representation.

**No endorsement:** Neither the original creator nor the upstream repository is affiliated with or endorses Aviation Ground School Academy.

**Other aircraft:** The R44 and five fighter silhouettes are still procedural until a separately licensed model is integrated and visually accepted. Do not describe them as replaced by this C172 upgrade.

---

## Robinson R44 Raven II — imported MIT-licensed model

**Asset:** `assets/aircraft/r44-molen-raven-ii.glb`.

**Original model and author:** Bendyline LLC (© 2026), from the **Molen** original polygonal aircraft collection.

**Source:** [Robinson R44 Raven II source bundle](https://github.com/bendyline/molen/tree/main/content/entities/source/aircraft/robinson-r44), distributed in the public [Molen asset release](https://github.com/bendyline/molen/releases/tag/assets-52148fd49fe80b1d) as `entities-models-part-001.tar.gz`.

**License:** [MIT License](https://github.com/bendyline/molen/blob/main/LICENSE). Full license text and original copyright notice are reproduced in `MOLEN-LICENSE.txt`.

**Academy adaptation:** The geometry is loaded as indexed glTF 2.0 with KHR mesh quantization, a ground-height origin offset, animated main/tail rotor node groups, and WebGL PNG materials. The original glTF binary is preserved, without model geometry alterations.

**Accuracy limitation:** Molen explicitly identifies its R44 as a visual prototype needing further review. It is an original, approximate polygonal interpretation, not Robinson Helicopter Company CAD or a manufacturer-approved model. Do not imply manufacturer approval or certification.

**No endorsement:** Bendyline LLC and Robinson Helicopter Company have no endorsement of or affiliation with Aviation Ground School Academy.

---

## Cessna 172S Skyhawk — source cockpit/exterior GLB

**Asset:** `assets/aircraft/c172-molen-skyhawk.glb` (1,781,260 bytes), SHA-256 `e02327dfc596a864f4fff5b24cb49dbf4b840278174f462ca3278d685e9e6fff`.

**Original model/author:** © 2026 Bendyline LLC, Molen original polygonal aircraft. glTF includes 538 nodes, 121 mesh definitions, 17 images, 29 materials, source-built cabin, NAV III panel, and hinged wing controls.

**Source:** [Cessna 172S source bundle](https://github.com/bendyline/molen/tree/main/content/entities/source/aircraft/cessna-172s) in [Molen assets release](https://github.com/bendyline/molen/releases/tag/assets-52148fd49fe80b1d), `entities-models-part-001.tar.gz`.

**License:** MIT; preserve `MOLEN-LICENSE.txt` and this attribution in distributions.

**Limits:** Original approximate 3D model, not manufacturer-issued or certified. The model depicts the C172S NAV III/G1000 panel; round gauges remain a separate training UI option. Existing lightweight C172 GLB remains a fallback on unsupported phones.
