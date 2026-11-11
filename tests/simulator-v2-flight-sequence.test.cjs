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

test("C172 departs, climbs and turns through 180 degrees within the local scenery",()=>{
 const state=M.makeState("airplane","runway",{airframeId:"c172",windId:"calm"});
 const depart={...M.makeInput("airplane"),throttle:1,pitch:-.5,turbulence:0};
 let sawLiftoff=false;
 for(let i=0;i<650&&state.phase!=="flight";i++){
  if(advance(state,depart).includes("liftoff"))sawLiftoff=true;
 }
 assert.ok(sawLiftoff,"the exercise must lift off from its own runway");
 assert.equal(state.phase,"flight","the aircraft must climb to circuit height");
 const startX=state.xM,startZ=state.zM,startTime=state.time;
 const turn={...depart,bank:1,pitch:0,throttle:.72};
 let reachedSouth=false;
 for(let i=0;i<750;i++){
  advance(state,turn);
  if(state.headingDeg>=165&&state.headingDeg<=195){
   reachedSouth=true;
   break;
  }
  assert.notEqual(state.phase,"halted","turn should not trigger an unintended crash");
 }
 assert.ok(reachedSouth,"full right yoke must turn the C172 back toward south");
 assert.ok(state.time-startTime<75,"return turn should fit in a short practice flight");
 assert.ok(Math.hypot(state.xM-startX,state.zM-startZ)<3500,
  "turn must remain inside the illustrated local practice area");
 assert.ok(state.altitudeM>0,"aircraft must remain airborne while turning");
});


test("R44 airborne full pedal turns through 180 degrees and reverses cleanly",()=>{
 const s=M.makeState("helicopter","helipad",{windId:"calm"});
 const u={...M.makeInput("helicopter"),collective:.8,turbulence:0};
 advance(s,u,35);
 assert.equal(s.onGround,false,"pilot must raise skids before turning");
 u.collective=.495;u.rudder=1;
 let crossed=false;
 for(let i=0;i<125;i++){
  advance(s,u,1);
  if(s.headingDeg>=175&&s.headingDeg<=195){crossed=true;break}
 }
 assert.ok(crossed,"full right pedal must turn heading around within 12.5 seconds");
 assert.ok(s.yawRateDegS>=20&&s.yawRateDegS<=35,
  "pedal visibly changes yaw rate; not merely the control readout");
 u.rudder=-1;
 advance(s,u,16);
 assert.ok(s.yawRateDegS<0,"opposite pedal must reverse actual yaw motion");
 assert.ok(s.altitudeM>0,"turn manoeuvre remains airborne");
});
test("R44 forward-flight cyclic banking makes a useful turn with pedals centred",()=>{
 const s=M.makeState("helicopter","helipad",{windId:"calm"});
 const u={...M.makeInput("helicopter"),collective:.8,pitch:-.75,turbulence:0};
 advance(s,u,55);
 assert.ok(s.forwardMs>3,"aircraft must have forward movement for bank-assisted turning");
 const start=s.headingDeg;
 u.collective=.495;u.bank=.85;u.rudder=0;
 advance(s,u,160);
 const delta=(s.headingDeg-start+360)%360;
 console.log("R44 turn diag",JSON.stringify({delta,forward:s.forwardMs,alt:s.altitudeM,phase:s.phase,roll:s.rollDeg,heading:s.headingDeg,start}));
 assert.ok(delta>45&&delta<240,
  "sustained cyclic bank turn: "+JSON.stringify({delta,forward:s.forwardMs,alt:s.altitudeM,phase:s.phase}));
 assert.equal(s.onGround,false);
});
