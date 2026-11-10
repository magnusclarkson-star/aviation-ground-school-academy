import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright";

const root=process.cwd();
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".glb":"model/gltf-binary",".css":"text/css; charset=utf-8"};
const server=http.createServer((req,res)=>{
 try{
  const u=new URL(req.url,"http://localhost");
  const file=path.resolve(root,"."+decodeURIComponent(u.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
   res.writeHead(404);res.end("Not found");return;
  }
  res.writeHead(200,{"Content-Type":types[path.extname(file)]||"application/octet-stream",
   "Cache-Control":"no-store"});
  fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(500);res.end("Request failed");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
let browser;
try{
 const url="http://127.0.0.1:"+server.address().port+"/flight-sim-v3-preview.html";
 browser=await chromium.launch({headless:true,args:[
  "--no-sandbox","--enable-webgl","--use-gl=angle",
  "--use-angle=swiftshader-webgl","--enable-unsafe-swiftshader"
 ]});
 fs.mkdirSync("artifacts",{recursive:true});
 for(const v of [
  {name:"portrait",width:390,height:844},
  {name:"landscape",width:844,height:390}
 ]){
  const context=await browser.newContext({viewport:{width:v.width,height:v.height},
   deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto(url,{waitUntil:"load"});
   await page.waitForFunction(()=>window.__AGSA_V3?.ready===true,null,{timeout:25000});
   const model=await page.evaluate(()=>{
    const m=window.__AGSA_V3,rig=m.rig;
    return {engine:m.engine,seats:m.seatNames,parts:m.objectNames,
     glass:!!rig.getObjectByName("transparent-windshield-and-side-windows"),
     body:!!rig.getObjectByName("single-skin-outer-fuselage"),
     prop:rig.getObjectsByProperty("name","single-pair-of-propeller-blades").length,
     leftWing:!!rig.getObjectByName("left-wing"),rightWing:!!rig.getObjectByName("right-wing"),
     leftFlap:!!rig.getObjectByName("left-flap"),rightFlap:!!rig.getObjectByName("right-flap"),
     elevator:!!rig.getObjectByName("left-elevator"),rudder:!!rig.getObjectByName("rudder")
    };
   });
   assert.equal(model.engine,"three.js");
   assert.deepEqual(model.seats,["front-left-seat","front-right-seat",
    "rear-left-seat","rear-right-seat"]);
   assert.equal(model.prop,1,"no second old propeller overlay is permitted");
   for(const prop of ["glass","body","leftWing","rightWing","leftFlap",
                       "rightFlap","elevator","rudder"])
    assert.equal(model[prop],true,"missing named three-dimensional part: "+prop);
   const canvas=page.locator("#preview3d");
   await canvas.screenshot({path:"artifacts/v3-c172-"+v.name+"-exterior.png"});
   await page.locator("#cabinCamera").click();
   await page.waitForTimeout(200);
   await canvas.screenshot({path:"artifacts/v3-c172-"+v.name+"-interior.png"});
   // Real input events must change actual child-group rotations.
   await page.locator("#flapControl").evaluate(el=>{
    el.value="25";el.dispatchEvent(new Event("input",{bubbles:true}));
   });
   await page.locator("#aileronControl").evaluate(el=>{
    el.value=".6";el.dispatchEvent(new Event("input",{bubbles:true}));
   });
   await page.locator("#elevatorControl").evaluate(el=>{
    el.value="-.55";el.dispatchEvent(new Event("input",{bubbles:true}));
   });
   await page.locator("#rudderControl").evaluate(el=>{
    el.value=".45";el.dispatchEvent(new Event("input",{bubbles:true}));
   });
   const movement=await page.evaluate(()=>window.__AGSA_V3.getControls());
   assert.ok(movement.leftFlap<-.3&&movement.rightFlap<-.3);
   assert.ok(movement.leftAileron>0&&movement.rightAileron<0);
   assert.ok(movement.leftElevator<0&&movement.rudder>0);
   const c=await canvas.boundingBox();
   assert.ok(c.width>250&&c.height>220,"flight model must occupy a usable mobile viewport");
   const session=await page.context().newCDPSession(page);
   const x=c.x+c.width*.53,y=c.y+c.height*.5;
   await session.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[
    {x,y,id:1}
   ]});
   await session.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[
    {x:x+48,y:y+17,id:1}
   ]});
   await session.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
   await page.waitForTimeout(200);
   await canvas.screenshot({path:"artifacts/v3-c172-"+v.name+"-touch-orbit.png"});
   // Compare the bundled licensed original model, without mounting extra
   // V2 geometry over it. A failure here must block the reference toggle.
   await page.locator("#modelVersion").selectOption("source");
   await page.waitForFunction(()=>window.__AGSA_V3.getReferenceLoaded()===true,
    null,{timeout:22000});
   assert.equal(await page.evaluate(()=>window.__AGSA_V3.getMode()),"reference");
   await canvas.screenshot({path:"artifacts/v3-c172-"+v.name+"-source-glb.png"});
   await page.locator("#modelVersion").selectOption("v3");
   assert.equal(await page.evaluate(()=>window.__AGSA_V3.getMode()),"v3");
   const dimensions=await page.evaluate(()=>({
    width:innerWidth,scrollWidth:document.documentElement.scrollWidth
   }));
   assert.ok(dimensions.scrollWidth<=dimensions.width+2,
    "horizontal overflow on emulated Android "+v.name+": "+JSON.stringify(dimensions));
   assert.deepEqual(errors,[],v.name+" JavaScript errors");
   console.log("V3 C172 imported-source comparison + real controls on emulated Android",
    v.name,JSON.stringify({model,movement,dimensions}));
  }finally{await context.close();}
 }
 console.log("V3 isolated C172 visual smoke passed; actual phone acceptance remains open");
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
