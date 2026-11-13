'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Airframe=require('../flight-sim-fa18-airframe.js');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,
 '../assets/aircraft/fa18e-native-manifest.json'),'utf8'));
function fixture(config){
 const cfg=config||{...manifest,requireControls:false};
 // Six simple vertices: bounding width:length=.75, height:length=.15.
 const pos=new Float32Array([-0.75,0,-1,.75,0,-1,.75,0,1,
  -.75,0,1,0,.30,0,0,.10,.6]);
 const norm=new Float32Array(pos.length);
 for(let i=0;i<norm.length;i+=3)norm[i+1]=1;
 const uv=new Float32Array(pos.length/3*2);
 const indices=new Uint16Array(4500);
 for(let i=0;i<indices.length;i+=3){
  indices[i]=0;indices[i+1]=1;indices[i+2]=4;
 }
 const chunks=[pos,norm,uv,indices],views=[];
 let binSize=0;const bytes=[];
 for(const a of chunks){
  views.push({buffer:0,byteOffset:binSize,byteLength:a.byteLength});
  bytes.push(new Uint8Array(a.buffer,a.byteOffset,a.byteLength));
  binSize+=a.byteLength;
 }
 const gltf={asset:{version:'2.0'},buffers:[{byteLength:binSize}],
  bufferViews:views,
  accessors:[
   {bufferView:0,componentType:5126,count:6,type:'VEC3'},
   {bufferView:1,componentType:5126,count:6,type:'VEC3'},
   {bufferView:2,componentType:5126,count:6,type:'VEC2'},
   {bufferView:3,componentType:5123,count:4500,type:'SCALAR'}
  ],materials:[{pbrMetallicRoughness:{baseColorFactor:[.7,.73,.76,1]}}],
  meshes:[{name:'hornet',primitives:[{
   attributes:{POSITION:0,NORMAL:1,TEXCOORD_0:2},indices:3,material:0
  }]}],nodes:[{name:'F/A-18E',mesh:0}],
  scenes:[{nodes:[0]}],scene:0};
 const enc=new TextEncoder().encode(JSON.stringify(gltf));
 const aligned=n=>(n+3)&~3,jsonLen=aligned(enc.length),binLen=aligned(binSize);
 const file=new ArrayBuffer(12+8+jsonLen+8+binLen),
  data=new DataView(file),all=new Uint8Array(file);
 data.setUint32(0,0x46546c67,true);data.setUint32(4,2,true);
 data.setUint32(8,file.byteLength,true);
 data.setUint32(12,jsonLen,true);data.setUint32(16,0x4e4f534a,true);
 all.fill(32,20,20+jsonLen);all.set(enc,20);
 const header=20+jsonLen;
 data.setUint32(header,binLen,true);
 data.setUint32(header+4,0x004e4942,true);
 let offset=header+8;
 for(const b of bytes){all.set(b,offset);offset+=b.length}
 return {file,cfg};
}
test('disabled official asset never fetches unverified binary',async()=>{
 assert.equal(manifest.enabled,false);
 assert.equal(manifest.requireControls,true);
 let calls=0;
 const result=await Airframe.ensureFA18(async url=>{
  calls++;assert.equal(url,Airframe.MANIFEST);
  return {ok:true,json:async()=>manifest};
 });
 assert.equal(result,null);assert.equal(calls,1);
});
test('native model requires documented license, axes and moving parts',()=>{
 assert.ok(Airframe.validateManifest({...manifest,requireControls:false}));
 assert.throws(()=>Airframe.validateManifest({...manifest,enabled:true}),
  /requires verified moving part/);
 assert.throws(()=>Airframe.validateManifest({...manifest,license:'unknown',requireControls:false}));
 assert.throws(()=>Airframe.validateManifest({...manifest,noseAxis:'+Y',requireControls:false}),
  /perpendicular/);
 assert.throws(()=>Airframe.validateManifest({...manifest,sourceModelId:'wrong',requireControls:false}));
});
test('offline GLB smoke test validates source-space orientation and texture-friendly GPU buffers',()=>{
 const {file,cfg}=fixture();
 const model=Airframe.parseFA18GLB(file,cfg);
 assert.equal(model.kind,'licensed-fa18e');
 assert.equal(model.triangles,1500);
 assert.equal(model.primitives.length,1);
 assert.equal(model.primitives[0].indices.length,4500);
 assert.equal(model.primitives[0].colors.length,18);
 assert.equal(model.images.length,0);
 assert.ok(Math.abs(model.bounds[5]-model.bounds[4]-18.31)<.001);
 assert.ok(model.primitives[0].positions.every(Number.isFinite));
 assert.ok(model.primitives[0].normals.every(Number.isFinite));
 assert.ok(model.primitives[0].colors.every(x=>x>=0&&x<=1));
});
test('GLB loader rejects missing header, truncation and incorrect spatial orientation',()=>{
 const {file,cfg}=fixture();
 assert.throws(()=>Airframe.parseFA18GLB(new ArrayBuffer(120),cfg));
 const wrong=file.slice(0);new DataView(wrong).setUint32(0,0,false);
 assert.throws(()=>Airframe.parseFA18GLB(wrong,cfg));
 assert.throws(()=>Airframe.parseFA18GLB(file,{...cfg,noseAxis:'+Y'}));
});
