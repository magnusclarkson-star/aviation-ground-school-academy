import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const lab=require("../academy-aircraft-systems-practical-data.js");
const atlas=require("../academy-original-picture-atlas.js");
const core=require("../academy-coursebook-data.js");
assert.deepEqual(lab.validate(atlas),{
 moduleId:"systems",cases:4,pictureViews:5,diagrams:4,
 status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:lab.REVISION
});
assert.equal(core.modules.find(c=>c.id==="systems").reviewStatus,"SME_REVIEW_REQUIRED",
 "The new public pictorial practical must never approve formal or regulated training");
assert.deepEqual(lab.cases.map(x=>x.id),["propulsion","fuel","electrical","hydraulic"]);
assert.deepEqual(lab.cases.map(x=>x.pictures),[
 ["overview-07"],["detail-06"],["detail-06"],["photo-04","overview-07"]
]);
for(const c of lab.cases){
 const answer=lab.evaluate(c.id,c.answer);
 assert.equal(answer.correct,true,c.id);
 assert.equal(answer.answer,c.options[c.answer]);
 assert.equal(answer.key.length,4);
 for(let i=0;i<3;i++)if(i!==c.answer)
  assert.equal(lab.evaluate(c.id,i).correct,false,
   "Wrong response should be reviewable for "+c.id);
}
assert.throws(()=>lab.evaluate("not-real",0),/Choose a fictional/);
assert.throws(()=>lab.evaluate("fuel",3),/Choose a fictional/);
assert.throws(()=>lab.evaluate("fuel",NaN),/Choose a fictional/);
assert.throws(()=>lab.diagram("maintenance-reset"),/Unknown classroom/);
assert.deepEqual(Object.keys(lab.blockDiagrams),[
 "fuel","electricalShared","electricalSeparate","hydraulic"
]);
for(const mode of Object.keys(lab.blockDiagrams)){
 const diagram=lab.diagram(mode);
 assert.ok(diagram.nodes.length>=2);
 assert.ok(diagram.note.length>=50);
 assert.doesNotMatch(diagram.nodes.join(" "),/reset circuit breaker|open hydraulic line|operate fuel selector/i);
}
assert.match(lab.diagram("electricalShared").nodes.join(" "),/common bus/i);
assert.match(lab.diagram("electricalSeparate").nodes.join(" "),/bus A/i);
const html=await readFile(new URL("../academy-coursebook.html",import.meta.url),"utf8");
const ui=await readFile(new URL("../academy-aircraft-systems-practical-ui.js",import.meta.url),"utf8");
const css=await readFile(new URL("../academy-aircraft-systems-practical.css",import.meta.url),"utf8");
for(const name of ["academy-aircraft-systems-practical-data.js","academy-aircraft-systems-practical-ui.js",
 "academy-aircraft-systems-practical.css","academy-in-app-notes.css"])
 assert.ok(html.includes(name),"Missing Course 04 resource "+name);
assert.match(html,/id="aircraftSystemsPracticalLab"/);
assert.match(ui,/agsa:coursebook-module/);
assert.match(ui,/moduleId!=="systems"/);
assert.match(ui,/getById\(id\)/);
assert.match(ui,/drawImage\(image/);
assert.match(ui,/showModal\(\)/);
assert.match(ui,/model\.evaluate/);
assert.match(ui,/electricalShared/);
assert.match(ui,/electricalSeparate/);
assert.match(ui,/aria-pressed/);
assert.doesNotMatch(ui,/\.innerHTML\b|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|window\.print\(|\.download\s*=/,
 "Course 04 learning notes must not print, download, store or transmit");
assert.match(css,/@media\(max-width:590px\)/);
assert.match(css,/\.systems-lab\[hidden\]\{display:none!important\}/);
console.log("Course 04 passed: 4 original picture cases, five views, four synthetic systems diagrams and in-app-only unverified practice.");
