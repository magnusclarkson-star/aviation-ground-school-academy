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
 assert.match(derived.transform,/rotate\(90\.00\)/);
 assert.match(derived.transform,/translate\(-230\.00 1450\.00\)/);
 assert.equal(derived.track,"rotate(15.00 110 82)");
 assert.ok(derived.readouts.includes("E230 S1450"));
 assert.ok(derived.readouts.includes("GS 72"));
 await desktop.locator(".cockpit-nav-screen").click({position:{x:42,y:50}});
 assert.equal(await desktop.locator("#cockpitZoomPanel").isVisible(),true,"tap on nav map opens expanded screen");
 assert.equal(await desktop.locator("#cockpitZoomContent [data-nav-map]").count(),1);
 assert.match(await desktop.locator("#cockpitZoomTitle").textContent(),/NAV MAP/);
 assert.ok(Math.abs((await relativeY(desktop,"#controlPad"))-yokeY)<1,"nav zoom does not move yoke");
 assert.ok(Math.abs((await relativeY(desktop,"#leftRudder"))-pedalY)<1,"nav zoom does not move pedals");
 await desktop.locator("#startApproach").click();
 const approach=await position(desktop,".cockpit-nav-screen");
 assert.equal(approach,"0.0,-1450.0","approach initializes map to aircraft position");
 assert.equal(await position(desktop,"#cockpitZoomContent"),approach,"zoomed map tracks same initial position");
 await desktop.waitForTimeout(1250);
 const flown=await position(desktop,".cockpit-nav-screen");
 assert.notEqual(flown,approach,"aircraft advances and the map moves during real simulator flight");
 assert.equal(await position(desktop,"#cockpitZoomContent"),flown,"expanded map stays in sync while flying");
 await desktop.locator("#cockpitZoomClose").click();
 await desktop.locator("#restartFlight").click();
 assert.equal(await position(desktop,".cockpit-nav-screen"),approach,"Restart Flight returns the map to the original position");
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
 await phone.locator(".cockpit-nav-screen").tap();
 assert.equal(await phone.locator("#cockpitZoomPanel").isVisible(),true,"phone tap expands Cessna moving map");
 assert.ok((await phone.locator("#cockpitZoomContent .cockpit-nav-scene svg").boundingBox()).height>=100);
 assert.ok(Math.abs((await relativeY(phone,"#controlPad"))-(await relativeY(phone,"#controlPad")))<1);
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
