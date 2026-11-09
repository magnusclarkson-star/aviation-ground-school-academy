import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
const readModel=async(page)=>page.locator(".scene-shell").getAttribute("data-airframe");
const shot=async(page,canvasId)=>page.locator(canvasId).evaluate(c=>c.toDataURL("image/png"));
try{
 const desktop=await browser.newPage({viewport:{width:1200,height:900}});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 assert.equal(await readModel(desktop),"c172");
 assert.equal(await desktop.locator("#sceneAircraftType").textContent(),"Cessna 172");
 await desktop.locator("#pauseFlight").click();
 await desktop.locator("#cameraMode").selectOption("chase");
 assert.equal(await desktop.locator("#cockpitFrame").getAttribute("data-view"),"chase");
 const threeD=await desktop.locator("#outsideView3D").isVisible();
 if(threeD){
  const signatures=new Map();
  for(const [id,label] of [
   ["c172","Cessna 172"],["fa18","F/A-18 Super Hornet"],
   ["f22","F-22 Raptor"],["f35","F-35 Lightning II"],
   ["typhoon","Eurofighter Typhoon"],["su37","Su-37"],["r44","Robinson R44"]
  ]){
   await desktop.locator("#cockpitAircraftSelect").selectOption(id);
   await desktop.waitForTimeout(110);
   assert.equal(await readModel(desktop),id,"scene model follows selected cockpit: "+id);
   assert.equal(await desktop.locator("#sceneAircraftType").textContent(),label);
   assert.equal(await desktop.locator("#cockpitFrame").getAttribute("data-airframe"),id);
   const img=await shot(desktop,"#outsideView3D");
   assert.ok(img.length>900,id+" has actual 3D pixels");
   signatures.set(id,img);
  }
  assert.equal(new Set(signatures.values()).size,7,
   "all seven 3D chase images must differ, not the original single mock-up");
 }
 await desktop.locator("#visualMode").selectOption("2d");
 assert.equal(await desktop.locator("#outsideView3D").isVisible(),false);
 assert.equal(await desktop.locator("#cameraMode").isEnabled(),true,
  "2D fallback still offers outside aircraft chase view");
 assert.equal(await desktop.locator("#cameraMode").inputValue(),"chase");
 const signatures2D=new Map();
 for(const id of ["c172","fa18","f22","f35","typhoon","su37","r44"]){
  await desktop.locator("#cockpitAircraftSelect").selectOption(id);
  await desktop.waitForTimeout(120);
  assert.equal(await readModel(desktop),id);
  signatures2D.set(id,await shot(desktop,"#outsideView"));
 }
 assert.equal(new Set(signatures2D.values()).size,7,
  "all seven 2D exterior silhouettes must differ without WebGL");
 await desktop.locator("#cameraMode").selectOption("cockpit");
 assert.equal(await desktop.locator("#cockpitFrame").getAttribute("data-view"),"cockpit");
 const forward=await shot(desktop,"#outsideView");
 await desktop.locator("#cameraMode").selectOption("chase");
 const outside=await shot(desktop,"#outsideView");
 assert.notEqual(forward,outside,"2D pilot and chase cameras must differ");

 // Gallery and cockpit selector must both be authoritative.
 await desktop.locator("#cockpitAircraftPhotoButton").click();
 await desktop.locator('.aircraft-gallery-choice[data-aircraft-id="f22"]').click();
 assert.equal(await readModel(desktop),"f22");
 assert.equal(await desktop.locator("#sceneAircraftType").textContent(),"F-22 Raptor");
 await desktop.locator("#cockpitAircraftGalleryClose").click();
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone "+e.message));
 await phone.goto(url,{waitUntil:"load"});
 await phone.locator("#cockpitSwitch_view").tap();
 assert.equal(await phone.locator("#cameraMode").inputValue(),"chase");
 await phone.locator("#cockpitAircraftSelect").selectOption("r44");
 assert.equal(await readModel(phone),"r44");
 assert.equal(await phone.locator("#sceneAircraftType").textContent(),"Robinson R44");
 await phone.locator("#visualMode").selectOption("2d");
 assert.equal(await phone.locator("#cameraMode").isEnabled(),true);
 assert.equal(await phone.locator("#cameraMode").inputValue(),"chase");
 const rot=await shot(phone,"#outsideView");
 await phone.locator("#cockpitAircraftSelect").selectOption("typhoon");
 assert.equal(await readModel(phone),"typhoon");
 const jet=await shot(phone,"#outsideView");
 assert.notEqual(rot,jet,"phone 2D chase switches helicopter to Typhoon profile");
 assert.equal(await phone.locator("#cockpitAircraftSelect").inputValue(),"typhoon");
 assert.equal(await phone.locator("#controlPad").isVisible(),true,"cockpit controls unaffected");
 assert.equal(await phone.locator("#cockpitZoomPanel").isVisible(),false,"instrument zoom unaffected");
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 await phone.setViewportSize({width:844,height:390});
 await phone.waitForTimeout(150);
 assert.equal(await readModel(phone),"typhoon");
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[],"no scene JS errors on desktop or Android-sized phone");
 console.log("Aircraft outside-view browser passed: seven distinct chase models, correct images on 2D fallback, model switching from gallery/cockpit and phone portrait/landscape.");
}finally{await browser.close();}
