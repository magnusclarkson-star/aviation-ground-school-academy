import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const lab=require("../academy-aircraft-identification-data.js");
const atlas=require("../academy-original-picture-atlas.js");
const course=require("../academy-coursebook-data.js");
assert.deepEqual(lab.validate(atlas),{
 moduleId:"aircraft",cases:4,sourcePictureViews:5,
 status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:lab.REVISION
});
assert.equal(course.modules.find(x=>x.id==="aircraft").reviewStatus,"SME_REVIEW_REQUIRED");
assert.deepEqual(lab.cases.map(x=>x.id),["airframe","surfaces","axes","rotorcraft"]);
assert.deepEqual(lab.cases.map(x=>x.pictures),[
 ["cessna-01"],["cessna-02"],["cessna-03"],["cessna-01","overview-10"]
]);
for(const task of lab.cases){
 const good=lab.evaluate(task.id,task.answer);
 assert.equal(good.correct,true,task.id);
 assert.equal(good.expected,task.options[task.answer]);
 assert.ok(good.visualKey.length>=3);
 for(let j=0;j<3;j++)if(j!==task.answer)
  assert.equal(lab.evaluate(task.id,j).correct,false);
}
assert.throws(()=>lab.evaluate("not-a-case",0),/Select one/);
assert.throws(()=>lab.evaluate("airframe",NaN),/Select one/);
assert.throws(()=>lab.evaluate("airframe",3),/Select one/);
const html=await readFile(new URL("../academy-coursebook.html",import.meta.url),"utf8");
const js=await readFile(new URL("../academy-aircraft-identification-ui.js",import.meta.url),"utf8");
const css=await readFile(new URL("../academy-aircraft-identification.css",import.meta.url),"utf8");
for(const file of ["academy-aircraft-identification-data.js","academy-aircraft-identification-ui.js","academy-aircraft-identification.css","academy-in-app-notes.css"])
 assert.ok(html.includes(file),"Required Course 02 source not in coursebook: "+file);
assert.match(html,/id="aircraftIdentificationLab"/);
assert.match(js,/agsa:coursebook-module/);
assert.match(js,/moduleId!=="aircraft"/);
assert.match(js,/getById\(id\)/);
assert.match(js,/drawImage\(image/);
assert.match(js,/showModal\(\)/);
assert.match(js,/lab\.evaluate/);
assert.doesNotMatch(js,/\.innerHTML\b|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|window\.print\(|\.download\s*=/,
 "Course 02 exercises must not upload, store, print or export teaching material");
assert.match(css,/@media\(max-width:590px\)/);
assert.match(css,/\.aircraft-id-lab\[hidden\]\{display:none!important\}/);
console.log("Course 02 verified: four interactive approved-picture cases, five picture views, zoom, feedback, no new aircraft models and no official result export.");
