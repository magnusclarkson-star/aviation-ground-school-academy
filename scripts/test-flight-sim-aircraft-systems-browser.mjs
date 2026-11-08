import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const browser=await chromium.launch({headless:true,args:[
 "--no-sandbox","--enable-webgl","--use-gl=angle","--use-angle=swiftshader-webgl",
 "--enable-unsafe-swiftshader"
]});
const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const errors=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));

async function isolated3DAnimation(page){
 return page.evaluate(()=>{
  const existing=document.getElementById("outsideView3D")?.getContext("webgl2");
  if(!existing||existing.isContextLost())return {supported:false};
  const canvas=document.createElement("canvas");
  canvas.width=380;canvas.height=224;
  canvas.style.cssText="position:absolute;left:-1500px;top:0;width:380px;height:224px";
  document.body.appendChild(canvas);
  const renderer=window.AGSAFlight3D.createRenderer(canvas);
  if(!renderer){canvas.remove();return {supported:false};}
  const state=window.AGSAImmersiveFlight.makeState("helicopter");
  state.altitudeM=4;state.onGround=false;
  const gl=canvas.getContext("webgl2");
  const signature=()=>{
   const pixels=new Uint8Array(canvas.width*canvas.height*4);
   gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   let hash=2166136261>>>0;
   for(let i=0;i<pixels.length;i+=17)hash=Math.imul(hash^pixels[i],16777619)>>>0;
   return hash;
  };
  renderer.draw(state,{view:"chase",animation:{mainRotor:0,tailRotor:0}});
  const first=signature();
  renderer.draw(state,{view:"chase",animation:{mainRotor:.88,tailRotor:1.2}});
  const second=signature();
  renderer.destroy();canvas.remove();
  return {supported:true,first,second};
 });
}
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 page.on("pageerror",err=>errors.push("desktop "+err.message));
 await page.goto(url,{waitUntil:"load"});
 assert.equal(await page.locator("#systemsEngineLabel").textContent(),"ENGINE MOTION · SIM");
 assert.equal(await page.locator("#systemsEngineValue").textContent(),"10%");
 assert.equal(await page.locator("#systemsPowerValue").textContent(),"0%");
 assert.equal(await page.locator("#systemsFlapValue").textContent(),"10°");
 assert.equal(await page.locator("#systemsMotionLabel").textContent(),"PROPELLER / CONTROL SURFACES");
 assert.ok(await page.locator("#outsideView").isVisible());

 await page.locator("#flaps").selectOption("30");
 await page.waitForTimeout(110);
 assert.equal(await page.locator("#systemsFlapValue").textContent(),"30°",
  "flap lever and animated illustrated flaps must receive the same command");
 await page.locator("#power").evaluate(el=>{
  el.value="95";el.dispatchEvent(new Event("input",{bubbles:true}));
 });
 await page.waitForTimeout(550);
 assert.equal(await page.locator("#systemsPowerValue").textContent(),"95%");
 assert.ok(parseInt(await page.locator("#systemsEngineValue").textContent())>25,
  "fictional engine motion must increase after throttle adjustment");
 const moving=await page.evaluate(()=>{
  const a=window.AGSAFlightSystems,model=window.AGSAImmersiveFlight;
  const state=model.makeState("airplane"),input=model.makeInput();
  input.bank=.7;input.pitch=-.4;input.rudder=.5;input.flaps=20;
  const system=a.create("airplane");
  a.step(system,state,input,.05);
  return {
   names:window.AGSAFlight3D.buildMovingParts("airplane").map(p=>p.name),
   port:system.parts.leftAileron,starboard:system.parts.rightAileron,
   rudder:system.parts.rudder,flaps:system.parts.leftFlap
  };
 });
 assert.equal(moving.names.length,8);
 assert.ok(moving.port<0&&moving.starboard>0);
 assert.ok(moving.rudder>0&&moving.flaps<0);

 await page.locator("#typeCyclic").click();
 await page.waitForTimeout(130);
 assert.equal(await page.locator("#systemsEngineLabel").textContent(),"ROTOR SPEED · SIM");
 assert.equal(await page.locator("#systemsPowerLabel").textContent(),"COLLECTIVE · SIM");
 assert.equal(await page.locator("#systemsMotionLabel").textContent(),"MAIN / TAIL ROTORS");
 assert.equal(await page.locator("#systemsPowerValue").textContent(),"48%");
 assert.match(await page.locator("#systemsFlapLabel").textContent(),/BLADE PITCH/);
 await page.locator("#collective").evaluate(el=>{
  el.value="82";el.dispatchEvent(new Event("input",{bubbles:true}));
 });
 await page.waitForTimeout(250);
 assert.equal(await page.locator("#systemsPowerValue").textContent(),"82%");
 assert.notEqual(await page.locator("#systemsFlapValue").textContent(),"0%");
 const gpu=await isolated3DAnimation(page);
 if(gpu.supported){
  assert.notEqual(gpu.first,gpu.second,
   "the rotor meshes must really move on the GPU when the blade angles change");
 }
 assert.deepEqual(errors,[]);
 await page.close();

 // A phone where 3D has been blocked must still receive the animated-system
 // control values, simulated readings, and full two-thumb handling in 2D.
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",err=>errors.push("phone "+err.message));
 await phone.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
   if(this.id==="outsideView3D"&&type==="webgl2")return null;
   return original.call(this,type,...args);
  };
 });
 await phone.goto(url,{waitUntil:"load"});
 assert.equal(await phone.locator("#outsideView3D").isVisible(),false);
 assert.ok(await phone.locator("#outsideView").isVisible());
 assert.ok(await phone.locator(".aircraft-systems-strip").isVisible());
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 await phone.locator("#flaps").selectOption("20");
 await phone.waitForTimeout(170);
 assert.equal(await phone.locator("#systemsFlapValue").textContent(),"20°");
 await phone.locator("#typeCyclic").tap();
 await phone.waitForTimeout(150);
 assert.equal(await phone.locator("#systemsPowerValue").textContent(),"48%");
 assert.ok(await phone.locator("#controlPad").isVisible());
 assert.ok(await phone.locator("#rightRudder").isVisible());
 await phone.locator("#instrumentToggle").tap();
 assert.equal(await phone.locator("#miniAttitude").isVisible(),false);
 assert.equal(await phone.locator("#systemsMotionLabel").textContent(),"MAIN / TAIL ROTORS");
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[]);
 await phone.close();
 console.log("Aircraft systems browser passed: throttle/engine motion, flap detents, gyro control surfaces, rotor/collective, GPU-moving rotor geometry and 390px no-GPU fallback.");
}finally{await browser.close();}
