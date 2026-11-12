import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const F22=require("../flight-sim-f22-airframe.js");
const asset=readFileSync(new URL("../assets/aircraft/f22-fguk-exterior.json",import.meta.url),"utf8");
assert.ok(asset.length>=500000&&asset.length<900000,
 "source-derived exterior must stay within the mobile download budget");
const model=F22.parseF22(asset);
assert.equal(F22.FILE,"assets/aircraft/f22-fguk-exterior.json");
assert.equal(model.licence,"GPL-2.0");
assert.equal(model.kind,"f22-fguk");
assert.ok(model.primitives.length>=45);
assert.ok(model.triangles>30000&&model.triangles<40000);
assert.ok(model.vertices>15000&&model.vertices<30000);
assert.ok(model.bounds[1]-model.bounds[0]>12,"F-22 source span");
assert.ok(model.bounds[5]-model.bounds[4]>17,"F-22 source length");
assert.ok(model.bounds[3]-model.bounds[2]>3.5,"F-22 twin-fin height");
const names=new Set(model.primitives.map(x=>x.sourceName));
for(const x of ["Fuselage_0","Fuselage_1","Fuselage_2","Left_Wing_0",
 "Right_Wing_0","Left_Keel_0","Right_Keel_0",
 "Left_Intake","Right_Intake","canopy"])
 assert.ok(names.has(x),"real FlightGear source part "+x+" must be present");
const animated=new Map(model.primitives.filter(x=>x.partAxis)
 .map(x=>[x.partName,x]));
for(const x of ["leftFlap","rightFlap","leftAileron","rightAileron",
 "elevatorLeft","elevatorRight","rudder"])
 assert.ok(animated.has(x),"real source must have animated surface "+x);
assert.ok([...animated.values()].every(x=>x.partPivot.every(Number.isFinite)));
// Genuine imported wheels and struts follow the same flight-system gear
// command as the other three fighters; no procedural overlay is required.
const gearParts=model.primitives.filter(p=>
 p.partName==="noseGear"||p.partName==="mainGearLeft"||
 p.partName==="mainGearRight");
assert.ok(gearParts.length>=10,
 "all original F22 gear assemblies must be independently animated");
for(const name of ["noseGear","mainGearLeft","mainGearRight"]){
 assert.ok(gearParts.some(p=>p.partName===name),
  name+" must use authentic F22 mesh");
}
assert.ok(gearParts.every(p=>p.partAxis===4&&
 p.partPivot.every(Number.isFinite)),
 "imported gear must use folding hinge mode and finite lower-belly pivots");

assert.ok(model.primitives.some(x=>x.sourceName==="canopy"&&x.opacity<.6),
 "source canopy must be translucent, not a solid opaque block");
assert.ok(model.primitives.every(p=>{
 if(p.positions.length!==p.normals.length||
    p.positions.length!==p.colors.length||
    p.uvs.length!==p.positions.length/3*2)return false;
 if(p.indices.length%3||p.indices.some(i=>i>=p.positions.length/3))return false;
 return p.positions.every(Number.isFinite)&&p.normals.every(Number.isFinite)&&
  p.colors.every(c=>c>=0&&c<=1);
}),"imported source geometry must produce valid bounded WebGL primitives");
assert.ok(readFileSync(new URL("../assets/aircraft/F22-ATTRIBUTION.md",import.meta.url),"utf8")
 .includes("FGMEMBERS/F-22"));
assert.ok(readFileSync(new URL("../assets/aircraft/R44-GPL-2.0-COPYING.txt",import.meta.url),"utf8")
 .includes("GNU GENERAL PUBLIC LICENSE"));
const renderer=readFileSync(new URL("../flight-sim-3d.js",import.meta.url),"utf8");
assert.match(renderer,/id==="f22"\?realF22:/);
assert.match(renderer,/id==="f22"&&realModel\?\[\]/,
 "do not layer incorrect procedural fighter parts over source geometry");
assert.match(renderer,/id==="f22"\?"gpl-f22-fguk"/);
const site=readFileSync(new URL("../flight-sim.html",import.meta.url),"utf8");
assert.match(site,/flight-sim-f22-airframe.js/);
assert.ok(site.indexOf("flight-sim-f22-airframe.js")<
 site.indexOf("flight-sim-3d.js"),"F-22 parser must load before renderer");
assert.throws(()=>F22.parseF22("{}"),/Invalid F-22 mesh asset size/);
assert.throws(()=>F22.parseF22(asset.replace('"quantization":1000','"quantization":1')),
 /F-22 geometry metadata invalid/);
console.log("GPL source F-22 passes: "+model.triangles+
 " authentic mesh triangles, separate tail/wings, source flight controls, valid WebGL and attribution.");
