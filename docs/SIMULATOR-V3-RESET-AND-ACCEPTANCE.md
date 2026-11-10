# Flight Simulator V3 — technical reset and acceptance gate

**Audit baseline:** `main` at commit `11786d62f2753dbade755d7a55a62c69c6d56ca8` (10 November 2026). This document records observed code facts and a proposed plan. It does **not** certify the current app as complete or assert physical-phone validation.

## Decision

**Preserve the Academy and current live GitHub Pages app. Stop stacking more procedural airframe patches on the imported aircraft.** Develop a separate V3 aircraft-rendering spike, first with the Cessna 172, while leaving the published V2 available. Promote only after visual evidence, functional flight tests, and real Android acceptance.

The web app is the delivery path for now; no need to discard existing lessons, instructor audio, instruments, state or ATC. Investigate Three.js scene graph + glTF first, and compare Babylon.js only if the spike cannot meet requirements. These engines have actual scene/parent-child transforms; that is the missing structure in the hand-written renderer. Engine selection remains provisional until tested on the target phone.

## Findings grounded in the repository

| Area | Observed baseline | Risk / decision |
| --- | --- | --- |
| Flight model | `flight-sim-model.js` labels its aircraft performance as simplified with invented teaching settings | Keep deterministic teaching exercises, but do not treat this as validated C172/R44 dynamics |
| 3D renderer | `flight-sim-3d.js` contains a bespoke WebGL2 mesh, shader, texture, hinge, camera and scene renderer | Aircraft pivots, cabins and source meshes use separately authored coordinates; repeated alignment regressions are unsurprising |
| Aircraft import | `flight-sim-real-airframes.js` parses an imported C172 GLB; `flight-sim-real-r44.js` parses FlightGear R44 AC3D | No authoritative common rig, named cockpit/seat/rotor anchors or normalized asset pipeline |
| Aircraft attachments | `buildImportedCabin`, `buildImportedC172Shell` and moving rotors are hand-built inside the 3D renderer | Geometry/layout corrections can create new holes, duplicates or cockpit misalignment |
| Asset packaging | `scripts/build-pages.mjs` copies specific aircraft files to the published site | Keep explicit package verification; a green Pages run does not prove a model is viewed on the user's phone |
| Desktop visual test | `scripts/test-flight-sim-real-airframes-browser.mjs` renders at 1200×900 and saves WebGL screenshots | It can pass while aircraft placement, livery or phone-specific composition are wrong |
| Existing mobile checks | Inspection browser tests emulate 390×844 with WebGL2 deliberately disabled to test 2D fallback | Necessary fallback coverage; insufficient proof of the **imported 3D aircraft on a narrow Android layout** |
| Deployment | GitHub Pages deploys a static web app; the repository has no root `package.json` | Keep V2 static. The new V3 engine needs a reproducible pinned build/bundle, tested separately |
| Licensing | Bundled C172 model has CC BY 4.0 attribution; bundled FlightGear R44 material is marked GPL-2.0 | Review attribution, compatible source redistribution and commercial distribution implications *before* shipping a proprietary app |

## First screenshot review — 10 November 2026

