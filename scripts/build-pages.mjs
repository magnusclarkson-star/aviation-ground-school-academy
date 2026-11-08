import {readdir,copyFile,mkdir,rm,stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const output=path.join(root,"dist-pages");
const allowedExt=new Set([".html",".js",".css",".svg",".png",".jpg",".jpeg",".webp",".gif",".ico",".woff2"]);
const publicCuratedPaths=["accreditation/readiness-register.json"];
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
for(const required of ["index.html","cockpit-v3.html","standards-readiness.html","ground-school-modules.html"]){
 try{await stat(path.join(output,required));}catch{throw Error("Public page missing: "+required);}
}
console.log("Built public Academy bundle ("+count+" files). Backend, tests, docs, repository configuration, credentials and private portal assets are excluded.");
