/* Genuine WebGL2 three-dimensional geometry for a fictional Academy airfield.
 * No network, textures, GPS, real airports or imported engines. Canvas 2D
 * remains the compatible fallback. No qualified simulator is claimed.
 */
(function(root){"use strict";
const RAD=Math.PI/180;
const rgb=(r,g,b)=>[r/255,g/255,b/255];
const limit=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
const tint=(c,f)=>c.map(x=>limit(x*f,0,1));
const noise=n=>{const v=Math.sin(n*127.1+78.233)*43758.5453;return v-Math.floor(v)};
const grass=rgb(84,130,83),tarmac=rgb(68,81,89),white=rgb(237,242,229);
const Exterior=root?.AGSAExteriorAirframes||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-airframe-geometry.js"):null);
if(!Exterior)throw Error("Exterior aircraft geometry module missing");
const Airport=root?.AGSAFlightAirportDetail||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-airport-detail.js"):null);
const PadDetail=root?.AGSAHelipadDetail||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-helipad-detail.js"):null);
const Countryside=root?.AGSACountryside||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-countryside.js"):null);
const Traffic=root?.AGSAAirfieldTraffic||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-ground-traffic.js"):null);
const RealAirframes=root?.AGSARealAirframes||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-real-airframes.js"):null);
const RealR44=root?.AGSARealR44||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-real-r44.js"):null);
const MolenR44=root?.AGSAR44Airframe||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-r44-airframe.js"):null);
const MolenC172=root?.AGSAC172Airframe||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-c172-airframe.js"):null);
const F22Airframe=root?.AGSAF22Airframe||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-f22-airframe.js"):null);
const F35Airframe=root?.AGSAF35Airframe||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-f35-airframe.js"):null);
const Su37Airframe=root?.AGSASu37Airframe||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-su37-airframe.js"):null);
const TyphoonAirframe=root?.AGSATyphoonAirframe||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-typhoon-airframe.js"):null);
const Windsocks=root?.AGSAFlightWindsocks||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-windsocks.js"):null);
const Clouds=root?.AGSAFlightClouds||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-clouds.js"):null);
if(!Clouds)throw Error("Deterministic cloud scenery module missing");

class Mesh{
 constructor(){this.p=[];this.c=[];this.n=[];this.triangles=0}
 tri(a,b,c,color){
  const u=b.map((v,i)=>v-a[i]),v=c.map((w,i)=>w-a[i]);
  let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const len=Math.hypot(...n)||1;n=n.map(x=>x/len);
  for(const point of [a,b,c]){this.p.push(...point);this.c.push(...color);this.n.push(...n)}
  this.triangles++;
 }
 quad(a,b,c,d,color){this.tri(a,b,c,color);this.tri(a,c,d,color)}
 box(x,y,z,w,h,d,color,top=tint(color,1.15)){
  const X=x+w,Y=y+h,Z=z+d;
  this.quad([x,Y,z],[X,Y,z],[X,Y,Z],[x,Y,Z],top);
  this.quad([x,y,z],[X,y,z],[X,Y,z],[x,Y,z],color);
  this.quad([x,y,Z],[X,y,Z],[X,Y,Z],[x,Y,Z],tint(color,.77));
  this.quad([x,y,z],[x,y,Z],[x,Y,Z],[x,Y,z],tint(color,.86));
  this.quad([X,y,Z],[X,y,z],[X,Y,z],[X,Y,Z],tint(color,.96));
  this.quad([x,y,Z],[x,y,z],[X,y,z],[X,y,Z],color);
 }
 cone(x,y,z,r,h,color,sides=7){
  for(let i=0;i<sides;i++){
   const a=i*Math.PI*2/sides,b=(i+1)*Math.PI*2/sides;
   this.tri([x+r*Math.cos(a),y,z+r*Math.sin(a)],
    [x,y+h,z],[x+r*Math.cos(b),y,z+r*Math.sin(b)],tint(color,.8+noise(i+x)*.25));
  }
 }
 cloud(x,y,z,s){
  const p=[[x,y+s*.24,z],[x+s,y,z],[x,y,z+s*.5],[x-s,y,z],[x,y,z-s*.5],[x,y-s*.24,z]];
  for(let i=1;i<=4;i++){const j=i===4?1:i+1;
   this.tri(p[0],p[i],p[j],rgb(234,246,248));
   this.tri(p[5],p[j],p[i],rgb(206,228,234));
  }
 }
 finish(){return {positions:new Float32Array(this.p),colors:new Float32Array(this.c),
  normals:new Float32Array(this.n),vertices:this.p.length/3,triangles:this.triangles}}
}
// Low-poly cars remain small on Android and reuse one GPU mesh per type.
function buildGroundVehicle(kind="service"){
 const m=new Mesh(),service=kind==="service";
 const body=service?rgb(242,183,46):rgb(110,168,210);
 const roof=service?rgb(252,214,105):rgb(207,222,230);
 const glass=rgb(45,84,106),rubber=rgb(30,38,44),lights=rgb(244,244,216);
 m.box(-1.18,.27,-2.15,2.36,1.02,4.30,body);
 m.box(-1.02,1.19,-.82,2.04,.82,2.20,roof);
 // Cab glass on both sides; broad dark front and rear windscreens.
 m.box(-1.065,1.34,-.46,.06,.49,1.25,glass);
 m.box(1.005,1.34,-.46,.06,.49,1.25,glass);
 m.box(-.90,1.33,1.30,1.80,.44,.06,glass);
 m.box(-.90,1.33,-.87,1.80,.42,.06,glass);
 // Four visible dark tires, bumper and paired marker lights.
 for(const side of [-1,1])for(const z of [-1.25,1.26])
  m.box(side<0?-1.30:1.08,.07,z-.42,.22,.64,.84,rubber);
 m.box(-1.10,.30,2.13,2.20,.18,.16,rubber);
 m.box(-.93,.61,2.18,.37,.26,.10,lights);
 m.box(.56,.61,2.18,.37,.26,.10,lights);
 if(service)m.box(-.52,2.02,-.42,1.04,.14,.86,rgb(252,217,87));
 return m.finish();
}
// Small exterior position-light housings on the genuine C172/R44 models.
// Kept separate from the licensed aircraft mesh, so texture decoding and
// rotor/propeller assembly remain untouched. +X is starboard (green).
// The MIT/FlightGear aircraft have DIFFERENT physical bounds from the old
// illustrative fallback. Locate fixtures on the actual imported source mesh
// instead of drawing detached light boxes at old guessed coordinates.
function sourceFixturePoint(primitives,target,filter=()=>true){
 if(!Array.isArray(primitives)||!primitives.length)return null;
 const choose=pred=>{
  let best=null,score=Infinity;
  for(const p of primitives){
   if((p.partAxis||0)!==0)continue; // do not attach to moving blades
   const a=p.positions;
   for(let i=0;i<a.length;i+=3){
    const x=a[i],y=a[i+1],z=a[i+2];
    if(!pred(x,y,z))continue;
    const d=(x-target[0])**2+(y-target[1])**2+
     (z-target[2])**2;
    if(d<score){score=d;best=[x,y,z];}
   }
  }
  return best;
 };
 return choose(filter)||choose(()=>true);
}
function sourceExtreme(primitives,coordinate,sign){
 let result=null,extreme=sign>0?-Infinity:Infinity;
 for(const p of primitives||[]){
  if((p.partAxis||0)!==0)continue;
  const a=p.positions;
  for(let i=0;i<a.length;i+=3){
   const x=a[i],y=a[i+1],z=a[i+2],v=[x,y,z][coordinate];
   if(sign*v>sign*extreme){extreme=v;result=[x,y,z];}
  }
 }
 return result;
}
function exteriorLightStations(id,primitives=null){
 if(id!=="c172"&&id!=="r44")throw Error("Position lights require a trainer or R44");
 if(!Array.isArray(primitives)||!primitives.length){
  return id==="c172"?[
   [-5.25,.96,-1.52],[5.25,.96,-1.52],[0,.85,-4.13]
  ]:[[-.71,-.04,3.52],[.71,-.04,3.52],[0,.87,-8.19]];
 }
 if(id==="c172")return [
  sourceExtreme(primitives,0,-1)||[-5.25,.96,-1.52],
  sourceExtreme(primitives,0,1)||[5.25,.96,-1.52],
  sourceExtreme(primitives,2,-1)||[0,.85,-4.13]
 ];
 return [
  sourceFixturePoint(primitives,[-.70,-.60,2.93],
   (x,y,z)=>x<-.35&&y> -1.1&&y<.35&&z>2.0&&z<4.1),
  sourceFixturePoint(primitives,[.70,-.60,2.93],
   (x,y,z)=>x>.35&&y> -1.1&&y<.35&&z>2.0&&z<4.1),
  // The source tail's lowest/aft-most vertex was a LOWER FIN tip, so the
  // previous aft light hung visibly below the helicopter in 360 view.
  // Attach to a raised side/fin vertex near the actual tail rotor instead.
  sourceFixturePoint(primitives,[0,.58,-5.3],
   (x,y,z)=>Math.abs(x)<.90&&y>-.12&&y<1.35&&z< -2.6)
 ].map((p,i)=>p||[[-.71,-.04,3.52],[.71,-.04,3.52],[0,.87,-3.58]][i]);
}
function exteriorStrobeStation(id,primitives=null){
 if(id!=="c172"&&id!=="r44")throw Error("Strobe requires trainer or R44");
 if(!Array.isArray(primitives)||!primitives.length)
  return id==="c172"?[0,1.68,.28]:[0,2.49,1.10];
 const target=id==="c172"?[0,.76,.35]:[0,1.02,2.17];
 const filter=id==="c172"?
  (x,y,z)=>Math.abs(x)<.42&&y>.2&&z>-.45&&z<1.3:
  (x,y,z)=>Math.abs(x)<.48&&y>.30&&z>1.4&&z<3.3;
 return sourceFixturePoint(primitives,target,filter)||target;
}
function buildExteriorPositionLights(id,primitives=null){
 const mesh=new Mesh();
 const red=rgb(249,65,58),green=rgb(81,246,120),
  whiteLight=rgb(249,248,222);
 const stations=exteriorLightStations(id,primitives);
 // A large opaque black fixture looked like a floating crate in the 360°
 // helicopter screenshot even when anchored to the source tail surface.
 // Keep the actual coloured lamp lens small, bright and half sunk into
 // the original aircraft skin; no second, oversized decorative housing.
 const radius=id==="r44"?.06:.085;
 for(let i=0;i<stations.length;i++){
  const [x,y,z]=stations[i],color=[red,green,whiteLight][i];
  mesh.box(x-radius,y-radius,z-radius,2*radius,2*radius,2*radius,
   color,tint(color,1.12));
 }
 return mesh.finish();
}
function buildExteriorStrobe(id,primitives=null){
 const mesh=new Mesh(),light=rgb(255,252,237);
 const [x,y,z]=exteriorStrobeStation(id,primitives);
 // Small raised lamp based on a real model surface vertex, never an
 // isolated floating cube above the source helicopter rotor.
 mesh.box(x-.105,y-.015,z-.105,.21,.12,.21,light);
 return mesh.finish();
}
function exteriorStrobePulse(time=0,reducedMotion=false){
 if(reducedMotion)return .38;
 const t=Math.max(0,Number.isFinite(time)?time:0)%1.65;
 return t<.065||(t>.16&&t<.225)?1:0;
}
function elevation(x,z){
 const edge=Math.max(0,Math.abs(x)-650),far=Math.max(0,z-2100);
 return Math.min(210,edge*.052+far*.015*(.55+.45*Math.sin(x*.002+z*.004)));
}
function ground(mesh){
 // A continuous terrain mesh covers full circuits and return approaches,
 // including the southern side of the runway. Larger distant cells keep
 // vertex counts modest on Android rather than clipping the world at 3 km.
 const cell=400;
 for(let z=-9600;z<14400;z+=cell)for(let x=-9600;x<9600;x+=cell){
  const col=tint(noise(x*.1+z*.05)>.35?grass:rgb(128,144,84),
   .82+noise(x*.17+z*.33)*.27);
  mesh.quad([x,elevation(x,z)-.2,z],[x+cell,elevation(x+cell,z)-.2,z],
   [x+cell,elevation(x+cell,z+cell)-.2,z+cell],
   [x,elevation(x,z+cell)-.2,z+cell],col);
 }
}
function countryside(mesh){
 if(!Countryside)return;
 // Static crop fields and narrow farm lanes provide true ground parallax
 // during the full circuit. Low-poly quads are built only once and shared
 // by the runway and helipad worlds, not uploaded each rendered frame.
 const y=(x,z)=>Countryside.terrainHeight(x,z)+.14;
 // Visible service roads follow the actual circular vehicle routes;
 // their geometry is static and adds no extra animation draw calls.
 for(const route of Traffic.routes){
  for(const corners of Traffic.roadSegments(route,48)){
   mesh.quad(...corners.map(([x,z])=>[x,.19,z]),rgb(96,100,100));
  }
 }
 for(const field of Countryside.fields){
  const {x,z,w,d,color}=field;
  mesh.quad([x,y(x,z),z],[x+w,y(x+w,z),z],
   [x+w,y(x+w,z+d),z+d],[x,y(x,z+d),z+d],hexRgb(color));
 }
 for(const track of Countryside.farmTracks){
  const corners=Countryside.trackCorners(track);
  mesh.quad(...corners.map(([x,z])=>[x,y(x,z)+.02,z]),rgb(155,141,108));
 }
 // Two-stage tank roofs and four slender supports provide recognisable
 // 3D silhouettes from the cockpit, chase, side and full 360° cameras.
 // They stay on the terrain and add only a few hundred triangles total.
 for(const hedgerow of Countryside.hedgerows){
  const {x,z,w,d,h,color}=hedgerow;
  mesh.box(x,y(x,z),z,w,h,d,hexRgb(color));
 }
 // Cross-renderer groves of conifers turn from distant silhouettes into
 // foreground depth cues as the pilot passes them on base or downwind.
 // Each tree is simple static geometry; all are uploaded with the world once.
 for(const tree of Countryside.trees){
  const base=y(tree.x,tree.z),h=tree.h,r=tree.crown;
  mesh.box(tree.x-.34,base,tree.z-.34,.68,h*.30,.68,rgb(87,71,53));
  const leaves=hexRgb(tree.color);
  mesh.cone(tree.x,base+h*.23,tree.z,r,h*.67,leaves,7);
  mesh.cone(tree.x,base+h*.45,tree.z,r*.78,h*.55,tint(leaves,.85),7);
 }
 for(const farm of Countryside.farmsteads){
  const {x,z,w,d,h,wall,roof}=farm;
  const floor=y(x,z),yRoof=floor+h,peak=yRoof+Math.min(w,d)*.27;
  // One box and two sloped roof planes per small building; no textures,
  // instanced animation or additional WebGL resource per landmark.
  mesh.box(x,floor,z,w,h,d,hexRgb(wall));
  const ridgeX=x+w/2;
  const col=hexRgb(roof),shade=tint(col,.75);
  mesh.quad([x,yRoof,z],[ridgeX,peak,z],[ridgeX,peak,z+d],[x,yRoof,z+d],col);
  mesh.quad([ridgeX,peak,z],[x+w,yRoof,z],[x+w,yRoof,z+d],
   [ridgeX,peak,z+d],shade);
 }
 for(const tower of Countryside.towers){
  const {x,z,height:h,radius:r,color}=tower;
  const groundY=Countryside.terrainHeight(x,z);
  const dark=rgb(83,102,103),tank=hexRgb(color);
  for(const sideX of [-1,1])for(const sideZ of [-1,1])
   mesh.box(x+sideX*r*.7-.25,groundY,z+sideZ*r*.7-.25,
    .50,h*.73,.50,dark);
  mesh.box(x-r,groundY+h*.70,z-r,2*r,h*.25,2*r,tank);
  mesh.cone(x,groundY+h*.95,z,r*1.1,h*.13,tint(tank,.88),8);
  mesh.box(x-.22,groundY+h*1.08,z-.22,.44,h*.10,.44,dark);
 }
}
function runway(mesh){
 for(let z=0;z<1800;z+=90){
  mesh.quad([-20,.05,z],[20,.05,z],[20,.05,z+90],[-20,.05,z+90],
   tint(tarmac,.95+noise(z)*.1));
  for(const x of [-20,19.6])
   mesh.quad([x,.08,z],[x+.4,.08,z],[x+.4,.08,z+90],[x,.08,z+90],white);
  if(z>60&&z<1740&&Math.floor(z/90)%2===0)
   mesh.quad([-1.2,.1,z+13],[1.2,.1,z+13],[1.2,.1,z+62],[-1.2,.1,z+62],white);
 }
 for(const z of [12,1740])for(const x of [-15,-11,-7,7,11,15])
  mesh.quad([x-1,.12,z],[x+1,.12,z],[x+1,.12,z+24],[x-1,.12,z+24],white);
 // Side shoulders and pavement joints add low-altitude movement cues
 // without increasing texture memory or issuing extra GPU draw calls.
 for(let z=0;z<1800;z+=90){
  for(const x of [-23,20.4])
   mesh.quad([x,.06,z],[x+2.6,.06,z],[x+2.6,.06,z+90],[x,.06,z+90],
    tint(tarmac,.73));
  if(z>0&&z<1750)
   for(const x of [-17,5.5])
    mesh.quad([x,.075,z-.12],[x+11.5,.075,z-.12],
     [x+11.5,.075,z+.12],[x,.075,z+.12],tint(tarmac,.83));
 }
 // Fictional touchdown-zone pairs and subtle rubber deposits near each end.
 for(const end of [0,1800]){
  for(const distance of [130,270,430]){
   const z=end===0?distance:1800-distance-18;
   for(const x of [-12.5,10]){
    mesh.quad([x,.115,z],[x+2.5,.115,z],
     [x+2.5,.115,z+18],[x,.115,z+18],rgb(207,218,212));
   }
  }
  for(let i=0;i<9;i++){
   const d=82+i*29,z=end===0?d:1800-d-12;
   for(const x of [-6.9,5.3]){
    const shift=(noise(i*11+x)-.5)*.65;
    mesh.quad([x+shift,.105,z],[x+shift+1.2,.105,z],
     [x+shift+1.2,.105,z+8],[x+shift,.105,z+8],tint(tarmac,.75));
   }
  }
 }
 for(let z=0;z<=1800;z+=95)for(const x of [-24,24])
  mesh.box(x-.4,.05,z-.4,.8,.6,.8,rgb(222,207,136));
 mesh.quad([20,.08,250],[270,.08,250],[270,.08,310],[20,.08,310],tarmac);
 mesh.quad([125,.08,310],[370,.08,310],[370,.08,700],[125,.08,700],tint(tarmac,.93));
}
// Low-cost crossed light cards; drawn only in golden/dusk modes. These are
// artistic ground cues, not actual airport light positions or specifications.
function buildGroundGlow(mode){
 const m=new Mesh(),warm=rgb(255,218,132),blue=rgb(137,226,237);
 function bulb(x,z,color){
  const y=.28,r=.75,h=1.8;
  m.quad([x-r,y,z],[x+r,y,z],[x+r,y+h,z],[x-r,y+h,z],color);
  m.quad([x,y,z-r],[x,y,z+r],[x,y+h,z+r],[x,y+h,z-r],color);
 }
 if(mode==="helicopter"){
  for(let i=0;i<20;i++){
   const angle=i*Math.PI*2/20;
   bulb(33*Math.cos(angle),33*Math.sin(angle),i%5===0?warm:blue);
  }
 }else{
  for(let z=0;z<=1800;z+=75)
   for(const x of [-24,24])bulb(x,z,warm);
  // The same fixed approach string is used by the daytime scene and
  // dusk lamp glow, so returning pilots see consistent landmarks.
  for(const p of Airport?.config?.approachLights||[])bulb(p.x,p.z,warm);
 }
 return m.finish();
}
function helipad(mesh){
 const r=30,inside=27,n=32;
 for(let i=0;i<n;i++){
  const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;
  mesh.tri([0,.08,0],[r*Math.cos(a),.08,r*Math.sin(a)],
   [r*Math.cos(b),.08,r*Math.sin(b)],rgb(50,66,77));
  mesh.quad([inside*Math.cos(a),.11,inside*Math.sin(a)],
   [r*Math.cos(a),.11,r*Math.sin(a)],[r*Math.cos(b),.11,r*Math.sin(b)],
   [inside*Math.cos(b),.11,inside*Math.sin(b)],rgb(232,204,122));
 }
 for(const [x,z,w,d] of [[-10,-10,3,20],[7,-10,3,20],[-10,-2,20,4]])
  mesh.quad([x,.13,z],[x+w,.13,z],[x+w,.13,z+d],[x,.13,z+d],white);
 helipadReferences(mesh);
}
function hexRgb(hex){
 const n=Number.parseInt(hex.slice(1),16);
 return rgb((n>>>16)&255,(n>>>8)&255,n&255);
}
function helipadReferences(mesh){
 if(!PadDetail)return;
 // Landmarks are painted into fixed world coordinates and do not follow
 // the camera or aircraft. They produce actual depth and drift cues.
 for(const a of PadDetail.hardstands){
  const c=hexRgb(a.color);
  mesh.quad([a.x,.13,a.z],[a.x+a.w,.13,a.z],
   [a.x+a.w,.13,a.z+a.d],[a.x,.13,a.z+a.d],c);
 }
 for(const radius of PadDetail.rings){
  const c=radius<12?rgb(128,223,228):rgb(238,241,221);
  for(const q of PadDetail.ringSegments(radius)){
   const r=.32/radius;
   mesh.quad([q.ax*(1-r),.17,q.az*(1-r)],
    [q.ax*(1+r),.17,q.az*(1+r)],
    [q.bx*(1+r),.17,q.bz*(1+r)],
    [q.bx*(1-r),.17,q.bz*(1-r)],c);
  }
 }
 for(const l of PadDetail.referenceLines){
  const dx=l.bx-l.ax,dz=l.bz-l.az,len=Math.hypot(dx,dz)||1;
  const nx=-dz/len*.38,nz=dx/len*.38,c=hexRgb(l.color);
  mesh.quad([l.ax+nx,.18,l.az+nz],[l.bx+nx,.18,l.bz+nz],
   [l.bx-nx,.18,l.bz-nz],[l.ax-nx,.18,l.az-nz],c);
 }
 for(const p of PadDetail.pylons){
  mesh.box(p.x-1.3,.16,p.z-1.3,2.6,.18,2.6,rgb(233,233,204));
  mesh.box(p.x-.45,.34,p.z-.45,.9,p.height,.9,rgb(117,131,137));
  mesh.box(p.x-.95,p.height-.3,p.z-.95,1.9,1,1.9,hexRgb(p.color));
 }
 for(const p of PadDetail.buildings){
  mesh.box(p.x,0,p.z,p.w,p.h,p.d,hexRgb(p.color),hexRgb(p.roof));
  mesh.box(p.x+4,1,p.z-.25,p.w-8,p.h*.62,.5,rgb(49,75,84));
 }
 for(const p of PadDetail.fence){
  mesh.box(p.x-.2,0,p.z-.2,.4,p.height,.4,rgb(189,201,191));
 }
 const lineFrom=PadDetail.fence[0],lineTo=PadDetail.fence.at(-1);
 for(const y of [1.3,2.7]){
  mesh.box(lineFrom.x,y,lineFrom.z-.12,lineTo.x-lineFrom.x,.2,.24,
   rgb(177,186,175));
 }
}
function airfield(mesh){
 for(const [x,z,w,h,d] of [[125,420,67,16,85],[-220,980,90,21,100],
  [135,1520,75,19,112],[-190,260,90,16,75],[145,1030,74,16,96]]){
  mesh.box(x,0,z,w,h,d,rgb(159,185,193),rgb(113,139,150));
  mesh.box(x+w*.15,.04,z-.3,w*.7,h*.77,.3,rgb(72,100,116));
 }
 mesh.box(-118,0,600,16,42,16,rgb(154,174,186));
 mesh.box(-126,42,592,32,10,31,rgb(75,114,135));
 mesh.box(-111,52,607,2,20,2,rgb(189,204,211));
 for(let i=0;i<360;i++){
  const x=(i%2===0?-1:1)*(100+noise(i+7)*6200);
  const z=-7200+noise(i*3.3+11)*20000,y=elevation(x,z);
  const h=10+noise(i*9.9)*21;
  mesh.box(x-.95,y,z-.95,1.9,h*.35,1.9,rgb(92,75,62));
  mesh.cone(x,y+h*.2,z,h*.28,h*.82,
   i%3?rgb(43,105,73):rgb(51,119,72),6);
 }
 // Moving clouds are uploaded as one distinct shared GPU object. They do
 // not belong in the static terrain mesh or they would never drift.
}
function airportDetails(mesh){
 if(!Airport)return;
 const {config,strip,aircraftFootprint}=Airport;
 const yellow=rgb(238,197,80),blue=rgb(73,134,185),gold=rgb(230,181,97),
  apron=rgb(87,95,99),truck=rgb(205,207,197);
 // Reflective apron markings are on top of the existing airfield surface.
 const a=config.apron;
 mesh.quad([a.left,.145,a.near],[a.right,.145,a.near],
  [a.right,.145,a.far],[a.left,.145,a.far],tint(apron,.93));
 // Asphalt taxiway corridors and a visibly continuous centreline curve.
 for(const segment of config.taxiway){
  const {ax,az,bx,bz,widthM}=segment;
  const road=strip(ax,az,bx,bz,widthM/2,.155);
  if(road.length===4)mesh.quad(...road,tint(tarmac,1.04));
  const centre=strip(ax,az,bx,bz,.36,.21);
  if(centre.length===4)mesh.quad(...centre,yellow);
 }
 // A transverse yellow waiting marker is deliberately only decorative.
 const hold=config.holdLine;
 const holding=strip(hold.ax,hold.az,hold.bx,hold.bz,.65,.24);
 if(holding.length===4)mesh.quad(...holding,yellow);
 // Parked trainers are static aircraft-shaped apron props, NOT traffic.
 for(const p of config.parkedTrainers){
  const shape=aircraftFootprint(p.x,p.z,p.headingDeg);
  if(!shape)continue;
  const color=p.paint==="gold"?gold:blue;
  const [a,b]=shape.spine,[wl,wr]=shape.wings,[tl,tr]=shape.tail;
  const hull=strip(a[0],a[2],b[0],b[2],.78,1.05);
  const wing=strip(wl[0],wl[2],wr[0],wr[2],.73,1.15);
  const tail=strip(tl[0],tl[2],tr[0],tr[2],.42,1.22);
  if(hull.length===4)mesh.quad(...hull,rgb(224,233,229));
  if(wing.length===4)mesh.quad(...wing,color);
  if(tail.length===4)mesh.quad(...tail,color);
  mesh.box(p.x-.55,.18,p.z-.7,1.1,.82,1.4,rgb(67,95,113));
 }
 for(const p of config.serviceVehicles){
  const color=p.paint==="yellow"?gold:truck;
  mesh.box(p.x-2,.2,p.z-3,4,2.7,6,color);
  mesh.box(p.x-1.7,2.7,p.z,3.4,1.3,2.5,rgb(66,92,110));
  for(const x of [-1.2,1.2])for(const z of [-2,1.9])
   mesh.box(p.x+x-.33,.1,p.z+z-.4,.65,.75,.8,rgb(32,38,43));
 }
 // The longer centreline and two transverse pairs show where the south
 // threshold is from a returning base/final turn. Fixed-world geometry only:
 // bright, low-cost rectangular fixture faces rather than cockpit overlays.
 // These are fictional markers, not operational airport light guidance.
 for(const p of config.approachLights){
  mesh.box(p.x-.72,.02,p.z-.52,1.44,.42,1.04,rgb(245,219,158));
  mesh.box(p.x-.65,.44,p.z-.35,1.30,.21,.70,rgb(252,244,210));
 }
 for(const p of config.rampLights){
  mesh.box(p.x-.28,0,p.z-.28,.56,12,.56,rgb(110,128,136));
  mesh.box(p.x-1.7,12,p.z-1,3.4,.8,2,rgb(252,226,161));
 }
}
// Low-polygon four-sided fabric tube for both wind-blown and calm states.
// Mesh is uploaded once; a vertex shader rotates it about the world-anchored
// pole in response to the same deterministic wind sample as the Canvas view.
function buildWindsockFabric(anchor,limp=false){
 const m=new Mesh();
 const ring=t=>{
  const width=Math.max(.18,1.4*(1-t));
  const x=anchor.x,y=12-(limp?4.5*t:0),z=anchor.z+(limp?.6*t:7*t);
  return [[x-width,y-width*.4,z],[x+width,y-width*.4,z],
   [x+width,y+width*.4,z],[x-width,y+width*.4,z]];
 };
 for(let i=0;i<4;i++){
  const a=ring(i/4),b=ring((i+1)/4);
  const color=i%2?rgb(249,229,223):rgb(221,100,78);
  for(let j=0;j<4;j++)
   m.quad(a[j],a[(j+1)%4],b[(j+1)%4],b[j],color);
 }
 return m.finish();
}
function buildCloudLayer(){
 // Fixed, synthetic cloud coordinates shared with the phone fallback.
 // Each low-poly cluster is uploaded ONCE, not regenerated every frame.
 const m=new Mesh();
 for(const c of Clouds.clouds){
  m.cloud(c.x,c.y,c.z,c.size);
  m.cloud(c.x+c.size*.6,c.y+9,c.z+c.size*.15,c.size*.65);
 }
 return m.finish();
}
function buildWorld(mode="airplane"){
 if(!["airplane","helicopter"].includes(mode))throw Error("Unknown 3D airfield mode");
 const m=new Mesh();ground(m);countryside(m);
 if(mode==="airplane"){
  runway(m);airportDetails(m);
  for(const anchor of Windsocks.positions)
   m.box(anchor.x-.11,0,anchor.z-.11,.22,12,.22,rgb(225,226,218));
 }else helipad(m);
 airfield(m);
 const out=m.finish();
 if(out.vertices>130000)throw Error("3D mesh exceeds mobile geometry budget");
 return out;
}
function scaleMesh(mesh,mode){
 const [sx,sy,sz]=Exterior.SCALE[Exterior.normalize(mode)];
 if(sx===1&&sy===1&&sz===1)return mesh;
 const p=mesh.positions,n=mesh.normals;
 for(let i=0;i<p.length;i+=3){
  p[i]*=sx;p[i+1]*=sy;p[i+2]*=sz;
  const nx=n[i]/sx,ny=n[i+1]/sy,nz=n[i+2]/sz;
  const length=Math.hypot(nx,ny,nz)||1;
  n[i]=nx/length;n[i+1]=ny/length;n[i+2]=nz/length;
 }
 return mesh;
}
function scalePart(part,mode){
 const scale=Exterior.SCALE[Exterior.normalize(mode)];
 return {...part,pivot:part.pivot.map((v,i)=>v*scale[i]),
  mesh:scaleMesh(part.mesh,mode)};
}
function buildVehicle(mode="airplane"){
 const m=new Mesh();
 Exterior.populate(m,mode);
 return scaleMesh(m.finish(),mode);
}
// Trace a conservative ground silhouette from the actual scaled airframe
// triangles. This avoids the old generic oval appearing under every aircraft.
// The finite scanline budget runs only once per model, not once per frame.
function buildShadow(mode="c172"){
 const resolved=Exterior.normalize(mode),vehicle=buildVehicle(resolved),p=vehicle.positions;
 let zMin=Infinity,zMax=-Infinity;
 for(let i=2;i<p.length;i+=3){zMin=Math.min(zMin,p[i]);zMax=Math.max(zMax,p[i]);}
 const count=64,left=[],right=[];
 for(let row=0;row<=count;row++){
  const z=zMin+(zMax-zMin)*(row/count);
  let low=Infinity,high=-Infinity;
  for(let k=0;k<p.length;k+=9){
   for(let edge=0;edge<3;edge++){
    const a=k+3*edge,b=k+3*((edge+1)%3),za=p[a+2],zb=p[b+2];
    if(Math.abs(za-z)<1e-5){low=Math.min(low,p[a]);high=Math.max(high,p[a]);}
    if((za<z&&z<zb)||(zb<z&&z<za)){
     const x=p[a]+(p[b]-p[a])*(z-za)/(zb-za);
     low=Math.min(low,x);high=Math.max(high,x);
    }
   }
  }
  left.push(Number.isFinite(low)?low:null);
  right.push(Number.isFinite(high)?high:null);
 }
 const m=new Mesh(),shade=rgb(17,28,30);
 for(let i=0;i<count;i++){
  if(left[i]===null||left[i+1]===null)continue;
  const za=zMin+(zMax-zMin)*(i/count),zb=zMin+(zMax-zMin)*((i+1)/count);
  const la=left[i],ra=right[i],lb=left[i+1],rb=right[i+1];
  if(ra-la<.05&&rb-lb<.05)continue;
  m.quad([la,0,za],[ra,0,za],[rb,0,zb],[lb,0,zb],shade);
 }
 // The R44's moving two-blade rotor casts a faint rotating-disc impression.
 // The cockpit/exterior moving rotor blades remain separately animated.
 if(resolved==="r44"){
  const discRadius=5.03,centreZ=-.4,segments=24;
  for(let i=0;i<segments;i++){
   const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;
   m.tri([0,0,centreZ],[discRadius*Math.cos(a),0,centreZ+discRadius*Math.sin(a)],
    [discRadius*Math.cos(b),0,centreZ+discRadius*Math.sin(b)],shade);
  }
 }
 return m.finish();
}
// Low-cost translucent sweep that makes spinning R44 blades legible in a
// mobile chase view. This supplements rather than replaces the actual two
// animated rotor blades. It is rendered with alpha blending only in motion.
function buildRotorSweep(mode="r44"){
 if(Exterior.normalize(mode)!=="r44")return null;
 const m=new Mesh(),inner=rgb(179,201,211),tips=rgb(224,217,177);
 const count=32,hubZ=-.40,hubY=3.16,radius=5.03;
 const at=(r,angle)=>[r*Math.cos(angle),hubY+.16*r/radius,hubZ+r*Math.sin(angle)];
 for(let i=0;i<count;i++){
  const a=i*2*Math.PI/count,b=(i+1)*2*Math.PI/count;
  m.quad(at(.48,a),at(4.58,a),at(4.58,b),at(.48,b),inner);
  m.quad(at(4.58,a),at(radius,a),at(radius,b),at(4.58,b),tips);
 }
 return scaleMesh(m.finish(),"r44");
}
// Thin anti-torque rotor motion ring. The two actual moving blades remain
// opaque. This annulus helps fast rotation read on low-refresh mobile screens.
function buildTailRotorSweep(mode="r44"){
 if(Exterior.normalize(mode)!=="r44")return null;
 const m=new Mesh(),inner=rgb(161,195,205),tips=rgb(232,205,153);
 const count=24,x=-.81,cy=1.19,cz=-8.18,radius=.735;
 const at=(r,a)=>[x,cy+r*Math.cos(a),cz+r*Math.sin(a)];
 for(let i=0;i<count;i++){
  const a=i*2*Math.PI/count,b=(i+1)*2*Math.PI/count;
  m.quad(at(.20,a),at(.60,a),at(.60,b),at(.20,b),inner);
  m.quad(at(.60,a),at(radius,a),at(radius,b),at(.60,b),tips);
 }
 return scaleMesh(m.finish(),"r44");
}
// An unobtrusive translucent propeller sweep prevents the trainer's two
// rapidly spinning blades from vanishing between frames on mobile displays.
// The actual animated two-blade propeller is still drawn over the sweep.
function buildPropellerSweep(mode="c172"){
 if(Exterior.normalize(mode)!=="c172")return null;
 const m=new Mesh(),inner=rgb(140,161,174),tip=rgb(230,202,153);
 const count=24,radius=.965,hubZ=6.125;
 const sx=Exterior.SCALE.c172[0];
 const at=(r,a)=>[r*Math.cos(a)/sx,r*Math.sin(a),hubZ];
 for(let i=0;i<count;i++){
  const a=i*2*Math.PI/count,b=(i+1)*2*Math.PI/count;
  m.quad(at(.20,a),at(.84,a),at(.84,b),at(.20,b),inner);
  m.quad(at(.84,a),at(radius,a),at(radius,b),at(.84,b),tip);
 }
 return scaleMesh(m.finish(),"c172");
}
/* Animated parts have separate GPU vertex arrays. Part rotations are applied
 * around local hinge/hub pivots before the existing whole-aircraft transform.
 * This is a drawing model, not real hinge geometry or rotor dynamics. */
// Anchor the moving hardware to the actual FlightGear R44 mesh, not to a
// guessed percentage of the older illustrative helicopter's fuselage length.
// Coordinates come from the bundled AC3D geometry (converted to +Z nose):
// cabin mast at approximately (0,1.277,2.20); left tail-rotor shaft at
// approximately (-1.305,.235,-3.59). The hub clears the mast and shaft by
// a small visible gap so it does not disappear into the imported body.
const REAL_R44_HARDWARE_ANCHORS=Object.freeze({
 main:Object.freeze({
  legacy:Object.freeze([0,3.16,-.40]),
  actual:Object.freeze([0,1.48,2.20])
 }),
 tail:Object.freeze({
  legacy:Object.freeze([-.77,1.19,-8.18]),
  actual:Object.freeze([-1.355,.235,-3.59])
 })
});
function alignRealR44HardwarePoint(point,tail=false){
 const {legacy,actual}=tail?REAL_R44_HARDWARE_ANCHORS.tail:
  REAL_R44_HARDWARE_ANCHORS.main;
 // Translation preserves physical 10.06 m main rotor and 1.47 m tail rotor
 // diameters; the old *.60 tailboom compression also shrank/misplaced blur.
 return point.map((value,index)=>value-legacy[index]+actual[index]);
}
function alignRealR44Hardware(mesh,tail=false){
 const positions=new Float32Array(mesh.positions.length);
 for(let i=0;i<positions.length;i+=3){
  const p=alignRealR44HardwarePoint([
   mesh.positions[i],mesh.positions[i+1],mesh.positions[i+2]],tail);
  positions.set(p,i);
 }
 return {...mesh,positions};
}
function alignRealR44MovingPart(part){
 const tail=part.name.toLowerCase().includes("tail");
 return {...part,pivot:alignRealR44HardwarePoint(part.pivot,tail),
  mesh:alignRealR44Hardware(part.mesh,tail)};
}
function buildMovingParts(mode="airplane"){
 if(Exterior.IDS.includes(mode)&&mode!=="c172"&&mode!=="r44"){
  return Exterior.buildJetParts(Mesh,mode).map(part=>scalePart(part,mode));
 }
 if(mode==="r44")mode="helicopter";
 if(mode==="c172")mode="airplane";
 if(!["airplane","helicopter"].includes(mode))throw Error("Unknown animated craft mode");
 const pale=rgb(211,237,241),yellow=rgb(234,183,107),
  blue=rgb(75,137,174),metal=rgb(173,191,205);
 const result=[];
 const add=(name,pivot,axis,draw)=>{
  const m=new Mesh();draw(m);result.push({name,pivot,axis,mesh:m.finish()});
 };
 if(mode==="airplane"){
  // A Cessna 172-style two-blade fixed-pitch propeller: one 1.93 m disk,
  // not the former four-bladed cross or 4.3 m helicopter-sized propeller.
  // The small difference in each blade face gives visual pitch/twist.
  add("propeller",[0,0,6.11],3,m=>{
   for(const sign of [-1,1]){
    const y0=sign*.18,y1=sign*.80,y2=sign*.965;
    m.quad([-.14,y0,6.13],[.15,y0,6.09],
     [.10,y1,6.07],[-.10,y1,6.13],metal);
    m.quad([-.10,y1,6.13],[.10,y1,6.07],
     [.045,y2,6.09],[-.055,y2,6.13],tint(metal,.89));
    m.quad([.15,y0,6.04],[-.14,y0,6.08],
     [-.10,y1,6.07],[.10,y1,6.01],tint(metal,.75));
    m.quad([.10,y1,6.01],[-.10,y1,6.07],
     [-.055,y2,6.06],[.045,y2,6.02],tint(metal,.7));
    m.box(-.08,sign>0?.84:-.95,6.08,.16,.11,.1,yellow);
   }
   m.box(-.22,-.22,6.12,.44,.44,.18,yellow);
  });
  // Visible wheel-hub paint rotates with runway speed. The existing
  // round tyres and landing-gear struts stay in the static C172 body mesh:
  // no additional heavy cylinders are needed on low-powered Android GPUs.
  // A pair of contrasting radial marks can be seen in chase, side and 360
  // inspection views, and uses the same rotating-part data in Canvas 2D.
  const hubMark=(m,x,y,z,r)=>{
   for(const faceSign of [-1,1]){
    // Leave the hub's original metal surface intact. The moving paint sits
    // just beyond the tyre's .105-wide face, inside its .42-radius hub.
    const face=x+faceSign*.133;
    const strip=(a,b,half,color)=>{
     m.quad([face,y+a,z-half],[face,y+b,z-half],
      [face,y+b,z+half],[face,y+a,z+half],color);
     m.quad([face,y+a,z+half],[face,y+b,z+half],
      [face,y+b,z-half],[face,y+a,z-half],color);
    };
    strip(r*.10,r*.38,r*.053,blue);
    strip(-r*.38,-r*.13,r*.065,yellow);
   }
  };
  add("mainWheels",[0,-1.25,-.80],1,m=>{
   for(const sign of [-1,1])hubMark(m,sign*2.10,-1.25,-.80,.35);
  });
  add("noseWheel",[0,-1.25-(.26-.35)*.24,4.45],1,m=>{
   hubMark(m,0,-1.25-(.26-.35)*.24,4.45,.26);
  });
  // Flaps and ailerons must be physically connected to the high wings,
  // not floating a metre below the aircraft (the previous geometry).
  // Hinges rotate about the lateral X axis and remain in the same
  // local coordinates in the 2D renderer and 360-degree WebGL inspector.
  const panel=(m,a,b,c,d,color)=>{
   m.quad(a,b,c,d,color);
   m.quad(d,c,b,a,tint(color,.78));
  };
  for(const sign of [-1,1]){
   const side=sign<0?"left":"right";
   add(side==="left"?"leftAileron":"rightAileron",
    [sign*6.12,.94,-1.45],1,m=>{
     panel(m,[sign*5.10,.94,-1.32],[sign*7.26,.95,-1.52],
      [sign*7.26,.92,-1.85],[sign*5.10,.91,-1.69],pale);
    });
  }
  for(const sign of [-1,1]){
   const side=sign<0?"left":"right";
   add(side==="left"?"leftFlap":"rightFlap",
    [sign*2.6,.94,-1.27],1,m=>{
     panel(m,[sign*.94,.93,-1.15],[sign*4.78,.94,-1.24],
      [sign*4.78,.91,-1.68],[sign*.94,.90,-1.64],blue);
    });
  }
  for(const [name,x] of [["elevatorLeft",-2.5],["elevatorRight",.38]]){
   add(name,[x+1.04,.81,-5.55],1,m=>{
    m.box(x,.79,-6.08,2.12,.16,.65,pale);
   });
  }
  add("rudder",[0,1.4,-5.65],2,m=>{
   m.box(-.12,1.2,-6.12,.24,1.65,.55,yellow);
  });
 }else{
  // Two low-poly swashplate reference rings beneath the main rotor hub.
  // They tilt independently with cyclic bank and pitch; they neither drive
  // flight physics nor pretend to reproduce R44 rotor control linkages.
  const swashRing=(name,y,axis,color)=>{
   add(name,[0,y,-.4],axis,m=>{
    const outer=.50,inner=.34,segments=12,z=-.4;
    for(let i=0;i<segments;i++){
     const a=2*Math.PI*i/segments,b=2*Math.PI*(i+1)/segments;
     m.quad([inner*Math.cos(a),y,z+inner*Math.sin(a)],
      [outer*Math.cos(a),y,z+outer*Math.sin(a)],
      [outer*Math.cos(b),y,z+outer*Math.sin(b)],
      [inner*Math.cos(b),y,z+inner*Math.sin(b)],color);
    }
    // Tiny contrasting tie arms show the tilt on narrow chase screens.
    m.box(-.06,y-.03,z-.70,.12,.09,.32,metal);
    m.box(-.06,y-.03,z+.38,.12,.09,.32,blue);
   });
  };
  swashRing("swashBank",2.76,3,metal);
  swashRing("swashPitch",2.67,1,blue);
  // Separate yellow root linkage illustrates changes to the collective
  // lever independently of the two rotating rotor blades.
  add("collectiveLink",[0,3.02,-.40],1,m=>{
   m.box(-.05,2.95,-.75,.10,.12,.64,yellow);
   m.box(-.18,3.00,-.21,.36,.12,.14,metal);
  });
  // R44 rotor arrangement: one teetering TWO-blade main rotor, 10.06 m
  // diameter; one TWO-blade tail rotor, 1.47 m diameter. Blade sections
  // have slight coning, tapered tips and contrasting edges for legibility.
  // Both rotate around their real geometric hubs (Y and X respectively).
  add("mainRotor",[0,3.16,-.4],2,m=>{
   // An actual two-blade rotor: broad, tapered chord, contrasting upper
   // face and darker underside. The hub, tips and root hardware all share
   // the rotation transform, so chase/top/inspection agree with the model.
   const y=3.16,hubZ=-.40,tip=5.03;
   const upper=rgb(218,231,232),leading=rgb(242,246,231);
   const underside=rgb(87,104,117),tipPaint=rgb(231,187,82);
   for(const sign of [-1,1]){
    const A=[sign*.32,y,hubZ-.23],B=[sign*4.65,y+.15,hubZ-.25];
    const C=[sign*tip,y+.18,hubZ-.13],D=[sign*tip,y+.18,hubZ+.08];
    const E=[sign*4.65,y+.15,hubZ+.13],F=[sign*.32,y,hubZ+.23];
    // Airfoil broad surface with a bright chordwise leading edge.
    m.quad(A,B,E,F,upper);
    m.tri(B,C,D,tint(upper,1.04));m.tri(B,D,E,upper);
    const frontA=[sign*.32,y+.014,hubZ-.23],
     frontB=[sign*4.65,y+.164,hubZ-.25],
     frontE=[sign*4.65,y+.164,hubZ-.18],
     frontF=[sign*.32,y+.014,hubZ-.16];
    m.quad(frontA,frontB,frontE,frontF,leading);
    // Full underside and a dark trailing edge read from a low side camera.
    const under=v=>[v[0],v[1]-.065,v[2]];
    m.quad(under(F),under(E),under(B),under(A),underside);
    m.tri(under(E),under(D),under(B),tint(underside,1.12));
    m.quad(under(A),under(B),B,A,tint(underside,.86));
    m.quad(under(F),F,E,under(E),tint(underside,.72));
    // Each yellow tip is part of its OWN blade (not extra blades).
    m.box(sign>0?4.64:-4.98,y+.13,hubZ-.26,.34,.075,.40,tipPaint);
    // Rotor root cuffs and metal blade hinges remain visible in rotation.
    m.box(sign>0?.34:-.72,y-.045,hubZ-.24,.38,.10,.48,blue);
    m.box(sign>0?.69:-.87,y-.025,hubZ-.27,.17,.12,.54,tint(metal,.82));
   }
   m.box(-.39,y-.12,hubZ-.35,.78,.23,.70,blue);
   m.box(-.24,y+.10,hubZ-.19,.48,.18,.38,yellow);
   m.box(-.12,y+.26,hubZ-.12,.24,.09,.24,metal);
  });
  // Pitch-control arm near the outboard tail rotor hub. Pedals tilt this
  // lever without falsely accelerating the rotor or altering heading.
  add("tailPitchLink",[-.77,1.19,-8.18],1,m=>{
   m.box(-.96,1.11,-8.50,.13,.13,.59,blue);
   m.box(-1.03,1.13,-8.10,.22,.16,.13,yellow);
  });
  add("tailRotor",[-.77,1.19,-8.18],1,m=>{
   // Distinct, opaque two-blade anti-torque rotor on the left of the boom.
   // Paint both faces: WebGL2 and the mobile 2D fallback share this mesh.
   const x=-.77,z=-8.18,y=1.19,r=.735;
   const front=rgb(229,238,230),back=rgb(91,111,126);
   for(const sign of [-1,1]){
    const inner=sign*.12,outer=sign*r;
    const A=[x-.035,y+inner,z-.14],B=[x-.035,y+outer,z-.095],
     C=[x-.035,y+outer,z+.10],D=[x-.035,y+inner,z+.16];
    m.quad(A,B,C,D,front);
    m.quad([x+.035,A[1],A[2]],[x+.035,D[1],D[2]],
     [x+.035,C[1],C[2]],[x+.035,B[1],B[2]],back);
    const paintY=sign>0?y+.54:y-.70;
    m.box(x-.075,paintY,z-.13,.15,.15,.25,yellow);
   }
   // This circular-looking hub stays at the same shaft as the tail rotor.
   m.box(x-.12,y-.14,z-.16,.24,.28,.32,blue);
   m.box(x-.145,y-.065,z-.08,.05,.13,.16,yellow);
  });
 }
 return result.map(part=>scalePart(part,mode==="helicopter"?"r44":"c172"));
}
// Dedicated components for the *imported* R44. The earlier procedural
// helicopter's decorative swash rings, tail-pitch boxes, and generic boom
// fittings must never be mounted on the licensed FlightGear hull.
function buildCleanR44Rotors(){
 const steel=rgb(125,142,153),bright=rgb(221,230,233),
  dark=rgb(59,74,84),tip=rgb(236,208,110);
 const parts=[];
 function add(name,pivot,axis,draw){
  const m=new Mesh();draw(m);
  parts.push({name,pivot:[...pivot],axis,mesh:m.finish()});
 }
 const hub=REAL_R44_HARDWARE_ANCHORS.main.actual;
 add("mainRotor",hub,2,m=>{
  const [cx,cy,cz]=hub;
  for(const sign of [-1,1]){
   const x0=cx+sign*.23,x1=cx+sign*4.67,x2=cx+sign*5.03;
   const rootFront=[x0,cy,cz-.205],rootRear=[x0,cy,cz+.205];
   const tipFront=[x1,cy+.10,cz-.175],tipRear=[x1,cy+.10,cz+.175];
   const endFront=[x2,cy+.115,cz-.11],endRear=[x2,cy+.115,cz+.11];
   // R44's single teetering two-blade rotor, with no old extra hub boxes.
   m.quad(rootFront,tipFront,tipRear,rootRear,bright);
   m.quad(rootRear,tipRear,tipFront,rootFront,dark);
   m.quad(tipFront,endFront,endRear,tipRear,tip);
   m.quad(tipRear,endRear,endFront,tipFront,steel);
   m.box(Math.min(x0,cx+sign*.68),cy-.045,cz-.18,
    Math.abs(sign*.68-sign*.23),.10,.36,steel);
  }
  m.box(cx-.23,cy-.085,cz-.24,.46,.17,.48,steel);
  // Mast and top fairing are centred at the actual imported roof attachment.
  m.box(cx-.095,cy-.23,cz-.095,.19,.17,.19,dark);
 });
 const tail=REAL_R44_HARDWARE_ANCHORS.tail.actual;
 add("tailRotor",tail,1,m=>{
  const [cx,cy,cz]=tail;
  for(const sign of [-1,1]){
   const y0=cy+sign*.10,y1=cy+sign*.735;
   const a=[cx-.013,y0,cz-.065],b=[cx-.013,y1,cz-.052],
    c=[cx-.013,y1,cz+.065],d=[cx-.013,y0,cz+.075];
   m.quad(a,b,c,d,bright);
   m.quad([cx+.013,d[1],d[2]],[cx+.013,c[1],c[2]],
    [cx+.013,b[1],b[2]],[cx+.013,a[1],a[2]],dark);
   m.box(cx-.025,sign>0?cy+.65:cy-.70,cz-.055,.05,.055,.11,tip);
  }
  m.box(cx-.075,cy-.105,cz-.08,.15,.21,.16,steel);
 });
 return parts;
}
// Aircraft-space Z has +Z toward the nose. These source-aligned cabin
// stations replace earlier guesses which placed students in the tail cone.
// The C172 imported mesh's broad windshield/wing-root body runs roughly
// Z .2..2.4; R44 passenger windows span Z 2.4..4.5.
const IMPORTED_CABIN_LAYOUT=Object.freeze({
 r44:Object.freeze({frontSeatZ:3.59,rearSeatZ:2.92,panelZ:4.12,
  glazingStartZ:2.40,glazingEndZ:4.54}),
 c172:Object.freeze({frontSeatZ:1.46,rearSeatZ:.35,panelZ:2.31,
  glazingStartZ:.18,glazingEndZ:2.45})
});
// Lightweight physical interior in the same local metres as each imported
// airframe. Four distinct seats, restraints, a floor, and instrument binnacle
// sit behind the existing window glass in chase and 360-degree inspection.
// This does not interfere with the separate pilot-facing training cockpit UI.
// Compact aircraft-specific fighter cockpit geometry. These cabin stations
// are aligned to the original aircraft asset canopy bounds (local metres).
// They add no exterior skin, no extra gear and no animated flight surfaces.
const FIGHTER_INTERIOR_STATIONS=Object.freeze({
 fa18:{rear:2.4,front:4.15,floor:-.12,width:.52,seats:1},
 f22:{rear:3.75,front:6.45,floor:-.22,width:.43,seats:1},
 f35:{rear:3.28,front:5.12,floor:-.25,width:.52,seats:1},
 typhoon:{rear:2.55,front:5.85,floor:.85,width:.38,seats:1},
 su37:{rear:3.62,front:6.45,floor:1.00,width:.41,seats:1}
});
function buildFighterInterior(id){
 const p=FIGHTER_INTERIOR_STATIONS[id];
 if(!p)return null;
 const m=new Mesh(),dark=rgb(32,40,47),rail=rgb(85,96,103),
  seat=rgb(65,72,77),padding=rgb(99,106,108),
  screen=rgb(20,55,66),lit=rgb(93,192,174),belt=rgb(190,177,137),
  metal=rgb(134,144,145),bezel=rgb(17,23,29),amber=rgb(216,163,81);
 const bottom=p.floor,z0=p.rear,z1=p.front,w=p.width;
 const dashZ=z1-.22,seatZ=z0+(z1-z0)*.37;
 const face=(x,y,width,height,color=screen)=>{
  // Faces point towards the occupant (-Z). Thin emissive-like graphics
  // avoid overdraw/bleed through tinted imported glass.
  m.box(x,y,dashZ-.041,width,height,.012,bezel);
  m.box(x+.014,y+.014,dashZ-.056,width-.028,height-.028,.006,color);
 };
 const stroke=(x,y,width,height,color=lit,z=dashZ-.064)=>
  m.box(x,y,z,width,height,.004,color);
 const dial=(cx,cy,r)=>{
  const z=dashZ-.069;
  for(let k=0;k<20;k++){
   const a=k*Math.PI/10,b=(k+1)*Math.PI/10;
   const at=(radius,t)=>[cx+radius*Math.cos(t),cy+radius*Math.sin(t),z];
   m.quad(at(r,a),at(r,b),at(r-.008,b),at(r-.008,a),metal);
   m.tri([cx,cy,z-.004],at(r-.009,a),at(r-.009,b),bezel);
  }
  stroke(cx-.005,cy,.010,r*.65,amber,z-.011);
 };
 const symbology=(x,y,width,height)=>{
  const z=dashZ-.065;
  stroke(x+.04,y+height*.52,width-.08,.008,lit,z);
  stroke(x+width*.50-.004,y+.03,.008,height-.06,lit,z);
  for(let k=0;k<3;k++)stroke(x+.028,y+.045+k*.033,.035,.007,amber,z);
 };
 // Floor and low coaming are within the canopy, not part of the fuselage.
 m.box(-w,bottom,z0,2*w,.055,z1-z0,dark);
 for(const side of [-1,1]){
  const x=side<0?-w:w-.14;
  m.box(x,bottom+.12,z0+.18,.14,.24,z1-z0-.46,rail);
  for(let n=0;n<5;n++){
   const z=z0+.36+n*(z1-z0-.75)/5;
   m.box(x+.030,bottom+.368,z,.075,.012,.085,lit);
  }
 }
 // One contoured pilot seat, headrest, guide rails and four-point harness.
 m.box(-.25,bottom+.16,seatZ-.20,.50,.15,.55,padding);
 m.box(-.25,bottom+.30,seatZ-.37,.50,.73,.17,seat);
 m.box(-.20,bottom+1.02,seatZ-.36,.40,.23,.16,padding);
 for(const side of [-1,1]){
  const x=side*.215-.02;
  m.box(x,bottom+.28,seatZ-.40,.04,.91,.09,rail);
  m.box(side*.11-.024,bottom+.35,seatZ-.22,.048,.53,.04,belt);
  m.box(side*.17-.025,bottom+.30,seatZ+.01,.05,.14,.16,rail);
 }
 m.box(-.07,bottom+.36,seatZ-.19,.14,.085,.05,metal);
 // Central control column except F-35 side-stick to pilot's right.
 const stickX=id==="f35"?w-.17:0;
 const stickZ=seatZ+.67;
 m.box(stickX-.028,bottom+.16,stickZ,.056,.51,.056,rail);
 m.box(stickX-.065,bottom+.63,stickZ-.038,.13,.18,.12,bezel);
 // HOTAS throttle to pilot's left, pair of physically separate rudder pedals.
 m.box(-w+.035,bottom+.38,seatZ+.35,.10,.12,.21,bezel);
 m.box(-w+.070,bottom+.49,seatZ+.47,.045,.15,.08,rail);
 for(const side of [-1,1]){
  const x=side*.22-.085;
  m.box(x,bottom+.08,z1-.40,.17,.07,.17,rail);
  m.box(x+.035,bottom+.13,z1-.40,.10,.12,.08,padding);
 }
 // Forward glare shield and primary instrument bay.
 m.box(-w*.89,bottom+.45,dashZ,w*1.78,.64,.12,dark);
 m.box(-w*.91,bottom+1.075,dashZ-.04,w*1.82,.07,.21,rail);
 if(id==="f35"){
  // F-35B: wide panoramic touchscreen; no fake analogue six-pack.
  const width=w*1.48;
  face(-width/2,bottom+.62,width,.42);
  symbology(-width/2,bottom+.62,width*.5,.42);
  for(let n=0;n<4;n++)stroke(-width/2+.025+n*width*.24,bottom+.65,.008,.30,lit);
 }else if(id==="f22"){
  // F-22: central primary display, flanking tactical MFDs.
  face(-.18,bottom+.60,.36,.44);symbology(-.18,bottom+.60,.36,.44);
  face(-.36,bottom+.59,.16,.31);face(.20,bottom+.59,.16,.31);
  for(const x of [-.36,.20])stroke(x+.030,bottom+.66,.09,.011,lit);
 }else if(id==="typhoon"){
  // Typhoon's three multi-function colour displays.
  for(const x of [-.315,-.105,.105]){
   face(x,bottom+.62,.21,.34);symbology(x,bottom+.62,.21,.34);
  }
 }else if(id==="su37"){
  // Su-37: mix of glass avionics and smaller analogue round gauges.
  face(-.18,bottom+.62,.36,.35);symbology(-.18,bottom+.62,.36,.35);
  for(const x of [-.29,.29])for(const y of [bottom+.53,bottom+.74])
   dial(x,y,.055);
 }else{
  // F/A-18: two large MFDs with compact central standby instruments.
  for(const x of [-.35,.11]){
   face(x,bottom+.61,.24,.34);symbology(x,bottom+.61,.24,.34);
  }
  for(const y of [bottom+.68,bottom+.82])dial(0,y,.045);
 }
 // HUD combiner glass represented by a narrow transparent outline rather
 // than a solid opaque box which would conceal forward scenery.
 const hudY=bottom+1.15,hudZ=dashZ+.035;
 for(const x of [-.15,.145])m.box(x,hudY,hudZ,.005,.19,.007,lit);
 m.box(-.15,hudY+.18,hudZ,.30,.006,.007,lit);
 stroke(-.05,hudY+.10,.10,.006,lit,hudZ-.011);
 const mesh=m.finish();
 // Reconcile instructional cockpit proportions with the real source canopy:
 // imported fighters have <1m of canopy height, not a 1.3m open cabin.
 // Scale only the added interior's Y dimension, keeping hull/gear untouched.
 for(let i=1;i<mesh.positions.length;i+=3)
  mesh.positions[i]=bottom+(mesh.positions[i]-bottom)*.46;
 return {...mesh,seats:p.seats,hasPanel:true,kind:"fighter-interior"};
}
function buildImportedCabin(id){
 if(FIGHTER_INTERIOR_STATIONS[id])return buildFighterInterior(id);
 if(id!=="r44"&&id!=="c172")return null;
 const m=new Mesh(),leather=rgb(174,163,143),cushion=rgb(210,201,182),
  highlight=rgb(226,216,195),panel=rgb(35,48,57),
  screen=rgb(56,103,118),trim=rgb(180,191,189),floor=rgb(64,71,75);
 let seats=0;
 const r44=id==="r44";
 if(r44){
  const station=IMPORTED_CABIN_LAYOUT.r44;
  m.box(-.54,-1.04,2.44,1.08,.065,1.71,floor);
  for(const z of [station.frontSeatZ,station.rearSeatZ])for(const x of [-.30,.30]){
   seats++;
   m.box(x-.215,-.71,z-.23,.43,.15,.49,cushion);
   m.box(x-.215,-.59,z-.30,.43,.61,.14,leather);
   m.box(x-.16,.015,z-.34,.32,.17,.16,cushion);
   m.box(x-.17,-.57,z-.14,.045,.50,.055,highlight);
   m.box(x+.125,-.57,z-.14,.045,.50,.055,highlight);
   m.box(x-.17,-.94,z-.045,.055,.24,.065,trim);
   m.box(x+.12,-.94,z-.045,.055,.24,.065,trim);
  }
  // An R44 has a compact forward *central* six-pack and a tapered avionics
  // pedestal, not a full-width C172 dashboard above two isolated joysticks.
  // The imported FlightGear hull remains the only external fuselage.
  const podZ=station.panelZ-.12;
  m.box(-.285,-.43,podZ,.57,.50,.12,panel);
  m.box(-.30,.045,podZ-.025,.60,.045,.145,panel);
  // Distinct circular round instruments on the pilot-facing (-Z) panel.
  // Each dial has a visible lighter bezel, dark face and central hub.
  const dial=(x,y,r)=>{
   const z=podZ-.012,face=rgb(13,25,31),
    bezel=rgb(148,160,166);
   for(let k=0;k<16;k++){
    const a=k*Math.PI/8,b=(k+1)*Math.PI/8;
    const edge=angle=>[x+r*Math.cos(angle),y+r*Math.sin(angle),z];
    const inner=angle=>[x+(r-.010)*Math.cos(angle),
     y+(r-.010)*Math.sin(angle),z-.002];
    m.quad(edge(a),edge(b),inner(b),inner(a),bezel);
    m.tri([x,y,z-.003],inner(a),inner(b),face);
   }
   m.box(x-.009,y-.009,z-.012,.018,.018,.010,trim);
  };
  for(const x of [-.185,0,.185])for(const y of [-.09,-.275])dial(x,y,.058);
  // Status annunciator row and vertically stacked radio/switch pedestal.
  for(let k=0;k<7;k++)
   m.box(-.24+k*.074,.021,podZ-.017,.040,.022,.010,
    k===4?rgb(200,80,65):rgb(157,167,125));
  m.box(-.19,-.96,podZ-.28,.38,.53,.25,panel);
  for(const y of [-.47,-.66,-.84]){
   m.box(-.158,y,podZ-.299,.316,.12,.020,screen);
   for(const x of [-.12,.12])
    m.box(x-.018,y+.035,podZ-.317,.036,.045,.015,trim);
  }
  // Robinson's distinctive centre-post/T-bar cyclic, shared by both
  // front grips. The lower stem sits between the seats, not in the panel.
  const cyclicZ=station.frontSeatZ+.10;
  m.box(-.039,-.94,cyclicZ,.078,.64,.075,trim);
  m.box(-.37,-.335,cyclicZ-.002,.74,.075,.079,trim);
  for(const x of [-.34,.29]){
   m.box(x,-.34,cyclicZ-.006,.066,.265,.083,panel);
   m.box(x-.012,-.09,cyclicZ-.014,.09,.045,.100,screen);
  }
  // Forward anti-torque foot pedals remain ahead of the two front seats.
  for(const x of [-.28,.28]){
   m.box(x-.024,-.92,station.panelZ-.31,.048,.17,.25,trim);
   m.box(x-.105,-.76,station.panelZ-.26,.210,.065,.11,panel);
  }
 }else{
  const station=IMPORTED_CABIN_LAYOUT.c172;
  m.box(-.51,-.85,-.17,1.02,.07,2.67,floor);
  for(const z of [station.frontSeatZ,station.rearSeatZ])for(const x of [-.30,.30]){
   seats++;
   m.box(x-.225,-.68,z-.30,.45,.17,.58,cushion);
   m.box(x-.225,-.52,z-.39,.45,.60,.15,leather);
   m.box(x-.17,.055,z-.40,.34,.17,.16,cushion);
   m.box(x-.20,-.49,z-.20,.04,.42,.055,highlight);
   m.box(x+.16,-.49,z-.20,.04,.42,.055,highlight);
   m.box(x-.17,-.82,z+.05,.065,.14,.075,trim);
   m.box(x+.11,-.82,z+.05,.065,.14,.075,trim);
  }
  // The original C172 imported cabin had two floating blue rectangles
  // where a traditional aircraft instrument panel should be. Replace them
  // with six actual circular inset analogue faces and a narrow right-hand
  // NAV/COM stack, on the rear-facing surface of the 3D dash.
  m.box(-.56,-.35,station.panelZ,1.12,.47,.19,panel);
  const pilotFaceZ=station.panelZ-.018;
  const dial=(cx,cy,r)=>{
   const inner=rgb(13,23,31),ring=rgb(166,180,184);
   const point=(radius,a,z)=>[cx+radius*Math.cos(a),cy+radius*Math.sin(a),z];
   for(let k=0;k<24;k++){
    const a=k*Math.PI/12,b=(k+1)*Math.PI/12;
    m.quad(point(r,a,pilotFaceZ),point(r,b,pilotFaceZ),
     point(r-.010,b,pilotFaceZ-.003),point(r-.010,a,pilotFaceZ-.003),ring);
    m.tri([cx,cy,pilotFaceZ-.004],
     point(r-.012,a,pilotFaceZ-.004),point(r-.012,b,pilotFaceZ-.004),inner);
   }
   m.box(cx-.008,cy-.008,pilotFaceZ-.014,.016,.016,.010,trim);
  };
  for(const y of [-.015,-.224])for(const x of [-.365,-.160,.045])dial(x,y,.082);
  m.box(.18,-.29,pilotFaceZ-.020,.32,.365,.018,panel);
  for(const y of [-.23,-.11,.01]){
   m.box(.206,y,pilotFaceZ-.047,.27,.085,.012,screen);
   m.box(.217,y+.031,pilotFaceZ-.051,.06,.008,.005,trim);
   m.box(.39,y+.031,pilotFaceZ-.051,.065,.008,.005,trim);
  }
  // Preserve the yokes and pedals in the correct forward cockpit section.
  for(const x of [-.32,.32]){
   m.box(x-.025,-.62,station.panelZ-.23,.05,.40,.07,trim);
   m.box(x-.20,-.29,station.panelZ-.24,.40,.055,.075,panel);
  }
 }
 return {...m.finish(),seats,hasPanel:true};
}
// The licensed C172 GLB has a very sparse, dark cabin shell. Its two mesh
// primitives already provide the wing, tail, undercarriage and propeller, but
// leave the four upholstered seats visibly floating in the 360-degree view.
// Restore a properly shaped, *single* tapered outer fuselage and a distinct
// window-only glass mesh. No extra wings, flaps, rudder or propeller are added.
function buildImportedC172Shell(){
 const skin=new Mesh(),glass=new Mesh(),ivory=rgb(228,238,244),
  underside=rgb(196,207,214),navy=rgb(33,84,118),
  glassBlue=rgb(91,144,162);
 // Local metres of source GLB (+Z nose). The cabin is widest below the wing;
 // the cowling narrows toward the imported propeller and the aft boom tapers.
 const sections=[
  [-3.65,.16,-.27,-.12,.05,false],
  [-2.40,.29,-.46,-.08,.21,false],
  [-1.45,.32,-.57,-.09,.27,false],
  [ -.70,.46,-.72,-.09,.44,false],
  [ -.32,.52,-.78,-.10,.62,false],
  [ .18,.60,-.83,-.10,.73,true],
  [ .86,.63,-.83,-.10,.75,true],
  [1.82,.60,-.81,-.12,.69,true],
  [2.11,.55,-.76,-.13,.53,false],
  [2.43,.46,-.66,-.17,.30,false],
  [3.55,.32,-.48,-.15,.11,false],
  [3.78,.23,-.34,-.15,.07,false]
 ];
 const point=(sign,s,y)=>[sign*s[1],y,s[0]];
 for(let k=0;k+1<sections.length;k++){
  const a=sections[k],b=sections[k+1];
  // A soft lower keel instead of a rectangular open black cabin floor.
  skin.quad(point(-1,a,a[2]),point(-1,b,b[2]),
   [0,b[2]-.09,b[0]],[0,a[2]-.09,a[0]],underside);
  skin.quad([0,a[2]-.09,a[0]],[0,b[2]-.09,b[0]],
   point(1,b,b[2]),point(1,a,a[2]),underside);
  skin.quad(point(-1,a,a[4]),point(-1,b,b[4]),
   point(1,b,b[4]),point(1,a,a[4]),ivory);
  for(const sign of [-1,1]){
   const side=(y0,y1,color,mesh=skin)=>{
    mesh.quad(point(sign,a,y0[0]),point(sign,b,y0[1]),
     point(sign,b,y1[1]),point(sign,a,y1[0]),color);
   };
   side([a[2],b[2]],[a[3],b[3]],ivory);
   // Painted navy mid-body accent makes white fuselage distinct from gray
   // imported wings, and traces the taper without unrelated old surfaces.
   side([a[3]-.15,b[3]-.15],[a[3]-.09,b[3]-.09],navy);
   if(a[5]&&b[5]){
    side([a[3]+.015,b[3]+.015],[a[4]-.09,b[4]-.09],
     glassBlue,glass);
   }else{
    side([a[3],b[3]],[a[4],b[4]],ivory);
   }
  }
 }
 // White window posts visually separate forward/rear side panels.
 for(const [z,w,y0,y1] of [[.18,.60,-.10,.73],[.86,.63,-.10,.75],
                             [1.82,.60,-.12,.69]]){
  for(const sign of [-1,1])
   skin.box(sign>0?w-.025:-w-.025,y0,z-.035,.05,y1-y0,.07,ivory);
 }
 // Sloped front windshield, glass retained as a separate transparent layer.
 glass.quad([-.55,-.13,2.11],[.55,-.13,2.11],
  [.43,.46,2.43],[-.43,.46,2.43],glassBlue);
 skin.box(-.035,-.12,2.11,.07,.60,.34,ivory);
 return {skin:skin.finish(),glass:glass.finish(),windowPanels:5};
}
// The licensed C172 GLB already contains wings, flaps, elevator, rudder,
// tyres and cabin. Drawing the old illustrated surfaces over it creates
// detached, double flaps/elevators in exterior and 360-degree cameras.
// Retain only the animated propeller overlay; the full illustrated parts set
// is still necessary for the fallback aircraft and its 2D companion.
function exteriorAnimatedParts(id,imported,model){
 if(id==="r44"&&imported)return model.authenticParts||[];
 if(id==="c172"&&imported)return []; // Imported GLB already has its own propeller.
 return model.parts||[];
}
function cameraPose(state,view="cockpit",orbit={},options={}){
 if(!state||!["airplane","helicopter"].includes(state.mode))throw Error("Synthetic aircraft state required");
 if(!["cockpit","chase","side","top","inspect"].includes(view))throw Error("Unknown 3D camera mode");
 const yaw=(state.headingDeg||0)*RAD;
 const altitude=Number.isFinite(state.altitudeM)?Math.max(0,state.altitudeM):0;
 const craft=[state.xM,altitude+(state.mode==="airplane"?1.5:2),state.zM];
 if(view==="inspect"){
  const interior=orbit.interior===true;
  const azimuth=limit(orbit.azimuth??0,-720,720)*RAD;
  const elevation=limit(orbit.elevation??28,-70,78)*RAD;
  const distance=limit(orbit.distance??18,interior?1.45:6.8,interior?12:70);
  const direction=yaw+Math.PI+azimuth;
  const horizontal=distance*Math.cos(elevation);
  // Local cockpit stations are not world camera targets: transform their
  // offsets with the aircraft heading, but do not translate the model itself.
  const station=interior?{
   c172:[0,-.2,1.35],r44:[0,-.2,3.45],
   fa18:[0,.30,3.25],f22:[0,.18,5.10],f35:[0,.18,4.20],
   typhoon:[0,1.23,4.15],su37:[0,1.32,4.90]
  }[options.airframeId]||[0,0,0]:[0,0,0];
  const target=[craft[0]+station[0]*Math.cos(yaw)+station[2]*Math.sin(yaw),
   craft[1]+station[1],
   craft[2]-station[0]*Math.sin(yaw)+station[2]*Math.cos(yaw)];
  return {view,eye:[target[0]+Math.sin(direction)*horizontal,
   target[1]+Math.sin(elevation)*distance,
   target[2]+Math.cos(direction)*horizontal],
   yaw:direction+Math.PI,pitch:-elevation,roll:0,craft};
 }
 if(view==="cockpit"&&options.sourceCockpit===true&&state.mode==="airplane"){
  // Position in the existing imported Skyhawk cabin, not above its roof:
  // left-front seat at z≈1.46m, central nose-facing instrument panel at
  // z≈2.31m. Rotate the eye with the same roll→pitch→yaw as the airframe.
  // Never use the external airframe chase coordinates as an eye station.
  const station=IMPORTED_CABIN_LAYOUT.c172;
  const x=-.29,y=.28,z=station.frontSeatZ-.02;
  const bank=(state.rollDeg||0)*RAD,pitch=(state.pitchDeg||0)*RAD;
  const cr=Math.cos(bank),sr=Math.sin(bank);
  const rx=x*cr+y*sr,ry=-x*sr+y*cr;
  const cp=Math.cos(pitch),sp=Math.sin(pitch);
  const py=ry*cp+z*sp,pz=-ry*sp+z*cp;
  return {view,eye:[
   craft[0]+rx*Math.cos(yaw)+pz*Math.sin(yaw),
   craft[1]+py,
   craft[2]-rx*Math.sin(yaw)+pz*Math.cos(yaw)
  ],yaw,pitch:pitch-.12,roll:bank,craft,sourceCockpit:true};
 }
 if(view==="cockpit")return {view,eye:[state.xM,altitude+2.2,state.zM],
  yaw,pitch:(state.pitchDeg||0)*RAD,roll:(state.rollDeg||0)*RAD,craft};
 // A little more air around fast-moving aircraft makes turns, the runway
 // and landing gear visible. Rotorcraft are framed closer for pad work.
 // The existing camera rig then smooths these targets across frames.
 const helicopter=state.mode==="helicopter";
 const groundSpeed=limit(state.groundSpeedKt,0,500);
 const movement=limit(groundSpeed/(helicopter?100:210),0,1);
 if(view==="side"){
  const distance=(helicopter?21:24)+movement*(helicopter?5:8);
  const rise=(helicopter?7.5:8.5)+movement*3;
  return {view,
   eye:[state.xM-distance*Math.cos(yaw),Math.max(4,craft[1]+rise),
    state.zM+distance*Math.sin(yaw)],
   yaw:yaw+Math.PI/2,pitch:-Math.atan2(rise,distance),roll:0,craft};
 }
 if(view==="top"){
  const rise=(helicopter?32:36)+movement*(helicopter?8:12);
  return {view,eye:[state.xM,Math.max(7,craft[1]+rise),state.zM-4],
   yaw,pitch:-1.46,roll:0,craft};
 }
 const distance=(helicopter?21:24)+movement*(helicopter?5:10);
 const rise=(helicopter?8:9.5)+movement*(helicopter?3:5);
 return {view,eye:[state.xM-distance*Math.sin(yaw),
    Math.max(4,craft[1]+rise),state.zM-distance*Math.cos(yaw)],
  yaw,pitch:-Math.atan2(rise,distance),
  roll:(state.rollDeg||0)*RAD*.13,craft};
}
// Frame genuinely imported compact aircraft closer, rather than leaving
// them a tiny speck at the distance chosen for the old oversized dummy mesh.
// The viewpoint angles and flight state remain exactly unchanged.
function importedCameraFraming(camera,view,scale=1){
 if(!camera||!["chase","side","top"].includes(view))return camera;
 const factor=limit(scale,.55,1);
 return {...camera,eye:camera.eye.map((v,i)=>
  camera.craft[i]+(v-camera.craft[i])*factor)};
}
const VERTEX=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aColor;
layout(location=2) in vec3 aNormal;
layout(location=3) in vec2 aTexCoord;
uniform vec3 uEye;
uniform vec3 uCraft;
uniform float uYaw,uPitch,uRoll,uCraftYaw,uCraftPitch,uCraftRoll;
uniform float uActor,uAspect,uFocal,uCameraNear;
uniform vec3 uPartPivot;
uniform float uPartAngle;
uniform int uPartAxis;
out vec3 vColor;
out vec3 vLocalPosition;
out vec2 vTexCoord;
out float vDistance,vLight,vEmissive;
// Surface illumination must follow the surface, including animated hinges,
// rather than remaining fixed when the aircraft rolls, pitches or turns.
vec3 rotatePart(vec3 v,int axis,float angle){
 float ca=cos(angle),sa=sin(angle);
 if(axis==1)return vec3(v.x,v.y*ca-v.z*sa,v.y*sa+v.z*ca);
 if(axis==2)return vec3(v.x*ca+v.z*sa,v.y,-v.x*sa+v.z*ca);
 if(axis==3)return vec3(v.x*ca-v.y*sa,v.x*sa+v.y*ca,v.z);
 return v;
}
void main(){
 vec3 p=aPosition;
 vec3 normal=aNormal;
 if(uActor>5.5){
  // One translated cloud mesh drifts at simulated wind speed while retaining
  // WORLD coordinates. It does not rotate with the airplane or the camera.
  p+=uPartPivot;
 }else if(uActor>4.5){
  // Ground vehicle geometry is local to its moving world position.
  p=rotatePart(p,2,uPartAngle)+uPartPivot;
  normal=rotatePart(normal,2,uPartAngle);
 }else if(uActor>3.5){
  // Windsocks rotate around their fixed runway pole, never with the
  // aircraft. The same downwind angle is used by the Canvas fallback.
  p=rotatePart(p-uPartPivot,2,uPartAngle)+uPartPivot;
  normal=rotatePart(normal,2,uPartAngle);
 }else if(uActor>2.5){
  // Artistic light cards stay in world coordinates rather than following
  // the moving aircraft. They are shaded as emissive in the fragment shader.
  normal=vec3(0.,1.,0.);
 }else if(uActor>1.5){
  // The soft ground footprint uses the same aircraft orientation but stays
  // just above the runway/helipad surface rather than rising with the craft.
  float c=cos(uCraftYaw),s=sin(uCraftYaw);
  p=vec3(p.x*c+p.z*s+uCraft.x,.24,-p.x*s+p.z*c+uCraft.z);
  normal=vec3(0.,1.,0.);
 }else if(uActor>.5){
  // Rotate illustrated flap/aileron/elevator surfaces around their hinges,
  // or propeller/rotor parts around their hub. Static body/world have axis 0.
  if(uPartAxis==4){
   // Imported fighter wheels stay full-size throughout the gear cycle.
   // The nose wheel swings aft about X; each main wheel rotates inward
   // about its longitudinal Z hinge, rather than shrinking to a point.
   // These source-specific pivots keep F-35B links below the dorsal skin.
   float fraction=clamp(uPartAngle/1.53,0.,1.);
   float fold=fraction*fraction*(3.-2.*fraction)*1.53;
   bool mainGear=abs(uPartPivot.x)>.4;
   int hingeAxis=mainGear?3:1;
   float hingeAngle=mainGear?-sign(uPartPivot.x)*fold:fold;
   p=uPartPivot+rotatePart(p-uPartPivot,hingeAxis,hingeAngle);
   normal=rotatePart(normal,hingeAxis,hingeAngle);
  }else if(uPartAxis>0){
   p=rotatePart(p-uPartPivot,uPartAxis,uPartAngle)+uPartPivot;
   normal=rotatePart(normal,uPartAxis,uPartAngle);
  }
  float c=cos(uCraftRoll),s=sin(uCraftRoll);
  p=vec3(p.x*c+p.y*s,-p.x*s+p.y*c,p.z);
  normal=vec3(normal.x*c+normal.y*s,-normal.x*s+normal.y*c,normal.z);
  c=cos(uCraftPitch);s=sin(uCraftPitch);
  p=vec3(p.x,p.y*c+p.z*s,-p.y*s+p.z*c);
  normal=vec3(normal.x,normal.y*c+normal.z*s,-normal.y*s+normal.z*c);
  c=cos(uCraftYaw);s=sin(uCraftYaw);
  p=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c)+uCraft;
  normal=vec3(normal.x*c+normal.z*s,normal.y,-normal.x*s+normal.z*c);
 }
 vec3 r=p-uEye;
 float cy=cos(uYaw),sy=sin(uYaw),cp=cos(uPitch),sp=sin(uPitch);
 float side=r.x*cy-r.z*sy;
 float forward=r.x*sy+r.z*cy;
 float up=r.y*cp-forward*sp;
 float depth=r.y*sp+forward*cp;
 float cr=cos(uRoll),sr=sin(uRoll);
 float xx=side*cr-up*sr;
 float yy=side*sr+up*cr;
 gl_Position=vec4(xx*uFocal/uAspect,yy*uFocal,
   1.000080003*depth-2.000080003*uCameraNear,depth);
 vColor=aColor;vLocalPosition=aPosition;
 vTexCoord=aTexCoord;vDistance=depth;
 vLight=.55+.45*max(0.,dot(normalize(normal),normalize(vec3(.28,1.,.36))));
 vEmissive=(uActor>2.5&&uActor<3.5)?1.:0.;
}`;
const FRAGMENT=`#version 300 es
precision mediump float;
in vec3 vColor,vLocalPosition;
in vec2 vTexCoord;
in float vDistance,vLight,vEmissive;
uniform vec3 uFogColor,uLightColor;
uniform float uOpacity,uHasTexture,uAlphaCutoff;
uniform int uC172Pass,uR44Skin;
uniform sampler2D uTexture;
out vec4 outColor;
void main(){
 float fog=clamp((vDistance-1150.)/5000.,0.,.8);
 vec4 texel=uHasTexture>.5?texture(uTexture,vTexCoord):vec4(1.);
 if(uHasTexture>.5 && texel.a<uAlphaCutoff)discard;
 vec3 albedo=vColor*texel.rgb;
 float alpha=uOpacity*texel.a;
 if(uR44Skin==1){
  // Source-identified R44 painted skin, including the entire tailboom and
  // fin. Do not reintroduce checkerboard/old black patches from the source
  // texture, or recolour unpainted skids, lamps and exhaust components.
  albedo=vec3(.93,.79,.08);
 }
 if(uR44Skin==1){
  // Source opaque fuselage may cover the separate translucent window
  // polygons. Cut only *inside* the source windows, preserving the R44
  // original frames and cabin roof. Those windows are painted afterward.
  vec3 p=vLocalPosition;
  float side=(smoothstep(.35,.43,abs(p.x))*
   (1.-smoothstep(.70,.76,abs(p.x))))*
   smoothstep(-.62,-.53,p.y)*(1.-smoothstep(-.03,.08,p.y));
  float front=side*smoothstep(2.98,3.06,p.z)*
   (1.-smoothstep(3.60,3.73,p.z));
  float rear=side*smoothstep(2.40,2.48,p.z)*
   (1.-smoothstep(2.90,3.02,p.z));
  float wind=(1.-smoothstep(.57,.67,abs(p.x)))*
   smoothstep(3.83,4.05,p.z)*(1.-smoothstep(4.46,4.60,p.z))*
   smoothstep(-.79,-.64,p.y)*(1.-smoothstep(.11,.21,p.y));
  if(max(max(front,rear),wind)>.5)discard;
 }
 if(uC172Pass>0){
  // Imported C172 texture has near-black fuselage regions and gray wings.
  // Preserve faint panel texture while applying a light training-aircraft
  // livery. Side trim stays on the cabin/fuselage, not across the wings.
  vec3 p=vLocalPosition;
  float fuselage=1.-smoothstep(.76,1.22,abs(p.x));
  float fuselageSpan=smoothstep(-3.5,-2.5,p.z)*
    (1.-smoothstep(2.7,3.7,p.z));
  float band=(1.-smoothstep(.045,.115,abs(p.y+.30-p.z*.022)))*
    fuselage*fuselageSpan;
  vec3 paint=mix(vec3(.91,.935,.953),vec3(.13,.32,.48),band);
  albedo=mix(paint,albedo,.07);
  // Two render passes allow the existing tinted window region to remain
  // transparent WITHOUT punching holes in the solid wing/cowling. Opaque
  // skin first, new seats and panel second, glazing last.
  float side=(smoothstep(.39,.50,abs(p.x))*
    (1.-smoothstep(.90,1.02,abs(p.x))))*
    smoothstep(-1.15,-.65,p.z)*(1.-smoothstep(1.6,2.05,p.z))*
    smoothstep(.09,.24,p.y)*(1.-smoothstep(.62,.82,p.y));
  float front=(1.-smoothstep(.65,.95,abs(p.x)))*
    smoothstep(1.35,1.70,p.z)*(1.-smoothstep(2.4,2.7,p.z))*
    smoothstep(-.08,.09,p.y)*(1.-smoothstep(.75,.95,p.y));
  float luminance=dot(texel.rgb,vec3(.2126,.7152,.0722));
  float glass=max(side,front)*(1.-smoothstep(.22,.49,luminance));
  if(uC172Pass==1 && glass>.5)discard;
  if(uC172Pass==2){
   if(glass<=.5)discard;
   albedo=vec3(.15,.28,.35);
   alpha=.27;
  }
 }
 vec3 shaded=mix(clamp(albedo*vLight*uLightColor,0.,1.),albedo,vEmissive);
 outColor=vec4(mix(shaded,uFogColor,fog),alpha);
}`;
const SKY_VERTEX=`#version 300 es
precision mediump float;
out vec2 uv;
void main(){
 vec2 p=vec2(gl_VertexID==1?3.:-1.,gl_VertexID==2?3.:-1.);
 uv=p*.5+.5;gl_Position=vec4(p,0.,1.);
}`;
const SKY_FRAGMENT=`#version 300 es
precision mediump float;
in vec2 uv;
uniform vec3 uSkyLow,uSkyHigh;
out vec4 outColor;
void main(){
 vec3 sky=mix(uSkyLow,uSkyHigh,smoothstep(.0,.96,clamp(uv.y,0.,1.)));
 outColor=vec4(sky,1.);
}`;
function compile(gl,vsSource,fsSource){
 const shader=(type,source)=>{
  const s=gl.createShader(type);
  if(!s)throw Error("WebGL shader allocation failed");
  gl.shaderSource(s,source);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||"Shader failed");
  return s;
 };
 const vs=shader(gl.VERTEX_SHADER,vsSource),fs=shader(gl.FRAGMENT_SHADER,fsSource);
 const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);
 gl.deleteShader(vs);gl.deleteShader(fs);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p)||"Shader link failed");
 return p;
}
function createRenderer(canvas,{onLost=()=>{},inspectionOnly=false}={}){
 if(!canvas||typeof canvas.getContext!=="function")return null;
 let gl;
 try{gl=canvas.getContext("webgl2",{alpha:false,depth:true,antialias:true,
  powerPreference:"low-power",preserveDrawingBuffer:true,failIfMajorPerformanceCaveat:false});}
 catch{return null}
 if(!gl)return null;
 let lost=false,disposed=false,program,skyProgram;
 const buffers=[],objects=[],textures=[];
 let realC172=null,realC172Status="loading";
 let realR44=null,realR44Status="loading";
 let realF22=null,realF22Status="idle";
 let realF35=null,realF35Status="idle";
 let realSu37=null,realSu37Status="idle";
 let realTyphoon=null,realTyphoonStatus="idle";
 const cameraRig=root?.AGSACameraRig?.create?.({responseMs:180,teleportMetres:175})||null;
 const contextLost=e=>{e.preventDefault();lost=true;onLost()};
 canvas.addEventListener?.("webglcontextlost",contextLost,false);
 try{
  program=compile(gl,VERTEX,FRAGMENT);
  skyProgram=compile(gl,SKY_VERTEX,SKY_FRAGMENT);
  const uni={};
  const skyUniforms={
   low:gl.getUniformLocation(skyProgram,"uSkyLow"),
   high:gl.getUniformLocation(skyProgram,"uSkyHigh")
  };
  for(const name of ["uEye","uCraft","uYaw","uPitch","uRoll","uCraftYaw","uCraftPitch",
   "uCraftRoll","uActor","uAspect","uFocal","uCameraNear",
   "uPartPivot","uPartAngle","uPartAxis","uFogColor","uLightColor","uOpacity",
    "uHasTexture","uAlphaCutoff","uTexture","uC172Pass","uR44Skin"])
   uni[name]=gl.getUniformLocation(program,name);
  const upload=mesh=>{
   const vao=gl.createVertexArray();gl.bindVertexArray(vao);
   [mesh.positions,mesh.colors,mesh.normals].forEach((array,i)=>{
    const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);
    gl.bufferData(gl.ARRAY_BUFFER,array,gl.STATIC_DRAW);
    gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,0,0);
   });gl.bindVertexArray(null);
   const object={vao,count:mesh.vertices};objects.push(object);return object;
  };
  // Upload the genuinely imported Cessna's indexed triangles without
  // expanding their vertex count. The legacy mesh remains a safe fallback.
  const uploadImported=primitive=>{
   const vao=gl.createVertexArray();gl.bindVertexArray(vao);
   for(const [i,array,size] of [
    [0,primitive.positions,3],[1,primitive.colors,3],
    [2,primitive.normals,3],[3,primitive.uvs,2]
   ]){
    const buffer=gl.createBuffer();buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,array,gl.STATIC_DRAW);
    gl.enableVertexAttribArray(i);
    gl.vertexAttribPointer(i,size,gl.FLOAT,false,0,0);
   }
   const element=gl.createBuffer();buffers.push(element);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,element);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,primitive.indices,gl.STATIC_DRAW);
   gl.bindVertexArray(null);
   const object={vao,count:primitive.indices.length,
    indexType:primitive.indices instanceof Uint16Array?
     gl.UNSIGNED_SHORT:gl.UNSIGNED_INT,
    imageId:primitive.imageId,alphaMask:primitive.alphaMask,
    alphaCutoff:primitive.alphaCutoff,opacity:primitive.opacity??1,
    isGlazing:primitive.isGlazing===true,
    isPainted:primitive.isPainted===true,
    partName:primitive.partName||null,
    partAxis:primitive.partAxis||0,
    partPivot:primitive.partPivot||[0,0,0],
    gearDoorSide:primitive.gearDoorSide||0};
   objects.push(object);return object;
  };
  // A stalled asset request must not leave the cockpit or 360 viewer
  // behind the loading veil indefinitely. An unsuccessful import resolves
  // to the existing local procedural fallback without blocking controls.
  function boundedModelLoad(promise,timeoutMs=14000){
   let timer;
   return Promise.race([promise,new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(new Error("Aircraft model load timed out")),timeoutMs);
   })]).finally(()=>clearTimeout(timer));
  }
  async function importC172(){
   // Prefer the full Skyhawk body and source-built cabin. Preserve the
   // current light GLB when the device cannot load its textures.
   async function install(model,kind){
    if(disposed||lost)return;
    const mime=model.imageMimeTypes||model.mimeTypes||[];
    const decoded=await Promise.all(model.images.map(async(bytes,i)=>{
     const blob=new Blob([bytes],{type:mime[i]||"image/webp"});
     return root.createImageBitmap(blob);
    }));
    if(disposed||lost){decoded.forEach(bitmap=>bitmap.close?.());return;}
    const images=decoded.map(bitmap=>{
     const texture=gl.createTexture();textures.push(texture);
     gl.bindTexture(gl.TEXTURE_2D,texture);
     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
     gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);
     gl.generateMipmap(gl.TEXTURE_2D);
     bitmap.close?.();return texture;
    });
    gl.bindTexture(gl.TEXTURE_2D,null);
    realC172={primitives:model.primitives.map(uploadImported),images,
     positionLights:upload(buildExteriorPositionLights("c172",model.primitives)),
     strobeLight:upload(buildExteriorStrobe("c172",model.primitives)),
     vertices:model.vertices,triangles:model.triangles,kind,
     controls:model.controls||[],propParts:model.propParts||0};
    realC172Status="imported";
   }
   if(MolenC172){
    try{
     await install(await boundedModelLoad(MolenC172.ensureC172()),"molen");
     if(realC172)return;
    }catch(error){
     if(typeof console!=="undefined")console.warn("Skyhawk GLB fallback:",error);
    }
   }
   if(RealAirframes){
    try{
     await install(await boundedModelLoad(RealAirframes.ensureC172()),"legacy");
     if(realC172)return;
    }catch(error){
     if(typeof console!=="undefined")console.warn("C172 fallback:",error);
    }
   }
   realC172Status="fallback";
  }
  async function importR44(){
   // Prefer the integrated MIT GLB; only load the existing FlightGear AC3D
   // if the new model or its texture decoding fails. Avoid two downloads and
   // two texture sets on a memory-constrained Android phone.
   async function install(model,kind){
    if(disposed||lost)return;
    const mime=model.imageMimeTypes||model.mimeTypes||[];
    const decoded=await Promise.all(model.images.map(async(bytes,i)=>{
     const blob=new Blob([bytes],{type:mime[i]||"image/png"});
     return root.createImageBitmap(blob);
    }));
    if(disposed||lost){decoded.forEach(bitmap=>bitmap.close?.());return;}
    const images=decoded.map(bitmap=>{
     const texture=gl.createTexture();textures.push(texture);
     gl.bindTexture(gl.TEXTURE_2D,texture);
     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
     gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);
     gl.generateMipmap(gl.TEXTURE_2D);
     bitmap.close?.();return texture;
    });
    gl.bindTexture(gl.TEXTURE_2D,null);
    realR44={primitives:model.primitives.map(uploadImported),images,
     positionLights:upload(buildExteriorPositionLights("r44",model.primitives)),
     strobeLight:upload(buildExteriorStrobe("r44",model.primitives)),
     vertices:model.vertices,triangles:model.triangles,
     mainParts:model.mainParts||0,tailParts:model.tailParts||0,kind};
    realR44Status="imported";
   }
   if(MolenR44){
    try{
     await install(await boundedModelLoad(MolenR44.ensureR44()),"molen");
     if(realR44)return;
    }catch(error){
     if(typeof console!=="undefined")console.warn("MIT R44 fallback:",error);
    }
   }
   if(RealR44){
    try{
     await install(await boundedModelLoad(RealR44.ensureR44()),"flightgear");
     if(realR44)return;
    }catch(error){
     if(typeof console!=="undefined")console.warn("FlightGear R44 fallback:",error);
    }
   }
   realR44Status="fallback";
  }
  // Load the actual FGUK F-22 mesh only after the fighter is selected.
  // Never burden C172/R44 first load with a third large aircraft asset.
  function importF22(){
   if(realF22Status!=="idle")return;
   if(!F22Airframe){realF22Status="fallback";return;}
   realF22Status="loading";
   void boundedModelLoad(F22Airframe.ensureF22()).then(model=>{
    if(disposed||lost)return;
    realF22={primitives:model.primitives.map(uploadImported),images:[],
     vertices:model.vertices,triangles:model.triangles,kind:"fguk"};
    realF22Status="imported";
   }).catch(error=>{
    realF22Status="fallback";
    if(typeof console!=="undefined")console.warn("F-22 geometry fallback:",error);
   });
  }
  // F-35B geometry is 414 KB and lazy-loaded only when this aircraft is
  // selected, so it does not slow approved trainer/helicopter launch.
  function importF35(){
   if(realF35Status!=="idle")return;
   if(!F35Airframe){realF35Status="fallback";return;}
   realF35Status="loading";
   void boundedModelLoad(F35Airframe.ensureF35()).then(model=>{
    if(disposed||lost)return;
    realF35={primitives:model.primitives.map(uploadImported),images:[],
     vertices:model.vertices,triangles:model.triangles,kind:"flightgear"};
    realF35Status="imported";
   }).catch(error=>{
    realF35Status="fallback";
    if(typeof console!=="undefined")console.warn("F-35B geometry fallback:",error);
   });
  }
  // Load the GPL Typhoon's real source mesh on first use, without
  // slowing the approved C172/R44 initial flight controls or start.
  function importTyphoon(){
   if(realTyphoonStatus!=="idle")return;
   if(!TyphoonAirframe){realTyphoonStatus="fallback";return;}
   realTyphoonStatus="loading";
   void boundedModelLoad(TyphoonAirframe.ensureTyphoon()).then(model=>{
    if(disposed||lost)return;
    realTyphoon={primitives:model.primitives.map(uploadImported),images:[],
     vertices:model.vertices,triangles:model.triangles,kind:"fg-typhoon"};
    realTyphoonStatus="imported";
   }).catch(error=>{
    realTyphoonStatus="fallback";
    if(typeof console!=="undefined")console.warn("Typhoon source fallback:",error);
   });
  }
  // Only load the larger, authentic Su-37 mesh when a Su-37 exterior or
  // inspection view is selected; leave approved C172/R44 startup unchanged.
  function importSu37(){
   if(realSu37Status!=="idle")return;
   if(!Su37Airframe){realSu37Status="fallback";return;}
   realSu37Status="loading";
   void boundedModelLoad(Su37Airframe.ensureSu37()).then(model=>{
    if(disposed||lost)return;
    realSu37={primitives:model.primitives.map(uploadImported),images:[],
     vertices:model.vertices,triangles:model.triangles,kind:"fguk-su37"};
    realSu37Status="imported";
   }).catch(error=>{
    realSu37Status="fallback";
    if(typeof console!=="undefined")console.warn("Su-37 geometry fallback:",error);
   });
  }
  // This is deliberately non-blocking: controls and simulated flight start
  // immediately with the legacy model, then swap to genuine C172 geometry.
  void importC172();
  void importR44();
  const worldPlane=inspectionOnly?null:upload(buildWorld("airplane")),
   worldHeli=inspectionOnly?null:upload(buildWorld("helicopter")),
   cloudLayer=inspectionOnly?null:upload(buildCloudLayer());
  const glowPlane=inspectionOnly?null:upload(buildGroundGlow("airplane")),
   glowHeli=inspectionOnly?null:upload(buildGroundGlow("helicopter"));
  const trafficMeshes=inspectionOnly?null:{
   service:upload(buildGroundVehicle("service")),
   shuttle:upload(buildGroundVehicle("shuttle"))
  };
  const windSocks=inspectionOnly?[]:Windsocks.positions.map(anchor=>({
   anchor,
   flying:upload(buildWindsockFabric(anchor,false)),
   limp:upload(buildWindsockFabric(anchor,true))
  }));
  const airframes=Object.create(null);
  for(const id of Exterior.IDS){
   const cabin=buildImportedCabin(id);
   const shell=id==="c172"?buildImportedC172Shell():null;
   // Generate just six tiny hinged panels for each imported fighter.
   // They are omitted from both the procedural fallback and C172/R44.
   const gearPlan=(id==="f22"||id==="f35"||id==="su37")?
    Exterior.buildImportedGearDoors(Mesh,id):null;
   airframes[id]={
    importedGear:gearPlan?{
     wells:upload(gearPlan.wells),
     doors:gearPlan.doors.map(part=>({...part,gpu:upload(part.mesh)}))
    }:null,
    body:upload(buildVehicle(id)),
    parts:buildMovingParts(id).map(part=>({...part,gpu:upload(part.mesh)})),
    rotorSweep:id==="r44"?upload(buildRotorSweep(id)):null,
    tailRotorSweep:id==="r44"?upload(buildTailRotorSweep(id)):null,
    propSweep:id==="c172"?upload(buildPropellerSweep(id)):null,
    shadow:inspectionOnly?null:upload(buildShadow(id)),
    positionLights:["c172","r44"].includes(id)?
     upload(buildExteriorPositionLights(id)):null,
    strobeLight:["c172","r44"].includes(id)?
     upload(buildExteriorStrobe(id)):null,
    cabin:cabin?upload(cabin):null,
    shell:shell?upload(shell.skin):null,
    shellGlass:shell?upload(shell.glass):null,
    authenticParts:id==="r44"?buildCleanR44Rotors().map(part=>({
     ...part,gpu:upload(part.mesh)
    })):null,
    authenticRotorSweep:id==="r44"?
     upload(alignRealR44Hardware(buildRotorSweep(id))):null,
    authenticTailRotorSweep:id==="r44"?
     upload(alignRealR44Hardware(buildTailRotorSweep(id),true)):null
   };
  }
  function draw(state,{view="cockpit",animation={},lighting="day",airframeId=null,orbit={}}={}){
   const palette=root?.AGSAFlightLighting?.choose?.(lighting)||{
    skyLow:[.68,.82,.87],skyHigh:[.055,.25,.43],
    fog:[.60,.76,.82],light:[1,1,1]
   };
   if(lost||disposed||!state)return false;
   const rect=canvas.getBoundingClientRect?.()||{width:960,height:540};
   const ratio=Math.min(1.25,typeof devicePixelRatio==="number"?devicePixelRatio:1);
   const w=Math.max(1,Math.min(960,Math.round(rect.width*ratio)));
   const h=Math.max(1,Math.min(540,Math.round(rect.height*ratio)));
   if(canvas.width!==w)canvas.width=w;
   if(canvas.height!==h)canvas.height=h;
   gl.viewport(0,0,w,h);
   gl.clearColor(.45,.72,.84,1);gl.clearDepth(1);
   gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.disable(gl.DEPTH_TEST);gl.useProgram(skyProgram);
   gl.uniform3fv(skyUniforms.low,palette.skyLow);
   gl.uniform3fv(skyUniforms.high,palette.skyHigh);
   gl.drawArrays(gl.TRIANGLES,0,3);
   gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
   gl.useProgram(program);
   gl.uniform3fv(uni.uFogColor,palette.fog);
   gl.uniform3fv(uni.uLightColor,palette.light);
   gl.uniform1f(uni.uOpacity,1);
   gl.uniform1f(uni.uHasTexture,0);
   gl.uniform1f(uni.uAlphaCutoff,0);
   gl.uniform1i(uni.uTexture,0);
   gl.uniform1i(uni.uC172Pass,0);
   gl.uniform1i(uni.uR44Skin,0);
   const realHelicopter=state.mode==="helicopter"&&realR44!==null;
   const realTrainer=state.mode==="airplane"&&realC172!==null&&
    Exterior.normalize(airframeId||state.mode)==="c172";
   const sourceCockpit=view==="cockpit"&&realTrainer;
   const baseCamera=cameraPose(state,view,orbit,{sourceCockpit,airframeId});
   if(canvas.dataset)canvas.dataset.sourceCockpit=sourceCockpit?"on":"off";
   const liveScene=canvas.closest?.(".scene-shell");
   if(liveScene)liveScene.dataset.sourceC172=sourceCockpit?"on":"off";
   const targetCamera=importedCameraFraming(baseCamera,view,
    realHelicopter?.72:realTrainer?.82:1);
   const clock=root?.performance?.now?.()??Date.now();
   const reducedMotion=root?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
   const camera=reducedMotion?targetCamera:(cameraRig?.next(targetCamera,clock,(airframeId||state.mode)+"|"+state.mode+(orbit?.interior?"|interior":"|exterior"))||targetCamera);
   gl.uniform3fv(uni.uEye,camera.eye);
   // Visual touchdown suspension offsets only the rendered aircraft, not
   // the true camera target, simulated height or ground-shadow footprint.
   const touchdownBounce=view==="inspect"?0:limit(animation?.touchdownBounce,0,.24);
   gl.uniform3fv(uni.uCraft,[camera.craft[0],
    camera.craft[1]+touchdownBounce,camera.craft[2]]);
   gl.uniform1f(uni.uYaw,camera.yaw);
   gl.uniform1f(uni.uPitch,camera.pitch);
   gl.uniform1f(uni.uRoll,camera.roll);
   gl.uniform1f(uni.uCraftYaw,(state.headingDeg||0)*RAD);
   gl.uniform1f(uni.uCraftPitch,(state.pitchDeg||0)*RAD);
   gl.uniform1f(uni.uCraftRoll,(state.rollDeg||0)*RAD);
   gl.uniform1f(uni.uAspect,w/h);gl.uniform1f(uni.uFocal,1.65);
   // A pilot's instrument panel is less than a metre from the eye. The
   // exterior .40m clipping plane would cut it off entirely.
   gl.uniform1f(uni.uCameraNear,sourceCockpit?.075:view==="inspect"&&orbit.interior===true?.08:.4);
   const world=state.mode==="helicopter"?worldHeli:worldPlane;
   gl.uniform1f(uni.uActor,0);
   gl.uniform1i(uni.uPartAxis,0);gl.uniform1f(uni.uPartAngle,0);
   gl.uniform3fv(uni.uPartPivot,[0,0,0]);
   if(!inspectionOnly&&view!=="inspect"){
    gl.bindVertexArray(world.vao);
    gl.drawArrays(gl.TRIANGLES,0,world.count);
    // Same world-anchored cloud layer for C172 and R44. Simulated weather
    // moves it through the sky with no fresh vertex uploads or downloads.
    const drifting=Clouds.drift(state.time,state.windXMps,state.windZMps,reducedMotion);
    gl.uniform1f(uni.uActor,6);
    gl.uniform3fv(uni.uPartPivot,[drifting.x,0,drifting.z]);
    gl.bindVertexArray(cloudLayer.vao);
    gl.drawArrays(gl.TRIANGLES,0,cloudLayer.count);
    gl.uniform3fv(uni.uPartPivot,[0,0,0]);
    gl.uniform1f(uni.uActor,0);
    if(lighting==="dusk"||lighting==="golden"){
     gl.uniform1f(uni.uActor,3);
     gl.uniform1f(uni.uOpacity,lighting==="dusk"?.88:.51);
     gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
     gl.depthMask(false);
     const lamps=state.mode==="helicopter"?glowHeli:glowPlane;
     gl.bindVertexArray(lamps.vao);
     gl.drawArrays(gl.TRIANGLES,0,lamps.count);
     gl.depthMask(true);gl.disable(gl.BLEND);
     gl.uniform1f(uni.uOpacity,1);
     gl.uniform1f(uni.uActor,0);
    }
   }
   // Moving airfield vehicles run entirely on simulated flight time.
   // Their GPU geometry is reused; only the world transform changes.
   if(!inspectionOnly&&view!=="inspect"){
    gl.uniform1f(uni.uActor,5);
    gl.uniform1i(uni.uPartAxis,2);
    for(const vehicle of Traffic.sample(state.time,reducedMotion)){
     const car=trafficMeshes[vehicle.kind];
     gl.uniform3fv(uni.uPartPivot,[vehicle.x,.15,vehicle.z]);
     gl.uniform1f(uni.uPartAngle,vehicle.headingRad);
     gl.bindVertexArray(car.vao);
     gl.drawArrays(gl.TRIANGLES,0,car.count);
    }
    gl.uniform1i(uni.uPartAxis,0);
    gl.uniform1f(uni.uPartAngle,0);
    gl.uniform3fv(uni.uPartPivot,[0,0,0]);
    gl.uniform1f(uni.uActor,0);
   }
   // Draw the fixed-position windsocks after the static terrain.
   // No new GPU resources are created on individual animation frames.
   if(!inspectionOnly&&view!=="inspect"&&state.mode==="airplane"){
    const wind=Windsocks.sample(state.windXMps,state.windZMps,state.time,reducedMotion);
    gl.uniform1f(uni.uActor,4);
    gl.uniform1i(uni.uPartAxis,2);
    gl.uniform1f(uni.uPartAngle,wind.angleRad);
    for(const sock of windSocks){
     gl.uniform3fv(uni.uPartPivot,[sock.anchor.x,0,sock.anchor.z]);
     const mesh=wind.active?sock.flying:sock.limp;
     gl.bindVertexArray(mesh.vao);
     gl.drawArrays(gl.TRIANGLES,0,mesh.count);
    }
    gl.uniform1i(uni.uPartAxis,0);
    gl.uniform1f(uni.uPartAngle,0);
    gl.uniform3fv(uni.uPartPivot,[0,0,0]);
    gl.uniform1f(uni.uActor,0);
   }
   // The F-22 source is loaded on first exterior view, not at page startup.
   if(view!=="cockpit"&&state.mode==="airplane"){
    const selectedJet=Exterior.normalize(airframeId||state.mode);
    if(selectedJet==="f22")importF22();
    if(selectedJet==="f35")importF35();
    if(selectedJet==="su37")importSu37();
    if(selectedJet==="typhoon")importTyphoon();
   }
   // A direct inspector draw must never flash the obsolete procedurally
   // illustrated F-22/F-35B while source meshes are still being fetched.
   // The UI also hides both canvases behind its loading indicator.
   if(inspectionOnly&&view==="inspect"){
    const choice=Exterior.normalize(airframeId||state.mode);
    if(choice==="f22"||choice==="f35"||choice==="su37"||
       choice==="typhoon"){
     const status=choice==="f22"?realF22Status:
      choice==="f35"?realF35Status:
      choice==="su37"?realSu37Status:realTyphoonStatus;
     if(status!=="imported"){
      if(canvas.dataset)canvas.dataset.airframeSource=
       status==="fallback"?"unavailable":"loading";
      return true; // Sky/background only, never the obsolete jet.
     }
    }
   }
   // The genuine C172 cockpit must draw the original *interior* mesh in
   // pilot view; exterior-only logic used to hide every cabin surface.
   if(view!=="cockpit"||sourceCockpit){
    const selected=Exterior.normalize(airframeId||state.mode);
    const id=state.mode==="helicopter"?"r44":selected==="r44"?"c172":selected;
    const model=airframes[id];
    // The 360 viewer must distinguish a freshly drawn Typhoon from the
    // previous F/A-18 even though both report source="procedural".
    if(canvas.dataset)canvas.dataset.airframeId=id;
    if(!inspectionOnly&&view!=="cockpit"&&model.shadow&&Number(state.altitudeM)<120){
     const height=Math.max(0,Number(state.altitudeM)||0);
     gl.uniform1f(uni.uActor,2);
     gl.uniform1f(uni.uOpacity,.25/(1+height/24));
     gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
     gl.depthMask(false);
     gl.bindVertexArray(model.shadow.vao);
     gl.drawArrays(gl.TRIANGLES,0,model.shadow.count);
     gl.depthMask(true);gl.disable(gl.BLEND);
     gl.uniform1f(uni.uOpacity,1);
    }
    gl.uniform1f(uni.uActor,1);
    const realModel=id==="f35"?realF35:
     (id==="c172"?realC172:id==="r44"?realR44:
     id==="f22"?realF22:id==="su37"?realSu37:
     id==="typhoon"?realTyphoon:null);
    // The four source-derived fighters no longer display their obsolete
    // procedural jets while their genuine exterior assets load. This applies
    // to chase/3D exterior views as well as the already guarded 360 inspector.
    // Keep the scenery and flight controls live while the source is pending.
    const sourceJet=id==="f22"||id==="f35"||
     id==="su37"||id==="typhoon";
    const pendingSourceJet=sourceJet&&!realModel;
    const sourceJetStatus=id==="f22"?realF22Status:
     id==="f35"?realF35Status:id==="su37"?realSu37Status:
     id==="typhoon"?realTyphoonStatus:null;
    const isMolen=id==="r44"&&realModel?.kind==="molen";
    const isMolenC172=id==="c172"&&realModel?.kind==="molen";
    if(canvas.dataset)canvas.dataset.airframeSource=realModel?
     (id==="f22"?"gpl-f22-fguk":id==="f35"?"gpl-f35b-flightgear":
      id==="su37"?"gpl-su37-fguk":
      id==="typhoon"?"gpl-typhoon-fg":
      isMolenC172?"mit-c172s-glb":id==="c172"?"licensed-c172-glb":
      isMolen?"mit-r44-glb":"licensed-r44-ac3d"):
      pendingSourceJet?(sourceJetStatus==="fallback"?"unavailable":"loading"):
      "procedural";
    if(canvas.dataset)canvas.dataset.airframeInterior=!model.cabin?
     "not-rendered":id==="c172"||id==="r44"?
     "four-seats-and-panel":"fighter-seat-console-panel";
    const drawCabin=()=>{
     if(!model.cabin)return;
     gl.disable(gl.BLEND);gl.depthMask(true);
     gl.uniform1i(uni.uC172Pass,0);
     gl.uniform1f(uni.uHasTexture,0);gl.uniform1f(uni.uAlphaCutoff,0);
     gl.uniform1f(uni.uOpacity,1);
     gl.bindVertexArray(model.cabin.vao);
     gl.drawArrays(gl.TRIANGLES,0,model.cabin.count);
    };
    if(view==="inspect"&&orbit.interior===true&&model.cabin){
     // Isolate aircraft cockpit hardware for readable inspection. Removing
     // the exterior here is visual only; no flight geometry is changed.
     drawCabin();
    }else if(realModel){
     gl.activeTexture(gl.TEXTURE0);
     const drawPrimitive=(part,alpha)=>{
      const img=part.imageId===null?null:realModel.images[part.imageId];
      gl.uniform1f(uni.uHasTexture,img?1:0);
      gl.uniform1f(uni.uAlphaCutoff,part.alphaMask?part.alphaCutoff:0);
      gl.uniform1f(uni.uOpacity,alpha);
      gl.bindTexture(gl.TEXTURE_2D,img);
      if((isMolen||isMolenC172||id==="f22"||id==="f35"||id==="su37"||id==="typhoon")&&part.partAxis){
       gl.uniform1i(uni.uPartAxis,part.partAxis);
       gl.uniform3fv(uni.uPartPivot,part.partPivot);
       const angle=part.gearDoorSide?
        Exterior.importedGearDoorAngle(animation?.[part.partName],part.gearDoorSide):
        animation?.[part.partName];
       gl.uniform1f(uni.uPartAngle,Number.isFinite(angle)?angle:0);
      }
      gl.bindVertexArray(part.vao);
      gl.drawElements(gl.TRIANGLES,part.count,part.indexType,0);
      if((isMolen||isMolenC172||id==="f22"||id==="f35"||id==="su37"||id==="typhoon")&&part.partAxis){
       gl.uniform1i(uni.uPartAxis,0);
       gl.uniform1f(uni.uPartAngle,0);
       gl.uniform3fv(uni.uPartPivot,[0,0,0]);
      }
     };
     if(isMolenC172){
      // This complete source Skyhawk has its own four seats, NAV III panel,
      // glazing and hinged surfaces. Never layer old hull/cabin on top.
      gl.disable(gl.BLEND);gl.depthMask(true);
      gl.uniform1i(uni.uR44Skin,0);gl.uniform1i(uni.uC172Pass,0);
      for(const part of realModel.primitives)
       if((part.opacity??1)>=.99)drawPrimitive(part,1);
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      for(const part of realModel.primitives)
       if((part.opacity??1)<.99)drawPrimitive(part,limit(part.opacity,0,1));
     }else if(id==="c172"){
      // Opaque Cessna skin does not block the interior through tinted glass;
      // glazing is drawn only after the seats with depth writes disabled.
      gl.disable(gl.BLEND);gl.depthMask(true);
      gl.uniform1i(uni.uC172Pass,1);
      for(const part of realModel.primitives)drawPrimitive(part,1);
      // Source GLB's missing dark side panels are completed by one shaped
      // C172 fuselage. Draw it before seats; never duplicate wing/tail parts.
      gl.uniform1i(uni.uC172Pass,0);
      gl.uniform1f(uni.uHasTexture,0);gl.uniform1f(uni.uAlphaCutoff,0);
      gl.uniform1f(uni.uOpacity,1);
      gl.bindVertexArray(model.shell.vao);
      gl.drawArrays(gl.TRIANGLES,0,model.shell.count);
      drawCabin();
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);gl.uniform1i(uni.uC172Pass,2);
      for(const part of realModel.primitives)drawPrimitive(part,1);
      // Actual see-through side panels + windshield; body remains opaque.
      gl.uniform1i(uni.uC172Pass,0);
      gl.uniform1f(uni.uHasTexture,0);gl.uniform1f(uni.uAlphaCutoff,0);
      gl.uniform1f(uni.uOpacity,.26);
      gl.bindVertexArray(model.shellGlass.vao);
      gl.drawArrays(gl.TRIANGLES,0,model.shellGlass.count);
     }else if(id==="f22"||id==="f35"||id==="su37"||id==="typhoon"){
      // The genuine FlightGear airframe keeps its opaque skin and correctly
      // hinged surfaces. Render full-size gear with depth writes while
      // deployed and rotating; conceal it only at the very end of the fold
      // rather than shrinking wheels into impossible miniature tyres.
      const gearOpacity=part=>{
       if(part.partAxis!==4)return 1;
       const angle=animation?.[part.partName];
       const progress=limit((Number.isFinite(angle)?angle:0)/1.53,0,1);
       const fade=limit((progress-.82)/.16,0,1);
       return 1-fade*fade*(3-2*fade);
      };
      gl.disable(gl.BLEND);gl.depthMask(true);
      for(const part of realModel.primitives){
       if((part.opacity??1)<.99)continue;
       if(part.partAxis!==4||gearOpacity(part)>.999)drawPrimitive(part,1);
      }
      // Draw cockpit hardware behind the translucent canopy, never over the skin.
      drawCabin();
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      for(const part of realModel.primitives){
       const sourceAlpha=limit(part.opacity??1,0,1);
       const alpha=sourceAlpha*gearOpacity(part);
       if(alpha>.005&&alpha<.999)drawPrimitive(part,alpha);
      }
     }else if(isMolen){
      // The MIT aircraft already contains source windows, cabin, landing
      // gear, main and tail rotors. Draw none of the older AC3D overlays.
      gl.disable(gl.BLEND);gl.depthMask(true);
      gl.uniform1i(uni.uR44Skin,0);
      for(const part of realModel.primitives)
       if((part.opacity??1)>=.99)drawPrimitive(part,1);
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      for(const part of realModel.primitives)
       if((part.opacity??1)<.99)drawPrimitive(part,limit(part.opacity,0,1));
     }else{
      // FlightGear fallback has 70% transparent windows. Preserve its skin
      // isolation and the existing four-seat interior in that path only.
      gl.disable(gl.BLEND);gl.depthMask(true);
      for(const part of realModel.primitives){
       if((part.opacity??1)<.99)continue;
       gl.uniform1i(uni.uR44Skin,part.isPainted?1:0);
       drawPrimitive(part,1);
      }
      gl.uniform1i(uni.uR44Skin,0);
      drawCabin();
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      for(const part of realModel.primitives){
       // Keep tinted windows mostly transparent so the new front and
       // rear seats remain visible; navigation lights retain source alpha.
       const alpha=part.isGlazing?.14:
        Math.max(0,Math.min(1,part.opacity??1));
       if(alpha<.99)drawPrimitive(part,alpha);
      }
     }
     gl.depthMask(true);gl.disable(gl.BLEND);
     gl.bindTexture(gl.TEXTURE_2D,null);
     gl.uniform1f(uni.uHasTexture,0);gl.uniform1f(uni.uOpacity,1);
     gl.uniform1f(uni.uAlphaCutoff,0);gl.uniform1i(uni.uC172Pass,0);
    }else if(!pendingSourceJet){
     gl.bindVertexArray(model.body.vao);
     gl.drawArrays(gl.TRIANGLES,0,model.body.count);
    }
    if(realModel&&model.importedGear&&!(view==="inspect"&&orbit.interior===true)){
     // Restore non-textured, opaque source-metal rendering before placing
     // the wheel-well recesses and independently hinged left/right doors.
     // Only real F-22/F-35B meshes receive these panels; no fake gear layers.
     gl.bindTexture(gl.TEXTURE_2D,null);
     gl.uniform1f(uni.uHasTexture,0);gl.uniform1f(uni.uAlphaCutoff,0);
     gl.uniform1f(uni.uOpacity,1);gl.disable(gl.BLEND);gl.depthMask(true);
     gl.uniform1i(uni.uPartAxis,0);gl.uniform1f(uni.uPartAngle,0);
     gl.bindVertexArray(model.importedGear.wells.vao);
     gl.drawArrays(gl.TRIANGLES,0,model.importedGear.wells.count);
     for(const door of model.importedGear.doors){
      const angle=Exterior.importedGearDoorAngle(
       animation?.[door.gearName],door.side);
      gl.uniform1i(uni.uPartAxis,3);
      gl.uniform3fv(uni.uPartPivot,door.pivot);
      gl.uniform1f(uni.uPartAngle,angle);
      gl.bindVertexArray(door.gpu.vao);
      gl.drawArrays(gl.TRIANGLES,0,door.gpu.count);
     }
     gl.uniform1i(uni.uPartAxis,0);gl.uniform1f(uni.uPartAngle,0);
     gl.uniform3fv(uni.uPartPivot,[0,0,0]);
    }
    // Motion-sweep draws before the actual two blades; never conceals them.
    const isImportedRotorcraft=id==="r44"&&realR44!==null;
    const rotorSweep=isMolen?null:isImportedRotorcraft?
     model.authenticRotorSweep:model.rotorSweep;
    const tailRotorSweep=isMolen?null:isImportedRotorcraft?
     model.authenticTailRotorSweep:model.tailRotorSweep;
    const animatedParts=isMolen||pendingSourceJet?[]:
     id==="f22"&&realModel?[]:
     id==="f35"&&realModel?[]:
     id==="su37"&&realModel?[]:
     id==="typhoon"&&realModel?[]:
     exteriorAnimatedParts(id,Boolean(realModel),model);
    const rawSweep=animation?.rotorBlurOpacity;
    const sweepOpacity=Number.isFinite(rawSweep)?limit(rawSweep,0,.22):0;
    if(rotorSweep&&sweepOpacity>0){
     gl.uniform1i(uni.uPartAxis,0);gl.uniform1f(uni.uPartAngle,0);
     gl.uniform1f(uni.uOpacity,sweepOpacity);
     gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
     gl.depthMask(false);
     gl.bindVertexArray(rotorSweep.vao);
     gl.drawArrays(gl.TRIANGLES,0,rotorSweep.count);
     gl.depthMask(true);gl.disable(gl.BLEND);
     gl.uniform1f(uni.uOpacity,1);
    }
    const tailOpacity=Number.isFinite(animation?.tailBlurOpacity)?
     limit(animation.tailBlurOpacity,0,.20):0;
    if(tailRotorSweep&&tailOpacity>0){
     gl.uniform1i(uni.uPartAxis,0);gl.uniform1f(uni.uPartAngle,0);
     gl.uniform1f(uni.uOpacity,tailOpacity);
     gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
     gl.depthMask(false);
     gl.bindVertexArray(tailRotorSweep.vao);
     gl.drawArrays(gl.TRIANGLES,0,tailRotorSweep.count);
     gl.depthMask(true);gl.disable(gl.BLEND);
     gl.uniform1f(uni.uOpacity,1);
    }
    // Draw this sweep only when the propeller is turning fast enough; the
    // actual blades remain distinct at startup and low power.
    const propOpacity=Number.isFinite(animation?.propBlurOpacity)?
     limit(animation.propBlurOpacity,0,.16):0;
    if(model.propSweep&&!realModel&&!pendingSourceJet&&propOpacity>0){
     gl.uniform1i(uni.uPartAxis,0);gl.uniform1f(uni.uPartAngle,0);
     gl.uniform1f(uni.uOpacity,propOpacity);
     gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
     gl.depthMask(false);
     gl.bindVertexArray(model.propSweep.vao);
     gl.drawArrays(gl.TRIANGLES,0,model.propSweep.count);
     gl.depthMask(true);gl.disable(gl.BLEND);gl.uniform1f(uni.uOpacity,1);
    }
    for(const part of animatedParts){
     gl.uniform1i(uni.uPartAxis,part.axis);
     gl.uniform3fv(uni.uPartPivot,part.pivot);
     // Procedural jet wheel doors follow the exact same retractable gear
     // channel as the associated struts. Their opposite hinges swing down
     // while extended and close at stow. Imported F-22/F-35B keep their
     // own dedicated source-mesh door path above, never double-drawn.
     const angle=part.gearName?
      Exterior.importedGearDoorAngle(animation?.[part.gearName],
       part.doorSide):animation?.[part.name];
     gl.uniform1f(uni.uPartAngle,Number.isFinite(angle)?angle:0);
     gl.bindVertexArray(part.gpu.vao);
     gl.drawArrays(gl.TRIANGLES,0,part.gpu.count);
    }
    gl.uniform1i(uni.uPartAxis,0);gl.uniform1f(uni.uPartAngle,0);
    // Imported assets use fixtures mounted to their ACTUAL parsed surface
    // vertices; fallback models retain their own procedural light stations.
    const lightingModel=realModel?.positionLights?realModel:model;
    if(view!=="cockpit"&&!pendingSourceJet&&lightingModel.positionLights){
     // Three fixed, correctly sided colour references follow the exact
     // aircraft transform through chase, side, top and 360-degree inspection.
     // They are never drawn into the approved pilot-facing cockpit controls.
     gl.uniform1f(uni.uActor,1);
     gl.uniform1f(uni.uHasTexture,0);gl.uniform1f(uni.uOpacity,1);
     gl.disable(gl.BLEND);gl.depthMask(true);
     gl.bindVertexArray(lightingModel.positionLights.vao);
     gl.drawArrays(gl.TRIANGLES,0,lightingModel.positionLights.count);
     const pulse=exteriorStrobePulse(state.time,reducedMotion);
     if(pulse>0&&lightingModel.strobeLight){
      gl.uniform1f(uni.uOpacity,pulse);
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.bindVertexArray(lightingModel.strobeLight.vao);
      gl.drawArrays(gl.TRIANGLES,0,lightingModel.strobeLight.count);
      gl.depthMask(true);gl.disable(gl.BLEND);
      gl.uniform1f(uni.uOpacity,1);
     }
    }
   }
   gl.bindVertexArray(null);
   return !gl.isContextLost();
  }
  function destroy(){
   if(disposed)return;disposed=true;cameraRig?.reset();canvas.removeEventListener?.("webglcontextlost",contextLost);
   if(!lost){
    for(const o of objects)gl.deleteVertexArray(o.vao);
    for(const b of buffers)gl.deleteBuffer(b);
    for(const t of textures)gl.deleteTexture(t);
    gl.deleteProgram(program);gl.deleteProgram(skyProgram);
   }
  }
  return {draw,destroy,resetCamera(){cameraRig?.reset()},
   // Allow the 360-degree inspector to request a source jet before the first
   // frame. It must not draw the old procedural fighter during model loading.
   prepareAirframe(id){
    if(id==="f22"){importF22();return realF22Status}
    if(id==="f35"){importF35();return realF35Status}
    if(id==="su37"){importSu37();return realSu37Status}
    if(id==="typhoon"){importTyphoon();return realTyphoonStatus}
    return null;
   },
   get realC172Status(){return realC172Status},
   get realR44Status(){return realR44Status},
   get realF22Status(){return realF22Status},
   get realF35Status(){return realF35Status},
   get realSu37Status(){return realSu37Status},
   get realTyphoonStatus(){return realTyphoonStatus},
   supported:true,engine:"webgl2",
   get realC172Kind(){return realC172?.kind||null},
   get lost(){return lost}};
 }catch{
  canvas.removeEventListener?.("webglcontextlost",contextLost);
  try{for(const b of buffers)gl.deleteBuffer(b);if(program)gl.deleteProgram(program);
   if(skyProgram)gl.deleteProgram(skyProgram);}catch{}
  return null;
 }
}
const api={Mesh,IMPORTED_CABIN_LAYOUT,FIGHTER_INTERIOR_STATIONS,buildFighterInterior,buildCleanR44Rotors,buildImportedCabin,buildImportedC172Shell,buildCloudLayer,exteriorLightStations,exteriorStrobeStation,
 buildExteriorPositionLights,buildExteriorStrobe,exteriorStrobePulse,importedCameraFraming,REAL_R44_HARDWARE_ANCHORS,alignRealR44HardwarePoint,alignRealR44Hardware,alignRealR44MovingPart,exteriorAnimatedParts,buildWorld,buildGroundVehicle,buildWindsockFabric,airportDetails,buildVehicle,buildShadow,buildRotorSweep,buildTailRotorSweep,buildPropellerSweep,buildMovingParts,cameraPose,createRenderer,airframeIds:Exterior.IDS};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlight3D=api;
})(typeof window!=="undefined"?window:null);
