import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright";

// Imported fighter models require same-origin HTTP. file:// rendered an old
// placeholder and hid the very loading defect this regression covers.
const root=process.cwd();
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".json":"application/json",
 ".webp":"image/webp",".png":"image/png",".glb":"model/gltf-binary",
 ".ac":"text/plain; charset=utf-8",".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{
 try{
  const u=new URL(req.url,"http://localhost");
  const file=path.resolve(root,"."+decodeURIComponent(u.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||
    !fs.statSync(file).isFile()){
   res.writeHead(404);res.end("Not found");return;
  }
  res.writeHead(200,{"Content-Type":mime[path.extname(file)]||
   "application/octet-stream","Cache-Control":"no-store"});
  fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(500);res.end("file error")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const url="http://127.0.0.1:"+server.address().port+"/flight-sim.html";
const browser=await chromium.launch({headless:true,args:["--no-sandbox",
 "--enable-webgl","--use-gl=angle","--use-angle=swiftshader-webgl",
 "--enable-unsafe-swiftshader"]});
const errors=[];
const wait=page=>page.waitForTimeout(140);
const activeCanvas=page=>page.locator("#aircraftInspectCanvas3D").isVisible().then(
 visible=>visible?"#aircraftInspectCanvas3D":"#aircraftInspectCanvas2D");
const shot=async page=>page.locator(await activeCanvas(page)).evaluate(c=>c.toDataURL("image/png"));
try{
 fs.mkdirSync("artifacts",{recursive:true});
 const desktop=await browser.newPage({viewport:{width:1200,height:900},serviceWorkers:"block"});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 assert.equal(await desktop.locator("#aircraftInspectOpen").count(),1);
 assert.equal(await desktop.locator("#aircraftInspectDialog").isVisible(),false);
 const yoke=await desktop.locator("#controlPad").boundingBox();
 await desktop.locator("#aircraftInspectOpen").click();
 assert.equal(await desktop.locator("#aircraftInspectDialog").isVisible(),true);
 assert.equal(await desktop.locator("#aircraftInspectOpen").getAttribute("aria-expanded"),"true");
 assert.equal(await desktop.locator("#aircraftInspectModel").textContent(),"Cessna 172");
 await desktop.waitForFunction(()=>document.getElementById(
  "aircraftInspectViewport").dataset.modelLoading==="off",null,{timeout:25000});
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
 await desktop.locator("#aircraftInspectViewport").dblclick({position:{x:180,y:135}});
 assert.equal(await desktop.locator("#aircraftInspectZoomValue").textContent(),"158%",
  "double clicking the aircraft zooms in without adding a new control");
 await desktop.locator("#aircraftInspectViewport").dblclick({position:{x:180,y:135}});
 assert.equal(await desktop.locator("#aircraftInspectZoomValue").textContent(),"100%",
  "second double click restores fitted aircraft view");
 const frames=new Set();
 for(const id of ["c172","r44","fa18","f22","f35","typhoon","su37"]){
  await desktop.locator("#aircraftInspectModelSelect").selectOption(id);
  assert.equal(await desktop.locator("#cockpitAircraftSelect").inputValue(),id,"inspector switches the flight simulator model");
  assert.equal(await desktop.locator("#aircraftInspectModel").textContent(),
   (await desktop.evaluate(id=>window.AGSAExteriorAirframes.LABELS[id],id)));
  await desktop.waitForFunction(()=>document.getElementById(
   "aircraftInspectViewport").dataset.modelLoading==="off",null,{timeout:25000});
  if(id==="f22"||id==="f35")assert.equal(await desktop.evaluate(()=>
   document.querySelector("#aircraftInspectCanvas3D").dataset.airframeSource),
   id==="f22"?"gpl-f22-fguk":"gpl-f35b-flightgear",
   "the 360 inspector must display authentic imported "+id+" geometry");
  await wait(desktop);
  const png=await shot(desktop);
  assert.ok(png.length>1000,"model rendered in inspector: "+id);
  frames.add(png);
 }
 assert.equal(frames.size,7,"all seven aircraft have distinct 360-degree renders");
 await desktop.locator("#aircraftInspectModelSelect").selectOption("r44");
 const rotorControlsBefore=await desktop.locator("#controlPad").boundingBox();
 await desktop.locator("#aircraftInspectSpin").click();
 assert.equal(await desktop.locator("#aircraftInspectSpin").getAttribute("aria-pressed"),"true");
 await desktop.waitForTimeout(250);
 const rotating=await desktop.locator("#aircraftInspectAngles").textContent();
 assert.notEqual(rotating,"AZ 000° · EL 026°","auto rotate advances the inspection angle");
 await desktop.keyboard.press("Escape");
 assert.equal(await desktop.locator("#aircraftInspectDialog").isVisible(),false);
 assert.equal(await desktop.locator("#aircraftInspectOpen").getAttribute("aria-expanded"),"false");
 const rotorControlsAfter=await desktop.locator("#controlPad").boundingBox();
 assert.ok(Math.abs(rotorControlsAfter.height-rotorControlsBefore.height)<1,
  "the inspector cannot resize the selected R44 flight control");
 await desktop.close();

 // Capture each true aircraft mesh (not a photo or procedural placeholder)
 // under both Android viewport orientations. A wider, fitted fighter should
 // stay inside the modal without altering C172/R44 cockpit geometry.
 const phone3d=await browser.newPage({viewport:{width:390,height:844},
  isMobile:true,hasTouch:true,serviceWorkers:"block"});
 phone3d.on("pageerror",e=>errors.push("phone 3D "+e.message));
 await phone3d.goto(url,{waitUntil:"load"});
 await phone3d.locator("#cockpitHelpToggle").tap();
 await phone3d.locator("#aircraftInspectOpen").tap();
 for(const layout of [{name:"portrait",w:390,h:844},
  {name:"landscape",w:844,h:390}]){
  await phone3d.setViewportSize({width:layout.w,height:layout.h});
  for(const id of ["c172","r44","fa18","f22","f35","typhoon","su37"]){
   const changed=await phone3d.evaluate(id=>{
    const select=document.querySelector("#aircraftInspectModelSelect");
    const prev=select.value;
    select.value=id;
    select.dispatchEvent(new Event("change",{bubbles:true}));
    const vp=document.querySelector("#aircraftInspectViewport");
    const canvas=document.querySelector("#aircraftInspectCanvas3D");
    return {prev,loading:vp.dataset.modelLoading,hidden:canvas.hidden};
   },id);
   if(changed.prev!==id){
    assert.equal(changed.loading,"on",
     "switching to "+id+" must hide the previous airplane immediately");
    assert.equal(changed.hidden,true,
     "no stale 360 airframe image can appear during model selection");
   }
   await phone3d.waitForFunction(target=>{
    const vp=document.querySelector("#aircraftInspectViewport");
    const canvas=document.querySelector("#aircraftInspectCanvas3D");
    if(vp.dataset.modelLoading!=="off"||
       canvas.dataset.airframeId!==target||!canvas.dataset.airframeSource)
     return false;
    if(target==="f22")return canvas.dataset.airframeSource==="gpl-f22-fguk";
    if(target==="f35")return canvas.dataset.airframeSource==="gpl-f35b-flightgear";
    if(target==="c172"||target==="r44")
     return canvas.dataset.airframeSource!=="procedural";
    return canvas.dataset.airframeSource==="procedural";
   },id,{timeout:25000});
   assert.equal(await phone3d.locator("#aircraftInspectCanvas3D").isVisible(),true,
    id+" genuine 360 mesh must be visible at "+layout.name);
   assert.equal(await phone3d.evaluate(()=>document.querySelector(
    "#aircraftInspectCanvas3D").dataset.airframeId),id,
    "360 cannot mistake an earlier aircraft for another procedural fighter");
   assert.ok(await phone3d.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
    id+" inspection must fit without horizontal scrolling");
   await phone3d.locator("#aircraftInspectViewport").screenshot({
    path:"artifacts/all-aircraft-360-"+layout.name+"-"+id+".png"});
  }
 }
 await phone3d.close();

 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:"block"});
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
 assert.equal(await button.isVisible(),false,"360° inspection starts in compact More menu");
 await mobile.locator("#cockpitHelpToggle").tap();
 assert.equal(await button.isVisible(),true);
 assert.ok((await button.boundingBox()).height>=34);
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
 await mobile.locator("#aircraftInspectViewport").tap();
 await mobile.locator("#aircraftInspectViewport").tap();
 assert.equal(await mobile.locator("#aircraftInspectZoomValue").textContent(),"178%",
  "double tapping the aircraft enlarges it on Android");
 await mobile.locator("#aircraftInspectViewport").tap();
 await mobile.locator("#aircraftInspectViewport").tap();
 assert.equal(await mobile.locator("#aircraftInspectZoomValue").textContent(),"100%",
  "a second double tap fits the aircraft on Android");
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
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
