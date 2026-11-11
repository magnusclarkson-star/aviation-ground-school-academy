# Aviation Ground School Academy — V1 Prototype

A standalone, responsive aviation ground school learning app. This project is **separate from Salone One**.

## Branding

Selected logo: blue-and-gold aircraft, open book and graduation cap, with *Learn by Doing* tagline. A compact embedded web icon is loaded by `academy-brand.js` across academy pages.

## Run

Open `index.html` in a modern browser. No server, database, installation, API keys, or Codespaces are required for this demo.

## Included

- Eight training pathways and 32 introductory lessons
- Student progress stored in browser `localStorage`
- Ten-question scored practice exam with explanations
- Interactive instrument-display demonstration
- Instructor syllabus dashboard and administrator launch-readiness preview
- Local learner profile with role labels (not authentication)
- Responsive desktop and mobile layout

## Important limitations

This is a functional **front-end prototype**, not a complete aviation training platform. It does not implement secure accounts, real instructor/admin permissions, database persistence, verified certificates, payments, accredited syllabus approval, aircraft-accurate simulation, or deployment. Lessons are introductory outlines and must be expanded and reviewed by qualified aviation instructors. Do not use it as an operational flight reference.

## Suggested production roadmap

1. Create an independent repository and deploy the static demo over HTTPS.
2. Add backend, PostgreSQL, secure authentication, role-based access control and instructor-managed content.
3. Expand lessons into approved, jurisdiction-specific curricula with references, diagrams, assignments and versioning.
4. Add question banks, randomised exams, attempts, analytics, certificates and audit trails.
5. Build validated training simulations, offline/PWA support, accessibility testing and mobile distribution.


## Version 1.1: two learning pathways

On first launch, students choose **Scouts & Air Scouts** or **Aviation Enthusiasts & Pilots**. The choice is saved on the device and can be changed on the dashboard. Both pathways currently share the same introductory lessons, but prioritise different course sequences. Scout safeguarding, age-appropriate accounts, instructor vetting, guardian consent, and youth privacy controls must be implemented before any real youth enrolment.

## Fundraising concept

A future transparent revenue model can offer paid adult courses, institutional subscriptions, sponsored learning and voluntary contributions. The prototype does not collect payments or claim charitable status or official organisational endorsement. Any donations, revenue allocations, branding and endorsements require documented approval from the relevant organisations.


## V1.2 Community prototype
Open `community.html` or select Community Hub from the academy. Includes local draft posts, spotlight frequency preferences, and a sample sponsored placement. No live uploads, public feed, subscriptions, or moderation backend exists.


## Version 1.3 — Global membership and community business prototype

Open `global.html` for the responsive international membership prototype. Features: country/pathway selection; illustrative regional USD subscription previews for monthly, quarterly and annual cycles; owner-editable local price tiers; Scout-support profit-allocation calculator; local-only community post drafts and review queue; optional welcome spotlight; example sponsorship placement; instructor webinar concepts; safeguarding checklist; exportable local configuration.

**No real payments, international exchange rates, recurring subscriptions, user authentication, uploads, remote community posts, verified moderation or ad network are implemented.** Image selection checks file type and size but deliberately does not persist or transmit image bytes. Do not store real child data or sensitive records in this prototype.

### Production architecture recommendation

- Independent app repository; Next.js or equivalent responsive client, API service, PostgreSQL, managed object storage and CDN.
- Server-side identity with verified adult/instructor/admin roles, parent/guardian workflows and strong authorisation.
- Country-specific price book, billing-country verification, explicit taxes, subscription state machine, webhook signature verification and idempotent ledger. Payment provider eligibility and merchant onboarding must be verified.
- Media upload through short-lived signed URLs, virus/type scanning, EXIF stripping, moderation, consent records and takedown procedures.
- Community groups with strict youth/adult separation, reporting, rate limits, audit logs and safe notifications.
- Sponsorship inventory with clear labels, consent/privacy controls and no targeted ads to minors.
- Financial reporting that separates revenue, refunds, costs, tax, profit, earmarked donations and actual remittances.
- Qualified aviation subject-matter review and jurisdiction-specific syllabus mapping before claiming formal training accreditation.


## Version 1.4 — Study Lab
Open `study-lab.html` for 24 introductory questions across six aviation topics, practice/exam modes, shuffled question sessions, explanations, browser-local result history, and CSV export. This is not a regulatory exam bank or certified training content. No account, network or payment is required.


## V1.5 — Instrument Studio and Graduation Celebration
Open `instrument-studio.html` for six interactive SVG gauges, adjustable flight parameters, guided challenges, optional browser speech synthesis, and a local private graduation celebration card with optional personal photo. The gauges are educational approximations, not certified instruments. The celebration is not an accredited certificate. No photo is uploaded. Speech support depends on the browser/device.

