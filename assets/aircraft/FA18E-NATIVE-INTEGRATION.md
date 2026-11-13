# F/A-18E Super Hornet — native high-detail model import

This is the replacement path for the procedural F/A-18 in the **live
flying WebGL2 simulator**. It does not attempt to extract geometry from a
Sketchfab iframe. The existing 360° hosted model is unchanged.

## Original, licensed source

- Model: [Boeing F/A-18E Super Hornet](https://sketchfab.com/3d-models/boeing-fa-18e-super-hornet-9e852037bf2141dcb3fda17013958131)
- Author: **KOG_THORNS** / `ioai25312`
- Published licence: **Creative Commons Attribution (CC BY)**
- Listed source complexity: ~77,800 triangles and ~47,400 vertices
- Distribution: official creator-hosted download, not scraped viewer
  resources or unlicensed mirror copies

Copyright/licence acknowledgement must accompany any local adaptation.
Preserve the original download licence and attribution details when
creating the converted file. Confirm current source rights before
bundling the asset into a publicly accessible repository.

## Native asset pipeline (currently not activated)

1. Obtain the **official** model download with its textures and licence.
   An official GLB is suitable directly; a ZIP containing glTF + images
   can be imported into Blender and exported as a single glTF Binary
   (`.glb`) containing embedded base-colour textures.
2. Keep the GLB under **32 MiB** and embedded individual images under
   **4 MiB**. Downsample source textures to a maximum **2048 × 2048**
   before using them on a memory-constrained Android phone.
3. Preserve individually named aircraft nodes for **left/right aileron,
   left/right flap, left/right elevator, left/right rudder, nose gear,
   left/right main gear**. With one monolithic mesh it cannot correctly
   animate the original flying aircraft.
4. Inspect original axes in Blender. The importer takes Y or Z as the
   up-axis, a signed axis (+X, -X, +Y, -Y, +Z or -Z) as nose direction,
   and scales the aircraft to 18.31 m nominal length. Verify source
   width:length proportions before enabling.
5. Place the authorized, optimized GLB at
   `assets/aircraft/fa18e-native.glb`. Fill in the correct source
   node names, axes and original-source-space hinge pivots in
   `fa18e-native-manifest.json`.
6. Calculate its SHA-256 using `sha256sum assets/aircraft/fa18e-native.glb`
   on Linux/Mac or `Get-FileHash -Algorithm SHA256` in PowerShell.
   Copy the **64 lowercase hexadecimal characters** to the manifest's
   `sha256` field. This pins the exact inspected export; any change
   to its bytes requires a new visual/control review and new checksum.
7. Only then set `"enabled": true`. Enabling a model without the checksum
   and all eleven distinct verified control bindings is rejected.
   Run `node scripts/validate-fa18-native.js` and then the
   `Verify F-A-18E native model` GitHub Actions workflow. Preserve the
   attribution in the app and in this directory.

The browser validates the GLB's SHA-256 with the secure Web Crypto API
*before* parsing or displaying it. Mismatching or unverifiable downloads
fall back to the current single aircraft; the cockpit, flight controls
and high-detail 360° external viewer remain available.

The offline release script validates the exact same manifest and checks
file size, source geometry, the authorization checksum and all eleven
animation bindings. GitHub Actions runs it whenever Super Hornet source
files or tests are changed. If the manifest remains disabled, both
validators report that the new model has **not** been installed.

## Deployment status and safety

**Not installed:** The repository contains the importer and a
**disabled** manifest but does **not** contain the downloadable
77.8k-triangle model archive or its genuine textures. Consequently,
the flying F/A-18 still displays the previously approved dedicated
procedural model, not the new Sketchfab model. This is intentional
and should never be described as a completed high-detail replacement.

When the source file is present and verified, only the selected F/A-18
requests it; it does not slow Cessna or R44 startup. The importer checks
the GLB version, sizes, supported accessors, triangle indices, source
orientation and bounds, embedded textures, model author/licence fields
and all mapped flight control parts. It accepts no remote texture URLs,
script execution, arbitrary glTF extensions or missing control bindings.

During loading, the renderer suppresses the old procedural Super
Hornet rather than displaying it briefly beneath the incoming model.
When the asset is unavailable or invalid, the single original
procedural aircraft is restored. Interior study still uses the
existing dedicated educational cockpit, and the high-detail 360°
Sketchfab viewer remains separate.

**Remaining integration work:** Verify the actual source GLB, its
textures and node names, final aircraft orientation, pivot mapping,
nose/main gear fit, canopy transparency, device memory use and
performance on the intended Android device. Importer/regression
tests alone cannot establish the 3D model's visual authenticity.
