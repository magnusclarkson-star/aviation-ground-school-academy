# Immersive Flight Simulator — educational acceptance and safety boundaries

**Status (8 November 2026):** publicly accessible, browser-only instructional prototype. The moving outside view uses procedural vector scenery and simplified simulated flight dynamics. **Not a qualified flight simulation training device, full flight simulator, aircraft-type model, approved ground-school lesson or safety-critical navigation instrument.**

## Learner features

- **Moving airfield scenery:** Canvas renders an imaginary 1,800 m runway with centreline/edge markings, scrolling trees, fields, hangars, lights, cloud parallax, a pitch-sensitive horizon and bank rotation. No GPS, real weather, real airfield, third-party terrain or images are downloaded.
- **Trainer yoke and aeroplane stick:** Visually distinct dual-grip wheel-type yoke and control stick, both movable with pointer/touch or arrow keys. They feed the same *fictional* fixed-wing pitch/roll model. Users may change yoke/stick without changing aircraft mode.
- **Rotorcraft cyclic:** Separate helicopter familiarisation model, aircraft-shaped cyclic, collective slider and rudder pedals. Helipad visual and conceptual lifting, hovering, translating and descent/landing checks. There are no authentic helicopter engine/rotor/transmission, autorotation, control cross-coupling or approved hover techniques.
- **Runway departure:** Start at an imaginary runway, advance throttle and explore acceleration, control input, liftoff, climb, turns and free flight.
- **Short final and landing:** A clearly labelled **Set up final approach** button *repositions* the fictional aircraft about 1.45 km from the runway. Learners adjust fictional attitude, power, flaps and alignment toward a gentle ground contact, then apply a wheel brake for rollout. This is **not** a continuous simulated airport circuit or an actual approved landing procedure.
- **Live indicators:** Airspeed in *fictional* knots, height above *fictional* ground in metres, vertical rate, heading, pitch/bank and lateral offset.
- **Touch ergonomics:** Entire control pad accepts drag, one touch owns yoke/stick/cyclic, independent second touch owns each rudder pedal, releases/cancellations centre only the released control. On narrow phones, pad and pedals share a row, and the canvas stays sticky while controls scroll beneath it.
- **Keyboard:** Arrow keys for bank/pitch, A/D for rudder, W/S for throttle/collective, space for brake, R to restart. Native range/select controls retain their own keyboard actions.
- **Motion reduction:** Canvas runs as a visual simulation, but cosmetic cloud bobbing is disabled when system reduced-motion preference is set. No sound/microphone, logins, ads or network calls are needed.

## Optional haptics and browser limitations

`flight-sim-haptics.js` requests short `navigator.vibrate()` patterns **only after the user explicitly chooses Enable vibration**. Off by default. Cues include brief control movement, rumbling on the fictional runway, turns, climb/descent, turbulence, simulated liftoff and a distinct short touchdown/impact pattern. Individual patterns total at most 200 milliseconds, with global and per-event cooldowns. Vibration stops when the feature is turned off or the page is hidden/loses focus.

Per [MDN Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) and [Navigator.vibrate()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate), this web API is not available across all browsers, requires prior user interaction, and hardware/silent-mode settings may prevent any perceptible response. The simulator **must never depend on vibration**, and it does not request actual motion-sensor access or physical force feedback. Browser API reports can be inconsistent with physical hardware response; confirm on each target Android/iOS browser directly. Avoid using vibration as a constant sustained effect.

## Acceptance criteria

### Automated unit checks

- `node scripts/test-flight-sim-model.mjs`: smooth fictional runway acceleration, rotation/liftoff, climb, roll/heading changes, free flight, short-final landing and braking, hard/off-runway outcome, rotorcraft vertical lift, cyclic translation, helipad landing, moving perspective.
- `node scripts/test-flight-sim-haptics.mjs`: opt-in default, supported/unsupported devices, vibration pattern cap, event cooldown, blocked hidden tab, stop-on-disable.
- `node scripts/test-flight-sim-browser.mjs`: desktop Canvas redraw, yoke/stick/cyclic graphics and controls, fixed-wing approach, helicopter lift/landing, opt-in pulses, 390px phone overflow, sticky visual and concurrent touch steering/rudder releases.

