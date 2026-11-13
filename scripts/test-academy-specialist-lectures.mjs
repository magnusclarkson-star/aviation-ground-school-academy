import assert from "node:assert/strict";
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const course=require("../academy-specialist-courses-data.js");
const model=require("../academy-specialist-lesson-data.js");
const plates=require("../academy-specialist-technical-plates.js");
const approved=require("../academy-approved-visuals.js");
assert.equal(course.validate().courses,16);
assert.deepEqual(model.validate(),{courses:2,publicSampleLessons:4,figures:8,knowledgeChecks:8,status:"UNACCREDITED_SAMPLE_CONTENT"});
assert.deepEqual(plates.validate(),{figures:8,format:"original self-contained SVG"});
assert.deepEqual(new Set(Object.keys(model.programmes)),new Set(["avionics-engineering","aircraft-accident-investigation"]));
const figureIds=new Set();
let count=0;
for(const [id,p] of Object.entries(model.programmes)){
 const proposed=course.courses.find(c=>c.id===id);
 assert.ok(proposed,"Illustrated programme must be in 16-course roadmap");
 assert.equal(proposed.modules.length,8);
 assert.equal(p.units.length,2,"Only two sample lessons per specialist course are complete");
 assert.equal(approved.getSpecialist(id).length,2);
 for(const u of p.units){
  count++;
  assert.equal(u.sections.length,3);
  assert.equal(u.quiz.length,2);
  assert.equal(u.figureIds.length,2);
  for(const sec of u.sections)assert.ok(sec.heading.length>12&&sec.body.length>=340,
   "The lessons must contain substantial original text, not only outlines");
  for(const q of u.quiz)assert.ok(q.options.length===4&&Number.isInteger(q.answer));
  assert.ok(u.scenario.text.length>=150);
  for(const figure of u.figureIds){
   assert.ok(!figureIds.has(figure),"Each visual teaches a distinct subsystem or investigation skill");
   figureIds.add(figure);
   const plate=plates.get(figure);
   assert.ok(plate?.svg.length>1500&&plate.alt.length>=100);
   assert.match(plate.svg,/^<svg /);
   assert.doesNotMatch(plate.svg,/<script|foreignObject|<image /i);
  }
 }
}
assert.equal(count,4);
assert.equal(figureIds.size,8);
const html=fs.readFileSync(new URL("../academy-specialist-lectures.html",import.meta.url),"utf8");
for(const p of ["academy-specialist-lectures.js","academy-specialist-lectures.css","academy-approved-visuals.js","academy-approved-visuals-ui.js","academy-specialist-lesson-data.js","academy-specialist-technical-plates.js"])
 assert.ok(html.includes(p),"The specialist page must load "+p);
assert.match(html,/not official enrolment/i);
assert.match(html,/no fees, grades, formal exams/i);
const client=fs.readFileSync(new URL("../academy-specialist-lectures.js",import.meta.url),"utf8");
assert.match(client,/AGSACoursebookApprovedFigure/);
assert.match(client,/knowledge check|quiz/i);
assert.ok(!/localStorage|sessionStorage|\.innerHTML|fetch\(/.test(client),"Sample lessons must not create records or fetch unapproved imagery");
const catalogueHtml=fs.readFileSync(new URL("../academy-specialist-courses.html",import.meta.url),"utf8");
const catalogueClient=fs.readFileSync(new URL("../academy-specialist-courses.js",import.meta.url),"utf8");
assert.ok(catalogueHtml.includes("academy-specialist-lectures.html"));
assert.ok(catalogueClient.includes("academy-specialist-lectures.html?course="));
const home=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
assert.ok(home.includes("academy-specialist-lectures.html"));
console.log("Flagship specialist sample lessons checked: two courses, four complete 3-section notes, eight original plates, eight informal practice questions and previous owner-shown artwork.");
