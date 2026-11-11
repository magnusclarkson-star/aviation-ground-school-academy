/* Lightweight route cues for the fictional home-runway circuit.
 * Position and heading come only from local simulator state. The instructor
 * does NOT steer, alter flight physics, imply ATC clearance or claim real
 * flight procedures. The route follows a verified, flyable right-hand loop in the local practice area.
 */
(function(root){"use strict";
const RAD=180/Math.PI;
const heading=n=>((Number(n)||0)%360+360)%360;
const signedDelta=(from,to)=>((heading(to)-heading(from)+540)%360)-180;
const eligible=s=>s?.mode==="airplane"&&["runway","approach"].includes(s?.scenario);
const LEGS=Object.freeze({
 departure:Object.freeze({label:"DEPARTURE",target:[0,1550],course:0,
  hint:"Fly beyond the takeoff point, then start a right turn toward the crosswind waypoint."}),
 crosswind:Object.freeze({label:"CROSSWIND",target:[700,1700],course:90,
  hint:"Follow the eastbound leg, then turn right toward the southbound downwind waypoint."}),
 downwind:Object.freeze({label:"DOWNWIND",target:[925,-1350],course:180,
  hint:"Fly south beside the runway and start base early enough to leave room for final."}),
 base:Object.freeze({label:"BASE",target:[120,-1680],course:270,
  hint:"Turn right toward the base waypoint, then turn north and line up before descending."}),
 final:Object.freeze({label:"FINAL",target:[0,300],course:0,
  hint:"Line up with the runway, check height and descent, and aim for a gentle touchdown."}),
 landed:Object.freeze({label:"LANDED",target:[0,900],course:0,
  hint:"You returned to the starting runway without resetting the flight."}),
 stopped:Object.freeze({label:"STOPPED",target:[0,900],course:0,
  hint:"The exercise stopped after terrain or runway contact. Restart to try again."})
});
const PATH=Object.freeze([[0,250],[0,1350],[700,1700],[925,-1350],[120,-1680],[0,250]]);
// At the illustrated corners, start a right turn *before* reaching the
// waypoint: otherwise a moving aircraft overshoots the turn by hundreds of
// metres and can struggle to get back to the home runway on a phone.
// These are visual practice cues, not real aircraft turn procedures.
const NEXT=Object.freeze({
 departure:Object.freeze({label:"CROSSWIND",course:90}),
 crosswind:Object.freeze({label:"DOWNWIND",course:180}),
 downwind:Object.freeze({label:"BASE",course:270}),
 base:Object.freeze({label:"FINAL",course:0})
});
const pad3=n=>String(Math.round(n)%360).padStart(3,"0")+"°";
function cornerLeadMetres(state){
 const knots=Math.max(0,Number(state?.groundSpeedKt)||0,Number(state?.speedKt)||0);
 const metresPerSecond=Math.max(25,knots)*.514444;
 // Typical illustration: distance to begin a turn grows with the square
 // of speed, clamped to avoid hiding the waypoint on a short leg.
 return Math.max(120,Math.min(380,metresPerSecond**2/(9.81*Math.tan(30*Math.PI/180))));
}
function create(state){
 return {stage:!eligible(state)?"inactive":state.scenario==="approach"?"final":"departure"};
}
function update(circuit,state){
 if(!circuit||!eligible(state)||circuit.stage==="inactive")return circuit;
 if(state.phase==="halted"){circuit.stage="stopped";return circuit}
 if(state.phase==="rollout"||state.phase==="complete"){circuit.stage="landed";return circuit}
 if(["landed","stopped"].includes(circuit.stage))return circuit;
 // A pilot can rejoin the runway from outside the illustrated rectangular
 // route. Once flight physics marks a real return final, show its live
 // centreline/glidepath cues rather than a stale downwind waypoint.
 if(state.phase==="approach"){
  circuit.stage="final";
  return circuit;
 }
 const x=Number(state.xM)||0,z=Number(state.zM)||0,h=heading(state.headingDeg);
 const airborne=!state.onGround;
 if(!airborne)return circuit;
 // Advance after a pilot has actually begun turning toward the next leg.
 // Speed-dependent lead prevents the old "reach the corner then turn" trap;
 // geographical guards avoid skipping legs during a wide or erratic circuit.
 // No steering, autopilot, or flight-physics modification occurs here.
 const lead=cornerLeadMetres(state);
 if(circuit.stage==="departure"&&state.altitudeM>=30&&
    (z>=1650||(z>=1650-lead&&signedDelta(0,h)>=45&&signedDelta(0,h)<=140)))
  circuit.stage="crosswind";
 if(circuit.stage==="crosswind"&&x>=500&&
    (h>=125&&h<=245)&&z>=-200)
  circuit.stage="downwind";
 if(circuit.stage==="downwind"&&z<=-1500&&
    h>=130&&h<=270)
  circuit.stage="base";
 if(circuit.stage==="base"&&z<=-650&&
    Math.abs(signedDelta(h,0))<=35&&Math.abs(x)<650)
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
 const next=NEXT[circuit.stage]||null;
 const turnLeadM=next?cornerLeadMetres(state):null;
 const turnNow=Boolean(next&&!state.onGround&&distance<=turnLeadM);
 const distanceText=distance>=1000?(distance/1000).toFixed(1)+" km":Math.round(distance)+" m";
 const bearingText=String(Math.round(bearing)%360).padStart(3,"0")+"°";
 const course=String(step.course).padStart(3,"0")+"°";
 // Illustrative 3-degree descent towards a point 200m from the runway's
 // southern threshold, using the same coordinates as the rendered airfield.
 // This is educational visual feedback, not real aircraft performance data.
 let finalCue=null,projectedTouchdownX=null,landingProjectionCue=null;
 // The circuit is more than compass turns: show one compact height target
 // while abeam the airfield and a lower reference on base. These are
 // invented simulator heights, NOT Cessna performance figures.
 const referenceHeightM=circuit.stage==="crosswind"?145:
  circuit.stage==="downwind"?145:circuit.stage==="base"?105:null;
 const currentHeightM=Number.isFinite(state.altitudeM)?state.altitudeM:0;
 const heightErrorM=referenceHeightM===null?0:currentHeightM-referenceHeightM;
 const heightCue=referenceHeightM===null?null:
  (heightErrorM>24?"HGT ↓ "+referenceHeightM+"m":
   heightErrorM< -24?"HGT ↑ "+referenceHeightM+"m":"HGT OK");
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
  // Extend the actual ground track to an illustrated 150 m runway aiming
  // zone. It is a visual "if the present track continues" prediction,
  // not a landing guarantee, automated steering or an aviation procedure.
  // Do not project when already across the aiming zone, travelling
  // substantially away from the strip, or outside the local practice area.
  const trackNorth=signedDelta(0,actualTrack);
  if(z< -80&&z> -3500&&Math.abs(trackNorth)<=55){
   projectedTouchdownX=x+(150-z)*Math.tan(trackNorth/RAD);
   if(Number.isFinite(projectedTouchdownX)){
    landingProjectionCue=Math.abs(projectedTouchdownX)<=24?"TD CTR":
     "TD "+(projectedTouchdownX>0?"E":"W")+
     Math.round(Math.abs(projectedTouchdownX))+"m";
   }else projectedTouchdownX=null;
  }
  const trackCue=Math.abs(trackError)<=3?"TRK OK":
   (trackError>0?"R":"L")+Math.round(Math.abs(trackError))+"°";
  finalCue=lateral+" · "+vertical+" · "+trackCue+
   (landingProjectionCue&&Math.abs(projectedTouchdownX)>24?
    " · "+landingProjectionCue:"");
 }
 return Object.freeze({
  stage:circuit.stage,label:step.label,hint:step.hint,
  waypoint:step.target.slice(),
  waypointBearingDeg:bearing,waypointDistanceM:distance,
  courseDeg:step.course,courseText:course,turn,finalCue,
  projectedTouchdownX,landingProjectionCue,
  referenceHeightM,heightCue,turnLeadM,turnNow,
  nextCourseDeg:next?.course??null,nextLabel:next?.label??null,
  short:step.label+" · "+course+" · "+distanceText,
  // The printed leg course alone can steer a learner away from the
  // next waypoint after a wide banked turn. Use the current bearing and
  // distance to the *fixed* leg waypoint instead; no controls are moved.
  instructions:finalCue?"FINAL · "+finalCue:turnNow?
   "NEXT RIGHT "+pad3(next.course)+" to "+next.label+
   " · "+distanceText+" to corner"+(heightCue?" · "+heightCue:""):
   (turn==="AHEAD"?"AHEAD":"TURN "+turn)+" "+bearingText+" · "+distanceText+
   " to "+step.label+(heightCue?" · "+heightCue:""),
  active:!["landed","stopped"].includes(circuit.stage)
 });
}
const api=Object.freeze({create,update,status,PATH,signedDelta,eligible,cornerLeadMetres});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSACircuitGuide=api;
})(typeof window!=="undefined"?window:null);
