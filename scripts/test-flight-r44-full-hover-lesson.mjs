// One continuous physics-driven R44 exercise: lift, steady hover for 8s,
// pedal-turn 90 degrees, and precision descent. Test-only simulated pilot:
// never installed into the app, no state teleports or automatic landing.
import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const M=require("../flight-sim-model.js");
const G=require("../flight-sim-guidance.js");
const state=M.makeState("helicopter");
const input=M.makeInput("helicopter");
input.turbulence=0;
const lesson=G.start(state);
const visits=[lesson.r44Lesson.stage],events=[];
let turnDone=false;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const delta=(target,current)=>((target-current+540)%360)-180;
const dt=.05;
for(let tick=0;tick<1800;tick++){
 const stage=lesson.r44Lesson.stage;
 input.rudder=0;input.bank=0;input.pitch=0;
 if(stage==="takeoff"){
  input.collective=.80;
 }else if(stage==="hover"){
  input.collective=.495;
 }else if(stage==="turn"){
  input.collective=.495;
  const remaining=delta((lesson.r44Lesson.turnStartHeading||0)+90,state.headingDeg);
  input.rudder=clamp(remaining*.075-(state.yawRateDegS||0)*.11,-.72,.72);
 }else{
  input.collective=.34;
 }
 const result=M.step(state,input,dt);
 events.push(...result.events);
 G.observe(lesson,state,result.events);
 if(visits.at(-1)!==lesson.r44Lesson.stage)visits.push(lesson.r44Lesson.stage);
 if(lesson.r44Lesson.stage==="return")turnDone=true;
 if(tick%120===0)console.log("R44 CONTINUOUS "+JSON.stringify({
  second:+state.time.toFixed(1),phase:state.phase,
  stage:lesson.r44Lesson.stage,alt:+state.altitudeM.toFixed(1),
  hdg:+state.headingDeg.toFixed(1),yaw:+state.yawRateDegS.toFixed(1),
  x:+state.xM.toFixed(1),z:+state.zM.toFixed(1),
  vs:+state.verticalMs.toFixed(2),hover:+state.hoverHoldSec.toFixed(1)
 }));
 if(lesson.r44Lesson.status!=="active")break;
}
const report={durationS:+state.time.toFixed(1),stageVisits:visits,
 phase:state.phase,status:lesson.r44Lesson.status,
 hoverHeld:state.hoverAchieved,turns:lesson.r44Lesson.turnsCompleted,
 grade:state.landingGrade,touchdown:state.touchdownData,
 events:[...new Set(events)],xM:state.xM,zM:state.zM};
console.log("R44 CONTINUOUS RESULT "+JSON.stringify(report));
assert.deepEqual(visits,["takeoff","hover","turn","return"],
 "one session must include all four ordered R44 instructor stages");
assert.ok(events.includes("liftoff")&&events.includes("hoverHeld")&&
 events.includes("touchdown"),"real flight physics must produce the major exercise events");
assert.equal(events.filter(e=>e==="hoverHeld").length,1,
 "8-second hover reward must fire only once");
assert.equal(lesson.r44Lesson.turnsCompleted,1);
assert.ok(turnDone&&state.onGround&&state.phase==="landed",
 "R44 must complete the full return and gentle skids-down landing without reset");
assert.equal(lesson.r44Lesson.status,"completed",
 "the actual flight-guidance lesson must recognize the exercise as complete");
assert.equal(state.landingGrade,"precision",
 "centre-pad gentle landing following the hover deserves precision grade");
assert.ok(Object.isFrozen(state.touchdownData));
assert.ok(state.touchdownData.padOffsetM<=6);
console.log("R44 lift-hover-turn-return-land continuous end-to-end exercise passed.");
