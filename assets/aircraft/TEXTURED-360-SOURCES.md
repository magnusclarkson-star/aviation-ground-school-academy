# Textured Exterior 360° Aircraft — Sources and Scope

The optional F/A-18E, F-22 and F-35 Exterior 360° views embed creator-hosted Sketchfab models. These
models are **not** bundled, reuploaded, or substituted into the live flight
simulation, so the original training controls and cockpit layouts are unchanged.
All embeds need an internet connection and third-party access.

| Airframe tab | Hosted exterior reference | Author | Listed license |
|---|---|---|---|
| F/A-18E | https://sketchfab.com/3d-models/boeing-fa-18e-super-hornet-9e852037bf2141dcb3fda17013958131 | KOG_THORNS | CC BY |
| F-22 | https://sketchfab.com/3d-models/f22-raptor-free-2a64abf0866a405c865466c7642ca689 | NLM | CC BY |
| F-35B tab | https://sketchfab.com/3d-models/lockheed-martin-f35-lightning-ii-db911de503c74285a8d506951df786d6 | andertan | CC BY |
| Eurofighter Typhoon | Local source airframe, also used during flight | IAHM-COL / EF-Typhoon | GPL-2.0 |
| Cessna 172 | Approved local Academy native model | Academy flight simulator | No third-party 360 embed |
| Robinson R44 | Approved local Academy native model | Academy flight simulator | No third-party 360 embed |

**Typhoon underside correction:** The former externally hosted Typhoon reference had an inaccurate belly, so the 360° inspector now renders the locally imported FlightGear Typhoon airframe. Its original mesh includes paired rectangular ventral intakes, separate main-gear bays/doors and the lower twin-engine body. Users can rotate and zoom the same aircraft shape seen in flight. The procedural fallback draws a divided chin intake instead of a generic belly slab. This preserves the genuine source model and avoids stacking a second airframe on top. Source: https://github.com/IAHM-COL/EF-Typhoon/blob/827020be8072fc348deb7cb94f1e9f2f9105a0e9/Models/EF-Typhoon.ac

**F-35B variant caveat:** The external reference is labelled as an F-35 Lightning
II family model. It has **not** been verified as a B-variant, so the app
explicitly calls it a family reference rather than falsely attributing B
specific features or STOVL geometry.

**Su-37 native camouflage upgrade:** An exact Su-37 with suitable
verified free-use licence and high-quality exterior textures remains
unavailable in this pass. To avoid substituting a Su-35 for a Su-37, the
existing GPL-2.0-or-later FlightGear Su-37 source mesh now uses native
tri-tone upper-surface camouflage **in both the local 360° viewer and live
flight model** whenever WebGL2 successfully loads its mesh.

This is lightweight per-vertex procedural paint (continuous between aircraft
components), **not** photographic/PBR texturing. Landing gear, canopy
glazing and source controls are preserved.

Source: https://github.com/FGMEMBERS/SU-37/blob/936d565cded05ea0c0f26f99f8878b18156bce09/Models/SU-37-005-125h.ac

For every hosted 3D model, the inspector shows its creator, license label and
a link back to its source. If a hosted model cannot load due to the user's
browser, connection, provider settings or later removal, this does not
affect cockpit instruments or flight training.

## Native flight model materials

Separate from the three hosted fighter 360° embeds, the local in-flight
renderer now uses original deterministic vertex-colour finishes for F/A-18,
F-22, F-35B and Typhoon as well as the previously upgraded Su-37. These
are **native** WebGL2 aircraft paints and do not copy or pretend to embed
the third-party hosted textures in the flight scene. See
[Native Fighter Liveries](NATIVE-FLIGHT-LIVERIES.md) for implementation
details and source-licensing boundaries.

## Later full integration

To make skins/textures appear in the **actual flying models**, acquire proper
downloadable source rights, optimize geometry and PBR textures for mobile, map
landing gear and control surfaces, then integrate into the WebGL flight
renderer with visual device-level testing. A hosted iframe alone does not
provide native geometry/animation to the simulator.
