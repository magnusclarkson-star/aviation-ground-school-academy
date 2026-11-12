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
assert.equal(sys.parts.propBlurOpacity,0,"idling propeller has no opaque blur disc");
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
assert.ok(sys.parts.propBlurOpacity>0&&sys.parts.propBlurOpacity<=.14,"fast Cessna propeller has an appropriately subtle blur sweep");
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

// A frozen lesson must let students explore control-surface geometry
// without unpausing or moving the aircraft. The UI invokes this zero-step
// preview on flap detents, pedals and touch yoke input.
// C172 gear is fixed, but the illustrated hub paint should turn during
// taxi, roll and landing. It must freeze when the simulation is paused.
const rollingState=M.makeState("airplane","runway",{airframeId:"c172"});
const rollingInput=M.makeInput("airplane"),rolling=A.create("airplane");
rollingState.speedKt=29;
A.step(rolling,rollingState,rollingInput,.05);
assert.ok(rolling.wheelRate>0,"on-ground wheel spin derives from aircraft speed");
assert.ok(rolling.parts.mainWheels>0&&rolling.parts.noseWheel>0);
assert.notEqual(rolling.parts.mainWheels,rolling.parts.noseWheel,
 "the smaller nose wheel rotates more rapidly at a given ground speed");
const rollingBefore=rolling.parts.mainWheels,noseBefore=rolling.parts.noseWheel;
A.step(rolling,rollingState,rollingInput,0);
assert.equal(rolling.parts.mainWheels,rollingBefore);
assert.equal(rolling.parts.noseWheel,noseBefore);
rollingState.onGround=false;
const airborneRate=rolling.wheelRate;
A.step(rolling,rollingState,rollingInput,.05);
assert.ok(rolling.wheelRate>0&&rolling.wheelRate<airborneRate,
 "wheels coast down in the air without moving the aircraft");
rollingState.onGround=true;rollingState.speedKt=0;
for(let i=0;i<30;i++)A.step(rolling,rollingState,rollingInput,.05);
assert.ok(rolling.wheelRate<.001,
 "braking to a stationary parked aircraft should stop the illustrated wheel spin");
const fighterState=M.makeState("airplane","runway",{airframeId:"f22"});
const fighterSys=A.create("airplane");fighterState.speedKt=50;
A.step(fighterSys,fighterState,rollingInput,.05);
assert.equal(fighterSys.parts.mainWheels,0,
 "C172-style fixed-wheel animation must not be applied to retractable jet gear");
const frozenState=M.makeState("airplane");
const frozenInput=M.makeInput("airplane");
const frozen=A.create("airplane");
A.step(frozen,frozenState,frozenInput,0);
const frozenTime=frozen.time,initialHeading=frozenState.headingDeg;
frozenInput.flaps=30;frozenInput.rudder=1;frozenInput.bank=.8;frozenInput.pitch=-.6;
A.step(frozen,frozenState,frozenInput,0);
assert.equal(A.snapshot(frozen).flapValue,"30°");
assert.ok(Math.abs(frozen.parts.leftFlap+Math.PI/6)<1e-12);
assert.ok(frozen.parts.rudder>.4&&frozen.parts.leftAileron<0&&frozen.parts.rightAileron>0);
assert.ok(frozen.parts.elevatorLeft>0);
assert.equal(frozen.time,frozenTime,"preview cannot advance the clock");
assert.equal(frozen.rotation,0,"preview cannot rotate a stationary propeller");
assert.equal(frozenState.headingDeg,initialHeading,"preview cannot steer the aircraft");
const rotorState=M.makeState("helicopter"),rotorInput=M.makeInput("helicopter");
const rotor=A.create("helicopter");A.step(rotor,rotorState,rotorInput,0);
assert.equal(A.snapshot(rotor).engineLabel,"ROTOR SPEED · SIM");
assert.equal(A.snapshot(rotor).powerLabel,"COLLECTIVE · SIM");
assert.equal(A.snapshot(rotor).flapLabel,"BLADE PITCH · SIM");
assert.equal(A.snapshot(rotor).powerValue,"48%");
assert.equal(rotor.parts.rotorBlurOpacity,0,"new stationary rotor has no motion blur");
const initialRotor=rotor.rotation;
rotorInput.collective=.85;rotorInput.rudder=.7;rotorInput.bank=.2;
rotorInput.pitch=-.4;
for(let i=0;i<8;i++)A.step(rotor,rotorState,rotorInput,.05);
assert.ok(rotor.rotation!==initialRotor);
assert.ok(rotor.parts.mainRotor>=0&&rotor.parts.mainRotor<2*Math.PI);
assert.ok(rotor.parts.tailRotor>=0&&rotor.parts.tailRotor<2*Math.PI);
assert.ok(rotor.parts.rotorBlurOpacity>.07&&rotor.parts.rotorBlurOpacity<=.22,
 "rotor-sweep opacity fades in but stays light enough to see both blades");
