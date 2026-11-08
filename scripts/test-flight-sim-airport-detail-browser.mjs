import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
try{
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push(e.message));
 await phone.goto(pathToFileURL(path.resolve("flight-sim.html")).href,{waitUntil:"load"});
 const geometry=await phone.evaluate(()=>{
  const A=window.AGSAFlightAirportDetail,Three=window.AGSAFlight3D;
  if(!A||!Three)return null;
  const mesh=new Three.Mesh();
  Three.airportDetails(mesh);
  return {triangles:mesh.finish().triangles,
   parked:A.config.parkedTrainers.length,
   apron:A.config.apron,
   taxi:A.config.taxiway.length,
   lights:A.config.approachLights.length};
 });
 assert.ok(geometry,"shared airport details must be loaded");
 assert.ok(geometry.triangles>80&&geometry.triangles<4000);
 assert.equal(geometry.parked,2);
 assert.equal(geometry.taxi,3);
 assert.equal(geometry.lights,8);
 await phone.locator("#visualMode").selectOption("2d");
 assert.equal(await phone.locator("#outsideView").isVisible(),true);
 const changes=await phone.evaluate(()=>{
  const app=window.AGSAImmersiveFlight,scene=window.AGSAFlightScenery;
  function signature(z){
   const c=document.createElement("canvas");c.width=480;c.height=270;
   const state=app.makeState("airplane");state.zM=z;
   scene.draw(c,state,{reducedMotion:true,lighting:"day"});
   const bytes=c.getContext("2d").getImageData(0,0,c.width,c.height).data;
   let hash=2166136261>>>0;
   for(let i=0;i<bytes.length;i+=211)hash=Math.imul(hash^bytes[i],16777619)>>>0;
   return hash;
  }
  return [signature(0),signature(300),signature(600)];
 });
 assert.equal(new Set(changes).size,3,"moving along airport must update perspective scene");
 assert.equal(await phone.locator("#flightInstruments").isVisible(),true);
 assert.equal(await phone.locator("#controlPad").isVisible(),true);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  "phone screen must not have horizontal overflow");
 assert.deepEqual(errors,[],"airport rendering should not cause script errors");
 await phone.close();
 console.log("Phone airport detail passed: 2D parallax, shared 3D landmarks, instruments and controls visible.");
}finally{await browser.close();}
