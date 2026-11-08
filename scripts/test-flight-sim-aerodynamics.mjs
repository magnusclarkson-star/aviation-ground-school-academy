import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const M=require("../flight-sim-model.js");
const D=require("../flight-sim-aerodynamics.js");
const G=require("../flight-sim-guidance.js");
const A=require("../flight-sim-aircraft-systems.js");
const advance=(state,input,seconds)=>{
 const events=[];
 for(let i=0;i<Math.round(seconds/.05);i++){
  const result=M.step(state,input,.05);
  events.push(...result.events);
  if(["halted","complete","landed"].includes(state.phase))break;
 }
 return events;
};
const almost=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<=eps,`Expected ${a} ~ ${b}`);

const classic=M.makeState("airplane","approach");
assert.equal(classic.physicsId,"classic");
assert.equal(classic.speedKt,73,"classic default remains the existing teaching model");
assert.equal(D.indications(classic),null,"classic must not pretend to have aerodynamic forces");
const rotor=M.makeState("helicopter","runway",{physicsId:"aero"});
assert.equal(rotor.physicsId,"classic","rotorcraft retains its separate simplified model");
assert.throws(()=>M.makeState("airplane","runway",{physicsId:"jet"}),/Unknown fictional physics mode/);
assert.throws(()=>D.config("jet"),/Unknown experimental dynamics profile/);
assert.throws(()=>D.prepare(classic),/Cannot prepare/);
assert.throws(()=>D.sample(classic,M.makeInput()),/requires a fictional airplane/);

const plane=M.makeState("airplane","approach",{physicsId:"aero"});
assert.equal(plane.physicsId,"aero");
assert.equal(plane.altitudeM,84);
assert.equal(plane.speedKt,73);
assert.equal(plane.engineFraction,.49);
assert.equal(plane.flightPathDeg,-2.75);
const initial=D.indications(plane);
assert.ok(initial);
assert.equal(initial.aoaDeg,0);
assert.equal(initial.energy,0);
assert.equal(initial.enginePct,49);
const trim=M.makeInput();trim.flaps=20;trim.throttle=.49;trim.pitch=.22;
const early=advance(plane,trim,2);
assert.ok(plane.time>1.9);
assert.ok(plane.altitudeM<84,"approach should respond to descent dynamics");
assert.ok(plane.speedKt>30&&plane.speedKt<145);
assert.ok(plane.liftN>1000&&plane.dragN>100);
assert.ok(plane.thrustN>=0&&plane.loadFactor>=0);
assert.ok(Number.isFinite(plane.energyJPerKg)&&plane.energyJPerKg>0);
assert.ok(Number.isFinite(plane.aoaDeg));
assert.ok(Number.isFinite(plane.flightPathDeg));
assert.ok(Number.isFinite(plane.groundSpeedKt));
assert.ok(Number.isFinite(plane.trackDeg));
assert.ok(D.indications(plane).energy>0);
assert.ok(Math.abs(plane.pitchDeg)<20);
assert.ok(Math.abs(plane.rollDeg)<50);

const one=D.coefficients(4,0,"trainer"),full=D.coefficients(4,30,"trainer");
assert.ok(full.cl>one.cl,"illustrative flaps increase lift coefficient");
assert.ok(full.cd>one.cd,"illustrative flaps increase drag coefficient");
assert.ok(one.cd>0);
const nearStall=D.coefficients(14,0,"trainer");
const deepStall=D.coefficients(28,0,"trainer");
assert.equal(nearStall.stalled,false);
assert.equal(deepStall.stalled,true);
assert.ok(deepStall.cl<nearStall.cl,"deep post-stall should lose model lift");
assert.ok(deepStall.cd>nearStall.cd,"post-stall drag must increase");
assert.ok(D.coefficients(-12,0,"trainer").cl<one.cl);

