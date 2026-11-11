import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const mime={".html":"text/html",".js":"text/javascript",".glb":"model/gltf-binary"};
const server=http.createServer((req,res)=>{
 try{
  const file=path.resolve(root,"."+decodeURIComponent(new URL(req.url,"http://localhost").pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
   res.writeHead(404);res.end("not found");return;
  }
  res.writeHead(200,{"Content-Type":mime[path.extname(file)]||"application/octet-stream","Cache-Control":"no-store"});
  fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(500);res.end("server error")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const html=`<!doctype html><title>C172 candidate 3D evaluation</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<body style="margin:0"><canvas id="view" style="width:100vw;height:95vh;display:block"></canvas>
<script src="/artifacts/c172-review.bundle.js"></script></body>`;
fs.writeFileSync("artifacts/c172-review.html",html);
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox","--enable-webgl",
  "--use-gl=angle","--use-angle=swiftshader-webgl","--enable-unsafe-swiftshader"]});
 for(const v of [{name:"portrait",width:390,height:844},
  {name:"landscape",width:844,height:390}]){
  const page=await browser.newPage({viewport:{width:v.width,height:v.height},
   isMobile:true,hasTouch:true});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto("http://127.0.0.1:"+server.address().port+"/artifacts/c172-review.html");
   await page.waitForFunction(()=>window.__C172_REVIEW?.ready||window.__C172_REVIEW?.errors?.length,
    null,{timeout:25000});
   const info=await page.evaluate(()=>({
    bounds:window.__C172_REVIEW.bounds,meshes:window.__C172_REVIEW.meshCount,
    materials:window.__C172_REVIEW.materialCount,
    names:window.__C172_REVIEW.names,seats:window.__C172_REVIEW.namedSeats,
    errors:window.__C172_REVIEW.errors
   }));
   assert.deepEqual(errors,[]);
   assert.deepEqual(info.errors,[]);
   assert.ok(info.meshes>5,"candidate must be a real 3D C172");
   assert.ok(Math.max(...info.bounds)>7,"airframe dimensions must be meaningful");
   for(const view of ["front","side","overhead","cabin"]){
    await page.evaluate(view=>window.__C172_REVIEW.setView(view),view);
    await page.waitForTimeout(160);
    await page.locator("#view").screenshot({path:
     "artifacts/c172-mit-"+v.name+"-"+view+".png"});
   }
   console.log("C172 MIT review",v.name,JSON.stringify(info));
  }finally{await page.close();}
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
