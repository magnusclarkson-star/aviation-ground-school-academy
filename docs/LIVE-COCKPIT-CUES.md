# Cockpit live practice cues (V3)

## Purpose and learner experience

The optional contextual coach provides **short written prompts alongside the primary flight display** during the fictional 12-second skills observation. It is designed so phone and desktop learners do not have to scroll away from the moving instruments or the operating controls to read the cue.

- Written prompts appear during a self-practice observation and remain available even when audio is off or unsupported.
- Learners may explicitly select **Enable spoken practice cues** before or during an attempt. Voice is disabled by default and resets when the exercise or cockpit mode is changed.
- Speech is synthetic on-device browser text-to-speech; it does **not** connect to an online AI voice service.
- Spoken cues start no sooner than one second into the observation, are separated by at least 3.5 simulated exercise seconds and do not repeat an unchanged cue until seven seconds have passed.
- On pause, end, task change, mode change, browser blur or page hide, live speech is cancelled or disabled. The written prompts remain available.
- The post-observation review and its optional spoken summary remain separate controls.

## Teaching and safety boundaries

The cue selection is deterministic and uses the same fictional instrument practice variables as the skills exercises: pitch, roll, indicated speed, vertical speed, turn rate, slip/skid, selected/indicated flaps and relative drag. It does not alter flight controls or make aircraft-specific operating recommendations. Thresholds are illustrative **not** approved procedures, checkride standards, simulator qualification or licence credit.

No user identity, microphone recording, student grades or live telemetry is uploaded by the new cue module. The module does not store personal data or call a backend. If certified instruction or formal assessment is offered later, this functionality requires subject-matter expert review and independently versioned, approved training content.

## Verification

- `scripts/test-cockpit-live-cues.mjs` checks every task's cue selection and spoken-cue pacing.
- `scripts/test-cockpit-live-cues-browser.mjs` checks opt-in only, mute, completion and visible cues next to the PFD on desktop and a 390px touchscreen emulation.
- Both suites are included in GitHub Actions site and browser workflows.

Manual physical-device validation remains required for actual Android/iOS speech availability, viewport usability and simultaneous multi-touch operation. The browser automation does not substitute for that acceptance test.
