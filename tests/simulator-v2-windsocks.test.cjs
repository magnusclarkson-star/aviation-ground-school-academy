"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const W=require("../flight-sim-windsocks.js");
const G=require("../flight-sim-3d.js");

test("runway windsocks share fixed coordinates with phone and WebGL",()=>{
 assert.deepEqual(W.positions,[{x:55,z:170},{x:-58,z:1000}]);
 assert.ok(Object.isFrozen(W.positions));
 assert.ok(W.positions.every(Object.isFrozen));
});
test("calm air hangs fabric rather than inventing a wind direction",()=>{
 const c=W.sample(0,0,5);
 assert.equal(c.active,false);
 assert.equal(c.tipXM,0);
 assert.equal(c.tipZM,0);
 assert.equal(c.angleRad,0);
});
test("synthetic crosswind points fabric downwind in both renderers",()=>{
 const east=W.sample(4.5,0,0,true),west=W.sample(-4.5,0,0,true);
 assert.equal(east.active,true);
 assert.ok(Math.abs(east.tipXM-7)<1e-10);
 assert.ok(Math.abs(east.tipZM)<1e-10);
 assert.ok(Math.abs(west.tipXM+7)<1e-10);
 assert.ok(Math.abs(east.angleRad+west.angleRad)<1e-10);
});
test("small deterministic flutter respects reduced motion",()=>{
 const a=W.sample(4,1,1,false),b=W.sample(4,1,4,false);
 const quietA=W.sample(4,1,1,true),quietB=W.sample(4,1,4,true);
 assert.notEqual(a.angleRad,b.angleRad);
 assert.equal(quietA.angleRad,quietB.angleRad);
 assert.ok(Math.abs(a.angleRad-Math.atan2(4,1))<.04);
});
test("invalid wind values stay finite",()=>{
 for(const v of [undefined,NaN,Infinity,-Infinity]){
  const sample=W.sample(v,1,NaN);
  assert.ok(Number.isFinite(sample.angleRad));
  assert.ok(Number.isFinite(sample.tipXM));
  assert.ok(Number.isFinite(sample.tipZM));
  assert.ok(Object.isFrozen(sample));
 }
});
test("WebGL cloth is a small bounded mesh with hanging and flying alternatives",()=>{
 for(const anchor of W.positions){
  const flying=G.buildWindsockFabric(anchor);
  const limp=G.buildWindsockFabric(anchor,true);
  for(const mesh of [flying,limp]){
   assert.equal(mesh.vertices,96);
   assert.ok(mesh.positions.every(Number.isFinite));
   assert.equal(mesh.positions.length,mesh.colors.length);
   assert.equal(mesh.positions.length,mesh.normals.length);
  }
  const zRange=mesh=>{
   const values=[];
   for(let i=2;i<mesh.positions.length;i+=3)values.push(mesh.positions[i]);
   return Math.max(...values)-Math.min(...values);
  };
  assert.ok(zRange(flying)>6,"blown fabric extends along local wind axis");
  assert.ok(zRange(limp)<1,"calm fabric hangs below the pole");
 }
});
test("static pole geometry stays in the WebGL airfield budget",()=>{
 const world=G.buildWorld("airplane");
 assert.ok(world.vertices<130000);
 for(const pole of W.positions){
  let found=false;
  for(let i=0;i<world.positions.length;i+=3){
   if(Math.abs(world.positions[i]-(pole.x-.11))<.02 &&
      Math.abs(world.positions[i+1]-12)<.02 &&
      Math.abs(world.positions[i+2]-(pole.z-.11))<.02){found=true;break;}
  }
  assert.ok(found,"WebGL runway mast uses the shared coordinates");
 }
});
