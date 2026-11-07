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
for(const expected of ["index.html","cockpit-v3.html","instructor-review.html","standards-readiness.html","accreditation"]){
 const f=await stat(path.join(output,expected));assert.ok(f.isFile()||f.isDirectory(),expected+" missing");
}
for(const forbidden of ["services/training-api/src/http.mjs","services/training-api/portal/index.html","services/training-api/.env.example",".github/workflows/training-api.yml","docs/STUDENT-RECORDS-ARCHITECTURE.md"]){
 let found=false;
 try{await stat(path.join(output,forbidden));found=true;}catch(e){if(e.code!=="ENOENT")throw e;}
 assert.equal(found,false,"Forbidden deployment path: "+forbidden);
}
const homepage=await readFile(path.join(output,"index.html"),"utf8");
assert.match(homepage,/Aviation Ground School Academy/i);
console.log("GitHub Pages packaging passed: public lessons retained, entire private training API and implementation sources excluded.");
