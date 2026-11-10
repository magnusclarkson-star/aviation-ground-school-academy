/* Lightweight outside camera built from the exact same mesh shapes as WebGL.
 * Includes animated two-blade R44 main/tail rotors, trainer propeller and jet
 * control surfaces so phones without WebGL never show a rotorless helicopter.
 */
(function(root){"use strict";
 const RAD=Math.PI/180;
 const MESH_CACHE=new Map(),TRI_CACHE=new Map(),PART_CACHE=new Map(),SWEEP_CACHE=new Map(),PROP_CACHE=new Map();
 const SHADOW_CACHE=new Map();
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
 function propellerSweepTriangles(id){
  const resolved=exterior().normalize(id);
  if(resolved!=="c172")return [];
  if(!PROP_CACHE.has(resolved))
   PROP_CACHE.set(resolved,trianglesOf(modelApi().buildPropellerSweep(resolved)));
  return PROP_CACHE.get(resolved);
 }
 function propBlurOpacity(animation){
  const value=animation?.propBlurOpacity;
  return Number.isFinite(value)?Math.max(0,Math.min(.16,value)):0;
 }
 function rotorBlurOpacity(animation){
  const value=animation?.rotorBlurOpacity;
  return Number.isFinite(value)?Math.max(0,Math.min(.22,value)):0;
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
 // Sort by the selected camera direction rather than the original
 // nose/tail Z axis. This fixes surfaces incorrectly covering the helicopter
 // rotors and windows in side/overhead non-WebGL views.
 function viewDepth(point,view){
  const [x,y,z]=point;
  if(view==="top")return -y;
  if(view==="side")return x;
  return z*.87-y*.48;
 }
 // Match the WebGL flight-model attitude rotations: roll about the model Z
 // axis followed by pitch about X. The fixed wing, helicopter mast and
 // animated control surfaces all undergo the same actual rigid-body bank.
 // No camera, navigation or flight-state values are modified.
 function attitudePoint(point,rollDeg=0,pitchDeg=0){
  const roll=Math.max(-85,Math.min(85,Number.isFinite(rollDeg)?rollDeg:0))*RAD;
  const pitch=Math.max(-85,Math.min(85,Number.isFinite(pitchDeg)?pitchDeg:0))*RAD;
  const [x,y,z]=point,cr=Math.cos(roll),sr=Math.sin(roll);
  const bx=x*cr+y*sr,by=-x*sr+y*cr;
  const cp=Math.cos(pitch),sp=Math.sin(pitch);
  return [bx,by*cp+z*sp,-by*sp+z*cp];
 }
 function projectedFaces(id,view="chase",animation={},attitude={}){
  const faces=[];
  let order=0;
  function append(shape,part=null,opacity=1){
   const moving=part?shape.points.map(point=>rotate(point,part.pivot,part.axis,part.angle)):shape.points;
   const points=(attitude?.rollDeg||attitude?.pitchDeg)?
    moving.map(point=>attitudePoint(point,attitude.rollDeg,attitude.pitchDeg)):moving;
   faces.push({points,color:shape.color,
    depth:points.reduce((sum,p)=>sum+viewDepth(p,view),0)/3,
    opacity,order:order++});
  }
  for(const tri of geometry(id))append(tri);
  const blur=rotorBlurOpacity(animation);
  if(blur>0)for(const tri of rotorSweepTriangles(id))append(tri,null,blur);
  const propBlur=propBlurOpacity(animation);
  if(propBlur>0)for(const tri of propellerSweepTriangles(id))append(tri,null,propBlur);
  for(const part of movingParts(id)){
   const angle=Number.isFinite(animation?.[part.name])?animation[part.name]:0;
   for(const tri of part.triangles)append(tri,{...part,angle});
  }
  faces.sort((a,b)=>b.depth-a.depth||a.order-b.order);
  return faces;
 }
 // The non-WebGL fallback now uses the SAME airframe footprint as WebGL,
 // rather than a stationary one-size-fits-all elliptical patch.
 function shadowFaces(id){
  const resolved=exterior().normalize(id);
  if(!SHADOW_CACHE.has(resolved)){
   const mesh=modelApi().buildShadow(resolved),p=mesh.positions,faces=[];
   for(let i=0;i<p.length;i+=9)
    faces.push([[p[i],p[i+2]],[p[i+3],p[i+5]],[p[i+6],p[i+8]]]);
   SHADOW_CACHE.set(resolved,faces);
  }
  return SHADOW_CACHE.get(resolved);
 }
 function paintGroundShadow(ctx,id,view,scale,height,altitude){
  if(altitude>=120)return;
  const opacity=Math.max(0,.20/(1+altitude/24));
  if(opacity<.012)return;
  ctx.save();
  ctx.translate(0,height*.23+Math.min(height*.10,altitude*.07));
  ctx.beginPath();
  for(const face of shadowFaces(id)){
   const transformed=face.map(([x,z])=>{
    if(view==="top")return [x*scale,-z*scale*.92];
    if(view==="side")return [z*scale*.85,-x*scale*.15];
    return [(x+z*.12)*scale,-z*scale*.38];
   });
   ctx.moveTo(...transformed[0]);ctx.lineTo(...transformed[1]);
   ctx.lineTo(...transformed[2]);ctx.closePath();
  }
  ctx.fillStyle="rgba(14,27,31,"+opacity.toFixed(3)+")";
  ctx.fill();
  ctx.restore();
 }
 function paint(ctx,state,{id="c172",width=960,height=540,view="chase",animation={},orbit={}}={}){
  if(view==="inspect")return paintInspection(ctx,{id,width,height,orbit,animation});
  if(!ctx||!state)return false;
  const speed=Number.isFinite(state.groundSpeedKt)?
   Math.max(0,Math.min(500,state.groundSpeedKt)):0;
  const movement=Math.min(1,speed/(state.mode==="helicopter"?100:210));
  // Mirror the WebGL chase camera's wider high-speed framing in fallback
  // mode, keeping the same selected aircraft and animated control surfaces.
  const scale=Math.max(2,Math.min(width/24,height/17))*(1-movement*.13);
  const roll=Number.isFinite(state.rollDeg)?state.rollDeg:0;
  const pitch=Number.isFinite(state.pitchDeg)?state.pitchDeg:0;
  const altitude=Math.max(0,Number(state.altitudeM)||0);
  const bounce=Number.isFinite(animation?.touchdownBounce)?
   Math.max(0,Math.min(.24,animation.touchdownBounce)):0;
  ctx.save();
  ctx.translate(width/2,height*.60);
  paintGroundShadow(ctx,id,view,scale,height,altitude);
  // The shadow remains attached to the runway, while the body now uses
  // real three-axis geometry projected from the selected outside viewpoint.
  const project=([x,y,z])=>view==="top"?
   [x*scale,-z*scale*.92]:
   view==="side"?
   [z*scale*.91,(-(y+bounce)*.95-x*.17)*scale]:
   [(x+z*.12)*scale,(-(y+bounce)*.91-z*.43)*scale];
  // One painter pass for body, rotating blades and hinged surfaces preserves
  // the correct near/far layer when the camera or selected aircraft changes.
  for(const face of projectedFaces(id,view,animation,{rollDeg:roll,pitchDeg:pitch})){
   const [a,b,d]=face.points.map(project);
   ctx.globalAlpha=face.opacity;
   ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.lineTo(...d);
   ctx.closePath();ctx.fillStyle=rgb(...face.color);ctx.fill();
  }
  ctx.globalAlpha=1;
  ctx.restore();
  return true;
 }
 const api=Object.freeze({getMesh,geometry,movingParts,rotorSweepTriangles,propellerSweepTriangles,rotate,attitudePoint,viewDepth,projectedFaces,paint,paintInspection});
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.AGSAExteriorChase2D=api;
})(typeof window!=="undefined"?window:null);