## Version 1.7 — Flight Dynamics Lab
Open `flight-dynamics.html` for an interactive aircraft schematic with animated ailerons, elevator, and rudder; individually selectable attitude, heading, vertical speed, airspeed and altitude instruments; narrated explanations; and practical challenges. The aircraft and instrument relationships are illustrative, not physically validated. Glossy hero art is generated illustrative imagery. All data remains local.

## Version 1.8 — Interactive Aircraft Explorer
Open `aircraft-explorer.html` for three aircraft views, individually movable control surfaces, correlated illustrative instrument indications, narrated control descriptions and five hands-on challenges. This is a simplified educational model, not a flight-dynamics simulator.


## V2.1 Aircraft Learning Paths
Open `aircraft-learning-paths.html` for one-control-at-a-time interactive demonstrations for fixed-wing aircraft, civilian helicopter (R44 conceptual lessons), and generic military aircraft. Touch/drag the control handle or use keyboard/buttons. Instruments are read-only. These are simplified conceptual demonstrations, not aircraft-specific flight models.


## Version 2.2 — Focused Flight Lab
Open `focused-flight-lab.html` for one-control-at-a-time lessons for fixed-wing, Robinson R44 concepts and generic military aviation. Touch control surfaces only, not instrument readouts. Includes demonstration, practice, test, narration and keyboard/button alternatives. Aircraft visuals and indications remain schematic and educational; not a type-approved trainer. The academy home navigation has been consolidated to remove overlapping fixed links on small screens.

## V2.3 Guided Practical Lab
Open `guided-practical-lab.html` for separate fixed-wing, R44 conceptual and general military aviation lessons. Each lesson has a draggable visual control, read-only gauge, correlated illustrative aircraft response, narrated explanation, quiz and browser-local progress. No remote services or live account features. Aircraft response is conceptual, not a validated simulator.

## Instructor Studio curriculum expansion — November 2026

The [AI Instructor Studio](ai-instructor.html) includes eight **introductory, unreviewed** guided lessons: the four forces, instruments, flight controls, flaps, weather, radio, aircraft anatomy and preflight safety. Each has three learning objectives, a fictional practice activity, a versioned draft label, boundaries on operational use and an official FAA reference pointer. The [curriculum review worksheet](curriculum-review.html) can export local **unsigned draft** feedback for a qualified aviation reviewer to consider; it cannot approve lessons, authenticate instructors or confer training credit. See [Curriculum Review Governance](docs/CURRICULUM-REVIEW-GOVERNANCE.md).

## Device-only module checkpoints — November 2026

The public [Ground-School Module Practice](ground-school-modules.html) page groups the eight curated instructor lessons into four conceptual modules with 24 short self-check questions and two introductory pathway orders (Scouts/Air Scouts or aviation enthusiasts/aspiring pilots). Practice outcomes may be kept in the learner's browser, cleared or exported as **unverified** JSON. No secure student records, qualified instructor review, approved examination, certification, or credit are created. See [Module Practice Acceptance](docs/MODULE-PRACTICE-ACCEPTANCE.md).

## Immersive Airfield Flight Simulator — November 2026

[Immersive Flight Simulator](flight-sim.html) is a new phone/desktop **fictional teaching simulation** with local animated forward scenery (runway, fields, trees, clouds, hills, helipad), visually differentiated dual-handled **yoke**, **aeroplane stick** and **helicopter cyclic**, plus throttle, collective, flap selector, held wheel brake and independent rudder pedals. It supports conceptual runway takeoff, climbing and turns, a separate *repositioned* short-final landing exercise, and conceptual rotorcraft lift/helipad landing. Optional short phone-vibration cues are off by default, bounded, rate-limited and unavailable in some browsers. The public page requires no credentials or provider API and never requests real GPS.

This is **not** an accurate aircraft-specific simulator, a certified aviation training device, real-world flight instruction, a recognised pilot training credit, or tested on physical Android/iOS devices. See [Immersive Flight Simulator Acceptance](docs/IMMERSIVE-FLIGHT-SIMULATOR.md). Test it alongside the existing [Cockpit V3 instruments](cockpit-v3.html) and [Ground-School Modules](ground-school-modules.html).


### Integrated simulated glass instruments and learning cues

The [Immersive Simulator](flight-sim.html) now displays its **own** compact synthetic glass instrument panel alongside the moving outside scene. Pitch, bank, heading, airspeed, ground-relative height, vertical trend and lateral runway/helipad offset update from the same fictional flight state as the scenery. A small deterministic teaching prompt and session-only observations support takeoff, turn, approach/landing and rotorcraft familiarisation. Students can hide/show the graphical attitude indicator on smaller phones without losing the numeric indications. No official flight training, endorsement, record or certificate is implied. See [Simulator limitations and acceptance](docs/IMMERSIVE-FLIGHT-SIMULATOR.md).

