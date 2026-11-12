/* Real Su-37 source geometry, licensing and aircraft control regression. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const S=require("../flight-sim-su37-airframe.js");
const asset=readFileSync(new URL("../assets/aircraft/su37-fguk-exterior.json",import.meta.url),"utf8");
const license=readFileSync(new URL("../assets/aircraft/SU37-ATTRIBUTION.md",import.meta.url),"utf8");
const model=S.parseSu37(asset);
assert.ok(asset.length>350000&&asset.length<750000,"editable Su-37 source must be retained in public bundle");
assert.ok(model.triangles>=18000&&model.triangles<=26000,
 "authentic mobile mesh triangle budget");
assert.ok(model.vertices>=12000&&model.vertices<80000,
 "expanded source materials must remain within mobile GPU buffer budget");
assert.deepEqual(model.bounds.map(Number.isFinite),Array(6).fill(true));
assert.ok(model.bounds[1]-model.bounds[0]>=14,"Su-37 must have both full wings");
assert.ok(model.bounds[5]-model.bounds[4]>=20,"Su-37 must have its full nose, twin engines and tail");
assert.match(model.source,/FGMEMBERS\/SU-37/);
assert.equal(model.licence,"GPL-2.0-or-later");
assert.match(license,/936d565cded05ea0c0f26f99f8878b18156bce09/);
assert.match(license,/GPL 2\.0-or-later/i);
const parts=model.primitives,byName=name=>parts.filter(p=>p.sourceName===name);
for(const name of ["fuselage","wing","tail","canopy","CNRD_Left",
 "CNRD_Right","noseGear","mainGearLeft","mainGearRight",
 "engineLeft","engineRight","ELV_Elevon_Left","ELV_Elevon_Right"]){
 assert.ok(byName(name).length>=1,"source Su-37 missing "+name);
}
const controls=["canardLeft","canardRight","elevatorLeft","elevatorRight",
 "leftAileron","rightAileron","rudderLeft","rudderRight"];
for(const name of controls){
 assert.ok(parts.some(p=>p.partName===name&&p.partAxis>0),
  name+" must animate genuine source geometry rather than a double overlay");
}
for(const part of parts){
 assert.ok(part.positions.every(Number.isFinite));
 assert.ok(part.indices.every(i=>i<part.positions.length/3));
 assert.ok(part.normals.every(Number.isFinite));
 assert.ok(part.colors.every(Number.isFinite));
 assert.ok(part.partPivot.every(Number.isFinite));
 assert.ok(part.opacity>=0&&part.opacity<=1);
}
const gear=parts.filter(p=>p.partAxis===4);
assert.ok(gear.length>=8,"authentic Su-37 must have original wheels, hubs, struts and gear braces");
assert.deepEqual([...new Set(gear.map(p=>p.partName))].sort(),
 ["noseGear","mainGearLeft","mainGearRight"].sort());
assert.ok(gear.every(p=>p.positions.every((v,i)=>i%3!==1||v<=-.449)),
 "Su-37 landing gear must stay below its upper fuselage surface");
assert.throws(()=>S.parseSu37(asset.slice(0,100)),/source mesh length/);
const tampered=JSON.parse(asset);tampered.parts[0].g[0][1][0]=999999;
assert.throws(()=>S.parseSu37(JSON.stringify(tampered)),/triangle index invalid/);
console.log("GPL source Su-37 passed geometry, canards, engines, gear, license and safety bounds");
