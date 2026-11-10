import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const N=require("../flight-sim-navigation.js");
const zero=N.coordinates({xM:0,zM:0,headingDeg:0,trackDeg:0,groundSpeedKt:0});
assert.equal(zero.worldTransform,"translate(110 82) rotate(0.00) scale(0.04800 -0.04800) translate(0.00 0.00)");
assert.equal(zero.trackRotation,"rotate(0.00 110 82)");
assert.equal(zero.positionText,"E0 N0");
assert.equal(zero.waypointRotation,null,"waypoint arrow hidden without an active circuit");
const circuitState={mode:"airplane",scenario:"runway",phase:"flight",onGround:false,
 xM:0,zM:1750,headingDeg:0,trackDeg:0,groundSpeedKt:75};
const nextRight=N.coordinates(circuitState,{stage:"crosswind"});
assert.equal(nextRight.waypointRotation,"rotate(60.95 110 82)",
 "an off-screen eastern circuit waypoint points right from northbound flight");
const towardWest=N.coordinates({...circuitState,headingDeg:90},{stage:"crosswind"});
assert.equal(towardWest.waypointRotation,"rotate(-29.05 110 82)",
 "turning east moves the same waypoint to the aircraft's left");
const heli=N.coordinates({mode:"helicopter",scenario:"helipad",xM:0,zM:0,
 headingDeg:0,trackDeg:0,groundSpeedKt:0});
assert.equal(heli.isHelipad,true,"R44 moving map uses the helipad, not the runway");
assert.equal(heli.padText,"PAD CENTER");
assert.equal(heli.waypointRotation,null,"no directional pointer needed at pad centre");
assert.ok(heli.scale>.45,"R44 pad is readable at mobile map scale");
const padWest=N.coordinates({mode:"helicopter",scenario:"helipad",xM:30,zM:0,
 headingDeg:0,trackDeg:0,groundSpeedKt:3});
assert.match(padWest.padText,/PAD 30 m · BRG 270° · L/);
assert.equal(padWest.waypointRotation,"rotate(-90.00 110 82)");
const padAhead=N.coordinates({mode:"helicopter",scenario:"helipad",xM:0,zM:-60,
 headingDeg:0,trackDeg:0,groundSpeedKt:3});
assert.match(padAhead.padText,/PAD 60 m · BRG 000° · AHEAD/);
const hoverFixed={mode:"helicopter",scenario:"helipad",phase:"hover",
 onGround:false,xM:2,zM:1,altitudeM:5,verticalMs:.1,
 yawRateDegS:1,groundSpeedKt:1,hoverHoldSec:4.8};
const fixedHover=N.coordinates(hoverFixed);
assert.equal(fixedHover.hoverStable,true);
assert.equal(fixedHover.hoverAirborne,true);
assert.equal(fixedHover.hoverText,"HOV 4/8");
const sliding=N.coordinates({...hoverFixed,groundSpeedKt:5});
assert.equal(sliding.hoverStable,false);
assert.equal(sliding.hoverText,"DRIFT");
const descending=N.coordinates({...hoverFixed,verticalMs:-1.3});
assert.equal(descending.hoverStable,false);
assert.equal(descending.hoverText,"VERT");
const padded=N.coordinates({...hoverFixed,onGround:true});
assert.equal(padded.hoverAirborne,false);
assert.equal(padded.hoverText,null);
const inactive=N.coordinates(circuitState,{stage:"landed"});
assert.equal(inactive.waypointRotation,null,"pointer disappears after the circuit ends");
const arriving=N.coordinates({xM:-230.5,zM:-1450,headingDeg:90,trackDeg:100,groundSpeedKt:74});
assert.equal(arriving.positionText,"W231 S1450");
assert.match(arriving.worldTransform,/rotate\(-90\.00\)/,"heading-up map rotates opposite aircraft heading");
assert.match(arriving.worldTransform,/translate\(230\.50 1450\.00\)/);
assert.equal(arriving.trackRotation,"rotate(10.00 110 82)");
assert.equal(arriving.groundSpeedKt,74);
const moved=N.coordinates({xM:250,zM:840,headingDeg:275,trackDeg:262,groundSpeedKt:102});
assert.equal(moved.positionText,"E250 N840");
assert.notEqual(moved.worldTransform,arriving.worldTransform);
assert.equal(moved.trackRotation,"rotate(-13.00 110 82)");
const safe=N.coordinates({xM:Infinity,zM:NaN,headingDeg:-90,trackDeg:720,groundSpeedKt:-5});
assert.equal(safe.xM,0);
assert.equal(safe.zM,0);
assert.equal(safe.headingDeg,270);
assert.equal(safe.trackDeg,0);
assert.equal(safe.groundSpeedKt,0);
for(const part of ["worldTransform","trackRotation","positionText"])assert.ok(!safe[part].includes("NaN"));
console.log("Live navigation model passed: movement and heading/track mapping, field-relative positions and bounded inputs.");
