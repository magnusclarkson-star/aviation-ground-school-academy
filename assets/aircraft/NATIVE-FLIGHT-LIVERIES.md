# Native fighter finishes used during simulated flight

This update supplements the **author-hosted textured exterior 360° viewer**
with original, locally generated, low-cost *vertex-colour liveries* for the
actual in-flight WebGL models. These are **not** copies of third-party
photographic textures, UV images, nor complete PBR material sets.

## Aircraft and surfaces

- **F-22 Raptor:** Blue-grey multi-tone faceted camouflage on genuine
  licensed GPL-2.0 FlightGear source geometry. Applied to fixed fuselage,
  wings and the animated control surfaces at aircraft-local coordinates.
- **F-35B:** More subtle low-contrast grey RAM-inspired surface variation
  on the existing GPL-3.0 F-35B hull, tail and animated panels. Does not
  affect STOVL physics, hatches, canopy or landing gear.
- **Eurofighter Typhoon:** Distinctive cool-grey aircraft-surface finish on
  genuine GPL-2.0 FlightGear geometry, preserving the original gear meshes,
  canopy and source helper-marker filter.
- **F/A-18 Super Hornet:** Muted naval-grey exterior finish on the local
  dedicated **procedural** F/A-18, with geometry, moving gear and control
  channels unchanged. The high-detail authored model remains available
  separately in the **Exterior 360°** hosted viewer.
- **Su-37:** Existing native three-tone paint from the previous upgrade;
  not modified by this pass.
- **Cessna 172 and Robinson R44:** Their already-imported GLB exteriors and
  previously approved cockpits are preserved, without any new recolouring.

## Technical method

`flight-sim-native-livery.js` computes deterministic paint for each skin
vertex from existing aircraft coordinates. Matching fixed and hinged
components use the same local coordinates. No extra texture downloads or
new triangles are needed; existing material channels for cockpit, glass,
wheels, intakes and gear are left intact. A corresponding source model
and a live WebGL2 device are still required for detailed flight visuals.

## Limitations

On phones without WebGL2, the legacy 2D preview is used and does not have
the high-fidelity skin. The visual quality remains below photo-realistic
PBR textures in the externally hosted 360° models. Full native
photo-texture integration requires licensed downloadable geometry, UVs and
texture maps, mobile optimization, and real-device rendering tests.
