/* Isolated C172 whole-cockpit visual check. Never modifies aircraft state
   outside the browser test or alters the validated R44 layout. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";
const url=pathToFileURL(path.resolve("flight-sim.html")).href;
fs.mkdirSync("artifacts",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const view of [
  {name:"portrait",width:390,height:844},
  {name:"short-portrait",width:390,height:720},
  {name:"landscape",width:844,height:390}
 ]){
  const page=await browser.newPage({viewport:{width:view.width,height:view.height},isMobile:true,hasTouch:true});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(url,{waitUntil:"load"});
  await page.locator("#cockpitAircraftSelect").selectOption("c172");
  if(await page.evaluate(()=>document.body.dataset.cockpitFocus!=="on"))
    await page.locator("#cockpitFocusButton").click();
  await page.waitForTimeout(300);
  const info=await page.evaluate(()=>{
   const box=sel=>{
    const el=document.querySelector(sel);
    if(!el)return null;
    const r=el.getBoundingClientRect();
    return {x:Math.round(r.x),y:Math.round(r.y),
     width:Math.round(r.width),height:Math.round(r.height),
     bottom:Math.round(r.bottom),right:Math.round(r.right),
     visible:getComputedStyle(el).display!=="none"};
   };
   const station=document.querySelector("#cockpitStation");
   return {screen:{width:innerWidth,height:innerHeight},focus:document.body.dataset.cockpitFocus,
    airframe:station.dataset.airframe,photo:station.dataset.photoCockpit,
    scene:box(".scene-shell"),station:box("#cockpitStation"),
    cockpit:box("#cockpitMain"),instruments:box("#cockpitInstrumentWell"),
    visual:box("#cockpitVisualPanel"),map:box("#cockpitVisualPanel .cockpit-nav-screen"),
    yoke:box("#controlPad"),grip:box("#flightGrip"),
    yokeArtwork:box("#flightGrip .hardware-yoke"),
    gripStyle:{
      transform:getComputedStyle(document.getElementById("flightGrip")).transform,
      position:getComputedStyle(document.getElementById("flightGrip")).position,
      top:getComputedStyle(document.getElementById("flightGrip")).top
    },leftPedal:box("#leftRudder"),rightPedal:box("#rightRudder"),
    throttle:box("#powerPanel"),flaps:box("#flapPanel"),brake:box("#brake"),
    restart:box("#restartFlight"),switches:box("#cockpitSwitchPanel"),
    scrollTop:station.scrollTop,
    scrollRange:station.scrollHeight-station.clientHeight,
    horizOverflow:document.documentElement.scrollWidth-innerWidth
   };
  });
  console.log("C172 "+view.name+" geometry: "+JSON.stringify(info));
  await page.screenshot({path:"artifacts/c172-cockpit-"+view.name+".png"});
  assert.equal(info.airframe,"c172");
  assert.equal(info.focus,"on");
  assert.ok(info.instruments?.width>0&&info.yoke?.width>0&&info.leftPedal?.width>0&&info.rightPedal?.width>0);
  assert.ok(info.horizOverflow<=2,"no horizontal overflow");
  // The original instrument faces/controls must remain unchanged in size.
  if(view.name==="portrait"){
   assert.ok(info.scene.height>=280,
    "tall portrait uses the former bottom void for the pilot horizon "+JSON.stringify(info));
   assert.ok(Math.abs(info.yoke.height-110)<=3&&info.leftPedal.height===42&&
    info.rightPedal.height===42&&info.flaps.height===50,
    "portrait controls retain their established sizes "+JSON.stringify(info));
  }else if(view.name==="short-portrait"){
   assert.ok(info.scene.height>=160,
    "short portrait retains usable forward visibility "+JSON.stringify(info));
  }else{
   assert.ok(info.scene.height>=180&&info.scene.height<=235,
    "landscape C172 has a real runway/horizon windscreen occupying the upper half "+JSON.stringify(info));
   assert.ok(info.instruments.y>=info.scene.height-30,
    "dashboard does not cover most of the forward view "+JSON.stringify(info));
   assert.ok(info.yoke.bottom<=info.leftPedal.y+5,
    "C172 yoke remains unobstructed above both pedals "+JSON.stringify(info));
   assert.ok(info.yokeArtwork.bottom<=info.leftPedal.y-1&&
    info.yokeArtwork.width>=145&&info.yokeArtwork.height>=48,
    "visible C172 yoke artwork fits above the pedals and remains readable "+JSON.stringify(info));
   assert.ok(info.switches.y>=info.map.bottom-5,
    "2x2 view switches sit below the navigation display, not over it "+JSON.stringify(info));
   assert.ok(info.switches.right<=info.throttle.x+4,
    "switch rack does not cover engine throttle "+JSON.stringify(info));
   assert.ok(info.yoke.height>=52&&info.yoke.height<=58,
    "landscape C172 yoke keeps an accessible touch area without covering pedals "+JSON.stringify(info));
  }
  for(const key of ["leftPedal","rightPedal","brake","restart","throttle","flaps"]){
   assert.ok(info[key]?.bottom<=view.height-2,
    view.name+" "+key+" must be visible without scrolling "+JSON.stringify(info));
  }
  assert.ok(info.scrollTop===0,"no automatic cockpit scrolling");
  assert.deepEqual(errors,[],"no JavaScript runtime errors");
  await page.close();
 }
}finally{await browser.close()}
