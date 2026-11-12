# F-22 Raptor source model attribution

This repository includes a **compact, editable geometry subset** derived from the FlightGear/FGUK F-22 model in [FGMEMBERS/F-22](https://github.com/FGMEMBERS/F-22), namely `Models/F-22.ac`.

- Original aircraft repository: https://github.com/FGMEMBERS/F-22
- Original source model at pinned revision: https://github.com/FGMEMBERS/F-22/blob/da046fba441d9fb513b981905bcee80fd61e6706/Models/F-22.ac
- Original license: GNU GPL 2.0 (see the upstream `COPYING` and the unmodified GPL license text also retained here as `R44-GPL-2.0-COPYING.txt`).
- Derived asset: `assets/aircraft/f22-fguk-exterior.json`
- Changes: selected aircraft exterior polygons/landing-gear surfaces and canopy; triangulated original quad surfaces; transformed source coordinates to +Z nose/Y up; quantized positions to 1 mm; preserved source object groups and material IDs; stripped third-party image textures; uses simplified local material shades. Independent JavaScript loader converts the editable local geometry into WebGL buffers. The entire derived mesh source is published as JSON.
- This derived geometry is provided under GPL 2.0. Preserve the GPL notice and source when redistributing it. The legal treatment of the combined app, model and distribution package requires separate review before commercial release; this attribution does not determine whether other components are derivative works.

Do **not** claim a manufacturer-authorized F-22 simulation or an accurate flight model. Source geometry is for educational visual familiarization and 360-degree viewing; jet flight physics remain fictional.

The original aircraft's model file is available at the linked upstream source. The local JSON is the editable 3D mesh source for the modified model, not a screenshot or photo. No source liveries, commercial decals, copyrighted texture atlases, sounds or military information were copied.
