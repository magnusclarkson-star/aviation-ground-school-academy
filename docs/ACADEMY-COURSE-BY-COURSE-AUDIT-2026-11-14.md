# Aviation Ground School Academy — course-by-course completion audit
**Reviewed:** 14 November 2026 · **Evidence:** current `main` source files · **Document status:** editorial implementation audit, not instructor approval

## Scope and what actually exists

- **12 Ground School subjects** under `academy-coursebook-data.js`. Every subject has 3 introductory teaching sections with 3 questions, plus 3 extended lesson sections, 3 extended questions and 1 applied scenario in `academy-coursebook-depth-{a,b1,b2}.js`. There are **72 lesson sections**, **72 topic questions**, **12 scenarios** and a **24-question cumulative practice review**. All 12 introductory subject records explicitly say `SME_REVIEW_REQUIRED`; long chapters, visual teaching notes and images supplement the same subjects. Their combined **264 minutes** are rough reading estimates, **not** contact hours or approved flight-training credit.
- **16 specialist programmes** in `academy-specialist-courses-data.js`: each has a proposed 6- or 8-unit syllabus outline, an outcome, learning activity and source families. Only two programmes, **Avionics Engineering Foundations** and **Aircraft Accident & Incident Investigation**, currently have substantive illustrated sample lessons, **two each** (four total) in `academy-specialist-lesson-data.js`. The other 14 have outlines only, not a complete course.
- The separate **four Ground-School Practice modules** and **eight AI Instructor micro-lessons** support introductory learning; they are *not* additional completed professional programmes. Practice exports are editable browser-local self-checks.
- The self-study milestone/certificate preview capability is distinct from verified Academy documents. The private document/assessment foundation is not confirmed deployed to a live production account; no regulator-approved course or official pilot licence is represented by these web lessons.

**Inspection sources:** `academy-coursebook-data.js`, `academy-coursebook-depth-model.js`, `academy-coursebook-depth-a.js`, `academy-coursebook-depth-b1.js`, `academy-coursebook-depth-b2.js`, `academy-coursebook-chapters-{a,b,c}.js`, `academy-coursebook-visual-lessons.js`, `academy-specialist-courses-data.js`, `academy-specialist-lesson-data.js`, `ground-school-modules.js`, `ai-instructor-lessons.js`, `academy-certificate-eligibility.mjs`, and existing instructor-review/syllabus-crosswalk documents.

## A. All 12 Ground School subjects — individual work remaining

**Shared current state:** interactive educational draft with explanatory content, illustrations, questions and browser-local progress. **No signed SME review**. The tasks below add to the original teaching content; they are not a request to replace already-approved graphics or aircraft.

