/* GPL-2.0 licensed F-22 exterior geometry, adapted from the FGUK/FlightGear
 * FGMEMBERS/F-22 AC3D source. This loader is independently authored.
 * A compact, editable vertex/triangle source asset and attribution are stored
 * locally in assets/aircraft/. No third-party texture is needed.
 */
(function(root){"use strict";
const FILE="assets/aircraft/f22-fguk-exterior.json";
const SOURCE="https://github.com/FGMEMBERS/F-22/blob/master/Models/F-22.ac";
const MAX_BYTES=1600000,MAX_TRIANGLES=42000;
let cached=null,pending=null;
const finite=Number.isFinite;
function partMotion(name,coords){
 // Authentic F-22 wheels and hydraulic links use source mesh sections. They
 // now follow the simulated gear cycle, without illustrated gear overlays.
 const nose=/^nose[_-]?wheel/i.test(name);
 const left=/^left[_-]main[_-]/i.test(name);
 const right=/^right[_-]main[_-]/i.test(name);
 if(nose||left||right){
  const key=nose?"noseGear":left?"mainGearLeft":"mainGearRight";
  return {partAxis:4,partName:key,
   partPivot:nose?[0,-1.14,3.35]:[left?1.45:-1.45,-1.10,-2.90]};
 }
 const match=name.match(/^(left|right)-(flap|aileron|slat|elevator|rudder)/i);
 if(!match)return {partAxis:0,partName:null,partPivot:[0,0,0]};
 const side=match[1].toLowerCase(),kind=match[2].toLowerCase();
 const names={flap:side==="left"?"leftFlap":"rightFlap",
  aileron:side==="left"?"leftAileron":"rightAileron",
  slat:side==="left"?"leftSlat":"rightSlat",
  elevator:side==="left"?"elevatorLeft":"elevatorRight",rudder:"rudder"};
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<coords.length;i+=3)
  for(let k=0;k<3;k++){min[k]=Math.min(min[k],coords[i+k]);max[k]=Math.max(max[k],coords[i+k]);}
 return {partAxis:kind==="rudder"?2:1,partName:names[kind],
  partPivot:[(min[0]+max[0])*.5,(min[1]+max[1])*.5,max[2]]};
}
function colorFor(partName,id,materials){
 const source=materials[id],base=source.slice(0,3);
 const name=partName.toLowerCase();
 if(name==="canopy")return [.17,.35,.46];
 if(name.includes("turbina")||name.includes("nozzle"))return id===1?[.48,.53,.56]:[.26,.30,.34];
 if(name.includes("wheel"))return [.13,.15,.17];
 if(name==="cabin")return [.24,.30,.34];
 if(name.includes("intake"))return [.37,.44,.49];
 if(id===0||id===11||id===12)return [.66,.73,.77];
 if(id===1)return [.47,.52,.55];
 if(id===2)return [.30,.35,.39];
 if(id===4)return [.14,.17,.20];
 return base.map(x=>Math.max(.10,Math.min(.90,x*.79)));
}
function parseF22(text){
 if(typeof text!=="string"||text.length<400000||text.length>MAX_BYTES)
  throw Error("Invalid F-22 mesh asset size");
 const data=JSON.parse(text);
 if(data.format!=="agsa-fg-f22-v1"||data.license!=="GPL-2.0"||
    data.quantization!==1000||!Array.isArray(data.parts)||
    data.parts.length<40||data.parts.length>100||
    !Array.isArray(data.materials)||data.materials.length>64)
  throw Error("F-22 geometry metadata invalid");
 const primitives=[],bounds=[Infinity,-Infinity,Infinity,-Infinity,Infinity,-Infinity];
 let vertices=0,triangles=0;
 for(const part of data.parts){
  if(typeof part.name!=="string"||part.name.length>100||
     !Array.isArray(part.v)||part.v.length%3||
     part.v.length<9||part.v.length>36000||
     !Array.isArray(part.g)||part.g.length>16)throw Error("F-22 geometry part invalid");
  const n=part.v.length/3,positions=new Float32Array(part.v.length);
  for(let i=0;i<part.v.length;i++){
   const q=part.v[i];
   if(!Number.isInteger(q)||Math.abs(q)>30000)throw Error("F-22 coordinate invalid");
   const a=i%3,x=q/1000;positions[i]=x;
   bounds[a*2]=Math.min(bounds[a*2],x);
   bounds[a*2+1]=Math.max(bounds[a*2+1],x);
  }
  const motion=partMotion(part.name,positions);
  for(const group of part.g){
   if(!Array.isArray(group)||group.length!==2||!Number.isInteger(group[0])||
      !data.materials[group[0]]||!Array.isArray(group[1])||
      group[1].length%3||group[1].length>15000)throw Error("F-22 faces invalid");
   const sourceMat=data.materials[group[0]],faceIds=group[1];
   if(sourceMat.length!==4||!sourceMat.every(x=>finite(x)&&x>=0&&x<=1))
    throw Error("F-22 material invalid");
   const indices=n<=65535?new Uint16Array(faceIds.length):new Uint32Array(faceIds.length);
   const normals=new Float32Array(positions.length);
   for(let j=0;j<faceIds.length;j+=3){
    const ia=faceIds[j],ib=faceIds[j+1],ic=faceIds[j+2];
    if(![ia,ib,ic].every(x=>Number.isInteger(x)&&x>=0&&x<n))
     throw Error("F-22 face index out of bounds");
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
   for(let j=0;j<colors.length;j+=3)colors.set(color,j);
   const opacity=part.name==="canopy"?.42:Math.min(1,sourceMat[3]);
   primitives.push({positions,indices,normals,colors,uvs:new Float32Array(n*2),
    imageId:null,opacity,alphaMask:false,alphaCutoff:0,
    partName:motion.partName,partAxis:motion.partAxis,partPivot:motion.partPivot,
    sourceName:part.name});
   triangles+=indices.length/3;vertices+=n;
  }
 }
 if(primitives.length<45||triangles<20000||triangles>MAX_TRIANGLES||
    bounds.some(x=>!finite(x))||bounds[1]-bounds[0]<12||
    bounds[5]-bounds[4]<17||bounds[3]-bounds[2]<3.5)
  throw Error("F-22 source shape or triangle budget invalid");
 const names=new Set(primitives.map(p=>p.sourceName));
 for(const required of ["Fuselage_1","Left_Wing_0","Right_Wing_0",
   "Left_Keel_0","Right_Keel_0","canopy"])
  if(!names.has(required))throw Error("F-22 source missing "+required);
 return {primitives,images:[],vertices,triangles,bounds,licence:"GPL-2.0",
  source:SOURCE,kind:"f22-fguk"};
}
function ensureF22(fetcher=root?.fetch?.bind(root)){
 if(cached)return Promise.resolve(cached);
 if(!pending){
  if(!fetcher)return Promise.reject(Error("F-22 fetch unavailable"));
  pending=Promise.resolve(fetcher(FILE)).then(r=>{
   if(!r.ok)throw Error("F-22 mesh HTTP "+r.status);
   return r.text();
  }).then(parseF22).then(m=>(cached=m,m))
   .catch(e=>{pending=null;throw e;});
 }
 return pending;
}
const api={FILE,SOURCE,parseF22,ensureF22,partMotion};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAF22Airframe=api;
})(typeof window!=="undefined"?window:null);
