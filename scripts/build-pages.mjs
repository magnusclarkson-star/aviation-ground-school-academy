import {readdir,copyFile,mkdir,rm,stat} from "node:fs/promises";
import path from "node:path";
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
 "assets/aircraft/r44-flightgear.ac",
 "assets/aircraft/r44-flightgear-texture.png"
];
const publicCuratedPaths=["accreditation/readiness-register.json",...publicAircraftFiles];
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
// CI must reject any deployment missing the models themselves: publishing
// only their JavaScript loaders silently reverts exterior views to placeholders.
for(const [asset,minBytes] of [
 ["assets/aircraft/c172-e737-optimized.glb",100000],
 ["assets/aircraft/r44-flightgear.ac",100000],
 ["assets/aircraft/r44-flightgear-texture.png",10000]
]){
 const details=await stat(path.join(output,asset));
 if(!details.isFile()||details.size<minBytes)throw Error("Missing imported aircraft asset: "+asset);
}
for(const required of ["index.html","cockpit-v3.html","standards-readiness.html","ground-school-modules.html","flight-sim.html"]){
 try{await stat(path.join(output,required));}catch{throw Error("Public page missing: "+required);}
}
for(const id of ["c172","r44","fa18","f22","f35","typhoon","su37"]){
 const file="aircraft-"+id+".webp";
 const details=await stat(path.join(output,file));
 if(!details.isFile()||details.size<10000)throw Error("Missing or incomplete aircraft image: "+file);
}
console.log("Built public Academy bundle ("+count+" files). Backend, tests, docs, repository configuration, credentials and private portal assets are excluded.");
