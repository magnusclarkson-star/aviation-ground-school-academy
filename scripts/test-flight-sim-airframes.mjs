import assert from "node:assert/strict";
import crypto from "node:crypto";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const A=require("../flight-sim-airframe-geometry.js");
const T=require("../flight-sim-3d.js");
const C=require("../flight-sim-exterior-2d.js");

assert.deepEqual([...A.IDS],["c172","r44","fa18","f22","f35","typhoon","su37"]);
assert.equal(A.normalize("airplane"),"c172");
assert.equal(A.normalize("helicopter"),"r44");
assert.throws(()=>A.normalize("generic"),/Unknown 3D craft/);
assert.deepEqual([...T.airframeIds],A.IDS);
assert.deepEqual(Array.from(T.buildVehicle("airplane").positions),
 Array.from(T.buildVehicle("c172").positions),"legacy airplane alias uses the new Cessna shape");
assert.deepEqual(Array.from(T.buildVehicle("helicopter").positions),
 Array.from(T.buildVehicle("r44").positions),"legacy helicopter alias uses the new R44 shape");

const signature=[],metrics=[];
for(const id of A.IDS){
 const model=T.buildVehicle(id),coordinates=model.positions;
 assert.ok(model.vertices>=50&&model.vertices<4000,id+" is a full, mobile-friendly 3D mesh");
 assert.equal(model.positions.length,model.vertices*3);
 assert.equal(model.colors.length,model.positions.length);
 assert.equal(model.normals.length,model.positions.length);
 assert.ok(coordinates.every(Number.isFinite),id+" vertices finite");
 assert.ok(model.colors.every(c=>c>=0&&c<=1),id+" colors normalized");
 let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity,minY=Infinity,maxY=-Infinity;
 for(let i=0;i<coordinates.length;i+=3){
  minX=Math.min(minX,coordinates[i]);
  maxX=Math.max(maxX,coordinates[i]);
  minY=Math.min(minY,coordinates[i+1]);maxY=Math.max(maxY,coordinates[i+1]);
  minZ=Math.min(minZ,coordinates[i+2]);maxZ=Math.max(maxZ,coordinates[i+2]);
 }
 const spanX=maxX-minX,length=maxZ-minZ;
 assert.ok(spanX>3&&spanX<35&&length>7.8&&length<28,id+" recognizable external size");
 metrics.push({id,spanX,length,height:maxY-minY,triangles:model.triangles});
 signature.push(crypto.createHash("sha256").update(Buffer.from(model.positions.buffer)).digest("hex"));
 const local=C.getMesh(id);
 assert.equal(local.vertices,model.vertices,id+" 2D fallback reuses its own 3D mesh");
 const tris=C.geometry(id);
 assert.equal(tris.length,model.triangles);
 assert.ok(tris.every(t=>t.points.length===3));
}
assert.equal(new Set(signature).size,7,"ALL seven aircraft exterior meshes are different, not colour variants of one mock-up");
const expected={
 c172:[10.97,8.29],fa18:[13.71,18.37],f22:[13.60,18.91],
 f35:[10.70,15.70],typhoon:[10.95,15.97],su37:[14.71,22.18]
};
for(const [id,[span,length]] of Object.entries(expected)){
 const actual=metrics.find(m=>m.id===id);
 assert.ok(Math.abs(actual.spanX-span)<.6,id+" corrected relative wingspan: "+actual.spanX);
 assert.ok(Math.abs(actual.length-length)<.5,id+" corrected relative length: "+actual.length);
}
// The trainer's windscreen is now two separate, slanted glazed panes rather
// than the former opaque blue box extending across the entire cabin roof.
const c172Exterior=T.buildVehicle("c172"),c172P=c172Exterior.positions;
const nearVertex=(p,x,y,z,tolerance=.009)=>{
 for(let i=0;i<p.length;i+=3)
  if(Math.abs(p[i]-x)<tolerance&&Math.abs(p[i+1]-y)<tolerance&&
   Math.abs(p[i+2]-z)<tolerance)return true;
 return false;
};
for(const side of [-1,1]){
 assert.ok(nearVertex(c172P,side*.72*A.SCALE.c172[0],.27,3.08*A.SCALE.c172[2]),
  "Cessna has a distinct "+(side<0?"left":"right")+" sloped windshield pane");
}
const noseSupport=Array.from({length:c172P.length/3},(_,j)=>j*3).filter(i=>
 Math.abs(c172P[i])<.25&&c172P[i+1]>=-1.3&&c172P[i+1]<-.42&&
 c172P[i+2]>=4.35*A.SCALE.c172[2]&&c172P[i+2]<5.03*A.SCALE.c172[2]);