### Optional USB/Bluetooth joystick and gamepad support

The [Immersive Simulator](flight-sim.html) now has an **opt-in browser gamepad input panel** with configurable pitch/bank/rudder axes, power/collective controls, deadzone, limited neutral calibration and a live input display. Gamepad access is **disabled until a learner explicitly enables it**, and it can be disabled immediately. An active disconnection pauses simulated flight and releases held commands. Touchscreen/keyboard overrides remain usable; no device IDs, calibration history or telemetry are saved or sent. Supported browsers and physical hardware vary widely: see [Hardware Controller Acceptance](docs/HARDWARE-CONTROLLER-ACCEPTANCE.md). No professional flight-control certification is implied.

### Fictional trainer profiles and wind comparison

The [Immersive Simulator](flight-sim.html) now supports three **invented** fixed-wing response presets (stable trainer, responsive sport trainer and steady touring trainer) and four **illustrative** wind choices. A new telemetry strip distinguishes fictional airspeed from ground speed and nose heading from ground track; a procedurally animated windsock and shaded synthetic airfield buildings add depth to the outside view. The helicopter remains its own conceptual model. Changing presets restarts the fictional scenario. **These are not validated aircraft models or real crosswind performance limits.** See [Aircraft Response & Wind Exercises](docs/AIRFRAME-WIND-EXERCISES.md).

### WebGL2 3D airfield and chase camera

The [Immersive Flight Simulator](flight-sim.html) now offers a **real browser WebGL2 3D world**: three-dimensional terrain/hills, runway/helipad geometry, trees, hangars, clouds and simple chase-view airplane/helicopter meshes, with depth testing and perspective changes from the same local aircraft state as the controls and instruments. A forward pilot view or outside chase camera can be selected in 3D. **Unsupported browsers safely use the original 2D scene**, which can also be selected deliberately to reduce graphics load. No external scenery/3D engine, GPS or private Academy API is required. This is not a validated aircraft model or a certified training device. See [3D Airfield Acceptance and Safety](docs/WEBGL3D-AIRFIELD-ACCEPTANCE.md).

### Animated control surfaces, propeller and rotors (November 2026)

The [Immersive Simulator](flight-sim.html) now animates its own **3D propeller, opposing ailerons, elevators, rudder and wing flaps** from the existing yoke, joystick, rudder pedals and flap selector. The **helicopter main and tail rotors** now animate in chase view. A compact illustrative engine/rotor and control-surface strip remains available even when 2D fallback scenery is used. All outputs are fictional and do not reproduce real aircraft mechanical systems. [Acceptance and limitations](docs/ANIMATED-AIRCRAFT-SYSTEMS.md).

### Optional experimental aerodynamics and energy lab

The [Immersive Simulator](flight-sim.html) now has an optional **Experimental · lift, drag and energy** teaching model for the fictional fixed-wing trainer. It preserves **Classic** as the default, and does not change the conceptual helicopter. Experimental mode offers invented aerodynamic coefficients, angle-of-attack, simulated lift/drag and bank loading, fictional engine lag, flight-path/energy indications and stall cues. It is **not** validated aircraft flight physics or an accredited flight simulator. [Read experimental aerodynamics and acceptance notes](docs/EXPERIMENTAL-AERODYNAMICS.md).

### Fictional weight-and-balance and centre-of-gravity lab

The [Immersive Flight Simulator](flight-sim.html) now includes a browser-only interactive **fictional weight & balance lab** when **Experimental · lift, drag and energy** is selected. Adjust imaginary front/rear occupants, baggage and fuel to see calculated total mass, moment, CG percentage and wing loading. In the experimental model only, mass affects forces/acceleration and CG modestly changes fictional pitch responsiveness. Changing a slider resets the active exercise after release; **Classic** and helicopter modes remain unchanged. The coloured CG reference band is **invented, not a safe/approved loading envelope**. See the [loading acceptance notes](docs/FICTIONAL-WEIGHT-BALANCE-LAB.md).

### Guided conceptual exercises — instructor review pending

The [Immersive Simulator](flight-sim.html) now has four **locally computed, ungraded conceptual self-checks** in Experimental mode: shifting a load aft, increasing wing loading, reducing imaginary fuel and comparing invented flap lift/drag coefficients. Each exercise uses the real fictional loadout and physics code, records a Reference and Comparison within the current browser page, and checks an explanation only after both observations. Manually changing load or flaps clears stale observations. All prompts are clearly labelled **`SME_REVIEW_REQUIRED`**; this is not instructor approval, grading or training credit. See [SME Review & Curriculum Checklist](docs/SIMULATOR-EXERCISE-SME-REVIEW.md).

