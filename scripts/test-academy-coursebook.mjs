import assert from "node:assert/strict";
import {createRequire} from "node:module";
import fs from "node:fs";
const require=createRequire(import.meta.url);
const M=require("../academy-coursebook-data.js");
assert.deepEqual(M.validate(),{modules:12,lessons:36,questions:36,revision:M.REVISION});
assert.equal(new Set(M.modules.map(x=>x.id)).size,12);
assert.equal(new Set(M.modules.flatMap(m=>m.quiz.map(q=>q.id))).size,36);
const positions=M.modules.flatMap(m=>m.quiz.map(q=>q.answer));
for(const n of [0,1,2])assert.ok(positions.filter(x=>x===n).length>=10);
for(const route of Object.values(M.routes)){
 assert.equal(route.length,12);assert.equal(new Set(route).size,12);
}
for(const m of M.modules){
 assert.equal(m.sections.length,3);
 assert.ok(m.sections.every(x=>x.body.length>175));
 assert.equal(m.objectives.length,3);
 assert.equal(m.quiz.length,3);
 const correct=M.grade(m.id,m.quiz.map(x=>x.answer));
 assert.equal(correct.correct,3);assert.equal(correct.metTarget,true);
 assert.equal(M.grade(m.id,m.quiz.map(q=>(q.answer+1)%3)).correct,0);
 const two=m.quiz.map((q,i)=>i===1?(q.answer+1)%3:q.answer);
 assert.equal(M.grade(m.id,two).correct,2);
 assert.throws(()=>M.grade(m.id,[0]),/Answer all/);
 assert.ok(m.reference.startsWith("https://www.faa.gov/"));
}
assert.throws(()=>M.grade("nonexistent",[0,0,0]),/Unknown module/);
assert.deepEqual(M.clean([{id:"bad",correct:3,revision:M.REVISION,at:10}]),[]);
assert.deepEqual(M.clean([{id:M.modules[0].id,correct:3,revision:"old",at:10}]),[]);
const valid={id:M.modules[0].id,correct:2,revision:M.REVISION,at:123};
assert.deepEqual(M.clean([valid]),[valid]);
assert.equal(M.clean(Array(80).fill(valid)).length,60);
const html=fs.readFileSync(new URL("../academy-coursebook.html",import.meta.url),"utf8");
for(const name of ["academy-coursebook-data.js","academy-coursebook.js","academy-coursebook.css","moduleList","quizForm","lessonReading"])assert.ok(html.includes(name));
const main=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
assert.ok(main.includes('academy-coursebook.html'),"home must link to full course");
console.log("Coursebook passed: 12 modules, 36 lessons, 36 questions, learner routes, grades and local records.");