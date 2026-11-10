# R44 aircraft exterior — source attribution and redistribution

The authentic R44 hull geometry, cabin glazing, doors, skids, tailboom and supporting
texture were sourced from [FGMEMBERS/R44](https://github.com/FGMEMBERS/R44), a
FlightGear aircraft contributed by **Emmanuel Baranger** and other credited
contributors (including JM-26 and Guillaume Bacon for other aircraft functions).

- Original 3D source: [Models/r44.ac](https://github.com/FGMEMBERS/R44/blob/master/Models/r44.ac)
- Original diffuse texture: [Models/texture.png](https://github.com/FGMEMBERS/R44/blob/master/Models/texture.png)
- License: **GNU General Public License version 2**. The supplied
  [COPYING file](R44-GPL-2.0-COPYING.txt) accompanies these redistributed assets.
- Source was imported on 2026-11-10 into
  [r44-flightgear.ac](r44-flightgear.ac) and
  [r44-flightgear-texture.png](r44-flightgear-texture.png).
  The AC3D mesh and texture have been retained without changing the original
  source bytes. The Academy's browser importer transforms the coordinates
  (FlightGear nose -X to simulator nose +Z), triangulates the geometry at load,
  and positions separate animated rotor/swash graphics to match the new hull.
- These assets are **not** a proprietary, exclusively owned model. Any
  redistribution must respect their GPL-2.0 rights and conditions. They may
  need a licensing review before packaging or commercial distribution.
- The pilot controls and helicopter dynamics remain an illustrative training
  model, not a type-certified Robinson flight model.

The Cessna 172's separate imported model is licensed under **CC BY 4.0**, as
documented by that model's original embedded attribution metadata.

In ordinary WebGL operation, supported devices automatically show the
imported R44 exterior; devices that cannot load the source image or cannot
provide WebGL continue using the older low-polygon model. Model source can
be inspected on the live canvas as the `data-airframe-source` attribute.
