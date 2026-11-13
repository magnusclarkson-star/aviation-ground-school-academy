"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Model=require("../flight-sim-model.js");
const Geometry=require("../flight-sim-3d.js");
const Airframes=require("../flight-sim-airframe-geometry.js");
const Colors=Object.freeze({navy:[33,94,141],blue:[71,127,155]});
const near=(a,b,t=.015)=>Math.abs(a-b)<=t;
function hasPoint(mesh,x,y,z){
 for(let i=0;i<mesh.positions.length;i+=3)
  if(near(mesh.positions[i],x)&&near(mesh.positions[i+1],y)&&near(mesh.positions[i+2],z))
   return true;
 return false;
}
function hasColoredPoint(mesh,x,y,z,color){
 for(let i=0;i<mesh.positions.length;i+=3)
  if(near(mesh.positions[i],x)&&near(mesh.positions[i+1],y)&&near(mesh.positions[i+2],z)&&
     color.every((channel,j)=>near(mesh.colors[i+j],channel/255)))
   return true;
 return false;
}
function rotorAt(height){
 const s=Model.makeState("helicopter");
 Object.assign(s,{onGround:false,phase:"hover",altitudeM:height,
  forwardMs:0,lateralMs:0,speedKt:0,groundSpeedKt:0});
 const u={...Model.makeInput("helicopter"),bank:.3,pitch:-.5,
  collective:.495,turbulence:0};
 for(let i=0;i<10;i++)Model.step(s,u,.1);
 return s;
}
test("R44 cyclic correction is visibly quicker in low-speed hover than cruise",()=>{
 const nearPad=rotorAt(4),higher=rotorAt(20);
 assert.ok(nearPad.forwardMs>higher.forwardMs*1.2);
 assert.ok(nearPad.lateralMs>higher.lateralMs*1.2);
 assert.ok(nearPad.speedKt>0);
 assert.ok(Number.isFinite(nearPad.headingDeg));
 assert.ok(nearPad.altitudeM<12);
});
test("R44 stick release damps velocity without teleporting or holding position",()=>{
 const s=rotorAt(4),priorZ=s.zM,initial=Math.hypot(s.forwardMs,s.lateralMs);
 const u={...Model.makeInput("helicopter"),collective:.495,turbulence:0};
 for(let i=0;i<20;i++)Model.step(s,u,.1);
 assert.ok(Math.hypot(s.forwardMs,s.lateralMs)<initial*.45);
 assert.notEqual(s.zM,priorZ,"momentum should continue briefly after release");
 assert.ok(Number.isFinite(s.xM)&&Number.isFinite(s.zM));
});
test("C172 exterior has aircraft-specific blue/white cabin and tapered nose livery",()=>{
 const s=Geometry.buildVehicle("c172"),[sx,sy,sz]=Airframes.SCALE.c172;
 assert.ok(s.vertices<4000);
 for(const sign of [-1,1]){
  assert.ok(hasColoredPoint(s,sign*.79*sx,.13*sy,-1.62*sz,Colors.navy),"side cabin band");
  assert.ok(hasColoredPoint(s,sign*.64*sx,-.03*sy,-3.62*sz,Colors.blue),"aft side band");
  assert.ok(hasColoredPoint(s,sign*.69*sx,-.02*sy,3.56*sz,Colors.navy),"nose paint accent");
 }
});
test("R44 exterior gains separate cabin, cowling and tailboom details",()=>{
 const s=Geometry.buildVehicle("r44");
 assert.ok(s.vertices<4000,"phone exterior budget must remain bounded");
 for(const sign of [-1,1]){
  assert.ok(hasColoredPoint(s,sign*1.27,-.37,-1.64,Colors.navy),"bubble-cabin lower stripe");
  assert.ok(hasColoredPoint(s,sign*.36,.44,-2.30,Colors.blue),"tailboom stripe");
  assert.ok(hasPoint(s,sign*1.09,.16,-2.02),"engine cowling vent");
 }
});
test("all seven exterior meshes remain distinct",()=>{
 const ids=["c172","r44","fa18","f22","f35","typhoon","su37"];
 const vertices=ids.map(id=>Geometry.buildVehicle(id).vertices);
 assert.ok(vertices.every(n=>n>=50&&n<4000));
 assert.equal(vertices[0],3834);
 assert.equal(vertices[1],3984);
});
