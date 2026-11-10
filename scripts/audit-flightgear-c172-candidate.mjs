// Audit an independently published GPL-2.0 FlightGear C172P model before
// considering distribution or integration. No production website changes.
import {createHash} from "node:crypto";
import {mkdir,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const URL="https://theflightplaybook.com/assets/models/c172.glb?v=e0f7782552";
async function retrieve(){
 let last;
 for(let attempt=1;attempt<=3;attempt++){
  try{
   const response=await fetch(URL,{headers:{"User-Agent":
    "AGSA-C172-OpenSource-Asset-Audit/1.0 (+github.com/magnusclarkson-star/aviation-ground-school-academy)",
    "Accept":"model/gltf-binary,application/octet-stream,*/*"},signal:AbortSignal.timeout(18000)});
   if(!response.ok)throw Error("Candidate GLB HTTP "+response.status);
   const bytes=Buffer.from(await response.arrayBuffer());
   if(bytes.byteLength<500000||bytes.byteLength>15000000)
    throw Error("Unexpected model size: "+bytes.byteLength);
   if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2||
     bytes.readUInt32LE(8)!==bytes.byteLength)
    throw Error("Downloaded asset is not glTF 2.0 binary");
   return bytes;
  }catch(error){last=error;console.error("Download attempt",attempt,
    String(error.message||error));}
 }
 throw Error("Cannot inspect C172 source model: "+String(last?.message||last));
}
const buffer=await retrieve();
const jsonSize=buffer.readUInt32LE(12);
assert.equal(buffer.readUInt32LE(16),0x4e4f534a);
const json=JSON.parse(buffer.subarray(20,20+jsonSize).toString("utf8"));
const sha256=createHash("sha256").update(buffer).digest("hex");
const nodeNames=(json.nodes||[]).map((n,i)=>({i,name:n.name||"",mesh:n.mesh??null,
 skin:n.skin??null,children:n.children?.length||0}));
const useful=nodeNames.filter(n=>/cockpit|cabin|panel|instrument|seat|flap|aileron|elevator|rudder|prop|fuselage|wing|door|window|glas|yoke|tyre|wheel|landing/i.test(n.name));
const stats={
 sourcePage:"https://theflightplaybook.com/credits/",
 sourceUrl:URL,
 upstream:"https://github.com/c172p-team/c172p",
 declaredLicence:"GPL-2.0",
 sha256,bytes:buffer.length,
 gltf:{asset:json.asset,
  scenes:json.scenes?.length||0,nodes:json.nodes?.length||0,
  meshes:json.meshes?.length||0,skins:json.skins?.length||0,
  animations:json.animations?.length||0,
  textures:json.textures?.length||0,
  images:json.images?.length||0,
  materials:json.materials?.length||0,
  extensionsUsed:json.extensionsUsed||[],
  extensionsRequired:json.extensionsRequired||[],
  meshNames:(json.meshes||[]).map(x=>x.name||""),
  modelBoundsHint:(json.accessors||[]).filter(a=>a.type==="VEC3"&&a.min&&a.max)
   .slice(0,10).map(a=>({min:a.min,max:a.max}))},
 candidateNodes:useful,
 firstNodes:nodeNames.slice(0,80)
};
await mkdir(path.join(root,"artifacts"),{recursive:true});
await writeFile(path.join(root,"artifacts/c172-detailed-audit.json"),
 JSON.stringify(stats,null,2)+"\n");
await writeFile(path.join(root,"artifacts/c172-detailed-candidate.glb"),buffer);
console.log("C172 FlightGear candidate SHA256:",sha256);
console.log("Source GLB bytes:",buffer.length,
 "nodes:",stats.gltf.nodes,"meshes:",stats.gltf.meshes,
 "animations:",stats.gltf.animations,"materials:",stats.gltf.materials,
 "images:",stats.gltf.images);
console.log("Source extensions:",stats.gltf.extensionsUsed.join(", ")||"none");
console.log("Candidate named components:",JSON.stringify(useful.slice(0,95)));
console.log("Asset analysis written to artifacts. NOT yet distributed or used by production.");
