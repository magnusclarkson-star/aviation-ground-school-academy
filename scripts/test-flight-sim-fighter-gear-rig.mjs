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
console.log("Rigid source F-22/F-35B gear folds inward, keeps tyre size and stays below F-35B dorsal surface");
