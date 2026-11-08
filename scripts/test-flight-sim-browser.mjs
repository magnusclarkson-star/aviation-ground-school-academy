import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const errors=[];
async function screenshotSignature(page){
 return page.evaluate(()=>{
  const canvas=document.querySelector("#outsideView");
  const pixels=canvas.getContext("2d").getImageData(0,0,canvas.width,canvas.height).data;
  let hash=2166136261>>>0;
  for(let i=0;i<pixels.length;i+=317){hash=Math.imul(hash^pixels[i],16777619)>>>0;}
  return hash;
 });
}
async function setRange(page,id,value){
 await page.locator(id).evaluate((node,n)=>{node.value=String(n);node.dispatchEvent(new Event("input",{bubbles:true}));},value);
}
const point=async(page,selector,x=.5,y=.5)=>{
 const box=await page.locator(selector).boundingBox();
 assert.ok(box&&box.width>45&&box.height>35,selector+" must be usable");
 return {x:Math.round(box.x+box.width*x),y:Math.round(box.y+box.height*y)};
};
try{
 const desktop=await browser.newPage({viewport:{width:1240,height:900}});
 desktop.on("pageerror",err=>errors.push("desktop: "+err.message));
 await desktop.addInitScript(()=>{
  window.__hapticCalls=[];
  Object.defineProperty(navigator,"vibrate",{configurable:true,value:pattern=>{
   window.__hapticCalls.push(pattern);return true;
  }});
 });
 await desktop.goto(url,{waitUntil:"load"});
 assert.match(await desktop.title(),/Immersive Airfield/);
 assert.equal(await desktop.locator("#typeYoke").getAttribute("aria-pressed"),"true");
 assert.equal(await desktop.locator(".hardware-yoke").isVisible(),true);
 assert.equal(await desktop.locator(".hardware-stick").isVisible(),false);
 assert.equal(await desktop.locator("#hapticsToggle").getAttribute("aria-pressed"),"false");
 assert.equal(await desktop.evaluate(()=>window.__hapticCalls.length),0,"vibration must be off by default");
 const first=await screenshotSignature(desktop);
 assert.ok(first>0);
 await desktop.locator("#startApproach").click();
 assert.match(await desktop.locator("#flightPhase").textContent(),/FINAL APPROACH/);
 assert.ok(Number(await desktop.locator("#readAlt").textContent())>75);
 await desktop.waitForTimeout(1100);
 const after=await screenshotSignature(desktop);
 assert.notEqual(after,first,"world geometry must redraw as fictional aircraft moves");
 await desktop.locator("#typeStick").click();
 assert.equal(await desktop.locator("#typeStick").getAttribute("aria-pressed"),"true");
 assert.equal(await desktop.locator(".hardware-stick").isVisible(),true);
 assert.equal(await desktop.locator(".hardware-yoke").isVisible(),false);
 await desktop.locator("#controlPad").scrollIntoViewIfNeeded();
 const p=await point(desktop,"#controlPad",.8,.25);
 await desktop.mouse.move(p.x,p.y);
 await desktop.mouse.down();
 await desktop.waitForTimeout(350);
 assert.match(await desktop.locator("#cmdBank").textContent(),/\+[1-9]\d*%/);
 assert.match(await desktop.locator("#cmdPitch").textContent(),/\+[1-9]\d*%/);
 await desktop.mouse.up();
 assert.equal(await desktop.locator("#cmdBank").textContent(),"+0%");
 assert.equal(await desktop.locator("#cmdPitch").textContent(),"+0%");
 await desktop.locator("#hapticsToggle").click();
 assert.equal(await desktop.locator("#hapticsToggle").getAttribute("aria-pressed"),"true");
 assert.ok(await desktop.evaluate(()=>window.__hapticCalls.length)>=1,"opt-in should request a short cue");
 assert.ok(await desktop.evaluate(()=>window.__hapticCalls.every(x=>Array.isArray(x)&&x.reduce((a,b)=>a+b,0)<=200)));
 await desktop.locator("#hapticsToggle").click();
 assert.equal(await desktop.evaluate(()=>window.__hapticCalls.at(-1)),0,"turning off haptics must stop it");
 await desktop.locator("#typeCyclic").click();
 assert.equal(await desktop.locator(".hardware-cyclic").isVisible(),true);
 assert.equal(await desktop.locator("#collectivePanel").isVisible(),true);
 assert.equal(await desktop.locator("#powerPanel").isVisible(),false);
 assert.equal(await desktop.locator("#flapPanel").isVisible(),false);
 assert.equal(await desktop.locator("#startApproach").isDisabled(),true,"rotorcraft must not enter airplane approach");
 await setRange(desktop,"#collective",82);
 await desktop.waitForTimeout(4400);
 assert.ok(Number(await desktop.locator("#readAlt").textContent())>2,"collective creates fictional vertical lift");
 await setRange(desktop,"#collective",34);
 await desktop.waitForFunction(()=>/HELIPAD LANDED/.test(document.querySelector("#flightPhase").textContent),
  null,{timeout:20000});
 assert.match(await desktop.locator("#flightMessage").textContent(),/landing/i);
 assert.deepEqual(errors,[]);
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone: "+e.message));
 await phone.addInitScript(()=>{
  window.__hapticCalls=[];
  Object.defineProperty(navigator,"vibrate",{configurable:true,value:pattern=>{
   window.__hapticCalls.push(pattern);return true;
  }});
 });
 await phone.goto(url,{waitUntil:"load"});
 await phone.locator("#typeStick").tap();
 assert.ok(await phone.locator("#outsideView").isVisible());
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),"no phone horizontal overflow");
 await phone.locator("#rightRudder").scrollIntoViewIfNeeded();
 const pad=await phone.locator("#controlPad").boundingBox();
 const right=await phone.locator("#rightRudder").boundingBox();
 assert.ok(pad&&right);
 assert.ok(Math.abs(pad.y-right.y)<145,"yoke and pedals must share one phone thumb row");
 assert.ok(pad.y<844&&pad.y+pad.height>0&&right.y>=0&&right.y+right.height<=844,
  "both controls must fit the visible phone viewport");
 const view=await phone.locator(".scene-panel").boundingBox();
 assert.ok(view&&view.y>=-7&&view.y<45,"outside view stays sticky while touch controls operate");
 await phone.locator("#hapticsToggle").tap();
 assert.equal(await phone.locator("#hapticsToggle").getAttribute("aria-pressed"),"true");
 await phone.locator("#rightRudder").scrollIntoViewIfNeeded();
 const finger1={...(await point(phone,"#controlPad",.77,.24)),id:21};
 const finger2={...(await point(phone,"#rightRudder")),id:22};
 const cdp=await phone.context().newCDPSession(phone);
 try{
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[finger1]});
  await phone.waitForTimeout(180);
  assert.match(await phone.locator("#cmdBank").textContent(),/\+[1-9]\d*%/);
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[finger1,finger2]});
  await phone.waitForTimeout(600);
  assert.match(await phone.locator("#cmdBank").textContent(),/\+[1-9]\d*%/);
  assert.equal(await phone.locator("#cmdRudder").textContent(),"RUDDER 100%",
   "second touch should hold rudder while first finger steers");
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[finger2]});
  await phone.waitForTimeout(120);
  assert.equal(await phone.locator("#cmdRudder").textContent(),"RUDDER 0%");
  assert.match(await phone.locator("#cmdBank").textContent(),/\+[1-9]\d*%/,
   "lifting pedal finger must not release stick");
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await phone.waitForTimeout(130);
  assert.equal(await phone.locator("#cmdBank").textContent(),"+0%");
 }finally{await cdp.detach();}
 assert.ok(await phone.evaluate(()=>window.__hapticCalls.length)>=1);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2));
 await phone.locator("#startApproach").tap();
 assert.match(await phone.locator("#flightPhase").textContent(),/FINAL APPROACH/);
 assert.ok(Number(await phone.locator("#readAlt").textContent())>75);
 await phone.locator("#typeCyclic").tap();
 assert.equal(await phone.locator("#collectivePanel").isVisible(),true);
 assert.equal(await phone.locator("#startApproach").isDisabled(),true);
 assert.deepEqual(errors,[]);
 console.log("Immersive browser passed: moving runway canvas, airplane yoke/stick/approach, rotorcraft collective and helipad landing, opt-in haptics, two-finger phone controls and responsive layout.");
 await phone.close();
}finally{await browser.close();}
