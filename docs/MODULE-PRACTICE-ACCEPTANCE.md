# Introductory ground-school module practice — private to this browser

This release adds [four module checkpoints](../ground-school-modules.html) to the public Academy prototype. It is **not** an accredited theory course, an examination, a genuine instructor assessment, or evidence of training hours.

## Study structure

Each of the **four modules** contains two of the eight currently public introductory lesson drafts, followed by **six deliberately human-authored multiple-choice questions** (three questions per lesson, 24 total):

| Module | Lesson topics |
|---|---|
| Aircraft and forces | Four forces; anatomy and basic aircraft components |
| Controls and instruments | Yoke, joystick, pedals and throttle; primary instruments |
| Configuration and preparation | Flaps and drag; responsible preflight preparation |
| Weather and communications | METARs and TAFs; radio and authorised ATC communication |

The optional Scouts / Air Scouts order is Foundations → Cockpit → Weather/Comms → Configuration. The aviation enthusiast / aspiring pilot order is Foundations → Cockpit → Configuration → Weather/Comms. This is an **order of introductory educational topics**, not an age-verification or regulated youth syllabus. Every module remains accessible without locking progress.

The browser checks all six answers at once, shows the correct responses and explanation of each, and permits unlimited retakes. A **5/6** threshold is displayed as a **local practice target**, never a competent-pilot judgement or official examination result. The existing [curated lesson studio](../ai-instructor.html) offers optional synthetic device narration and links back to the study.

## Storage and confidentiality

- Scores are recorded only when the user clicks **Check my six answers**. Incomplete quizzes are not recorded.
- Local storage key: `agsa.groundschool.moduleAttempts.v1`; record fields: module identifier, content revision, number correct out of six, and local timestamp. **No name, birth date, contact information, account or learner identifier is collected**.
- At most 48 recent records from the **current assessment revision** are retained. Older content revisions and malformed records are ignored to prevent presenting obsolete material as current progress.
- Each route uses the same eight lessons and hence the same local scores. Switching paths changes suggested study order, not the validity or origin of recorded practice.
- Learners may explicitly clear saved history or download **unsigned editable JSON** (`agsa.local-module-checkpoints.v1`) containing results and a non-accreditation warning. Anyone with access to that browser/device may inspect or clear progress. A downloaded file is **not a school training record** and can be changed.
- Where browser storage is disabled, the exercises work for the current page session, and the UI indicates results cannot persist.
- No Academy API, account registration, generative AI model, microphone, live payment or identity verification is required for this page. Do not treat the public module practice as a protected place for real children's personal information.

## Review and future launch requirements

Current lessons, question wording and reference links remain marked `SME_REVIEW_REQUIRED`. Before this could be graded instruction, a verified qualified subject-matter instructor would need to check accuracy and distractors, assess bias and youth comprehension, inspect current source chapters and the approved jurisdictional curriculum, and issue signed release approval. An independent identity-controlled service would then be needed for assessments, proctoring if required, consent, safeguarding, access logs, tamper-resistant records and retention/deletion workflows. None of those are implemented by these public self-checks.

Before allowing children into connected AI lessons or personal accounts, meet applicable safeguarding, guardian consent, privacy and instructor oversight requirements. Do not use these quizzes to make real flight decisions or teach aircraft-specific procedures.

## Acceptance checks

- `node scripts/test-ground-school-modules.mjs` covers 24 questions, the two ordered routes, answer validation, score thresholds, repeated checks, local storage validation, revision expiry, deletion and unsigned data export.
- `node scripts/test-ground-school-modules-browser.mjs` checks desktop and 390px emulated touchscreen interaction, six-answer validation, score feedback, local persistence across reloads, retakes, route switching, export, deletion and phone overflow.
- GitHub Actions runs both in the site and AI Instructor browser checks; the Pages packaging tests ensure the new public page is included and private Academy backend files are excluded.

**Physical device acceptance still required:** Open the module page on an Android phone and an iPhone, choose both learning routes, scroll to the questions, submit and retake, and verify text readability, keyboard/touch selection and locally saved scores after reloading. Browser emulation does not establish actual-device behaviour.
