# Academy Ground-School Coursebook — 2026-11-13

## Implementation

A separate **12-module introductory ground-school course** at `academy-coursebook.html` supplements—not replaces—the existing four introductory checkpoint modules at `ground-school-modules.html`. It contains 36 original educational lesson sections (three per module), 36 three-option questions (three per module), 12 study activities and three learning objectives per module.

Both **Scouts/Air Scouts** and **aviation enthusiasts/aspiring pilots** can select an appropriate order of the same course content. Learners can navigate modules, search by topic, hear lessons via device speech synthesis, answer a knowledge check, retake it, review explanations, see suggested next modules, export unsigned local progress, or clear the record.

The 12 modules cover orientation/safety culture; aircraft structures; aerodynamics; powerplants/systems; flight instruments; meteorology; navigation; airspace/airports/regulations; radio communications; loading/performance; human factors; and helicopter/R44 familiarity. The FAA Pilot's Handbook of Aeronautical Knowledge is an independent reading pointer, not proof of syllabus equivalence or Academy approval. Reference: https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak.

## Implementation boundaries

- **Draft only:** All modules carry `SME_REVIEW_REQUIRED`. Content is introductory, not enough by itself for PPL/CPL/ATPL knowledge training, an approved ground-school syllabus, accreditation or operational flying instructions.
- **No youth data:** Local attempts have module ID, revision, correct count and timestamp. No personal names, ages, contacts, student profiles or remote calls are collected. Local storage is unverified; private/shared-device access matters.
- **No final exams or certificates:** A 2/3 target is a revision cue only. There is no identity-verification, proctoring, audit trail, instructor sign-off, official hours or issuance.
- **Course structures and references:** Official local curricula and current training references require qualified review. Region-specific licensing and procedures differ. Helicopter and military aircraft require separate specialist materials, qualified instructors and approvals.
- **UI and release:** Responsive static site; all data bundled for offline-capable reading once assets have loaded; narration availability depends on the device. Homepage and GitHub Pages package checks include the new page. Approved existing flight-simulator models and cockpit layouts are not changed.

## Automated acceptance

`node --check academy-coursebook-data.js`

`node --check academy-coursebook.js`

`node scripts/test-academy-coursebook.mjs`

`node scripts/build-pages.mjs` (requires existing V3 build), then `node scripts/test-pages-package.mjs`.

**Manual acceptance remaining:** Test Android portrait/landscape, question selection and retake, browser-local progress after reload, route switching, device narration and export. Qualified aviation subject-matter review must occur before this content is described as approved instruction.
