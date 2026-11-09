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
finalInput.throttle=0;finalInput.brake=true;finalInput.pitch=0;
simulate(approach,finalInput,20,landingEvents);
assert.equal(approach.phase,"complete","brakes should end the runway rollout");
assert.ok(landingEvents.includes("completed"));

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
console.log("Immersive flight model passed: runway liftoff, turn, final-approach landing/rollout, off-runway impact, collective/helipad and perspective scenery.");