| # | Existing subject | Verified implementation state | Subject-specific next work |
|---|---|---|---|
| 1 | Aviation orientation and safety culture | Interactive draft: 6 sections, 6 topic questions and 1 scenario; review required | Record age-appropriate Air Scout safety boundaries, reporting roles and one assessed fictional hazard-report exercise. |
| 2 | Aircraft structures and configurations | Interactive draft: 6 sections, 6 topic questions and 1 scenario; review required | Validate Cessna, R44 and fighter component diagrams with an instructor; add a clickable part-identification and control-surface comparison exercise. |
| 3 | Principles of flight and aerodynamics | Interactive draft: 6 sections, 6 topic questions and 1 scenario; review required | Validate angle of attack, stalls, drag and load-factor claims; add plotted airflow/energy cases and a scored conceptual simulator observation. |
| 4 | Powerplants and aircraft systems | Interactive draft: 6 sections, 6 topic questions and 1 scenario; review required | Expand validated engine, fuel, electrical and hydraulic system flow diagrams; add safe fictional fault-isolation worksheets (no operational servicing). |
| 5 | Flight instruments and electronic displays | Interactive draft: 6 sections, 6 topic questions and 1 scenario; review required | Cross-check six-pack and glass display indications with the existing simulator; build instrument-source/failure recognition and tap-to-expand assessments. |
| 6 | Aviation weather and interpreting reports | Interactive draft: 6 sections, 6 topic questions and 1 scenario; review required | Add interpreted fictional METAR/TAF sets, tropical convection and pressure-altitude worked problems; verify current source editions and local relevance. |
| 7 | Navigation and flight planning concepts | Interactive draft: 6 sections, 6 topic questions and 1 scenario; review required | Add map/chart-reading, heading-versus-track and wind/time/distance practice with synthetic routing; verify navigator response and local AIP boundaries. |
| 8 | Airspace, airports and aviation rules | Interactive draft: 6 sections, 6 topic questions and 1 scenario; review required | Create Sierra Leone-specific airspace/regulatory comparison after official publication review; add fictional airfield/runway/airspace decision cases. |
| 9 | Radiotelephony and ATC awareness | Interactive draft: 6 sections, 6 topic questions and 1 scenario; review required | Validate readback and phraseology by jurisdiction; add interactive fictional pilot–ATC listening/speaking simulations and feedback rubrics. |
| 10 | Weight, balance and performance | Interactive draft: 6 sections, 6 topic questions and 1 scenario; review required | Build fictional loading/CG worksheets and performance-margin interpretation; verify arithmetic and explicitly separate results from approved aircraft data. |
| 11 | Human factors and decision-making | Interactive draft: 6 sections, 6 topic questions and 1 scenario; review required | Add crew communication, fatigue, distraction and reporting tabletop scenarios; measure learner reasoning with reflection and a case debrief. |
| 12 | Helicopter fundamentals and R44 familiarisation | Interactive draft: 6 sections, 6 topic questions and 1 scenario; review required | Obtain qualified helicopter review of cyclic, collective, anti-torque, hover and autorotation concepts; test R44 educational control response without changing approved aircraft models. |

### Ground School acceptance criteria for each subject

- [ ] Qualified instructor checks every core/deep explanation, worked example, answer and illustration against *edition-and-section identified* source references; log findings and academic sign-off.
- [ ] Measurable learner outcomes and age/pathway variants (Air Scouts vs enthusiasts) are reviewed, with supervised activities suitable for young learners and independent adult self-study.
- [ ] At least one meaningful subject-specific interactive practical/worksheet is completed and tested on Android portrait and landscape and desktop, including narration/accessible navigation.
- [ ] Assessment questions cover all taught objectives, have clear feedback and versioned corrections; public self-checks remain unverified and must not be represented as protected exams.
- [ ] For any *formal* training claim, separately map prerequisites, delivery hours, instructor/assessor privileges, secure examinations, syllabus approval and actual regulated scope.

## B. All 16 proposed specialist programmes — individual work remaining

**State classification:** P1/P2/P3 numbers are **existing catalogue priorities** and not new promises. The two P1 programmes have only two public illustrated *sample* lessons each. Every other specialist programme is **outline only**, with no complete subject course in the current site.

