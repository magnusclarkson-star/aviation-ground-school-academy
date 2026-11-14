import assert from "node:assert/strict";
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const course=require("../academy-coursebook-data.js");
const chapters=require("../academy-coursebook-chapters.js");
const atlas=require("../academy-original-picture-atlas.js");
const result=chapters.validate(course.modules);
assert.deepEqual({modules:result.modules,sections:result.extendedSections,examples:result.workedExamples,glossary:result.glossaryDefinitions},
 {modules:12,sections:36,examples:36,glossary:72});
assert.ok(result.words>=12000,"A fee-worthy syllabus needs serious written teaching, not teaser paragraphs");
assert.equal(result.status,"INSTRUCTOR_REVIEW_REQUIRED");
let distinctExamples=new Set(),uniqueTerms=new Set(),min=Infinity;
for(const m of course.modules){
 const units=chapters.get(m.id);
 assert.equal(units.length,3);
 const words=chapters.moduleWordCount(m.id);
 assert.ok(words>=850,"At least 850 additional teaching words for each complete module: "+m.id);
 min=Math.min(min,words);
 for(const u of units){
  assert.equal(u.paragraphs.length,2);
  for(const p of u.paragraphs){
   assert.ok(p.split(/\s+/).length>=90,"Full explanatory paragraphs required in "+m.id);
   assert.ok(!/lorem ipsum|placeholder content/i.test(p));
  }
  assert.equal(u.worked.steps.length,3);
  assert.ok(!distinctExamples.has(u.worked.title),"Each worked example must teach a different issue");
  distinctExamples.add(u.worked.title);
  for(const term of u.terms)uniqueTerms.add(term[0]);
  assert.ok(u.review.answer.length>40);
 }
}
assert.ok(uniqueTerms.size>=65,"Provide broad explanatory vocabulary, not a repeated micro-glossary");
assert.equal(chapters.get("not-a-module"),null);
assert.equal(atlas.validate().panelViews,33);
for(const crop of atlas.items){
 const [x,y,w,h]=crop.rect,[ox,oy,ow,oh]=crop.originalRect;
 assert.ok(x>ox&&y>oy&&x+w<ox+ow&&y+h<oy+oh,
   "Individual crops must exclude image-cell edges and neighbouring panels: "+crop.id);
}
const html=fs.readFileSync(new URL("../academy-coursebook.html",import.meta.url),"utf8");
for(const file of ["academy-coursebook-chapters-a.js","academy-coursebook-chapters-b.js",
 "academy-coursebook-chapters-c.js","academy-coursebook-chapters.js","academy-coursebook-chapter-ui.js"])
 assert.ok(html.includes('src="'+file+'"'),"Missing substantial lecture content module "+file);
assert.ok(html.includes('class="hero scenic-hero"'));
assert.ok(html.includes('class="scenic-gold-strip"'));
assert.ok(html.includes('class="chapter-crest"'));
const css=fs.readFileSync(new URL("../academy-coursebook.css",import.meta.url),"utf8");
for(const token of [".scenic-hero",".hero-scene",".scenic-gold-strip",".textbook-prose",
 ".textbook-worked-case",".textbook-glossary",".textbook-selfcheck","#moduleTitle"])
 assert.ok(css.includes(token),"Academic scenic/gold theme or textbook styling missing: "+token);
const ui=fs.readFileSync(new URL("../academy-coursebook-chapter-ui.js",import.meta.url),"utf8");
for(const token of ["academy-textbook-chapter","textbook-worked-case","textbook-glossary",
 "textbook-selfcheck","DOM","agsa:coursebook-module"]){
 if(token==="DOM")assert.ok(ui.includes("DOMContentLoaded"));else assert.ok(ui.includes(token));
}
assert.ok(!/\.innerHTML|XMLHttpRequest|navigator\.sendBeacon|fetch\(/.test(ui),
 "Original textbook display is entirely local and never sends user records away");
const reader=fs.readFileSync(new URL("../academy-coursebook.js",import.meta.url),"utf8");
assert.ok(reader.includes("AGSAFullCoursebookChapters"),"Speech reader must include the new full written lessons");
assert.ok(reader.includes("audioGeneration"),"Audio must stop correctly during topic switches");
console.log("Academy full-textbook validation passed:",result,"minimum module words:",min,
 "unique terms:",uniqueTerms.size,"approved picture crop checks:",atlas.items.length);
