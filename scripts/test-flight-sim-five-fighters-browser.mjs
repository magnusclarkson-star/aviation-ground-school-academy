/* Five-fighter WebGL acceptance at emulated Android portrait/landscape.
 * This verifies actual GPU pixels, not manufacturer accuracy or a physical
 * Tecno device. It does not touch the approved C172/R44 cockpit layouts.
 */
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright";

const root=process.cwd();
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",
 ".js":"text/javascript; charset=utf-8",".json":"application/json",
 ".webp":"image/webp",".png":"image/png",".glb":"model/gltf-binary",
 ".ac":"text/plain; charset=utf-8"};
const server=http.createServer((req,res)=>{
 try{
  const u=new URL(req.url,"http://localhost");
  const file=path.resolve(root,"."+decodeURIComponent(u.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||
     !fs.statSync(file).isFile()){res.writeHead(404);res.end("not found");return;}
  res.writeHead(200,{"Content-Type":types[path.extname(file)]||"application/octet-stream",
   "Cache-Control":"no-store"});
  fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(500);res.end("server error");}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const aircraft=[
 {id:"fa18",source:"procedural"},
 {id:"f22",source:"gpl-f22-fguk"},
 {id:"f35",source:"gpl-f35b-flightgear"},
 {id:"typhoon",source:"procedural"},
 {id:"su37",source:"procedural"}
];
fs.mkdirSync("artifacts",{recursive:true});
let browser;
try{
 browser=await chromium.launch({headless:true,args:[
  "--no-sandbox","--enable-webgl","--use-gl=angle",
  "--use-angle=swiftshader-webgl","--enable-unsafe-swiftshader"
 ]});
 for(const layout of [
  {name:"portrait",width:390,height:844,canvasWidth:360,canvasHeight:340},
  {name:"landscape",width:844,height:390,canvasWidth:680,canvasHeight:330}
 ]){
  const context=await browser.newContext({
   viewport:{width:layout.width,height:layout.height},
   deviceScaleFactor:1,hasTouch:true,isMobile:true,serviceWorkers:"block"
  });
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto("http://127.0.0.1:"+server.address().port+"/flight-sim.html",
    {waitUntil:"load"});
   const created=await page.evaluate(size=>{
    const c=document.createElement("canvas");
    c.width=size.canvasWidth;c.height=size.canvasHeight;c.id="fiveFightersProof";
    c.style.cssText="position:fixed;top:0;left:0;width:"+c.width+
     "px;height:"+c.height+"px;z-index:9999;pointer-events:none;";
    document.body.appendChild(c);
    window.__fighterCanvas=c;
    window.__fighterRenderer=window.AGSAFlight3D?.createRenderer(c,{inspectionOnly:true});
    return Boolean(window.__fighterRenderer);
   },layout);
   assert.ok(created,"mobile WebGL2 renderer must initialize: "+layout.name);
   for(const {id,source} of aircraft){
    const selected=await page.evaluate(id=>{
     const s={mode:"airplane",airframeId:id,xM:0,zM:0,altitudeM:70,
      headingDeg:0,pitchDeg:0,rollDeg:0,speedKt:135,groundSpeedKt:135,time:2};
     window.__fighterState=s;
     return window.__fighterRenderer.draw(s,{view:"inspect",airframeId:id,
      orbit:{azimuth:30,elevation:18,distance:26}});
    },id);
    assert.ok(selected,"first "+id+" render must not fail");
    if(id==="f22"||id==="f35"){
     await page.waitForFunction(id=>{
      const r=window.__fighterRenderer;
      return (id==="f22"?r.realF22Status:r.realF35Status)==="imported";
     },id,{timeout:25000});
    }
    // Pixel evidence: each orbit genuinely changes the visual aircraft.
    const orbit=await page.evaluate(id=>{
     const r=window.__fighterRenderer,c=window.__fighterCanvas,
      s=window.__fighterState,gl=c.getContext("webgl2");
     const hashes=[];
     for(const azimuth of [-60,65]){
      if(!r.draw(s,{view:"inspect",airframeId:id,
       orbit:{azimuth,elevation:20,distance:26}}))return null;
      const px=new Uint8Array(c.width*c.height*4);
      gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,px);
      let hash=2166136261>>>0,dark=0;
      for(let i=0;i<px.length;i+=4){
       if(px[i]<170&&px[i+1]<185&&px[i+2]<195)dark++;
       if(i%80===0)hash=Math.imul(hash^px[i]^px[i+1]^px[i+2],16777619)>>>0;
      }
      hashes.push({hash,dark});
     }
     return {source:c.dataset.airframeSource,hashes};
    },id);
    assert.ok(orbit,id+" must draw both 360-degree viewpoints");
    assert.equal(orbit.source,source,id+" must render correct source");
    assert.ok(orbit.hashes.every(x=>x.dark>150),id+" must occupy GPU pixels");
    assert.notEqual(orbit.hashes[0].hash,orbit.hashes[1].hash,
     id+" must rotate in the 360-degree camera");
    // The prior imported-gear defect was invisible to data-only tests:
    // compare real WebGL pixels with extended and retracted struts.
    const gear=await page.evaluate(id=>{
     const r=window.__fighterRenderer,c=window.__fighterCanvas,
      s=window.__fighterState,gl=c.getContext("webgl2");
     const sample=angle=>{
      r.draw(s,{view:"inspect",airframeId:id,
       orbit:{azimuth:30,elevation:-45,distance:23},
       animation:{noseGear:angle,mainGearLeft:angle,mainGearRight:angle}});
      const px=new Uint8Array(c.width*c.height*4);
      gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,px);
      return px;
     };
     const down=sample(0),up=sample(1.53);
     let changed=0;
     for(let i=0;i<down.length;i+=4)
      if(Math.abs(down[i]-up[i])+Math.abs(down[i+1]-up[i+1])+
         Math.abs(down[i+2]-up[i+2])>45)changed++;
     return changed;
    },id);
    assert.ok(gear>12,id+" landing gear must move visibly in WebGL: "+gear);
    // Existing source and procedural fighter control surfaces must move.
    const controls=await page.evaluate(id=>{
     const r=window.__fighterRenderer,c=window.__fighterCanvas,
      s=window.__fighterState,gl=c.getContext("webgl2");
     const sample=angle=>{
      r.draw(s,{view:"inspect",airframeId:id,
       orbit:{azimuth:25,elevation:45,distance:23},
       animation:{leftAileron:angle,rightAileron:-angle,
        leftFlap:angle,rightFlap:angle,elevatorLeft:angle,
        elevatorRight:angle,rudder:angle,rudderLeft:angle,
        rudderRight:angle,canardLeft:angle,canardRight:-angle}});
      const px=new Uint8Array(c.width*c.height*4);
      gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,px);
      return px;
     };
     const a=sample(0),b=sample(.55);
     let changed=0;
     for(let i=0;i<a.length;i+=4)
      if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+
         Math.abs(a[i+2]-b[i+2])>45)changed++;
     return changed;
    },id);
    assert.ok(controls>12,id+" flight controls must move visibly: "+controls);
    // Save actual up/down proof images, from the same emulated device size.
    for(const [label,angle] of [["down",0],["up",1.53]]){
     await page.evaluate(({id,angle})=>{
      window.__fighterRenderer.draw(window.__fighterState,{
       view:"inspect",airframeId:id,
       orbit:{azimuth:30,elevation:-45,distance:23},
       animation:{noseGear:angle,mainGearLeft:angle,mainGearRight:angle}});
     },{id,angle});
     await page.locator("#fiveFightersProof").screenshot({
      path:"artifacts/mobile-fighter-"+layout.name+"-"+id+"-gear-"+label+".png"});
    }
    console.log("Mobile fighter "+layout.name+" "+id+" "+JSON.stringify({
     source:orbit.source,orbit:orbit.hashes,gearPixels:gear,controlPixels:controls
    }));
   }
   assert.deepEqual(errors,[],"fighter views must not cause browser exceptions");
  }finally{await context.close();}
 }
 console.log("Five fighters passed emulated Android portrait/landscape GPU tests");
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
