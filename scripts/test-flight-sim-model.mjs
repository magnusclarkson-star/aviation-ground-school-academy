import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const M=require("../flight-sim-model.js");
const S=require("../flight-sim-scenery.js");
function simulate(s,u,seconds,events=[]){
 const ticks=Math.round(seconds/.05);
 for(let i=0;i<ticks;i++){
  const result=M.step(s,u,.05);
  events.push(...result.events);
  if(["complete","landed","halted"].includes(s.phase))break;
 }
 return s;
}
const slow=M.step(M.makeState(),M.makeInput(),0);
assert.equal(slow.state.time,0);
assert.deepEqual(slow.events,[]);
assert.throws(()=>M.makeState("jetliner"),/Unsupported/);

// Choosing the aircraft changes Classic response, not just the outside model.
assert.deepEqual(M.AIRFRAME_IDS,["c172","r44","fa18","f22","f35","typhoon","su37"]);
assert.equal(M.makeState("airplane").airframeId,"c172");
assert.equal(M.makeState("helicopter").airframeId,"r44");
assert.throws(()=>M.makeState("airplane","runway",{airframeId:"r44"}),/airframe/);
assert.throws(()=>M.makeState("airplane","runway",{airframeId:"mig29"}),/airframe/);
assert.equal(new Set(Object.values(M.JET_SETTINGS).map(p=>p.rotationKt)).size,5,
 "Five jets have distinct fictional rotation speeds");
const jetApproach=M.makeState("airplane","approach",{airframeId:"f22"});
assert.equal(jetApproach.speedKt,M.JET_SETTINGS.f22.approachKt);
assert.ok(jetApproach.speedKt>M.makeState("airplane","approach").speedKt+30);
for(const id of Object.keys(M.JET_SETTINGS)){
 const p=M.flightProfile(M.makeState("airplane","runway",{airframeId:id}));
 assert.equal(p,M.JET_SETTINGS[id]);
 const trainerGround=M.makeState("airplane","runway");
 const fighterGround=M.makeState("airplane","runway",{airframeId:id});
 const full=M.makeInput();full.throttle=1;
 simulate(trainerGround,full,4);simulate(fighterGround,full,4);
 assert.ok(fighterGround.speedKt>trainerGround.speedKt+18,
  id+" should accelerate differently from the C172");
 assert.ok(fighterGround.speedKt<p.rotationKt,id+" should not take off without rotation");
 const rotate=M.makeInput();rotate.throttle=1;rotate.pitch=-.72;
 const events=[];simulate(fighterGround,rotate,16,events);
 assert.ok(events.includes("liftoff"),id+" should still take off with appropriate simulated pitch");
 assert.ok(Number.isFinite(fighterGround.altitudeM)&&fighterGround.altitudeM>0);
}
const experimental=M.makeState("airplane","approach",{airframeId:"f22",physicsId:"aero"});
assert.equal(M.flightProfile(experimental).id,"trainer",
 "The optional experimental force laboratory keeps the established trainer model");

const runway=M.makeState("airplane");
const depart=M.makeInput("airplane");
depart.throttle=1;depart.pitch=-.72;depart.flaps=10;
const cues=[];
simulate(runway,depart,35,cues);
assert.ok(cues.includes("liftoff"),"runway departure needs speed, thrust and rotation");
assert.ok(!runway.onGround,"airplane should become airborne");
assert.ok(runway.altitudeM>65,"a fictional aeroplane should climb after rotation");
assert.ok(runway.zM>100&&runway.speedKt>40,"outside scene has forward motion");
assert.ok(["climb","flight"].includes(runway.phase));
assert.ok(runway.altitudeM<250,"no instant altitude teleport");
const offsetBefore=runway.xM,hdgBefore=runway.headingDeg;
depart.bank=.65;
simulate(runway,depart,5);
assert.ok(Math.abs(runway.rollDeg)>10);
assert.ok(Math.abs(runway.xM-offsetBefore)>1||Math.abs(runway.headingDeg-hdgBefore)>1,"bank produces visible turn");
assert.ok(cues.some(x=>x==="climb"));

