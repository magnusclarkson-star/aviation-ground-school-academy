import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const E=require("../flight-sim-environment.js");
const M=require("../flight-sim-model.js");
const I=require("../flight-sim-instruments.js");
const G=require("../flight-sim-guidance.js");

function advance(state,input,seconds){
 for(let i=0;i<Math.round(seconds/.05);i++){
  M.step(state,input,.05);
  if(["halted","landed","complete"].includes(state.phase))break;
 }
 return state;
}
assert.deepEqual(Object.keys(E.profiles),["trainer","sport","touring"]);
assert.deepEqual(Object.keys(E.winds),["calm","crosswind","headwind","gusts"]);
assert.equal(E.selectProfile("trainer").rotationKt,47);
assert.equal(E.selectWind("crosswind").x,4.5);
assert.equal(E.describeWind("calm"),"Calm conditions");
assert.equal(E.windAt("calm",24).speedKt,0);
assert.equal(E.windAt("crosswind",24).x,4.5);
assert.ok(E.windAt("headwind",0).z<0);
assert.notEqual(E.windAt("gusts",0).x,E.windAt("gusts",4).x);
assert.deepEqual(E.windAt("gusts",3),E.windAt("gusts",3),"gusts must be deterministic");
assert.ok(E.compassTrack(5,0)>80&&E.compassTrack(5,0)<100);
assert.equal(E.compassTrack(0,-1),180);
assert.throws(()=>E.selectProfile("airbus"),/Unknown fictional/);
assert.throws(()=>E.selectWind("storm"),/Unknown fictional/);
assert.throws(()=>M.makeState("airplane","approach",{profileId:"not-a-profile"}),/Unknown fictional/);
assert.throws(()=>M.makeState("airplane","approach",{windId:"not-a-wind"}),/Unknown fictional/);
assert.throws(()=>M.makeState("airplane","approach",null),/Invalid simulator settings/);

const basic=M.makeState("airplane","approach");
assert.equal(basic.profileId,"trainer");
assert.equal(basic.windId,"calm");
assert.equal(basic.speedKt,73);
assert.equal(basic.altitudeM,84);
const sport=M.makeState("airplane","approach",{profileId:"sport"});
const touring=M.makeState("airplane","approach",{profileId:"touring"});
assert.equal(sport.speedKt,67);
assert.equal(touring.speedKt,84);

const input=M.makeInput();
input.bank=.8;input.pitch=-.65;input.throttle=.78;input.flaps=10;
const standard=M.makeState("airplane","approach");
const responsive=M.makeState("airplane","approach",{profileId:"sport"});
const steady=M.makeState("airplane","approach",{profileId:"touring"});
advance(standard,input,1.25);
advance(responsive,input,1.25);
advance(steady,input,1.25);
assert.ok(responsive.rollDeg>standard.rollDeg, "sport handling banks more promptly than default");
assert.ok(standard.rollDeg>steady.rollDeg, "touring handling banks more gently than default");
assert.ok(responsive.pitchDeg>steady.pitchDeg);
assert.ok(steady.speedKt>responsive.speedKt,"fictional touring profile retains a higher airspeed");
assert.equal(I.snapshot({...M.makeState("airplane","approach",{profileId:"touring"}),onGround:false,speedKt:50}).speedWarning,false);
assert.equal(I.snapshot({...M.makeState("airplane","approach",{profileId:"touring"}),onGround:false,speedKt:48}).speedWarning,true);
assert.equal(I.snapshot({...M.makeState("airplane","approach",{profileId:"sport"}),onGround:false,speedKt:37}).speedWarning,true);
assert.equal(I.snapshot({...M.makeState("airplane","approach",{profileId:"sport"}),onGround:false,speedKt:39}).speedWarning,false);

const same=M.makeInput();
same.throttle=.49;same.flaps=20;same.pitch=.22;
const clear=M.makeState("airplane","approach",{windId:"calm"});
const cross=M.makeState("airplane","approach",{windId:"crosswind"});
const head=M.makeState("airplane","approach",{windId:"headwind"});
advance(clear,same,6);
advance(cross,same,6);
advance(head,same,6);
assert.equal(clear.windXMps,0);
assert.ok(Math.abs(clear.xM)<.2);
assert.ok(cross.xM>20,"crosswind should displace fictional airborne aircraft laterally");
assert.ok(cross.trackDeg>0&&cross.trackDeg<30);
assert.ok(Math.abs(cross.headingDeg)<1,"wind changes ground track without changing the aircraft nose direction");
assert.equal(cross.speedKt,clear.speedKt,"airborne wind changes ground speed, not indicated airspeed");
assert.ok(cross.groundSpeedKt>clear.groundSpeedKt,"sideways ground motion changes ground speed");
assert.ok(head.groundSpeedKt<clear.groundSpeedKt,"imaginary headwind reduces groundspeed");
assert.ok(head.zM<clear.zM,"headwind shortens the ground distance covered");
assert.equal(head.speedKt,clear.speedKt);
assert.equal(E.compassTrack(0,0),0);
assert.match(G.guidance({...clear,phase:"approach",xM:0,verticalMs:-1,speedKt:73,windId:"headwind"},same).tag,/WIND AND GROUND TRACK/);
assert.match(G.guidance({...clear,phase:"flight",windId:"crosswind"},same).tag,/WIND AND TRACK/);
assert.equal(G.guidance({...clear,phase:"flight",windId:"calm"},same).tag,"FREE FLIGHT · BANK AND LEVEL");

const gusts=M.makeState("airplane","approach",{windId:"gusts"});
advance(gusts,same,5);
assert.ok(gusts.xM>6);
assert.ok(Math.abs(gusts.windXMps-2.8)>.01,"varying wind is reflected in the display state");

const rotor=M.makeState("helicopter","runway",{windId:"crosswind"});
const rotorIn=M.makeInput("helicopter");rotorIn.collective=.82;
advance(rotor,rotorIn,6);
assert.ok(!rotor.onGround);
assert.ok(rotor.xM>10,"rotorcraft should also drift in the fictional crosswind");
assert.equal(rotor.profileId,"rotor");
assert.equal(rotor.windId,"crosswind");
assert.ok(rotor.trackDeg>30,"hover-like drift changes ground track");
assert.equal(I.snapshot(rotor).offsetLabel,"PAD OFFSET");

console.log("Aircraft/environment tests passed: 3 distinct fictional profiles, 4 deterministic wind settings, heading/track separation, crosswind and headwind drift, rotorcraft wind and profile-aware cues.");
