import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
const metrics=async page=>page.evaluate(()=>{
 const rect=q=>{const e=document.querySelector(q);if(!e)return null;
  const r=e.getBoundingClientRect();
  return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};
 };
 const station=document.querySelector("#cockpitStation");
 return {viewport:{width:innerWidth,height:innerHeight},
  scrollWidth:document.documentElement.scrollWidth,
  focus:document.body.dataset.cockpitFocus,photoDeck:station.dataset.photoCockpit,
  aircraft:station.dataset.airframe,well:rect("#cockpitInstrumentWell"),
  scenery:rect(".scene-shell"),scene:rect(".scene-panel"),
  instruments:rect("#cockpitVisualPanel"),gauges:[...document.querySelectorAll("#cockpitVisualPanel .cockpit-gauge")].map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height}}),
  switches:rect("#cockpitSwitchPanel"),control:rect("#cockpitMain .control-panel"),side:rect("#cockpitMain .side-controls"),flaps:rect("#flapPanel"),brake:rect("#brake"),yoke:rect("#controlPad"),
  left:rect("#leftRudder"),right:rect("#rightRudder"),power:rect("#powerPanel"),
  stationClient:station.clientHeight,stationScroll:station.scrollHeight,stationScrollTop:station.scrollTop};
});
try{
 const desktop=await browser.newPage({viewport:{width:1200,height:880}});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 const focus=desktop.locator("#cockpitFocusButton");
 assert.equal(await focus.getAttribute("aria-pressed"),"false");
 assert.equal(await desktop.locator("#cockpitZoomPanel").isVisible(),false);
 await focus.click();
 assert.equal(await focus.getAttribute("aria-pressed"),"true");
 let desktopData=await metrics(desktop);
 assert.equal(desktopData.focus,"on");
 assert.equal(Math.round(desktopData.scene.top),0);
 assert.ok(Math.abs(desktopData.scene.height-880)<=2);
 assert.ok(desktopData.yoke.top>desktopData.instruments.bottom-20,
  "the yoke remains below the gauges even in focused view");
 assert.ok(desktopData.left.top>=desktopData.yoke.bottom-12,
  "rudder pedals remain directly below the yoke");
 await desktop.locator("#cockpitVisualPanel .cockpit-gauge").first().click({position:{x:35,y:38}});
 assert.equal(await desktop.locator("#cockpitZoomPanel").isVisible(),true);
 await desktop.keyboard.press("Escape");
 assert.equal(await desktop.locator("#cockpitZoomPanel").isVisible(),false);
 assert.equal(await focus.getAttribute("aria-pressed"),"true",
  "first Escape closes instrument, not cockpit view");
 await desktop.keyboard.press("Escape");
 assert.equal(await focus.getAttribute("aria-pressed"),"false",
  "second Escape exits focused flight view");
 assert.equal(await desktop.locator("body").getAttribute("data-cockpit-focus"),"off");
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone "+e.message));
 await phone.goto(url,{waitUntil:"load"});
 const phoneFocus=phone.locator("#cockpitFocusButton");
 await phoneFocus.tap();
 assert.equal(await phoneFocus.getAttribute("aria-pressed"),"true");
 let portrait=await metrics(phone);
 assert.equal(portrait.focus,"on");
 assert.equal(Math.round(portrait.scene.top),0);
 assert.ok(Math.abs(portrait.scene.height-844)<=2);
 assert.equal(portrait.scrollWidth<=392,true,"phone focus does not widen document");
 const padHeight=portrait.yoke.height;
 await phone.locator("#controlPad").tap();
 assert.equal((await metrics(phone)).yoke.height,padHeight,"steering touch does not enlarge yoke");
 await phone.setViewportSize({width:844,height:390});
 await phone.waitForTimeout(150);
 let landscape=await metrics(phone);
 assert.equal(landscape.focus,"on","focus remains enabled when phone rotates");
 assert.equal(landscape.viewport.width,844);
 assert.equal(landscape.viewport.height,390);
 assert.ok(landscape.scrollWidth<=846,"no horizontal overflow in landscape");
 assert.ok(Math.abs(landscape.scene.height-390)<=2,"scene occupies one phone screen");
 console.log("Focused landscape geometry",JSON.stringify(landscape));
 assert.equal(landscape.photoDeck,"on",
  "C172 PILOT now shows the unified photograph-style aircraft dashboard");
 assert.ok(landscape.scenery.height>=380,
  "the runway remains the full-screen background behind the real instrument console");
 assert.ok(landscape.instruments.top<landscape.scenery.bottom-90,
  "live instruments occupy the cockpit overlay, not a separate page");
 assert.ok(landscape.instruments.top>65,
  "windscreen retains usable forward runway visibility above the glareshield");
 assert.ok(landscape.yoke.top>=landscape.instruments.top+85,
  "realistic physical yoke sits beneath the aircraft instrument dials");
 assert.ok(landscape.well.width>600,
  "C172 uses a wide aircraft dashboard rather than an R44 central pedestal");
 assert.ok(landscape.left.top>=landscape.yoke.bottom-10,
  "left pedal is beneath the centered yoke");
 assert.ok(landscape.right.top>=landscape.yoke.bottom-10,
  "right pedal is beneath the centered yoke");
 assert.ok(Math.abs((landscape.yoke.left+landscape.yoke.right)/2-(landscape.scene.width/2))<60,
  "flight yoke centered in one-screen cockpit");
 assert.ok(landscape.left.bottom<=390+2&&landscape.right.bottom<=390+2,
  "both rudder pedals fit in the same visible phone frame");
 assert.ok(landscape.yoke.width>=80&&landscape.yoke.height>=50,
  "functional center yoke remains touch sized");
 assert.ok(landscape.gauges.every(g=>g.width>=44&&g.top>=landscape.instruments.top-3&&g.bottom<=392),
  "all eight C172 live analogue gauges must be visible and touch-sized in landscape");
 assert.ok(landscape.power.bottom<=392&&landscape.flaps.bottom<=392&&landscape.brake.bottom<=392,
  "power, flaps and wheel brake are visible together with gauges, yoke and pedals");
 await phone.locator("#cockpitSwitch_light").tap();
 assert.equal(await phone.locator("#lightingMode").inputValue(),"golden");
 assert.equal(await phone.locator("#cockpitFocusButton").getAttribute("aria-pressed"),"true");
 await phone.locator("#cockpitAircraftSelect").selectOption("r44");
 assert.equal(await phone.locator("#cockpitStation").getAttribute("data-family"),"rotor");
 assert.equal(await phone.locator("#cockpitVisualPanel .cockpit-gauge").count(),8);
 const rotorDeck=await metrics(phone);
 assert.equal(rotorDeck.photoDeck,"on","R44 has its own photographed-flightdeck structure");
 assert.ok(rotorDeck.well.width<landscape.well.width*.78,
  "R44 has the narrow central instrument head instead of a wide Cessna dashboard");
 assert.ok(rotorDeck.gauges.every(g=>g.width>=44&&g.bottom<=392),
  "R44 central console keeps all eight live instruments within landscape");
 assert.ok(rotorDeck.left.bottom<=392&&rotorDeck.right.bottom<=392,
  "both anti-torque pedals remain available below the T-bar cyclic");
 assert.equal(await phone.locator('[data-rotor-tbar]').isVisible(),true);
 await phone.locator("#cockpitFocusButton").tap();
 assert.equal(await phone.locator("body").getAttribute("data-cockpit-focus"),"off");
 assert.equal(await phone.locator("#cockpitFocusButton").getAttribute("aria-pressed"),"false");
 await phone.setViewportSize({width:390,height:844});
 assert.deepEqual(errors,[],"no JavaScript errors in focused view");
 console.log("Real C172 wide dashboard and R44 central pedestal passed: integrated scenery, functional gauges, yoke/cyclic, pedals, switches and instrument-only zoom.");
}finally{await browser.close();}
