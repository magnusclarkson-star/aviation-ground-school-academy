# Cockpit V3 Skills Practice and Future Instructor Review

**Release:** V3.6 educational prototype · 7 November 2026  
**Entry:** [Skills Practice](../cockpit-v3.html?mode=skills)  
**Regulatory status:** **Not approved; no course, instructor, simulator, licence, practical stage check, or flight-hour credit is claimed.**

## What is implemented now

The static cockpit includes five offline, selectable synthetic instrument tasks:

| Task | What the learner observes |
| --- | --- |
| Straight and level | Pitch, roll, heading/turn rate and airspeed |
| Climb and power | Nose-up attitude, power and vertical speed |
| Controlled bank and turn | Bank, heading, turn rate and slip/skid |
| Controlled descent | Nose-low attitude, VSI, roll and speed |
| Flap configuration | Selected and indicated flap settings, relative drag and airspeed |

Each task is a **12-second observation window** with a visible fictional target band, live progress, immediate review, and a minimum **65% observed sample match** for the label *Practice target met*. The user can retry or stop early. Task values are designed solely to work with the conceptual simulator; they must not be presented as V-speeds, tolerances, flight-check standards, aircraft procedures, or instructor judgments.

Controls and touchscreen PFD remain on the same responsive view. The existing yoke/joystick selection, throttle, rudder and flap selector are reused rather than duplicated. The digital map and engine tabs are disabled during the timed skills exercise to keep focus on the relevant PFD indications; outside the exercise they remain available.

### Optional JSON report

A completed attempt may be downloaded as a **local unsigned report** with schema `agsa.practice-observation.v1`. Fields include:

- schema name and version, creation timestamp, explicit unapproved-use disclaimer;
- training task ID and fictional target description;
- observation duration, sample interval, matched sample count and percentage, illustrative target outcome, longest consecutive match;
- final synthetic pitch, bank, heading, speed, vertical speed, slip, flap position, throttle and altitude;
- limitations describing the lack of identity verification, aircraft validation, instructor sign-off, or flight-time credit.

**No learner identity is entered or embedded.** The report is generated client-side and downloaded by the user's own browser; there is no remote upload, backend, student file, training record retention or identity verification. These exports are *not* proof of an approved assessment.

## What a production training provider would still need

| Future requirement | Current status / needed change |
| --- | --- |
| Programme-specific lesson objectives and standards | Fictional tasks exist. Official syllabus and assessment standards must be written, referenced, instructor reviewed and approved for any relevant course |
| Authentication and supervised identity | No production identity or role-based permissions. Add an approved privacy-conscious backend and access controls |
| Immutable records and audit trail | Current JSON can be edited. Add tamper-evident signed server-side records, verified time, versioned app/syllabus and device data, retention policies |
| Instructor verification | No instructor sign-off. Add authorised instructor roles, evidence review, assessment comments, and explicit approve/reject workflow |
| Student accessibility and safeguarding | Finish keyboard/screen-reader/switch-device testing, usability studies and appropriate minor/guardian protections |
| Examination integrity | Add approved exam banks, randomisation, identity controls, question/answer audit and proctoring only if authorised and appropriate |
| Aircraft-specific fidelity | Validate and document each instrument/aircraft model against official AFM/POH and manufacturer data |
| FSTD/ATD qualification | Current browser module is **not** qualified. Hardware fidelity, task-to-tool validation, regulatory evidence and authority review are separate requirements |
| Regional approval | SLCAA, FAA, EASA and UK CAA requirements differ. Engage regulators and/or partner with an approved school rather than claiming worldwide equivalence |

### Review workflow for the future

1. **Define and version** a syllabus objective using a source-backed training standard.
2. **Review and validate** the simulated behavior on representative devices and real controls with competent instructors.
3. **Collect evidence** through a secure authenticated backend, not editable browser files.
4. **Conduct instructor assessments** using approved rubrics, human sign-off and audit logs.
5. **Submit to the relevant competent authority** or operate under a suitable authorised provider, only to the extent formally permitted.
6. **Publish claims only after verification** from regulator records and formal correspondence.

For a regional comparison and explicit status of each authority route, see [Regulatory readiness and competitive benchmark](ACCREDITATION-READINESS.md) and the live [Standards and accreditation readiness](../standards-readiness.html) page.

## Engineering acceptance checks

