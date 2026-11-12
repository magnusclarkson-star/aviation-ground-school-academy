/* Real Su-37 source-model WebGL rendering, control surfaces and landing
 * gear in emulated Android portrait/landscape (not physical phone QA).
 */
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright";
const root=process.cwd(),mime={".html":"text/html; charset=utf-8",
 ".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",
 ".json":"application/json",".png":"image/png",".webp":"image/webp",
 ".glb":"model/gltf-binary"};
const server=http.createServer((req,res)=>{
 try{
  const loc=new URL(req.url,"http://localhost");
  const file=path.resolve(root,"."+decodeURIComponent(loc.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||
     !fs.statSync(file).isFile()){
   res.writeHead(404);res.end("not found");return;
  }
  res.writeHead(200,{"Content-Type":mime[path.extname(file)]||
    "application/octet-stream","Cache-Control":"no-store"});
  fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(500);res.end("server error");}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
let browser;
try{
 browser=await chromium.launch({headless:true,args:[
  "--no-sandbox","--enable-webgl","--use-gl=angle",
  "--use-angle=swiftshader-webgl","--enable-unsafe-swiftshader"
 ]});
 fs.mkdirSync("artifacts",{recursive:true});
 for(const layout of [{name:"portrait",width:390,height:844},
  {name:"landscape",width:844,height:390}]){
  const context=await browser.newContext({
   viewport:{width:layout.width,height:layout.height},
   hasTouch:true,isMobile:true,serviceWorkers:"block"
  });
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto("http://127.0.0.1:"+server.address().port+"/flight-sim.html",
    {waitUntil:"load"});
   const ready=await page.evaluate(()=>{
    const c=document.createElement("canvas");c.id="su37SourceEvidence";
    c.width=560;c.height=400;
    c.style.cssText="display:block;width:560px;height:400px";
    document.body.appendChild(c);
    window.__su37Canvas=c;
    const r=window.AGSAFlight3D?.createRenderer(c,{inspectionOnly:true});
    window.__su37Renderer=r;
    window.__su37State={mode:"airplane",airframeId:"su37",xM:0,zM:0,
     altitudeM:50,headingDeg:0,pitchDeg:0,rollDeg:0,time:1};
    return Boolean(r?.draw(window.__su37State,{
     view:"inspect",airframeId:"su37",
     orbit:{azimuth:35,elevation:20,distance:23}}));
   });
   assert.ok(ready,"Su-37 genuine import must initialize");
   await page.waitForFunction(()=>
    window.__su37Renderer?.realSu37Status==="imported",null,{timeout:25000});
   const result=await page.evaluate(()=>{
    const c=window.__su37Canvas,r=window.__su37Renderer,
     gl=c.getContext("webgl2"),s=window.__su37State;
    const capture=(animation,azimuth=35,elevation=20)=>{
     r.draw(s,{view:"inspect",airframeId:"su37",
      orbit:{azimuth,elevation,distance:23},animation});
     const px=new Uint8Array(c.width*c.height*4);
     gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,px);
     let dark=0,hash=2166136261>>>0;
     for(let i=0;i<px.length;i+=4){
      if(px[i]<170&&px[i+1]<185&&px[i+2]<195)dark++;
      if(i%80===0)hash=Math.imul(hash^px[i]^px[i+1]^px[i+2],16777619)>>>0;
     }
     return {px,dark,hash};
    };
    const pixelDiff=(a,b)=>{
     let n=0;
     for(let i=0;i<a.length;i+=4)
      if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+
       Math.abs(a[i+2]-b[i+2])>45)n++;
     return n;
    };
    const left=capture({},-65),right=capture({},65);
    const down=capture({noseGear:0,mainGearLeft:0,mainGearRight:0},25,-48),
     up=capture({noseGear:1.53,mainGearLeft:1.53,mainGearRight:1.53},25,-48);
    const flat=capture({canardLeft:0,canardRight:0,elevatorLeft:0,
     elevatorRight:0,leftAileron:0,rightAileron:0},25,42);
    const moved=capture({canardLeft:.66,canardRight:-.66,
     elevatorLeft:.55,elevatorRight:-.55,leftAileron:.6,rightAileron:-.6},25,42);
    return {source:c.dataset.airframeSource,airframe:c.dataset.airframeId,
     orbitDiff:pixelDiff(left.px,right.px),
     gearDiff:pixelDiff(down.px,up.px),
     controlsDiff:pixelDiff(flat.px,moved.px),
     dark:Math.min(left.dark,right.dark),hashes:[left.hash,right.hash]};
   });
   assert.equal(result.source,"gpl-su37-fguk");
   assert.equal(result.airframe,"su37");
   assert.ok(result.dark>1800,"real Su-37 must have actual GPU model pixels");
   assert.ok(result.orbitDiff>150&&result.hashes[0]!==result.hashes[1],
    "real Su-37 must rotate around its actual wings and engines");
   assert.ok(result.gearDiff>15,"source Su-37 undercarriage must retract");
   assert.ok(result.controlsDiff>12,"source Su-37 canards/elevators must move");
   await page.evaluate(()=>window.__su37Renderer.draw(window.__su37State,
    {view:"inspect",airframeId:"su37",orbit:{azimuth:50,elevation:25,distance:21}}));
   await page.locator("#su37SourceEvidence").screenshot({
    path:"artifacts/real-su37-"+layout.name+".png"});
   assert.deepEqual(errors,[],"Su-37 source browser must not throw");
   console.log("Real Su-37 "+layout.name+" WebGL "+JSON.stringify(result));
  }finally{await context.close();}
 }
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