The new emulated Android visual run produced actual imported-model screenshots in portrait and landscape, not merely console logs: [GitHub Actions imported-airframe previews](https://github.com/magnusclarkson-star/aviation-ground-school-academy/actions/runs/42916708215). Both aircraft loaded, rendered and passed mechanical pixel checks.

**Human review of those screenshot artifacts still finds visual problems:**
- **R44:** the bright-yellow outline is more coherent than the early placeholder, but the cabin details are not convincingly visible and the tail/rotor geometry is still rudimentary. **Not visually accepted.**
- **C172:** the airplane is recognizable, but the cabin is too indistinct to confirm correct seating, and body/tail/wing appearance remains inconsistent. **Not visually accepted.**
- Both desktop and emulated Android screenshots show aircraft, but **do not demonstrate a capable phone app**. Real-device performance and control handling remain unverified.

This is why the new screenshot gate is evidence for review, **not** an automatic declaration that the aircraft looks right. These defects should be addressed in the isolated V3 model/scene-graph build, not with additional shader colour masks on V2.

## V3 C172 scene-graph milestone — not yet visually accepted

The experimental `flight-sim-v3-preview.html` is a **separate Three.js scene-graph proof**. Its named C172 body, transparent cabin window geometry, four seats, panel, controls, wheel system and one propeller all live under one aircraft root; moving flaps, ailerons, elevator and rudder rotate around child groups. Its source-GLB comparison toggles between models instead of rendering them simultaneously. The V2 flight simulator is unchanged.

An emulated 390px portrait / 844px landscape Chromium browser now tests the preview on WebGL2 and checks child transforms, touch orbit, GLB comparison, phone-sized canvas and screenshot artifacts. Those automated checks do not demonstrate flight dynamics or actual device support.

**Manual screenshot review result:** the new scene structure is correctly separated and movable, but the hand-modelled fuselage, wings, seats and dashboard are **too simplified to approve as a realistic C172**. The 3D viewer is suitable for demonstrating rig architecture, not for becoming the default aircraft. **Do not merge V3 into V2 until a genuinely detailed and appropriately licensed aircraft asset has been selected and verified.** An engine change by itself does not supply high-fidelity geometry.

### Potential model upgrade, pending licensing and technical review

- The existing e737 Sketchfab C172 GLB is CC BY 4.0 with attribution, but is largely an exterior model with a sparse interior and unsegmented control surfaces.
- FlightGear's detailed C172P project includes exterior and interior geometry ([c172p-team/c172p](https://github.com/c172p-team/c172p)); its source is GPL-2.0. A converted `c172.glb` is separately offered by [The Flight Playbook credits](https://theflightplaybook.com/credits/), under that same GPL license. This is a model **candidate**, not an approved or redistributed asset. Review exact copyright, original source, modification/redistribution obligations, file composition, performance and seats/control-surface hierarchy before any inclusion, especially for a commercial academy.
- Prefer one coherent model containing cockpit and external parts to a sequence of overlays and approximate coordinate guesses.

## Non-negotiable completion gates

1. **One aircraft, one source of truth:** a GLB with correctly named child meshes (`body`, `seat-front-left`, `seat-front-right`, `seat-rear-left`, `seat-rear-right`, `panel`, `propeller`, `left-flap`, `right-flap`, `left-aileron`, `right-aileron`, `elevator`, `rudder`). Source-space units, axes and attachment pivots documented. No duplicate procedural airframe overlays.
2. **Visual proof:** front, left, right, rear, overhead and cockpit/close-up images at phone portrait and landscape sizes. Human review verifies silhouette, cabin location, control surfaces, doors/windows, material colour and propeller/rotors. A screenshot existing, or a coloured-pixel count, **does not** count as visual approval.
3. **Cessna function:** from standstill, taxi/lineup, takeoff, departure, base/downwind/final, approach, flare, touchdown, rollout and restart all possible without teleporting. Yoke, rudder, throttle, brakes and flaps respond through real touchscreen controls; no sudden reset. Existing deterministic tests are only the initial gate.
4. **Robinson function:** genuine-looking two-bladed main and tail rotors attached to their actual shafts, four correctly positioned seats, correct instrument panel, cyclic/collective/pedals and controllable hover/translation/landing. No procedural tailbooms or duplicate hardware on the imported model.
5. **Android evidence:** Chrome on the TECNO Camon 30, portrait and landscape, 3D and 2D fallback, 360° orbit, one- and two-thumb controls, expanded instruments, sound initiation and pause/resume. Measure input responsiveness and sustained frame rate rather than assuming headless Chromium equals hardware.
6. **No-regression gate:** preserve the Academy and all V2 routes; test published asset paths, frozen baseline, aircraft selection, end-to-end circuit, hover mission, and screenshots. A browser test alone cannot authorize claims of real-aircraft fidelity.

## Sequence and scope control

### Phase A — Baseline and visual evidence (this PR)
- Freeze the current `main` reference as the fallback/rollback build.
- Add headless Chromium **mobile-viewport 3D** screenshots for imported C172/R44 (the previous imported-model test was desktop only), with portrait/landscape and model-source assertions.
- Store screenshots as GitHub Actions artifacts for review. Keep a separate physical-device acceptance checklist.
- Do **not** change production airframe appearance while establishing evidence.

### Phase B — Isolated C172 render-system spike
- Build an experimental page/module independent of `flight-sim-3d.js`, using pinned Three.js and `GLTFLoader` (or evaluate Babylon.js if necessary).
- Convert or replace source assets to a clean GLB hierarchy with named subassemblies, material colours, pivot/orientation conventions, seats and panel placed in the aircraft model. Do not use shader masks to simulate cabin cutouts.
- Render actual canopy/glass transparency, instrument panel, seated cabin, propeller and control surfaces from a single node graph.
- Compare mobile screenshots of the V2 and spike **side by side**; decide on engine and performance only after testing.

### Phase C — Complete the C172 flying lesson
- Bind V3 render objects to the existing flight state without changing the flight model initially.
- Complete controls and a continuous circuit. Calibrate the teaching flight dynamics separately; document that they are not validated aircraft performance.
- Obtain approval from a genuine Android run before promoting to the default app.

### Phase D — R44 and broader release
- Use an equally clean, correctly licensed hierarchy for the R44 with parented rotors, swash/collective if faithfully modeled, skids, cabins and instruments.
- Only then carry other aircraft, scenery and extra features across. Avoid adding new models until C172 + R44 are demonstrably sound.

## Reporting standard

Every proposed completion report must state separately: **implemented in branch**, **tests passed**, **visually reviewed in browser**, **deployed**, **verified on user's actual phone**. Never collapse these five claims into “completed”. If a gate is unverified, say so and leave it open.

## Physical-phone sign-off sheet (unverified until the device is checked)

- [ ] C172 exterior front, side, rear, top: no duplicate wings/flaps/elevators or propeller
- [ ] C172 interior seats and panel located in cabin under front roof; correct colour
- [ ] C172 full circuit without a forced teleport or unplanned reset
- [ ] R44 tailboom clean, no procedural cover patches, correct main and tail rotors
- [ ] R44 seats and panel genuinely visible at correct cabin stations
- [ ] Portrait and landscape: usable controls while instruments are visible
- [ ] Touch interaction, 360° orbit, pinch zoom and instrument expansion
- [ ] Sound and optional vibration behave as expected on the phone
- [ ] Sustained performance, heat and responsiveness acceptable on actual device

**Current sign-off:** None of the above physical-device items has been independently verified in this audit.
