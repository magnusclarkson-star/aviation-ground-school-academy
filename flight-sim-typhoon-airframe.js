/* GPL-2.0 licensed Eurofighter Typhoon exterior adapted from the
 * IAHM-COL/EF-Typhoon FlightGear AC3D model. Local editable geometry and
 * complete attribution are in assets/aircraft/; textures are not copied.
 * Educational visual familiarization, not manufacturer-certified dynamics.
 */
(function(root){"use strict";
const FILE="assets/aircraft/typhoon-fg-exterior.json";
const SOURCE="https://github.com/IAHM-COL/EF-Typhoon/blob/827020be8072fc348deb7cb94f1e9f2f9105a0e9/Models/EF-Typhoon.ac";
const MAX_BYTES=800000,MAX_TRIANGLES=28000;
let cached=null,pending=null;
const finite=Number.isFinite;
const Livery=root?.AGSANativeFighterLivery||
 (typeof module!=="undefined"&&module.exports?require("./flight-sim-native-livery.js"):null);
function partMotion(name){
 // This licensed Typhoon includes four ORIGINAL main-wheel bay doors.
 // Rotate the source panels, rather than overlaying invented rectangle doors.
 const gearDoor=/^geardoor([12])\.([LR])$/.exec(name);
 if(gearDoor){
  const left=gearDoor[2]==="L",side=left?1:-1;
  const outer=gearDoor[1]==="1"?2.09:1.226;
  const y=gearDoor[1]==="1"?-.13:-.40;
  const z=gearDoor[1]==="1"?-.97:-.85;
  return {partAxis:3,partName:left?"mainGearLeft":"mainGearRight",
   partPivot:[side*outer,y,z],gearDoorSide:side};
 }
 const controls={
  "elevator.L":"elevatorLeft","elevator.R":"elevatorRight",
  "rudder":"rudder",
  "flaperon.L":"leftAileron","flaperon.R":"rightAileron",
  "flaperon1.L":"leftFlap","flaperon1.R":"rightFlap",
  "Slat.L_0":"leftSlat","Slat.L_1":"leftSlat",
  "Slat.R_0":"rightSlat","Slat.R_1":"rightSlat"
 };
 if(["noseGear","mainGearLeft","mainGearRight"].includes(name)){
  const pivot=name==="noseGear"?[0,-.47,3.08]:
   name==="mainGearLeft"?[1.70,-.47,-1.24]:[-1.70,-.47,-1.24];
  return {partAxis:4,partName:name,partPivot:pivot};
 }
 if(!controls[name])return {partAxis:0,partName:null,partPivot:[0,0,0]};
 const left=/\.L(?:_|$)/.test(name),side=left?1:-1;
 const canard=name.startsWith("elevator.");
 const rudder=name==="rudder",slat=name.startsWith("Slat.");
 const pivot=canard?[side*.72,.14,5.12]:
  rudder?[0,1.7,-6.70]:
  slat?[side*3.1,-.30,-.5]:[side*3.2,-.34,-3.90];
 return {partAxis:rudder?2:1,partName:controls[name],partPivot:pivot};
}
function colorFor(name,materialId,mats){
 const source=mats[materialId],base=source.slice(0,3);
 if(name==="canopy")return [.16,.31,.41];
 if(name==="canopyFrame")return [.34,.39,.43];
 if(name.includes("Gear"))return materialId===1?[.12,.14,.17]:
  base.map(x=>Math.max(.22,Math.min(.68,x*.68)));
 if(name==="fuselage"||name==="wing"||name==="tail"||
    name.startsWith("Slat.")||name.startsWith("flaperon")||
    name.startsWith("elevator.")||name==="rudder")
  return base.map(x=>Math.max(.26,Math.min(.87,x*.80)));
 return base.map(x=>Math.max(.17,Math.min(.82,x*.72)));
}
function parseTyphoon(text){
 if(typeof text!=="string"||text.length<300000||text.length>MAX_BYTES)
  throw Error("Typhoon source mesh size invalid");
 const data=JSON.parse(text);
 if(data.format!=="agsa-fg-typhoon-v1"||data.license!=="GPL-2.0"||
    data.quantization!==1000||!Array.isArray(data.parts)||
    data.parts.length<24||data.parts.length>80||
    !Array.isArray(data.materials)||data.materials.length!==46)
  throw Error("Typhoon source metadata invalid");
 const primitives=[],bounds=[Infinity,-Infinity,Infinity,-Infinity,Infinity,-Infinity];
 let vertices=0,triangles=0;
 for(const part of data.parts){
  if(typeof part.name!=="string"||part.name.length>96||
     !Array.isArray(part.v)||part.v.length%3||part.v.length<9||
     part.v.length>18000||!Array.isArray(part.g)||part.g.length>46)
   throw Error("Typhoon source part malformed");
  const sourceCount=part.v.length/3;
  for(let j=0;j<part.v.length;j++){
   const q=part.v[j],axis=j%3;
   if(!Number.isInteger(q)||Math.abs(q)>30000)
    throw Error("Typhoon source coordinate invalid");
   const value=q/1000;
   bounds[axis*2]=Math.min(bounds[axis*2],value);
   bounds[axis*2+1]=Math.max(bounds[axis*2+1],value);
  }
  const motion=partMotion(part.name);
  for(const group of part.g){
   // Three 1m helper cubes from the upstream "details" AC3D material
   // are centred outside both wingtips and above the vertical tail.
   // They are modelling markers, not airframe surfaces; suppress only
   // these exact material groups so legitimate panel details survive.
   if(part.name==="details"&&[31,32,33].includes(group[0]))continue;
   if(!Array.isArray(group)||group.length!==2||
      !Number.isInteger(group[0])||!data.materials[group[0]]||
      !Array.isArray(group[1])||group[1].length%3||
      group[1].length>40000)throw Error("Typhoon source material group invalid");
   const material=data.materials[group[0]],faces=group[1];
   if(material.length!==4||!material.every(x=>finite(x)&&x>=0&&x<=1))
    throw Error("Typhoon source material invalid");
   // Unlike the original AC3D loader, pack only the vertices actually
   // referenced by each material group. This avoids 28x copies of details
   // geometry and keeps a real 18k-triangle model responsive on Android.
   const used=[],remap=new Map();
   const indices=new Uint16Array(faces.length);
   for(let j=0;j<faces.length;j++){
    const original=faces[j];
    if(!Number.isInteger(original)||original<0||original>=sourceCount)
     throw Error("Typhoon source index invalid");
    if(!remap.has(original)){remap.set(original,used.length);used.push(original);}
    indices[j]=remap.get(original);
   }
   const positions=new Float32Array(used.length*3),colors=new Float32Array(used.length*3);
   const normals=new Float32Array(used.length*3);
   const shade=colorFor(part.name,group[0],data.materials);
   for(let j=0;j<used.length;j++){
    const offset=used[j]*3;
    for(let a=0;a<3;a++){
     let value=part.v[offset+a]/1000;
     if(motion.partAxis===4&&a===1)value=Math.min(value,-.45);
     positions[j*3+a]=value;
    }
    const tone=Livery?Livery.paint("typhoon",part.name,
     positions[j*3],positions[j*3+1],positions[j*3+2],shade):shade;
    colors.set(tone,j*3);
   }
   for(let j=0;j<indices.length;j+=3){
    const a=indices[j]*3,b=indices[j+1]*3,c=indices[j+2]*3;
    const ux=positions[b]-positions[a],uy=positions[b+1]-positions[a+1],
     uz=positions[b+2]-positions[a+2],vx=positions[c]-positions[a],
     vy=positions[c+1]-positions[a+1],vz=positions[c+2]-positions[a+2];
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    for(const k of [a,b,c]){normals[k]+=nx;normals[k+1]+=ny;normals[k+2]+=nz;}
   }
   for(let j=0;j<normals.length;j+=3){
    const n=Math.hypot(normals[j],normals[j+1],normals[j+2])||1;
    normals[j]/=n;normals[j+1]/=n;normals[j+2]/=n;
   }
   const opacity=part.name==="canopy"?.38:Math.min(1,material[3]);
   primitives.push({positions,indices,normals,colors,
    uvs:new Float32Array(used.length*2),imageId:null,opacity,
    alphaMask:false,alphaCutoff:0,partName:motion.partName,
    partAxis:motion.partAxis,partPivot:motion.partPivot,
    gearDoorSide:motion.gearDoorSide||0,
    sourceName:part.name});
   vertices+=used.length;triangles+=indices.length/3;
  }
 }
 if(primitives.length<40||triangles<16000||triangles>MAX_TRIANGLES||
    vertices<5000||vertices>60000||bounds.some(x=>!finite(x))||
    bounds[1]-bounds[0]<11||bounds[3]-bounds[2]<4||
    bounds[5]-bounds[4]<16)
  throw Error("Typhoon mesh shape or GPU budget invalid");
 const names=new Set(primitives.map(x=>x.sourceName));
 for(const name of ["fuselage","wing","tail","canopy",
  "elevator.L","elevator.R","rudder","noseGear",
  "mainGearLeft","mainGearRight"])
  if(!names.has(name))throw Error("Missing Typhoon source "+name);
 return {primitives,images:[],vertices,triangles,bounds,
  licence:"GPL-2.0",source:SOURCE,kind:"fg-typhoon"};
}
function ensureTyphoon(fetcher=root?.fetch?.bind(root)){
 if(cached)return Promise.resolve(cached);
 if(!pending){
  if(!fetcher)return Promise.reject(Error("Typhoon fetch unavailable"));
  pending=Promise.resolve(fetcher(FILE)).then(response=>{
   if(!response.ok)throw Error("Typhoon source HTTP "+response.status);
   return response.text();
  }).then(parseTyphoon).then(m=>(cached=m,m))
   .catch(error=>{pending=null;throw error});
 }
 return pending;
}
const api={FILE,SOURCE,parseTyphoon,ensureTyphoon,partMotion};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSATyphoonAirframe=api;
})(typeof window!=="undefined"?window:null);
