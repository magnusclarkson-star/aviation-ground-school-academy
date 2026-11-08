# Simulator conceptual exercise content: SME review checklist

**Public status: `SME_REVIEW_REQUIRED` — NOT APPROVED.** This is a development package for independent subject-matter-expert review, not an assertion that an aviation instructor has inspected or approved any lesson. Students see ungraded self-checks against fabricated numbers. No flight-training credit, licence endorsement, proficiency or certificate can be awarded.

## Four candidate learning activities

| Candidate activity | Student investigation | Machine-generated check | Independent review still required |
| --- | --- | --- | --- |
| 01 · Moving a load aft | Transfer 40 kg from fictional rear occupant to farther-aft bags without changing mass | Mass constant, imaginary CG moves aft, total mass moment rises | Are the directions of moment/CG correctly and clearly explained? Is the arbitrary datum or MAC potentially misleading? |
| 02 · Mass and wing loading | Add imaginary occupant and bag mass with wing area fixed | Total mass and kg/m² increase | Is the distinction between mass-per-wing-area and **aerodynamic load factor** clear? Does this avoid implying specific takeoff/landing speeds? |
| 03 · Imaginary fuel reduction | Compare 75 kg to 25 kg at the model's invented forward-of-CG fuel arm | Mass decreases and imaginary CG moves aft | Is the fuel-position illustration accurate as a hypothetical? Does text avoid implying *all* aircraft behave this way? |
| 04 · Flap lift/drag coefficients | Compare fictional 0° and 30° flap selection at a fixed, invented 4° angle of attack | Invented CL and CD both increase | Does this avoid claiming real performance, universally appropriate flap settings, or approved stall/takeoff/landing technique? |

The reference and comparison are two **separately reset simulated setups**, not a real fuel transfer, active in-flight relocation of people, or validated flight experiment. The exercise requires **both observations before showing a self-check result**; after manual loading or flap changes, old observations are cleared so a prior answer cannot be misrepresented as current evidence. Changing aircraft mode or airframe profile also clears the current comparison.

## Instructor / SME review workflow

A suitably qualified aviation instructor or relevant aerospace engineering subject-matter expert should inspect the source code, run all four experiments, and document their findings outside the public learner page. Before any change from `SME_REVIEW_REQUIRED` could be considered, record:

1. Reviewer role, qualifications relevant to each specific concept, date, lesson code version/commit, and a verified review identity *in the private review process*, never in the public JavaScript.
2. Independent numeric checks of mass moments and CG using the **explicitly invented station arms**, plus qualitative review of the educational conclusions.
3. Clarity that the CG band, aerodynamic coefficients and load-factor figures are **not actual aircraft performance or safe limits**, particularly for young learners and Air Scouts.
4. Review of the four question prompts, options, explanations, expected answer, and feedback language for age appropriateness and clear instructional boundaries.
5. Accessibility and mobile usability on representative devices, including reading controls aloud, visible focus, label clarity, touch targets, low bandwidth, and fallbacks when 3D/GPU is unavailable.
6. Evidence of whether the content is approved for **conceptual demonstration only**, requires correction, or should be withheld until further review. A separate curriculum policy and authorization step are required before publication as approved training.

No reviewer has been assigned or signed these lessons through this implementation. The public status intentionally remains `SME_REVIEW_REQUIRED`. Do not present an automated browser test or AI-generated rationale as a qualified instructor sign-off.

## Privacy and integrity controls

All four exercises run fully in the browser. The observations are **page-memory only**, not a persistent student journal and not an authenticated record. The machine-generated comparison is not a grade; it is a local consistency check against invented model calculations. No personally identifying data, school roster, minors' profiles, score, telemetry history or device information is sent to a server or exported. A learner can edit all values and repeat all checks without limits.

The exercise scripts require the existing fictional loading and aerodynamics modules, and reuse their values. Independent validation of actual aircraft would require type-specific approved manuals and professionally validated models; not simply editing these example values.

## Release acceptance

- `scripts/test-flight-sim-exercises.mjs` validates reference and comparison calculations for each of the three fictional profiles, observations required before checking, incorrect/matching answer paths, invalid configurations, stale-result clearing, the review status and absence of training-credit claims.
- `scripts/test-flight-sim-exercises-browser.mjs` validates all four exercises on Chromium, manual slider/flap invalidation, profile and aircraft-type switching, default Classic mode isolation, 390 px phone touch layout, visual instrument compatibility and lightweight 2D fallback.
- The full Academy site check and every existing simulator browser regression must pass before merge. This is a software release check, not educational or aeronautical content approval.

### Future work

A verified instructor review queue and private content approval service may be added later. Such a service would need **real authenticated reviewer identity, role boundaries, immutable audit history, versioned lesson approvals and safeguards for minors**, none of which are supplied by GitHub Pages or these public static scripts. Until then, every exercise is explicitly a pending-review educational prototype.
