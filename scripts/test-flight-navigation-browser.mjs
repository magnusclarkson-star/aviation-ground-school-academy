import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
const position=async(page,selector)=>page.locator(selector+" [data-nav-map]").first().getAttribute("data-nav-position");
const relativeY=async(page,selector)=>page.evaluate(selector=>{
 const c=document.querySelector("#cockpitMain").getBoundingClientRect();
 return document.querySelector(selector).getBoundingClientRect().top-c.top;
},selector);

try{
 const desktop=await browser.newPage({viewport:{width:1200,height:900}});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 assert.equal(await desktop.locator(".cockpit-nav-screen [data-nav-map]").count(),1,"Cessna radio stack has a live map");
 assert.equal(await desktop.locator(".avionics-track").count(),0,"static nav illustration has been replaced");
 const start=await position(desktop,".cockpit-nav-screen");
 assert.equal(start,"0.0,0.0","map starts at runway origin");
 const yokeY=await relativeY(desktop,"#controlPad"),pedalY=await relativeY(desktop,"#leftRudder");
 const derived=await desktop.evaluate(()=>{
  const mock={xM:230,zM:-1450,headingDeg:90,trackDeg:105,groundSpeedKt:72};
  const map=document.querySelector(".cockpit-nav-screen [data-nav-map]");
  window.AGSAFlightNavigation.paint(document.querySelector("#cockpitVisualPanel"),mock);
  return {pos:map.dataset.navPosition,transform:map.querySelector("[data-nav-world]").getAttribute("transform"),
   track:map.querySelector("[data-nav-track-pointer]").getAttribute("transform"),
   readouts:[...map.querySelectorAll("[data-nav-field]")].map(el=>el.textContent)};
 });
 assert.equal(derived.pos,"230.0,-1450.0");
 assert.match(derived.transform,/rotate\(-90\.00\)/,"heading-up map rotates opposite aircraft heading");
 assert.match(derived.transform,/translate\(-230\.00 1450\.00\)/);
 assert.equal(derived.track,"rotate(15.00 110 82)");
 assert.ok(derived.readouts.includes("E230 S1450"));
 assert.ok(derived.readouts.includes("GS 72"));
 const rejoinedFinal=await desktop.evaluate(()=>{
  const M=window.AGSAImmersiveFlight,C=window.AGSACircuitGuide,
   N=window.AGSAFlightNavigation;
  const state=M.makeState("airplane","runway",{airframeId:"c172"});
  Object.assign(state,{phase:"flight",onGround:false,xM:145,zM:-1450,
   altitudeM:115,headingDeg:358,trackDeg:358,speedKt:73,verticalMs:-1});
  const route=C.create(state),input=M.makeInput("airplane");
  input.throttle=.49;
  M.step(state,input,.05);
  C.update(route,state);
  const nav=N.paint(document.querySelector("#cockpitVisualPanel"),state,route);
  return {phase:state.phase,leg:route.stage,readout:nav.circuitText};
 });
 assert.equal(rejoinedFinal.phase,"approach",
  "real return leg becomes final approach without pressing reset");
 assert.equal(rejoinedFinal.leg,"final");
 assert.match(rejoinedFinal.readout,/FINAL/);
 assert.match(rejoinedFinal.readout,/E1[34][0-9]+m/);
 const liveCoach=await desktop.evaluate(()=>{
  const M=window.AGSAImmersiveFlight,G=window.AGSAFlightGuidance,
   input=M.makeInput("airplane");
  const position={xM:270,zM:1950,headingDeg:92,trackDeg:92,
   altitudeM:120,onGround:false,phase:"flight",speedKt:83};
  const observations={};
  for(const physicsId of ["classic","aero"]){
   const state=M.makeState("airplane","runway",{physicsId});
   const progress=G.start(state);
   Object.assign(state,position);
   progress.circuit.stage="crosswind";
   observations[physicsId]=G.guidance(state,input,progress);
  }
  return observations;
 });
 for(const physicsId of ["classic","aero"]){
  assert.equal(liveCoach[physicsId].tag,"RETURN CIRCUIT · CROSSWIND");
  assert.match(liveCoach[physicsId].text,/TURN RIGHT 12[0-9]°/);
  assert.match(liveCoach[physicsId].text,/to CROSSWIND/);
 }

 const finalTurn=await desktop.evaluate(()=>{
  const mock={mode:"airplane",scenario:"approach",phase:"approach",
   onGround:false,xM:180,zM:-850,altitudeM:110,headingDeg:0,trackDeg:0,groundSpeedKt:72};
  const route=window.AGSACircuitGuide.create(mock);
  window.AGSAFlightNavigation.paint(document.querySelector("#cockpitVisualPanel"),mock,route);
  return document.querySelector(".cockpit-nav-screen [data-nav-field=runway]").textContent;
 });
 assert.match(finalTurn,/FINAL/);
 assert.match(finalTurn,/E180m/);
 assert.match(finalTurn,/L9°/,"live screen should show left intercept while east of runway");
 await desktop.locator(".cockpit-nav-screen").click({position:{x:42,y:50}});
 assert.equal(await desktop.locator("#cockpitZoomPanel").isVisible(),true,"tap on nav map opens expanded screen");
 assert.equal(await desktop.locator("#cockpitZoomContent [data-nav-map]").count(),1);
 assert.match(await desktop.locator("#cockpitZoomTitle").textContent(),/NAV MAP/);
 assert.ok(Math.abs((await relativeY(desktop,"#controlPad"))-yokeY)<1,"nav zoom does not move yoke");
 assert.ok(Math.abs((await relativeY(desktop,"#leftRudder"))-pedalY)<1,"nav zoom does not move pedals");
 await desktop.locator("#startApproach").click();
 const navPositions=()=>desktop.evaluate(()=>{
  const main=document.querySelector(".cockpit-nav-screen [data-nav-map]").dataset.navPosition;
  const zoom=document.querySelector("#cockpitZoomContent [data-nav-map]").dataset.navPosition;
  return {main,zoom};
 });
 const approach=await position(desktop,".cockpit-nav-screen");
 const nearRunwayStart=actual=>{
  const [east,north]=actual.split(",").map(Number);
  return Math.abs(east)<2&&Math.abs(north+1450)<8;
 };
 assert.ok(nearRunwayStart(approach),"approach initializes map near its defined position before live movement");
 const initialMapPair=await navPositions();
 assert.equal(initialMapPair.zoom,initialMapPair.main,"zoomed map tracks live position at the same instant");
 await desktop.waitForTimeout(1250);
 const flown=await position(desktop,".cockpit-nav-screen");
 assert.notEqual(flown,approach,"aircraft advances and the map moves during real simulator flight");
 const flyingMapPair=await navPositions();
 assert.equal(flyingMapPair.zoom,flyingMapPair.main,"expanded and main maps share the same live flight frame");
 await desktop.locator("#cockpitZoomClose").click();
 await desktop.locator("#restartFlight").click();
 const resetPosition=await position(desktop,".cockpit-nav-screen");
 assert.ok(nearRunwayStart(resetPosition),"Restart Flight returns near initial approach position despite active movement: "+resetPosition);
 await desktop.locator("#cockpitAircraftSelect").selectOption("f35");
 assert.equal(await desktop.locator("#cockpitVisualPanel .cockpit-mfd-nav [data-nav-map]").count(),1,
  "fighter nav screen also has a moving map");
 await desktop.locator(".cockpit-mfd-nav").click({position:{x:65,y:55}});
 assert.equal(await desktop.locator("#cockpitZoomContent .cockpit-mfd-nav [data-nav-map]").count(),1,
  "fighter nav display enlarges when tapped");
 await desktop.locator("#cockpitZoomClose").click();
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone "+e.message));
 await phone.goto(url,{waitUntil:"load"});
 assert.ok(await phone.locator(".cockpit-nav-screen [data-nav-map]").first().isVisible());
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 const phoneYoke=await relativeY(phone,"#controlPad");
 await phone.locator(".cockpit-nav-screen").tap();
 assert.equal(await phone.locator("#cockpitZoomPanel").isVisible(),true,"phone tap expands Cessna moving map");
 assert.ok((await phone.locator("#cockpitZoomContent .cockpit-nav-scene svg").boundingBox()).height>=100);
 assert.ok(Math.abs((await relativeY(phone,"#controlPad"))-phoneYoke)<1,"enlarging nav map never moves the yoke");
 await phone.locator("#cockpitZoomClose").tap();
 await phone.setViewportSize({width:844,height:390});
 await phone.waitForTimeout(120);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"landscape map has no horizontal overflow");
 assert.ok(await phone.locator(".cockpit-nav-screen [data-nav-map]").count()===1);
 await phone.locator("#cockpitAircraftSelect").selectOption("fa18");
 assert.equal(await phone.locator("#cockpitVisualPanel .cockpit-mfd-nav [data-nav-map]").count(),1);
 assert.deepEqual(errors,[],"navigation and touch zoom cause no browser runtime errors");
 console.log("Live navigation browser passed: dynamic local position, heading/track, moving flight, restart reset, Cessna and fighter tap-to-zoom, phone portrait/landscape.");
}finally{await browser.close();}
