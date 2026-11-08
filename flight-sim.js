/* Academy immersive fictional simulator: desktop + multi-touch phone inputs.
 * Flight logic and visual renderer are local-only. Device vibration is opt-in.
 */
(()=>{"use strict";
const M=window.AGSAImmersiveFlight,S=window.AGSAFlightScenery,H=window.AGSAFlightHaptics,
 I=window.AGSAFlightInstruments,G=window.AGSAFlightGuidance,
 P=window.AGSAFlightGamepad,U=window.AGSAFlightGamepadUI,
 E=window.AGSAFlightEnvironment,T=window.AGSAFlight3D,
 A=window.AGSAFlightSystems,D=window.AGSAFlightAerodynamics,
 W=window.AGSAFlightLoading,X=window.AGSAFlightExercises,
 V=window.AGSAFlightInstructorVoice,R=window.AGSAFlightRecorder,Q=window.AGSAFlightReplay,Z=window.AGSAFlightAfterAction,O=window.AGSAFlightPlayback,C=window.AGSAFlightMomentCoach;
const $=id=>document.getElementById(id);
if(!M||!S||!H||!I||!G||!P||!U||!E||!T||!A||!D||!W||!X||!V||!R||!Q||!Z||!O||!C){document.body.insertAdjacentText("afterbegin","Simulator assets could not load.");return}
const canvas=$("outsideView"),canvas3D=$("outsideView3D"),haptics=H.createHaptics();
let renderer3D=null,prev3D=0,prev2D=0;
const prefersLessMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
const intensity=[0,.14,.37,.75];
const intensityNames=["Off","Light","Moderate","Bumpy"];
let type="yoke",state=M.makeState("airplane"),input=M.makeInput("airplane");
let practice=G.start(state);
const trace=R.makeRecorder();
const playback=O.makePlayer();
function pauseReplay(){
 playback.pause();
 $("tracePlayPause").textContent="Play recorded samples";
 $("tracePlayPause").setAttribute("aria-pressed","false");
}
function refreshReplay(){
 const rows=Q.prepare(trace.exportData().observations);
 const panel=$("traceReplayPanel"),stateOfPlayer=playback.status();
 $("traceReplay").disabled=trace.status().active||!rows.length;
 $("tracePlayPause").disabled=panel.hidden||trace.status().active||rows.length<2;
 if(panel.hidden)return;
 if(!rows.length){panel.hidden=true;pauseReplay();return;}
 const slider=$("traceReplayIndex");slider.max=String(rows.length-1);
 const idx=Math.min(stateOfPlayer.index,rows.length-1);slider.value=String(idx);
 Q.draw($("traceReplayCanvas"),rows,idx);
 $("traceReplayDetail").textContent=Q.describe(rows,idx);
 const moment=C.inspect(trace.exportData().observations,idx,$("traceMomentPathway").value);
 $("traceMomentTitle").textContent=moment.title;
 $("traceMomentFacts").textContent=moment.observations;
 $("traceMomentQuestion").textContent=moment.question;
 $("traceMomentNotice").textContent=moment.warning;
 $("tracePlayPause").textContent=stateOfPlayer.playing?"Pause replay":"Play recorded samples";
 $("tracePlayPause").setAttribute("aria-pressed",String(stateOfPlayer.playing));
}
function traceStatus(){const t=trace.status();$("traceStatus").textContent=(t.active?"Recording: ":"Recorder: ")+t.reason+" · "+t.samples+" samples · "+Math.round(t.seconds)+" simulated seconds";$("traceStart").disabled=t.active;$("traceStop").disabled=!t.active;$("traceDownload").disabled=t.active||!t.samples;$("traceReplay").disabled=t.active||!t.samples;$("traceInsights").disabled=t.active||t.samples<2;}
function clearTrace(){trace.clear();playback.load(0);$("traceReplayPanel").hidden=true;$("traceInsightsPanel").hidden=true;traceStatus();refreshReplay();}
let systems=A.create(state.mode);
A.step(systems,state,input,0);
let hardware=null;
let exerciseSession=X.begin("cgTransfer","trainer");
let exerciseApplying=false;
let instructorVoice=null;
let paused=false,lastFrame=0,prevView=0,prevViewTrace=0,dragPointer=null;
const pointers={left:null,right:null,brake:null};
const keys=new Set();
let lastPhase=state.phase;
const round=x=>Math.round(Number(x)||0);
function show(id,value){$(id).classList.toggle("hidden",!value)}
function visualMessage(message,status){
 $("visualStatus").textContent=message;
 $("visualStatus").dataset.status=status;
}
function fallbackTo2D(message){
 if(renderer3D){renderer3D.destroy();renderer3D=null}
 canvas3D.hidden=true;
 document.querySelector(".scene-shell")?.classList?.remove("three-dimensional");
 $("cameraMode").value="cockpit";
 $("cameraMode").disabled=true;
 visualMessage(message,"fallback");
 prev2D=0;
 S.draw(canvas,state,{reducedMotion:prefersLessMotion});
}
// No private API, hidden service or remote rendering. When WebGL2 is not
// available (including context loss), the original Canvas 2D keeps working.
function chooseVisual(){
 if($("visualMode").value==="2d"){
  fallbackTo2D("Lightweight 2D selected. The original runway view remains fully functional.");
  return;
 }
 if(!renderer3D){
  renderer3D=T.createRenderer(canvas3D,{onLost:()=>fallbackTo2D(
   "3D graphics context lost. Switched safely to 2D; you may retry 3D.")});
 }
 if(!renderer3D){
  fallbackTo2D("3D graphics unavailable on this browser/device. Automatically using 2D scenery.");
  return;
 }
 canvas3D.hidden=false;
 document.querySelector(".scene-shell").classList.add("three-dimensional");
 $("cameraMode").disabled=false;
 try{
  if(renderer3D.draw(state,{view:$("cameraMode").value,animation:systems.parts})){
   visualMessage("3D WebGL2 airfield active: real geometric terrain, runway, buildings, trees and optional chase aircraft. Fictional scenery, not a surveyed airport.","active");
   prev3D=0;return;
  }
 }catch{}
 fallbackTo2D("3D renderer could not draw. Automatically using 2D scenery.");
}
function drawScenery(now){
 if(renderer3D){
  if(now-prev3D>=33){
   try{if(!renderer3D.draw(state,{view:$("cameraMode").value,animation:systems.parts})){
    fallbackTo2D("3D graphics context lost or became unavailable; switched safely to 2D scenery.");
   }}catch{fallbackTo2D("3D rendering error; switched to 2D scenery.");}
   prev3D=now;
  }
  // Keep a warm 2D fallback without rendering it at full frame rate on phones.
  if(now-prev2D>=300){
   S.draw(canvas,state,{reducedMotion:prefersLessMotion});prev2D=now;
  }
 }else if(now-prev2D>=42){
  S.draw(canvas,state,{reducedMotion:prefersLessMotion});prev2D=now;
 }
}
function setValues(){
 $("power").value=String(round(input.throttle*100));
 $("powerValue").textContent=round(input.throttle*100)+"%";
 $("collective").value=String(round(input.collective*100));
 $("collectiveValue").textContent=round(input.collective*100)+"%";
 $("flaps").value=String(input.flaps);
 $("turbulence").value=String(intensity.indexOf(input.turbulence)<0?1:intensity.indexOf(input.turbulence));
 $("turbulenceValue").textContent=intensityNames[Number($("turbulence").value)];
}
function gripTransform(){
 const pad=$("controlPad").getBoundingClientRect();
 const tx=input.bank*Math.min(36,pad.width*.13);
 const ty=input.pitch*Math.min(22,pad.height*.115);
 const turn=type==="yoke"?input.bank*16:input.bank*5;
 $("flightGrip").style.transform="translate("+tx.toFixed(1)+"px,"+ty.toFixed(1)+"px) rotate("+turn.toFixed(1)+"deg)";
 $("cmdBank").textContent=(input.bank>=0?"+":"")+round(input.bank*100)+"%";
 $("cmdPitch").textContent=(input.pitch<=0?"+":"")+round(-input.pitch*100)+"%";
}
function updateReadouts(){
 const n=state;
 $("readSpeed").textContent=round(n.speedKt);
 $("readAlt").textContent=round(n.altitudeM);
 $("readVS").textContent=n.verticalMs.toFixed(1);
 $("readHeading").textContent=String(round(n.headingDeg)%360).padStart(3,"0")+"°";
 $("readAttitude").textContent=round(n.pitchDeg)+"° / "+round(n.rollDeg)+"°";
 $("readOffset").textContent=round(n.xM);
 $("readGroundSpeed").textContent=round(n.groundSpeedKt)+" kt";
 $("readTrack").textContent=String(round(n.trackDeg??n.headingDeg)%360).padStart(3,"0")+"°";
 $("readWind").textContent=E.describeWind(n.windId||"calm");
 $("sceneSpeed").textContent=round(n.speedKt)+" KT";
 $("sceneHeight").textContent=round(n.altitudeM)+" M AGL";
 const phase={
  roll:"RUNWAY ROLL",climb:"CLIMB",flight:"FREE FLIGHT",approach:"FINAL APPROACH",
  rollout:"TOUCHDOWN / ROLLOUT",complete:"RUNWAY EXERCISE FINISHED",halted:"RESTART ADVISED",
  pad:"HELIPAD READY",lift:"LIFT",hover:"HOVER",landed:"HELIPAD LANDED"
 }[n.phase]||"EDUCATIONAL SIM";
 $("flightPhase").textContent=phase;
 $("scenePhase").textContent=phase;
 $("flightMessage").textContent=n.message;
 I.paint(document,state);
 const cue=G.guidance(state,input),stats=G.summary(practice,state);
 $("coachPhase").textContent=cue.tag;
 $("coachText").textContent=cue.text;
 $("coachGlance").dataset.level=cue.level;
 $("coachElapsed").textContent=stats.seconds+" s";
 $("coachMaxHeight").textContent=stats.maxHeightM+" m";
 $("coachLandings").textContent=String(stats.touchdowns);
 const systemReadout=A.snapshot(systems);
 for(const [id,value] of [
  ["systemsEngineLabel",systemReadout.engineLabel],
  ["systemsEngineValue",systemReadout.engineValue],
  ["systemsPowerLabel",systemReadout.powerLabel],
  ["systemsPowerValue",systemReadout.powerValue],
  ["systemsFlapLabel",systemReadout.flapLabel],
  ["systemsFlapValue",systemReadout.flapValue],
  ["systemsMotionLabel",systemReadout.movingPartLabel],
  ["systemsMotionValue",systemReadout.motionValue]
 ])$(id).textContent=value;
 const aero=D.indications(state);
 show("energyPanel",Boolean(aero));
 if(aero){
  for(const [id,value] of [
   ["aeroAoA",aero.aoaDeg.toFixed(1)+"°"],
   ["aeroLift",aero.liftKN.toFixed(1)+" kN"],
   ["aeroDrag",aero.dragKN.toFixed(1)+" kN"],
   ["aeroLoad",aero.load.toFixed(2)+" g"],
   ["aeroPath",aero.pathDeg.toFixed(1)+"°"],
   ["aeroEnergy",aero.energy+" J/kg"]
  ])$(id).textContent=value;
  $("aeroAlert").dataset.level=aero.stalled?"caution":"normal";
  $("aeroAlert").textContent=aero.stalled?
   "EXPERIMENTAL STALL / LOW-ENERGY CUE · Compare fictional wing loading, airspeed and pitch. Reset if needed. Not a real aircraft warning.":
   "EXPERIMENTAL · Calculated forces and energy use invented coefficients, not real aircraft limits.";
 }
}
const loadingFields=[
 ["loadPilot","pilotKg","loadPilotValue"],
 ["loadPassenger","passengerKg","loadPassengerValue"],
 ["loadBaggage","baggageKg","loadBaggageValue"],
 ["loadFuel","fuelKg","loadFuelValue"]
];
function currentLoadout(){
 const values={};
 for(const [id,key] of loadingFields)values[key]=Number($(id).value);
 return values;
}
function renderLoadingPreview(preview=false){
 const load=W.evaluate($("profileSelect").value,currentLoadout());
 for(const [id,key,label] of loadingFields)$(label).textContent=load.loadout[key]+" kg";
 $("loadingMass").textContent=load.totalKg+" kg";
 $("loadingMoment").textContent=load.momentKgM.toFixed(1)+" kg·m";
 $("loadingCg").textContent=load.cgPercentMAC.toFixed(1)+"%";
 $("loadingWing").textContent=load.wingLoadingKgM2.toFixed(1)+" kg/m²";
 $("loadingCgMarker").style.left=Math.max(0,Math.min(100,load.cgPercentMAC)).toFixed(1)+"%";
 $("loadingStatus").dataset.level=load.withinFictionalBand?"normal":"caution";
 $("loadingStatus").textContent=load.balanceLabel+
  ". All mass/CG bands are fictional, not real loading limits."+
  (preview?" Release the slider to restart this training scenario.":"");
 return load;
}
// Unsigned conceptual self-checks. The only records are held in this page
// session; no storage, remote API, identity or verified grades are involved.
function renderExercise(){
 const d=X.get(exerciseSession.id);
 $("exerciseGoal").textContent=d.goal;
 $("exerciseQuestion").textContent=d.question;
 $("exercisePrompt").textContent=d.prompt;
 $("exerciseReviewStatus").textContent="Instructor content review pending · "+X.STATUS;
 $("exerciseReferenceFact").textContent=X.observationText(exerciseSession.reference);
 $("exerciseComparisonFact").textContent=X.observationText(exerciseSession.comparison);
 $("exerciseEvidence").textContent=X.evidence(exerciseSession);
 if(exerciseSession.feedback){
  $("exerciseFeedback").textContent=exerciseSession.feedback.message;
  $("exerciseFeedback").dataset.result=exerciseSession.feedback.status;
 }
}
function startExercise(message){
 if(instructorVoice?.isSpeaking())instructorVoice.stop("Exercise changed. Narration stopped; written material remains available.");
 exerciseSession=X.begin($("exerciseSelect").value,$("profileSelect").value);
 const d=X.get(exerciseSession.id),answer=$("exerciseAnswer");
 answer.replaceChildren();
 const placeholder=document.createElement("option");
 placeholder.value="";placeholder.textContent="Choose an explanation after observing both setups";
 answer.appendChild(placeholder);
 for(const option of d.options){
  const el=document.createElement("option");
  el.value=option.id;el.textContent=option.label;answer.appendChild(el);
 }
 answer.value="";
 $("exerciseFeedback").dataset.result="neutral";
 $("exerciseFeedback").textContent=message||
  "Start with Reference, then Comparison. This is not a verified assessment.";
 renderExercise();
}
function syncExercise(){
 const active=state.mode==="airplane"&&state.physicsId==="aero";
 show("exerciseLab",active);
 if(!active)return;
 if(exerciseSession.profileId!==state.profileId){
  startExercise("Airframe response changed. Apply the two setups again for a fair comparison.");
 }else renderExercise();
}
function applyExercise(stage){
 if(state.mode!=="airplane"||state.physicsId!=="aero")return;
 if(stage==="comparison"&&!exerciseSession.reference){
  $("exerciseFeedback").textContent="Apply Reference first; then apply Comparison.";
  $("exerciseFeedback").dataset.result="neutral";
  return;
 }
 if(instructorVoice?.isSpeaking())instructorVoice.stop("Exercise configuration changed. Choose a spoken summary again when ready.");
 const goal=X.values(exerciseSession.id,stage,state.profileId);
 exerciseApplying=true;
 try{
  for(const [id,key] of loadingFields)$(id).value=String(goal.loadout[key]);
  reset(state.scenario); // change fictional mass only by restarting a scenario
  input.flaps=goal.flaps;
  setValues();
  hardware?.resetPower();
  updateReadouts();
  const result=X.record(exerciseSession,stage,{
   profileId:state.profileId,loadout:currentLoadout(),flaps:input.flaps
  });
  $("exerciseFeedback").dataset.result="neutral";
  $("exerciseFeedback").textContent=result.message;
  renderExercise();
 }finally{exerciseApplying=false}
}
function reportEnvironment(){
 const profile=state.mode==="airplane"?E.selectProfile(state.profileId):null;
 const wind=E.selectWind(state.windId);
 $("profileHint").textContent=profile?profile.description:
  "Helicopter cyclic is a separate conceptual model with no aircraft-type-specific profile.";
 $("windHint").textContent=wind.description+
  " Wind changes the fictional airborne ground track, not real airworthiness or flight limits.";
 $("environmentStatus").textContent=(profile?profile.name:"Conceptual rotorcraft")+" · "+
  wind.name+" · "+(state.physicsId==="aero"?"Experimental energy dynamics":"Classic learning model")+
  ". Changing a setting restarts this fictional scenario.";
 const loadingActive=state.mode==="airplane"&&state.physicsId==="aero";
 show("loadingWrap",loadingActive);
 if(loadingActive)renderLoadingPreview();
 syncExercise();
 $("physicsHint").textContent=state.mode==="helicopter"?
  "The conceptual helicopter retains its original simplified hover model. Experimental aerodynamics apply only to fictional aeroplanes.":
  state.physicsId==="aero"?
  "Experimental: invented forces, wing angle of attack, bank loading, drag, engine lag and energy trends. Not real aircraft performance.":
  "Classic: the original guided takeoff/landing behaviour. Choose Experimental for invented aerodynamic forces and energy trends.";
}
function makeConfiguredState(mode,scenario="runway"){
 return M.makeState(mode,scenario,{
  profileId:$("profileSelect").value,
  windId:$("windSelect").value,
  physicsId:$("physicsSelect").value,
  loadout:currentLoadout()
 });
}
function setMode(next){
 const newType=["yoke","stick","cyclic"].includes(next)?next:"yoke";
 const newMode=newType==="cyclic"?"helicopter":"airplane";
 const oldMode=state.mode;
 type=newType;
 if(newMode!==oldMode){
  startExercise("Aircraft mode changed. Apply Reference and Comparison again if you return to the experimental aeroplane.");
  state=makeConfiguredState(newMode);
  input=M.makeInput(newMode);
  paused=false;$("pauseFlight").setAttribute("aria-pressed","false");
  $("pauseFlight").textContent="Pause simulation";
  lastPhase=state.phase;
  practice=G.start(state);
  clearTrace();
  systems=A.create(state.mode);
  A.step(systems,state,input,0);
 }
 $("controlPad").className="control-pad "+(type==="cyclic"?"cyclic-mode":type==="stick"?"stick-mode":"yoke-mode");
 for(const id of ["Yoke","Stick","Cyclic"])
  $("type"+id).setAttribute("aria-pressed",String(type===id.toLowerCase()));
 $("sceneMode").textContent=type==="cyclic"?"ROTORCRAFT · CONCEPTUAL":"FIXED-WING · "+(type==="yoke"?"YOKE":"STICK");
 $("controlHint").textContent=type==="cyclic"?
  "Move the illustrated cyclic to command horizontal movement. Use another finger on the collective or a pedal.":
  "Drag anywhere in the marked area for bank and pitch. Use another finger on a rudder pedal or throttle.";
 $("aircraftHint").textContent=type==="cyclic"?
  "The cyclic and collective represent distinct rotorcraft controls. The handling here is a simplified visual illustration, not authentic rotorcraft performance.":
  type==="stick"?"A shaped centre-stick style grip represents pitch and roll control for a generic fictional aeroplane.":
  "A dual-handled yoke on a simulated control column represents pitch and roll for a fictional light aeroplane.";
 show("collectivePanel",newMode==="helicopter");
 show("profileWrap",newMode==="airplane");
 show("physicsWrap",newMode==="airplane");
 $("physicsSelect").disabled=newMode!=="airplane";
 reportEnvironment();
 show("powerPanel",newMode==="airplane");
 show("flapPanel",newMode==="airplane");
 show("brake",newMode==="airplane");
 $("startRunway").textContent=newMode==="helicopter"?"Helipad takeoff":"Runway takeoff";
 $("startApproach").disabled=newMode==="helicopter";
 $("startApproach").textContent="Set up final approach";
 $("scenarioNote").textContent=newMode==="helicopter"?
  "Rotorcraft mode starts on an imaginary helipad; there is no aircraft-type-specific helicopter training or real hover physics.":
  "Final approach repositions the imaginary aircraft; it is not a continuous real-world traffic pattern.";
 $("flightGrip").setAttribute("aria-label",
  "Drag fictional "+(type==="cyclic"?"cyclic":type==="yoke"?"yoke":"joystick")+" left/right for bank and up/down for pitch. Arrow keys on desktop.");
 releaseControls();
 hardware?.resetPower();
 setValues();gripTransform();updateReadouts();S.draw(canvas,state,{reducedMotion:prefersLessMotion});
}
function reset(scenario){
 const newMode=type==="cyclic"?"helicopter":"airplane";
 state=makeConfiguredState(newMode,scenario==="approach"?"approach":"runway");
 input=M.makeInput(newMode);
 if(newMode==="airplane"&&scenario==="approach"){
  input.throttle=.49;input.flaps=20;input.pitch=.22;
 }
 input.turbulence=intensity[Number($("turbulence").value)]??.14;
 lastPhase=state.phase;
 practice=G.start(state);
 clearTrace();
 systems=A.create(state.mode);
 A.step(systems,state,input,0);
 reportEnvironment();
 lastFrame=0;paused=false;
 $("pauseFlight").setAttribute("aria-pressed","false");$("pauseFlight").textContent="Pause simulation";
 releaseControls();hardware?.resetPower();setValues();updateReadouts();
 haptics.stop();
 S.draw(canvas,state,{reducedMotion:prefersLessMotion});
}
function movePad(event){
 const box=$("controlPad").getBoundingClientRect();
 const dx=(event.clientX-(box.left+box.width/2))/(box.width*.35);
 const dy=(event.clientY-(box.top+box.height/2))/(box.height*.39);
 input.bank=M.clamp(dx,-1,1);
 input.pitch=M.clamp(dy,-1,1);
 gripTransform();
}
$("controlPad").addEventListener("pointerdown",e=>{
 if(e.pointerType==="mouse"&&e.button!==0)return;
 if(dragPointer!==null)return;
 dragPointer=e.pointerId;
 try{$("controlPad").setPointerCapture(e.pointerId)}catch{}
 movePad(e);haptics.pulse("control");e.preventDefault();
});
$("controlPad").addEventListener("pointermove",e=>{
 if(dragPointer===e.pointerId)movePad(e);
});
for(const eventType of ["pointerup","pointercancel","lostpointercapture"])
 $("controlPad").addEventListener(eventType,e=>{
  if(dragPointer!==e.pointerId)return;
  dragPointer=null;input.bank=0;input.pitch=0;syncKeys();gripTransform();
 });
function updateHeld(){
 const left=pointers.left!==null,right=pointers.right!==null;
 input.rudder=M.clamp((right?1:0)-(left?1:0)+(keys.has("d")?.65:0)-(keys.has("a")?.65:0),-1,1);
 $("cmdRudder").textContent="RUDDER "+Math.round(input.rudder*100)+"%";
 input.brake=pointers.brake!==null||keys.has(" ");
 $("leftRudder").classList.toggle("held",left);
 $("rightRudder").classList.toggle("held",right);
 $("brake").classList.toggle("held",input.brake);
}
function hold(id,key){
 const el=$(id);
 el.addEventListener("pointerdown",e=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  if(pointers[key]!==null)return;
  pointers[key]=e.pointerId;
  try{el.setPointerCapture(e.pointerId)}catch{}
  updateHeld();
  haptics.pulse(key==="brake"?"control":"rudder");
  e.preventDefault();
 });
 for(const kind of ["pointerup","pointercancel","lostpointercapture"])
  el.addEventListener(kind,e=>{
   if(pointers[key]!==e.pointerId)return;
   pointers[key]=null;updateHeld();
  });
}
hold("leftRudder","left");hold("rightRudder","right");hold("brake","brake");
function syncKeys(){
 if(dragPointer===null){
  input.bank=(keys.has("ArrowRight")? .66:0)-(keys.has("ArrowLeft")?.66:0);
  input.pitch=(keys.has("ArrowDown")?.66:0)-(keys.has("ArrowUp")?.66:0);
 }
 updateHeld();
 gripTransform();
}
function releaseControls(){
 dragPointer=null;for(const key of Object.keys(pointers))pointers[key]=null;
 keys.clear();input.bank=0;input.pitch=0;input.rudder=0;input.brake=false;
 updateHeld();gripTransform();
}
window.addEventListener("keydown",e=>{
 const target=e.target;
 if(target instanceof HTMLElement&&["INPUT","TEXTAREA","SELECT"].includes(target.tagName))return;
 const key=e.key.length===1?e.key.toLowerCase():e.key;
 if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","a","d","w","s","r"," "].includes(key))e.preventDefault();
 if(key==="r"){if(!e.repeat)reset(state.scenario);return;}
 if((key==="w"||key==="s")&&!e.repeat){
  if(state.mode==="airplane"){
   input.throttle=M.clamp(input.throttle+(key==="w"?.06:-.06),0,1);
  }else input.collective=M.clamp(input.collective+(key==="w"?.06:-.06),0,1);
  setValues();haptics.pulse("control");return;
 }
 if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","a","d"," "].includes(key)){
  keys.add(key);syncKeys();
 }
});
window.addEventListener("keyup",e=>{
 const key=e.key.length===1?e.key.toLowerCase():e.key;
 if(keys.delete(key)){syncKeys();updateHeld();}
});
window.addEventListener("blur",()=>{releaseControls();haptics.stop()});
document.addEventListener("visibilitychange",()=>{
 if(document.hidden){releaseControls();haptics.stop();pauseReplay();refreshReplay();}
 lastFrame=0;
});
$("power").addEventListener("input",e=>{
 input.throttle=M.clamp(Number(e.target.value)/100,0,1);
 $("powerValue").textContent=round(input.throttle*100)+"%";
 hardware?.resetPower();haptics.pulse("control");
});
$("collective").addEventListener("input",e=>{
 input.collective=M.clamp(Number(e.target.value)/100,0,1);
 $("collectiveValue").textContent=round(input.collective*100)+"%";
 hardware?.resetPower();haptics.pulse("control");
});
$("flaps").addEventListener("change",e=>{
 input.flaps=Number(e.target.value);haptics.pulse("flap");
 if(!exerciseApplying)startExercise("Manual flap change: prior exercise observations cleared. Reapply the two setups.");
});
$("profileSelect").addEventListener("change",()=>{
 startExercise("Aircraft profile changed. Observations have been cleared.");
 reset(state.scenario);
});
$("windSelect").addEventListener("change",()=>reset(state.scenario));
$("physicsSelect").addEventListener("change",()=>{
 startExercise("Flight dynamics changed. Start a new conceptual comparison if available.");
 reset(state.scenario);
});
$("exerciseSelect").addEventListener("change",()=>startExercise());
$("exerciseReference").addEventListener("click",()=>applyExercise("reference"));
$("exerciseComparison").addEventListener("click",()=>applyExercise("comparison"));
$("exerciseCheck").addEventListener("click",()=>{
 if(instructorVoice?.isSpeaking())instructorVoice.stop("Explanation updated. Select Hear feedback to listen to the new response.");
 const result=X.review(exerciseSession,$("exerciseAnswer").value);
 $("exerciseFeedback").dataset.result=result.status;
 $("exerciseFeedback").textContent=result.message;
});
$("exerciseClear").addEventListener("click",()=>startExercise("Observations cleared. Set up Reference to begin again."));
for(const [id] of loadingFields){
 $(id).addEventListener("input",()=>{
  renderLoadingPreview(true);
  if(!exerciseApplying&&state.mode==="airplane"&&state.physicsId==="aero")
   startExercise("The loadout was manually changed. Earlier observations have been cleared.");
 });
 $(id).addEventListener("change",()=>{
  if(state.mode==="airplane"&&state.physicsId==="aero")reset(state.scenario);
  else renderLoadingPreview();
 });
}
$("turbulence").addEventListener("input",e=>{
 input.turbulence=intensity[Number(e.target.value)]??.14;
 $("turbulenceValue").textContent=intensityNames[Number(e.target.value)]??"Light";
});
for(const [id,typeValue] of [["typeYoke","yoke"],["typeStick","stick"],["typeCyclic","cyclic"]])
 $(id).addEventListener("click",()=>setMode(typeValue));