### Optional narrated guidance for simulator self-checks

The [Immersive Flight Simulator](flight-sim.html) now adds **opt-in device speech** to the four existing weight-and-balance and lift/drag concept exercises. Air Scouts/beginners and pilot enthusiasts can hear the scripted objectives, comparison evidence and ungraded explanatory feedback at an adjustable rate. Speech remains off until a learner presses a button, stops on exercise changes, and disables gracefully if a browser has no speech synthesis. This is **not connected to a generative AI instructor or a certified aviation teaching service**, and all content remains `SME_REVIEW_REQUIRED`. See [Spoken Instructor Acceptance and Privacy](docs/SIMULATOR-SPOKEN-INSTRUCTOR.md).

### Flight-practice debrief (review pending)

After a fictional [Immersive Simulator](flight-sim.html) session, open the [Flight Practice Debrief](simulator-debrief.html). Choose a Scout/Air Scout or aspiring-pilot pathway and one of five practice scenarios; inspect a tailored observation question, record instrument comparisons, identify uncertainty and choose a next conceptual practice goal. The page is mobile-responsive, requires no login and offers an unsigned JSON export **only on explicit request**. It never reads live simulator telemetry, stores answers automatically, uploads data, records grades or authenticates instructors. Learners should not enter personal or sensitive details. The prompts remain **SME_REVIEW_REQUIRED** and grant no training credit. This is separate from the four pre-existing model-backed guided exercises.

### Optional device-only simulated flight trace (review pending)

The immersive simulator now offers an opt-in **Start private recording** control. When enabled, a bounded, approximately once-per-simulated-second recorder captures fictional speed, height, heading, pitch/bank, vertical trend, horizontal offset, phases and selected control commands. Nothing is recorded before the learner opts in. Stop, clear and unsigned local JSON download are available. Resetting practice or changing aircraft clears the old trace; closing the page discards it. A hard ceiling of 600 samples prevents an indefinitely growing browser memory record. **This trace is not transferred automatically to the debrief and is not imported or graded by it.** It contains no name, location, account, real-world telemetry, flight credit or verified instructor result. SME_REVIEW_REQUIRED still applies. The synthetic data must never be interpreted as real flight performance. Contract tests: node --test tests/simulator-private-recorder.test.cjs tests/simulator-debrief-handoff.test.cjs. Browser and real-device testing remains pending.

### Local replay of synthetic flight-trace observations (review pending)

After an opt-in recording ends, **View recorded flight** displays a canvas chart of fictional height (m), airspeed (kt) and bank angle (degrees), each with its own vertical scale. A labelled keyboard-accessible slider selects any sampled moment, with a plain-text description for assistive technology. Replay is disabled during recording and is cleared when the session is reset. It does not control the simulated aircraft, stream telemetry, award credits, or claim real pilot competence. It is a visualisation of the existing bounded, in-memory private trace, not a 3D aircraft flight-path animation. Automated test source: `tests/simulator-replay.test.cjs`. Full Node/CI browser tests, physical phone verification, and qualified aviation subject-matter review remain pending.

### After-flight private learning summary (review pending)

The opt-in simulator recorder can now generate an **ungraded, device-only after-action learning summary** once at least two synthetic samples have been recorded and recording has stopped. The summary reports observed fictional height/airspeed/bank/vertical-rate ranges, sampled flight phases, and open-ended questions tailored to runway, approach, bank and conceptual helicopter demonstrations. It uses static, transparent rules from `flight-sim-after-action.js` rather than a generative AI service or validated flight assessment. It does not infer pilot competence, award credits, measure real aircraft operating limits, or transmit student information. Output stays in the browser page and is discarded when the recorder is reset. A dedicated `Private Flight Practice Checks` GitHub Actions workflow runs syntax checks and the independent recorder/replay/debrief/after-action test suites. Review and physical mobile-device verification remain required before release.

### Playback controls and manual debrief trace inspection (review pending)

A learner who explicitly recorded synthetic flight samples can now use **Play recorded samples**, **Pause replay** and a keyboard/touch slider to inspect the time-series plots. Playback is stopped by default, advances at approximately one recorded sample per second while the page is active, pauses when the page is hidden, and never moves the simulated aircraft. The debrief link from the recording passes only an allowlisted exercise category in the URL, not the trace data.

