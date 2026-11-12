import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
const require=createRequire(import.meta.url);
const Three=require("../flight-sim-3d.js");
const M=require("../flight-sim-model.js");
const PadDetail=require("../flight-sim-helipad-detail.js");
const Scenery=require("../flight-sim-scenery.js");
const Countryside=require("../flight-sim-countryside.js");
const Clouds=require("../flight-sim-clouds.js");
const C172Source=require("../flight-sim-c172-airframe.js");
const R44Source=require("../flight-sim-r44-airframe.js");

// Regression guard: the GPU lighting must follow aircraft attitude and hinge
// rotation, not illuminate the fixed untransformed original mesh normals.
const vertexSource=readFileSync(new URL("../flight-sim-3d.js",import.meta.url),"utf8");
assert.match(vertexSource,/normal=rotatePart\(normal,uPartAxis,uPartAngle\)/,
 "hinged propeller, rotors and flight controls rotate their lighting normals");
assert.match(vertexSource,/normal=vec3\(normal\.x\*c\+normal\.y\*s/,
 "aircraft roll rotates outward-facing wing normals");
assert.match(vertexSource,/normal=vec3\(normal\.x,normal\.y\*c\+normal\.z\*s/,
 "aircraft pitch rotates surface normals");
assert.match(vertexSource,/normal=vec3\(normal\.x\*c\+normal\.z\*s/,
 "aircraft yaw rotates surface normals");
assert.match(vertexSource,/dot\(normalize\(normal\)/,
 "directional light uses the transformed normal, not the source normal");
// The Super Hornet's new under-tail hook and canted twin-tail detailing
// belong only to FA18 exterior geometry and remain below the body.
const hornet=Three.buildVehicle("fa18");
const typhoonControl=Three.buildVehicle("typhoon");
const hasVertex=(mesh,x,y,z,tol=.015)=>{
 for(let i=0;i<mesh.positions.length;i+=3)
  if(Math.abs(mesh.positions[i]-x)<tol&&
     Math.abs(mesh.positions[i+1]-y)<tol&&
     Math.abs(mesh.positions[i+2]-z)<tol)return true;
 return false;
};
const hasRegion=(mesh,check)=>{
 for(let i=0;i<mesh.positions.length;i+=3)
  if(check(mesh.positions[i],mesh.positions[i+1],mesh.positions[i+2]))
   return true;
 return false;
};
// Tube vertices ring the hook's centreline; check an actual hook shoe
// corner rather than assuming its centreline is a triangle vertex.
assert.ok(hasVertex(hornet,-.17,-1.19,-7.75),
 "F/A-18 must include the under-tail hook shoe geometry");
assert.ok(hasRegion(hornet,(x,y,z)=>x>1.38&&y>2.5&&z< -5.7),
 "F/A-18 must include right-hand canted tail detail");
assert.ok(hasRegion(hornet,(x,y,z)=>x< -1.38&&y>2.5&&z< -5.7),
 "F/A-18 must include left-hand canted tail detail");
assert.ok(!hasVertex(typhoonControl,-.17,-1.19,-7.75),
 "FA18 hook shoe must not leak onto other jets");
assert.ok(hornet.vertices<30000,
 "F/A-18 visible detail must remain within the mobile mesh budget");

const empty=new Three.Mesh();
assert.equal(empty.finish().triangles,0);
empty.tri([0,0,0],[1,0,0],[0,1,0],[.1,.3,.4]);
empty.quad([0,0,0],[1,0,0],[1,0,1],[0,0,1],[.2,.3,.4]);
empty.box(0,0,0,2,3,4,[.5,.6,.7]);
empty.cone(2,0,4,1.5,7,[.2,.7,.3],6);
empty.cloud(0,100,500,20);
const basic=empty.finish();
assert.equal(basic.triangles,1+2+12+6+8);
assert.equal(basic.vertices,basic.triangles*3);
assert.equal(basic.positions.length,basic.vertices*3);
assert.equal(basic.normals.length,basic.positions.length);
assert.equal(basic.colors.length,basic.positions.length);
assert.ok([...basic.positions].every(Number.isFinite),"geometry must be finite");
assert.ok([...basic.normals].every(Number.isFinite),"normals must be finite");
assert.ok([...basic.colors].every(x=>x>=0&&x<=1),"colors are normalized");
assert.ok(basic.positions.some(v=>v===500),"cloud has meaningful world depth");

const runway=Three.buildWorld("airplane"),pad=Three.buildWorld("helicopter");
for(const mesh of [runway,pad]){
 assert.ok(mesh.vertices>5000&&mesh.vertices<130000,"mobile geometry budget");
 assert.equal(mesh.vertices,mesh.triangles*3);
 assert.ok(mesh.positions.some(v=>v>4500),"terrain has far depth");
 assert.ok(mesh.positions.some(v=>v< -1300),"terrain spreads to both sides");
 assert.ok(mesh.positions.some(v=>v>170),"distant 3D terrain rises above the landing field");
 assert.equal(mesh.colors.length,mesh.positions.length);
 assert.equal(mesh.normals.length,mesh.positions.length);
}

// Sky geometry stays separate from static runways/helipad, and it is
// translated by one GPU uniform as simulated weather changes: no allocations
// or world-mesh regeneration per render frame.
assert.equal(Clouds.clouds.length,35);
assert.equal(new Set(Clouds.clouds.map(c=>c.id)).size,35);
assert.ok(Object.isFrozen(Clouds.clouds));
const cloudLayer=Three.buildCloudLayer();
assert.ok(cloudLayer.triangles>=450&&cloudLayer.triangles<=800,
 "small distinct sky mesh respects Android GPU triangle budget");
assert.ok(cloudLayer.positions.some(v=>v>700),
 "cloud height resides in the sky, not embedded in runway terrain");
assert.ok(cloudLayer.positions.every(Number.isFinite));
assert.equal(cloudLayer.colors.length,cloudLayer.positions.length);
assert.deepEqual(Clouds.drift(10,0,0),{x:11,z:4.2},
 "calm simulated air still moves background cloud weather gently");
const crosswindCloud=Clouds.drift(10,4,-3);
assert.ok(Math.abs(crosswindCloud.x-39.8)<1e-10&&
 Math.abs(crosswindCloud.z+17.4)<1e-10,
 "wind controls the world-anchored direction of sky motion");
assert.deepEqual(Clouds.drift(1000,4,-3,true),{x:0,z:0},
 "reduced motion freezes synthetic cloud animation without stopping flight");
assert.deepEqual(Clouds.drift(NaN,Infinity,-Infinity),{x:0,z:0});
for(const id of ["c172","r44"]){
 const nav=Three.buildExteriorPositionLights(id);
 const beacon=Three.buildExteriorStrobe(id);
 assert.equal(nav.triangles,36,
  id+" has three compact red, green, and white exterior light lenses");
 assert.equal(beacon.triangles,12,
  id+" has one low-poly white external beacon");
 assert.ok(nav.positions.every(Number.isFinite)&&beacon.positions.every(Number.isFinite));
 const xs=Array.from(nav.positions).filter((_,i)=>i%3===0);
 assert.ok(Math.min(...xs)<0&&Math.max(...xs)>0,
  id+" side marker lights belong on opposite sides of its own fuselage");
 const colors=Array.from(nav.colors);
 let red=false,green=false,white=false;
 for(let i=0;i<colors.length;i+=3){
  const [r,g,b]=colors.slice(i,i+3);
  if(r>.8&&g<.40&&b<.40)red=true;
  if(g>.80&&r<.45&&b<.65)green=true;
  if(r>.8&&g>.8&&b>.7)white=true;
 }
 assert.ok(red&&green&&white,id+" nav light colours match port, starboard and rear");
}
assert.throws(()=>Three.buildExteriorPositionLights("f22"),/require a trainer or R44/);

/* Source model fixture test: all external lamp centres MUST be vertices
   of the actually imported C172/R44 hull, never floating meters away at
   the old illustrative airframe's coordinates. This catches the exact
   detached-light bug seen in 360-degree R44/C172 browser screenshots. */
const sourceModels={
 c172:C172Source.parseC172GLB((()=>{
  const b=readFileSync(new URL("../assets/aircraft/c172-molen-skyhawk.glb",import.meta.url));
  return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
 })()),
 r44:R44Source.parseR44GLB((()=>{
  const b=readFileSync(new URL("../assets/aircraft/r44-molen-raven-ii.glb",import.meta.url));
  return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
 })())
};
for(const [id,source] of Object.entries(sourceModels)){
 const stationary=source.primitives.filter(p=>(p.partAxis||0)===0);
 const stations=Three.exteriorLightStations(id,source.primitives);
 const strobe=Three.exteriorStrobeStation(id,source.primitives);
 assert.equal(stations.length,3);
 const attached=point=>stationary.some(p=>{
  const a=p.positions;
  for(let i=0;i<a.length;i+=3)
   if(Math.abs(a[i]-point[0])<.00001&&
    Math.abs(a[i+1]-point[1])<.00001&&
    Math.abs(a[i+2]-point[2])<.00001)return true;
  return false;
 });
 assert.ok(stations.every(attached),id+" red/green/rear lamp stations must lie exactly on imported aircraft surface");
 assert.ok(attached(strobe),id+" beacon must be attached to imported cabin, not floating above it");
 assert.ok(stations[2][2]>=source.bounds[4]-.001&&stations[2][2]<=source.bounds[5]+.001,
  id+" rear marker must remain inside real aft fuselage bounds");
 assert.equal(Three.buildExteriorPositionLights(id,source.primitives).triangles,36,
  id+" imported surface uses one compact 12-triangle lens at each of three stations");
 assert.ok(Three.buildExteriorStrobe(id,source.primitives).triangles===12);
}
const r44Rear=Three.exteriorLightStations("r44",sourceModels.r44.primitives)[2];
assert.ok(Number.isFinite(r44Rear[2])&&r44Rear[2]>=sourceModels.r44.bounds[4],
 "R44 rear marker must be on the actual loaded tail geometry, not past its bounds");
assert.ok(r44Rear[1]>-.12&&r44Rear[2]< -2.6,
 "R44 aft lamp must attach to a raised tail surface, never the lower fin tip");

assert.equal(Three.exteriorStrobePulse(0),1);
assert.equal(Three.exteriorStrobePulse(.12),0);
assert.equal(Three.exteriorStrobePulse(.20),1);
assert.equal(Three.exteriorStrobePulse(.70),0);
assert.equal(Three.exteriorStrobePulse(120,true),.38);

assert.deepEqual(PadDetail.rings,[9,21],"the 3D and fallback 2D reference rings share the same radii");
assert.equal(PadDetail.pylons.length,6);
assert.equal(PadDetail.referenceLines.length,12);
assert.equal(PadDetail.buildings.length,2);
assert.equal(PadDetail.fence.length,13);
for(const ring of PadDetail.rings){
 const sections=PadDetail.ringSegments(ring);
 assert.equal(sections.length,40);
 assert.ok(sections.every(q=>[q.ax,q.az,q.bx,q.bz].every(Number.isFinite)));
 assert.ok(sections.every(q=>Math.abs(Math.hypot(q.ax,q.az)-ring)<1e-8));
}
const hasPoint=(mesh,x,y,z)=>{
 for(let i=0;i<mesh.positions.length;i+=3){
  if(Math.abs(mesh.positions[i]-x)<.015&&
   Math.abs(mesh.positions[i+1]-y)<.015&&
   Math.abs(mesh.positions[i+2]-z)<.015)return true;
 }
 return false;
};
assert.equal(Countryside.fields.length,20);
assert.equal(Countryside.farmTracks.length,20);
assert.equal(Countryside.towers.length,3);
assert.equal(Countryside.hedgerows.length,8);
assert.ok(Countryside.farmsteads.length>=9);
assert.equal(Countryside.trees.length,60);
for(const farm of Countryside.farmsteads){
 const floor=Countryside.terrainHeight(farm.x,farm.z)+.14;
 for(const world of [runway,pad]){
  assert.ok(hasPoint(world,farm.x,floor,farm.z),
   "farmstead ground wall is fixed in the common WebGL world");
  assert.ok(hasPoint(world,farm.x,floor+farm.h,farm.z),
   "farmstead has real 3D wall height, not a flat picture");
  assert.ok(hasPoint(world,farm.x+farm.w/2,
   floor+farm.h+Math.min(farm.w,farm.d)*.27,farm.z),
   "farmstead has a real pitched roof silhouette in both worlds");
 }
 assert.ok(Math.abs(farm.x)>400,
  "farmstead must not obstruct the fictional active runway");
}
const hedge=Countryside.hedgerows[0];
const hedgeY=Countryside.terrainHeight(hedge.x,hedge.z)+.14;
for(const world of [runway,pad]){
 assert.ok(hasPoint(world,hedge.x,hedgeY,hedge.z),
  "fixed rural hedges appear at the same real local position in both 3D worlds");
 assert.ok(hasPoint(world,hedge.x,hedgeY+hedge.h,hedge.z),
  "the hedge is genuinely raised 3D geometry, not an aerial ground texture");
}
assert.ok(Countryside.hedgerows.every(h=>
  Math.abs(h.x)>350&&h.w>50&&h.h>=4),
 "hedgerows must be outside the touchdown runway and pad and tall enough to see");
const landmark=Countryside.towers[0],landBase=Countryside.terrainHeight(landmark.x,landmark.z);
assert.ok(hasPoint(runway,landmark.x-landmark.radius*.7-.25,
 landBase,landmark.z-landmark.radius*.7-.25),
 "WebGL world includes the north-tank support at its permanent terrain coordinate");
assert.ok(hasPoint(pad,landmark.x-landmark.radius*.7-.25,
 landBase,landmark.z-landmark.radius*.7-.25),
 "Helipad world shares the same downwind visual landmarks");
const firstCrop=Countryside.fields[0];
const terrainY=Countryside.terrainHeight(firstCrop.x,firstCrop.z)+.14;
assert.ok(hasPoint(runway,firstCrop.x,terrainY,firstCrop.z),
 "WebGL runway world contains shared fixed-coordinate crop fields");
assert.ok(hasPoint(pad,firstCrop.x,terrainY,firstCrop.z),
 "helipad scene retains the same geographic landmarks");
const firstTrack=Countryside.trackCorners(Countryside.farmTracks[0]);
assert.equal(firstTrack.length,4);
assert.ok(firstTrack.flat().every(Number.isFinite));
const firstPylon=PadDetail.pylons[0];
assert.ok(hasPoint(pad,firstPylon.x-1.3,.16,firstPylon.z-1.3),
 "3D world includes the same fixed-world pylon footprint as mobile scenery");
assert.ok(!hasPoint(runway,firstPylon.x-1.3,.16,firstPylon.z-1.3),
 "runway scenery does not inherit helicopter-only markers");
const heliPosition=M.makeState("helicopter");
Object.assign(heliPosition,{altitudeM:6,headingDeg:0,xM:0,zM:0});
const marker=PadDetail.pylons[1];
const original=Scenery.project(heliPosition,marker.x,marker.height,marker.z);
const lateral=Scenery.project({...heliPosition,xM:10},marker.x,marker.height,marker.z);
const yawed=Scenery.project({...heliPosition,headingDeg:30},marker.x,marker.height,marker.z);
assert.ok(original&&lateral&&yawed);
assert.ok(lateral.x<original.x-50,"helicopter lateral movement shifts fixed landmark left");
assert.ok(Math.abs(yawed.x-original.x)>100,
 "turning helicopter rotates the marker across the outside view");
assert.ok(PadDetail.pylons.every(p=>Math.hypot(p.x,p.z)>35),
 "near markers remain outside the landing pad and rotor disc");

assert.notEqual(runway.triangles,pad.triangles,"runway/helipad are different 3D places");
assert.throws(()=>Three.buildWorld("submarine"),/Unknown 3D/);
assert.throws(()=>Three.buildVehicle("balloon"),/Unknown 3D/);
const airplane=Three.buildVehicle("airplane"),helicopter=Three.buildVehicle("helicopter");
assert.ok(airplane.vertices>50&&helicopter.vertices>50);
assert.notDeepEqual(Array.from(airplane.positions.slice(0,36)),
 Array.from(helicopter.positions.slice(0,36)),
 "aircraft models must have different actual fuselage geometry, even if triangle counts happen to match");
assert.ok(Math.min(...airplane.positions)>-100,"airplane model is local to aircraft");
assert.ok(Math.max(...helicopter.positions)<100,"helicopter model is local to aircraft");

const state=M.makeState("airplane","approach",{windId:"crosswind"});
const pilot=Three.cameraPose(state,"cockpit"),chase=Three.cameraPose(state,"chase");
assert.equal(pilot.view,"cockpit");
assert.equal(chase.view,"chase");
assert.equal(pilot.eye[0],state.xM);
assert.equal(pilot.eye[2],state.zM);
assert.equal(pilot.eye[2],state.zM);
// Real source-cabin camera: position at the left pilot seat (not the roof,
// rear bench or outside fuselage), and rotate exactly with the aircraft.
const sourcePilot=Three.cameraPose(state,"cockpit",{}, {sourceCockpit:true});
assert.equal(sourcePilot.sourceCockpit,true);
assert.ok(sourcePilot.eye[0]<state.xM-.18&&sourcePilot.eye[0]>state.xM-.4,
 "pilot eye is in left seat, not exterior camera centre");
assert.ok(sourcePilot.eye[2]>state.zM+1.2&&sourcePilot.eye[2]<state.zM+1.9,
 "pilot eye between front seat and real source-model panel");
assert.ok(sourcePilot.eye[1]<sourcePilot.craft[1]+.48,
 "pilot eye below the cabin roof, not above it");
assert.ok(sourcePilot.pitch<0,
 "forward C172 view angles down slightly toward instrument panel");
const sourceTurned=Three.cameraPose({...state,headingDeg:90},"cockpit",{},
 {sourceCockpit:true});
assert.ok(sourceTurned.eye[0]>state.xM+1.2,
 "pilot seat rotates with aircraft nose through 90 degrees");
assert.ok(sourceTurned.eye[2]>state.zM+.18&&sourceTurned.eye[2]<state.zM+.4);
const sourceBanked=Three.cameraPose({...state,headingDeg:35,pitchDeg:9,rollDeg:17},"cockpit",{},
 {sourceCockpit:true});
assert.ok(sourceBanked.eye.every(Number.isFinite)&&sourceBanked.eye[1]>state.altitudeM,
 "pilot seat follows aircraft pitch and bank without leaving cabin");
assert.equal(Three.cameraPose(state,"cockpit").sourceCockpit,undefined,
 "legacy non-source cockpit remains a safe fallback");
assert.ok(chase.eye[2]<state.zM-20,"chase camera is behind the airplane");
assert.ok(chase.eye[1]>pilot.eye[1],"chase camera is above the airplane");
assert.equal(chase.craft[1],state.altitudeM+1.5);
assert.equal(pilot.yaw,0);
const turned=Three.cameraPose({...state,headingDeg:90,pitchDeg:8,rollDeg:25},"chase");
assert.ok(turned.eye[0]<state.xM-20,"camera follows +90 degree heading");
assert.ok(Math.abs(turned.roll)<Math.abs(25*Math.PI/180),"chase camera dampens bank");
const rotor=M.makeState("helicopter");
assert.equal(Three.cameraPose(rotor,"chase").craft[1],2);
const side=Three.cameraPose(rotor,"side");
const top=Three.cameraPose(rotor,"top");
assert.equal(side.view,"side");
assert.ok(Math.abs(side.eye[0]-rotor.xM)>20,"side camera offsets to port");
assert.ok(Math.abs(top.pitch)>1.4,"top view looks steeply downward");
assert.ok(top.eye[1]>side.eye[1]+20,"overhead camera clears main rotor");
assert.equal(top.view,"top");
// Exterior cameras adjust their distance with motion without changing the
// true aircraft position used by the simulated flight model.
const stationary=Three.cameraPose({...state,groundSpeedKt:0},"chase");
const accelerating=Three.cameraPose({...state,groundSpeedKt:210},"chase");
assert.ok(accelerating.eye[2]<stationary.eye[2]-5,
 "chase camera pulls away slightly at speed to show wings and runway");
assert.deepEqual(accelerating.craft,stationary.craft,
 "exterior camera changes cannot alter aircraft position");
const fastSide=Three.cameraPose({...state,groundSpeedKt:210},"side");
const slowSide=Three.cameraPose({...state,groundSpeedKt:0},"side");
assert.ok(Math.abs(fastSide.eye[0]-state.xM)>Math.abs(slowSide.eye[0]-state.xM)+3,
 "moving side camera widens the aircraft profile at speed");
const fastTop=Three.cameraPose({...state,groundSpeedKt:210},"top");
const slowTop=Three.cameraPose({...state,groundSpeedKt:0},"top");
assert.ok(fastTop.eye[1]>slowTop.eye[1]+8,
 "overhead framing keeps high-speed aircraft fully visible");
const groundedHeli=Three.cameraPose({...rotor,onGround:true,altitudeM:0,groundSpeedKt:0},"chase");
assert.ok(groundedHeli.eye[1]>9&&groundedHeli.eye[1]<17,
 "helicopter pad chase camera stays above ground and close enough to see the skids");
const fastHeli=Three.cameraPose({...rotor,groundSpeedKt:100},"chase");
assert.ok(fastHeli.eye[2]<groundedHeli.eye[2]-2,
 "the helicopter's chase view also adapts to translational flight");
assert.throws(()=>Three.cameraPose(null),/state required/);
assert.throws(()=>Three.cameraPose(rotor,"satellite"),/Unknown 3D camera/);
for(const id of Three.airframeIds){
 const shadow=Three.buildShadow(id);
 assert.ok(shadow.triangles>=40&&shadow.triangles<=200,
  id+" uses a low-cost aircraft-specific projected shadow silhouette");
 assert.ok(shadow.positions.every(Number.isFinite),id+" shadow geometry finite");
 for(let j=1;j<shadow.positions.length;j+=3)
  assert.equal(shadow.positions[j],0,"shadow stays at zero relative height");
 const aircraft=Three.buildVehicle(id);
 const span=Math.max(...Array.from(aircraft.positions).filter((_,i)=>i%3===0))-
  Math.min(...Array.from(aircraft.positions).filter((_,i)=>i%3===0));
 const shadowSpan=Math.max(...Array.from(shadow.positions).filter((_,i)=>i%3===0))-
  Math.min(...Array.from(shadow.positions).filter((_,i)=>i%3===0));
 assert.ok(shadowSpan>=span*.8||id==="r44",id+" shadow footprint follows wing span");
}
assert.equal(Three.createRenderer(null),null);
assert.equal(Three.createRenderer({getContext(){return null}}),null);
assert.equal(Three.createRenderer({getContext(){throw Error("WebGL blocked")}}),null);
console.log("Real 3D model passed: finite 3D meshes, terrain/runway/helipad, two aircraft, 3D camera viewpoints, mobile vertex budget and GPU fallback.");
