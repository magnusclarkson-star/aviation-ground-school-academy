/* GPL-3.0 licensed F-35B exterior geometry, adapted from the FGUK/FlightGear
 * FGMEMBERS/F-35B AC3D source (main hull and Gear.ac). This loader is independently authored.
 * A compact, editable vertex/triangle source asset and attribution are stored
 * locally in assets/aircraft/. No third-party texture is needed.
 */
(function(root){"use strict";
const FILE="assets/aircraft/f35b-fg-exterior.json";
const SOURCE="https://github.com/FGMEMBERS/F-35B/blob/master/Models/F-35B.ac";
const MAX_BYTES=1200000,MAX_TRIANGLES=32000;
let cached=null,pending=null;
const finite=Number.isFinite;
const Livery=root?.AGSANativeFighterLivery||
 (typeof module!=="undefined"&&module.exports?require("./flight-sim-native-livery.js"):null);
function partMotion(name,coords){
 // FlightGear wheel and strut meshes were previously static even though the
 // flight-system model reports a retracting undercarriage. Fold each original
 // source assembly into a belly-side hinge rather than overlaying fake gear.
 if(name.startsWith("gear:")){
  const key=name.endsWith(".F")?"noseGear":
   name.endsWith(".R")?"mainGearRight":
   name.endsWith(".L")?"mainGearLeft":null;
  if(key)return {partAxis:4,partName:key,
   partPivot:key==="noseGear"?[0,-.65,3.35]:
    // Inner-edge pivots make both main gears swing toward the centreline;
    // a side-on rigid rotation stays below the previously enforced -.65m.
    [key==="mainGearRight"?1.70:-1.70,-.65,-2.2]};
 }
 // The licensed F-35B includes authentic nose and main-gear bay panels.
 // Hinge those original panels using the same wheel commands rather than
 // drawing six extra rectangular doors over an already complete aircraft.
 // Other source doors (fan, engine, top and weapons bays) remain fixed.
 const noseDoor=/^doorF([LR])$/.exec(name);
 const mainDoor=/^doorB[12]([LR])$/.exec(name);
 if(noseDoor||mainDoor){
  const side=(noseDoor||mainDoor)[1]==="L"?-1:1;
  const mins=[Infinity,Infinity,Infinity],maxs=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<coords.length;i+=3)
   for(let j=0;j<3;j++){
    mins[j]=Math.min(mins[j],coords[i+j]);
    maxs[j]=Math.max(maxs[j],coords[i+j]);
   }
  const pivotX=side*Math.max(Math.abs(mins[0]),Math.abs(maxs[0]));
  const pivotY=noseDoor?-1.10:-.52;
  const pivotZ=(mins[2]+maxs[2])*.5;
  return {partAxis:3,
   partName:noseDoor?"noseGear":side<0?"mainGearLeft":"mainGearRight",
   partPivot:[pivotX,pivotY,pivotZ],gearDoorSide:side};
 }
 const map={
  flaperonL:"leftAileron",flaperonR:"rightAileron",
  spoilerL:"leftFlap",spoilerR:"rightFlap",
  rudderL:"rudder",rudderR:"rudder",
  elevators:"elevatorLeft"
 };
 const partName=map[name]||null;
 if(!partName)return {partAxis:0,partName:null,partPivot:[0,0,0]};
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<coords.length;i+=3)for(let k=0;k<3;k++){
  min[k]=Math.min(min[k],coords[i+k]);
  max[k]=Math.max(max[k],coords[i+k]);
 }
 return {partAxis:name.startsWith("rudder")?2:1,partName,
  partPivot:[(min[0]+max[0])*.5,(min[1]+max[1])*.5,max[2]]};
}
function colorFor(partName,id,materials){
 const source=materials[id],base=source.slice(0,3);
 const name=partName.toLowerCase();
 if(name==="canopy")return [.17,.35,.46];
 if(name.includes("turbina")||name.includes("nozzle"))return id===1?[.48,.53,.56]:[.26,.30,.34];
 if(name.includes("wheel"))return [.10,.12,.15];
 if(name.startsWith("gear:"))return [.32,.36,.38];
 if(name==="cabin")return [.24,.30,.34];
 if(name.includes("intake"))return [.37,.44,.49];
 if(id===0)return [.56,.63,.68];
 if(id===1)return [.47,.52,.55];
 if(id===2)return [.30,.35,.39];
 if(id===4)return [.30,.35,.40];
 return base.map(x=>Math.max(.10,Math.min(.90,x*.79)));
}
function parseF35(text){
 if(typeof text!=="string"||text.length<250000||text.length>MAX_BYTES)
  throw Error("Invalid F-35B mesh asset size");
 const data=JSON.parse(text);
 if(data.format!=="agsa-fg-f35b-v1"||data.license!=="GPL-3.0"||
    data.quantization!==1000||!Array.isArray(data.parts)||
    data.parts.length<30||data.parts.length>80||
    !Array.isArray(data.materials)||data.materials.length>64)
  throw Error("F-35B geometry metadata invalid");
 const primitives=[],bounds=[Infinity,-Infinity,Infinity,-Infinity,Infinity,-Infinity];
 let vertices=0,triangles=0;
 for(const part of data.parts){
  if(typeof part.name!=="string"||part.name.length>100||
     !Array.isArray(part.v)||part.v.length%3||
     part.v.length<9||part.v.length>36000||
     !Array.isArray(part.g)||part.g.length>16)throw Error("F-35B geometry part invalid");
  const n=part.v.length/3,positions=new Float32Array(part.v.length);
  // The imported Gear.ac upper links extend through the F-35B dorsal skin.
  // Keep the undercarriage inside the lower fuselage without moving the
  // wheels or changing the aircraft's orientation. This applies only to
  // F-35B gear source parts, not to any other aircraft or flying surface.
  const gearUpperLimit=part.name.startsWith("gear:")?-.65:null;
  for(let i=0;i<part.v.length;i++){
   const q=part.v[i];
   if(!Number.isInteger(q)||Math.abs(q)>30000)throw Error("F-35B coordinate invalid");
   const a=i%3,x=gearUpperLimit!==null&&a===1?
    Math.min(q/1000,gearUpperLimit):q/1000;positions[i]=x;
   bounds[a*2]=Math.min(bounds[a*2],x);
   bounds[a*2+1]=Math.max(bounds[a*2+1],x);
  }
  const motion=partMotion(part.name,positions);
  for(const group of part.g){
   if(!Array.isArray(group)||group.length!==2||!Number.isInteger(group[0])||
      !data.materials[group[0]]||!Array.isArray(group[1])||
      group[1].length%3||group[1].length>32000)throw Error("F-35B faces invalid");
   const sourceMat=data.materials[group[0]],faceIds=group[1];
   if(sourceMat.length!==4||!sourceMat.every(x=>finite(x)&&x>=0&&x<=1))
    throw Error("F-35B material invalid");
   const indices=n<=65535?new Uint16Array(faceIds.length):new Uint32Array(faceIds.length);
   const normals=new Float32Array(positions.length);
   for(let j=0;j<faceIds.length;j+=3){
    const ia=faceIds[j],ib=faceIds[j+1],ic=faceIds[j+2];
    if(![ia,ib,ic].every(x=>Number.isInteger(x)&&x>=0&&x<n))
     throw Error("F-35B face index out of bounds");
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
   const colors=new Float32Array(positions.length),color=colorFor(part.name,group[0],data.materials);
   for(let j=0;j<colors.length;j+=3){
    const tone=Livery?Livery.paint("f35",part.name,
     positions[j],positions[j+1],positions[j+2],color):color;
    colors.set(tone,j);
   }
   const opacity=part.name==="canopy"?.42:Math.min(1,sourceMat[3]);
   primitives.push({positions,indices,normals,colors,uvs:new Float32Array(n*2),
    imageId:null,opacity,alphaMask:false,alphaCutoff:0,
    partName:motion.partName,partAxis:motion.partAxis,partPivot:motion.partPivot,
    gearDoorSide:motion.gearDoorSide||0,sourceName:part.name});
   triangles+=indices.length/3;vertices+=n;
  }
 }
 if(primitives.length<38||triangles<15000||triangles>MAX_TRIANGLES||
    bounds.some(x=>!finite(x))||bounds[1]-bounds[0]<10||
    bounds[5]-bounds[4]<15||bounds[3]-bounds[2]<3.5)
  throw Error("F-35B source shape or triangle budget invalid");
 const names=new Set(primitives.map(p=>p.sourceName));
 for(const required of ["fuselage","tail","flaperonL","flaperonR",
   "elevators","rudderL","rudderR","canopy","gear:wheel.F"])
  if(!names.has(required))throw Error("F-35B source missing "+required);
 return {primitives,images:[],vertices,triangles,bounds,licence:"GPL-3.0",
  source:SOURCE,kind:"f35b-fg"};
}
function ensureF35(fetcher=root?.fetch?.bind(root)){
 if(cached)return Promise.resolve(cached);
 if(!pending){
  if(!fetcher)return Promise.reject(Error("F-35B fetch unavailable"));
  pending=Promise.resolve(fetcher(FILE)).then(r=>{
   if(!r.ok)throw Error("F-35B mesh HTTP "+r.status);
   return r.text();
  }).then(parseF35).then(m=>(cached=m,m))
   .catch(e=>{pending=null;throw e;});
 }
 return pending;
}
const api={FILE,SOURCE,parseF35,ensureF35,partMotion};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAF35Airframe=api;
})(typeof window!=="undefined"?window:null);
