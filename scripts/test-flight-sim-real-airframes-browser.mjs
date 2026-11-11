import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright";

const root=process.cwd(),extensions={
 ".html":"text/html; charset=utf-8",
 ".js":"text/javascript; charset=utf-8",
 ".mjs":"text/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",
 ".glb":"model/gltf-binary",
 ".webp":"image/webp",
 ".png":"image/png",
 ".ac":"text/plain; charset=utf-8",
 ".svg":"image/svg+xml"
};
const server=http.createServer((req,res)=>{
 try{
  const wanted=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const target=path.resolve(root,"."+wanted);
  if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){
   res.writeHead(404);res.end("Not found");return;
  }
  res.setHeader("Content-Type",extensions[path.extname(target)]||"application/octet-stream");
  res.setHeader("Cache-Control","no-cache");
  fs.createReadStream(target).pipe(res);
 }catch{res.writeHead(500);res.end("Request failed");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
let browser;
try{
 const url="http://127.0.0.1:"+server.address().port+"/flight-sim.html";
 browser=await chromium.launch({headless:true,args:[
  "--no-sandbox","--enable-webgl","--use-gl=angle",
  "--use-angle=swiftshader-webgl","--enable-unsafe-swiftshader"
 ]});
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 const errors=[];
 page.on("pageerror",err=>errors.push(err.message));
 await page.goto(url,{waitUntil:"load"});
 const created=await page.evaluate(()=>{
  if(!window.AGSAC172Airframe||!window.AGSAFlight3D)return false;
  const canvas=document.createElement("canvas");
  canvas.width=750;canvas.height=540;canvas.style.cssText="width:750px;height:540px";
  document.body.appendChild(canvas);
  window.__c172TestCanvas=canvas;
  window.__c172TestRenderer=window.AGSAFlight3D.createRenderer(canvas,{inspectionOnly:true});
  return !!window.__c172TestRenderer;
 });
 assert.ok(created,"WebGL2 inspection renderer must initialize");
 await page.waitForFunction(()=>window.__c172TestRenderer?.realC172Status==="imported",null,
  {timeout:20000});
 const info=await page.evaluate(async()=>{
  const model=await window.AGSAC172Airframe.ensureC172();
  const s={mode:"airplane",xM:0,zM:0,altitudeM:60,
   headingDeg:0,pitchDeg:0,rollDeg:0,groundSpeedKt:0};
  const renderer=window.__c172TestRenderer,canvas=window.__c172TestCanvas;
  const drawn=renderer.draw(s,{view:"inspect",airframeId:"c172",
   orbit:{azimuth:32,elevation:16,distance:23}});
  const gl=canvas.getContext("webgl2");
  const w=canvas.width,h=canvas.height,pixels=new Uint8Array(w*h*4);
  gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  let changed=0;
  for(let i=0;i<pixels.length;i+=4){
   const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
   if(Math.max(r,g,b)-Math.min(r,g,b)>24)changed++;
  }
  return {status:renderer.realC172Status,source:canvas.dataset.airframeSource,
   drawn,vertices:model.vertices,triangles:model.triangles,
   textureImages:model.images.length,chromaticPixels:changed,
   cabin:canvas.dataset.airframeInterior,width:w,height:h};
 });
 assert.equal(info.status,"imported");
 assert.equal(info.source,"mit-c172s-glb");
 assert.equal(info.cabin,"source-cabin-and-panel");
 assert.ok(info.drawn);
 assert.ok(info.vertices>35000);
 assert.ok(info.triangles>30000);
 assert.ok(info.textureImages>=15);
 assert.ok(info.chromaticPixels>1000,"actual WebGL screenshot has textured colours");
 fs.mkdirSync("artifacts",{recursive:true});
 await page.locator("canvas").last().screenshot({path:"artifacts/real-c172-3d-preview.png"});
 await page.evaluate(()=>{
  const state={mode:"airplane",xM:0,zM:0,altitudeM:60,headingDeg:0,pitchDeg:0,rollDeg:0};
  window.__c172TestRenderer.draw(state,{view:"inspect",airframeId:"c172",
   orbit:{azimuth:58,elevation:5,distance:10}});
 });
 await page.locator("canvas").last().screenshot({path:"artifacts/real-c172-cabin-closeup.png"});
 // The imported Robinson R44 must actually replace the procedural hull
 // while retaining the existing simulator's animated main/tail rotors.
 await page.waitForFunction(()=>window.__c172TestRenderer?.realR44Status==="imported",null,
  {timeout:20000});
 const rotor=await page.evaluate(async()=>{
  const model=await window.AGSAR44Airframe.ensureR44();
  const s={mode:"helicopter",xM:0,zM:0,altitudeM:60,
   headingDeg:30,pitchDeg:4,rollDeg:2,groundSpeedKt:18};
  const renderer=window.__c172TestRenderer,canvas=window.__c172TestCanvas;
  const details=[];
  for(const view of ["side","chase","top","inspect"]){
   const drawn=renderer.draw(s,{view,airframeId:"r44",
    animation:{mainRotor:1.2,tailRotor:2.4,swashBank:.12,
     swashPitch:-.08,collectiveLink:.22},
    orbit:{azimuth:28,elevation:14,distance:12}});
   const gl=canvas.getContext("webgl2");
   const pixels=new Uint8Array(canvas.width*canvas.height*4);
   gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   let yellow=0,hash=2166136261>>>0;
   for(let i=0;i<pixels.length;i+=4){
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
    // The detailed cream-and-blue R44 must occupy nontrivial screen
    // area; the blue sky alone must not satisfy the realism smoke test.
    if(r>90&&g>70&&r<240&&b<r*.95)yellow++;
    if(i%28===0)hash=Math.imul(hash^r^g^b,16777619)>>>0;
   }
   details.push({view,drawn,yellow,hash});
  }
  return {status:renderer.realR44Status,source:canvas.dataset.airframeSource,
   vertices:model.vertices,triangles:model.triangles,
   imageCount:model.images.length,mainParts:model.mainParts,
   tailParts:model.tailParts,details};
 });
 assert.equal(rotor.status,"imported");
 assert.equal(rotor.source,"mit-r44-glb");
 assert.equal(await page.evaluate(()=>window.__c172TestCanvas.dataset.airframeInterior),
  "source-cabin-and-panel");
 assert.ok(rotor.vertices>15000);
 assert.ok(rotor.triangles>15000);
 assert.ok(rotor.imageCount>=8);
 assert.ok(rotor.mainParts>=2&&rotor.tailParts>=2,
  "native GLB main and tail rotors must both exist");
 assert.ok(rotor.details.every(v=>v.drawn&&v.yellow>100),
  "actual MIT R44 body must be visible, not only sky pixels");
 assert.equal(new Set(rotor.details.map(v=>v.hash)).size,4,
  "R44 exterior camera angles must display distinct images");
 // Verify the actual GPU pixels change when the student's rotor controls
 // change. Merely confirming that JavaScript accepts a rotor angle would
 // not prove the imported helicopter remains animated in WebGL.
 const rotorControlVisual=await page.evaluate(()=>{
  const renderer=window.__c172TestRenderer,
   canvas=window.__c172TestCanvas,gl=canvas.getContext("webgl2");
  const s={mode:"helicopter",xM:0,zM:0,altitudeM:60,
   headingDeg:0,pitchDeg:0,rollDeg:0,groundSpeedKt:0};
  function sample(angle,cyclic){
   renderer.draw(s,{view:"top",airframeId:"r44",
    animation:{mainRotor:angle,tailRotor:angle*2,
     swashBank:cyclic,swashPitch:-cyclic,collectiveLink:cyclic},
    orbit:{azimuth:0,elevation:65,distance:12}});
   const out=new Uint8Array(canvas.width*canvas.height*4);
   gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,out);
   return out;
  }
  const original=sample(.12,.02),moved=sample(1.18,.28);
  let changed=0;
  for(let i=0;i<original.length;i+=4){
   const d=Math.abs(original[i]-moved[i])+
    Math.abs(original[i+1]-moved[i+1])+
    Math.abs(original[i+2]-moved[i+2]);
   if(d>35)changed++;
  }
  return {changed,pixels:canvas.width*canvas.height};
 });
 assert.ok(rotorControlVisual.changed>100,
  "R44 rotor/cyclic animation must alter actual rendered GPU pixels");

 for(const view of ["side","chase","top","inspect"]){
  await page.evaluate(view=>{
   window.__c172TestRenderer.draw({
    mode:"helicopter",xM:0,zM:0,altitudeM:60,headingDeg:30,
    pitchDeg:4,rollDeg:2,groundSpeedKt:18
   },{view,airframeId:"r44",
    animation:{mainRotor:1.2,tailRotor:2.4,swashBank:.12,
     swashPitch:-.08,collectiveLink:.22},
    orbit:{azimuth:28,elevation:14,distance:12}});
  },view);
  await page.locator("canvas").last().screenshot({
   path:"artifacts/real-r44-"+view+"-preview.png"});
 }
 await page.locator("canvas").last().screenshot({path:"artifacts/real-r44-3d-preview.png"});
 await page.evaluate(()=>{
  const state={mode:"helicopter",xM:0,zM:0,altitudeM:60,
   headingDeg:0,pitchDeg:0,rollDeg:0};
  window.__c172TestRenderer.draw(state,{view:"inspect",airframeId:"r44",
   animation:{mainRotor:.45,tailRotor:.6},
   orbit:{azimuth:65,elevation:3,distance:9}});
 });
 await page.locator("canvas").last().screenshot({path:"artifacts/real-r44-cabin-closeup.png"});
 // Near-front 360° view validates that the new central pod can be inspected
 // from the phone, not merely constructed as invisible geometry in JavaScript.
 await page.evaluate(()=>{
  const state={mode:"helicopter",xM:0,zM:0,altitudeM:60,
   headingDeg:0,pitchDeg:0,rollDeg:0};
  window.__c172TestRenderer.draw(state,{view:"inspect",airframeId:"r44",
   animation:{mainRotor:.45,tailRotor:.6},
   orbit:{azimuth:155,elevation:1,distance:6.8}});
 });
 await page.locator("canvas").last().screenshot({
  path:"artifacts/real-r44-central-pod-closeup.png"});
 assert.deepEqual(errors,[]);
 console.log("MIT C172S complete GLB Browser passed:",JSON.stringify(info));
 console.log("Real R44 textured mesh Browser passed:",JSON.stringify(rotor));
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
