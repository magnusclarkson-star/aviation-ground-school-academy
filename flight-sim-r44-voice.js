/* Device-local, short guided helicopter instructions.
 * Spoken only after a learner gesture; stage changes then use the same voice
 * until muted, paused, hidden, or another speech system takes priority.
 * No microphone, AI service, network, persistent data or audio recording.
 */
(function(root){"use strict";
const MESSAGES=Object.freeze({
 takeoff:"Robinson helicopter lesson. Lift into a steady hover above the helipad.",
 hover:"Lift complete. Hold your position and height for eight seconds. Watch the drift indicator.",
 turn:"Hover complete. Use the pedals for a ninety degree turn. Settle the heading before continuing.",
 return:"Turn complete. Return to the middle of the helipad and descend gently to land.",
 completed:"Well done. You completed the guided helicopter exercise and precision landing.",
 incomplete:"The helicopter landed, but the full exercise was not completed. Restart to practise again.",
 stopped:"The helicopter made a hard or off-pad contact. Restart the exercise and try again."
});
function create({windowLike,documentLike,getLesson=()=>null,isBusy=()=>false}={}){
 const win=windowLike||root,doc=documentLike||win?.document;
 const synth=win?.speechSynthesis,Utter=win?.SpeechSynthesisUtterance;
 const supported=typeof synth?.speak==="function"&&
  typeof synth?.cancel==="function"&&typeof Utter==="function";
 let enabled=true,armed=false,speaking=false,lastKey=null,epoch=0,lastText="";
 const stageKey=lesson=>lesson?.status&&lesson.status!=="active"?
  lesson.status:lesson?.stage;
 function syncUI(){
  const button=doc?.getElementById?.("r44VoiceToggle");
  if(!button)return;
  button.disabled=!supported;
  button.setAttribute("aria-pressed",String(supported&&enabled));
  button.textContent=supported?(enabled?"🔊":"🔇"):"🔇";
  button.setAttribute("aria-label",!supported?"R44 instructor speech unavailable":
   enabled?"Mute R44 spoken instructor":"Enable R44 spoken instructor");
  button.title=!supported?"Device speech unavailable":
   enabled?"Instructor voice on. Tap to mute.":"Instructor voice muted. Tap to enable.";
 }
 function interrupt(){
  const hadSpeech=speaking;
  speaking=false;++epoch;
  // Only cancel speech that this controller itself initiated. Other
  // controllers share the browser's speechSynthesis queue.
  if(hadSpeech)try{synth?.cancel()}catch{}
 }
 function update(){
  syncUI();
  if(!supported||!enabled||!armed||doc?.hidden||isBusy())return false;
  const lesson=getLesson(),key=stageKey(lesson);
  if(!key||!Object.hasOwn(MESSAGES,key)||lastKey===key)return false;
  // Do not cancel or take over an existing ATC/instructor transmission.
  const utterance=new Utter(MESSAGES[key]);
  utterance.lang="en-GB";utterance.rate=.9;utterance.pitch=1;
  const generation=++epoch;
  utterance.onend=()=>{if(epoch===generation)speaking=false};
  utterance.onerror=()=>{if(epoch===generation)speaking=false};
  try{
   if(speaking){speaking=false;synth.cancel()}
   synth.speak(utterance);
   speaking=true;lastKey=key;lastText=MESSAGES[key];
   return true;
  }catch{
   speaking=false;
   // Mark the unsuccessful stage once to avoid trying every animation frame.
   lastKey=key;
   return false;
  }
 }
 function arm(){
  if(!supported||!enabled)return false;
  armed=true;syncUI();update();return true;
 }
 function disarm(){
  interrupt();armed=false;lastKey=null;syncUI();
 }
 function restart(){
  interrupt();lastKey=null;
  if(armed)update();
 }
 function toggle(){
  enabled=!enabled;
  if(!enabled)interrupt();
  else arm();
  syncUI();
  return enabled;
 }
 doc?.addEventListener?.("visibilitychange",()=>{
  if(doc.hidden)disarm();
 });
 win?.addEventListener?.("pagehide",disarm);
 syncUI();
 return Object.freeze({supported,arm,disarm,restart,toggle,interrupt,update,syncUI,
  status:()=>({supported,enabled,armed,speaking,lastKey,lastText})});
}
const api=Object.freeze({MESSAGES,create});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightR44Voice=api;
})(typeof window!=="undefined"?window:null);
