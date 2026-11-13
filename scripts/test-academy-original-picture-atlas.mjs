import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const atlas=require("../academy-original-picture-atlas.js");
const approved=require("../academy-approved-visuals.js");
const core=require("../academy-coursebook-data.js");
assert.deepEqual(atlas.validate(),{
 masterPictures:4,panelViews:33,
 groupCounts:{detailed:12,overview:12,photographs:4,cessna:5}
});
assert.equal(atlas.items.length,33);
assert.equal(new Set(atlas.items.map(i=>i.id)).size,33);
assert.equal(atlas.byGroup("all").length,33);
for(const source of Object.values(atlas.sources)){
 const pathname=path.join("assets","lecture-visuals",source.file);
 const data=fs.readFileSync(new URL("../"+pathname,import.meta.url));
 assert.ok(data.length>200000,"Same original asset must be bundled: "+source.file);
 assert.equal(data.toString("ascii",0,4),"RIFF");
 assert.equal(data.toString("ascii",8,12),"WEBP");
}
assert.equal(Object.keys(approved.assets).length,4);
for(const module of core.modules){
 const related=atlas.byModule(module.id);
 assert.ok(related.length>=2,"Show at least two previous picture panels for "+module.id);
 assert.ok(related.every(p=>p.src.startsWith("assets/lecture-visuals/")));
 assert.ok(related.every(p=>p.sourceWidth>p.rect[2]));
}
for(const item of atlas.items){
 assert.equal(atlas.getById(item.id),item);
 assert.ok(item.alt.includes(item.title));
 assert.ok(item.rect.every(Number.isInteger));
 assert.ok(item.groupLabel);
}
assert.equal(atlas.getById("not-a-panel"),null);
const gallery=fs.readFileSync(new URL("../academy-approved-visual-gallery.html",import.meta.url),"utf8");
assert.ok(gallery.includes("All 33 individual illustrations"));
for(const script of ["academy-original-picture-atlas.js","academy-original-picture-atlas-ui.js"])
 assert.ok(gallery.includes('src="'+script+'"'),"Gallery must load "+script);
assert.equal((gallery.match(/class="gallery-original-link"/g)||[]).length,4);
assert.ok(gallery.includes('id="atlasItems"'));
assert.ok(gallery.includes('id="atlasFilters"'));
const viewer=fs.readFileSync(new URL("../academy-original-picture-atlas-ui.js",import.meta.url),"utf8");
for(const token of ["ctx","sourceCache","drawImage","showModal","aria-label","all 33","panel-"]){
 if(token==="ctx")assert.ok(viewer.includes("context.drawImage"));
 else if(token==="all 33")assert.ok(viewer.includes("All 33 picture details")||viewer.includes("33 picture details"));
 else assert.ok(viewer.includes(token),"Panel viewer missing "+token);
}
assert.ok(!viewer.includes("fetch("),"All visuals are local Academy assets");
const book=fs.readFileSync(new URL("../academy-coursebook.html",import.meta.url),"utf8");
assert.ok(book.includes('src="academy-original-picture-atlas.js"'));
const moduleUI=fs.readFileSync(new URL("../academy-approved-visuals-ui.js",import.meta.url),"utf8");
assert.ok(moduleUI.includes("earlierPicturesForModule"));
assert.ok(moduleUI.includes("related-original-pictures"));
assert.ok(moduleUI.includes("Academy" )||moduleUI.includes("academy-approved-visual-gallery.html"));
console.log("All original picture checks passed: four immutable masters, 33 inspectable details and each of 12 lecture modules linked to its original pictorials.");
