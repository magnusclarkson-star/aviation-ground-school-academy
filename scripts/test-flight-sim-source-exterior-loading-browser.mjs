/* Source fighter chase/exterior loading: never render an obsolete jet while
 * the authentic source mesh is delayed. Verify real GPU pixels on a mobile
 * Chromium viewport; the approved C172/R44 cockpit is not touched.
 */
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".json":"application/json",
 ".webp":"image/webp",".png":"image/png",".glb":"model/gltf-binary",
 ".ac":"text/plain; charset=utf-8"};
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
  hasTouch:true,isMobile:true,serviceWorkers:"block"});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const genuine=window.fetch.bind(window);
  window.__heldModels={};
  window.fetch=(input,...args)=>{
   const url=typeof input==="string"?input:input?.url||"";
   const paths={
    f22:"f22-fguk-exterior.json",f35:"f35b-fg-exterior.json",
    typhoon:"typhoon-fg-exterior.json",su37:"su37-fguk-exterior.json"
   };
   const id=Object.keys(paths).find(key=>url.includes(paths[key]));
   if(!id)return genuine(input,...args);
   return new Promise((resolve,reject)=>{
    window.__heldModels[id]=()=>genuine(input,...args).then(resolve,reject);
   });
  };
 });
 await page.goto("http://127.0.0.1:"+server.address().port+"/flight-sim.html",
  {waitUntil:"load"});
 const initialized=await page.evaluate(()=>{
  const c=document.createElement("canvas");
  c.id="fighterLoadingProof";c.width=350;c.height=240;
  c.style.width="350px";c.style.height="240px";document.body.appendChild(c);
  window.__loadingCanvas=c;
  window.__loadingRenderer=window.AGSAFlight3D.createRenderer(c,{
   inspectionOnly:true
  });
  window.__loadingState={mode:"airplane",xM:0,zM:0,altitudeM:120,
   headingDeg:0,pitchDeg:0,rollDeg:0,speedKt:155,time:2};
  return Boolean(window.__loadingRenderer);
 });
 assert.ok(initialized,"genuine mobile WebGL renderer must initialize");
 const render=async(id)=>page.evaluate(id=>{
  const r=window.__loadingRenderer,c=window.__loadingCanvas;
  if(!r.draw(window.__loadingState,{view:"chase",airframeId:id,
   orbit:{azimuth:45,elevation:18,distance:28}}))return null;
  const gl=c.getContext("webgl2"),p=new Uint8Array(c.width*c.height*4);
  gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,p);
  let hash=2166136261>>>0,detail=0;
  for(let i=0;i<p.length;i+=4){
   if(p[i]<140&&p[i+1]<150&&p[i+2]<160)detail++;
   if(i%80===0)hash=Math.imul(hash^p[i]^p[i+1]^p[i+2],16777619)>>>0;
  }
  return {source:c.dataset.airframeSource,hash,detail};
 },id);
 // The F/A-18 is the only fighter with an intentionally disabled
 // high-detail source manifest. Wait for its explicit fallback, so this
 // comparison never mistakes the brief download-check frame for a jet.
 await render("fa18");
 await page.waitForFunction(()=>
  window.__loadingRenderer?.realFA18Status==="fallback",
  null,{timeout:15000});
 const baseline=await render("fa18");
 assert.equal(baseline.source,"superhornet-dedicated-v3",
  "F/A-18 dedicated geometry remains available after manifest check");
 let pendingHash=null;
 for(const [id,source] of [
  ["f22","gpl-f22-fguk"],["f35","gpl-f35b-flightgear"],
  ["typhoon","gpl-typhoon-fg"],["su37","gpl-su37-fguk"]
 ]){
  const pending=await render(id);
  assert.equal(pending.source,"loading",id+" must not fall back to the old jet");
  await page.waitForFunction(id=>typeof window.__heldModels[id]==="function",
   id,{timeout:15000});
  const still=await render(id);
  assert.equal(still.source,"loading",id+" stays pending under slow download");
  assert.equal(still.hash,pending.hash,
   id+" loading screen must not paint an old animated jet");
  if(pendingHash===null)pendingHash=pending.hash;
  else assert.equal(pending.hash,pendingHash,
   "all four source fighters must use the same background-only frame");
  await page.evaluate(id=>window.__heldModels[id](),id);
  await page.waitForFunction(({id,source})=>{
   const r=window.__loadingRenderer;
   return r.prepareAirframe(id)==="imported";
  },{id,source},{timeout:25000});
  const loaded=await render(id);
  assert.equal(loaded.source,source,id+" uses genuine imported geometry");
  assert.notEqual(loaded.hash,pending.hash,
   id+" rendered 3D airframe must differ from its pending background");
  assert.ok(loaded.detail>pending.detail+100,
   id+" full aircraft has meaningful visible pixel coverage");
  console.log(id+" no obsolete chase-view flash; imported mesh visible");
 }
 assert.deepEqual(errors,[],"no JS exception during four authentic source loads");
 await context.close();
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