| # | Programme | Current coverage | Next educational deliverable |
|---|---|---|---|
| 1 | Avionics Engineering Foundations | P1 — 2 illustrated samples; full 8-unit course not built | Complete six remaining planned teaching units (two illustrated samples exist), add circuit tracing, fault logs, system diagrams and an assessed synthetic troubleshooting project; secure avionics SME review. |
| 2 | Aircraft Accident & Incident Investigation | P1 — 2 illustrated samples; full 8-unit course not built | Complete six remaining planned teaching units (two illustrated samples exist), add fictional evidence chain-of-custody forms, recorder-data timelines, interviews, findings and a complete case-report project; independent investigation SME review. |
| 3 | Aviation Safety Management Systems | P2 — 6-unit outline only | Write six full lessons and scenario checks; build an editable fictional hazard/risk register, controls, safety-performance measures and corrective-action review exercise. |
| 4 | Flight Data Monitoring & Investigation Analytics | P2 — 6-unit outline only | Provide synthetic datasets, labelled flight-parameter graphs, time alignment, event reconstruction, data-quality checks and an assessed evidence-limitations memo. |
| 5 | Aircraft Maintenance Engineering Fundamentals | P2 — 6-unit outline only | Build structures/electrical/maintenance-document lessons, aircraft part identification and a mock defect/logbook exercise; require authorised maintenance SME review. |
| 6 | Aircraft Engines & Propulsion Systems | P3 — 6-unit outline only | Add piston, turbine, propeller/gearbox and lubrication visual systems; include component/function matching and fictional engine trend interpretation. |
| 7 | Aviation Cybersecurity & Connected Aircraft | P3 — 6-unit outline only | Develop defensive aircraft-network diagrams, data/privacy boundaries, a classroom threat model, a risk register and a simulated incident-response tabletop. |
| 8 | Human Factors & Crew Resource Management | P2 — 6-unit outline only | Expand CRM, fatigue and threat/error management with decision exercises, role-play dialogue, debrief rubrics and scenario assessment. |
| 9 | Aviation Quality Assurance & Regulatory Auditing | P3 — 6-unit outline only | Provide a fictional regulatory source hierarchy, audit plan, finding evidence log, root-cause/corrective-action case and quality review rubric. |
| 10 | Airport & Ground Handling Operations | P2 — 6-unit outline only | Create ramp/apron hazard maps, a fictional turnaround schedule and ground-handling coordination simulation; independently verify local restrictions and safety language. |
| 11 | Air Traffic Services & Aviation Radiotelephony | P2 — 6-unit outline only | Provide a structured radio syllabus, phonetics/readbacks, listening exercises, fictional approach/tower scenarios and graded dialogue recordings without simulating real clearance authority. |
| 12 | Uncrewed Aircraft Systems & Drone Safety | P2 — 6-unit outline only | Add local UAS-rule verification, fictional mission planning, airspace/weather/privacy risk worksheet and instructor-reviewed go/no-go case. |
| 13 | Aviation Meteorology & Weather Briefing | P2 — 6-unit outline only | Go beyond core weather: layered forecasts, pressure/density-altitude problems, tropical and icing hazard cases, METAR/TAF briefs and assessed weather decisions. |
| 14 | Air Navigation & Flight Planning | P2 — 6-unit outline only | Go beyond core navigation: synthetic route charts, magnetic/true conversion, wind-drift computations, diversion/contingency plans and an evaluated flight-plan worksheet. |
| 15 | Aviation Emergency Response & Search-and-Rescue Awareness | P3 — 6-unit outline only | Build tabletop response coordination, rescue-scene hazard and evidence-protection scenarios, family-assistance role-play and an after-action report. |
| 16 | Aircraft Design, Flight Dynamics & Simulation | P3 — 6-unit outline only | Teach configuration tradeoffs, stability, propulsion, loads and model limitations; use synthetic design comparisons and a simulation-validation critique, not real design approval. |

### Specialist programme acceptance criteria

- [ ] Complete every unit in its proposed outline into an actual structured lesson with learning objectives, substantial explanations, diagrams/source citations, worked examples, learner activity and checkpoint questions.
- [ ] Add the named course-specific practical output (evidence packet, circuit test, audit record, flight-plan worksheet, hazard register, etc.), with realistic but **synthetic/non-sensitive** training materials.
- [ ] Build a final project or case-based assessment and a transparent grading rubric; do not infer competence from merely opening lessons.
- [ ] Assign an appropriately experienced subject reviewer, verify reference editions and jurisdiction, correct unsafe or unsubstantiated claims, version the approved material and keep evidence of review.
- [ ] Implement administrator-controlled fees, free/scholarship access, completion verification and document release where permitted, rather than unlocking a formal credential from browser-local editable practice.
- [ ] Keep regulatory licensing, maintenance authority, pilot certificates, State investigation appointment and provider approval completely distinct from Academy educational course-completion records.

