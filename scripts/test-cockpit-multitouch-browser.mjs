import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const url=pathToFileURL(path.resolve("cockpit-v3.html")).href+"?mode=skills";
const failures=[];
const controls=async page=>await page.locator("#activeControlInput").textContent();
const point=async(page,selector,rx=.5,ry=.5)=>{
 const box=await page.locator(selector).boundingBox();
 assert.ok(box&&box.width>30&&box.height>20,"touch control should occupy a usable screen area: "+selector);
 return {x:Math.round(box.x+box.width*rx),y:Math.round(box.y+box.height*ry)};
};
try{
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>failures.push(e.message));
 await phone.goto(url,{waitUntil:"load"});
 await phone.locator("#skillsPanel").waitFor({state:"visible"});
 await phone.locator("#skillsSelect").selectOption("turn");
 await phone.locator("#controlTypeStick").tap();
 assert.equal(await phone.locator("#digitalControlDock.simultaneous-controls").count(),1);
 assert.equal(await phone.locator("#digitalControlDock #control-yoke").count(),1);
 assert.equal(await phone.locator("#digitalControlDock #control-rudder").count(),1);
 await phone.locator("#controlPad").scrollIntoViewIfNeeded();
 const padBox=await phone.locator("#controlPad").boundingBox();
 const rudderBox=await phone.locator("#rightRudder").boundingBox();
 assert.ok(Math.abs(padBox.y-rudderBox.y)<180,"joystick and rudder should be usable on the same phone screen");
 assert.ok(rudderBox.y>=0&&rudderBox.y+rudderBox.height<=844,"both controls fit in viewport");
 const screen=await phone.locator(".digital-screen-column").boundingBox();
 assert.ok(screen&&screen.y>=-8&&screen.y<400,"PFD stays visible while both controls are reachable");
 assert.ok(await phone.locator("#activeControlInput").isVisible());
 const finger1={...(await point(phone,"#controlPad",.78,.28)),id:21};
 const finger2={...(await point(phone,"#rightRudder")),id:22};
 const cdp=await phone.context().newCDPSession(phone);
 try{
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[finger1]});
  await phone.waitForTimeout(200);
  assert.match(await controls(phone),/BANK [1-9]\d*%/,"first finger commands bank");
  assert.match(await controls(phone),/PITCH -[1-9]\d*%/,"first finger controls pitch while instruments remain visible");
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[finger1,finger2]});
  await phone.waitForTimeout(850);
  const combined=await controls(phone);
  assert.match(combined,/BANK [1-9]\d*%/,"bank stays commanded with second finger down");
  assert.match(combined,/RUDDER 100%/,"second finger commands right rudder independently");
  assert.equal(await phone.locator("#dv-slip").textContent(),"RIGHT","live PFD responds to two-finger control");
  // CDP touchEnd identifies the point being lifted, not the point to keep.
  // End only the rudder finger and leave the pad finger actively dragging.
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[finger2]});
  await phone.waitForTimeout(200);
  assert.match(await controls(phone),/BANK [1-9]\d*%/,"releasing rudder does not release joystick");
  assert.match(await controls(phone),/RUDDER 0%/,"rudder resets after its owning touch ends");
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await phone.waitForTimeout(200);
  assert.match(await controls(phone),/BANK 0% · PITCH 0% · RUDDER 0%/,"inputs reset after both fingers release");
  // A touch anywhere on the pad, not just the centre grip, should work.
  const padSide={...(await point(phone,"#controlPad",.18,.58)),id:25};
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[padSide]});
  await phone.waitForTimeout(200);
  assert.match(await controls(phone),/BANK -[1-9]\d*%/,"full-pad touch surface is interactive");
  await cdp.send("Input.dispatchTouchEvent",{type:"touchCancel",touchPoints:[]});
  await phone.waitForTimeout(150);
  assert.match(await controls(phone),/BANK 0%/,"touch cancellation safely centres the yoke");
 }finally{await cdp.detach();}
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"no horizontal phone overflow");
 await phone.locator("#digitalMode").tap();
 await phone.locator("#digitalFocusSelect-tc").tap();
 assert.equal(await phone.locator("#digitalControlDock.simultaneous-controls").count(),1,
  "turn coordinator layout also pairs yoke and rudder");
 await phone.locator("#digitalFocusSelect-asi").tap();
 assert.equal(await phone.locator("#digitalControlDock.simultaneous-controls").count(),0,
  "unrelated airspeed layout returns to one column");
 assert.deepEqual(failures,[],"browser page errors");
 console.log("Multi-touch cockpit passed: paired 390px controls, simultaneous yoke and rudder, PFD slip, independent release, pointer cancellation and responsive layout.");
 await phone.close();
}finally{await browser.close();}
