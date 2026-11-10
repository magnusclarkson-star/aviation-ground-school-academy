/* Optional experimental point-mass aerodynamic *teaching* model.
 * NOT a validated aircraft physics engine, aerodynamic coefficient database,
 * simulator qualification or flight instruction. All constants are invented.
 * The Classic simulator remains the default and is not modified.
 */
(function(root){"use strict";
const E=root?.AGSAFlightEnvironment||(typeof module!=="undefined"?require("./flight-sim-environment.js"):null);
if(!E)throw Error("Synthetic environment definitions are required");
const W=root?.AGSAFlightLoading||(typeof module!=="undefined"?require("./flight-sim-loading.js"):null);
if(!W)throw Error("Fictional loading module required");
const KNOT=.514444,DEG=Math.PI/180,G=9.80665,RHO=1.225;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number.isFinite(value)?value:min));
const smooth=(a,b,r,dt)=>a+(b-a)*(1-Math.exp(-r*dt));
const CONFIG=Object.freeze({
 trainer:Object.freeze({massKg:840,wingM2:17,thrustN:2300,cd0:.045,induced:.065,cl0:.35,clPerDeg:.085,stallAoADeg:15,wingIncidenceDeg:1}),
 sport:Object.freeze({massKg:700,wingM2:15,thrustN:2250,cd0:.046,induced:.069,cl0:.32,clPerDeg:.092,stallAoADeg:16,wingIncidenceDeg:1}),
 touring:Object.freeze({massKg:1170,wingM2:20,thrustN:3200,cd0:.043,induced:.062,cl0:.36,clPerDeg:.087,stallAoADeg:15,wingIncidenceDeg:1})
});
function config(id){if(!Object.hasOwn(CONFIG,id))throw Error("Unknown experimental dynamics profile");return CONFIG[id]}
function coefficients(aoaDeg,flapDeg=0,profileId="trainer"){
 const c=config(profileId);
 const aoa=clamp(aoaDeg,-28,36),flaps=clamp(flapDeg,0,30);
 const flapLift=flaps/30*.20;
 const preStall=c.cl0+c.clPerDeg*aoa+flapLift;
 const clMax=1.52+flaps/30*.15;
 const exceeded=aoa>c.stallAoADeg;
 const cl=exceeded?
  clamp(clMax*(1-.075*(aoa-c.stallAoADeg)),.12,clMax):
  clamp(preStall,-.72,clMax);
 // Separation drag rises sharply even as wing lift collapses beyond the
 // imaginary stall threshold. This is an invented qualitative effect.
 const cd=c.cd0+c.induced*cl*cl+flaps/30*.052+(exceeded?.25:0);
 return {cl,cd,stalled:exceeded,aoaDeg:aoa,clMax,flapDeg:flaps};
}
function sample(state,input){
 if(!state||state.mode!=="airplane"||state.physicsId!=="aero")
  throw Error("Experimental aerodynamic mode requires a fictional airplane");
 const c=config(state.profileId||"trainer");
 const massKg=state.loading?.totalKg??c.massKg;
 const speedKt=clamp(state.speedKt,0,180);
 const v=Math.max(2,speedKt*KNOT);
 const vertical=clamp(state.verticalMs,-v+.01,v-.01);
 const gamma=Math.asin(clamp(vertical/v,-.99,.99));
 const aoa=clamp(state.pitchDeg-gamma/DEG+c.wingIncidenceDeg,-28,36);
 const aero=coefficients(aoa,input.flaps,state.profileId||"trainer");
 const q=.5*RHO*v*v;
 const lift=q*c.wingM2*aero.cl;
 const drag=q*c.wingM2*aero.cd;
 const bank=clamp(state.rollDeg,-80,80)*DEG;
 const loadFactor=clamp(lift/(massKg*G),-1,5);
 const thrust=clamp(state.engineFraction??.1,0,1)*c.thrustN*
  clamp(38/(v+12),.55,1.25);
 const weight=massKg*G;
 return {...aero,speedKt,v,gamma,bank,liftN:lift,dragN:drag,thrustN:thrust,
  loadFactor,weightN:weight,massKg,
  effectiveStall:aero.stalled||(state.speedKt<E.selectProfile(state.profileId||"trainer").stallKt-3)};
}
function prepare(state,loadout=W.DEFAULT){
 if(!state||state.mode!=="airplane"||state.physicsId!=="aero")
  throw Error("Cannot prepare non-aerodynamic mode");
 config(state.profileId||"trainer");
 state.loading=W.evaluate(state.profileId||"trainer",loadout);
 state.engineFraction=state.scenario==="approach"?.49:.1;
 state.aoaDeg=0;
 state.liftN=0;
 state.dragN=0;
 state.thrustN=0;
 state.loadFactor=0;
 state.energyJPerKg=0;
 state.aeroStalled=false;
 state.flightPathDeg=state.scenario==="approach"?-2.75:0;
 return state;
}
function step(state,input,dt,events=[],wind){
 if(!Array.isArray(events)||state?.physicsId!=="aero"||state.mode!=="airplane")
  throw Error("Experimental aerodynamic step requires plane and events");
 if(!(dt>0))return {state,events};
 const p=E.selectProfile(state.profileId||"trainer");
 const c=config(state.profileId||"trainer");
 const massKg=state.loading?.totalKg??c.massKg;
 const t=clamp(input.throttle,0,1),flap=clamp(input.flaps,0,30);
 state.engineFraction=smooth(clamp(state.engineFraction??.1,0,1),t,1.8,dt);
 const f=sample(state,input);
 state.aoaDeg=f.aoaDeg;state.liftN=f.liftN;state.dragN=f.dragN;
 state.thrustN=f.thrustN;state.loadFactor=f.loadFactor;
 state.aeroStalled=f.effectiveStall;
 const rudder=clamp(input.rudder,-1,1);
 if(state.onGround){
  // Simplified straight ground roll and fictional drag, not real tire/wind
  // handling or differential braking.
  const rolling=.08*f.weightN;
  const brake=input.brake===true ? .94*f.weightN : 0;
  const accel=(f.thrustN-f.dragN-rolling-brake)/massKg;
  const v=Math.max(0,state.speedKt*KNOT+clamp(accel,-12,6)*dt);
  state.speedKt=clamp(v/KNOT,0,115);
  state.verticalMs=0;state.altitudeM=0;state.flightPathDeg=0;
  // Departure is a bounded ground-steering exercise. Once landed, keep
  // a genuine compass heading across 360° instead of snapping to +40°.
  if(state.phase==="roll"){
   const signed=((state.headingDeg+540)%360)-180;
   state.headingDeg=clamp(signed+rudder*.65*dt,-40,40);
  }else{
   state.headingDeg=(state.headingDeg+rudder*.65*dt+360)%360;
  }
  const heading=state.headingDeg*DEG;
  state.zM+=v*Math.cos(heading)*dt;
  state.xM+=v*Math.sin(heading)*dt;
  state.groundSpeedKt=state.speedKt;state.trackDeg=state.headingDeg;
  if(state.phase==="roll"&&state.speedKt>12)events.push("runwayRumble");
  // A simple dynamic-pressure threshold encourages observing pitch and
  // speed together. It is NOT a real rotation speed or takeoff performance.
  if(state.phase==="roll"&&state.speedKt>=p.rotationKt&&
   state.pitchDeg>4&&t>.6&&f.liftN>.74*f.weightN&&
   Math.abs(state.xM)<25&&state.zM<1750){
   state.onGround=false;state.altitudeM=.2;state.verticalMs=1.35;
   state.phase="climb";state.message="Experimental energy flight: the fictional wings have sufficient model lift for liftoff. Observe speed, angle of attack and height together.";
   events.push("liftoff");
  }
  if(state.phase==="roll"&&(state.zM>1820||Math.abs(state.xM)>36)){
   state.phase="halted";
   state.message="Imaginary runway excursion. This is a simplified comparison model, not real directional control.";
   events.push("hardLanding");
  }
  const excursion=E.runwayRolloutExcursion(state);
  if(excursion){
   state.phase="halted";
   state.message=excursion==="side"?
    "Runway excursion: the wheels left the side of the strip during rollout.":
    "Runway overrun: the wheels passed the end of the strip during rollout.";
   events.push("runwayExcursion","hardLanding");
  }else if(state.phase==="rollout"&&state.speedKt<5){
   state.phase="complete";
   state.message="Experimental fictional rollout complete. No pilot proficiency or training credit is conferred.";
   events.push("completed");
  }
 }else{
  const v=Math.max(4,f.v),gamma=f.gamma;
  const accel=(f.thrustN-f.dragN)/massKg-G*Math.sin(gamma);
  const nextV=clamp(v+clamp(accel,-7,5)*dt,4,86);
  const gammaRate=(f.liftN*Math.cos(f.bank)-f.weightN*Math.cos(gamma))/
   (massKg*v);
  // Avoid numeric instability when very slow or far from the stable flight
  // envelope. These limits do not represent a real aircraft.
  const nextGamma=clamp(gamma+clamp(gammaRate,-.55,.55)*dt,-.95,.55);
  const vertical=nextV*Math.sin(nextGamma);
  state.verticalMs=smooth(state.verticalMs,vertical,5,dt);
  state.flightPathDeg=nextGamma/DEG;
  state.speedKt=nextV/KNOT;
  // For a shallow point-mass turn, omega ~ g*tan(bank)/speed. Rudder
  // provides only a small teaching aid, not realistic slip/skid physics.
  const omega=clamp(G*Math.tan(f.bank)/v/DEG+rudder*.45,-5,5);
  state.headingDeg=(state.headingDeg+omega*dt+360)%360;
  const heading=state.headingDeg*DEG;
  const w=wind||E.windAt(state.windId||"calm",state.time);
  const groundX=nextV*Math.cos(nextGamma)*Math.sin(heading)+w.x;
  const groundZ=nextV*Math.cos(nextGamma)*Math.cos(heading)+w.z;
  state.xM+=groundX*dt;state.zM+=groundZ*dt;
  state.groundSpeedKt=Math.hypot(groundX,groundZ)/KNOT;
  state.trackDeg=E.compassTrack(groundX,groundZ);
  state.altitudeM+=state.verticalMs*dt;
  if(f.effectiveStall)events.push("stall");
  if(state.verticalMs>.7)events.push("climb");
  if(state.verticalMs<-.7)events.push("descent");
  if(state.phase==="climb"&&state.altitudeM>75){
   state.phase="flight";
   state.message="Experimental energy flight: compare pitch, bank, lift, drag, speed and the path over the ground.";
  }
  if(state.phase==="approach"&&state.zM>=-40&&state.altitudeM>28){
   state.message="Above the imaginary runway threshold. Reset for another illustrative energy approach.";
  }
  if(state.altitudeM<=0){
   const impactRate=state.verticalMs;
   state.altitudeM=0;state.onGround=true;state.verticalMs=0;
   state.flightPathDeg=0;
   const onRunway=state.zM>=-35&&state.zM<=1800&&Math.abs(state.xM)<24;
   const alignment=E.runwayAlignment(state.headingDeg,state.trackDeg);
   const gentle=impactRate>=-3.3&&Math.abs(state.rollDeg)<13&&
    state.speedKt<93&&onRunway&&alignment.aligned;
   state.phase=gentle?"rollout":"halted";
   state.message=gentle?"Experimental-model touchdown. Reduce throttle and brake to finish the fictional rollout.":
    onRunway&&!alignment.aligned?
     "Runway crossing angle too large. Approach along the strip for a controlled landing.":
     "Experimental-model hard or off-runway contact. Reset and compare the energy trend.";
   events.push(gentle?"touchdown":"hardLanding");
  }
 }
 // Specific mechanical energy per unit mass relative to the fictional ground.
 state.energyJPerKg=.5*Math.pow(state.speedKt*KNOT,2)+G*state.altitudeM;
 return {state,events};
}
function indications(state){
 if(state?.physicsId!=="aero"||state.mode!=="airplane")return null;
 return {
  aoaDeg:Number((state.aoaDeg||0).toFixed(1)),
  liftKN:Number(((state.liftN||0)/1000).toFixed(1)),
  dragKN:Number(((state.dragN||0)/1000).toFixed(1)),
  load:Number((state.loadFactor||0).toFixed(2)),
  energy:Math.round(state.energyJPerKg||0),
  pathDeg:Number((state.flightPathDeg||0).toFixed(1)),
  stalled:state.aeroStalled===true,
  enginePct:Math.round(clamp(state.engineFraction,0,1)*100),
  massKg:state.loading?.totalKg??config(state.profileId||"trainer").massKg,
  cgPercentMAC:Number((state.loading?.cgPercentMAC??45).toFixed(1)),
  balanceLabel:state.loading?.balanceLabel??"Reference configuration",
  withinFictionalBand:state.loading?.withinFictionalBand??true
 };
}
const api={CONFIG,config,coefficients,prepare,sample,step,indications,KNOT};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightAerodynamics=api;
})(typeof window!=="undefined"?window:null);