$("startRunway").addEventListener("click",()=>reset("runway"));
$("startApproach").addEventListener("click",()=>{if(state.mode==="airplane")reset("approach")});
$("restartFlight").addEventListener("click",()=>reset(state.scenario));
$("pauseFlight").addEventListener("click",()=>{
 paused=!paused;lastFrame=0;releaseControls();haptics.stop();
 $("pauseFlight").setAttribute("aria-pressed",String(paused));
 $("pauseFlight").textContent=paused?"Resume simulation":"Pause simulation";
});
$("visualMode").addEventListener("change",chooseVisual);
$("cameraMode").addEventListener("change",()=>{
 if(renderer3D)try{renderer3D.draw(state,{view:$("cameraMode").value,animation:systems.parts})}
 catch{fallbackTo2D("3D camera unavailable; switched to 2D scenery.")}
});
$("instrumentToggle").addEventListener("click",()=>{
 const isCompact=$("flightInstruments").classList.toggle("compact");
 $("instrumentToggle").setAttribute("aria-pressed",String(!isCompact));
 $("instrumentToggle").textContent=isCompact?"Show glass instruments":"Hide glass instruments";
});
// Optional physical controllers use Gamepad API only after explicit activation.
 // All output remains fictional; never store the hardware identity or calibration.
 hardware=U.attach({
  api:P,documentLike:document,navigatorLike:navigator,
  getCurrentInput:()=>input,getMode:()=>state.mode,
  onUpdate:()=>{
   gripTransform();
   $("cmdRudder").textContent="RUDDER "+Math.round(input.rudder*100)+"%";
   $("brake").classList.toggle("held",input.brake);
   $("powerValue").textContent=round(input.throttle*100)+"%";
   $("collectiveValue").textContent=round(input.collective*100)+"%";
   $("power").value=String(round(input.throttle*100));
   $("collective").value=String(round(input.collective*100));
  },
  onDisable:()=>{releaseControls()},
  onDisconnect:()=>{
   paused=true;lastFrame=0;releaseControls();haptics.stop();
   $("pauseFlight").setAttribute("aria-pressed","true");
   $("pauseFlight").textContent="Resume simulation";
  }
 });
