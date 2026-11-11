import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const errors=[];
async function screenshotSignature(page){
 return page.evaluate(()=>{
  const detailed=document.querySelector("#outsideView3D");
  let pixels;
  if(!detailed.hidden){
   const gl=detailed.getContext("webgl2");
   pixels=new Uint8Array(detailed.width*detailed.height*4);
   gl.readPixels(0,0,detailed.width,detailed.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  }else{
   const canvas=document.querySelector("#outsideView");
   pixels=canvas.getContext("2d").getImageData(0,0,canvas.width,canvas.height).data;
  }
  let hash=2166136261>>>0;
  for(let i=0;i<pixels.length;i+=317){hash=Math.imul(hash^pixels[i],16777619)>>>0;}
  return hash;
 });
}
async function setRange(page,id,value){
 await page.locator(id).evaluate((node,n)=>{node.value=String(n);node.dispatchEvent(new Event("input",{bubbles:true}));},value);
}
const point=async(page,selector,x=.5,y=.5)=>{
 const box=await page.locator(selector).boundingBox();
 assert.ok(box&&box.width>45&&box.height>35,selector+" must be usable");
 return {x:Math.round(box.x+box.width*x),y:Math.round(box.y+box.height*y)};
};
try{
 const desktop=await browser.newPage({viewport:{width:1240,height:900}});
 desktop.on("pageerror",err=>errors.push("desktop: "+err.message));
 await desktop.addInitScript(()=>{
  window.__hapticCalls=[];
  Object.defineProperty(navigator,"vibrate",{configurable:true,value:pattern=>{
   window.__hapticCalls.push(pattern);return true;
  }});
 });
 await desktop.goto(url,{waitUntil:"load"});
 // A slow Android phone should not render both complete worlds every frame.
 // Probe the actual Canvas draw path while WebGL is active, then exercise the
 // user-visible 2D fallback and a return to 3D in the same page session.
 const sceneRenderBudget=await desktop.evaluate(async()=>{
  const S=window.AGSAFlightScenery;
  const canvas3D=document.querySelector("#outsideView3D");
  const select=document.querySelector("#visualMode");
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const setMode=mode=>{
   select.value=mode;
   select.dispatchEvent(new Event("change",{bubbles:true}));
  };
  let draws=0;
  const original=S.draw;
  S.draw=(...args)=>{draws++;return original(...args)};
  try{
   const gpuInitially=!canvas3D.hidden;
   await wait(440);
   const gpuRemainedActive=!canvas3D.hidden;
   const hiddenCanvasDraws=draws;
   draws=0;
   setMode("2d");
   await wait(300);
   const active2dDraws=draws;
   const manuallySelected2d=canvas3D.hidden;
   draws=0;
   setMode("3d");
   await wait(520);
   const gpuRestored=!canvas3D.hidden;
   const restored2dDraws=draws;
   return {gpuInitially,gpuRemainedActive,hiddenCanvasDraws,
    manuallySelected2d,active2dDraws,gpuRestored,restored2dDraws};
  }finally{
   S.draw=original;
  }
 });
 if(sceneRenderBudget.gpuInitially&&sceneRenderBudget.gpuRemainedActive)
  assert.equal(sceneRenderBudget.hiddenCanvasDraws,0,
   "WebGL active: never waste CPU repainting a hidden full-resolution 2D canvas");
 // C172/R44 retain their approved detailed mesh under the outside 2D
 // selection when WebGL is available. Unsupported devices keep Canvas.
 if(sceneRenderBudget.gpuInitially){
  assert.equal(sceneRenderBudget.manuallySelected2d,false,
   "approved C172/R44 exterior replaces old Canvas model in 2D selection");
  assert.equal(sceneRenderBudget.active2dDraws,0,
   "detailed aircraft mode does not repaint unseen Canvas");
 }else{
  assert.equal(sceneRenderBudget.manuallySelected2d,true);
  assert.ok(sceneRenderBudget.active2dDraws>=2,
   "unsupported GPU continues rendering Canvas fallback");
 }
 if(sceneRenderBudget.gpuRestored)assert.equal(sceneRenderBudget.restored2dDraws,0,
  "switching back to 3D must again stop redundant Canvas rendering");
 else assert.ok(sceneRenderBudget.restored2dDraws>=1,
  "unsupported 3D must continue drawing the 2D fallback");

 assert.match(await desktop.title(),/Immersive Airfield/);
 assert.equal(await desktop.locator("#typeYoke").getAttribute("aria-pressed"),"true");
 assert.equal(await desktop.locator("#cockpitFrameToggle").inputValue(),"on");
 assert.equal(await desktop.locator("#cockpitFrame").getAttribute("data-aircraft"),"airplane");
 assert.equal(await desktop.locator("#cockpitFrame").getAttribute("data-view"),"cockpit");
 assert.equal(await desktop.locator("#c172ScenePanel").isVisible(),true,
  "the C172 forward pilot view includes its own physical-looking instrument panel");
 assert.equal(await desktop.locator('[data-c172-scene-value="heading"]').textContent(),"000");
 assert.equal(await desktop.locator("#c172ScenePanel").evaluate(e=>getComputedStyle(e).pointerEvents),"none",
  "pilot-panel repeater must not block controls or the camera switch");
 assert.equal(await desktop.locator(".scene-bottom").isVisible(),false,
  "scene footer must not overlap the in-windscreen C172 gauges");
 await desktop.locator("#cameraMode").selectOption("chase");
 assert.equal(await desktop.locator("#c172ScenePanel").isVisible(),false,
  "outside chase camera does not accidentally show the C172 cockpit panel");
 await desktop.locator("#cameraMode").selectOption("cockpit");
 assert.equal(await desktop.locator("#c172ScenePanel").isVisible(),true);
  await desktop.locator("#cockpitFrameToggle").selectOption("off");
 assert.equal(await desktop.locator("#cockpitFrame").getAttribute("data-enabled"),"off");
 assert.equal(await desktop.locator("#c172ScenePanel").isVisible(),false,
  "FRAME off provides unobstructed forward scenery");
 await desktop.locator("#cockpitFrameToggle").selectOption("on");
 assert.equal(await desktop.locator("#cockpitFrame").getAttribute("data-enabled"),"on");
 assert.equal(await desktop.locator("#cockpitFrame").evaluate(e=>getComputedStyle(e).pointerEvents),"none");
 assert.equal(await desktop.locator(".hardware-yoke").isVisible(),true);
 assert.equal(await desktop.locator(".hardware-stick").isVisible(),false);
 assert.equal(await desktop.locator("#hapticsToggle").getAttribute("aria-pressed"),"false");
 assert.equal(await desktop.evaluate(()=>window.__hapticCalls.length),0,"vibration must be off by default");
 assert.ok(await desktop.locator("#miniAttitude").isVisible(),"graphic attitude indicator is visible by default");
 assert.equal(await desktop.locator("#pfdHeading").textContent(),"000°");
 assert.equal(await desktop.locator("#pfdSpeed").textContent(),await desktop.locator("#readSpeed").textContent());
 assert.match(await desktop.locator("#coachPhase").textContent(),/RUNWAY/);
 assert.ok(/^\d+ s$/.test(await desktop.locator("#coachElapsed").textContent()),"session elapsed is a whole-second indication");
 assert.equal(await desktop.locator("#offsetLabel").textContent(),"RUNWAY OFFSET");
 // Examine the active Canvas only: the 2D backup is deliberately frozen
 // while GPU scenery covers it. The learning model still moves normally.
 await desktop.locator("#visualMode").selectOption("2d");
 const first=await screenshotSignature(desktop);
 assert.ok(first>0);
 await desktop.locator("#startApproach").click();
 assert.match(await desktop.locator("#flightPhase").textContent(),/FINAL APPROACH/);
 assert.ok(parseInt(await desktop.locator('[data-c172-scene-value="alt"]').textContent())>250,
  "C172 miniature altimeter tracks the actual approach altitude in feet");
 assert.equal((await desktop.locator('[data-c172-scene-value="heading"]').textContent()).trim(),
  (await desktop.locator("#pfdHeading").textContent()).replace("°",""),
  "C172 mini heading agrees with the main flight instrument");
 assert.ok(Number(await desktop.locator("#readAlt").textContent())>75);
 assert.equal(await desktop.locator("#pfdAltitude").textContent(),await desktop.locator("#readAlt").textContent());
 assert.match(await desktop.locator("#coachPhase").textContent(),/SHORT FINAL/);
 await desktop.waitForTimeout(1100);
 const after=await screenshotSignature(desktop);
 assert.notEqual(after,first,"active outside aircraft view must redraw as the aircraft moves");
 await desktop.locator("#visualMode").selectOption("3d");
 await desktop.locator("#typeStick").click();
 assert.equal(await desktop.locator("#typeStick").getAttribute("aria-pressed"),"true");
 assert.equal(await desktop.locator(".hardware-stick").isVisible(),true);
 assert.equal(await desktop.locator(".hardware-yoke").isVisible(),false);
 await desktop.locator("#controlPad").scrollIntoViewIfNeeded();
 const oldHorizon=await desktop.locator("#pfdHorizonMotion").getAttribute("transform");
 const p=await point(desktop,"#controlPad",.8,.25);
 await desktop.mouse.move(p.x,p.y);
 await desktop.mouse.down();
 await desktop.waitForTimeout(350);
 assert.match(await desktop.locator("#cmdBank").textContent(),/\+[1-9]\d*%/);
 assert.match(await desktop.locator("#cmdPitch").textContent(),/\+[1-9]\d*%/);
 const newHorizon=await desktop.locator("#pfdHorizonMotion").getAttribute("transform");
 assert.notEqual(newHorizon,oldHorizon,"pitch and bank must physically move the same live graphical horizon");
 assert.match(newHorizon,/rotate\(-/,"right bank must tilt synthetic horizon left");
 assert.match(await desktop.locator("#pfdAttitude").textContent(),/PITCH/);
 await desktop.mouse.up();
 assert.equal(await desktop.locator("#cmdBank").textContent(),"+0%");
 assert.equal(await desktop.locator("#cmdPitch").textContent(),"+0%");
 await desktop.locator("#instrumentToggle").click();
 assert.equal(await desktop.locator("#miniAttitude").isVisible(),false,"optional compact layout hides only graphic instruments");
 assert.ok(await desktop.locator("#readSpeed").isVisible(),"numeric flight readings remain visible");
 assert.equal(await desktop.locator("#instrumentToggle").getAttribute("aria-pressed"),"false");
 await desktop.locator("#instrumentToggle").click();
 assert.equal(await desktop.locator("#miniAttitude").isVisible(),true);
 await desktop.locator("#hapticsToggle").click();
 assert.equal(await desktop.locator("#hapticsToggle").getAttribute("aria-pressed"),"true");
 assert.ok(await desktop.evaluate(()=>window.__hapticCalls.length)>=1,"opt-in should request a short cue");
 assert.ok(await desktop.evaluate(()=>window.__hapticCalls.every(x=>Array.isArray(x)&&x.reduce((a,b)=>a+b,0)<=200)));
 await desktop.locator("#hapticsToggle").click();
 assert.equal(await desktop.evaluate(()=>window.__hapticCalls.at(-1)),0,"turning off haptics must stop it");
 await desktop.locator("#typeCyclic").click();
 assert.equal(await desktop.locator(".hardware-cyclic").isVisible(),true);
 assert.equal(await desktop.locator("#collectivePanel").isVisible(),true);
 assert.equal(await desktop.locator("#powerPanel").isVisible(),false);
 assert.equal(await desktop.locator("#flapPanel").isVisible(),false);
 assert.equal(await desktop.locator("#startApproach").isDisabled(),true,"rotorcraft must not enter airplane approach");
 assert.equal(await desktop.locator("#offsetLabel").textContent(),"PAD OFFSET");
 const groundRefs=await desktop.evaluate(()=>{
  const H=window.AGSAHelipadDetail,S=window.AGSAFlightScenery,M=window.AGSAImmersiveFlight;
  const state=M.makeState("helicopter");
  Object.assign(state,{altitudeM:6,onGround:false,phase:"hover",headingDeg:30,time:5});
  const c=document.createElement("canvas");c.width=480;c.height=270;
  const sig=()=>{
   assertMarker();
   S.draw(c,state,{view:"cockpit",lighting:"day",reducedMotion:true});
   const pix=c.getContext("2d").getImageData(0,0,c.width,c.height).data;
   let hash=2166136261>>>0;
   for(let i=0;i<pix.length;i+=197)hash=Math.imul(hash^pix[i],16777619)>>>0;
   return hash;
  };
  function assertMarker(){
   if(!H||H.rings.length!==2||H.pylons.length!==6)throw Error("Shared heliport landmarks missing");
  }
  const marker=H.pylons[1],projected=S.project(state,marker.x,marker.height,marker.z,c.width,c.height);
  const first=sig();
  state.xM+=11;const drifting=sig();
  const move=S.project(state,marker.x,marker.height,marker.z,c.width,c.height);
  state.headingDeg=65;const turning=sig();
  return {first,drifting,turning,projected,move};
 });
 assert.ok(groundRefs.projected?.depth>0,"R44 reference marker projects ahead of helicopter");
 assert.ok(groundRefs.projected.x>0&&groundRefs.projected.x<480,
  "a coloured fixed-world marker is in the R44 outside-view field");
 assert.ok(groundRefs.move.x<groundRefs.projected.x,
  "actual lateral drift moves the fixed marker across the fallback scenery");
 assert.notEqual(groundRefs.first,groundRefs.drifting,
  "mobile 2D scene changes as helicopter moves sideways above helipad");
 assert.notEqual(groundRefs.drifting,groundRefs.turning,
  "mobile 2D scenery rotates past the helicopter in a pedal turn");
 assert.match(await desktop.locator("#coachPhase").textContent(),/ROTORCRAFT/);
 await setRange(desktop,"#collective",82);
 await desktop.waitForTimeout(4400);
 assert.ok(Number(await desktop.locator("#readAlt").textContent())>2,"collective creates fictional vertical lift");
 await setRange(desktop,"#collective",34);
 await desktop.waitForFunction(()=>/HELIPAD LANDED/.test(document.querySelector("#flightPhase").textContent),
  null,{timeout:20000});
 assert.match(await desktop.locator("#flightMessage").textContent(),/landing/i);
 assert.deepEqual(errors,[]);
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone: "+e.message));
 await phone.addInitScript(()=>{
  window.__hapticCalls=[];
  Object.defineProperty(navigator,"vibrate",{configurable:true,value:pattern=>{
   window.__hapticCalls.push(pattern);return true;
  }});
 });
 await phone.goto(url,{waitUntil:"load"});
 await phone.locator("#typeStick").tap();
 assert.ok(await phone.locator("#outsideView").isVisible());
 assert.ok(await phone.locator("#miniAttitude").isVisible(),"phone cockpit shows a graphic horizon");
 assert.equal(await phone.locator("#pfdSpeed").textContent(),await phone.locator("#readSpeed").textContent());
 assert.ok(await phone.locator("#coachGlance").isVisible(),"instruction panel remains available on phone");
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),"no phone horizontal overflow");
 await phone.locator("#rightRudder").scrollIntoViewIfNeeded();
 const pad=await phone.locator("#controlPad").boundingBox();
 const right=await phone.locator("#rightRudder").boundingBox();
 assert.ok(pad&&right);
 assert.ok(right.y>=pad.y+pad.height-12&&right.y-pad.y<280,"rudder pedals sit directly beneath the yoke");
 assert.ok(pad.y<844&&pad.y+pad.height>0&&right.y>=0&&right.y+right.height<=844,
  "both controls must fit the visible phone viewport");
 assert.equal(await phone.locator(".scene-shell").evaluate(el=>getComputedStyle(el).position),"sticky","shallow outside scene stays sticky without blocking aircraft choices");
 assert.equal(await phone.locator("#controlPad").evaluate(el=>!!el.closest("#cockpitStation")),true,"controls sit within instrument cockpit");
 await phone.locator("#hapticsToggle").tap();
 assert.equal(await phone.locator("#hapticsToggle").getAttribute("aria-pressed"),"true");
 await phone.locator("#rightRudder").scrollIntoViewIfNeeded();
 // A sticky outside-view panel can cover an otherwise in-viewport control.
 // Position the whole two-thumb row below it before dispatching real touches.
 await phone.evaluate(()=>{
  const view=document.querySelector(".scene-shell").getBoundingClientRect();
  const pad=document.querySelector("#controlPad").getBoundingClientRect();
  const overlap=view.bottom+8-pad.top;
  if(overlap>0)window.scrollBy(0,-overlap);
 });
 const finger1={...(await point(phone,"#controlPad",.77,.24)),id:21};
 const finger2={...(await point(phone,"#rightRudder")),id:22};
 const hit=await phone.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest("#controlPad"),finger1);
 assert.equal(hit,true,"control pad must actually receive touch at its marked point, not be hidden under sticky scenery");
 const cdp=await phone.context().newCDPSession(phone);
 try{
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[finger1]});
  await phone.waitForTimeout(180);
  assert.match(await phone.locator("#cmdBank").textContent(),/\+[1-9]\d*%/);
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[finger1,finger2]});
  await phone.waitForTimeout(600);
  assert.match(await phone.locator("#cmdBank").textContent(),/\+[1-9]\d*%/);
  assert.equal(await phone.locator("#cmdRudder").textContent(),"RUDDER 100%",
   "second touch should hold rudder while first finger steers");
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[finger2]});
  await phone.waitForTimeout(120);
  assert.equal(await phone.locator("#cmdRudder").textContent(),"RUDDER 0%");
  assert.match(await phone.locator("#cmdBank").textContent(),/\+[1-9]\d*%/,
   "lifting pedal finger must not release stick");
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await phone.waitForTimeout(130);
  assert.equal(await phone.locator("#cmdBank").textContent(),"+0%");
 }finally{await cdp.detach();}
 assert.ok(await phone.evaluate(()=>window.__hapticCalls.length)>=1);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2));
 await phone.locator("#startApproach").tap();
 assert.match(await phone.locator("#flightPhase").textContent(),/FINAL APPROACH/);
 assert.ok(Number(await phone.locator("#readAlt").textContent())>75);
 await phone.locator("#typeCyclic").tap();
 assert.equal(await phone.locator("#cockpitFrame").getAttribute("data-aircraft"),"helicopter");
 assert.equal(await phone.locator("#collectivePanel").isVisible(),true);
 assert.equal(await phone.locator("#offsetLabel").textContent(),"PAD OFFSET");
 await phone.locator("#instrumentToggle").tap();
 assert.equal(await phone.locator("#miniAttitude").isVisible(),false);
 assert.equal(await phone.locator("#readAlt").isVisible(),true);
 await phone.locator("#instrumentToggle").tap();
 assert.equal(await phone.locator("#miniAttitude").isVisible(),true);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2));
 assert.equal(await phone.locator("#startApproach").isDisabled(),true);
 assert.deepEqual(errors,[]);
 console.log("Immersive browser passed: moving runway canvas, airplane yoke/stick/approach, rotorcraft collective and helipad landing, opt-in haptics, two-finger phone controls and responsive layout.");
 await phone.close();
}finally{await browser.close();}
