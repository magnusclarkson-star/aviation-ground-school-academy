import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const ext=require("../academy-specialist-extension.js");
const core=require("../academy-specialist-lesson-data.js");
const catalog=require("../academy-specialist-courses-data.js");
const plates=require("../academy-specialist-technical-plates.js");
assert.deepEqual(ext.validate(),{
 additionalLessons:4,additionalPlates:8,additionalQuestions:8,
 status:"UNACCREDITED_PUBLIC_SAMPLES",revision:ext.REVISION
});
const allImages=new Set(plates.ids);
assert.equal(core.validate().publicSampleLessons,4);
for(const [id,newUnits] of Object.entries(ext.units)){
 assert.equal(newUnits.length,2);
 assert.equal(core.programmes[id].units.length,2);
 const mapped=catalog.courses.find(x=>x.id===id);
 assert.equal(mapped.modules.length,8);
 const ids=new Set(core.programmes[id].units.map(x=>x.id));
 for(const unit of newUnits){
  assert.equal(unit.sections.length,3);
  assert.ok(unit.sections.every(x=>x.body.length>=340));
  assert.equal(unit.quiz.length,2);
  assert.ok(unit.scenario.text.length>=150);
  assert.ok(!ids.has(unit.id),"Duplicate unit: "+unit.id);
  ids.add(unit.id);
  for(const figureId of unit.figureIds){
   assert.ok(!allImages.has(figureId),"Diagram must explain a new relationship: "+figureId);
   allImages.add(figureId);
   const fig=ext.getPlate(figureId);
   assert.ok(fig.svg.startsWith("<svg"));
   assert.match(fig.svg,/<title>/);
   assert.match(fig.svg,/<desc>/);
   assert.match(fig.svg,/<\/svg>$/);
   assert.ok(fig.svg.length>=1700&&fig.alt.length>=100);
   assert.doesNotMatch(fig.svg,/<script|foreignObject|<image\s/i);
  }
  for(const q of unit.quiz){
   assert.equal(q.options.length,4);
   assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);
   assert.ok(q.explanation.length>50);
  }
 }
 assert.equal(ids.size,4);
}
assert.equal(allImages.size,16);
assert.equal(ext.getPlate("does-not-exist"),null);
const html=await readFile(new URL("../academy-specialist-lectures.html",import.meta.url),"utf8");
const js=await readFile(new URL("../academy-specialist-lectures.js",import.meta.url),"utf8");
const css=await readFile(new URL("../academy-specialist-compact.css",import.meta.url),"utf8");
const catalogHtml=await readFile(new URL("../academy-specialist-courses.html",import.meta.url),"utf8");
const build=await readFile(new URL("../scripts/build-pages.mjs",import.meta.url),"utf8");
const workflow=await readFile(new URL("../.github/workflows/check-site.yml",import.meta.url),"utf8");
for(const asset of ["academy-specialist-extension.js","academy-specialist-compact.css"]){
 assert.ok(html.includes(asset));
 assert.ok(build.includes(asset),"Asset omitted from published build: "+asset);
}
assert.ok(html.includes("All eight planned syllabus units per flagship pathway"));
assert.ok(html.includes("eight non-credit preview lessons per pathway"));
assert.ok(catalogHtml.includes("Eight free illustrated sample lessons"));
assert.match(js,/extension\.validate\(\)/);
assert.match(js,/function lessons\(course\)/);
assert.match(js,/extension\.getPlate\(plateId\)/);
assert.match(js,/lessons\(activeCourse\)\.forEach/);
assert.match(js,/lessons\(activeCourse\)\.length-1/);
assert.match(css,/@media\(max-width:480px\)/);
assert.match(css,/color:#f0f9ff/);
assert.match(workflow,/test-academy-specialist-extension\.mjs/);
assert.doesNotMatch(js,/localStorage|sessionStorage|\.innerHTML|fetch\(/);
assert.doesNotMatch(await readFile(new URL("../academy-specialist-extension.js",import.meta.url),"utf8"),
 /localStorage|sessionStorage|XMLHttpRequest|sendBeacon|window\.print/);
console.log("Flagship specialist extension passed: 8 public sample lectures total, 16 technical diagrams, 16 informal checks, 8-unit roadmaps preserved, no record writes and compact phone layout.");
