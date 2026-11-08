/* Optional browser Gamepad API adapter for fictional flight training.
 * Nothing is read until the learner explicitly enables the controller.
 * No device identifiers, raw events, axis histories or telemetry are stored.
 * Controllers have varying mappings: this is NOT a calibrated flight device.
 */
(function(root){"use strict";
const DEFAULT=Object.freeze({bank:0,pitch:1,rudder:2,power:null,reversePitch:false,deadzone:.12});
const AXES=Object.freeze(["bank","pitch","rudder","power"]);
function indexOfAxis(value){
 if(value===null||value==="none")return null;
 const n=Number(value);
 if(!Number.isInteger(n)||n<0||n>7)throw Error("Controller axis index must be 0–7 or none");
 return n;
}
function clamp(x,low,high){return Math.max(low,Math.min(high,Number.isFinite(x)?x:0))}
function axis(raw,centre=0,dz=.12){
 if(!Number.isFinite(raw))return 0;
 const delta=clamp(raw-centre,-1,1),strength=Math.abs(delta);
 return strength<=dz?0:Math.sign(delta)*clamp((strength-dz)/(1-dz),0,1);
}
function button(gp,index){
 const v=gp?.buttons?.[index];
 return v?.pressed===true?Math.max(.5,clamp(v.value,0,1)):clamp(v?.value,0,1);
}
function makeController({navigatorLike,documentLike}={}){
 const nav=navigatorLike||(typeof navigator!=="undefined"?navigator:null);
 const doc=documentLike||(typeof document!=="undefined"?document:null);
 const supported=typeof nav?.getGamepads==="function";
 let enabled=false,index=null,mapping={...DEFAULT},neutral=Object.create(null),powerSetpoint=0;
 function devices(){
  if(!supported||doc?.hidden)return [];
  try{
   return Array.from(nav.getGamepads()||[]).filter(gp=>gp?.connected===true &&
    Number.isInteger(gp.index)&&gp.index>=0&&gp.index<32).map(gp=>({
     index:gp.index,axes:Math.min(gp.axes?.length||0,32),
     buttons:Math.min(gp.buttons?.length||0,32)
    }));
  }catch{return []}
 }
 function sample(){
  if(!supported||doc?.hidden)return null;
  try{
   const pad=Array.from(nav.getGamepads()||[]).find(gp=>gp?.connected===true&&gp.index===index);
   return pad||null;
  }catch{return null}
 }
 function availableAxis(pad,key){
  const id=mapping[key];
  return id!==null&&id<Math.min(pad.axes?.length||0,32) &&
   Number.isFinite(pad.axes[id]);
 }
 function setPower(value){powerSetpoint=clamp(value,0,1)}
 function enable(value){
  if(value!==true){
   enabled=false;index=null;neutral=Object.create(null);return false;
  }
  if(!supported||doc?.hidden){enabled=false;return false}
  enabled=true;
  return true; // may not have a connected controller yet
 }
 function choose(nextIndex){
  const n=Number(nextIndex);
  if(!enabled||!Number.isInteger(n)||!devices().some(x=>x.index===n))return false;
  index=n;
  neutral=Object.create(null);
  return true;
 }
 function configure(options){
  if(!options||typeof options!=="object"||Array.isArray(options))throw Error("Controller mapping required");
  const keys=Object.keys(options);
  if(keys.some(k=>!AXES.includes(k)&&!["deadzone","reversePitch"].includes(k)))
   throw Error("Unknown controller configuration field");
  const next={...mapping};
  for(const key of AXES)if(Object.hasOwn(options,key))next[key]=indexOfAxis(options[key]);
  if(next.bank===null||next.pitch===null)throw Error("Bank and pitch axes must be assigned");
  if(next.bank===next.pitch)throw Error("Bank and pitch axes must be distinct");
  if(Object.hasOwn(options,"reversePitch"))next.reversePitch=options.reversePitch===true;
  if(Object.hasOwn(options,"deadzone")){
   const dz=Number(options.deadzone);
   if(!Number.isFinite(dz)||dz<.03||dz>.35)throw Error("Deadzone must be between 0.03 and 0.35");
   next.deadzone=dz;
  }
  mapping=next;neutral=Object.create(null);
  return {...mapping};
 }
 function calibrate(){
  const gp=sample();
  if(!enabled||!gp)return false;
  // Calibrate only axes used for directional commands. A throttle lever can
  // have an intentional off-centre range and must never be zeroed.
  const next=Object.create(null);
  for(const key of ["bank","pitch","rudder"]){
   if(availableAxis(gp,key)){
    const n=mapping[key],v=gp.axes[n];
    if(Math.abs(v)>.65)return false; // reject accidentally held hard-over controls
    next[n]=clamp(v,-.35,.35);
   }
  }
  neutral=next;
  return true;
 }
 function read(dt=0){
  if(!enabled)return {state:"off",active:false};
  if(doc?.hidden)return {state:"hidden",active:false};
  const gp=sample();
  if(!gp){
   if(index!==null){enable(false);return {state:"disconnected",active:false};}
   return {state:"waiting",active:false};
  }
  if(!availableAxis(gp,"bank")||!availableAxis(gp,"pitch"))
   return {state:"incompatible",active:false};
  const values={};
  for(const key of ["bank","pitch","rudder"])
   values[key]=availableAxis(gp,key)?
    axis(gp.axes[mapping[key]],neutral[mapping[key]]||0,mapping.deadzone):0;
  // The standard left-thumb Y axis is positive when pressed down: move up
  // makes the fictional aircraft nose rise, matching touchscreen controls.
  if(mapping.reversePitch)values.pitch=-values.pitch;
  let powerChanged=false;
  if(availableAxis(gp,"power")){
   // Standard analog throttle range: -1=idle / 1=max. Learners may select
   // "Reverse" via a separate axis-mapping control in future revisions.
   powerSetpoint=clamp((gp.axes[mapping.power]+1)/2,0,1);
   powerChanged=true;
  }else{
   const decrement=button(gp,6),increment=button(gp,7);
   if(increment>.1||decrement>.1){
    powerSetpoint=clamp(powerSetpoint+(increment-decrement)*clamp(dt,0,.1)*.7,0,1);
    powerChanged=true;
   }
  }
  const brake=button(gp,0)>.5;
  return {state:"active",active:true,bank:values.bank,pitch:values.pitch,
   rudder:values.rudder,brake,power:powerSetpoint,powerChanged};
 }
 function status(){return {supported,enabled,index,mapping:{...mapping},
  devices:devices(),hasSelectedDevice:!!sample()}}
 return {supported,devices,enable,choose,configure,calibrate,setPower,read,status,
  isEnabled:()=>enabled,selected:()=>index};
}
const api={makeController,DEFAULT,axis,indexOfAxis};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightGamepad=api;
})(typeof window!=="undefined"?window:null);
