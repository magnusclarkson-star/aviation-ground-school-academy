import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const lab=require("../academy-orientation-safety-lab-data.js");
const atlas=require("../academy-original-picture-atlas.js");
const course=require("../academy-coursebook-data.js");
assert.deepEqual(lab.validate(atlas),{
 course:"orientation",cases:3,reportFields:4,
 status:"OPTIONAL_UNVERIFIED_LEARNING",revision:lab.REVISION
});
assert.equal(course.modules.find(x=>x.id==="orientation")?.reviewStatus,"SME_REVIEW_REQUIRED",
 "New practical must never convert the original unreviewed course into an approved course");
assert.deepEqual(lab.cases.map(x=>x.picture),["photo-01","photo-02","detail-11"],
 "The three scenarios reuse existing owner-approved original Academy images");
for(const c of lab.cases){
 const correct=lab.checkDecision(c.id,c.answer);
 assert.equal(correct.correct,true,c.id);
 assert.equal(correct.id,c.id);
 assert.ok(correct.fact.length>24&&correct.assumption.length>24);
 assert.ok(correct.immediate.length>24&&correct.report.length>24);
 for(let i=0;i<3;i++)if(i!==c.answer)
  assert.equal(lab.checkDecision(c.id,i).correct,false,
   "Unsafe decisions must be flagged as requiring review in "+c.id);
}
assert.throws(()=>lab.checkDecision("fictional",0),/Choose one/);
assert.throws(()=>lab.checkDecision("walkway",3),/Choose one/);
const report=lab.reviewReport({
 observed:"A fictional training route is obstructed by a bag.",
 consequence:"Someone might trip or move into an unsafe area.",
 protect:"Pause the group before the boundary and keep clear.",
 notify:"Inform the supervising instructor at the activity."
});
assert.equal(report.complete,true);
assert.deepEqual(report.missing,[]);
assert.match(report.note,/Nothing is uploaded or saved/);
const incomplete=lab.reviewReport({observed:"a",consequence:"",protect:"",notify:""});
assert.equal(incomplete.complete,false);
assert.equal(incomplete.missing.length,4);
const files=await Promise.all(["academy-coursebook.html",
 "academy-orientation-safety-lab.js","academy-orientation-safety-lab.css"].map(
 p=>readFile(new URL("../"+p,import.meta.url),"utf8")));
const [html,ui,css]=files;
for(const asset of ["academy-orientation-safety-lab-data.js","academy-orientation-safety-lab.js",
 "academy-orientation-safety-lab.css"])assert.ok(html.includes(asset));
assert.match(html,/id="orientationSafetyLab"/);
assert.match(ui,/agsa:coursebook-module/);
assert.match(ui,/getById\(item\.picture\)/);
assert.match(ui,/drawImage\(image/);
assert.match(ui,/reportFields/);
assert.match(ui,/checkDecision/);
assert.match(ui,/reviewReport/);
assert.match(ui,/host\.hidden=moduleId!=="orientation"/);
assert.doesNotMatch(ui,/\.innerHTML\s*=|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/,
 "Safety practical must neither inject arbitrary HTML nor transmit or persist learner reports");
assert.match(css,/orientation-lab-case-grid/);
assert.match(css,/@media\(max-width:590px\)/);
assert.match(css,/\.orientation-lab\[hidden\]\{display:none!important\}/);
console.log("Course 01 safety lab: 3 original-picture situations, 3 checks, 4-step fictional report and scoped responsive UI validated.");
