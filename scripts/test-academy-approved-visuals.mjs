import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const approved=require("../academy-approved-visuals.js");
const core=require("../academy-coursebook-data.js");
assert.deepEqual(approved.validate(),{sourcePictures:4,groundSchoolModules:12,specialistProgrammes:2,externalImages:0});
assert.deepEqual(new Set(Object.keys(approved.modulePanels)),new Set(core.modules.map(m=>m.id)));
const expected={
 "ground-school-visuals-12-topic.webp":"65e23c57aaad88de48c1d3b07f249753419bc170168ea2056935840efb778d2f",
 "aviation-learning-overview.webp":"c2fea803bf8467c97c06492beaaa227b6d69ec7fa5bd9a09ce7f44d1b45aff26",
 "aviation-real-world-photographs.webp":"341a30b6547de991f2617a94af80a5f1bf373ce12cadef912f0dc4b3d4c2ff67",
 "illustrated-cessna-structures-lecture.webp":"d0f9122b0586512d34fe6cbf4215fd2532ef1d0ab3655fea5c5e0a9e346ef3d7"
};
for(const [name,digest] of Object.entries(expected)){
 const b=fs.readFileSync(new URL("../assets/lecture-visuals/"+name,import.meta.url));
 assert.ok(b.length>200000&&b.length<1000000,"High-quality WebP image missing: "+name);
 assert.equal(b.toString("ascii",0,4),"RIFF");
 assert.equal(b.toString("ascii",8,12),"WEBP");
 assert.equal(createHash("sha256").update(b).digest("hex"),digest,
  "The image must match the specific previously presented Academy source encoding: "+name);
}
for(const item of Object.values(approved.assets))
 assert.ok(item.file in expected);
for(const m of core.modules){
 const art=approved.getModule(m.id);
 assert.ok(art,"Image not mapped to actual lecture "+m.id);
 assert.ok(art.src.startsWith("assets/lecture-visuals/"));
 assert.ok(art.caption.length>=100);
 assert.ok(art.alt.length>=65);
 assert.ok(art.notOperationalReference);
}
for(const id of ["avionics-engineering","aircraft-accident-investigation"]){
 const art=approved.getSpecialist(id);
 assert.equal(art.length,2);
 assert.ok(art.every(item=>item.src.startsWith("assets/lecture-visuals/")));
}
assert.equal(approved.getSpecialist("nonexistent").length,0);
assert.equal(approved.getModule("nonexistent"),null);
const html=fs.readFileSync(new URL("../academy-coursebook.html",import.meta.url),"utf8");
assert.ok(html.includes('src="academy-approved-visuals.js"'));
assert.ok(html.includes('src="academy-approved-visuals-ui.js"'));
assert.ok(!html.includes('src="academy-coursebook-professional-ui.js"'),
 "Previous unshown external visual substitutions should not appear as active lecture images");
const js=fs.readFileSync(new URL("../academy-approved-visuals-ui.js",import.meta.url),"utf8");
assert.match(js,/approved-visual-figure/);
assert.match(js,/showModal/);
assert.match(js,/aria-label/);
assert.ok(!/fetch\(|XMLHttpRequest|\.innerHTML/.test(js));
console.log("Previously shown Academy artwork verified: exactly four local WebPs, 12 module views, two specialist programmes and no substituted external photos.");