const noRotate=M.makeState("airplane");
const noRotateInput=M.makeInput();
noRotateInput.throttle=1;
simulate(noRotate,noRotateInput,15);
assert.equal(noRotate.onGround,true,"speed alone should not rotate the training aircraft");
assert.equal(noRotate.altitudeM,0);

const approach=M.makeState("airplane","approach");
assert.equal(approach.zM,-1450);
assert.equal(approach.phase,"approach");
const finalInput=M.makeInput("airplane");
finalInput.throttle=.49;finalInput.flaps=20;finalInput.pitch=.22;
const landingEvents=[];
simulate(approach,finalInput,72,landingEvents);
assert.equal(approach.phase,"rollout","controlled fictional short final should reach runway");
assert.ok(landingEvents.includes("touchdown"));
assert.ok(approach.altitudeM===0&&approach.onGround);
assert.ok(approach.touchdownData&&approach.touchdownData.sinkMs<0,
 "touchdown records actual pre-contact sink rate before vertical speed resets");
assert.ok(approach.touchdownData.speedKt>40&&approach.touchdownData.speedKt<100);
assert.ok(Object.isFrozen(approach.touchdownData));
// The existing 72-second approach helper continues to coast after contact,
// so its rollout distance is expected to be positive at this point.
assert.ok(approach.rolloutDistanceM>0,"rolling distance accumulates after contact");
assert.equal(approach.rolloutBrakePressure,0,"coasting without brakes has no brake pressure");
// Check the boundary itself with a single physics step, not a long coast.
const contactInstant=M.makeState("airplane","approach");
Object.assign(contactInstant,{xM:0,zM:400,altitudeM:.01,verticalMs:-1.0,rollDeg:0});
M.step(contactInstant,{...M.makeInput(),throttle:.49},.05);
assert.equal(contactInstant.phase,"rollout");
assert.equal(contactInstant.rolloutDistanceM,0,
 "the touchdown tick starts the measured ground-roll distance at zero");
assert.ok(Number.isFinite(contactInstant.touchdownData.pitchDeg) &&
 Number.isFinite(contactInstant.touchdownData.bankDeg),
 "contact snapshot captures airborne attitude before wheels settle");
// A nose-up or banked touch-yoke held after contact must not leave the
// aircraft visually floating above the runway during the rollout.
const rollSettling=Object.assign(M.makeState("airplane","approach"),{
 phase:"rollout",onGround:true,headingDeg:0,trackDeg:0,xM:0,zM:550,
 speedKt:52,groundSpeedKt:52,pitchDeg:7,rollDeg:9,altitudeM:0
});
const settleInput={...M.makeInput(),pitch:-1,bank:1,throttle:0,brake:true};
simulate(rollSettling,settleInput,1.4);
assert.equal(rollSettling.phase,"rollout",
 "ground attitude stabilization must not skip manual braking");
assert.ok(Math.abs(rollSettling.pitchDeg)<7*.4,
 "wheels progressively return to a near-level nose attitude");
assert.ok(Math.abs(rollSettling.rollDeg)<9*.4,
 "wheels progressively remove unrealistic ground banking");
assert.ok(rollSettling.rolloutDistanceM>0&&rollSettling.altitudeM===0,
 "the aircraft moves along the runway with no vertical teleport");
finalInput.throttle=0;finalInput.brake=true;finalInput.pitch=0;
simulate(approach,finalInput,20,landingEvents);
assert.equal(approach.phase,"complete","brakes should end the runway rollout");
assert.ok(landingEvents.includes("completed"));
const reportFromRealLanding=require("../flight-sim-guidance.js");
const measuredLanding=reportFromRealLanding.summary(
 reportFromRealLanding.start(M.makeState("airplane","approach")),approach).touchdown;
assert.ok(measuredLanding&&measuredLanding.speedKt>40);
assert.ok(measuredLanding.sinkMs>0&&measuredLanding.sinkMs<4);
assert.ok(measuredLanding.offsetM<24);
assert.ok(measuredLanding.rolloutM>50);
assert.ok(approach.rolloutBrakePressure>.9);
assert.ok(approach.rolloutDistanceM>50,
 "aircraft follows the runway for a measurable distance after touchdown");
