import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const Skills=require("../cockpit-v3-skills.js");
const Coach=require("../cockpit-v3-coach.js");
const Journal=require("../cockpit-v3-journal.js");
const model=require("../cockpit-v3-model.js");
class FakeStorage{
 constructor(){this.map=new Map()}
 getItem(k){return this.map.has(k)?this.map.get(k):null}
 setItem(k,v){this.map.set(k,String(v))}
 removeItem(k){this.map.delete(k)}
}
function state({pitch=0,roll=0,turnRate=0,slip=0,speed=95,verticalSpeed=0,flaps=0,dragIndex=1}={}){
 return {pitch,roll,turnRate,slip,speed,verticalSpeed,flaps,dragIndex,altitude:3500,heading:270};
}
function complete(id,values={},input={}){
 const session=Skills.create(id);Skills.begin(session);
 for(let i=0;i<120;i++)Skills.observe(session,state(values),{...model.makeInput(),...input},.1);
 assert.equal(session.status,"finished");
 assert.equal(session.telemetry.length,120);
 return session;
}
const level=complete("level");
const good=Coach.analyse(level);
assert.match(good.label,/Automated/);
assert.equal(good.criterionScores.length,4);
assert.equal(good.criterionScores.find(x=>x.id==="pitch").percent,100);
assert.equal(good.improvements.length,0);
assert.equal(good.nextSteps.length,1);
const weak=complete("turn",{roll:0,turnRate:0,slip:.7,speed:92});
const review=Coach.analyse(weak);
assert.equal(review.criterionScores.length,4);
assert.equal(review.criterionScores.find(x=>x.id==="slip").percent,0);
assert.ok(review.improvements.some(x=>x.includes("Turn coordination")));
assert.ok(review.nextSteps.some(x=>x.includes("yoke")||x.includes("turn-rate")||x.includes("slip/skid")));
const partial=Skills.create("climb");Skills.begin(partial);Skills.observe(partial,state(),model.makeInput(),.1);
Skills.finish(partial,"ended");
assert.match(Coach.analyse(partial).headline,/ended early/);
const flap=complete("flap",{flaps:20,dragIndex:1.44,speed:85},{flaps:20});
assert.equal(Coach.analyse(flap).criterionScores.find(x=>x.id==="drag").percent,100);
const store=new FakeStorage();
assert.deepEqual(Journal.read(store),[]);
const r1=Journal.makeRecord(level,good,"2026-11-07T20:00:00.000Z","abc");
assert.equal(r1.taskId,"level");assert.equal(r1.score,100);
assert.equal("learnerName" in r1,false);
assert.equal(Journal.save(store,r1).length,1);
assert.equal(Journal.read(store).length,1);
assert.equal(Journal.save(store,r1).length,1,"upsert by local ID");
for(let i=0;i<23;i++){
 const rec=Journal.makeRecord(flap,Coach.analyse(flap),new Date(Date.UTC(2026,10,7,20,0,i)).toISOString(),"x"+i);
 Journal.save(store,rec);
}
assert.equal(Journal.read(store).length,20,"cap on-device journal to 20");
const first=Journal.read(store)[0].id;
assert.equal(Journal.remove(store,first).length,19);
assert.equal(Journal.exportJournal(store,"2026-11-07T21:00:00.000Z").schema,Journal.schema);
assert.match(Journal.exportJournal(store).disclaimer,/UNVERIFIED/);
Journal.clear(store);
assert.equal(Journal.read(store).length,0);
store.setItem(Journal.key,"not-json");
assert.throws(()=>Journal.read(store),SyntaxError);
assert.throws(()=>Journal.save(store,r1),SyntaxError);
assert.equal(store.getItem(Journal.key),"not-json","do not overwrite malformed local data");
store.removeItem(Journal.key);
const bad={...r1,taskId:"test",score:110};
assert.equal(Journal.isValid(bad),false);
assert.throws(()=>Journal.save(store,bad),/Invalid/);
const denied={getItem(){throw Error("access denied")},setItem(){throw Error("access denied")}};
assert.throws(()=>Journal.read(denied),/denied/);
console.log("Automated coaching and opt-in journal passed: objective diagnostics, partial reviews, privacy, cap, export, deletion, invalid data and disabled storage.");
