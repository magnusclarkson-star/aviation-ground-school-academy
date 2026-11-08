# WebGL2 3D airfield visual upgrade — acceptance and limits

**Release scope:** The Academy Immersive Flight Simulator now has a browser-local **WebGL2 3D renderer** with real GPU depth testing, 3D world geometry, camera perspective and simplified aircraft meshes. It is a **fictional recreational/educational demonstration**, not a flight-training device qualified by aviation authorities and not an aircraft-specific simulation. The original Canvas 2D scene remains available for incompatible or slow devices.

## What is genuinely 3D

- **Geometry:** A tessellated three-dimensional terrain grid rises into procedural hills away from the airfield. Runway and threshold markings, edge lights, taxiway, helipad, tree cones and trunks, shaded hangars, control tower and remote clouds are geometric triangles in world metres. They are not a 2D photograph, panorama or a fixed parallax background.
- **Perspective:** A projection/depth shader transforms world coordinates relative to the simulated aircraft. Heading, pitch, bank, position, altitude and wind-driven ground displacement affect what is drawn. The GPU uses a depth buffer for occlusion, per-face lighting and distance haze.
- **Camera modes:** **Forward pilot view** looks down the imaginary runway, matching the existing instrument and two-thumb control layout. **Outside chase view** positions a virtual camera behind and above the aircraft to show a new small, generic 3D light-plane or rotorcraft mesh while the fictional aircraft moves.
- **Continuity:** Aircraft position and simulated flight dynamics are unchanged by switching the view. Learners can switch 3D and 2D without resetting the current scenario. The outside view, glass PFD, wind readouts, practice guidance, yoke, stick, cyclic, pedals, throttle, collective and optional haptics all continue to use the existing fictional model.

There are no real-world airport coordinates, elevation models, navigation aids, physics reference data, downloads, WebGL CDN libraries, network requests or user tracking. The terrain and aircraft are generated entirely as public JavaScript data, with a bounded vertex count suitable for an introductory GPU demo.

## Compatibility and fallback

**Outside visual environment** defaults to **3D airfield — WebGL2 when available**. The renderer first requests a WebGL2 context; if unavailable, unusable, or lost, it hides the GPU canvas and displays the original continuously available 2D scene instead. The visible status announces which mode actually works. The **Lightweight 2D** setting deliberately disables 3D resources; reselecting 3D retries resource creation. The 3D chase option is disabled in 2D mode because this edition does not fabricate a 2D chase camera.

The WebGL canvas is drawn on top of an actual 2D fallback canvas; a low-frequency warm 2D update keeps the fallback ready without fully duplicating GPU and CPU work on phones. The WebGL backing resolution is capped at 960×540, and frame updates target about 30 fps. A device with insufficient graphics support may run the 2D path instead. No GPU access is required for lessons, instruments or touchscreen controls.

3D and 2D visual appearance are deliberately **different**. The old 2D mode remains the predictable choice on slow, thermally constrained or battery-sensitive phones.

## Automated checks and physical-device acceptance

- `node scripts/test-flight-sim-3d.mjs` validates nonempty, finite and mobile-bounded 3D meshes, distinct runway and helipad world geometry, airplane/helicopter chase meshes, camera transforms, and graceful handling of denied WebGL contexts.
- `node scripts/test-flight-sim-3d-browser.mjs` uses headless Chromium with software WebGL flags where possible. It inspects GPU pixel output for actual varied rendering, compares chase/cockpit pixels and moving camera perspective, confirms renderer toggling and unchanged flight phase, verifies no horizontal overflow on a 390px phone, and blocks WebGL explicitly on a second phone to test the real 2D fallback.
- The existing simulator browser checks still cover two independent simultaneous phone touches, yoke/joystick/cyclic, lift and landing, optional vibration, private controller opt-in and flight instruments. The new WebGL test is additive, not a replacement.
- **Still required on real hardware:** use a low-end Android Chrome, modern Android Chrome, and iOS Safari (where WebGL availability/performance vary). Test landscape/portrait screen, pinch/zoom accessibility, GPU lost-context recovery, switching 2D↔3D, chase camera, phone heating, battery impact, controls remaining visible and enough frame rate for smooth response. A software GPU test is not evidence that every mobile GPU can run the full renderer.

## What is not yet represented

The scene is actual 3D geometry, but it is **not photorealistic real terrain**, surveyed airport data, a commercial flight simulator engine, accurate aircraft geometry, or physically validated camera/visual-system calibration. The user-controllable fictional aircraft has no real aircraft-specific performance model, real weather, cockpit electrical system, instructor approval, navigation certification or accredited flight hours.

Potential follow-up upgrades include 3D airfield LOD for mobile, adjustable atmospheric lighting, third-person aircraft animation, better runway markings and hangar geometry, 3D map minimap, validated aerodynamic profiles, specialist control hardware and professional instructor-signed curricula. A true regulated training simulator requires a fundamentally different qualification and safety-assurance process; adding graphics alone does not close that gap.

**Do not use this app's imagined runway, winds, warnings or control responses as actual pilot instructions.**
