import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const Skills=require("../cockpit-v3-skills.js");
const M=require("../cockpit-v3-model.js");
assert.deepEqual(Skills.ids,["level","climb","turn","descent","flap"]);
assert.equal(Skills.duration,12);
assert.equal(Skills.threshold,65);
assert.throws(()=>Skills.create("unknown"),/Unknown practice task/);
assert.throws(()=>Skills.report(Skills.create()),/Finish the practice/);
function sample({pitch=0,roll=0,turn=0,slip=0,spd=95,vsi=0,drag=1,flaps=0,alt=3500}={}){
 return {pitch,roll,turnRate:turn,slip,speed:spd,verticalSpeed:vsi,dragIndex:drag,flaps,altitude:alt,heading:270};
}
function attempt(id,flight,control){
 const session=Skills.create(id);Skills.begin(session);
 for(let i=0;i<120;i++)Skills.observe(session,flight,control,.1);
 return session;
}
const inputs=M.makeInput();
for(const [id,values,inputChanges] of [
 ["level",{pitch:0,roll:0,turn:0,spd:102},{}],
 ["climb",{pitch:9,roll:1,spd:90,vsi:850},{throttle:88}],
 ["turn",{pitch:0,roll:18,turn:1.7,slip:.04,spd:92},{}],
 ["descent",{pitch:-7,roll:2,spd:97,vsi:-850},{}],
 ["flap",{flaps:20,drag:1.42,spd:87},{flaps:20}]
]){
 const s=attempt(id,sample(values),{...inputs,...inputChanges});
 assert.equal(s.status,"finished",id+" must finish");
 assert.equal(s.total,120,id+" sample count");
 assert.equal(s.percent,100,id+" should match example objective");
 assert.equal(s.passed,true,id+" should pass");
 assert.ok(s.maxStreak>=120);
 const prev=s.total;Skills.observe(s,sample(values),inputs,.1);assert.equal(s.total,prev,"samples freeze once finished");
 const report=Skills.report(s,"2026-11-07T19:47:00Z");
 assert.equal(report.schema,"agsa.practice-observation.v1");
 assert.match(report.disclaimer,/UNOFFICIAL/);
 assert.equal(report.task.id,id);
 assert.equal(report.observation.outcome,"PRACTICE_TARGET_MET");
 assert.equal(report.createdAt,"2026-11-07T19:47:00Z");
 assert.ok(!("learner" in report)&&!("certificate" in report),"no identity or certification claim");
}
const bad=attempt("climb",sample({pitch:-12,vsi:-1000}),{...inputs,throttle:20});
assert.equal(bad.percent,0);
assert.equal(bad.passed,false);
assert.equal(Skills.report(bad,"2026-11-07T19:47:00Z").observation.outcome,"PRACTICE_AGAIN");
const early=Skills.create("turn");Skills.begin(early);
for(let i=0;i<20;i++)Skills.observe(early,sample({roll:20,turn:1.5,slip:0}),inputs,.1);
Skills.finish(early,"ended");
assert.equal(early.passed,false);
assert.equal(Skills.report(early,"2026-11-07T19:47:00Z").observation.outcome,"INCOMPLETE");
const s=Skills.create("level");Skills.begin(s);
for(let i=0;i<72;i++)Skills.observe(s,sample({pitch:0,roll:0,turn:0,spd:95}),inputs,.1);
for(let i=0;i<48;i++)Skills.observe(s,sample({pitch:20,roll:40,spd:160,turn:6}),inputs,.1);
assert.equal(s.percent,60);
assert.equal(s.passed,false,"below 65% fails");
assert.equal(s.status,"finished");
console.log("Skills engine checks passed: five synthetic tasks, timing, passing/failing threshold, incomplete attempts, unofficial report privacy.");
