import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const base=require("../academy-specialist-lesson-data.js");
const middle=require("../academy-specialist-extension.js");
const final=require("../academy-specialist-units-5-8.js");
const artwork=require("../academy-approved-visuals.js");
const catalogue=require("../academy-specialist-courses-data.js");
const originalPlates=require("../academy-specialist-technical-plates.js");
assert.deepEqual(final.validate(),{
 courses:2,additionalUnits:8,additionalDiagrams:16,additionalPracticeQuestions:16,
 status:"UNACCREDITED_SELF_STUDY_ONLY",revision:final.REVISION
});
assert.deepEqual(new Set(Object.keys(final.programmes)),new Set([
 "avionics-engineering","aircraft-accident-investigation"
]));
const allPlateIds=new Set([...originalPlates.ids,...middle.plateIds]);
let unitCount=0,questionCount=0;
for(const [courseId,newUnits] of Object.entries(final.programmes)){
 const proposal=catalogue.courses.find(c=>c.id===courseId);
 assert.equal(proposal.modules.length,8);
 assert.equal(base.programmes[courseId].units.length,2);
 assert.equal(middle.units[courseId].length,2);
 assert.equal(newUnits.length,4);
 assert.equal(artwork.getSpecialist(courseId).length,2);
 const fullUnits=[...base.programmes[courseId].units,...middle.units[courseId],...newUnits];
 assert.equal(fullUnits.length,8);
 const ids=new Set(fullUnits.map(u=>u.id));
 assert.equal(ids.size,8,"No module should be duplicated");
 newUnits.forEach((u,index)=>{
  unitCount++;
  assert.match(u.title,new RegExp("^0"+(index+5)+" · "));
  assert.equal(u.sections.length,3);
  for(const section of u.sections)assert.ok(section.body.length>=340);
  assert.equal(u.figureIds.length,2);
  assert.ok(u.objective.length>=85);
  assert.equal(u.quiz.length,2);
  for(const q of u.quiz){
   questionCount++;
   assert.equal(q.options.length,4);
   assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);
   assert.ok(q.explanation.length>=65);
  }
  for(const id of u.figureIds){
   assert.ok(!allPlateIds.has(id),"Each new lesson requires distinct diagrams: "+id);
   allPlateIds.add(id);
   const fig=final.getPlate(id);
   assert.ok(fig?.svg.startsWith("<svg ")&&fig.svg.endsWith("</svg>"));
   assert.match(fig.svg,/<title>/);
   assert.match(fig.svg,/<desc>/);
   assert.ok(fig.alt.length>=110);
   assert.doesNotMatch(fig.svg,/<script|foreignObject|<image\s/i);
  }
 });
}
assert.equal(unitCount,8);
assert.equal(questionCount,16);
assert.equal(allPlateIds.size,32);
assert.equal(final.getPlate("unknown"),null);
const html=await readFile(new URL("../academy-specialist-lectures.html",import.meta.url),"utf8");
const script=await readFile(new URL("../academy-specialist-lectures.js",import.meta.url),"utf8");
const page=await readFile(new URL("../academy-specialist-courses.html",import.meta.url),"utf8");
const builder=await readFile(new URL("../scripts/build-pages.mjs",import.meta.url),"utf8");
const workflow=await readFile(new URL("../.github/workflows/check-site.yml",import.meta.url),"utf8");
for(const asset of ["academy-specialist-units-5-8.js","academy-specialist-lectures.js"]){
 assert.ok(html.includes(asset),"The lecture page must load "+asset);
 assert.ok(builder.includes(asset),"The Pages build must publish "+asset);
}
assert.ok(html.includes("All eight planned syllabus units per flagship pathway"));
assert.ok(html.includes("eight non-credit preview lessons per pathway"));
assert.ok(page.includes("Sixteen free sample lectures"));
assert.ok(page.includes("Eight free illustrated sample lessons"));
assert.match(script,/full\.validate\(\)/);
assert.match(script,/function lessons\(course\)/);
assert.match(script,/full\.programmes\[course\]/);
assert.match(script,/full\.getPlate\(plateId\)/);
assert.match(script,/original\[activeIndex%original\.length\]/);
assert.match(script,/\$\("upcomingModules"\)\.hidden=upcoming\.length===0/);
assert.match(workflow,/test-academy-specialist-units-5-8\.mjs/);
assert.doesNotMatch(script,/localStorage|sessionStorage|\.innerHTML|fetch\(|XMLHttpRequest|sendBeacon/);
assert.doesNotMatch(await readFile(new URL("../academy-specialist-units-5-8.js",import.meta.url),"utf8"),
 /localStorage|sessionStorage|\.innerHTML|fetch\(|XMLHttpRequest|sendBeacon|window\.print/);
assert.match(html,/There are no fees, grades, formal exams, course certificates or transcripts issued from this page/);
assert.match(html,/class="disclosure"/);
console.log("Flagship sample series passed: 16 specialist lessons, 32 original conceptual diagrams, 32 informal checks; new units 05-08 are original and ungraded, no account/credential writes.");
