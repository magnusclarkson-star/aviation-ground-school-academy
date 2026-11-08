# Cockpit V3: phone multi-touch control acceptance

## Learner experience

The educational cockpit uses one shared model for analogue instruments, the PFD and its controls. In instrument skills, **Straight and level** and **Controlled bank and turn** put the joystick/yoke and rudder pedals side by side on narrow phone screens so students can operate both without losing the sticky glass display. The Turn/Slip and Heading digital instrument focus also pairs the controls.

- One finger may start anywhere on the marked control pad, not just the centre grip, and drag to command pitch and bank.
- A second finger can hold LEFT or RIGHT rudder simultaneously. Its independent release must not centre the yoke.
- Releasing the pad finger centres the yoke, and releasing a rudder finger centres the rudder. An unrelated pointer release cannot cancel another held control.
- A small readout immediately beside the PFD shows **commanded** bank/pitch/rudder percentages and selected flap detent. Aircraft instrument indications respond over simulated time and are not the same as command percentages.
- Yoke and joystick are alternative layouts that feed the same educational control model. Other focused exercises continue to show only relevant controls.
- Desktop mouse dragging and keyboard control remain available. This is a fictional, simplified exercise—not a certified simulator, type-specific manoeuvre model, or licensing assessment.

## Automated coverage

`node scripts/test-cockpit-multitouch-browser.mjs` runs in Playwright Chromium configured as a 390px touch device. It dispatches overlapping CDP touch events to confirm yoke, rudder, PFD slip, independent input release, cancellation, and the paired phone layout. The normal cockpit browser workflow runs this test on PRs and main pushes.

## Manual hardware test (still required)

On an actual Android phone, open `cockpit-v3.html?mode=skills`, select **Controlled bank and turn**, and select **Joystick**. Move the pad with one thumb while holding a rudder button with the other. Confirm: instrument horizon/bank and slip indicator change, the command line shows both input channels, lifting one thumb releases only that channel, and the PFD remains visible. Repeat on iPhone Safari and an Android Chrome version if available. Check portrait and landscape. Touchscreen emulation does not prove real simultaneous input on every OS/browser, and actual hardware testing remains a release-acceptance requirement.

Do not use this application to guide or simulate real flight operations, teach approved aircraft-specific procedures, or claim credit toward any pilot certificate.
