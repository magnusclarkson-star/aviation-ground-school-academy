/* Lightweight, visible alternative for students whose browser cannot
 * deliver haptic feedback. Fictional aircraft cues, not physical forces.
 */
(function(root){"use strict";
const eventText=Object.freeze({
 hardLanding:["HARD LANDING","impact"],touchdown:["TOUCHDOWN","impact"],
 liftoff:["LIFTOFF","motion"],stall:["STALL WARNING","impact"],
 turbulence:["BUMPY AIR","rough"],runwayRumble:["RUNWAY RUMBLE","rough"],
 turn:["TURN","motion"],climb:["CLIMB","motion"],
 descent:["DESCENT","motion"],completed:["EXERCISE COMPLETE","idle"]
});
const phaseText=Object.freeze({
 roll:["GROUND ROLL","rough"],climb:["CLIMBING","motion"],
 flight:["CRUISE PRACTICE","motion"],approach:["APPROACH","motion"],
 rollout:["LANDING ROLL","rough"],complete:["FLIGHT COMPLETE","idle"],
 halted:["RESET REQUIRED","impact"],pad:["READY ON PAD","idle"],
 lift:["ROTORCRAFT LIFT","motion"],hover:["HOVER PRACTICE","motion"],
 landed:["ON HELIPAD","idle"]
});
const known={impact:true,rough:true,motion:true,idle:true};
function describe(state={},events=[]){
 const e=Array.isArray(events)?events.find(x=>Object.prototype.hasOwnProperty.call(eventText,x)):null;
 const data=e?eventText[e]:phaseText[state?.phase]||["SIMULATED FLIGHT","idle"];
 const kind=known[data[1]]?data[1]:"idle";
 return {label:data[0],kind,warning:"Visual feedback only; it does not confirm that your phone vibrated."};
}
const api={describe};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightFeedbackVisual=api;
})(typeof window!=="undefined"?window:null);
