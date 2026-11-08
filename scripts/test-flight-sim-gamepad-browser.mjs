import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const errors=[];
try{
 const desktop=await browser.newPage({viewport:{width:1240,height:900}});
 desktop.on("pageerror",error=>errors.push("desktop "+error.message));
 await desktop.addInitScript(()=>{
  window.__padReads=0;
  window.__fakePad={index:0,id:"HIDDEN DEVICE SERIAL 123456",connected:true,
   axes:[0,0,0,0],buttons:Array.from({length:12},()=>({value:0,pressed:false}))};
  window.__padConnected=true;
  Object.defineProperty(navigator,"getGamepads",{
   configurable:true,value:()=>{window.__padReads++;return window.__padConnected?[window.__fakePad]:[];}
  });
 });
 await desktop.goto(url,{waitUntil:"load"});
 assert.equal(await desktop.evaluate(()=>window.__padReads),0,"no device enumeration without explicit learner consent");
 assert.equal(await desktop.locator("#gamepadToggle").getAttribute("aria-pressed"),"false");
 assert.equal(await desktop.locator("#hardwareController").evaluate(el=>el.open),false);
 await desktop.locator("#hardwareController summary").click();
 assert.equal(await desktop.locator("#gamepadToggle").isVisible(),true);
 await desktop.locator("#gamepadToggle").click();
 assert.equal(await desktop.locator("#gamepadToggle").getAttribute("aria-pressed"),"true");
 assert.equal(await desktop.locator("#gamepadSelect").inputValue(),"0");
 assert.equal(await desktop.locator("#gamepadCalibrate").isDisabled(),false);
 assert.ok((await desktop.evaluate(()=>window.__padReads))>0);
 assert.equal((await desktop.locator("#hardwareController").textContent()).includes("HIDDEN DEVICE SERIAL"),false,
  "never display device ID, vendor or serial");

 await desktop.evaluate(()=>window.__fakePad.axes.splice(0,4,.82,-.67,.58,-1));
 await desktop.waitForFunction(()=>document.querySelector("#cmdBank").textContent.includes("+"),
  null,{timeout:4000});
 await desktop.waitForTimeout(250);
 assert.match(await desktop.locator("#cmdBank").textContent(),/\+[3-9]\d%/);
 assert.match(await desktop.locator("#cmdPitch").textContent(),/\+[3-9]\d%/);
 assert.match(await desktop.locator("#cmdRudder").textContent(),/RUDDER [3-9]\d%/);
 const yoke=await desktop.locator("#pfdHorizonMotion").getAttribute("transform");
 assert.match(yoke,/rotate\(-/,"hardware bank must affect live simulated horizon");
 assert.match(await desktop.locator("#gamepadLive").textContent(),/BANK [3-9]\d%/);

 await desktop.locator("#controlPad").scrollIntoViewIfNeeded();
 const b=await desktop.locator("#controlPad").boundingBox();
 await desktop.mouse.move(b.x+b.width*.16,b.y+b.height*.82);
 await desktop.mouse.down();
 await desktop.waitForTimeout(200);
 assert.match(await desktop.locator("#cmdBank").textContent(),/-[4-9]\d%/,
  "actively held touchscreen/mouse control must override controller bank");
 await desktop.mouse.up();
 await desktop.waitForTimeout(220);
 assert.match(await desktop.locator("#cmdBank").textContent(),/\+[3-9]\d%/,"hardware bank resumes after release");

 await desktop.locator("#leftRudder").scrollIntoViewIfNeeded();
 const rudder=await desktop.locator("#leftRudder").boundingBox();
 await desktop.mouse.move(rudder.x+rudder.width*.5,rudder.y+rudder.height*.5);
 await desktop.mouse.down();await desktop.waitForTimeout(180);
 assert.equal(await desktop.locator("#cmdRudder").textContent(),"RUDDER -100%");
 await desktop.mouse.up();await desktop.waitForTimeout(180);
 assert.match(await desktop.locator("#cmdRudder").textContent(),/RUDDER [3-9]\d%/);

 await desktop.locator("#gamepadReversePitch").check();
 await desktop.waitForTimeout(180);
 assert.match(await desktop.locator("#cmdPitch").textContent(),/-[3-9]\d%/,
  "reverse pitch setting must change simulated direction");
 await desktop.locator("#gamepadReversePitch").uncheck();
 await desktop.locator("#gamepadRudder").selectOption("none");
 await desktop.waitForTimeout(160);
 assert.equal(await desktop.locator("#cmdRudder").textContent(),"RUDDER 0%");
 await desktop.locator("#gamepadRudder").selectOption("2");

 await desktop.evaluate(()=>window.__fakePad.axes.splice(0,4,.15,-.11,.07,-1));
 await desktop.locator("#gamepadCalibrate").click();
 assert.match(await desktop.locator("#gamepadStatus").textContent(),/Neutral captured/);
 await desktop.waitForTimeout(130);
 assert.equal(await desktop.locator("#cmdBank").textContent(),"+0%");
 assert.equal(await desktop.locator("#cmdPitch").textContent(),"+0%");

 await desktop.locator("#gamepadPower").selectOption("3");
 await desktop.evaluate(()=>window.__fakePad.axes[3]=1);
 await desktop.waitForTimeout(260);
 assert.equal(await desktop.locator("#powerValue").textContent(),"100%");
 await desktop.locator("#typeCyclic").click();
 await desktop.waitForTimeout(260);
 assert.equal(await desktop.locator("#collectiveValue").textContent(),"100%",
  "mapped power axis should now command fictional collective");
 assert.equal(await desktop.locator("#startApproach").isDisabled(),true);
 await desktop.locator("#gamepadPower").selectOption("none");

 // A lost hardware controller must never leave an autonomous held stick or
 // quietly continue the simulated flight as though nothing happened.
 await desktop.evaluate(()=>{window.__padConnected=false});
 await desktop.waitForFunction(()=>document.querySelector("#gamepadToggle").getAttribute("aria-pressed")==="false");
 assert.match(await desktop.locator("#gamepadStatus").textContent(),/disconnected/i);
 assert.equal(await desktop.locator("#pauseFlight").getAttribute("aria-pressed"),"true");
 assert.equal(await desktop.locator("#cmdBank").textContent(),"+0%");
 assert.equal(await desktop.locator("#cmdRudder").textContent(),"RUDDER 0%");
 await desktop.locator("#pauseFlight").click();
 assert.equal(await desktop.locator("#pauseFlight").getAttribute("aria-pressed"),"false");
 await desktop.locator("#typeStick").click();
 assert.equal(await desktop.locator("#startApproach").isDisabled(),false);
 assert.deepEqual(errors,[]);
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",error=>errors.push("phone "+error.message));
 await phone.goto(url,{waitUntil:"load"});
 assert.equal(await phone.locator("#gamepadToggle").getAttribute("aria-pressed"),"false");
 assert.ok(await phone.locator("#outsideView").isVisible());
 assert.ok(await phone.locator("#miniAttitude").isVisible());
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  "optional hardware panel must not introduce phone overflow");
 await phone.locator("#hardwareController summary").tap();
 assert.ok(await phone.locator("#gamepadStatus").isVisible());
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 await phone.locator("#hardwareController summary").tap();
 await phone.locator("#typeYoke").tap();
 assert.ok(await phone.locator("#controlPad").isVisible());
 assert.deepEqual(errors,[]);
 console.log("Hardware controller browser passed: no opt-out reads, masked device ID, axis/trim/reverse controls, live PFD, touch/pedal override, throttle/collective, disconnect pause and 390px phone fallback.");
 await phone.close();
}finally{await browser.close();}