assert.ok(noseSupport.length>60,"Cessna nose wheel has a curved, attached gear fork");
assert.ok(c172Exterior.vertices<4000,"extra Cessna geometry remains mobile-friendly");
// Tiny visible fittings make the trainer's exterior identifiable even in a
// side-on 360° inspection; its 2D fallback uses this exact same geometry.
const cScale=A.SCALE.c172;
// Low-poly trainer dihedral: both outer wing tips visibly rise from the
// root; matching wing trim and struts follow the new height in 3D/360/2D.
for(const side of [-1,1]){
 assert.ok(nearVertex(c172P,side*7.4*cScale[0],1.16,.7*cScale[2]),
  "C172 wingtip should rise above the root without changing wing geometry");
 assert.ok(nearVertex(c172P,side*.72*cScale[0],.95,1.25*cScale[2]),
  "C172 root stays at the existing cabin elevation");
 assert.ok(nearVertex(c172P,side*4.7*cScale[0],1.08,-.38*cScale[2]),
  "high wing support strut rises toward the new outer dihedral panel");
 assert.ok(nearVertex(c172P,side*7.25*cScale[0],1.25,-1.77*cScale[2]),
  "wing-top colour trim continues along the sloped wing");
}
assert.ok(nearVertex(c172P,-4.31*cScale[0],.35,.37*cScale[2]),
 "C172 left under-wing pitot support is present");
assert.ok(nearVertex(c172P,0,1.66,-.71*cScale[2]),
 "C172 roof aerial has a distinct apex");
assert.ok(nearVertex(c172P,-1.59*cScale[0],.92,1.19*cScale[2]),
 "C172 wing-root lamp is visibly inset ahead of the windshield");
assert.ok(nearVertex(c172P,-.075*cScale[0],2.39,-6.32*cScale[2]),
 "C172 fin-top red beacon is positioned on the tail");

// A visible annular exhaust rear face should exist at the end of each
// engine, with exactly one nacelle for F-35 and pairs for the other jets.
for(const id of ["fa18","f22","f35","typhoon","su37"]){
 const mesh=T.buildVehicle(id),p=mesh.positions,c=mesh.colors;
 const twin=id!=="f35",exhaustZ=((twin?-5.7:-5.85)-1.64)*A.SCALE[id][2];
 let rimVertices=0;
 for(let i=0;i<p.length;i+=3){
  if(Math.abs(p[i+2]-exhaustZ)>.008)continue;
  if(Math.abs(c[i]-151/255)<.005&&Math.abs(c[i+1]-162/255)<.005&&
   Math.abs(c[i+2]-172/255)<.005)rimVertices++;
 }
 assert.ok(rimVertices>=(twin?60:30),
  id+" has "+(twin?"two recessed turbine nozzles":"one turbine nozzle")+" visible from rear");
}

assert.ok(metrics.find(x=>x.id==="c172").spanX>metrics.find(x=>x.id==="f35").spanX,
 "trainer has a broader high wing compared with the fighter model");
assert.ok(metrics.find(x=>x.id==="r44").height>metrics.find(x=>x.id==="f35").height,
 "helicopter has its distinctive tall rotor mast");
const doorMesh=T.buildVehicle("r44").positions;
// The fuller rotorcraft bubble windscreen has a forward high glass ring
// in the SAME geometry used by WebGL and 2D 360° inspection.
let canopyCrown=false;
for(let i=0;i<doorMesh.length;i+=3){
 if(Math.abs(doorMesh[i])<.02&&Math.abs(doorMesh[i+1]-1.29)<.025&&
  Math.abs(doorMesh[i+2]-2.45)<.025)canopyCrown=true;
}
assert.ok(canopyCrown,"R44 rounded bubble canopy has a visible forward crown");
let furthestSkid=Number.NEGATIVE_INFINITY;
for(let j=2;j<doorMesh.length;j+=3)
 furthestSkid=Math.max(furthestSkid,doorMesh[j]);
assert.ok(furthestSkid>3.20&&furthestSkid<3.35,
 "R44 exterior has a visibly curled, protective forward skid nose");
