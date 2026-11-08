/* Self-generated, looped PCM engine substitute for Android browsers where
 * Web Audio is inaudible. Explicit click required; no downloads, microphone,
 * remote sound, sensor access, or claimed aircraft acoustic accuracy.
 */
(function(root){"use strict";
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:min));
function createLoopWav(mode="airplane",sampleRate=22050){
 const rate=clamp(Math.round(Number(sampleRate)),8000,48000);
 const rotor=mode==="helicopter",count=rate;
 const bytes=new Uint8Array(44+2*count),d=new DataView(bytes.buffer);
 const ascii=(offset,s)=>{for(let k=0;k<s.length;k++)bytes[offset+k]=s.charCodeAt(k)};
 ascii(0,"RIFF");d.setUint32(4,bytes.length-8,true);ascii(8,"WAVE");ascii(12,"fmt ");
 d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);
 d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);
 d.setUint16(32,2,true);d.setUint16(34,16,true);
 ascii(36,"data");d.setUint32(40,count*2,true);
 for(let i=0;i<count;i++){
  const t=i/rate,base=rotor?108:132;
  // Integer-frequency harmonics and modulation join seamlessly at 1 s.
  const beat=rotor?.57+.43*Math.pow(.5+.5*Math.sin(2*Math.PI*9*t),2):.94+.06*Math.sin(2*Math.PI*6*t);
  const wave=(.53*Math.sin(2*Math.PI*base*t)+.3*Math.sin(2*Math.PI*base*2*t)
   +.15*Math.sin(2*Math.PI*base*3*t)) * beat;
  d.setInt16(44+i*2,Math.round(clamp(wave*.58,-.85,.85)*32767),true);
 }
 return bytes;
}
function createEngine({windowLike,documentLike}={}){
 const win=windowLike||root,doc=documentLike||win?.document;
 const supported=typeof win?.Audio==="function"&&typeof win?.Blob==="function"&&typeof win?.URL?.createObjectURL==="function";
 let player=null,url=null,active=false,mode="airplane",volume=100,duck=false,lastResult="not requested",seq=0,rate=1;
 function targetVolume(){
  if(player)try{player.volume=clamp(volume,0,100)/100*(duck?.32:1)}catch{}
 }
 function stop(){
  ++seq;active=false;
  const old=player;player=null;
  if(old)try{old.onended=null;old.onerror=null;old.pause();old.removeAttribute?.("src");old.load?.()}catch{}
  if(url){try{win.URL.revokeObjectURL(url)}catch{}url=null}
 }
 function update(nextMode,power){
  if(!active||!player)return false;
  // Aircraft switches are handled by the simulator's reset logic.
  const p=clamp(Number(power),0,1);
  rate=clamp((mode==="helicopter"?.81:.83)+p*.52,.75,1.42);
  try{player.playbackRate=rate}catch{}
  return true;
 }
 async function start(nextMode="airplane",power=0){
  if(!supported){lastResult="unsupported";return false;}
  if(doc?.hidden){lastResult="page hidden";return false;}
  if(active){update(nextMode,power);return true;}
  stop();mode=nextMode==="helicopter"?"helicopter":"airplane";
  const current=seq;
  try{
   url=win.URL.createObjectURL(new win.Blob([createLoopWav(mode)],{type:"audio/wav"}));
   player=new win.Audio();
   player.preload="auto";player.loop=true;player.src=url;
   targetVolume();
   // Call play synchronously before first await to preserve Android tap permission.
   const playing=player.play();
   if(playing&&typeof playing.then==="function")await playing;
   if(current!==seq)return false;
   active=true;lastResult="loop playback requested";
   update(mode,power);
   return true;
  }catch(error){
   lastResult="blocked: "+(error?.name||"playback unavailable");
   stop();return false;
  }
 }
 function setVolume(percent){volume=clamp(Number(percent),0,100);targetVolume();return volume;}
 function setDuck(value){duck=value===true;targetVolume();}
 function status(){return {supported,active,mode,volume,duck,rate,lastResult};}
 doc?.addEventListener?.("visibilitychange",()=>{if(doc.hidden)stop()});
 win?.addEventListener?.("pagehide",stop);
 return {supported,start,stop,update,setVolume,setDuck,status};
}
const api={createLoopWav,createEngine};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightCompatEngine=api;
})(typeof window!=="undefined"?window:null);
