/* Offline, authenticated-source preparation for KOG_THORNS F/A-18E.
 * Requires an authorised Sketchfab GLB already downloaded by the owner.
 * Does not fetch, scrape, or bypass any hosted model download controls.
 * Input mesh is already baked to Y-up, +Z nose, metre scale, and has
 * individually separated + named gear/control node meshes.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {parseFa18GLB,REQUIRED}=require('../flight-sim-fa18-native.js');
const ROOT=path.resolve(__dirname,'..');
const dest=path.join(ROOT,'assets/aircraft/fa18e-licensed.glb');
function makeAsset(input){
 const file=Buffer.from(input);
 if(file.length<28||file.toString('ascii',0,4)!=='glTF'||
   file.readUInt32LE(4)!==2||file.readUInt32LE(8)!==file.length)
  throw Error('Input must be an uncompressed glTF 2.0 GLB');
 const jsonLength=file.readUInt32LE(12);
 if(file.readUInt32LE(16)!==0x4e4f534a)throw Error('GLB JSON chunk missing');
 const binOffset=20+jsonLength;
 if(binOffset+8>file.length||file.readUInt32LE(binOffset+4)!==0x004e4942)
  throw Error('GLB binary chunk missing');
 const data=JSON.parse(file.toString('utf8',20,20+jsonLength));
 const roles=new Set();
 for(const node of data.nodes||[]){
  const role=REQUIRED.find(name=>node.name==='fa18e_'+name);
  if(!role)continue;
  // Use source-supplied hinge coordinates, never silently guess pivots.
  const pivot=node.extras?.agsaPivot;
  if(!Array.isArray(pivot)||pivot.length!==3||
    !pivot.every(x=>Number.isFinite(x)&&Math.abs(x)<15))
   throw Error('Missing hinge pivot for '+node.name);
  node.extras={...node.extras,agsaControl:role};
  roles.add(role);
 }
 for(const role of REQUIRED)
  if(!roles.has(role))throw Error('Source lacks mesh named fa18e_'+role);
 data.asset=data.asset||{version:'2.0'};
 data.asset.extras={...(data.asset.extras||{}),
  agsaAircraft:'fa18e',agsaCoordinateSystem:'Y_UP_Z_NOSE',
  agsaLicense:'CC-BY-4.0',agsaAuthor:'KOG_THORNS',
  agsaSourceUrl:'https://sketchfab.com/3d-models/boeing-fa-18e-super-hornet-9e852037bf2141dcb3fda17013958131'};
 const json=Buffer.from(JSON.stringify(data));
 const padded=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
 const binLen=file.readUInt32LE(binOffset);
 const bin=Buffer.from(file.subarray(binOffset+8,binOffset+8+binLen));
 const paddedBin=Buffer.concat([bin,Buffer.alloc((4-bin.length%4)%4)]);
 const packed=Buffer.alloc(12+8+padded.length+8+paddedBin.length);
 packed.write('glTF',0,'ascii');
 packed.writeUInt32LE(2,4);packed.writeUInt32LE(packed.length,8);
 packed.writeUInt32LE(padded.length,12);packed.writeUInt32LE(0x4e4f534a,16);
 padded.copy(packed,20);
 const o=20+padded.length;
 packed.writeUInt32LE(paddedBin.length,o);packed.writeUInt32LE(0x004e4942,o+4);
 paddedBin.copy(packed,o+8);
 const model=parseFa18GLB(packed.buffer.slice(
  packed.byteOffset,packed.byteOffset+packed.byteLength));
 return {packed,model};
}
if(require.main===module){
 const input=process.argv[2];
 if(!input){
  console.error('Usage: node tools/prepare-fa18-native.js /path/to/authorised-export.glb');
  process.exitCode=2;
 }else{
  try{
   const {packed,model}=makeAsset(fs.readFileSync(input));
   fs.mkdirSync(path.dirname(dest),{recursive:true});
   fs.writeFileSync(dest,packed);
   console.log('Validated F/A-18E GLB:',model.triangles,'triangles,',
    model.images.length,'embedded texture(s),',model.controls.length,
    'moving channels; saved to',dest);
   console.log('Retain KOG_THORNS CC BY attribution with every distribution.');
  }catch(e){console.error('F/A-18E source rejected:',e.message);process.exitCode=1;}
 }
}
module.exports={makeAsset};
