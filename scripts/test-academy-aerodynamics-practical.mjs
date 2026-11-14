import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const lab=require("../academy-aerodynamics-practical-data.js");
const atlas=require("../academy-original-picture-atlas.js");
const core=require("../academy-coursebook-data.js");
const validation=lab.validate(atlas);
assert.deepEqual(validation,{
 moduleId:"aerodynamics",cases:4,pictureViews:4,
 status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:lab.REVISION
});
assert.equal(core.modules.find(x=>x.id==="aerodynamics").reviewStatus,"SME_REVIEW_REQUIRED",
 "Practical must never grant editorial or regulatory course approval");
assert.deepEqual(lab.cases.map(c=>c.id),["four-forces","angle-of-attack","stall","bank-and-load"]);
assert.deepEqual(lab.cases.map(c=>c.pictures),[
 ["overview-02"],["detail-02"],["detail-02"],["cessna-03"]
]);
for(const activity of lab.cases){
 const correct=lab.evaluate(activity.id,activity.answer);
 assert.equal(correct.correct,true,activity.id);
 assert.equal(correct.expected,activity.options[activity.answer]);
 assert.ok(correct.key.length>=3);
 for(let i=0;i<3;i++)if(i!==activity.answer)
  assert.equal(lab.evaluate(activity.id,i).correct,false,
   "Every incorrect concept response must be marked for review: "+activity.id);
}
assert.throws(()=>lab.evaluate("unknown",0),/Select one/);
assert.throws(()=>lab.evaluate("four-forces",3),/Select one/);
assert.throws(()=>lab.levelTurn(-5),/idealised/);
assert.throws(()=>lab.levelTurn(65),/idealised/);
assert.throws(()=>lab.levelTurn(37.5),/idealised/);
assert.throws(()=>lab.levelTurn("30"),/idealised/);
assert.deepEqual(lab.levelTurn(0).loadFactor,1);
assert.deepEqual(lab.levelTurn(0).speedMultiplier,1);
const bank30=lab.levelTurn(30),bank45=lab.levelTurn(45),bank60=lab.levelTurn(60);
assert.ok(Math.abs(bank30.loadFactor-1.155)<.002);
assert.ok(Math.abs(bank45.loadFactor-1.414)<.002);
assert.ok(Math.abs(bank45.speedMultiplier-1.189)<.002);
assert.ok(Math.abs(bank60.loadFactor-2)<.001);
assert.ok(Math.abs(bank60.speedMultiplier-1.414)<.002);
assert.equal(bank60.relativeIncreasePercent,41.4);
assert.match(bank45.caution,/not an aircraft flight limit/i);
let previous=0;
for(let angle=0;angle<=60;angle+=5){
 const state=lab.levelTurn(angle);
 assert.ok(state.loadFactor>=previous,"Idealised load factor must increase monotonically");
 previous=state.loadFactor;
}
const html=await readFile(new URL("../academy-coursebook.html",import.meta.url),"utf8");
const ui=await readFile(new URL("../academy-aerodynamics-practical-ui.js",import.meta.url),"utf8");
const css=await readFile(new URL("../academy-aerodynamics-practical.css",import.meta.url),"utf8");
for(const asset of ["academy-aerodynamics-practical-data.js","academy-aerodynamics-practical-ui.js",
 "academy-aerodynamics-practical.css","academy-in-app-notes.css"])
 assert.ok(html.includes(asset),"Missing Course 03 source "+asset);
assert.match(html,/id="aerodynamicsPracticalLab"/);
assert.match(ui,/agsa:coursebook-module/);
assert.match(ui,/moduleId!=="aerodynamics"/);
assert.match(ui,/getById\(id\)/);
assert.match(ui,/drawImage\(image/);
assert.match(ui,/lab\.levelTurn/);
assert.match(ui,/slider\.type="range"/);
assert.match(ui,/showModal\(\)/);
assert.doesNotMatch(ui,/\.innerHTML\b|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|window\.print\(|\.download\s*=/,
 "Course 03 lessons must not upload, store, print, or export learning material");
assert.match(css,/@media\(max-width:590px\)/);
assert.match(css,/\.aero-lab\[hidden\]\{display:none!important\}/);
console.log("Course 03: 4 approved-picture exercises, validated 0–60-degree classroom turn slider, no exported notes or formal assessment granted.");
