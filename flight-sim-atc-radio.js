/* Optional scripted, fictional tower/pilot exchanges.
 * Speech comes only from the learner's device, after a click. No microphone,
 * radio transmission, remote AI, real frequencies, clearances, or grading.
 */
(function(root){"use strict";
const World=root?.AGSAFlightATCWorld||(typeof module!=="undefined"&&module.exports?require("./flight-sim-atc-world.js"):null);
const STAGES=Object.freeze(["before","during","after"]);
const STAGE_BY_PHASE=Object.freeze({
 roll:"before",pad:"before",
 climb:"during",flight:"during",approach:"during",lift:"during",hover:"during",
 rollout:"after",landed:"after",complete:"after"
});
const stageFromPhase=phase=>typeof phase==="string"&&Object.prototype.hasOwnProperty.call(STAGE_BY_PHASE,phase)?STAGE_BY_PHASE[phase]:null;
const line=(speaker,text)=>Object.freeze({speaker,text});
function dialogue(stage="before",mode="airplane",scenario="runway",airportId="academy",situationId="normal"){
 if(!STAGES.includes(stage))throw Error("Unsupported simulated radio stage");
 if(airportId!=="academy"&&World)return World.dialogue(stage,mode,scenario,airportId,situationId);
 const heli=mode==="helicopter",arrival=scenario==="approach"&&!heli;
 const pilot="Student One",tower="Academy Tower";
 if(stage==="before")return Object.freeze(heli?[
  line("Pilot",tower+", "+pilot+" at the imaginary helipad. Requesting the training departure briefing."),
  line("Tower",pilot+", this is a classroom transmission. Confirm the simulated helipad and instruments are in view."),
  line("Pilot",pilot+" confirms the fictional helipad depiction and the indicated controls."),
  line("Tower",pilot+", you may start the conceptual rotorcraft lesson when ready. This is not an operational clearance."),
  line("Pilot",pilot+" beginning the fictional lift exercise.")
 ]:[
  line("Pilot",tower+", "+pilot+" at the virtual apron. Requesting the simulated taxi and departure sequence."),
  line("Tower",pilot+", this is an educational transmission only. Review the imaginary runway, cockpit indications, and departure plan."),
  line("Pilot",pilot+" has checked the illustrated route and is at the virtual holding point."),
  line("Tower",pilot+", the departure exercise is available when you are ready. This is not an actual air traffic clearance."),
  line("Pilot",pilot+" beginning the fictional runway departure lesson.")
 ]);
 if(stage==="during")return Object.freeze(heli?[
  line("Pilot",tower+", "+pilot+" reports an imaginary climb above the teaching helipad."),
  line("Tower",pilot+", acknowledged. Compare the synthetic height and drift indications in this conceptual rotorcraft model."),
  line("Pilot",pilot+" checking the fictional hover and position displays."),
  line("Tower",pilot+", continue your classroom exercise. No real traffic or separation service is provided.")
 ]:arrival?[
  line("Pilot",tower+", "+pilot+" reports an approach to the illustrated runway in the simulator."),
  line("Tower",pilot+", acknowledged. Observe the fictional height, heading, speed, and runway picture. This is not a landing clearance."),
  line("Pilot",pilot+" checking synthetic approach indications and the runway depiction."),
  line("Tower",pilot+", after the simulated landing, inspect the replay with your instructor.")
 ]:[
  line("Pilot",tower+", "+pilot+" reports a climb in the illustrated practice area."),
  line("Tower",pilot+", acknowledged. Compare the simulated height, airspeed, heading, and bank indications."),
  line("Pilot",pilot+" reviewing the fictional flight indications and turn."),
  line("Tower",pilot+", continue the learning exercise. No real-world traffic separation or clearance is provided.")
 ]);
 return Object.freeze(heli?[
  line("Pilot",tower+", "+pilot+" has returned to the imaginary helipad and completed the conceptual flight."),
  line("Tower",pilot+", acknowledged. Review your synthetic hover and landing observations."),
  line("Pilot",pilot+" ending the practice scenario and stopping the simulated rotor sound."),
  line("Tower","Academy Tower concludes this fictional exchange. No training credit was awarded.")
 ]:[
  line("Pilot",tower+", "+pilot+" has completed the simulated landing and cleared the pictured runway."),
  line("Tower",pilot+", acknowledged. Close the fictional flight and review the recorded flight path."),
  line("Pilot",pilot+" ending the training scenario and stopping the simulated engine."),
  line("Tower","Academy Tower concludes this fictional exchange. No real clearance or flight credit was issued.")
 ]);
}
function makeAll(mode,scenario,airportId="academy",situationId="normal"){
 return STAGES.flatMap(stage=>dialogue(stage,mode,scenario,airportId,situationId).map(entry=>({...entry,stage})));
}
function attach({windowLike,documentLike,getMode=()=> "airplane",getScenario=()=> "runway",getPhase=()=>null,
 getAirport=()=> "academy",getSituation=()=> "normal",
 onBegin=()=>{},onFinish=()=>{},onTransmissionStart=()=>{},onTransmissionEnd=()=>{}}={}){
 const win=windowLike||root,doc=documentLike||win?.document;
 if(!doc||typeof doc.getElementById!=="function")throw Error("Scripted radio needs a page");
 const el=id=>doc.getElementById(id),synth=win?.speechSynthesis,Utter=win?.SpeechSynthesisUtterance;
 const supported=typeof synth?.speak==="function"&&typeof synth?.cancel==="function"&&typeof Utter==="function";
 let playing=false,sequence=0,armed=false;
 const stagesSeen=new Set();
 const status=message=>{el("atcStatus").textContent=message;};
 function render(entries){
  const list=el("atcTranscript");list.replaceChildren();
  for(const entry of entries){
   const item=doc.createElement("li"),who=doc.createElement("strong"),speech=doc.createElement("span");
   who.textContent=entry.speaker==="Tower"?(getAirport()==="academy"?"Academy Tower: ":"ATC / training radio: "):"Student Pilot: ";
   speech.textContent=entry.text;item.className=entry.speaker==="Tower"?"atc-tower":"atc-pilot";
   item.append(who,speech);list.appendChild(item);
  }
 }
 function stop(message="Scripted radio stopped. Transcript remains available."){
  ++sequence;
  if(playing){try{synth?.cancel()}catch{}}
  const wasPlaying=playing;playing=false;
  if(wasPlaying){onTransmissionEnd();onFinish();}
  status(message);
 }
 function play(stage,scenarioOverride=null){
  const mode=getMode()==="helicopter"?"helicopter":"airplane",
   scenario=scenarioOverride||getScenario();
  const airportId=getAirport()||"academy",situationId=getSituation()||"normal";
  const entries=stage==="all"?makeAll(mode,scenario,airportId,situationId):dialogue(stage,mode,scenario,airportId,situationId);
  stop("Preparing fictional training radio transcript.");
  render(entries);
  const badge=stage==="all"?"complete before/during/after":stage;
  if(!supported){status("Written "+badge+" script shown. Spoken voices are unavailable on this device.");return false;}
  try{
   onBegin();
   // Two distinct voices where possible; different pitches otherwise.
   const voices=typeof synth.getVoices==="function"?synth.getVoices().filter(v=>/^en(?:-|$)/i.test(v.lang||"")):[];
   const language=airportId==="academy"?"en-GB":World?.getAirport(airportId)?.lang||"en-GB";
   const matched=voices.filter(v=>(v.lang||"").toLowerCase()===language.toLowerCase());
   const available=matched.length>=2?matched:voices;
   const generation=++sequence;playing=true;
   for(let i=0;i<entries.length;i++){
    const entry=entries[i],utter=new Utter(entry.text);
    utter.lang=language;utter.rate=entry.speaker==="Tower"?.86:.94;
    utter.pitch=entry.speaker==="Tower"?.78:1.17;
    utter.volume=1;
    if(available.length){utter.voice=available[entry.speaker==="Tower"&&available.length>1?1:0];}
    utter.onstart=()=>{if(sequence===generation)onTransmissionStart(entry);};
    utter.onend=()=>{if(sequence!==generation)return;
     onTransmissionEnd(entry);
     if(i===entries.length-1){playing=false;onFinish();
      status("Scripted "+badge+" radio exchange complete. This was not a real ATC conversation.");}
    };
    utter.onerror=()=>{if(sequence!==generation)return;onTransmissionEnd(entry);stop("Speech output was interrupted. Read the transcript instead.");};
    synth.speak(utter);
   }
   status("Speaking the fictional "+badge+" pilot and tower exchange. Stop radio at any time.");
   return true;
  }catch{stop("Device speech could not start. The full transcript remains visible.");return false;}
 }
 function cuePhase(phase){
  const stage=stageFromPhase(phase);
  // A real home-runway return is an arrival even though the lesson began
  // as a departure. Play its own approach exchange once rather than
  // silently suppressing it because climb already used the "during" stage.
  const returnFinal=phase==="approach"&&getMode()!=="helicopter"&&
   getScenario()==="runway";
  const key=returnFinal?"return-final":stage;
  if(!armed||!stage||stagesSeen.has(key))return false;
  stagesSeen.add(key);
  // Even when the browser blocks synthesized speech, show the full transcript.
  const voiced=play(stage,returnFinal?"approach":null);
  if(!voiced)status("Automatic "+(returnFinal?"final approach":stage)+
   " stage: fictional transcript shown. Device voice may be unavailable; no audio was transmitted.");
  return true;
 }
 function arm(enable){
  armed=enable===true;
  stagesSeen.clear();
  el("atcAutoToggle").setAttribute("aria-pressed",String(armed));
  el("atcAutoToggle").textContent=armed?"Disable phase-linked radio":"Enable phase-linked radio";
  if(!armed){
   stop("Phase-linked radio disabled. Manual dialogue buttons still work.");
   el("atcAutoStatus").textContent="Phase-linked radio off. It will not speak automatically.";
   return false;
  }
  el("atcAutoStatus").textContent="Phase-linked radio armed for this practice session. Each fictional before/during/after stage plays once as phases change. Voice playback depends on the browser.";
  if(!cuePhase(getPhase()))status("Phase-linked radio armed. Waiting for the next recognized fictional flight phase.");
  return true;
 }
 function disarm(message="Phase-linked radio disarmed."){
  if(armed){
   armed=false;stagesSeen.clear();
   el("atcAutoToggle").setAttribute("aria-pressed","false");
   el("atcAutoToggle").textContent="Enable phase-linked radio";
   el("atcAutoStatus").textContent=message;
  }
  stop(message);
 }
 for(const key of ["atcAirport","atcSituation"]){
  el(key)?.addEventListener?.("change",()=>{
   if(playing)stop("Selected a new airport or exercise.");
   stagesSeen.clear();render(dialogue("before",getMode(),getScenario(),getAirport()||"academy",getSituation()||"normal"));
   status("Training location updated. Play a dialogue or start full flight effects. All clearances are fictional.");
  });
 }
 for(const stage of STAGES)el("atc"+stage[0].toUpperCase()+stage.slice(1)).addEventListener("click",()=>{if(armed)arm(false);play(stage);});
 el("atcAll").addEventListener("click",()=>{if(armed)arm(false);play("all");});
 el("atcAutoToggle").addEventListener("click",()=>arm(!armed));
 el("atcStop").addEventListener("click",()=>disarm("Radio stopped by learner."));
 doc.addEventListener?.("visibilitychange",()=>{if(doc.hidden)disarm("Page hidden: scripted radio and phase-linked cues stopped.");});
 win?.addEventListener?.("pagehide",()=>disarm("Page closed: scripted radio stopped."));
 render(dialogue("before",getMode(),getScenario(),getAirport()||"academy",getSituation()||"normal"));
 status(supported?"Radio voices ready, but silent until you select a stage. Transcript shown below.":"Device speech unavailable; written fictional radio script is available below.");
 return {supported,play,stop,arm,disarm,cuePhase,isArmed:()=>armed,isSpeaking:()=>playing,script:dialogue};
}
const api={dialogue,makeAll,attach,STAGES,stageFromPhase};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightATCRadio=api;
})(typeof window!=="undefined"?window:null);
