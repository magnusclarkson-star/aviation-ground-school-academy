# F/A-18E Super Hornet — native flight model integration contract

**Status:** The code path and validation tooling are installed, but the
actual high-detail GLB has **not** been acquired or committed. The live flight
simulator therefore retains the **working in-house Super Hornet model**.
Its existing high-detail creator-hosted **Exterior 360°** view remains intact.

## Authorised source

- Aircraft: **Boeing F/A-18E Super Hornet**, single-seat variant
- Artist: **KOG_THORNS** (@ioai25312)
- Source: https://sketchfab.com/3d-models/boeing-fa-18e-super-hornet-9e852037bf2141dcb3fda17013958131
- Published licence: **CC BY 4.0**; preserve attribution and note conversion
- https://creativecommons.org/licenses/by/4.0/
- The Academy has **not** downloaded or copied the original author's model
  using the Sketchfab embed. A creator-approved download must be obtained
  through the platform's normal authorised controls first.

The noncommercial F/A-18F models and F/A-18C *Legacy Hornet* are NOT
drop-in replacements. The F/A-18E single-seat geometry and licence matter.

## Geometry requirements

Prepare the authorised model in Blender (or equivalent) as a fully
self-contained uncompressed **glTF 2.0 .glb**. The simulator's native
flight coordinate system has **+Y up, nose toward +Z, wings toward ±X**,
and metric dimensions with approximately 13.6 m wingspan and 18.3 m length.

- Bake all object transforms before export (no per-node translation,
  rotation, scale or matrix in the resulting GLB).
- Preserve source UVs, normals and material image links.
- Use embedded PNG, JPEG or WebP base-colour textures: at least 50% of
  geometry must reference a texture. Combined images at most 4 MiB, any
  individual image at most 2 MiB; whole GLB at most 24 MiB.
- Total 4,000–120,000 triangles, ≤180,000 vertices.
- Ensure valid bounds and correct aircraft orientation before publishing.
- Use one root scene and ordinary triangle meshes; Draco/Meshopt and
  external URLs are intentionally unsupported, keeping mobile startup
  predictable and the import independently reproducible.
- Keep the cockpit and canopy within the fuselage; no duplicated older
  model shell, landing-gear circles or stray modelling markers.

## Moving-part mesh names

Separate the actual surfaces in the 3D editor; do not duplicate
placeholder geometry over them. Give each mesh node one of these exact
names:

| Control surface / assembly | Node name |
|---|---|
| Left and right flaps | `fa18e_leftFlap`, `fa18e_rightFlap` |
| Left and right ailerons | `fa18e_leftAileron`, `fa18e_rightAileron` |
| Left and right tailplanes | `fa18e_elevatorLeft`, `fa18e_elevatorRight` |
| Left and right rudders | `fa18e_rudderLeft`, `fa18e_rudderRight` |
| Nose, left and right main gear | `fa18e_noseGear`, `fa18e_mainGearLeft`, `fa18e_mainGearRight` |

On each moving node, use glTF `extras.agsaPivot` to specify its **real
hinge coordinates in the simulator's final baked coordinate system**, e.g.
`[-3.5, 0.2, -3.5]` for a left-wing hinge. The exact numbers must come
from the actual fitted source model; no guessed pivot is accepted.
One node may contain child meshes and pass its part role/pivot to them.

The existing simulator animates left/right control surfaces using its
existing flight state; gear uses the same deployment channels. Geometry
stays entirely source-defined once the valid GLB is installed.

## Install and verify (after authorised source download)

1. Prepare the source geometry and mesh labels/hinges as above.
2. From the repository root run:
   `node tools/prepare-fa18-native.js /path/to/approved-normalized-fa18e.glb`
3. The tool rejects unlicensed or inconsistent geometry and creates
   `assets/aircraft/fa18e-licensed.glb` only if validation succeeds.
   It also enables `ACTIVE=true` in `flight-sim-fa18-native.js`.
4. Verify locally with `node --test tests/flight-sim-fa18-native.test.js`,
   and check the **actual visual model** in portrait and landscape.
5. Commit both the generated GLB and the loader change, plus an attribution
   link in release documentation. The source artist must be credited.

When installed, the flight renderer lazy-loads the GLB and hides the older
procedural body during import; if loading or image decoding fails it
falls back to the previous functional Super Hornet. The separate Sketchfab
360° view is unchanged; controls and approved Cessna/R44 layouts are not
modified.

**This integration path is real code, but not proof that the downloadable
source has yet been processed or that an imported aircraft is flying live.**
