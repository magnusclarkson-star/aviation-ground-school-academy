/* Optional tiny radio-keying tone; a synthetic alert, not real RF or ATC audio.
 * Only active after explicit user enable, never records a microphone.
 */
(function(root){"use strict";
function createTone({windowLike,documentLike}={}){
 const win=windowLike||root,doc=documentLike||win?.document,Audio=win?.AudioContext||win?.webkitAudioContext;
 const supported=typeof Audio==="function";
 let enabled=false,context=null,signals=0;
 function stop(){
  enabled=false;
  const old=context;context=null;
  if(old)try{void old.close()?.catch?.(()=>{});}catch{}
 }
 function enable(value){
  if(value!==true){stop();return false;}
  if(enabled)return true;
  if(!supported||doc?.hidden)return false;
  try{
   context=new Audio();
   enabled=true;
   if(typeof context.resume==="function")void context.resume()?.catch?.(()=>{});
   return true;
  }catch{stop();return false;}
 }
 function pulse(){
  if(!enabled||!context||doc?.hidden)return false;
  try{
   const now=context.currentTime,osc=context.createOscillator(),vol=context.createGain();
   osc.type="sine";osc.frequency.value=720;
   vol.gain.setValueAtTime(.0001,now);
   vol.gain.exponentialRampToValueAtTime(.012,now+.012);
   vol.gain.exponentialRampToValueAtTime(.0001,now+.09);
   osc.connect(vol);vol.connect(context.destination);
   osc.start(now);osc.stop(now+.1);
   osc.onended=()=>{try{osc.disconnect();vol.disconnect();}catch{}};
   signals++;return true;
  }catch{return false;}
 }
 function status(){return {supported,enabled,signals};}
 doc?.addEventListener?.("visibilitychange",()=>{if(doc.hidden)stop();});
 win?.addEventListener?.("pagehide",stop);
 return {enable,pulse,stop,status};
}
const api={createTone};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightRadioTone=api;
})(typeof window!=="undefined"?window:null);
