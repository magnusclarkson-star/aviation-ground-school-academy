'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {parseFa18GLB,FILE,REQUIRED}=require('../flight-sim-fa18-native.js');

// Small, purpose-built glTF 2.0 fixture with realistic full-aircraft bounds.
// It proves that a licensed textured GLB with distinct moving-node roles
// can load without needing any third-party downloaded bytes in the tests.
function fixture({source=true,rig=true,texture=true,scale=1}={}){
 const sections=[],views=[],accessors=[];
 const add=(bytes)=>{
  let start=sections.reduce((n,v)=>n+v.length,0);
  const pad=(4-(start%4))%4;
  if(pad){sections.push(Buffer.alloc(pad));start+=pad;}
  const data=Buffer.from(bytes);
  views.push({buffer:0,byteOffset:start,byteLength:data.length});
  sections.push(data);
  return views.length-1;
 };
 const pos=Float32Array.from([
  -6.5*scale,-1,-9*scale,6.5*scale,-1,-9*scale,
  0,2,9*scale,-2,-2,2,2,-2,2,0,1,5
 ]);
 const normal=Float32Array.from(Array.from({length:6},()=>[0,1,0]).flat());
 const uv=Float32Array.from([0,0,1,0,.5,1,0,.5,1,.5,.5,.9]);
 const tri=Uint16Array.from(Array.from({length:450},()=>[0,1,2]).flat());
 const attr=(array,type,componentType,count)=>{
  const v=add(Buffer.from(array.buffer,array.byteOffset,array.byteLength));
  accessors.push({bufferView:v,componentType,count,type});
  return accessors.length-1;
 };
 const p=attr(pos,'VEC3',5126,6),n=attr(normal,'VEC3',5126,6),
  u=attr(uv,'VEC2',5126,6),ind=attr(tri,'SCALAR',5123,tri.length);
 const png=Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64');
 const imageView=add(png);
 const nodes=[{name:'fa18e_body',mesh:0},
  ...REQUIRED.map((role,i)=>({name:'fa18e_'+role,mesh:0,
   extras:rig?{agsaControl:role,agsaPivot:[i%2===0?-1:1,-.6,-2]}:{}}))];
 const bin=Buffer.concat(sections);
 const json={
  asset:{version:'2.0',extras:{
   agsaAircraft:'fa18e',agsaCoordinateSystem:'Y_UP_Z_NOSE',
   agsaLicense:source?'CC-BY-4.0':'CC-BY-NC-4.0',
   agsaAuthor:'KOG_THORNS',
   agsaSourceUrl:'https://sketchfab.com/3d-models/boeing-fa-18e-super-hornet-9e852037bf2141dcb3fda17013958131'
  }},
  buffers:[{byteLength:bin.length}],bufferViews:views,accessors,
  images:texture?[{mimeType:'image/png',bufferView:imageView}]:[],
  textures:texture?[{source:0}]:[],
  materials:[{pbrMetallicRoughness:{
   baseColorFactor:[.8,.85,.89,1],
   ...(texture?{baseColorTexture:{index:0}}:{})
  }}],
  meshes:[{primitives:[{attributes:{POSITION:p,NORMAL:n,TEXCOORD_0:u},
    indices:ind,material:0}]}],
  nodes,scenes:[{nodes:nodes.map((_,i)=>i)}],scene:0
 };
 const jsonData=Buffer.from(JSON.stringify(json));
 const jsonPad=(4-(jsonData.length%4))%4;
 const jsonChunk=Buffer.concat([jsonData,Buffer.alloc(jsonPad,0x20)]);
 const binPad=Buffer.alloc((4-bin.length%4)%4);
 const binChunk=Buffer.concat([bin,binPad]);
 const file=Buffer.alloc(12+8+jsonChunk.length+8+binChunk.length);
 file.write('glTF',0);file.writeUInt32LE(2,4);
 file.writeUInt32LE(file.length,8);
 file.writeUInt32LE(jsonChunk.length,12);file.writeUInt32LE(0x4e4f534a,16);
 jsonChunk.copy(file,20);
 const end=20+jsonChunk.length;
 file.writeUInt32LE(binChunk.length,end);file.writeUInt32LE(0x004e4942,end+4);
 binChunk.copy(file,end+8);
 return file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);
}

test('authorised normalized textured F/A-18E imports with all 11 moving roles',()=>{
 const m=parseFa18GLB(fixture());
 assert.equal(FILE,'assets/aircraft/fa18e-licensed.glb');
 assert.equal(m.kind,'licensed-fa18e-glb');
 assert.equal(m.primitives.length,12);
 assert.equal(m.triangles,5400);
 assert.equal(m.images.length,1);
 assert.deepEqual(new Set(m.controls),new Set(REQUIRED));
 assert.ok(m.bounds[1]-m.bounds[0]>12);
 assert.ok(m.primitives.every(p=>p.colors.every(Number.isFinite)));
});
test('unlicensed, unrigged, nontextured, wrong-scale files are rejected',()=>{
 for(const args of [{source:false},{rig:false},{texture:false},{scale:.4}])
  assert.throws(()=>parseFa18GLB(fixture(args)));
});
test('corrupt or unavailable source fails without substituting another plane',()=>{
 const binary=fixture();
 const bad=binary.slice(0);
 new DataView(bad).setUint32(0,123,true);
 assert.throws(()=>parseFa18GLB(bad));
 assert.throws(()=>parseFa18GLB(new ArrayBuffer(200)));
});
