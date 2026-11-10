/* AGSA immersive practice model: deterministic, deliberately simplified flight.
 * Not validated for aircraft-specific operation, pilot training credit or
 * realistic helicopter performance. Values are invented teaching settings.
 */
(function(root){"use strict";
const E=root?.AGSAFlightEnvironment||(typeof module!=="undefined"?require("./flight-sim-environment.js"):null);
if(!E)throw Error("Fictional aircraft/environment profiles unavailable");
const D=root?.AGSAFlightAerodynamics||(typeof module!=="undefined"?require("./flight-sim-aerodynamics.js"):null);
if(!D)throw Error("Experimental aerodynamic engine unavailable");
const RAD=Math.PI/180;
// Continuous positional hold near the exercise helipad, in simulated seconds.
const HOVER_HOLD_SECONDS=8;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,Number.isFinite(x)?x:0));
const smooth=(x,target,rate,dt)=>x+(target-x)*(1-Math.exp(-rate*dt));
const KNOT=0.514444;
// Five distinct *illustrative*, bounded jet responses. These are teaching
// settings, not manufacturer speeds, performance or flight-envelope data.
// The C172 and R44 preserve their established exercises.
const JET_SETTINGS=Object.freeze({
 fa18:Object.freeze({bankDeg:47,pitchDeg:17,rollResponse:2.8,pitchResponse:2,
  groundAccel:16,rotationKt:88,approachKt:118,stallKt:68,airborneBaseKt:84,
  airbornePowerKt:128,airborneDragKt:.44,climbLift:1.02,climbPower:3.1,
  climbCap:11,turnBank:.052,turnRudder:.65,maxGroundKt:185,maxAirborneKt:230,landingMaxKt:152}),
 f22:Object.freeze({bankDeg:55,pitchDeg:19,rollResponse:3.3,pitchResponse:2.4,
  groundAccel:19,rotationKt:94,approachKt:126,stallKt:74,airborneBaseKt:94,
  airbornePowerKt:142,airborneDragKt:.48,climbLift:1.08,climbPower:3.8,
  climbCap:13,turnBank:.06,turnRudder:.60,maxGroundKt:200,maxAirborneKt:255,landingMaxKt:165}),
 f35:Object.freeze({bankDeg:49,pitchDeg:16,rollResponse:2.6,pitchResponse:1.9,
  groundAccel:15,rotationKt:91,approachKt:122,stallKt:72,airborneBaseKt:91,
  airbornePowerKt:129,airborneDragKt:.48,climbLift:1,climbPower:3,
  climbCap:11.5,turnBank:.051,turnRudder:.61,maxGroundKt:195,maxAirborneKt:235,landingMaxKt:160}),
 typhoon:Object.freeze({bankDeg:53,pitchDeg:19,rollResponse:3.4,pitchResponse:2.55,
  groundAccel:18,rotationKt:87,approachKt:117,stallKt:67,airborneBaseKt:88,
  airbornePowerKt:143,airborneDragKt:.44,climbLift:1.05,climbPower:3.6,
  climbCap:12.5,turnBank:.059,turnRudder:.63,maxGroundKt:205,maxAirborneKt:250,landingMaxKt:157}),
 su37:Object.freeze({bankDeg:52,pitchDeg:18,rollResponse:2.9,pitchResponse:2.15,
  groundAccel:17,rotationKt:96,approachKt:132,stallKt:76,airborneBaseKt:102,
  airbornePowerKt:143,airborneDragKt:.51,climbLift:1.03,climbPower:3.4,
  climbCap:12,turnBank:.055,turnRudder:.62,maxGroundKt:205,maxAirborneKt:260,landingMaxKt:173})
});
const AIRFRAME_IDS=Object.freeze(["c172","r44",...Object.keys(JET_SETTINGS)]);
function flightProfile(state){
 return state?.physicsId==="classic"&&Object.hasOwn(JET_SETTINGS,state?.airframeId)?
  JET_SETTINGS[state.airframeId]:E.selectProfile(state?.profileId||"trainer");
}
// A short live hovering cue driven by the actual motion and yaw readings,
// never by the last joystick command. Shared by cockpit and flight status.
function rotorHoverCue(state){
 if(!state||state.mode!=="helicopter")return null;
 if(state.onGround)return state.phase==="landed"?
  state.landingGrade==="precision"?"PRECISION LANDING":"LANDED":
  state.phase==="halted"?"HARD CONTACT":"ON PAD";
 const rise=clamp(state.verticalMs,-10,10),drift=clamp(state.groundSpeedKt,0,200);
 if(rise>.7)return "CLIMBING";
 if(rise<-.7)return "DESCENDING";
 if(drift>4)return "DRIFTING";
 if(Math.abs(state.yawRateDegS||0)>4)return "TURNING";
 if(state.hoverHoldSec>=HOVER_HOLD_SECONDS)return "HOVER HELD 8 S";
 if(state.hoverHoldSec>=.5)return "HOVER "+Math.floor(state.hoverHoldSec)+"/8 S";
 if(drift<2&&Math.abs(rise)<.4)return "STEADY HOVER";
 return "ADJUST HOVER";
}
function makeInput(mode="airplane"){
 return {bank:0,pitch:0,rudder:0,throttle:0,collective:.48,
  flaps:mode==="airplane"?10:0,brake:false,turbulence:.16};
}
function makeState(mode="airplane",scenario="runway",options={}){
 if(!["airplane","helicopter"].includes(mode))throw Error("Unsupported fictional aircraft");
 if(!options||typeof options!=="object"||Array.isArray(options))throw Error("Invalid simulator settings");
 const windId=options.windId??"calm";
 E.selectWind(windId);
 const profileId=mode==="helicopter"?"rotor":options.profileId??"trainer";
 const physicsId=mode==="helicopter"?"classic":(options.physicsId??"classic");
 if(!["classic","aero"].includes(physicsId))throw Error("Unknown fictional physics mode");
 const airframeId=mode==="helicopter"?"r44":options.airframeId??"c172";
 if(!AIRFRAME_IDS.includes(airframeId)||(mode==="airplane"&&airframeId==="r44"))
  throw Error("Unknown or incompatible selected airframe");
 const profile=mode==="airplane"?flightProfile({airframeId,profileId,physicsId}):null;
 if(mode==="helicopter"){
  return {mode,airframeId,profileId,windId,physicsId:"classic",scenario:"helipad",phase:"pad",xM:0,zM:0,altitudeM:0,speedKt:0,
   groundSpeedKt:0,trackDeg:0,windXMps:0,windZMps:0,verticalMs:0,pitchDeg:0,rollDeg:0,headingDeg:0,
   lateralMs:0,forwardMs:0,yawRateDegS:0,hoverHoldSec:0,
   hoverBestSec:0,hoverAchieved:false,landingGrade:null,time:0,turbulence:0,onGround:true,
   message:"A fictional helipad exercise. Increase collective for a gentle vertical lift."};
 }
 const approach=scenario==="approach";
 const plane={mode,airframeId,profileId,windId,physicsId,scenario:approach?"approach":"runway",
  phase:approach?"approach":"roll",xM:0,zM:approach?-1450:0,
  altitudeM:approach?84:0,speedKt:approach?profile.approachKt:0,groundSpeedKt:approach?profile.approachKt:0,
  trackDeg:0,windXMps:0,windZMps:0,
  touchdownData:null,rolloutBrakePressure:0,rolloutDistanceM:0,
  verticalMs:approach?-1.8:0,pitchDeg:approach?-2.8:0,rollDeg:0,headingDeg:0,
  lateralMs:0,forwardMs:0,time:0,turbulence:0,onGround:!approach,
  message:approach?"Fictional short-final setup. Descend toward the pictured runway.":"Set simulated power, build speed and gently rotate to explore liftoff."};
 return physicsId==="aero"?D.prepare(plane,options.loadout):plane;
}
// Promote a real airborne home-runway return to the final-approach display
// phase. This changes lesson status and optional phase-linked ATC only:
// it never changes airspeed, steering, pitch, altitude or the flight path.
function markReturnFinal(state){
 if(state?.mode!=="airplane"||state.scenario!=="runway"||
    state.phase!=="flight"||state.onGround)return false;
 const signed=n=>((n+540)%360)-180;
 const h=signed(state.headingDeg||0);
 const t=signed(state.trackDeg??state.headingDeg??0);
 if(state.zM>=-650||state.zM< -3700||Math.abs(state.xM)>=600||
    Math.abs(h)>35||Math.abs(t)>48)return false;
 state.phase="approach";
 state.message="Returned to the home-runway final. Compare the moving map, centreline and descent trend while continuing to fly manually.";
 return true;
}
function step(state,input,seconds){
 const dt=clamp(seconds,0,.1);
 if(!dt||["landed","halted","complete"].includes(state.phase))return {state,events:[]};
 const events=[];
 const t=state.time+=dt;
 const wind=E.windAt(state.windId||"calm",t);
 state.windXMps=wind.x;state.windZMps=wind.z;
 const p=state.mode==="airplane"?flightProfile(state):null;
 const turb=clamp(input.turbulence,0,1);
 state.turbulence=turb*(Math.sin(t*2.91)*.55+Math.sin(t*7.31)*.3);
 const bank=clamp(input.bank,-1,1),pitch=clamp(input.pitch,-1,1),rudder=clamp(input.rudder,-1,1);
 // Make a fully deflected C172 phone yoke useful for a compact
 // out-and-back circuit without changing gentle hand movements. This
 // fictional steep-turn assist adds at most 6° of bank near full deflection;
 // it does not turn the aircraft on its own or affect other airframes.
 const turnAssist=state.mode==="airplane"&&state.airframeId==="c172"&&
  state.profileId==="trainer"&&state.physicsId==="classic"?
   6*Math.pow(Math.abs(bank),3):0;
 const rollTarget=bank*(state.mode==="helicopter"?13:p.bankDeg+turnAssist)+
  state.turbulence*2.5;
 // An aft/forward CG modifies *only* the experimental fictional pitch
 // response. Classic and conceptual rotorcraft handling are unchanged.
 const loadingPitch=state.physicsId==="aero"?
  (state.loading?.pitchAuthority??1):1;
 const pitchTarget=-pitch*(state.mode==="helicopter"?9:p.pitchDeg*loadingPitch)+state.turbulence*1.2;
 state.rollDeg=smooth(state.rollDeg,rollTarget,state.mode==="helicopter"?2:p.rollResponse,dt);
 state.pitchDeg=smooth(state.pitchDeg,pitchTarget,state.mode==="helicopter"?1.7:p.pitchResponse,dt);
 if(turb>.25&&Math.abs(state.turbulence)>.12)events.push("turbulence");
 if(Math.abs(state.rollDeg)>14)events.push("turn");
 if(state.mode==="helicopter"){
  const collective=clamp(input.collective,0,1);
  // Anti-torque pedal commands now build and decay a yaw rate rather than
  // rotating the fuselage instantly. Banking adds a gentle coordinated
  // turn only in forward flight; hovering remains pedal-controlled.
  // Small numerical/turbulence drift near hover must not create a
  // forward-flight coordinated turn. Pedals alone control hover yaw.
  const forwardSpeed=Math.max(0,(state.forwardMs||0)-1.5);
  const turnAssist=clamp(state.rollDeg*.055*forwardSpeed/8,-2.5,2.5);
  const commandedYaw=clamp(rudder*18+turnAssist,-19,19);
  state.yawRateDegS=smooth(state.yawRateDegS||0,commandedYaw,2.4,dt);
  const targetVS=clamp((collective-.48)*8.2-.12+state.turbulence*.5,-4.5,4);
  state.verticalMs=smooth(state.verticalMs,targetVS,1.5,dt);
  // The helipad supports the skids. A grounded helicopter cannot show
  // a negative vertical speed or accumulate an invisible downward impulse.
  if(state.onGround)state.verticalMs=Math.max(0,state.verticalMs);
  if(state.onGround&&state.verticalMs>0.35){
   state.onGround=false;state.phase="lift";
   state.message="Simulated rotorcraft lift. Use cyclic for horizontal motion and collective for height.";
   events.push("liftoff");
  }
  if(!state.onGround){
   state.altitudeM+=state.verticalMs*dt;
   // Translate from the visible rotor-disc attitude, not directly from
   // the touch input. The cyclic first tilts the illustrated helicopter,
   // then horizontal velocity builds and decays gradually.
   const forward=smooth(state.forwardMs,state.pitchDeg*(13/9),0.95,dt);
   const lateral=smooth(state.lateralMs,state.rollDeg*(11/13),0.95,dt);
   state.forwardMs=forward;state.lateralMs=lateral;
   const heading=state.headingDeg*RAD;
   const vx=forward*Math.sin(heading)+lateral*Math.cos(heading);
   const vz=forward*Math.cos(heading)-lateral*Math.sin(heading);
   const gx=vx+wind.x,gz=vz+wind.z;
   state.zM+=gz*dt;state.xM+=gx*dt;
   state.headingDeg=(state.headingDeg+state.yawRateDegS*dt+360)%360;
   state.groundSpeedKt=Math.hypot(gx,gz)/KNOT;
   state.trackDeg=E.compassTrack(gx,gz);
   state.speedKt=Math.hypot(forward,lateral)/KNOT;
   if(state.altitudeM>=2&&state.phase==="lift")state.phase="hover";
   if(state.altitudeM>15||Math.hypot(state.xM,state.zM)>70)state.phase="flight";
   // The hover timer runs only while height, position, drift and yaw are
   // controlled together. Moving away resets the continuous hold.
   const hoverStable=state.altitudeM>=2&&state.altitudeM<=9&&
    Math.hypot(state.xM,state.zM)<=10&&state.groundSpeedKt<2&&
    Math.abs(state.verticalMs)<.45&&Math.abs(state.yawRateDegS)<3;
   state.hoverHoldSec=hoverStable?Math.min(HOVER_HOLD_SECONDS,state.hoverHoldSec+dt):0;
   state.hoverBestSec=Math.max(state.hoverBestSec,state.hoverHoldSec);
   if(!state.hoverAchieved&&state.hoverHoldSec>=HOVER_HOLD_SECONDS){
    state.hoverAchieved=true;events.push("hoverHeld");
   }
   if(state.verticalMs>.65)events.push("climb");
   if(state.verticalMs<-.65)events.push("descent");
   if(state.altitudeM<=0){
    // Check the ACTUAL descent speed at skid contact, rather than the
    // desired descent speed from the last collective setting. Quickly
    // raising collective before contact must not erase a hard impact.
    const impactVS=state.verticalMs;
    const insidePad=Math.hypot(state.xM,state.zM)<27;
    const gentle=impactVS>=-1.75&&state.groundSpeedKt<9&&
     Math.abs(state.rollDeg)<10&&insidePad;
    const precision=gentle&&state.hoverAchieved&&
     Math.hypot(state.xM,state.zM)<=6&&impactVS>=-1.4&&
     state.groundSpeedKt<3&&Math.abs(state.rollDeg)<6&&
     Math.abs(state.yawRateDegS)<4;
    state.altitudeM=0;state.onGround=true;state.verticalMs=0;
    state.hoverHoldSec=0;
    state.phase=gentle?"landed":"halted";
    state.landingGrade=gentle?(precision?"precision":"standard"):"hard";
    state.message=precision?"Precision hover and centre-pad landing completed.":
     gentle?"Gentle helipad landing. Try holding a stable hover before touchdown.":
      "Hard or off-pad rotorcraft contact. Restart and practise a stabilised descent.";
    events.push(gentle?"touchdown":"hardLanding");
   }
  }else{
   // Skids on the pad resist yaw: no invisible rotation while stationary.
   state.yawRateDegS=0;
   state.altitudeM=0;state.groundSpeedKt=0;state.speedKt=0;state.trackDeg=state.headingDeg;
  }
  return {state,events};
 }
 if(state.physicsId==="aero"){
  const result=D.step(state,input,dt,events,wind);
  markReturnFinal(state);
  return result;
 }
 const throttle=clamp(input.throttle,0,1);
 const flap=clamp(input.flaps,0,30);
 if(state.onGround){
  const brake=input.brake===true;
  // Wheel braking builds and releases progressively after actual touchdown.
  // This avoids the old single-frame full-brake impulse and retains clear
  // distinction between coasting and holding the phone brake control.
  const rolling=state.phase==="rollout";
  state.rolloutBrakePressure=rolling?
   smooth(state.rolloutBrakePressure||0,brake?1:0,brake?3.2:8,dt):0;
  const wheelBrake=rolling?9*state.rolloutBrakePressure:(brake?9:0);
  const acceleration=p.groundAccel*throttle-1.2-.00065*state.speedKt**2-
   flap*.014-wheelBrake;
  state.speedKt=clamp(state.speedKt+acceleration*dt,0,p.maxGroundKt??115);
  state.verticalMs=0;state.altitudeM=0;
  // The departure roll uses a limited illustrated steering envelope, but
  // a returning aircraft can touch down at heading 358° (equivalent to -2°).
  // Never clamp that compass heading straight to +40° on the first rollout
  // frame: it would make a correctly aligned landing turn off the runway.
  if(state.phase==="roll"){
   const signed=((state.headingDeg+540)%360)-180;
   state.headingDeg=clamp(signed+rudder*.65*dt,-40,40);
  }else{
   // A little more wheel-steering authority only at taxi speeds; maintain
   // the previous gentle behaviour at fast touchdown speeds.
   const groundRate=.65+(rolling ? .8*Math.max(0,1-state.speedKt/55) : 0);
   state.headingDeg=(state.headingDeg+rudder*groundRate*dt+360)%360;
  }
  state.zM+=state.speedKt*KNOT*Math.cos(state.headingDeg*RAD)*dt;
  state.xM+=state.speedKt*KNOT*Math.sin(state.headingDeg*RAD)*dt;
  if(rolling)state.rolloutDistanceM=(state.rolloutDistanceM||0)+state.speedKt*KNOT*dt;
  state.groundSpeedKt=state.speedKt;
  state.trackDeg=state.headingDeg; // Wheels follow the fictional runway until liftoff.
  if(state.phase==="roll"&&state.speedKt>12)events.push("runwayRumble");
  if(state.phase==="roll"&&state.speedKt>=p.rotationKt&&state.pitchDeg>3.5&&throttle>.6&&
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
  const excursion=E.runwayRolloutExcursion(state);
  if(excursion){
   state.phase="halted";
   state.message=excursion==="side"?
    "Runway excursion: the wheels left the side of the strip during rollout.":
    "Runway overrun: the wheels passed the end of the strip during rollout.";
   events.push("runwayExcursion","hardLanding");
  }else if(state.phase==="rollout"&&state.speedKt<5){
   state.phase="complete";
   state.message="Fictional rollout complete. This is not a proficiency endorsement.";
   events.push("completed");
  }
 }else{
  const targetSpeed=clamp(p.airborneBaseKt+p.airbornePowerKt*throttle-state.pitchDeg*.9-flap*p.airborneDragKt,26,p.maxAirborneKt??155);
  state.speedKt=smooth(state.speedKt,targetSpeed,.19,dt);
  const stall=state.speedKt<p.stallKt;
  const targetVertical=clamp(
   state.speedKt*KNOT*Math.sin(state.pitchDeg*RAD)*p.climbLift+
   (throttle-.5)*p.climbPower-.48-(stall?3.2:0)+state.turbulence*.42,-8,p.climbCap);
  state.verticalMs=smooth(state.verticalMs,targetVertical,1.6,dt);
  // Coordinated turn: bank must visibly change the flight path. The old
  // 1–2 deg/s trainer rate produced multi-kilometre turns that were almost
  // impossible to fly back into the fictional runway on a phone.
  // Use an accelerated but bounded educational turn, without teleporting.
  const airspeedMs=Math.max(22,state.speedKt*KNOT);
  const bankRate=9.81*Math.tan(clamp(state.rollDeg,-55,55)*RAD)/airspeedMs/RAD;
  const headingRate=clamp(bankRate*1.07+rudder*.62,-9,9);
  state.headingDeg=(state.headingDeg+headingRate*dt+360)%360;
  const heading=state.headingDeg*RAD;
  const vx=state.speedKt*KNOT*Math.sin(heading),vz=state.speedKt*KNOT*Math.cos(heading);
  const gx=vx+wind.x,gz=vz+wind.z;
  state.zM+=gz*dt;state.xM+=gx*dt;
  state.groundSpeedKt=Math.hypot(gx,gz)/KNOT;
  state.trackDeg=E.compassTrack(gx,gz);
  state.altitudeM+=state.verticalMs*dt;
  if(stall)events.push("stall");
  if(state.verticalMs>.7)events.push("climb");
  if(state.verticalMs<-.7)events.push("descent");
  if(state.phase==="climb"&&state.altitudeM>75){
   state.phase="flight";
   state.message="Free flight: follow the live circuit waypoint bearing, then turn back to the original runway. Short-final setup is optional.";
  }
  if(state.phase==="approach"&&state.zM>=-40&&state.altitudeM>28){
   state.message="Above the imaginary runway threshold. Practise a new approach setup if needed.";
  }
  if(state.altitudeM<=0){
   state.altitudeM=0;state.onGround=true;
   const onRunway=state.zM>=-35&&state.zM<=1800&&Math.abs(state.xM)<24;
   const alignment=E.runwayAlignment(state.headingDeg,state.trackDeg);
   const gentle=state.verticalMs>=-3.3&&Math.abs(state.rollDeg)<13&&
    state.speedKt<(p.landingMaxKt??93)&&onRunway&&alignment.aligned;
   if(gentle){
    // Read-only contact record for flight replay and post-landing feedback:
    // never infer touchdown conditions from the next grounded physics tick.
    state.touchdownData=Object.freeze({
     speedKt:state.speedKt,sinkMs:state.verticalMs,
     offsetM:state.xM,runwayPositionM:state.zM,
     headingDeg:state.headingDeg,trackDeg:state.trackDeg
    });
    state.rolloutBrakePressure=0;state.rolloutDistanceM=0;
   }
   state.verticalMs=0;
   state.phase=gentle?"rollout":"halted";
   state.message=gentle?"Simulated touchdown. Reduce power and hold the brake to finish the rollout.":
    onRunway&&!alignment.aligned?
     "Runway crossing angle too large. Approach along the strip for a controlled landing.":
     "Hard or off-runway contact. Use the approach reset and try a gentler descent.";
   events.push(gentle?"touchdown":"hardLanding");
  }
 }
 markReturnFinal(state);
 return {state,events};
}
const api={makeInput,makeState,step,markReturnFinal,rotorHoverCue,flightProfile,JET_SETTINGS,AIRFRAME_IDS,clamp,KNOT};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAImmersiveFlight=api;
})(typeof window!=="undefined"?window:null);
