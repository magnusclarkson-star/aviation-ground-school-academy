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
const fake={count:0,save(){},restore(){},translate(){},rotate(){},beginPath(){},ellipse(){},fill(){this.count++},
 moveTo(){},lineTo(){},closePath(){},set fillStyle(v){this.color=v}};
for(const id of A.IDS){
 const before=fake.count;
 assert.equal(C.paint(fake,{rollDeg:12,pitchDeg:-2,altitudeM:120},{id,width:960,height:540}),true);
 assert.ok(fake.count-before>=T.buildVehicle(id).triangles,
  id+" 2D canvas paints the matching mesh rather than one generic airplane");
}
console.log("Seven external aircraft meshes passed: distinct Cessna, R44, F/A-18, F-22, F-35, Typhoon and Su-37 shapes, matching 2D/3D airframe geometry, controls and mobile budgets.");
