import assert from "node:assert/strict";
import {chromium} from "playwright";
import path from "node:path";
import {pathToFileURL} from "node:url";

const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
try{
 const desktop=await browser.newPage({viewport:{width:1200,height:900}});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 const panel=desktop.locator("#cockpitSwitchPanel");
 assert.ok(await panel.isVisible());
 assert.equal(await desktop.locator(".cockpit-switch").count(),4);
 for(const [button,source,after,again] of [
  ["view","cameraMode","chase","side"],
  ["graphics","visualMode","2d","3d"],
  ["frame","cockpitFrameToggle","off","on"]
 ]){
  await desktop.locator("#cockpitSwitch_"+button).click();
  assert.equal(await desktop.locator("#"+source).inputValue(),after,button+" uses real selector");
  await desktop.locator("#cockpitSwitch_"+button).click();
  assert.equal(await desktop.locator("#"+source).inputValue(),again,button+" cycles back");
 }
 await desktop.locator("#cockpitSwitch_view").click();
 assert.equal(await desktop.locator("#cameraMode").inputValue(),"top","VIEW cycles to overhead inspection");
 await desktop.locator("#cockpitSwitch_view").click();
 assert.equal(await desktop.locator("#cameraMode").inputValue(),"cockpit","VIEW returns to pilot after four positions");
 for(const value of ["golden","dusk","day"]){
  await desktop.locator("#cockpitSwitch_light").click();
  assert.equal(await desktop.locator("#lightingMode").inputValue(),value);
 }
 await desktop.locator("#lightingMode").selectOption("dusk");
 assert.equal(await desktop.locator("#cockpitSwitch_light .cockpit-switch-value").textContent(),"DUSK",
  "underlying scenery option updates physical switch");
 await desktop.locator("#lightingMode").selectOption("day");
 await desktop.locator("#startApproach").click();
 await desktop.waitForTimeout(400);
 assert.ok(Number((await desktop.locator("#cockpitIndicatorSpeed").textContent()).replace(" KT",""))>40,
  "airspeed lamp tracks running flight");
 assert.equal(await desktop.locator("#cockpitIndicatorFlap").textContent(),
  await desktop.locator("#flaps").inputValue()+"°");
 assert.equal(await desktop.locator("#cockpitIndicatorPower").textContent(),
  await desktop.locator("#power").inputValue()+"%");
 assert.equal(await desktop.locator("#cockpitVisualPanel .cockpit-gauge").count(),8,
  "new switches keep realistic analog panel");
 assert.equal(await desktop.locator("#controlPad").evaluate(e=>e.closest("#cockpitMain")!==null),true);
 await desktop.locator("#cockpitAircraftSelect").selectOption("r44");
 assert.equal(await desktop.locator("#cockpitIndicatorFlap").evaluate(e=>e.parentElement.hidden),true,
  "no flap annunciator on helicopter");
 assert.equal(await desktop.locator("#cockpitIndicatorPower").textContent(),
  await desktop.locator("#collective").inputValue()+"%");
 await desktop.locator("#cockpitAircraftSelect").selectOption("f35");
 assert.equal(await desktop.locator("#cockpitVisualPanel .cockpit-mfd").count(),3);
 assert.equal(await panel.isVisible(),true);
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 phone.on("pageerror",e=>errors.push("phone "+e.message));
 await phone.goto(url,{waitUntil:"load"});
 assert.ok(await phone.locator("#cockpitSwitchPanel").isVisible());
 const before=await phone.locator("#controlPad").boundingBox();
 await phone.locator("#cockpitSwitch_light").tap();
 assert.equal(await phone.locator("#lightingMode").inputValue(),"golden");
 const after=await phone.locator("#controlPad").boundingBox();
 assert.equal(after.height,before.height,"cockpit switch does not enlarge touch flight controls");
 const mobile=await phone.evaluate(()=>{
  const sw=document.querySelector("#cockpitSwitchPanel").getBoundingClientRect();
  const gauges=document.querySelector("#cockpitVisualPanel").getBoundingClientRect();
  const yoke=document.querySelector("#controlPad").getBoundingClientRect();
  const pedal=document.querySelector("#leftRudder").getBoundingClientRect();
  return {noOverflow:document.documentElement.scrollWidth<=innerWidth+2,
   switchesUnderInstruments:sw.top>=gauges.bottom-4,
   yokeUnderSwitches:yoke.top>=sw.bottom-6,
   pedalsUnderYoke:pedal.top>=yoke.bottom-12};
 });
 assert.deepEqual(mobile,{noOverflow:true,switchesUnderInstruments:true,
  yokeUnderSwitches:true,pedalsUnderYoke:true});
 await phone.setViewportSize({width:844,height:390});
 await phone.waitForTimeout(120);
 assert.equal(await phone.locator("#cockpitStation").getAttribute("data-orientation"),"landscape");
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  "rotated cockpit switches don't introduce horizontal scroll");
 await phone.locator("#cockpitSwitch_frame").tap();
 assert.equal(await phone.locator("#cockpitFrameToggle").inputValue(),"off");
 await phone.locator("#cockpitVisualPanel .cockpit-gauge").first().tap({position:{x:38,y:42}});
 assert.equal(await phone.locator("#cockpitZoomPanel").isVisible(),true,
  "only instruments continue to enlarge");
 assert.deepEqual(errors,[]);
 console.log("Physical cockpit switchgear passed on desktop, phone portrait and landscape.");
}finally{await browser.close();}
