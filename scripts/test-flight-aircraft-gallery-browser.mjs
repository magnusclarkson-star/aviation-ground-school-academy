import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const errors=[];
const source=async page=>page.locator("#cockpitAircraftPhotoPreview").getAttribute("src");
const checkLoaded=async(page,selector)=>page.waitForFunction(sel=>{
 const el=document.querySelector(sel);
 return Boolean(el?.complete&&el.naturalWidth>=500&&el.naturalHeight>=350);
},selector,{timeout:10000});

try{
 const desktop=await browser.newPage({viewport:{width:1280,height:900}});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 assert.equal(await source(desktop),"aircraft-c172.webp");
 assert.equal(await desktop.locator("#cockpitAircraftPhotoButton").isVisible(),true);
 assert.equal(await desktop.locator("#cockpitAircraftGallery").isVisible(),false);
 await checkLoaded(desktop,"#cockpitAircraftPhotoPreview");
 assert.equal(await desktop.locator("#cockpitAircraftPhotoButton").getAttribute("aria-expanded"),"false");
 await desktop.locator("#cockpitAircraftPhotoButton").click();
 assert.equal(await desktop.locator("#cockpitAircraftGallery").isVisible(),true);
 assert.equal(await desktop.locator("#cockpitAircraftPhotoButton").getAttribute("aria-expanded"),"true");
 assert.equal(await desktop.locator(".aircraft-gallery-choice").count(),7);
 await checkLoaded(desktop,"#cockpitAircraftGalleryImage");
 assert.match(await desktop.locator("#cockpitGalleryHeading").textContent(),/Cessna 172/);
 assert.equal(await desktop.locator("#cockpitAircraftSelect").inputValue(),"c172");
 assert.equal(await desktop.locator('.aircraft-gallery-choice[data-aircraft-id="c172"]').getAttribute("aria-pressed"),"true");

 for(const id of ["r44","fa18","f22","f35","typhoon","su37","c172"]){
  await desktop.locator('.aircraft-gallery-choice[data-aircraft-id="'+id+'"]').click();
  assert.equal(await desktop.locator("#cockpitAircraftSelect").inputValue(),id,"gallery switches selected airframe");
  assert.equal(await source(desktop),"aircraft-"+id+".webp","preview follows selector");
  assert.equal(await desktop.locator("#cockpitAircraftGalleryImage").getAttribute("src"),"aircraft-"+id+".webp");
  await checkLoaded(desktop,"#cockpitAircraftGalleryImage");
  assert.equal(await desktop.locator('.aircraft-gallery-choice[data-aircraft-id="'+id+'"]').getAttribute("aria-pressed"),"true");
  assert.equal(await desktop.locator("#cockpitStation").getAttribute("data-airframe"),id);
 }
 await desktop.locator("#cockpitAircraftGalleryClose").click();
 assert.equal(await desktop.locator("#cockpitAircraftGallery").isVisible(),false);
 // One tap on the aircraft photograph opens the ORIGINAL interactive 360°
 // viewer; the gallery must close before the inspection modal opens.
 await desktop.locator("#cockpitAircraftPhotoButton").click();
 await desktop.locator("#cockpitAircraftGalleryImage").click();
 assert.equal(await desktop.locator("#cockpitAircraftGallery").isVisible(),false);
 assert.equal(await desktop.locator("#aircraftInspectDialog").isVisible(),true);
 assert.equal(await desktop.locator("#aircraftInspectModel").textContent(),"Cessna 172");
 // Hosted, licensed 360° aircraft own their touch rotation controls.
 // The old native auto-spin button must be disabled, not clicked.
 assert.equal(await desktop.locator("#aircraftInspectSpin").isDisabled(),true);
 assert.equal(await desktop.locator("#aircraftInspectTexturedTitle").textContent(),"Cessna 172SP");
 assert.equal(await desktop.locator("#aircraftInspectTexturedSource").getAttribute("href"),
  "https://sketchfab.com/3d-models/free-cessna-172sp-be55bf96a63b41fdb953b6829ff0d4bf");
 // The Su-37 remains native WebGL and must retain manual/auto orbit controls.
 await desktop.locator("#aircraftInspectClose").click();
 await desktop.locator("#cockpitAircraftSelect").selectOption("su37");
 await desktop.locator("#cockpitAircraftPhotoButton").click();
 await desktop.locator("#cockpitAircraftGalleryImage").click();
 assert.equal(await desktop.locator("#aircraftInspectSpin").isEnabled(),true);
 await desktop.locator("#aircraftInspectSpin").click();
 assert.equal(await desktop.locator("#aircraftInspectSpin").getAttribute("aria-pressed"),"true");
 await desktop.locator("#aircraftInspectClose").click();
 assert.equal(await desktop.locator("#aircraftInspectDialog").isVisible(),false);
 await desktop.locator("#cockpitAircraftSelect").selectOption("f35");
 assert.equal(await source(desktop),"aircraft-f35.webp","external dropdown also updates preview");
 await desktop.locator("#typeCyclic").click();
 assert.equal(await source(desktop),"aircraft-r44.webp","rotorcraft control selector updates preview");
 await desktop.locator("#typeYoke").click();
 assert.equal(await source(desktop),"aircraft-c172.webp","yoke selector updates preview");
 await desktop.locator("#cockpitAircraftPhotoButton").click();
 await desktop.keyboard.press("Escape");
 assert.equal(await desktop.locator("#cockpitAircraftGallery").isVisible(),false,"Escape closes gallery");
 assert.equal(await desktop.locator("#cockpitZoomPanel").isVisible(),false,"gallery does not zoom instrument");
 assert.equal(await desktop.locator("#cockpitAircraftPhotoButton").getAttribute("aria-expanded"),"false");
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone "+e.message));
 await phone.goto(url,{waitUntil:"load"});
 const thumb=phone.locator("#cockpitAircraftPhotoButton");
 assert.equal(await thumb.isVisible(),true,"selected-aircraft picture stays visible on phone");
 assert.equal(await thumb.evaluate(el=>el.parentElement.classList.contains('cockpit-actions')),true);
 assert.ok((await thumb.boundingBox()).height>=38);
 await thumb.tap();
 assert.equal(await phone.locator("#cockpitAircraftGallery").isVisible(),true);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 const overlay=await phone.locator("#cockpitAircraftGallery").boundingBox();
 assert.ok(overlay.width<=390+2,"gallery stays inside phone viewport");
 await phone.locator('.aircraft-gallery-choice[data-aircraft-id="f22"]').tap();
 assert.equal(await phone.locator("#cockpitAircraftSelect").inputValue(),"f22");
 await checkLoaded(phone,"#cockpitAircraftGalleryImage");
 await phone.locator("#cockpitAircraftGalleryInspect").tap();
 assert.equal(await phone.locator("#cockpitAircraftGallery").isVisible(),false,
  "gallery closes before opening the 360 degree viewer");
 assert.equal(await phone.locator("#aircraftInspectDialog").isVisible(),true,
  "360 degree inspection is reachable directly from aircraft picture on a phone");
 assert.equal(await phone.locator("#aircraftInspectModel").textContent(),"F-22 Raptor");
 // F-22 uses a creator-hosted 360° iframe, so its built-in rotation
 // replaces the local button. Verify source attribution and touch access.
 assert.equal(await phone.locator("#aircraftInspectSpin").isDisabled(),true);
 assert.equal(await phone.locator("#aircraftInspectTexturedTitle").textContent(),"F-22 Raptor");
 assert.equal(await phone.locator("#aircraftInspectSuperHornetFrame").isVisible(),true);
 await phone.locator("#aircraftInspectClose").tap();
 assert.equal(await phone.locator("#aircraftInspectDialog").isVisible(),false);
 await thumb.tap();
 await phone.locator("#cockpitAircraftGalleryClose").tap();
 assert.equal(await phone.locator("#cockpitAircraftGallery").isVisible(),false);
 await phone.locator("#cockpitFocusButton").tap();
 assert.equal(await phone.locator("body").getAttribute("data-cockpit-focus"),"on");
 await phone.setViewportSize({width:844,height:390});
 await phone.waitForTimeout(100);
 assert.equal(await thumb.isVisible(),true,"landscape selected aircraft picture remains accessible");
 await thumb.tap();
 assert.equal(await phone.locator("#cockpitAircraftGallery").isVisible(),true);
 const landscape=await phone.locator("#cockpitAircraftGalleryImage").boundingBox();
 assert.ok(landscape.height>100&&landscape.y+landscape.height<=391,"landscape photo visible without clipping: "+JSON.stringify(landscape));
 assert.ok(await phone.locator("#cockpitAircraftGalleryInspect").isVisible(),
  "360-degree rotate action stays directly available in landscape gallery");
 await phone.locator("#cockpitAircraftGalleryClose").tap();
 assert.ok(await phone.locator("#controlPad").isVisible(),"flight controls usable after closing gallery");
 assert.deepEqual(errors,[],"no browser runtime errors");
 console.log("Seven aircraft gallery passed: local WebP assets, seven aircraft selections, zoomed photos, mobile portrait/landscape and preserved cockpit controls.");
}finally{await browser.close();}
