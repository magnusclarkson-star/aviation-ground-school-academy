import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
const numeric=async(page,selector)=>Number((await page.locator(selector).textContent()).replace(/[^\d.\-]/g,""));
try{
 const page=await browser.newPage({viewport:{width:1180,height:900}});
 page.on("pageerror",e=>errors.push("desktop "+e.message));
 await page.goto(url,{waitUntil:"load"});
 assert.equal(await page.locator("#physicsSelect").inputValue(),"classic");
 assert.equal(await page.locator("#energyPanel").isVisible(),false);
 assert.match(await page.locator("#environmentStatus").textContent(),/Classic learning model/);
 await page.locator("#startApproach").click();
 assert.equal(await page.locator("#readSpeed").textContent(),"73",
  "classic approach remains unchanged until experimental mode is selected");
 assert.equal(await page.locator("#energyPanel").isVisible(),false);

 await page.locator("#physicsSelect").selectOption("aero");
 assert.equal(await page.locator("#energyPanel").isVisible(),true);
 assert.match(await page.locator("#environmentStatus").textContent(),/Experimental energy dynamics/);
 assert.match(await page.locator("#physicsHint").textContent(),/invented forces/);
 assert.equal(await page.locator("#readSpeed").textContent(),"73");
 assert.ok((await numeric(page,"#aeroEnergy"))>1000,
  "the fresh fictional final approach starts with physical-model kinetic and height energy");
 assert.equal(await page.locator("#coachElapsed").textContent(),"0 s",
  "switching physics resets the local practice clock rather than carrying a prior session");
 await page.waitForTimeout(1000);
 assert.ok((await numeric(page,"#aeroLift"))>0,"wing lift should update live");
 assert.ok((await numeric(page,"#aeroDrag"))>0,"wing drag should update live");
 assert.ok((await numeric(page,"#aeroEnergy"))>0,"kinetic + potential energy should update");
 assert.ok(Number.isFinite(await numeric(page,"#aeroAoA")));
 assert.match(await page.locator("#aeroAlert").textContent(),/coefficients/);

 await page.locator("#flaps").selectOption("30");
 await page.waitForTimeout(110);
 assert.equal(await page.locator("#systemsFlapValue").textContent(),"30°");
 await page.locator("#power").evaluate(el=>{
  el.value="85";el.dispatchEvent(new Event("input",{bubbles:true}));
 });
 await page.waitForTimeout(600);
 assert.equal(await page.locator("#systemsPowerValue").textContent(),"85%");
 assert.ok((await numeric(page,"#systemsEngineValue"))>49,
  "conceptual engine motion must reflect the new delayed engine response");

 await page.locator("#windSelect").selectOption("crosswind");
 assert.equal(await page.locator("#energyPanel").isVisible(),true);
 await page.waitForTimeout(650);
 assert.ok((await numeric(page,"#readOffset"))>0,
  "experimental model should still use synthetic wind ground drift");
 assert.match(await page.locator("#coachPhase").textContent(),/EXPERIMENTAL|SHORT FINAL/);
 await page.locator("#pauseFlight").click();
 // Allow the final in-flight render to catch up with the click handler
 // before capturing a frozen display value.
 await page.waitForTimeout(130);
 const energy=await page.locator("#aeroEnergy").textContent();
 await page.waitForTimeout(350);
 assert.equal(await page.locator("#aeroEnergy").textContent(),energy,
  "paused experimental model must freeze all energy calculations");
 await page.locator("#pauseFlight").click();

 await page.locator("#typeCyclic").click();
 assert.equal(await page.locator("#physicsWrap").isVisible(),false);
 assert.equal(await page.locator("#physicsSelect").isDisabled(),true);
 assert.equal(await page.locator("#energyPanel").isVisible(),false);
 assert.equal(await page.locator("#systemsEngineLabel").textContent(),"ROTOR SPEED · SIM");
 await page.locator("#typeYoke").click();
 assert.equal(await page.locator("#physicsSelect").inputValue(),"aero");
 assert.equal(await page.locator("#physicsSelect").isDisabled(),false);
 assert.equal(await page.locator("#energyPanel").isVisible(),true);
 await page.locator("#physicsSelect").selectOption("classic");
 assert.equal(await page.locator("#energyPanel").isVisible(),false);
 assert.match(await page.locator("#environmentStatus").textContent(),/Classic learning model/);
 assert.deepEqual(errors,[]);
 await page.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone "+e.message));
 await phone.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
   if(this.id==="outsideView3D"&&kind==="webgl2")return null;
   return original.call(this,kind,...args);
  };
 });
 await phone.goto(url,{waitUntil:"load"});
 await phone.locator("#physicsSelect").selectOption("aero");
 await phone.locator("#startApproach").tap();
 await phone.waitForTimeout(750);
 assert.equal(await phone.locator("#energyPanel").isVisible(),true);
 assert.ok((await numeric(phone,"#aeroEnergy"))>0);
 assert.ok(await phone.locator("#outsideView").isVisible());
 assert.ok(await phone.locator("#miniAttitude").isVisible());
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  "experimental force panel must not widen the 390px phone");
 await phone.locator("#rightRudder").scrollIntoViewIfNeeded();
 const pad=await phone.locator("#controlPad").boundingBox();
 const pedal=await phone.locator("#rightRudder").boundingBox();
 assert.ok(pad&&pedal&&Math.abs(pad.y-pedal.y)<145,
  "two-thumb control layout must survive experimental physics display");
 await phone.locator("#instrumentToggle").tap();
 assert.equal(await phone.locator("#miniAttitude").isVisible(),false);
 assert.equal(await phone.locator("#energyPanel").isVisible(),true);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 await phone.locator("#physicsSelect").selectOption("classic");
 assert.equal(await phone.locator("#energyPanel").isVisible(),false);
 assert.ok(await phone.locator("#outsideView").isVisible());
 assert.deepEqual(errors,[]);
 await phone.close();
 console.log("Experimental aerodynamics browser passed: classic isolation, live lift/drag/energy, engine lag, wind drift, pause, helicopter fallback and 390px phone controls.");
}finally{await browser.close();}
