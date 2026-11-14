import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const lab=require("../academy-navigation-practical-data.js");
const atlas=require("../academy-original-picture-atlas.js");
const core=require("../academy-coursebook-data.js");
assert.deepEqual(lab.validate(atlas),{
 moduleId:"navigation",cases:4,pictureViews:6,calculators:2,
 status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:lab.REVISION
});
assert.equal(core.modules.find(x=>x.id==="navigation").number,7);
assert.equal(core.modules.find(x=>x.id==="navigation").reviewStatus,"SME_REVIEW_REQUIRED");
assert.deepEqual(lab.cases.map(x=>x.id),["chart-reading","wind-triangle","time-distance","verification"]);
assert.deepEqual(lab.cases.map(x=>x.pictures),[
 ["overview-05","detail-05"],["overview-05"],["detail-12"],["detail-05","detail-12"]
]);
for(const c of lab.cases){
 const good=lab.evaluate(c.id,c.answer);
 assert.equal(good.correct,true,c.id);
 assert.equal(good.expected,c.options[c.answer]);
 assert.ok(good.key.length>=4);
 for(let i=0;i<3;i++)if(i!==c.answer)
  assert.equal(lab.evaluate(c.id,i).correct,false,"Wrong choice must produce corrective feedback");
}
assert.throws(()=>lab.evaluate("unknown",0),/fictional navigation response/);
assert.throws(()=>lab.evaluate("chart-reading",3),/fictional navigation response/);
assert.throws(()=>lab.windTriangle(45,15),/fictional cardinal/);
assert.throws(()=>lab.windTriangle(0,-5),/fictional cardinal/);
assert.throws(()=>lab.windTriangle(0,30),/fictional cardinal/);
assert.throws(()=>lab.windTriangle(90,12),/fictional cardinal/);
const calm=lab.windTriangle(0,0);
assert.equal(calm.trueHeading,90);
assert.equal(calm.groundspeed,90);
const fromNorth=lab.windTriangle(0,20),fromSouth=lab.windTriangle(180,20);
assert.ok(Math.abs(fromNorth.trueHeading-77.2)<.15,"North crosswind should demand left/north-heading correction for eastbound track");
assert.ok(Math.abs(fromSouth.trueHeading-102.8)<.15,"South crosswind should demand right/south-heading correction");
assert.ok(Math.abs(fromNorth.groundspeed-87.7)<.2);
assert.equal(lab.windTriangle(90,20).trueHeading,90);
assert.equal(lab.windTriangle(90,20).groundspeed,70);
assert.equal(lab.windTriangle(270,20).groundspeed,110);
for(let w=0;w<=25;w+=5)for(const dir of [0,90,180,270]){
 const value=lab.windTriangle(dir,w);
 assert.ok(value.trueHeading>=0&&value.trueHeading<360&&value.groundspeed>0);
 assert.equal(value.desiredTrack,90);
 assert.match(value.note,/not approved flight planning/i);
}
assert.deepEqual(lab.timeEstimate(90,60).minutes,90);
assert.deepEqual(lab.timeEstimate(75,75).minutes,60);
assert.deepEqual(lab.timeEstimate(120,120).minutes,60);
assert.deepEqual(lab.timeEstimate(45,60).minutes,45);
assert.throws(()=>lab.timeEstimate(40,60),/fictional distance/);
assert.throws(()=>lab.timeEstimate(60,0),/fictional distance/);
assert.throws(()=>lab.timeEstimate(60,61),/fictional distance/);
for(let d=45;d<=120;d+=15)for(let gs=60;gs<=120;gs+=15){
 const v=lab.timeEstimate(d,gs);
 assert.ok(v.minutes>0&&v.minutes<=120);
 assert.match(v.note,/does not compute aircraft fuel/);
}
const html=await readFile(new URL("../academy-coursebook.html",import.meta.url),"utf8");
const ui=await readFile(new URL("../academy-navigation-practical-ui.js",import.meta.url),"utf8");
const css=await readFile(new URL("../academy-navigation-practical.css",import.meta.url),"utf8");
for(const file of ["academy-navigation-practical-data.js","academy-navigation-practical-ui.js",
 "academy-navigation-practical.css","academy-in-app-notes.css"])
 assert.ok(html.includes(file),"Course 07 file must be packaged: "+file);
assert.match(html,/id="navigationPracticalLab"/);
assert.match(ui,/agsa:coursebook-module/);
assert.match(ui,/moduleId!=="navigation"/);
assert.match(ui,/atlas\.getById\(id\)/);
assert.match(ui,/ctx\.drawImage\(pic/);
assert.match(ui,/drawTrainingMap\(map,data\)/);
assert.match(ui,/model\.windTriangle/);
assert.match(ui,/model\.timeEstimate/);
assert.match(ui,/showModal\(\)/);
assert.doesNotMatch(ui,/\.innerHTML\b|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|window\.print\(|\.download\s*=/,
 "Course 07 teaching notes and results must not be downloaded, printed, uploaded or persisted");
assert.match(css,/@media\(max-width:590px\)/);
assert.match(css,/\.nav-lab\[hidden\]\{display:none!important\}/);
console.log("Course 07: four original-picture navigation cases, six approved views, bounded true-heading wind model and NM/kt timing practice verified.");