The separate **Flight Practice Debrief** page offers an optional manual JSON file picker. Learners must choose their locally downloaded synthetic trace; input is restricted to 512 KB, the expected fictional trace schema, and 2–600 samples. Only an allowlisted set of numerical/phase observations is used for a local, ungraded reflection summary; extra keys such as identity or location are stripped. Imported information is not added to the unsigned written debrief export, and Clear or Clear everything discards the imported summary from the open page. The page does not upload or automatically save the selected data. This is not operational aviation guidance, verified assessment, instructor approval, accreditation or training credit. Qualified SME review and physical device testing are required.

### Guided questions at a selected replay moment (pending instructor review)

The immersive simulator now shows a **What can you learn from this recorded moment?** panel inside the local flight replay. Learners can select Scouts/Air Scouts or aviation enthusiasts/aspiring pilots and compare actual recorded *fictional* values with the previous sample, including phase changes. The question changes with the selected sample and learner pathway. This transparent, fixed-rule feature does not call an AI service or assess skill, grades, training credit or aircraft operating limits; prompts remain **SME_REVIEW_REQUIRED**. Its tests run in the private-learning CI and the mobile Chromium replay smoke test.

**Published-app viewing links (main branch):** [Academy home](https://magnusclarkson-star.github.io/aviation-ground-school-academy/) and [immersive simulator](https://magnusclarkson-star.github.io/aviation-ground-school-academy/flight-sim.html). Changes proposed in PR #22 are not visible on Pages until merged, deployed and verified.

### Bird's-eye fictional flight track — November 2026

The opt-in recorder now also captures the synthetic simulator's forward X/Z coordinate (`forwardM` for local Z alongside the existing `lateralM` for local X). When playback is opened, a new **Bird's-eye synthetic flight path** canvas plots local relative movement, start/end positions, and the selected replay moment. It uses no GPS, external map tiles, geolocation or network requests. **This is not a geographic map, surveyed airfield, validated aircraft path, real pilot assessment or flight training credit.** Older recordings without forward position are handled as unavailable, not reconstructed. Existing debrief import remains separately learner controlled. New path tests and mobile visual acceptance checks run in the private-learning workflow; qualified instructor review and physical-device testing remain required.

### Replay aircraft heading marker and phase explanations (2026-11-08)

The optional fictional flight-path replay now draws a small aircraft-shaped glyph at the selected recorded position. Its nose rotates using the **recorded synthetic heading**, where 0° points toward the simulator's positive-forward local Z direction (top of the bird's-eye view). The glyph advances as the replay slider/playback changes samples; it does not move or alter the live simulation. Missing/invalid headings gracefully fall back to a dot, and legacy traces without synthetic forward position show an unavailable message.

Beside the path, an accessible text description now states the selected synthetic heading and explains the recorded phase (runway roll, climb, free flight, approach, rollout, conceptual helicopter lift/hover, etc.). It is rule-based reflection, **not** real-world aircraft navigation, operational instruction, validated aircraft dynamics, grading, or accredited training. Browser and regression checks run through GitHub Actions; qualified instructor review and testing on physical phones remain necessary.

Published-viewing URLs: https://magnusclarkson-star.github.io/aviation-ground-school-academy/ and https://magnusclarkson-star.github.io/aviation-ground-school-academy/flight-sim.html .

### Optional scenery light: daytime / warm evening / illustrated dusk

The immersive flight simulator offers an **Illustrated outside lighting** selector (Daylight, Warm evening, Dusk). It changes the Canvas 2D sky/hills/field palette and WebGL2 sky/fog/terrain illumination; the 2D backdrop receives a subtle overlay for warm and dim scenes. It is user-controlled, remains local to the current page, and does **not** affect flight physics, airspeed/attitude/heading displays, control layout, recorded flight data, device vibration, camera position or accessibility of the instrument panel. WebGL2 continues to fall back to the 2D airfield if unavailable. The default remains Daylight.

These are **artistic lighting presets**, not measured times of day, night-flying lessons, meteorological visibility simulation, operational safety limits or accredited pilot instruction. Tests include module privacy/invariance checks and a Chromium phone viewport that compares daylight/evening/dusk 2D pixels and optional WebGL2 sky pixels.

**App preview:** https://magnusclarkson-star.github.io/aviation-ground-school-academy/ and https://magnusclarkson-star.github.io/aviation-ground-school-academy/flight-sim.html . Changes on a feature branch are not live until merged and GitHub Pages deployment succeeds.

### Fictional aircraft sounds and tower–pilot radio (2026-11-08)

The simulator includes a clearly opt-in **Aircraft sounds & pilot–tower conversations** panel. The engine control starts a small, bounded Web Audio oscillator model only after a user click. Airplane pitch responds to synthetic engine power; a fictional helicopter uses a lower, rotor-like rhythmic tone. The sound is stopped on pause, aircraft change, scenario reset, hidden tabs and page closure; volume is adjustable, and radio narration briefly ducks the engine level. This is **not** a validated engine sound recording, audio simulation of a particular aircraft or precise rotor-frequency model. There are no audio files, network requests, microphone or audio uploads.

