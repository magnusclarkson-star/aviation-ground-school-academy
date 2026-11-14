import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const lab=require("../academy-radio-practical-data.js");
const atlas=require("../academy-original-picture-atlas.js");
const core=require("../academy-coursebook-data.js");
assert.deepEqual(lab.validate(atlas),{
 moduleId:"communications",scenarios:4,pictureViews:6,alphabetLetters:26,
 status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:lab.REVISION
});
assert.equal(core.modules.find(x=>x.id==="communications").number,9);
assert.equal(core.modules.find(x=>x.id==="communications").reviewStatus,"SME_REVIEW_REQUIRED",
 "Optional radio exercises cannot approve the academic or regulatory course");
assert.deepEqual(lab.scenarios.map(x=>x.id),["first-contact","phonetics","readback","uncertainty"]);
assert.deepEqual(lab.scenarios.map(x=>x.pictures),[
 ["overview-06","detail-07"],["overview-06"],["detail-07"],["overview-06","detail-07"]
]);
for(const scenario of lab.scenarios){
 const correct=lab.evaluate(scenario.id,scenario.answer);
 assert.equal(correct.correct,true,scenario.id);
 assert.equal(correct.expected,scenario.options[scenario.answer]);
 assert.ok(correct.key.length>=5);
 assert.ok(scenario.dialogue.length>=2);
 for(const [i] of scenario.options.entries())if(i!==scenario.answer)
  assert.equal(lab.evaluate(scenario.id,i).correct,false,
   "Incorrect fictional radio concepts must be flagged for review");
}
assert.throws(()=>lab.evaluate("not-a-scenario",0),/fictional radio-practice response/);
assert.throws(()=>lab.evaluate("readback",3),/fictional radio-practice response/);
assert.throws(()=>lab.evaluate("readback",NaN),/fictional radio-practice response/);
assert.equal(lab.alphabet.length,26);
assert.deepEqual(lab.alphabet.map(x=>x.letter),Array.from({length:26},(_,i)=>String.fromCharCode(65+i)));
assert.deepEqual(lab.spell("ABC"),["Alfa","Bravo","Charlie"]);
assert.deepEqual(lab.spell("JuLiEtT"),["Juliett","Uniform","Lima","India","Echo","Tango","Tango"]);
assert.deepEqual(lab.spell(" A B C "),["Alfa","Bravo","Charlie"]);
assert.deepEqual(lab.spell(""),[]);
assert.equal(lab.alphabetWord("J"),"Juliett");
assert.equal(lab.alphabetWord("X"),"X-ray");
assert.throws(()=>lab.alphabetWord("1"),/Select a letter A to Z/);
assert.throws(()=>lab.spell("ABC-123"),/Use up to 24 classroom letters/);
assert.throws(()=>lab.spell("A".repeat(25)),/Use up to 24 classroom letters/);
assert.match(lab.scenarios[2].dialogue[0].line,/hold short runway zero niner/);
assert.match(lab.scenarios[2].dialogue[1].line,/runway two seven/);
assert.match(lab.scenarios[2].dialogue[2].line,/Correction, hold short runway zero niner/);
assert.match(lab.scenarios[2].dialogue[3].line,/Holding short runway zero niner/);
assert.doesNotMatch(lab.scenarios.map(x=>x.dialogue.map(d=>d.line).join(" ")).join(" "),/\b(?:118|119|120|121|122|123|124|125|126|127|128|129|130|131|132|133|134|135|136)\.\d+\b/,
 "Radio classroom examples should never publish a purported operational frequency");
const html=await readFile(new URL("../academy-coursebook.html",import.meta.url),"utf8");
const ui=await readFile(new URL("../academy-radio-practical-ui.js",import.meta.url),"utf8");
const css=await readFile(new URL("../academy-radio-practical.css",import.meta.url),"utf8");
for(const asset of ["academy-radio-practical-data.js","academy-radio-practical-ui.js","academy-radio-practical.css","academy-in-app-notes.css"])
 assert.ok(html.includes(asset),"Course 09 asset missing from Coursebook: "+asset);
assert.match(html,/id="radioPracticalLab"/);
assert.match(ui,/agsa:coursebook-module/);
assert.match(ui,/moduleId!=="communications"/);
assert.match(ui,/atlas\.getById\(id\)/);
assert.match(ui,/ctx\.drawImage\(image/);
assert.match(ui,/model\.evaluate\(item\.id,choice\)/);
assert.match(ui,/model\.alphabetWord\(item\.letter\)/);
assert.match(ui,/model\.spell\(input\.value\)/);
assert.match(ui,/root\.SpeechSynthesisUtterance/);
assert.match(ui,/root\.speechSynthesis\.cancel\(\)/);
assert.match(ui,/transcript\.hidden=!transcript\.hidden/);
assert.match(ui,/pagehide/);
assert.doesNotMatch(ui,/\.innerHTML\b|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|window\.print\(|\.download\s*=|getUserMedia|MediaRecorder|speechRecognition|SpeechRecognition/,
 "Course 09 radio practice must never record, network, store or export learner audio or teaching notes");
assert.match(css,/@media\(max-width:590px\)/);
assert.match(css,/\.radio-lab\[hidden\]\{display:none!important\}/);
assert.match(css,/\.radio-lab-letters/);
console.log("Course 09: four original-picture radio cases, six picture views, 26 ICAO words, fictional readback correction and device-only optional voice verified.");