### Physical device checks still required

1. On an Android Chrome phone, open `flight-sim.html` on the published HTTPS GitHub Pages Academy. Check portrait and landscape, and that the outside view remains readable while using two fingers on the stick and rudder.
2. With vibration **off**, drag controls. The phone must not vibrate. Explicitly enable it, try light turbulence, runway roll and landing; feedback may be subtle and should stop immediately when disabled or navigating away.
3. Try with the phone in silent mode / Do Not Disturb and with system haptics disabled; verify that simulation remains playable without feedback.
4. On iPhone Safari, confirm layout and scenery first; do not assume `navigator.vibrate` works. The interface must disclose non-support and retain normal input.
5. On a laptop with mouse and keyboard, use both airplane control choices, rotorcraft collective and pause/reset. Verify that the final-approach button is disabled in helicopter mode.
6. Test low-end phone performance, accessibility/zoom, reduced motion, battery drain, input latency and repeated pause/resume before broader deployment.

## Regulatory boundary and future upgrades

An FAA-approved aviation training device has specific qualification/approval and use requirements; a browser visual simulation is not automatically approved. See [FAA AC 61-136B](https://www.faa.gov/regulations_policies/advisory_circulars/index.cfm/go/document.information/documentID/1034348). Actual credit depends on applicable approval and regulation for the device and operator.

Future work to pursue **only under professional oversight**: 3D terrain/airport geometry, independently validated aerodynamic and engine models, real-world control geometries from a specific authorised training aircraft, true wind/terrain/visual databases, calibrated controller hardware, approved instructor lesson plans, multi-device regression testing, performance budgets, accessibility and data/safeguarding review. A validated simulator needs more than attractive graphics or plausible controls. None of those approvals or physical-device checks are claimed here.

This prototype is for **conceptual orientation and entertainment-style aviation practice only**. It must not be used to teach a genuine aircraft-specific takeoff, landing, emergency, helicopter procedure or operational decision.


## Integrated instrument cross-check and coaching (November 2026 update)

The **same** local simulator state now drives both the forward-moving runway scene and a compact drawn flight display. The graphical attitude indicator moves its horizon with simulated pitch/bank. Companion fields show fictional heading, airspeed, height above the simulated ground, rate of climb/descent, and a lateral alignment indicator relative to the painted runway or helipad. This removes the need to switch away from moving scenery just to observe the core simulated flight indications.

The existing numeric readouts remain visible. A **Hide glass instruments** button collapses only the graphical display to free room on smaller phones; selecting **Show glass instruments** restores it. It does not change flight physics, scoring, aircraft type, or public/local-only privacy.

A new deterministic, phase-aware practice cue explains what a novice should *observe* during taxi/roll, fictional rotation, climb, free flight, short final, touchdown/rollout, and rotorcraft lift/hover. It also highlights illustrative low-energy, rapid-descent and runway-offset situations. A session-only observation strip shows elapsed time, highest simulated height and touchdown events. No observation is uploaded, graded, signed, persisted, or usable as flight-training credit.

**Display limitations:** This is not an approved PFD, certified instrument layout, aircraft-specific speed/height system, real compass, slip/skid instrument, flight director or validated aircraft model. The graphical horizon and simple coaching cues are driven by the invented model, not physics suitable for live operations. Numerical units are explicitly shown (fictional knots, metres AGL, metres per second). Any real training use would require professional review and dedicated simulator/device qualification.

CI validates that model changes correctly propagate to the outside view and instrument horizon, that scenario prompts reflect state, and that a 390px touchscreen retains working flight controls and the optional instrument layout. Physical mobile-device verification remains outstanding.

## Fictional aircraft profiles and moving wind vectors

The current simulator adds three *fictional* fixed-wing handling profiles and four synthetic wind scenarios. Airborne wind affects ground-relative movement without necessarily changing nose heading, allowing a conceptual comparison of heading versus track and airspeed versus ground speed. Ground roll does not apply wind physics; neither profile models a real aircraft. Procedural windsocks and shaded airfield buildings improve 2.5D visual depth. Read the [Airframe & Wind Exercises](AIRFRAME-WIND-EXERCISES.md) acceptance criteria before applying the software to any real student lesson.