## C. Common delivery gaps to close before any course is called finished

| Workstream | Current evidence | Acceptance needed |
|---|---|---|
| Scientific/technical content | Substantial public teaching drafts and sample lessons | Reviewer identity, accuracy log, source edition/chapter, independent safety verification, documented course approval by the Academy |
| Learning objectives and standards | Broad objectives and suggested content | Measurable outcomes, prerequisites, time plan, entry routes and assessment blueprint per course |
| Student practice | Browser-local quizzes and simulation, varying depth | Consistent subject-specific worked practical, workbook export, instructor feedback and tracked improvement |
| Assessment | Public answer keys and local editable scores | Separate identity-checked protected question bank, competent assessment, results and appeals for verified courses |
| Accounts and learning records | Private foundations exist in source; public site is static | Authenticated production learner portal, consent/safeguarding arrangements, privacy, backup, retention and audit trails |
| Fees, scholarships, certificate/transcript release | Owner-controlled private code and approved artwork designs exist | Live secure hosting, fee/waiver policy, verified academic record, protected issuance and optional authorised signature; actual deployment still needed |
| Device/accessibility | Automated browser checks, spoken lessons, mobile UI | Device tests on real phones, low-bandwidth/offline behaviour, accessibility testing and content ergonomics |
| Accreditation | Draft SLCAA syllabus crosswalk and ATO readiness materials | Qualified human review and specific authority decision before *any* claim of regulator-approved training; never grant flight/simulator credit automatically |

## D. Recommended implementation order (preserves existing approved work)

**Phase 1 — Stabilise the 12 existing Ground School subjects:** create a versioned review checklist, ensure technical correctness and age-sensitive Scouts/enthusiast pathways, then complete/verify the subject-specific practical for each. Retain current original artwork and cockpit layouts; changes should be additive and isolated.

**Phase 2 — Finish the two most developed specialist courses:** Avionics Engineering Foundations and Aircraft Accident & Incident Investigation. They already have real illustrated sample lessons; build the six missing planned subject units in each, learning activities, synthetic case files, capstone projects, and instructor review. These are the fastest clear candidates for an Academy-issued *non-regulatory* verified learning programme, once secure private assessment and release infrastructure is live.

**Phase 3 — Implement remaining P2 specialist courses:** SMS, flight-data analysis, maintenance, human factors/CRM, airport operations, ATC/radiotelephony, drone safety, specialist meteorology and specialist navigation.

**Phase 4 — Implement existing P3 courses:** propulsion, aviation cybersecurity, quality auditing, emergency response/SAR awareness and aircraft design/simulation.

**Phase 5 — Formal academic and provider release gates:** verify all lesson and assessment records, fees/waivers and downloaded documents through private accounts, then pursue any separate course-specific accreditation. The existing artist-approved certificates stay identical; public display uses permanently watermarked, no-print raster previews only.

## E. Course-by-course review record to complete with real instructors

For **each** course create a reviewed syllabus card containing: course ID; target audience and level; prerequisites; learning objectives; lesson sequence; source edition and sections; instructor/reviewer identity and credentials; practical exercises; safety boundaries; examination/project rubric; pass criteria; revision/date; accessibility review; administrator price/waiver setting; Academy certificate/transcript entitlement; signed Academy academic approval; and, only when actually applicable, documented authority-issued approval and limitations.

**Do not mark any programme as accredited or formally completed solely because these code-based checks and preliminary courses are present.**

## F. Preservation rule

The owner has already approved the three original certificate designs (traditional academic, Scouts modern aviation, enthusiast navy/gold) and existing aircraft/cockpit models. Do not redesign, overwrite, degrade or silently replace them as part of curriculum delivery. Keep curriculum changes separate from flight-simulator and certificate-artwork changes, with tests and live deployment verification.
