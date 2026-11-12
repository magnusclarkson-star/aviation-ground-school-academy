/* True Typhoon AC3D-derived geometry and mobile GPU acceptance */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const T=require("../flight-sim-typhoon-airframe.js");
const asset=readFileSync(new URL("../assets/aircraft/typhoon-fg-exterior.json",import.meta.url),"utf8");
const license=readFileSync(new URL("../assets/aircraft/TYPHOON-ATTRIBUTION.md",import.meta.url),"utf8");
const model=T.parseTyphoon(asset);
assert.ok(asset.length>300000&&asset.length<750000);
assert.ok(model.triangles>16000&&model.triangles<28000,
 "real Typhoon visible faces remain within mobile triangle budget");
assert.ok(model.vertices>5000&&model.vertices<60000,
 "Typhoon vertex compaction protects low-memory Android");
assert.deepEqual(model.bounds.map(Number.isFinite),Array(6).fill(true));
assert.ok(model.bounds[1]-model.bounds[0]>11,"full delta wingspan included");
assert.ok(model.bounds[5]-model.bounds[4]>16,"full airframe length included");
assert.match(model.source,/IAHM-COL\/EF-Typhoon/);
assert.equal(model.licence,"GPL-2.0");
assert.match(license,/827020be8072fc348deb7cb94f1e9f2f9105a0e9/);
const byName=name=>model.primitives.filter(p=>p.sourceName===name);
for(const name of ["fuselage","wing","tail","canopy","elevator.L",
 "elevator.R","rudder","noseGear","mainGearLeft","mainGearRight"]){
 assert.ok(byName(name).length>0,"missing Typhoon source group "+name);
}
for(const control of ["elevatorLeft","elevatorRight","leftAileron",
 "rightAileron","leftFlap","rightFlap","rudder","leftSlat","rightSlat"]){
 assert.ok(model.primitives.some(p=>p.partName===control&&p.partAxis>0),
  "source Typhoon "+control+" must have hinged geometry");
}
for(const mesh of model.primitives){
 assert.ok(mesh.positions.every(Number.isFinite));
 assert.ok(mesh.colors.every(Number.isFinite));
 assert.ok(mesh.normals.every(Number.isFinite));
 assert.ok(mesh.partPivot.every(Number.isFinite));
 assert.ok(mesh.indices.every(i=>i<mesh.positions.length/3));
 assert.ok(mesh.opacity>=0&&mesh.opacity<=1);
}
const gear=model.primitives.filter(p=>p.partAxis===4);
assert.ok(gear.length>=8,"real Typhoon must have imported nose/main tyres and struts");
assert.deepEqual([...new Set(gear.map(p=>p.partName))].sort(),
 ["noseGear","mainGearLeft","mainGearRight"].sort());
assert.ok(gear.every(p=>p.positions.every((v,i)=>i%3!==1||v<=-.449)),
 "imported Typhoon landing struts must never cross the upper fuselage plane");
// These are genuine IAHM Typhoon source panels, not extra procedural doors.
for(const suffix of ["1.L","2.L","1.R","2.R"]){
 const name="geardoor"+suffix,doors=byName(name);
 assert.ok(doors.length>0,"genuine Typhoon source door missing: "+name);
 for(const door of doors){
  const positive=suffix.endsWith(".L");
  assert.equal(door.partName,positive?"mainGearLeft":"mainGearRight");
  assert.equal(door.partAxis,3);
  assert.equal(door.gearDoorSide,positive?1:-1);
  const angle=(positive?1:-1)*1.10;
  let before=0,after=0;
  const v=door.positions;
  for(let i=0;i<v.length;i+=3){
   before+=v[i+1];
   const dx=v[i]-door.partPivot[0],dy=v[i+1]-door.partPivot[1];
   after+=door.partPivot[1]+dx*Math.sin(angle)+dy*Math.cos(angle);
  }
  assert.ok((before-after)/(v.length/3)>.12,
   name+" opens downward around the actual panel outer edge");
 }
}

assert.throws(()=>T.parseTyphoon(asset.slice(0,100)),/source mesh size/);
const tampered=JSON.parse(asset);tampered.parts[0].g[0][1][0]=999999;
assert.throws(()=>T.parseTyphoon(JSON.stringify(tampered)),/source index invalid/);
console.log("Typhoon genuine GPL source passes geometry, wings, canards, landing gear and mobile budget");