- Node-based tests cover positive, negative and incomplete results for all five tasks.
- Browser automation covers desktop and narrow touchscreen layouts, yoke/joystick controls, PFD visibility, task switching and unsigned JSON download.
- Every report carries an unambiguous **unofficial practice** notice.
- The grading engine does not require browser storage, student IDs, internet access or paid services.
- Task selection resets its illustrative flight state, preventing one task's conditions from contaminating the next.

**Important:** a passing synthetic task is only an interactive learning aid. It is not training completion, a proficiency check, an exam pass, certified hours, or an official credential.


## V3.7 — Automated coaching and optional on-device practice journal

The existing timed skills exercises now maintain a short-lived, in-memory 0.1-second observation series. An **automated practice coach** uses the series to give criterion-specific feedback (for example, pitch, bank, airspeed, coordination, climb/descent rate or flap travel), highlight weak indications and suggest what to practise next. This is machine-generated feedback, not instructor supervision or human assessment.

The student may explicitly click **Save attempt on this device** after completing or ending a task. A local browser journal then contains only:

- Practice objective, time saved, synthetic percentage and illustrative outcome.
- Summary of automated feedback, weak criteria and two recommended next steps.
- A browser-local random record identifier. No name, account number, date of birth, school ID, email, address or instructor signature.

The journal is **opt-in**. It is not created automatically, has a maximum of **20 entries** (the oldest are discarded if more are saved), and remains only in the browser's `localStorage` at the academy origin. It offers **Delete entry**, two-step **Delete all**, and **Download journal JSON**. A refresh preserves the selected saved entries if local storage is enabled. Clearing site data, switching browser/device, private browsing or unavailable storage can erase or block them. Shared devices expose journal records to other users of the same browser profile. No records are uploaded to GitHub or to a backend.

**Technical file:** `cockpit-v3-journal.js`; storage schema `agsa.local-journal.v1`. The journal is unverified and user-editable: no hash, signature, audit log or evidence of a student's identity. It is **not an official training record** and is not suitable as a compliance ledger.

To convert this into legitimate provider-managed training records later, a qualified school would need an approved syllabus, role-based permissions, explicit student identity verification, instructor review and sign-off, evidence retention schedule, tamper-evident server records, privacy/security controls, accessibility and human evaluation. All legal/approval claims must be reviewed with the relevant regulator and school partners.

**Engineering checks:** `scripts/test-cockpit-coach-journal.mjs` validates the feedback engine and storage, including corrupt data handling and simulated storage access errors; `scripts/test-cockpit-journal-browser.mjs` tests desktop and mobile browser consent, persistence, export and deletion via a local HTTP test server. No production database or cloud account is used.

## V3.8 — Practice report review workbench (prototype)

The public [Practice Report Review Workspace](../instructor-review.html) provides a manual **unverified feedback draft** workflow. It accepts two file schemas:

- `agsa.practice-observation.v1` — an individual, unsigned Skills Practice JSON report.
- `agsa.local-journal.v1` — a local practice journal export, limited to 20 summary entries.

The intake enforces JSON syntax, a **256 KB maximum file size**, supported training task IDs, bounded observation numbers and supported outcome values. All imported text is rendered as **literal text**, never executable HTML. Imported reports are explicitly treated as **untrusted** and user-editable, regardless of origin.

The workspace shows claimed exercise details, score, timestamp, available synthetic indications and prior automated suggestions. A reviewer can select three non-authoritative **discussion rubric prompts** (instrument scanning, control coordination, safety/decisions), type coaching notes and export an `agsa.unverified-review-draft.v1` JSON document. Drafts always carry a conspicuous no-signature/no-credit declaration. A review must contain at least one note or next action to export.

**Not implemented:** real authenticated instructor accounts, verified student identity, document signatures, school records, approved curriculum assessment criteria, record retention, secure multi-organisation access or a real training administration backend. The workspace keeps imports and edits in browser memory only and deliberately does **not** persist them to local storage or any server.

See [Secure Student Records Engineering Blueprint](STUDENT-RECORDS-ARCHITECTURE.md) for the proposed protected API, role model, database entities, auditing, privacy and future regulatory process. It is design material, not deployed functionality.

**Automated checks:** `scripts/test-instructor-review.mjs` tests parsing, safety validation and review schemas. `scripts/test-instructor-review-browser.mjs` tests actual file import, unsupported/oversized files, untrusted markup escaping, desktop/mobile interactions, import clearing and download of unverified JSON.
