import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
const speed=async(page,id)=>Number((await page.locator(id).textContent()).replace(/[a-z° ]/gi,""));
try{
 const desktop=await browser.newPage({viewport:{width:1220,height:900}});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 assert.equal(await desktop.locator("#profileSelect").inputValue(),"trainer");
 assert.equal(await desktop.locator("#windSelect").inputValue(),"calm");
 assert.match(await desktop.locator("#environmentStatus").textContent(),/Basic trainer/);
 assert.equal(await desktop.locator("#readWind").textContent(),"Calm conditions");
 assert.equal(await desktop.locator("#readTrack").textContent(),"000°");
 assert.equal(await desktop.locator("#readGroundSpeed").textContent(),"0 kt");
 await desktop.locator("#startApproach").click();
 assert.equal(await speed(desktop,"#readSpeed"),73);
 await desktop.locator("#profileSelect").selectOption("sport");
 assert.equal(await speed(desktop,"#readSpeed"),67,
  "changing aircraft handling profile restarts with its own fictional approach speed");
 assert.match(await desktop.locator("#profileHint").textContent(),/quicker/i);
 await desktop.locator("#profileSelect").selectOption("touring");
 assert.equal(await speed(desktop,"#readSpeed"),84);
 assert.match(await desktop.locator("#profileHint").textContent(),/slower/i);

 await desktop.locator("#windSelect").selectOption("crosswind");
 assert.match(await desktop.locator("#readWind").textContent(),/Left crosswind/);
 assert.match(await desktop.locator("#environmentStatus").textContent(),/Touring trainer.*Left crosswind/);
 await desktop.waitForTimeout(1700);
 const crossTrack=await speed(desktop,"#readTrack");
 assert.ok(crossTrack>=2&&crossTrack<=25,"wind offsets aircraft ground track from nose heading");
 assert.ok(await speed(desktop,"#readOffset")>=5,"crosswind should visibly move lateral runway position");
 assert.equal(await desktop.locator("#readHeading").textContent(),"000°",
  "synthetic nose heading stays aligned while ground track drifts");
 // Displayed knots are whole numbers: a small perpendicular crosswind can
 // change ground track substantially while the rounded speeds still match.
 // Strict unrounded vector differences are validated in the model unit test.
 assert.ok(Math.abs((await speed(desktop,"#readGroundSpeed"))-
  (await speed(desktop,"#readSpeed")))<=3,
  "crosswind should change track without inventing a large speed increase");

 await desktop.locator("#windSelect").selectOption("headwind");
 assert.match(await desktop.locator("#readWind").textContent(),/Headwind/);
 await desktop.waitForTimeout(1250);
 assert.ok(await speed(desktop,"#readGroundSpeed")<await speed(desktop,"#readSpeed"),
  "headwind must reduce fictional groundspeed relative to airspeed");
 assert.ok((await speed(desktop,"#readOffset"))===0);
 await desktop.locator("#windSelect").selectOption("gusts");
 assert.match(await desktop.locator("#readWind").textContent(),/Gusty/);
 await desktop.waitForTimeout(750);
 assert.ok(await speed(desktop,"#readOffset")>0);
 assert.ok(await desktop.locator("#outsideView").isVisible());
 assert.equal(await desktop.locator("#miniAttitude").isVisible(),true);

 await desktop.locator("#typeCyclic").click();
 assert.equal(await desktop.locator("#profileWrap").isVisible(),false);
 assert.equal(await desktop.locator("#readWind").textContent(),"Gusty crosswind · illustrative");
 assert.equal(await desktop.locator("#offsetLabel").textContent(),"PAD OFFSET");
 assert.match(await desktop.locator("#environmentStatus").textContent(),/Conceptual rotorcraft/);
 await desktop.locator("#typeYoke").click();
 assert.equal(await desktop.locator("#profileWrap").isVisible(),true);
 assert.equal(await desktop.locator("#profileSelect").inputValue(),"touring",
  "fixed-wing profile choice survives a temporary helicopter mode");
 assert.equal(await desktop.locator("#windSelect").inputValue(),"gusts");
 assert.ok(await desktop.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone "+e.message));
 await phone.goto(url,{waitUntil:"load"});
 assert.equal(await phone.locator("#profileSelect option").count(),3);
 assert.equal(await phone.locator("#windSelect option").count(),4);
 await phone.locator("#profileSelect").selectOption("sport");
 await phone.locator("#windSelect").selectOption("crosswind");
 await phone.locator("#startApproach").tap();
 assert.equal(await speed(phone,"#readSpeed"),67);
 await phone.waitForTimeout(1000);
 assert.ok(await speed(phone,"#readOffset")>0);
 assert.ok(await phone.locator("#readTrack").isVisible());
 assert.ok(await phone.locator("#readGroundSpeed").isVisible());
 assert.ok(await phone.locator("#outsideView").isVisible());
 await phone.locator("#controlPad").scrollIntoViewIfNeeded();
 assert.equal(await phone.locator(".scene-shell").evaluate(el=>getComputedStyle(el).position),"sticky","outside windscreen stays visible inside cockpit without blocking page controls");
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  "aircraft and wind selectors must fit the 390px phone");
 await phone.locator("#windSelect").selectOption("calm");
 assert.equal(await phone.locator("#readWind").textContent(),"Calm conditions");
 await phone.locator("#typeCyclic").tap();
 assert.equal(await phone.locator("#profileWrap").isVisible(),false);
 await phone.locator("#windSelect").selectOption("headwind");
 assert.match(await phone.locator("#readWind").textContent(),/Headwind/);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[]);
 await phone.close();
 console.log("Profile/wind browser passed: 3 aircraft profiles, 4 wind modes, separate air/ground speed and heading/track, imagined wind drift, helipad mode and 390px phone.");
}finally{await browser.close();}
