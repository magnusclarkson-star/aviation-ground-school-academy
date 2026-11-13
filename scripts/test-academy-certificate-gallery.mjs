import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=async name=>readFile(new URL("../"+name,import.meta.url),"utf8");
const html=await read("academy-certificate-gallery.html");
const css=await read("academy-certificate-gallery.css");
const js=await read("academy-certificate-gallery.js");
const home=await read("index.html"),course=await read("academy-coursebook.html");
assert.equal((html.match(/class="certificate-card"/g)||[]).length,3,"Three original printable specimen layouts");
for(const id of ["formal","scout","enthusiast"]){
 assert.match(html,new RegExp('class="certificate [^"]*" id="'+id+'"'));
 assert.match(html,new RegExp('data-print="'+id+'"'));
 assert.match(html,new RegExp('data-sample="'+id+'"'));
 assert.match(css,new RegExp('body\\[data-print-style='+id+'\\]'));
}
for(const [id,label] of [["sampleSeal","Show original Academy seal"],["sampleSignature","Show signature position"],["sampleInstructor","Show instructor sign-off"],["sampleNumber","Show example record"],["sampleDate","Show example date"]]){
 assert.ok(html.includes('id="'+id+'"'),id+" checkbox missing");
 assert.ok(html.includes(label),label+" label missing");
}
assert.equal((html.match(/SAMPLE · NOT ISSUED/g)||[]).length>=3,true,"Every specimen must remain visibly watermarked");
assert.equal((html.match(/DEMO-NOT-VALID/g)||[]).length,3,"Each specimen must use a nonvalid reference");
assert.match(js,/window\.print\(\)/);
assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|navigator\.sendBeacon/,
 "No student data or signature may be transmitted or stored by sample gallery");
assert.match(html,/No real students or identifiable signatures appear/);
assert.ok(home.includes('href="academy-certificate-gallery.html"'));
assert.ok(course.includes('href="academy-certificate-gallery.html"'));
assert.match(css,/@media print/);
console.log("Academy gallery checks passed: 3 original certificate specimens, watermark, print controls and private-data separation.");
