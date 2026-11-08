import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const X=require("../flight-sim-exercises.js");
const V=require("../flight-sim-instructor-voice.js");

const session=X.begin("cgTransfer","trainer");
const beginText=V.script(X,session,"lesson","scouts");
assert.match(beginText,/Air Scout discovery exercise/);
assert.match(beginText,/Moving a load aft/);
assert.match(beginText,/not an assessed pilot lesson/);
assert.match(beginText,/awaiting subject-matter-expert review/);
assert.ok(beginText.length<=V.MAX_CHARS);
assert.ok(!beginText.includes("AI-generated"));
assert.equal(V.MAX_CHARS<=900,true);
const pilotText=V.script(X,session,"lesson","pilots");
assert.match(pilotText,/Aviation ground-school concept review/);
assert.notEqual(pilotText,beginText);
assert.match(V.script(X,session,"comparison","scouts"),/Apply the Reference setup first/);
assert.match(V.script(X,session,"feedback","scouts"),/No checked explanation is available yet/);
assert.throws(()=>V.script(X,null),/valid scripted exercise/);
assert.throws(()=>V.script(X,session,"remote"),/valid scripted exercise/);
assert.throws(()=>V.script(X,session,"lesson","unknown"),/Unknown narration learning path/);

for(const step of ["reference","comparison"]){
 const current=X.values("cgTransfer",step,"trainer");
 assert.equal(X.record(session,step,{
  profileId:current.profileId,loadout:current.loadout,flaps:current.flaps
 }).ok,true);
}
const compared=V.script(X,session,"comparison","pilots");
assert.match(compared,/Comparison − Reference/);
assert.match(compared,/moment/);
assert.match(compared,/imaginary/);
assert.match(compared,/not an assessed pilot lesson/);
assert.ok(compared.length<=850);
const checked=X.review(session,"aft");
assert.equal(checked.status,"matches-model");
const feedback=V.script(X,session,"feedback","pilots");
assert.match(feedback,/practice self-check/);
assert.match(feedback,/not an assessed pilot lesson/);
assert.ok(feedback.length<=850);
assert.ok(!/studentId|accountId|email|passport|recording/i.test(
 V.script(X,session,"lesson","pilots")
),"spoken text is solely the fixed educational script");

for(const id of Object.keys(X.DEFINITIONS)){
 const s=X.begin(id,"trainer");
 for(const kind of ["lesson","comparison","feedback"]){
  const text=V.script(X,s,kind,"scouts");
  assert.ok(text.length>100&&text.length<=850);
  assert.match(text,/awaiting subject-matter-expert review/);
  assert.match(text,/not an assessed pilot lesson/);
 }
}
console.log("Instructor voice scripts passed: four existing lessons, Scout/pilot phrasing, comparison evidence, feedback, strict length and mandatory unapproved-use notice.");
