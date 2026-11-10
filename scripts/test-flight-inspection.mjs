import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const O=require("../flight-sim-inspection.js");
const A=require("../flight-sim-3d.js");
const X=require("../flight-sim-airframe-geometry.js");
const C=require("../flight-sim-exterior-2d.js");

const initial={azimuth:0,elevation:26,distance:30};
assert.deepEqual(O.orbitStep(initial,180,0),{azimuth:99,elevation:26,distance:30});
assert.ok(Math.abs(O.orbitStep(initial,720,0).azimuth-36)<1e-8,"orbit wrapping tolerates floating-point arithmetic");
assert.equal(O.orbitStep(initial,0,1000).elevation,78);
assert.equal(O.orbitStep(initial,0,-1000).elevation,-65);
assert.equal(O.zoomStep(initial,.1).distance,17);
assert.equal(O.zoomStep(initial,100).distance,70);
assert.equal(O.zoomStep(initial,.8).distance,24);
assert.equal(O.zoomStep(initial,1.22).azimuth,0);
assert.equal(O.pinchStep(initial,100,125).distance,24,"fingers apart zoom into airframe");
assert.equal(O.pinchStep(initial,100,80).distance,37.5,"fingers together zoom out");
assert.equal(O.pinchStep(initial,30,300).distance,17,"pinch-in stays inside close limit");
assert.equal(O.pinchStep(initial,300,30).distance,70,"pinch-out stays inside far limit");
assert.deepEqual(O.pinchStep(initial,0,90),initial,"zero span cannot break camera");
assert.deepEqual(O.pinchStep(initial,NaN,90),initial,"non-finite span is ignored");
assert.deepEqual(O.doubleTapZoom(initial),
 {azimuth:0,elevation:26,distance:21.6},
 "double tap brings aircraft closer without losing its orientation");
assert.deepEqual(O.doubleTapZoom(O.doubleTapZoom(initial)),initial,
 "a second double tap restores the original fitted viewing distance");
assert.deepEqual(O.doubleTapZoom({azimuth:145,elevation:-14,distance:18}),
 {azimuth:145,elevation:-14,distance:30},
 "double tap restores fit even after manual pinch zoom");


const state={mode:"helicopter",xM:0,zM:0,altitudeM:0,headingDeg:0,pitchDeg:0,rollDeg:0};
const back=A.cameraPose(state,"inspect",{azimuth:0,elevation:0,distance:30});
const side=A.cameraPose(state,"inspect",{azimuth:90,elevation:0,distance:30});
const front=A.cameraPose(state,"inspect",{azimuth:180,elevation:0,distance:30});
const overhead=A.cameraPose(state,"inspect",{azimuth:270,elevation:65,distance:30});
assert.ok(back.eye[2]<-29,"rear quarter starts behind the cabin");
assert.ok(side.eye[0]<-29,"90-degree orbit moves camera beside the helicopter");
assert.ok(front.eye[2]>29,"180-degree orbit looks from the aircraft nose");
assert.ok(overhead.eye[1]>20,"high elevation provides upper rotor visibility");
assert.ok(Math.abs(back.pitch)<.01);
assert.ok(overhead.pitch<-.9);
assert.equal(A.cameraPose(state,"inspect",{distance:1}).eye[2] < 0,true);
assert.equal(X.IDS.length,7);

const calls={count:0,save(){},restore(){},translate(){},beginPath(){},
 moveTo(){},lineTo(){},closePath(){},fill(){this.count++},
 set fillStyle(value){this.color=value}};
for(const id of X.IDS){
 const count=calls.count;
 assert.equal(C.paintInspection(calls,{id,width:700,height:450,
  orbit:{azimuth:125,elevation:33,distance:35},
  animation:{mainRotor:1.2,tailRotor:2.4,propeller:1.8}}),true);
 assert.ok(calls.count-count>A.buildVehicle(id).triangles,
  "fallback 360 inspection draws full model and animated surfaces: "+id);
}
const r44parts=C.movingParts("r44");
assert.deepEqual(r44parts.map(p=>p.name),
 ["swashBank","swashPitch","collectiveLink","mainRotor","tailPitchLink","tailRotor"]);
assert.ok(r44parts.every(p=>p.triangles.length>8));
assert.ok(A.buildVehicle("c172").triangles>250,"refined Cessna cabin and prop spinner");
assert.ok(A.buildVehicle("r44").triangles>250,"refined Robinson cowling, cabin and tail");
console.log("360 inspection unit checks passed: full orbit, zoom boundaries, all seven models and animated 2D rotor surfaces.");
