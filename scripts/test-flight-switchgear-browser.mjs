import assert from "node:assert/strict";
import {chromium} from "playwright";
import path from "node:path";
import {pathToFileURL} from "node:url";

const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
try{
 const desktop=await browser.newPage({viewport:{width:1200,height:900}});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 const panel=desktop.locator("#cockpitSwitchPanel");
 assert.ok(await panel.isVisible());
 assert.equal(await desktop.locator(".cockpit-switch").count(),4);
 for(const [button,source,after,again] of [
  ["view","cameraMode","chase","side"],
  ["graphics","visualMode","2d","3d"],
  ["frame","cockpitFrameToggle","off","on"]
 ]){
  await desktop.locator("#cockpitSwitch_"+button).click();
  assert.equal(await desktop.locator("#"+source).inputValue(),after,button+" uses real selector");
  await desktop.locator("#cockpitSwitch_"+button).click();
  assert.equal(await desktop.locator("#"+source).inputValue(),again,button+" cycles back");
 }
 await desktop.locator("#cockpitSwitch_view").click();
 assert.equal(await desktop.locator("#cameraMode").inputValue(),"top","VIEW cycles to overhead inspection");
 await desktop.locator("#cockpitSwitch_view").click();
 assert.equal(await desktop.locator("#cameraMode").inputValue(),"cockpit","VIEW returns to pilot after four positions");
 for(const value of ["golden","dusk","day"]){
  await desktop.locator("#cockpitSwitch_light").click();
  assert.equal(await desktop.locator("#lightingMode").inputValue(),value);
 }
 await desktop.locator("#lightingMode").selectOption("dusk");
 assert.equal(await desktop.locator("#cockpitSwitch_light .cockpit-switch-value").textContent(),"DUSK",
  "underlying scenery option updates physical switch");
 await desktop.locator("#lightingMode").selectOption("day");
 await desktop.locator("#startApproach").click();
 await desktop.waitForTimeout(400);
 assert.ok(Number((await desktop.locator("#cockpitIndicatorSpeed").textContent()).replace(" KT",""))>40,
  "airspeed lamp tracks running flight");
 assert.equal(await desktop.locator("#cockpitIndicatorFlap").textContent(),
  await desktop.locator("#flaps").inputValue()+"°");
 assert.equal(await desktop.locator("#cockpitIndicatorPower").textContent(),
  await desktop.locator("#power").inputValue()+"%");
 assert.equal(await desktop.locator("#cockpitVisualPanel .cockpit-gauge").count(),8,
  "new switches keep realistic analog panel");
 assert.equal(await desktop.locator("#controlPad").evaluate(e=>e.closest("#cockpitMain")!==null),true);
 await desktop.locator("#cockpitAircraftSelect").selectOption("r44");
 assert.equal(await desktop.locator("#cockpitIndicatorFlap").evaluate(e=>e.parentElement.hidden),true,
  "no flap annunciator on helicopter");
 assert.equal(await desktop.locator("#cockpitIndicatorPower").textContent(),
  await desktop.locator("#collective").inputValue()+"%");
 await desktop.locator("#cockpitAircraftSelect").selectOption("f35");
 assert.equal(await desktop.locator("#cockpitVisualPanel .cockpit-mfd").count(),3);
 assert.equal(await panel.isVisible(),true);
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 phone.on("pageerror",e=>errors.push("phone "+e.message));
 await phone.goto(url,{waitUntil:"load"});
 assert.ok(await phone.locator("#cockpitSwitchPanel").isVisible());
 const before=await phone.locator("#controlPad").boundingBox();
 await phone.locator("#cockpitSwitch_light").tap();
 assert.equal(await phone.locator("#lightingMode").inputValue(),"golden");
 const after=await phone.locator("#controlPad").boundingBox();
 assert.equal(after.height,before.height,"cockpit switch does not enlarge touch flight controls");
 const layout=()=>phone.evaluate(()=>{
  const $=s=>document.querySelector(s);
  const rect=s=>{const r=$(s).getBoundingClientRect();
   return {x:r.x,y:r.y,w:r.width,h:r.height,left:r.left,right:r.right,
    top:r.top,bottom:r.bottom};};
  const buttons=["view","graphics","light","frame"].map(id=>rect("#cockpitSwitch_"+id));
  return {airframe:$("#cockpitStation").dataset.airframe,
   photo:$("#cockpitStation").dataset.photoCockpit,
   switchParent:$("#cockpitSwitchPanel").parentElement.className,
   restartParent:$("#cockpitRestartDock").parentElement.className,
   rack:rect("#cockpitSwitchPanel"),buttons,
   throttle:rect("#powerPanel"),brake:rect("#brake"),
   restart:rect("#restartFlight"),yoke:rect("#controlPad"),
   rudder:rect("#leftRudder"),well:rect("#cockpitInstrumentWell"),
   lesson:$("#cockpitVisualPanel .r44-lesson-strip")?
    rect("#cockpitVisualPanel .r44-lesson-strip"):null,
   noOverflow:document.documentElement.scrollWidth<=innerWidth+2,
   grid:getComputedStyle($("#cockpitSwitchPanel .cockpit-switch-bank")).gridTemplateColumns};
 });
 const checkTwoByTwo=info=>{
  const [view,scene,light,frame]=info.buttons;
  assert.ok(Math.abs(view.top-scene.top)<5&&Math.abs(light.top-frame.top)<5,
   "VIEW/SCENE share the first row, LIGHT/FRAME the second");
  assert.ok(light.top>=view.bottom-3&&frame.top>=scene.bottom-3,
   "second row starts immediately beneath first row");
  assert.ok(scene.left>=view.right-3&&frame.left>=light.right-3,
   "two switch columns, not a single horizontal bar");
  assert.ok(info.rack.w<=99&&info.rack.h<=65,
   "compact 2 by 2 switches take little dashboard space");
 };
 const mobile=await layout();
 checkTwoByTwo(mobile);
 assert.equal(mobile.switchParent,"side-controls",
  "C172 switches live between NAV instruments and throttle, not below gauges");
 assert.ok(mobile.rack.bottom<=mobile.throttle.top+5,
  "C172 switch rack is directly above throttle");
 assert.ok(mobile.restart.bottom<=mobile.brake.top+8,
  "C172 restart is directly above wheel brake");
 assert.ok(mobile.rudder.top>=mobile.yoke.bottom-12);
 assert.ok(mobile.noOverflow,"C172 portrait cockpit must not overflow horizontally");
 await phone.setViewportSize({width:844,height:390});
 await phone.waitForTimeout(120);
 const wide=await layout();
 checkTwoByTwo(wide);
 assert.equal(wide.switchParent,"side-controls");
 assert.ok(wide.rack.left>=wide.well.left+wide.well.w*.65,
  "C172 rack is to the right of the analogue dials and below NAV");
 const rackThrottleSeparated=wide.rack.bottom<=wide.throttle.top+4||
  wide.rack.top>=wide.throttle.bottom-4||
  wide.rack.right<=wide.throttle.left+4||
  wide.rack.left>=wide.throttle.right-4;
 assert.ok(rackThrottleSeparated,
  "C172 switches must not cover the throttle in approved landscape cockpit");
 assert.ok(wide.restart.bottom<=wide.brake.top+8,
  "Restart stays directly above the brake after rotating phone");
 assert.ok(wide.rack.right<=844&&wide.restart.bottom<=390,
  "all four switches and Restart remain on-screen");
 assert.equal(await phone.locator("#cockpitStation").getAttribute("data-orientation"),"landscape");
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  "rotated cockpit switches don't introduce horizontal scroll");
 await phone.locator("#cockpitAircraftSelect").selectOption("r44");
 assert.equal(await phone.locator("#cockpitFrameToggle").inputValue(),"on");
 const rotor=await layout();
 console.log("R44 SWITCHGEAR ACTUAL "+JSON.stringify(rotor));
 checkTwoByTwo(rotor);
 assert.match(rotor.switchParent,/control-panel/,
  "approved R44 switches live next to cyclic, outside gauges");
 assert.ok(rotor.rack.left>=rotor.yoke.left+rotor.yoke.w*.60,
  "R44 switches stay to the right of the cyclic");
 assert.ok(rotor.rack.right<=844&&rotor.rack.top>=0,
  "R44 switch rack remains visible in landscape");
 assert.ok(rotor.rack.bottom<=rotor.rudder.top+8,
  "R44 switch rack does not cover the anti-torque pedals");
 assert.equal(rotor.restartParent,"side-controls",
  "R44 Restart stays beside collective");
 await phone.locator("#cockpitAircraftSelect").selectOption("c172");
 await phone.locator("#cockpitSwitch_frame").tap();
 assert.equal(await phone.locator("#cockpitFrameToggle").inputValue(),"off");
 await phone.locator("#cockpitVisualPanel .cockpit-gauge").first().tap({position:{x:38,y:42}});
 assert.equal(await phone.locator("#cockpitZoomPanel").isVisible(),true,
  "only instruments continue to enlarge");
 await phone.locator("#cockpitZoomClose").tap();
 // Both aircraft must retain a single functional Restart button after
 // physical relocation. The button actually resets the selected aircraft,
 // not just a decorative icon in the flight console.
 assert.equal(await phone.locator("#restartFlight").count(),1);
 await phone.locator("#restartFlight").tap();
 assert.match(await phone.locator("#cockpitRestartStatus").textContent(),/Flight restarted/,
  "moving Restart above the wheel brake preserves its original action");
 assert.equal(await phone.locator("#cockpitAircraftSelect").inputValue(),"c172",
  "restarting a C172 does not change the selected airframe");
 // Rotate back to portrait and change to R44: switches must relocate
 // within its narrow pedestal without spilling off the handset.
 await phone.setViewportSize({width:390,height:844});
 await phone.locator("#cockpitFrameToggle").selectOption("on");
 await phone.locator("#cockpitAircraftSelect").selectOption("r44");
 const rotorPortrait=await layout();
 checkTwoByTwo(rotorPortrait);
 assert.equal(rotorPortrait.airframe,"r44");
 assert.equal(rotorPortrait.restartParent,"side-controls");
 assert.ok(rotorPortrait.noOverflow&&rotorPortrait.rack.left>=0&&
  rotorPortrait.rack.right<=390&&rotorPortrait.rack.top>=rotorPortrait.well.top,
  "R44 portrait view retains the adjacent 2×2 switches entirely on-screen");
 assert.ok(rotorPortrait.restart.w>40&&rotorPortrait.yoke.w>70&&rotorPortrait.rudder.w>20,
  "R44 collective-side Restart, cyclic and pedals remain genuine touch targets");
 const rotorBefore=await phone.locator("#lightingMode").inputValue();
 await phone.locator("#cockpitSwitch_light").tap();
 assert.notEqual(await phone.locator("#lightingMode").inputValue(),rotorBefore,
  "R44 portrait LIGHT rack is interactive, not an inert ornament");
 const liveMultiTouch=await phone.evaluate(()=>{
  const cyclic=document.querySelector("#controlPad"),
   pedal=document.querySelector("#rightRudder"),
   view=document.querySelector("#cockpitSwitch_view"),
   cam=document.querySelector("#cameraMode");
  const create=(target,id,fraction)=>{
   const b=target.getBoundingClientRect(),x=b.left+b.width*fraction,y=b.top+b.height*.5;
   return new Touch({identifier:id,target,clientX:x,clientY:y,
    pageX:x+scrollX,pageY:y+scrollY,screenX:x,screenY:y});
  };
  const a=create(cyclic,801,.85),b=create(pedal,802,.5),c=create(view,803,.5);
  const send=(target,type,changed,all)=>target.dispatchEvent(new TouchEvent(type,{
   bubbles:true,cancelable:true,changedTouches:changed,
   touches:all,targetTouches:all.filter(x=>x.target===target)
  }));
  send(cyclic,"touchstart",[a],[a]);
  send(pedal,"touchstart",[b],[a,b]);
  const held={bank:document.querySelector("#cmdBank").textContent,
   rudder:document.querySelector("#cmdRudder").textContent,view:cam.value};
  send(view,"touchstart",[c],[a,b,c]);
  const switched={bank:document.querySelector("#cmdBank").textContent,
   rudder:document.querySelector("#cmdRudder").textContent,view:cam.value};
  send(view,"touchend",[c],[a,b]);send(pedal,"touchend",[b],[a]);
  send(cyclic,"touchend",[a],[]);
  const released=document.querySelector("#cmdBank").textContent;
  cam.value="cockpit";cam.dispatchEvent(new Event("change",{bubbles:true}));
  return {held,switched,released};
 });
 assert.ok(parseInt(liveMultiTouch.held.bank)>40&&
  Math.abs(Number(liveMultiTouch.held.rudder.match(/-?\d+/)?.[0]||0))>10,
  "two fingers simultaneously operate the actual R44 cyclic and anti-torque pedal: "+JSON.stringify(liveMultiTouch));
 assert.notEqual(liveMultiTouch.switched.view,liveMultiTouch.held.view,
  "a third finger changes the R44 camera without releasing flight controls");
 assert.equal(liveMultiTouch.switched.bank,liveMultiTouch.held.bank,
  "VIEW interaction must not jerk the held R44 cyclic");
 assert.match(liveMultiTouch.released,/0%/);
 await phone.locator("#restartFlight").tap();
 assert.match(await phone.locator("#cockpitRestartStatus").textContent(),/Flight restarted/,
  "R44 Restart remains operational beside the collective");
 assert.deepEqual(errors,[]);
 console.log("Physical cockpit switchgear passed on desktop, phone portrait and landscape.");
}finally{await browser.close();}
