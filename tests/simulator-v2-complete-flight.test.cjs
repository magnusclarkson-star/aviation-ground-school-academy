"use strict";
// Complete *uninterrupted* flight regression: controls are supplied exactly
// through step(), with no state teleport, reset, autopilot or hidden landing
// trigger. The tiny pilot steering script lives only in this test. In the app
// the learner still flies independently with the normal touch controls.
const test=require("node:test");
const assert=require("node:assert/strict");
const M=require("../flight-sim-model.js");
const G=require("../flight-sim-guidance.js");
const Circuit=require("../flight-sim-circuit-guide.js");
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const signed=v=>((v+540)%360)-180;
const finite=state=>{
 for(const prop of ["xM","zM","altitudeM","speedKt","headingDeg",
  "groundSpeedKt","verticalMs","rollDeg","pitchDeg"])
  assert.ok(Number.isFinite(state[prop]),prop+" became invalid");
};

test("C172 same-flight departure, four-leg right circuit, real final, touchdown and brake stop",()=>{
 const s=M.makeState("airplane","runway",{airframeId:"c172",windId:"calm"});
 const u={...M.makeInput("airplane"),turbulence:0};
 const session=G.start(s);
 const waypoints=[[0,1550],[700,1700],[925,-1350],[120,-1680],[0,300]];
 let leg=0,events=[],visits=[],maxOffset=0;
 for(let tick=0;tick<2600&&!["complete","halted"].includes(s.phase);tick++){
  if(s.onGround&&s.phase==="roll"){
   u.throttle=1;u.pitch=-.55;u.bank=0;u.rudder=0;u.brake=false;
  }else if(s.phase==="rollout"){
   u.throttle=0;u.pitch=0;u.bank=0;u.rudder=clamp(-s.xM*.03,-1,1);
   u.brake=true;
  }else{
   const [wx,wz]=waypoints[Math.min(leg,4)];
   const bearing=(Math.atan2(wx-s.xM,wz-s.zM)*180/Math.PI+360)%360;
   u.bank=clamp(signed(bearing-s.headingDeg)/36,-1,1);
   u.rudder=0;u.throttle=leg>=3?.24:.58;u.brake=false;
   const height=leg===3?110:leg>=4?
    clamp((230-s.zM)*.052,0,120):140;
   // On final, fly a descent as well as correcting the remaining glide
   // height; a height-only cue would leave the trainer 40m too high.
   const targetVS=leg<3?
    clamp((height-s.altitudeM)*.05,-2.5,2.5):
    clamp(-s.groundSpeedKt*.514444*.055+
      (height-s.altitudeM)*.11,-3.05,1.2);
   const pitchDeg=clamp((targetVS+.48-(u.throttle-.5)*2)/
    (Math.max(40,s.speedKt)*.514*.92)*57.3,-8,10);
   u.pitch=clamp(-pitchDeg/13,-.75,.7);
   if(leg===0&&s.zM>1350)leg=1;
   if(leg===1&&s.xM>570)leg=2;
   if(leg===2&&s.zM< -1200)leg=3;
   if(leg===3&&s.xM<330)leg=4;
  }
  const result=M.step(s,u,.1);
  G.observe(session,s,result.events);
  finite(s);
  maxOffset=Math.max(maxOffset,Math.abs(s.xM));
  events.push(...result.events.filter(e=>
   ["liftoff","touchdown","completed","hardLanding","runwayExcursion"].includes(e)));
  if(!visits.includes(session.circuit.stage))visits.push(session.circuit.stage);
 }
 assert.equal(s.phase,"complete","same-flight runway return must finish without reset");
 assert.deepEqual(events,["liftoff","touchdown","completed"],
  "no hidden crash, reset or teleported approach");
 assert.deepEqual(visits,["departure","crosswind","downwind","base","final","landed"],
  "navigation stages must track actual flown positions and heading");
 assert.equal(leg,4,"all outbound and inbound legs actually flown");
 assert.ok(s.time>150&&s.time<250,"continuous finite-length practice flight");
 assert.ok(maxOffset>500&&maxOffset<1400,"loop includes meaningful runway separation");
 assert.ok(Math.abs(s.touchdownData.offsetM)<15,"touch down on centreline");
 assert.ok(s.touchdownData.speedKt>=55&&s.touchdownData.speedKt<90,
  "touchdown airspeed comes from the flight model");
 assert.ok(Math.abs(s.touchdownData.sinkMs)<3.3,"real low sink rate at contact");
 assert.ok(s.touchdownData.runwayPositionM>=0&&s.touchdownData.runwayPositionM<600);
 assert.ok(s.rolloutDistanceM>70&&s.rolloutDistanceM<500,"real braking distance");
 assert.equal(session.liftoffs,1);
 assert.equal(session.landings,1);
 assert.equal(session.hardContacts,0);
 assert.equal(G.summary(session,s).outcome,"Fictional exercise completed");
 assert.equal(Circuit.status(session.circuit,s).stage,"landed");
});