for(const id of ["trainer","sport","touring"]){
 const cfg=D.config(id);
 assert.ok(cfg.massKg>400&&cfg.wingM2>10);
 const a=M.makeState("airplane","approach",{physicsId:"aero",profileId:id,windId:"calm"});
 const b=M.makeState("airplane","approach",{physicsId:"aero",profileId:id,windId:"calm"});
 const input=M.makeInput();input.flaps=20;input.throttle=.6;input.pitch=-.18;input.bank=.3;
 const evA=advance(a,input,3),evB=advance(b,input,3);
 assert.deepEqual(evA,evB,"dynamics and event trace deterministic");
 assert.deepEqual(a,b,"same seed and inputs should yield bitwise-equal synthetic state");
 assert.ok(Number.isFinite(a.altitudeM)&&Number.isFinite(a.speedKt));
 assert.ok(a.speedKt>=0&&a.speedKt<175);
 assert.ok(a.loadFactor<5&&a.loadFactor>=-1);
}

const windy=M.makeState("airplane","approach",{physicsId:"aero",windId:"crosswind"});
const calm=M.makeState("airplane","approach",{physicsId:"aero",windId:"calm"});
advance(windy,trim,3);
advance(calm,trim,3);
assert.ok(windy.xM>6,"crosswind drifts the aircraft over the ground in experimental mode");
assert.ok(Math.abs(calm.xM)<.1);
almost(windy.speedKt,calm.speedKt,1e-8);
assert.ok(windy.trackDeg>calm.trackDeg);
const head=M.makeState("airplane","approach",{physicsId:"aero",windId:"headwind"});
advance(head,trim,3);
assert.ok(head.groundSpeedKt<calm.groundSpeedKt);
assert.ok(head.zM<calm.zM);

const slow=M.makeState("airplane","approach",{physicsId:"aero"});
slow.altitudeM=110;slow.speedKt=23;slow.pitchDeg=24;slow.verticalMs=0;
const sample=D.sample(slow,M.makeInput());
assert.equal(sample.effectiveStall,true);
assert.ok(sample.aoaDeg>15);
assert.ok(sample.dragN>0);
const events=advance(slow,{...M.makeInput(),pitch:-1,throttle:.15},.7);
assert.ok(events.includes("stall"),"high AoA should emit a conceptual stall event");
assert.equal(slow.aeroStalled,true);
assert.equal(G.guidance({...slow,phase:"flight"},M.makeInput()).level,"caution");

const departure=M.makeState("airplane","runway",{physicsId:"aero"});
const runwayInput=M.makeInput();
runwayInput.throttle=1;runwayInput.pitch=-1;runwayInput.flaps=10;
const takeoffEvents=advance(departure,runwayInput,25);
assert.ok(takeoffEvents.includes("liftoff"),"experimental model should permit a controlled fictional runway liftoff");
assert.ok(departure.speedKt>=D.config("trainer").massKg*0,
 "speed should remain finite and nonnegative");
assert.ok(departure.zM>50);
assert.ok(departure.engineFraction>.9);
const system=A.create("airplane");A.step(system,departure,runwayInput,.05);
almost(system.powerPct,departure.engineFraction*100);
assert.equal(A.snapshot(system).powerValue,"100%");

const grounded=M.makeState("airplane","runway",{physicsId:"aero"});
const braked=M.makeState("airplane","runway",{physicsId:"aero"});
grounded.speedKt=45;braked.speedKt=45;
const cruising=M.makeInput();cruising.throttle=0;
advance(grounded,cruising,1);
advance(braked,{...cruising,brake:true},1);
assert.ok(braked.speedKt<grounded.speedKt,"braking should reduce fictional rollout speed");
const initialTime=grounded.time;
M.step(grounded,cruising,0);
assert.equal(grounded.time,initialTime,"paused frame must not advance the model");

const collided=M.makeState("airplane","approach",{physicsId:"aero"});
collided.altitudeM=.01;collided.zM=-100;collided.verticalMs=-5;
advance(collided,{...M.makeInput(),throttle:0},1);
assert.equal(collided.phase,"halted");
assert.equal(collided.onGround,true);
const stopTime=collided.time;
M.step(collided,cruising,.1);
assert.equal(collided.time,stopTime,"halted flight must remain immutable");

console.log("Experimental wing-energy model passed: classic isolation, lift/drag versus AoA/flaps, deterministic forces, three fictional profiles, wind drift, stall warning, takeoff, braking, ground contact and engine display.");