**Before departure**, **During flight**, **After landing** and **Play complete exchange** show device-only scripted Academy Tower/Student Pilot dialogues, with separate rotorcraft and fixed-wing examples and a runway-approach alternative. Speech uses the browser's built-in speech synthesis (English voice availability varies) only after button activation; the full written transcript remains accessible without synthesized voice. The roles use alternate voice pitches and different available device voices where possible. The audio is fictional classroom material, not real ATC, current phraseology training, a frequency, real traffic separation, operational clearance, a certified instructor or flight credit. The separate AI-instructor scripted narration stops when radio starts and vice versa.

Automated checks include Node privacy/behavior tests, a mobile Chromium opt-in audio and dialogue test, and the existing simulator and Academy site workflows. **Physical Android/iOS sound and browser tests and an aviation subject-matter expert review remain required.**

**Academy preview:** https://magnusclarkson-star.github.io/aviation-ground-school-academy/ 
**Simulator preview:** https://magnusclarkson-star.github.io/aviation-ground-school-academy/flight-sim.html

### More textured engine sound and consent-based phase radio (2026-11-08)

The immersive practice simulator now offers a **Gentle** or **Detailed** fictional engine/rotor tone, powered by low-level browser Web Audio oscillators. The default is Gentle, and neither setting affects flight physics or aircraft performance. Learners must explicitly click **Enable engine sound** and can disable it at any time. The sound stops on pause, reset, hidden tab, or aircraft type change.

The Academy Tower/Student Pilot script now has an **Enable phase-linked radio** button, off by default. When deliberately armed, it presents the **before** transcript on the runway/helipad, the **during** transcript when the fictional state first becomes climb/flight/approach/lift/hover, and the **after** transcript on rollout/landed/complete. Each stage is presented at most once per armed session. Speech synthesis is attempted only when available, but mobile browsers may refuse to start voices without a fresh gesture on a phase transition; in that case, the written transcript remains visible. Turning the feature off, manually selecting dialogue, changing mode, resetting, pausing, hiding or leaving the page disarms phase-linked speech.

A separate **Enable radio cue tone** button, also off by default, creates a tiny 100 ms synthetic chirp when a scripted exchange begins. It does not process the OS speech voices, play genuine radio static or connect to an ATC radio frequency. It opens a local Web Audio context only after a user click, closes on disable/page hide, and requests no microphone access.

These are fictional demonstrations of *the idea* of aviation communications, not approved ATC phraseology, actual flight clearances, a real training flight, certified aircraft performance, human instructor assessment, air-traffic service or flight-hour credit. Qualified aviation subject-matter review and testing on real Android/iOS phones are still required. The phone-browser test and Node regression suite are run in GitHub Actions.

Viewing links (live main only after merge and Pages deployment): https://magnusclarkson-star.github.io/aviation-ground-school-academy/ and https://magnusclarkson-star.github.io/aviation-ground-school-academy/flight-sim.html .

### Phone sound and vibration troubleshooting — Tecno Camon 30 / Android (2026-11-08)

The immersive flight simulator now shows a small **Sound & vibration while flying** bar immediately under the outside view. The new button **Start engine sound + vibration** deliberately activates the sound engine and (where supported) short flight haptics together. Both features remain off until the learner taps it. The **Stop both** button turns both off. The bar also offers direct **Test speaker** and **Test vibration** buttons so a learner can distinguish browser/device problems from the fictional aircraft model.

The speaker test produces one brief ~0.29-second locally synthesized tone after a click. The engine sound has a more audible but bounded default output with a 58% in-app volume setting; it remains subordinate to the physical phone's Media volume. If browser audio is suspended, the app reports a problem instead of silently claiming playback.

Flight vibration cues are still optional, no longer consist mainly of nearly imperceptible 9–13 ms pulses, and are limited to **200 ms or less per request**, including a deliberate ~195 ms test pattern. Optional *Noticeable* (default) or *Gentle* cue strength is available. New rate-limited background cues can be requested while the fictional aircraft accelerates along the runway or flies through synthetic turbulence. Vibration tests do **not** enable automatic in-flight haptics by themselves. Browsers may accept a request without the physical vibration motor engaging, and some browsers do not support `navigator.vibrate`.