test("R44 same-flight liftoff, eight-second hover, 90-degree pedal turn, return and precision landing",()=>{
 const s=M.makeState("helicopter","helipad",{windId:"calm"});
 const u={...M.makeInput("helicopter"),turbulence:0,collective:.8};
 const session=G.start(s);
 let maxPadOffset=0,events=[],stages=[];
 for(let tick=0;tick<850&&!["landed","halted"].includes(s.phase);tick++){
  const t=tick*.1;
  u.collective=t>2.6?.493:.8;
  u.rudder=0;u.bank=0;u.pitch=0;
  if(session.r44Lesson.stage==="turn"){
   const error=signed(90-s.headingDeg);
   u.rudder=clamp(error/28-s.yawRateDegS/17,-1,1);
  }
  if(session.r44Lesson.stage==="return"){
   u.rudder=clamp(signed(90-s.headingDeg)/30-s.yawRateDegS/18,-1,1);
   // The instructor does not reposition the helicopter. Make a visible
   // excursion using cyclic, then manually correct using body coordinates.
   if(t>24&&t<29)u.pitch=-.24;
   else if(t>=29){
    const hd=s.headingDeg*Math.PI/180;
    const forward=s.xM*Math.sin(hd)+s.zM*Math.cos(hd);
    const right=s.xM*Math.cos(hd)-s.zM*Math.sin(hd);
    u.pitch=clamp((forward*.35+s.forwardMs*1.35)/12,-.35,.35);
    u.bank=clamp((-right*.35-s.lateralMs*1.35)/11,-.35,.35);
   }
   if(t>=44)u.collective=.36;
  }
  const result=M.step(s,u,.1);
  G.observe(session,s,result.events);
  finite(s);
  maxPadOffset=Math.max(maxPadOffset,Math.hypot(s.xM,s.zM));
  events.push(...result.events.filter(e=>
   ["liftoff","hoverHeld","touchdown","hardLanding"].includes(e)));
  const stage=session.r44Lesson.stage;
  if(!stages.includes(stage))stages.push(stage);
 }
 assert.equal(s.phase,"landed");
 assert.equal(s.landingGrade,"precision","must return onto the original landing pad");
 assert.deepEqual(stages,["takeoff","hover","turn","return"]);
 assert.deepEqual(events,["liftoff","hoverHeld","touchdown"]);
 assert.equal(session.r44Lesson.status,"completed");
 assert.equal(session.r44Lesson.turnsCompleted,1);
 assert.ok(maxPadOffset>7,"cyclic really moves rotorcraft away from pad");
 assert.ok(s.touchdownData.padOffsetM<3,"pilot corrects position before descent");
 assert.ok(s.touchdownData.groundSpeedKt<1);
 assert.ok(Math.abs(s.touchdownData.yawRateDegS)<4);
 assert.ok(s.touchdownData.sinkMs>-1.4);
 assert.equal(session.hardContacts,0);
 assert.equal(session.landings,1);
 assert.equal(G.summary(session,s).rotorTouchdown.grade,"precision");
});