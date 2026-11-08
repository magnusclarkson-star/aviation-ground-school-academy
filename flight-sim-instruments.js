/* Standalone simulated flight-display formatting and DOM renderer.
 * Displays only imaginary aircraft state from flight-sim-model.js.
 * This is not a real PFD, compass, altimeter or aviation-certified display.
 */
(function(root){"use strict";
const E=root?.AGSAFlightEnvironment||(typeof module!=="undefined"?require("./flight-sim-environment.js"):null);
if(!E)throw Error("Fictional aircraft profiles unavailable");
const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,finite(v)));
const round=v=>Math.round(finite(v));
function snapshot(state){
 if(!state||!["airplane","helicopter"].includes(state.mode))
  throw Error("Supported synthetic aircraft state required");
 const pitch=clamp(state.pitchDeg,-80,80);
 const roll=clamp(state.rollDeg,-80,80);
 const heading=((round(state.headingDeg)%360)+360)%360;
 const climb=clamp(state.verticalMs,-20,20);
 const slip=clamp(state.mode==="helicopter"?state.lateralMs/8:state.rollDeg/35,-1,1);
 const offset=clamp(state.xM,-300,300);
 const speed=Math.max(0,round(state.speedKt));
 const height=Math.max(0,round(state.altitudeM));
 const phase=String(state.phase||"ready");
 const lowSpeed=state.mode==="airplane"&&!state.onGround&&
  finite(state.speedKt)<E.selectProfile(state.profileId||"trainer").stallKt+4;
 return {
  pitch,roll,
  // Positive nose-up pitch lowers the drawn horizon; positive bank inclines
  // the drawn horizon in the opposite direction to the aircraft.
  horizonTransform:`translate(120 ${(82+pitch*2.7).toFixed(2)}) rotate(${(-roll).toFixed(2)}) translate(-120 -82)`,
  heading:String(heading).padStart(3,"0")+"°",
  speed:String(speed),height:String(height),
  vertical:(climb>=0?"+":"")+climb.toFixed(1)+" m/s",
  orientation:`PITCH ${round(pitch)}° · BANK ${round(roll)}°`,
  slipPixel:round(slip*25),
  offsetPixel:round(clamp(offset,-80,80)*.75),
  offsetText:`${round(offset)} m`,
  offsetLabel:state.mode==="helicopter"?"PAD OFFSET":"RUNWAY OFFSET",
  phase:phase.toUpperCase().replaceAll("-"," "),
  speedWarning:lowSpeed,
  heightUnit:"m AGL"
 };
}
function paint(doc,state){
 const v=snapshot(state);
 const get=id=>doc.getElementById(id);
 get("pfdHorizonMotion").setAttribute("transform",v.horizonTransform);
 get("pfdHeading").textContent=v.heading;
 get("pfdSpeed").textContent=v.speed;
 get("pfdAltitude").textContent=v.height;
 get("pfdVerticalRate").textContent=v.vertical;
 get("pfdAttitude").textContent=v.orientation;
 get("pfdSlipDot").setAttribute("cx",String(120+v.slipPixel));
 get("pfdSpeed").setAttribute("fill",v.speedWarning?"#ffe7a0":"#f8fdff");
 get("pfdSpeedStatus").textContent=v.speedWarning?"LOW ENERGY · FICTIONAL MODEL":"SIMULATED AIRSPEED";
 get("offsetLabel").textContent=v.offsetLabel;
 get("alignmentMarker").style.transform="translateX("+v.offsetPixel+"px)";
 get("alignmentOffset").textContent=v.offsetText;
 get("alignmentMarker").setAttribute("aria-label",v.offsetLabel+": "+v.offsetText);
 return v;
}
const api={snapshot,paint};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightInstruments=api;
})(typeof window!=="undefined"?window:null);
