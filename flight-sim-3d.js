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
 for(let z=-2400;z<7200;z+=260)for(let x=-3200;x<3200;x+=260){
  const col=tint(noise(x*.1+z*.05)>.35?grass:rgb(128,144,84),
   .82+noise(x*.17+z*.33)*.27);
  mesh.quad([x,elevation(x,z)-.2,z],[x+260,elevation(x+260,z)-.2,z],
   [x+260,elevation(x+260,z+260)-.2,z+260],
   [x,elevation(x,z+260)-.2,z+260],col);
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
 for(let z=0;z<=1800;z+=95)for(const x of [-24,24])
  mesh.box(x-.4,.05,z-.4,.8,.6,.8,rgb(222,207,136));
 mesh.quad([20,.08,250],[270,.08,250],[270,.08,310],[20,.08,310],tarmac);
 mesh.quad([125,.08,310],[370,.08,310],[370,.08,700],[125,.08,700],tint(tarmac,.93));
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
 for(let i=0;i<245;i++){
  const x=(i%2===0?-1:1)*(100+noise(i+7)*1600);
  const z=-1900+noise(i*3.3+11)*7700,y=elevation(x,z);
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
 // Light fixtures are dim visual points in a fictional scenery, not
 // real approach aids or aerodrome lighting specifications.
 for(const p of config.approachLights){
  mesh.box(p.x-.52,.01,p.z-.52,1.04,.31,1.04,rgb(248,223,175));
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
function buildShadow(mode="c172"){
 const mesh=buildVehicle(mode),position=mesh.positions;
 let xMin=Infinity,xMax=-Infinity,zMin=Infinity,zMax=-Infinity;
 for(let i=0;i<position.length;i+=3){
  xMin=Math.min(xMin,position[i]);xMax=Math.max(xMax,position[i]);
  zMin=Math.min(zMin,position[i+2]);zMax=Math.max(zMax,position[i+2]);
 }
 const rx=mode==="r44"||mode==="helicopter"?5.03:(xMax-xMin)*.47;
 const rz=(zMax-zMin)*.48;
 const cx=(xMax+xMin)/2,cz=(zMax+zMin)/2;
 const m=new Mesh(),shade=rgb(17,28,30);
 for(let i=0;i<28;i++){
  const a=i*2*Math.PI/28,b=(i+1)*2*Math.PI/28;
  m.tri([cx,0,cz],[cx+rx*Math.cos(a),0,cz+rz*Math.sin(a)],
   [cx+rx*Math.cos(b),0,cz+rz*Math.sin(b)],shade);
 }
 return m.finish();
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
  add("propeller",[0,0,6.05],3,m=>{
   m.box(-.13,-2.15,6.04,.26,4.30,.16,metal);
   m.box(-2.15,-.13,6.04,4.30,.26,.16,tint(metal,.84));
   m.box(-.31,-.31,6.14,.62,.62,.28,yellow);
  });
  for(const [name,x,bankSign] of [
   ["leftAileron",-6.25,-1],["rightAileron",4.55,1]]){
   add(name,[x+ .85,.1,-1.7],1,m=>{
    m.box(x,-.06,-2.18,1.7,.21,.55,bankSign>0?blue:yellow);
   });
  }
  for(const [name,x] of [["leftFlap",-3.9],["rightFlap",1.4]]){
   add(name,[x+1.1,.1,-1.68],1,m=>{
    m.box(x,-.07,-2.22,2.2,.22,.62,blue);
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
  // R44 rotor arrangement: one teetering TWO-blade main rotor, 10.06 m
  // diameter; one TWO-blade tail rotor, 1.47 m diameter. Blade sections
  // have slight coning, tapered tips and contrasting edges for legibility.
  // Both rotate around their real geometric hubs (Y and X respectively).
  add("mainRotor",[0,3.16,-.4],2,m=>{
   const y=3.16,hubZ=-.40;
   const tip=5.03;
   for(const side of [-1,1]){
    const A=[side*.32,y,hubZ-.24],B=[side*4.65,y+.15,hubZ-.26];
    const C=[side*tip,y+.18,hubZ-.14],D=[side*tip,y+.18,hubZ+.08];
    const E=[side*4.65,y+.15,hubZ+.12],F=[side*.32,y,hubZ+.24];
    m.quad(A,B,E,F,metal);
    m.tri(B,C,D,tint(metal,1.16));m.tri(B,D,E,tint(metal,1.05));
    // Flat underside keeps rotor visible from a camera below the disc.
    const under=v=>[v[0],v[1]-.042,v[2]];
    m.quad(under(F),under(E),under(B),under(A),tint(metal,.72));
    m.tri(under(E),under(D),under(B),tint(metal,.76));
    m.box(side>0?4.57:-4.85,y+.13,hubZ-.30,.28,.07,.48,yellow);
    m.box(side>0?.36:-.70,y-.045,hubZ-.22,.34,.08,.44,blue);
   }
   m.box(-.37,y-.08,hubZ-.31,.74,.18,.62,yellow);
   m.box(-.22,y+.10,hubZ-.18,.44,.15,.36,tint(metal,.82));
  });
  add("tailRotor",[-.77,1.19,-8.18],1,m=>{
   const x=-.77,z=-8.18,y=1.19,r=.735;
   // Rotor turns in the YZ plane, mounted on the LEFT of the tail fin.
   for(const sign of [-1,1]){
    const tip=sign*r;
    m.quad([x,y+sign*.10,z-.10],[x,y+tip,z-.10],
     [x,y+tip,z+.10],[x,y+sign*.10,z+.15],metal);
    m.box(x-.04,y+Math.min(sign*.50,sign*.65),z-.115,.11,.16,.25,yellow);
   }
   m.box(x-.12,y-.13,z-.15,.24,.26,.30,blue);
  });
 }
 return result.map(part=>scalePart(part,mode==="helicopter"?"r44":"c172"));
}
function cameraPose(state,view="cockpit",orbit={}){
 if(!state||!["airplane","helicopter"].includes(state.mode))throw Error("Synthetic aircraft state required");
 if(!["cockpit","chase","side","top","inspect"].includes(view))throw Error("Unknown 3D camera mode");
 const yaw=(state.headingDeg||0)*RAD;
 const craft=[state.xM,state.altitudeM+(state.mode==="airplane"?1.5:2),state.zM];
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
 if(view==="cockpit")return {view,eye:[state.xM,state.altitudeM+2.2,state.zM],
  yaw,pitch:(state.pitchDeg||0)*RAD,roll:(state.rollDeg||0)*RAD,craft};
 if(view==="side")return {view,
  eye:[state.xM-27*Math.cos(yaw),state.altitudeM+10,
    state.zM+27*Math.sin(yaw)],
  yaw:yaw+Math.PI/2,pitch:-.28,roll:0,craft};
 if(view==="top")return {view,
  eye:[state.xM,state.altitudeM+40,state.zM-4],
  yaw,pitch:-1.46,roll:0,craft};
 return {view,eye:[state.xM-30*Math.sin(yaw),state.altitudeM+13,
    state.zM-30*Math.cos(yaw)],yaw,pitch:-.31,
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
out float vDistance,vLight;
void main(){
 vec3 p=aPosition;
 if(uActor>1.5){
  // The soft ground footprint uses the same aircraft orientation but stays
  // just above the runway/helipad surface rather than rising with the craft.
  float c=cos(uCraftYaw),s=sin(uCraftYaw);
  p=vec3(p.x*c+p.z*s+uCraft.x,.24,-p.x*s+p.z*c+uCraft.z);
 }else if(uActor>.5){
  // Rotate illustrated flap/aileron/elevator surfaces around their hinges,
  // or propeller/rotor parts around their hub. Static body/world have axis 0.
  if(uPartAxis>0){
   vec3 q=p-uPartPivot;
   float ca=cos(uPartAngle),sa=sin(uPartAngle);
   if(uPartAxis==1)q=vec3(q.x,q.y*ca-q.z*sa,q.y*sa+q.z*ca);
   else if(uPartAxis==2)q=vec3(q.x*ca+q.z*sa,q.y,-q.x*sa+q.z*ca);
   else if(uPartAxis==3)q=vec3(q.x*ca-q.y*sa,q.x*sa+q.y*ca,q.z);
   p=q+uPartPivot;
  }
  float c=cos(uCraftRoll),s=sin(uCraftRoll);
  p=vec3(p.x*c+p.y*s,-p.x*s+p.y*c,p.z);
  c=cos(uCraftPitch);s=sin(uCraftPitch);
  p=vec3(p.x,p.y*c+p.z*s,-p.y*s+p.z*c);
  c=cos(uCraftYaw);s=sin(uCraftYaw);
  p=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c)+uCraft;
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
 vLight=.55+.45*max(0.,dot(normalize(aNormal),normalize(vec3(.28,1.,.36))));
}`;
const FRAGMENT=`#version 300 es
precision mediump float;
in vec3 vColor;
in float vDistance,vLight;
uniform vec3 uFogColor,uLightColor;
uniform float uOpacity;
out vec4 outColor;
void main(){
 float fog=clamp((vDistance-1150.)/5000.,0.,.8);
 vec3 shaded=clamp(vColor*vLight*uLightColor,0.,1.);
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
  const airframes=Object.create(null);
  for(const id of Exterior.IDS){
   airframes[id]={
    body:upload(buildVehicle(id)),
    parts:buildMovingParts(id).map(part=>({...part,gpu:upload(part.mesh)})),
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
   const camera=cameraPose(state,view,orbit);
   gl.uniform3fv(uni.uEye,camera.eye);
   gl.uniform3fv(uni.uCraft,camera.craft);
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
   if(disposed)return;disposed=true;canvas.removeEventListener?.("webglcontextlost",contextLost);
   if(!lost){
    for(const o of objects)gl.deleteVertexArray(o.vao);
    for(const b of buffers)gl.deleteBuffer(b);
    gl.deleteProgram(program);gl.deleteProgram(skyProgram);
   }
  }
  return {draw,destroy,supported:true,engine:"webgl2",get lost(){return lost}};
 }catch{
  canvas.removeEventListener?.("webglcontextlost",contextLost);
  try{for(const b of buffers)gl.deleteBuffer(b);if(program)gl.deleteProgram(program);
   if(skyProgram)gl.deleteProgram(skyProgram);}catch{}
  return null;
 }
}
const api={Mesh,buildWorld,airportDetails,buildVehicle,buildShadow,buildMovingParts,cameraPose,createRenderer,airframeIds:Exterior.IDS};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlight3D=api;
})(typeof window!=="undefined"?window:null);
