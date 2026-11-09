/* Distinct compact external aircraft geometry for the flight simulator.
 * All coordinates are an original illustrative silhouette in local metres;
 * +Z is the aircraft nose; aerodynamic simulation is deliberately separate.
 */
(function(root){"use strict";
const IDS=Object.freeze(["c172","r44","fa18","f22","f35","typhoon","su37"]);
const LABELS=Object.freeze({c172:"Cessna 172",r44:"Robinson R44",fa18:"F/A-18 Super Hornet",
 f22:"F-22 Raptor",f35:"F-35 Lightning II",typhoon:"Eurofighter Typhoon",su37:"Su-37"});
// Geometry is authored in unit-friendly local coordinates. Ratios are
// adjusted to the approximate published overall span/length of each type.
// Flight physics are unaffected; the same transform applies to hinged parts.
const SCALE=Object.freeze({
 c172:Object.freeze([.746,1,.653]),
 r44:Object.freeze([1,1,1]),
 fa18:Object.freeze([.890,1,1.148]),
 f22:Object.freeze([1.015,1,1.139]),
 f35:Object.freeze([.982,1,.981]),
 typhoon:Object.freeze([.711,1,.874]),
 su37:Object.freeze([.850,1,1.260])
});
const rgb=(r,g,b)=>[r/255,g/255,b/255];
const tint=(c,m)=>c.map(n=>Math.max(0,Math.min(1,n*m)));
const palette=Object.freeze({
 white:rgb(218,229,230),ivory:rgb(245,237,216),navy:rgb(33,94,141),
 blue:rgb(71,127,155),window:rgb(37,86,113),metal:rgb(151,162,172),
 jet:rgb(147,164,174),stealth:rgb(106,128,142),lightning:rgb(122,143,150),
 typhoon:rgb(157,172,179),su:rgb(137,162,159),dark:rgb(42,54,62),
 black:rgb(19,25,30),red:rgb(174,80,69),gold:rgb(208,179,112)
});
function normalize(id){
 if(id==="airplane")return "c172";
 if(id==="helicopter")return "r44";
 if(IDS.includes(id))return id;
 throw Error("Unknown 3D craft mode: "+id);
}
function polygon(m,points,color){
 for(let i=1;i<points.length-1;i++)m.tri(points[0],points[i],points[i+1],color);
}
function sheet(m,points,color,depth=.12){
 polygon(m,points,color);
 const lower=points.map(p=>[p[0],p[1]-depth,p[2]]);
 polygon(m,lower,tint(color,.70));
 for(let i=0;i<points.length;i++){
  const j=(i+1)%points.length;
  m.quad(points[i],points[j],lower[j],lower[i],tint(color,.80));
 }
}
function mirrored(m,points,color,depth=.12){
 for(const sign of [-1,1])sheet(m,points.map(([x,y,z])=>[x*sign,y,z]),color,depth);
}
function fuselage(m,stations,color,segments=10){
 for(let k=0;k<stations.length-1;k++){
  const [z0,w0,h0,y0]=stations[k],[z1,w1,h1,y1]=stations[k+1];
  for(let i=0;i<segments;i++){
   const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;
   const ring=(z,w,h,y,t)=>[Math.cos(t)*w,y+Math.sin(t)*h,z];
   m.quad(ring(z0,w0,h0,y0,a),ring(z1,w1,h1,y1,a),
    ring(z1,w1,h1,y1,b),ring(z0,w0,h0,y0,b),
    tint(color,.73+.2*Math.max(0,Math.sin((a+b)/2))));
  }
 }
}
function fin(m,baseX,mirror,height,frontZ,backZ,color){
 const s=mirror;
 sheet(m,[[baseX,.25,frontZ],[baseX+s*.60,.25+height,frontZ-1.7],
  [baseX+s*.85,.15+height*.8,backZ+1.2],[baseX,.25,backZ]],color,.09);
}
function canopy(m,zStart,zEnd,width,height,y,window){
 fuselage(m,[[zStart,.15,.11,y],[zStart+.5,width*.8,height*.85,y],
  [zEnd-.45,width,height,y],[zEnd,.14,.08,y]],window,8);
}
function engine(m,x,z,w=.9,color=palette.dark){
 // Each nacelle has its own X centreline, not one overlapping centre engine.
 const n=new Array();
 for(const [dz,radius,height,centreY] of [
  [-1.2,w*.85,w*.67,-.12],[.8,w,w*.75,-.10],[1.1,w*.8,w*.55,-.10]
 ])n.push([z+dz,radius,height,centreY]);
 const segments=8;
 for(let k=0;k<n.length-1;k++){
  const A=n[k],B=n[k+1];
  for(let i=0;i<segments;i++){
   const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;
   const p=(v,t)=>[x+Math.cos(t)*v[1],v[3]+Math.sin(t)*v[2],v[0]];
   m.quad(p(A,a),p(B,a),p(B,b),p(A,b),tint(color,.68+.28*Math.max(0,Math.sin((a+b)/2))));
  }
 }
 m.box(x-w*.62,-.35,z-1.55,w*1.24,.48,.18,palette.black);
}
// Thin, round, fixed tricycle wheels rather than rectangular landing-gear
// blocks. The wheel rolls in the local YZ plane around a lateral X axle.
function wheel(m,x,y,z,r,halfWidth=.105){
 const slices=12;
 const core=r*.42;
 for(let i=0;i<slices;i++){
  const a=i*2*Math.PI/slices,b=(i+1)*2*Math.PI/slices;
  const point=(xx,rad,angle)=>[xx,y+rad*Math.sin(angle),z+rad*Math.cos(angle)];
  m.quad(point(x-halfWidth,r,a),point(x+halfWidth,r,a),
   point(x+halfWidth,r,b),point(x-halfWidth,r,b),palette.black);
  for(const sign of [-1,1]){
   const face=x+sign*halfWidth;
   m.tri([face,y,z],point(face,r,sign>0?a:b),
    point(face,r,sign>0?b:a),palette.black);
   const hub=face+sign*.012;
   m.tri([hub,y,z],point(hub,core,sign>0?a:b),
    point(hub,core,sign>0?b:a),palette.metal);
  }
 }
}
function gear(m,x,z,r=.35){
 const centerY=-1.25-(r-.35)*.24;
 wheel(m,x,centerY,z,r);
 m.box(x-.07,centerY-.03,z-.07,.14,.72,.14,palette.metal);
}
function addC172(m){
 const c=palette.white,strip=palette.navy;
 fuselage(m,[[-6.5,.17,.22,0],[-5,.51,.55,.05],[-2.6,.73,.67,.08],
  [1.2,.95,.83,.10],[3.45,.81,.72,.02],[5.1,.40,.43,-.02],[6.2,.12,.16,-.03]],c);
 // High-wing, straight leading edge, broad rectangular trainer wings.
 mirrored(m,[[.72,.95,1.25],[7.4,.99,.7],[7.4,.99,-1.75],
  [.72,.95,-1.40]],c,.2);
 mirrored(m,[[.4,.9,-4.75],[2.9,.9,-5.10],[2.9,.9,-6.0],[.36,.9,-5.78]],c,.16);
 // Swept vertical tail and rudder outline (not the previous rectangular block).
 sheet(m,[[0,.52,-4.63],[0,2.26,-5.71],[0,2.49,-6.35],
  [0,.52,-6.40]],c,.16);
 sheet(m,[[0,.69,-6.08],[0,2.08,-6.08],[0,2.40,-6.38],
  [0,.70,-6.43]],strip,.08);
 m.box(-.70,.62,.4,1.4,.34,2.0,palette.window);
 m.box(-.75,.53,2.2,1.5,.24,.8,palette.window);
 // Wing struts and undercarriage help distinguish trainer from fighters.
 for(const sign of [-1,1]){
  const s=sign;
  sheet(m,[[s*.67,-.39,.15],[s*4.7,.76,-.55],[s*4.7,.94,-.38],
   [s*.67,-.13,.50]],palette.metal,.09);
  gear(m,s*2.10,-.8,.35);
 }
 gear(m,0,4.45,.26);
 // Trim along each wing rather than a square bar spanning the aircraft.
 mirrored(m,[[.83,1.04,-1.41],[7.25,1.04,-1.77],
  [7.24,1.04,-1.52],[.84,1.04,-1.20]],strip,.035);
 // Separate cabin windows and doors with realistic wing root spacing.
 for(const side of [-1,1]){
  const x=side*.90;
  sheet(m,[[x,.29,.08],[x,.72,.09],[x,.68,1.16],
   [x,.28,1.18]],palette.window,.04);
  sheet(m,[[x,.32,-1.04],[x,.74,-1.01],[x,.74,-.03],
   [x,.32,-.01]],palette.window,.04);
  m.box(x-.048,.23,.06,.096,.11,.18,palette.metal);
  m.box(side*7.18-.11,1.03,-1.81,.22,.11,.25,side>0?palette.red:palette.blue);
  sheet(m,[[side*.61,-.63,.15],[side*2.20,-1.05,-.77],
   [side*2.20,-.84,-.65],[side*.61,-.41,.35]],palette.metal,.04);
 }
 m.box(-.42,-.45,5.05,.84,.14,.48,palette.dark);
 m.box(-.38,-.24,5.56,.76,.12,.21,palette.metal);
 const spinner=[0,-.04,6.50],spinnerZ=6.14;
 for(let j=0;j<10;j++){
  const a=j*Math.PI/5,b=(j+1)*Math.PI/5;
  m.tri([.24*Math.cos(a),-.04+.24*Math.sin(a),spinnerZ],
   [.24*Math.cos(b),-.04+.24*Math.sin(b),spinnerZ],spinner,palette.metal);
 }
}
function addR44(m){
 const ivory=palette.ivory,trim=palette.navy,glass=palette.window;
 // A four-seat cabin with a rounded windscreen, engine cowling and
 // a narrow structural tail boom. Local +Z is the helicopter nose.
 fuselage(m,[[-2.90,.54,.53,.20],[-2.12,1.04,1.08,.18],
  [-1.00,1.24,1.27,.18],[.70,1.26,1.28,.10],
  [1.85,1.14,1.09,.08],[2.50,.69,.80,.06],[2.80,.18,.24,.04]],ivory,14);
 canopy(m,.47,2.76,1.12,1.07,.15,glass);
 // Individual door windows, centre pillar, engine ventilation and colour trim.
 for(const sign of [-1,1]){
  const x=sign*1.20;
  sheet(m,[[x,.42,-.73],[x,1.17,-.54],[x,1.13,.43],
   [x,.45,.66]],glass,.08);
  sheet(m,[[x,.41,-1.72],[x,1.12,-1.63],[x,1.15,-.78],
   [x,.38,-.89]],glass,.07);
  m.box(x-.065,.37,-.78,.13,1.01,.10,palette.metal);
  m.box(x-.08,-.62,-1.45,.16,.15,2.85,trim);
  for(let i=0;i<4;i++)m.box(x-.065,.15,-2.32+i*.27,.13,.08,.18,palette.dark);
 }
 // Separate engine cooling grille, cowling vents and skid steps.
 m.box(-.80,.92,-2.22,1.60,.14,.55,palette.metal);
 m.box(-.66,.98,-2.09,1.32,.09,.28,palette.dark);
 for(const side of [-1,1]){
  const x=side*1.04;
  m.box(x-.065,-.68,-1.45,.13,.16,1.1,palette.metal);
  m.box(x-.06,.11,.96,.12,.10,.22,trim);
 }
 // A slim, tapered tailcone and upper/lower vertical stabilizers.
 fuselage(m,[[-8.52,.08,.12,.56],[-7.67,.20,.20,.52],
  [-5.10,.30,.26,.49],[-2.15,.42,.37,.39]],ivory,8);
 sheet(m,[[0,.57,-8.54],[0,2.22,-8.17],
  [0,1.92,-7.34],[0,.62,-7.11]],trim,.10);
 sheet(m,[[0,.40,-8.48],[0,-.48,-8.11],
  [0,-.55,-7.84],[0,.35,-7.27]],ivory,.08);
 mirrored(m,[[.18,.68,-7.40],[1.65,.68,-7.55],
  [1.22,.68,-8.18],[.16,.68,-8.03]],ivory,.12);
 // Two undercarriage skids with forward upturned noses and cross tubes.
 for(const side of [-1,1]){
  const x=side*1.36;
  m.box(x-.10,-1.63,-2.10,.20,.17,4.67,palette.dark);
  sheet(m,[[x,-1.55,2.50],[x,-1.32,2.88],
   [x,-1.27,3.00],[x,-1.63,2.36]],palette.metal,.09);
  for(const z of [-1.50,1.16]){
   sheet(m,[[side*.83,-.78,z-.10],[x,-1.48,z-.10],
    [x,-1.39,z+.12],[side*.83,-.74,z+.12]],palette.metal,.10);
  }
 }
 m.box(-1.38,-.98,-1.52,2.76,.18,.14,palette.metal);
 m.box(-1.38,-.98,1.16,2.76,.18,.14,palette.metal);
 // Tall mast and unmistakable rotor head; the actual blades are separately
 // animated in buildMovingParts(), so there are exactly TWO main blades.
 m.box(-.16,1.18,-.52,.32,1.80,.28,palette.metal);
 m.box(-.38,2.85,-.73,.76,.29,.72,palette.dark);
 m.box(-.26,3.08,-.61,.52,.12,.48,palette.gold);
 // Tail boom accent, navigation lights and tail-rotor drive cover.
 m.box(-.20,.58,-6.70,.40,.085,3.40,trim);
 m.box(-.14,1.81,-8.10,.28,.11,.30,palette.red);
 m.box(-.25,.79,-8.57,.50,.09,.24,palette.gold);
 // Tail-rotor shaft and hinge on left side of empennage.
 m.box(-.72,1.01,-8.34,.24,.30,.24,palette.metal);
 m.box(-.83,1.11,-8.27,.18,.14,.19,palette.dark);
}
function genericJet(m,id){
 const c=id==="f22"?palette.stealth:id==="f35"?palette.lightning:
  id==="typhoon"?palette.typhoon:id==="su37"?palette.su:palette.jet;
 const isTwin=id!=="f35",isCanard=id==="typhoon"||id==="su37";
 const rx=id==="su37"?1.72:id==="f35"?1.15:1.53;
 const nose=id==="typhoon"?9.5:id==="f22"?8.8:8.2;
 const zTail=id==="su37"?-9.4:-7.8;
 fuselage(m,[[zTail,.33,.37,0],[-6.5,rx*.78,.70,.05],
  [-3.4,rx,.85,.04],[.5,rx*.77,.70,.03],
  [4.5,rx*.46,.44,.0],[nose,.10,.10,-.02]],c);
 if(isTwin){
  for(const x of [-.65,.65])engine(m,x,-5.7,id==="su37"?.73:.64,palette.dark);
 }else engine(m,0,-5.85,.74,palette.dark);
 // Aircraft-specific outer-wing planforms (not a recoloured shared model).
 const planforms={
  fa18:[[1.25,.25,2.4],[7.7,.25,-.8],[6.3,.25,-4.6],[1.27,.25,-3.7]],
  f22:[[1.25,.27,2.95],[6.7,.27,-2.15],[6.7,.27,-4.75],[1.2,.27,-3.3]],
  f35:[[1.03,.20,3.15],[5.45,.20,-2.0],[5.05,.20,-4.75],[1.1,.20,-3.55]],
  typhoon:[[.9,.27,4.05],[7.7,.27,-4.35],[6.15,.27,-5.55],[1.0,.27,-4.2]],
  su37:[[1.25,.30,3.35],[8.65,.30,-2.8],[7.7,.30,-5.5],[1.35,.30,-4.25]]
 };
 mirrored(m,planforms[id],c,.19);
 // Aircraft-specific wing roots, leading-edge extensions and discrete panels.
 if(id==="fa18"){
  mirrored(m,[[1.06,.34,3.60],[2.55,.34,2.35],
   [2.83,.34,.22],[1.25,.34,.68]],tint(c,.87),.05);
  mirrored(m,[[3.20,.36,-1.85],[6.18,.36,-2.06],
   [6.35,.36,-2.40],[3.25,.36,-2.35]],tint(c,.74),.025);
 }else if(id==="f22"){
  mirrored(m,[[1.10,.35,2.70],[3.18,.35,.13],
   [2.85,.35,-1.22],[1.10,.35,-.62]],tint(c,.89),.055);
  mirrored(m,[[3.36,.37,-2.55],[5.85,.37,-3.46],
   [5.93,.37,-3.72],[3.29,.37,-3.08]],tint(c,.80),.03);
 }else if(id==="f35"){
  mirrored(m,[[1.02,.30,2.88],[2.16,.30,1.65],
   [2.02,.30,-.64],[1.05,.30,-.46]],tint(c,.85),.03);
  mirrored(m,[[2.38,.31,-1.72],[4.62,.31,-3.18],
   [4.46,.31,-3.43],[2.40,.31,-2.08]],tint(c,.77),.03);
 }else if(id==="typhoon"){
  mirrored(m,[[1.02,.39,2.92],[2.12,.39,1.10],
   [4.10,.39,-1.55],[1.06,.39,.06]],tint(c,.85),.035);
  mirrored(m,[[3.72,.38,-2.10],[6.70,.38,-4.31],
   [6.30,.38,-4.60],[3.64,.38,-2.64]],tint(c,.74),.03);
 }else{
  mirrored(m,[[1.33,.39,2.50],[4.10,.39,.28],
   [5.07,.39,-1.42],[1.38,.39,-.83]],tint(c,.83),.04);
  mirrored(m,[[4.10,.40,-2.10],[6.90,.40,-3.67],
   [6.53,.40,-4.11],[3.95,.40,-2.64]],tint(c,.66),.04);
 }
 // Wingtip navigation lights and underwing hinge panels.
 for(const sign of [-1,1]){
  const point=planforms[id][1];
  const tipX=sign*point[0],tipZ=point[2];
  m.box(tipX-.12,.18,tipZ-.12,.24,.18,.25,
    sign===-1?palette.red:palette.blue);
 }
 // Tailplanes: canted twin fins for F/A-18, F-22, F-35 and Su-37,
 // single tall fin for Eurofighter Typhoon.
 if(id==="typhoon"){
  sheet(m,[[0,.36,-5.0],[0,3.35,-6.7],[0,2.75,-8.6],[0,.36,-8.1]],tint(c,.91),.13);
 }else{
  for(const sign of [-1,1]){
   const span=id==="f35"?.67:1.0;
   fin(m,sign*span,sign,id==="su37"?3.2:2.5,-4.3,zTail+.1,tint(c,.91));
  }
 }
 if(id==="fa18"||id==="su37"){
  mirrored(m,[[.85,.40,-6.1],[3.2,.4,-6.35],[3.4,.4,-7.7],[.82,.4,-7.6]],c,.12);
 }else if(id==="f22"){
  mirrored(m,[[.8,.36,-5.6],[3.0,.36,-6.4],[2.6,.36,-7.65],[.88,.36,-7.45]],c,.12);
 }else if(id==="f35"){
  mirrored(m,[[.71,.35,-5.35],[2.25,.35,-6.05],[1.85,.35,-7.2],[.7,.35,-7.1]],c,.11);
 }
 if(isCanard){
  const z=id==="su37"?3.05:3.5;
  mirrored(m,[[.65,.70,z+1.0],[3.25,.70,z+.22],[2.55,.70,z-1.0],
   [.65,.70,z-.78]],tint(c,1.04),.12);
 }
 canopy(m,.95,4.8,id==="fa18"?.68:.56,.49,.70,palette.window);
 // Canopy hood framing and a slim dorsal spine.
 sheet(m,[[-.10,1.22,1.10],[-.10,1.34,3.62],
  [-.10,1.20,4.65],[-.10,1.07,1.10]],palette.dark,.06);
 m.box(-.15,.76,-3.78,.30,.14,4.12,tint(c,.75));
 // F-22 has angular black intake shoulders; F-35 single large nose intake.
 if(id==="f22"){
  mirrored(m,[[.9,-.06,1.8],[2.0,-.06,.4],[1.7,-.06,-2.3],
   [.9,-.06,-1.8]],palette.dark,.08);
 }else if(id==="f35"){
  for(const x of [-1.05,.68])m.box(x,-.37,-.5,.37,.36,2.2,palette.dark);
 }else{
  for(const x of [-1.3,.78])m.box(x,-.40,-1.5,.50,.35,2.8,palette.dark);
 }
 m.box(-.11,-.17,nose-.15,.22,.25,.31,palette.dark);
}
function populate(mesh,variant){
 const id=normalize(variant);
 if(!mesh?.box||!mesh?.tri||!mesh?.quad)throw Error("3D airframe mesh builder required");
 if(id==="c172")addC172(mesh);
 else if(id==="r44")addR44(mesh);
 else genericJet(mesh,id);
 return id;
}
function buildJetParts(Mesh,id){
 const variant=normalize(id);
 if(variant==="c172"||variant==="r44")return null;
 const props=[];
 const add=(name,pivot,axis,draw)=>{
  const m=new Mesh();draw(m);
  props.push({name,pivot,axis,mesh:m.finish()});
 };
 const white=palette.metal,wing=palette.lightning;
 const span=variant==="su37"?6.7:variant==="typhoon"?6.2:variant==="f35"?4.3:5.4;
 const trailing=variant==="su37"?-4.4:-3.8;
 for(const sign of [-1,1]){
  const side=sign<0?"Left":"Right";
  add("leftAileron".replace("left",sign<0?"left":"right"),
   [sign*(span*.72),.27,trailing],1,m=>{
    const x1=sign*span,x2=sign*(span*.52);
    sheet(m,[[x1,.28,trailing-.55],[x2,.28,trailing-.22],
     [x2,.28,trailing+.10],[x1,.28,trailing+.04]],wing,.12);
   });
  add("leftFlap".replace("left",sign<0?"left":"right"),
   [sign*2.35,.26,trailing+.55],1,m=>{
    sheet(m,[[sign*1.2,.29,trailing],[sign*(span*.53),.29,trailing-.16],
     [sign*(span*.53),.29,trailing+.30],[sign*1.2,.29,trailing+.70]],white,.12);
   });
  if(variant==="typhoon"){
   // The Typhoon is a canard-delta: animate the forward all-moving
   // canards for pitch, not imaginary conventional aft elevators.
   add("elevator"+side,[sign*1.35,.70,3.45],1,m=>{
    sheet(m,[[sign*.70,.77,4.48],[sign*3.14,.77,3.72],
     [sign*2.48,.77,2.61],[sign*.70,.77,2.76]],tint(wing,1.04),.10);
   });
  }else{
   const tail=-6.8;
   add("elevator"+side,[sign*1.55,.40,tail],1,m=>{
    sheet(m,[[sign*.6,.45,tail+.8],[sign*2.8,.45,tail+.1],
     [sign*2.8,.45,tail-.7],[sign*.6,.45,tail-.54]],white,.12);
   });
  }
 }
 if(variant==="typhoon"){
  // The single vertical tail carries one yaw rudder.
  add("rudder",[0,1.75,-7.25],2,m=>{
   sheet(m,[[0,.84,-7.04],[0,2.85,-7.27],
    [0,2.57,-8.45],[0,.78,-8.28]],tint(palette.typhoon,.83),.10);
  });
 }else{
  // F/A-18, F-22, F-35 and Su-37 have two outward-canted fins.
  // Each fin has a separate rear rudder; none floats on the centreline.
  const base=variant==="f35"?.67:1;
  const height=variant==="su37"?3.2:2.5;
  const tail=variant==="su37"?-9.4:-7.8;
  for(const sign of [-1,1]){
   const side=sign<0?"Left":"Right";
   add("rudder"+side,[sign*(base+.55),.25+height*.63,tail+.88],2,m=>{
    sheet(m,[
     [sign*(base+.40),.25+height*.58,tail+1.22],
     [sign*(base+.64),.25+height*.87,tail+.92],
     [sign*(base+.82),.25+height*.70,tail+.25],
     [sign*(base+.22),.35,tail+.12]
    ],tint(palette.stealth,.92),.07);
   });
  }
 }
 return props;
}
const api=Object.freeze({IDS,LABELS,SCALE,normalize,populate,buildJetParts});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAExteriorAirframes=api;
})(typeof window!=="undefined"?window:null);
