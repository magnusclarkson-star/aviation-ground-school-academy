/* Progressive R44 touchscreen pedal travel.
 * Short taps produce precise yaw; a deliberate hold smoothly reaches full authority.
 * Reset the hold ramp on aircraft-mode transitions so direct airplane pedals cannot
 * silently carry full yaw input into a helicopter. Keyboard/gamepad remain direct.
 */
(function(root){"use strict";
const bound=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
function create(){
 const levels={left:0,right:0};
 let previousMode=null;
 function step({left=false,right=false,mode="airplane",dt=0}={}){
  const seconds=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
  const fine=mode==="helicopter";
  if(previousMode!==null&&previousMode!==mode){levels.left=0;levels.right=0}
  previousMode=mode;
  for(const key of ["left","right"]){
   if(!(key==="left"?left:right))levels[key]=0;
   else if(!fine)levels[key]=1;
   else levels[key]=bound(Math.max(.32,levels[key])+seconds*1.55);
  }
  return Math.max(-1,Math.min(1,levels.right-levels.left));
 }
 function reset(){levels.left=0;levels.right=0;previousMode=null}
 function status(){return Object.freeze({left:levels.left,right:levels.right})}
 return Object.freeze({step,reset,status});
}
const api=Object.freeze({create});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightTouchPedals=api;
})(typeof window!=="undefined"?window:null);