const highSkidTip=[];
for(let j=0;j<doorMesh.length;j+=3){
 if(Math.abs(Math.abs(doorMesh[j])-1.36)<.14&&
    doorMesh[j+2]>3.0&&doorMesh[j+1]>-.97)
  highSkidTip.push(doorMesh[j+1]);
}
assert.ok(highSkidTip.length>=4,
 "V2 R44 raised protective front tips must be visible in the shared aircraft exterior");
let tailFinAbove=false;
for(let j=0;j<doorMesh.length;j+=3)
 if(Math.abs(doorMesh[j])<.13&&doorMesh[j+1]>2.28&&
  doorMesh[j+2]<-8&&doorMesh[j+2]>-8.5)tailFinAbove=true;
assert.ok(tailFinAbove,"R44 upper tail stabilizer silhouette is visible in 3D/360°");
for(const sign of [-1,1]){
 let doorHandle=false;
 for(let i=0;i<doorMesh.length;i+=3){
  const px=doorMesh[i],py=doorMesh[i+1],pz=doorMesh[i+2];
  if(Math.abs(px-(sign*1.2-.075))<.012&&Math.abs(py-.18)<.012&&
   Math.abs(pz-.41)<.012)doorHandle=true;
 }
 assert.ok(doorHandle,(sign<0?"left":"right")+
  " R44 cabin door retains a distinct external handle");
}
// The R44 uses two ROUND landing skids: several circular cross-section
// coordinates at the skid sides, upturned noses and two curved cross tubes.
const rotorPositions=T.buildVehicle("r44").positions;
const roundCrossSection=[];
const railEnds=[];
for(let i=0;i<rotorPositions.length;i+=3){
 const x=rotorPositions[i],y=rotorPositions[i+1],z=rotorPositions[i+2];
 if(Math.abs(x-1.36)<.14&&Math.abs(z+1.50)<.055&&y< -1.35)
  roundCrossSection.push([x,y,z]);
 if(Math.abs(Math.abs(x)-1.36)<.15&&z>2.75&&y> -1.45)
  railEnds.push([x,y,z]);
}
assert.ok(new Set(roundCrossSection.map(v=>v[0].toFixed(3))).size>=7,
 "R44 longitudinal skid is a circular tube, not the former rectangular prism");
assert.ok(new Set(roundCrossSection.map(v=>v[1].toFixed(3))).size>=4,
 "R44 skid has rounded side surfaces from several angles");
assert.ok(railEnds.length>=6,"both R44 landing skids curl upward at their forward tips");

for(const id of ["fa18","f22","f35","typhoon","su37"]){
 const parts=T.buildMovingParts(id);
 assert.deepEqual(parts.map(x=>x.name),[
  "leftAileron","leftFlap",...(id==="su37"?["canardLeft"]:[]),
  "elevatorLeft","rightAileron","rightFlap",
  ...(id==="su37"?["canardRight"]:[]),"elevatorRight",
  ...(id==="typhoon"?["rudder"]:["rudderLeft","rudderRight"]),
  "noseGear","mainGearLeft","mainGearRight"
 ],id+" has animated control surfaces and three retractable gear assemblies");
 assert.ok(parts.every(x=>x.mesh.vertices>0&&x.axis>0));
 for(const p of parts.filter(p=>p.name.endsWith("Gear"))){
  assert.equal(p.axis,1,id+" jet gear pivots inward around its horizontal hinge");
  assert.ok(p.mesh.triangles>60,id+" gear has a round wheel with a hub and support strut");
 }
 const names=parts.map(x=>x.name);
 const rudders=names.filter(name=>name.toLowerCase().includes("rudder"));
 if(id==="typhoon"){
  assert.deepEqual(rudders,["rudder"],"Typhoon has one central fin");
  for(const part of parts.filter(p=>p.name.startsWith("elevator"))){
   assert.ok(part.pivot[2]>2.5,"Typhoon pitch control is on front canards, not an imaginary horizontal tail");
  }
 }else{
  assert.deepEqual(rudders,["rudderLeft","rudderRight"],id+" animates its two canted fin rudders");
  const left=parts.find(x=>x.name==="rudderLeft"),right=parts.find(x=>x.name==="rudderRight");
  assert.ok(left.pivot[0]<-.4&&right.pivot[0]>.4,id+" twin rudders are outside the centreline");
  assert.ok(left.mesh.positions[0]<0&&right.mesh.positions[0]>0);
 }

}
assert.deepEqual(T.buildMovingParts("r44").map(p=>p.name),
 ["swashBank","swashPitch","collectiveLink","mainRotor","tailPitchLink","tailRotor"]);
