# Course 07 — Navigation and Flight Planning Concepts: pictorial practical

**Added:** 14 November 2026 · **Course status:** `SME_REVIEW_REQUIRED` · **Module:** `navigation`

## Existing Academy content preserved

Course 07 builds upon the existing core lessons, extended reading, quizzes and pictured teaching materials. It adds a compact **picture-led navigation practical** beneath Study Activity in `academy-coursebook.html?module=navigation`. No existing lesson text, approved aircraft/rotorcraft/fighter models, cockpit arrangements, certificate artwork, learning scores, route order or fee controls have been replaced. The corrected **Courses 1 through 12 order** remains unchanged.

Six image views use only the owner's already approved original Academy atlas panels: `overview-05`, `detail-05`, and `detail-12`. Images may be enlarged via touch; no new source picture is inserted.

## Four new illustrated exercises

| Exercise | Original picture(s) | Student task |
|---|---|---|
| Read charts and position references | `overview-05`, `detail-05` | Identify coordinate, true/magnetic direction, scale, effective-date and official-source questions |
| Compare heading, track and wind drift | `overview-05` | Compare wind FROM and direction of motion with fictional true heading and desired eastbound ground track |
| Estimate time and groundspeed | `detail-12` | Adjust fictional distance and average groundspeed and observe nautical-mile / knot / minute arithmetic |
| Verify a drawn route | `detail-05`, `detail-12` | Explain why an imaginary route crossing an unknown-permission training area is not airspace clearance |

Each exercise includes three choices, corrective feedback, an expandable vocabulary guide, separate Air Scout and aspiring-pilot cues, and an original-picture enlargement. None is an accredited examination or a flight-planning release gate.

## Interactive map and calculations — explicitly synthetic

The fictional eastbound leg is **Training Point A → Training Point B**, on **090° TRUE**. It is **not a real geographical location**, mapping product or current aeronautical chart.

The interactive map draws a blue desired ground-track arrow and a gold illustrative true-heading arrow. Students can select winds reported FROM 000°, 090°, 180° or 270° true, with a deliberately bounded **0–25 kt** speed and fixed hypothetical true airspeed of **90 kt**. The underlying two-dimensional steady-wind triangle is:

- Wind vector points **toward** the direction opposite reported wind FROM.
- Cross-track wind component must be cancelled by an opposing air-relative component.
- (WCA = \arcsin(-W_{\mathrm{right}}/TAS)\).
- (Heading_{TRUE} = Track_{TRUE} + WCA\).
- (Groundspeed = TAS \cos(WCA) + W_{\mathrm{along}}\).

For example, wind **FROM 000° at 20 kt** across an eastbound track yields an idealised true heading of about **077.2°** and groundspeed **87.7 kt**. Wind **FROM 180° at 20 kt** yields about **102.8°**. Headwind FROM 090° at 20 kt yields 70 kt ground speed; tailwind FROM 270° at 20 kt yields 110 kt.

A second student-controlled card estimates time for invented legs **45–120 NM** and fixed assumed average groundspeeds **60–120 kt**, in 15-unit steps. It applies only (t_{minutes}=60\times distance_{NM}/groundspeed_{kt}\). A 90 NM leg at 60 kt therefore gives 90 minutes. It does **not** model real wind variability, climb/descent, fuel consumption, legal reserves, obstacles, aircraft limits, airspace entry, flight permission or route terrain.

All graphical route points are synthetic; the Academy does not request, transmit, display or retain learner GPS coordinates. The course uses no live flight, airspace, geolocation or meteorology APIs.

## Source checking for academic review

Suggested source families for review (not an accreditation claim):

- FAA Pilot's Handbook of Aeronautical Knowledge, chapters on navigation, charts, pilotage and dead reckoning: https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak
- FAA Aeronautical Chart Users' Guide and current official charts (jurisdiction-specific; do not substitute US procedures for Sierra Leone): https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/aero_guide/
- State AIP, published NOTAMs, chart effective dates, airspace and terrain information from the relevant civil aviation authority before any real operation.

The original Academy chart artwork is **illustrative only** and must not be mistaken for a current aeronautical chart.

## Access and review boundaries

- The existing `academy-in-app-notes.css` print and Save-as-PDF guard continues to suppress actual teaching notes and diagrams in browser print output. No note-export feature is added.
- Student answers and the synthetic calculators are kept **only in current-page memory**; there is no report download, personal record, network upload or navigation data export.
- A publicly hosted site cannot fully stop screen captures, copy/paste or reading its own web source. Authenticated private lesson delivery is required for stronger content access control.
- Existing licensed/certified issuance and three approved certificate designs are not changed.

### Acceptance tests

- [x] Four correct/wrong-choice sets, six immutable original picture views.
- [x] True-heading calculation checks for north/south crosswind and east/west head/tailwind, including boundary/invalid input checks at all available sliders.
- [x] Time-distance calculation tests for both ends of the slider bounds and common classroom arithmetic.
- [x] Desktop Chromium navigation, touch-to-zoom, fictional map canvas, sliders, answer feedback, 390px phone touch, subject isolation and browser print suppression.
- [ ] Qualified navigation instructor validates examples, true/magnetic references and source citations against applicable current guidance.
- [ ] Air Scout safeguarding, screen-reader accessibility and real Android landscape/portrait review by human testers.
- [ ] Academy academic owner approval and, where applicable, independent regulator review before any accredited claim.

**Next recommended subject:** Course 08 — Airspace, Airports and Aviation Rules.
