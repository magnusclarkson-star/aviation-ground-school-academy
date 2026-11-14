import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const lab=require("../academy-rotorcraft-practical-data.js");
const atlas=require("../academy-original-picture-atlas.js");
const course=require("../academy-coursebook-data.js");
assert.deepEqual(lab.validate(atlas),{
 moduleId:"rotorcraft",cases:4,pictureViews:6,controls:4,hoverFactors:3,phases:3,sources:3,
 status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:lab.REVISION
});
const m=course.modules.find(x=>x.id==="rotorcraft");
assert.equal(m.number,12);
assert.equal(m.reviewStatus,"SME_REVIEW_REQUIRED");
assert.deepEqual(lab.cases.map(x=>x.id),["controls","hover","transition","r44-sources"]);
assert.deepEqual(lab.cases.map(x=>x.pictures),[
 ["detail-10","overview-10"],["overview-10"],["detail-10"],["overview-10","detail-10"]
]);
for(const item of lab.cases){
 const passed=lab.evaluate(item.id,item.answer);
 assert.equal(passed.correct,true,item.id);
 assert.equal(passed.expected,item.options[item.answer]);
 assert.equal(passed.key.length,4);
 for(let i=0;i<item.options.length;i++)if(i!==item.answer)
  assert.equal(lab.evaluate(item.id,i).correct,false,item.id);
 for(const pid of item.pictures)assert.equal(atlas.getById(pid).moduleId,"rotorcraft");
}
assert.throws(()=>lab.evaluate("unknown",0),/Unknown rotorcraft lesson/);
assert.throws(()=>lab.evaluate("hover",-1),/valid rotorcraft classroom answer/);
assert.throws(()=>lab.evaluate("hover",4),/valid rotorcraft classroom answer/);
assert.deepEqual(lab.CONTROLS.map(x=>x.id),["collective","cyclic","pedals","power"]);
assert.deepEqual(lab.HOVER_FACTORS.map(x=>x.id),["wind","load","density"]);
assert.deepEqual(lab.PHASES.map(x=>x.id),["hover","transition","forward"]);
assert.deepEqual(lab.SOURCES.map(x=>x.id),["poh","notice","instructor"]);
for(const x of lab.CONTROLS)assert.equal(lab.control(x.id),x);
for(const x of lab.HOVER_FACTORS)assert.equal(lab.hover(x.id),x);
for(const x of lab.PHASES)assert.equal(lab.phase(x.id),x);
for(const x of lab.SOURCES)assert.equal(lab.source(x.id),x);
for(const fn of [lab.control,lab.hover,lab.phase,lab.source])assert.throws(()=>fn("bad"),/Unknown/);
assert.match(lab.source("poh").url,/robinsonheli\.com\/publications/);
assert.match(lab.cases[3].explanation,/flight manual/i);
const html=await readFile(new URL("../academy-coursebook.html",import.meta.url),"utf8");
const ui=await readFile(new URL("../academy-rotorcraft-practical-ui.js",import.meta.url),"utf8");
const css=await readFile(new URL("../academy-rotorcraft-practical.css",import.meta.url),"utf8");
const builder=await readFile(new URL("../scripts/build-pages.mjs",import.meta.url),"utf8");
const workflow=await readFile(new URL("../.github/workflows/check-site.yml",import.meta.url),"utf8");
for(const asset of ["academy-rotorcraft-practical-data.js","academy-rotorcraft-practical-ui.js",
 "academy-rotorcraft-practical.css"]){
 assert.ok(html.includes(asset),"Course 12 missing from page: "+asset);
 assert.ok(builder.includes(asset),"Course 12 missing from Pages build: "+asset);
}
assert.match(html,/id="rotorcraftPracticalLab"/);
assert.match(ui,/agsa:coursebook-module/);
assert.match(ui,/moduleId!=="rotorcraft"/);
assert.match(ui,/atlas\.getById\(id\)/);
assert.match(ui,/ctx\.drawImage\(image/);
assert.match(ui,/model\.evaluate\(item\.id,choice\)/);
assert.match(ui,/model\.CONTROLS/);
assert.match(ui,/model\.HOVER_FACTORS/);
assert.match(ui,/model\.PHASES/);
assert.match(ui,/model\.SOURCES/);
assert.match(ui,/showModal\(/);
assert.doesNotMatch(ui,/\.innerHTML\b|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|window\.print\(|\.download\s*=/,
 "Course 12 must not transmit, download, print or persist lesson answers");
assert.match(css,/@media\(max-width:590px\)/);
assert.match(css,/\.rotor-lab\[hidden\]\{display:none!important\}/);
assert.match(css,/color:#f5fbff/);
assert.match(workflow,/node scripts\/test-academy-rotorcraft-practical\.mjs/);
console.log("Course 12 passed: 4 picture exercises, 6 approved original rotorcraft views, conceptual control/hover/flight-phase/source cards, contrast, mobile layout, source references and no-persist safeguards.");
