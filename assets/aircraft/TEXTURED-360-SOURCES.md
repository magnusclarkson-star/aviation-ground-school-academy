# Textured Exterior 360° Aircraft — Sources and Scope

The optional Exterior 360° tab embeds creator-hosted Sketchfab models. These
models are **not** bundled, reuploaded, or substituted into the live flight
simulation, so the original training controls and cockpit layouts are unchanged.
All embeds need an internet connection and third-party access.

| Airframe tab | Hosted exterior reference | Author | Listed license |
|---|---|---|---|
| F/A-18E | https://sketchfab.com/3d-models/boeing-fa-18e-super-hornet-9e852037bf2141dcb3fda17013958131 | KOG_THORNS | CC BY |
| F-22 | https://sketchfab.com/3d-models/f22-raptor-free-2a64abf0866a405c865466c7642ca689 | NLM | CC BY |
| F-35B tab | https://sketchfab.com/3d-models/lockheed-martin-f35-lightning-ii-db911de503c74285a8d506951df786d6 | andertan | CC BY |
| Eurofighter | https://sketchfab.com/3d-models/eurofighter-typhoon-3d-b3ede3f4280f4bf99ebbd4ebc7f5480d | Chenzoss | CC BY |
| Cessna 172 | https://sketchfab.com/3d-models/free-cessna-172sp-be55bf96a63b41fdb953b6829ff0d4bf | NLM | CC BY |
| Robinson R44 | https://sketchfab.com/3d-models/robinson-r44-36e3498a5dc54d16a6d964f9b525deb8 | syarifudinirfan701 | CC BY |

**F-35B variant caveat:** The external reference is labelled as an F-35 Lightning
II family model. It has **not** been verified as a B-variant, so the app
explicitly calls it a family reference rather than falsely attributing B
specific features or STOVL geometry.

**Su-37 remains native:** No suitable exact Su-37 with verified licensing and
realistic texture quality was confirmed in this pass. A Su-35 is not the same
aircraft and is not silently relabelled as a Su-37. The existing Su-37
inspection geometry remains available.

For every hosted 3D model, the inspector shows its creator, license label and
a link back to its source. If a hosted model cannot load due to the user's
browser, connection, provider settings or later removal, this does not
affect cockpit instruments or flight training.

## Later full integration

To make skins/textures appear in the **actual flying models**, acquire proper
downloadable source rights, optimize geometry and PBR textures for mobile, map
landing gear and control surfaces, then integrate into the WebGL flight
renderer with visual device-level testing. A hosted iframe alone does not
provide native geometry/animation to the simulator.
