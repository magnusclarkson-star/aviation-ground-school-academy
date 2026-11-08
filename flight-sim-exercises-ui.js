/* Guided practice UI with explicit, optional device voice narration.
 * No network, AI provider, remote student identity or persistent results.
 */
(function(root){"use strict";
function attach({model,documentLike,windowLike,readState,readInput,configure}){
 if(!model||!documentLike||typeof readState!=="function"||
    typeof readInput!=="function"||typeof configure!=="function")
  throw Error("Guided exercise UI dependencies required");
 const doc=documentLike,win=windowLike||root;
 const el=id=>doc.getElementById(id);
 const speech=win?.speechSynthesis;
 const utterance=win?.SpeechSynthesisUtterance;
 const speechSupported=typeof speech?.speak==="function"&&typeof utterance==="function";
 let session=null,lastRender="",lastMode="",wasSpeaking=false;
 const setText=(id,value)=>{if(el(id).textContent!==value)el(id).textContent=value};
 const toggle=(id,visible)=>{el(id).hidden=!visible};
 const stopVoice=()=>{
  try{if(speechSupported)speech.cancel()}catch{}
  wasSpeaking=false;
 };
 function voiceStatus(message){setText("exerciseVoiceStatus",message)}
 function buildChoices(data){
  const container=el("exerciseChoices");
  container.replaceChildren();
  for(const choice of data.choices){
   const label=doc.createElement("label");
   label.className="exercise-option";
   const radio=doc.createElement("input");
   radio.type="radio";radio.name="exerciseReflection";
   radio.value=choice.id;
   label.appendChild(radio);
   const text=doc.createElement("span");
   text.textContent=choice.text;label.appendChild(text);
   container.appendChild(label);
  }
 }
 function render(force=false){
  if(!session){
   toggle("exerciseLive",false);
   el("exerciseStop").disabled=true;
   setText("exerciseState","No guided exercise active. Free flight controls remain available.");
   return;
  }
  const v=model.view(session);
  const signature=[v.id,v.stage,v.completed,v.interrupted,v.feedback,v.prompt].join("|");
  if(!force&&signature===lastRender)return;
  lastRender=signature;
  const learner=el("exercisePath").value==="scouts"?"Air Scouts / beginner discovery":"Pilot / enthusiast concepts";
  setText("exerciseState",v.title+" · "+learner+" · "+v.review);
  setText("exerciseObjective",v.objective);
  setText("exerciseStep",v.stepText);
  setText("exercisePrompt",v.prompt);
  setText("exerciseFeedback",v.feedback||
   "This is an ungraded, in-browser observation. No practice record is saved.");
  el("exerciseFeedback").dataset.status=v.completed?"complete":v.interrupted?"interrupted":"active";
  toggle("exerciseLive",true);
  toggle("exerciseRecord",v.showRecord);
  toggle("exerciseQuestionWrap",v.showQuestion);
  if(v.showQuestion){
   setText("exerciseQuestion",v.question);
   // Preserve a learner's current selection if updating feedback after a
   // wrong choice; rebuilding radios would discard their keyboard focus.
   if(lastMode!==v.id+":question")buildChoices(v);
  }
  lastMode=v.showQuestion?v.id+":question":v.id+":observe";
  el("exerciseStop").disabled=false;
  el("exerciseAnswer").disabled=!v.showQuestion;
 }
 function start(){
  session=null;lastRender="";lastMode="";
  stopVoice();
  try{
   const id=el("exerciseSelect").value,preset=model.lesson(id).preset;
   configure(preset);
   session=model.begin(id,readState());
   render(true);
   voiceStatus(speechSupported?
    "Device voice is available on request. Nothing is spoken automatically.":
    "No device voice is available. The written lesson remains fully usable.");
  }catch(error){
   session=null;render(true);
   setText("exerciseState","Cannot start this exercise: "+String(error.message).slice(0,180));
  }
 }
 function stop(){
  session=null;lastRender="";lastMode="";
  stopVoice();render(true);
  voiceStatus("Narration stopped. Free flight remains available.");
 }
 function observe(){
  if(!session)return;
  const wasInterrupted=session.interrupted;
  model.observe(session,readState(),readInput());
  if(!wasInterrupted&&session.interrupted)stopVoice();
  render();
 }
 function record(){
  if(!session)return;
  if(model.recordBaseline(session,readState()))render(true);
 }
 function answer(){
  if(!session)return;
  const selected=doc.querySelector('input[name="exerciseReflection"]:checked');
  if(!selected){
   setText("exerciseFeedback","Choose an explanation first; this is an ungraded reflection.");
   return;
  }
  try{
   model.respond(session,selected.value);
   // The observation, not a person's ability, is marked complete.
   render(true);
  }catch(error){
   setText("exerciseFeedback",String(error.message).slice(0,180));
  }
 }
 function speak(){
  if(!session||!speechSupported){voiceStatus("Speech is unavailable. Please use the written prompts.");return}
  const v=model.view(session);
  const text=[v.title,v.prompt,v.feedback].filter(Boolean).join(". ").slice(0,600);
  try{
   stopVoice();
   const utter=new utterance(text);
   utter.lang="en-GB";utter.rate=.94;utter.pitch=1;
   utter.onend=()=>{wasSpeaking=false;voiceStatus("Narration finished. Written prompts remain available.")};
   utter.onerror=()=>{wasSpeaking=false;voiceStatus("Device narration could not play. Read the prompt on screen.")};
   // Speak directly in the click handler; some browsers require an explicit
   // user gesture, and no student name or telemetry is supplied.
   speech.speak(utter);wasSpeaking=true;
   voiceStatus("Speaking the current scripted learning prompt using your device voice.");
  }catch{
   wasSpeaking=false;voiceStatus("Device narration could not start. Read the prompt on screen.");
  }
 }
 el("exerciseStart").addEventListener("click",start);
 el("exerciseStop").addEventListener("click",stop);
 el("exerciseRecord").addEventListener("click",record);
 el("exerciseAnswer").addEventListener("click",answer);
 el("exerciseSpeak").addEventListener("click",speak);
 el("exerciseStopVoice").addEventListener("click",()=>{
  stopVoice();voiceStatus("Narration stopped by the learner.");
 });
 el("exercisePath").addEventListener("change",()=>render(true));
 el("exerciseSelect").addEventListener("change",()=>{
  // Do not silently change an active lesson halfway through. Explicitly
  // starting another one resets its fictional aircraft preset.
  if(session)setText("exerciseState","A different exercise is selected. Press Start guided exercise to change sessions.");
 });
 el("exerciseSpeak").disabled=!speechSupported;
 el("exerciseStopVoice").disabled=!speechSupported;
 voiceStatus(speechSupported?"Device narration is optional and off.":"Device narration unavailable; text works normally.");
 doc.addEventListener("visibilitychange",()=>{
  if(doc.hidden){stopVoice();if(session)voiceStatus("Narration stopped when the page was hidden.")}
 });
 win?.addEventListener?.("pagehide",stopVoice);
 render(true);
 return {start,stop,observe,record,answer,speak,stopVoice,
  getSession:()=>session,speechSupported};
}
const api={attach};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightExercisesUI=api;
})(typeof window!=="undefined"?window:null);
