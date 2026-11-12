// End-to-end deterministic C172 circuit check.
// The controller below exists ONLY in this test. The production simulator
// remains fully hand-flown; no autoland/autopilot or resets are introduced.
import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const M=require("../flight-sim-model.js");
const Circuit=require("../flight-sim-circuit-guide.js");
const s=M.makeState("airplane","runway",{airframeId:"c172",windId:"calm"});
const u=M.makeInput("airplane");
const dt=.05, DEG=180/Math.PI;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=d=>(d%360+360)%360;
const delta=(a,b)=>((wrap(b)-wrap(a)+540)%360)-180;
const bearing=(x,z)=>wrap(Math.atan2(x-s.xM,z-s.zM)*DEG);
const log=(stage)=>console.log("C172 CIRCUIT "+JSON.stringify({
 stage,seconds:+s.time.toFixed(1),phase:s.phase,
 x:+s.xM.toFixed(1),z:+s.zM.toFixed(1),alt:+s.altitudeM.toFixed(1),
 hdg:+wrap(s.headingDeg).toFixed(1),gs:+s.groundSpeedKt.toFixed(1),
 speed:+s.speedKt.toFixed(1),vs:+s.verticalMs.toFixed(2),
 pitch:+s.pitchDeg.toFixed(1),bank:+s.rollDeg.toFixed(1)
}));
const schedule=[
 {name:"departure",target:[0,1650],height:130,throttle:.66,flaps:10},
 {name:"crosswind",target:[800,1680],height:140,throttle:.53,flaps:0},
 {name:"downwind",target:[900,-1370],height:145,throttle:.48,flaps:0},
 {name:"base",target:[100,-1700],height:105,throttle:.39,flaps:10},
 {name:"final",target:[0,200],height:0,throttle:.32,flaps:20}
];
const itinerary=[],events=new Set(),circuit=Circuit.create(s);
const actualGuideStages=[circuit.stage];
let leg=0,landed=false,completed=false;
u.throttle=1;u.flaps=10;u.pitch=-.72;
for(let i=0;i<10500;i++){
 if(s.phase==="halted")break;
 const current=schedule[leg];
 if(s.onGround){
  u.bank=0;u.rudder=0;
  if(s.phase==="rollout"){
   u.throttle=0;u.brake=true;u.pitch=0;u.flaps=20;
  }else{u.throttle=1;u.brake=false;u.pitch=-.72;u.flaps=10;}
 }else{
  u.throttle=current.throttle;u.flaps=current.flaps;u.brake=false;
  // Turn using *normal* simulator bank input toward live fixed waypoints.
  // Follow current ground-position geometry, not fixed heading teleport.
  const targetHeading=leg===4?
   wrap(Math.atan2(-s.xM,Math.max(380,200-s.zM))*DEG):
   bearing(current.target[0],current.target[1]);
  const difference=delta(s.headingDeg,targetHeading);
  u.bank=clamp(difference*.028,-.98,.98);
  u.rudder=0;
  const targetHeight=leg===4?
   Math.max(0,(200-s.zM)*Math.tan(3*Math.PI/180)):
   current.height;
  const feedforward=leg===4?
   -Math.max(25,s.groundSpeedKt)*M.KNOT*Math.tan(3*Math.PI/180):0;
  const vertical=clamp(feedforward+(targetHeight-s.altitudeM)*(leg===4?.09:.04),
   leg===4?-2.7:-2.4,leg===4?2.0:3.0);
  const powerClimb=(u.throttle-.5)*2-.48;
  const speedMs=Math.max(25,s.speedKt*M.KNOT);
  const requiredAngle=Math.asin(clamp((vertical-powerClimb)/(speedMs*.92),-.28,.28))*DEG;
  u.pitch=clamp(-requiredAngle/13,-.6,.6);
 }
 const result=M.step(s,u,dt);
 for(const ev of result.events)events.add(ev);
 Circuit.update(circuit,s);
 if(actualGuideStages.at(-1)!==circuit.stage)actualGuideStages.push(circuit.stage);
 if(!s.onGround&&leg===0&&s.zM>1280){
  itinerary.push("departure");log("departure-turn");leg=1;
 }else if(!s.onGround&&leg===1&&s.xM>590&&s.zM>600){
  itinerary.push("crosswind");log("crosswind-turn");leg=2;
 }else if(!s.onGround&&leg===2&&s.zM< -1100&&s.xM>200){
  itinerary.push("downwind");log("downwind-turn");leg=3;
 }else if(!s.onGround&&leg===3&&s.zM< -1430&&s.xM<500){
  itinerary.push("base");log("base-turn");leg=4;
 }
 if(result.events.includes("touchdown")){
  landed=true;log("touchdown");
 }
 if(result.events.includes("completed")){
  completed=true;log("completed");break;
 }
 if(i%600===0)log("sample-"+leg);
 if(s.onGround&&!["roll","rollout","complete"].includes(s.phase))break;
}
log("final-"+leg);
console.log("C172 CIRCUIT RESULT "+JSON.stringify({
 itinerary,events:[...events],leg,phase:s.phase,landed,completed,
 touchdown:s.touchdownData,rolloutM:s.rolloutDistanceM,
 circuitStage:circuit.stage,actualGuideStages
}));
assert.deepEqual(actualGuideStages,
 ["departure","crosswind","downwind","base","final","landed"],
 "the existing instructor/circuit navigation must recognize every leg from live flight state");
assert.deepEqual(itinerary,["departure","crosswind","downwind","base"],
 "one uninterrupted C172 flight must navigate all four named legs");
assert.ok(landed&&completed&&s.phase==="complete",
 "the same C172 flight must land and brake to a stop, with no reset");
assert.ok(events.has("liftoff")&&events.has("touchdown")&&events.has("completed"));
assert.ok(s.touchdownData&&Math.abs(s.touchdownData.offsetM)<24,
 "touchdown must be within the simulated runway width");
assert.ok(s.rolloutDistanceM>30&&s.rolloutDistanceM<1800,
 "actual braking rollout must accumulate positive, finite travel");
console.log("One continuous C172 takeoff, four-leg circuit, aligned touchdown and full-stop rollout passed.");
