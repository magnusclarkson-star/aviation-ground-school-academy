# Moving aircraft controls and conceptual engine/rotor systems

**Status:** Educational flight-simulator visual upgrade, November 2026. All indications and aircraft behaviour are fictional and non-certified. No aircraft-specific engine, rotor, flight controls, POH, approved simulator, maintenance procedure or operating limitation is being reproduced.

## What students can now observe

In **3D outside chase view** the training aeroplane has separate rendered meshes that animate in response to the existing touchscreen, keyboard or explicitly enabled gamepad controls:

- A spinning, stylised four-arm **propeller** whose *illustrated* rotation rate follows a smoothed throttle command.
- **Left and right ailerons** deflecting in opposite directions as the yoke or joystick moves sideways.
- **Left and right elevators** changing angle as the control moves fore/aft.
- A deflecting **rudder** connected to the independent pedals.
- **Left and right wing flaps** showing the selected fictional 0°, 10°, 20° or 30° detent. These are drawn surfaces; the flight model already responds separately to the flap selector.

The helicopter's two previously static rotor meshes are now separately drawn. A **main rotor** and **tail rotor** rotate about their illustrated hubs. Conceptual collective pitch readouts change with the collective lever, while illustrative main-rotor speed is deliberately independent of collective input. This avoids teaching the incorrect idea that moving collective automatically commands rotor RPM. Tail pedal inputs affect a fictional tail-pitch indication.

The graphical outside view still shares aircraft position, pitch and bank with the existing synthetic flight indications and the 2D scenery. The 3D moving parts are a **visual explanation** of the controls rather than a new or validated aerodynamic model.

A slim **Illustrative aircraft systems** strip is visible in both 3D and 2D. It shows fictional engine-motion or rotor-speed percentage, throttle or collective command, flap detent or blade-pitch indication, and a label for the moving parts. No real RPM, manifold pressure, fuel burn, engine temperatures, flight limitations or emergency advice is invented.

## Performance and failure behaviour

Moving parts are small, reusable GPU meshes with explicit pivot points and axes. Rotation is computed from the locally generated flight time; it does not require texture assets, external JavaScript libraries, a server, real aircraft data or a network connection. The existing GPU resolution and terrain budget are unchanged.

When the WebGL2 renderer is unavailable, a phone loses its GPU context, or a learner selects **Lightweight 2D**, the already-tested Canvas 2D outside view remains functional. The system strip still shows control changes even though the lightweight 2D scenery does not render separate 3D moving parts. The original phone two-thumb flight control and rudder layout is preserved, with no account or identity collection.

## Automated verification

- `node scripts/test-flight-sim-aircraft-systems.mjs` covers engine spool and rotation over time, pause behaviour, opposite aileron movement, rudder, elevator, flap range, rotor speed remaining separate from collective, moving-part lists, and finite GPU mesh geometry.
- `node scripts/test-flight-sim-aircraft-systems-browser.mjs` verifies that on-page control inputs update engine and flap readings, helicopter readouts switch correctly, and an isolated WebGL2 chase rendering of the same helicopter state produces different GPU pixels when rotor angles change. A 390px touch-browser test with intentionally disabled WebGL2 confirms working instruments, system indications and intact 2D fallback.
- Existing checks continue to cover the synthetic flight model, takeoff, landing, wind vectors, attitude instruments, optional vibration, gamepad controls, simultaneous touchscreen steering and rudder, GPU context loss and Pages security packaging.

**Required physical acceptance:** Test on representative Android and iOS phones, with battery/heat and reduced-motion settings, and on real desktop yokes/sticks/pedals. Do not claim real flight training credit or mechanical accuracy from automated Chromium tests. A certified simulator would require aircraft-specific validated engineering, qualified instructors and regulator/device approval.
