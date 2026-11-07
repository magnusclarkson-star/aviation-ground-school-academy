# Aviation Ground School Academy — Regulatory Readiness and Competitive Benchmark
**Research date:** 7 November 2026  
**Status:** **Educational prototype only. No training-organisation approval, examiner authority, simulator qualification, licence endorsement, or credit for flight hours is claimed.**  
**Scope:** Sierra Leone-based initiative serving international learners; intended future partnerships with approved schools, subject to each authority's rules.

## 1. Critical distinctions

1. **Educational publication**: an unapproved website can offer non-credit aviation awareness, simulations, revision and practice quizzes when truthfully described and legally operated.
2. **Approved or declared training organisation**: approval/declaration is jurisdiction- and course-specific. An online course alone is not an FAA Part 141 school or a European ATO/DTO.
3. **Approved distance learning / approved course**: content, instructors, student supervision, examinations, attendance and evidence may be assessed separately. Approval must be obtained from the competent authority or an appropriately authorised training organisation.
4. **Simulator qualification**: a browser PFD with touch controls is not automatically an FAA BATD/AATD, FTD, FFS, or EASA FSTD. Device and approved use must be evaluated separately. Do not award simulation hours or licensing credit without actual qualification and approved course provisions.
5. **Country-specific authorisations**: Sierra Leone (SLCAA), EU/EASA, United Kingdom/UK CAA and US/FAA differ. We must not describe one country's approval as global authorisation.

## 2. Authority paths — status and evidence

| Path | Public rule / guidance | Current status | Future evidence/progression |
| --- | --- | --- | --- |
| **Sierra Leone SLCAA ATO** | SLCAA Part 1A personnel licensing, Part 1B Approved Training Organization, and SLCAA-AC-PEL048 ATO certification guidance | Not applied / not approved | Contact SLCAA to confirm exact scope for ground-school e-learning and simulator aids. Maintain training and procedures manual, organisation chart, instructor qualifications, syllabi/courseware, equipment inventory, facility evidence, assessment and student records, quality/safety processes. |
| **United States FAA Part 141** | 14 CFR Part 141; FAA AC 141-1B; pilot school requirements | Not applied / not approved | Approved training programme, facilities, personnel, course syllabi, stage checks, records and accountable oversight with an appropriate FAA-authorised certificate holder. Consider an accredited-school content partnership before a direct school application. |
| **United States FAA ATD** | AC 61-136B (BATD/AATD), distinct from Part 60 FTD/FFS | Not qualified | Type/configuration-specific device qualification, hardware/visual controls, validation, QAG, manufacturer LOA and usage limitations — only if a formal trainer device is developed. Present phone/web trainer remains non-credit. |
| **EU EASA ATO or DTO** | Regulation (EU) 1178/2011; Part-ORA / Part-DTO; 2026 virtual classroom/distance-learning guidance | Not applied / not approved | Determine whether ATO, DTO, or partnership is legally appropriate for specific courses. Include instructor supervision, documented programmes, learning records, assessments, record retention, versioning and competent-authority review. |
| **EU EASA FSTD** | FSTD rules including Regulation (EU) 2026/781, ED Decision 2026/007/R, CS-FSTD Issue 1 | Not qualified | Review implementation date and applicability; track touchscreens and task-to-tool methodology, qualified device capabilities, validation data, traceability, maintenance and continuing qualification. Not equivalent to simply making a touchscreen. |
| **United Kingdom CAA** | UK CAA ATO/DTO guidance (separate from EASA) | Not applied / not approved | Review whether a UK-based partner or UK ATO authorisation would be necessary. UK CAA states an organisation based outside the UK cannot simply declare itself a UK DTO. |

### Official links (refresh before any actual application)
- SLCAA current regulations: https://slcaa.gov.sl/information-resources/regulations/
- SLCAA ATO certification circular: https://slcaa.gov.sl/wp-content/uploads/2024/01/SLCAA-AC-PEL048-Rev-00-CERTIFICATION-OF-AN-APPROVED-TRAINING-ORGANISATION-31-JULY-2021.pdf
- FAA Part 141 certification guidance: https://www.faa.gov/airports/resources/advisory_circulars/index.cfm/go/document.information/documentNumber/141-1B
- FAA AC 61-136B (ATD): https://www.faa.gov/regulations_policies/advisory_circulars/index.cfm/go/document.information/documentID/1034348
- EASA ATO: https://www.easa.europa.eu/en/domains/aircrew-and-medical/approved-training-organisations-ato
- EASA updated FSTD framework (2026): https://www.easa.europa.eu/en/domains/aircrew-and-medical/flight-simulation-training-devices-fstd
- EASA 2026 virtual/distance-learning guidance: https://www.easa.europa.eu/en/document-library/general-publications/guidance-allowing-virtual-classroom-instruction-and-distance-learning
- UK CAA ATO/DTO: https://www.caa.co.uk/data-and-analysis/approved-persons-and-organisations/approved-organisations/pilot-training-providers-atos-and-dtos/

## 3. Competitor benchmark: strengths to learn from, not copy

