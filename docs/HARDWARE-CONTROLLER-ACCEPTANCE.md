# Optional hardware controllers in the Immersive Flight Simulator

**Status:** browser-only educational controller-input prototype. The simulated aircraft is fictional and the attached hardware is **not calibrated as an aviation flight training device**, even if it physically resembles a yoke, joystick, throttle quadrant, rudder pedals or cyclic.

## Connect and test

1. Open [Immersive Flight Simulator](../flight-sim.html) from the Academy website in a browser that supports the [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API).
2. Plug in or pair a supported USB/Bluetooth controller with the computer or mobile device. Browser visibility may require moving a stick or pressing a controller button while the page is focused.
3. Open **USB / Bluetooth joystick and gamepad support**, then choose **Enable controller**. This is an explicit opt-in and nothing is read from the Gamepad API before the learner enables it.
4. Select **Controller 1**, or another anonymous controller if more than one is visible. The app never displays device ID, serial number, manufacturer or controller identifier.
5. Inspect and set bank/pitch/rudder axis mapping. The initial mapping is bank axis 0, pitch axis 1, rudder axis 2. Some gamepads have only 2 axes, or do not expose pedals; choose **Disabled / touch rudder** for a missing rudder axis.
6. Leave the throttle/collective power axis on **Triggers 6/7** for a common gamepad or explicitly assign a single axis (0–7). When assigned, the full -1..+1 axis drives 0–100% power. On some controllers the lever moves in the opposite direction; check the live values before attempting any fictional exercise. No reverse-power mapping is provided yet.
7. Release all sticks/pedals. If the neutral indications drift, choose **Set neutral**. This accepts small centre offsets only (not controls held significantly to the side). You can choose a larger deadzone or reverse the pitch direction if your hardware requires it.
8. Use the live readout to verify direction before attempting the fictional runway/helipad exercise. Desktop mouse, phone touch and keyboard remain available. While **actively held**, a mouse/touch yoke or rudder pedal takes precedence over the hardware controller on those channels.
9. Press **Disable controller** when finished. Hardware disconnect while actively flying pauses the simulator, clears held commands and requires a deliberate re-enable before hardware can control the flight again.

## What is and is not supported

The app polls `navigator.getGamepads()` only after opt-in and only on the focused page. The standard browser API provides axes typically in the range -1..+1 and analogue/digital button values. Axis and button numbering vary by controller and browser: devices can be unavailable or require user interaction to appear. A disconnected gamepad can be represented by a `null` array slot. No browser integration is guaranteed for proprietary HOTAS, flight-control pedals, force-feedback devices, Bluetooth controllers on every phone, or unusual vendor HID protocols.

This upgrade **does not use WebHID, USB device descriptors, vendor serials, local storage, remote telemetry, microphone, GPS or payment providers**. It never saves or transmits hardware identifiers, control histories or calibration. All setup is page-local and is reset when the page is reloaded.

Keyboard controls and the touch pad do not depend on a connected controller. A controller may command bank, pitch, optional rudder and power/collective. The usual gamepad face button 0 acts as the fictional wheel brake; 6/7 increment/decrement power when no power axis is selected. This is for the simplified educational simulation only, not real-world procedures.

### Safety and teaching limitations

- Aircraft-shaped drawings do not confer real aircraft handling fidelity. Gamepad axis shapes are not validated for a real aircraft, qualified simulator, type rating or approved training.
- The simulated flight model has invented performance; its low-energy, height, descent and landing cues cannot guide real flights.
- The simulator pauses on a detected hardware controller disconnect while using it. Browser/device disconnection notification may be delayed or unavailable.
- Do not put real student identity or children’s personal information into this public browser page.

## Automated tests

- `node scripts/test-flight-sim-gamepad.mjs` verifies zero Gamepad API reads before opt-in, configured maps, deadzones, centre calibration, reverse pitch, trigger power, analogue power, button brake, disconnection and permission-policy failures.
- `node scripts/test-flight-sim-gamepad-browser.mjs` uses synthetic Gamepad API data inside desktop Chromium to verify matching graph and control values, phone/touch priority, idle/deadzone, mapping changes, throttle/collective, pause-on-loss and a 390px phone fallback.
- The existing flight-simulator unit and browser suites continue to validate scenery, haptic opt-in, takeoff, landing and instruments.

**Physical acceptance remains required** on a real Windows/Mac/Linux PC with an actual joystick/gamepad and, separately, on any Android phone intended to use an external Bluetooth controller. Browser-emulated hardware support does not prove that a specific physical yoke, pedals or helicopter cyclic works on the target OS. Verify left/right pitch/roll direction, rudder, idle and full power, disconnect behaviour, and touchscreen takeover.
