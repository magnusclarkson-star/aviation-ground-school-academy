import assert from "node:assert/strict";
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const core=require("../academy-coursebook-data.js");
const media=require("../academy-coursebook-professional-media.js");
const summary=media.validate(core.modules);
assert.deepEqual(summary,{modules:12,referenceImages:17,originalConceptDiagrams:12,totalVisuals:29});
assert.equal(new Set(media.ids).size,12);
assert.deepEqual(new Set(media.ids),new Set(core.modules.map(m=>m.id)));
const ids=new Set(),pages=new Set();
for(const m of core.modules){
 const entries=media.get(m.id);
 assert.ok(entries.length>=1&&entries.length<=2,"Professional source selection for "+m.id);
 for(const entry of entries){
  assert.equal(entry.moduleId,m.id);assert.ok(entry.section>=0&&entry.section<=2);
  assert.ok(!ids.has(entry.id),"Every visual uses a stable unique identifier: "+entry.id);
  assert.ok(!pages.has(entry.source),"Do not duplicate source image content across unrelated courses");
  ids.add(entry.id);pages.add(entry.source);
  assert.match(entry.src,/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[a-f0-9]\/[a-f0-9]{2}\//);
  assert.match(entry.fallbackSrc,/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[a-f0-9]\/[a-f0-9]{2}\//);
  assert.match(entry.source,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.match(entry.licenseUrl,/^https:\/\/creativecommons\.org\//);
  assert.ok(entry.credit.length>=5);
  assert.ok(entry.alt.length>=70&&entry.caption.length>=100);
  assert.ok(!/not current|not Sierra Leone|not a wiring diagram/i.test(entry.title),
   "Detailed qualification belongs in notes, not image heading");
 }
}
assert.equal(media.get("missing-module").length,0);
assert.ok(media.get("meteorology").some(p=>p.credit.includes("National Oceanic")));
assert.ok(media.get("systems").some(p=>p.credit.includes("Aviation")||p.credit.includes("Federal Aviation")));
assert.ok(media.get("human").some(p=>p.credit.includes("NASA")));
const html=fs.readFileSync(new URL("../academy-coursebook.html",import.meta.url),"utf8");
for(const name of ["academy-coursebook-professional-media.js","academy-coursebook-professional-ui.js","photoReferenceCount"])assert.ok(html.includes(name),name);
const ui=fs.readFileSync(new URL("../academy-coursebook-professional-ui.js",import.meta.url),"utf8");
assert.match(ui,/loading="lazy"|img\.loading="lazy"/);
assert.match(ui,/showModal/);
assert.match(ui,/academy-reference-photo/);
assert.match(ui,/licenseLink/);
assert.match(ui,/academy-image-fallback/);
assert.match(ui,/addEventListener\("error"|img\.onerror/);
assert.ok(!/\.innerHTML|eval\(|Function\(/.test(ui),"Never parse untrusted HTML into the coursebook");
assert.ok(!/localStorage|sessionStorage|navigator\.sendBeacon|XMLHttpRequest/.test(ui),"Reference photos cannot store learner records or transmit progress");
console.log("Professional reference imagery validated: 17 licensed sources, 12 companion diagrams, 29 coursebook visuals.");
