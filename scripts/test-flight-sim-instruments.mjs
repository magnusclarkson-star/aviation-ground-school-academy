import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const I=require("../flight-sim-instruments.js");
const M=require("../flight-sim-model.js");

const initial=I.snapshot(M.makeState("airplane"));
assert.equal(initial.heading,"000°");
assert.equal(initial.speed,"0");
assert.equal(initial.height,"0");
assert.equal(initial.vertical,"+0.0 m/s");
assert.equal(initial.orientation,"PITCH 0° · BANK 0°");
assert.equal(initial.offsetLabel,"RUNWAY OFFSET");
assert.equal(initial.offsetPixel,0);
assert.equal(initial.speedWarning,false);
assert.equal(initial.horizonTransform,"translate(120 82.00) rotate(0.00) translate(-120 -82)");

const noseUp=I.snapshot({...M.makeState("airplane"),pitchDeg:10,rollDeg:25,
 headingDeg:359.8,altitudeM:142.6,verticalMs:2.4,speedKt:68.8,xM:18});
assert.match(noseUp.horizonTransform,/translate\(120 109\.00\) rotate\(-25\.00\)/,
 "nose-up attitude moves horizon down and right bank rolls the horizon left");
assert.equal(noseUp.heading,"000°");
assert.equal(noseUp.speed,"69");
assert.equal(noseUp.height,"143");
assert.equal(noseUp.vertical,"+2.4 m/s");
assert.equal(noseUp.offsetPixel,14);
assert.equal(noseUp.offsetText,"18 m");
assert.equal(noseUp.speedWarning,false);

const noseDown=I.snapshot({...M.makeState("airplane"),pitchDeg:-7,rollDeg:-16,headingDeg:-12,
 altitudeM:-4,verticalMs:-4.8,speedKt:29,xM:-180,onGround:false});
assert.match(noseDown.horizonTransform,/translate\(120 63\.10\) rotate\(16\.00\)/);
assert.equal(noseDown.heading,"348°");
assert.equal(noseDown.height,"0","do not show a negative above-ground level");
assert.equal(noseDown.speedWarning,true);
assert.equal(noseDown.offsetPixel,-60,"lateral displacement marker is clamped");
assert.equal(noseDown.vertical,"-4.8 m/s");

const heli=I.snapshot({...M.makeState("helicopter"),lateralMs:5,headingDeg:95.2});
assert.equal(heli.offsetLabel,"PAD OFFSET");
assert.equal(heli.slipPixel,16);
assert.equal(heli.heading,"095°");

assert.throws(()=>I.snapshot(null),/state required/);
assert.throws(()=>I.snapshot({mode:"paraglider"}),/state required/);

const elems=new Map();
const ids=["pfdHorizonMotion","pfdHeading","pfdSpeed","pfdAltitude","pfdVerticalRate","pfdAttitude",
 "pfdSlipDot","pfdSpeedStatus","offsetLabel","alignmentMarker","alignmentOffset"];
for(const id of ids)elems.set(id,{attributes:{},style:{},textContent:"",
 setAttribute(name,value){this.attributes[name]=value}});
const doc={getElementById:id=>{assert.ok(elems.has(id),"DOM rendering missing ID "+id);return elems.get(id)}};
I.paint(doc,{...M.makeState("airplane","approach"),pitchDeg:6,rollDeg:11,speedKt:38,
 verticalMs:-2.2,xM:23,onGround:false});
assert.match(elems.get("pfdHorizonMotion").attributes.transform,/rotate\(-11\.00\)/);
assert.equal(elems.get("pfdSpeed").textContent,"38");
assert.equal(elems.get("pfdSpeed").attributes.fill,"#ffe7a0","illustrative low-speed caution");
assert.match(elems.get("pfdSpeedStatus").textContent,/LOW ENERGY/);
assert.equal(elems.get("alignmentMarker").style.transform,"translateX(17px)");
assert.equal(elems.get("alignmentOffset").textContent,"23 m");
assert.match(elems.get("alignmentMarker").attributes["aria-label"],/RUNWAY OFFSET/);

console.log("Immersive simulated PFD passed: pitch and bank horizon, heading, speed/height, climb-rate, low-energy cue, helicopter pad offset and text-only DOM updates.");
