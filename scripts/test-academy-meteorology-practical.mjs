import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const lab=require("../academy-meteorology-practical-data.js");
const atlas=require("../academy-original-picture-atlas.js");
const core=require("../academy-coursebook-data.js");
assert.deepEqual(lab.validate(atlas),{
 moduleId:"meteorology",cases:4,pictureViews:6,reportSamples:2,
 status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:lab.REVISION
});
assert.equal(core.modules.find(x=>x.id==="meteorology").number,6);
assert.equal(core.modules.find(x=>x.id==="meteorology").reviewStatus,"SME_REVIEW_REQUIRED");
assert.deepEqual(lab.cases.map(x=>x.id),["clouds","metar","taf","hazards"]);
assert.deepEqual(lab.cases.map(x=>x.pictures),[
 ["overview-04","detail-04"],["overview-04"],["detail-04"],["overview-04","detail-04"]
]);
for(const item of lab.cases){
 const result=lab.evaluate(item.id,item.answer);
 assert.equal(result.correct,true,item.id);
 assert.equal(result.expected,item.options[item.answer]);
 assert.ok(result.key.length>=4);
 for(let n=0;n<3;n++)if(n!==item.answer)
  assert.equal(lab.evaluate(item.id,n).correct,false);
}
assert.throws(()=>lab.evaluate("not-real",0),/fictional weather response/);
assert.throws(()=>lab.evaluate("taf",3),/fictional weather response/);
assert.throws(()=>lab.decode("bad",0),/Unknown fictional/);
assert.throws(()=>lab.decode("metar",300),/Unknown weather code/);
for(const [name,size] of [["metar",10],["taf",12]]){
 const report=lab.report(name);
 assert.ok(report.text.includes("ZZZZ"),"Only fictional reporting stations may be used");
 assert.equal(report.groups.length,size);
 for(const [i,group] of report.groups.entries()){
  assert.deepEqual(lab.decode(name,i),group);
  assert.ok(group.meaning.length>12);
  assert.ok(report.text.includes(group.token));
 }
}
assert.match(lab.decode("metar",4).meaning,/6,000 metres/);
assert.match(lab.decode("metar",6).meaning,/1,800 feet/);
assert.match(lab.decode("taf",3).meaning,/day 15 12:00 UTC/);
assert.match(lab.decode("taf",8).meaning,/14:00–18:00 UTC/);
assert.match(lab.decode("taf",10).meaning,/Thunderstorm/);
const html=await readFile(new URL("../academy-coursebook.html",import.meta.url),"utf8");
const ui=await readFile(new URL("../academy-meteorology-practical-ui.js",import.meta.url),"utf8");
const css=await readFile(new URL("../academy-meteorology-practical.css",import.meta.url),"utf8");
for(const name of ["academy-meteorology-practical-data.js","academy-meteorology-practical-ui.js",
 "academy-meteorology-practical.css","academy-in-app-notes.css"])
 assert.ok(html.includes(name),"Course 06 must ship "+name);
assert.match(html,/id="meteorologyPracticalLab"/);
assert.match(ui,/agsa:coursebook-module/);
assert.match(ui,/id!=="meteorology"/);
assert.match(ui,/atlas\.getById\(id\)/);
assert.match(ui,/ctx\.drawImage\(picture/);
assert.match(ui,/showModal\(\)/);
assert.match(ui,/model\.decode\(type,index\)/);
assert.match(ui,/model\.evaluate\(item\.id,choice\)/);
assert.match(ui,/aria-pressed/);
assert.doesNotMatch(ui,/\.innerHTML\b|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|window\.print\(|\.download\s*=/,
 "Course 06 cannot print, download, store or upload learning notes or invented reports");
assert.match(css,/@media\(max-width:590px\)/);
assert.match(css,/\.wx-lab\[hidden\]\{display:none!important\}/);
console.log("Course 06: 4 approved-weather-picture cases, 6 image views, 2 fully fictional coded reports, 22 selectable groups and private in-app-only exercise verified.");
