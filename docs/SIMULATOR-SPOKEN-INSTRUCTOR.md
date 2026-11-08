# Optional spoken instructor for the simulator's guided exercises

**Release scope:** Public, browser-local narration of the **four existing** model-backed flight-concept self-checks. This does not replace any instructional content or assess a student. All four exercises retain `SME_REVIEW_REQUIRED`.

## How to use it

1. Open [Immersive Flight Simulator](../flight-sim.html) and choose a fixed-wing yoke or stick.
2. Select **Experimental · lift, drag and energy**. The existing **Guided flight-physics explorations** panel appears.
3. Expand **Optional spoken instructor · your device voice**. This section is collapsed by default.
4. Choose **Air Scouts & first-time learners** or **Aviation enthusiasts & aspiring pilots** as the voice introduction style, and select a pace.
5. Press **Hear lesson** for the existing objective, observation setup and self-check question. Press **Hear comparison** after **Apply Reference** and **Apply Comparison** to hear the model's calculated evidence. Press **Hear feedback** after answering for the current conceptual explanation.
6. Use **Stop voice** to cancel device narration. Narration also stops when the exercise, reference/comparison setup or browser visibility changes.

**Nothing speaks automatically.** Speech is attempted only when the student presses one of the three narration buttons. The main text remains visible whether or not the browser can speak.

## Product and privacy boundaries

- Uses feature-detected browser `speechSynthesis` and `SpeechSynthesisUtterance`, not a microphone, proprietary generated voice, live generative AI chat, instructor video call, recorded audio file, chatbot or external Academy narration API.
- The Academy app does not collect voice recordings, send a speech request itself, save generated audio, persist voice settings or transmit student identity/telemetry. Operating systems and browser voice providers may implement synthesis differently, including platform-managed voices; users should follow their device's own voice privacy settings.
- Requires a user gesture. Some browsers and phones offer no spoken synthesis, block it or supply different voice accents. All buttons disable automatically if unsupported, with a textual fallback. Using a British English narration hint does **not** guarantee any particular accent or language pack.
- A narration pace selector changes speed from 80% to 100%; it does not change the model's physics, profile, scores, answers or feedback. No student grades are created.
- All narrated content is authored text already associated with the four educational exercises, plus model-generated comparison figures. A mandatory, length-protected notice explains that the instruction is unsigned and awaits expert review. This cannot be described as a certified human/AI flight instructor, qualified curriculum or actual aircraft procedure.
- The spoken controls live inside the current exercise panel. They do not overlay the outside view, PFD, phone two-thumb controls, independent rudder pedals, or 3D/2D visual selection.

## Automated acceptance and physical-device checks

- `node scripts/test-flight-sim-instructor-voice.mjs` validates all four scripts, Air Scouts vs pilot phrasing, comparison and explanation text, length caps, and the always-present subject-review/non-assessment notice.
- `node scripts/test-flight-sim-instructor-voice-browser.mjs` uses a stubbed browser speech engine to verify **zero automatic speech**, explicit button playback, pace, feedback, immediate cancellation on scenario changes, and stop-on-page-hidden. It also tests a simulated 390px touch phone where speech synthesis is missing; all four text-only self-check functions remain available.
- Existing GitHub site and simulator browser tests must pass. Physical-device voice playback has not yet been verified on real Android/iPhone browsers. It requires testing with different device speech engines, Bluetooth audio, language packages, privacy choices, inaccessible voices, foreground/background changes, low-memory devices, accessibility screen readers, and phone vibration/gamepad interactions.

## Instructor-review gate

The new narration is an alternative presentation of existing content; it has **no instructor sign-off**. A suitably qualified aviation subject-matter expert should review the technical concepts, educational level for Scouts versus aspiring pilots, clarity of CG and lift/drag explanations, screen-reader interactions, and boundaries between simulated figures and real aircraft operations. Approval records must come from authorized personnel; this page neither fabricates approval nor grants accreditation.
