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
for(const expected of ["index.html","cockpit-v3.html","instructor-review.html","standards-readiness.html","ground-school-modules.html","flight-sim.html","accreditation"]){
 const f=await stat(path.join(output,expected));assert.ok(f.isFile()||f.isDirectory(),expected+" missing");
}
// A successful GitHub Pages job must actually include the high-fidelity
// airframes. Missing assets previously caused silent procedural placeholders.
for(const [asset,minBytes] of [
 ["assets/aircraft/c172-e737-optimized.glb",100000],
 ["assets/aircraft/r44-flightgear.ac",100000],
 ["assets/aircraft/r44-flightgear-texture.png",10000],
 ["assets/aircraft/ATTRIBUTION.md",100],
 ["assets/aircraft/R44-ATTRIBUTION.md",100],
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
const homepage=await readFile(path.join(output,"index.html"),"utf8");
assert.match(homepage,/Aviation Ground School Academy/i);
console.log("GitHub Pages packaging passed: public lessons retained, entire private training API and implementation sources excluded.");
