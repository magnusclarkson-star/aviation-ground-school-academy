/* Deterministic regression: source fighter landing gear retracts by rigid
 * articulated rotation, not by shrinking the tyres, and remains beneath
 * the F-35B upper-fuselage limit. This mirrors GPU axis-4 motion.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const F22=require("../flight-sim-f22-airframe.js");
const F35=require("../flight-sim-f35-airframe.js");
const Exterior=require("../flight-sim-airframe-geometry.js");
const Three=require("../flight-sim-3d.js");
const shader=readFileSync(new URL("../flight-sim-3d.js",import.meta.url),"utf8");

assert.match(shader,/float fold=fraction\*fraction\*\(3\.-2\.\*fraction\)\*1\.53/,
 "gear fold should ease rigidly without collapsing wheel radius");
assert.match(shader,/bool mainGear=abs\(uPartPivot\.x\)>\.4/,
 "main gear should pivot around an independent inboard hinge");
assert.match(shader,/float hingeAngle=mainGear\?-sign\(uPartPivot\.x\)\*fold:fold/,
 "left and right main gear must rotate inward, nose gear aft");
assert.match(shader,/p=uPartPivot\+rotatePart\(p-uPartPivot,hingeAxis,hingeAngle\)/,
 "gear transform must be a distance-preserving rigid rotation");
assert.doesNotMatch(shader,/rotatePart\(p-uPartPivot,1,uPartAngle\*\.88\)\*\(1\.-retraction\)/,
 "previous shrink-to-point gear animation must not return");
assert.match(shader,/const fade=limit\(\(progress-\.82\)\/\.16,0,1\)/,
 "fully deployed tyre should remain opaque until near stow completion");

const rotate=(pos,pivot,progress)=>{
 const angle=progress*progress*(3-2*progress)*1.53;
 const [x,y,z]=pos,[px,py,pz]=pivot;
 const dx=x-px,dy=y-py,dz=z-pz;
 const main=Math.abs(px)>.4;
 const h=main?-Math.sign(px)*angle:angle;
 const c=Math.cos(h),s=Math.sin(h);
 return main?[px+dx*c-dy*s,py+dx*s+dy*c,z]:
  [x,py+dy*c-dz*s,pz+dy*s+dz*c];
};
const distance=(p,pivot)=>Math.hypot(
 p[0]-pivot[0],p[1]-pivot[1],p[2]-pivot[2]);
const mean=(mesh,progress,metric)=>{
 let total=0,n=0;
 for(let i=0;i<mesh.positions.length;i+=3){
  const p=rotate([mesh.positions[i],mesh.positions[i+1],mesh.positions[i+2]],
   mesh.partPivot,progress);
  total+=metric(p);n++;
 }
 return total/n;
};
for(const [id,loader,asset] of [
 ["f22",F22,"f22-fguk-exterior.json"],
 ["f35",F35,"f35b-fg-exterior.json"]
]){
 const text=readFileSync(new URL("../assets/aircraft/"+asset,import.meta.url),"utf8");
 const m=id==="f22"?loader.parseF22(text):loader.parseF35(text);
 const gear=m.primitives.filter(p=>p.partAxis===4);
 assert.ok(gear.length>=10,id+" authentic gear assemblies must be linked");
 const names=new Set(gear.map(p=>p.partName));
 assert.deepEqual([...names].sort(),
  ["noseGear","mainGearLeft","mainGearRight"].sort());
 for(const part of gear){
  const p=part.positions;
  for(const phase of [0,.20,.40,.60,.80,1]){
   for(let i=0;i<p.length;i+=3){
    const original=[p[i],p[i+1],p[i+2]];
    const folded=rotate(original,part.partPivot,phase);
    assert.ok(folded.every(Number.isFinite),"gear positions must be finite");
    assert.ok(Math.abs(distance(original,part.partPivot)-
     distance(folded,part.partPivot))<1e-5,
     id+" keeps wheel/strut size constant throughout folding");
    if(id==="f35")assert.ok(folded[1]<=-.649,
     "F-35B "+part.sourceName+" must stay beneath upper fuselage at "+phase);
   }
  }
 }
 const groups=[
  id==="f22"?["left-main-wheel","right-main-wheel","nosewheel"]:
   ["gear:wheel.L","gear:wheel.R","gear:wheel.F"]
 ][0];
 for(const wheelName of groups){
  const wheel=gear.find(p=>p.sourceName===wheelName);
  assert.ok(wheel,id+" should use the actual imported "+wheelName);
  const beforeY=mean(wheel,0,p=>p[1]),afterY=mean(wheel,1,p=>p[1]);
  assert.ok(afterY>beforeY+.35,
   id+" "+wheelName+" retracts upward without shrinking");
  if(wheel.partName!=="noseGear"){
   const beforeX=mean(wheel,0,p=>Math.abs(p[0]));
   const afterX=mean(wheel,1,p=>Math.abs(p[0]));
   assert.ok(afterX<beforeX-.50,
    id+" "+wheelName+" rotates inward toward aircraft centreline");
  }
 }
}

// Gear door acceptance: three distinct belly wells, two independent
// hinges per well, flush painted doors after stow and open clear when down.
assert.equal(Exterior.buildImportedGearDoors(Three.Mesh,"c172"),null,
 "source fighter doors must not alter the approved Cessna layout");
assert.equal(Exterior.buildImportedGearDoors(Three.Mesh,"r44"),null,
 "source fighter doors must not alter the approved R44 layout");
for(const id of ["f22","f35"]){
 const plan=Exterior.buildImportedGearDoors(Three.Mesh,id);
 assert.ok(plan&&plan.wells.triangles>=36,
  id+" needs three dark underside recesses");
 assert.equal(plan.slots.length,3);
 assert.equal(plan.doors.length,6);
 assert.deepEqual([...new Set(plan.doors.map(p=>p.gearName))].sort(),
  ["noseGear","mainGearLeft","mainGearRight"].sort());
 for(const slot of plan.slots){
  const panels=plan.doors.filter(p=>p.gearName===slot.name);
  assert.deepEqual(panels.map(p=>p.side),[-1,1]);
  const closed=panels.map(p=>Exterior.importedGearDoorAngle(1.53,p.side));
  const open=panels.map(p=>Exterior.importedGearDoorAngle(0,p.side));
  assert.ok(closed.every(a=>Math.abs(a)<1e-8));
  assert.ok(open[0]<-1&&open[1]>1,
   id+" belly doors open outward in opposite directions");
  for(const door of panels){
   assert.ok(door.mesh.triangles>=20&&door.mesh.vertices<100,
    "mobile door mesh must be real but lightweight");
   const position=door.mesh.positions;
   const angle=Exterior.importedGearDoorAngle(0,door.side);
   let lowestOpen=Infinity,lowestClosed=Infinity;
   for(let i=0;i<position.length;i+=3){
    const [x,y,z]=[position[i],position[i+1],position[i+2]];
    const dx=x-door.pivot[0],dy=y-door.pivot[1];
    const deployedY=door.pivot[1]+dx*Math.sin(angle)+dy*Math.cos(angle);
    lowestOpen=Math.min(lowestOpen,deployedY);
    lowestClosed=Math.min(lowestClosed,y);
    assert.ok(Number.isFinite(z)&&Number.isFinite(deployedY));
    if(id==="f35")assert.ok(deployedY<-.65,
     "F-35B doors cannot cross the dorsal-gear clearance plane");
   }
   assert.ok(lowestOpen<lowestClosed-.15,
    id+" door must visibly swing below its stowed position");
  }
 }
 const a=Exterior.importedGearDoorAngle(.6,1);
 const b=Exterior.importedGearDoorAngle(1.1,1);
 assert.ok(a>b&&b>0,"doors must gradually close as gear retracts");
}
assert.match(shader,/if\(realModel&&model\.importedGear\)/,
 "imported doors draw only after the authentic aircraft has loaded");
assert.match(shader,/Exterior\.importedGearDoorAngle\(/,
 "renderer must link gear-door angle to the same system gear input");

console.log("Rigid source F-22/F-35B gear folds inward, keeps tyre size and stays below F-35B dorsal surface");