// Coasting and braking should feel different, with no instant full-pressure
// brakes or sudden compass wrapping at heading 359 degrees.
const testRoll=()=>Object.assign(M.makeState("airplane","approach"),{
 phase:"rollout",onGround:true,xM:0,zM:250,altitudeM:0,
 headingDeg:359,trackDeg:359,speedKt:72,groundSpeedKt:72});
const braking=testRoll(),coasting=testRoll(),groundInput=M.makeInput();
groundInput.throttle=0;groundInput.flaps=20;groundInput.brake=true;
M.step(braking,groundInput,.05);
assert.ok(braking.rolloutBrakePressure>0&&braking.rolloutBrakePressure<.2,
 "a single touch frame cannot apply 100% of ground braking");
assert.ok(braking.headingDeg>358&&braking.headingDeg<360,
 "north-aligned rollout heading must not jump to a 40 degree turn");
const coastingInput={...groundInput,brake:false};
for(let i=0;i<39;i++){M.step(braking,groundInput,.05);M.step(coasting,coastingInput,.05);}
assert.ok(braking.rolloutBrakePressure>.99,
 "holding the brake builds wheel pressure within a few simulated seconds");
assert.ok(coasting.rolloutBrakePressure===0);
assert.ok(braking.speedKt<coasting.speedKt-5,
 "firm wheel braking reduces speed much faster than simply coasting");
assert.ok(braking.rolloutDistanceM>0&&coasting.rolloutDistanceM>0);
assert.ok(braking.zM<coasting.zM,
 "braked aircraft travels less distance along the same runway");
const brakedSpeed=braking.speedKt;
groundInput.brake=false;
M.step(braking,groundInput,.1);
assert.ok(braking.rolloutBrakePressure<.99,
 "releasing the brake immediately starts relaxing pressure");
assert.ok(braking.speedKt<=brakedSpeed,
 "release does not inject speed or teleport the aircraft");
// A near-stop excursion cannot be marked completed just because the
// moving airplane fell below the five-knot completion threshold.
for(const point of [{xM:28.2,zM:850},{xM:0,zM:1821}]){
 const offStrip=Object.assign(M.makeState("airplane","approach"),{
  phase:"rollout",onGround:true,speedKt:4.6,groundSpeedKt:4.6,
  headingDeg:0,trackDeg:0,altitudeM:0,...point
 });
 const off=M.step(offStrip,{...M.makeInput(),brake:true,throttle:0},.05);
 assert.equal(offStrip.phase,"halted","outside runway: never mark a successful stop");
 assert.ok(off.events.includes("runwayExcursion"));
 assert.ok(!off.events.includes("completed"));
}
const stoppedInside=Object.assign(M.makeState("airplane","approach"),{
 phase:"rollout",onGround:true,speedKt:4.6,groundSpeedKt:4.6,
 headingDeg:0,trackDeg:0,altitudeM:0,xM:0,zM:900
});
assert.equal(M.step(stoppedInside,{...M.makeInput(),brake:true,throttle:0},.05).state.phase,
 "complete","a genuine runway stop still completes normally");

const hard=M.makeState("airplane","approach");
hard.altitudeM=.01;hard.verticalMs=-6;hard.xM=88;hard.zM=500;
const hardInput=M.makeInput();hardInput.pitch=.9;hardInput.throttle=.05;
const impact=M.step(hard,hardInput,.1);
assert.equal(impact.state.phase,"halted","off-runway contact cannot count as a successful landing");
assert.ok(impact.events.includes("hardLanding"));
assert.equal(M.step(hard,hardInput,.1).state.time,hard.time);

// Helicopter anti-torque pedals build and release yaw rate gradually.
const pedalState=M.makeState("helicopter");
const pedalInput=M.makeInput("helicopter");pedalInput.collective=.8;pedalInput.rudder=1;
simulate(pedalState,pedalInput,5);
assert.ok(pedalState.altitudeM>0,"pedal check must be airborne");
assert.ok(pedalState.yawRateDegS>14&&pedalState.yawRateDegS<=19);
const turningHeading=pedalState.headingDeg;
pedalInput.rudder=0;
simulate(pedalState,pedalInput,.2);
assert.ok(pedalState.yawRateDegS>0&&pedalState.yawRateDegS<18,
 "pedal release gradually damps heading rate, not an abrupt stop");
