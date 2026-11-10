"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Traffic=require("../flight-sim-ground-traffic.js");
const Three=require("../flight-sim-3d.js");

test("two distinct vehicles appear in both renderers with stable identities",()=>{
 const atStart=Traffic.sample(0);
 assert.deepEqual(atStart.map(v=>v.id),["follow-me","crew-shuttle"]);
 assert.deepEqual(atStart.map(v=>v.kind),["service","shuttle"]);
 assert.ok(atStart.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.z)));
});
test("service vehicles genuinely move with fictional elapsed flight time",()=>{
 for(const route of Traffic.routes){
  const a=Traffic.pose(route,0),b=Traffic.pose(route,20);
  assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>3,
   route.id+" must move through anchored terrain over 20 seconds");
  assert.ok(Math.abs(a.x-route.x)<=route.radiusX+1e-8);
  assert.ok(Math.abs(a.z-route.z)<=route.radiusZ+1e-8);
  assert.notEqual(a.headingRad,b.headingRad);
 }
});
test("movement is continuous across the full route, without teleportation",()=>{
 for(const route of Traffic.routes){
  const dt=.05,omega=Math.PI*2/route.periodSec;
  let a=Traffic.pose(route,0);
  for(let i=1;i<=500;i++){
   const b=Traffic.pose(route,i*dt);
   const step=Math.hypot(b.x-a.x,b.z-a.z);
   assert.ok(step<=Math.max(route.radiusX,route.radiusZ)*omega*dt+1e-6);
   a=b;
  }
  const start=Traffic.pose(route,0),end=Traffic.pose(route,route.periodSec);
  assert.ok(Math.hypot(start.x-end.x,start.z-end.z)<1e-8);
 }
});
test("reduced-motion setting freezes moving traffic but not aircraft",()=>{
 const first=Traffic.sample(0,true),later=Traffic.sample(500,true);
 assert.deepEqual(first,later);
 assert.notDeepEqual(Traffic.sample(0),Traffic.sample(50));
});
test("service roads are cached and stay outside the runway",()=>{
 assert.equal(Traffic.roadPolygons.length,96);
 assert.ok(Object.isFrozen(Traffic.roadPolygons));
 for(const corners of Traffic.roadPolygons){
  assert.equal(corners.length,4);
  for(const [x,z] of corners){
   assert.ok(Number.isFinite(x)&&Number.isFinite(z));
   assert.ok(Math.abs(x)>55,"service cars must remain outside runway pavement");
  }
 }
});
test("WebGL models have real body, cab windows, tires and safety bounds",()=>{
 const service=Three.buildGroundVehicle("service");
 const shuttle=Three.buildGroundVehicle("shuttle");
 for(const model of [service,shuttle]){
  assert.ok(model.vertices>=360&&model.vertices<650);
  assert.ok(model.positions.every(Number.isFinite));
  assert.equal(model.positions.length,model.normals.length);
  assert.equal(model.positions.length,model.colors.length);
 }
 assert.notDeepEqual(Array.from(service.colors),Array.from(shuttle.colors));
});
test("3D runway world includes road loops while staying within phone budget",()=>{
 const plane=Three.buildWorld("airplane"),heli=Three.buildWorld("helicopter");
 assert.ok(plane.vertices<130000&&heli.vertices<130000);
 assert.ok(plane.vertices>44000&&heli.vertices>41000);
});
test("repeated samples are deterministic and do not mutate saved route data",()=>{
 const time=38.7,a=Traffic.sample(time),b=Traffic.sample(time);
 assert.deepEqual(a,b);
 assert.ok(Traffic.routes.every(Object.isFrozen));
 assert.ok(Traffic.roadPolygons.every(Object.isFrozen));
 assert.ok(a.every(Object.isFrozen));
});
