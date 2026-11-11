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
  await page.locator("#cockpitFocusButton").click();
  await page.waitForFunction(()=>{
   const rack=document.getElementById("cockpitSwitchPanel");
   return rack?.parentElement?.classList.contains("control-panel")&&
    document.body.dataset.cockpitFocus==="on";
  },{timeout:12000});
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
  assert.ok(result.rack.left>=result.cyclic.right-8,
   mode.label+" switch unit immediately right of unchanged cyclic "+JSON.stringify(result));
  assert.ok(result.rack.right<=result.viewport.width+2&&result.rack.top>=0,
   mode.label+" switch unit wholly on the phone "+JSON.stringify(result));
  assert.ok(result.cyclic.width>=100&&result.cyclic.height>=54&&
   result.collective.width>=65&&result.instruments.width>=150,
   mode.label+" no collapsed primary controls "+JSON.stringify(result));
  assert.ok(result.left.width>=38&&result.right.width>=38&&
   result.left.right<=result.viewport.width+2&&result.right.right<=result.viewport.width+2,
   mode.label+" both rudder pedals have a usable hit target "+JSON.stringify(result));
  assert.ok(result.overflow<=2,mode.label+" no horizontal overflow "+JSON.stringify(result));
  if(mode.label==="portrait"){
   assert.ok(result.left.bottom<=result.viewport.height-2&&result.right.bottom<=result.viewport.height-2,
    "portrait pedals must fit without scrolling "+JSON.stringify(result));
  }
  await page.screenshot({path:"artifacts/r44-single-switch-"+mode.label+".png"});
  console.log("R44 "+mode.label+" geometry: "+JSON.stringify(result));
  assert.deepEqual(errors,[],"no runtime errors in "+mode.label);
  await page.close();
 }
 console.log("R44 isolated switch relocation geometry and screenshots complete.");
}finally{await browser.close()}