assert.ok(pedalState.headingDeg>turningHeading,"yaw still responds after pedal release");
simulate(pedalState,pedalInput,3);
assert.ok(Math.abs(pedalState.yawRateDegS)<.2,"neutral pedals eventually stop yaw");
const pad=M.makeState("helicopter");
const padInput=M.makeInput("helicopter");padInput.rudder=1;
simulate(pad,padInput,3);
assert.equal(pad.headingDeg,0,"anti-torque pedals cannot spin grounded skids");
assert.equal(pad.yawRateDegS,0);
const coordinated=M.makeState("helicopter");
const coordinatedInput=M.makeInput("helicopter");
coordinatedInput.collective=.8;coordinatedInput.pitch=-.65;
simulate(coordinated,coordinatedInput,6);
const initialCoordinatedHeading=coordinated.headingDeg;
coordinatedInput.bank=.7;
simulate(coordinated,coordinatedInput,2);
assert.ok(coordinated.headingDeg>initialCoordinatedHeading+.2,
 "forward flight bank assists the turn with pedals centred");
const hover=M.makeState("helicopter");
const hoverInput=M.makeInput("helicopter");hoverInput.collective=.8;hoverInput.bank=.7;
simulate(hover,hoverInput,5);
assert.ok(Math.abs(hover.headingDeg)<.001,
 "sideways cyclic while hovering does not invent a forward-flight turn");

// Fine cyclic movements are less abrupt than a linear phone-stick mapping,
 // without removing full bank or pitch authority at maximum deflection.
assert.equal(M.shapeRotorCyclic(0),0);
assert.equal(M.shapeRotorCyclic(1),1);
assert.equal(M.shapeRotorCyclic(-1),-1);
assert.ok(M.shapeRotorCyclic(.20)>.10&&M.shapeRotorCyclic(.20)<.15);
assert.equal(M.shapeRotorCyclic(-.20),-M.shapeRotorCyclic(.20));
const carefulHeli=M.makeState("helicopter"),carefulInput=M.makeInput("helicopter");
carefulInput.collective=.8;
simulate(carefulHeli,carefulInput,3);
carefulInput.collective=.495;carefulInput.bank=.2;
simulate(carefulHeli,carefulInput,2);
assert.ok(carefulHeli.rollDeg>1&&carefulHeli.rollDeg<2.5,
 "small phone cyclic produces a controllable visible roll near hover");
assert.ok(carefulHeli.lateralMs>.2);
const carefulDrift=carefulHeli.lateralMs;
carefulInput.bank=0;
simulate(carefulHeli,carefulInput,1);
assert.ok(carefulHeli.lateralMs>0&&carefulHeli.lateralMs<carefulDrift,
 "re-centred cyclic damps, but does not teleport away, existing drift");
const fullControl=M.makeState("helicopter"),fullControlInput=M.makeInput("helicopter");
fullControlInput.collective=.82;fullControlInput.bank=1;
simulate(fullControl,fullControlInput,3);
assert.ok(fullControl.rollDeg>11,
 "full cyclic travel retains the established turning authority");

// Low-hover pedal controls should be more precise on touchscreen than
// at normal forward-flight height, yet full-pedal turning remains strong.
const lowYaw=M.makeState("helicopter"),highYaw=M.makeState("helicopter");
for(const state of [lowYaw,highYaw]){
 Object.assign(state,{onGround:false,phase:"hover",altitudeM:4,
  forwardMs:0,lateralMs:0,groundSpeedKt:0,yawRateDegS:0});
}
highYaw.altitudeM=25;highYaw.phase="flight";
const finePedals=M.makeInput("helicopter");
finePedals.collective=.495;finePedals.rudder=.25;finePedals.turbulence=0;
M.step(lowYaw,finePedals,.1);M.step(highYaw,finePedals,.1);
assert.ok(lowYaw.yawRateDegS>0&&lowYaw.yawRateDegS<highYaw.yawRateDegS*.90,
 "small R44 hover-pedal deflections rotate more gently near the pad");
