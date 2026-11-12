# Eurofighter Typhoon source airframe attribution

This repository includes a compact editable exterior geometry derivative of the FlightGear Eurofighter Typhoon aircraft maintained by [IAHM-COL/EF-Typhoon](https://github.com/IAHM-COL/EF-Typhoon).

- **Upstream model:** `Models/EF-Typhoon.ac`
- **Pinned upstream revision:** `827020be8072fc348deb7cb94f1e9f2f9105a0e9`
- **Source mesh blob:** `8ba9ecbfca8965bed1b008310368746cff3d4e88`
- **License:** GNU General Public License v2 (the upstream `LICENSE` provides GPL v2; a copy of GPL v2 is also distributed locally as `R44-GPL-2.0-COPYING.txt`)
- **Modified editable source:** `assets/aircraft/typhoon-fg-exterior.json`

**Changes:** Selected 26 exterior and control-surface groups from the AC3D aircraft, retaining the fuselage, delta wings, canards, single fin, wing controls, wheel and strut geometry, and canopy. The source was triangulated, translated to Academy +Z-nose/Y-up coordinates, quantized to 1 mm, and packed in a JSON format with local untextured material shades. Unusually dense small undercarriage details, source instrument artwork, ejection-seat pieces, copyrighted photo textures, cockpit scenery and sounds were omitted for mobile performance. The separate JavaScript parser uses compact per-material vertex buffers. The source mesh and loader are shipped alongside the public app.

**Redistribution:** The modified source mesh remains GPL v2. Preserve this source, attribution and the required GPL terms when redistributing it. Commercial distribution and license compatibility for the Academy as a combined app require specialist review before monetization or app-store packaging.

**Limitations:** The mesh is open-source exterior familiarization geometry, not an officially licensed manufacturer aircraft. Simulated aerodynamics and flight performance are educational approximations, not an accredited Typhoon simulator.
