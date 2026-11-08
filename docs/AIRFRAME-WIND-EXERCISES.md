# Fictional airframe responses and wind-drift learning exercises

**Status:** educational prototype in the public Immersive Flight Simulator. These are **three invented aircraft-response presets**, not replicas of Cessna, Piper, Diamond, Robinson, Airbus, or any other actual aircraft. The airspeeds, takeoff thresholds, handling rates, wind responses, flight instruments and touchdown conditions are **not** published operating limits, simulator qualification data or instructional procedures.

## Learner experience

From the [Immersive Flight Simulator](../flight-sim.html), use **Fictional airframe response** to compare how a stable beginner trainer, a more responsive sport trainer and a steadier touring trainer respond to the same controls. All three retain the same generic yoke/stick visual options. The helicopter cyclic remains a separate highly simplified rotorcraft model and does not adopt a fixed-wing preset.

The **Illustrative wind environment** selector offers **Calm**, **Left crosswind**, **Headwind**, and **Gusty crosswind**. A new telemetry row shows *indicated fictional airspeed*, *fictional ground speed*, *nose heading*, *ground track*, and the chosen wind label so learners can observe their differences. In the simplified model, wind adds to ground-relative motion **only after an aircraft is airborne**; the wheels' runway roll deliberately remains unchanged. No takeoff-performance calculations, real atmosphere, runway friction, weather briefing, or coordinated crosswind landing technique is modelled.

Selecting an aircraft response or wind scenario resets the current fictional departure/approach (and its practice observation timer). The user can compare the same starting conditions without carrying a previous flight's position and momentum into an unrelated configuration. Flight input from an explicitly enabled USB/Bluetooth gamepad or from on-screen controls is preserved in the existing modes; a scenario reset releases held input for predictability.

### Illustrated conditions and scenery

- **Calm:** nose heading and ground track coincide if no simulated turning is commanded.
- **Left crosswind:** after simulated liftoff or on short final, the imaginary aircraft drifts right over the ground without a change in its nose heading. It is a vector illustration, not a flight-control technique.
- **Headwind:** fictional ground speed falls below fictional airspeed while the aircraft is travelling along the runway axis in the air. The selected headwind does not affect the takeoff roll or stall characteristics.
- **Gusty crosswind:** the ground-relative vector varies smoothly and deterministically over simulated time, not from any actual forecast or random meteorological model.
- The local Canvas airfield has additional shaded buildings and procedural windsocks that respond to the fictitious wind vector. They improve **depth cues** but this remains a 2.5D perspective-rendered scene, not surveyed photorealistic terrain or a validated 3D airport environment.

### Instructional boundaries

The training cues explain what to observe in the *fictional* airspeed/ground-speed and heading/track readings. The low-energy alert threshold follows the selected **invented** profile's simulated threshold. It is not a real aircraft's stall warning or safety system. A "completed" fictional landing is not proficiency, safety, loggable training time, regulatory approval or instructor endorsement.

No GPS, real aircraft telemetry, student records, location services, private API, profile account, weather network, microphone or cloud data is read or transmitted. This is a browser-local educational animation.

## Verification and limitations

- `scripts/test-flight-sim-environment.mjs` checks all three presets, distinct control responses, four wind vectors, deterministic gusts, airborne crosswind drift, headwind ground-speed differences, helicopter wind drift, and course-related display cues.
- `scripts/test-flight-sim-environment-browser.mjs` checks the actual published UI structure in desktop and simulated 390px touchscreen Chromium: switching presets, resetting scenarios, reading ground track and ground speed, wind labels, crosswind drift, changing to rotorcraft, and no horizontal overflow.
- Existing simulator unit/browser suites continue to exercise runway takeoff, final approach, helicopter lift, phone dual-touch control, synthetic PFD, opt-in vibration, and optional Gamepad API controls.
- **Not yet verified on physical phones or an actual flight-controller setup.** The software must be tested with the specific Android/iOS browsers, controllers and device capabilities that learners will use. It may require further performance and accessibility improvements.

Future aviation-grade work would need professionally validated aerodynamic models, aircraft-specific flight manual and performance data, realistic crosswind ground handling, wind shear, calibrated controls, qualified instructors, surveyed environment assets, and regulatory simulator approval before any recognition as flight training. These cannot be inferred from the present demonstrations.
