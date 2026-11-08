# Fictional weight-and-balance learning lab — acceptance and limitations

**Status:** Experimental educational demonstration, November 2026. All station positions, weights, CG reference percentages, wing sizes, reference mass bands, and stability effects are invented. **Do not use these values to load, dispatch, operate or assess any actual aircraft.** Not a manufacturer weight-and-balance chart, type-specific envelope, certified training model, or replacement for an instructor.

## Student experience

Open the [Immersive Flight Simulator](../flight-sim.html), select a fixed-wing yoke/stick, and choose **Experimental · lift, drag and energy**. A **Fictional weight & balance lab** appears below the teaching-model selector. Classic flight mode and conceptual helicopter handling remain unchanged; the loading controls are not shown in those modes.

The learner can vary four *imaginary* stations: front occupant (45–120 kg), rear occupant (0–130 kg), rear baggage (0–80 kg), and imaginary fuel (15–90 kg), in 5 kg increments. The original invented aircraft empty weight remains fixed for each of the three fictional aircraft profiles. No fuel burns off during this lesson.

The panel displays four calculated quantities:

- **Total mass:** Sum of invented empty weight and station masses. The default loadout is deliberately chosen to equal the pre-existing experimental profile masses (840, 700 or 1,170 kg), preserving the previous scenario as the reference.
- **Mass moment:** Sum of each component's mass multiplied by its fictitious arm relative to a fictitious datum, in kg·m.
- **Centre of gravity (% of imaginary mean aerodynamic chord):** Total mass moment / total mass, converted to percentage along an **invented** 1.30 m chord beginning at a fictional 1.45 m datum arm.
- **Wing loading:** The new mass divided by the **invented** wing area for that profile, in kg/m².

The green band (30–55% of this **fictional** chord) is a comparison illustration, **not a real manufacturer's permitted CG envelope**. A caution appears for CG outside that band or total mass beyond an arbitrary profile reference mass. This demonstrates how location and amount of loading change the summary. The words *inside the imaginary band* must never be interpreted as a safe loading approval. All cues explain this distinction.

While dragging a slider, the learner sees a **preview only**. **Releasing the slider commits the new loadout and restarts** the current runway or approach scenario deterministically. That prevents instantaneous mass/CG changes in an airborne aircraft. Changing airframe profile still restarts the exercise and recalculates its fictional mass and balance.

## Flight-model connection

The loading calculations affect only the optional **experimental** model:
- **Mass and weight:** The synthetic force sample uses the new total mass to calculate weight, load factor and acceleration. Given similar wing lift, a heavier load can reduce vertical support and change the motion response.
- **Pitch responsiveness:** The CG position applies a modest bounded gain to the invented pitch-control target (roughly 0.76–1.34). Moving mass aft can make the fictional model more sensitive to the same yoke movement. This is **not a real stability derivative**, does not simulate trim/elevator hinge moments and must not be used to predict aircraft controllability.
- **Existing airspeed/height, simulated PFD, flight guidance, optional vibration, 3D chase view, animated wing controls, GPU/2D fallback, USB/Bluetooth controller and mobile two-thumb controls** continue to use the same experimental flight state.

There is no genuine aircraft specific POH, equipment list, arm table, centre-of-gravity envelope, fuel specific gravity, burn sequence, gear retraction, moving occupants, atmospheric density variation, spin dynamics, true airframe structure, or approved weight-and-balance calculation.

## Verification

- `node scripts/test-flight-sim-loading.mjs`: validates each station's allowed mass and increments, total mass, moment, CG arithmetic, imaginary band warnings, input immutability, three fictional profiles, aft/forward mass relocation at equal gross weight, heavier wing loading and load factor, and altered experimental pitch responsiveness. It verifies that **Classic** and **helicopter** models ignore this loading model entirely.
- `node scripts/test-flight-sim-loading-browser.mjs`: tests desktop and 390 px mobile screen, Classic/default isolation, live sliders and preview, deterministic reset-on-release, user-facing mass/CG/wing loading, warnings outside the imaginary band, selecting different aircraft, helicopter switch, 2D fallback and no horizontal overflow.
- The full Academy integrity and existing simulator browser suites remain required for merging, including GPU loss fallback, simultaneous phone thumb controls, optional haptics, controller opt-in and synthetic instrument consistency.
- **Physical device acceptance not yet performed:** Verify actual Android Chrome, iOS Safari, external gamepad/yoke/pedals, landscape/portrait use, thermal performance and accessibility. Consult aviation subject matter experts before presenting this as part of an independently reviewed course.

Nothing from this exercise is saved to the student's private learning record, transmitted to a server, or treated as a verified grade or loggable flight time.
