/* Opt-in, bounded vibration cues for Academy fictional simulator.
 * Requires direct user activation and a browser implementing navigator.vibrate.
 * Silent/unsupported systems must still allow normal visual simulation.
 */
(function(root){"use strict";
const patterns=Object.freeze({
 control:[9],rudder:[10],flap:[13],runwayRumble:[14,35,11],
 turn:[13],climb:[11],descent:[10,25,10],turbulence:[22,32,16],
 stall:[36,45,36],liftoff:[25,35,16],touchdown:[45,30,26],
 hardLanding:[80,50,65],completed:[12,40,12]
});
const gaps=Object.freeze({
 control:350,rudder:350,flap:450,runwayRumble:1400,turn:1700,
 climb:2200,descent:2200,turbulence:1250,stall:1800,
 liftoff:550,touchdown:550,hardLanding:550,completed:550
});
function createHaptics({navigatorLike,documentLike,clock}={}){
 const nav=navigatorLike||(typeof navigator!=="undefined"?navigator:null);
 const doc=documentLike||(typeof document!=="undefined"?document:null);
 const now=clock||(()=>Date.now());
 const supported=typeof nav?.vibrate==="function";
 let enabled=false,lastGlobal=-Infinity;
 const last={};
 function stop(){
  // Do not even request a cancellation from the Vibration API until a
  // learner has opted in. This keeps the default state entirely inert.
  if(enabled&&supported)try{nav.vibrate(0)}catch{}
 }
 function setEnabled(value){
  const wasEnabled=enabled;
  enabled=supported&&value===true;
  if(wasEnabled&&!enabled&&supported)try{nav.vibrate(0)}catch{}
  return enabled;
 }
 function pulse(kind){
  if(!enabled||!supported||doc?.hidden||!Object.hasOwn(patterns,kind))return false;
  const t=now();
  if(!Number.isFinite(t)||t-lastGlobal<290||t-(last[kind]??-Infinity)<gaps[kind])return false;
  const pattern=patterns[kind].slice();
  // Each event is at most 195 ms in aggregate; never request continuous vibration.
  try{
   const accepted=nav.vibrate(pattern);
   if(accepted!==false){lastGlobal=t;last[kind]=t;return true;}
  }catch{}
  return false;
 }
 return {supported,pulse,stop,setEnabled,isEnabled:()=>enabled};
}
const api={createHaptics,patterns,gaps};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightHaptics=api;
})(typeof window!=="undefined"?window:null);