const opacity=rotor.parts.rotorBlurOpacity,seconds=rotor.time;
A.step(rotor,rotorState,rotorInput,0);
assert.equal(rotor.time,seconds);
assert.equal(rotor.parts.rotorBlurOpacity,opacity,"pause cannot add rotor motion");
assert.ok(rotor.parts.rotorPitch>0);
assert.ok(rotor.parts.tailPitch>0);
assert.equal(rotor.parts.collectiveLink,rotor.parts.rotorPitch);
assert.equal(rotor.parts.tailPitchLink,rotor.parts.tailPitch);
assert.ok(rotor.parts.swashBank>0&&rotor.parts.swashBank<=.11,
 "R44 swashplate bank ring visibly follows cyclic bank");
assert.ok(rotor.parts.swashPitch>0&&rotor.parts.swashPitch<=.11,
 "R44 swashplate pitch ring follows cyclic pitch");
rotorInput.bank=-.6;rotorInput.pitch=.35;
rotorInput.rudder=-.5;rotorInput.collective=.22;
const rotorBeforePause=rotor.rotation,tailBeforePause=rotor.tailRotation;
A.step(rotor,rotorState,rotorInput,0);
assert.equal(rotor.rotation,rotorBeforePause);
assert.equal(rotor.tailRotation,tailBeforePause);
assert.ok(rotor.parts.collectiveLink<0&&rotor.parts.tailPitchLink<0,
 "paused controls change link pitch but never rotate main or tail rotor");
assert.ok(rotor.parts.swashBank<0&&rotor.parts.swashPitch<0,
 "paused exterior preview updates the cyclic rings without advancing RPM");
assert.equal(A.snapshot(rotor).powerValue,"22%");
assert.notEqual(A.snapshot(rotor).flapValue,"0%");
const rotorPowerBefore=rotor.powerPct;
rotorInput.collective=.25;
for(let i=0;i<8;i++)A.step(rotor,rotorState,rotorInput,.05);
assert.ok(Math.abs(rotor.powerPct-rotorPowerBefore)<5,
 "conceptual collective movement must not imply a large change in rotor RPM");
assert.ok(rotor.parts.rotorPitch<0);

// Su-37 pitch controls both forward canards and aft elevators. The same
// simulated input must not animate non-Su-37 canard overlays.
const su37Flight=M.makeState("airplane","runway",{airframeId:"su37"});
const su37Input=M.makeInput("airplane"),su37Motion=A.create("airplane");
su37Input.pitch=.55;
A.step(su37Motion,su37Flight,su37Input,.05);
assert.ok(Math.abs(su37Motion.parts.canardLeft)>.01,
 "Su-37 foreplanes must move in response to pitch");
assert.equal(su37Motion.parts.canardLeft,su37Motion.parts.elevatorLeft);
assert.equal(su37Motion.parts.canardRight,su37Motion.parts.elevatorRight);
assert.equal(sys.parts.canardLeft,0,
 "C172 cockpit remains free of Su-37 foreplane animation");

