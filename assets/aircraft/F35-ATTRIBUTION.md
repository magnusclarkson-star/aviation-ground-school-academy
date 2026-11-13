# F-35B Lightning II aircraft exterior attribution

The educational F-35B visual source is derived from the **FlightGear FGMEMBERS/F-35B** open-source aircraft repository. The selected mesh source components are its exterior `Models/F-35B.ac` and `Models/Gear.ac`.

- Upstream repository: https://github.com/FGMEMBERS/F-35B
- Upstream exterior: https://github.com/FGMEMBERS/F-35B/blob/master/Models/F-35B.ac
- Upstream undercarriage: https://github.com/FGMEMBERS/F-35B/blob/master/Models/Gear.ac
- Original author and contributor credits: those contained in the upstream aircraft repository.
- Upstream repository license: GNU General Public License version 3. The unmodified upstream `License.txt` is mirrored in `F35-GPL-3.0.txt`.
- Modified source asset: `f35b-fg-exterior.json`, distributed alongside this attribution and the accompanying source parser.

**Changes made:** main F-35B polygon mesh plus aircraft landing-gear objects selected from AC3D sources; quads triangulated into indexed triangles; wheel-gear local offsets placed into common aircraft coordinates; coordinate axes converted to AGSA's +Z forward and +Y up; vertex positions quantized to millimetres; texture image dependencies replaced with generated flat material colours (no original artwork copied); original object names preserved for geometry and flap/rudder linkage; numerical safety limits and tests added.

**Native F-35B gear-door correction:** The preserved source objects `doorFL`, `doorFR`, `doorB1L/R` and `doorB2L/R` are now hinged to the same nose/left/right landing-gear animation used by the original wheel assemblies. The redundant six low-detail rectangular bay-door overlays were removed only for the F-35B. The F-35B weapons-bay, fan, upper and engine panels are not repurposed as landing-gear doors. This changes visual presentation only, not flight physics or the Cessna, R44, Super Hornet, Typhoon or F-22.

The optimized JSON is the editable source representation of the adapted model; it retains its original source component grouping and material IDs. Keep attribution, GPL license and the modified model source available to recipients as required.

This integration is an illustrative **F-35B variant** visual model; simulated jet flight handling is fictional. It is not manufacturer-approved, validated aerodynamics or an operational aircraft procedure trainer.

**Commercial distribution:** GPLv3 redistribution/source obligations and whether combinations with other application code form derivative works must be reviewed independently before distributing as a commercial package. This attribution alone does not settle the legal question.
