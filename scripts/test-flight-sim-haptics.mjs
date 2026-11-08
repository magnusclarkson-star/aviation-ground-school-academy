import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const H=require("../flight-sim-haptics.js");
const seen=[],documentLike={hidden:false};
let timestamp=1000;
const nav={vibrate(pattern){seen.push(pattern);return true}};
const h=H.createHaptics({navigatorLike:nav,documentLike,clock:()=>timestamp});
assert.equal(h.supported,true);
assert.equal(h.isEnabled(),false);
assert.equal(h.pulse("touchdown"),false,"vibration is opt-in only");
assert.equal(seen.length,0,"off state must not invoke vibration");
assert.equal(h.setEnabled(true),true);
assert.equal(h.pulse("control"),true);
assert.deepEqual(seen[0],[9]);
timestamp+=180;assert.equal(h.pulse("control"),false,"no high-frequency pulses");
timestamp+=180;assert.equal(h.pulse("control"),true,"small pulse resumes after limit");
timestamp+=300;
assert.equal(h.pulse("turn"),true);
timestamp+=300;
assert.equal(h.pulse("turn"),false,"turn-specific cooldown applies");
timestamp+=400;
assert.equal(h.pulse("turbulence"),true);
documentLike.hidden=true;
timestamp+=3000;
assert.equal(h.pulse("hardLanding"),false,"background tab cannot vibrate");
documentLike.hidden=false;
assert.equal(h.pulse("hardLanding"),true);
assert.ok(Array.isArray(seen.at(-1))&&seen.at(-1).reduce((sum,n)=>sum+n,0)<=200);
timestamp+=600;assert.equal(h.pulse("does-not-exist"),false);
h.setEnabled(false);assert.equal(h.isEnabled(),false);
assert.equal(seen.at(-1),0,"disabling cancels remaining vibration");
const silent=H.createHaptics({navigatorLike:{},documentLike,clock:()=>timestamp});
assert.equal(silent.supported,false);
assert.equal(silent.setEnabled(true),false);
assert.equal(silent.pulse("liftoff"),false);
const failure=H.createHaptics({
 navigatorLike:{vibrate(){throw Error("device refused")}},documentLike,clock:()=>timestamp
});
assert.equal(failure.setEnabled(true),true);
assert.equal(failure.pulse("touchdown"),false,"unsupported hardware must never crash");
for(const [kind,pattern] of Object.entries(H.patterns)){
 assert.ok(pattern.length>=1&&pattern.length<=3);
 assert.ok(pattern.every(n=>Number.isInteger(n)&&n>=0&&n<=80));
 assert.ok(pattern.reduce((sum,n)=>sum+n,0)<=200,kind+" exceeds gentle duration cap");
}
console.log("Flight haptics passed: explicit opt-in, cooldown, hidden-tab denial, bounded patterns, cancellation and unavailable-device fallback.");
