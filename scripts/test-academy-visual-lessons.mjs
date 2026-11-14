import assert from "node:assert/strict";
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const core=require("../academy-coursebook-data.js");
const atlas=require("../academy-original-picture-atlas.js");
const visual=require("../academy-coursebook-visual-lessons.js");
const result=visual.validate(core.modules,atlas);
assert.equal(result.modules,12);
assert.equal(result.topics,36);
assert.equal(result.assessmentsUnchanged,true);
assert.ok(result.originalImagePlacements>=25,"Most individual section explanations need a relevant original picture");
const usedPictures=new Set();
for(const m of core.modules){
 const notes=visual.get(m.id);
 assert.equal(notes.length,3,"Three enriched core sections required in "+m.id);
 for(const [i,note] of notes.entries()){
  if(note.picture){
   assert.ok(atlas.getById(note.picture),"Illustration from approved 33-panel atlas only");
   usedPictures.add(note.picture);
  }
  assert.ok(note.explain.length>=300,"Professionally detailed concept explanation in "+m.id+" section "+i);
  assert.match(note.misconception,/[.?!]$/);
  assert.match(note.question,/[.?!]$/);
  assert.match(note.answer,/[.?!]$/);
 }
}
assert.ok(usedPictures.size>=20,"Visuals should not be identical in every section");
assert.equal(visual.get("not-a-module"),null);
const page=fs.readFileSync(new URL("../academy-coursebook.html",import.meta.url),"utf8");
for(const file of ["academy-coursebook-visual-lessons.js","academy-coursebook-visual-ui.js"])
 assert.ok(page.includes('src="'+file+'"'),file+" missing from coursebook");
assert.ok(page.includes('id="visualSectionNavigation"'));
const js=fs.readFileSync(new URL("../academy-coursebook-visual-ui.js",import.meta.url),"utf8");
for(const token of ["visual-manual-cover","visual-manual-section","visual-detail-trigger","visual-observation-check","showModal","related-original-pictures","AGSAVisualFirstLessons","context.drawImage"])
 assert.ok(js.includes(token),"Visual manual renderer missing "+token);
assert.ok(!/\.innerHTML\b|fetch\(|XMLHttpRequest|navigator\.sendBeacon/.test(js),
 "No HTML injection, external substitutes or student-record transmissions");
const css=fs.readFileSync(new URL("../academy-coursebook.css",import.meta.url),"utf8");
assert.ok(css.includes("visual-manual-cover"));
assert.ok(css.includes("visual-manual-section"));
assert.ok(css.includes("@media print"));
assert.ok(css.includes("max-width:540px"));
console.log("Visual-first Ground School validation passed:",result,"distinct photo details:",usedPictures.size);
