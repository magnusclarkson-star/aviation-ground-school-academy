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
 for(let i=0;i<35;i++){
  const x=(noise(i*8.4)-.5)*11000,y=800+noise(i*2+19)*540,
   z=700+noise(i*1.9+41)*7000,s=75+noise(i*12.1)*80;
  mesh.cloud(x,y,z,s);mesh.cloud(x+s*.6,y+9,z+s*.15,s*.65);
 }
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
function buildWorld(mode="airplane"){
 if(!["airplane","helicopter"].includes(mode))throw Error("Unknown 3D airfield mode");
 const m=new Mesh();ground(m);
 if(mode==="airplane"){runway(m);airportDetails(m);}else helipad(m);
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
function cameraPose(state,view="cockpit",orbit={}){
 if(!state||!["airplane","helicopter"].includes(state.mode))throw Error("Synthetic aircraft state required");
 if(!["cockpit","chase","side","top","inspect"].includes(view))throw Error("Unknown 3D camera mode");
 const yaw=(state.headingDeg||0)*RAD;
 const altitude=Number.isFinite(state.altitudeM)?Math.max(0,state.altitudeM):0;
 const craft=[state.xM,altitude+(state.mode==="airplane"?1.5:2),state.zM];
 if(view==="inspect"){
  const azimuth=limit(orbit.azimuth??0,-720,720)*RAD;
  const elevation=limit(orbit.elevation??28,-70,78)*RAD;
  const distance=limit(orbit.distance??29,17,70);
  const direction=yaw+Math.PI+azimuth;
  const horizontal=distance*Math.cos(elevation);
  return {view,eye:[craft[0]+Math.sin(direction)*horizontal,
   craft[1]+Math.sin(elevation)*distance,
   craft[2]+Math.cos(direction)*horizontal],
   yaw:direction+Math.PI,pitch:-elevation,roll:0,craft};
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
  const distance=(helicopter?26:28)+movement*(helicopter?4:6);
  const rise=(helicopter?9:10)+movement*3;
  return {view,
   eye:[state.xM-distance*Math.cos(yaw),Math.max(4,craft[1]+rise),
    state.zM+distance*Math.sin(yaw)],
   yaw:yaw+Math.PI/2,pitch:-Math.atan2(rise,distance),roll:0,craft};
 }
 if(view==="top"){
  const rise=(helicopter?39:43)+movement*(helicopter?6:9);
  return {view,eye:[state.xM,Math.max(7,craft[1]+rise),state.zM-4],
   yaw,pitch:-1.46,roll:0,craft};
 }
 const distance=(helicopter?26:30)+movement*(helicopter?4:8);
 const rise=(helicopter?10:12)+movement*(helicopter?2:4);
 return {view,eye:[state.xM-distance*Math.sin(yaw),
    Math.max(4,craft[1]+rise),state.zM-distance*Math.cos(yaw)],
  yaw,pitch:-Math.atan2(rise,distance),
  roll:(state.rollDeg||0)*RAD*.13,craft};
}
const VERTEX=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aColor;
layout(location=2) in vec3 aNormal;
uniform vec3 uEye;
uniform vec3 uCraft;
uniform float uYaw,uPitch,uRoll,uCraftYaw,uCraftPitch,uCraftRoll;
uniform float uActor,uAspect,uFocal;
uniform vec3 uPartPivot;
uniform float uPartAngle;
uniform int uPartAxis;
out vec3 vColor;
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
 if(uActor>2.5){
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
  if(uPartAxis>0){
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
   1.000080003*depth-0.800032001,depth);
 vColor=aColor;vDistance=depth;
 vLight=.55+.45*max(0.,dot(normalize(normal),normalize(vec3(.28,1.,.36))));
 vEmissive=uActor>2.5?1.:0.;
}`;
const FRAGMENT=`#version 300 es
precision mediump float;
in vec3 vColor;
in float vDistance,vLight,vEmissive;
uniform vec3 uFogColor,uLightColor;
uniform float uOpacity;
out vec4 outColor;
void main(){
 float fog=clamp((vDistance-1150.)/5000.,0.,.8);
 vec3 shaded=mix(clamp(vColor*vLight*uLightColor,0.,1.),vColor,vEmissive);
 outColor=vec4(mix(shaded,uFogColor,fog),uOpacity);
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
 const buffers=[],objects=[];
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
   "uCraftRoll","uActor","uAspect","uFocal",
   "uPartPivot","uPartAngle","uPartAxis","uFogColor","uLightColor","uOpacity"])
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
  const worldPlane=inspectionOnly?null:upload(buildWorld("airplane")),
   worldHeli=inspectionOnly?null:upload(buildWorld("helicopter"));
  const glowPlane=inspectionOnly?null:upload(buildGroundGlow("airplane")),
   glowHeli=inspectionOnly?null:upload(buildGroundGlow("helicopter"));
  const airframes=Object.create(null);
  for(const id of Exterior.IDS){
   airframes[id]={
    body:upload(buildVehicle(id)),
    parts:buildMovingParts(id).map(part=>({...part,gpu:upload(part.mesh)})),
    rotorSweep:id==="r44"?upload(buildRotorSweep(id)):null,
    tailRotorSweep:id==="r44"?upload(buildTailRotorSweep(id)):null,
    propSweep:id==="c172"?upload(buildPropellerSweep(id)):null,
    shadow:inspectionOnly?null:upload(buildShadow(id))
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
   const targetCamera=cameraPose(state,view,orbit);
   const clock=root?.performance?.now?.()??Date.now();
   const reducedMotion=root?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
   const camera=reducedMotion?targetCamera:(cameraRig?.next(targetCamera,clock,(airframeId||state.mode)+"|"+state.mode)||targetCamera);
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
   const world=state.mode==="helicopter"?worldHeli:worldPlane;
   gl.uniform1f(uni.uActor,0);
   gl.uniform1i(uni.uPartAxis,0);gl.uniform1f(uni.uPartAngle,0);
   gl.uniform3fv(uni.uPartPivot,[0,0,0]);
   if(!inspectionOnly&&view!=="inspect"){
    gl.bindVertexArray(world.vao);
    gl.drawArrays(gl.TRIANGLES,0,world.count);
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
   if(view!=="cockpit"){
    const selected=Exterior.normalize(airframeId||state.mode);
    const id=state.mode==="helicopter"?"r44":selected==="r44"?"c172":selected;
    const model=airframes[id];
    if(!inspectionOnly&&model.shadow&&Number(state.altitudeM)<120){
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
    gl.uniform1f(uni.uActor,1);gl.bindVertexArray(model.body.vao);
    gl.drawArrays(gl.TRIANGLES,0,model.body.count);
    // Motion-sweep draws before the actual two blades; never conceals them.
    const rawSweep=animation?.rotorBlurOpacity;
    const sweepOpacity=Number.isFinite(rawSweep)?limit(rawSweep,0,.22):0;
    if(model.rotorSweep&&sweepOpacity>0){
     gl.uniform1i(uni.uPartAxis,0);gl.uniform1f(uni.uPartAngle,0);
     gl.uniform1f(uni.uOpacity,sweepOpacity);
     gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
     gl.depthMask(false);
     gl.bindVertexArray(model.rotorSweep.vao);
     gl.drawArrays(gl.TRIANGLES,0,model.rotorSweep.count);
     gl.depthMask(true);gl.disable(gl.BLEND);
     gl.uniform1f(uni.uOpacity,1);
    }
    const tailOpacity=Number.isFinite(animation?.tailBlurOpacity)?
     limit(animation.tailBlurOpacity,0,.20):0;
    if(model.tailRotorSweep&&tailOpacity>0){
     gl.uniform1i(uni.uPartAxis,0);gl.uniform1f(uni.uPartAngle,0);
     gl.uniform1f(uni.uOpacity,tailOpacity);
     gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
     gl.depthMask(false);
     gl.bindVertexArray(model.tailRotorSweep.vao);
     gl.drawArrays(gl.TRIANGLES,0,model.tailRotorSweep.count);
     gl.depthMask(true);gl.disable(gl.BLEND);
     gl.uniform1f(uni.uOpacity,1);
    }
    // Draw this sweep only when the propeller is turning fast enough; the
    // actual blades remain distinct at startup and low power.
    const propOpacity=Number.isFinite(animation?.propBlurOpacity)?
     limit(animation.propBlurOpacity,0,.16):0;
    if(model.propSweep&&propOpacity>0){
     gl.uniform1i(uni.uPartAxis,0);gl.uniform1f(uni.uPartAngle,0);
     gl.uniform1f(uni.uOpacity,propOpacity);
     gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
     gl.depthMask(false);
     gl.bindVertexArray(model.propSweep.vao);
     gl.drawArrays(gl.TRIANGLES,0,model.propSweep.count);
     gl.depthMask(true);gl.disable(gl.BLEND);gl.uniform1f(uni.uOpacity,1);
    }
    for(const part of model.parts){
     gl.uniform1i(uni.uPartAxis,part.axis);
     gl.uniform3fv(uni.uPartPivot,part.pivot);
     const angle=animation?.[part.name];
     gl.uniform1f(uni.uPartAngle,Number.isFinite(angle)?angle:0);
     gl.bindVertexArray(part.gpu.vao);
     gl.drawArrays(gl.TRIANGLES,0,part.gpu.count);
    }
    gl.uniform1i(uni.uPartAxis,0);gl.uniform1f(uni.uPartAngle,0);
   }
   gl.bindVertexArray(null);
   return !gl.isContextLost();
  }
  function destroy(){
   if(disposed)return;disposed=true;cameraRig?.reset();canvas.removeEventListener?.("webglcontextlost",contextLost);
   if(!lost){
    for(const o of objects)gl.deleteVertexArray(o.vao);
    for(const b of buffers)gl.deleteBuffer(b);
    gl.deleteProgram(program);gl.deleteProgram(skyProgram);
   }
  }
  return {draw,destroy,resetCamera(){cameraRig?.reset()},supported:true,engine:"webgl2",get lost(){return lost}};
 }catch{
  canvas.removeEventListener?.("webglcontextlost",contextLost);
  try{for(const b of buffers)gl.deleteBuffer(b);if(program)gl.deleteProgram(program);
   if(skyProgram)gl.deleteProgram(skyProgram);}catch{}
  return null;
 }
}
const api={Mesh,buildWorld,airportDetails,buildVehicle,buildShadow,buildRotorSweep,buildTailRotorSweep,buildPropellerSweep,buildMovingParts,cameraPose,createRenderer,airframeIds:Exterior.IDS};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlight3D=api;
})(typeof window!=="undefined"?window:null);
