import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const lab=require("../academy-performance-practical-data.js");
const atlas=require("../academy-original-picture-atlas.js");
const core=require("../academy-coursebook-data.js");
assert.deepEqual(lab.validate(atlas),{
 moduleId:"performance",cases:4,pictureViews:6,conditionGroups:4,
 status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:lab.REVISION
});
assert.equal(core.modules.find(x=>x.id==="performance").number,10);
assert.equal(core.modules.find(x=>x.id==="performance").reviewStatus,"SME_REVIEW_REQUIRED");
assert.deepEqual(lab.cases.map(x=>x.id),["moments","envelope","conditions","missing-data"]);
assert.deepEqual(lab.cases.map(x=>x.pictures),[
 ["overview-08","detail-08"],["overview-08"],["detail-08"],["overview-08","detail-08"]
]);
for(const c of lab.cases){
 const correct=lab.evaluate(c.id,c.answer);
 assert.equal(correct.correct,true,c.id);
 assert.equal(correct.expected,c.options[c.answer]);
 assert.equal(correct.key.length,5);
 for(let i=0;i<3;i++)if(i!==c.answer)assert.equal(lab.evaluate(c.id,i).correct,false);
}
assert.throws(()=>lab.evaluate("unknown",0),/fictional weight-and-balance/);
assert.throws(()=>lab.evaluate("envelope",3),/fictional weight-and-balance/);
assert.throws(()=>lab.loading(-5),/invented rear-load/);
assert.throws(()=>lab.loading(15),/invented rear-load/);
assert.throws(()=>lab.loading(175),/invented rear-load/);
assert.deepEqual(lab.FICTIONAL.aftLoadOptions,[0,25,50,75,100,125,150]);
let previous=0;
for(const mass of lab.FICTIONAL.aftLoadOptions){
 const result=lab.loading(mass);
 assert.equal(result.totalMassKg,350+mass);
 assert.equal(result.totalMomentKgM,435+mass*2.6);
 assert.equal(result.stations.reduce((sum,s)=>sum+s.massKg,0),result.totalMassKg);
 assert.equal(result.stations.reduce((sum,s)=>sum+s.momentKgM,0),result.totalMomentKgM);
 assert.ok(Math.abs(result.cgM-(result.totalMomentKgM/result.totalMassKg))<0.001);
 assert.ok(result.cgM>=previous,"Aft loading must move the fictional CG aft");
 previous=result.cgM;
 assert.match(result.note,/INVENTED classroom numbers/);
}
const emptyRear=lab.loading(0),aft100=lab.loading(100),aft150=lab.loading(150);
assert.equal(emptyRear.totalMassKg,350);
assert.equal(emptyRear.totalMomentKgM,435);
assert.equal(emptyRear.cgM,1.243);
assert.equal(emptyRear.withinMass,true);
assert.equal(emptyRear.withinCg,true);
assert.equal(aft100.totalMassKg,450);
assert.equal(aft100.withinMass,true);
assert.equal(aft100.withinCg,false,"Must demonstrate mass OK and balance OUT simultaneously");
assert.equal(aft150.withinMass,false,"Heaviest classroom setting exceeds invented mass maximum");
assert.equal(aft150.withinCg,false);
assert.deepEqual(Object.keys(lab.CONDITIONS),["mass","density","wind","surface"]);
for(const name of Object.keys(lab.CONDITIONS)){
 const normal=lab.condition(name,false),adverse=lab.condition(name,true);
 assert.equal(normal.adverse,false);
 assert.equal(adverse.adverse,true);
 assert.ok(adverse.effect.length>85);
 assert.match(adverse.note,/Does not calculate runway metres/);
}
assert.throws(()=>lab.condition("other",true),/fictional environmental comparison/);
assert.throws(()=>lab.condition("mass","yes"),/fictional environmental comparison/);
assert.doesNotMatch(lab.cases.map(c=>c.situation+" "+c.explanation).join(" "),/safe takeoff at \d+ meters/i);
const html=await readFile(new URL("../academy-coursebook.html",import.meta.url),"utf8");
const ui=await readFile(new URL("../academy-performance-practical-ui.js",import.meta.url),"utf8");
const css=await readFile(new URL("../academy-performance-practical.css",import.meta.url),"utf8");
for(const path of ["academy-performance-practical-data.js","academy-performance-practical-ui.js",
 "academy-performance-practical.css","academy-in-app-notes.css"])
 assert.ok(html.includes(path),"Course 10 published asset missing "+path);
assert.match(html,/id="performancePracticalLab"/);
assert.match(ui,/agsa:coursebook-module/);
assert.match(ui,/id!=="performance"/);
assert.match(ui,/atlas\.getById\(id\)/);
assert.match(ui,/ctx\.drawImage\(pic/);
assert.match(ui,/drawBeam\(canvas,result\)/);
assert.match(ui,/model\.loading\(Number\(slider\.value\)\)/);
assert.match(ui,/model\.condition\(name,adverse\)/);
assert.match(ui,/showModal\(\)/);
assert.doesNotMatch(ui,/\.innerHTML\b|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|window\.print\(|\.download\s*=/,
 "Course 10 must not download, print, transmit or persist new learning content");
assert.match(css,/@media\(max-width:590px\)/);
assert.match(css,/\.perf-lab\[hidden\]\{display:none!important\}/);
console.log("Course 10 passed: four pictured lessons, six original approved views, exact invented mass-moment arithmetic, separate CG/mass checks, four qualitative performance cases and note restrictions.");
