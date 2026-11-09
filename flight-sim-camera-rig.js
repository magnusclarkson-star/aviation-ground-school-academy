/* Frame-rate-independent exterior camera damping. Visual only: does not
 * modify simulator state, aircraft handling, navigation or cockpit controls.
 * Snap immediately on reset, aircraft/view change and scenario teleport.
 */
(function(root){"use strict";
const TAU=Math.PI*2;
const finite=n=>Number.isFinite(n);
const copy=pose=>({...pose,eye:pose.eye.slice(),craft:pose.craft.slice()});
const turn=(from,to)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
function create({responseMs=180,teleportMetres=175}={}){
 const response=Math.max(35,Math.min(600,Number(responseMs)||180));
 const threshold=Math.max(30,Number(teleportMetres)||175);
 let last=null,stamp=null,key=null;
 function reset(){last=null;stamp=null;key=null;}
 function next(pose,now=0,identity=""){
  if(!pose||!Array.isArray(pose.eye)||!Array.isArray(pose.craft))return pose;
  const target=copy(pose),time=Number(now),tag=String(identity)+"|"+target.view;
  const invalid=[...target.eye,...target.craft,target.yaw,target.pitch,target.roll].some(v=>!finite(v));
  if(invalid)return pose;
  const instantaneous=target.view==="cockpit"||target.view==="inspect";
  const distance=last?Math.hypot(...target.craft.map((v,i)=>v-last.craft[i])):Infinity;
  const interval=stamp===null?Infinity:time-stamp;
  const discontinuity=last===null||key!==tag||!finite(time)||
   interval<0||interval>1000||distance>threshold;
  if(discontinuity||instantaneous){
   last=target;stamp=finite(time)?time:0;key=tag;
   return copy(target);
  }
  // Exponential approach is independent of device frame rate. Shortest-angle
  // interpolation avoids a 360-degree camera spin across compass north.
  const alpha=1-Math.exp(-Math.max(0,Math.min(120,interval))/response);
  const output={...target,
   eye:target.eye.map((v,i)=>last.eye[i]+(v-last.eye[i])*alpha),
   yaw:last.yaw+turn(last.yaw,target.yaw)*alpha,
   pitch:last.pitch+turn(last.pitch,target.pitch)*alpha,
   roll:last.roll+turn(last.roll,target.roll)*alpha
  };
  // The craft stays at its TRUE flight position while only the viewpoint is
  // damped. This prevents physically lagging aircraft or incorrect readings.
  last=output;stamp=time;key=tag;
  return copy(output);
 }
 return {next,reset};
}
const api={create,turn,TAU};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSACameraRig=api;
})(typeof window!=="undefined"?window:null);
