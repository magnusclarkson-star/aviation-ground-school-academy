import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const url=pathToFileURL(path.resolve("flight-sim.html")).href;
try {
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];
 page.on("pageerror",err=>errors.push(err.message));
 await page.addInitScript(()=>{
  window.__nativeHapticMessages=[];
  window.AGSAHapticsNative={
   postMessage(message){window.__nativeHapticMessages.push(JSON.parse(message));}
  };
 });
 await page.goto(url,{waitUntil:"load"});
 assert.equal(await page.evaluate(()=>window.__nativeHapticMessages.length),0,
  "native vibration must remain off until the learner explicitly taps a control");
 await page.locator("#phoneVibrationStrongTest").click();
 const first=await page.evaluate(()=>window.__nativeHapticMessages.at(-1));
 assert.deepEqual(first,{type:"vibrate",pattern:[180,100,180]});
 await page.locator("#phoneDiagnostics").evaluate(el=>el.open=true);
 await page.locator("#phoneRefreshDiagnostics").click();
 assert.match(await page.locator("#phoneDiagnosticsText").inputValue(),
  /Vibration path: Android app native bridge/);
 await page.locator("#hapticsToggle").click();
 assert.equal(await page.locator("#hapticsToggle").getAttribute("aria-pressed"),"true");
 await page.locator("#hapticsToggle").click();
 assert.deepEqual(await page.evaluate(()=>window.__nativeHapticMessages.at(-1)),
  {type:"cancel"},"disabling flight vibration must cancel native motor");
 assert.equal(await page.locator("#flightInstruments").isVisible(),true);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[]);
 await page.close();
 console.log("Simulated native Android bridge, explicit consent, cancellation, and phone view passed.");
} finally {
 await browser.close();
}
