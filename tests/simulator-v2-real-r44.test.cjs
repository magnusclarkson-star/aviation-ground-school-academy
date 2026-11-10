"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const R44=require("../flight-sim-real-r44.js");
const Three=require("../flight-sim-3d.js");
const Model=require("../flight-sim-model.js");
const source=fs.readFileSync(R44.MESH_FILE,"utf8");
const texture=fs.readFileSync(R44.TEXTURE_FILE);
let imported;
test("original GPL-2.0 R44 source and texture are locally bundled",()=>{
 assert.ok(source.length>400000&&source.length<1024*1024);
 assert.ok(texture.length>10000&&texture.length<1024*1024);
 assert.ok(fs.readFileSync("assets/aircraft/R44-GPL-2.0-COPYING.txt","utf8")
  .includes("GNU GENERAL PUBLIC LICENSE"));
 assert.equal(R44.MESH_FILE,"assets/aircraft/r44-flightgear.ac");
});
test("authentic R44 FlightGear body, windows and skids have indexed textured geometry",()=>{
 imported=R44.parseAC3D(source,texture);
 assert.ok(imported.triangles>7500&&imported.triangles<15000);
 assert.ok(imported.vertices>22000&&imported.vertices<45000);
 assert.ok(imported.primitives.length>=3);
 assert.equal(imported.images.length,1);
 assert.equal(imported.mimeTypes[0],"image/png");
 assert.ok(imported.bounds[5]-imported.bounds[4]>8.5);
 assert.ok(imported.bounds[1]-imported.bounds[0]>2.2);
 assert.ok(imported.bounds[3]-imported.bounds[2]>2.7);
 for(const p of imported.primitives){
  assert.ok(p.positions.every(Number.isFinite));
  assert.ok(p.normals.every(Number.isFinite));
  assert.ok(p.uvs.every(Number.isFinite));
  assert.equal(p.positions.length,p.colors.length);
  assert.equal(p.positions.length,p.normals.length);
  assert.equal(p.positions.length/3*2,p.uvs.length);
  assert.ok(p.indices.every(i=>i<p.positions.length/3));
 }
});
test("model replaces hull but preserves the Academy's animated rotor controls",()=>{
 const parts=Three.buildMovingParts("r44");
 for(const n of ["mainRotor","tailRotor","swashBank","swashPitch","collectiveLink"])
  assert.ok(parts.some(p=>p.name===n),n+" remains driven by flight animation");
 assert.ok(Three.buildRotorSweep("r44").vertices>0);
 assert.ok(Three.buildTailRotorSweep("r44").vertices>0);
});
test("real R44 rotors stay mounted on real cabin and tail, not placeholder fuselage",()=>{
 const parts=Three.buildMovingParts("r44").map(Three.alignRealR44MovingPart);
 const mast=parts.find(p=>p.name==="mainRotor").pivot;
 const tail=parts.find(p=>p.name==="tailRotor").pivot;
 const model=R44.parseAC3D(source,texture);
 assert.ok(mast[2]>0&&mast[2]<2,"mast aligned above cabin");
 assert.ok(mast[1]>model.bounds[3]&&mast[1]<model.bounds[3]+1,
  "rotor disc supported just above genuine R44 roof");
 assert.ok(tail[2]>model.bounds[4]&&tail[2]<-3,
  "tail rotor visibly attached to real rear boom");
 assert.ok(tail[1]>.35&&tail[1]<1.2);
 const main=Three.alignRealR44Hardware(Three.buildRotorSweep("r44"));
 const rear=Three.alignRealR44Hardware(Three.buildTailRotorSweep("r44"),true);
 assert.ok(main.positions.every(Number.isFinite));
 assert.ok(rear.positions.every(Number.isFinite));
});
test("cyclic, collective and tail-yaw state changes stay finite with imported model",()=>{
 const state=Model.makeState("helicopter");
 const input={...Model.makeInput("helicopter"),collective:.71,bank:.25,pitch:-.20,rudder:.35};
 for(let i=0;i<50;i++){
  const stepped=Model.step(state,input,.1);
  assert.ok(stepped.state===state);
 }
 for(const n of ["xM","zM","altitudeM","headingDeg","yawRateDegS"])
  assert.ok(Number.isFinite(state[n]),n+" must stay responsive");
});
test("malformed aircraft source or texture is rejected rather than silently accepted",()=>{
 assert.throws(()=>R44.parseAC3D("bad",texture),/Unsupported/);
 assert.throws(()=>R44.parseAC3D(source,new Uint8Array(16)),/Missing or invalid/);
});