**Exact learner checks:** (1) Open https://magnusclarkson-star.github.io/aviation-ground-school-academy/flight-sim.html directly in a current Android Chrome browser tab, not an embedded in-app viewer. (2) Raise the phone's **Media volume**, and ensure sound can be heard from another website or app. (3) Tap **Test speaker**. (4) Turn on vibration for touch/calls/system feedback in Android settings, disable Do Not Disturb if appropriate, and tap **Test vibration**. (5) Tap **Start engine sound + vibration**, increase the fictional aircraft throttle and fly; you should at least see the new status messages even if the handset suppresses output. (6) Use **Stop both** to mute and disarm. No special microphone permission is needed.

This is **not** a claim that audio/vibration was physically verified on a Tecno Camon 30; testing in actual Chrome/HiOS hardware is still needed. Audio is a conceptual synthesizer, and haptics do not simulate physical flight forces. All enhancements remain silent and opt-in by default, local to the device, bounded and without microphone or network calls. The simulator is not a certified flight-training device.

### Android phone still silent: alternate audio test and browser diagnostics (2026-11-08)

If **Test speaker** and **Test vibration** produce no perceptible response on a phone (reported on a Tecno Camon 30), the simulator now offers a separate **Try backup sound** button. It generates approximately one second of two-frequency PCM WAV entirely within the browser and starts an HTML audio element on a direct user click. This tests a different device audio path from the existing short Web Audio oscillator. It does not download or stream any file, access the microphone, or record the speaker. It cannot override phone Media volume, an in-app browser, Android sound-focus controls or device restrictions. If it remains silent, opening the Academy URL directly in **Chrome for Android**, increasing **Media volume** and testing a known audible video/music app are the next appropriate steps.

Under **Browser & device diagnostics**, the page now reports browser secure context, whether it is inside a frame, Web Audio and HTML Audio availability, vibration API availability and last request result, engine context state, and whether the page is visible. The report explicitly states that it cannot measure whether the speaker or vibration motor physically worked, nor read OS volume settings. It does not include phone identifiers, user-agent string, location, personal details, recordings or accounts. The learner may select or copy the report to share for troubleshooting; the app does not upload it.

Mobile-browser and unit tests verify fallback playback consent, the self-contained WAV header/length, restricted-browser error handling, diagnostic visibility, privacy and continued opt-in behavior. **Successful browser checks do not validate the actual Tecno Camon 30 speaker or vibration motor.** The Vibration API can be unavailable in an embedded page or browser; after an explicit request it may report acceptance without physical vibration. Production-quality native haptics may require a separately packaged Android app instead of the website.

Published simulator URL: https://magnusclarkson-star.github.io/aviation-ground-school-academy/flight-sim.html . The above features appear after merge and GitHub Pages deployment.

### Full Flight Experience: audible by default after one start tap (2026-11-08)

After a student confirmed that the backup WAV test and engine sound were audible on their phone, the public simulator's phone experience was simplified around one **START FLIGHT WITH ALL EFFECTS** button placed *before* the cockpit. This is intentionally unmissable on both desktop and phones. Its action starts all available effects together after a direct user gesture: locally synthesized engine sound, supported short in-flight vibration cues, phase-linked fictional student-pilot/tower conversation and the small radio keying tone. **100% in-app volume**, **Detailed engine**, and **Noticeable vibration** are preselected; all remain adjustable. The original audio-lab controls remain available for individual adjustments and accessibility.

Because browsers restrict sound autoplay and vibration before user interaction, these effects are *prepared*, not actually producing audio on initial page load. A single click is still required; showing an on state before a browser has accepted it would mislead students. The engine sound remains internally bounded, but students should lower their physical **Media volume** before their first start if necessary. The airfield, flight physics, weather, instruments and touch controls do not change. If the learner already started full mode, changing aircraft, selecting another exercise or resuming from pause attempts to restore the full profile using that later direct button gesture. **Stop ALL effects** turns off engine, vibration, radio speech and radio cue. Background tabs remain silent.

Browsers may accept vibration requests while never moving the physical motor. Some Android browsers may block scripted speech despite a user tap; the written fictional ATC transcript is always available. The simulator is an educational prototype, not an accredited trainer or a source of operational ATC procedures. Tests include phone/desktop consent, volume/texture defaults, complete activation, speaker fallback, radio and haptic stop, and restored effects after resume.

Live simulator: https://magnusclarkson-star.github.io/aviation-ground-school-academy/flight-sim.html (new features require merge and GitHub Pages deployment).

### Fictional airport scenery and movement detail (2026-11-08)

The immersive simulator's previously flat-looking airfield has a richer **shared 2D / WebGL2 fictional airport environment**. New locally generated features include curved taxiway segments with centreline stripes, a marked apron, two aircraft-shaped stationary parked trainers, two ground-service vehicle silhouettes, short synthetic approach-light fixtures, ramp light poles and a decorative hold-line marker. The runway and airport landmarks now share the same local synthetic X/Z coordinates in the 2D canvas and 3D geometry; forward movement, turns, climbs and approach change the apparent positions of the landmarks through projection.

