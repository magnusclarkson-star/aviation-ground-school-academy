import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const Mission=require("../cockpit-v3-mission.js");
function drive(s,limit,predicate){
 for(let i=0;i<limit;i++){
  Mission.step(s,.025);
  if(predicate(s))return i;
 }
 throw new Error("Mission checkpoint not reached: "+s.phase+" "+JSON.stringify({speed:s.state.speed,alt:s.state.altitude,vsi:s.state.verticalSpeed,flaps:s.state.flaps,message:s.message}));
}
const s=Mission.make();
assert.equal(s.phase,"roll");
assert.equal(s.state.altitude,0);
assert.equal(s.state.speed,0);
assert.equal(s.state.grounded,true);
s.input.throttle=90;s.input.flaps=10;
drive(s,300,p=>p.state.speed>=52);
assert.equal(s.state.altitude,0,"Aircraft stays on ground before nose-up command");
s.input.yokeY=-.55;
drive(s,150,p=>p.phase==="climb");
assert.equal(s.state.grounded,false,"Takeoff should transition into airborne phase");
drive(s,400,p=>p.phase==="climbReady");
assert.ok(s.state.altitude>=80);
const oldAltitude=s.state.altitude;
Mission.approach(s);
assert.equal(s.phase,"approach");
assert.equal(s.state.altitude,230,"Reposition to training approach is explicit");
assert.ok(Math.abs(oldAltitude-s.state.altitude)>5,"Landing task uses a clearly separate repositioned practice segment");
s.input.flaps=20;s.input.throttle=40;s.input.yokeY=.16;
drive(s,700,p=>p.phase==="landing");
assert.ok(s.state.altitude<=100);
assert.ok(s.state.verticalSpeed<0);
s.input.flaps=30;s.input.throttle=35;s.input.yokeY=-.12;
drive(s,1200,p=>p.phase==="rollout");
assert.ok(s.landing.stable,"Landing should be within illustrative speed/descent/roll gates");
assert.ok(s.state.grounded);
s.input.throttle=0;s.input.yokeY=0;
drive(s,300,p=>p.phase==="complete");
assert.equal(s.completed,true);
assert.ok(s.score>=4);

const bad=Mission.make("approach");
bad.input.flaps=0;bad.input.throttle=0;bad.input.yokeY=.18;
drive(bad,700,p=>p.phase==="review");
assert.equal(bad.phase,"review","Unstable approach should not be accepted");
Mission.goAround(bad);
assert.equal(bad.phase,"climb","Go-around restarts illustrative climb");
assert.ok(bad.state.altitude>=90);
assert.equal(bad.input.throttle,86);
assert.equal(bad.input.flaps,10);
Mission.setup(bad,"landing");
assert.equal(bad.phase,"landing");
assert.equal(bad.state.altitude,85);

console.log("Guided V3 checkpoints passed: zero-speed roll, deliberate liftoff, climb gate, explicit approach reposition, stabilized approach, landing, rollout, unstable review and go-around.");
