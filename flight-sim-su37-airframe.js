/* Genuine GPL-2.0+ Su-37 external airframe adapted from the FGUK/FlightGear
 * FGMEMBERS/SU-37 AC3D model. A compact editable derivative of its mesh,
 * without original third-party textures, is retained in assets/aircraft/.
 * Educational visual familiarization only; flight dynamics are fictional.
 */
(function(root){"use strict";
const FILE="assets/aircraft/su37-fguk-exterior.json";
const SOURCE="https://github.com/FGMEMBERS/SU-37/blob/936d565cded05ea0c0f26f99f8878b18156bce09/Models/SU-37-005-125h.ac";
const MAX_BYTES=800000,MAX_TRIANGLES=26000;
let cached=null,pending=null;
const finite=Number.isFinite;
function partMotion(name){
 const controls={
  WNG_Left_Slat:"leftSlat",WNG_Right_Slat:"rightSlat",
  WNG_Left_Flaperon:"leftAileron",WNG_Right_Flaperon:"rightAileron",
  ELV_Elevon_Left:"elevatorLeft",ELV_Elevon_Right:"elevatorRight",
  TF_Left_Rudder:"rudderLeft",TF_Right_Rudder:"rudderRight",
  CNRD_Left:"canardLeft",CNRD_Right:"canardRight"
 };
 if(["noseGear","mainGearLeft","mainGearRight"].includes(name)){
  // Dedicated full-size imported undercarriage: forward and inward hinges,
  // always below the source fuselage. No procedural gear is drawn over it.
  // The original Su-37 geometry labels LEFT on negative X and RIGHT on
  // positive X (opposite Typhoon's convention). The former swapped hinges
  // swung both bogies over the dorsal fuselage when retracted.
  const pivot=name==="noseGear"?[0,-.50,2.5]:
   name==="mainGearLeft"?[-1.66,-.50,-3.2]:[1.66,-.50,-3.2];
  return {partName:name,partAxis:4,partPivot:pivot};
 }
 const partName=controls[name];
 if(!partName)return {partName:null,partAxis:0,partPivot:[0,0,0]};
 const rudder=name.includes("Rudder");
 const side=name.includes("_Left")?1:-1;
 const canard=name.startsWith("CNRD_");
 const elevator=name.startsWith("ELV_");
 const slat=name.endsWith("_Slat");
 const pivot=canard?[side*1.85,.24,1.3]:
  elevator?[side*1.85,.48,-7.7]:
  rudder?[side*1.55,1.55,-8.0]:
  slat?[side*3.5,.22,.5]:[side*3.5,.25,-4.0];
 return {partName,partAxis:rudder?2:1,partPivot:pivot};
}
function colorFor(name,index,materials){
 const source=materials[index],base=source.slice(0,3);
 if(name==="canopy")return [.16,.31,.41];
 if(name==="canopyFrame")return [.32,.39,.44];
 if(name==="noseGear"||name.startsWith("mainGear")){
  return index<=1?[.14,.16,.18]:base.map(x=>Math.max(.22,Math.min(.74,x*.73)));
 }
 if(name.startsWith("engine"))return base.map(x=>Math.max(.14,Math.min(.72,x*.68)));
 if(name==="fuselage"||name==="wing"||name==="tail"||
    name.startsWith("WNG_")||name.startsWith("CNRD_")||
    name.startsWith("ELV_")||name.startsWith("TF_")){
  return base.map(x=>Math.max(.20,Math.min(.82,x*.77)));
 }
 return base.map(x=>Math.max(.14,Math.min(.85,x*.77)));
}
// Source-position camouflage for the licensed, *native* Su-37 mesh.
// No invented Su-35 substitute and no external 3D hosting dependency.
// This is procedural vertex paint, NOT a photographic/PBR texture map.
const SU37_PAINT_PARTS=new Set([
 "fuselage","wing","tail","WNG_Left_Slat","WNG_Right_Slat",
 "WNG_Left_Flaperon","WNG_Right_Flaperon","ELV_Elevon_Left",
 "ELV_Elevon_Right","TF_Left_Rudder","TF_Right_Rudder",
 "CNRD_Left","CNRD_Right","engineMount","engineLeft","engineRight"
]);
const clamp01=v=>Math.max(0,Math.min(1,v));
function su37SkinColor(name,x,y,z,base){
 if(!SU37_PAINT_PARTS.has(name))return base;
 // Three interlocking mottled upper-surface bands; continuous in the
 // same aircraft-space coordinates on wings, canards, fins and fuselage.
 const pattern=Math.sin(x*.87+Math.sin(z*.44)*.84)*
  Math.cos(z*.73-Math.sin(x*.39)*.61)+
  .36*Math.sin(z*1.11+x*.42);
 const dark=[.24,.34,.39],light=[.61,.69,.70],mid=[.40,.51,.56];
 const paint=pattern>.24?dark:pattern<-.31?light:mid;
 // Aircraft undersides remain muted source-grey, not camouflage.
 // Preserve a hint of the original material for panel relief.
 const top=clamp01((y+.30)/.64);
 const intensity=.88*top;
 return base.map((c,i)=>clamp01(c*(1-intensity)+
  (paint[i]*.88+c*.12)*intensity));
}
function parseSu37(text){
 if(typeof text!=="string"||text.length<300000||text.length>MAX_BYTES)
  throw Error("Su-37 source mesh length invalid");
 const data=JSON.parse(text);
 if(data.format!=="agsa-fg-su37-v1"||data.license!=="GPL-2.0-or-later"||
    data.quantization!==1000||!Array.isArray(data.parts)||
    data.parts.length!==24||!Array.isArray(data.materials)||
    data.materials.length!==12)
  throw Error("Su-37 source metadata invalid");
 const primitives=[],bounds=[Infinity,-Infinity,Infinity,-Infinity,Infinity,-Infinity];
 let vertices=0,triangles=0;
 for(const part of data.parts){
  if(typeof part.name!=="string"||part.name.length>90||
     !Array.isArray(part.v)||part.v.length%3||part.v.length<9||
     part.v.length>18000||!Array.isArray(part.g)||part.g.length>12)
   throw Error("Su-37 source component malformed");
  const n=part.v.length/3,positions=new Float32Array(part.v.length);
  const gear=part.name==="noseGear"||part.name.startsWith("mainGear");
  for(let j=0;j<part.v.length;j++){
   const q=part.v[j];
   if(!Number.isInteger(q)||Math.abs(q)>30000)throw Error("Su-37 coordinate invalid");
   const axis=j%3;
   const value=gear&&axis===1?Math.min(q/1000,-.45):q/1000;
   positions[j]=value;
   bounds[axis*2]=Math.min(bounds[axis*2],value);
   bounds[axis*2+1]=Math.max(bounds[axis*2+1],value);
  }
  const motion=partMotion(part.name);
  for(const group of part.g){
   if(!Array.isArray(group)||group.length!==2||
      !Number.isInteger(group[0])||!data.materials[group[0]]||
      !Array.isArray(group[1])||group[1].length%3||
      group[1].length>32000)throw Error("Su-37 group invalid");
   const color=data.materials[group[0]];
   if(color.length!==4||!color.every(v=>finite(v)&&v>=0&&v<=1))
    throw Error("Su-37 material invalid");
   const faceIds=group[1],indices=new Uint16Array(faceIds.length);
   const normals=new Float32Array(positions.length);
   for(let j=0;j<faceIds.length;j+=3){
    const ia=faceIds[j],ib=faceIds[j+1],ic=faceIds[j+2];
    if(![ia,ib,ic].every(x=>Number.isInteger(x)&&x>=0&&x<n))
     throw Error("Su-37 triangle index invalid");
    indices[j]=ia;indices[j+1]=ib;indices[j+2]=ic;
    const a=ia*3,b=ib*3,c=ic*3;
    const ux=positions[b]-positions[a],uy=positions[b+1]-positions[a+1],
     uz=positions[b+2]-positions[a+2],vx=positions[c]-positions[a],
     vy=positions[c+1]-positions[a+1],vz=positions[c+2]-positions[a+2];
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    for(const k of [a,b,c]){normals[k]+=nx;normals[k+1]+=ny;normals[k+2]+=nz;}
   }
   for(let j=0;j<normals.length;j+=3){
    const len=Math.hypot(normals[j],normals[j+1],normals[j+2])||1;
    normals[j]/=len;normals[j+1]/=len;normals[j+2]/=len;
   }
   const colors=new Float32Array(positions.length),
    shade=colorFor(part.name,group[0],data.materials);
   for(let j=0;j<colors.length;j+=3){
    const color=su37SkinColor(part.name,
     positions[j],positions[j+1],positions[j+2],shade);
    colors.set(color,j);
   }
   const opacity=part.name==="canopy"?.39:Math.min(1,color[3]);
   primitives.push({positions,indices,normals,colors,
    uvs:new Float32Array(n*2),imageId:null,opacity,alphaMask:false,
    alphaCutoff:0,partName:motion.partName,partAxis:motion.partAxis,
    partPivot:motion.partPivot,sourceName:part.name});
   triangles+=indices.length/3;vertices+=n;
  }
 }
 if(primitives.length<30||triangles<18000||triangles>MAX_TRIANGLES||
    bounds.some(x=>!finite(x))||bounds[1]-bounds[0]<14||
    bounds[3]-bounds[2]<5||bounds[5]-bounds[4]<20)
  throw Error("Su-37 imported geometry too small, too large or incomplete");
 const names=new Set(primitives.map(x=>x.sourceName));
 for(const name of ["fuselage","wing","tail","canopy","CNRD_Left",
    "CNRD_Right","noseGear","mainGearLeft","mainGearRight"])
  if(!names.has(name))throw Error("Missing Su-37 source "+name);
 return {primitives,images:[],vertices,triangles,bounds,
  licence:"GPL-2.0-or-later",source:SOURCE,kind:"fguk-su37"};
}
function ensureSu37(fetcher=root?.fetch?.bind(root)){
 if(cached)return Promise.resolve(cached);
 if(!pending){
  if(!fetcher)return Promise.reject(Error("Su-37 fetch unavailable"));
  pending=Promise.resolve(fetcher(FILE)).then(response=>{
   if(!response.ok)throw Error("Su-37 HTTP "+response.status);
   return response.text();
  }).then(parseSu37).then(model=>(cached=model,model))
   .catch(error=>{pending=null;throw error});
 }
 return pending;
}
const api={FILE,SOURCE,parseSu37,ensureSu37,partMotion,su37SkinColor};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSASu37Airframe=api;
})(typeof window!=="undefined"?window:null);
