"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const C172=require("../flight-sim-c172-airframe.js");
const binary=fs.readFileSync("assets/aircraft/c172-molen-skyhawk.glb");
const buffer=binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength);
test("full source MIT Skyhawk binary has original cabin and 17 textures",()=>{
 assert.equal(C172.FILE,"assets/aircraft/c172-molen-skyhawk.glb");
 assert.ok(binary.length>1500000&&binary.length<6000000);
 const model=C172.parseC172GLB(buffer);
 assert.ok(model.vertices>35000&&model.vertices<100000);
 assert.ok(model.triangles>30000&&model.triangles<100000);
 assert.ok(model.images.length>=15&&model.imageMimeTypes.length>=15);
 assert.ok(model.primitives.length>=100);
 assert.ok(model.bounds[1]-model.bounds[0]>10.0,
  "C172 wingspan must retain full 11m width");
 assert.ok(model.bounds[5]-model.bounds[4]>7.2,
  "C172 must retain complete nose-to-tail geometry");
 assert.ok(model.bounds[2]>-1.85&&model.bounds[2]<-1.20,
  "Molen ground-contact origin must align main wheels with the 1.5m renderer actor offset");
 assert.ok(model.primitives.some(p=>(p.opacity??1)<.20),
  "source model must have real semitransparent cockpit glazing");
 assert.ok(fs.readFileSync("assets/aircraft/MOLEN-LICENSE.txt","utf8")
  .includes("Copyright (c) 2026 Bendyline LLC"));
 for(const p of model.primitives){
  assert.equal(p.positions.length,p.normals.length);
  assert.ok(p.positions.every(Number.isFinite));
  assert.ok(p.indices.length%3===0);
 }
});
test("source C172 flaps and ailerons rotate on their own wing hinges",()=>{
 const model=C172.parseC172GLB(buffer);
 const expected=["propeller","leftFlap","rightFlap",
  "leftAileron","rightAileron","elevatorLeft","elevatorRight","rudder"];
 for(const name of expected){
  const matches=model.primitives.filter(p=>p.partName===name);
  assert.ok(matches.length>=2,name+" source moving surfaces must be present");
  for(const p of matches){
   assert.ok(p.partAxis>=1&&p.partAxis<=3,name+" animation axis");
   assert.ok(p.partPivot.every(Number.isFinite),name+" hinge origin finite");
  }
 }
 for(const p of model.primitives.filter(p=>p.partName==="propeller")){
  assert.equal(p.partAxis,3,"+Z engine shaft rotates around its own forward axis");
  assert.ok(p.partPivot[2]>1.5,"propeller must rotate in front of cabin");
 }
});
test("source C172 is not covered by old box cabin or duplicated propeller",()=>{
 const code=fs.readFileSync("flight-sim-3d.js","utf8");
 assert.match(code,/const isMolenC172=id==="c172"&&realModel\?\.kind==="molen"/);
 assert.match(code,/if\(isMolenC172\)\{\s*\/\/ This complete source Skyhawk/);
 assert.match(code,/if\(!interiorOnly&&model\.propSweep&&!realModel&&!pendingSourceJet&&propOpacity>0\)/,
  "procedural prop blur cannot draw over real C172 or a loading source fighter");
 assert.match(code,/const MolenR44=/,"approved R44 source remains connected");
});
