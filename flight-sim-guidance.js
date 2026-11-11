/* Contextual fictional simulator practice cues and session observations.
 * Never gives real-world aircraft operating limits or graded pilot feedback.
 */
(function(root){"use strict";
const E=root?.AGSAFlightEnvironment||(typeof module!=="undefined"?require("./flight-sim-environment.js"):null);
const Circuit=root?.AGSACircuitGuide||(typeof module!=="undefined"?require("./flight-sim-circuit-guide.js"):null);
const Flight=root?.AGSAImmersiveFlight||(typeof module!=="undefined"?require("./flight-sim-model.js"):null);
if(!E)throw Error("Fictional aircraft profiles unavailable");
const validPhase=new Set(["roll","climb","flight","approach","rollout","complete","halted","pad","lift","hover","landed"]);
const round=x=>Math.round(Number.isFinite(x)?x:0);
// Use the active fictional jet profile rather than the default trainer
// threshold when coaching a jet. These numbers are invented simulation data.
const lowEnergyKt=state=>(Flight?.flightProfile?.(state)?.stallKt??
 E.selectProfile(state.profileId||"trainer").stallKt)+4;
const R44_STAGES=Object.freeze(["takeoff","hover","turn","return"]);
const headingDelta=(heading,start)=>((heading-start+540)%360+360)%360-180;
function newR44Lesson(){
 return {stage:"takeoff",status:"active",turnStartHeading:null,turnDeg:0,
  turnsCompleted:0,finishedAt:null};
}
function updateR44Lesson(lesson,state){
 if(!lesson||lesson.status!=="active")return;
 if(state.phase==="halted"){
  lesson.status="stopped";lesson.finishedAt=state.time;return;
 }
 if(state.phase==="landed"){
  lesson.status=lesson.stage==="return"&&state.landingGrade==="precision"?
   "completed":"incomplete";
  lesson.finishedAt=state.time;return;
 }
 if(lesson.stage==="takeoff"&&!state.onGround&&state.altitudeM>=2){
  lesson.stage="hover";
 }
 if(lesson.stage==="hover"&&state.hoverAchieved===true){
  lesson.stage="turn";
  lesson.turnStartHeading=Number.isFinite(state.headingDeg)?state.headingDeg:0;
 }
 if(lesson.stage==="turn"&&!state.onGround){
  const delta=headingDelta(Number.isFinite(state.headingDeg)?state.headingDeg:0,
   lesson.turnStartHeading??0);
  lesson.turnDeg=Math.round(Math.abs(delta));
  const inRange=Math.abs(delta)>=85&&Math.abs(delta)<=105;
  const controlled=state.altitudeM>=2&&state.altitudeM<=12&&
   Math.abs(state.verticalMs)<1.5&&state.groundSpeedKt<5&&
   Math.hypot(state.xM,state.zM)<=20&&Math.abs(state.yawRateDegS||0)<5;
  if(inRange&&controlled){
   lesson.stage="return";lesson.turnsCompleted++;
  }
 }
}
function r44LessonStatus(progress,state){
 const lesson=progress?.r44Lesson;
 if(!lesson)return null;
 const stage=lesson.stage;
 const n=Math.max(1,R44_STAGES.indexOf(stage)+1);
 const pct=Math.max(0,Math.min(8,state?.hoverHoldSec||0));
 const east=Number(state?.xM)||0,north=Number(state?.zM)||0;
 const offset=Math.hypot(east,north);
 const padBearing=((Math.atan2(-east,-north)*180/Math.PI)%360+360)%360;
 const relativePad=((padBearing-(Number(state?.headingDeg)||0)+540)%360)-180;
 const padCue=offset<2?"PAD CENTER":
  Math.abs(relativePad)<8?"PAD AHEAD":
  (relativePad>0?"PAD RIGHT ":"PAD LEFT ")+Math.round(Math.abs(relativePad))+"°";
 // Position of the helipad relative to the current rotorcraft nose.
 // Turning with pedals alone does not move toward the pad; this gives
 // a concise body-relative cyclic displacement cue without steering.
 const heading=(((Number(state?.headingDeg)||0)%360)+360)%360;
 const rad=heading*Math.PI/180;
 const fwd=-east*Math.sin(rad)-north*Math.cos(rad);
 const right=-east*Math.cos(rad)+north*Math.sin(rad);
 const dominant=Math.abs(fwd)>=Math.abs(right)?
  {direction:fwd>=0?"FWD":"BACK",metres:Math.abs(fwd)}:
  {direction:right>=0?"RIGHT":"LEFT",metres:Math.abs(right)};
 const cyclicCue=offset<2?"PAD CENTER":
  "PAD "+dominant.direction+" "+Math.max(1,Math.round(dominant.metres))+"m";
 const yaw=Number.isFinite(state?.yawRateDegS)?state.yawRateDegS:0;
 const pilotCue=lesson.status!=="active"?cyclicCue:
  stage==="turn"?"HDG "+String(Math.round(heading)%360).padStart(3,"0")+"° · YAW "+
   (yaw>=0?"+":"")+Math.round(yaw)+"°/s":
  stage==="return"?cyclicCue:
  stage==="hover"?"ALT "+round(state?.altitudeM)+"m · GS "+round(state?.groundSpeedKt)+"kt":
  "ALT "+round(state?.altitudeM)+"m · V/S "+(Number(state?.verticalMs)||0).toFixed(1);
 const captions={takeoff:"TAKEOFF",hover:"HOVER",turn:"90° TURN",return:"RETURN & LAND"};
 const contact=state?.mode==="helicopter"&&lesson.status!=="active"?
  state.touchdownData:null;
 const skidCue=contact?
  "SKIDS "+Math.abs(Number(contact.sinkMs)||0).toFixed(1)+" m/s · DRIFT "+
  (Number(contact.groundSpeedKt)||0).toFixed(1)+" kt · PAD "+
  Math.round(Number(contact.padOffsetM)||0)+" m":null;
 const short=lesson.status==="completed"?"LESSON COMPLETE":
  lesson.status==="incomplete"?"RESTART LESSON":
  lesson.status==="stopped"?"RESTART AFTER CONTACT":
  n+"/4 · "+captions[stage];
 const hint=skidCue||(
  lesson.status==="completed"?"Precision landing completed after the hover and turn.":
  lesson.status!=="active"?"Restart the helicopter exercise to try all four stages.":
  stage==="takeoff"?"Lift into a steady low hover above the helipad.":
  stage==="hover"?"Hold height and position for 8 seconds: "+Math.floor(pct)+"/8.":
  stage==="turn"?"Turn 90° with the pedals, then steady the heading: "+lesson.turnDeg+"°.":
  "Return to the helipad centre ("+Math.round(offset)+" m · "+padCue+"). "+
  "Cyclic target: "+cyclicCue+". Land gently after stabilising the drift.");
 return Object.freeze({stage,status:lesson.status,index:n,total:4,short,hint,pilotCue,cyclicCue,
  progress:stage==="hover"?Math.floor(pct):stage==="turn"?lesson.turnDeg:null,
  complete:lesson.status==="completed"});
}
function start(state){
 if(!state||!validPhase.has(state.phase))throw Error("Synthetic flight state required");
 return {
  scenario:state.scenario,mode:state.mode,lastPhase:state.phase,
  startAt:state.time,elapsed:0,maxHeight:Math.max(0,state.altitudeM),
  maxOffset:Math.abs(state.xM),minVertical:Math.min(0,state.verticalMs),
  phaseVisits:[state.phase],landings:0,hardContacts:0,liftoffs:0,
  r44Lesson:state.mode==="helicopter"?newR44Lesson():null,
  circuit:Circuit?.create(state)||null
 };
}
function observe(progress,state,events=[]){
 if(!progress||progress.mode!==state.mode||progress.scenario!==state.scenario)
  throw Error("Start a new practice session after switching aircraft or scenario");
 if(!Array.isArray(events))throw Error("Simulation events must be a list");
 progress.elapsed=Math.max(progress.elapsed,state.time-progress.startAt);
 progress.maxHeight=Math.max(progress.maxHeight,Math.max(0,state.altitudeM));
 progress.maxOffset=Math.max(progress.maxOffset,Math.abs(state.xM));
 progress.minVertical=Math.min(progress.minVertical,state.verticalMs);
 if(progress.lastPhase!==state.phase){
  progress.lastPhase=state.phase;
  if(!progress.phaseVisits.includes(state.phase))progress.phaseVisits.push(state.phase);
 }
 for(const event of events){
  if(event==="liftoff")progress.liftoffs++;
  if(event==="touchdown")progress.landings++;
  if(event==="hardLanding")progress.hardContacts++;
 }
 if(progress.r44Lesson)updateR44Lesson(progress.r44Lesson,state);
 if(progress.circuit)Circuit.update(progress.circuit,state);
 return progress;
}
function guidance(state,input,progress){
 if(!state||!input)throw Error("Synthetic aircraft data required");
 const phase=state.phase;
 const heli=state.mode==="helicopter";
 const base={tag:"LEARNING CUE",level:"normal",text:"Observe the fictional scenery and instruments together.",complete:false};
 if(heli&&progress?.r44Lesson){
  const lesson=r44LessonStatus(progress,state);
  return {...base,tag:"ROTORCRAFT · "+lesson.short,
   level:lesson.status==="completed"?"positive":
    lesson.status==="active"?"normal":"caution",
   text:lesson.hint,complete:lesson.status!=="active"};
 }
 if(!heli&&state.physicsId==="aero"&&state.aeroStalled===true&&
   ["climb","flight","approach"].includes(phase))
  return {...base,tag:"EXPERIMENTAL WING ENERGY CUE",level:"caution",
   text:"The invented aerodynamic model indicates insufficient wing energy or excessive angle of attack. Compare the fictional lift, drag, speed and pitch readings; this is not real stall recovery instruction."};
 if(phase==="halted"){
  if(state.mode==="airplane"&&/runway (excursion|overrun)/i.test(state.message||""))
   return {...base,tag:"RUNWAY EXCURSION",level:"caution",complete:true,
    text:state.message+" Restart and practise holding the centreline while slowing down."};
  return {...base,tag:"SIMULATION STOPPED",level:"caution",complete:true,
   text:"The imaginary aircraft contacted terrain outside this exercise's gentle-landing conditions. Reset and compare the controls, runway alignment and height trend."};
 }
 if(!heli&&phase==="complete"&&state.touchdownData){
  const landing=state.touchdownData;
  return {...base,tag:"RUNWAY PRACTICE · FINISHED",level:"positive",complete:true,
   // The actual contact snapshot is preserved across rollout. It lets a
   // phone learner review the landing without navigating to another panel.
   text:"TD "+round(landing.speedKt)+" kt · SINK "+
    Math.abs(Number(landing.sinkMs)||0).toFixed(1)+" m/s · OFFSET "+
    round(Math.abs(landing.offsetM))+" m · ROLL "+
    round(state.rolloutDistanceM)+" m"};
 }
 if(phase==="complete"||phase==="landed")
  return {...base,tag:"PRACTICE SEQUENCE COMPLETE",level:"positive",complete:true,
   text:"The fictional exercise finished. Review your session observations or reset to practise again; this is not a recorded flying qualification."};
 if(heli){
  if(phase==="pad")return {...base,tag:"ROTORCRAFT · BEFORE LIFT",
   text:"Observe the helipad and use the collective to explore simulated vertical lift. Cyclic and pedal inputs affect horizontal movement and turning."};
  if(phase==="lift")return {...base,tag:"ROTORCRAFT · LIFT",
   text:"Observe the height indication rising and compare small cyclic changes with scene motion. This does not model actual helicopter aerodynamics."};
  if(phase==="hover")return {...base,tag:"ROTORCRAFT · STATIONARY PRACTICE",
   text:"Compare horizontal displacement and vertical rate with small, fictional collective/cyclic inputs; aim to observe rather than imitate real helicopter procedures."};
  return {...base,tag:"ROTORCRAFT · MOVEMENT",
   text:"Notice the helipad moving in the visual scene. Explore the effect of collective on height and cyclic on direction in this simplified exercise."};
 }
 const circuit=Circuit?.status(progress?.circuit,state);
 // Prioritize a low-energy warning over route directions, even on a
 // full-circuit lesson. Previously a normal CLASSIC circuit cue masked
 // a low-speed aircraft throughout climb and free flight.
 if(!heli&&["climb","flight"].includes(phase)&&state.speedKt<lowEnergyKt(state))
  return {...base,tag:"FICTIONAL LOW-ENERGY CUE",level:"caution",
   text:"Simulated airspeed is low. Compare power, attitude and speed before continuing the illustrated circuit."};
 // The optional experimental flight model should not lose its waypoint
 // guidance: this route is informational and never overrides aerodynamics.
 if(circuit&&["climb","flight"].includes(phase)){
  return {...base,tag:"RETURN CIRCUIT · "+circuit.label,
   text:circuit.instructions};
 }
 if(phase==="roll"){
  if(state.speedKt<15)return {...base,tag:"RUNWAY · BUILDING MOTION",
   text:"Observe how increasing fictional throttle changes the speed indication and runway movement."};
  if(state.speedKt<lowEnergyKt(state))return {...base,tag:"RUNWAY · ACCELERATING",
   text:"Watch the runway centreline and rising simulated airspeed. This model does not represent any aircraft's real rotation speed."};
  return {...base,tag:"RUNWAY · PITCH RESPONSE",
   text:"Explore how a gentle nose-up command changes the artificial horizon and simulated lift. Numbers are invented for this demonstration."};
 }
 if(phase==="climb"){
  if(state.physicsId==="aero"&&!state.aeroStalled)
   return {...base,tag:"EXPERIMENTAL CLIMB · ENERGY TRADE",
    text:"Observe how a pitch change affects invented lift, drag, specific energy and vertical rate. This is not calibrated aircraft handling."};
  if(state.speedKt<lowEnergyKt(state))return {...base,tag:"FICTIONAL LOW-ENERGY CUE",level:"caution",
   text:"The simplified model indicates low airspeed while airborne. Observe the power, attitude and speed relationships; this is not an actual stall-warning system."};
  return {...base,tag:"CLIMB · INSTRUMENT CROSS-CHECK",
   text:"Compare the outside horizon with the mini attitude indicator, simulated vertical rate and increasing height. Small bank inputs affect heading."};
 }
 if(phase==="flight"){
  if(state.physicsId==="aero")
   return {...base,tag:"EXPERIMENTAL FLIGHT · LIFT AND DRAG",
    text:"Compare fictional angle of attack, lift and drag while using bank and pitch. The wing coefficients are invented and do not describe any aircraft."};
  if(state.windId&&state.windId!=="calm")
   return {...base,tag:"FREE FLIGHT · WIND AND TRACK",
    text:"Compare the fictional nose heading with the path over the moving ground. The two indications need not agree when wind shifts the aircraft sideways."};
  return {...base,tag:"FREE FLIGHT · BANK AND LEVEL",
   text:"Bank and turn back toward the runway using the live navigation map; the separate short-final setup is optional."};
 }
 if(phase==="approach"){
  if(state.physicsId==="aero"&&state.verticalMs<-3.4)
   return {...base,tag:"EXPERIMENTAL APPROACH · RAPID SINK",level:"caution",
    text:"The invented model shows a high descent rate. Compare illustrated wing energy and drag; reset the exercise rather than applying it to real-world flight."};
  // Prioritize excessive descent and low-speed cues over lateral
  // alignment, for *both* a direct short final and a flown return.
  if(state.verticalMs<-3.4)return {...base,tag:"SHORT FINAL · RAPID DESCENT",level:"caution",
   text:"The model shows a relatively high descent rate. Compare height and vertical-rate trends before the simulated touchdown."};
  if(state.speedKt<lowEnergyKt(state))return {...base,tag:"SHORT FINAL · LOW ENERGY",level:"caution",
   text:"The model's simulated airspeed is low. Compare speed, power and attitude; these are fictional limits."};
  // A flown return uses the moving map's compact centreline/glidepath/
  // ground-track correction, avoiding generic reset prompts or new buttons.
  if(state.scenario==="runway"&&circuit?.stage==="final"&&circuit.finalCue)
   return {...base,tag:"RETURN CIRCUIT · FINAL",
    level:Math.abs(state.xM)>24?"caution":"normal",
    text:circuit.instructions};
  if(Math.abs(state.xM)>24)return {...base,tag:"SHORT FINAL · ALIGNMENT",level:"caution",
   text:"The imaginary aircraft is offset from the runway. Compare the outside view with the lateral marker and heading."};
  if(state.windId&&state.windId!=="calm")
   return {...base,tag:"SHORT FINAL · WIND AND GROUND TRACK",
    text:"Compare simulated airspeed with ground speed, heading with actual track, and runway offset. This wind exercise is not an aircraft-specific crosswind landing technique."};
  return {...base,tag:"SHORT FINAL · THREE-POINT SCAN",
   text:"Scan runway alignment, artificial horizon and vertical-rate indication. Observe their relationship as the imaginary threshold approaches."};
 }
 if(phase==="rollout"){
  // Rollout is NOT finished at touchdown. Show runway-side position while
  // nearing the edge instead of making the learner infer it from the map.
  // These are fictional strip coordinates, not aircraft procedures.
  const crossM=Number.isFinite(state.xM)?state.xM:0;
  const nearEdge=Math.abs(crossM)>=20;
  const offCenter=Math.abs(crossM)>=12;
  const endForecast=E.runwayStopForecast(state,input,Flight?.flightProfile?.(state));
  const nearEnd=Boolean(endForecast?.endRisk);
  const offset=offCenter?" · RWY "+(crossM>0?"E":"W")+
   round(Math.abs(crossM))+" m":"";
  const motion="GS "+round(state.speedKt)+" kt · BRAKE "+
   round((state.rolloutBrakePressure||0)*100)+"%";
  return {...base,
   tag:nearEdge?"RUNWAY EDGE · ROLLOUT":nearEnd?
    "RUNWAY END · ROLLOUT":"AFTER TOUCHDOWN · ROLLOUT",
   level:nearEdge||nearEnd?"caution":"normal",
   text:motion+offset+(nearEdge?"":nearEnd?
    " · END "+round(endForecast.remainingM)+" m":
    offCenter?"":" · ROLL "+round(state.rolloutDistanceM)+" m")};
 }
 return base;
}
function summary(progress,state){
 if(!progress||!state)throw Error("Practice session required");
 const complete=["complete","landed"].includes(state.phase);
 const stopped=state.phase==="halted";
 return {
  outcome:complete?"Fictional exercise completed":stopped?"Fictional exercise stopped":"Practice in progress",
  seconds:round(progress.elapsed),
  maxHeightM:round(progress.maxHeight),
  maxLateralOffsetM:round(progress.maxOffset),
  peakDescentMs:Number(progress.minVertical.toFixed(1)),
  liftoffs:progress.liftoffs,touchdowns:progress.landings,
  touchdown:state.mode==="airplane"&&state.touchdownData?
   Object.freeze({
    speedKt:round(state.touchdownData.speedKt),
    sinkMs:Number(Math.abs(state.touchdownData.sinkMs||0).toFixed(1)),
    offsetM:round(Math.abs(state.touchdownData.offsetM)),
    rolloutM:round(state.rolloutDistanceM)
   }):null,
  rotorTouchdown:state.mode==="helicopter"&&state.touchdownData?
   Object.freeze({
    sinkMs:Number(Math.abs(state.touchdownData.sinkMs||0).toFixed(1)),
    driftKt:Number((state.touchdownData.groundSpeedKt||0).toFixed(1)),
    padOffsetM:round(state.touchdownData.padOffsetM),
    grade:state.touchdownData.grade
   }):null,
  stopEvents:progress.hardContacts,
  warning:"Session-only, fictional observations; not assessed or independently verified. No training credit."
 };
}
const api={start,observe,guidance,summary,r44LessonStatus};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightGuidance=api;
})(typeof window!=="undefined"?window:null);
