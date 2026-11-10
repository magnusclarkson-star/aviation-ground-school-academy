/* Conceptual aircraft-system indication and 3D part animation.
 * Pure local deterministic model; not a real engine, rotor, trim or avionics
 * system, and does not affect the existing fictional aircraft dynamics.
 */
(function(root){"use strict";
const RAD=Math.PI/180,TAU=2*Math.PI;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:0));
const smooth=(x,target,rate,dt)=>x+(target-x)*(1-Math.exp(-rate*dt));
function create(mode="airplane"){
 if(!["airplane","helicopter"].includes(mode))throw Error("Unknown conceptual aircraft system");
 const heli=mode==="helicopter";
 return {mode,time:0,powerPct:heli?80:10,rotation:0,tailRotation:0,
  displayedPower:0,flapDeg:0,gearRetraction:0,parts:Object.create(null),
  lastGround:true,lastVerticalMs:0,touchdownAge:0,touchdownStrength:0,
  wheelRotation:0,noseWheelRotation:0,wheelRate:0};
}
function step(system,state,input,seconds){
 if(!system||system.mode!==state?.mode)throw Error("System mode must match fictional aircraft");
 const dt=clamp(seconds,0,.1),heli=system.mode==="helicopter";
 const throttle=clamp(input?.throttle,0,1),collective=clamp(input?.collective,0,1);
 const bank=clamp(input?.bank,-1,1),pitch=clamp(input?.pitch,-1,1);
 const rudder=clamp(input?.rudder,-1,1);
 if(dt){
  const target=heli ? .84 : (.1+.9*throttle);
  // A fixed illustrated rotor RPM independent of helicopter collective;
  // collective instead changes blade pitch conceptually.
  // Experimental engine response is calculated by the optional point-mass
  // model itself. The illustrated propeller must display that same state.
  system.powerPct=!heli&&state.physicsId==="aero"?
   clamp((state.engineFraction??0)*100,0,100):
   smooth(system.powerPct,target*100,heli?1.1:1.6,dt);
  system.rotation=(system.rotation+((heli?18:12)+system.powerPct*(heli?.22:.47))*dt)%TAU;
  system.tailRotation=(system.tailRotation+(heli?25:40)*dt)%TAU;
  system.rotation%=TAU;
  system.time+=dt;
 }
 system.displayedPower=Math.round((heli?collective:throttle)*100);
 system.flapDeg=heli?0:clamp(input?.flaps,0,30);
 // A small, time-decaying visual suspension response on touchdown. It
 // never feeds back into position, velocity, control forces or flight grades.
 // Use the preceding airborne descent rate: ground-state vertical speed
 // may already have been reset to zero by the flight model.
 const grounded=state.onGround===true,wasGrounded=system.lastGround;
 if(dt){
  if(!wasGrounded&&grounded){
   system.touchdownAge=0;
   system.touchdownStrength=clamp(.055+Math.abs(system.lastVerticalMs)*.025,.055,.22);
  }else if(wasGrounded&&!grounded){
   system.touchdownStrength=0;system.touchdownAge=0;
  }
  if(!grounded)system.lastVerticalMs=clamp(state.verticalMs,-25,25);
  if(system.touchdownStrength>0){
   system.touchdownAge+=dt;
   if(system.touchdownAge>1.4)system.touchdownStrength=0;
  }
 }
 system.lastGround=grounded;
 const r=system.parts;
 // Brief upward gear/suspension rebound, with no underground penetration.
 r.touchdownBounce=system.touchdownStrength>0&&grounded?
  Math.max(0,Math.sin(system.touchdownAge*17))*
  Math.exp(-system.touchdownAge*4.5)*system.touchdownStrength:0;
 if(heli){
  r.mainRotor=system.rotation;
  r.tailRotor=system.tailRotation;
  // Fade the sweep in during the first simulated rotor revolutions.
  r.rotorBlurOpacity=clamp((system.time-.05)*.34,0,.20)*
   clamp(system.powerPct/80,0,1);
  r.tailBlurOpacity=clamp((system.time-.10)*.28,0,.16)*
   clamp(system.powerPct/80,0,1);
  // Rudder pedals represent tail-rotor collective pitch, not RPM.
  r.rotorPitch=(collective-.48)*.13;
  r.tailPitch=rudder*.17;
  // A lightweight moving swashplate visual makes cyclic commands apparent
  // in the helicopter's exterior view even while flight is paused.
  // These limited angles do not alter rotor force or flight physics.
  r.swashBank=bank*.11;
  r.swashPitch=-pitch*.11;
 }else{
  r.propeller=system.rotation;
  // The C172's actual stationary tyres are already part of the shared mesh.
  // Rotate small contrasting hub marks as the ground wheels roll, with a
  // faster-spinning nose wheel due to its smaller illustrated radius.
  // Airborne wheels coast briefly rather than stopping instantly. This is
  // visual only: the aircraft's speed, brakes and flight grading are unchanged.
  if(dt&&state.airframeId==="c172"){
   const groundV=state.onGround===true?
    clamp(state.speedKt,0,160)*.514444:0;
   const targetRate=groundV/.35;
   const response=state.onGround?(groundV>0?16:28):2;
   system.wheelRate=smooth(system.wheelRate||0,targetRate,response,dt);
   system.wheelRotation=(system.wheelRotation+system.wheelRate*dt)%TAU;
   system.noseWheelRotation=(system.noseWheelRotation+
    system.wheelRate*(.35/.26)*dt)%TAU;
  }
  r.mainWheels=system.wheelRotation||0;
  r.noseWheel=system.noseWheelRotation||0;
  // A small transparent sweep complements, but never replaces, the actual
  // two-blade Cessna propeller as the simulated engine speeds up.
  r.propBlurOpacity=clamp((system.powerPct-26)/70,0,1)*
   clamp((system.time-.08)*.23,0,.14);
  r.leftAileron=bank===0?0:-bank*19*RAD;
  r.rightAileron=bank*19*RAD;
  r.leftFlap=-system.flapDeg*RAD;
  r.rightFlap=-system.flapDeg*RAD;
  r.elevatorLeft=pitch===0?0:-pitch*16*RAD;
  r.elevatorRight=pitch===0?0:-pitch*16*RAD;
  r.rudder=rudder*24*RAD;
  r.rudderLeft=r.rudder;
  r.rudderRight=r.rudder;
  // Jet gear retracts during the departure climb and extends again before
  // approach. The Cessna's fixed undercarriage never rotates.
  const jet=["fa18","f22","f35","typhoon","su37"].includes(state.airframeId);
  const approaching=Number(state.verticalMs)<-.20&&Number(state.altitudeM)<130;
  const retract=jet&&!state.onGround&&Number(state.altitudeM)>15&&!approaching;
  if(dt)system.gearRetraction=smooth(system.gearRetraction||0,
   retract?1:0,1.35,dt);
  const gearAngle=(system.gearRetraction||0)*1.53;
  r.noseGear=jet?gearAngle:0;
  r.mainGearLeft=jet?gearAngle:0;
  r.mainGearRight=jet?gearAngle:0;
 }
 return system;
}
function snapshot(system){
 if(!system||!["airplane","helicopter"].includes(system.mode))throw Error("Valid conceptual system required");
 const heli=system.mode==="helicopter";
 const pct=Math.round(clamp(system.powerPct,0,100));
 return {
  mode:system.mode,
  engineLabel:heli?"ROTOR SPEED · SIM":"ENGINE MOTION · SIM",
  engineValue:pct+"%",
  powerLabel:heli?"COLLECTIVE · SIM":"THROTTLE · SIM",
  powerValue:system.displayedPower+"%",
  flapLabel:heli?"BLADE PITCH · SIM":"FLAPS · SIM",
  flapValue:heli?(Math.round((system.parts.rotorPitch||0)/.13*100)+"%"):
   Math.round(system.flapDeg)+"°",
  movingPartLabel:heli?"MAIN / TAIL ROTORS":"PROPELLER / CONTROL SURFACES",
  motionValue:system.powerPct>2?"ANIMATED":"IDLE",
  onGround:system.lastGround,
  // All of these values are purely derived from simulator controls.
  // Do not claim type-specific RPM, fuel use or manufacturer limits.
  disclaimer:"SIMULATED · NOT AIRCRAFT DATA"
 };
}
const api={create,step,snapshot};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightSystems=api;
})(typeof window!=="undefined"?window:null);
