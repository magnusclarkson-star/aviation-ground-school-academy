/* Academy immersive fictional simulator: desktop + multi-touch phone inputs.
 * Flight logic and visual renderer are local-only. Device vibration is opt-in.
 */
(()=>{"use strict";
const M=window.AGSAImmersiveFlight,S=window.AGSAFlightScenery,H=window.AGSAFlightHaptics;
const $=id=>document.getElementById(id);
if(!M||!S||!H){document.body.insertAdjacentText("afterbegin","Simulator assets could not load.");return}
const canvas=$("outsideView"),haptics=H.createHaptics();
const prefersLessMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
const intensity=[0,.14,.37,.75];
const intensityNames=["Off","Light","Moderate","Bumpy"];
let type="yoke",state=M.makeState("airplane"),input=M.makeInput("airplane");
let paused=false,lastFrame=0,prevView=0,dragPointer=null;
const pointers={left:null,right:null,brake:null};
const keys=new Set();
let lastPhase=state.phase;
const round=x=>Math.round(Number(x)||0);
function show(id,value){$(id).classList.toggle("hidden",!value)}
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
}
function setMode(next){
 const newType=["yoke","stick","cyclic"].includes(next)?next:"yoke";
 const newMode=newType==="cyclic"?"helicopter":"airplane";
 const oldMode=state.mode;
 type=newType;
 if(newMode!==oldMode){
  state=M.makeState(newMode);
  input=M.makeInput(newMode);
  paused=false;$("pauseFlight").setAttribute("aria-pressed","false");
  $("pauseFlight").textContent="Pause simulation";
  lastPhase=state.phase;
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
 setValues();gripTransform();updateReadouts();S.draw(canvas,state,{reducedMotion:prefersLessMotion});
}
function reset(scenario){
 const newMode=type==="cyclic"?"helicopter":"airplane";
 state=M.makeState(newMode,scenario==="approach"?"approach":"runway");
 input=M.makeInput(newMode);
 if(newMode==="airplane"&&scenario==="approach"){
  input.throttle=.49;input.flaps=20;input.pitch=.22;
 }
 input.turbulence=intensity[Number($("turbulence").value)]??.14;
 lastPhase=state.phase;
 lastFrame=0;paused=false;
 $("pauseFlight").setAttribute("aria-pressed","false");$("pauseFlight").textContent="Pause simulation";
 releaseControls();setValues();updateReadouts();
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
 input.rudder=(right?1:0)-(left?1:0);
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
 input.rudder=(pointers.right!==null?1:0)-(pointers.left!==null?1:0)+
  (keys.has("d")?.65:0)-(keys.has("a")?.65:0);
 input.rudder=M.clamp(input.rudder,-1,1);
 input.brake=pointers.brake!==null||keys.has(" ");
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
 if(document.hidden){releaseControls();haptics.stop();}
 lastFrame=0;
});
$("power").addEventListener("input",e=>{
 input.throttle=M.clamp(Number(e.target.value)/100,0,1);
 $("powerValue").textContent=round(input.throttle*100)+"%";haptics.pulse("control");
});
$("collective").addEventListener("input",e=>{
 input.collective=M.clamp(Number(e.target.value)/100,0,1);
 $("collectiveValue").textContent=round(input.collective*100)+"%";haptics.pulse("control");
});
$("flaps").addEventListener("change",e=>{input.flaps=Number(e.target.value);haptics.pulse("flap")});
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
$("hapticsToggle").addEventListener("click",()=>{
 const enabled=haptics.setEnabled(!haptics.isEnabled());
 $("hapticsToggle").setAttribute("aria-pressed",String(enabled));
 $("hapticsToggle").textContent=enabled?"Disable vibration":"Enable vibration";
 $("hapticsStatus").textContent=enabled?
  "Enabled for this page: short optional simulated control/flight cues. Hardware may still remain silent.":
  haptics.supported?"Off. No vibration will be requested.":"This browser does not expose phone vibration. The simulator still works visually.";
 if(enabled)haptics.pulse("control");
});
function frame(now){
 const dt=lastFrame?Math.min(.08,Math.max(0,(now-lastFrame)/1000)):0;
 lastFrame=now;
 if(!paused&&!document.hidden&&dt>0){
  const result=M.step(state,input,dt);
  // Prioritise distinctive events over routine rate-limited ambience.
  for(const event of ["hardLanding","touchdown","liftoff","stall","turbulence",
   "runwayRumble","turn","climb","descent","completed"]){
   if(result.events.includes(event)){haptics.pulse(event);break;}
  }
  if(state.phase!==lastPhase){
   lastPhase=state.phase;
  }
 }
 if(now-prevView>42){
  S.draw(canvas,state,{reducedMotion:prefersLessMotion});
  updateReadouts();prevView=now;
 }
 requestAnimationFrame(frame);
}
if(!haptics.supported){
 $("hapticsToggle").disabled=true;
 $("hapticsStatus").textContent="Phone vibration is not exposed by this browser/device. Flight simulation works without it.";
}
setMode("yoke");
input.turbulence=.14;
requestAnimationFrame(frame);
})();
