# Su-37 source-airframe attribution

This repository includes a compact editable exterior mesh derived from the open-source FlightGear Su-37 aircraft maintained in [FGMEMBERS/SU-37](https://github.com/FGMEMBERS/SU-37).

- **Original model:** `Models/SU-37-005-125h.ac`
- **Source repository:** https://github.com/FGMEMBERS/SU-37
- **Pinned upstream revision:** `936d565cded05ea0c0f26f99f8878b18156bce09`
- **Source blob SHA:** `f7fb62ecdf97c200c9f91edd6715cf157309e6a3`
- **License:** GNU General Public License version 2 or later. The upstream repository provides `COPYING`; the GPL version 2 text is also published locally as `R44-GPL-2.0-COPYING.txt`.
- **Modified source mesh:** `assets/aircraft/su37-fguk-exterior.json`, available in the same public deployment as the simulator.

**Changes:** AC3D exterior groups were selected and grouped into semantic meshes, quad and polygon surfaces triangulated, vertex coordinates transformed to the Academy +Z-nose/Y-up reference frame, translated to an aircraft-centered model, quantized to 1 mm, and packed as human-readable JSON. The source structure contains 24 mesh groups and about 20,800 triangles. Retains source canards, control surfaces, engines, underside doors, canopy and landing-gear components. Third-party source texture images, liveries, decals, cockpit instrument artwork and sounds were not reproduced; the renderer uses local material shades. The loader and model switching are separately authored.

**Redistribution:** This derived source geometry remains subject to GPL 2.0-or-later. Keep this notice, the complete modified JSON source and required GPL terms when distributing it. The license and compliance consequences for commercial distribution of the whole Academy require specialist review before monetization or app-store packaging.

**Educational scope:** This is an open-source visual exterior and 360° familiarization model. It is not a manufacturer's certified Su-37 representation, actual flight-performance model, operational military simulator or approved aircraft training device. The flight dynamics in this Academy are separate conceptual physics.