const fullYaw=M.makeState("helicopter");
Object.assign(fullYaw,{onGround:false,phase:"hover",altitudeM:4});
const fullYawInput={...finePedals,rudder:1};
M.step(fullYaw,fullYawInput,.1);
assert.ok(fullYaw.yawRateDegS>lowYaw.yawRateDegS*4,
 "fine pedal curve preserves decisive full-pedal turning");
finePedals.rudder=0;
const leftOverYaw=lowYaw.yawRateDegS;
M.step(lowYaw,finePedals,.1);
assert.ok(lowYaw.yawRateDegS>0&&lowYaw.yawRateDegS<leftOverYaw,
 "neutral pedals damp hover yaw smoothly without an instant stop");

// V2 phone collective: small changes around the simulated hover trim are
// less abrupt near the pad. Full-travel climb/descent and high-altitude
// control sensitivity must remain unchanged.
const rotorTrim=.48+.12/8.2;
const fineUp=M.shapeRotorCollective(rotorTrim+.06,4,false);
const fineDown=M.shapeRotorCollective(rotorTrim-.06,4,false);
assert.ok(fineUp>rotorTrim&&fineUp<rotorTrim+.06);
assert.ok(fineDown<rotorTrim&&fineDown>rotorTrim-.06);
assert.equal(M.shapeRotorCollective(.8,4,false),.8);
assert.equal(M.shapeRotorCollective(.2,4,false),.2);
assert.equal(M.shapeRotorCollective(.55,30,false),.55);
assert.equal(M.shapeRotorCollective(.55,4,true),.55);
assert.ok(Math.abs(M.shapeRotorCollective(rotorTrim,4,false)-rotorTrim)<1e-12);
const fineLow=M.makeState("helicopter"),fineHigh=M.makeState("helicopter");
for(const [state,height] of [[fineLow,4],[fineHigh,30]])
 Object.assign(state,{phase:"hover",onGround:false,altitudeM:height,
  forwardMs:0,lateralMs:0,verticalMs:0,hoverHoldSec:0});
const hoverCollectiveInput={...M.makeInput("helicopter"),
 collective:rotorTrim+.06,turbulence:0};
M.step(fineLow,hoverCollectiveInput,.1);
M.step(fineHigh,hoverCollectiveInput,.1);
assert.ok(fineLow.verticalMs>0&&fineLow.verticalMs<fineHigh.verticalMs*.85,
 "a gentle small collective touch near the pad has visibly finer climb response");
assert.ok(fineLow.altitudeM>4&&fineHigh.altitudeM>30,
 "both simulated rotorcraft still move; input curve is not an altitude hold");

// The skids resist downward motion before takeoff even with low collective.
const padClamp=M.makeState("helicopter"),padDown=M.makeInput("helicopter");
padDown.collective=.1;
simulate(padClamp,padDown,3);
assert.equal(padClamp.altitudeM,0);
assert.equal(padClamp.verticalMs,0,"grounded helicopter never accumulates negative vertical velocity");
assert.equal(M.rotorHoverCue(padClamp),"ON PAD");
// Hover guidance is based on real motion, not on the control stick position.
const cueState=M.makeState("helicopter");
Object.assign(cueState,{onGround:false,phase:"hover",altitudeM:3,verticalMs:0,
 groundSpeedKt:.4,yawRateDegS:0});
assert.equal(M.rotorHoverCue(cueState),"STEADY HOVER");
cueState.groundSpeedKt=7.1;
assert.equal(M.rotorHoverCue(cueState),"DRIFTING");
cueState.groundSpeedKt=0;cueState.verticalMs=-1.2;
assert.equal(M.rotorHoverCue(cueState),"DESCENDING");
cueState.verticalMs=1.3;
assert.equal(M.rotorHoverCue(cueState),"CLIMBING");
cueState.verticalMs=0;cueState.yawRateDegS=8;
assert.equal(M.rotorHoverCue(cueState),"TURNING");
assert.equal(M.rotorHoverCue(M.makeState("airplane")),null);
// A last-second collective change cannot disguise high actual impact speed.
const impactHeli=M.makeState("helicopter"),impactInput=M.makeInput("helicopter");
Object.assign(impactHeli,{onGround:false,phase:"hover",altitudeM:.09,verticalMs:-4.2});
impactInput.collective=1;
const fastImpact=M.step(impactHeli,impactInput,.05);
assert.equal(impactHeli.phase,"halted",
 "hard contact must use the actual descent rate rather than collective target");
