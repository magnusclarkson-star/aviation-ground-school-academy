/* Lightweight route cues for the fictional home-runway circuit.
 * Position and heading come only from local simulator state. The instructor
 * does NOT steer, alter flight physics, imply ATC clearance or claim real
 * flight procedures. The route is deliberately a spacious right-hand loop.
 */
(function(root){"use strict";
const RAD=180/Math.PI;
const heading=n=>((Number(n)||0)%360+360)%360;
const signedDelta=(from,to)=>((heading(to)-heading(from)+540)%360)-180;
const eligible=s=>s?.mode==="airplane"&&["runway","approach"].includes(s?.scenario);
const LEGS=Object.freeze({
 departure:Object.freeze({label:"DEPARTURE",target:[0,1900],course:0,
  hint:"Fly past the far end of the runway, then start a right turn."}),
 crosswind:Object.freeze({label:"CROSSWIND",target:[900,2250],course:90,
  hint:"Continue the right turn towards east, then turn towards south."}),
 downwind:Object.freeze({label:"DOWNWIND",target:[900,-1750],course:180,
  hint:"Fly south beside the runway until you are beyond its approach end."}),
 base:Object.freeze({label:"BASE",target:[0,-1900],course:270,
  hint:"Turn right towards west, then turn north to line up with the runway."}),
 final:Object.freeze({label:"FINAL",target:[0,300],course:0,
  hint:"Line up with the runway, check height and descent, and aim for a gentle touchdown."}),
 landed:Object.freeze({label:"LANDED",target:[0,900],course:0,
  hint:"You returned to the starting runway without resetting the flight."}),
 stopped:Object.freeze({label:"STOPPED",target:[0,900],course:0,
  hint:"The exercise stopped after terrain or runway contact. Restart to try again."})
});
const PATH=Object.freeze([[0,250],[0,1750],[900,2250],[900,-1750],[0,-1900],[0,250]]);
function create(state){
 return {stage:!eligible(state)?"inactive":state.scenario==="approach"?"final":"departure"};
}
function update(circuit,state){
 if(!circuit||!eligible(state)||circuit.stage==="inactive")return circuit;
 if(state.phase==="halted"){circuit.stage="stopped";return circuit}
 if(state.phase==="rollout"||state.phase==="complete"){circuit.stage="landed";return circuit}
 if(["landed","stopped"].includes(circuit.stage))return circuit;
 const x=Number(state.xM)||0,z=Number(state.zM)||0,h=heading(state.headingDeg);
 const airborne=!state.onGround;
 if(!airborne)return circuit;
 if(circuit.stage==="departure"&&z>=1650&&state.altitudeM>=30)
  circuit.stage="crosswind";
 if(circuit.stage==="crosswind"&&x>=500&&h>=125&&h<=245)
  circuit.stage="downwind";
 if(circuit.stage==="downwind"&&z<=-1500&&h>=130&&h<=235)
  circuit.stage="base";
 if(circuit.stage==="base"&&z<=-650&&Math.abs(signedDelta(h,0))<=35&&Math.abs(x)<650)
  circuit.stage="final";
 return circuit;
}
function status(circuit,state){
 if(!eligible(state)||!circuit||!LEGS[circuit.stage])return null;
 const step=LEGS[circuit.stage];
 const x=Number(state.xM)||0,z=Number(state.zM)||0;
 const dx=step.target[0]-x,dz=step.target[1]-z;
 const distance=Math.hypot(dx,dz);
 const bearing=heading(Math.atan2(dx,dz)*RAD);
 const offset=signedDelta(state.headingDeg,bearing);
 const turn=offset>8?"RIGHT":offset< -8?"LEFT":"AHEAD";
 const distanceText=distance>=1000?(distance/1000).toFixed(1)+" km":Math.round(distance)+" m";
 const course=String(step.course).padStart(3,"0")+"°";
 // Illustrative 3-degree descent towards a point 200m from the runway's
 // southern threshold, using the same coordinates as the rendered airfield.
 // This is educational visual feedback, not real aircraft performance data.
 let finalCue=null;
 if(circuit.stage==="final"&&!state.onGround){
  const targetHeightM=Math.max(0,200-z)*Math.tan(3*Math.PI/180);
  const altitudeM=Number.isFinite(state.altitudeM)?state.altitudeM:0;
  const heightErrorM=altitudeM-targetHeightM;
  const lateral=Math.abs(x)<=20?"CTR":(x>0?"E":"W")+Math.round(Math.abs(x))+"m";
  const vertical=Math.abs(heightErrorM)<=12?"PATH":
   (heightErrorM>0?"HIGH":"LOW")+Math.round(Math.abs(heightErrorM))+"m";
  // Small, position-dependent intercept toward the illustrated landing
  // point. Use actual GROUND TRACK where available: crosswind can make
  // nose heading and the route across the ground disagree.
  const runwayAheadM=Math.max(350,300-z);
  const targetTrack=heading(Math.max(-22,Math.min(22,Math.atan2(-x,runwayAheadM)*RAD)));
  const actualTrack=Number.isFinite(state.trackDeg)?state.trackDeg:state.headingDeg;
  const trackError=signedDelta(actualTrack,targetTrack);
  const trackCue=Math.abs(trackError)<=3?"TRK OK":
   (trackError>0?"R":"L")+Math.round(Math.abs(trackError))+"°";
  finalCue=lateral+" · "+vertical+" · "+trackCue;
 }
 return Object.freeze({
  stage:circuit.stage,label:step.label,hint:step.hint,
  waypoint:step.target.slice(),
  waypointBearingDeg:bearing,waypointDistanceM:distance,
  courseDeg:step.course,courseText:course,turn,finalCue,
  short:step.label+" · "+course+" · "+distanceText,
  instructions:step.hint+" Heading reference "+course+".",
  active:!["landed","stopped"].includes(circuit.stage)
 });
}
const api=Object.freeze({create,update,status,PATH,signedDelta,eligible});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSACircuitGuide=api;
})(typeof window!=="undefined"?window:null);
