/* Optional locally synthesized fictional aircraft-engine sound.
 * Never opens an AudioContext until a direct learner gesture. No mic, files,
 * streams, network or realistic engine-performance representation.
 */
(function(root){"use strict";
const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number.isFinite(n)?n:a));
const model=(mode,power)=>{
 const p=clamp(Number(power),0,1),heli=mode==="helicopter";
 return Object.freeze({
  primaryHz:heli?95+70*p:118+175*p,
  harmonicHz:heli?235+175*p:275+245*p,
  chopHz:heli?12+8*p:0,
  engineLevel:heli?.14+.065*p:.13+.11*p
 });
};
function createEngine({windowLike,documentLike}={}){
 const win=windowLike||root,doc=documentLike||win?.document;
 const Audio=win?.AudioContext||win?.webkitAudioContext;
 const supported=typeof Audio==="function";
 let active=false,ctx=null,osc=[],nodes=[],gain=null,chopGain=null,volume=100,duck=false,mode="airplane",texture="textured",grainGain=null;
 function setTarget(parameter,value){
  if(parameter&&ctx){
   try{parameter.setTargetAtTime(value,ctx.currentTime,.06);}
   catch{parameter.value=value;}
  }
 }
 function level(power=0){
  if(!gain)return;
  const amount=clamp(volume,0,100)/100;
  setTarget(gain.gain,(duck?.42:1)*amount*model(mode,power).engineLevel);
 }
 function stop(){
  active=false;
  for(const o of osc){try{o.stop()}catch{}try{o.disconnect()}catch{}}
  for(const n of nodes){try{n.disconnect()}catch{}}
  osc=[];nodes=[];gain=null;chopGain=null;grainGain=null;
  if(ctx){try{void ctx.close()?.catch?.(()=>{});}catch{}ctx=null;}
 }
 async function start(nextMode="airplane",power=0){
  if(!supported||doc?.hidden)return false;
  if(active){update(nextMode,power);return true;}
  try{
   // All oscillators are created only within the user's click handler.
   ctx=new Audio();mode=nextMode==="helicopter"?"helicopter":"airplane";
   const primary=ctx.createOscillator(),harmonic=ctx.createOscillator(),lfo=ctx.createOscillator(),grain=ctx.createOscillator();
   primary.type="triangle";harmonic.type="sawtooth";grain.type="triangle";
   const pGain=ctx.createGain(),hGain=ctx.createGain();
   grainGain=ctx.createGain();
   pGain.gain.value=.8;hGain.gain.value=.18;grainGain.gain.value=0;
   const filter=ctx.createBiquadFilter();
   filter.type="lowpass";filter.frequency.value=1100;
   gain=ctx.createGain();gain.gain.value=0;
   primary.connect(pGain);harmonic.connect(hGain);
    pGain.connect(filter);hGain.connect(filter);grain.connect(grainGain);grainGain.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
   lfo.type="sine";
   chopGain=ctx.createGain();chopGain.gain.value=0;
   lfo.connect(chopGain);chopGain.connect(gain.gain);
   osc=[primary,harmonic,lfo,grain];nodes=[pGain,hGain,grainGain,filter,gain,chopGain];
   osc.forEach(o=>o.start());
   active=true;update(mode,power);
   if(typeof ctx.resume==="function")await ctx.resume();
   if(ctx?.state==="suspended"){stop();return false;}
   return active;
  }catch{stop();return false;}
 }
 function update(nextMode,power){
  if(!active||!ctx)return false;
  mode=nextMode==="helicopter"?"helicopter":"airplane";
  const p=clamp(Number(power),0,1),v=model(mode,p);
  setTarget(osc[0].frequency,v.primaryHz);
  setTarget(osc[1].frequency,v.harmonicHz);
  setTarget(osc[2].frequency,Math.max(1,v.chopHz));
  setTarget(osc[3].frequency,v.harmonicHz*1.58);
  setTarget(grainGain.gain,texture==="textured"?(mode==="helicopter"?.20:.13):.015);
  setTarget(chopGain.gain,mode==="helicopter"?(texture==="textured"?.019:.012):(texture==="textured"?.004:.001));
  level(p);
  return true;
 }
 function setTexture(value,power=0){
  texture=value==="textured"?"textured":"smooth";
  if(active)update(mode,power);
  return texture;
 }
 function setVolume(value,power=0){volume=clamp(Number(value),0,100);level(power);return volume;}
 function setDuck(value,power=0){duck=value===true;level(power);}
 function status(){return {supported,active,volume,duck,mode,texture,audioState:ctx?.state||(active?"unknown":"off")};}
 if(doc?.addEventListener)doc.addEventListener("visibilitychange",()=>{if(doc.hidden)stop();});
 win?.addEventListener?.("pagehide",stop);
 return {supported,start,update,stop,setVolume,setTexture,setDuck,status,model};
}
const api={createEngine,model};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightEngineAudio=api;
})(typeof window!=="undefined"?window:null);
