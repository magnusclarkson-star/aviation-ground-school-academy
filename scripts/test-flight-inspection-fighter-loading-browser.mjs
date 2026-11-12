/* Reproduce slow genuine F-22/F-35B downloads on a phone-sized viewport.
 * The old procedural model and the previously selected aircraft must never
 * appear during 360-degree loading, even when download is deliberately held.
 */
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".json":"application/json",
 ".png":"image/png",".webp":"image/webp",".glb":"model/gltf-binary",
 ".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{
 try{
  const u=new URL(req.url,"http://localhost");
  const file=path.resolve(root,"."+decodeURIComponent(u.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||
    !fs.statSync(file).isFile()){res.writeHead(404);res.end("not found");return}
  res.writeHead(200,{"Content-Type":mime[path.extname(file)]||
   "application/octet-stream","Cache-Control":"no-store"});
  fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(500);res.end("server error")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,args:[
  "--no-sandbox","--enable-webgl","--use-gl=angle",
  "--use-angle=swiftshader-webgl","--enable-unsafe-swiftshader"
 ]});
 const context=await browser.newContext({viewport:{width:390,height:844},
  isMobile:true,hasTouch:true,serviceWorkers:"block"});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const fetchOriginal=window.fetch.bind(window);
  window.__releaseModels={};
  window.fetch=(input,...args)=>{
   const url=typeof input==="string"?input:input?.url||"";
   const id=url.includes("f22-fguk-exterior.json")?"f22":
    url.includes("f35b-fg-exterior.json")?"f35":null;
   if(!id)return fetchOriginal(input,...args);
   return new Promise((resolve,reject)=>{
    window.__releaseModels[id]=()=>fetchOriginal(input,...args)
     .then(resolve,reject);
   });
  };
 });
 await page.goto("http://127.0.0.1:"+server.address().port+"/flight-sim.html",
  {waitUntil:"load"});
 await page.locator("#cockpitAircraftSelect").selectOption("f22");
 if(!(await page.locator("#aircraftInspectOpen").isVisible()))
  await page.locator("#cockpitHelpToggle").tap();
 await page.locator("#aircraftInspectOpen").tap();
 await page.waitForFunction(()=>typeof window.__releaseModels.f22==="function",
  null,{timeout:12000});
 assert.equal(await page.locator("#aircraftInspectViewport").getAttribute(
  "data-model-loading"),"on");
 assert.equal(await page.locator("#aircraftInspectCanvas3D").isVisible(),false,
  "the old F-22 procedural model must not show during source loading");
 assert.equal(await page.locator("#aircraftInspectCanvas2D").isVisible(),false,
  "no older 2D fighter silhouette may flash while loading");
 assert.match(await page.locator("#aircraftInspectLoading").textContent(),/Loading.*F-22/);
 // Hold the source download across several frames. Loading must stay visible.
 await page.waitForTimeout(350);
 assert.equal(await page.locator("#aircraftInspectViewport").getAttribute(
  "data-model-loading"),"on");
 await page.evaluate(()=>window.__releaseModels.f22());
 await page.waitForFunction(()=>document.querySelector(
  "#aircraftInspectCanvas3D").dataset.airframeSource==="gpl-f22-fguk"&&
  document.querySelector("#aircraftInspectViewport").dataset.modelLoading==="off",
  null,{timeout:25000});
 assert.equal(await page.locator("#aircraftInspectCanvas3D").isVisible(),true);
 await page.locator("#aircraftInspectModelSelect").selectOption("f35");
 await page.waitForFunction(()=>typeof window.__releaseModels.f35==="function",
  null,{timeout:12000});
 assert.equal(await page.locator("#aircraftInspectViewport").getAttribute(
  "data-model-loading"),"on");
 assert.equal(await page.locator("#aircraftInspectCanvas3D").isVisible(),false,
  "the F-22 frame must not remain onscreen when switching to F-35B");
 assert.equal(await page.locator("#aircraftInspectCanvas2D").isVisible(),false);
 assert.match(await page.locator("#aircraftInspectLoading").textContent(),/Loading.*F-35/);
 await page.waitForTimeout(350);
 assert.equal(await page.locator("#aircraftInspectViewport").getAttribute(
  "data-model-loading"),"on");
 await page.evaluate(()=>window.__releaseModels.f35());
 await page.waitForFunction(()=>document.querySelector(
  "#aircraftInspectCanvas3D").dataset.airframeSource==="gpl-f35b-flightgear"&&
  document.querySelector("#aircraftInspectViewport").dataset.modelLoading==="off",
  null,{timeout:25000});
 assert.equal(await page.locator("#aircraftInspectCanvas3D").isVisible(),true);
 // Both imports remain ready when switching back and forth.
 for(const [id,source] of [["f22","gpl-f22-fguk"],["f35","gpl-f35b-flightgear"]]){
  await page.locator("#aircraftInspectModelSelect").selectOption(id);
  await page.waitForFunction(expected=>document.querySelector(
   "#aircraftInspectCanvas3D").dataset.airframeSource===expected&&
   document.querySelector("#aircraftInspectViewport").dataset.modelLoading==="off",
   source,{timeout:10000});
  assert.equal(await page.locator("#aircraftInspectCanvas3D").isVisible(),true);
 }
 assert.deepEqual(errors,[],"mobile fighter inspection must not throw JS errors");
 await context.close();
 console.log("No obsolete F-22/F-35B 360 image flash during slow loading, switching or repeat selection");
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
