"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const Real=require("../flight-sim-real-airframes.js");
const bytes=fs.readFileSync("assets/aircraft/c172-e737-optimized.glb");
const array=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
test("real licensed C172 GLB is bundled locally and small enough for mobile",()=>{
 assert.ok(bytes.length>100000&&bytes.length<2*1024*1024);
 assert.equal(Real.FILE,"assets/aircraft/c172-e737-optimized.glb");
});
test("genuine Cessna 172 mesh parses with correct physical geometry",()=>{
 const model=Real.parseGLB(array);
 assert.equal(model.primitives.length,2);
 assert.ok(model.vertices>12000&&model.vertices<20000);
 assert.ok(model.triangles>13000&&model.triangles<18000);
 assert.ok(model.bounds[1]-model.bounds[0]>8);
 assert.ok(model.bounds[5]-model.bounds[4]>8);
 assert.ok(model.bounds[3]-model.bounds[2]>2);
 for(const p of model.primitives){
  assert.ok(p.positions.length>10000);
  assert.equal(p.normals.length,p.positions.length);
  assert.equal(p.uvs.length,p.positions.length/3*2);
  assert.equal(p.colors.length,p.positions.length);
  assert.ok(p.indices.every(i=>i<p.positions.length/3));
  assert.ok(p.positions.every(Number.isFinite));
  assert.ok(p.uvs.every(Number.isFinite));
  assert.ok(p.imageId!==null);
 }
});
test("embedded real WebP texture images are separate from geometry",()=>{
 const model=Real.parseGLB(array);
 assert.ok(model.images.length>=2);
 for(const image of model.images){
  assert.ok(image.length>100);
  assert.equal(String.fromCharCode(...image.slice(0,4)),"RIFF");
  assert.equal(String.fromCharCode(...image.slice(8,12)),"WEBP");
 }
});
test("malformed binary headers and bounds cannot replace the model",()=>{
 assert.throws(()=>Real.parseGLB(new ArrayBuffer(20)),/Invalid or over-budget/);
 const altered=array.slice(0);new DataView(altered).setUint32(0,0,true);
 assert.throws(()=>Real.parseGLB(altered),/Unsupported glTF binary header/);
});
