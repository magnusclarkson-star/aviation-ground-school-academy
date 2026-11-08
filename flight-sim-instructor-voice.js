/* Optional scripted instructor narration for the fictional Academy simulator.
 * Uses only the learner's own browser SpeechSynthesis API after a button click.
 * No live AI, audio uploads, microphone, network, names, storage or grading.
 */
(function(root){"use strict";
const MAX_CHARS=850;
const DISCL="This is an unsigned educational illustration, awaiting subject-matter-expert review. It is not an assessed pilot lesson or aircraft operating advice.";
function script(exercises,session,kind="lesson",audience="scouts"){
 if(!exercises||!session||!["lesson","comparison","feedback"].includes(kind))
  throw Error("A valid scripted exercise and narration mode are required");
 if(!["scouts","pilots"].includes(audience))throw Error("Unknown narration learning path");
 const definition=exercises.get(session.id);
 const introduction=audience==="scouts"?
  "Air Scout discovery exercise. Observe, compare, and explain what the imaginary model shows.":
  "Aviation ground-school concept review. Compare the displayed quantities and identify their relationship.";
 let body;
 if(kind==="lesson"){
  body=[definition.title,definition.goal,definition.prompt,
   "Your conceptual self-check question is: "+definition.question].join(". ");
 }else if(kind==="comparison"){
  body=session.reference&&session.comparison?
   definition.title+". "+exercises.evidence(session)+". "+definition.rationale:
   definition.title+". Apply the Reference setup first, then Comparison. Examine both fictional sets of figures before selecting an explanation.";
 }else{
  body=session.feedback?
   definition.title+". "+session.feedback.message:
   definition.title+". No checked explanation is available yet. Complete both setups and select an explanation when ready.";
 }
 // Always preserve the explicit safety boundary when long evidence is read;
 // truncate only the descriptive section, never the unapproved-use notice.
 return (introduction+" "+body).slice(0,MAX_CHARS-DISCL.length-1)+
  " "+DISCL;
}
function attach({documentLike,windowLike,exercises,getSession}){
 if(!documentLike||!exercises||typeof getSession!=="function")
  throw Error("Narrator requires the current local exercise");
 const doc=documentLike,win=windowLike||root,el=id=>doc.getElementById(id);
 const synth=win?.speechSynthesis,Utter=win?.SpeechSynthesisUtterance;
 const supported=typeof synth?.speak==="function"&&typeof synth?.cancel==="function"&&
  typeof Utter==="function";
 let speaking=false;
 function status(message){el("exerciseSpeechStatus").textContent=message}
 function stop(message="Narration stopped. Written instructions remain available."){
  try{if(supported&&speaking)synth.cancel()}catch{}
  speaking=false;
  status(message);
 }
 function play(kind){
  if(!supported){
   status("Device speech is unavailable. Written instructions and comparisons still work.");return false;
  }
  const session=getSession();
  if(!session){
   status("Choose an exercise first. The spoken instructor uses only the local script.");return false;
  }
  const audience=el("exerciseVoiceAudience").value,rate=Number(el("exerciseVoiceRate").value);
  if(!["scouts","pilots"].includes(audience)||!Number.isFinite(rate)||rate<.7||rate>1.2){
   status("Choose a supported learning path and narration pace.");return false;
  }
  let text;
  try{text=script(exercises,session,kind,audience)}catch{
   status("The requested scripted narration is unavailable.");return false;
  }
  // This call is synchronous inside a real click handler. Browser/OS device
  // voices may still deny playback, so the written guidance remains primary.
  try{
   if(speaking)synth.cancel();
   const utterance=new Utter(text);
   utterance.lang="en-GB";utterance.rate=rate;utterance.pitch=1;
   utterance.onend=()=>{speaking=false;status("Narration finished. Written guidance remains available.")};
   utterance.onerror=()=>{speaking=false;status("The device could not play the narration. Read the text on screen.")};
   synth.speak(utterance);
   speaking=true;
   status(kind==="lesson"?"Reading the exercise script using this device's available voice.":
    kind==="comparison"?"Reading the fictional observations using this device's available voice.":
    "Reading the conceptual feedback using this device's available voice.");
   return true;
  }catch{
   speaking=false;status("Device narration could not start. Read the text on screen.");return false;
  }
 }
 el("exerciseSpeakLesson").addEventListener("click",()=>play("lesson"));
 el("exerciseSpeakComparison").addEventListener("click",()=>play("comparison"));
 el("exerciseSpeakFeedback").addEventListener("click",()=>play("feedback"));
 el("exerciseStopSpeech").addEventListener("click",()=>stop("Narration stopped by learner."));
 for(const id of ["exerciseSpeakLesson","exerciseSpeakComparison",
  "exerciseSpeakFeedback","exerciseStopSpeech"])el(id).disabled=!supported;
 if(!supported)status("Device voice unavailable. All four written exercises remain accessible.");
 else status("Device voice is optional and off. No narration starts automatically.");
 doc.addEventListener("visibilitychange",()=>{
  if(doc.hidden)stop("Page hidden: narration stopped. All written learning material remains available.");
 });
 win?.addEventListener?.("pagehide",()=>stop());
 return {supported,play,stop,isSpeaking:()=>speaking};
}
const api={script,attach,MAX_CHARS};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightInstructorVoice=api;
})(typeof window!=="undefined"?window:null);
