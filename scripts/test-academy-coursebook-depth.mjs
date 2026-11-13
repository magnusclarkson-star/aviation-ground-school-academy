import assert from "node:assert/strict";
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const D=require("../academy-coursebook-depth-model.js");
const Core=require("../academy-coursebook-data.js");
assert.deepEqual(D.validate(),{modules:12,advancedLessons:36,advancedQuestions:36,scenarios:12,capstoneQuestions:24,revision:D.REVISION});
assert.deepEqual(D.units.map(x=>x.id),Core.modules.map(x=>x.id));
assert.equal(new Set(D.units.flatMap(u=>u.questions.map((q,i)=>u.id+"-"+i))).size,36);
for(const route of Object.keys(Core.routes)){
 assert.equal(D.attemptsOverview([],route).items.length,12);
 assert.equal(D.attemptsOverview([],route).nextId,Core.routes[route][0]);
}
for(const unit of D.units){
 assert.equal(unit.glossary.length,3);
 assert.equal(unit.lessons.length,3);
 assert.equal(unit.questions.length,3);
 for(const lesson of unit.lessons){
  assert.ok(lesson.concept.length>=190);
  assert.ok(lesson.example.length>=115);
  assert.ok(lesson.task.length>=55);
 }
 assert.ok(unit.focus.scouts&&unit.focus.pilots);
 const right=D.grade(unit.id,unit.questions.map(q=>q[2]),unit.scenario.answer);
 assert.equal(right.correct,4);assert.equal(right.practiceTargetMet,true);
 assert.equal(right.caseCorrect,true);
 const wrong=D.grade(unit.id,unit.questions.map(q=>(q[2]+1)%3),(unit.scenario.answer+1)%3);
 assert.equal(wrong.correct,0);assert.equal(wrong.practiceTargetMet,false);
 const missedCase=D.grade(unit.id,unit.questions.map(q=>q[2]),(unit.scenario.answer+1)%3);
 assert.equal(missedCase.correct,3);assert.equal(missedCase.practiceTargetMet,false,"Scenario understanding is required for local target");
 assert.throws(()=>D.grade(unit.id,[0,1],0),/Answer the scenario/);
 assert.throws(()=>D.grade(unit.id,[0,1,2],-1),/Answer the scenario/);
 assert.ok(D.chapterMap[unit.id]?.length>0);
 assert.ok(D.subjectMap[unit.id]?.length>0);
}
assert.throws(()=>D.grade("unknown",[0,1,2],0),/Unknown deep module/);
for(const seed of [0,1,42,123456]){
 const questions=D.capstoneQuestions(seed);
 assert.equal(questions.length,24);
 assert.equal(new Set(questions.map(q=>q.id)).size,24);
 for(const unit of D.units)assert.equal(questions.filter(q=>q.moduleId===unit.id).length,2);
 const result=D.gradeCapstone(questions.map(q=>q.answer),seed);
 assert.equal(result.correct,24);
 assert.equal(result.percent,100);
 assert.equal(result.practiceTargetMet,true);
 const wrong=D.gradeCapstone(questions.map(q=>(q.answer+1)%3),seed);
 assert.equal(wrong.correct,0);
 const eighteen=questions.map((q,i)=>i<18?q.answer:(q.answer+1)%3);
 assert.equal(D.gradeCapstone(eighteen,seed).practiceTargetMet,true);
 assert.equal(D.gradeCapstone(eighteen.map((a,i)=>i===0?(a+1)%3:a),seed).practiceTargetMet,false);
}
assert.throws(()=>D.gradeCapstone([0]),/Complete all/);
const core=Core.modules.map((m,i)=>({id:m.id,revision:Core.REVISION,correct:3,at:i+1}));
const advanced=D.units.map((u,i)=>({id:u.id,revision:D.REVISION,correct:4,caseCorrect:true,at:i+1}));
const final=[{revision:D.REVISION,correct:18,at:1000}];
const result=D.completion(core,advanced,final);
assert.equal(result.coreTargetCount,12);assert.equal(result.deepTargetCount,12);
assert.equal(result.capstoneBest,18);assert.equal(result.selfStudyRouteComplete,true);
assert.equal(result.status,"UNVERIFIED_SELF_STUDY_ONLY");
assert.equal(D.completion(core,advanced,[]).selfStudyRouteComplete,false);
assert.equal(D.completion(core,advanced.map((u,i)=>i===0?{...u,caseCorrect:false}:u),final).selfStudyRouteComplete,false);
assert.equal(D.completion(core.map((u,i)=>i===0?{...u,correct:1}:u),advanced,final).selfStudyRouteComplete,false);
const exportData=D.exportSummary(core,advanced,final,"scouts","2026-11-13T16:00:00.000Z");
assert.equal(exportData.summary.selfStudyRouteComplete,true);
assert.equal(exportData.status,"UNVERIFIED_EDITABLE_DEVICE_RECORD");
assert.ok(!("certificate" in exportData));
assert.deepEqual(D.cleanHistory([{id:"nonsense",revision:D.REVISION,correct:4,caseCorrect:true,at:1}]),[]);
assert.equal(D.cleanHistory(Array(110).fill(advanced[0])).length,96);
assert.deepEqual(D.cleanFinal([{revision:"old",correct:24,at:1}]),[]);
assert.throws(()=>D.exportSummary(core,advanced,final,"invalid"),/Invalid export/);
for(const path of ["../academy-coursebook.html","../academy-coursebook-depth-ui.js","../academy-coursebook.css"]){
 assert.ok(fs.readFileSync(new URL(path,import.meta.url),"utf8").length>1000);
}
const html=fs.readFileSync(new URL("../academy-coursebook.html",import.meta.url),"utf8");
for(const marker of ["academy-coursebook-depth-a.js","academy-coursebook-depth-b1.js","academy-coursebook-depth-b2.js","academy-coursebook-depth-model.js","academy-coursebook-depth-ui.js","deepModuleSection","capstoneForm","capstoneQuestions","completionCelebration"])
 assert.ok(html.includes(marker),"Missing deployed interface marker "+marker);
console.log("Deep curriculum checked: 72 total reading sections, 72 topic questions, 12 applied scenarios, 24-question mixed review, versioned unverified records.");
