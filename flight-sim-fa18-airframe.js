/* Licensed F/A-18E native GLB import adapter.
 * Does not fetch or redistribute Sketchfab geometry: an official download
 * must be provided and explicitly enabled through the adjacent manifest.
 * Standalone glTF 2.0 GLB only; no arbitrary scripts, remote URIs or codecs.
 */
(function(root){"use strict";
const MANIFEST="assets/aircraft/fa18e-native-manifest.json";
const MAX_GLB_BYTES=32*1024*1024,MAX_TRIANGLES=160000,MAX_VERTICES=180000;
const REQUIRED_SOURCE="9e852037bf2141dcb3fda17013958131";
let cached=null,pending=null,checked=false;
function validateManifest(cfg){
 if(!cfg||typeof cfg!=="object"||cfg.version!==1||
    cfg.modelId!=="fa18"||cfg.sourceModelId!==REQUIRED_SOURCE||
    cfg.author!=="KOG_THORNS"||cfg.license!=="CC-BY-4.0"||
    cfg.sourceUrl!=="https://sketchfab.com/3d-models/boeing-fa-18e-super-hornet-"+REQUIRED_SOURCE||
    cfg.path!=="assets/aircraft/fa18e-native.glb"||
    !["Y","Z"].includes(cfg.upAxis?.replace("+",""))||
    !["-X","+X","-Y","+Y","-Z","+Z"].includes(cfg.noseAxis)||
    !Number.isFinite(cfg.lengthMetres)||cfg.lengthMetres<17||cfg.lengthMetres>20||
    !Number.isFinite(cfg.verticalOffsetMetres)||Math.abs(cfg.verticalOffsetMetres)>3||
    !Array.isArray(cfg.controls)||cfg.controls.length>40)
  throw Error("F/A-18E source manifest incomplete or mismatched");
 const axes={"+X":[1,0,0],"-X":[-1,0,0],
  "+Y":[0,1,0],"-Y":[0,-1,0],
  "+Z":[0,0,1],"-Z":[0,0,-1]};
 const up=axes[cfg.upAxis[0]==="+"?cfg.upAxis:"+"+cfg.upAxis];
 const forward=axes[cfg.noseAxis];
 if(!up||!forward||up.some((v,i)=>v&&forward[i]))
  throw Error("F/A-18E up and nose axes must be perpendicular");
 const right=[up[1]*forward[2]-up[2]*forward[1],
  up[2]*forward[0]-up[0]*forward[2],
  up[0]*forward[1]-up[1]*forward[0]];
 const allowed=new Set(["leftAileron","rightAileron","leftFlap","rightFlap",
  "elevatorLeft","elevatorRight","rudderLeft","rudderRight",
  "noseGear","mainGearLeft","mainGearRight"]);
 const controls=new Map(),bound=new Set();
 for(const c of cfg.controls){
  if(!c||typeof c.node!=="string"||c.node.length>90||
     !allowed.has(c.name)||bound.has(c.name)||controls.has(c.node)||
     ![1,2,3,4].includes(c.axis)||!Array.isArray(c.pivot)||
     c.pivot.length!==3||!c.pivot.every(Number.isFinite))
   throw Error("F/A-18E motion mapping invalid");
  controls.set(c.node,c);bound.add(c.name);
 }
 if(cfg.enabled===true&&
    !/^[a-f0-9]{64}$/.test(cfg.sha256||""))
  throw Error("F/A-18E enabled source requires verified SHA-256");
 if(cfg.requireControls===true||cfg.enabled===true){
  // Never replace the animated flight model with a static mesh merely
  // because a higher-resolution exterior is available.
  for(const name of allowed)
   if(!bound.has(name))
    throw Error("F/A-18E requires verified moving part "+name);
 }
 return {right,up,forward,controls};
}
function parseFA18GLB(buffer,cfg){
 const orientation=validateManifest(cfg);
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<100||
    buffer.byteLength>MAX_GLB_BYTES)throw Error("F/A-18E GLB size invalid");
 const view=new DataView(buffer),u32=i=>view.getUint32(i,true);
 if(u32(0)!==0x46546c67||u32(4)!==2||u32(8)!==buffer.byteLength)
  throw Error("F/A-18E unsupported GLB header");
 const jsonBytes=u32(12),header=20+jsonBytes;
 if(u32(16)!==0x4e4f534a||jsonBytes>3*1024*1024||
    header+8>buffer.byteLength||u32(header+4)!==0x004e4942)
  throw Error("F/A-18E malformed GLB chunks");
 const binLength=u32(header),binStart=header+8;
 if(binStart+binLength>buffer.byteLength)
  throw Error("F/A-18E binary chunk overrun");
 const gltf=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,jsonBytes)));
 if(gltf.asset?.version!=="2.0"||
    (gltf.extensionsRequired||[]).some(v=>v!=="KHR_mesh_quantization"))
  throw Error("F/A-18E unsupported glTF extensions");
 const views=gltf.bufferViews||[],accessors=gltf.accessors||[],
  sizeFor={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},
  components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
 function getView(n){
  const b=views[n];
  if(!b||b.buffer!==0||!Number.isInteger(b.byteLength)||
     !Number.isInteger(b.byteOffset||0)||b.byteLength<0||
     (b.byteOffset||0)+b.byteLength>binLength)
   throw Error("F/A-18E invalid buffer view");
  return b;
 }
 function accessor(n){
  const a=accessors[n],comp=components[a?.type],width=sizeFor[a?.componentType];
  if(!a||a.sparse||!comp||!width||!Number.isInteger(a.count)||
     a.count<1||a.count>MAX_VERTICES)
   throw Error("F/A-18E unsupported accessor");
  const v=getView(a.bufferView),elem=comp*width,stride=v.byteStride||elem,
   off=a.byteOffset||0;
  if(!Number.isInteger(off)||off<0||stride<elem||
     off+(a.count-1)*stride+elem>v.byteLength)
   throw Error("F/A-18E accessor outside data");
  const data=new DataView(buffer,binStart+(v.byteOffset||0),v.byteLength);
  const result=new Float32Array(a.count*comp);
  for(let i=0;i<a.count;i++)for(let j=0;j<comp;j++){
   const byte=off+i*stride+j*width;
   let val=a.componentType===5126?data.getFloat32(byte,true):
    a.componentType===5125?data.getUint32(byte,true):
    a.componentType===5123?data.getUint16(byte,true):
    a.componentType===5122?data.getInt16(byte,true):
    a.componentType===5121?data.getUint8(byte):
    data.getInt8(byte);
   if(a.normalized){
    if(a.componentType===5120)val=Math.max(-1,val/127);
    else if(a.componentType===5121)val/=255;
    else if(a.componentType===5122)val=Math.max(-1,val/32767);
    else if(a.componentType===5123)val/=65535;
   }
   if(!Number.isFinite(val))throw Error("F/A-18E nonfinite accessor");
   result[i*comp+j]=val;
  }
  return {data:result,count:a.count,type:a.type};
 }
 const images=(gltf.images||[]).map(img=>{
  if(!["image/png","image/jpeg","image/webp"].includes(img.mimeType)||
     img.bufferView===undefined)throw Error("F/A-18E image must be internal");
  const v=getView(img.bufferView);
  if(v.byteLength>4*1024*1024)throw Error("F/A-18E image over budget");
  return new Uint8Array(buffer,binStart+(v.byteOffset||0),v.byteLength).slice();
 });
 const imageMimeTypes=(gltf.images||[]).map(img=>img.mimeType);
 function identity(){return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}
 function nodeMatrix(n){
  if(n.matrix){
   if(n.matrix.length!==16||!n.matrix.every(Number.isFinite))
    throw Error("F/A-18E node matrix invalid");
   return n.matrix;
  }
  const [x,y,z,w]=n.rotation||[0,0,0,1];
  const [sx,sy,sz]=n.scale||[1,1,1];
  const [tx,ty,tz]=n.translation||[0,0,0];
  if(![x,y,z,w,sx,sy,sz,tx,ty,tz].every(Number.isFinite))
   throw Error("F/A-18E node transform invalid");
  const x2=x+x,y2=y+y,z2=z+z;
  return [
   (1-(y*y2+z*z2))*sx,(x*y2+z*w*2)*sx,(x*z2-y*w*2)*sx,0,
   (x*y2-z*w*2)*sy,(1-(x*x2+z*z2))*sy,(y*z2+x*w*2)*sy,0,
   (x*z2+y*w*2)*sz,(y*z2-x*w*2)*sz,(1-(x*x2+y*y2))*sz,0,
   tx,ty,tz,1];
 }
 function mul(a,b){
  const m=new Array(16);
  for(let c=0;c<4;c++)for(let r=0;r<4;r++){
   let n=0;for(let k=0;k<4;k++)n+=a[k*4+r]*b[c*4+k];
   m[c*4+r]=n;
  }return m;
 }
 function dot(p,d){return p[0]*d[0]+p[1]*d[1]+p[2]*d[2]}
 const {right,up,forward}=orientation;
 const reorient=p=>[dot(p,right),dot(p,up),dot(p,forward)];
 const primitives=[],rawBounds=[Infinity,-Infinity,Infinity,-Infinity,Infinity,-Infinity];
 let vertices=0,triangles=0;
 const traversed=new Set(),partNames=new Set();
 function traverse(id,parent,role){
  if(traversed.has(id))throw Error("F/A-18E invalid node cycle/shared node");
  traversed.add(id);
  const n=gltf.nodes?.[id];
  if(!n)throw Error("F/A-18E missing scene node");
  const mat=mul(parent,nodeMatrix(n));
  const named=orientation.controls.get(n.name||"");
  const motion=named||role||null;
  if(named)partNames.add(named.name);
  if(n.mesh!==undefined){
   const mesh=gltf.meshes?.[n.mesh];
   if(!mesh)throw Error("F/A-18E missing mesh");
   for(const primitive of mesh.primitives||[]){
    if(primitive.mode!==undefined&&primitive.mode!==4)
     throw Error("F/A-18E nontriangle surface");
    const p=accessor(primitive.attributes?.POSITION);
    const norm=accessor(primitive.attributes?.NORMAL);
    const uv=primitive.attributes?.TEXCOORD_0===undefined?null:
     accessor(primitive.attributes.TEXCOORD_0);
    const ind=primitive.indices===undefined?null:accessor(primitive.indices);
    const count=ind?.count??p.count;
    if(p.type!=="VEC3"||norm.type!=="VEC3"||norm.count!==p.count||
       (uv&&(uv.type!=="VEC2"||uv.count!==p.count))||
       (ind&&ind.type!=="SCALAR")||count%3)
     throw Error("F/A-18E primitive attributes invalid");
    const indices=new (p.count<=65535?Uint16Array:Uint32Array)(count);
    for(let j=0;j<count;j++){
     const ix=ind?ind.data[j]:j;
     if(!Number.isInteger(ix)||ix<0||ix>=p.count)
      throw Error("F/A-18E triangle index out of range");
     indices[j]=ix;
    }
    const positions=new Float32Array(p.data.length),
      normals=new Float32Array(p.data.length);
    for(let j=0;j<p.data.length;j+=3){
     const v=p.data,r=[v[j],v[j+1],v[j+2]];
     const point=reorient([
      mat[0]*r[0]+mat[4]*r[1]+mat[8]*r[2]+mat[12],
      mat[1]*r[0]+mat[5]*r[1]+mat[9]*r[2]+mat[13],
      mat[2]*r[0]+mat[6]*r[1]+mat[10]*r[2]+mat[14]]);
     positions.set(point,j);
     for(let k=0;k<3;k++){
      rawBounds[k*2]=Math.min(rawBounds[k*2],point[k]);
      rawBounds[k*2+1]=Math.max(rawBounds[k*2+1],point[k]);
     }
     const vn=[norm.data[j],norm.data[j+1],norm.data[j+2]];
     const nr=reorient([
      mat[0]*vn[0]+mat[4]*vn[1]+mat[8]*vn[2],
      mat[1]*vn[0]+mat[5]*vn[1]+mat[9]*vn[2],
      mat[2]*vn[0]+mat[6]*vn[1]+mat[10]*vn[2]]);
     const length=Math.hypot(...nr)||1;
     normals.set(nr.map(x=>x/length),j);
    }
    const material=gltf.materials?.[primitive.material||0]||{},
     pbr=material.pbrMetallicRoughness||{},
     factor=pbr.baseColorFactor||[1,1,1,1];
    if(factor.length!==4||!factor.every(x=>Number.isFinite(x)&&x>=0&&x<=1))
     throw Error("F/A-18E invalid material factor");
    const imageIndex=pbr.baseColorTexture?.index;
    const imageId=imageIndex===undefined?null:
     gltf.textures?.[imageIndex]?.extensions?.EXT_texture_webp?.source??
     gltf.textures?.[imageIndex]?.source;
    if(imageIndex!==undefined&&(!images[imageId]||!uv))
     throw Error("F/A-18E texture or UV missing");
    const colors=new Float32Array(p.data.length);
    for(let j=0;j<colors.length;j+=3)
     colors.set(factor.slice(0,3),j);
    const pivot=motion?.pivot?reorient(motion.pivot):[0,0,0];
    primitives.push({positions,normals,indices,colors,
     uvs:uv?.data||new Float32Array(p.count*2),imageId,
     partName:motion?.name||null,partAxis:motion?.axis||0,
     partPivot:pivot,sourceName:n.name||mesh.name||"skin",
     opacity:material.alphaMode==="BLEND"?factor[3]:1,
     alphaMask:material.alphaMode==="MASK",
     alphaCutoff:material.alphaCutoff??.5});
    vertices+=p.count;triangles+=count/3;
    if(vertices>MAX_VERTICES||triangles>MAX_TRIANGLES)
     throw Error("F/A-18E geometry budget exceeded");
   }
  }
  for(const child of n.children||[])traverse(child,mat,motion);
 }
 const scene=gltf.scenes?.[gltf.scene||0];
 if(!scene?.nodes?.length)throw Error("F/A-18E no active scene");
 for(const id of scene.nodes)traverse(id,identity(),null);
 if(primitives.length<1||triangles<1000||
    !rawBounds.every(Number.isFinite))
  throw Error("F/A-18E incomplete source geometry");
 const rawSpan=rawBounds[1]-rawBounds[0],rawHeight=rawBounds[3]-rawBounds[2],
  rawLength=rawBounds[5]-rawBounds[4];
 if(rawLength<=.0001||rawSpan/rawLength<.50||rawSpan/rawLength>.98||
    rawHeight/rawLength<.05||rawHeight/rawLength>.55)
  throw Error("F/A-18E source orientation/airframe bounds incorrect");
 const scale=cfg.lengthMetres/rawLength;
 const centreX=(rawBounds[0]+rawBounds[1])/2,
  centreZ=(rawBounds[4]+rawBounds[5])/2,
  centreY=rawBounds[2]+rawHeight*.44;
 for(const p of primitives){
  for(let j=0;j<p.positions.length;j+=3){
   p.positions[j]=(p.positions[j]-centreX)*scale;
   p.positions[j+1]=(p.positions[j+1]-centreY)*scale+cfg.verticalOffsetMetres;
   p.positions[j+2]=(p.positions[j+2]-centreZ)*scale;
  }
  p.partPivot=[(p.partPivot[0]-centreX)*scale,
   (p.partPivot[1]-centreY)*scale+cfg.verticalOffsetMetres,
   (p.partPivot[2]-centreZ)*scale];
 }
 if(cfg.requireControls&&
    [...orientation.controls.values()].some(c=>!partNames.has(c.name)))
  throw Error("F/A-18E required control nodes missing");
 return {primitives,images,imageMimeTypes,vertices,triangles,
  controls:[...partNames],kind:"licensed-fa18e",source:cfg.sourceUrl,
  attribution:cfg.author,licence:cfg.license,
  bounds:[-rawSpan*scale/2,rawSpan*scale/2,
   (rawBounds[2]-centreY)*scale+cfg.verticalOffsetMetres,
   (rawBounds[3]-centreY)*scale+cfg.verticalOffsetMetres,
   -cfg.lengthMetres/2,cfg.lengthMetres/2]};
}
// Confirm downloaded geometry is *exactly* the authorized inspected file,
// not an unrelated Hornet, modified binary or accidentally wrong export.
// The browser Web Crypto API is available on secure GitHub Pages contexts.
async function verifyFA18Digest(buffer,cfg,cryptoProvider=root?.crypto){
 if(!(buffer instanceof ArrayBuffer)||
    !/^[a-f0-9]{64}$/.test(cfg?.sha256||""))
  throw Error("F/A-18E source integrity configuration missing");
 if(!cryptoProvider?.subtle?.digest)
  throw Error("F/A-18E source integrity API unavailable");
 const digest=await cryptoProvider.subtle.digest("SHA-256",buffer);
 const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
 if(actual!==cfg.sha256)
  throw Error("F/A-18E downloaded GLB SHA-256 mismatch");
 return true;
}
function ensureFA18(fetcher=root?.fetch?.bind(root)){
 if(cached)return Promise.resolve(cached);
 if(checked)return Promise.resolve(null);
 if(pending)return pending;
 if(!fetcher)return Promise.resolve(null);
 pending=Promise.resolve(fetcher(MANIFEST)).then(async r=>{
  if(!r.ok)return null;
  const cfg=await r.json();
  // Disabled by default until the authorized source file, texture package,
  // axes and flight-control binding have been verified. No accidental 404
  // requests or old-jet overlays when merely viewing the Academy.
  if(cfg.enabled!==true)return null;
  validateManifest(cfg);
  const file=await fetcher(cfg.path);
  if(!file.ok)throw Error("F/A-18E GLB unavailable: "+file.status);
  const bytes=await file.arrayBuffer();
  if(bytes.byteLength>MAX_GLB_BYTES)
   throw Error("F/A-18E source file exceeds mobile memory budget");
  await verifyFA18Digest(bytes,cfg);
  return parseFA18GLB(bytes,cfg);
 }).then(value=>{checked=true;cached=value;return value}).catch(error=>{
  checked=true;
  if(typeof console!=="undefined")console.warn("F/A-18E GLB disabled:",error);
  return null;
 }).finally(()=>{pending=null});
 return pending;
}
const api={MANIFEST,MAX_GLB_BYTES,validateManifest,parseFA18GLB,
 verifyFA18Digest,ensureFA18};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFA18Airframe=api;
})(typeof window!=="undefined"?window:null);
