import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
const require=createRequire(import.meta.url);
const Airport=require("../flight-sim-airport-detail.js");
const Three=require("../flight-sim-3d.js");
const M=require("../flight-sim-model.js");
const {config,strip,aircraftFootprint}=Airport;
assert.equal(config.runwayLengthM,1800);
assert.ok(Object.isFrozen(config.taxiway)&&Object.isFrozen(config.approachLights));
assert.equal(config.taxiway.length,3);
assert.equal(config.parkedTrainers.length,2);
assert.equal(config.approachLights.length,18);
assert.ok(config.serviceVehicles.length>=2);
assert.ok(config.taxiway.every(s=>[s.ax,s.az,s.bx,s.bz,s.widthM].every(Number.isFinite)));
assert.ok(config.approachLights.every(p=>p.z<0),"fictional approach fixtures should lead toward runway threshold");
const aisle=strip(20,280,220,280,8.5);
assert.equal(aisle.length,4);
assert.ok(aisle.flat().every(Number.isFinite));
assert.ok(Math.abs(aisle[0][2]-aisle[1][2])===17);
assert.deepEqual(strip(2,2,2,2,3),[]);
assert.deepEqual(strip(0,0,2,2,-3),[]);
for(const trainer of config.parkedTrainers){
 const shape=aircraftFootprint(trainer.x,trainer.z,trainer.headingDeg);
 assert.ok(shape);
 assert.equal(shape.wings.length,2);
 assert.equal(shape.spine.length,2);
 assert.ok(shape.wings.flat().every(Number.isFinite));
 assert.ok(Math.hypot(shape.wings[0][0]-shape.wings[1][0],
  shape.wings[0][2]-shape.wings[1][2])>13);
}
const mesh=new Three.Mesh();
Three.airportDetails(mesh);
const detail=mesh.finish();
assert.ok(detail.triangles>80,"taxiway strips and landmarks need real 3D polygons");
assert.ok(detail.triangles<4000,"scenery details must have bounded mobile complexity");
assert.ok([...detail.positions].every(Number.isFinite));
assert.ok([...detail.colors].every(v=>v>=0&&v<=1));
const plane=Three.buildWorld("airplane"),heli=Three.buildWorld("helicopter");
assert.ok(plane.triangles>heli.triangles,"detailed runway world has more geometry than helipad world");
assert.ok(plane.vertices<130000,"3D mobile vertex budget maintained");
assert.ok(heli.vertices<130000);
const ctx={
 createLinearGradient(){return {addColorStop(){}}},
 fillRect(){this.fills=(this.fills||0)+1},save(){},restore(){},
 translate(){},rotate(){},beginPath(){},ellipse(){},fill(){},moveTo(){},
 lineTo(){},closePath(){},stroke(){},arc(){},
};
const canvas={width:960,height:540,getContext(type){assert.equal(type,"2d");return ctx}};
const scenery=require("../flight-sim-scenery.js");
const state=M.makeState("airplane");
assert.equal(scenery.draw(canvas,state,{reducedMotion:true,lighting:"day"}),true);
assert.ok(ctx.fills>0,"2D scene renders");
const source=readFileSync(new URL("../flight-sim-scenery.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../flight-sim.html",import.meta.url),"utf8");
assert.ok(source.includes("drawAirportDetails();"),"2D includes the shared airport fixture");
assert.ok(html.includes('<script src="flight-sim-airport-detail.js?v=20261110-approachlights1" defer></script>'));
assert.ok(html.indexOf("flight-sim-airport-detail.js")<html.indexOf("flight-sim-scenery.js"));
assert.ok(html.indexOf("flight-sim-airport-detail.js")<html.indexOf("flight-sim-3d.js"));
for(const txt of ["fetch(","getUserMedia","localStorage","sessionStorage","geolocation","XMLHttpRequest"]){
 const detailSrc=readFileSync(new URL("../flight-sim-airport-detail.js",import.meta.url),"utf8");
 assert.ok(!detailSrc.includes(txt),"no external data or device access");
}
console.log("Fictional airport landmarks passed: consistent 2D/3D coordinates, geometry budget, no network, cockpit unaffected.");
