/* An optional HTMLAudioElement fallback for phone browsers that block Web Audio.
 * Synthesizes a tiny PCM WAV locally on a direct user click. No microphone,
 * remote file, network API or recording. Playback cannot prove audible output.
 */
(function(root){"use strict";
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function makeWave({sampleRate=22050,duration=1.1}={}){
 const hz=clamp(Math.round(Number(sampleRate)||22050),8000,48000);
 const seconds=clamp(Number(duration)||1.1,.2,2);
 const count=Math.round(hz*seconds);
 const bytes=new Uint8Array(44+count*2),view=new DataView(bytes.buffer);
 const word=(position,value)=>view.setUint32(position,value,true);
 const short=(position,value)=>view.setUint16(position,value,true);
 for(const [offset,string] of [[0,"RIFF"],[8,"WAVE"],[12,"fmt "],[36,"data"]]){
  for(let i=0;i<string.length;i++)bytes[offset+i]=string.charCodeAt(i);
 }
 word(4,bytes.length-8);word(16,16);short(20,1);short(22,1);
 word(24,hz);word(28,hz*2);short(32,2);short(34,16);word(40,count*2);
 for(let i=0;i<count;i++){
  const t=i/hz,edge=Math.min(1,t/.025,(seconds-t)/.08);
  const env=Math.max(0,Math.min(1,edge));
  const signal=(Math.sin(2*Math.PI*740*t)*.72+Math.sin(2*Math.PI*980*t)*.28);
  view.setInt16(44+i*2,Math.round(32767*.26*env*signal),true);
 }
 return bytes;
}
function createFallback({windowLike,documentLike}={}){
 const win=windowLike||root,doc=documentLike||win?.document;
 const supported=typeof win?.Audio==="function"&&
  typeof win?.Blob==="function"&&
  typeof win?.URL?.createObjectURL==="function";
 let player=null,url=null,lastResult="not tested";
 function stop(){
  if(player){try{player.onended=null;player.onerror=null;player.pause();player.removeAttribute?.("src");player.load?.();}catch{}player=null;}
  if(url){try{win.URL.revokeObjectURL(url);}catch{}url=null;}
 }
 async function play(){
  if(!supported){lastResult="HTML audio unsupported";return {supported:false,started:false,reason:"This browser does not expose the backup audio player."};}
  if(doc?.hidden){lastResult="page hidden";return {supported:true,started:false,reason:"The page is hidden; open it in Chrome and retry."};}
  try{
   stop();
   const blob=new win.Blob([makeWave()],{type:"audio/wav"});
   url=win.URL.createObjectURL(blob);
   player=new win.Audio();
   player.preload="auto";player.volume=1;player.src=url;
   const current=player;
   player.onended=()=>{if(player===current)stop();};
   const result=player.play(); // Triggered synchronously inside the user's click handler.
   if(result&&typeof result.then==="function")await result;
   lastResult="playback requested";
   return {supported:true,started:true,reason:"Backup audio playback requested for 1 second. The browser cannot confirm whether your speaker made sound."};
  }catch(error){
   lastResult=error?.name||"playback blocked";
   stop();
   return {supported:true,started:false,reason:"Backup audio could not start ("+lastResult+"). Open this page directly in Chrome and try again."};
  }
 }
 doc?.addEventListener?.("visibilitychange",()=>{if(doc.hidden)stop();});
 win?.addEventListener?.("pagehide",stop);
 return {supported,play,stop,status:()=>({supported,active:player!==null,lastResult}),makeWave};
}
const api={makeWave,createFallback};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightAudioFallback=api;
})(typeof window!=="undefined"?window:null);
