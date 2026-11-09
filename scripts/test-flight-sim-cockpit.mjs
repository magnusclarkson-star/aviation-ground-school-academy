import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const UI=require("../flight-sim-cockpit.js");
const Backlight=require("../flight-sim-instrument-backlight.js");
assert.deepEqual([...Backlight.MODES],["green","blue","off"]);
assert.equal(Backlight.normalize("green"),"green");
assert.equal(Backlight.normalize("blue"),"blue");
assert.equal(Backlight.normalize("off"),"off");
assert.equal(Backlight.normalize("invalid"),"green",
 "unsupported colour falls back to readable green cockpit lighting");

const profiles=UI.FRAMES;
assert.equal(profiles.length,7,"Cessna, Robinson and five fighter panels");
assert.deepEqual(profiles.map(p=>p.id),["c172","r44","fa18","f22","f35","typhoon","su37"]);
assert.equal(new Set(profiles.map(p=>p.id)).size,7);
assert.equal(UI.byId("r44").control,"cyclic");
assert.equal(UI.byId("c172").control,"yoke");
for(const p of profiles){
 assert.ok(p.caption.length>15);
 if(p.family==="jet"){assert.equal(p.control,"stick");assert.notEqual(p.layout,"analog")}
 else assert.equal(p.layout,"analog");
}
const state={mode:"airplane",speedKt:73,altitudeM:91.44,verticalMs:2.2,
 headingDeg:185.4,pitchDeg:8,rollDeg:-11,groundSpeedKt:69.2};
const inputs={bank:0,pitch:0,rudder:0,throttle:.7,collective:.55,flaps:10};
const x=UI.snapshot(state,{powerPct:71},inputs,"c172");
assert.equal(x.values.speed,73);
assert.equal(x.values.alt,300,"metres convert to feet");
assert.equal(x.values.heading,"185");
assert.equal(x.values.pitch,8);
assert.equal(x.values.bank,-11);
assert.equal(x.values.power,70);
assert.ok(x.angles.alt>=0&&x.angles.alt<360);
assert.ok(Math.abs(x.angles.alt-108)<.1,"altimeter long hand: 300 ft advances 108 degrees");
assert.ok(x.slip>0&&x.slip<.2,"slip ball reflects combined rudder/bank proxy");
const eastern=UI.snapshot({...state,headingDeg:90,altitudeM:152.4,rollDeg:0},
 {powerPct:71},{...inputs,rudder:1},"c172");
assert.equal(eastern.heading,90);
assert.equal(eastern.values.heading,"090");
assert.ok(Math.abs(eastern.angles.alt-180)<.01,"500 ft long altimeter needle points down");
assert.equal(eastern.slip,.72,"rudder offset moves the slip ball");
const heli=UI.snapshot({...state,mode:"helicopter"},{powerPct:84},inputs,"r44");
assert.equal(heli.values.rpm,84);
assert.equal(heli.values.power,55);
assert.equal(heli.values.alt,300);
assert.equal(heli.values.heading,'185','R44 heading instrument tracks the same aircraft heading');
assert.ok(Number.isFinite(heli.angles.rpm));
const fighter=UI.snapshot(state,{powerPct:91},inputs,"f35");
assert.equal(fighter.profile,"f35");
assert.equal(fighter.values.speed,73,"fighter style does not invent new dynamics");
assert.equal(fighter.values.heading,"185");
const safe=UI.snapshot({mode:"airplane",speedKt:-100,altitudeM:-10,
 headingDeg:-725,pitchDeg:Infinity,rollDeg:NaN,verticalMs:0},{powerPct:999},{throttle:500},"fa18");
assert.equal(safe.values.speed,0);
assert.equal(safe.values.alt,0);
assert.equal(safe.values.rpm,100);
for(const val of Object.values(safe.angles))assert.ok(Number.isFinite(val));
console.log("Integrated panel profiles passed: C172, R44, F/A-18, F-22, F-35, Typhoon and Su-37 stylisations.");
