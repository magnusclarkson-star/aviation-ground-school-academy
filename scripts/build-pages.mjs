import {readdir,copyFile,mkdir,rm,stat} from "node:fs/promises";
import path from "node:path";
import {createFlightSimIcons} from "./build-flight-sim-icons.mjs";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const output=path.join(root,"dist-pages");
const allowedExt=new Set([".html",".js",".css",".svg",".png",".jpg",".jpeg",".webp",".gif",".ico",".woff2"]);
// Explicitly publish the external airframe meshes, their textures, and their
// redistribution notices. The root extension allowlist does not recurse into
// assets/ and must not be broadened to include private project directories.
const publicAircraftFiles=[
 "assets/aircraft/ATTRIBUTION.md",
 "assets/aircraft/R44-ATTRIBUTION.md",
 "assets/aircraft/R44-GPL-2.0-COPYING.txt",
 "assets/aircraft/c172-e737-optimized.glb",
 "assets/aircraft/c172-molen-skyhawk.glb",
 "assets/aircraft/r44-flightgear.ac",
 "assets/aircraft/r44-flightgear-texture.png",
 "assets/aircraft/r44-molen-raven-ii.glb",
 "assets/aircraft/MOLEN-LICENSE.txt",
 "assets/aircraft/f22-fguk-exterior.json",
 "assets/aircraft/F22-ATTRIBUTION.md",
 "assets/aircraft/f35b-fg-exterior.json",
 "assets/aircraft/F35-ATTRIBUTION.md",
 "assets/aircraft/F35-GPL-3.0.txt",
 "assets/aircraft/su37-fguk-exterior.json",
 "assets/aircraft/SU37-ATTRIBUTION.md",
 "assets/aircraft/typhoon-fg-exterior.json",
 "assets/aircraft/TYPHOON-ATTRIBUTION.md"
];
const publicCuratedPaths=["academy-certificate-core.mjs","academy-certificate-eligibility.mjs","academy-certificate-ui.mjs",
 "accreditation/readiness-register.json",
 "flight-sim-manifest.json",...publicAircraftFiles];
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
let count=0;
for(const entry of await readdir(root,{withFileTypes:true})){
 if(!entry.isFile()||entry.name.startsWith(".")||!allowedExt.has(path.extname(entry.name).toLowerCase()))continue;
 await copyFile(path.join(root,entry.name),path.join(output,entry.name));
 count++;
}
for(const item of publicCuratedPaths){
 const source=path.resolve(root,item);
 if(!source.startsWith(root+path.sep))throw Error("Invalid public curated path");
 const details=await stat(source);
 if(!details.isFile())throw Error("Expected a public file: "+item);
 const target=path.resolve(output,item);
 await mkdir(path.dirname(target),{recursive:true});
 await copyFile(source,target);
 count++;
}
// Generate valid 192/512px opaque raster icons as part of the allowlisted
// static website build, without introducing remote images or dependencies.
await createFlightSimIcons(output);
count+=2;
// The V3 experimental page must never be deployed with a missing engine.
// Its static bundle is produced by pinned tooling in the Pages workflow.
const v3Bundle=await stat(path.join(output,"flight-sim-v3.bundle.js"));
if(v3Bundle.size<100000||v3Bundle.size>2200000)
 throw Error("V3 Three.js bundle missing from published site");
await stat(path.join(output,"flight-sim-v3-preview.html"));
// CI must reject any deployment missing the models themselves: publishing
// only their JavaScript loaders silently reverts exterior views to placeholders.
for(const [asset,minBytes] of [
 ["assets/aircraft/c172-e737-optimized.glb",100000],
 ["assets/aircraft/c172-molen-skyhawk.glb",1000000],
 ["assets/aircraft/r44-flightgear.ac",100000],
 ["assets/aircraft/r44-flightgear-texture.png",10000],
 ["assets/aircraft/r44-molen-raven-ii.glb",500000]
]){
 const details=await stat(path.join(output,asset));
 if(!details.isFile()||details.size<minBytes)throw Error("Missing imported aircraft asset: "+asset);
}
for(const required of ["index.html","cockpit-v3.html","standards-readiness.html","ground-school-modules.html","academy-coursebook.html","academy-certificate-gallery.html","academy-certificate-gallery.css","academy-certificate-gallery.js","academy-coursebook-data.js","academy-coursebook.js","academy-coursebook.css","academy-coursebook-depth-a.js","academy-coursebook-depth-b1.js","academy-coursebook-depth-b2.js","academy-coursebook-depth-model.js","academy-coursebook-depth-ui.js","academy-coursebook-illustrations.js","academy-coursebook-pictorial-ui.js","academy-certificate-core.mjs","academy-certificate-eligibility.mjs","academy-certificate-ui.mjs","academy-specialist-courses.html","academy-specialist-courses-data.js","academy-specialist-courses.js","academy-specialist-courses.css","flight-sim.html"]){
 try{await stat(path.join(output,required));}catch{throw Error("Public page missing: "+required);}
}
for(const id of ["c172","r44","fa18","f22","f35","typhoon","su37"]){
 const file="aircraft-"+id+".webp";
 const details=await stat(path.join(output,file));
 if(!details.isFile()||details.size<10000)throw Error("Missing or incomplete aircraft image: "+file);
}
console.log("Built public Academy bundle ("+count+" files). Backend, tests, docs, repository configuration, credentials and private portal assets are excluded.");
