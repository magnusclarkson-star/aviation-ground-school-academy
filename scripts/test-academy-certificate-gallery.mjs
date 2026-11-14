import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {validateMasterArtwork,MASTER_ARTWORK} from "../academy-secure/master-artwork.mjs";
const read=async name=>readFile(new URL("../"+name,import.meta.url),"utf8");
const html=await read("academy-certificate-gallery.html");
const css=await read("academy-certificate-gallery.css");
const js=await read("academy-certificate-gallery.js");
const home=await read("index.html"),course=await read("academy-coursebook.html");
assert.equal((html.match(/class="certificate-card"/g)||[]).length,3,
 "The three original approved designs must all be shown");
const designs=[
 ["formal","FORMAL_TRADITIONAL",7],
 ["scout","SCOUT_MODERN",5],
 ["enthusiast","ENTHUSIAST_NAVY_GOLD",5]
];
for(const [key,style,parts] of designs){
 assert.ok(html.includes('data-original="'+key+'"'),key+" card");
 assert.ok(html.includes('data-print="'+key+'"'),key+" print control");
 assert.match(html,/SAMPLE · NOT ISSUED/);
 const chunks=await Promise.all(Array.from({length:parts},(_,i)=>read(
  "assets/certificates/original-"+key+".part"+String(i).padStart(2,"0")+".txt"
 )));
 const bytes=Buffer.from(chunks.join(""),"base64");
 const valid=validateMasterArtwork(bytes,style);
 assert.equal(valid.sha256,MASTER_ARTWORK[style].sha256);
 assert.equal(valid.width,1491);
 assert.equal(valid.height,1055);
 assert.ok(bytes.length>2000000,"The exact original must be full quality");
}
assert.match(css,/\.original-artwork/);
assert.doesNotMatch(css,/\.certificate\.academy-standard|\.certificate\.formal\s*\{/,
 "Never redraw approved originals using generic certificate markup");
assert.match(js,/crypto\.subtle\.digest\("SHA-256"/);
assert.match(js,/window\.print\(\)/);
assert.doesNotMatch(html,/<input[^>]+type="file"/i);
assert.doesNotMatch(js,/indexedDB|localStorage|sessionStorage|XMLHttpRequest|sendBeacon/);
assert.ok(home.includes('href="academy-certificate-gallery.html"'));
assert.ok(course.includes('href="academy-certificate-gallery.html"'));
assert.match(css,/@media print/);
console.log("Exactly three SHA-256-verified owner-approved original certificate PNGs restored without uploads, substitutes or signatures.");
