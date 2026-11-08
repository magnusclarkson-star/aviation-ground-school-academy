import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const L=require("../ai-instructor-lessons.js");
const M=require("../ground-school-modules.js");

assert.deepEqual(M.validate(),{moduleCount:4,lessonCount:8,questionCount:24,revision:M.REVISION});
assert.equal(M.bank.length,24);
assert.equal(new Set(M.bank.map(q=>q.id)).size,24);
assert.deepEqual(M.modules.map(m=>m.id),["foundations","cockpit","operations","awareness"]);
assert.deepEqual(M.paths.scouts.moduleIds,["foundations","cockpit","awareness","operations"]);
assert.deepEqual(M.paths.pilots.moduleIds,["foundations","cockpit","operations","awareness"]);
for(const m of M.modules){
 const items=M.items(m.id);
 assert.equal(items.length,6);
 for(const id of m.lessons){
  assert.equal(items.filter(q=>q.lessonId===id).length,3);
  const q=items.find(q=>q.id===id+"-0"),lesson=L.lessons.find(l=>l.id===id);
  assert.equal(q.prompt,lesson.question);
  assert.deepEqual(q.choices,lesson.options);
 }
 const correct=M.grade(m.id,items.map(q=>q.correct));
 assert.equal(correct.total,6);
 assert.equal(correct.correct,6);
 assert.equal(correct.practiceTargetMet,true);
 assert.equal(correct.percent,100);
 assert.ok(correct.details.every(q=>q.correct));
 const allWrong=M.grade(m.id,items.map(q=>(q.correct+1)%3));
 assert.equal(allWrong.correct,0);
 assert.equal(allWrong.practiceTargetMet,false);
 assert.equal(allWrong.percent,0);
 const near=M.grade(m.id,items.map((q,i)=>i===0?(q.correct+1)%3:q.correct));
 assert.equal(near.correct,5);
 assert.equal(near.practiceTargetMet,true,"five out of six is a local practice target, not a credential");
 assert.throws(()=>M.grade(m.id,items.map(q=>q.correct).slice(1)),/Answer all/);
 assert.throws(()=>M.grade(m.id,[0,1,2,1,0,3]),/Answer all/);
 assert.throws(()=>M.grade(m.id,[0,1,2,1,0,"0"]),/Answer all/);
}
assert.throws(()=>M.items("invalid"),/Unknown module/);
assert.throws(()=>M.overview([],"unknown"),/Unknown learning pathway/);

const mem=new Map();
const storage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
let h=M.load(storage);
assert.deepEqual(h,[]);
assert.equal(M.overview(h,"scouts").nextModuleId,"foundations");
h=M.record(h,M.grade("foundations",M.items("foundations").map(q=>q.correct)),1000);
assert.equal(h.length,1);
assert.equal(M.save(storage,h),true);
assert.equal(M.load(storage).length,1);
let o=M.overview(h,"scouts");
assert.equal(o.modulesPractised,1);
assert.equal(o.modulesMeetingPracticeTarget,1);
assert.equal(o.nextModuleId,"cockpit");
assert.equal(o.modules[0].latestScore,6);
h=M.record(h,M.grade("cockpit",M.items("cockpit").map(q=>(q.correct+1)%3)),2000);
o=M.overview(h,"pilots");
assert.equal(o.modulesPractised,2);
assert.equal(o.modulesMeetingPracticeTarget,1);
assert.equal(o.nextModuleId,"operations","recommend unattempted before retaking weak checks");
h=M.record(h,M.grade("operations",M.items("operations").map(q=>q.correct)),3000);
h=M.record(h,M.grade("awareness",M.items("awareness").map(q=>q.correct)),4000);
o=M.overview(h,"pilots");
assert.equal(o.nextModuleId,"cockpit","once all modules have been practised, recommend the weak one");
h=M.record(h,M.grade("cockpit",M.items("cockpit").map(q=>q.correct)),5000);
o=M.overview(h,"pilots");
assert.equal(o.nextModuleId,null);
assert.equal(o.modulesMeetingPracticeTarget,4);
assert.equal(o.modules.find(x=>x.moduleId==="cockpit").attempts,2);

const exportData=M.exportProgress(h,"scouts","2026-11-08T09:01:00.000Z");
assert.equal(exportData.schema,"agsa.local-module-checkpoints.v1");
assert.equal(exportData.recordStatus,"UNVERIFIED_DEVICE_ONLY");
assert.equal(exportData.attempts.length,5);
assert.equal(exportData.pathId,"scouts");
assert.match(exportData.warning,/No learner identity/);
assert.ok(!("studentName" in exportData));
assert.ok(!("certificate" in exportData));
assert.throws(()=>M.exportProgress(h,"bad"),/Unknown learning pathway/);
assert.throws(()=>M.record(h,{...M.grade("cockpit",[0,1,2,0,1,2]),total:7}),/Invalid practice/);

const dirty=[...h,{moduleId:"unknown",revision:M.REVISION,correct:6,total:6,at:1234},
 {moduleId:"cockpit",revision:"obsolete",correct:6,total:6,at:1234},
 {moduleId:"foundations",revision:M.REVISION,correct:100,total:6,at:1234}];
assert.equal(M.clean(dirty).length,5);
const large=Array.from({length:70},(_,i)=>({moduleId:"foundations",revision:M.REVISION,correct:6,total:6,at:i+1}));
assert.equal(M.clean(large).length,48);
mem.set(M.STORAGE_KEY,"not JSON");
assert.deepEqual(M.load(storage),[]);
mem.set(M.STORAGE_KEY,"x".repeat(16000));
assert.deepEqual(M.load(storage),[]);
assert.equal(M.clear(storage),true);
assert.deepEqual(M.load(storage),[]);
assert.equal(M.save({setItem:()=>{throw Error("privacy mode")}},h),false);
assert.deepEqual(M.load({getItem:()=>{throw Error("privacy mode")}}),[]);
assert.equal(M.clear({removeItem:()=>{throw Error("privacy mode")}}),false);
console.log("Ground-school module model passed: 4 modules, 24 authored questions, threshold, revision-safe device storage, recommendations and unsigned export.");
