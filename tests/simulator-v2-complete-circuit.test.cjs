"use strict";
// Deterministic end-to-end test pilot for the SIMULATED C172. This controller
// lives only in CI and never becomes an in-app autopilot, landing assist,
// or instructor takeover. It must fly every metre with normal M.step inputs.
const test=require("node:test");
const assert=require("node:assert/strict");
const M=require("../flight-sim-model.js");
const Circuit=require("../flight-sim-circuit-guide.js");
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const signed=(from,to)=>((to-from+540)%360)-180;
const headingTo=(s,x,z)=>(Math.atan2(x-s.xM,z-s.zM)*180/Math.PI+360)%360;
function pilot(s,leg){
 const u={...M.makeInput("airplane"),turbulence:0};
 if(s.onGround&&s.phase==="roll"){
  u.throttle=1;u.flaps=10;u.pitch=-.55;u.bank=0;return u;
 }
 if(s.phase==="rollout"){
  u.throttle=0;u.brake=true;u.pitch=0;u.bank=0;u.flaps=20;return u;
 }
 const last=leg==="final";
 u.throttle=last?.46:.65;
 u.flaps=last?20:10;
 const targetAltitude=last?
  Math.max(0,(200-s.zM)*Math.tan(3*Math.PI/180)):135;
 const baseVertical=(u.throttle-.5)*2-.48;
 const desiredVertical=last?
  clamp(-s.speedKt*M.KNOT*Math.tan(3*Math.PI/180)+
   (targetAltitude-s.altitudeM)*.13,-3.0,1.5):
  clamp((targetAltitude-s.altitudeM)*.10,-2.2,3.1);
 const speed=Math.max(24,s.speedKt*M.KNOT);
 const pitchDeg=Math.asin(clamp((desiredVertical-baseVertical)/(speed*.92),-.3,.3))*180/Math.PI;
 u.pitch=clamp(-pitchDeg/13,-.60,.6);
 let desiredHeading=0;
 if(leg==="crosswind")desiredHeading=90;
 if(leg==="downwind")desiredHeading=180;
 if(leg==="base")desiredHeading=270;
 if(last){
  // Point at a spot on the runway, not the aircraft's current heading.
  // Aim well ahead of the moving airplane. A point at z=140 becomes
  // BEHIND the aircraft once crossed and would command an unsafe sudden
  // turn just before wheel contact. Keep a positive look-ahead all the
  // way through the rollout approach; no artificial heading snap.
  desiredHeading=headingTo(s,0,Math.max(400,s.zM+650));
  // Intercept shallowly near the centreline, leaving bank authority to
  // the learner's normal flight model rather than snapping position.
  const offset=signed(0,desiredHeading);
  desiredHeading=(clamp(offset,-22,22)+360)%360;
 }
 const error=signed(s.headingDeg,desiredHeading);
 u.bank=clamp(error*.023,-.83,.83);
 return u;
}
function run(windId){
 const state=M.makeState("airplane","runway",{airframeId:"c172",windId});
 const circuit=Circuit.create(state);
 const phases=new Set([state.phase]);
 const stages=new Set([circuit.stage]);
 const events=new Set();
 let leg="departure",lastLeg=leg;
 let minAlt=0,maxAlt=0;
 let reachedFinal=false;
 const points={};
 let initialFinal=null,nearContact=null;
 for(let i=0;i<7400;i++){
  const dt=.05;
  if(leg==="departure"&&state.zM>=1330&&state.altitudeM>=70)leg="crosswind";
  else if(leg==="crosswind"&&state.xM>=555)leg="downwind";
  else if(leg==="downwind"&&state.zM<=-1300)leg="base";
  // Trigger the same advance turn indicated by the live instructor.
  else if(leg==="base"&&circuit.stage==="base"&&Circuit.status(circuit,state)?.turnNow)leg="final";
  if(leg!==lastLeg){points[leg]={x:Math.round(state.xM),z:Math.round(state.zM),
   alt:Math.round(state.altitudeM),heading:Math.round(state.headingDeg),
   time:Math.round(state.time)};lastLeg=leg;}
  if(state.onGround===false&&leg==="final"&&state.altitudeM<2&&state.zM>-100)
   nearContact={z:state.zM,x:state.xM,sink:state.verticalMs,
    bank:state.rollDeg,pitch:state.pitchDeg,speed:state.speedKt};
  const result=M.step(state,pilot(state,leg),dt);
  result.events.forEach(x=>events.add(x));
  Circuit.update(circuit,state);
  phases.add(state.phase);stages.add(circuit.stage);
  minAlt=Math.min(minAlt,state.altitudeM);maxAlt=Math.max(maxAlt,state.altitudeM);
  if(leg==="final"&&!reachedFinal&&Math.abs(signed(state.headingDeg,0))<25&&state.zM< -300){
   reachedFinal=true;initialFinal={x:state.xM,z:state.zM,heading:state.headingDeg,
    altitude:state.altitudeM,time:state.time};
  }
  for(const key of ["xM","zM","speedKt","altitudeM","verticalMs","headingDeg"])
   assert.ok(Number.isFinite(state[key]),windId+" flight "+key+" remains finite");
  if(["halted","complete"].includes(state.phase))break;
 }
 const detail={windId,leg,phase:state.phase,circuitStage:circuit.stage,
  time:+state.time.toFixed(1),x:+state.xM.toFixed(1),z:+state.zM.toFixed(1),
  height:+state.altitudeM.toFixed(1),heading:+state.headingDeg.toFixed(1),
  speed:+state.speedKt.toFixed(1),maxAlt:+maxAlt.toFixed(1),
  phases:[...phases],stages:[...stages],events:[...events],points,
  initialFinal,nearContact,touchdownData:state.touchdownData,
  rolloutM:state.rolloutDistanceM};
 console.log("C172 full flight "+JSON.stringify(detail));
 assert.ok(events.has("liftoff"),"real runway liftoff "+JSON.stringify(detail));
 assert.ok(maxAlt>90&&minAlt>=0,"climb to circuit height "+JSON.stringify(detail));
 assert.ok(["final"].includes(leg)&&reachedFinal,"return to home final through real heading changes "+JSON.stringify(detail));
 assert.ok(events.has("touchdown"),"approach lands, not terrain collision "+JSON.stringify(detail));
 assert.equal(state.phase,"complete","pilot brakes to finish on home runway "+JSON.stringify(detail));
 assert.ok(state.touchdownData&&Math.abs(state.touchdownData.offsetM)<24,
  "home runway contact is actually centred "+JSON.stringify(detail));
 assert.ok(state.rolloutDistanceM>20,
  "complete flight includes measurable rollout "+JSON.stringify(detail));
 return detail;
}
test("C172 completes an uninterrupted runway-circuit-landing-braking sequence in calm conditions",()=>{
 run("calm");
});