$("hapticsToggle").addEventListener("click",()=>{
 const enabled=haptics.setEnabled(!haptics.isEnabled());
 $("hapticsToggle").setAttribute("aria-pressed",String(enabled));
 $("hapticsToggle").textContent=enabled?"Disable vibration":"Enable vibration";
 $("hapticsStatus").textContent=enabled?
  "Enabled for this page: short optional simulated control/flight cues. Hardware may still remain silent.":
  haptics.supported?"Off. No vibration will be requested.":"This browser does not expose phone vibration. The simulator still works visually.";
 if(enabled)haptics.pulse("control");
});
$("traceStart").addEventListener("click",()=>{trace.start(state);playback.load(0);$("traceReplayPanel").hidden=true;$("traceInsightsPanel").hidden=true;traceStatus();refreshReplay();});
$("traceStop").addEventListener("click",()=>{trace.stop();traceStatus();refreshReplay();});
$("traceClear").addEventListener("click",clearTrace);
$("traceInsights").addEventListener("click",()=>{
 if(trace.status().active)return;
 const analysis=Z.summarise(trace.exportData());
 if(!analysis.available)return;
 $("traceInsightsFacts").textContent=analysis.text;
 $("traceInsightsPrompts").textContent=analysis.prompts.map((p,i)=>(i+1)+". "+p).join("\n\n");
 $("traceInsightsWarning").textContent=analysis.warning;
 $("traceInsightsPanel").hidden=false;
});
$("traceReplay").addEventListener("click",()=>{
 if(trace.status().active)return;
 const rows=Q.prepare(trace.exportData().observations);if(!rows.length)return;
 playback.load(rows.length);
 const recording=trace.exportData();
 const kind=recording.mode==="helicopter"?"rotorcraft":recording.scenario==="approach"?"approach":"takeoff";
 $("traceDebriefLink").setAttribute("href","simulator-debrief.html?scenario="+kind);
 $("traceReplayPanel").hidden=false;
 refreshReplay();
});
$("traceMomentPathway").addEventListener("change",refreshReplay);
$("traceReplayIndex").addEventListener("input",()=>{
 pauseReplay();
 playback.seek(Number($("traceReplayIndex").value));
 refreshReplay();
});
$("tracePlayPause").addEventListener("click",()=>{
 if(trace.status().active)return;
 if(playback.status().playing)pauseReplay();else playback.play();
 refreshReplay();
});
$("traceDownload").addEventListener("click",()=>{
 const data=trace.exportData();if(!data.observations.length||trace.status().active)return;
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
 const a=document.createElement("a");a.href=url;a.download="academy-unsigned-synthetic-flight-trace.json";
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 $("traceStatus").textContent="Unsigned synthetic trace downloaded locally. Review before sharing.";
});
function frame(now){
 const dt=lastFrame?Math.min(.08,Math.max(0,(now-lastFrame)/1000)):0;
 lastFrame=now;
 if(!paused&&!document.hidden&&dt>0){
  hardware?.poll(dt,{input,mode:state.mode,dragActive:dragPointer!==null,keyboard:keys,pointers,paused});
  if(!paused){
  const result=M.step(state,input,dt);
  A.step(systems,state,input,dt);
  G.observe(practice,state,result.events);
  trace.sample(state,input,dt);
  // Prioritise distinctive events over routine rate-limited ambience.
  for(const event of ["hardLanding","touchdown","liftoff","stall","turbulence",
   "runwayRumble","turn","climb","descent","completed"]){
   if(result.events.includes(event)){haptics.pulse(event);break;}
  }
  if(state.phase!==lastPhase){
   lastPhase=state.phase;
  }
  }
 }
 if(!document.hidden&&playback.status().playing){
  const before=playback.status(),after=playback.tick(dt);
  if(after.index!==before.index||!after.playing)refreshReplay();
 }
 drawScenery(now);
 if(now-prevView>42){updateReadouts();prevView=now;}
 if(now-prevViewTrace>500){traceStatus();prevViewTrace=now;}
 requestAnimationFrame(frame);
}
if(!haptics.supported){
 $("hapticsToggle").disabled=true;
 $("hapticsStatus").textContent="Phone vibration is not exposed by this browser/device. Flight simulation works without it.";
}
setMode("yoke");
input.turbulence=.14;
instructorVoice=V.attach({
 documentLike:document,windowLike:window,exercises:X,
 getSession:()=>exerciseSession
});
chooseVisual();
requestAnimationFrame(frame);
})();
