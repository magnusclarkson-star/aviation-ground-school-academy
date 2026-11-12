/* Focused regression for the *single* R44 switch-unit relocation.
   The cyclic, collective, rudder pedals and gauge deck must remain intact. */
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const url=pathToFileURL(path.resolve("flight-sim.html")).href;
fs.mkdirSync("artifacts",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try {
 for(const mode of [
  {label:"portrait",width:390,height:844},
  {label:"short-portrait",width:390,height:720},
  {label:"landscape",width:844,height:390}
 ]){
  const page=await browser.newPage({viewport:{width:mode.width,height:mode.height},isMobile:true,hasTouch:true});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto(url,{waitUntil:"load"});
  await page.locator("#cockpitAircraftSelect").selectOption("r44");
  // The simulator may already enter immersive pilot mode on landscape
  // launch. Do not click Exit cockpit and accidentally leave that mode.
  if(await page.evaluate(()=>document.body.dataset.cockpitFocus!=="on"))
   await page.locator("#cockpitFocusButton").click();
  await page.waitForTimeout(200);
  const startup=await page.evaluate(()=>{
   const rack=document.getElementById("cockpitSwitchPanel");
   return {parent:rack?.parentElement?.className,
    airframe:document.getElementById("cockpitStation")?.dataset.airframe,
    focused:document.body.dataset.cockpitFocus,hidden:getComputedStyle(rack).display,
    error:document.getElementById("visualStatus")?.textContent};
  });
  console.log("R44 "+mode.label+" initial state: "+JSON.stringify(startup));
  // Capture even if a layout assertion fails, so a real image exists for
  // diagnosis rather than another unverified styling change.
  await page.screenshot({path:"artifacts/r44-single-switch-"+mode.label+".png"});
  await page.waitForFunction(()=>{
   const rack=document.getElementById("cockpitSwitchPanel");
   return rack?.parentElement?.classList.contains("control-panel")&&
    document.body.dataset.cockpitFocus==="on";
  },null,{timeout:5000});
  try{await page.waitForFunction(()=>document.querySelector(".scene-shell").dataset.airframeLoading!=="on",null,{timeout:17000})}catch{}
  const result=await page.evaluate(()=>{
   const r=id=>{const t=document.getElementById(id).getBoundingClientRect();
    return {left:t.left,right:t.right,top:t.top,bottom:t.bottom,width:t.width,height:t.height};};
   const rack=document.getElementById("cockpitSwitchPanel");
   const shell=document.querySelector(".scene-shell").getBoundingClientRect();
   const station=document.getElementById("cockpitStation").getBoundingClientRect();
   const control=document.querySelector("#cockpitMain .control-panel").getBoundingClientRect();
   return {
    viewport:{width:innerWidth,height:innerHeight},
    parent:rack.parentElement?.className,
    buttons:[...rack.querySelectorAll(".cockpit-switch")].map(el=>el.id),
    rack:r("cockpitSwitchPanel"),cyclic:r("controlPad"),collective:r("collectivePanel"),
    left:r("leftRudder"),right:r("rightRudder"),instruments:r("cockpitVisualPanel"),
    shell:{top:shell.top,bottom:shell.bottom,height:shell.height},
    station:{top:station.top,bottom:station.bottom,height:station.height},
    control:{top:control.top,bottom:control.bottom},
    overflow:document.documentElement.scrollWidth-innerWidth,
    stationScroll:document.getElementById("cockpitStation").scrollTop,
    photo:document.getElementById("cockpitStation").dataset.photoCockpit
   };
  });
  assert.equal(result.buttons.length,4,mode.label+" R44 has exactly four original switches");
  assert.deepEqual(result.buttons,["cockpitSwitch_view","cockpitSwitch_graphics","cockpitSwitch_light","cockpitSwitch_frame"],mode.label+" switches not replaced");
  assert.match(result.parent,/control-panel/,mode.label+" switch unit is outside instrument head");
  // On a 390px phone the cyclic's transparent drag surface spans the
  // entire centre column. The switch rack must sit at the *visual* right of
  // the cyclic without reducing the original touch-surface dimensions.
  assert.ok(result.rack.left>=result.cyclic.left+result.cyclic.width*.60,
   mode.label+" switch unit sits to the right of the visible cyclic centre "+JSON.stringify(result));
  assert.ok(result.rack.top>=result.instruments.bottom-3&&
   result.rack.bottom<=result.left.top+6,
   mode.label+" switch rack does not cover instruments or pedal buttons "+JSON.stringify(result));
  assert.ok(result.rack.right<=result.viewport.width+2&&result.rack.top>=0,
   mode.label+" switch unit wholly on the phone "+JSON.stringify(result));
  if(mode.label==="landscape"){
   assert.ok(result.rack.left>=result.cyclic.right-8&&
    result.rack.left<=result.cyclic.right+70,
    "landscape four-switch unit sits directly beside cyclic, not at far edge "+JSON.stringify(result));
  }
  assert.ok(result.cyclic.width>=100&&result.cyclic.height>=54&&
   result.collective.width>=65&&result.instruments.width>=150,
   mode.label+" no collapsed primary controls "+JSON.stringify(result));
  assert.ok(result.left.width>=38&&result.right.width>=38&&
   result.left.right<=result.viewport.width+2&&result.right.right<=result.viewport.width+2,
   mode.label+" both rudder pedals have a usable hit target "+JSON.stringify(result));
  assert.ok(result.overflow<=2,mode.label+" no horizontal overflow "+JSON.stringify(result));
  assert.ok(result.left.top>=0&&result.right.top>=0&&
   result.left.bottom<=result.viewport.height-2&&result.right.bottom<=result.viewport.height-2,
   mode.label+" both full-size pedals visible without scrolling "+JSON.stringify(result));
  if(mode.label!=="landscape"){
   const floorSpace=result.viewport.height-Math.max(result.left.bottom,result.right.bottom);
   assert.ok(floorSpace>=2&&floorSpace<=13,
    mode.label+" both R44 pedals sit at the screen bottom without scrolling "+JSON.stringify({floorSpace,...result}));
   assert.ok(Math.abs(result.left.height-43)<1&&Math.abs(result.right.height-43)<1,
    mode.label+" original pedal size is preserved");
  }
  console.log("R44 "+mode.label+" geometry: "+JSON.stringify(result));
  assert.deepEqual(errors,[],"no runtime errors in "+mode.label);
  await page.close();
 }
 console.log("R44 isolated switch relocation geometry and screenshots complete.");
}finally{await browser.close()}
