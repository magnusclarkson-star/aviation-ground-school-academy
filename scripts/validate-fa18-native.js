#!/usr/bin/env node
'use strict';
// Offline, dependency-free release gate for an *authorized* F/A-18E download.
// Run: node scripts/validate-fa18-native.js
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {validateManifest,parseFA18GLB,MAX_GLB_BYTES}=
 require('../flight-sim-fa18-airframe.js');
const root=path.resolve(__dirname,'..');
const cfg=JSON.parse(fs.readFileSync(path.join(root,
 'assets/aircraft/fa18e-native-manifest.json'),'utf8'));
// Disabled manifest can be incomplete; require full control bindings only
// when enabling a source after inspection and licensing checks.
const out=validateManifest(cfg.enabled?cfg:{...cfg,requireControls:false});
const assetPath=path.join(root,cfg.path);
const exists=fs.existsSync(assetPath);
if(!cfg.enabled){
 console.log('F/A-18E native model: NOT ENABLED — existing flying aircraft preserved');
 if(exists)console.log('Authorized GLB candidate present but not activated');
 process.exit(0);
}
if(!exists)throw Error('Enabled Super Hornet GLB is absent: '+cfg.path);
const size=fs.statSync(assetPath).size;
if(size<100||size>MAX_GLB_BYTES)
 throw Error('F/A-18E GLB exceeds supported mobile asset budget');
const buf=fs.readFileSync(assetPath);
const hex=createHash('sha256').update(buf).digest('hex');
if(hex!==cfg.sha256)throw Error('Source GLB hash differs from approved manifest');
const model=parseFA18GLB(
 buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),cfg);
const names=new Set(model.controls);
for(const c of out.controls.values())
 if(!names.has(c.name))throw Error('Source animation node missing: '+c.name);
if(model.triangles>160000||model.vertices>180000)
 throw Error('Super Hornet source geometry exceeds release budget');
const overallPixels=Math.max(0,model.images.length)*2048*2048*4;
if(overallPixels>128*1024*1024)
 throw Error('Super Hornet images may exceed phone GPU texture budget');
console.log(JSON.stringify({
 source:cfg.sourceUrl,author:cfg.author,licence:cfg.license,
 sha256:hex,bytes:buf.length,triangles:model.triangles,
 vertices:model.vertices,images:model.images.length,
 controls:model.controls.length,bounds:model.bounds,status:'VALID'
},null,2));
