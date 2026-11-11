/* Isolated asset evaluation: no C172 model is published or made live.
 * Original project README: https://github.com/GLSullivan/cessna
 * MIT declared, original Boba3d work attributed, edited by Greg Sullivan.
 */
import {createHash} from "node:crypto";
import {mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
const SOURCE="https://raw.githubusercontent.com/GLSullivan/cessna/e7982c365af03c6d9c34444503611c2f1aed88ad/public/media/models/Cessna172.glb";
const response=await fetch(SOURCE,{signal:AbortSignal.timeout(50000)});
if(!response.ok)throw Error("MIT model HTTP "+response.status);
const file=Buffer.from(await response.arrayBuffer());
assert.ok(file.length>1000000&&file.length<22000000);
assert.equal(file.toString("ascii",0,4),"glTF");
assert.equal(file.readUInt32LE(4),2);
assert.equal(file.readUInt32LE(8),file.length);
assert.equal(file.readUInt32LE(16),0x4e4f534a);
const jsonLength=file.readUInt32LE(12);
assert.ok(jsonLength<3e6);
const gltf=JSON.parse(file.subarray(20,20+jsonLength).toString("utf8"));
const nodes=(gltf.nodes||[]).map((x,i)=>({index:i,name:x.name||"",mesh:x.mesh,children:x.children?.length||0}));
const useful=nodes.filter(x=>/seat|pilot|cabin|cockpit|panel|gauge|prop|wing|flap|aileron|rudder|gear|door|window|glass|fuselage|body|wheel/i.test(x.name));
const stats={source:SOURCE,commit:"e7982c365af03c6d9c34444503611c2f1aed88ad",
 author:"Model contributed by Boba3d and heavily modified by Greg Sullivan",
 licenseDeclaration:"MIT in upstream README (verify third-party model terms before redistribution)",
 sha256:createHash("sha256").update(file).digest("hex"),
 bytes:file.length,
 gltf:{nodes:nodes.length,meshes:gltf.meshes?.length||0,
 materials:gltf.materials?.length||0,images:gltf.images?.length||0,
 textures:gltf.textures?.length||0,
 primitives:(gltf.meshes||[]).reduce((n,m)=>n+m.primitives.length,0),
 extensionsRequired:gltf.extensionsRequired||[],extensionsUsed:gltf.extensionsUsed||[]},
 matchingNodes:useful,firstNodes:nodes.slice(0,130),
 firstMaterials:(gltf.materials||[]).slice(0,20).map(x=>({name:x.name,alphaMode:x.alphaMode}))
};
await mkdir("artifacts",{recursive:true});
await writeFile("artifacts/c172-mit-candidate.glb",file);
await writeFile("artifacts/c172-mit-audit.json",JSON.stringify(stats,null,2));
console.log("Source audit",JSON.stringify({bytes:stats.bytes,sha256:stats.sha256,gltf:stats.gltf,
 matchingNodes:stats.matchingNodes.slice(0,30)},null,2));
