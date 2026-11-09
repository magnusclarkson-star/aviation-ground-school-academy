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
assert.ok(metrics.find(x=>x.id==="c172").spanX>metrics.find(x=>x.id==="f35").spanX,
 "trainer has a broader high wing compared with the fighter model");
assert.ok(metrics.find(x=>x.id==="r44").height>metrics.find(x=>x.id==="f35").height,
 "helicopter has its distinctive tall rotor mast");
for(const id of ["fa18","f22","f35","typhoon","su37"]){
 const parts=T.buildMovingParts(id);
 assert.deepEqual(parts.map(x=>x.name),[
  "leftAileron","leftFlap","elevatorLeft","rightAileron",
  "rightFlap","elevatorRight",...(id==="typhoon"?["rudder"]:["rudderLeft","rudderRight"])
 ],id+" has the correct individual animated jet surfaces");
 assert.ok(parts.every(x=>x.mesh.vertices>0&&x.axis>0));
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
assert.deepEqual(T.buildMovingParts("r44").map(p=>p.name),["mainRotor","tailRotor"]);
const [mainRotor,tailRotor]=T.buildMovingParts("r44");
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
assert.equal(C.rotorSweepTriangles("r44").length,128,
 "2D fallback reuses the same round sweep geometry as WebGL");
assert.equal(C.rotorSweepTriangles("c172").length,0);
assert.ok(Math.abs(extent(mainRotor.mesh,0)-10.06)<.10,
 "R44 must have a recognisable TWO-blade 10.06 m main rotor span");
assert.ok(extent(mainRotor.mesh,2)<1.2,
 "R44 main rotor has two blades on a single axis, not the old four-blade cross");
assert.ok(Math.abs(extent(tailRotor.mesh,1)-1.47)<.1,
 "R44 2-blade tail rotor diameter is approximately 1.47 m");
assert.ok(C.movingParts("r44").some(p=>p.name==="mainRotor"&&p.triangles.length>5),
 "lightweight 2D chase includes actual main rotor triangles");
assert.notDeepEqual(C.rotate([1,3.16,-.4],[0,3.16,-.4],2,1.2),[1,3.16,-.4],
 "main rotor blade vertices rotate around the hub");
assert.deepEqual(T.buildMovingParts("c172").map(p=>p.name),[
 "propeller","leftAileron","rightAileron","leftFlap","rightFlap","elevatorLeft","elevatorRight","rudder"]);
const trainerParts=T.buildMovingParts("c172");
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
console.log("Seven external aircraft meshes passed: distinct Cessna, R44, F/A-18, F-22, F-35, Typhoon and Su-37 shapes, matching 2D/3D airframe geometry, controls and mobile budgets.");
