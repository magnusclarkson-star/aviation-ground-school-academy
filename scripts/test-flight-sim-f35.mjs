import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const F35=require("../flight-sim-f35-airframe.js");
const asset=readFileSync(new URL("../assets/aircraft/f35-fguk-exterior.json",import.meta.url),"utf8");
assert.ok(asset.length>=350000&&asset.length<600000,
 "source-derived exterior must stay within the mobile download budget");
const model=F35.parseF35(asset);
assert.equal(F35.FILE,"assets/aircraft/f35-fguk-exterior.json");
assert.equal(model.licence,"GPL-3.0");
assert.equal(model.kind,"f35-fguk");
assert.ok(model.primitives.length>=38);
assert.ok(model.triangles>20000&&model.triangles<30000);
assert.ok(model.vertices>10000&&model.vertices<20000);
assert.ok(model.bounds[1]-model.bounds[0]>10,"F-35B source span");
assert.ok(model.bounds[5]-model.bounds[4]>15,"F-35B source length");
assert.ok(model.bounds[3]-model.bounds[2]>3.5,"F-35B twin-fin height");
const names=new Set(model.primitives.map(x=>x.sourceName));
for(const x of ["fuselage","tail","flaperonL","flaperonR",
 "elevators","rudderL","rudderR","canopy","gear:wheel.F"])
 assert.ok(names.has(x),"real FlightGear source part "+x+" must be present");
const animated=new Map(model.primitives.filter(x=>x.partAxis)
 .map(x=>[x.partName,x]));
for(const x of ["leftFlap","rightFlap","leftAileron","rightAileron",
 "elevatorLeft","rudder"])
 assert.ok(animated.has(x),"real source must have animated surface "+x);
assert.ok([...animated.values()].every(x=>x.partPivot.every(Number.isFinite)));
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
assert.ok(readFileSync(new URL("../assets/aircraft/F35-ATTRIBUTION.md",import.meta.url),"utf8")
 .includes("FGMEMBERS/F-35B"));
assert.ok(readFileSync(new URL("../assets/aircraft/F35-GPL-3.0.txt",import.meta.url),"utf8")
 .includes("GNU GENERAL PUBLIC LICENSE"));
const renderer=readFileSync(new URL("../flight-sim-3d.js",import.meta.url),"utf8");
assert.match(renderer,/id==="f35"\?realF35:null/);
assert.match(renderer,/\(id==="f22"\|\|id==="f35"\)&&realModel\?\[\]/,
 "do not layer incorrect procedural fighter parts over source geometry");
assert.match(renderer,/id==="f35"\?"gpl-f35b-flightgear"/);
const site=readFileSync(new URL("../flight-sim.html",import.meta.url),"utf8");
assert.match(site,/flight-sim-f35-airframe.js/);
assert.ok(site.indexOf("flight-sim-f35-airframe.js")<
 site.indexOf("flight-sim-3d.js"),"F-35B parser must load before renderer");
assert.throws(()=>F35.parseF35("{}"),/Invalid F-35B mesh asset size/);
assert.throws(()=>F35.parseF35(asset.replace('"quantization":1000','"quantization":1')),
 /F-35B geometry metadata invalid/);
console.log("GPL source F-35B passes: "+model.triangles+
 " authentic mesh triangles, separate tail/wings, source flight controls, valid WebGL and attribution.");
