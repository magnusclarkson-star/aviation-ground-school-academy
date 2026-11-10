"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const M=require("../flight-sim-model.js");
function advance(state,input,ticks=1){
 let events=[];
 for(let i=0;i<ticks;i++){
  const step=M.step(state,input,.1);
  assert.equal(step.state,state);
  events.push(...step.events);
  for(const field of ["xM","zM","altitudeM","speedKt","headingDeg","verticalMs"])
   assert.ok(Number.isFinite(state[field]),field+" became non-finite");
 }
 return events;
}
test("C172 simulated takeoff produces a genuine airborne climb without a reset",()=>{
 const state=M.makeState("airplane","runway",{airframeId:"c172",windId:"calm"});
 const input={...M.makeInput("airplane"),throttle:1,pitch:-.5,turbulence:0};
 const events=advance(state,input,200);
 assert.ok(events.includes("liftoff"),"departure should reach liftoff");
 assert.equal(state.onGround,false);
 assert.ok(state.altitudeM>0);
 assert.ok(["climb","flight"].includes(state.phase));
});
test("C172 aligned final records contact and brakes to complete within runway",()=>{
 const state=M.makeState("airplane","approach",{airframeId:"c172",windId:"calm"});
 state.xM=0;state.zM=120;state.altitudeM=.12;
 state.headingDeg=0;state.trackDeg=0;state.rollDeg=0;state.pitchDeg=-2.8;
 state.speedKt=70;state.verticalMs=-1.8;
 const input={...M.makeInput("airplane"),throttle:.25,pitch:0,turbulence:0};
 let events=advance(state,input,5);
 assert.ok(events.includes("touchdown"),"contact must be detected");
 assert.equal(state.phase,"rollout");
 assert.ok(state.touchdownData);
 assert.equal(Object.isFrozen(state.touchdownData),true);
 assert.ok(state.touchdownData.sinkMs<0);
 const stopInput={...input,throttle:0,brake:true};
 events=advance(state,stopInput,120);
 assert.equal(state.phase,"complete");
 assert.ok(events.includes("completed"));
 assert.ok(state.speedKt<5);
 assert.ok(state.rolloutDistanceM>0);
 assert.ok(state.zM<=1820&&Math.abs(state.xM)<=28);
});
test("C172 off-strip final never grades a good touchdown",()=>{
 const state=M.makeState("airplane","approach",{airframeId:"c172",windId:"calm"});
 state.xM=35;state.zM=120;state.altitudeM=.06;
 state.headingDeg=0;state.trackDeg=0;state.speedKt=70;state.verticalMs=-1.8;
 const events=advance(state,{...M.makeInput("airplane"),throttle:.25,turbulence:0},5);
 assert.equal(state.phase,"halted");
 assert.ok(events.includes("hardLanding"));
});
test("R44 pad contact starts grounded with no phantom yaw",()=>{
 const state=M.makeState("helicopter","helipad",{windId:"calm"});
 const input={...M.makeInput("helicopter"),collective:.48,rudder:0,turbulence:0};
 advance(state,input,10);
 assert.equal(state.onGround,true);
 assert.equal(state.phase,"pad");
 assert.equal(state.yawRateDegS,0);
 assert.equal(state.altitudeM,0);
});
