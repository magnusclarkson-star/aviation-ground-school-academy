import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const url=pathToFileURL(path.resolve("cockpit-v3.html")).href;
const errors=[];
const num=async(locator)=>Number((await locator.textContent()).replace(/[^-+\d.]/g,""));
async function holdMouse(page,selector,ms=1000){
 const el=page.locator(selector);await el.scrollIntoViewIfNeeded();
 const r=await el.boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
 await page.mouse.move(x,y);await page.mouse.down();await page.waitForTimeout(ms);return async()=>page.mouse.up();
}
async function holdTouch(page,selector,ms=850){
 const el=page.locator(selector);await el.scrollIntoViewIfNeeded();
 const r=await el.boundingBox();const x=r.x+r.width/2,y=r.y+r.height/2;
 const cdp=await page.context().newCDPSession(page);
 await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y,id:1}]});
 await page.waitForTimeout(ms);
 return async()=>{await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});await cdp.detach();};
}
try{
 const desktop=await browser.newPage({viewport:{width:1330,height:910}});
 desktop.on("pageerror",e=>errors.push("desktop: "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 await desktop.locator("#focusSelect-att").click();
 assert.equal(await desktop.locator("#controlTypeYoke").getAttribute("aria-pressed"),"true");
 await desktop.locator("#controlTypeStick").click();
 assert.equal(await desktop.locator("#controlTypeStick").getAttribute("aria-pressed"),"true");
 assert.equal(await desktop.locator("#gripTypeLabel").textContent(),"STICK");
 assert.equal(await desktop.locator(".symbol-stick").isVisible(),true);
 let release=await holdMouse(desktop,"#grip",700);
 // Drag to bank and change pitch while using joystick control.
 const box=await desktop.locator("#grip").boundingBox();
 await desktop.mouse.move(box.x+box.width/2+43,box.y+box.height/2-18,{steps:7});
 await desktop.waitForTimeout(700);
 assert.ok((await num(desktop.locator("#dv-bank")))>2,"joystick drag banks aircraft");
 assert.ok((await num(desktop.locator("#dv-pitch")))>1,"joystick drag changes pitch");
 await release();
 await desktop.locator("#digitalMode").click();
 await desktop.locator("#digitalFocusSelect-att").click();
 assert.equal(await desktop.locator("#gripTypeLabel").textContent(),"STICK","style persists across cockpit modes");
 assert.equal(await desktop.locator("#pfdSlipBall").count(),1,"PFD includes slip skid indicator");
 await desktop.locator("#controlTypeYoke").click();
 assert.equal(await desktop.locator("#gripTypeLabel").textContent(),"YOKE");
 assert.equal(await desktop.locator(".symbol-yoke").isVisible(),true);
 // Model reset keeps control type but resets aerodynamic state.
 await desktop.locator("#resetBtn").click();
 await desktop.locator("#flapPitchMode").selectOption("noseDown");
 await desktop.locator("#flaps30").click();
 await desktop.waitForTimeout(1700);
 const noseDown=await num(desktop.locator("#dv-flap-pitch"));
 assert.ok(noseDown<-.5,"nose-down flap setting should move horizon");
 const downAngle=await num(desktop.locator("#dv-pitch"));
 assert.ok(downAngle<-.5,"nose-down flap response decreases pitch");
 const horizon=await desktop.locator("#pfdHorizon").getAttribute("transform");
 assert.match(horizon,/translate\(0 -/,"PFD horizon tracks the pitch response");
 await desktop.locator("#flapPitchMode").selectOption("noseUp");
 await desktop.waitForTimeout(1700);
 const noseUp=await num(desktop.locator("#dv-flap-pitch"));
 assert.ok(noseUp>.5,"nose-up model direction reverses pitch moment");
 const pitchUp=await num(desktop.locator("#dv-pitch"));
 assert.ok(pitchUp>.5,"PFD horizon moves in positive pitch for nose-up example");
 await desktop.locator("#flapPitchMode").selectOption("neutral");
 await desktop.waitForTimeout(1400);
 assert.equal(await num(desktop.locator("#dv-flap-pitch")),0,"neutral mode removes flap pitch tendency");
 await desktop.locator("#digitalFocusSelect-tc").click();
 release=await holdMouse(desktop,"#rightRudder",1000);
 assert.equal(await desktop.locator("#dv-slip").textContent(),"RIGHT","rudder moves slip/skid cue");
 assert.ok((await num(desktop.locator("#dv-turn")))>0,"rudder should change turn-rate cue");
 assert.ok((await num(desktop.locator("#dv-bank")))>1,"small illustrated secondary bank coupling responds");
 assert.ok(Number(await desktop.locator("#pfdSlipBall").getAttribute("cx"))>338,"PFD slip ball is displaced");
 await release();
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone: "+e.message));
 await phone.goto(url,{waitUntil:"load"});
 await phone.locator("#controlTypeStick").tap();
 assert.equal(await phone.locator("#gripTypeLabel").textContent(),"STICK");
 const stop=await holdTouch(phone,"#grip",350);
 await stop();
 await phone.locator("#digitalMode").tap();
 await phone.locator("#digitalFocusSelect-tc").tap();
 const endRudder=await holdTouch(phone,"#rightRudder",1000);
 assert.equal(await phone.locator("#dv-slip").textContent(),"RIGHT","touch rudder updates mobile PFD");
 await endRudder();
 await phone.locator("#digitalFocusSelect-att").tap();
 await phone.locator("#flapPitchMode").selectOption("noseUp");
 await phone.locator("#flaps20").tap();
 await phone.waitForTimeout(1200);
 assert.ok((await num(phone.locator("#dv-flap-pitch")))>0,"touch flap moves illustrated PFD horizon");
 await phone.locator("#grip").scrollIntoViewIfNeeded();
 const vis=await phone.locator(".digital-screen-column").boundingBox();
 assert.ok(vis&&vis.y>=-8&&vis.y<400,"PFD stays visible while controlling joystick on phone");
 assert.deepEqual(errors,[],"No JS errors");
 console.log("Cockpit control upgrade passed: desktop yoke/stick options, mouse joystick movement, flap pitch modes, rudder slip and bank response, and phone touches.");
 await phone.close();
}finally{await browser.close()}
