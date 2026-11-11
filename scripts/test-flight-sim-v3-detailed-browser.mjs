// The detailed FlightGear GLB is copied from a verified SHA-256 checked
// CI artifact only for this test. It is NOT published on GitHub Pages.
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright";

const root=process.cwd(),candidate=path.join(root,
 "assets/aircraft/c172-detailed-evaluation.glb");
assert.ok(fs.statSync(candidate).size>2000000,
 "This test needs the detailed GPL source candidate, not the old GLB");
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".glb":"model/gltf-binary",".css":"text/css; charset=utf-8"};
const server=http.createServer((req,res)=>{
 try{
  const file=path.resolve(root,"."+decodeURIComponent(
   new URL(req.url,"http://localhost").pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||
   !fs.statSync(file).isFile()){
   res.writeHead(404);res.end("Not found");return;
  }
  res.writeHead(200,{"Content-Type":types[path.extname(file)]||
   "application/octet-stream","Cache-Control":"no-store"});
  fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(500);res.end("Server error");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,args:[
  "--no-sandbox","--enable-webgl","--use-gl=angle",
  "--use-angle=swiftshader-webgl","--enable-unsafe-swiftshader"
 ]});
 fs.mkdirSync("artifacts",{recursive:true});
 for(const v of [
  {name:"portrait",width:390,height:844},
  {name:"landscape",width:844,height:390}
 ]){
  const context=await browser.newContext({viewport:{width:v.width,height:v.height},
   deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto("http://127.0.0.1:"+server.address().port+
    "/flight-sim-v3-preview.html",{waitUntil:"load"});
   await page.waitForFunction(()=>window.__AGSA_V3?.ready,null,{timeout:22000});
   // ONLY unlock the experimental selector inside the ephemeral test page.
   assert.equal(await page.locator('option[value="detailed"]').isDisabled(),true,
    "The public static preview must not advertise an unlicensed binary model");
   await page.locator('option[value="detailed"]').evaluate(el=>el.disabled=false);
   await page.locator("#modelVersion").selectOption("detailed");
   await page.waitForFunction(()=>window.__AGSA_V3?.getDetailedLoaded(),
    null,{timeout:25000});
   assert.equal(await page.evaluate(()=>window.__AGSA_V3.getMode()),"detailed");
   const meta=await page.evaluate(()=>window.__AGSA_V3.getDetailedMeta());
   assert.ok(meta.meshes>=190&&meta.materials>=190,
    "Detailed model must carry the imported meshes, not a 12-part replacement");
   for(const part of ["pilotseat_left","pilotseat_right","backseat_left",
    "panel_1_gauges","Propeller","leftaileron","rightaileron",
    "elevatorleft","elevatorright","rudder_1","flaps"])
    assert.ok(meta.names.includes(part),"Missing original source part: "+part);
   assert.ok(meta.cockpit.panel[2]>meta.cockpit.pilot[2]+.25,
    "real cockpit panel must lie in front of pilot, not behind in tail cone");
   assert.ok(meta.cockpit.pilot[2]>meta.cockpit.rear[2]+.25,
    "front pilot seat must be ahead of the original back seat");
   const before=await page.evaluate(()=>window.__AGSA_V3.getDetailedTransforms());
   // Actually drive source nodes; do not add independently modelled
   // surfaces on top of FlightGear flaps, propeller or cabin shell.
   for(const [selector,value] of [
    ["#flapControl","20"],["#aileronControl",".65"],
    ["#elevatorControl","-.4"],["#rudderControl",".6"]
   ]){
    await page.locator(selector).evaluate((el,next)=>{
     el.value=next;el.dispatchEvent(new Event("input",{bubbles:true}));
    },value);
   }
   const after=await page.evaluate(()=>window.__AGSA_V3.getDetailedTransforms());
   for(const part of ["flaps","leftaileron","rightaileron","elevatorleft","rudder_1"])
    assert.notDeepEqual(after[part],before[part],
     part+" must actually articulate on its original source node");
   await page.locator("#resetCamera").click();
   await page.waitForTimeout(300);
   const canvas=page.locator("#preview3d");
   await canvas.screenshot({path:"artifacts/detailed-c172-"+v.name+"-exterior.png"});
   await page.locator("#cabinCamera").click();
   await page.waitForTimeout(300);
   const cabinCam=await page.evaluate(()=>window.__AGSA_V3.getCamera());
   assert.ok(cabinCam.target[2]>meta.cockpit.rear[2]+.25,
    "Cabin camera must look toward source forward seats, not the tail");
   assert.ok(Math.abs(cabinCam.position[0])<.60,
    "Cabin camera must remain inside the real C172 fuselage, not outside side door");
   assert.ok(Math.abs(cabinCam.position[1]-(meta.cockpit.seatBounds.rearTop+.19))<.025,
    "Cabin camera must use actual rear seat height, not a floating roof view");
   assert.ok(Math.abs(cabinCam.position[2]-(meta.cockpit.seatBounds.rearAft-.12))<.025,
    "Cabin camera must sit just behind rear seats, not in the tail or above wings");
   await canvas.screenshot({path:"artifacts/detailed-c172-"+v.name+"-cabin.png"});
   await page.locator("#pilotCamera").click();
   await page.waitForTimeout(300);
   const pilotCam=await page.evaluate(()=>window.__AGSA_V3.getCamera());
   assert.ok(Math.abs(pilotCam.position[2]-meta.cockpit.pilot[2])<.3,
    "Pilot eye must be attached to real source pilot seat");
   assert.ok(Math.abs(pilotCam.position[0]-meta.cockpit.pilot[0])<.025,
    "Pilot eye must align laterally with the actual left pilot seat");
   assert.ok(Math.abs(pilotCam.position[1]-(meta.cockpit.seatBounds.pilotTop+.04))<.025,
    "Pilot eye must be below the cabin roof, adjacent to original seat headrest");
   assert.ok(pilotCam.target[2]>pilotCam.position[2]+.25,
    "Pilot camera must face forward toward the real source instrument panel");
   await canvas.screenshot({path:"artifacts/detailed-c172-"+v.name+"-pilot-eye.png"});
   await page.locator("#topCamera").click();
   await page.waitForTimeout(300);
   await canvas.screenshot({path:"artifacts/detailed-c172-"+v.name+"-top.png"});
   const dimensions=await page.evaluate(()=>({
    client:innerWidth,scroll:document.documentElement.scrollWidth
   }));
   assert.ok(dimensions.scroll<=dimensions.client+2,
    "Horizontal phone overflow "+v.name+": "+JSON.stringify(dimensions));
   assert.deepEqual(errors,[],v.name+" JavaScript errors");
   console.log("C172 authentic high-detail source scene graph:",v.name,
    JSON.stringify({meshes:meta.meshes,size:meta.size,parts:meta.names,
     before,after,dimensions}));
  }finally{await context.close();}
 }
 console.log("Detailed FlightGear C172 source inspection succeeded on emulated Android.");
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
