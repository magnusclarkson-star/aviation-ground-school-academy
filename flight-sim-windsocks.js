/* Shared fictional wind-responsive runway windsocks for Canvas and WebGL.
 * Coordinates are local synthetic metres, not navigational wind observations.
 * Every renderer samples the same downwind direction. No network or device APIs.
 */
(function(root){"use strict";
const positions=Object.freeze([
 Object.freeze({x:55,z:170}),
 Object.freeze({x:-58,z:1000})
]);
function sample(windXMps=0,windZMps=0,time=0,reducedMotion=false){
 const x=Number.isFinite(windXMps)?windXMps:0;
 const z=Number.isFinite(windZMps)?windZMps:0;
 const strengthMps=Math.hypot(x,z),active=strengthMps>.25;
 const elapsed=Number.isFinite(time)?Math.max(0,time):0;
 // Tiny bounded flutter varies with simulated time, not frame rate.
 // Reduced-motion preferences completely suppress this ornamental motion.
 const flutterRad=active&&!reducedMotion?
  Math.sin(elapsed*2.8)*.035*Math.min(1,strengthMps/3):0;
 const angleRad=active?Math.atan2(x,z)+flutterRad:0;
 const lengthM=active?7:0;
 return Object.freeze({active,strengthMps,angleRad,
  tipXM:Math.sin(angleRad)*lengthM,
  tipZM:Math.cos(angleRad)*lengthM});
}
const api=Object.freeze({positions,sample});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightWindsocks=api;
})(typeof window!=="undefined"?window:null);
