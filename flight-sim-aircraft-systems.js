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
  displayedPower:0,flapDeg:0,parts:Object.create(null),
  lastGround:true};
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
  system.powerPct=smooth(system.powerPct,target*100,heli?1.1:1.6,dt);
  system.rotation=(system.rotation+((heli?18:12)+system.powerPct*(heli?.22:.47))*dt)%TAU;
  system.tailRotation=(system.tailRotation+(heli?25:40)*dt)%TAU;
  system.rotation%=TAU;
  system.time+=dt;
 }
 system.displayedPower=Math.round((heli?collective:throttle)*100);
 system.flapDeg=heli?0:clamp(input?.flaps,0,30);
 system.lastGround=state.onGround===true;
 const r=system.parts;
 if(heli){
  r.mainRotor=system.rotation;
  r.tailRotor=system.tailRotation;
  // Rudder pedals represent tail-rotor collective pitch, not RPM.
  r.rotorPitch=(collective-.48)*.13;
  r.tailPitch=rudder*.17;
 }else{
  r.propeller=system.rotation;
  r.leftAileron=bank===0?0:-bank*19*RAD;
  r.rightAileron=bank*19*RAD;
  r.leftFlap=-system.flapDeg*RAD;
  r.rightFlap=-system.flapDeg*RAD;
  r.elevatorLeft=pitch===0?0:-pitch*16*RAD;
  r.elevatorRight=pitch===0?0:-pitch*16*RAD;
  r.rudder=rudder*24*RAD;
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
