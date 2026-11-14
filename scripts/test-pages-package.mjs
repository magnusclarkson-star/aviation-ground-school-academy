import assert from "node:assert/strict";
import {readdir,readFile,stat} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const output=path.join(root,"dist-pages");
const names=await readdir(output);
for(const name of names){
 assert.ok(!name.startsWith("."),"Hidden source published: "+name);
 assert.ok(!["services","docs","scripts","node_modules","tests",".github",".git"].includes(name),"Private or internal directory leaked: "+name);
}
for(const expected of ["index.html","cockpit-v3.html","instructor-review.html","standards-readiness.html","ground-school-modules.html","academy-coursebook.html","academy-certificate-gallery.html","academy-certificate-gallery.css","academy-certificate-gallery.js","academy-coursebook-data.js","academy-coursebook.js","academy-coursebook.css","academy-coursebook-depth-a.js","academy-coursebook-depth-b1.js","academy-coursebook-depth-b2.js","academy-coursebook-depth-model.js","academy-coursebook-depth-ui.js","academy-coursebook-illustrations.js","academy-coursebook-pictorial-ui.js","academy-coursebook-professional-media.js","academy-coursebook-professional-ui.js","academy-certificate-core.mjs","academy-certificate-eligibility.mjs","academy-certificate-ui.mjs","academy-specialist-courses.html","academy-specialist-courses-data.js","academy-specialist-courses.js","academy-specialist-courses.css","academy-approved-visual-gallery.html","academy-specialist-lectures.html","academy-specialist-lectures.css","academy-specialist-lectures.js","academy-specialist-lesson-data.js","academy-specialist-technical-plates.js","academy-approved-visuals.js","academy-approved-visuals-ui.js","academy-original-picture-atlas.js","academy-original-picture-atlas-ui.js","academy-coursebook-visual-lessons.js","academy-coursebook-visual-ui.js","academy-coursebook-chapters-a.js","academy-coursebook-chapters-b.js","academy-coursebook-chapters-c.js","academy-coursebook-chapters.js","academy-coursebook-chapter-ui.js","academy-coursebook-layout-v2.css","academy-coursebook-layout-v2.js","flight-sim.html","accreditation"]){
 const f=await stat(path.join(output,expected));assert.ok(f.isFile()||f.isDirectory(),expected+" missing");
}
// A successful GitHub Pages job must actually include the high-fidelity
// airframes. Missing assets previously caused silent procedural placeholders.
for(const slug of ["ground-school-visuals-12-topic","aviation-learning-overview","aviation-real-world-photographs","illustrated-cessna-structures-lecture"]){
 const f=await stat(path.join(output,"assets/lecture-visuals/"+slug+".webp"));
 assert.ok(f.isFile()&&f.size>200000,"Owner-shown original illustration missing: "+slug);
}
for(const [asset,minBytes] of [
 ["assets/aircraft/c172-e737-optimized.glb",100000],
 ["assets/aircraft/r44-flightgear.ac",100000],
 ["assets/aircraft/r44-flightgear-texture.png",10000],
 ["assets/aircraft/ATTRIBUTION.md",100],
 ["assets/aircraft/R44-ATTRIBUTION.md",100],
 ["assets/aircraft/r44-molen-raven-ii.glb",500000],
 ["assets/aircraft/c172-molen-skyhawk.glb",1000000],
 ["assets/aircraft/MOLEN-LICENSE.txt",100],
 ["assets/aircraft/f22-fguk-exterior.json",500000],
 ["assets/aircraft/F22-ATTRIBUTION.md",300],
 ["assets/aircraft/f35b-fg-exterior.json",350000],
 ["assets/aircraft/F35-ATTRIBUTION.md",500],
 ["assets/aircraft/F35-GPL-3.0.txt",30000],
 ["assets/aircraft/su37-fguk-exterior.json",350000],
 ["assets/aircraft/SU37-ATTRIBUTION.md",300],
 ["assets/aircraft/typhoon-fg-exterior.json",300000],
 ["assets/aircraft/TYPHOON-ATTRIBUTION.md",300],
 ["assets/aircraft/R44-GPL-2.0-COPYING.txt",1000]
]){
 const details=await stat(path.join(output,asset));
 assert.ok(details.isFile()&&details.size>minBytes,"Imported aircraft missing from public bundle: "+asset);
}
for(const [file,minBytes] of [
 ["flight-sim-v3-preview.html",1200],
 ["flight-sim-v3.bundle.js",100000]
]){
 const fileInfo=await stat(path.join(output,file));
 assert.ok(fileInfo.isFile()&&fileInfo.size>minBytes,"V3 preview must be published with an actual Three.js bundle: "+file);
}
for(const forbidden of ["services/training-api/src/http.mjs","services/training-api/portal/index.html","services/training-api/.env.example",".github/workflows/training-api.yml","docs/STUDENT-RECORDS-ARCHITECTURE.md"]){
 let found=false;
 try{await stat(path.join(output,forbidden));found=true;}catch(e){if(e.code!=="ENOENT")throw e;}
 assert.equal(found,false,"Forbidden deployment path: "+forbidden);
}

// An actual installable flight-practice PWA must ship both raster icons,
// a same-origin manifest and its runtime offline cache worker.
const manifestFile=path.join(output,"flight-sim-manifest.json");
const install=JSON.parse(await readFile(manifestFile,"utf8"));
assert.equal(install.display,"standalone");
assert.equal(install.start_url,"./flight-sim.html");
assert.equal(install.scope,"./");
assert.equal(install.icons.length,2);
for(const size of [192,512]){
 const bytes=await readFile(path.join(output,"flight-sim-icon-"+size+".png"));
 assert.ok(bytes.length>500&&bytes.subarray(0,8).equals(
  Buffer.from([137,80,78,71,13,10,26,10])),"valid PNG icon "+size);
 assert.equal(bytes.readUInt32BE(16),size,"icon width "+size);
 assert.equal(bytes.readUInt32BE(20),size,"icon height "+size);
}
const shell=await readFile(path.join(output,"flight-sim.html"),"utf8");
assert.match(shell,/rel="manifest" href="flight-sim-manifest.json"/);
assert.match(shell,/serviceWorker.register\("\.\/flight-sim-sw.js"/);
const worker=await readFile(path.join(output,"flight-sim-sw.js"),"utf8");
assert.match(worker,/request.method!=="GET"/);
assert.match(worker,/url.origin!==ROOT.origin/);

const homepage=await readFile(path.join(output,"index.html"),"utf8");
assert.match(homepage,/Aviation Ground School Academy/i);
console.log("GitHub Pages packaging passed: public lessons retained, entire private training API and implementation sources excluded.");
