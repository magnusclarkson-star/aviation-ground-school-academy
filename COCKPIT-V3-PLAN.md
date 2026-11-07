# Aviation Ground School Academy — Cockpit Upgrade V3 Plan

**Updated:** 7 November 2026  
**Repository:** `magnusclarkson-star/aviation-ground-school-academy`  
**Deployment:** GitHub Pages, public education prototype  
**Purpose:** teach cockpit instrument interpretation, flight control effects and aircraft systems with accurate educational presentation, without representing the prototype as a certified flight simulator.

## 1. Product architecture

The academy remains independent from Salone One. Keep the existing Scouts and Aviators entry pathways. Separate the training product into distinct experiences:

1. **Explore** — short illustrated or narrated ground-school topics.
2. **Single-instrument lab** — one instrument per page, with real markings and explanations.
3. **Control-response lab** — operate one actual control and observe linked indications and aircraft response.
4. **Integrated analogue cockpit** — conventional six-pack, with read-only instrument faces.
5. **Digital touchscreen cockpit** — selectable PFD, navigation map and engine pages, with touchscreen page control rather than direct manipulation of simulated sensor readings.
6. **Practice and assessment** — objective-based tasks, stage tests, remediation and progress.
7. **Aircraft pathways** — fixed-wing trainer first; R44 and generic helicopter lessons next; non-sensitive military avionics familiarisation after validation.

## 2. V3 milestone delivery status

| Deliverable | Status | Notes |
| --- | --- | --- |
| Analogue primary six-pack | First working prototype | Correct basic-T ordering, circular marked dials, shared simulated readings |
| Touchscreen glass display | First working prototype | PFD, NAV MAP and ENGINE page selection |
| Mobile yoke and pedals | First working prototype | Pointer drag, press-and-hold rudder, keyboard fallback |
| Throttle, trim and flaps | First working prototype | Touch sliders and labeled flap detents |
| Shared conceptual flight model | First working prototype | Time-based coupling between pitch, roll, IAS, heading, VS, altitude and travel |
| Focused instrument explanations | First working prototype | One of six at a time; spoken on supported browsers |
| Model and deployment tests | Automated checks in CI | Real-device browser tests still required |
| Exact aircraft-specific markings | **Not yet validated** | Do not use generic demo color arcs as POH values |
| Physics-accurate 3D aircraft model | **Not built** | Separate substantial engineering task |
| Certified flight training device | **Out of scope** | No credit for flying time/ratings |
| Real student accounts/payment/community | **Not built in V3 cockpit** | Require a separate backend/privacy and safety review |

## 3. Instrument construction standard

All six instruments use legible numerals, major/minor ticks, a correctly shaped circular bezel, high contrast, defined units, and no direct flight-data adjustment via touch on the instrument face.

| Instrument | Required training components | Data and limitations |
| --- | --- | --- |
| Airspeed indicator (ASI) | Needle, KNOTS label, numerical ticks, white/green/yellow arcs and redline | Reference arcs in this demo are illustrative. Calibrate to the selected type's POH before type-specific training |
| Attitude indicator | Blue sky, brown earth, stable miniature aircraft, horizon, 5° pitch ladder and 10/20/30/45/60° bank index | Yoke input drives pitch/bank; horizon moves relative to the fixed aircraft |
| Altimeter | Circular numbered 0–9 scale, 100/1,000/10,000 foot hands, units, barometric window | Fixed demo setting; add controlled barometric adjustment lesson with datum handling |
| Turn coordinator | Aircraft symbol, turn direction, nominal two-minute turn markings, slip/skid ball | Simulated turn rate and coordination. **Do not confuse with bank angle** |
| Heading indicator | Compass card (cardinal directions and degree marks), fixed lubber line, current heading | Simulated heading only; demonstrate magnetic compass setting/drift in later lesson |
| Vertical speed indicator (VSI) | Zero, up/down scale, numerical hundreds/thousands of feet per minute | Uses conceptual vertical speed and simplified instrument response |

**Validation reference hierarchy:** FAA Pilot's Handbook of Aeronautical Knowledge, Instrument Flying Handbook, Airplane Flying Handbook, manufacturer POH/AFM and supplement for any named aircraft. Regional regulations must be reviewed separately, rather than assuming that FAA certification applies globally.

## 4. Screen layout

### Student onboarding
Scouts, private-pilot learners, helicopter learners, and aviation enthusiasts remain distinct pathways. Minors need guardian controls and a protected social experience.

