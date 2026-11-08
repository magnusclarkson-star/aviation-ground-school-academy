/* Optional scripted, fictional tower/pilot exchanges.
 * Speech comes only from the learner's device, after a click. No microphone,
 * radio transmission, remote AI, real frequencies, clearances, or grading.
 */
(function(root){"use strict";
const STAGES=Object.freeze(["before","during","after"]);
const line=(speaker,text)=>Object.freeze({speaker,text});
function dialogue(stage="before",mode="airplane",scenario="runway"){
 if(!STAGES.includes(stage))throw Error("Unsupported simulated radio stage");
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
function makeAll(mode,scenario){
 return STAGES.flatMap(stage=>dialogue(stage,mode,scenario).map(entry=>({...entry,stage})));
}
function attach({windowLike,documentLike,getMode=()=> "airplane",getScenario=()=> "runway",
 onBegin=()=>{},onFinish=()=>{}}={}){
 const win=windowLike||root,doc=documentLike||win?.document;
 if(!doc||typeof doc.getElementById!=="function")throw Error("Scripted radio needs a page");
 const el=id=>doc.getElementById(id),synth=win?.speechSynthesis,Utter=win?.SpeechSynthesisUtterance;
 const supported=typeof synth?.speak==="function"&&typeof synth?.cancel==="function"&&typeof Utter==="function";
 let playing=false,sequence=0;
 const status=message=>{el("atcStatus").textContent=message;};
 function render(entries){
  const list=el("atcTranscript");list.replaceChildren();
  for(const entry of entries){
   const item=doc.createElement("li"),who=doc.createElement("strong"),speech=doc.createElement("span");
   who.textContent=entry.speaker==="Tower"?"Academy Tower: ":"Student Pilot: ";
   speech.textContent=entry.text;item.className=entry.speaker==="Tower"?"atc-tower":"atc-pilot";
   item.append(who,speech);list.appendChild(item);
  }
 }
 function stop(message="Scripted radio stopped. Transcript remains available."){
  ++sequence;
  if(playing){try{synth?.cancel()}catch{}}
  const wasPlaying=playing;playing=false;
  if(wasPlaying)onFinish();
  status(message);
 }
 function play(stage){
  const mode=getMode()==="helicopter"?"helicopter":"airplane",scenario=getScenario();
  const entries=stage==="all"?makeAll(mode,scenario):dialogue(stage,mode,scenario);
  stop("Preparing fictional training radio transcript.");
  render(entries);
  const badge=stage==="all"?"complete before/during/after":stage;
  if(!supported){status("Written "+badge+" script shown. Spoken voices are unavailable on this device.");return false;}
  try{
   onBegin();
   // Two distinct voices where possible; different pitches otherwise.
   const voices=typeof synth.getVoices==="function"?synth.getVoices().filter(v=>/^en(?:-|$)/i.test(v.lang||"")):[];
   const generation=++sequence;playing=true;
   for(let i=0;i<entries.length;i++){
    const entry=entries[i],utter=new Utter(entry.text);
    utter.lang="en-GB";utter.rate=entry.speaker==="Tower"?.86:.94;
    utter.pitch=entry.speaker==="Tower"?.78:1.17;
    utter.volume=.95;
    if(voices.length){utter.voice=voices[entry.speaker==="Tower"&&voices.length>1?1:0];}
    if(i===entries.length-1){
     utter.onend=()=>{if(sequence!==generation)return;playing=false;onFinish();
      status("Scripted "+badge+" radio exchange complete. This was not a real ATC conversation.");};
    }
    utter.onerror=()=>{if(sequence!==generation)return;stop("Speech output was interrupted. Read the transcript instead.");};
    synth.speak(utter);
   }
   status("Speaking the fictional "+badge+" pilot and tower exchange. Stop radio at any time.");
   return true;
  }catch{stop("Device speech could not start. The full transcript remains visible.");return false;}
 }
 for(const stage of STAGES)el("atc"+stage[0].toUpperCase()+stage.slice(1)).addEventListener("click",()=>play(stage));
 el("atcAll").addEventListener("click",()=>play("all"));
 el("atcStop").addEventListener("click",()=>stop("Scripted radio stopped by learner."));
 doc.addEventListener?.("visibilitychange",()=>{if(doc.hidden)stop("Page hidden: scripted radio stopped.");});
 win?.addEventListener?.("pagehide",()=>stop("Page closed: scripted radio stopped."));
 render(dialogue("before",getMode(),getScenario()));
 status(supported?"Radio voices ready, but silent until you select a stage. Transcript shown below.":"Device speech unavailable; written fictional radio script is available below.");
 return {supported,play,stop,isSpeaking:()=>playing,script:dialogue};
}
const api={dialogue,makeAll,attach,STAGES};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightATCRadio=api;
})(typeof window!=="undefined"?window:null);
