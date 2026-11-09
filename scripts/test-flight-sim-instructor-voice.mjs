import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const X=require("../flight-sim-exercises.js");
const V=require("../flight-sim-instructor-voice.js");
const RV=require("../flight-sim-r44-voice.js");

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
// The stage speaker uses the same browser voice locally, but only after a
// real learner action arms it. A busy ATC or exercise narrator always wins.
let lesson={stage:"takeoff",status:"active"},busy=false,canceled=0;
const utterances=[],listeners={};
const fakeDoc={hidden:false,getElementById:()=>null,
 addEventListener:(name,callback)=>{listeners[name]=callback}};
class Utterance{constructor(text){this.text=text}}
const voice=RV.create({documentLike:fakeDoc,
 windowLike:{speechSynthesis:{speak:u=>utterances.push(u),cancel:()=>{canceled++}},
  SpeechSynthesisUtterance:Utterance,addEventListener:()=>{}},
 getLesson:()=>lesson,isBusy:()=>busy});
assert.equal(voice.supported,true);
assert.equal(voice.status().enabled,true);
assert.equal(voice.update(),false,"page load must not speak without learner gesture");
assert.equal(utterances.length,0);
assert.equal(voice.arm(),true);
assert.equal(utterances.length,1);
assert.match(utterances[0].text,/Lift into a steady hover/);
assert.equal(utterances[0].lang,"en-GB");
assert.equal(utterances[0].rate,.9);
assert.equal(voice.update(),false,"frame repaint must never repeat speech");
lesson={stage:"hover",status:"active"};
assert.equal(voice.update(),true);
assert.match(utterances.at(-1).text,/eight seconds/);
assert.ok(canceled>=1,"new instruction may replace the prior coach utterance");
busy=true;lesson={stage:"turn",status:"active"};
const beforeBusy=utterances.length;
assert.equal(voice.update(),false);
assert.equal(utterances.length,beforeBusy,"ATC blocks the guided voice");
voice.interrupt();
busy=false;
assert.equal(voice.update(),true);
assert.match(utterances.at(-1).text,/ninety degree turn/);
lesson={stage:"return",status:"active"};
assert.equal(voice.update(),true);
assert.match(utterances.at(-1).text,/helipad/);
lesson={stage:"return",status:"completed"};
assert.equal(voice.update(),true);
assert.match(utterances.at(-1).text,/completed the guided/);
assert.equal(voice.update(),false);
assert.equal(voice.toggle(),false);
lesson={stage:"takeoff",status:"active"};
assert.equal(voice.update(),false,"muted lesson must remain silent");
assert.equal(voice.toggle(),true);
assert.match(utterances.at(-1).text,/Robinson helicopter lesson/);
voice.disarm();
assert.equal(voice.update(),false,"paused or different aircraft mode must disarm speech");
voice.arm();
fakeDoc.hidden=true;listeners.visibilitychange();
assert.equal(voice.status().armed,false,"background page disarms voice");
assert.equal(voice.update(),false);
const silent=RV.create({documentLike:fakeDoc,windowLike:{},
 getLesson:()=>lesson});
assert.equal(silent.supported,false);
assert.equal(silent.arm(),false);
assert.equal(silent.update(),false);
for(const [stage,text] of Object.entries(RV.MESSAGES)){
 assert.ok(["takeoff","hover","turn","return","completed","incomplete","stopped"].includes(stage));
 assert.ok(text.length>25&&text.length<170,"stage speech is brief");
}
console.log("Instructor voice scripts passed: four existing lessons, Scout/pilot phrasing, comparison evidence, feedback, strict length and mandatory unapproved-use notice.");
