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
  if(!window.AGSARealAirframes||!window.AGSAFlight3D)return false;
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
  const model=await window.AGSARealAirframes.ensureC172();
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
   width:w,height:h};
 });
 assert.equal(info.status,"imported");
 assert.equal(info.source,"licensed-c172-glb");
 assert.ok(info.drawn);
 assert.ok(info.vertices>12000);
 assert.ok(info.triangles>13000);
 assert.ok(info.textureImages>=2);
 assert.ok(info.chromaticPixels>1000,"actual WebGL screenshot has textured colours");
 fs.mkdirSync("artifacts",{recursive:true});
 await page.locator("canvas").last().screenshot({path:"artifacts/real-c172-3d-preview.png"});
 assert.deepEqual(errors,[]);
 console.log("Real C172 GLB Browser passed:",JSON.stringify(info));
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
