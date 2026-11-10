"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const Real=require("../flight-sim-real-airframes.js");
const bytes=fs.readFileSync("assets/aircraft/c172-e737-optimized.glb");
const array=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const Three=require("../flight-sim-3d.js");
test("imported C172 excludes old duplicate flaps, ailerons, elevators, rudder and wheel marks",()=>{
 const legacy=Three.buildMovingParts("c172");
 const model={parts:legacy,authenticParts:[]};
 const imported=Three.exteriorAnimatedParts("c172",true,model);
 const fallback=Three.exteriorAnimatedParts("c172",false,model);
 assert.deepEqual(imported.map(part=>part.name),[],
  "imported C172 has its own propeller: no extra illustrated propeller or surfaces");
 assert.equal(fallback.length,legacy.length,
  "lightweight fallback must retain all original animated control surfaces");
 for(const label of ["leftFlap","rightFlap","elevatorLeft","elevatorRight",
                     "leftAileron","rightAileron","rudder","mainWheels","noseWheel"]){
  assert.ok(fallback.some(part=>part.name===label),label+" must still exist for fallback");
  assert.equal(imported.some(part=>part.name===label),false,
   label+" must never appear as a floating ghost on the imported GLB");
 }
});
test("imported R44 uses source-aligned rotor hardware, but its fallback remains independent",()=>{
 const parts=Three.buildMovingParts("r44");
 const authenticParts=parts.map(Three.alignRealR44MovingPart);
 const model={parts,authenticParts};
 assert.deepEqual(Three.exteriorAnimatedParts("r44",true,model),authenticParts);
 assert.deepEqual(Three.exteriorAnimatedParts("r44",false,model),parts);
});
test("both imported aircraft have four separate seats and a visible instrument binnacle",()=>{
 for(const id of ["r44","c172"]){
  const cabin=Three.buildImportedCabin(id);
  assert.equal(cabin.seats,4,id+" needs two front and two rear seats");
  assert.equal(cabin.hasPanel,true,id+" instrument panel must exist");
  assert.ok(cabin.vertices>250,id+" four seats and panel need real 3D triangles");
  assert.ok(cabin.positions.every(Number.isFinite));
  const extrema=[Infinity,-Infinity,Infinity,-Infinity,Infinity,-Infinity];
  for(let j=0;j<cabin.positions.length;j+=3)
   for(let a=0;a<3;a++){
    extrema[a*2]=Math.min(extrema[a*2],cabin.positions[j+a]);
    extrema[a*2+1]=Math.max(extrema[a*2+1],cabin.positions[j+a]);
   }
  assert.ok(extrema[3]>-.3&&extrema[2]<-.6,"seat backs and bases span usable cabin height");
  assert.ok(extrema[1]-extrema[0]>.8,id+" has two separated seat columns");
 }
 assert.equal(Three.buildImportedCabin("fa18"),null);
});
test("new C172 fuselage closes floating seats without extra wings or propellers",()=>{
 const shell=Three.buildImportedC172Shell();
 assert.equal(shell.windowPanels,5,"front windshield and four distinct side windows");
 assert.ok(shell.skin.vertices>150,"tapered white cabin, nose and tail need full 3D surfaces");
 assert.ok(shell.glass.vertices>15,"real see-through separate window geometry required");
 for(const mesh of [shell.skin,shell.glass]){
  assert.ok(mesh.positions.every(Number.isFinite));
  assert.equal(mesh.colors.length,mesh.positions.length);
  assert.equal(mesh.normals.length,mesh.positions.length);
 }
 const x=[],z=[];
 for(let i=0;i<shell.skin.positions.length;i+=3){
  x.push(shell.skin.positions[i]);z.push(shell.skin.positions[i+2]);
 }
 assert.ok(Math.max(...x)>.6&&Math.min(...x)<-.6,"both cabin sides are closed");
 assert.ok(Math.max(...z)>3.65&&Math.min(...z)<-3.5,"body spans nose and tail");
});
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