const rotorAssemblies=T.buildMovingParts("r44");
const mainRotor=rotorAssemblies.find(p=>p.name==="mainRotor");
const tailRotor=rotorAssemblies.find(p=>p.name==="tailRotor");
for(const name of ["collectiveLink","tailPitchLink"]){
 assert.ok(C.movingParts("r44").some(part=>part.name===name),
  name+" is in both GPU and lightweight 2D views");
}
for(const name of ["swashBank","swashPitch"]){
 const part=rotorAssemblies.find(p=>p.name===name);
 assert.ok(part.mesh.triangles>=24&&part.mesh.triangles<=60,
  name+" remains under the mobile mesh budget");
 assert.ok(C.movingParts("r44").some(p=>p.name===name),
  name+" must also appear in 2D non-WebGL inspection");
}
const extent=(m,axis)=>{
 const v=m.positions;
 let lo=Infinity,hi=-Infinity;
 for(let i=axis;i<v.length;i+=3){lo=Math.min(lo,v[i]);hi=Math.max(hi,v[i]);}
 return hi-lo;
};
const sweep=T.buildRotorSweep("r44");
assert.ok(sweep&&sweep.triangles===128,"R44 sweep uses only 128 triangles");
assert.ok(Math.abs(extent(sweep,0)-10.06)<.10,
 "blur disc spans the actual main rotor diameter");
assert.ok(Math.abs(extent(sweep,2)-10.06)<.10,
 "motion disc covers the rotor's full circular sweep");
assert.ok(sweep.positions.every(Number.isFinite));
assert.equal(T.buildRotorSweep("c172"),null);
const propSweep=T.buildPropellerSweep("c172");
assert.ok(propSweep&&propSweep.triangles===96,"trainer propeller motion sweep is lightweight");
assert.ok(Math.abs(extent(propSweep,0)-1.93)<.06,
 "trainer propeller blur is circular, not squashed by wing scaling");
assert.ok(Math.abs(extent(propSweep,1)-1.93)<.06,
 "trainer propeller blur matches the actual 1.93 m two-blade disc");
assert.equal(T.buildPropellerSweep("r44"),null);
assert.equal(C.propellerSweepTriangles("c172").length,96,
 "2D fallback and WebGL share the Cessna propeller sweep geometry");
assert.equal(C.propellerSweepTriangles("r44").length,0);

assert.equal(C.rotorSweepTriangles("r44").length,128,
 "2D fallback reuses the same round sweep geometry as WebGL");
assert.equal(C.rotorSweepTriangles("c172").length,0);
assert.ok(Math.abs(extent(mainRotor.mesh,0)-10.06)<.10,
 "R44 must have a recognisable TWO-blade 10.06 m main rotor span");
assert.ok(extent(mainRotor.mesh,2)<1.2,
 "R44 main rotor has two blades on a single axis, not the old four-blade cross");
assert.ok(Math.abs(extent(tailRotor.mesh,1)-1.47)<.1,
 "R44 2-blade tail rotor diameter is approximately 1.47 m");
const rotorHasColor=(mesh,r,g,b)=>{
 const p=mesh.colors,targets=[r/255,g/255,b/255];
 for(let i=0;i<p.length;i+=3)
  if(targets.every((v,j)=>Math.abs(p[i+j]-v)<.006))return true;
 return false;
};
assert.ok(rotorHasColor(mainRotor.mesh,218,231,232),
 "R44 main rotor's high-contrast pale upper airfoil is visible from above");
assert.ok(rotorHasColor(mainRotor.mesh,87,104,117),
 "R44 main rotor includes a dark underside visible from low chase");
assert.ok(rotorHasColor(mainRotor.mesh,231,187,82),
 "R44 yellow blade tips make rotor length and spinning edges apparent");
assert.ok(rotorHasColor(tailRotor.mesh,229,238,230)&&
 rotorHasColor(tailRotor.mesh,91,111,126),
 "R44 two-blade tail rotor has distinct visible front and rear surfaces");
assert.ok(mainRotor.mesh.triangles>=70&&tailRotor.mesh.triangles>=40,
 "R44 rotor blades and hubs have detailed low-cost geometry");
assert.ok(C.movingParts("r44").some(p=>p.name==="mainRotor"&&p.triangles.length>5),
 "lightweight 2D chase includes actual main rotor triangles");
assert.notDeepEqual(C.rotate([1,3.16,-.4],[0,3.16,-.4],2,1.2),[1,3.16,-.4],
 "main rotor blade vertices rotate around the hub");