assert.ok(fastImpact.events.includes("hardLanding"));
assert.ok(Object.isFrozen(impactHeli.touchdownData));
assert.equal(impactHeli.touchdownData.grade,"hard");
assert.ok(impactHeli.touchdownData.sinkMs< -3.5,
 "hard skid contact must retain actual downward speed, even if collective was raised");
assert.equal(M.rotorHoverCue(impactHeli),"HARD CONTACT");
// Conversely, gentle skid contact with a fast collective movement must be
// judged by impact conditions, not the much more negative target VS.
const lightHeli=M.makeState("helicopter"),lightInput=M.makeInput("helicopter");
Object.assign(lightHeli,{onGround:false,phase:"hover",altitudeM:.01,
 verticalMs:-1.15,groundSpeedKt:0});
lightInput.collective=.2;
const lightContact=M.step(lightHeli,lightInput,.05);
assert.equal(lightHeli.phase,"landed");
assert.ok(lightContact.events.includes("touchdown"));
assert.ok(Object.isFrozen(lightHeli.touchdownData));
assert.equal(lightHeli.touchdownData.grade,"standard");
assert.ok(lightHeli.touchdownData.sinkMs<0 &&
 Math.abs(lightHeli.touchdownData.sinkMs)<1.75,
 "skid contact records actual low vertical descent before reset");
assert.equal(lightHeli.verticalMs,0);
assert.ok(lightHeli.touchdownData.padOffsetM<.01,
 "tiny physics integration movement at touchdown is valid, not a teleport");
// Both cyclic channels build velocity through the displayed attitude.
const attitudeHeli=M.makeState("helicopter"),attitudeInput=M.makeInput("helicopter");
attitudeInput.collective=.80;attitudeInput.pitch=-.65;
simulate(attitudeHeli,attitudeInput,5);
assert.ok(attitudeHeli.pitchDeg>3&&attitudeHeli.forwardMs>1);
const movingBefore=attitudeHeli.forwardMs;
attitudeInput.pitch=0;
simulate(attitudeHeli,attitudeInput,.1);
assert.ok(attitudeHeli.forwardMs>0&&attitudeHeli.forwardMs<movingBefore,
 "neutral cyclic gradually damps the helicopter's translational momentum");

// Precision hover exercise uses measured position, altitude, drift and yaw.
const precisionHeli=M.makeState("helicopter");
const precisionInput=M.makeInput("helicopter");precisionInput.collective=.8;
simulate(precisionHeli,precisionInput,2.5);
assert.ok(precisionHeli.altitudeM>2&&precisionHeli.altitudeM<9);
precisionInput.collective=.495;
const precisionEvents=[];
simulate(precisionHeli,precisionInput,17,precisionEvents);
assert.equal(precisionHeli.hoverAchieved,true,"steady centre-pad hover must complete");
assert.equal(precisionHeli.hoverBestSec,8);
assert.ok(precisionEvents.includes("hoverHeld"),"target fires an observable completion event");
assert.equal(precisionEvents.filter(x=>x==="hoverHeld").length,1,"hover completion fires once");
assert.equal(M.rotorHoverCue(precisionHeli),"HOVER HELD 8 S");
const heldState=M.makeState("helicopter");
Object.assign(heldState,{onGround:false,phase:"hover",altitudeM:4,verticalMs:0});
const heldInput=M.makeInput("helicopter");heldInput.collective=.495;
simulate(heldState,heldInput,4);
assert.ok(heldState.hoverHoldSec>3&&heldState.hoverHoldSec<5);
heldInput.bank=.7;simulate(heldState,heldInput,1.5);
assert.equal(heldState.hoverHoldSec,0,"cyclic drift resets continuous hover timer");
assert.ok(heldState.hoverBestSec>3,"best completed hover duration is preserved");
heldInput.bank=0;
precisionInput.collective=.35;
const precisionLandingEvents=[];
simulate(precisionHeli,precisionInput,15,precisionLandingEvents);
assert.equal(precisionHeli.phase,"landed","controlled precision return remains landable");
assert.equal(precisionHeli.landingGrade,"precision","centre-pad landing after hover receives precision result");
assert.equal(M.rotorHoverCue(precisionHeli),"PRECISION LANDING");
assert.equal(precisionHeli.hoverHoldSec,0,"landing ends active hover timer");
assert.ok(precisionLandingEvents.includes("touchdown"));
const ordinaryHeli=M.makeState("helicopter"),ordinaryInput=M.makeInput("helicopter");
ordinaryInput.collective=.8;simulate(ordinaryHeli,ordinaryInput,3);
ordinaryInput.collective=.34;simulate(ordinaryHeli,ordinaryInput,10);
assert.equal(ordinaryHeli.phase,"landed");
assert.equal(ordinaryHeli.landingGrade,"standard",
 "gentle pad landing without completing the hover drill remains a normal landing");
