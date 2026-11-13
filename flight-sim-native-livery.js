/* Original, mobile-lightweight liveries for native flight meshes.
 * Vertex colours only: not photographic skins or imported PBR textures.
 * Coordinates are in each aircraft's existing local source-mesh metres.
 * Keeps canopy, air intakes, gear, engines and cockpit source materials intact.
 */
(function(root){"use strict";
const clamp=v=>Math.max(0,Math.min(1,v));
const mix=(a,b,t)=>a*(1-t)+b*t;
function skinPart(id,name){
 const n=String(name||"").toLowerCase();
 if(id==="f22")return /^(fuselage_|left_wing_|right_wing_|left_keel_|right_keel_|left-rudder|right-rudder|left-flap|right-flap|left-aileron|right-aileron|left-slat|right-slat|left-elevator|right-elevator)/.test(n);
 if(id==="f35")return /^(fuselage|tail|spoiler[lr]|flaperon[lr]|elevators|rudder[lr])$/.test(n);
 if(id==="typhoon")return /^(fuselage|wing|tail|slat\.|flaperon|elevator\.|rudder$|speedbrake)/.test(n);
 if(id==="fa18")return n==="skin";
 return false;
}
function cover(id,name,y){
 const n=String(name).toLowerCase();
 if(id==="f22"){
  if(/wing|aileron|flap|slat|elevator/.test(n))return clamp((y+.99)/.19);
  if(/keel|rudder/.test(n))return 1;
  return clamp((y+1.30)/.75);
 }
 if(id==="f35")return /rudder|tail/.test(n)?1:clamp((y+.88)/.73);
 if(id==="typhoon"){
  if(/wing|slat|flaperon|elevator/.test(n))return clamp((y+.47)/.38);
  if(/tail|rudder/.test(n))return 1;
  return clamp((y+.65)/.92);
 }
 return clamp((y+.40)/.78);
}
function paint(id,name,x,y,z,base){
 if(!Array.isArray(base)||base.length!==3||!skinPart(id,name))
  return base;
 // A source Raptor belly panel can face the sun even below the body; the
 // unpainted imported white material made its wheel-bay shoulders glow.
 // Apply dark underside RAM-style colour only beneath its main fuselage.
 // All original geometry and non-F-22 aircraft colours remain untouched.
 if(id==="f22"&&/^fuselage_/i.test(name)&&y< -1.35){
  const blend=clamp((-1.35-y)/.30)*.88;
  const underside=[.34,.40,.44];
  return base.map((c,i)=>clamp(mix(c,underside[i],blend)));
 }
 const top=cover(id,name,y);
 if(top<=0)return base;
 // Smooth, deterministic changes in local X/Z ensure wings and matching
 // moving control surfaces receive a continuous livery, without seams.
 const field=Math.sin(x*.92+Math.sin(z*.39)*.92)*
  Math.cos(z*.66-x*.23)+.29*Math.sin(z*.98+x*.40);
 const fine=Math.sin(z*2.10+x*.87)*Math.cos(x*2.63-z*.37);
 let target,weight,edge=0;
 if(id==="f22"){
  target=field>.22?[.36,.46,.52]:
   field<-.24?[.63,.70,.72]:[.47,.57,.63];
  weight=.69;
  edge=Math.abs(fine)<.075?.026:0;
 }else if(id==="f35"){
  // Subtle faceted low-contrast grey panel finish rather than camouflage.
  target=field>.16?[.39,.45,.49]:[.47,.53,.56];
  weight=.48;
  edge=Math.abs(fine)<.075?.018:0;
 }else if(id==="typhoon"){
  target=field>.34?[.49,.56,.60]:
   field<-.36?[.68,.72,.74]:[.59,.65,.69];
  weight=.44;
  edge=Math.abs(fine)<.07?.014:0;
 }else{
  // F/A-18: ocean-service pale-grey top surfaces and subtle wear.
  target=field>.19?[.55,.63,.67]:[.67,.72,.75];
  weight=.39;
  edge=Math.abs(fine)<.075?.012:0;
 }
 const opacity=top*weight;
 return base.map((c,i)=>clamp(mix(c,target[i],opacity)-edge*top));
}
function paintMesh(id,mesh){
 if(!mesh||!Array.isArray(mesh.p)||!Array.isArray(mesh.c)||
    mesh.p.length!==mesh.c.length)throw Error("Native fighter mesh colours invalid");
 for(let i=0;i<mesh.c.length;i+=3){
  // Only the muted hull paint palette; leave tinted glass, lights and
  // dark undercarriage/exhaust geometry in their separate material colours.
  const original=mesh.c.slice(i,i+3);
  const isHull=original[0]>.28&&original[0]<.87&&
   original[1]>.33&&original[1]<.90&&
   original[2]>.38&&original[2]<.92&&
   Math.abs(original[1]-original[2])<.22;
  if(!isHull)continue;
  const changed=paint(id,"skin",mesh.p[i],mesh.p[i+1],mesh.p[i+2],original);
  for(let k=0;k<3;k++)mesh.c[i+k]=changed[k];
 }
 return mesh;
}
const api=Object.freeze({paint,paintMesh,skinPart});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSANativeFighterLivery=api;
})(typeof window!=="undefined"?window:null);
