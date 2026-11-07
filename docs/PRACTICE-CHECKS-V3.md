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
