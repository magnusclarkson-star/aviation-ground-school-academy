import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const A=require("../flight-sim-aircraft-systems.js");
const T=require("../flight-sim-3d.js");
const M=require("../flight-sim-model.js");

const airplane=M.makeState("airplane"),control=M.makeInput("airplane");
const sys=A.create("airplane");
A.step(sys,airplane,control,0);
assert.equal(sys.mode,"airplane");
assert.equal(sys.parts.leftAileron,0);
assert.equal(sys.parts.rightAileron,0);
assert.ok(Math.abs(sys.parts.leftFlap+10*Math.PI/180)<1e-12);
assert.equal(sys.parts.rightFlap,sys.parts.leftFlap);
assert.equal(A.snapshot(sys).engineValue,"10%");
assert.equal(A.snapshot(sys).flapValue,"10°");
assert.match(A.snapshot(sys).disclaimer,/NOT AIRCRAFT DATA/);

control.bank=.65;control.pitch=-.7;control.rudder=-.45;control.flaps=30;
control.throttle=1;
const beforeAngle=sys.rotation,beforePower=sys.powerPct;
for(let i=0;i<20;i++)A.step(sys,airplane,control,.05);
assert.ok(sys.powerPct>beforePower+45,"engine motion should spool up gradually with fictional throttle");
assert.ok(sys.powerPct<101);
assert.ok(sys.rotation!==beforeAngle);
assert.ok(sys.rotation>=0&&sys.rotation<2*Math.PI);
assert.ok(sys.parts.leftAileron<0&&sys.parts.rightAileron>0,"aileron surfaces deflect oppositely");
assert.equal(sys.parts.leftAileron,-sys.parts.rightAileron);
assert.ok(sys.parts.elevatorLeft>0&&sys.parts.elevatorRight>0,
 "simulated nose-up command moves both elevator surfaces");
assert.ok(sys.parts.rudder<0);
assert.equal(sys.parts.rudderLeft,sys.parts.rudder);
assert.equal(sys.parts.rudderRight,sys.parts.rudder);
assert.ok(Math.abs(sys.parts.leftFlap+Math.PI/6)<1e-12,"full flap selection moves illustrated flap geometry");
assert.equal(sys.parts.rightFlap,sys.parts.leftFlap);
assert.equal(A.snapshot(sys).engineLabel,"ENGINE MOTION · SIM");
assert.equal(A.snapshot(sys).powerValue,"100%");
assert.equal(A.snapshot(sys).flapValue,"30°");
const timeBefore=sys.time,powerBefore=sys.powerPct,angleBefore=sys.rotation;
A.step(sys,airplane,control,0);
assert.equal(sys.time,timeBefore,"a paused frame cannot advance time");
assert.equal(sys.rotation,angleBefore,"a paused frame cannot spin propeller");
assert.equal(sys.powerPct,powerBefore);

control.throttle=0;
for(let i=0;i<24;i++)A.step(sys,airplane,control,.05);
assert.ok(sys.powerPct<80,"engine motion winds down when throttle decreases");
assert.equal(A.snapshot(sys).powerValue,"0%");
assert.equal(A.snapshot(sys).motionValue,"ANIMATED","idle propeller illustration remains moving");
assert.throws(()=>A.create("jet"),/Unknown/);
assert.throws(()=>A.step(A.create("airplane"),M.makeState("helicopter"),control,.1),/mode must match/);

const rotorState=M.makeState("helicopter"),rotorInput=M.makeInput("helicopter");
const rotor=A.create("helicopter");A.step(rotor,rotorState,rotorInput,0);
assert.equal(A.snapshot(rotor).engineLabel,"ROTOR SPEED · SIM");
assert.equal(A.snapshot(rotor).powerLabel,"COLLECTIVE · SIM");
assert.equal(A.snapshot(rotor).flapLabel,"BLADE PITCH · SIM");
assert.equal(A.snapshot(rotor).powerValue,"48%");
const initialRotor=rotor.rotation;
rotorInput.collective=.85;rotorInput.rudder=.7;rotorInput.bank=.2;
for(let i=0;i<8;i++)A.step(rotor,rotorState,rotorInput,.05);
assert.ok(rotor.rotation!==initialRotor);
assert.ok(rotor.parts.mainRotor>=0&&rotor.parts.mainRotor<2*Math.PI);
assert.ok(rotor.parts.tailRotor>=0&&rotor.parts.tailRotor<2*Math.PI);
assert.ok(rotor.parts.rotorPitch>0);
assert.ok(rotor.parts.tailPitch>0);
assert.equal(A.snapshot(rotor).powerValue,"85%");
assert.notEqual(A.snapshot(rotor).flapValue,"0%");
const rotorPowerBefore=rotor.powerPct;
rotorInput.collective=.25;
for(let i=0;i<8;i++)A.step(rotor,rotorState,rotorInput,.05);
assert.ok(Math.abs(rotor.powerPct-rotorPowerBefore)<5,
 "conceptual collective movement must not imply a large change in rotor RPM");
assert.ok(rotor.parts.rotorPitch<0);

const planeParts=T.buildMovingParts("airplane");
const rotorParts=T.buildMovingParts("helicopter");
assert.deepEqual(planeParts.map(p=>p.name),[
 "propeller","leftAileron","rightAileron","leftFlap","rightFlap","elevatorLeft","elevatorRight","rudder"
]);
assert.ok(planeParts.find(p=>p.name==="propeller").mesh.vertices>=24,
 "The rotating two-blade propeller must contain tapered 3D blade faces");
assert.ok(planeParts.filter(p=>p.name.includes("Aileron")||p.name.includes("Flap"))
 .every(p=>p.pivot[1]>.85),"All wing controls pivot at high-wing height");
assert.deepEqual(rotorParts.map(p=>p.name),["mainRotor","tailRotor"]);
for(const part of [...planeParts,...rotorParts]){
 assert.ok([1,2,3].includes(part.axis));
 assert.equal(part.pivot.length,3);
 assert.ok(part.pivot.every(Number.isFinite));
 assert.ok(part.mesh.vertices>0);
 assert.equal(part.mesh.positions.length,part.mesh.vertices*3);
 assert.equal(part.mesh.normals.length,part.mesh.positions.length);
 assert.equal(part.mesh.colors.length,part.mesh.positions.length);
 assert.ok([...part.mesh.positions].every(Number.isFinite));
}
assert.throws(()=>T.buildMovingParts("jet"),/Unknown animated craft mode/);
assert.ok(T.buildVehicle("helicopter").vertices>50,"helicopter static fuselage preserved");
console.log("Animated aircraft systems passed: engine spool, moving propeller, opposing ailerons, flaps, elevator, rudder, independent rotor RPM/collective pitch and 10 hinged 3D meshes.");