| Provider | Region/use case | Publicly described capabilities | Design opportunity for our academy |
| --- | --- | --- | --- |
| **Sporty's** | US video ground school and flight-school integration | Courses, watched-video tracking, quizzes, CFI portal, linked syllabus, instructor progress viewing and API | Source-linked syllabi, stage-level evidence, instructor-approved lesson check-off, actionable remedial lessons; align lessons to a supervising school rather than falsely self-certify |
| **Bristol Groundschool** | Europe/UK EASA/UK theory and ATPL | ATPdigital distance learning, diagrams, offline access and progress syncing; question bank, targeted weak-topic revision, instructor support | Mobile-first offline lessons, targeted topic drills, visual cockpit labs, local bandwidth savings; source/version controls for questions |
| **FlightLogger / school operations platforms** | International training organisations | Scheduling, student progress, instructor management, safety/compliance, records, maintenance and finance workflows | Future multi-school instructor dashboard, training-event audit trail, aircraft/instructor scheduling; keep this separate from public community features |
| **Our academy's potential niche** | Sierra Leone and international learners, Scouts and new aviators | Touch PFD + analogue six-pack, practical control response labs, Air Scout learning pathway | Low-bandwidth first, local context and multilingual explanations, inclusive prices, international partnerships, strict unapproved/approved labelling and separation of recreational activities from licensing training |

Provider sources:
- https://www.sportys.com/flightschool
- https://support.courses.sportys.com/en-US/students-progress-192514
- https://www.bristol.gs/students/courses/atpla/
- https://www.flightlogger.net/

These comparisons do **not** imply endorsement, collaboration or equal accreditation.

## 4. Required future product architecture

### A. Content governance
- `course`: programme ID, regulator jurisdiction, level, training organisation ID, version, effective date, superseded date, authors and reviewers.
- `lesson`: objective, references (publication/edition/page), activity, assessment, passing criteria and updated date.
- `content_review`: instructor/SME signature, reviewer authority, review date, change request and audit history.
- Keep public demo material clearly separate from any eventually approved course revision.

### B. Learner evidence and assessment
- Secure unique learner identity/guardian role (for minors), audit logging, class enrolment and instructor attribution.
- Assessment attempt records: question bank version, randomisation seed, time, result, feedback and accessibility adjustments.
- Attendance evidence and learning time, signed instructor progress comments, course stage checks.
- Certificate of **participation** may be offered only if labelled as non-licensing; any regulatory endorsement must be gated behind applicable real authority.
- Never treat browser localStorage or screenshots as regulatory evidence.
- Plan retention and data protection by jurisdiction, including UK/EU privacy compliance if serving those markets.

### C. Simulator and instrument standards
- Clearly label generic/fictional manoeuvres, control coupling and display fidelity.
- Maintain a **documented aircraft data pack** per actual type: POH/AFM edition, V-speeds, flap operating limits, control directions, performance tables, instrument indications and reviewer.
- Require independent instructor approval for aircraft-specific content; the demo must not quietly become 'approved' after UI upgrades.
- Automated model tests + real-device testing + instructor validation + discrepancy tracker.
- If seeking simulator qualification, build the device specification/evaluation package under the relevant FAA or EASA rule with qualified support, not just web screenshots.

### D. Organisation governance
- Future application/evidence table: authority, legal organisation, scope, application reference, status, expiry, permitted courses, controlling document, named accountable owner and official verification link.
- Evidence access controls: private permissions for legal correspondence, certificates and training records; **never store credentials or sensitive documents in public GitHub Pages**.
- Operational compliance monitoring: incident reports, audits, staff competency, change control and periodic source verification.
- Public status page reads a *verified, publishable subset* only.

## 5. Proposed implementation order

| Milestone | Deliverable | Acceptance |
| --- | --- | --- |
| R1: transparency and foundations | Current web status page, versioned standards roadmap, non-accreditation labels, source library | No official approval claimed. Public records and links match actual verified facts |
| R2: lesson evidence | Objective-based course units, quizzes, instructor review flow, learner progress | All course changes versioned and auditable |
| R3: schools and instructors | Verified organisational profiles, student-instructor relationships, role-based dashboards | Records and assessments cannot be overwritten silently |
| R4: offline/mobile | Offline lessons, limited-bandwidth media, secure re-sync and accessibility | Offline attempts reconcile without duplicate completions |
| R5: approved-course partnership | Agreements and course-scope evidence with actual ATO/DTO/Part 141 school if pursued | Only real supervising authority issues authorised endorsements |
| R6: formal applications | SLCAA/FAA/EASA/UK scope-specific application support and audits as applicable | Official written approval on file *before* displaying approval status or awarding credit |

## 6. Current evidence inventory

- **Available:** Public demo source, GitHub commits/workflows, tests for flight-state calculations and touchscreen operations, disclaimer, learning scenarios and published official-source links.
- **Not available:** ATO/DTO/Part 141 certificate, qualified BATD/AATD/FSTD device, approved syllabus, validated aircraft POH parameter pack, instructor/SME sign-offs, assessment integrity and regulator-grade learner records, legal approvals for use in any jurisdiction.

**Next regulatory contact:** the Sierra Leone Civil Aviation Authority is the appropriate initial authority to clarify ATO and non-credit ground-school positioning for an organisation based in Sierra Leone. An EU or US partner may support future approved courses, but their approval and jurisdiction must be established with that partner and the relevant authority.

*This is an engineering readiness plan, not a legal or regulatory approval opinion. Verify every applicable regulation and implementation date with the competent authority before applying or making claims.*
