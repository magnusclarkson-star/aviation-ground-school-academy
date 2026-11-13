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
const Livery=root?.AGSANativeFighterLivery||
 (typeof module!=="undefined"&&module.exports?require("./flight-sim-native-livery.js"):null);
const palette=Object.freeze({
 white:rgb(218,229,230),ivory:rgb(245,237,216),navy:rgb(33,94,141),
 blue:rgb(71,127,155),window:rgb(37,86,113),metal:rgb(151,162,172),
 jet:rgb(147,164,174),stealth:rgb(106,128,142),lightning:rgb(122,143,150),
 typhoon:rgb(157,172,179),su:rgb(137,162,159),dark:rgb(42,54,62),
 black:rgb(19,25,30),red:rgb(174,80,69),gold:rgb(208,179,112),
 navRed:rgb(235,56,48),navGreen:rgb(54,214,111),navWhite:rgb(236,241,226)
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
 // Recessed circular turbine exhaust: a metallic ring and a dark opening.
 // Each engine keeps its own nozzle, so twin-engine fighters remain distinct
 // from the F-35's single exhaust in rear/chase/360-degree views.
 const exhaustZ=z-1.64,hubY=-.12,outer=w*.63,inner=w*.42;
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6,b=(i+1)*Math.PI/6;
  const p=(rad,angle,depth)=>[x+Math.cos(angle)*rad,
   hubY+Math.sin(angle)*rad,depth];
  m.quad(p(outer,a,exhaustZ),p(outer,b,exhaustZ),
   p(inner,b,exhaustZ-.025),p(inner,a,exhaustZ-.025),palette.metal);
  m.tri([x,hubY,exhaustZ-.045],p(inner,a,exhaustZ-.03),
   p(inner,b,exhaustZ-.03),palette.black);
 }
}
// Thin, round, fixed tricycle wheels rather than rectangular landing-gear
// blocks. The wheel rolls in the local YZ plane around a lateral X axle.
function wheel(m,x,y,z,r,halfWidth=.14){
 // A substantial 3D tyre: central tread, rounded shoulder strips, dark
 // sidewalls and inset metal hubs. Former thin disk tyres disappeared edge-on.
 const slices=14,core=r*.39,shoulder=r*.91;
 const circle=(xx,rad,a)=>[xx,y+rad*Math.sin(a),z+rad*Math.cos(a)];
 for(let i=0;i<slices;i++){
  const a=i*Math.PI*2/slices,b=(i+1)*Math.PI*2/slices;
  // Tread width plus curved shoulders, with real thickness in X.
  m.quad(circle(x-halfWidth*.74,r,a),circle(x+halfWidth*.74,r,a),
   circle(x+halfWidth*.74,r,b),circle(x-halfWidth*.74,r,b),palette.black);
  for(const sign of [-1,1]){
   const outer=x+sign*halfWidth;
   const inner=x+sign*halfWidth*.74;
   m.quad(circle(inner,r,a),circle(outer,shoulder,a),
    circle(outer,shoulder,b),circle(inner,r,b),palette.black);
   m.tri([outer,y,z],circle(outer,shoulder,sign>0?a:b),
    circle(outer,shoulder,sign>0?b:a),palette.dark);
   const hub=outer+sign*.008;
   m.tri([hub,y,z],circle(hub,core,sign>0?a:b),
    circle(hub,core,sign>0?b:a),palette.metal);
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
 // The C172's high wings rise gently from roots towards both tips.
 // Preserve the same low-poly panel topology and full three-axis 360 view.
 mirrored(m,[[.72,.95,1.25],[7.4,1.16,.7],[7.4,1.16,-1.75],
  [.72,.95,-1.40]],c,.2);
 mirrored(m,[[.4,.9,-4.75],[2.9,.9,-5.10],[2.9,.9,-6.0],[.36,.9,-5.78]],c,.16);
 // Swept vertical tail and rudder outline (not the previous rectangular block).
 sheet(m,[[0,.52,-4.63],[0,2.26,-5.71],[0,2.49,-6.35],
  [0,.52,-6.40]],c,.16);
 sheet(m,[[0,.69,-6.08],[0,2.08,-6.08],[0,2.40,-6.38],
  [0,.70,-6.43]],strip,.08);
 // Two sloped windshield panes, a centre pillar and solid cabin roof.
 // Previously a large blue rectangular block concealed the trainer shape.
 for(const side of [-1,1]){
  sheet(m,[[side*.07,.83,1.92],[side*.71,.73,1.93],
   [side*.72,.27,3.08],[side*.07,.29,3.10]],palette.window,.025);
  sheet(m,[[side*.74,.69,1.91],[side*.78,.48,2.49],
   [side*.73,.30,3.05],[side*.70,.73,1.92]],tint(palette.window,.79),.025);
 }
 m.box(-.045,.28,2.86,.09,.55,.16,palette.metal);
 m.box(-.75,.76,.60,1.5,.13,1.39,c);
 // Distinguishing external trainer fittings, kept deliberately low-poly:
 // an under-wing pitot, a short roof radio aerial, and a wing-root
 // landing lamp. These are static illustrations, not working instruments.
 m.box(-4.31,.35,.37,.075,.60,.075,palette.metal);
 m.box(-4.34,.31,.38,.085,.09,.50,palette.dark);
 sheet(m,[[0,1.03,-.42],[0,1.66,-.71],
  [0,1.08,-1.06]],palette.dark,.035);
 m.box(-1.65,.87,1.07,.34,.15,.13,palette.ivory);
 m.box(-1.59,.92,1.19,.22,.065,.045,palette.gold);
 m.box(-.74,.73,1.86,1.48,.10,.10,palette.metal);
 // Wing struts and undercarriage help distinguish trainer from fighters.
 for(const sign of [-1,1]){
  const s=sign;
  sheet(m,[[s*.67,-.39,.15],[s*4.7,.90,-.55],[s*4.7,1.08,-.38],
   [s*.67,-.13,.50]],palette.metal,.09);
  gear(m,s*2.10,-.8,.35);
  // Tubular spring-steel strut reaches the actual wheel hub, replacing the
  // disjoint appearance of a simple floating metal sheet.
  curvedTube(m,[[s*.66,-.39,.13],[s*1.14,-.62,-.16],
   [s*2.10,-1.23,-.80]],.078,palette.metal,7);
 }
 gear(m,0,4.45,.26);
 // Nose gear fork attaches beneath the forward cowling, with an exposed
 // strut and wheel rather than a rectangular black landing-gear block.
 curvedTube(m,[[0,-.45,4.88],[0,-.81,4.62],
  [0,-1.18,4.45]],.085,palette.metal,8);
 m.box(-.26,-1.21,4.39,.52,.10,.12,tint(palette.metal,.80));
 // Trim along each wing rather than a square bar spanning the aircraft.
 mirrored(m,[[.83,1.04,-1.41],[7.25,1.25,-1.77],
  [7.24,1.25,-1.52],[.84,1.04,-1.20]],strip,.035);
 // Slim trailing-edge hinge seams divide inboard flaps from ailerons;
 // the existing animated flap and aileron meshes remain independent.
 mirrored(m,[[1.03,1.025,-1.46],[4.74,1.16,-1.60],
  [4.74,1.16,-1.53],[1.03,1.025,-1.39]],tint(c,.65),.017);
 mirrored(m,[[5.06,1.18,-1.66],[7.28,1.25,-1.76],
  [7.28,1.25,-1.70],[5.06,1.18,-1.59]],tint(c,.73),.017);
 m.box(-2.85,.87,.66,.46,.10,.08,palette.ivory);
 // Separate cabin windows and doors with realistic wing root spacing.
 for(const side of [-1,1]){
  const x=side*.90;
  sheet(m,[[x,.29,.08],[x,.72,.09],[x,.68,1.16],
   [x,.28,1.18]],palette.window,.04);
  sheet(m,[[x,.32,-1.04],[x,.74,-1.01],[x,.74,-.03],
   [x,.32,-.01]],palette.window,.04);
  m.box(x-.048,.23,.06,.096,.11,.18,palette.metal);
  m.box(x-.055,.25,-1.04,.11,.06,2.17,tint(c,.79));
  m.box(x-.055,.69,-1.04,.11,.055,2.10,tint(c,.89));
  // Port (local -X) is red; starboard (local +X) is green.
  m.box(side*7.18-.11,1.23,-1.81,.22,.11,.25,
   side<0?palette.navRed:palette.navGreen);
  sheet(m,[[side*.61,-.63,.15],[side*2.20,-1.05,-.77],
   [side*2.20,-.84,-.65],[side*.61,-.41,.35]],palette.metal,.04);
 }
 // White rearward position-light lens at the tail, with a separate
 // small red fin-top beacon and an exhaust outlet under the cowling.
 m.box(-.10,.72,-6.59,.20,.15,.19,palette.navWhite);
 m.box(-.075,2.39,-6.32,.15,.11,.16,palette.navRed);
 m.box(.39,-.55,4.30,.23,.18,.55,palette.dark);
 m.box(-.42,-.45,5.05,.84,.14,.48,palette.dark);
 m.box(-.38,-.24,5.56,.76,.12,.21,palette.metal);
 // High-contrast aircraft-specific cabin and aft-fuselage paintwork,
 // drawn directly on both sides of the curved trainer rather than
 // attaching a flat bar across the entire aircraft.
 for(const sign of [-1,1]){
  const side=sign;
  m.quad([side*.79,.13,-1.62],[side*.73,.16,-2.58],
   [side*.64,-.03,-3.62],[side*.80,-.03,-1.62],palette.navy);
  m.quad([side*.64,-.03,-3.62],[side*.56,.08,-4.72],
   [side*.39,-.09,-5.88],[side*.62,-.17,-3.62],palette.blue);
  // Painted front cowling accent follows the trainer's tapered nose.
  m.quad([side*.69,-.02,3.56],[side*.47,-.14,5.14],
   [side*.48,-.29,5.14],[side*.75,-.23,3.56],palette.navy);
 }
 const spinner=[0,-.04,6.50],spinnerZ=6.14;
 for(let j=0;j<10;j++){
  const a=j*Math.PI/5,b=(j+1)*Math.PI/5;
  m.tri([.24*Math.cos(a),-.04+.24*Math.sin(a),spinnerZ],
   [.24*Math.cos(b),-.04+.24*Math.sin(b),spinnerZ],spinner,palette.metal);
 }
}
// Lightweight round skid and support tubes. The swept cross-sections
// follow a curved path with a maximum of nine sides, including phone 2D.
function curvedTube(m,path,r,color,sides=8){
 const norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n)};
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],
  a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const rings=path.map((point,i)=>{
  const previous=path[Math.max(0,i-1)],next=path[Math.min(path.length-1,i+1)];
  const tangent=norm(next.map((x,j)=>x-previous[j]));
  const reference=Math.abs(tangent[1])>.92?[1,0,0]:[0,1,0];
  const u=norm(cross(tangent,reference)),v=norm(cross(tangent,u));
  return Array.from({length:sides},(_,j)=>{
   const a=j*2*Math.PI/sides;
   return point.map((x,k)=>x+r*(u[k]*Math.cos(a)+v[k]*Math.sin(a)));
  });
 });
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<sides;j++){
  const k=(j+1)%sides;
  m.quad(rings[i][j],rings[i][k],rings[i+1][k],rings[i+1][j],
   tint(color,.86+.14*Math.sin(j*2*Math.PI/sides)**2));
 }
 const last=rings.length-1;
 for(let j=1;j<sides-1;j++){
  m.tri(path[0],rings[0][j+1],rings[0][j],color);
  m.tri(path[last],rings[last][j],rings[last][j+1],color);
 }
}
function addR44(m){
 const ivory=palette.ivory,trim=palette.navy,glass=palette.window;
 // A four-seat cabin with a rounded windscreen, engine cowling and
 // a narrow structural tail boom. Local +Z is the helicopter nose.
 fuselage(m,[[-2.90,.54,.53,.20],[-2.12,1.04,1.08,.18],
  [-1.00,1.24,1.27,.18],[.70,1.26,1.28,.10],
  [1.85,1.14,1.09,.08],[2.50,.69,.80,.06],[2.80,.18,.24,.04]],ivory,14);
 // A slightly fuller, forward-raked bubble canopy makes the R44 distinct
 // from an aeroplane windshield, without increasing phone mesh vertices.
 canopy(m,.43,2.90,1.14,1.13,.16,glass);
 // Individual door windows, centre pillar, engine ventilation and colour trim.
 for(const sign of [-1,1]){
  const x=sign*1.20;
  sheet(m,[[x,.42,-.73],[x,1.17,-.54],[x,1.13,.43],
   [x,.45,.66]],glass,.08);
  sheet(m,[[x,.41,-1.72],[x,1.12,-1.63],[x,1.15,-.78],
   [x,.38,-.89]],glass,.07);
  m.box(x-.065,.37,-.78,.13,1.01,.10,palette.dark);
  // A distinct low-profile release handle on each cabin door is visible
  // in both the WebGL model and the matching lightweight 2D inspector.
  m.box(x-.075,.18,.41,.15,.07,.25,palette.metal);
  m.box(x-.08,-.62,-1.45,.16,.15,2.85,trim);
  // Keep the Android mesh budget unchanged: three wider vents replace
  // four narrow vents when the two functional-looking handles are added.
  for(let i=0;i<3;i++)m.box(x-.065,.15,-2.32+i*.38,.13,.08,.18,palette.dark);
 }
 // Recolour existing small light fittings instead of adding new boxes:
 // the R44 is close to its strict Android-friendly mesh budget.
 // Separate engine cooling grille, cowling vents and skid steps.
 m.box(-.80,.92,-2.22,1.60,.14,.55,palette.metal);
 m.box(-.66,.98,-2.09,1.32,.09,.28,palette.dark);
 for(const side of [-1,1]){
  const x=side*1.04;
  m.box(x-.065,-.68,-1.45,.13,.16,1.1,palette.metal);
  // Cabin-side lens: left red, right green, using the old fitting's faces.
  m.box(x-.06,.68,1.31,.12,.13,.20,
   side<0?palette.navRed:palette.navGreen);
 }
 // A slim, tapered tailcone and upper/lower vertical stabilizers.
 fuselage(m,[[-8.52,.08,.12,.56],[-7.67,.20,.20,.52],
  [-5.10,.30,.26,.49],[-2.15,.42,.37,.39]],ivory,8);
 sheet(m,[[0,.57,-8.54],[0,2.34,-8.17],
  [0,1.98,-7.34],[0,.62,-7.11]],trim,.10);
 sheet(m,[[0,.40,-8.48],[0,-.48,-8.11],
  [0,-.55,-7.84],[0,.35,-7.27]],ivory,.08);
 mirrored(m,[[.18,.68,-7.40],[1.65,.68,-7.55],
  [1.22,.68,-8.18],[.16,.68,-8.03]],ivory,.12);
 // R44-style landing structure: two long circular skid rails, four
 // slender sloping struts and two arching cross tubes. Skid tips curl
 // upwards at the nose; little shoes protect ground-contact points.
 for(const side of [-1,1]){
  const x=side*1.36;
  curvedTube(m,[[x,-1.52,-2.30],[x,-1.56,-1.50],
   [x,-1.56,1.20],[x,-1.51,2.40],[x,-1.19,2.83],
   [x,-.87,3.14]],.105,palette.dark,9);
  for(const z of [-1.50,1.16])
   curvedTube(m,[[side*.83,-.73,z],[side*1.09,-1.22,z],
    [x,-1.47,z]],.075,palette.metal,7);
  for(const z of [-1.50,-.15,1.20])
   m.box(x-.11,-1.69,z-.25,.22,.05,.50,
    z>0?palette.metal:palette.black);
 }
 for(const z of [-1.52,1.16])
  curvedTube(m,[[-1.36,-1.01,z],[0,-.91,z],
   [1.36,-1.01,z]],.085,palette.metal,8);
 // Tall exposed rotor mast and driven teetering head. These brackets
 // stay on the airframe; the two large blades rotate separately above them.
 m.box(-.16,1.18,-.52,.32,1.80,.28,palette.metal);
 // The paired diagonal mast braces make the shaft recognisable in chase and
 // side views instead of reading as a floating rotor disc on mobile.
 for(const side of [-1,1]){
  curvedTube(m,[[side*.60,1.40,-.62],[side*.28,2.11,-.51],
   [side*.15,2.67,-.45]],.048,palette.metal,6);
  m.box(side>0?.14:-.27,2.67,-.55,.13,.13,.22,palette.dark);
 }
 m.box(-.38,2.85,-.73,.76,.29,.72,palette.dark);
 m.box(-.26,3.08,-.61,.52,.12,.48,palette.gold);
 // A slim tail-rotor guard support remains behind the boom rather than
 // extending over the actual moving anti-torque rotor.
 curvedTube(m,[[-.23,.92,-7.92],[-.47,1.00,-8.13],
  [-.66,1.09,-8.21]],.04,palette.metal,6);
 // Tail boom accent, navigation lights and tail-rotor drive cover.
 m.box(-.20,.58,-6.70,.40,.085,3.40,trim);
 m.box(-.14,1.81,-8.10,.28,.11,.30,palette.red);
 // Existing rear tail-cap surface doubles as the aft white position lens.
 m.box(-.25,.79,-8.57,.50,.09,.24,palette.navWhite);
 // Tail-rotor shaft and hinge on left side of empennage.
 m.box(-.72,1.01,-8.34,.24,.30,.24,palette.metal);
 m.box(-.83,1.11,-8.27,.18,.14,.19,palette.dark);
 // Model-specific cabin and tailboom paint bands make the R44's shape
 // readable in the chase camera and low-resolution 360 inspection.
 // These are flush, low-poly surfaces so the phone mesh budget remains safe.
 for(const sign of [-1,1]){
  m.quad([sign*1.27,-.37,-1.64],[sign*1.25,-.34,-.55],
   [sign*1.20,-.47,.59],[sign*1.20,-.61,-1.68],trim);
  m.quad([sign*.36,.44,-2.30],[sign*.29,.34,-4.75],
   [sign*.22,.15,-6.72],[sign*.35,.26,-2.30],palette.blue);
  // Two distinct pieces on the engine cowling instead of a generic blob.
  m.quad([sign*1.09,.16,-2.02],[sign*1.04,.25,-1.17],
   [sign*1.02,.10,-1.18],[sign*1.09,.02,-2.02],palette.metal);
  m.quad([sign*.90,.63,-2.34],[sign*.82,.68,-2.02],
   [sign*.85,.48,-2.02],[sign*.93,.44,-2.34],palette.dark);
 }
}
// Three procedural fighter families are not licensed imported jets: add
// compact, aircraft-attached belly recesses and matching articulated doors.
// Only local unscaled coordinates are used; scalePart applies jet geometry's
// X/Z factors consistently to the source hull and all six moving doors.
function proceduralGearSlots(id){
 const gearWidth=id==="su37"?1.70:id==="f35"?1.18:1.42;
 return [
  {gearName:"noseGear",x:0,y:-.48,z:3.24,w:.62,len:.94},
  {gearName:"mainGearLeft",x:-gearWidth,y:-.23,z:-2.38,w:.64,len:1.04},
  {gearName:"mainGearRight",x:gearWidth,y:-.23,z:-2.38,w:.64,len:1.04}
 ];
}
function genericJet(m,id){
 const c=id==="f22"?palette.stealth:id==="f35"?palette.lightning:
  id==="typhoon"?palette.typhoon:id==="su37"?palette.su:palette.jet;
 const isTwin=id!=="f35";
 const rx=id==="su37"?1.72:id==="f35"?1.15:1.53;
 const nose=id==="typhoon"?9.5:id==="f22"?8.8:8.2;
 const zTail=id==="su37"?-9.4:-7.8;
 if(id==="fa18"){
  // Dedicated naval fighter profile: broad twin-engine rear barrels,
  // blended shoulders, raised cockpit, and a long narrow radar nose.
  // Unlike the old generic jet, these nine stations trace a Super Hornet.
  fuselage(m,[[-8.05,.48,.43,-.06],[-6.72,1.40,.70,.0],
   [-4.88,1.70,.78,.02],[-2.15,1.75,.79,.05],
   [-.25,1.60,.72,.08],[1.70,1.08,.64,.10],
   [3.72,.64,.55,.08],[6.00,.35,.30,.025],
   [8.33,.035,.06,-.02]],c);
 }else{
  fuselage(m,[[zTail,.33,.37,0],[-6.5,rx*.78,.70,.05],
   [-3.4,rx,.85,.04],[.5,rx*.77,.70,.03],
   [4.5,rx*.46,.44,.0],[nose,.10,.10,-.02]],c);
 }
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
    sign===-1?palette.navRed:palette.navGreen);
 }
 // Rear-facing white lens for aircraft direction identification.
 // Keep the lens within the original tail outline to preserve each
 // aircraft's overall length and existing scale-calibration tests.
 m.box(-.12,.30,zTail+.15,.24,.15,.20,palette.navWhite);
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
 // The deployed tricycle gear has visible access recesses in its
 // underside. Hinged covers are separately animated below with the wheel
 // commands; only one body recess per station is baked into the hull.
 for(const slot of proceduralGearSlots(id)){
  m.box(slot.x-slot.w/2,slot.y-.012,slot.z-slot.len/2,
   slot.w,.018,slot.len,palette.dark);
  for(const edge of [-1,1]){
   m.box(slot.x+edge*(slot.w/2-.02)-.014,slot.y-.018,
    slot.z-slot.len/2,.028,.022,slot.len,tint(c,.82));
  }
 }
 // Typhoon and Su-37 canards are animated separately below. Do not also
 // bake fixed copies into the hull; that creates overlapping surfaces.
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
 // Aircraft-specific intake lips and exhaust fairings add visible
 // silhouettes in side and rear views without changing the flight physics.
 if(id==="f22"){
  // Wide flattened stealth intakes with broad rectangular aft fairings.
  for(const sign of [-1,1]){
   sheet(m,[[sign*.86,-.14,1.86],[sign*1.76,-.14,1.24],
    [sign*1.70,-.34,.46],[sign*.94,-.34,.88]],tint(c,.78),.065);
   m.box(sign*.65-.45,-.57,-7.57,.90,.14,.37,tint(c,.67));
   m.box(sign*.65-.43,-.41,-7.52,.86,.10,.24,palette.black);
  }
 }else if(id==="f35"){
  // Diverterless side-intake shoulders and single rear nozzle fairing.
  mirrored(m,[[.72,-.12,2.01],[1.28,-.05,1.41],
   [1.20,-.29,.25],[.80,-.30,.79]],tint(c,.71),.07);
  m.box(-.44,-.50,-7.54,.88,.12,.38,tint(c,.66));
 }else if(id==="typhoon"){
  // Single chin intake beneath the sharp nose of the canard delta.
  sheet(m,[[-.83,-.49,2.52],[.83,-.49,2.52],
   [.62,-.64,.76],[-.62,-.64,.76]],palette.dark,.09);
  m.box(-.83,-.54,2.49,1.66,.10,.11,tint(c,.80));
  // Additional intake side lips and central splitter distinguish the
  // Typhoon's single ventral intake from the twin side intakes on other jets.
  for(const sign of [-1,1]){
   sheet(m,[[sign*.83,-.49,2.52],[sign*.65,-.69,1.55],
    [sign*.62,-.64,.76],[sign*.84,-.40,1.17]],tint(c,.75),.045);
  }
  m.box(-.055,-.68,1.04,.11,.075,1.10,tint(c,.64));
  // Crisp centreline fin cap remains attached to the existing single fin.
  sheet(m,[[0,3.35,-6.7],[0,3.12,-7.35],[0,2.75,-8.6],
   [0,2.99,-7.05]],tint(c,.77),.018);
 }else if(id==="su37"){
  // Su-37's wide-spaced inlet trunks, full-span control edges and separated
  // exhaust fairings are static exterior details, not flight-force changes.
  for(const sign of [-1,1]){
   const x=sign*1.15;
   m.box(x-.39,-.54,-1.28,.78,.10,2.43,tint(c,.70));
   sheet(m,[[sign*1.26,.38,-2.23],[sign*4.67,.39,-2.83],
    [sign*4.40,.39,-3.10],[sign*1.28,.38,-2.66]],tint(c,.66),.023);
   // Separate canard leading edge and dark hinge seam, positioned ahead of
   // the main wing rather than floating above the centre fuselage.
   sheet(m,[[sign*.69,.71,4.08],[sign*3.08,.71,3.31],
    [sign*2.73,.71,3.10],[sign*.70,.71,3.42]],tint(c,.90),.028);
   sheet(m,[[sign*.76,.73,3.38],[sign*2.63,.73,3.09],
    [sign*2.40,.73,3.02],[sign*.76,.73,3.31]],palette.dark,.012);
   // Independent twin nozzle shrouds at the aft ends of each nacelle:
   // the centres remain separated at +/-1.15 local X.
   m.box(x-.35,-.51,-7.57,.70,.15,.20,tint(c,.61));
   sheet(m,[[x-.31,-.38,-7.52],[x+.31,-.38,-7.52],
    [x+.24,-.46,-7.80],[x-.24,-.46,-7.80]],palette.dark,.035);
  }
 }else if(id==="fa18"){
  // Super Hornet shoulder intakes and sharply swept LEX fairings.
  // These are attached to the exterior only, not an invisible control rig.
  for(const sign of [-1,1]){
   sheet(m,[[sign*1.01,-.12,1.49],[sign*1.67,-.12,1.15],
    [sign*1.56,-.44,-.06],[sign*1.01,-.44,.06]],tint(c,.70),.065);
   m.box(sign*1.05-.32,-.54,.98,.64,.10,.16,tint(c,1.04));
   // Long swept leading-edge extension visually joins the wide wing root
   // to the fuselage, removing the detached slab-wing appearance.
   sheet(m,[[sign*.82,.38,3.37],[sign*1.65,.37,2.10],
    [sign*2.48,.35,.82],[sign*1.12,.36,.74]],tint(c,.91),.045);
   // Twin canted fin roots and trailing edge panel make the two vertical
   // stabilizers separately recognizable in oblique rear views.
   sheet(m,[[sign*1.0,.37,-4.38],[sign*1.48,2.63,-5.84],
    [sign*1.86,2.17,-7.42],[sign*1.07,.35,-7.30]],
    tint(c,.86),.07);
  }
  // Recognisable naval-fighter wing-fold seams, broad wing roots and
  // two separate round engine exhaust collars, rather than the old
  // generic square-nozzle boxes.
  for(const sign of [-1,1]){
   sheet(m,[[sign*5.47,.43,-.04],[sign*5.61,.44,-.02],
    [sign*5.06,.43,-4.01],[sign*4.92,.43,-4.08]],
    tint(c,.51),.012);
   sheet(m,[[sign*1.61,.41,-2.24],[sign*5.62,.41,-2.88],
    [sign*5.48,.42,-3.10],[sign*1.56,.41,-2.48]],
    tint(c,.66),.014);
   // Rounded exhaust rim, aft dark throat and spaced nacelle.
   const x=sign*.82,z=-7.83,r=.40;
   for(let k=0;k<14;k++){
    const a=k*Math.PI*2/14,b=(k+1)*Math.PI*2/14;
    const at=(rr,ang,zz)=>[x+rr*Math.cos(ang),-.07+rr*Math.sin(ang),zz];
    m.quad(at(r,a,z),at(r,b,z),at(r*.80,b,z-.10),
     at(r*.80,a,z-.10),palette.metal);
    m.tri([x,-.07,z-.12],at(r*.79,b,z-.11),
     at(r*.79,a,z-.11),palette.black);
   }
  }
  // Carrier-style centreline arresting hook: a short, downward-curving
  // under-tail shaft terminating below and behind the two jet nozzles.
  // Static visual equipment only: no arresting-wire physics is implied.
  curvedTube(m,[[0,-.61,-5.58],[0,-.86,-6.41],
   [0,-1.00,-7.19],[0,-1.13,-7.53]],.053,palette.metal,7);
  m.box(-.17,-1.19,-7.75,.34,.12,.35,palette.dark);
 }
 m.box(-.11,-.17,nose-.15,.22,.25,.31,palette.dark);
}
// Dedicated F/A-18 Super Hornet exterior. Do not reuse genericJet(): that
// combined inherited fuselage, fins and exhausts with the new shape and made
// two aircraft appear superimposed. Keep the same local-coordinate system.
function addFA18(m){
 const skin=palette.jet,edge=tint(skin,.83),trim=tint(skin,.64);
 // Single continuous long nose, forward cockpit and broad twin-engine aft hull.
 fuselage(m,[[-8.07,.37,.39,-.08],[-6.90,1.30,.65,0],
  [-4.75,1.63,.74,.02],[-2.25,1.65,.73,.05],
  [-.28,1.42,.68,.06],[1.45,1.10,.61,.07],
  [3.48,.64,.50,.03],[5.48,.37,.30,-.01],
  [7.55,.15,.15,-.02],[8.29,.02,.035,-.02]],skin,14);
 // F/A-18 distinctive trapezoidal wings, rear sweep and blended LEX.
 mirrored(m,[[1.10,.27,1.35],[3.15,.28,.19],
  [7.46,.29,-.76],[6.06,.30,-4.54],[1.40,.31,-3.85]],skin,.17);
 mirrored(m,[[.98,.34,3.58],[2.20,.33,2.20],
  [3.01,.32,.18],[1.25,.33,-.54]],edge,.09);
 // Fold seams at the outer wing panels, plus rear control-edge divisions.
 for(const sign of [-1,1]){
  sheet(m,[[sign*5.27,.41,-.27],[sign*5.40,.41,-.31],
   [sign*4.94,.42,-4.14],[sign*4.80,.42,-4.22]],trim,.013);
  sheet(m,[[sign*2.96,.42,-2.84],[sign*5.85,.42,-3.17],
   [sign*5.72,.42,-3.34],[sign*2.93,.42,-3.01]],edge,.014);
  m.box(sign*7.32-.075,.21,-.87,.15,.10,.20,
   sign<0?palette.navRed:palette.navGreen);
 }
 // Tailplanes and two visibly outward-canted fixed stabilizers. The rudders
 // remain separate animated surfaces from buildJetParts; no duplicate fins.
 mirrored(m,[[.73,.35,-6.02],[3.07,.36,-6.31],
  [3.26,.36,-7.55],[.82,.35,-7.48]],skin,.11);
 for(const sign of [-1,1])
  sheet(m,[[sign*.97,.32,-4.42],[sign*1.46,2.54,-5.80],
   [sign*1.68,2.06,-6.66],[sign*1.12,.34,-6.94]],edge,.105);
 // One pair of nacelles and one set of round exhausts. Do not add a
 // second nozzle layer after the engine() builder's original exhaust rims.
 for(const x of [-.82,.82])engine(m,x,-5.74,.70,palette.dark);
 // Dorsal spine and canopy at the forward pilot station.
 canopy(m,1.10,4.52,.69,.49,.76,palette.window);
 sheet(m,[[-.10,1.20,1.10],[-.08,1.38,3.30],
  [-.08,1.20,4.50],[-.10,1.13,1.10]],palette.dark,.04);
 m.box(-.14,.77,-3.72,.28,.12,4.12,trim);
 // Two shoulder intakes, recessed mouths and their boundary lips.
 for(const sign of [-1,1]){
  sheet(m,[[sign*1.14,-.12,1.22],[sign*1.66,-.12,.91],
   [sign*1.52,-.42,-.58],[sign*1.03,-.42,-.12]],trim,.075);
  m.box(sign*1.03-.22,-.48,.64,.44,.13,.18,palette.dark);
 }
 // Three dark wheel wells stay in the hull; the single functional landing
 // gear and individual doors are generated by buildJetParts, not baked here.
 for(const slot of proceduralGearSlots("fa18"))
  m.box(slot.x-slot.w/2,slot.y-.015,slot.z-slot.len/2,
   slot.w,.018,slot.len,palette.dark);
 // Carrier arresting-hook geometry is attached only once beneath the tail.
 curvedTube(m,[[0,-.59,-5.63],[0,-.84,-6.39],
  [0,-1.00,-7.11],[0,-1.14,-7.48]],.047,palette.metal,7);
 m.box(-.16,-1.18,-7.65,.32,.11,.25,palette.dark);
 m.box(-.08,-.14,8.05,.16,.17,.22,palette.dark);
 // This deliberately repaints only the muted main exterior palette, not
 // glass, lights or exhausts. The original model remains fully animatable.
 if(Livery)Livery.paintMesh("fa18",m);
}
function populate(mesh,variant){
 const id=normalize(variant);
 if(!mesh?.box||!mesh?.tri||!mesh?.quad)throw Error("3D airframe mesh builder required");
 if(id==="c172")addC172(mesh);
 else if(id==="r44")addR44(mesh);
 else if(id==="fa18")addFA18(mesh);
 else genericJet(mesh,id);
 return id;
}
function buildJetParts(Mesh,id){
 const variant=normalize(id);
 if(variant==="c172"||variant==="r44")return null;
 const props=[];
 const add=(name,pivot,axis,draw,meta=null)=>{
  const m=new Mesh();draw(m);
  props.push({name,pivot,axis,mesh:m.finish(),...(meta||{})});
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
   if(variant==="su37"){
    // The Su-37 retains aft elevators AND independently moving foreplanes.
    // Use the original forward-canard planform in one animated mesh only.
    add("canard"+side,[sign*1.25,.70,3.45],1,m=>{
     sheet(m,[[sign*.65,.70,4.05],[sign*3.25,.70,3.27],
      [sign*2.55,.70,2.05],[sign*.65,.70,2.27]],
      tint(palette.su,1.04),.12);
    });
   }
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
 // Retractable tricycle landing gear is part of the individual jet model,
 // not permanently attached to the fuselage while airborne. The wheel, hub
 // and strut pivot together under animation from the flight-system model.
 add("noseGear",[0,-.36,3.25],1,m=>{
  curvedTube(m,[[0,-.37,3.25],[0,-.86,3.20],[0,-1.18,3.12]],
   .085,palette.metal,8);
  wheel(m,0,-1.21,3.12,.30,.16);
  m.box(-.13,-.55,3.23,.26,.12,.30,tint(palette.dark,1.15));
 });
 const gearWidth=proceduralGearSlots(variant)[2].x;
 for(const sign of [-1,1]){
  const side=sign<0?"Left":"Right",x=sign*gearWidth;
  add("mainGear"+side,[x,-.30,-2.32],1,m=>{
   curvedTube(m,[[x,-.32,-2.32],[x+sign*.05,-.88,-2.34],
    [x+sign*.06,-1.13,-2.41]],.105,palette.metal,8);
   wheel(m,x+sign*.06,-1.16,-2.43,.38,.22);
   // A slim articulated drag link helps the gear read as landing hardware
   // rather than an unrelated hanging black cylinder.
   curvedTube(m,[[x,-.52,-2.30],[x+sign*.23,-.88,-2.06],
    [x+sign*.05,-1.05,-2.35]],.035,palette.metal,6);
   m.box(x-.15,-.36,-2.42,.30,.10,.42,tint(palette.dark,1.12));
  });
 }
 // Six individual longitudinally hinged doors, rather than a separate
 // generic gear image. Each door is full-size and follows its corresponding
 // nose/left/right undercarriage command in the WebGL renderer.
 const paint=variant==="su37"?palette.su:
  variant==="typhoon"?palette.typhoon:
  variant==="fa18"?palette.jet:
  variant==="f22"?palette.stealth:palette.lightning;
 for(const slot of proceduralGearSlots(variant)){
  for(const sign of [-1,1]){
   const suffix=sign<0?"Left":"Right";
   const pivotX=slot.x+sign*slot.w/2;
   const x0=sign<0?pivotX+.012:slot.x+.010;
   const panelWidth=slot.w/2-.024;
   add(slot.gearName+"Door"+suffix,[pivotX,slot.y,slot.z],3,m=>{
    m.box(x0,slot.y-.038,slot.z-slot.len/2+.024,
     panelWidth,.027,slot.len-.048,tint(paint,.91));
    m.box(x0,slot.y-.042,slot.z+slot.len/2-.061,
     panelWidth,.032,.035,tint(palette.dark,1.12));
   },{gearName:slot.gearName,doorSide:sign});
  }
 }
 if(variant==="fa18"){
  // The F/A-18 exterior uses a dedicated hull. Do not attach the generic
  // fighter's control surfaces to it: their old wing and tail outlines were
  // clearly visible over the dedicated Super Hornet body.
  for(const part of props){
   const m=new Mesh();
   const isLeft=/^left|Left$/.test(part.name),sign=isLeft?-1:1;
   if(/^(left|right)Aileron$/.test(part.name)){
    sheet(m,[[sign*4.57,.31,-3.63],[sign*6.12,.31,-3.77],
      [sign*6.02,.31,-4.40],[sign*4.38,.31,-4.07]],
      tint(palette.jet,.78),.065);
    part.pivot=[sign*5.18,.31,-3.88];
   }else if(/^(left|right)Flap$/.test(part.name)){
    sheet(m,[[sign*1.45,.31,-3.40],[sign*4.36,.31,-3.70],
      [sign*4.21,.31,-4.05],[sign*1.48,.31,-3.79]],
      tint(palette.jet,.85),.07);
    part.pivot=[sign*2.7,.31,-3.69];
   }else if(/^elevator(?:Left|Right)$/.test(part.name)){
    sheet(m,[[sign*.83,.36,-6.65],[sign*2.73,.36,-6.83],
      [sign*3.06,.36,-7.46],[sign*.86,.36,-7.34]],
      tint(palette.jet,.85),.085);
    part.pivot=[sign*1.71,.36,-7.02];
   }else if(/^rudder(?:Left|Right)$/.test(part.name)){
    sheet(m,[[sign*1.30,1.05,-5.75],[sign*1.48,2.22,-6.13],
      [sign*1.67,1.94,-6.62],[sign*1.36,.91,-6.70]],
      tint(palette.jet,.77),.045);
    part.pivot=[sign*1.45,1.46,-6.25];
   }else continue;
   part.mesh=m.finish();
  }
 }
 return props;
}
// Lightweight wheel-well liners and hinged gear-door panels for the genuine
// imported FlightGear fighters. Coordinates are source-mesh metres, NOT the
// differently scaled procedural jet dimensions. Keep these separate from
// the licensed model itself so its wing/tail/control geometry is unchanged.
function buildImportedGearDoors(Mesh,id){
 // Source Typhoon already has four original doors: never duplicate them.
 if(id!=="f22"&&id!=="f35"&&id!=="su37")return null;
 const f35=id==="f35",su37=id==="su37";
 const paint=f35?[.51,.57,.61]:su37?[.56,.60,.64]:[.62,.69,.73];
 const lip=[.28,.34,.38],wellDark=[.075,.095,.115];
 // Source fuselage underside was inspected at all three gear stations:
 // F-35B nose minY=-1.40, main minY=-1.54; F-22 nose/main minY=-1.70.
 // Panels sit just beneath those surfaces rather than on the dorsal skin.
 const slots=su37?[
  // Su-37 genuine source skin: nose bay underside approximately -.08m,
  // left/right main bay undersides approximately -.91m.
  {name:"noseGear",x:0,y:-.14,z:2.50,w:.62,len:.94},
  {name:"mainGearLeft",x:-1.66,y:-.96,z:-3.20,w:.77,len:1.08},
  {name:"mainGearRight",x:1.66,y:-.96,z:-3.20,w:.77,len:1.08}
 ]:f35?[
  {name:"noseGear",x:0,y:-1.45,z:3.75,w:.84,len:1.06},
  {name:"mainGearLeft",x:-1.75,y:-1.58,z:-1.72,w:.88,len:1.10},
  {name:"mainGearRight",x:1.75,y:-1.58,z:-1.72,w:.88,len:1.10}
 ]:[
  {name:"noseGear",x:0,y:-1.75,z:3.65,w:.78,len:.84},
  {name:"mainGearLeft",x:1.43,y:-1.75,z:-2.41,w:.77,len:.96},
  {name:"mainGearRight",x:-1.43,y:-1.75,z:-2.41,w:.77,len:.96}
 ];
 const wells=new Mesh(),doors=[];
 for(const slot of slots){
  const z0=slot.z-slot.len/2;
  // Recess remains exposed while the two doors hang open. A slim rim shows
  // the outline but does not intersect the original source wheels.
  wells.box(slot.x-slot.w/2,slot.y+.012,z0,slot.w,.012,slot.len,wellDark);
  for(const side of [-1,1]){
   const outerX=slot.x+side*slot.w/2;
   const width=slot.w/2-.015;
   const x0=side>0?slot.x+.009:outerX+.006;
   const m=new Mesh();
   m.box(x0,slot.y-.030,z0+.035,width,.026,slot.len-.070,paint);
   // The darker trailing strip remains part of the same rigid panel.
   m.box(x0,slot.y-.032,z0+slot.len-.092,width,.029,.040,lip);
   doors.push({gearName:slot.name,side,pivot:[outerX,slot.y,slot.z],
    mesh:m.finish()});
  }
 }
 return {wells:wells.finish(),doors,slots};
}
function importedGearDoorAngle(gearAngle,side){
 // Doors remain open while the wheels descend, then close in the final
 // portion of retraction. Smoothstep prevents a visible last-frame snap.
 const progress=Math.max(0,Math.min(1,(Number(gearAngle)||0)/1.53));
 const t=Math.max(0,Math.min(1,(progress-.48)/.48));
 const closed=t*t*(3-2*t);
 return Math.sign(side)*1.10*(1-closed);
}
const api=Object.freeze({IDS,LABELS,SCALE,normalize,populate,buildJetParts,buildImportedGearDoors,importedGearDoorAngle});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAExteriorAirframes=api;
})(typeof window!=="undefined"?window:null);
