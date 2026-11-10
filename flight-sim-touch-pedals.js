/* Progressive R44 touchscreen pedal travel.
 * A short tap starts with a small yaw command; holding grows smoothly to
 * full pedal authority. The plane, keyboard and gamepad controls stay direct.
 * Deterministic, local-only; no timers or screen/phone sensor access.
 */
(function(root){"use strict";
const bound=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
function create(){
 const levels={left:0,right:0};
 function step({left=false,right=false,mode="airplane",dt=0}={}){
  const seconds=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
  const fine=mode==="helicopter";
  // On a multi-touch phone both pedals can overlap as fingers move.
  // Neutralise the pair immediately so releasing one finger cannot cause
  // an unexpected full-yaw command from the other held pointer.
  if(left&&right){levels.left=0;levels.right=0;return 0;}
  for(const key of ["left","right"]){
   if(!(key==="left"?left:right))levels[key]=0;
   else if(!fine)levels[key]=1;
   else levels[key]=bound(Math.max(.18,levels[key])+seconds*.86);
  }
  return Math.max(-1,Math.min(1,levels.right-levels.left));
 }
 function reset(){levels.left=0;levels.right=0}
 function status(){return Object.freeze({left:levels.left,right:levels.right})}
 return Object.freeze({step,reset,status});
}
const api=Object.freeze({create});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightTouchPedals=api;
})(typeof window!=="undefined"?window:null);
