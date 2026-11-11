// Browser evidence at phone-sized Android viewport for the *imported* GLB/AC3D
// renderer. This does not replace tests on an actual TECNO Camon 30 GPU.
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright";

const root=process.cwd();
const media={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",
 ".js":"text/javascript; charset=utf-8",".webp":"image/webp",".png":"image/png",
 ".glb":"model/gltf-binary",".ac":"text/plain; charset=utf-8",".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{
 try{
  const url=new URL(req.url,"http://localhost");
  const file=path.resolve(root,"."+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
   res.writeHead(404);res.end("Not found");return;
  }
  res.writeHead(200,{"Content-Type":media[path.extname(file)]||"application/octet-stream",
   "Cache-Control":"no-store"});
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
 const url="http://127.0.0.1:"+server.address().port+"/flight-sim.html";
 fs.mkdirSync("artifacts",{recursive:true});
 for(const layout of [
  {name:"portrait",width:390,height:844,canvasWidth:352,canvasHeight:290},
  {name:"landscape",width:844,height:390,canvasWidth:610,canvasHeight:310}
 ]){
  const context=await browser.newContext({viewport:{width:layout.width,height:layout.height},
   deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  try{
   await page.goto(url,{waitUntil:"load"});
   const created=await page.evaluate(({canvasWidth,canvasHeight})=>{
    const canvas=document.createElement("canvas");
    canvas.id="mobileImportedAirframeEvidence";
    canvas.style.cssText="display:block;width:"+canvasWidth+"px;height:"+
     canvasHeight+"px;max-width:100%;margin:12px auto;background:#b5d9ee";
    document.body.appendChild(canvas);
    const renderer=window.AGSAFlight3D?.createRenderer(canvas,{inspectionOnly:true});
    window.__mobileAirframeRenderer=renderer;
    window.__mobileAirframeCanvas=canvas;
    return Boolean(renderer);
   },layout);
   assert.ok(created,layout.name+": emulated Android WebGL2 renderer must initialize");
   await page.waitForFunction(()=>{
    const r=window.__mobileAirframeRenderer;
    return r?.realC172Status==="imported"&&r?.realR44Status==="imported";
   },null,{timeout:25000});
   for(const aircraft of [
    {id:"c172",mode:"airplane",expected:"licensed-c172-glb"},
    {id:"r44",mode:"helicopter",expected:"mit-r44-glb"}
   ]){
    // Two angles with the same aircraft must produce distinct GPU pixels.
    // These mechanical checks are not a substitute for reviewing the images.
    const evidence=await page.evaluate(({mode,id})=>{
     const canvas=window.__mobileAirframeCanvas;
     const renderer=window.__mobileAirframeRenderer;
     const state={mode,xM:0,zM:0,altitudeM:50,headingDeg:0,pitchDeg:0,
      rollDeg:0,groundSpeedKt:0,time:2};
     const samples=[];
     const gl=canvas.getContext("webgl2");
     for(const azimuth of [30,130]){
      const drawn=renderer.draw(state,{view:"inspect",airframeId:id,
       orbit:{azimuth,elevation:12,distance:id==="r44"?11:13},
       animation:{mainRotor:.45,tailRotor:1.1}});
      const w=canvas.width,h=canvas.height,pixels=new Uint8Array(w*h*4);
      gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      let hash=2166136261>>>0,different=0;
      for(let i=0;i<pixels.length;i+=4){
       const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
       if(Math.max(r,g,b)-Math.min(r,g,b)>30)different++;
       if(i%44===0)hash=Math.imul(hash^r^g^b,16777619)>>>0;
      }
      samples.push({azimuth,hash,different,w,h,drawn});
     }
     return {source:canvas.dataset.airframeSource,
      interior:canvas.dataset.airframeInterior,
      status:id==="r44"?renderer.realR44Status:renderer.realC172Status,
      samples};
    },aircraft);
    assert.equal(evidence.status,"imported",aircraft.id+" must load authentic model");
    assert.equal(evidence.source,aircraft.expected,
     aircraft.id+" may not silently fall back to procedural model on emulated phone");
    assert.equal(evidence.interior,aircraft.id==="r44"?
     "source-cabin-and-panel":"four-seats-and-panel",
     aircraft.id+" cabin must draw");
    assert.ok(evidence.samples.every(p=>p.drawn&&p.w>200&&p.h>100),
     aircraft.id+" canvas must render at phone size");
    assert.ok(evidence.samples.every(p=>p.different>400),
     aircraft.id+" cannot render blank/monochrome canvas");
    assert.notEqual(evidence.samples[0].hash,evidence.samples[1].hash,
     aircraft.id+" orbit must change the visible image");
    // Capture a representative inspector view with the SAME mobile viewport.
    await page.evaluate(({mode,id})=>{
     const state={mode,xM:0,zM:0,altitudeM:50,
      headingDeg:0,pitchDeg:0,rollDeg:0,time:2};
     window.__mobileAirframeRenderer.draw(state,{
      view:"inspect",airframeId:id,
      orbit:{azimuth:58,elevation:8,distance:id==="r44"?10:11},
      animation:{mainRotor:.5,tailRotor:1.4}});
    },aircraft);
    await page.locator("#mobileImportedAirframeEvidence").screenshot({
     path:"artifacts/mobile-"+layout.name+"-"+aircraft.id+"-inspector.png"});
    console.log("Emulated Android "+layout.name+" "+aircraft.id+" imported mesh:",
     JSON.stringify(evidence));
   }
   const dims=await page.evaluate(()=>({
    screenWidth:innerWidth,documentWidth:document.documentElement.scrollWidth
   }));
   assert.ok(dims.documentWidth<=dims.screenWidth+2,
    layout.name+" horizontal page overflow: "+JSON.stringify(dims));
   assert.deepEqual(errors,[],layout.name+" browser should not throw JavaScript exceptions");
  }finally{
   await context.close();
  }
 }
 console.log("Mobile imported-aircraft screenshots created for review; physical-device approval still required");
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
