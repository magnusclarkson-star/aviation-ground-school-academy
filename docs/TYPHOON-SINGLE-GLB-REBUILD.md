# Eurofighter Typhoon — single-GLB replacement (isolated)
Status: **source selection / intake only; NOT integrated or deployed**.

The approved Robinson R44 and Cessna models must not change. The currently deployed Typhoon remains untouched until a complete replacement passes visual acceptance.

## Source choice
Use a **single complete, appropriately licensed Typhoon model** with visible provenance. Do not convert or cosmetically rebuild the existing FlightGear JSON and present that as a new model.

Candidates discovered on 2026-11-13:
- [Chenzoss — Eurofighter Typhoon 3D](https://sketchfab.com/3d-models/eurofighter-typhoon-3d-b3ede3f4280f4bf99ebbd4ebc7f5480d): CC BY, downloadable on provider; ~120k triangles before optimization. Not downloaded or qualified, requires authenticated provider download.
- [nestor_d — Ukrainian Air Force Eurofighter Typhoon](https://sketchfab.com/3d-models/ukranian-air-force-eurofighter-typhoon-a7f85b807068402cb71a691554b464b4): CC BY, ~17.5k triangles, derivative of manilov.ap original. Visual livery differs from target; verify both author attributions. Not downloaded or qualified.
- [Aviation Gazetteer — DA2 ZH588](https://airmuseums.co.uk/hangar/eurofighter-typhoon): 987 KB GLB downloadable; copyright/reuse terms **not shown**, so do not redistribute or integrate without permission. It depicts a black development aircraft with large test pods, not a production fighter.

**Exclude** the bohmerang Typhoon Sketchfab asset (CC BY-NC-SA): this Academy has a commercial model, so its noncommercial license is unsuitable.

## R44-derived acceptance gate
1. Obtain the actual downloadable GLB lawfully, record license, author, source URL, hash, and any derivative attribution.
2. Run `node scripts/inspect-typhoon-glb.mjs path/to/model.glb`; this outputs file/geometry/material/node details, not a claim of airworthiness or visual accuracy.
3. Inspect source mesh from top, front, sides and underside: Typhoon canard-delta shape, single fin, paired chin intake, two engines, rounded wheels and clean fuselage; no editor cubes, detached controls, instrument pods masquerading as production equipment, or second overlaid aircraft.
4. Only then implement R44-style asset loading: one source mesh, independent named moving parts, a consistent local origin and scale, textured native WebGL rendering in both flying view and 360°.
5. Validate cockpit boundaries and animated canards, elevons, rudder and gear. If the model is static, rig real source submeshes or reject it; **do not** mask an unsuitable source by stacking procedural parts.
6. Run mobile Android portrait/landscape checks, source integrity verification, switching/first-frame loading checks and the existing aircraft regression suite.
7. Merge only after visual acceptance. Keep previous model as rollback until the replacement is accepted.

No modifications to R44, C172, F/A-18E, F-22, F-35B or Su-37 are authorized by this work.
