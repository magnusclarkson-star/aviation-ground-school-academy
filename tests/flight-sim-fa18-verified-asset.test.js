'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {validateManifest,verifyFA18Digest}=require('../flight-sim-fa18-airframe.js');
const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,
 '../assets/aircraft/fa18e-native-manifest.json'),'utf8'));
const authorized={...cfg,enabled:true,sha256:'ab'.repeat(32),requireControls:false};
const digestProvider={subtle:{digest:async(name,data)=>{
 assert.equal(name,'SHA-256');
 assert.ok(data instanceof ArrayBuffer);
 return new Uint8Array(32).fill(0xab).buffer;
}}};

test('authorized model activation requires a pinned 64-digit lowercase SHA-256',()=>{
 assert.ok(validateManifest(authorized));
 for(const value of ['',null,undefined,'a'.repeat(63),'G'.repeat(64),'aa']){
  assert.throws(()=>validateManifest({...authorized,sha256:value}),
   /verified SHA-256/);
 }
 assert.equal(validateManifest(cfg).controls.size,0);
});

test('browser verifies exact downloaded binary before calling the GLB parser',async()=>{
 const buffer=new Uint8Array([1,2,3]).buffer;
 assert.equal(await verifyFA18Digest(buffer,authorized,digestProvider),true);
 await assert.rejects(
  verifyFA18Digest(buffer,{...authorized,sha256:'ac'.repeat(32)},digestProvider),
  /mismatch/);
 await assert.rejects(verifyFA18Digest(buffer,authorized,{}),/unavailable/);
 await assert.rejects(verifyFA18Digest(null,authorized,digestProvider),
  /integrity configuration/);
});

test('offline validator exists and never bypasses an enabled-file hash check',()=>{
 const source=fs.readFileSync(path.join(__dirname,
 '../scripts/validate-fa18-native.js'),'utf8');
 assert.match(source,/createHash\('sha256'\)/);
 assert.match(source,/hex!==cfg\.sha256/);
 assert.match(source,/parseFA18GLB\(/);
 assert.match(source,/if\(!cfg\.enabled\)/);
});

test('runtime calls digest before accepting source geometry',()=>{
 const source=fs.readFileSync(path.join(__dirname,
 '../flight-sim-fa18-airframe.js'),'utf8');
 const before=source.indexOf('await verifyFA18Digest(bytes,cfg)');
 const after=source.indexOf('return parseFA18GLB(bytes,cfg)');
 assert.ok(before>0&&after>before);
 assert.match(source,/\["KHR_mesh_quantization","EXT_texture_webp"\]/);
});
