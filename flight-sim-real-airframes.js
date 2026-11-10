/* Genuine imported Cessna 172 GLB (e737, CC BY 4.0).
 * Converts only documented, uncompressed glTF 2.0 buffer accessors and
 * WebP base-colour textures; rejects unsupported features instead of
 * quietly substituting an inaccurate model.
 */
(function(root){"use strict";
const FILE="assets/aircraft/c172-e737-optimized.glb";
const MAX_BYTES=12*1024*1024,MAX_VERTICES=200000;
let pending=null,asset=null;
const allowed={5121:1,5123:2,5125:4,5126:4};
const finite=(n)=>Number.isFinite(n);
function parseGLB(file){
 if(!(file instanceof ArrayBuffer)||file.byteLength<24||file.byteLength>MAX_BYTES)
  throw Error("Invalid or over-budget C172 GLB");
 const data=new DataView(file);
 const u32=i=>data.getUint32(i,true);
 if(u32(0)!==0x46546c67||u32(4)!==2||u32(8)!==file.byteLength)
  throw Error("Unsupported glTF binary header");
 const jsonLength=u32(12);
 if(u32(16)!==0x4e4f534a||jsonLength>1024*1024||20+jsonLength+8>file.byteLength)
  throw Error("Invalid glTF JSON section");
 const jsonBytes=new Uint8Array(file,20,jsonLength);
 const json=JSON.parse(new TextDecoder().decode(jsonBytes));
 const binHeader=20+jsonLength,binLength=u32(binHeader);
 if(u32(binHeader+4)!==0x004e4942||binHeader+8+binLength>file.byteLength)
  throw Error("Invalid glTF binary section");
 if(json.extensionsRequired?.some(ext=>ext!=="EXT_texture_webp"))
  throw Error("Unsupported required glTF extension");
 const binStart=binHeader+8,views=json.bufferViews||[],accessors=json.accessors||[];
 function viewBytes(id){
  const v=views[id];
  if(!v||v.buffer!==0)throw Error("Missing glTF buffer view");
  const offset=v.byteOffset||0,size=v.byteLength;
  if(!Number.isInteger(offset)||!Number.isInteger(size)||offset<0||size<0||
      offset+size>binLength)throw Error("Out of range glTF buffer view");
  return new Uint8Array(file,binStart+offset,size);
 }
 function getAccessor(id){
  const a=accessors[id];
  if(!a||a.sparse||!Number.isInteger(a.count)||a.count<0||a.count>MAX_VERTICES)
   throw Error("Unsupported glTF accessor");
  const v=views[a.bufferView],components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];
  const elementSize=allowed[a.componentType];
  if(!components||!elementSize||!v)throw Error("Unsupported glTF components");
  const stride=v.byteStride||components*elementSize,offset=a.byteOffset||0;
  const bytes=viewBytes(a.bufferView);
  if(stride<components*elementSize||offset<0||
      offset+(a.count?((a.count-1)*stride+components*elementSize):0)>bytes.byteLength)
   throw Error("Out of range glTF accessor");
  const dv=new DataView(file,binStart+(v.byteOffset||0),v.byteLength);
  const out=a.componentType===5126?new Float32Array(a.count*components):
   new Uint32Array(a.count*components);
  for(let i=0;i<a.count;i++)for(let c=0;c<components;c++){
   const b=offset+i*stride+c*elementSize;
   const value=a.componentType===5126?dv.getFloat32(b,true):
    a.componentType===5121?dv.getUint8(b):
    a.componentType===5123?dv.getUint16(b,true):dv.getUint32(b,true);
   if(!finite(value))throw Error("Nonfinite glTF accessor");
   out[i*components+c]=value;
  }
  return {data:out,count:a.count,type:a.type,componentType:a.componentType};
 }
 const materials=json.materials||[];
 const images=(json.images||[]).map(image=>{
  if(image.mimeType!=="image/webp"||!Number.isInteger(image.bufferView))
   throw Error("Unsupported imported texture format");
  const bytes=viewBytes(image.bufferView);
  if(bytes.length>2*1024*1024)throw Error("Texture too large");
  return bytes.slice();
 });
 const prims=[];
 for(const node of json.nodes||[]){
  if(node.mesh===undefined)continue;
  // This source has baked geometry and identity node transforms.
  if(node.matrix||node.translation||node.rotation||node.scale)
   throw Error("Unbaked glTF node transforms");
  const mesh=json.meshes?.[node.mesh];
  if(!mesh)throw Error("Missing C172 mesh");
  for(const primitive of mesh.primitives||[]){
   if(primitive.mode!==undefined&&primitive.mode!==4)throw Error("Not triangles");
   const p=getAccessor(primitive.attributes?.POSITION),
    n=getAccessor(primitive.attributes?.NORMAL),
    uv=getAccessor(primitive.attributes?.TEXCOORD_0),
    index=getAccessor(primitive.indices);
   if(p.type!=="VEC3"||n.type!=="VEC3"||uv.type!=="VEC2"||
      index.type!=="SCALAR"||p.count!==n.count||p.count!==uv.count||
      index.count%3!==0)throw Error("Incompatible C172 mesh attributes");
   const transformed=new Float32Array(p.data.length);
   const normals=new Float32Array(n.data.length);
   for(let i=0;i<transformed.length;i+=3){
    // Source optimized GLB: +Y up, nose local -X.
    // Simulator: +Y up, nose local +Z. Yaw 90 degrees.
    transformed[i]=p.data[i+2];
    transformed[i+1]=p.data[i+1];
    transformed[i+2]=-p.data[i];
    normals[i]=n.data[i+2];
    normals[i+1]=n.data[i+1];
    normals[i+2]=-n.data[i];
   }
   const maxIndex=Math.max(...index.data);
   if(maxIndex>=p.count)throw Error("C172 index out of bounds");
   const mat=materials[primitive.material||0]||{};
   const factor=mat.pbrMetallicRoughness?.baseColorFactor||[1,1,1,1];
   const colors=new Float32Array(p.count*3);
   for(let i=0;i<colors.length;i+=3){
    colors[i]=factor[0];colors[i+1]=factor[1];colors[i+2]=factor[2];
   }
   const ti=mat.pbrMetallicRoughness?.baseColorTexture?.index;
   let imageId=null;
   if(ti!==undefined){
    const tex=json.textures?.[ti];
    imageId=tex?.extensions?.EXT_texture_webp?.source??tex?.source;
    if(imageId===undefined||!images[imageId])throw Error("Missing base texture");
   }
   prims.push({positions:transformed,normals,uvs:uv.data,
    colors,indices: index.componentType===5123?
      Uint16Array.from(index.data):Uint32Array.from(index.data),
    imageId,alphaMask:mat.alphaMode==="MASK",alphaCutoff:mat.alphaCutoff??.5});
  }
 }
 if(!prims.length)throw Error("GLB has no aircraft geometry");
 const bounds=[Infinity,-Infinity,Infinity,-Infinity,Infinity,-Infinity];
 let vertices=0,triangles=0;
 for(const p of prims){
  vertices+=p.positions.length/3;triangles+=p.indices.length/3;
  for(let i=0;i<p.positions.length;i+=3)for(let a=0;a<3;a++){
   bounds[a*2]=Math.min(bounds[a*2],p.positions[i+a]);
   bounds[a*2+1]=Math.max(bounds[a*2+1],p.positions[i+a]);
  }
 }
 if(vertices>MAX_VERTICES||triangles>100000||
   bounds.some(v=>!finite(v))||bounds[1]-bounds[0]<8||
   bounds[5]-bounds[4]<8)throw Error("Imported geometry fails C172 bounds");
 return {primitives:prims,images,vertices,triangles,bounds};
}
function ensureC172(fetcher=root?.fetch?.bind(root)){
 if(asset)return Promise.resolve(asset);
 if(!pending){
  if(!fetcher)return Promise.reject(Error("Fetch unavailable"));
  pending=Promise.resolve(fetcher(FILE)).then(resp=>{
   if(!resp.ok)throw Error("C172 GLB HTTP "+resp.status);
   return resp.arrayBuffer();
  }).then(parseGLB).then(model=>(asset=model,model))
   .catch(e=>{pending=null;throw e});
 }
 return pending;
}
const api={FILE,parseGLB,ensureC172};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSARealAirframes=api;
})(typeof window!=="undefined"?window:null);
