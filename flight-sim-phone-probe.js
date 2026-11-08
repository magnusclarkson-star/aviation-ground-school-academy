/* User-invoked phone speaker diagnostic using a short local Web Audio tone.
 * Creates no audio context before an explicit click. No network or microphone.
 */
(function(root){"use strict";
function createProbe({windowLike,documentLike}={}){
 const win=windowLike||root,doc=documentLike||win?.document;
 const Audio=win?.AudioContext||win?.webkitAudioContext;
 const supported=typeof Audio==="function";
 let context=null,oscillator=null;
 function stop(){
  if(oscillator){try{oscillator.onended=null;oscillator.stop();oscillator.disconnect();}catch{}oscillator=null;}
  if(context){try{void context.close()?.catch?.(()=>{});}catch{}context=null;}
 }
 async function testSpeaker(){
  if(!supported)return {supported:false,started:false,reason:"Web Audio is not supported in this browser."};
  if(doc?.hidden)return {supported:true,started:false,reason:"This page is hidden. Reopen it to test."};
  try{
   stop();
   const ctx=new Audio();context=ctx;
   const tone=ctx.createOscillator(),gain=ctx.createGain();oscillator=tone;
   tone.type="sine";tone.frequency.value=620;
   const t=ctx.currentTime;
   gain.gain.setValueAtTime(.0001,t);
   gain.gain.linearRampToValueAtTime(.12,t+.035);
   gain.gain.linearRampToValueAtTime(.0001,t+.28);
   tone.connect(gain);gain.connect(ctx.destination);
   tone.onended=()=>{try{tone.disconnect();gain.disconnect();}catch{}if(context===ctx){oscillator=null;context=null;try{void ctx.close()?.catch?.(()=>{});}catch{}}};
   tone.start(t);tone.stop(t+.29);
   if(typeof ctx.resume==="function")await ctx.resume();
   if(ctx.state==="suspended"){stop();return {supported:true,started:false,reason:"The browser kept audio suspended. Try opening the app directly in Chrome and tap Test speaker."};}
   return {supported:true,started:true,reason:"Short test tone requested. If silent, turn up your phone's MEDIA volume or try Chrome."};
  }catch{stop();return {supported:true,started:false,reason:"The browser could not start the test tone. Try Chrome with media volume up."};}
 }
 doc?.addEventListener?.("visibilitychange",()=>{if(doc.hidden)stop();});
 win?.addEventListener?.("pagehide",stop);
 return {supported,testSpeaker,stop};
}
const api={createProbe};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightPhoneProbe=api;
})(typeof window!=="undefined"?window:null);
