import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
const readModel=async(page)=>page.locator(".scene-shell").getAttribute("data-airframe");
const shot=async(page,canvasId)=>page.locator(canvasId).evaluate(c=>c.toDataURL("image/png"));
const fallbackShot=async(page)=>page.evaluate(()=>{
 const canvas=document.getElementById("outsideView"),id=document.getElementById("cockpitAircraftSelect").value;
 const view=document.getElementById("cameraMode").value;
 window.AGSAFlightScenery.draw(canvas,{mode:id==="r44"?"helicopter":"airplane",
  headingDeg:0,pitchDeg:0,rollDeg:0,xM:0,zM:0,altitudeM:25,speedKt:0,groundSpeedKt:0},
  {view,airframeId:id});
 return canvas.toDataURL("image/png");
});
try{
 const desktop=await browser.newPage({viewport:{width:1200,height:900}});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 const positionLenses=await desktop.evaluate(()=>{
  const C=window.AGSAExteriorChase2D,T=window.AGSAFlight3D;
  const count=(mesh,rgb,side)=>{
   let matches=0;
   for(let i=0;i<mesh.positions.length;i+=3){
    if(Math.abs(mesh.colors[i]-rgb[0]/255)>.006||
       Math.abs(mesh.colors[i+1]-rgb[1]/255)>.006||
       Math.abs(mesh.colors[i+2]-rgb[2]/255)>.006)continue;
    if(side==="left"&&mesh.positions[i]<-.7)matches++;
    if(side==="right"&&mesh.positions[i]>.7)matches++;
    if(side==="aft"&&mesh.positions[i+2]<-3)matches++;
   }
   return matches;
  };
  return ["c172","r44","fa18","f22","f35","typhoon","su37"].map(id=>{
   const gpu=T.buildVehicle(id),fallback=C.getMesh(id);
   return {id,
    red:count(gpu,[235,56,48],"left"),green:count(gpu,[54,214,111],"right"),
    white:count(gpu,[236,241,226],"aft"),
    sameColors:gpu.colors.length===fallback.colors.length&&
     gpu.colors.every((x,i)=>x===fallback.colors[i])};
  });
 });
 for(const item of positionLenses){
  assert.ok(item.red>0&&item.green>0&&item.white>0,
   item.id+" position lights have correct left/right/aft placement");
  assert.equal(item.sameColors,true,
   item.id+" GPU and 2D fallback use the same position lens colours");
 }

 assert.equal(await readModel(desktop),"c172");
 assert.equal(await desktop.locator("#sceneAircraftType").textContent(),"Cessna 172");
 await desktop.locator("#pauseFlight").click();
 await desktop.locator("#cameraMode").selectOption("chase");
 assert.equal(await desktop.locator("#cockpitFrame").getAttribute("data-view"),"chase");
 const threeD=await desktop.locator("#outsideView3D").isVisible();
 if(threeD){
  const signatures=new Map();
  for(const [id,label] of [
   ["c172","Cessna 172"],["fa18","F/A-18 Super Hornet"],
   ["f22","F-22 Raptor"],["f35","F-35 Lightning II"],
   ["typhoon","Eurofighter Typhoon"],["su37","Su-37"],["r44","Robinson R44"]
  ]){
   await desktop.locator("#cockpitAircraftSelect").selectOption(id);
   await desktop.waitForTimeout(110);
   assert.equal(await readModel(desktop),id,"scene model follows selected cockpit: "+id);
   assert.equal(await desktop.locator("#sceneAircraftType").textContent(),label);
   assert.equal(await desktop.locator("#cockpitFrame").getAttribute("data-airframe"),id);
   const img=await shot(desktop,"#outsideView3D");
   assert.ok(img.length>900,id+" has actual 3D pixels");
   signatures.set(id,img);
  }
  assert.equal(new Set(signatures.values()).size,7,
   "all seven 3D chase images must differ, not the original single mock-up");
  await desktop.locator("#cameraMode").selectOption("side");
  assert.equal(await desktop.locator(".scene-shell").getAttribute("data-camera-view"),"side");
  const sideImage=await shot(desktop,"#outsideView3D");
  await desktop.locator("#cameraMode").selectOption("top");
  const topImage=await shot(desktop,"#outsideView3D");
  assert.notEqual(sideImage,topImage,"side and overhead inspection must show visibly different GPU viewpoints");
  assert.equal(await desktop.locator(".scene-shell").getAttribute("data-exterior-view"),"on");
  await desktop.locator("#cameraMode").selectOption("chase");
 }
 await desktop.locator("#visualMode").selectOption("2d");
 assert.equal(await desktop.locator("#outsideView3D").isVisible(),threeD,
   "approved R44 remains detailed in selected 2D camera on GPU-capable devices");
 assert.equal(await desktop.locator("#cameraMode").isEnabled(),true,
  "2D fallback still offers outside aircraft chase view");
 assert.equal(await desktop.locator("#cameraMode").inputValue(),"chase");
 const signatures2D=new Map();
 for(const id of ["c172","fa18","f22","f35","typhoon","su37","r44"]){
  await desktop.locator("#cockpitAircraftSelect").selectOption(id);
  await desktop.waitForTimeout(120);
  assert.equal(await readModel(desktop),id);
  signatures2D.set(id,await fallbackShot(desktop));
   if(threeD&&["c172","r44"].includes(id))
    assert.equal(await desktop.locator("#outsideView3D").isVisible(),true,
     "approved aircraft remains visible instead of old Canvas model");
 }
 assert.equal(new Set(signatures2D.values()).size,7,
  "all seven 2D exterior silhouettes must differ without WebGL");
 const rollingC172=await desktop.evaluate(()=>{
  const C=window.AGSAExteriorChase2D,
   canvas=document.createElement("canvas");
  canvas.width=760;canvas.height=490;
  const ctx=canvas.getContext("2d");
  const paint=(angle)=>{
   ctx.clearRect(0,0,760,490);
   C.paintInspection(ctx,{id:"c172",width:760,height:490,
    orbit:{azimuth:90,elevation:8,distance:20},
    animation:{mainWheels:angle,noseWheel:angle*(.35/.26)}});
   return canvas.toDataURL("image/png");
  };
  return {stopped:paint(0),rolling:paint(1.37),
   names:C.movingParts("c172").map(p=>p.name)};
 });
 assert.ok(rollingC172.names.includes("mainWheels")&&
  rollingC172.names.includes("noseWheel"));
 assert.notEqual(rollingC172.stopped,rollingC172.rolling,
  "speed-linked C172 wheel hubs must visibly rotate in the 2D 360 inspector");
 const rotatingR44=await desktop.evaluate(()=>{
  const canvas=document.createElement("canvas");
  canvas.width=760;canvas.height=490;
  const ctx=canvas.getContext("2d");
  const state={rollDeg:0,pitchDeg:0,altitudeM:80};
  const render=(angle,blur=0)=>{
   ctx.clearRect(0,0,760,490);
   window.AGSAExteriorChase2D.paint(ctx,state,{id:"r44",width:760,height:490,
    view:"top",animation:{mainRotor:angle,tailRotor:angle*3,rotorBlurOpacity:blur}});
   return canvas.toDataURL();
  };
  return {stopped:render(0),spinning:render(1.19),blurred:render(0,.16)};
 });
 assert.ok(rotatingR44.stopped.length>5000,"R44 overhead 2D image includes the main rotor");
 assert.notEqual(rotatingR44.stopped,rotatingR44.spinning,
  "rotating the main and tail rotor must visibly change fallback images");
  assert.notEqual(rotatingR44.stopped,rotatingR44.blurred,
   "R44 rotor sweep must appear in the 2D fallback even without GPU");
 const tailSweepImages=await desktop.evaluate(()=>{
  const canvas=document.createElement("canvas");
  canvas.width=760;canvas.height=490;
  const ctx=canvas.getContext("2d");
  const X=window.AGSAExteriorChase2D;
  const state={mode:"helicopter",rollDeg:0,pitchDeg:0,altitudeM:50,groundSpeedKt:0};
  const render=(view,opacity)=>{
   ctx.clearRect(0,0,760,490);
   if(view==="inspect")X.paintInspection(ctx,{id:"r44",width:760,height:490,
    orbit:{azimuth:90,elevation:5},animation:{mainRotor:.4,tailRotor:1.2,tailBlurOpacity:opacity}});
   else X.paint(ctx,state,{id:"r44",width:760,height:490,
    view:"side",animation:{mainRotor:.4,tailRotor:1.2,tailBlurOpacity:opacity}});
   return canvas.toDataURL();
  };
  return {sideStill:render("side",0),sideSpinning:render("side",.16),
   inspectStill:render("inspect",0),inspectSpinning:render("inspect",.16)};
 });
 assert.notEqual(tailSweepImages.sideStill,tailSweepImages.sideSpinning,
  "R44 tail-rotor motion disk must appear in Canvas side view");
 assert.notEqual(tailSweepImages.inspectStill,tailSweepImages.inspectSpinning,
  "R44 tail-rotor motion disk must appear in 360 inspection");
 const propellerImages=await desktop.evaluate(()=>{
  const canvas=document.createElement("canvas");
  canvas.width=740;canvas.height=450;
  const ctx=canvas.getContext("2d");
  const state={rollDeg:0,pitchDeg:0,altitudeM:30};
  const render=opacity=>{
   ctx.clearRect(0,0,740,450);
   window.AGSAExteriorChase2D.paint(ctx,state,{id:"c172",width:740,height:450,
    view:"chase",animation:{propeller:.72,propBlurOpacity:opacity}});
   return canvas.toDataURL();
  };
  return {normal:render(0),spinning:render(.13)};
 });
 assert.notEqual(propellerImages.normal,propellerImages.spinning,
  "Cessna two-blade propeller motion sweep is visible on non-WebGL phone fallback");
 // True bank and pitch must move the model's triangles in fallback mode,
 // including the rotorcraft blades, with shadows remaining on the ground.
 const outsideAttitude=await desktop.evaluate(()=>{
  const ctx=document.createElement("canvas").getContext("2d");
  ctx.canvas.width=800;ctx.canvas.height=490;
  const X=window.AGSAExteriorChase2D;
  const results={};
  for(const id of ["c172","r44","f35"]){
   results[id]={};
   const state={mode:id==="r44"?"helicopter":"airplane",
    rollDeg:0,pitchDeg:0,altitudeM:20,groundSpeedKt:45};
   const unchanged=JSON.stringify(state);
   const draw=(view,roll,pitch)=>{
    ctx.clearRect(0,0,800,490);
    X.paint(ctx,{...state,rollDeg:roll,pitchDeg:pitch},
     {id,view,width:800,height:490,animation:{mainRotor:.7,tailRotor:1.2,propeller:.8}});
    return ctx.canvas.toDataURL("image/png");
   };
   for(const view of ["chase","side","top"]){
    const level=draw(view,0,0),bank=draw(view,30,0),
     climb=draw(view,0,16);
    results[id][view]={level:level.length,banked:bank!==level,climbed:climb!==level};
   }
   results[id].immutable=JSON.stringify(state)===unchanged;
  }
  return results;
 });
 for(const id of ["c172","r44","f35"]){
  for(const view of ["chase","side","top"]){
   const result=outsideAttitude[id][view];
   assert.ok(result.level>1500,id+" "+view+" shows aircraft pixels");
   assert.equal(result.banked,true,id+" "+view+" visibly banks in fallback 2D");
   assert.equal(result.climbed,true,id+" "+view+" visibly pitches in fallback 2D");
  }
  assert.equal(outsideAttitude[id].immutable,true,
   "rendered rotations do not overwrite "+id+" flight state");
 }

 await desktop.locator("#cameraMode").selectOption("top");
 assert.equal(await desktop.locator(".scene-shell").getAttribute("data-camera-view"),"top");
 const topFallback=await fallbackShot(desktop);
 await desktop.locator("#cameraMode").selectOption("side");
 const sideFallback=await fallbackShot(desktop);
 assert.equal(topFallback,sideFallback,
  "Approved C172 Canvas fallback omits the old low-poly silhouette in both overhead and side views");
 assert.equal(await desktop.locator("#outsideView3D").isVisible(),true,
  "Approved aircraft continues to render with its detailed WebGL model when available");
 await desktop.locator("#cameraMode").selectOption("cockpit");
 assert.equal(await desktop.locator("#cockpitFrame").getAttribute("data-view"),"cockpit");
 const forward=await fallbackShot(desktop);
 await desktop.locator("#cameraMode").selectOption("chase");
 const outside=await fallbackShot(desktop);
 assert.notEqual(forward,outside,"2D pilot and chase cameras must differ");

 // Gallery and cockpit selector must both be authoritative.
 await desktop.locator("#cockpitAircraftPhotoButton").click();
 await desktop.locator('.aircraft-gallery-choice[data-aircraft-id="f22"]').click();
 assert.equal(await readModel(desktop),"f22");
 assert.equal(await desktop.locator("#sceneAircraftType").textContent(),"F-22 Raptor");
 await desktop.locator("#cockpitAircraftGalleryClose").click();
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone "+e.message));
 await phone.goto(url,{waitUntil:"load"});
 await phone.locator("#cockpitSwitch_view").tap();
 assert.equal(await phone.locator("#cameraMode").inputValue(),"chase");
 await phone.locator("#cockpitAircraftSelect").selectOption("r44");
 assert.equal(await readModel(phone),"r44");
 assert.equal(await phone.locator("#sceneAircraftType").textContent(),"Robinson R44");
 await phone.locator("#visualMode").selectOption("2d");
 assert.equal(await phone.locator("#cameraMode").isEnabled(),true);
 assert.equal(await phone.locator("#cameraMode").inputValue(),"chase");
 const rot=await fallbackShot(phone);
 await phone.locator("#cockpitAircraftSelect").selectOption("typhoon");
 assert.equal(await readModel(phone),"typhoon");
 const jet=await fallbackShot(phone);
 assert.notEqual(rot,jet,"phone 2D chase switches helicopter to Typhoon profile");
 assert.equal(await phone.locator("#cockpitAircraftSelect").inputValue(),"typhoon");
 // On Android-sized screens, the visible aircraft also controls the
 // simulated runway response; changing the picture alone is insufficient.
 await phone.locator("#startRunway").click();
 await phone.locator("#power").evaluate(el=>{
  el.value="100";el.dispatchEvent(new Event("input",{bubbles:true}));
 });
 await phone.waitForTimeout(1000);
 const jetSpeed=Number(await phone.locator("#readSpeed").textContent());
 assert.ok(jetSpeed>4,"selected Typhoon runway movement is live");
 await phone.locator("#cockpitAircraftSelect").selectOption("c172");
 await phone.locator("#startRunway").click();
 await phone.locator("#power").evaluate(el=>{
  el.value="100";el.dispatchEvent(new Event("input",{bubbles:true}));
 });
 await phone.waitForTimeout(1000);
 const trainerSpeed=Number(await phone.locator("#readSpeed").textContent());
 assert.ok(jetSpeed>trainerSpeed+3,
  "changing aircraft changes acceleration in the flight model, not only the outside picture");
 // Return to the previously selected model for the orientation checks.
 await phone.locator("#cockpitAircraftSelect").selectOption("typhoon");

 assert.equal(await phone.locator("#controlPad").isVisible(),true,"cockpit controls unaffected");
 assert.equal(await phone.locator("#cockpitZoomPanel").isVisible(),false,"instrument zoom unaffected");
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 await phone.setViewportSize({width:844,height:390});
 await phone.waitForTimeout(150);
 assert.equal(await readModel(phone),"typhoon");
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[],"no scene JS errors on desktop or Android-sized phone");
 console.log("Aircraft outside-view browser passed: seven distinct chase models, correct images on 2D fallback, model switching from gallery/cockpit and phone portrait/landscape.");
}finally{await browser.close();}
