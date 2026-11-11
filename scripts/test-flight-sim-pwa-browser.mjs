// Confirm the Android-installable flight app reloads offline after online
// warm-up, and its two imported source models remain available from the cache.
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import {mkdtemp,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {chromium} from "playwright";
import {createFlightSimIcons} from "./build-flight-sim-icons.mjs";

const repo=process.cwd(),staging=await mkdtemp(path.join(os.tmpdir(),"agsa-pwa-icons-"));
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".mjs":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",
 ".json":"application/json; charset=utf-8",".png":"image/png",
 ".webp":"image/webp",".glb":"model/gltf-binary",".ac":"text/plain; charset=utf-8",
 ".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,"http://localhost");
 const relative=decodeURIComponent(url.pathname).replace(/^\//,"");
 const target=relative.startsWith("flight-sim-icon-")?
  path.join(staging,relative):path.resolve(repo,relative);
 if((!target.startsWith(repo+path.sep)&&!target.startsWith(staging+path.sep))||
   !fs.existsSync(target)||!fs.statSync(target).isFile()){
  res.writeHead(404);res.end("Not found");return;
 }
 res.setHeader("Content-Type",mime[path.extname(target)]||"application/octet-stream");
 res.setHeader("Cache-Control","no-store");
 fs.createReadStream(target).pipe(res);
});
let browser,context;
try{
 await createFlightSimIcons(staging);
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 browser=await chromium.launch({headless:true,args:[
  "--no-sandbox","--enable-webgl","--use-gl=angle",
  "--use-angle=swiftshader-webgl","--enable-unsafe-swiftshader"
 ]});
 context=await browser.newContext({viewport:{width:390,height:844},
  hasTouch:true,isMobile:true,serviceWorkers:"allow"});
 const page=await context.newPage();
 const url="http://127.0.0.1:"+server.address().port+"/flight-sim.html";
 await page.goto(url,{waitUntil:"load"});
 const manifest=await page.evaluate(async()=>await (
  await fetch("./flight-sim-manifest.json")).json());
 assert.equal(manifest.display,"standalone");
 assert.equal(manifest.icons.length,2);
 await page.waitForFunction(()=>navigator.serviceWorker?.controller,null,
  {timeout:30000});
 // A second *online* load makes the worker cache the entire live simulator,
 // including browser scripts and styles. Explicitly request both aircraft
 // models to exercise the same asynchronous paths as the 3D inspection.
 await page.reload({waitUntil:"load"});
 await page.waitForFunction(()=>window.AGSAR44Airframe&&window.AGSARealAirframes,
  null,{timeout:20000});
 const before=await page.evaluate(async()=>{
  const r=await window.AGSAR44Airframe.ensureR44();
  const c=await window.AGSARealAirframes.ensureC172();
  return {r44:r.triangles,c172:c.triangles,controlled:!!navigator.serviceWorker.controller};
 });
 assert.ok(before.r44>15000&&before.c172>13000&&before.controlled,
  "both real 3D aircraft assets must be cached while online");
 await context.setOffline(true);
 await page.reload({waitUntil:"load",timeout:30000});
 const after=await page.evaluate(async()=>{
  const r=await window.AGSAR44Airframe.ensureR44();
  const c=await window.AGSARealAirframes.ensureC172();
  return {r44:r.triangles,c172:c.triangles,
   title:document.title,controlled:!!navigator.serviceWorker.controller};
 });
 assert.deepEqual({r44:after.r44,c172:after.c172},
  {r44:before.r44,c172:before.c172},
  "simulator must load both GLB assets offline after online warmup");
 assert.ok(after.title.includes("Flight Simulator")&&after.controlled);
 console.log("Phone PWA offline browser test passed:",JSON.stringify(after));
}finally{
 await context?.close();
 await browser?.close();
 if(server.listening)await new Promise(resolve=>server.close(resolve));
 await rm(staging,{recursive:true,force:true});
}
