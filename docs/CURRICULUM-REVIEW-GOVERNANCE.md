# Academy Curriculum: content review and evidence workflow

**Status:** educational prototype with eight introductory guided tutor lessons, each carrying a dated draft revision, three learning objectives, an activity, a safety limitation and official-publisher reading pointers. These are **not** approved lessons, approved syllabi, training records, regulatory crosswalks or endorsements by an aviation authority.

## Authoring model

- Source of displayed lesson text and quiz questions: `ai-instructor-lessons.js`.
- Companion metadata and reviewed-reference *pointers*: `ai-instructor-curriculum.js`.
- Public learner view: `ai-instructor.html`; optional human review discussion worksheet: `curriculum-review.html`.
- All eight records are deliberately labelled `SME_REVIEW_REQUIRED`. A runtime validation check fails when a lesson lacks metadata, objectives, a scope warning or a source from the current allowlist.
- Source links are **publisher landing pages**; a reviewer must select and verify current chapters, editions and jurisdictional applicability. Links do not establish factual claim verification or regulatory approval.
- Private student/instructor accounts and signed curriculum approval **do not exist on the public page**. The other instructor-review page evaluates unverified simulator practice exports, not textbook correctness.

## Proposed real-world review gates

1. **Teaching editor** supplies learning level, objectives, subject outline, instructional activity, checkpoint question, explanation and known limitations; updates a draft revision in Git.
2. **Qualified aviation subject-matter expert** checks each factual statement against specific passages of the current source, logs document editions and chapter/section pointers, and records changes to aircraft-specific assumptions.
3. **Training/safety reviewer** independently checks the non-operational boundaries, misuse risk, youth-appropriate language, accessibility and whether all exercises are clearly ungraded simulations.
4. **Jurisdictional specialist** decides whether a proposed future course should map to FAA, EASA, Sierra Leone's competent authority or another jurisdiction. Until that review, keep references descriptive only, never claim equivalent training or credit.
5. **Curriculum owner** resolves issues in a GitHub pull request, requires documented review/approval from verified authorised personnel, signs off on a versioned release and ensures corrections/tests are recorded. None of this sign-off is automated or simulated by the current public worksheet.
6. **Publication owner** controls releases and establishes rollback/incident reporting for unsafe or outdated lessons. Changes to source regulations require a fresh impact review.

### Current free public review worksheet

Open `curriculum-review.html?lesson=flaps`, select a lesson and inspect the actual text, three objectives, quiz and official reference pointers. The six discussion dimensions are technical accuracy, objective alignment, source traceability, safety boundary, youth accessibility, and jurisdictional scope. The operator can add corrections and download an `agsa.unsigned-curriculum-review.v1` JSON document.

This artifact is deliberately marked `UNVERIFIED_DRAFT_ONLY`; it has no qualified reviewer identity, authenticated signature, regulatory status or student record. It is not uploaded anywhere by the public app. Anyone can alter it, so do not treat an exported draft as evidence of review or approval.

## Official reference pointers verified 8 November 2026

- FAA [Pilot's Handbook of Aeronautical Knowledge, FAA-H-8083-25C](https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak), with publisher chapter links for aerodynamics, flight controls, aircraft systems, instruments, flight manuals, and weather.
- FAA [Airplane Flying Handbook, FAA-H-8083-3C](https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook), with chapters on ground operations and basic manoeuvres.
- FAA [Aeronautical Information Manual](https://www.faa.gov/air_traffic/publications/atpubs/aim_html/index.html), showing the publisher's effective date and updates for United States communications context.
- EASA [Easy Access Rules for Aircrew, October 2026 revision](https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-aircrew) for later *regulatory mapping consideration*, not as a claim that these Academy lessons satisfy any Part-FCL requirement.

Aviation references must be checked afresh before instructor publication. FAA/AIM procedures and EASA rules cannot be applied automatically to Sierra Leone or any other jurisdiction; consult the competent national aviation authority and specific current approved manuals.

## Regression controls

- `scripts/test-curriculum.mjs`: checks eight lesson IDs, draft revision tags, objectives, activities, source allowlist, quiz alignment and unsigned export constraints.
- `scripts/test-ai-instructor.mjs`: checks answer matching and quizzes for all eight lessons.
- `scripts/test-ai-instructor-browser.mjs`: checks browser objectives/sources, local progress protection, a 390px learner display and a locally downloaded unsigned review draft.
- GitHub Actions `Check Academy Site` and `AI Instructor Browser Tests` run the checks before proposed merges and again on changes to main.

These tests do **not** validate subject truth, accessibility compliance, instructor licensing or school accreditation. Human reviews and regulatory approval remain separate requirements.