assert.equal(M.rotorHoverCue(ordinaryHeli),"LANDED");

const heli=M.makeState("helicopter");
const collective=M.makeInput("helicopter");collective.collective=.82;
const liftEvents=[];
simulate(heli,collective,5,liftEvents);
assert.ok(liftEvents.includes("liftoff"),"collective raises helicopter in training model");
assert.ok(heli.altitudeM>2);
assert.equal(heli.onGround,false);
const beforeZ=heli.zM;
collective.pitch=-.6;
simulate(heli,collective,4);
assert.ok(heli.zM>beforeZ+1,"cyclic commands forward translation");
collective.pitch=0;collective.bank=0;collective.collective=.32;
const helipadEvents=[];
simulate(heli,collective,30,helipadEvents);
assert.ok(heli.onGround&&["landed","halted"].includes(heli.phase));
if(heli.phase==="landed")assert.ok(helipadEvents.includes("touchdown"));
else assert.ok(helipadEvents.includes("hardLanding"));
const h2=M.makeState("helicopter");
const h2i=M.makeInput("helicopter");h2i.collective=.8;
simulate(h2,h2i,3);
h2i.collective=.34;simulate(h2,h2i,10);
assert.equal(h2.phase,"landed","collective-only lift and gentle return should finish on pad");

const q=M.makeState("airplane","approach");
const center=S.project(q,0,0,0);
const right=S.project(q,20,0,0);
assert.ok(center&&right&&right.x>center.x);
assert.ok(Math.abs(center.x-480)<1);
const moved={...q,zM:-600};
const far=S.project(q,20,0,0),near=S.project(moved,20,0,0);
assert.ok(near.x>far.x,"runway edge expands as aircraft approaches");
const yawed=S.project({...q,headingDeg:25},0,0,0);
assert.ok(yawed.x<center.x,"heading changes apparent runway alignment");
assert.equal(S.project(q,0,0,-1500),null,"objects behind the camera are clipped");
// Terrain remains anchored to the same coordinates as the user steers
// across a grid boundary; only the entering/leaving outer tree may change.
const treeRow=xM=>{
 const middle=S.treeColumnAt(xM),result=new Map();
 for(let offset=-3;offset<=3;offset++){
  const column=middle+offset;
  result.set(column,S.treeWorldX(column,600));
 }
 return result;
};
const leftSide=treeRow(129),rightSide=treeRow(131);
assert.equal(S.treeColumnAt(129),0);
assert.equal(S.treeColumnAt(131),1);
const shared=[...leftSide.keys()].filter(column=>rightSide.has(column));
assert.equal(shared.length,6,"moving 2 m should preserve six of seven visible tree columns");
for(const column of shared)
 assert.equal(leftSide.get(column),rightSide.get(column),
  "tree must remain world-anchored across the camera grid boundary");
