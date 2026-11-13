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

## Next layer: original panel-detail bitmap

The WebGL2 native fighter renderer also generates **one 256×256 RGBA
repeatable microtexture** (256 KiB before mip levels) for subtle sealed panel
seams, fasteners and restrained grain. It is projected using each model's
**local aircraft coordinates**, including moving fighter surfaces, rather
than relying on missing or mismatched imported UV maps.

The texture is original procedural work, not copied from a photograph or the
third-party Sketchfab models. It is used on native F/A-18, F-22, F-35B,
Typhoon and Su-37 painted exterior surfaces. Interior-only inspection,
navigation lighting, wheels, landing gear, glass, Cessna and R44 are
excluded. A pale-colour gate excludes the procedural F/A-18's darker canopy
and gear wells, because those share one mesh with its fuselage.

The layer is **optional**; failure to allocate its GPU texture falls back
to the existing coloured 3D aircraft rather than disabling flight visuals.
It adds no geometry and no extra network requests.

## Fighter-only reflective material response

The in-flight WebGL2 renderer now distinguishes **painted hulls, tinted canopy
glass and exposed metallic fittings** on its native fighter models. A single
sun direction and camera-relative highlight provide restrained reflective
behaviour over the existing vertex paint and lightweight panel map. This
corrects the same flat-matte appearance across every original material;
the canopy receives a separate edge tint, while painted metal remains subtle.

Material classification uses the imported source part name, opacity and gear
hinge, instead of applying shine to everything. This protects the cockpit,
landing wheels, struts and bay doors. The F/A-18 procedural mesh uses a
separate pale-colour mask because its canopy and skin share one geometry
buffer. Both C172 and R44 retain their existing rendering and cockpits.

This is a **basic view-dependent lighting model**, not a measured
metallic/roughness PBR shader or a substitute for downloadable
high-resolution aircraft texture maps. Device-level WebGL testing is still
needed to validate appearance and frame rate.

## Super Hornet native hull refinement

The F/A-18E's native flying aircraft now has a more developed single
procedural airframe: tapered canopy/windscreen framing, flush wing-root and
LEX access panels, intake louvres, and individually detailed nozzle petal
seams. These additions use the existing airframe coordinates and **do not
layer a second old generic fighter on top**. Landing gear, active control
surfaces, cockpit modes and flight dynamics are unchanged.

The original model is still **procedural**, not the high-polygon
Sketchfab model shown in Exterior 360°. Visual and device-level checks
are still necessary before treating the native flying aircraft as a
photorealistic replacement.

## Limitations

On phones without WebGL2, the legacy 2D preview is used and does not have
the high-fidelity skin. The visual quality remains below photo-realistic
PBR textures in the externally hosted 360° models. Full native
photo-texture integration requires licensed downloadable geometry, UVs and
texture maps, mobile optimization, and real-device rendering tests.
