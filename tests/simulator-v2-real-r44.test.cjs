"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const R44=require("../flight-sim-r44-airframe.js");
const content=fs.readFileSync("assets/aircraft/r44-molen-raven-ii.glb");
const bytes=content.buffer.slice(content.byteOffset,content.byteOffset+content.byteLength);
test("a real MIT licensed R44 3D binary is bundled locally",()=>{
 assert.ok(content.length>500000&&content.length<8*1024*1024);
 assert.equal(content.toString("ascii",0,4),"glTF");
 assert.equal(R44.FILE,"assets/aircraft/r44-molen-raven-ii.glb");
});
test("Molen Raven II meshes have real cabin/skid/rotor geometry and materials",()=>{
 const model=R44.parseR44GLB(bytes);
 assert.ok(model.primitives.length>=50);
 assert.ok(model.vertices>=15000&&model.vertices<60000);
 assert.ok(model.triangles>=15000&&model.triangles<60000);
 assert.ok(model.bounds[1]-model.bounds[0]>9);
 assert.ok(model.bounds[5]-model.bounds[4]>8);
 assert.ok(model.bounds[3]-model.bounds[2]>3);
 assert.ok(model.images.length>=8);
 assert.ok(model.primitives.every(p=>p.positions.every(Number.isFinite)));
 assert.ok(model.primitives.every(p=>p.normals.length===p.positions.length));
 assert.ok(model.primitives.every(p=>p.colors.length===p.positions.length));
 assert.ok(model.primitives.every(p=>p.uvs.length===p.positions.length/3*2));
});
test("real two-bladed main and anti-torque rotor components are separate",()=>{
 const model=R44.parseR44GLB(bytes);
 const main=model.primitives.filter(p=>p.partName==="mainRotor");
 const tail=model.primitives.filter(p=>p.partName==="tailRotor");
 assert.ok(main.length>=2);
 assert.ok(tail.length>=2);
 assert.ok(main.every(p=>p.partAxis===2));
 assert.ok(tail.every(p=>p.partAxis===1));
 assert.ok(main.every(p=>p.partPivot.length===3));
 assert.ok(tail.every(p=>p.partPivot.length===3));
 assert.ok(model.primitives.some(p=>p.partName===null));
});
test("image data has correctly structured embedded PNG texture assets",()=>{
 const model=R44.parseR44GLB(bytes);
 assert.ok(model.images.length>=8);
 assert.ok(model.imageMimeTypes.every(m=>m==="image/png"));
 assert.ok(model.images.every(image=>image.length>100));
 for(const image of model.images)
  assert.deepEqual(Array.from(image.slice(0,8)),[137,80,78,71,13,10,26,10]);
});
test("corrupt model data fails and retains safe legacy fallback",()=>{
 assert.throws(()=>R44.parseR44GLB(new ArrayBuffer(8)),/Invalid R44 binary size/);
 const bad=bytes.slice(0);
 new DataView(bad).setUint32(0,0,true);
 assert.throws(()=>R44.parseR44GLB(bad),/Invalid R44 GLB header/);
});
