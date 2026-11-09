import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
const wait=page=>page.waitForTimeout(140);
const activeCanvas=page=>page.locator("#aircraftInspectCanvas3D").isVisible().then(
 visible=>visible?"#aircraftInspectCanvas3D":"#aircraftInspectCanvas2D");
const shot=async page=>page.locator(await activeCanvas(page)).evaluate(c=>c.toDataURL("image/png"));
try{
 const desktop=await browser.newPage({viewport:{width:1200,height:900}});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 assert.equal(await desktop.locator("#aircraftInspectOpen").count(),1);
 assert.equal(await desktop.locator("#aircraftInspectDialog").isVisible(),false);
 const yoke=await desktop.locator("#controlPad").boundingBox();
 await desktop.locator("#aircraftInspectOpen").click();
 assert.equal(await desktop.locator("#aircraftInspectDialog").isVisible(),true);
 assert.equal(await desktop.locator("#aircraftInspectOpen").getAttribute("aria-expanded"),"true");
 assert.equal(await desktop.locator("#aircraftInspectModel").textContent(),"Cessna 172");
 await wait(desktop);
 const before=await shot(desktop);
 assert.ok(before.length>1200,"model image drawn, not a blank canvas");
 const box=await desktop.locator("#aircraftInspectViewport").boundingBox();
 const x=box.x+box.width/2,y=box.y+box.height/2;
 await desktop.mouse.move(x,y);await desktop.mouse.down();
 await desktop.mouse.move(x+190,y+72,{steps:8});await desktop.mouse.up();
 await wait(desktop);
 const after=await shot(desktop);
 assert.notEqual(after,before,"drag changes the rendered viewing angle");
 assert.match(await desktop.locator("#aircraftInspectAngles").textContent(),/AZ 1\d\d/);
 await desktop.locator("#aircraftInspectZoomIn").click();
 assert.match(await desktop.locator("#aircraftInspectZoomValue").textContent(),/12\d%/);
 await desktop.locator("#aircraftInspectZoomOut").click();
 await desktop.locator("#aircraftInspectReset").click();
 assert.match(await desktop.locator("#aircraftInspectAngles").textContent(),/AZ 000/);
 const frames=new Set();
 for(const id of ["c172","r44","fa18","f22","f35","typhoon","su37"]){
  await desktop.locator("#aircraftInspectModelSelect").selectOption(id);
  assert.equal(await desktop.locator("#cockpitAircraftSelect").inputValue(),id,"inspector switches the flight simulator model");
  assert.equal(await desktop.locator("#aircraftInspectModel").textContent(),
   (await desktop.evaluate(id=>window.AGSAExteriorAirframes.LABELS[id],id)));
  await wait(desktop);
  const png=await shot(desktop);
  assert.ok(png.length>1000,"model rendered in inspector: "+id);
  frames.add(png);
 }
 assert.equal(frames.size,7,"all seven aircraft have distinct 360-degree renders");
 await desktop.locator("#aircraftInspectModelSelect").selectOption("r44");
 await desktop.locator("#aircraftInspectSpin").click();
 assert.equal(await desktop.locator("#aircraftInspectSpin").getAttribute("aria-pressed"),"true");
 await desktop.waitForTimeout(250);
 const rotating=await desktop.locator("#aircraftInspectAngles").textContent();
 assert.notEqual(rotating,"AZ 000° · EL 026°","auto rotate advances the inspection angle");
 await desktop.keyboard.press("Escape");
 assert.equal(await desktop.locator("#aircraftInspectDialog").isVisible(),false);
 assert.equal(await desktop.locator("#aircraftInspectOpen").getAttribute("aria-expanded"),"false");
 assert.ok((await desktop.locator("#controlPad").boundingBox()).height===yoke.height,
  "inspector never enlarges or alters the flight yoke");
 await desktop.close();

 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 mobile.on("pageerror",e=>errors.push("phone "+e.message));
 await mobile.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(name,...args){
   if(name==="webgl2")return null;
   return original.call(this,name,...args);
  };
 });
 await mobile.goto(url,{waitUntil:"load"});
 await mobile.locator("#cockpitAircraftSelect").selectOption("r44");
 const button=mobile.locator("#aircraftInspectOpen");
 assert.equal(await button.isVisible(),true);
 assert.ok((await button.boundingBox()).height>=38);
 await button.tap();
 assert.equal(await mobile.locator("#aircraftInspectRenderMode").textContent(),"2D view",
  "inspection works on Android browsers without WebGL");
 assert.equal(await mobile.locator("#aircraftInspectCanvas2D").isVisible(),true);
 await wait(mobile);
 const initial=await shot(mobile);
 assert.ok(initial.length>1000,"phone fallback draws helicopter with rotor");
 await mobile.locator("#aircraftInspectZoomIn").tap();
 await wait(mobile);
 assert.notEqual(await shot(mobile),initial,"phone zoom changes actual fallback model rendering");
 await mobile.locator("#aircraftInspectReset").tap();
 // Android two-thumb pinch zoom, including the low-end Canvas 2D fallback.
 const bounds=await mobile.locator("#aircraftInspectViewport").boundingBox();
 const first={x:Math.round(bounds.x+bounds.width*.35),
  y:Math.round(bounds.y+bounds.height*.5),id:1};
 const second={x:Math.round(bounds.x+bounds.width*.65),
  y:first.y,id:2};
 const cdp=await mobile.context().newCDPSession(mobile);
 await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[first]});
 await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[first,second]});
 await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[
  first,{...second,x:second.x+Math.round(bounds.width*.12)}]});
 await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
 await wait(mobile);
 const pinchZoom=await mobile.locator("#aircraftInspectZoomValue").textContent();
 assert.ok(Number.parseInt(pinchZoom)>110,"two fingers expanding zoom toward selected aircraft: "+pinchZoom);
 assert.match(await mobile.locator("#aircraftInspectAngles").textContent(),/AZ 000/,
  "pinch zoom does not unexpectedly orbit the aircraft");
 await cdp.detach();
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  "portrait inspector does not introduce horizontal scroll");
 await mobile.setViewportSize({width:844,height:390});
 await wait(mobile);
 assert.equal(await mobile.locator("#aircraftInspectDialog").isVisible(),true);
 assert.ok((await mobile.locator("#aircraftInspectViewport").boundingBox()).height>=110);
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  "landscape inspector fits screen");
 await mobile.locator("#aircraftInspectClose").tap();
 await mobile.locator("#aircraftInspectDialog").waitFor({state:"hidden",timeout:2000});
 assert.equal(await mobile.locator("#aircraftInspectDialog").isVisible(),false,
  "touching Close after a pinch dismisses the inspector");
 assert.ok(await mobile.locator("#controlPad").isVisible());
 assert.deepEqual(errors,[],"no crashes on desktop, phone or 2D fallback");
 console.log("Aircraft inspection browser checks passed: seven distinct orbit renders, drag, zoom, auto-spin, Escape, phone layout and rotorcraft 2D fallback.");
}finally{await browser.close();}
