import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const pages=[
 "academy-coursebook.html",
 "academy-specialist-lectures.html",
 "academy-specialist-courses.html",
 "academy-approved-visual-gallery.html",
 "ai-instructor.html",
 "ground-school-modules.html",
 "study-lab.html",
 "aircraft-learning-paths.html"
];
const css=await readFile(new URL("../academy-in-app-notes.css",import.meta.url),"utf8");
assert.match(css,/@media print\{/);
assert.match(css,/body>\*:not\(#inAppOnlyPrintNotice\)\{display:none!important\}/);
assert.match(css,/#inAppOnlyPrintNotice\{[\s\S]*?display:block!important/);
for(const name of pages){
 const html=await readFile(new URL("../"+name,import.meta.url),"utf8");
 assert.ok(html.includes('href="academy-in-app-notes.css?v=20261114-locked-notes"'),
  "Educational page must load print guard: "+name);
 assert.ok(html.includes('id="inAppOnlyPrintNotice"'),
  "Educational page must display print-only restriction: "+name);
 assert.match(html,/Printing|printing|Save as PDF/,
  "Print-only restriction must clearly explain unavailability: "+name);
}
const chapter=await readFile(new URL("../academy-coursebook-chapter-ui.js",import.meta.url),"utf8");
assert.doesNotMatch(chapter,/Print these teaching notes|window\.print\(/,
 "Academy must not have a direct teaching-note print command");
const coursebook=await readFile(new URL("../academy-coursebook.html",import.meta.url),"utf8");
assert.ok(coursebook.includes("Export practice scores (no lesson notes)"),
 "A permitted progress-record export should be distinguishable from prohibited notes");
assert.ok(coursebook.includes("Export practice results only"));
assert.ok(!coursebook.includes('class="textbook-print"'));
assert.ok(coursebook.includes('id="downloadModuleCertificate"'),
 "Actual student document workflows must remain distinct from protected lesson notes");
assert.ok(coursebook.includes('id="printProgrammeCertificate"'),
 "Retain the existing separate self-study certificate PDF facility pending owner fee/issuance controls");
const builder=await readFile(new URL("../scripts/build-pages.mjs",import.meta.url),"utf8");
assert.match(builder,/academy-in-app-notes\.css/);
console.log("In-app course notes: 8 teaching/illustration pages guarded in print, textbook print button removed, notes not exported, certificate/document controls preserved.");
