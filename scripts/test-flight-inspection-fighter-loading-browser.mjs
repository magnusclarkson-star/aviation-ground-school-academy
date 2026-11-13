/* Reproduce slow genuine F-22/F-35B downloads on a phone-sized viewport.
 * The old procedural model and the previously selected aircraft must never
 * appear in the native renderer while hosted 360° views change aircraft.
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
 // The external 360° viewers no longer wait for FlightGear JSON. To
 // exercise slow downloads, use an independent native render canvas while
 // asserting that the hosted inspector never flashes that old aircraft.
 const ready=await page.evaluate(()=>{
  const c=document.createElement("canvas");
  c.width=350;c.height=240;document.body.appendChild(c);
  const r=window.AGSAFlight3D.createRenderer(c,{inspectionOnly:true});
  window.__fighterNativeProof={r,c,state:{mode:"airplane",xM:0,zM:0,
   altitudeM:120,headingDeg:0,pitchDeg:0,rollDeg:0,speedKt:150}};
  return Boolean(r);
 });
 assert.ok(ready,"native fighter renderer must initialize");
 const draw=async id=>page.evaluate(id=>{
  const {r,c,state}=window.__fighterNativeProof;
  r.draw(state,{view:"inspect",airframeId:id,
   orbit:{azimuth:40,elevation:15,distance:26}});
  return c.dataset.airframeSource;
 },id);
 await page.locator("#cockpitAircraftSelect").selectOption("f22");
 await draw("f22");
 await page.waitForFunction(()=>typeof window.__releaseModels.f22==="function",
  null,{timeout:12000});
 assert.equal(await draw("f22"),"loading",
  "native F-22 must not show a legacy plane while the source is held");
 if(!(await page.locator("#aircraftInspectOpen").isVisible()))
  await page.locator("#cockpitHelpToggle").tap();
 await page.locator("#aircraftInspectOpen").tap();
 assert.equal(await page.locator("#aircraftInspectCanvas3D").isVisible(),false);
 assert.equal(await page.locator("#aircraftInspectCanvas2D").isVisible(),false);
 assert.equal(await page.locator("#aircraftInspectSuperHornet").isVisible(),true);
 const f22Embed=await page.locator("#aircraftInspectSuperHornetFrame").getAttribute("src");
 assert.ok(f22Embed?.includes("/embed"),"licensed F-22 360° viewer must load");
 await page.waitForTimeout(350);
 assert.equal(await draw("f22"),"loading","source loading remains visually isolated");
 await page.evaluate(()=>window.__releaseModels.f22());
 await page.waitForFunction(()=>
  window.__fighterNativeProof.r.realF22Status==="imported",null,{timeout:25000});
 assert.equal(await draw("f22"),"gpl-f22-fguk");
 assert.equal(await page.locator("#aircraftInspectSuperHornet").isVisible(),true,
  "licensed 360° viewer stays active after native mesh finishes");
 await page.locator("#aircraftInspectModelSelect").selectOption("f35");
 await draw("f35");
 await page.waitForFunction(()=>typeof window.__releaseModels.f35==="function",
  null,{timeout:12000});
 assert.equal(await draw("f35"),"loading");
 assert.equal(await page.locator("#aircraftInspectCanvas3D").isVisible(),false);
 assert.equal(await page.locator("#aircraftInspectSuperHornet").isVisible(),true);
 const f35Embed=await page.locator("#aircraftInspectSuperHornetFrame").getAttribute("src");
 assert.ok(f35Embed?.includes("/embed")&&f35Embed!==f22Embed,
  "F-35 viewer replaces F-22 source without showing the old aircraft");
 await page.waitForTimeout(350);
 assert.equal(await draw("f35"),"loading");
 await page.evaluate(()=>window.__releaseModels.f35());
 await page.waitForFunction(()=>
  window.__fighterNativeProof.r.realF35Status==="imported",null,{timeout:25000});
 assert.equal(await draw("f35"),"gpl-f35b-flightgear");
 // Both source meshes remain cached, and the source-hosted 360 viewer
 // changes identity immediately without introducing a stale 2D canvas.
 for(const [id,expected] of [
  ["f22",f22Embed],["f35",f35Embed]
 ]){
  await page.locator("#aircraftInspectModelSelect").selectOption(id);
  assert.equal(await page.locator("#aircraftInspectSuperHornetFrame").getAttribute("src"),expected);
  assert.equal(await page.locator("#aircraftInspectCanvas3D").isVisible(),false);
  assert.equal(await draw(id),id==="f22"?"gpl-f22-fguk":"gpl-f35b-flightgear");
 }
 assert.deepEqual(errors,[],"mobile fighter inspection must not throw JS errors");
 await context.close();
 console.log("F-22/F-35B source downloads and licensed 360 viewers remain isolated without old-aircraft flash");
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
