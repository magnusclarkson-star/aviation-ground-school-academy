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
 const glass=imported.primitives.filter(p=>p.isGlazing);
 assert.ok(glass.length>0,"source windows are identified separately from opaque body");
 assert.ok(glass.every(p=>p.opacity<.5),"glazing preserves source transparency");
 assert.ok(imported.primitives.some(p=>!p.isGlazing&&p.opacity===1),
  "opaque fuselage does not become see-through");
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
test("R44 repaint is restricted to original body and tail skin, with no old texture showing through",()=>{
 const model=R44.parseAC3D(source,texture);
 const painted=model.primitives.filter(p=>p.isPainted);
 const components=model.primitives.filter(p=>!p.isPainted);
 assert.ok(painted.length>0&&components.length>0);
 const paintedNames=new Set(painted.flatMap(p=>p.sourceNames));
 for(const name of ["fuselage","derive","protection",
  "porteAD","porteAG","porteBD","porteBG","trous_1"])
  assert.ok(paintedNames.has(name),name+" must not show old source livery");
 const originalNames=new Set(components.flatMap(p=>p.sourceNames));
 for(const name of ["patins","echappe","greenlight","redlight",
  "windshield","windowFL","windowFR","windowRL","windowRR"])
  assert.ok(originalNames.has(name),name+" retains its own material");
 assert.ok(painted.every(p=>!p.isGlazing&&p.opacity===1),
  "only solid original airframe skin may be recoloured");
 assert.ok(painted.some(p=>{
  for(let i=2;i<p.positions.length;i+=3)
   if(p.positions[i]<-3.5)return true;
  return false;
 }),"source-identifiable paint must include the complete original tailboom");
 assert.ok(components.some(p=>{
  for(let i=0;i<p.positions.length;i+=3)
   if(p.positions[i+1]<-1.55&&p.positions[i+2]>1.2)return true;
  return false;
 }),"real skid rails retain their distinct original material");
 assert.ok(components.some(p=>p.isGlazing),
  "source windows are not painted as opaque fuselage");
 const shader=fs.readFileSync("flight-sim-3d.js","utf8");
 assert.match(shader,/gl\.uniform1i\(uni\.uR44Skin,part\.isPainted\?1:0\)/,
  "GPU must apply skin paint only on designated source surface groups");
 assert.match(shader,/albedo=vec3\(\.93,\.79,\.08\)/,
  "source tail must be fully recoloured, without mixing back old source checker");
});
test("model replaces hull but preserves the Academy's animated rotor controls",()=>{
 const parts=Three.buildMovingParts("r44");
 for(const n of ["mainRotor","tailRotor","swashBank","swashPitch","collectiveLink"])
  assert.ok(parts.some(p=>p.name===n),n+" remains driven by flight animation");
 assert.ok(Three.buildRotorSweep("r44").vertices>0);
 assert.ok(Three.buildTailRotorSweep("r44").vertices>0);
});
test("imported R44 renders only its own two-bladed main and tail rotors",()=>{
 const parts=Three.buildCleanR44Rotors();
 assert.deepEqual(parts.map(p=>p.name),["mainRotor","tailRotor"],
  "legacy swash rings, old tail linkage boxes and decorative leftovers must not render");
 const main=parts[0],tail=parts[1],anchors=Three.REAL_R44_HARDWARE_ANCHORS;
 assert.deepEqual(main.pivot,anchors.main.actual);
 assert.deepEqual(tail.pivot,anchors.tail.actual);
 assert.equal(main.axis,2,"main rotor must rotate around vertical Y");
 assert.equal(tail.axis,1,"tail rotor must rotate around lateral X");
 for(const part of parts){
  assert.ok(part.mesh.vertices>80,part.name+" has actual two-sided rotor geometry");
  assert.ok(part.mesh.positions.every(Number.isFinite));
  assert.equal(part.mesh.colors.length,part.mesh.positions.length);
 }
 const x=[];
 for(let i=0;i<main.mesh.positions.length;i+=3)x.push(main.mesh.positions[i]);
 assert.ok(Math.max(...x)>4.9&&Math.min(...x)<-4.9,"main blades retain full R44 span");
 const y=[];
 for(let i=1;i<tail.mesh.positions.length;i+=3)y.push(tail.mesh.positions[i]);
 assert.ok(Math.max(...y)-Math.min(...y)>1.4,"tail rotor retains its full diameter");
});
test("real R44 rotors stay mounted on real cabin and tail, not placeholder fuselage",()=>{
 const parts=Three.buildMovingParts("r44").map(Three.alignRealR44MovingPart);
 const mast=parts.find(p=>p.name==="mainRotor").pivot;
 const tail=parts.find(p=>p.name==="tailRotor").pivot;
 const model=R44.parseAC3D(source,texture);
 // The 2026-11-10 placeholder transform compressed Z by .60 and
 // positioned the main hub aft of the cabin mast and the tail rotor above
 // the shaft. Check the actual model's source-space mount coordinates.
 const anchors=Three.REAL_R44_HARDWARE_ANCHORS;
 assert.deepEqual(mast,anchors.main.actual,"main hub must sit over the actual mast");
 assert.deepEqual(tail,anchors.tail.actual,"tail rotor must sit on the left shaft");
 assert.ok(mast[2]>1.95&&mast[2]<2.4,"main hub is centered above cabin mast");
 assert.ok(mast[1]>model.bounds[3]&&mast[1]<model.bounds[3]+.25,
  "main hub clears the highest existing R44 mast without a tall floating gap");
 assert.ok(tail[0]<-1.3&&tail[0]>-1.45,"tail hub sits just outboard of the shaft");
 assert.ok(Math.abs(tail[1]-.235)<.002&&Math.abs(tail[2]+3.59)<.002,
  "tail rotor is centered on the original source attachment");
 const mainTip=Three.alignRealR44HardwarePoint([5.03,3.16,-.4]);
 const tailTip=Three.alignRealR44HardwarePoint([-.77,1.19+.735,-8.18],true);
 assert.ok(Math.abs(Math.hypot(mainTip[0]-mast[0],mainTip[2]-mast[2])-5.03)<1e-8,
  "import preserves main rotor radius rather than scaling the disc");
 assert.ok(Math.abs(Math.hypot(tailTip[1]-tail[1],tailTip[2]-tail[2])-.735)<1e-8,
  "import preserves tail rotor radius");
 const main=Three.alignRealR44Hardware(Three.buildRotorSweep("r44"));
 const rear=Three.alignRealR44Hardware(Three.buildTailRotorSweep("r44"),true);
 assert.ok(main.positions.every(Number.isFinite));
 assert.ok(rear.positions.every(Number.isFinite));
});
test("all imported R44 moving parts share their source mounting points",()=>{
 const parts=Three.buildMovingParts("r44").map(Three.alignRealR44MovingPart);
 const hub=parts.find(p=>p.name==="mainRotor").pivot;
 const pitch=parts.find(p=>p.name==="swashPitch").pivot;
 const bank=parts.find(p=>p.name==="swashBank").pivot;
 const tail=parts.find(p=>p.name==="tailRotor").pivot;
 const link=parts.find(p=>p.name==="tailPitchLink").pivot;
 assert.equal(pitch[2],hub[2],"swashplate must be under main hub, not off to one side");
 assert.equal(bank[2],hub[2]);
 assert.ok(pitch[1]<hub[1]&&bank[1]<hub[1]);
 assert.deepEqual(tail,link,"tail-pitch linkage must remain connected to rotor");
 const original=Three.buildMovingParts("r44").find(p=>p.name==="mainRotor");
 const aligned=parts.find(p=>p.name==="mainRotor");
 for(let i=0;i<original.mesh.positions.length;i+=3){
  const expected=Three.alignRealR44HardwarePoint([
   original.mesh.positions[i],original.mesh.positions[i+1],original.mesh.positions[i+2]
  ]);
  for(let c=0;c<3;c++)assert.ok(Math.abs(aligned.mesh.positions[i+c]-expected[c])<.00001,
   "rotor blade vertices must translate together with hub");
 }
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
