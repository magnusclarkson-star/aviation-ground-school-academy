import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const lab=require("../academy-airspace-practical-data.js");
const atlas=require("../academy-original-picture-atlas.js");
const core=require("../academy-coursebook-data.js");
assert.deepEqual(lab.validate(atlas),{
 moduleId:"airspace",cases:4,pictureViews:6,diagramParts:8,
 status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:lab.REVISION
});
assert.equal(core.modules.find(x=>x.id==="airspace").number,8);
assert.equal(core.modules.find(x=>x.id==="airspace").reviewStatus,"SME_REVIEW_REQUIRED");
assert.deepEqual(lab.cases.map(x=>x.id),["boundaries","aerodrome","runways","authority"]);
assert.deepEqual(lab.cases.map(x=>x.pictures),[
 ["detail-12","overview-05"],["overview-05","photo-02"],["overview-05"],["detail-12"]
]);
for(const item of lab.cases){
 const correct=lab.evaluate(item.id,item.answer);
 assert.equal(correct.correct,true,item.id);
 assert.equal(correct.expected,item.options[item.answer]);
 assert.ok(correct.key.length>=5);
 for(let i=0;i<3;i++)if(i!==item.answer)
  assert.equal(lab.evaluate(item.id,i).correct,false);
}
assert.throws(()=>lab.evaluate("unknown",0),/Choose one fictional/);
assert.throws(()=>lab.evaluate("aerodrome",3),/Choose one fictional/);
assert.throws(()=>lab.part("airspace","not-a-boundary"),/Unknown fictional diagram part/);
assert.throws(()=>lab.part("not-a-group","hold"),/Unknown fictional diagram group/);
assert.equal(lab.part("airport","hold").title,"Runway holding position");
assert.match(lab.part("airspace","floor").definition,/Published altitude/);
assert.deepEqual(lab.airportParts.map(x=>x.id),["apron","taxiway","hold","runway"]);
assert.deepEqual(lab.airspaceParts.map(x=>x.id),["lateral","floor","ceiling","status"]);
assert.deepEqual(lab.runway(9).number,"09");
assert.deepEqual(lab.runway(9).reciprocal,"27");
assert.deepEqual(lab.runway(27).reciprocal,"09");
assert.deepEqual(lab.runway(18).reciprocal,"36");
assert.deepEqual(lab.runway(36).reciprocal,"18");
assert.equal(lab.runway(36).nominalMagnetic,0);
for(let i=1;i<=36;i++){
 const p=lab.runway(i),q=lab.runway(Number(p.reciprocal));
 assert.equal(q.reciprocal,p.number,"Reciprocal of the reciprocal must equal the original runway number");
 assert.match(p.note,/Real runway designation comes from the published aerodrome chart/);
}
assert.throws(()=>lab.runway(0),/from 01 to 36/);
assert.throws(()=>lab.runway(37),/from 01 to 36/);
assert.throws(()=>lab.runway(9.5),/from 01 to 36/);
assert.match(lab.cases[3].explanation,/not a licence/);
const html=await readFile(new URL("../academy-coursebook.html",import.meta.url),"utf8");
const ui=await readFile(new URL("../academy-airspace-practical-ui.js",import.meta.url),"utf8");
const css=await readFile(new URL("../academy-airspace-practical.css",import.meta.url),"utf8");
for(const file of ["academy-airspace-practical-data.js","academy-airspace-practical-ui.js",
 "academy-airspace-practical.css","academy-in-app-notes.css"])
 assert.ok(html.includes(file),"Course 08 file missing from coursebook "+file);
assert.match(html,/id="airspacePracticalLab"/);
assert.match(ui,/agsa:coursebook-module/);
assert.match(ui,/moduleId!=="airspace"/);
assert.match(ui,/atlas\.getById\(id\)/);
assert.match(ui,/ctx\.drawImage\(picture/);
assert.match(ui,/showModal\(\)/);
assert.match(ui,/model\.evaluate\(item\.id,index\)/);
assert.match(ui,/model\.part\(group,id\)/);
assert.match(ui,/model\.runway\(Number\(select\.value\)\)/);
assert.doesNotMatch(ui,/\.innerHTML\b|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|window\.print\(|\.download\s*=/,
 "Course 08 must not store, upload, print or download learning notes");
assert.match(css,/@media\(max-width:590px\)/);
assert.match(css,/\.as-lab\[hidden\]\{display:none!important\}/);
assert.match(css,/\.as-lab-airport-map/);
assert.match(css,/\.as-lab-airspace-cross/);
console.log("Course 08: four picture-led cases, six unchanged original picture views, eight fictional airport/airspace parts and runway reciprocity verified.");
