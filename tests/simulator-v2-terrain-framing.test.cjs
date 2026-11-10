"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Ground=require("../flight-sim-countryside.js");
const Three=require("../flight-sim-3d.js");
const Fallback=require("../flight-sim-exterior-2d.js");
function state(mode,groundSpeedKt=0){
 return {mode,xM:0,zM:300,altitudeM:120,headingDeg:0,
  pitchDeg:0,rollDeg:0,groundSpeedKt};
}
test("twelve anchored groves populate the entire returning flight circuit",()=>{
 assert.equal(Ground.trees.length,60);
 assert.equal(new Set(Ground.trees.map(t=>t.id)).size,60);
 assert.ok(Ground.farmsteads.length>=9);
 assert.ok(Ground.trees.some(t=>t.z< -2000));
 assert.ok(Ground.trees.some(t=>t.z>2400));
 assert.ok(Ground.trees.some(t=>t.x>750));
 assert.ok(Ground.trees.some(t=>t.x< -750));
 assert.ok(Ground.trees.every(t=>Math.abs(t.x)>200));
 assert.ok(Ground.trees.every(t=>t.h>=8&&t.h<=16));
 assert.ok(Ground.trees.every(Object.isFrozen));
});
test("a complete V2 airfield world remains mobile-friendly",()=>{
 const plane=Three.buildWorld("airplane");
 const heli=Three.buildWorld("helicopter");
 assert.ok(plane.vertices<130000);
 assert.ok(heli.vertices<130000);
 assert.ok(plane.positions.every(Number.isFinite));
 assert.ok(heli.positions.every(Number.isFinite));
 assert.ok(plane.colors.every(x=>x>=0&&x<=1));
});
test("new trees are actual 3D geometry at fixed world coordinates",()=>{
 const mesh=Three.buildWorld("airplane");
 const tree=Ground.trees[0];
 const floor=Ground.terrainHeight(tree.x,tree.z)+.14;
 let trunk=false,high=false;
 for(let i=0;i<mesh.positions.length;i+=3){
  const x=mesh.positions[i],y=mesh.positions[i+1],z=mesh.positions[i+2];
  if(Math.abs(x-(tree.x-.34))<.02&&Math.abs(y-floor)<.02&&
   Math.abs(z-(tree.z-.34))<.02)trunk=true;
  if(Math.abs(x-tree.x)<.02&&Math.abs(y-(floor+tree.h*.90))<.02&&
   Math.abs(z-tree.z)<.02)high=true;
 }
 assert.ok(trunk,"grove tree has a physical trunk in WebGL");
 assert.ok(high,"grove tree has a raised conical canopy in WebGL");
});
test("chase camera moves substantially closer without changing physics",()=>{
 for(const mode of ["airplane","helicopter"]){
  const before=state(mode);
  const chase=Three.cameraPose(before,"chase");
  const dist=Math.hypot(chase.eye[0]-chase.craft[0],
   chase.eye[2]-chase.craft[2]);
  assert.ok(dist<=24.01,mode+" close chase framing");
  const side=Three.cameraPose(before,"side");
  const sideDist=Math.hypot(side.eye[0]-side.craft[0],
   side.eye[2]-side.craft[2]);
  assert.ok(sideDist<=24.01);
  const top=Three.cameraPose(before,"top");
  assert.ok(top.eye[1]-top.craft[1]<=36.1);
  assert.deepEqual(before,state(mode),"camera never alters aircraft state");
 }
});
test("speed-dependent outside framing gives faster craft more context",()=>{
 for(const mode of ["airplane","helicopter"]){
  const near=Three.cameraPose(state(mode,0),"chase");
  const distant=Three.cameraPose(state(mode,250),"chase");
  assert.ok(Math.abs(distant.eye[2]-distant.craft[2])>
   Math.abs(near.eye[2]-near.craft[2])+3);
 }
});
test("2D fallback still draws actual moving rotor and C172 geometry",()=>{
 for(const id of ["c172","r44"]){
  const p=Fallback.projectedFaces(id,"chase",{mainRotor:.8,tailRotor:1.5});
  assert.ok(p.length>Three.buildVehicle(id).triangles);
  assert.ok(p.every(face=>Number.isFinite(face.depth)));
 }
});
