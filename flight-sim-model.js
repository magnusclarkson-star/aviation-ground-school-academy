/* AGSA immersive practice model: deterministic, deliberately simplified flight.
 * Not validated for aircraft-specific operation, pilot training credit or
 * realistic helicopter performance. Values are invented teaching settings.
 */
(function(root){"use strict";
const RAD=Math.PI/180;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,Number.isFinite(x)?x:0));
const smooth=(x,target,rate,dt)=>x+(target-x)*(1-Math.exp(-rate*dt));
const KNOT=0.514444;
function makeInput(mode="airplane"){
 return {bank:0,pitch:0,rudder:0,throttle:0,collective:.48,
  flaps:mode==="airplane"?10:0,brake:false,turbulence:.16};
}
function makeState(mode="airplane",scenario="runway"){
 if(!["airplane","helicopter"].includes(mode))throw Error("Unsupported fictional aircraft");
 if(mode==="helicopter"){
  return {mode,scenario:"helipad",phase:"pad",xM:0,zM:0,altitudeM:0,speedKt:0,
   groundSpeedKt:0,verticalMs:0,pitchDeg:0,rollDeg:0,headingDeg:0,
   lateralMs:0,forwardMs:0,time:0,turbulence:0,onGround:true,
   message:"A fictional helipad exercise. Increase collective for a gentle vertical lift."};
 }
 const approach=scenario==="approach";
 return {mode,scenario:approach?"approach":"runway",
  phase:approach?"approach":"roll",xM:0,zM:approach?-1450:0,
  altitudeM:approach?84:0,speedKt:approach?73:0,groundSpeedKt:approach?73:0,
  verticalMs:approach?-1.8:0,pitchDeg:approach?-2.8:0,rollDeg:0,headingDeg:0,
  lateralMs:0,forwardMs:0,time:0,turbulence:0,onGround:!approach,
  message:approach?"Fictional short-final setup. Descend toward the pictured runway.":"Set simulated power, build speed and gently rotate to explore liftoff."};
}
function step(state,input,seconds){
 const dt=clamp(seconds,0,.1);
 if(!dt||["landed","halted","complete"].includes(state.phase))return {state,events:[]};
 const events=[];
 const t=state.time+=dt;
 const turb=clamp(input.turbulence,0,1);
 state.turbulence=turb*(Math.sin(t*2.91)*.55+Math.sin(t*7.31)*.3);
 const bank=clamp(input.bank,-1,1),pitch=clamp(input.pitch,-1,1),rudder=clamp(input.rudder,-1,1);
 const rollTarget=bank*(state.mode==="helicopter"?13:32)+state.turbulence*2.5;
 const pitchTarget=-pitch*(state.mode==="helicopter"?9:13)+state.turbulence*1.2;
 state.rollDeg=smooth(state.rollDeg,rollTarget,2,dt);
 state.pitchDeg=smooth(state.pitchDeg,pitchTarget,1.7,dt);
 if(turb>.25&&Math.abs(state.turbulence)>.12)events.push("turbulence");
 if(Math.abs(state.rollDeg)>14)events.push("turn");
 if(state.mode==="helicopter"){
  const collective=clamp(input.collective,0,1);
  const targetVS=clamp((collective-.48)*8.2-.12+state.turbulence*.5,-4.5,4);
  state.verticalMs=smooth(state.verticalMs,targetVS,1.5,dt);
  if(state.onGround&&state.verticalMs>0.35){
   state.onGround=false;state.phase="lift";
   state.message="Simulated rotorcraft lift. Use cyclic for horizontal motion and collective for height.";
   events.push("liftoff");
  }
  if(!state.onGround){
   state.altitudeM+=state.verticalMs*dt;
   const forward=smooth(state.forwardMs,-pitch*13,0.95,dt);
   const lateral=smooth(state.lateralMs,bank*11,0.95,dt);
   state.forwardMs=forward;state.lateralMs=lateral;
   const heading=state.headingDeg*RAD;
   state.zM+=(forward*Math.cos(heading)-lateral*Math.sin(heading))*dt;
   state.xM+=(forward*Math.sin(heading)+lateral*Math.cos(heading))*dt;
   state.headingDeg=(state.headingDeg+rudder*15*dt+360)%360;
   state.groundSpeedKt=Math.hypot(forward,lateral)/KNOT;
   state.speedKt=state.groundSpeedKt;
   if(state.altitudeM>=2&&state.phase==="lift")state.phase="hover";
   if(state.altitudeM>15||Math.hypot(state.xM,state.zM)>70)state.phase="flight";
   if(state.verticalMs>.65)events.push("climb");
   if(state.verticalMs<-.65)events.push("descent");
   if(state.altitudeM<=0){
    state.altitudeM=0;state.onGround=true;state.verticalMs=0;
    const insidePad=Math.hypot(state.xM,state.zM)<27;
    const gentle=targetVS>=-1.75&&state.groundSpeedKt<9&&insidePad;
    state.phase=gentle?"landed":"halted";
    state.message=gentle?"Gentle fictional helipad landing. Review your collective coordination.":
     "Hard or off-pad rotorcraft contact. Restart and practise a stabilised descent.";
    events.push(gentle?"touchdown":"hardLanding");
   }
  }else{
   state.altitudeM=0;state.groundSpeedKt=0;state.speedKt=0;
  }
  return {state,events};
 }
 const throttle=clamp(input.throttle,0,1);
 const flap=clamp(input.flaps,0,30);
 if(state.onGround){
  const brake=input.brake===true;
  const acceleration=7.5*throttle-1.2-.00065*state.speedKt**2-flap*.014-(brake?9:0);
  state.speedKt=clamp(state.speedKt+acceleration*dt,0,115);
  state.verticalMs=0;state.altitudeM=0;
  state.headingDeg=clamp(state.headingDeg+rudder*.65*dt,-40,40);
  state.zM+=state.speedKt*KNOT*Math.cos(state.headingDeg*RAD)*dt;
  state.xM+=state.speedKt*KNOT*Math.sin(state.headingDeg*RAD)*dt;
  state.groundSpeedKt=state.speedKt;
  if(state.phase==="roll"&&state.speedKt>12)events.push("runwayRumble");
  if(state.phase==="roll"&&state.speedKt>=47&&state.pitchDeg>3.5&&throttle>.6&&
   Math.abs(state.xM)<25&&state.zM<1750){
   state.onGround=false;state.altitudeM=.2;state.verticalMs=1.7;state.phase="climb";
   state.message="Simulated liftoff. Hold a steady attitude and observe height and airspeed.";
   events.push("liftoff");
  }
  if(state.phase==="roll"&&(state.zM>1820||Math.abs(state.xM)>36)){
   state.phase="halted";
   state.message="Runway excursion in this simplified exercise. Reset before retrying.";
   events.push("hardLanding");
  }
  if(state.phase==="rollout"&&state.speedKt<5){
   state.phase="complete";
   state.message="Fictional rollout complete. This is not a proficiency endorsement.";
   events.push("completed");
  }
 }else{
  const targetSpeed=clamp(55+70*throttle-state.pitchDeg*.9-flap*.34,26,145);
  state.speedKt=smooth(state.speedKt,targetSpeed,.19,dt);
  const stall=state.speedKt<39;
  const targetVertical=clamp(
   state.speedKt*KNOT*Math.sin(state.pitchDeg*RAD)*.92+
   (throttle-.5)*2-.48-(stall?3.2:0)+state.turbulence*.42,-8,6);
  state.verticalMs=smooth(state.verticalMs,targetVertical,1.6,dt);
  const headingRate=clamp(state.rollDeg*.047+rudder*1.1,-4,4);
  state.headingDeg=(state.headingDeg+headingRate*dt+360)%360;
  const heading=state.headingDeg*RAD;
  state.zM+=state.speedKt*KNOT*Math.cos(heading)*dt;
  state.xM+=state.speedKt*KNOT*Math.sin(heading)*dt;
  state.groundSpeedKt=state.speedKt;
  state.altitudeM+=state.verticalMs*dt;
  if(stall)events.push("stall");
  if(state.verticalMs>.7)events.push("climb");
  if(state.verticalMs<-.7)events.push("descent");
  if(state.phase==="climb"&&state.altitudeM>75){
   state.phase="flight";
   state.message="Free flight: practise bank and level pitch. Use 'Set up final approach' for a new fictional runway arrival.";
  }
  if(state.phase==="approach"&&state.zM>=-40&&state.altitudeM>28){
   state.message="Above the imaginary runway threshold. Practise a new approach setup if needed.";
  }
  if(state.altitudeM<=0){
   state.altitudeM=0;state.onGround=true;
   const onRunway=state.zM>=-35&&state.zM<=1800&&Math.abs(state.xM)<24;
   const gentle=state.verticalMs>=-3.3&&Math.abs(state.rollDeg)<13&&state.speedKt<93&&onRunway;
   state.verticalMs=0;
   state.phase=gentle?"rollout":"halted";
   state.message=gentle?"Simulated touchdown. Reduce power and hold the brake to finish the rollout.":
    "Hard or off-runway contact. Use the approach reset and try a gentler descent.";
   events.push(gentle?"touchdown":"hardLanding");
  }
 }
 return {state,events};
}
const api={makeInput,makeState,step,clamp,KNOT};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAImmersiveFlight=api;
})(typeof window!=="undefined"?window:null);
