import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
const require=createRequire(import.meta.url);
const Three=require("../flight-sim-3d.js");
const M=require("../flight-sim-model.js");
const PadDetail=require("../flight-sim-helipad-detail.js");
const Scenery=require("../flight-sim-scenery.js");

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
 assert.ok(mesh.positions.some(v=>v>700),"mountain and cloud elevations");
 assert.equal(mesh.colors.length,mesh.positions.length);
 assert.equal(mesh.normals.length,mesh.positions.length);
}

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
assert.throws(()=>Three.cameraPose(null),/state required/);
assert.throws(()=>Three.cameraPose(rotor,"satellite"),/Unknown 3D camera/);
for(const id of Three.airframeIds){
 const shadow=Three.buildShadow(id);
 assert.equal(shadow.triangles,28,id+" projected footprint is a low-cost 28-facet ellipse");
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
