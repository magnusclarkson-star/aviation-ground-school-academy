import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const url=pathToFileURL(path.resolve("cockpit-v3.html")).href+"?mode=skills";
try{
 for(const device of [{name:"desktop",viewport:{width:1280,height:900},mobile:false},{name:"phone",viewport:{width:390,height:844},mobile:true}]){
  const page=await browser.newPage({viewport:device.viewport,isMobile:device.mobile,hasTouch:device.mobile});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__spoken=[];
   window.__cancelled=0;
   Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{
    cancel(){window.__cancelled++;},speak(u){window.__spoken.push(u.text);u.onstart?.();}
   }});
   window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  });
  await page.goto(url);
  await page.locator("#skillsPanel").waitFor({state:"visible"});
  assert.equal(await page.locator("#skillsLiveCue").isVisible(),true);
  assert.equal(await page.locator(".digital-screen-column #skillsLiveCue").count(),1);
  assert.equal(await page.locator("#skillsLiveVoice").getAttribute("aria-pressed"),"false");
  await page.locator("#skillsSelect").selectOption("turn");
  await page.locator("#skillsStart").click();
  await page.waitForTimeout(1250);
  assert.equal(await page.evaluate(()=>window.__spoken.length),0,"no voice without opt-in");
  assert.match(await page.locator("#skillsLiveCue").textContent(),/horizon|slip\/skid|turn-rate|airspeed/i);
  await page.locator("#skillsEnd").click();
  await page.locator("#skillsRetry").click();
  await page.locator("#skillsLiveVoice").click();
  assert.equal(await page.locator("#skillsLiveVoice").getAttribute("aria-pressed"),"true");
  await page.locator("#skillsStart").click();
  await page.waitForFunction(()=>window.__spoken.length>0,{timeout:5000});
  assert.match((await page.evaluate(()=>window.__spoken[0])),/Simulated cockpit practice cue/);
  assert.match(await page.locator("#skillsLiveCue").textContent(),/horizon|slip\/skid|turn-rate|airspeed/i);
  await page.locator("#skillsLiveVoice").click();
  assert.equal(await page.locator("#skillsLiveVoice").getAttribute("aria-pressed"),"false");
  assert.ok(await page.evaluate(()=>window.__cancelled>0));
  await page.locator("#skillsEnd").click();
  assert.match(await page.locator("#skillsLiveCue").textContent(),/Observation finished/i);
  assert.deepEqual(errors,[],"no page errors on "+device.name);
  await page.close();
 }
 console.log("Live teaching cues browser passed on desktop and 390px touch display: colocated PFD, consent, speech, mute and end.");
}finally{
 await browser.close();
}