// Five fighter profiles have wheel/strut assemblies that retract after
// departure and extend again during the approach. The trainer has fixed gear.
const jetState=M.makeState("airplane","runway",{airframeId:"f35"});
const jetSystem=A.create("airplane"),jetInput=M.makeInput("airplane");
A.step(jetSystem,jetState,jetInput,0);
assert.equal(jetSystem.parts.noseGear,0);
jetState.onGround=false;jetState.altitudeM=240;jetState.verticalMs=3;
for(let i=0;i<60;i++)A.step(jetSystem,jetState,jetInput,.05);
assert.ok(jetSystem.parts.noseGear>1.2,"jet nosewheel retracts after departure");
assert.equal(jetSystem.parts.mainGearLeft,jetSystem.parts.mainGearRight,
 "jet main landing gear retracts together");
jetState.altitudeM=70;jetState.verticalMs=-2;
for(let i=0;i<60;i++)A.step(jetSystem,jetState,jetInput,.05);
assert.ok(jetSystem.parts.noseGear<.4,"jet nosewheel extends ahead of landing");
assert.equal(jetSystem.parts.mainGearLeft,jetSystem.parts.noseGear);
assert.equal(sys.parts.noseGear,0,"Cessna fixed gear never retracts");

// Landing and liftoff animate the airframe without affecting the physics.
for(const mode of ["airplane","helicopter"]){
 const land=A.create(mode),craft=M.makeState(mode),pilot=M.makeInput(mode);
 craft.onGround=false;craft.altitudeM=5;craft.verticalMs=-6;
 A.step(land,craft,pilot,.05);
 assert.equal(land.parts.touchdownBounce,0,mode+" has no airborne landing rebound");
 craft.onGround=true;craft.altitudeM=0;craft.verticalMs=0;
 A.step(land,craft,pilot,.05);
 const rebound=land.parts.touchdownBounce;
 assert.ok(rebound>.02&&rebound<=.22,
  mode+" landing gives a gentle short visual airframe rebound");
 assert.equal(craft.altitudeM,0,"visual bounce must not change real flight altitude");
 A.step(land,craft,pilot,0);
 assert.equal(land.parts.touchdownBounce,rebound,"pause freezes the landing animation");
 for(let i=0;i<32;i++)A.step(land,craft,pilot,.05);
 assert.equal(land.parts.touchdownBounce,0,"touchdown motion settles in under two seconds");
 craft.onGround=false;craft.altitudeM=4;craft.verticalMs=3;
 A.step(land,craft,pilot,.05);
 assert.equal(land.parts.touchdownBounce,0,"liftoff clears the landing animation");
}
const independent=A.create("airplane");
const demo=M.makeState("airplane"),pilot=M.makeInput("airplane");
A.step(independent,demo,pilot,.05);
assert.equal(independent.parts.touchdownBounce,0,
 "standing on runway must not constantly shake the model");

const planeParts=T.buildMovingParts("airplane");
const rotorParts=T.buildMovingParts("helicopter");
assert.deepEqual(planeParts.map(p=>p.name),[
 "propeller","mainWheels","noseWheel","leftAileron","rightAileron",
 "leftFlap","rightFlap","elevatorLeft","elevatorRight","rudder"
]);
assert.ok(planeParts.find(p=>p.name==="propeller").mesh.vertices>=24,
 "The rotating two-blade propeller must contain tapered 3D blade faces");
assert.ok(planeParts.filter(p=>p.name.includes("Aileron")||p.name.includes("Flap"))
 .every(p=>p.pivot[1]>.85),"All wing controls pivot at high-wing height");
assert.deepEqual(rotorParts.map(p=>p.name),
 ["swashBank","swashPitch","collectiveLink","mainRotor","tailPitchLink","tailRotor"]);
for(const name of ["collectiveLink","tailPitchLink"]){
 const link=rotorParts.find(part=>part.name===name);
 assert.ok(link.mesh.triangles>=20&&link.mesh.triangles<=28,
  "R44 control linkage must remain tiny enough for phone rendering");
 assert.ok([1,2,3].includes(link.axis));
}
for(const name of ["swashBank","swashPitch"]){
 const ring=rotorParts.find(part=>part.name===name);
 assert.ok(ring.mesh.vertices>=72,"visible, lightweight ring geometry");
 assert.ok(ring.pivot[1]>2.5&&ring.pivot[1]<3.0,
  "cyclic ring stays below the actual rotor hub");
}
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
