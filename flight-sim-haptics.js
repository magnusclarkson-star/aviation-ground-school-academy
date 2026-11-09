/* Opt-in, bounded phone vibration for fictional Academy flight controls.
 * Browser acceptance cannot prove the hardware motor moved. No background use.
 */
(function(root){"use strict";
const patterns=Object.freeze({
 control:[45],rudder:[45],flap:[55],runwayRumble:[55,30,50],
 turn:[50],climb:[50],descent:[55,25,45],turbulence:[65,35,65],
 stall:[80,35,75],liftoff:[70,35,65],hoverHeld:[45,25,45],touchdown:[75,35,70],
 hardLanding:[80,35,80],completed:[60,35,60],airflow:[55,30,55]
});
const gaps=Object.freeze({
 control:350,rudder:350,flap:450,runwayRumble:1700,turn:1700,
 climb:2200,descent:2200,turbulence:1900,stall:1800,
 liftoff:550,hoverHeld:3000,touchdown:550,hardLanding:550,completed:550,airflow:3200
});
const sum=items=>items.reduce((a,b)=>a+b,0);
function createHaptics({navigatorLike,documentLike,clock}={}){
 const nav=navigatorLike||(typeof navigator!=="undefined"?navigator:null);
 const doc=documentLike||(typeof document!=="undefined"?document:null);
 const now=clock||(()=>Date.now());
 const supported=typeof nav?.vibrate==="function";
 let enabled=false,lastGlobal=-Infinity,quality="noticeable",lastResult="not requested";
 let requestCount=0,acceptedCount=0,strongTestCount=0;
 const last=Object.create(null);
 function stop(){
  if(enabled&&supported)try{nav.vibrate(0)}catch{}
 }
 function setEnabled(value){
  const previous=enabled;
  enabled=supported&&value===true;
  if(previous&&!enabled&&supported)try{nav.vibrate(0)}catch{}
  return enabled;
 }
 function setStrength(value){quality=value==="gentle"?"gentle":"noticeable";return quality;}
 function request(pattern){
  if(!supported||doc?.hidden){lastResult=supported?"page hidden":"unsupported";return false;}
  requestCount++;
  try{
   const accepted=nav.vibrate(pattern.slice())!==false;
   if(accepted)acceptedCount++;
   lastResult=accepted?"browser accepted request":"browser rejected request";
   return accepted;
  }catch{lastResult="browser threw an error";return false;}
 }
 function pulse(kind){
  if(!enabled||!Object.prototype.hasOwnProperty.call(patterns,kind))return false;
  const t=now();
  if(!Number.isFinite(t)||t-lastGlobal<290||t-(last[kind]??-Infinity)<gaps[kind])return false;
  const source=patterns[kind];
  const pattern=quality==="gentle"?source.map(x=>Math.max(12,Math.round(x*.65))):source;
  if(sum(pattern)>200)return false;
  if(request(pattern)){lastGlobal=t;last[kind]=t;return true;}
  return false;
 }
 // Called exclusively from an explicit "Test vibration" click. This does
 // not arm automatic flight vibration or promise that hardware moved.
 function test(){
  const accepted=request([80,35,80]);
  if(accepted){lastGlobal=now();last.control=lastGlobal;last.airflow=lastGlobal;last.runwayRumble=lastGlobal;}
  return {supported,accepted,reason:lastResult};
 }
 // A stronger, bounded diagnostic ONLY from a direct learner click.
 // Never used for automatic in-flight feedback or repeated unattended.
 function testStrong(){
  strongTestCount++;
  const accepted=request([180,100,180]); // 460ms total
  if(accepted){lastGlobal=now();last.control=lastGlobal;last.airflow=lastGlobal;last.runwayRumble=lastGlobal;}
  return {supported,accepted,reason:lastResult};
 }
 function ambience(state,input){
  if(!enabled||!state||doc?.hidden)return false;
  const speed=Number(state.speedKt)||0;
  if((state.phase==="roll"||state.phase==="rollout")&&speed>=8)
   return pulse("runwayRumble");
  if(["climb","flight","approach","lift","hover"].includes(state.phase)&&
     (Number(input?.turbulence)||0)>0.05) return pulse("airflow");
  return false;
 }
 return {supported,pulse,ambience,test,testStrong,stop,setEnabled,setStrength,
   isEnabled:()=>enabled,status:()=>({
    supported,enabled,strength:quality,lastResult,requestCount,acceptedCount,strongTestCount
   })};
}
const api={createHaptics,patterns,gaps};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightHaptics=api;
})(typeof window!=="undefined"?window:null);
