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
 const offset=Math.hypot(Number(state?.xM)||0,Number(state?.zM)||0);
 const captions={takeoff:"TAKEOFF",hover:"HOVER",turn:"90° TURN",return:"RETURN & LAND"};
 const short=lesson.status==="completed"?"LESSON COMPLETE":
  lesson.status==="incomplete"?"RESTART LESSON":
  lesson.status==="stopped"?"RESTART AFTER CONTACT":
  n+"/4 · "+captions[stage];
 const hint=lesson.status==="completed"?"Precision landing completed after the hover and turn.":
  lesson.status!=="active"?"Restart the helicopter exercise to try all four stages.":
  stage==="takeoff"?"Lift into a steady low hover above the helipad.":
  stage==="hover"?"Hold height and position for 8 seconds: "+Math.floor(pct)+"/8.":
  stage==="turn"?"Turn 90° with the pedals, then steady the heading: "+lesson.turnDeg+"°.":
  "Return to the helipad centre ("+Math.round(offset)+" m away) and land gently.";
 return Object.freeze({stage,status:lesson.status,index:n,total:4,short,hint,
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
 if(phase==="halted")return {...base,tag:"SIMULATION STOPPED",level:"caution",complete:true,
  text:"The imaginary aircraft contacted terrain outside this exercise's gentle-landing conditions. Reset and compare the controls, runway alignment and height trend."};
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
  // Real flown returns have both a live centreline and a ground-track
  // intercept cue in the moving map. Reuse it in the small coaching strip
  // instead of reverting to generic "short final" reset instructions.
  // A direct short-final practice setup retains the earlier lesson prompts.
  if(state.scenario==="runway"&&circuit?.stage==="final"&&circuit.finalCue&&
   state.verticalMs>=-3.4&&state.speedKt>=lowEnergyKt(state))
   return {...base,tag:"RETURN CIRCUIT · FINAL",
    level:Math.abs(state.xM)>24?"caution":"normal",
    text:circuit.instructions};
  if(Math.abs(state.xM)>24)return {...base,tag:"SHORT FINAL · ALIGNMENT",level:"caution",
   text:"The imaginary aircraft is offset from the drawn runway. Compare the outside view with the lateral-offset marker and heading."};
  if(state.verticalMs<-3.4)return {...base,tag:"SHORT FINAL · RAPID DESCENT",level:"caution",
   text:"The model shows a relatively high descent rate. Observe the height and vertical-rate trends; reset the fictional approach rather than forcing a touchdown."};
  if(state.speedKt<lowEnergyKt(state))return {...base,tag:"SHORT FINAL · LOW ENERGY",level:"caution",
   text:"The model's simulated airspeed is low. Use the practice reset if you want to compare a different approach state. These are not aircraft-specific limits."};
  if(state.windId&&state.windId!=="calm")
   return {...base,tag:"SHORT FINAL · WIND AND GROUND TRACK",
    text:"Compare simulated airspeed with ground speed, heading with actual track, and runway offset. This wind exercise is not an aircraft-specific crosswind landing technique."};
  return {...base,tag:"SHORT FINAL · THREE-POINT SCAN",
   text:"Scan runway alignment, artificial horizon and vertical-rate indication. Observe their relationship as the imaginary threshold approaches."};
 }
 if(phase==="rollout")return {...base,tag:"AFTER TOUCHDOWN · ROLLOUT",
  text:"Observe the fictional speed decreasing as power is reduced and the wheel-brake control is held. This is not an aircraft operating procedure."};
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
  stopEvents:progress.hardContacts,
  warning:"Session-only, fictional observations; not assessed or independently verified. No training credit."
 };
}
const api={start,observe,guidance,summary,r44LessonStatus};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightGuidance=api;
})(typeof window!=="undefined"?window:null);