assert.deepEqual(T.buildMovingParts("c172").map(p=>p.name),[
 "propeller","mainWheels","noseWheel","leftAileron","rightAileron",
 "leftFlap","rightFlap","elevatorLeft","elevatorRight","rudder"]);
const trainerParts=T.buildMovingParts("c172");
for(const name of ["mainWheels","noseWheel"]){
 const part=trainerParts.find(p=>p.name===name);
 assert.equal(part.axis,1,name+" must spin around lateral wheel axle");
 assert.ok(part.mesh.triangles>=12&&part.mesh.triangles<=40,
  name+" adds only inexpensive coloured hub-mark triangles");
 assert.ok(part.mesh.positions.every(Number.isFinite));
 assert.ok(C.movingParts("c172").some(p=>p.name===name),
  name+" is visible in the same geometry for non-WebGL Android views");
 const vertex=part.mesh.positions.slice(0,3);
 const initial=[...vertex],rotated=C.rotate(initial,part.pivot,part.axis,.85);
 assert.notDeepEqual(rotated,initial,name+" hub markers rotate about their actual axle");
}
const mains=trainerParts.find(p=>p.name==="mainWheels");
const front=trainerParts.find(p=>p.name==="noseWheel");
assert.ok(Math.abs(mains.pivot[1]+1.25)<.01);
assert.ok(Math.abs(front.pivot[2]-4.45*A.SCALE.c172[2])<.01);
assert.ok(front.mesh.triangles<mains.mesh.triangles,
 "the single nose wheel must have fewer rotating faces than two main wheels");
const prop=trainerParts.find(p=>p.name==="propeller");
const coordinates=prop.mesh.positions;
const axisExtent=axis=>{
 let lo=Infinity,hi=-Infinity;
 for(let i=axis;i<coordinates.length;i+=3){lo=Math.min(lo,coordinates[i]);hi=Math.max(hi,coordinates[i]);}
 return hi-lo;
};
assert.ok(axisExtent(1)>1.85&&axisExtent(1)<2.06,
 "C172 should have an approximately 1.93 m two-blade propeller, not an oversized four-blade cross");
assert.ok(axisExtent(0)<.6,
 "C172 propeller blades should form a single straight pair, not a cross");
assert.ok(axisExtent(2)<.4,"propeller faces remain close to the spinner");
for(const name of ["leftAileron","rightAileron","leftFlap","rightFlap"]){
 const part=trainerParts.find(p=>p.name===name);
 assert.ok(part.pivot[1]>.85&&part.pivot[1]<1.05,name+" hinge belongs to high wing");
 const yValues=Array.from(part.mesh.positions).filter((_,i)=>i%3===1);
 assert.ok(Math.min(...yValues)>.85,name+" wing panel no longer floats below the cabin");
}
const trainerBody=T.buildVehicle("c172").positions;
const wheelVertices=[];
const wheelX=2.10*A.SCALE.c172[0],wheelZ=-.8*A.SCALE.c172[2];
for(let i=0;i<trainerBody.length;i+=3){
 const x=trainerBody[i],y=trainerBody[i+1],z=trainerBody[i+2];
 if(Math.abs(x-wheelX)<.20&&y<-.9&&Math.abs(z-wheelZ)<.27)
  wheelVertices.push(y.toFixed(3)+":"+z.toFixed(3));
}
assert.ok(new Set(wheelVertices).size>=12,
 "C172 right main gear now has a genuinely round multi-segment tire rather than a box");
const fake={count:0,save(){},restore(){},translate(){},rotate(){},beginPath(){},ellipse(){},fill(){this.count++},
 moveTo(){},lineTo(){},closePath(){},set fillStyle(v){this.color=v}};
for(const id of A.IDS){
 const before=fake.count;
 assert.equal(C.paint(fake,{rollDeg:12,pitchDeg:-2,altitudeM:120},{id,width:960,height:540}),true);
 assert.ok(fake.count-before>=T.buildVehicle(id).triangles,
  id+" 2D canvas paints the matching mesh rather than one generic airplane");
}
// The mobile 2D renderer must layer nearby wheels and rotors over the
// correct farther fuselage surfaces for every camera, even without WebGL.
for(const id of A.IDS){
 for(const view of ["top","side","chase"]){
  const faces=C.projectedFaces(id,view,{mainRotor:.78,tailRotor:1.45,
   rotorBlurOpacity:.11,propBlurOpacity:.11,noseGear:1.1,mainGearLeft:1.1,mainGearRight:1.1});
  assert.ok(faces.length>T.buildVehicle(id).triangles,
   id+" includes animated moving hardware in fallback view "+view);
  assert.ok(faces.every(f=>Number.isFinite(f.depth)),id+" depths are finite");
  assert.ok(faces.every((f,i)=>i===0||faces[i-1].depth>=f.depth-1e-8),
   id+" "+view+" draws far triangles before near triangles");
 }
}
const helicopterTop=C.projectedFaces("r44","top",{mainRotor:1.1,tailRotor:2.0});
assert.ok(helicopterTop.at(-1).depth<helicopterTop[0].depth,
 "rotor blades are depth-sorted with helicopter cabin in overhead fallback");