The module `flight-sim-airport-detail.js` contains only frozen static fictitious coordinates. It fetches no real airports, GPS, imagery, aeronautical chart data, real airport signage, live ATC, navigation aids or textures. Markings are **illustrative and not operationally accurate or for real-world navigation**. Parked aircraft and vehicles are decorative and stationary rather than live traffic or collision obstacles. The 3D scenes remain within the established phone geometry budget with the same WebGL2-to-2D fallback. Flight controls, instruments, one-tap full sensory profile, haptics, engine audio, recording and replay are unchanged.

The Academy CI adds deterministic geometry and coordinate-sharing checks, 2D drawing tests and a mobile Chromium scenario that verifies parallax, instrument and control visibility, and no sideways overflow. Physical Android testing and aviation instructor review are still needed.

**Simulator:** https://magnusclarkson-star.github.io/aviation-ground-school-academy/flight-sim.html
**Academy:** https://magnusclarkson-star.github.io/aviation-ground-school-academy/

### Visual motion feedback and stronger one-tap vibration test (2026-11-08)

A learner confirmed that **aircraft engine sound plays on the Tecno Camon 30 but website vibration cannot be felt**. This update deliberately **does not change the working engine and ATC sound implementations**. The Android haptic issue is isolated to the OS/browser vibration mechanism, not to Web Audio.

The simulator now provides a second, longer **Test stronger vibration** button. That direct-gesture test requests a bounded `[180,100,180]` millisecond pattern (460ms total) without enrolling the user in ongoing in-flight vibration. In-flight vibration still uses the existing short, rate-limited patterns, and event pulses are prioritised ahead of general runway/airflow ambience. The diagnostic report shows request attempts, calls accepted by the browser, and stronger test requests. **An accepted website vibration request does not establish that the physical motor moved.**

An unobtrusive **VISUAL CUE** display now follows the fictional flight phases (roll, climb, flight, approach, landing) and highlights select recorded simulation events, including turbulence, touchdown and stall. It remains visible even when no haptic API exists. It never claims to replicate physical flight forces and does not obstruct the instruments or touchscreen controls.

**Tecno / Android device checks:** First verify the phone itself vibrates for an ordinary incoming call or notification. Open Android **Settings → Sound & vibration** (or **Accessibility → Vibration & haptics**, depending on the phone's HiOS version) and enable vibration/haptic feedback, and check Do Not Disturb. Next use the simulator directly in Chrome rather than an in-app view, tap **Test stronger vibration**, and read **Browser & device diagnostics**. The browser API may report a request as accepted while nothing is felt; websites cannot force the phone's system settings or use Android's native vibrator service directly. If the phone vibrates in other applications but not this web page, a future dedicated Android build with a native haptics bridge may be necessary for more reliable feedback. Do not assume the hardware is faulty based on the website alone.

Flight simulator: https://magnusclarkson-star.github.io/aviation-ground-school-academy/flight-sim.html

### Cockpit windscreen and propeller/rotor visual upgrade (2026-11-08)

The practice simulator now includes an **illustrated cockpit windscreen**, slim structural posts, a lower dashboard silhouette and a subtle airplane propeller or helicopter rotor cue over the existing animated airfield. This works with both the WebGL2 3D scenery and 2D fallback; the synthetic scenery and runway continue moving behind the frame as the fictional aircraft flies. The frame is automatically hidden in the external 3D chase camera so the outside aircraft remains visible. **Illustrated cockpit windscreen: On/Off** is available under the scenery display options, and starts **On** so new students see the effect without finding a setting. All framing layers are pointer-events:none and do not cover the independent instrument panel or touchscreen yoke, stick, cyclic, throttle and rudder. Propeller/rotor animation is disabled under the operating system's Reduce Motion preference. The effect is illustrative, not a geometrically accurate certified cockpit or aerodynamic propeller simulation.

The immersive Chromium browser checks now verify the default frame, explicit off/on, helicopter switch, chase camera, 2D fallback, touch event transparency and responsive phone layout.

## Install the flight simulator on Android

Open the HTTPS GitHub Pages flight simulator in Chrome on Android and choose **Install app** from the browser menu when offered. The new web manifest provides a standalone home-screen entry with 192px and 512px application icons. The service worker caches only same-origin simulator files encountered on the first online visit; an initial online load is required before offline replay of cached scenes. Some voice, vibration and browser/device integrations may remain unavailable offline. This is an installable progressive web app, not a compiled native APK or a certified aircraft trainer.
