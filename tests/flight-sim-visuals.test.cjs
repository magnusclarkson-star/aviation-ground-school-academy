/* Run with: node --test tests/flight-sim-visuals.test.cjs
 * Tests render/math behavior without a browser, audio, or network.
 */
"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Camera=require("../flight-sim-camera-rig.js");
const Render=require("../flight-sim-3d.js");
const Scenery=require("../flight-sim-scenery.js");
const airframe=require("../flight-sim-airframe-geometry.js");
const pose=(view,eyeX=0,craftX=0,yaw=0)=>({
 view,eye:[eyeX,10,12],craft:[craftX,1.5,0],yaw,pitch:-.1,roll:0
});
test("exterior viewpoint damps movement without changing actual aircraft location",()=>{
 const rig=Camera.create({responseMs:180});
 rig.next(pose("chase",0,0),100,"c172");
 const result=rig.next(pose("chase",20,20),133,"c172");
 assert.ok(result.eye[0]>0&&result.eye[0]<20);
 assert.equal(result.craft[0],20);
});
test("view change, aircraft change and scenario teleport snap immediately",()=>{
 const rig=Camera.create();
 rig.next(pose("chase",0,0),100,"c172");
 assert.equal(rig.next(pose("side",20,20),133,"c172").eye[0],20);
 assert.equal(rig.next(pose("side",21,21),166,"r44").eye[0],21);
 assert.equal(rig.next(pose("side",500,500),200,"r44").eye[0],500);
});
test("cockpit camera is instantaneous; compass wrap uses short direction",()=>{
 const rig=Camera.create();
 rig.next(pose("chase",0,0),100,"c172");
 assert.equal(rig.next(pose("cockpit",17,15),133,"c172").eye[0],17);
 assert.ok(Camera.turn(359*Math.PI/180,Math.PI/180)>0);
 assert.ok(Camera.turn(359*Math.PI/180,Math.PI/180)<.05);
});
test("airframe shadows are valid and aircraft-specific",()=>{
 const counts=[];
 for(const id of airframe.IDS){
  const mesh=Render.buildShadow(id);
  assert.ok(mesh.vertices>0,id);
  assert.ok(Array.from(mesh.positions).every(Number.isFinite),id);
  counts.push(mesh.vertices);
 }
 assert.ok(new Set(counts).size>1);
});
test("3D runway and helipad stay under mobile mesh budget",()=>{
 for(const mode of ["airplane","helicopter"]){
  const mesh=Render.buildWorld(mode);
  assert.ok(mesh.vertices>0&&mesh.vertices<130000);
 }
});
test("2D fallback draws day and dusk without images or WebGL",()=>{
 const gradient={addColorStop(){}};
 let glowCount=0;
 const ctx=new Proxy({
  createLinearGradient(){return gradient},
  createRadialGradient(){glowCount++;return gradient}
 },{get(target,key){
  return key in target?target[key]:()=>{};
 },set(target,key,value){target[key]=value;return true}});
 const canvas={width:960,height:540,getContext:()=>ctx};
 const flight={mode:"airplane",xM:0,zM:0,altitudeM:8,
  headingDeg:0,pitchDeg:0,rollDeg:0,time:0};
 assert.equal(Scenery.draw(canvas,flight,{lighting:"day",view:"cockpit"}),true);
 assert.equal(glowCount,0);
 assert.equal(Scenery.draw(canvas,flight,{lighting:"dusk",view:"cockpit"}),true);
 assert.ok(glowCount>0);
});