// Verify the Canvas fallback follows the SAME actual geometry rotations
// as the GPU: aircraft banking changes wingtip height, pitching raises the
// nose and the moving R44 rotor inherits the airframe's overall attitude.
const nearly=(x,y)=>Math.abs(x-y)<1e-7;
const wing=C.attitudePoint([5,0,0],30,0);
assert.ok(nearly(wing[0],5*Math.cos(Math.PI/6))&&
 nearly(wing[1],-2.5)&&nearly(wing[2],0),
 "30° bank really lowers one wingtip instead of spinning a flat silhouette");
const nose=C.attitudePoint([0,0,5],0,15);
assert.ok(nearly(nose[1],5*Math.sin(15*Math.PI/180))&&
 nearly(nose[2],5*Math.cos(15*Math.PI/180)),
 "15° nose-up pitch lifts the actual aircraft geometry in side view");
assert.deepEqual(C.attitudePoint([1,2,3],0,0),[1,2,3],
 "level flight keeps the existing external model exactly unchanged");
for(const id of A.IDS){
 for(const view of ["chase","side","top"]){
  const flightAnim={mainRotor:.9,tailRotor:1.3,propeller:1.1,
   leftFlap:.22,rightFlap:.22};
  const level=C.projectedFaces(id,view,flightAnim);
  const banked=C.projectedFaces(id,view,flightAnim,
   {rollDeg:26,pitchDeg:12});
  assert.equal(banked.length,level.length,
   id+" retains every original fuselage/rotor/control surface in "+view);
  assert.ok(banked.every(x=>x.points.every(p=>p.every(Number.isFinite))),
   id+" banked/pitched vertices remain finite");
  assert.ok(banked.every((f,i)=>i===0||banked[i-1].depth>=f.depth-1e-8),
   id+" banked surfaces remain correctly depth-sorted");
  const signature=faces=>faces.reduce((sum,f)=>
   sum+f.points[0][0]*.1+f.points[0][1]*.5+f.points[0][2]*.9,0);
  assert.ok(Math.abs(signature(level)-signature(banked))>1,
   id+" bank and climb alter actual airframe coordinates in "+view);
 }
}
// Position lights have a fixed aviation orientation: port/left red,
// starboard/right green, and an aft-facing white lens. Local -X is left
// because the nose points +Z. Both renderers share this same geometry.
const lightVertices=(model,[r,g,b])=>{
 const points=[];
 for(let i=0;i<model.positions.length;i+=3){
  if(Math.abs(model.colors[i]-r/255)<.006&&
   Math.abs(model.colors[i+1]-g/255)<.006&&
   Math.abs(model.colors[i+2]-b/255)<.006)
   points.push([model.positions[i],model.positions[i+1],model.positions[i+2]]);
 }
 return points;
};
for(const id of A.IDS){
 const mesh=T.buildVehicle(id);
 const left=lightVertices(mesh,[235,56,48]);
 const right=lightVertices(mesh,[54,214,111]);
 const aft=lightVertices(mesh,[236,241,226]);
 assert.ok(left.some(p=>p[0]<-0.7),id+" has a red LEFT position-light lens");
 assert.ok(right.some(p=>p[0]>0.7),id+" has a green RIGHT position-light lens");
 assert.ok(aft.some(p=>p[2]<-3),id+" has a white rear position-light lens");
 const fallback=C.getMesh(id);
 assert.deepEqual(Array.from(fallback.colors),Array.from(mesh.colors),
  id+" uses the same correct navigation light colors in the Canvas fallback");
}
console.log("Seven external aircraft meshes passed: distinct Cessna, R44, F/A-18, F-22, F-35, Typhoon and Su-37 shapes, matching 2D/3D airframe geometry, controls and mobile budgets.");
