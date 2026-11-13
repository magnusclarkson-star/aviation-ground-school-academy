#!/usr/bin/env node
'use strict';
// Asset intake gate for replacing the Typhoon with a SINGLE licensed GLB.
// This command never changes the live simulator or its approved aircraft.
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const filename=process.argv[2];
if(!filename){console.error('Usage: node scripts/inspect-typhoon-glb.mjs <licensed-typhoon.glb>');process.exit(2);}
const file=fs.readFileSync(path.resolve(filename));
function fail(message){throw Error('Typhoon GLB rejected: '+message);}
if(file.length<28||file.length>12*1024*1024)fail('model must be 28 bytes to 12 MiB (mobile budget)');
if(file.readUInt32LE(0)!==0x46546c67||file.readUInt32LE(4)!==2||file.readUInt32LE(8)!==file.length)fail('invalid glTF 2.0 header');
let offset=12,json=null,binLength=0;
while(offset+8<=file.length){
 const length=file.readUInt32LE(offset),type=file.readUInt32LE(offset+4);
 offset+=8;
 if(offset+length>file.length)fail('truncated chunk');
 if(type===0x4e4f534a){if(json!==null)fail('duplicate JSON chunk');json=JSON.parse(file.subarray(offset,offset+length).toString('utf8'));}
 if(type===0x004e4942)binLength+=length;
 offset+=length;
}
if(offset!==file.length||!json||!binLength)fail('missing JSON or binary chunk');
if(json.asset?.version!=='2.0'||!Array.isArray(json.nodes)||!Array.isArray(json.meshes))fail('missing glTF scene/mesh nodes');
if(!json.scenes?.length||json.scene===undefined)fail('missing active scene');
const unsupported=(json.extensionsRequired||[]).filter(x=>x!=='KHR_mesh_quantization');
if(unsupported.length)fail('unsupported required extension(s): '+unsupported.join(', '));
const nodes=json.nodes.map(n=>n.name||'');
let vertices=0,faces=0,primitives=0;
for(const mesh of json.meshes){
 for(const p of mesh.primitives||[]){
  if(p.mode!==undefined&&p.mode!==4)fail('non-triangle primitive');
  const pos=json.accessors?.[p.attributes?.POSITION];
  if(!pos||pos.type!=='VEC3'||!Number.isInteger(pos.count))fail('missing positions');
  const count=p.indices===undefined?pos.count:json.accessors?.[p.indices]?.count;
  if(!Number.isInteger(count)||count%3)fail('invalid triangle indices');
  vertices+=pos.count;faces+=count/3;primitives++;
 }
}
if(!primitives||vertices>150000||faces>100000)fail('geometry exceeds mobile budget or is empty');
const names=nodes.join(' ').toLowerCase();
const categories={
 fuselage:/fuselage|body|hull|airframe/.test(names),
 wings:/wing|delta/.test(names),
 canards:/canard|foreplane/.test(names),
 cockpit:/cockpit|canopy/.test(names),
 gear:/gear|wheel|undercarriage/.test(names),
 engines:/engine|nozzle|exhaust/.test(names)
};
const moving={
 leftCanard:nodes.filter(x=>/canard|foreplane/i.test(x)&&/left|port|\.l\b|_l\b/i.test(x)),
 rightCanard:nodes.filter(x=>/canard|foreplane/i.test(x)&&/right|starboard|\.r\b|_r\b/i.test(x)),
 gear:nodes.filter(x=>/gear|wheel|strut/i.test(x)),
 flapOrAileron:nodes.filter(x=>/flap|aileron|elevon/i.test(x))
};
const report={
 file:path.basename(filename),sha256:crypto.createHash('sha256').update(file).digest('hex'),
 bytes:file.length,vertices,triangles:faces,primitives,
 nodeCount:nodes.length,materials:json.materials?.length||0,
 textures:json.textures?.length||0,images:json.images?.length||0,
 categories,moving,requiredExtensions:json.extensionsRequired||[],
 acceptedForAutomaticActivation:false
};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(!Object.values(categories).every(Boolean)){
 console.error('Review required: source node names do not identify all structural groups.');
 process.exitCode=1;
}else{
 console.error('Geometry intake complete. Human visual/license and movement verification still required; live activation remains OFF.');
}
