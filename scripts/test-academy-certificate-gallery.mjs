import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
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
 assert.ok(!html.includes('data-print="'+key+'"'),key+" sample must not offer printing");
 assert.match(html,/SAMPLE · NOT ISSUED/);
 assert.match(html,new RegExp('src="assets/certificate-previews/'+key+'-sample\\.png"'));
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
assert.match(html,/academy-certificate-gallery\.css\?v=20261114-raster-safe/);
assert.match(html,/academy-certificate-gallery\.js\?v=20261114-raster-safe/);
assert.doesNotMatch(css,/\.sheet-wrap::after\{/,
 "Do not double overlay a watermark already embedded into sample pixels");
assert.match(css,/\.sample-watermark/);
assert.match(js,/protected sample displayed/i);
assert.doesNotMatch(js,/fetch\(|atob\(|crypto\.subtle|createObjectURL|original-formal|original-scout|original-enthusiast/,
 "Public gallery must never fetch or reconstruct clean master images");
const builder=await read("scripts/build-public-certificate-previews.mjs");
const deploy=await read("scripts/build-pages.mjs");
assert.match(builder,/bundledApprovedArtwork\(style\)/);
assert.match(builder,/sampleStampSvg\(width,height\)/);
assert.match(builder,/NOT ISSUED/);
assert.match(builder,/\.composite\(\[/);
assert.match(deploy,/buildPublicCertificatePreviews/);
assert.doesNotMatch(deploy,/originalCertificateSegments|\.\.\.originalCertificateSegments/,
 "Build must not publish raw original segments to GitHub Pages");
assert.doesNotMatch(css,/\.certificate\.academy-standard|\.certificate\.formal\s*\{/,
 "Never redraw approved originals using generic certificate markup");
assert.doesNotMatch(js,/window\.print\(|afterprint|data-print|printStyle/,
 "Public sample gallery must not contain print actions");
assert.match(html,/class="print-restriction"/);
assert.match(html,/Samples carry a strong repeated SAMPLE · NOT ISSUED watermark/);
assert.match(css,/@media print\{/);
assert.match(css,/\.site-head,main,footer\{display:none!important\}/);
assert.match(css,/\.print-restriction\{display:block!important/);
assert.doesNotMatch(html,/<input[^>]+type="file"/i);
assert.doesNotMatch(js,/indexedDB|localStorage|sessionStorage|XMLHttpRequest|sendBeacon/);
assert.ok(home.includes('href="academy-certificate-gallery.html"'));
assert.ok(course.includes('href="academy-certificate-gallery.html"'));
assert.match(css,/@media print/);
console.log("Three exact approved originals remain fingerprint-pinned; public gallery uses raster-watermarked samples only and disallows printing.");
