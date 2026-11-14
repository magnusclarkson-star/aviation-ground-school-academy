import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const lab=require("../academy-instruments-practical-data.js");
const atlas=require("../academy-original-picture-atlas.js");
const core=require("../academy-coursebook-data.js");
assert.deepEqual(lab.validate(atlas),{
 moduleId:"instruments",cases:4,pictureViews:7,sourceCards:3,
 status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:lab.REVISION
});
assert.equal(core.modules.find(x=>x.id==="instruments").number,5);
assert.equal(core.modules.find(x=>x.id==="instruments").reviewStatus,"SME_REVIEW_REQUIRED",
 "New picture-based exercises must not mark a course instructor-approved");
assert.deepEqual(lab.cases.map(x=>x.id),["six-pack","pressure","orientation","glass-disagreement"]);
assert.deepEqual(lab.cases.map(x=>x.pictures),[
 ["detail-03","overview-03"],["detail-03"],["overview-03","cessna-04"],["cessna-04","detail-03"]
]);
for(const item of lab.cases){
 const good=lab.evaluate(item.id,item.answer);
 assert.equal(good.correct,true,item.id);
 assert.equal(good.expected,item.options[item.answer]);
 assert.ok(good.key.length>=4);
 for(let i=0;i<3;i++)if(i!==item.answer)
  assert.equal(lab.evaluate(item.id,i).correct,false,"Incorrect concept should receive review: "+item.id);
}
assert.throws(()=>lab.evaluate("unknown",0),/Choose one instrument-reading response/);
assert.throws(()=>lab.evaluate("pressure",3),/Choose one instrument-reading response/);
assert.throws(()=>lab.sourceCard("engine-reset"),/Unknown classroom instrument source/);
assert.deepEqual(Object.keys(lab.sourceCards),["airspeed","altimeter","vsi"]);
assert.equal(lab.sourceCard("airspeed").inputs.length,2);
assert.match(lab.sourceCard("airspeed").inputs.join(" "),/Pitot/);
assert.match(lab.sourceCard("airspeed").inputs.join(" "),/Static/);
assert.equal(lab.sourceCard("altimeter").inputs.length,2);
assert.match(lab.sourceCard("vsi").inputs.join(" "),/Static-pressure change/);
assert.match(lab.cases[3].explanation,/operational response/);
const html=await readFile(new URL("../academy-coursebook.html",import.meta.url),"utf8");
const ui=await readFile(new URL("../academy-instruments-practical-ui.js",import.meta.url),"utf8");
const css=await readFile(new URL("../academy-instruments-practical.css",import.meta.url),"utf8");
for(const asset of ["academy-instruments-practical-data.js","academy-instruments-practical-ui.js",
 "academy-instruments-practical.css","academy-in-app-notes.css"])
 assert.ok(html.includes(asset),"Course 05 publication missing "+asset);
assert.match(html,/id="instrumentsPracticalLab"/);
assert.match(ui,/agsa:coursebook-module/);
assert.match(ui,/moduleId!=="instruments"/);
assert.match(ui,/atlas\.getById\(id\)/);
assert.match(ui,/ctx\.drawImage\(pic/);
assert.match(ui,/showModal\(\)/);
assert.match(ui,/model\.sourceCard\(key\)/);
assert.match(ui,/model\.evaluate\(item\.id,choice\)/);
assert.match(ui,/aria-pressed/);
assert.doesNotMatch(ui,/\.innerHTML\b|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|window\.print\(|\.download\s*=/,
 "Learning content must not be downloaded, printed, transmitted or locally persisted by Course 05");
assert.match(css,/@media\(max-width:590px\)/);
assert.match(css,/\.inst-lab\[hidden\]\{display:none!important\}/);
assert.match(css,/\.inst-lab-questions label/);
console.log("Course 05: 4 approved illustrated instrument cases, 7 unchanged source pictures, 3 interactive pressure-source cards and private in-app-only practice verified.");
