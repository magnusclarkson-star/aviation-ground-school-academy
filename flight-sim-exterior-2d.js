/* Lightweight outside camera built from the exact same mesh shapes as WebGL.
 * Includes animated two-blade R44 main/tail rotors, trainer propeller and jet
 * control surfaces so phones without WebGL never show a rotorless helicopter.
 */
(function(root){"use strict";
 const RAD=Math.PI/180;
 const MESH_CACHE=new Map(),TRI_CACHE=new Map(),PART_CACHE=new Map(),SWEEP_CACHE=new Map();
 const rgb=(r,g,b)=>"rgb("+Math.round(r*255)+","+Math.round(g*255)+","+Math.round(b*255)+")";
 const modelApi=()=>root?.AGSAFlight3D||(typeof module!=="undefined"&&module.exports?
  require("./flight-sim-3d.js"):null);
 const exterior=()=>root?.AGSAExteriorAirframes||(typeof module!=="undefined"&&module.exports?
  require("./flight-sim-airframe-geometry.js"):null);
 function getMesh(id){
  const engine=modelApi(),A=exterior();
  if(!engine||!A)throw Error("Outside 2D view requires shared 3D airframe geometry");
  const resolved=A.normalize(id);
  if(!MESH_CACHE.has(resolved))MESH_CACHE.set(resolved,engine.buildVehicle(resolved));
  return MESH_CACHE.get(resolved);
 }
 function trianglesOf(mesh){
  const triangles=[];
  for(let i=0;i<mesh.vertices;i+=3){
   const pts=[];
   for(let j=0;j<3;j++){
    const k=(i+j)*3;
    pts.push([mesh.positions[k],mesh.positions[k+1],mesh.positions[k+2]]);
   }
   const color=[mesh.colors[i*3],mesh.colors[i*3+1],mesh.colors[i*3+2]];
   triangles.push({points:pts,color,depth:(pts[0][2]+pts[1][2]+pts[2][2])/3});
  }
  triangles.sort((a,b)=>b.depth-a.depth);
  return triangles;
 }
 function geometry(id){
  const resolved=exterior().normalize(id);
  if(!TRI_CACHE.has(resolved))TRI_CACHE.set(resolved,trianglesOf(getMesh(resolved)));
  return TRI_CACHE.get(resolved);
 }
 function movingParts(id){
  const resolved=exterior().normalize(id);
  if(!PART_CACHE.has(resolved)){
   const parts=modelApi().buildMovingParts(resolved).map(p=>({
    name:p.name,pivot:p.pivot,axis:p.axis,triangles:trianglesOf(p.mesh)
   }));
   PART_CACHE.set(resolved,parts);
  }
  return PART_CACHE.get(resolved);
 }
 function rotorSweepTriangles(id){
  const resolved=exterior().normalize(id);
  if(resolved!=="r44")return [];
  if(!SWEEP_CACHE.has(resolved))
   SWEEP_CACHE.set(resolved,trianglesOf(modelApi().buildRotorSweep(resolved)));
  return SWEEP_CACHE.get(resolved);
 }
 function rotorBlurOpacity(animation){
  const value=animation?.rotorBlurOpacity;
  return Number.isFinite(value)?Math.max(0,Math.min(.18,value)):0;
 }
 // Exactly the same local axis definitions as the WebGL shader.
 function rotate(point,pivot,axis,angle){
  if(!angle)return point;
  let [x,y,z]=point.map((v,i)=>v-pivot[i]);
  const c=Math.cos(angle),s=Math.sin(angle);
  if(axis===1)[y,z]=[y*c-z*s,y*s+z*c];
  else if(axis===2)[x,z]=[x*c+z*s,-x*s+z*c];
  else if(axis===3)[x,y]=[x*c-y*s,x*s+y*c];
  return [x+pivot[0],y+pivot[1],z+pivot[2]];
 }
 function paintInspection(ctx,{id="c172",width=960,height=540,orbit={},animation={}}={}){
  const azimuth=((Number(orbit.azimuth)||0)*RAD);
  const elevation=Math.max(-70,Math.min(78,Number(orbit.elevation??28)))*RAD;
  const distance=Math.max(17,Math.min(70,Number(orbit.distance??29)));
  const ca=Math.cos(azimuth),sa=Math.sin(azimuth),ce=Math.cos(elevation),se=Math.sin(elevation);
  const scale=Math.min(width/25,height/22)*(29/distance);
  const vertices=[];
  function put(tri,part,opacity=1){
   const coords=tri.points.map(source=>{
    const p=part?rotate(source,part.pivot,part.axis,part.angle):source;
    const forward=-p[0]*sa+p[2]*ca;
    return {x:(p[0]*ca+p[2]*sa)*scale,
     y:(-p[1]*ce-forward*se)*scale,
     depth:forward*ce-p[1]*se};
   });
   vertices.push({coords,depth:(coords[0].depth+coords[1].depth+coords[2].depth)/3,
    color:tri.color,opacity});
  }
  for(const tri of geometry(id))put(tri,null);
   const blur=rotorBlurOpacity(animation);
   if(blur>0)for(const tri of rotorSweepTriangles(id))put(tri,null,blur);
  for(const part of movingParts(id)){
   const angle=Number.isFinite(animation[part.name])?animation[part.name]:0;
   for(const tri of part.triangles)put(tri,{...part,angle});
  }
  vertices.sort((a,b)=>b.depth-a.depth);
  ctx.save();
  ctx.translate(width/2,height*.53);
  for(const tri of vertices){
   ctx.beginPath();
   ctx.moveTo(tri.coords[0].x,tri.coords[0].y);
   ctx.lineTo(tri.coords[1].x,tri.coords[1].y);
   ctx.lineTo(tri.coords[2].x,tri.coords[2].y);
   ctx.closePath();ctx.fillStyle=rgb(...tri.color);ctx.globalAlpha=tri.opacity;ctx.fill();
  }
  ctx.restore();
  return true;
 }
 function paint(ctx,state,{id="c172",width=960,height=540,view="chase",animation={},orbit={}}={}){
  if(view==="inspect")return paintInspection(ctx,{id,width,height,orbit,animation});
  if(!ctx||!state)return false;
  const triangles=geometry(id),parts=movingParts(id);
  const scale=Math.max(2,Math.min(width/24,height/17));
  const roll=Number.isFinite(state.rollDeg)?state.rollDeg:0;
  const pitch=Number.isFinite(state.pitchDeg)?state.pitchDeg:0;
  ctx.save();
  ctx.translate(width/2,height*.60);
  ctx.rotate(view==="top"?0:-roll*RAD*.55);
  const altitude=Math.max(0,Number(state.altitudeM)||0);
  if(view!=="top"){
   ctx.save();
   ctx.translate(0,height*.25);
   ctx.fillStyle="rgba(12,29,39,"+(Math.max(.03,.18-altitude/800)).toFixed(2)+")";
   ctx.beginPath();
   ctx.ellipse(0,0,scale*7.0,scale*1.4,0,0,Math.PI*2);
   ctx.fill();
   ctx.restore();
  }
  const project=([x,y,z])=>view==="top"?
   [x*scale,-z*scale*.92]:
   view==="side"?
   [z*scale*.91,(-y*.95-x*.17)*scale]:
   [(x+z*.12)*scale,(-y*.91-z*(.43+pitch/350))*scale];
  const fill=(shape,transform)=> {
   const pts=shape.points.map(p=>project(transform?transform(p):p));
   const [r,g,b]=shape.color;
   ctx.beginPath();ctx.moveTo(...pts[0]);ctx.lineTo(...pts[1]);
   ctx.lineTo(...pts[2]);ctx.closePath();
   ctx.fillStyle=rgb(r,g,b);ctx.fill();
  };
  for(const tri of triangles)fill(tri);
   const blur=rotorBlurOpacity(animation);
   if(blur>0){
    ctx.save();ctx.globalAlpha=blur;
    for(const tri of rotorSweepTriangles(id))fill(tri);
    ctx.restore();
   }
  for(const part of parts){
   const angle=Number.isFinite(animation?.[part.name])?animation[part.name]:0;
   for(const tri of part.triangles)
    fill(tri,p=>rotate(p,part.pivot,part.axis,angle));
  }
  ctx.restore();
  return true;
 }
 const api=Object.freeze({getMesh,geometry,movingParts,rotorSweepTriangles,rotate,paint,paintInspection});
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.AGSAExteriorChase2D=api;
})(typeof window!=="undefined"?window:null);
