/* MIT-licensed original polygonal Cessna 172S Skyhawk from Bendyline Molen.
 * Original glTF model includes a cabin with 4 seats, NAV III cockpit,
 * steerable surfaces, and full landing gear. Source: Molen asset release
 * assets-52148fd49fe80b1d; license notices in assets/aircraft/.
 * Quantized glTF 2.0 parser, no Three.js runtime needed.
 */
(function(root){"use strict";
const FILE="assets/aircraft/c172-molen-skyhawk.glb";
const MAX=8*1024*1024;
let pending=null,asset=null;
function parseC172GLB(file){
 if(!(file instanceof ArrayBuffer)||file.byteLength<24||file.byteLength>MAX)
  throw Error("Invalid C172 binary size");
 const dv=new DataView(file),u32=p=>dv.getUint32(p,true);
 if(u32(0)!==0x46546c67||u32(4)!==2||u32(8)!==file.byteLength)
  throw Error("Invalid C172 GLB header");
 const len=u32(12),binHeader=20+len;
 if(len>2*1024*1024||binHeader+8>file.byteLength||
    u32(16)!==0x4e4f534a||u32(binHeader+4)!==0x004e4942)
  throw Error("Invalid C172 chunk boundaries");
 const gltf=JSON.parse(new TextDecoder().decode(new Uint8Array(file,20,len)));
 const binStart=binHeader+8,binLength=u32(binHeader);
 if(binStart+binLength>file.byteLength)throw Error("C172 buffer overflow");
 if((gltf.extensionsRequired||[]).some(x=>x!=="KHR_mesh_quantization"))
  throw Error("Unsupported C172 glTF extension");
 function getView(id){
  const v=gltf.bufferViews?.[id];
  if(!v||v.buffer!==0||!Number.isInteger(v.byteLength)||v.byteLength<0||
      (v.byteOffset||0)+v.byteLength>binLength)throw Error("C172 buffer view invalid");
  return v;
 }
 function read(id){
  const a=gltf.accessors?.[id],sizes={5121:1,5122:2,5123:2,5125:4,5126:4},
   count={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
  if(!a||a.sparse||!count[a.type]||!sizes[a.componentType]||
     a.count>50000||a.count<0)throw Error("Unsupported C172 accessor");
  const v=getView(a.bufferView),stride=v.byteStride||count[a.type]*sizes[a.componentType],
   start=(a.byteOffset||0),elem=count[a.type]*sizes[a.componentType];
  if(start<0||stride<elem||start+(a.count?((a.count-1)*stride+elem):0)>v.byteLength)
   throw Error("C172 accessor overflow");
  const array=new Float32Array(a.count*count[a.type]);
  const data=new DataView(file,binStart+(v.byteOffset||0),v.byteLength);
  for(let i=0;i<a.count;i++)for(let j=0;j<count[a.type];j++){
   const pos=start+i*stride+j*sizes[a.componentType];
   let n=a.componentType===5126?data.getFloat32(pos,true):
    a.componentType===5122?data.getInt16(pos,true):
    a.componentType===5123?data.getUint16(pos,true):
    a.componentType===5121?data.getUint8(pos):data.getUint32(pos,true);
   if(a.normalized){
    if(a.componentType===5122)n=Math.max(-1,n/32767);
    if(a.componentType===5123)n=n/65535;
    if(a.componentType===5121)n=n/255;
   }
   if(!Number.isFinite(n))throw Error("C172 nonfinite vertex");
   array[i*count[a.type]+j]=n;
  }
  return {data:array,count:a.count,type:a.type};
 }
 function matLocal(node){
  if(node.matrix){
   if(node.matrix.length!==16)throw Error("Invalid C172 node matrix");
   return node.matrix;
  }
  const [x,y,z,w]=node.rotation||[0,0,0,1],
   [sx,sy,sz]=node.scale||[1,1,1],
   [tx,ty,tz]=node.translation||[0,0,0];
  const x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,
   yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  return [
   (1-yy-zz)*sx,(xy+wz)*sx,(xz-wy)*sx,0,
   (xy-wz)*sy,(1-xx-zz)*sy,(yz+wx)*sy,0,
   (xz+wy)*sz,(yz-wx)*sz,(1-xx-yy)*sz,0,
   tx,ty,tz,1
  ];
 }
 const I=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
 function mul(a,b){
  const o=new Array(16);
  for(let c=0;c<4;c++)for(let r=0;r<4;r++){
   let v=0;for(let k=0;k<4;k++)v+=a[k*4+r]*b[c*4+k];
   o[c*4+r]=v;
  }return o;
 }
 const prims=[],images=(gltf.images||[]).map(img=>{
  const v=getView(img.bufferView);
  if(!["image/png","image/webp","image/jpeg"].includes(img.mimeType)||v.byteLength>2000000)
   throw Error("C172 invalid texture");
  return new Uint8Array(file,binStart+(v.byteOffset||0),v.byteLength).slice();
 });
 const imageMimeTypes=(gltf.images||[]).map(img=>img.mimeType);
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 let vertices=0,triangles=0,mainParts=0,tailParts=0;
 function traverse(id,parent,role=null){
  const node=gltf.nodes?.[id];if(!node)throw Error("C172 scene node missing");
  const m=mul(parent,matLocal(node));
  const nodeName=node.name||"";
  // Source hierarchy holds actual wing-hinge/rotor pivots as parent groups.
  // Animate only these original source parts; no drawn-on cockpit overlays.
  const control=/^Skyhawk-(flap|aileron|elevator)(--1|-1)$/.exec(nodeName);
  if(control){
   const family=control[1],left=control[2]==="--1";
   const name=family==="flap"?(left?"leftFlap":"rightFlap"):
    family==="aileron"?(left?"leftAileron":"rightAileron"):
    (left?"elevatorLeft":"elevatorRight");
   role={name,axis:1,pivot:[m[12],m[13]-1.5,m[14]]};
  }
  if(nodeName==="Skyhawk-rudder")
   role={name:"rudder",axis:2,pivot:[m[12],m[13]-1.5,m[14]]};
  if(nodeName==="Skyhawk-propeller")
   role={name:"propeller",axis:3,pivot:[m[12],m[13]-1.5,m[14]]};
  if(node.mesh!==undefined){
   const mesh=gltf.meshes?.[node.mesh];if(!mesh)throw Error("C172 mesh missing");
   for(const src of mesh.primitives||[]){
    if(src.mode!==undefined&&src.mode!==4)throw Error("C172 expects triangles");
    const pos=read(src.attributes?.POSITION),normal=read(src.attributes?.NORMAL),
     uv=src.attributes?.TEXCOORD_0===undefined?null:read(src.attributes.TEXCOORD_0),
     indices=read(src.indices);
    if(pos.type!=="VEC3"||normal.type!=="VEC3"||pos.count!==normal.count||
       (uv&&uv.count!==pos.count)||indices.type!=="SCALAR"||indices.count%3)
     throw Error("Bad C172 mesh layout");
    const positions=new Float32Array(pos.data.length),normals=new Float32Array(pos.data.length);
    for(let i=0;i<positions.length;i+=3){
     const x=pos.data[i],y=pos.data[i+1],z=pos.data[i+2];
     const px=m[0]*x+m[4]*y+m[8]*z+m[12],
      // The flight renderer places aircraft at altitude + 1.5 m. The
      // Molen Skyhawk glTF has a ground-contact origin, so shift every
      // source part down by exactly that amount, including its hinge.
      py=m[1]*x+m[5]*y+m[9]*z+m[13]-1.5,
      pz=m[2]*x+m[6]*y+m[10]*z+m[14];
     positions.set([px,py,pz],i);
     for(const [axis,v] of [[0,px],[1,py],[2,pz]]){
      min[axis]=Math.min(min[axis],v);max[axis]=Math.max(max[axis],v);
     }
     const nx=normal.data[i],ny=normal.data[i+1],nz=normal.data[i+2],
      vx=m[0]*nx+m[4]*ny+m[8]*nz,
      vy=m[1]*nx+m[5]*ny+m[9]*nz,
      vz=m[2]*nx+m[6]*ny+m[10]*nz,
      length=Math.hypot(vx,vy,vz)||1;
     normals.set([vx/length,vy/length,vz/length],i);
    }
    const indices32=Uint16Array.from(indices.data);
    if(indices32.length!==indices.count||
       indices.data.some(i=>i<0||i>=pos.count||!Number.isInteger(i)))
     throw Error("Bad C172 triangle indices");
    const material=gltf.materials?.[src.material||0]||{},
     pbr=material.pbrMetallicRoughness||{},factor=pbr.baseColorFactor||[1,1,1,1],
     colors=new Float32Array(positions.length);
    for(let i=0;i<colors.length;i+=3)
     colors.set([factor[0],factor[1],factor[2]],i);
    const texIndex=pbr.baseColorTexture?.index;
    const imageId=texIndex===undefined?null:gltf.textures?.[texIndex]?.source;
    if(texIndex!==undefined&&(imageId===undefined||!images[imageId]))
     throw Error("C172 material texture missing");
    const partName=role?.name||null;
    if(partName==="propeller")mainParts++;
    if(partName&&partName!=="propeller")tailParts++;
    prims.push({positions,normals,uvs:uv?.data||new Float32Array(pos.count*2),colors,
     indices:indices32,imageId,alphaMask:material.alphaMode==="MASK",
     alphaCutoff:material.alphaCutoff??.5,
     opacity:material.alphaMode==="BLEND"?factor[3]??1:1,
     partName,partAxis:role?.axis||0,
     partPivot:role?.pivot||[0,0,0]});
    vertices+=pos.count;triangles+=indices.count/3;
   }
  }
  for(const child of node.children||[])traverse(child,m,role);
 }
 const scene=gltf.scenes?.[gltf.scene||0];
 if(!scene?.nodes?.length)throw Error("C172 missing active scene");
 for(const n of scene.nodes)traverse(n,I);
 if(prims.length<100||mainParts<2||tailParts<8||
    vertices>100000||triangles>100000||
    max[0]-min[0]<10||max[2]-min[2]<7||
    !min.concat(max).every(Number.isFinite))throw Error("C172 geometry/rotors incomplete");
 return {primitives:prims,images,imageMimeTypes,vertices,triangles,
  bounds:[min[0],max[0],min[1],max[1],min[2],max[2]],
  propParts:mainParts,controlParts:tailParts,
  controls:[...new Set(prims.map(p=>p.partName).filter(Boolean))]};
}
function ensureC172(fetcher=root?.fetch?.bind(root)){
 if(asset)return Promise.resolve(asset);
 if(!pending){
  if(!fetcher)return Promise.reject(Error("Fetch unavailable"));
  pending=Promise.resolve(fetcher(FILE)).then(async resp=>{
   if(!resp.ok)throw Error("C172 GLB HTTP "+resp.status);
   return parseC172GLB(await resp.arrayBuffer());
  }).then(model=>(asset=model,model)).catch(error=>{pending=null;throw error});
 }
 return pending;
}
const api={FILE,parseC172GLB,ensureC172};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAC172Airframe=api;
})(typeof window!=="undefined"?window:null);
