import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const browser=await chromium.launch({headless:true,args:[
 "--no-sandbox","--enable-webgl","--use-gl=angle","--use-angle=swiftshader-webgl",
 "--enable-unsafe-swiftshader"
]});
const errors=[];
async function gpuSupported(page){
 return page.evaluate(()=>{
  try{const c=document.createElement("canvas"),gl=c.getContext("webgl2");
   return Boolean(gl&&!gl.isContextLost()&&gl.getParameter(gl.MAX_VERTEX_ATTRIBS)>=3);
  }catch{return false}
 });
}
async function gpuSignature(page){
 return page.evaluate(()=>{
  const canvas=document.getElementById("outsideView3D");
  const gl=canvas.getContext("webgl2");
  if(!gl||gl.isContextLost())return null;
  const width=Math.min(96,canvas.width),height=Math.min(72,canvas.height);
  const pixels=new Uint8Array(width*height*4);
  const x=Math.floor((canvas.width-width)/2),y=Math.floor((canvas.height-height)/2);
  gl.readPixels(x,y,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  let hash=2166136261>>>0;
  const hues=new Set();
  for(let i=0;i<pixels.length;i+=53){
   hash=Math.imul(hash^pixels[i],16777619)>>>0;
   hues.add(Math.floor(pixels[i]/12)+":"+Math.floor(pixels[i+1]/12)+":"+Math.floor(pixels[i+2]/12));
  }
  return {hash,colors:hues.size,width:canvas.width,height:canvas.height,
   version:gl.getParameter(gl.VERSION)};
 });
}
try{
 const desktop=await browser.newPage({viewport:{width:1200,height:900}});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 const runwayDrawn=await desktop.evaluate(()=>{
  const canvas=document.createElement("canvas");
  canvas.width=960;canvas.height=540;
  const ctx=canvas.getContext("2d");
  const fill=ctx.fill;
  let count=0;
  ctx.fill=function(...args){
   if(this.fillStyle==="#4f5a61"||this.fillStyle==="#535e64")count++;
   return fill.apply(this,args);
  };
  const state={mode:"airplane",xM:0,zM:2450,altitudeM:145,
   headingDeg:180,rollDeg:0,pitchDeg:0,time:0,windXMps:0,windZMps:0};
  window.AGSAFlightScenery.draw(canvas,state,{view:"cockpit"});
  return count;
 });
 assert.ok(runwayDrawn>4,"runway stays visible in 2D southbound return view");
 const treeScene=await desktop.evaluate(()=>{
  const S=window.AGSAFlightScenery;
  const list=xM=>{
   const middle=S.treeColumnAt(xM);
   return Array.from({length:7},(_,n)=>{
    const column=middle+n-3;
    return {column,x:S.treeWorldX(column,600)};
   });
  };
  return {a:list(129),b:list(131)};
 });
 const before=new Map(treeScene.a.map(p=>[p.column,p.x]));
 const after=new Map(treeScene.b.map(p=>[p.column,p.x]));
 const unchanged=[...before].filter(([column,x])=>after.get(column)===x);
 assert.equal(unchanged.length,6,
  "moving across the phone's landscape grid cannot teleport the tree line");


 assert.equal(await desktop.locator("#visualMode").inputValue(),"3d");
 assert.equal(await desktop.locator("#cameraMode").inputValue(),"cockpit");
 assert.ok(await desktop.locator("#outsideView").isVisible());
 const supports=await gpuSupported(desktop);
 const active=await desktop.locator(".scene-shell").evaluate(el=>el.classList.contains("three-dimensional"));
 if(supports){
  assert.equal(active,true,"supported browser should start in actual WebGL2 mode");
  assert.equal(await desktop.locator("#outsideView3D").isVisible(),true);
  assert.equal(await desktop.locator("#cameraMode").isDisabled(),false);
  assert.match(await desktop.locator("#visualStatus").textContent(),/3D WebGL2 airfield active/);
  await desktop.waitForTimeout(450);
  const pilot=await gpuSignature(desktop);
  assert.ok(pilot?.version?.includes("WebGL 2"),"GPU must be an actual WebGL2 context");
  assert.ok(pilot.colors>5,"three-dimensional mesh must draw multiple colors, not an empty/flat canvas");
  await desktop.locator("#cameraMode").selectOption("chase");
  assert.equal(await desktop.locator("#cockpitFrame").getAttribute("data-view"),"chase");
  assert.equal(await desktop.locator("#cockpitFrame").isVisible(),false,"outside chase view must not have cockpit overlay");
  await desktop.waitForTimeout(450);
  const chase=await gpuSignature(desktop);
  assert.ok(chase?.colors>5);
  assert.notEqual(chase.hash,pilot.hash,"chase camera changes rendered pixels using actual 3D aircraft");
  assert.equal(await desktop.locator("#flightPhase").textContent(),"RUNWAY ROLL",
   "changing visual camera does not reset the simulated flight");
  await desktop.locator("#startApproach").click();
  await desktop.waitForTimeout(900);
  const runway=await gpuSignature(desktop);
  assert.notEqual(runway.hash,chase.hash,"camera and aircraft move through genuine perspective 3D scene");
  await desktop.locator("#typeCyclic").click();
  await desktop.waitForTimeout(350);
  const heli=await gpuSignature(desktop);
  assert.ok(heli?.colors>5);
  assert.notEqual(heli.hash,runway.hash,"helipad and 3D rotorcraft scenery differ from runway");
  assert.equal(await desktop.locator("#cameraMode").inputValue(),"chase");
 }else{
  assert.equal(active,false);
  assert.equal(await desktop.locator("#cameraMode").isEnabled(),true,"outside aircraft chase works in 2D fallback");
  assert.match(await desktop.locator("#visualStatus").textContent(),/Automatically using 2D/);
  console.log("WebGL2 unavailable on this runner; asserted normal 2D auto fallback.");
 }
 await desktop.locator("#visualMode").selectOption("2d");
 assert.equal(await desktop.locator(".scene-shell").evaluate(el=>el.classList.contains("three-dimensional")),false);
 assert.equal(await desktop.locator("#outsideView3D").isVisible(),false);
 assert.equal(await desktop.locator("#cameraMode").isEnabled(),true,"outside aircraft chase works in 2D fallback");
 assert.ok(await desktop.locator("#outsideView").isVisible());
 assert.equal(await desktop.evaluate(()=>!!document.getElementById("outsideView").getContext("2d")),true);
 await desktop.locator("#visualMode").selectOption("3d");
 if(supports){
  assert.equal(await desktop.locator("#outsideView3D").isVisible(),true,"3D re-enable should reinitialize GPU buffers");
  await desktop.locator("#cameraMode").selectOption("cockpit");
  const glOk=await gpuSignature(desktop);
  assert.ok(glOk&&glOk.colors>5);
 }
 // Simulate a GPU context-loss event where the Chromium test driver
 // exposes it. The original 2D canvas must remain available immediately.
 if(supports){
  const lost=await desktop.evaluate(()=>{
   const gl=document.querySelector("#outsideView3D").getContext("webgl2");
   const extension=gl?.getExtension("WEBGL_lose_context");
   if(!extension)return false;
   extension.loseContext();return true;
  });
  if(lost){
   await desktop.waitForFunction(()=>!document.querySelector(".scene-shell")
    .classList.contains("three-dimensional"),null,{timeout:3500});
   assert.equal(await desktop.locator("#outsideView3D").isVisible(),false);
   assert.equal(await desktop.locator("#outsideView").isVisible(),true);
   assert.match(await desktop.locator("#visualStatus").textContent(),/2D/i);
   assert.equal(await desktop.locator("#visualStatus").getAttribute("data-status"),"fallback",
    "regardless of async context-loss event timing, a user must see the active fallback state");
   assert.equal(await desktop.locator("#cameraMode").isEnabled(),true,"outside aircraft chase works in 2D fallback");
  }
 }
 assert.deepEqual(errors,[]);
 await desktop.close();

 // A phone browser with WebGL explicitly denied must remain fully usable.
 const fallback=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 fallback.on("pageerror",e=>errors.push("fallback "+e.message));
 await fallback.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
   if(this.id==="outsideView3D"&&kind==="webgl2")return null;
   return original.call(this,kind,...args);
  };
 });
 await fallback.goto(url,{waitUntil:"load"});
 assert.equal(await fallback.locator("#visualMode").inputValue(),"3d");
 assert.equal(await fallback.locator("#outsideView3D").isVisible(),false);
 assert.match(await fallback.locator("#visualStatus").textContent(),/2D scenery/);
 assert.equal(await fallback.locator("#cameraMode").isEnabled(),true,"outside aircraft remains viewable without WebGL on Android");
 assert.ok(await fallback.locator("#outsideView").isVisible());
 assert.ok(await fallback.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 await fallback.locator("#typeStick").tap();
 await fallback.locator("#startApproach").tap();
 assert.equal(await fallback.locator("#flightPhase").textContent(),"FINAL APPROACH");
 assert.ok(Number(await fallback.locator("#readAlt").textContent())>75);
 await fallback.waitForTimeout(650);
 const pixels=await fallback.evaluate(()=>{
  const canvas=document.querySelector("#outsideView"),ctx=canvas.getContext("2d");
  const p=ctx.getImageData(300,140,180,150).data;
  let signature=0;for(let i=0;i<p.length;i+=103)signature=(signature*31+p[i])>>>0;
  return signature;
 });
 assert.notEqual(pixels,0,"2D fallback must actually paint canvas pixels");
 await fallback.locator("#visualMode").selectOption("2d");
 assert.match(await fallback.locator("#visualStatus").textContent(),/Lightweight 2D selected/);
 await fallback.locator("#visualMode").selectOption("3d");
 assert.equal(await fallback.locator("#cockpitFrame").getAttribute("data-view"),"cockpit");
 assert.match(await fallback.locator("#visualStatus").textContent(),/Automatically using 2D/);
 assert.ok(await fallback.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[]);
 await fallback.close();

 // 390px touch screens with WebGL2 retain the original two-thumb layout.
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone "+e.message));
 await phone.goto(url,{waitUntil:"load"});
 const on3D=await phone.locator("#outsideView3D").isVisible();
 if(await gpuSupported(phone)){
  assert.equal(on3D,true);
  await phone.locator("#cameraMode").selectOption("chase");
  await phone.waitForTimeout(350);
  const sig=await gpuSignature(phone);
  assert.ok(sig&&sig.colors>5);
  assert.ok(sig.width<=960&&sig.height<=540,"GPU render-size budget protects phone");
 }
 await phone.locator("#controlPad").scrollIntoViewIfNeeded();
 assert.equal(await phone.locator(".scene-shell").evaluate(el=>getComputedStyle(el).position),"sticky","only the shallow windscreen sticks within the cockpit");
 assert.equal(await phone.locator("#controlPad").evaluate(el=>!!el.closest("#cockpitStation")),true);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.ok(await phone.locator("#rightRudder").isVisible());
 await phone.locator("#visualMode").selectOption("2d");
 assert.ok(await phone.locator("#outsideView").isVisible());
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[]);
 await phone.close();
 console.log("WebGL2 browser passed: genuine GPU scene and moving chase camera when supported; explicit mode switching, 2D fallback, rejected WebGL and 390px phone layout.");
}finally{await browser.close();}
