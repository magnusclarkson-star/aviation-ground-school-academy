/* Optional original textured F/A-18E native 3D import. No third-party
 * model is bundled here: only an authorised, locally converted GLB may be
 * installed at FILE. In its absence the existing flyable F/A-18 is retained.
 * A normalised export must carry the contract documented in
 * assets/aircraft/FA18E-NATIVE-IMPORT.md.
 */
(function(root){"use strict";
const FILE="assets/aircraft/fa18e-licensed.glb";
// Only the validated packaging tool enables the optional asset.
const ACTIVE=false;
const MAX_BYTES=24*1024*1024,MAX_TEXTURE_BYTES=4*1024*1024;
const REQUIRED=["leftFlap","rightFlap","leftAileron","rightAileron",
 "elevatorLeft","elevatorRight","rudderLeft","rudderRight",
 "noseGear","mainGearLeft","mainGearRight"];
const axes={leftFlap:1,rightFlap:1,leftAileron:1,rightAileron:1,
 elevatorLeft:1,elevatorRight:1,rudderLeft:2,rudderRight:2,
 noseGear:4,mainGearLeft:4,mainGearRight:4};
let loaded=null,pending=null;
const finite=Number.isFinite;
function parseFa18GLB(file){
 if(!(file instanceof ArrayBuffer)||file.byteLength<100||
    file.byteLength>MAX_BYTES)throw Error("F/A-18E source size invalid");
 const dv=new DataView(file),u32=p=>dv.getUint32(p,true);
 if(u32(0)!==0x46546c67||u32(4)!==2||u32(8)!==file.byteLength)
  throw Error("F/A-18E requires glTF 2 GLB");
 const jsonBytes=u32(12);
 if(u32(16)!==0x4e4f534a||jsonBytes<80||jsonBytes>2*1024*1024)
  throw Error("F/A-18E JSON chunk invalid");
 const binHead=20+jsonBytes;
 if(binHead+8>file.byteLength||u32(binHead+4)!==0x004e4942)
  throw Error("F/A-18E binary chunk missing");
 const binStart=binHead+8,binBytes=u32(binHead);
 if(binStart+binBytes>file.byteLength)throw Error("F/A-18E buffer overflow");
 const gltf=JSON.parse(new TextDecoder().decode(new Uint8Array(file,20,jsonBytes)));
 const extras=gltf.asset?.extras||{};
 if(extras.agsaAircraft!=="fa18e"||
    extras.agsaCoordinateSystem!=="Y_UP_Z_NOSE"||
    extras.agsaLicense!=="CC-BY-4.0"||
    extras.agsaAuthor!=="KOG_THORNS"||
    extras.agsaSourceUrl!==
    "https://sketchfab.com/3d-models/boeing-fa-18e-super-hornet-9e852037bf2141dcb3fda17013958131")
  throw Error("F/A-18E conversion, source attribution or axis contract missing");
 // Reject Draco / Meshopt / external dependencies. The native WebGL2
 // renderer supports uncompressed geometry and embedded PNG/JPEG/WebP.
 if((gltf.extensionsRequired||[]).some(x=>x!=="KHR_mesh_quantization"))
  throw Error("F/A-18E compressed/unsupported glTF extension");
 if((gltf.buffers||[]).length!==1||gltf.buffers[0].uri||
    gltf.buffers[0].byteLength>binBytes)
  throw Error("F/A-18E requires a single embedded buffer");
 const views=gltf.bufferViews||[],accessors=gltf.accessors||[];
 function view(id){
  const v=views[id];
  if(!v||v.buffer!==0||!Number.isInteger(v.byteLength)||
     !Number.isInteger(v.byteOffset||0)||(v.byteOffset||0)<0||
     v.byteLength<0||(v.byteOffset||0)+v.byteLength>binBytes)
   throw Error("F/A-18E buffer view invalid");
  return v;
 }
 function read(id){
  const a=accessors[id],sizes={5121:1,5122:2,5123:2,5125:4,5126:4},
   comps={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
  if(!a||a.sparse||!sizes[a.componentType]||!comps[a.type]||
     !Number.isInteger(a.count)||a.count<0||a.count>150000)
   throw Error("F/A-18E attribute type/count unsupported");
  const v=view(a.bufferView),n=comps[a.type],b=sizes[a.componentType],
   stride=v.byteStride||n*b,at=a.byteOffset||0;
  if(stride<n*b||at<0||at+(a.count-1)*stride+n*b>v.byteLength)
   throw Error("F/A-18E accessor out of bounds");
  const data=new DataView(file,binStart+(v.byteOffset||0),v.byteLength);
  const out=new Float32Array(a.count*n);
  for(let i=0;i<a.count;i++)for(let k=0;k<n;k++){
   const off=at+i*stride+k*b;
   let value=a.componentType===5126?data.getFloat32(off,true):
    a.componentType===5121?data.getUint8(off):
    a.componentType===5122?data.getInt16(off,true):
    a.componentType===5123?data.getUint16(off,true):data.getUint32(off,true);
   if(a.normalized){
    if(a.componentType===5121)value/=255;
    else if(a.componentType===5122)value=Math.max(-1,value/32767);
    else if(a.componentType===5123)value/=65535;
   }
   if(!finite(value))throw Error("F/A-18E nonfinite vertex");
   out[i*n+k]=value;
  }
  return {data:out,count:a.count,type:a.type};
 }
 const imgs=(gltf.images||[]).map(v=>{
  if(!["image/webp","image/jpeg","image/png"].includes(v.mimeType)||
     v.uri||!Number.isInteger(v.bufferView))
   throw Error("F/A-18E requires embedded PNG/JPEG/WebP images");
  const a=view(v.bufferView);
  if(a.byteLength>2*1024*1024)throw Error("F/A-18E image too large");
  return new Uint8Array(file,binStart+(a.byteOffset||0),a.byteLength).slice();
 });
 if(!imgs.length||imgs.reduce((n,v)=>n+v.length,0)>MAX_TEXTURE_BYTES)
  throw Error("F/A-18E requires compact embedded textures");
 const imageMimeTypes=gltf.images.map(v=>v.mimeType);
 // Conversion pipeline bakes all transforms into POSITION/NORMAL. Any
 // nontrivial node transform is rejected to avoid misplaced gear or fins.
 const primitives=[],controls=new Set();
 let triangles=0,vertices=0,texturedTriangles=0;
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 const visited=new Set();
 function traverse(id,parentControl=null,parentPivot=null){
  const node=gltf.nodes?.[id];
  if(!node||visited.has(id))throw Error("F/A-18E scene graph invalid");
  visited.add(id);
  if(node.matrix||node.scale||node.rotation||node.translation)
   throw Error("F/A-18E node transforms must be baked");
  const label=String(node.name||"").slice(0,90);
  const meta=node.extras||{};
  const control=meta.agsaControl||parentControl;
  if(control&&!axes[control])throw Error("F/A-18E unknown moving part "+control);
  const pivot=meta.agsaPivot||parentPivot||[0,0,0];
  if(control&&(!Array.isArray(pivot)||pivot.length!==3||
     !pivot.every(x=>finite(x)&&Math.abs(x)<=15)))
   throw Error("F/A-18E moving-part pivot invalid");
  if(node.mesh!==undefined){
   const mesh=gltf.meshes?.[node.mesh];
   if(!mesh)throw Error("F/A-18E mesh missing");
   for(const primitive of mesh.primitives||[]){
    if(primitive.mode!==undefined&&primitive.mode!==4)
     throw Error("F/A-18E must be triangles");
    const pos=read(primitive.attributes?.POSITION),
     norm=read(primitive.attributes?.NORMAL),
     uv=read(primitive.attributes?.TEXCOORD_0),
     index=read(primitive.indices);
    if(pos.type!=="VEC3"||norm.type!=="VEC3"||uv.type!=="VEC2"||
       index.type!=="SCALAR"||pos.count!==norm.count||
       pos.count!==uv.count||index.count%3)
     throw Error("F/A-18E required geometry/UV missing");
    const indices=Uint16Array.from(index.data);
    if(pos.count>65535||index.data.some(x=>!Number.isInteger(x)||x<0||x>=pos.count))
     throw Error("F/A-18E index/primitive over mobile budget");
    const mat=gltf.materials?.[primitive.material||0]||{};
    const pbr=mat.pbrMetallicRoughness||{};
    const rgba=pbr.baseColorFactor||[1,1,1,1];
    const texId=pbr.baseColorTexture?.index;
    const imageId=texId===undefined?null:
     gltf.textures?.[texId]?.extensions?.EXT_texture_webp?.source??
     gltf.textures?.[texId]?.source;
    if(imageId!==null&&!imgs[imageId])
     throw Error("F/A-18E texture reference invalid");
    const positions=pos.data,normals=norm.data,colors=new Float32Array(positions.length);
    for(let j=0;j<positions.length;j+=3){
     for(let axis=0;axis<3;axis++){
      const value=positions[j+axis];
      lo[axis]=Math.min(lo[axis],value);
      hi[axis]=Math.max(hi[axis],value);
     }
     const len=Math.hypot(normals[j],normals[j+1],normals[j+2]);
     if(len<.01||!finite(len))throw Error("F/A-18E bad normals");
     normals[j]/=len;normals[j+1]/=len;normals[j+2]/=len;
     colors.set(rgba.slice(0,3),j);
    }
    primitives.push({positions,normals,uvs:uv.data,colors,indices,imageId,
     alphaMask:mat.alphaMode==="MASK",alphaCutoff:mat.alphaCutoff??.5,
     opacity:mat.alphaMode==="BLEND"?(rgba[3]??1):1,
     partName:control||null,partAxis:control?axes[control]:0,
     partPivot:control?pivot:[0,0,0],sourceName:label||"fa18e_body"});
    triangles+=indices.length/3;vertices+=pos.count;
    if(imageId!==null)texturedTriangles+=indices.length/3;
    if(control)controls.add(control);
   }
  }
  for(const child of node.children||[])traverse(child,control,pivot);
 }
 const scene=gltf.scenes?.[gltf.scene||0];
 if(!scene?.nodes?.length)throw Error("F/A-18E active scene absent");
 for(const id of scene.nodes)traverse(id);
 const span=lo.map((v,i)=>hi[i]-v);
 if(primitives.length<12||triangles<4000||triangles>120000||
    texturedTriangles<triangles*.5||
    vertices>180000||!span.every(finite)||
    span[0]<11||span[0]>18||span[1]<2||span[1]>7||
    span[2]<15||span[2]>22||Math.abs((lo[0]+hi[0])/2)>1.5||
    hi[2]<6||lo[2]>-5)
  throw Error("F/A-18E mesh orientation, proportions or budget invalid");
 for(const role of REQUIRED)
  if(!controls.has(role))throw Error("F/A-18E missing moving mesh: "+role);
 return {primitives,images:imgs,imageMimeTypes,vertices,triangles,
  controls:[...controls],bounds:[lo[0],hi[0],lo[1],hi[1],lo[2],hi[2]],
  kind:"licensed-fa18e-glb"};
}
function ensureFa18(fetcher=root?.fetch?.bind(root)){
 if(loaded)return Promise.resolve(loaded);
 if(!pending){
  if(!fetcher)return Promise.reject(Error("F/A-18E fetch unavailable"));
  pending=Promise.resolve(fetcher(FILE)).then(response=>{
   if(!response.ok)throw Error("F/A-18E asset missing: HTTP "+response.status);
   return response.arrayBuffer();
  }).then(parseFa18GLB).then(model=>(loaded=model,model))
   .catch(error=>{pending=null;throw error});
 }
 return pending;
}
const api={FILE,ACTIVE,REQUIRED,parseFa18GLB,ensureFa18};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFa18NativeAirframe=api;
})(typeof window!=="undefined"?window:null);
