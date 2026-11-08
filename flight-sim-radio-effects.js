/* Local, synthetic push-to-talk radio effects.
 * Browser speechSynthesis cannot be routed through Web Audio filters; this
 * models squelch, radio static and PTT keying around each spoken line.
 * No recording, microphone, RF transmission, network or audio samples.
 */
(function(root){"use strict";
function createEffects({windowLike}={}){
 const win=windowLike||root,Audio=win?.AudioContext||win?.webkitAudioContext;
 let ctx=null,enabled=false,noise=null,noiseGain=null,noiseFilter=null;
 const status=()=>({supported:typeof Audio==="function",enabled,active:Boolean(noise)});
 function makeBuffer(duration=.28){
  const n=Math.max(1,Math.floor(ctx.sampleRate*duration)),b=ctx.createBuffer(1,n,ctx.sampleRate),data=b.getChannelData(0);
  for(let i=0;i<n;i++)data[i]=(Math.random()*2-1)*.8;
  return b;
 }
 function filteredNoise(volume,duration,loop=false){
  if(!ctx)return null;
  const source=ctx.createBufferSource(),hp=ctx.createBiquadFilter(),lp=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=makeBuffer(loop?.48:duration+.02);source.loop=loop;
  hp.type="highpass";hp.frequency.value=480;
  lp.type="lowpass";lp.frequency.value=2500;
  source.connect(hp);hp.connect(lp);lp.connect(gain);gain.connect(ctx.destination);
  const now=ctx.currentTime;
  gain.gain.setValueAtTime(.001,now);
  gain.gain.linearRampToValueAtTime(volume,now+.015);
  if(!loop){
   gain.gain.setValueAtTime(volume,now+Math.max(.025,duration-.032));
   gain.gain.linearRampToValueAtTime(.001,now+duration);
  }
  source.start();
  if(!loop)source.stop(now+duration+.03);
  return {source,gain,filter:lp};
 }
 function keyClick(){
  if(!ctx)return;
  const osc=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime;
  osc.type="square";osc.frequency.setValueAtTime(540,t);
  g.gain.setValueAtTime(.022,t);g.gain.exponentialRampToValueAtTime(.0001,t+.023);
  osc.connect(g);g.connect(ctx.destination);osc.start(t);osc.stop(t+.025);
 }
 function burst(){
  if(!enabled||!ctx||ctx.state==="closed")return false;
  try{keyClick();filteredNoise(.045,.11,false);return true;}catch{return false;}
 }
 function end(){
  if(noise){
   try{noiseGain?.gain.setTargetAtTime(.0001,ctx.currentTime,.012);noise.source.stop(ctx.currentTime+.06);}catch{}
   noise=null;noiseGain=null;noiseFilter=null;
  }
  if(enabled)burst();
 }
 function begin(){
  if(!enabled||!ctx)return false;
  if(noise)end();
  const heard=burst();
  try{
   noise=filteredNoise(.008,.48,true);
   noiseGain=noise?.gain;noiseFilter=noise?.filter;
  }catch{noise=null;}
  return heard;
 }
 function disable(){
  if(noise){try{noise.source.stop()}catch{} noise=null;noiseGain=null;noiseFilter=null;}
  enabled=false;
  if(ctx){try{ctx.suspend?.()}catch{}}
  return false;
 }
 function enable(value=true){
  if(!value)return disable();
  if(typeof Audio!=="function")return false;
  try{
   if(!ctx||ctx.state==="closed")ctx=new Audio();
   enabled=true;
   if(ctx.state==="suspended")void ctx.resume?.().catch?.(()=>{});
   return true;
  }catch{enabled=false;return false;}
 }
 return {enable,disable,begin,end,burst,status};
}
const api={createEffects};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightRadioEffects=api;
})(typeof window!=="undefined"?window:null);
