# Experimental lift, drag and energy model — optional Academy exercise

**Status:** Unvalidated conceptual teaching model; November 8, 2026. It is deliberately not a real-aircraft flight model, flight training device, qualified simulator, aeronautical performance calculator, safety system, or substitute for an instructor.

## What changes

The [Immersive Flight Simulator](../flight-sim.html) retains its original **Classic · guided flight practice** mode as the default. Under **Flight-dynamics teaching model**, choosing **Experimental · lift, drag and energy** starts a fresh fictional aeroplane exercise with an independent simplified point-mass calculation.

The aircraft is still an *imaginary* trainer. The three airframe options (Basic, Sport and Touring) have fabricated mass, wing area, thrust, lift-curve, drag and wing-angle thresholds for teaching differences. None are type-specific and none come from an actual aircraft flight manual or approved simulator dataset.

Experimental mode introduces:

- **Angle of attack (AoA):** illustrated angle between the aircraft's nose and an estimated flight-path direction plus a fictional wing-incidence offset. It does not include detailed airflow, body-axis dynamics, sideslip or actual aerodynamic tables.
- **Lift and drag:** synthetic dynamic pressure, invented wing area and lift/drag coefficients, optional flap contributions, and a deliberately simplified reduced-lift/excess-drag region beyond the illustrated stall angle.
- **Bank-dependent lift:** the vertical component of lift decreases as the wing banks, while a simple coordinated heading-rate approximation is used. There is no slip/skid coordination, aerodynamic roll damping, cross-control stall, spin, ground effect, propwash or detailed aircraft inertia.
- **Energy and acceleration:** a point-mass vertical-rate/flight-path approximation, gravity along the path, simplified thrust-versus-drag acceleration, synthetic engine response lag, and kinetic-plus-potential specific energy in J/kg.
- **Wind:** the same fictional calm/crosswind/headwind/gust scenarios continue to affect airborne *ground track*, separate from indicated airspeed. The ground roll uses a deliberately simplified fixed runway-friction model.
- **Flight events:** conceptual takeoff, climb, banked turns, approach, stall/low-energy cue, ground contact, hard-contact halt and braking/rollout. These follow the experimental model and are not valid operating procedures.

A temporary **Experimental wing energy** panel appears with AoA, lift in kN, drag in kN, illustrative load factor in g, flight-path angle and specific energy. The panel remains available when the user hides the main PFD or their device falls back from 3D to 2D. It vanishes completely when the learner selects Classic mode or the conceptual helicopter.

The helicopter *always uses the existing conceptual collective/cyclic model*; this flight-dynamics upgrade does not pretend to simulate authentic rotorcraft aerodynamics. The existing synthetic propeller/engine-motion strip reflects the same delayed engine command when experimental mode is enabled.

## Starting a lesson

1. Open the **Immersive Flight Simulator**.
2. Choose **Trainer yoke** or **Aeroplane stick**. Leave **Classic** selected for familiar practice and reliable beginner demonstrations.
3. Select **Experimental · lift, drag and energy** to start a new runway departure or short-final scenario. It will reset your current fictional flight.
4. Set throttle and flap detents and observe how simulated pitch, airspeed, energy, lift and drag vary. On short final, compare the descent-rate and runway alignment with the imaginary force readings.
5. Use **Pause simulation**, **Reset**, **Lightweight 2D**, and **Hide glass instruments** as needed. USB/Bluetooth controller input and opt-in phone vibration remain separate features.

## Testing and safeguarding

- `scripts/test-flight-sim-aerodynamics.mjs` checks that Classic mode remains the default, the rotorcraft remains on its separate model, coefficients change with AoA/flaps, a deep model stall loses lift, synthetic energy is bounded, three profiles are deterministic, headwind/crosswind affect ground track, conceptual takeoff/braking/contact work, and the experimental engine reading matches the model.
- `scripts/test-flight-sim-aerodynamics-browser.mjs` checks a desktop and 390px simulated phone: mode selection, forced reset, live force/energy values, flap/engine updates, wind drift, pause, hiding PFD, switching to rotorcraft, 2D fallback and no horizontal overflow.
- Existing simulator/browser and Academy checks remain mandatory, including private backend exclusion from GitHub Pages.

**Known limitations:** These invented coefficients do not capture a real wing's lift/drag polars, density-altitude effects, real stall/spin behaviour, wind shear, slip, ground friction, engine/propeller maps, weight and balance, energy calibration, qualified manoeuvres, aircraft-specific emergency procedures, or instrument validation. Successful in-app takeoff or touchdown does not indicate the student can fly. Results are not persisted or counted toward qualification or training credit.

**Remaining acceptance:** Physical Android and iPhone testing, actual joystick/pedal testing, performance/thermal and accessibility assessment, and independent instructor/subject-matter-expert review. All synthetic warnings and lesson text need expert verification before use in a formal aviation curriculum.

## Fictional loading and centre-of-gravity study

An additional loading panel accompanies the experimental fixed-wing model with four invented station masses, mass moments, CG expressed as a percent of imaginary mean aerodynamic chord, and conceptual wing loading. The chosen loadout affects the experimental mass, acceleration and bounded pitch sensitivity. This is never a real aircraft weight-and-balance calculation, and it has no approved aircraft limits. See [Fictional Weight and Balance Lab](FICTIONAL-WEIGHT-BALANCE-LAB.md) for exact scope, safeguards and test coverage.
