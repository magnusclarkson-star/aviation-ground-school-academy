/* Optional touch-yoke bank hold for long simulated turns on a phone.
 * No autopilot, route following or aircraft teleport. Stores only the user's
 * current lateral command; reset, pause or page blur must disarm it.
 */
(function(root){"use strict";
const clamp=v=>Math.max(-1,Math.min(1,Number.isFinite(v)?v:0));
function create(){
 let armed=false,held=0;
 function setArmed(on){
  armed=Boolean(on);
  if(!armed)held=0;
  return status();
 }
 function release(pointerBank){
  held=armed?clamp(pointerBank):0;
  return held;
 }
 function value(keyboardBank=null){
  return Number.isFinite(keyboardBank)?clamp(keyboardBank):
   armed?held:0;
 }
 function clear(){armed=false;held=0;return status()}
 function status(){return Object.freeze({armed,bank:held})}
 return Object.freeze({setArmed,release,value,clear,status});
}
const api=Object.freeze({create});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSABankHold=api;
})(typeof window!=="undefined"?window:null);