### Analogue lesson screen
1. Lesson title, purpose and audio explanation.
2. One large instrument, or toggle to integrated six-pack.
3. **Controls outside the instrument** — grip, pedals, throttle and contextual buttons.
4. Relevant aircraft response and numerical indicators.
5. One practical challenge and immediate explanation.
6. Lesson progress saved to a secure student profile only after the authentication backend is built.

### Digital touchscreen
1. PFD view: attitude, airspeed tape, altimeter tape, vertical speed and heading.
2. NAV MAP: synthetic ground track, not actual GPS or charts.
3. ENGINE: conceptual power and flap status, not calibrated engine instruments.
4. Explicit touch buttons for page navigation.
5. Display readouts remain sensor-driven; learners cannot alter them by tapping dial faces.

### Controls and learning
- Yoke: drag left/right for roll command; up/down for pitch command; pointer capture; returns to neutral when released.
- Rudder: press and hold for yaw and slip/skid response.
- Throttle: change engine power continuously; airspeed responds over time.
- Trim: small pitch bias; not an autopilot.
- Flaps: clearly marked simulated detents; response to speed/flight state.
- **Forward travel**: advancing flight progress and synthetic ground track. Pulling the yoke back is *not* backward flight; pitch changes independently of forward airspeed.

## 5. Physics and visualization stages

**V3.0** — available: one shared, explicitly simplified flight model. It reacts over elapsed time and provides consistent readings across analogue and glass displays.

**V3.1** — instrument validation: compare each tick, arc, needle direction and PFD tape against official source diagrams and instructor review. Test all phone touch interactions and desktop keyboard actions.

**V3.2** — dedicated single-instrument lessons: ASI, attitude, altimeter, turn coordinator, heading and VSI; add narrated scenarios, quizzes and completion checks.

**V3.3** — fixed-wing aircraft visualisation: a licensed or original textured 3D model with pitch, roll, yaw, forward translation and climb/descent. Integrate WebGL and low-end Android fallback. This must *not* be labelled photorealistic until model materials and camera lighting support that claim.

**V3.4** — type-specific fixed-wing and helicopter content: add sourced panel layouts, checklists and POH citations for actual variants. Robinson R44 helicopter simulation requires different control coupling (cyclic, collective, pedals, rotor/torque and RPM) rather than reusing airplane dynamics.

**V3.5** — student readiness: instructor review, content provenance, quizzes, assessments and accessibility/child-safety review; then backend accounts and subscriptions.

## 6. Acceptance and test criteria

1. **Static integrity**: no broken local links or missing files; JS parses.
2. **Deterministic model checks**: back yoke increases pitch, forward yoke decreases pitch, left/right input banks correctly, turns affect heading, climb/descent affect VSI and altitude, throttle changes airspeed, rudder changes slip, forward distance remains nonnegative.
3. **Analogue QA**: six dials are circular and correctly positioned; labels and marks visible at 360px mobile width; aircraft remains fixed on attitude indicator, while horizon moves.
4. **Touch QA**: hold rudder, drag only control grip, adjust throttle/trim/flaps and switch touchscreen PFD/NAV MAP/ENGINE; no accidental page scroll during grip drag.
5. **Negative QA**: touching instrument face never changes sensor readings; no duplicate click+pointer action.
6. **Browser QA**: Android Chrome, Windows Chrome/Edge and low-bandwidth test. Automated Node checks do not replace browser testing.
7. **Educational QA**: qualified instructor reviews the primary instrument conventions and all training assertions before they are labelled aircraft-type-specific.
8. **Release QA**: GitHub Actions test job and Pages deployment both complete successfully.

## 7. Sources for validation

- FAA Pilot's Handbook of Aeronautical Knowledge: https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak
- FAA handbooks and the Instrument Flying Handbook: https://www.faa.gov/regulations_policies/handbooks_manuals/aviation
- FAA Airplane Flying Handbook: https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook
- AOPA basic instrument panel: https://www.aopa.org/training-and-safety/students/presolo/special/basic-instrument-panel
- Garmin G3X Touch concepts: https://www.garmin.com/en-US/p/682215/pn/G3X-TCERT-00/
- Robinson helicopter POH and safety resources: https://www.robinsonheli.com/publications

The V3 screens are original educational visualisations, not copied manufacturer instruments or licensed digital avionics products. Manufacturer branding, software and certified procedures must not be imitated or implied.
