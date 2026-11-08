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
