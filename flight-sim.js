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
 V=window.AGSAFlightInstructorVoice,L=window.AGSAFlightLighting,FX=window.AGSAFlightFeedbackVisual,N=window.AGSAFlightEngineAudio,K=window.AGSAFlightPhoneProbe,J=window.AGSAFlightAudioFallback,F=window.AGSAFlightATCRadio,Y=window.AGSAFlightRadioTone,R=window.AGSAFlightRecorder,Q=window.AGSAFlightReplay,Z=window.AGSAFlightAfterAction,O=window.AGSAFlightPlayback,C=window.AGSAFlightMomentCoach,B=window.AGSAFlightTrack;
const $=id=>document.getElementById(id);
if(!M||!S||!H||!I||!G||!P||!U||!E||!T||!A||!D||!W||!X||!V||!L||!FX||!N||!K||!J||!F||!Y||!R||!Q||!Z||!O||!C||!B){document.body.insertAdjacentText("afterbegin","Simulator assets could not load.");return}
const canvas=$("outsideView"),canvas3D=$("outsideView3D"),haptics=H.createHaptics();
const engineAudio=N.createEngine({windowLike:window,documentLike:document});
const phoneProbe=K.createProbe({windowLike:window,documentLike:document});
const audioFallback=J.createFallback({windowLike:window,documentLike:document});
let lastSpeakerTest="not attempted";
function refreshPhoneDiagnostics(){
 const vibration=haptics.status(),engine=engineAudio.status(),htmlAudio=audioFallback.status();
 let embedded=false;
 try{embedded=window.top!==window.self;}catch{embedded=true;}
 const lines=[
  "ACADEMY PHONE AUDIO / HAPTIC DIAGNOSTICS",
  "Page: "+(document.hidden?"hidden":"visible"),
  "Secure browser context: "+(window.isSecureContext===true?"yes":"no or unavailable"),
  "Embedded frame: "+(embedded?"yes — open directly in Chrome":"no (does not identify the browser app)"),
  "Web Audio API: "+(phoneProbe.supported?"available":"unavailable"),
  "HTML audio backup: "+(htmlAudio.supported?"available":"unavailable"),
  "Engine: "+(engine.active?"active":"inactive"),
  "Engine audio context: "+engine.audioState,
  "Website vibration API: "+(vibration.supported?"available":"unavailable"),
  "Flight vibration armed: "+(vibration.enabled?"yes":"no"),
  "Last vibration request: "+vibration.lastResult,
  "Website vibration requests attempted: "+vibration.requestCount,
  "Requests accepted by browser (not physical confirmation): "+vibration.acceptedCount,
  "Stronger vibration tests requested: "+vibration.strongTestCount,
  "Last primary speaker test: "+lastSpeakerTest,
  "Last backup speaker test: "+htmlAudio.lastResult,
  "Media volume: not readable by websites",
  "Vibration motor and actual speaker output: not measurable by websites",
  "No device ID, location, microphone recordings or personal files included."
 ];
 $("phoneDiagnosticsText").value=lines.join("\n");
 return lines.join("\n");
}
const radioTone=Y.createTone({windowLike:window,documentLike:document});
function syncRadioToneUI(message){
 const info=radioTone.status();
 $("radioToneToggle").disabled=!info.supported;
 $("radioToneToggle").setAttribute("aria-pressed",String(info.enabled));
 $("radioToneToggle").textContent=info.enabled?"Disable radio cue tone":"Enable radio cue tone";
 $("radioToneStatus").textContent=message||(info.enabled?
  "Radio cue tone enabled. A brief synthetic chirp plays when a scripted transmission starts.":
  info.supported?"Radio cue tone off; voice and transcript work without it.":
  "Web Audio not supported on this device. Written transcripts remain available.");
}
let atcRadio=null,lastEngineAudioFrame=0,fullFlightWanted=false,fullFlightBusy=false;
function audioPower(){
 return state.mode==="helicopter"?Math.min(1,.75+.15*(input.collective||0)):
  Math.max(0,Math.min(1,(systems?.powerPct??0)/100));
}
function syncEngineAudioUI(message){
 const info=engineAudio.status();
 $("engineAudioToggle").disabled=!info.supported;
 $("engineAudioToggle").setAttribute("aria-pressed",String(info.active));
 $("engineAudioToggle").textContent=info.active?"Stop engine sound":"Enable engine sound";
 $("engineAudioStatus").textContent=message||(info.active?
  "Locally synthesized fictional "+(info.mode==="helicopter"?"rotor":"piston engine")+" sound active. Stop or pause to mute.":
  info.supported?"Engine sound off. Tap Enable to start.":
  "Web Audio is unavailable. Flight simulation and scripted radio transcripts still work.");
}
function syncHapticsUI(message){
 const enabled=haptics.isEnabled();
 $("hapticsToggle").setAttribute("aria-pressed",String(enabled));
 $("hapticsToggle").textContent=enabled?"Disable vibration":"Enable vibration";
 $("hapticsStatus").textContent=message||(enabled?
  "Flight vibration armed. Short cues are requested on controls, ground roll and fictional turbulence; your phone may still ignore them.":
  haptics.supported?"Vibration is off. No flight cues are requested.":"This browser does not expose the phone vibration API.");
}
function syncPhoneFeedbackUI(message){
 const engineOn=engineAudio.status().active,vibrationOn=haptics.isEnabled(),
  towerOn=atcRadio?.isArmed()===true,toneOn=radioTone.status().enabled;
 $("phoneFeedbackStatus").textContent=message||(
  "Engine: "+(engineOn?"on":"off")+" · Vibration: "+(vibrationOn?"on":"off")+
  " · Tower radio: "+(towerOn?"on":"off")+" · Radio cue: "+(toneOn?"on":"off")+
  ". Use the full-flight Start button to enable all supported effects.");
 const allActive=engineOn||vibrationOn||towerOn||toneOn;
 $("phoneFeedbackStop").disabled=!allActive&&!fullFlightWanted;
 $("fullFlightLaunch").disabled=fullFlightBusy;
 $("fullFlightLaunch").textContent=fullFlightBusy?"ACTIVATING FULL FLIGHT EFFECTS…":
  (allActive?"RESTART FULL FLIGHT EFFECTS":"START FLIGHT WITH ALL EFFECTS");
 $("fullFlightLaunchStatus").textContent=fullFlightBusy?"Activating selected sound and vibration…":
  fullFlightWanted?(allActive?
   "Full flight mode requested. Engine "+(engineOn?"on":"unavailable")+
   ", vibration "+(vibrationOn?"armed":"unavailable")+
   ", tower radio "+(towerOn?"on":"off")+". Adjust individual settings below.":
   "Flight effects were stopped by the browser or flight controls. Tap Start to reactivate.") :
  "All sound, vibration and radio settings are prepared. Tap Start once to activate them.";
}
async function startFullFlight(){
 if(fullFlightBusy||document.hidden)return;
 fullFlightBusy=true;fullFlightWanted=true;
 if(paused){
  paused=false;lastFrame=0;
  $("pauseFlight").setAttribute("aria-pressed","false");
  $("pauseFlight").textContent="Pause simulation";
 }
 haptics.setStrength($("hapticsStrength").value);
 const vibSupported=haptics.setEnabled(true);
 const vibTest=vibSupported?haptics.test():{accepted:false};
 // Web Audio and speech must be initiated before any await: mobile browsers
 // require an actual tap, and playing during page load is not dependable.
 const engineStart=engineAudio.start(state.mode,audioPower());
 engineAudio.setVolume(Number($("engineAudioVolume").value),audioPower());
 engineAudio.setTexture($("engineAudioTexture").value,audioPower());
 const cueStarted=radioTone.enable(true);
 const radioArmed=atcRadio?.arm(true)===true;
 syncPhoneFeedbackUI();
 let engineStarted=false;
 try{engineStarted=await engineStart;}catch{engineStarted=false;}
 fullFlightBusy=false;
 syncEngineAudioUI(engineStarted?
  "Fictional engine sound playing. In-app volume "+$("engineAudioVolume").value+"%. Phone Media volume still applies.":
  "Engine audio blocked or unsupported; use Test speaker and Try backup sound.");
 syncHapticsUI(vibSupported?
  (vibTest.accepted?"Flight haptics armed; browser accepted the initial cue (not proof of physical vibration).":
  "Haptics armed but the vibration request was rejected. Check Android/browser support."):
  "This browser does not expose website vibration.");
 syncRadioToneUI();
 syncPhoneFeedbackUI("Full flight requested — engine "+(engineStarted?"ON":"unavailable")+
  ", vibration "+(vibSupported?"ON (hardware dependent)":"unsupported")+
  ", tower dialogue "+(radioArmed?"ON":"unavailable")+
  ", radio cue "+(cueStarted?"ON":"unavailable")+
  ". Lower your media volume if too loud.");
 refreshPhoneDiagnostics();
}
function stopFullFlight(){
 fullFlightWanted=false;
 engineAudio.stop();phoneProbe.stop();audioFallback.stop();
 haptics.setEnabled(false);
 atcRadio?.disarm("Full flight effects stopped by learner.");
 radioTone.stop();
 syncEngineAudioUI("Engine stopped.");syncHapticsUI("Flight vibration off.");
 syncRadioToneUI("Radio cue off.");
 syncPhoneFeedbackUI("All flight effects off. Tap Start to restore the full experience.");
 refreshPhoneDiagnostics();
}
let lastVisualCueMs=0;
function updateVisualFeedback(now,events=[]){
 if(now-lastVisualCueMs<550&&!events.length)return;
 const cue=FX.describe(state,events);
 const target=$("flightFeedbackVisual");
 target.dataset.kind=cue.kind;
 target.textContent="VISUAL CUE · "+cue.label;
 target.setAttribute("aria-label",cue.label+". Visual feedback, not physical vibration.");
 lastVisualCueMs=now;
}
let renderer3D=null,prev3D=0,prev2D=0;
const prefersLessMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
const lightingChoice=()=>L.choose($("lightingMode").value);
const lightingId=()=>$("lightingMode").value;
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
 const position=B.draw($("traceTrackCanvas"),trace.exportData().observations,idx);
 $("traceTrackDescription").textContent=position.description;
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
 S.draw(canvas,state,{reducedMotion:prefersLessMotion,lighting:lightingId()});
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
  if(renderer3D.draw(state,{view:$("cameraMode").value,animation:systems.parts,lighting:lightingId()})){
   visualMessage("3D WebGL2 airfield active: real geometric terrain, runway, buildings, trees and optional chase aircraft. Fictional scenery, not a surveyed airport.","active");
   prev3D=0;return;
  }
 }catch{}
 fallbackTo2D("3D renderer could not draw. Automatically using 2D scenery.");
}
function drawScenery(now){
 if(renderer3D){
  if(now-prev3D>=33){
   try{if(!renderer3D.draw(state,{view:$("cameraMode").value,animation:systems.parts,lighting:lightingId()})){
    fallbackTo2D("3D graphics context lost or became unavailable; switched safely to 2D scenery.");
   }}catch{fallbackTo2D("3D rendering error; switched to 2D scenery.");}
   prev3D=now;
  }
  // Keep a warm 2D fallback without rendering it at full frame rate on phones.
  if(now-prev2D>=300){
   S.draw(canvas,state,{reducedMotion:prefersLessMotion,lighting:lightingId()});prev2D=now;
  }
 }else if(now-prev2D>=42){
  S.draw(canvas,state,{reducedMotion:prefersLessMotion,lighting:lightingId()});prev2D=now;
 }
}
$("lightingMode").addEventListener("change",()=>{
 prev2D=0;prev3D=0;
 $("lightingStatus").textContent=lightingChoice().label+" selected. Fictional outside light only; instruments and flight dynamics unchanged.";
 if(!renderer3D)S.draw(canvas,state,{reducedMotion:prefersLessMotion,lighting:lightingId()});
});
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
  engineAudio.stop();syncEngineAudioUI("Aircraft type changed. Engine sound off until enabled again.");
  atcRadio?.disarm("Aircraft changed: phase-linked radio and speech stopped.");
  radioTone.stop();syncRadioToneUI("Aircraft changed: radio cue tone off.");
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
 setValues();gripTransform();updateReadouts();S.draw(canvas,state,{reducedMotion:prefersLessMotion,lighting:lightingId()});
}
function reset(scenario){
 engineAudio.stop();syncEngineAudioUI("Practice reset. Engine sound off until enabled again.");
 atcRadio?.disarm("Practice reset: phase-linked radio and speech stopped.");
 radioTone.stop();syncRadioToneUI("Scenario reset: radio cue tone off.");
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
 S.draw(canvas,state,{reducedMotion:prefersLessMotion,lighting:lightingId()});
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
 if(document.hidden){releaseControls();haptics.stop();pauseReplay();refreshReplay();
  engineAudio.stop();syncEngineAudioUI("Page hidden: engine sound stopped.");
  audioFallback.stop();refreshPhoneDiagnostics();
  radioTone.stop();syncRadioToneUI("Page hidden: radio cue tone stopped.");}
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
 $(id).addEventListener("click",()=>{
  const changed=(typeValue==="cyclic")!==(state.mode==="helicopter");
  setMode(typeValue);
  if(changed&&fullFlightWanted)void startFullFlight();
 });
function resetFromUserGesture(scenario){
 reset(scenario);
 if(fullFlightWanted)void startFullFlight();
}
$("startRunway").addEventListener("click",()=>resetFromUserGesture("runway"));
$("startApproach").addEventListener("click",()=>{if(state.mode==="airplane")resetFromUserGesture("approach")});
$("restartFlight").addEventListener("click",()=>resetFromUserGesture(state.scenario));
$("pauseFlight").addEventListener("click",()=>{
 paused=!paused;lastFrame=0;releaseControls();haptics.stop();
 if(paused){
  engineAudio.stop();syncEngineAudioUI("Simulation paused; engine sound stopped until re-enabled.");
  atcRadio?.disarm("Simulation paused: phase-linked radio and speech stopped.");
  radioTone.stop();syncRadioToneUI("Simulation paused: radio cue tone stopped.");
 }else if(fullFlightWanted){void startFullFlight();}
 syncPhoneFeedbackUI();
 $("pauseFlight").setAttribute("aria-pressed",String(paused));
 $("pauseFlight").textContent=paused?"Resume simulation":"Pause simulation";
});
$("engineAudioToggle").addEventListener("click",async()=>{
 if(engineAudio.status().active){
  engineAudio.stop();syncEngineAudioUI("Engine sound stopped by learner.");syncPhoneFeedbackUI();return;
 }
 $("engineAudioToggle").disabled=true;
 const started=await engineAudio.start(state.mode,audioPower());
 engineAudio.setVolume(Number($("engineAudioVolume").value),audioPower());
 engineAudio.setTexture($("engineAudioTexture").value,audioPower());
 syncEngineAudioUI(started?
  "Fictional "+(state.mode==="helicopter"?"helicopter rotor":"piston engine")+
  " audio playing. Use the volume slider or Stop engine sound.":
  "Device audio unavailable or blocked. The simulator still works silently.");
 syncPhoneFeedbackUI();
});
$("engineAudioTexture").addEventListener("change",()=>{
 const selected=engineAudio.setTexture($("engineAudioTexture").value,audioPower());
 if(engineAudio.status().active)syncEngineAudioUI("Engine texture updated to "+(selected==="textured"?"detailed":"gentle")+". Volume remains under your control.");
});
$("radioToneToggle").addEventListener("click",()=>{
 if(radioTone.status().enabled){
  radioTone.stop();syncRadioToneUI("Radio cue tone disabled by learner.");
 }else{
  const enabled=radioTone.enable(true);
  syncRadioToneUI(enabled?
   "Short synthetic radio cue tone enabled. It sounds only before scripted transmissions.":
   "Device blocked the radio cue tone. The spoken script and transcript still work.");
 }
});
$("engineAudioVolume").addEventListener("input",()=>{
 const volume=engineAudio.setVolume(Number($("engineAudioVolume").value),audioPower());
 $("engineAudioVolumeValue").textContent=volume+"%";
});
$("visualMode").addEventListener("change",chooseVisual);
$("cameraMode").addEventListener("change",()=>{
 if(renderer3D)try{renderer3D.draw(state,{view:$("cameraMode").value,animation:systems.parts,lighting:lightingId()})}
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
 haptics.setStrength($("hapticsStrength").value);
 const enabled=haptics.setEnabled(!haptics.isEnabled());
 const test=enabled?haptics.test():null;
 syncHapticsUI(enabled?(test?.accepted?"Browser accepted the short vibration test request. If your phone did not move, check system vibration settings.":"Vibration requested, but this browser may have blocked the motor."):undefined);
 syncPhoneFeedbackUI();
});
$("hapticsStrength").addEventListener("change",()=>{
 haptics.setStrength($("hapticsStrength").value);
 syncHapticsUI();
});
for(const id of ["fullFlightLaunch","phoneFeedbackStart"])
 $(id).addEventListener("click",()=>{void startFullFlight();});
$("phoneFeedbackStop").addEventListener("click",stopFullFlight);
$("phoneSoundTest").addEventListener("click",async()=>{
 $("phoneSoundTest").disabled=true;
 const report=await phoneProbe.testSpeaker();
 lastSpeakerTest=report.started?"requested playback":"blocked — "+report.reason;
 refreshPhoneDiagnostics();
 $("phoneSoundTest").disabled=false;
 syncPhoneFeedbackUI(report.reason+(report.started?" Did you hear the brief beep? The app cannot measure your speaker.":""));
});
$("phoneAudioBackup").addEventListener("click",async()=>{
 $("phoneAudioBackup").disabled=true;
 const result=await audioFallback.play();
 $("phoneAudioBackup").disabled=false;
 syncPhoneFeedbackUI(result.reason);
 refreshPhoneDiagnostics();
});
$("phoneRefreshDiagnostics").addEventListener("click",()=>{
 refreshPhoneDiagnostics();
 $("phoneDiagnosticsStatus").textContent="Current browser feature report refreshed. It does not identify your physical phone.";
});
$("phoneCopyDiagnostics").addEventListener("click",async()=>{
 const report=refreshPhoneDiagnostics();
 try{
  if(!navigator.clipboard?.writeText)throw Error("clipboard unavailable");
  await navigator.clipboard.writeText(report);
  $("phoneDiagnosticsStatus").textContent="Report copied. Paste it in ChatGPT if you want me to inspect the results.";
 }catch{
  $("phoneDiagnosticsText").focus();
  $("phoneDiagnosticsText").select();
  $("phoneDiagnosticsStatus").textContent="Automatic copying was unavailable. Select and copy the report text to share it.";
 }
});
$("phoneVibrationTest").addEventListener("click",()=>{
 const report=haptics.test();
 $("phoneVibrationResult").textContent=report.supported?
  (report.accepted?"Browser accepted the short request. This does NOT prove the motor vibrated.":
  "Short vibration request was rejected by the browser."):
  "Website vibration unavailable in this browser. Visual flight cues still work.";
 refreshPhoneDiagnostics();
 syncPhoneFeedbackUI(report.supported?
  (report.accepted?"Short vibration request sent; no physical feedback can be verified by a website.":"Browser rejected the vibration request. Try Chrome and check system settings."):
  "This browser does not support website vibration. The simulator still works visually.");
});
$("phoneVibrationStrongTest").addEventListener("click",()=>{
 const report=haptics.testStrong();
 $("phoneVibrationResult").textContent=report.supported?
  (report.accepted?"Stronger 460 ms request accepted by browser. If you did not feel it, check Android vibration settings; acceptance is NOT physical proof.":
  "Stronger vibration request rejected or blocked. Check browser/phone settings."):
  "Website vibration unsupported. The 460 ms test cannot trigger the phone motor.";
 refreshPhoneDiagnostics();
 syncPhoneFeedbackUI($("phoneVibrationResult").textContent);
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
  if(now-lastEngineAudioFrame>110){
   engineAudio.update(state.mode,audioPower());lastEngineAudioFrame=now;
  }
  // Prioritise distinctive short events, then occasional runway/airflow.
  // Visual feedback always renders even when browser vibration is unavailable.
  let eventRequested=false;
  for(const event of ["hardLanding","touchdown","liftoff","stall","turbulence",
   "runwayRumble","turn","climb","descent","completed"]){
   if(result.events.includes(event)){eventRequested=haptics.pulse(event);break;}
  }
  if(!eventRequested)haptics.ambience(state,input);
  updateVisualFeedback(now,result.events);
  if(state.phase!==lastPhase){
   lastPhase=state.phase;
   atcRadio?.cuePhase(state.phase);
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
atcRadio=F.attach({
 documentLike:document,windowLike:window,
 getMode:()=>state.mode,getScenario:()=>state.scenario,getPhase:()=>state.phase,
 onBegin:()=>{
  if(instructorVoice?.isSpeaking())instructorVoice.stop("Scripted radio has taken the voice output.");
  engineAudio.setDuck(true,audioPower());
  radioTone.pulse();
 },
 onFinish:()=>engineAudio.setDuck(false,audioPower())
});
// Do not allow radio and instructor narration to cancel each other mid-speech.
document.addEventListener("click",event=>{
 if(["exerciseSpeakLesson","exerciseSpeakComparison","exerciseSpeakFeedback"].includes(event.target?.id))
  atcRadio?.disarm("Radio stopped for the instructor's scripted narration.");
},true);
syncEngineAudioUI();
syncHapticsUI();
updateVisualFeedback(performance.now()+1000,[]);
syncPhoneFeedbackUI();
refreshPhoneDiagnostics();
syncRadioToneUI();
chooseVisual();
requestAnimationFrame(frame);
})();
