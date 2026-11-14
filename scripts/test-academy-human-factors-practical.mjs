import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const lab=require("../academy-human-factors-practical-data.js");
const atlas=require("../academy-original-picture-atlas.js");
const core=require("../academy-coursebook-data.js");
assert.deepEqual(lab.validate(atlas),{
 moduleId:"human",cases:4,pictureViews:6,readinessPrompts:6,paveCategories:4,
 status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:lab.REVISION
});
assert.equal(core.modules.find(m=>m.id==="human").number,11);
assert.equal(core.modules.find(m=>m.id==="human").reviewStatus,"SME_REVIEW_REQUIRED");
assert.deepEqual(lab.cases.map(c=>c.id),["readiness","pave","workload","reporting"]);
assert.deepEqual(lab.cases.map(c=>c.pictures),[
 ["overview-09","detail-09"],["detail-09"],["overview-09"],["detail-09","overview-11"]
]);
for(const c of lab.cases){
 const ok=lab.evaluate(c.id,c.answer);
 assert.equal(ok.correct,true,c.id);
 assert.equal(ok.expected,c.options[c.answer]);
 assert.equal(ok.key.length,5);
 for(let i=0;i<3;i++)if(i!==c.answer)assert.equal(lab.evaluate(c.id,i).correct,false,c.id);
}
assert.throws(()=>lab.evaluate("wrong",0),/valid human-factors/);
assert.throws(()=>lab.evaluate("pave",3),/valid human-factors/);
assert.throws(()=>lab.evaluate("pave",-1),/valid human-factors/);
assert.deepEqual(lab.readiness([]).flags,[]);
assert.equal(lab.readiness([]).count,0);
assert.match(lab.readiness([]).message,/does not establish fitness/);
for(const prompt of lab.IMSAFE){
 const x=lab.readiness([prompt.id]);assert.equal(x.count,1);assert.equal(x.flags[0].id,prompt.id);
 assert.match(x.message,/not a fitness approval/);
}
assert.equal(lab.readiness(["fatigue","stress"]).count,2);
assert.throws(()=>lab.readiness(["fatigue","fatigue"]),/unique known/);
assert.throws(()=>lab.readiness(["unknown"]),/unique known/);
assert.throws(()=>lab.readiness("fatigue"),/unique known/);
assert.deepEqual(lab.PAVE.map(x=>x.id),["pilot","aircraft","environment","pressure"]);
for(const x of lab.PAVE)assert.equal(lab.pave(x.id),x);
assert.throws(()=>lab.pave("nothing"),/PAVE risk category/);
assert.equal(lab.WORKLOAD.length,3);
for(const x of lab.WORKLOAD)assert.equal(lab.workload(x.id),x);
assert.throws(()=>lab.workload("nothing"),/workload concept/);
const html=await readFile(new URL("../academy-coursebook.html",import.meta.url),"utf8");
const ui=await readFile(new URL("../academy-human-factors-practical-ui.js",import.meta.url),"utf8");
const css=await readFile(new URL("../academy-human-factors-practical.css",import.meta.url),"utf8");
const builder=await readFile(new URL("../scripts/build-pages.mjs",import.meta.url),"utf8");
for(const asset of ["academy-human-factors-practical-data.js","academy-human-factors-practical-ui.js",
 "academy-human-factors-practical.css"]) {
 assert.ok(html.includes(asset),"Course 11 asset omitted from coursebook: "+asset);
 assert.ok(builder.includes(asset),"Course 11 asset omitted from published build: "+asset);
}
assert.match(html,/id="humanFactorsPracticalLab"/);
assert.match(html,/id="performancePracticalLab"/);
assert.match(html,/academy-in-app-notes.css/);
assert.match(ui,/agsa:coursebook-module/);
assert.match(ui,/moduleId!=="human"/);
assert.match(ui,/atlas\.getById\(id\)/);
assert.match(ui,/ctx\.drawImage\(img/);
assert.match(ui,/model\.readiness\(selected\)/);
assert.match(ui,/model\.pave\(item\.id\)/);
assert.match(ui,/model\.workload\(item\.id\)/);
assert.match(ui,/showModal\(\)/);
assert.doesNotMatch(ui,/\.innerHTML\b|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|window\.print\(|\.download\s*=/,
 "Course 11 must not download, print, transmit, or persist lesson notes");
assert.match(css,/@media\(max-width:590px\)/);
assert.match(css,/\.human-lab\[hidden\]\{display:none!important\}/);
assert.match(css,/color:#f3faff/);
console.log("Course 11 passed: four illustrated human factors exercises, six approved original views, IMSAFE/PAVE/workload cards, route cues, phone layout and learning-note restrictions.");
