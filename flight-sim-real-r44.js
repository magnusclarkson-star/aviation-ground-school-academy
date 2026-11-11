/* Imported FlightGear Robinson R44 geometry by Emmanuel Baranger and contributors.
 * Model and textures: GPL-2.0. Original source and COPYING are in
 * assets/aircraft/; rendering code here remains the Academy's own code.
 * Parses AC3D's world/poly/vertex/surface/ref format without eval or network
 * dependencies beyond fetching the two local asset files.
 */
(function(root){"use strict";
const MESH_FILE="assets/aircraft/r44-flightgear.ac";
const TEXTURE_FILE="assets/aircraft/r44-flightgear-texture.png";
const MAX_BYTES=4*1024*1024,MAX_TRIANGLES=50000;
let pending=null,asset=null;
function parseAC3D(text,textureBytes){
 if(typeof text!=="string"||text.length<300||text.length>MAX_BYTES||
    !text.startsWith("AC3D"))throw Error("Unsupported or oversize R44 AC3D");
 const lines=text.split(/\r?\n/);
 const materials=[];
 for(const line of lines){
  if(!line.startsWith("MATERIAL "))continue;
  const rgb=line.match(/\brgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  const alpha=line.match(/\btrans\s+([\d.]+)/);
  if(!rgb)throw Error("Invalid R44 material");
  materials.push({rgb:rgb.slice(1,4).map(Number),opacity:1-Number(alpha?.[1]||0)});
 }
 if(!materials.length)throw Error("No R44 materials");
 // Repaint only original FlightGear body panels, never the steel skids,
 // exhaust, lamp fittings, guard, transparent windows or rotor hardware.
 const paintedParts=new Set(["fuselage","derive","porteAD","porteAG",
  "porteBD","porteBG","trous_1","protection"]);
 const groups=new Map();
 let i=0,triangles=0;
 const finite=n=>Number.isFinite(n);
 const groupFor=(materialId,name)=>{
  const isPainted=paintedParts.has(name)&&materialId===0;
  const key=materialId+":"+(isPainted?"paint":"original");
  if(!groups.has(key))groups.set(key,
   {materialId,isPainted,sourceNames:new Set(),
    positions:[],normals:[],uvs:[],indices:[]});
  const group=groups.get(key);
  group.sourceNames.add(name);
  return group;
 };
 const pushTri=(group,a,b,c)=>{
  const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
  const v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
  let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],
   u[0]*v[1]-u[1]*v[0]];
  const length=Math.hypot(...n)||1;n=n.map(x=>x/length);
  for(const point of [a,b,c]){
   const index=group.positions.length/3;
   group.positions.push(point[0],point[1],point[2]);
   group.normals.push(...n);
   group.uvs.push(point[3],point[4]);
   group.indices.push(index);
  }
 };
 while(i<lines.length){
  const current=lines[i++].trim();
  if(current!=="OBJECT poly")continue;
  let name="unnamed",vertices=null,faces=0,texture=false;
  // FlightGear AC3D objects have their own local vertex indices.
  while(i<lines.length){
   const line=lines[i++].trim();
   if(line.startsWith("name "))name=line.slice(5).replace(/^"|"$/g,"");
   if(line.startsWith("texture "))texture=true;
   if(line.startsWith("numvert ")){
    const count=Number(line.slice(8));
    if(!Number.isInteger(count)||count<0||count>MAX_TRIANGLES)
     throw Error("Invalid AC3D vertex count");
    vertices=[];
    for(let j=0;j<count;j++){
     const values=lines[i++].trim().split(/\s+/).map(Number);
     if(values.length<3||!values.slice(0,3).every(finite))
      throw Error("Invalid AC3D vertex");
     // FlightGear aircraft nose -X and lateral Z; Academy nose +Z.
     vertices.push([values[2],values[1],-values[0]]);
    }
   }
   if(line.startsWith("numsurf ")){
    if(!vertices)throw Error("AC3D surfaces missing vertices");
    const count=Number(line.slice(8));
    if(!Number.isInteger(count)||count<0||count>MAX_TRIANGLES)
     throw Error("Invalid AC3D surface count");
    for(let j=0;j<count;j++){
     while(i<lines.length&&!lines[i].trim().startsWith("SURF "))i++;
     if(i===lines.length)throw Error("Truncated AC3D surface");
     i++; // SURF flags
     const matLine=lines[i++].trim(),refLine=lines[i++].trim();
     if(!matLine.startsWith("mat ")||!refLine.startsWith("refs "))
      throw Error("Invalid AC3D surface header");
     const materialId=Number(matLine.slice(4)),refsCount=Number(refLine.slice(5));
     if(!Number.isInteger(materialId)||!materials[materialId]||
       !Number.isInteger(refsCount)||refsCount<3||refsCount>32)
      throw Error("Invalid AC3D polygon");
     const refs=[];
     for(let k=0;k<refsCount;k++){
      const values=lines[i++].trim().split(/\s+/).map(Number);
      const idx=values[0],u=values[1],v=values[2];
      if(!Number.isInteger(idx)||!vertices[idx]||!finite(u)||!finite(v))
       throw Error("Invalid AC3D reference");
      refs.push([...vertices[idx],u,v]);
     }
     // Fully invisible material objects should not conceal cockpit detail.
     if(materials[materialId].opacity<.01)continue;
     const group=groupFor(materialId,name);
     for(let k=1;k+1<refs.length;k++){
      pushTri(group,refs[0],refs[k],refs[k+1]);
      triangles++;
      if(triangles>MAX_TRIANGLES)throw Error("R44 mesh exceeds mobile triangle budget");
     }
    }
    faces=count;
   }
   if(line.startsWith("kids "))break;
  }
  if(!vertices||!faces)continue;
 }
 const image=textureBytes instanceof Uint8Array?textureBytes:
  textureBytes instanceof ArrayBuffer?new Uint8Array(textureBytes):null;
 if(!image||image.length<64||image.length>2*1024*1024||
   image[0]!==137||image[1]!==80||image[2]!==78||image[3]!==71)
  throw Error("Missing or invalid GPL R44 PNG texture");
 const primitives=[];
 let vertices=0;
 for(const group of groups.values()){
  const mat=materials[group.materialId];
  const count=group.positions.length/3;
  if(count===0)continue;
  vertices+=count;
  const colors=new Float32Array(count*3);
  for(let k=0;k<count;k++)
   colors.set(mat.rgb,k*3);
  primitives.push({
   positions:Float32Array.from(group.positions),
   normals:Float32Array.from(group.normals),
   uvs:Float32Array.from(group.uvs),
   colors,
   indices:count<=65535?Uint16Array.from(group.indices):
    Uint32Array.from(group.indices),
   imageId:0,opacity:mat.opacity,
   // FlightGear material 4 is the grey tinted passenger glazing; retain
   // this distinction so its visibility can be tuned without changing
   // coloured navigation lights or solid yellow fuselage materials.
   isGlazing:group.materialId===4,
   isPainted:group.isPainted,
   sourceNames:[...group.sourceNames],
   alphaMask:false,alphaCutoff:0
  });
 }
 const bounds=[Infinity,-Infinity,Infinity,-Infinity,Infinity,-Infinity];
 for(const p of primitives)
  for(let j=0;j<p.positions.length;j+=3)
   for(let a=0;a<3;a++){
    const v=p.positions[j+a];
    bounds[a*2]=Math.min(bounds[a*2],v);
    bounds[a*2+1]=Math.max(bounds[a*2+1],v);
   }
 if(vertices<1200||vertices>MAX_TRIANGLES*3||triangles<4000||
    bounds.some(v=>!finite(v))||bounds[5]-bounds[4]<7||
    bounds[1]-bounds[0]<2)throw Error("Invalid Robinson R44 mesh bounds");
 return {primitives,images:[image],mimeTypes:["image/png"],vertices,
  triangles,bounds,licence:"GPL-2.0",source:"FGMEMBERS/R44"};
}
function ensureR44(fetcher=root?.fetch?.bind(root)){
 if(asset)return Promise.resolve(asset);
 if(!pending){
  if(!fetcher)return Promise.reject(Error("Fetch unavailable"));
  pending=Promise.all([fetcher(MESH_FILE),fetcher(TEXTURE_FILE)])
   .then(async responses=>{
    for(const resp of responses)if(!resp.ok)throw Error("R44 asset HTTP "+resp.status);
    return parseAC3D(await responses[0].text(),
     new Uint8Array(await responses[1].arrayBuffer()));
   }).then(data=>(asset=data,data)).catch(error=>{pending=null;throw error});
 }
 return pending;
}
const api={MESH_FILE,TEXTURE_FILE,parseAC3D,ensureR44};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSARealR44=api;
})(typeof window!=="undefined"?window:null);
