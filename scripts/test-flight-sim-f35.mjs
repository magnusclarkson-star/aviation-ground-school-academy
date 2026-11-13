import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const F35=require("../flight-sim-f35-airframe.js");
const asset=readFileSync(new URL("../assets/aircraft/f35b-fg-exterior.json",import.meta.url),"utf8");
assert.ok(asset.length>=350000&&asset.length<600000,
 "source-derived exterior must stay within the mobile download budget");
const model=F35.parseF35(asset);
assert.equal(F35.FILE,"assets/aircraft/f35b-fg-exterior.json");
assert.equal(model.licence,"GPL-3.0");
assert.equal(model.kind,"f35b-fg");
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
// Genuine imported wheels and struts follow the same flight-system gear
// command as the other three fighters; no procedural overlay is required.
const gearParts=model.primitives.filter(p=>p.partAxis===4&&
 (p.partName==="noseGear"||p.partName==="mainGearLeft"||
 p.partName==="mainGearRight"));
assert.ok(gearParts.length>=14,
 "all original F35 gear assemblies must be independently animated");
for(const name of ["noseGear","mainGearLeft","mainGearRight"]){
 assert.ok(gearParts.some(p=>p.partName===name),
  name+" must use authentic F35 mesh");
}
assert.ok(gearParts.every(p=>p.partAxis===4&&
 p.partPivot.every(Number.isFinite)),
 "imported gear must use folding hinge mode and finite lower-belly pivots");

// Original F-35B nose and main-bay doors must rotate with source gear.
const actualDoors=model.primitives.filter(p=>p.partAxis===3&&
 p.gearDoorSide!==0);
const doorNames=["doorFL","doorFR","doorB1L","doorB1R","doorB2L","doorB2R"];
assert.equal(actualDoors.length,6,"use six genuine source bay-door assemblies");
assert.deepEqual(actualDoors.map(p=>p.sourceName).sort(),doorNames.sort());
for(const panel of actualDoors){
 assert.ok(panel.partPivot.every(Number.isFinite));
 assert.equal(panel.partName,panel.sourceName.startsWith("doorF")?"noseGear":
  panel.sourceName.endsWith("L")?"mainGearLeft":"mainGearRight");
 assert.equal(panel.gearDoorSide,panel.sourceName.endsWith("L")?-1:1);
 assert.ok(panel.positions.length>=100,"retain source door triangles");
}
const Exterior=require("../flight-sim-airframe-geometry.js");
const Three=require("../flight-sim-3d.js");
assert.equal(Exterior.buildImportedGearDoors(Three.Mesh,"f35"),null,
 "never overlay second rectangular doors on the F-35B source");
assert.ok(model.primitives.some(x=>x.sourceName==="canopy"&&x.opacity<.6),
 "source canopy must be translucent, not a solid opaque block");
// Imported Gear.ac struts must never break through the F-35B upper skin.
const undercarriage=model.primitives.filter(p=>p.sourceName.startsWith("gear:"));
assert.ok(undercarriage.length>=10,"authentic source gear parts retained");
for(const part of undercarriage){
 const heights=[];
 for(let i=1;i<part.positions.length;i+=3)heights.push(part.positions[i]);
 assert.ok(Math.max(...heights)<=-.649,
  part.sourceName+" must remain beneath F-35B fuselage");
}
for(const wheelName of ["gear:wheel.F","gear:wheel.R","gear:wheel.L"]){
 const wheel=undercarriage.find(p=>p.sourceName===wheelName);
 assert.ok(wheel&&wheel.positions.some((v,i)=>i%3===1&&v< -1.9),
  wheelName+" must retain deployed tyre height");
}

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
assert.match(renderer,/id==="f35"\?realF35:/);
assert.match(renderer,/id==="f35"&&realModel\?\[\]/,
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


/* The aircraft is lazy-loaded on mobile: a temporary offline/server failure
 * must not poison future attempts, and simultaneous views share one fetch.
 * This test runs in the existing F-35B source CI gate.
 */
let fetchAttempts=0;
const flakyFetcher=async()=>{
 fetchAttempts++;
 if(fetchAttempts===1)return {ok:false,status:503};
 return {ok:true,text:async()=>asset};
};
await assert.rejects(F35.ensureF35(flakyFetcher),/F-35B mesh HTTP 503/,
 "a failed first source download must report the error");
const [loadedFromTop,loadedFromInspect]=await Promise.all([
 F35.ensureF35(flakyFetcher),F35.ensureF35(flakyFetcher)
]);
assert.strictEqual(loadedFromTop,loadedFromInspect,
 "simultaneous F-35B views must share one parsed mesh");
assert.equal(fetchAttempts,2,
 "retry should perform only one additional source request");
assert.strictEqual(await F35.ensureF35(()=>{throw Error("unexpected refetch");}),
 loadedFromTop,"loaded mesh must be reused without network access");