assert.ok([...leftSide.values(),...rightSide.values()].every(Number.isFinite));
assert.equal(S.treeColumnAt(Number.NaN),0);
assert.ok(Math.abs(S.treeWorldX(0,600))<=51);
// A deterministic VIRTUAL test pilot (test-only, never part of the app)
// tries the entire Cessna circuit from runway roll to brake-stop without
// calling makeState again, changing location, or using approach reposition.
const G=require("../flight-sim-guidance.js");
const fullCircuit=M.makeState("airplane","runway",{airframeId:"c172",windId:"calm"});
const fullInput=M.makeInput("airplane");
const fullProgress=G.start(fullCircuit);
const seen=new Set(),fullEvents=[];
let priorTime=0;
const signedTurn=(target,current)=>((target-current+540)%360)-180;
const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
for(let tick=0;tick<7500&&!["complete","halted"].includes(fullCircuit.phase);tick++){
 const stage=fullProgress.circuit.stage;
 seen.add(stage);
 if(fullCircuit.onGround&&fullCircuit.phase==="roll"){
  fullInput.throttle=1;fullInput.pitch=-.70;fullInput.bank=0;
 }else if(fullCircuit.phase==="rollout"){
  fullInput.throttle=0;fullInput.pitch=0;fullInput.bank=0;fullInput.brake=true;
 }else{
  fullInput.brake=false;fullInput.flaps=stage==="final"?20:10;
  fullInput.throttle=stage==="final"?.46:.62;
  const bearing=stage==="departure"?0:
   stage==="crosswind"?(fullCircuit.xM<650?90:180):
   stage==="downwind"?180:
   stage==="base"?(fullCircuit.xM>310?270:0):
   stage==="final"?Math.atan2(-fullCircuit.xM,
    Math.max(440,300-fullCircuit.zM))*180/Math.PI:0;
  fullInput.bank=limit(signedTurn(bearing,fullCircuit.headingDeg)/28,-.94,.94);
  const targetHeight=stage==="final"?
   Math.max(0,200-fullCircuit.zM)*Math.tan(3*Math.PI/180):
   stage==="base"?105:stage==="downwind"&&fullCircuit.zM< -850?120:145;
  const error=targetHeight-fullCircuit.altitudeM;
  const verticalAim=limit(error*.16+(stage==="final"?-2.0:0),-2.9,4.0);
  const speedMs=Math.max(22,fullCircuit.speedKt*M.KNOT);
  const powerClimb=(fullInput.throttle-.5)*2-.48;
  const simulatedPitchDeg=Math.atan2(verticalAim-powerClimb,
   speedMs*.92)*180/Math.PI;
  fullInput.pitch=limit(-simulatedPitchDeg/13,-.85,.75);
 }
 const update=M.step(fullCircuit,fullInput,.05);
 fullEvents.push(...update.events);
 G.observe(fullProgress,fullCircuit,update.events);
 assert.ok(fullCircuit.time>=priorTime,"circuit must advance continuously");
 priorTime=fullCircuit.time;
}
assert.deepEqual(["departure","crosswind","downwind","base","final"].filter(s=>!seen.has(s)),[],
 "virtual pilot should fly through each circuit leg without teleporting");
assert.equal(fullCircuit.phase,"complete",
 "the full fictional C172 circuit must return to the runway and finish braking; "+
 JSON.stringify({phase:fullCircuit.phase,x:Math.round(fullCircuit.xM),
 z:Math.round(fullCircuit.zM),h:Math.round(fullCircuit.altitudeM),
 hdg:Math.round(fullCircuit.headingDeg),speed:Math.round(fullCircuit.speedKt),legs:[...seen]}));
assert.ok(fullEvents.includes("liftoff")&&fullEvents.includes("touchdown")&&
 fullEvents.includes("completed"),"one continuous flight includes liftoff, landing and rollout");
assert.ok(fullCircuit.time>110&&fullCircuit.time<375,
 "the circuit is not a short-final reset or an instant teleport");

console.log("Immersive flight model passed: runway liftoff, turn, final-approach landing/rollout, off-runway impact, collective/helipad and perspective scenery.");
