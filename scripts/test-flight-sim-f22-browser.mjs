/* Real browser acceptance for the GPL FlightGear F-22 source airframe.
 * Does not assert manufacturer-grade appearance or actual Tecno device FPS.
 * Source C172/R44 cockpit CSS and flight physics must remain untouched.
 */
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright";
const root=process.cwd(),types={".html":"text/html; charset=utf-8",
 ".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".json":"application/json; charset=utf-8",".webp":"image/webp",
 ".png":"image/png",".glb":"model/gltf-binary",".ac":"text/plain; charset=utf-8"};
const server=http.createServer((req,res)=>{
 try{
  const location=new URL(req.url,"http://localhost");
  const file=path.resolve(root,"."+decodeURIComponent(location.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
   res.writeHead(404);res.end("not found");return;
  }
  res.writeHead(200,{"Content-Type":types[path.extname(file)]||"application/octet-stream",
   "Cache-Control":"no-store"});
  fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(500);res.end("file error");}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
let browser;
try{
 browser=await chromium.launch({headless:true,args:[
  "--no-sandbox","--enable-webgl","--use-gl=angle",
  "--use-angle=swiftshader-webgl","--enable-unsafe-swiftshader"
 ]});
 const context=await browser.newContext({viewport:{width:844,height:390},
  hasTouch:true,isMobile:true,deviceScaleFactor:2,serviceWorkers:"block"});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("http://127.0.0.1:"+server.address().port+"/flight-sim.html",
  {waitUntil:"load"});
 const ready=await page.evaluate(()=>{
  const canvas=document.createElement("canvas");
  canvas.id="f22SourceEvidence";canvas.width=760;canvas.height=510;
  canvas.style.cssText="display:block;width:760px;height:510px";
  document.body.appendChild(canvas);
  window.__f22Canvas=canvas;
  window.__f22Renderer=window.AGSAFlight3D?.createRenderer(canvas,{inspectionOnly:true});
  const state={mode:"airplane",airframeId:"f22",xM:0,zM:0,altitudeM:70,
   headingDeg:0,pitchDeg:0,rollDeg:0,speedKt:110,groundSpeedKt:110,time:1.3};
  window.__f22State=state;
  return window.__f22Renderer?.draw(state,{view:"inspect",airframeId:"f22",
   orbit:{azimuth:35,elevation:18,distance:24}})===true;
 });
 assert.ok(ready,"WebGL2 renderer must start while genuine F-22 geometry loads");
 await page.waitForFunction(()=>window.__f22Renderer?.realF22Status==="imported",null,
  {timeout:20000});
 fs.mkdirSync("artifacts",{recursive:true});
 const views=[];
 for(const [view,orbit] of [
  ["inspect",{azimuth:35,elevation:18,distance:24}],
  ["side",{azimuth:0,elevation:0,distance:24}],
  ["top",{azimuth:0,elevation:0,distance:24}],
  ["chase",{azimuth:0,elevation:0,distance:24}]
 ]){
  const result=await page.evaluate(({view,orbit})=>{
   const r=window.__f22Renderer,s=window.__f22State,
    c=window.__f22Canvas;
   if(!r.draw(s,{view,airframeId:"f22",orbit}))return null;
   const gl=c.getContext("webgl2"),pixels=new Uint8Array(c.width*c.height*4);
   gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   let hash=2166136261>>>0,dark=0;
   for(let i=0;i<pixels.length;i+=4){
    const a=pixels[i],b=pixels[i+1],v=pixels[i+2];
    if(a<165&&b<175&&v<190)dark++;
    if(i%96===0)hash=Math.imul(hash^a^b^v,16777619)>>>0;
   }
   return {hash,dark,source:c.dataset.airframeSource,
    status:r.realF22Status};
  },{view,orbit});
  assert.ok(result,"source aircraft view should render");
  assert.equal(result.source,"gpl-f22-fguk");
  assert.equal(result.status,"imported");
  assert.ok(result.dark>200,"F-22 model must occupy visible frame pixels");
  views.push({view,...result});
  await page.locator("#f22SourceEvidence").screenshot({
   path:"artifacts/real-f22-"+view+".png"});
 }
 assert.equal(new Set(views.map(v=>v.hash)).size,4,
  "four F-22 source renders must differ across actual camera viewpoints");
 const changed=await page.evaluate(()=>{
  const r=window.__f22Renderer,c=window.__f22Canvas,
   gl=c.getContext("webgl2"),s=window.__f22State;
  const sample=(deflection)=>{
   r.draw(s,{view:"top",airframeId:"f22",animation:{
    leftAileron:deflection,rightAileron:-deflection,
    leftFlap:deflection,rightFlap:deflection,
    elevatorLeft:deflection,elevatorRight:deflection,rudder:deflection}});
   const a=new Uint8Array(c.width*c.height*4);
   gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,a);
   return a;
  };
  const a=sample(0),b=sample(.62);
  let changed=0;
  for(let i=0;i<a.length;i+=4)if(
   Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+
   Math.abs(a[i+2]-b[i+2])>45)changed++;
  return changed;
 });
 assert.ok(changed>20,"original source F-22 control surface geometry must animate in actual GPU pixels: "+changed);
 assert.deepEqual(errors,[],"imported F-22 must not cause browser exceptions");
 console.log("Real F-22 WebGL renders "+JSON.stringify({views,animatedPixels:changed}));
 await context.close();
}finally{if(browser)await browser.close();server.close();}
