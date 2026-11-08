import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
const changeRange=async(page,id,val)=>page.locator("#"+id).evaluate((el,value)=>{
 el.value=String(value);
 el.dispatchEvent(new Event("input",{bubbles:true}));
 el.dispatchEvent(new Event("change",{bubbles:true}));
},val);
try{
 const desktop=await browser.newPage({viewport:{width:1190,height:900}});
 desktop.on("pageerror",e=>errors.push("desktop: "+e.message));
 await desktop.addInitScript(()=>{
  window.__spokenPrompts=[];window.__voiceCancel=0;
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{
   speak(u){window.__spokenPrompts.push({text:u.text,lang:u.lang,rate:u.rate})},
   cancel(){window.__voiceCancel++}
  }});
  Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,
   value:class {constructor(text){this.text=text}}});
 });
 await desktop.goto(url,{waitUntil:"load"});
 assert.equal(await desktop.locator("#guidedExercisePanel").evaluate(el=>el.open),false);
 assert.equal(await desktop.locator("#exerciseLive").isVisible(),false);
 assert.equal(await desktop.locator("#physicsSelect").inputValue(),"classic");
 assert.equal(await desktop.evaluate(()=>window.__spokenPrompts.length),0,
  "narration must never play without the learner pressing Speak");
 await desktop.locator("#guidedExercisePanel summary").click();
 assert.equal(await desktop.locator("#exerciseStart").isVisible(),true);
 assert.equal(await desktop.locator("#exerciseStop").isDisabled(),true);
 assert.equal(await desktop.locator("#exerciseSelect option").count(),3);
 await desktop.locator("#exerciseStart").click();
 assert.equal(await desktop.locator("#physicsSelect").inputValue(),"aero");
 assert.equal(await desktop.locator("#windSelect").inputValue(),"calm");
 assert.equal(await desktop.locator("#profileSelect").inputValue(),"trainer");
 assert.equal(await desktop.locator("#readSpeed").textContent(),"0");
 assert.equal(await desktop.locator("#loadingMass").textContent(),"840 kg");
 assert.equal(await desktop.locator("#exerciseLive").isVisible(),true);
 assert.equal(await desktop.locator("#exerciseStep").textContent(),"Observation 1 of 3");
 assert.equal(await desktop.locator("#exerciseRecord").isVisible(),true);
 assert.match(await desktop.locator("#exerciseState").textContent(),/SME_REVIEW_REQUIRED/);
 assert.equal(await desktop.locator("#exerciseQuestionWrap").isVisible(),false);
 await desktop.locator("#exercisePath").selectOption("pilots");
 assert.match(await desktop.locator("#exerciseState").textContent(),/Pilot \/ enthusiast concepts/);
 await desktop.locator("#exerciseSpeak").click();
 const spoken=await desktop.evaluate(()=>window.__spokenPrompts);
 assert.equal(spoken.length,1);
 assert.equal(spoken[0].lang,"en-GB");
 assert.match(spoken[0].text,/Record|mass|CG|centre.of.gravity/i);
 assert.ok(spoken[0].text.length<=600);
 await desktop.locator("#exerciseStopVoice").click();
 assert.ok(await desktop.evaluate(()=>window.__voiceCancel)>0);

 await desktop.locator("#exerciseRecord").click();
 assert.equal(await desktop.locator("#exerciseStep").textContent(),"Observation 2 of 3");
 assert.equal(await desktop.locator("#exerciseRecord").isVisible(),false);
 await changeRange(desktop,"loadBaggage",35);
 assert.equal(await desktop.locator("#exerciseStep").textContent(),"Observation 2 of 3");
 await changeRange(desktop,"loadBaggage",40);
 await desktop.waitForFunction(()=>document.getElementById("exerciseStep").textContent==="Observation 3 of 3");
 assert.equal(await desktop.locator("#loadingMass").textContent(),"880 kg");
 assert.equal(await desktop.locator("#exerciseQuestionWrap").isVisible(),true);
 assert.match(await desktop.locator("#exerciseQuestion").textContent(),/centre of gravity aft/);
 await desktop.locator('#exerciseChoices input[value="c"]').check();
 await desktop.locator("#exerciseAnswer").click();
 assert.match(await desktop.locator("#exerciseFeedback").textContent(),/no grade is recorded/);
 assert.equal(await desktop.locator("#exerciseStep").textContent(),"Observation 3 of 3");
 await desktop.locator('#exerciseChoices input[value="a"]').check();
 await desktop.locator("#exerciseAnswer").click();
 assert.equal(await desktop.locator("#exerciseStep").textContent(),"Observation complete");
 assert.equal(await desktop.locator("#exerciseQuestionWrap").isVisible(),false);
 assert.match(await desktop.locator("#exerciseFeedback").textContent(),/not a graded assessment/);

 await desktop.locator("#exerciseSelect").selectOption("wind-track");
 await desktop.locator("#exerciseStart").click();
 assert.equal(await desktop.locator("#physicsSelect").inputValue(),"classic");
 assert.equal(await desktop.locator("#windSelect").inputValue(),"crosswind");
 assert.equal(await desktop.locator("#flightPhase").textContent(),"FINAL APPROACH");
 assert.equal(await desktop.locator("#exerciseStep").textContent(),"Observation 1 of 2");
 await desktop.waitForFunction(()=>document.getElementById("exerciseStep").textContent==="Observation 2 of 2",null,{timeout:7500});
 assert.equal(await desktop.locator("#exerciseQuestionWrap").isVisible(),true);
 assert.ok(Math.abs(Number(await desktop.locator("#readOffset").textContent()))>=5);
 await desktop.locator('#exerciseChoices input[value="a"]').check();
 await desktop.locator("#exerciseAnswer").click();
 assert.equal(await desktop.locator("#exerciseStep").textContent(),"Observation complete");

 await desktop.locator("#exerciseSelect").selectOption("energy-flaps");
 await desktop.locator("#exerciseStart").click();
 assert.equal(await desktop.locator("#physicsSelect").inputValue(),"aero");
 assert.equal(await desktop.locator("#windSelect").inputValue(),"calm");
 assert.equal(await desktop.locator("#flightPhase").textContent(),"FINAL APPROACH");
 assert.equal(await desktop.locator("#exerciseStep").textContent(),"Observation 1 of 2");
 await desktop.locator("#flaps").selectOption("30");
 await desktop.waitForFunction(()=>document.getElementById("exerciseStep").textContent==="Observation 2 of 2",null,{timeout:5000});
 assert.equal(await desktop.locator("#exerciseQuestionWrap").isVisible(),true);
 await desktop.locator("#windSelect").selectOption("headwind");
 await desktop.waitForFunction(()=>document.getElementById("exerciseStep").textContent==="Needs restart",null,{timeout:3500});
 assert.equal(await desktop.locator("#exerciseQuestionWrap").isVisible(),false);
 assert.match(await desktop.locator("#exerciseFeedback").textContent(),/Restart this guided exercise/);
 await desktop.locator("#exerciseStart").click();
 assert.equal(await desktop.locator("#windSelect").inputValue(),"calm");
 await desktop.locator("#flaps").selectOption("30");
 await desktop.waitForFunction(()=>document.getElementById("exerciseStep").textContent==="Observation 2 of 2",null,{timeout:5000});
 await desktop.locator('#exerciseChoices input[value="a"]').check();
 await desktop.locator("#exerciseAnswer").click();
 assert.equal(await desktop.locator("#exerciseStep").textContent(),"Observation complete");
 await desktop.locator("#exerciseStop").click();
 assert.equal(await desktop.locator("#exerciseLive").isVisible(),false);
 assert.match(await desktop.locator("#exerciseState").textContent(),/No guided exercise active/);
 assert.equal(await desktop.locator("#exerciseStop").isDisabled(),true);
 assert.ok(await desktop.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[]);
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone: "+e.message));
 await phone.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
   if(this.id==="outsideView3D"&&kind==="webgl2")return null;
   return original.call(this,kind,...args);
  };
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:undefined});
 });
 await phone.goto(url,{waitUntil:"load"});
 await phone.locator("#guidedExercisePanel summary").tap();
 assert.equal(await phone.locator("#exerciseSpeak").isDisabled(),true);
 await phone.locator("#exerciseSelect").selectOption("cg-shift");
 await phone.locator("#exerciseStart").tap();
 assert.equal(await phone.locator("#exerciseStep").textContent(),"Observation 1 of 3");
 assert.equal(await phone.locator("#exerciseVoiceStatus").textContent(),
  "Device narration unavailable; text works normally.");
 await phone.locator("#exerciseRecord").tap();
 await changeRange(phone,"loadBaggage",45);
 await phone.waitForFunction(()=>document.getElementById("exerciseStep").textContent==="Observation 3 of 3",null,{timeout:3500});
 assert.equal(await phone.locator("#exerciseQuestionWrap").isVisible(),true);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  "the expanded lesson panel and radio choices must fit a 390px phone");
 assert.ok(await phone.locator("#outsideView").isVisible());
 assert.ok(await phone.locator("#miniAttitude").isVisible());
 await phone.locator("#controlPad").scrollIntoViewIfNeeded();
 const pad=await phone.locator("#controlPad").boundingBox();
 const pedal=await phone.locator("#rightRudder").boundingBox();
 assert.ok(pad&&pedal&&Math.abs(pad.y-pedal.y)<145,
  "two-thumb yoke and rudder controls remain together under guided lessons");
 assert.ok(await phone.locator("#rightRudder").isVisible());
 await phone.locator("#guidedExercisePanel summary").tap();
 assert.equal(await phone.locator("#guidedExercisePanel").evaluate(el=>el.open),false);
 assert.deepEqual(errors,[]);
 await phone.close();
 console.log("Guided flight browser passed: scripted CG/wind/energy observations, ungraded reflections, explicit text-to-speech, interruption recovery and 390px accessible controls.");
}finally{await browser.close();}
