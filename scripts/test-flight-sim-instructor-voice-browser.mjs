import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const errors=[];
const t=(page,id)=>page.locator("#"+id).textContent();
try{
 const desktop=await browser.newPage({viewport:{width:1200,height:900}});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.addInitScript(()=>{
  window.__spoken=[];window.__voiceCanceled=0;
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{
   speak(utterance){
    window.__spoken.push({
     text:utterance.text,lang:utterance.lang,rate:utterance.rate,pitch:utterance.pitch
    });
   },
   cancel(){window.__voiceCanceled++}
  }});
  Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,
   value:class {constructor(text){this.text=text}}});
 });
 await desktop.goto(url,{waitUntil:"load"});
 assert.equal(await desktop.evaluate(()=>window.__spoken.length),0,
  "no device speech is allowed without explicit learner initiation");
 assert.equal(await desktop.locator("#exerciseLab").isVisible(),false);
 await desktop.locator("#physicsSelect").selectOption("aero");
 await desktop.locator("#exerciseSpokenInstructor summary").click();
 assert.equal(await desktop.locator("#exerciseSpeakLesson").isDisabled(),false);
 assert.equal(await desktop.locator("#exerciseSpeakComparison").isDisabled(),false);
 assert.equal(await desktop.locator("#exerciseSpeakFeedback").isDisabled(),false);
 assert.equal(await desktop.locator("#exerciseSpeakLesson").isVisible(),true);
 assert.match(await t(desktop,"exerciseSpeechStatus"),/optional and off/);
 assert.equal(await desktop.evaluate(()=>window.__spoken.length),0);
 await desktop.locator("#exerciseSpeakLesson").click();
 let played=await desktop.evaluate(()=>window.__spoken);
 assert.equal(played.length,1);
 assert.equal(played[0].lang,"en-GB");
 assert.equal(played[0].rate,.94);
 assert.match(played[0].text,/Air Scout discovery exercise/);
 assert.match(played[0].text,/Moving a load aft/);
 assert.match(played[0].text,/not an assessed pilot lesson/);
 assert.ok(played[0].text.length<=850);
 assert.match(await t(desktop,"exerciseSpeechStatus"),/Reading the exercise script/);
 await desktop.locator("#exerciseStopSpeech").click();
 assert.match(await t(desktop,"exerciseSpeechStatus"),/stopped by learner/);
 assert.ok(await desktop.evaluate(()=>window.__voiceCanceled)>0);

 await desktop.locator("#exerciseVoiceAudience").selectOption("pilots");
 await desktop.locator("#exerciseVoiceRate").selectOption("0.80");
 await desktop.locator("#exerciseSpeakLesson").click();
 played=await desktop.evaluate(()=>window.__spoken);
 assert.equal(played.length,2);
 assert.equal(played[1].rate,.8);
 assert.match(played[1].text,/Aviation ground-school concept review/);
 assert.match(played[1].text,/awaiting subject-matter-expert review/);
 await desktop.locator("#exerciseSpeakComparison").click();
 played=await desktop.evaluate(()=>window.__spoken);
 assert.match(played[2].text,/Apply the Reference setup first/);
 const stoppedBefore=await desktop.evaluate(()=>window.__voiceCanceled);
 await desktop.locator("#exerciseReference").click();
 assert.ok((await desktop.evaluate(()=>window.__voiceCanceled))>stoppedBefore,
  "changing a comparison cancels old spoken figures immediately");
 await desktop.locator("#exerciseComparison").click();
 await desktop.locator("#exerciseSpeakComparison").click();
 played=await desktop.evaluate(()=>window.__spoken);
 const latest=played.at(-1);
 assert.match(latest.text,/Comparison − Reference/);
 assert.match(latest.text,/CG/);
 assert.match(latest.text,/not an assessed pilot lesson/);
 assert.ok(latest.text.length<=850);
 await desktop.locator("#exerciseAnswer").selectOption("aft");
 await desktop.locator("#exerciseCheck").click();
 await desktop.locator("#exerciseSpeakFeedback").click();
 played=await desktop.evaluate(()=>window.__spoken);
 assert.match(played.at(-1).text,/practice self-check/);
 assert.match(played.at(-1).text,/subject-matter-expert review/);
 assert.equal(await desktop.locator("#exerciseFeedback").getAttribute("data-result"),"matches-model");
 await desktop.locator("#exerciseSelect").selectOption("massIncrease");
 await desktop.locator("#exerciseSpeakLesson").click();
 played=await desktop.evaluate(()=>window.__spoken);
 assert.match(played.at(-1).text,/Mass and wing loading/);
 assert.doesNotMatch(played.at(-1).text,/A 40 kg fictional load moves/);
 const beforeHidden=await desktop.evaluate(()=>window.__voiceCanceled);
 await desktop.evaluate(()=>{
  Object.defineProperty(document,"hidden",{configurable:true,value:true});
  document.dispatchEvent(new Event("visibilitychange"));
 });
 assert.ok((await desktop.evaluate(()=>window.__voiceCanceled))>beforeHidden);
 assert.match(await t(desktop,"exerciseSpeechStatus"),/Page hidden/);
 assert.deepEqual(errors,[]);
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone "+e.message));
 await phone.addInitScript(()=>{
  const old=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
   if(this.id==="outsideView3D"&&kind==="webgl2")return null;
   return old.call(this,kind,...args);
  };
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:undefined});
 });
 await phone.goto(url,{waitUntil:"load"});
 await phone.locator("#physicsSelect").selectOption("aero");
 await phone.locator("#exerciseSpokenInstructor summary").tap();
 assert.equal(await phone.locator("#exerciseSpeakLesson").isDisabled(),true);
 assert.equal(await phone.locator("#exerciseSpeakComparison").isDisabled(),true);
 assert.equal(await phone.locator("#exerciseSpeakFeedback").isDisabled(),true);
 assert.match(await t(phone,"exerciseSpeechStatus"),/Device voice unavailable/);
 assert.ok(await phone.locator("#exerciseReference").isVisible());
 await phone.locator("#exerciseReference").tap();
 await phone.locator("#exerciseComparison").tap();
 await phone.locator("#exerciseAnswer").selectOption("aft");
 await phone.locator("#exerciseCheck").tap();
 assert.equal(await phone.locator("#exerciseFeedback").getAttribute("data-result"),"matches-model",
  "text-only lessons work without voice support");
 assert.ok(await phone.locator("#outsideView").isVisible());
 assert.ok(await phone.locator("#miniAttitude").isVisible());
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  "spoken instructor controls must not add horizontal phone overflow");
 await phone.locator("#controlPad").scrollIntoViewIfNeeded();
 const control=await phone.locator("#controlPad").boundingBox();
 const pedal=await phone.locator("#rightRudder").boundingBox();
 assert.ok(control&&pedal&&Math.abs(control.y-pedal.y)<145,
  "phone two-thumb yoke/pedals remain adjacent when narration panel expands");
 assert.deepEqual(errors,[]);
 await phone.close();
 console.log("Instructor voice browser passed: no auto-play, Scout/pilot scripts, slower pace, reference/comparison/feedback speech, stop/hide, unsupported 390px phone and text-only self-check.");
}finally{await browser.close();}
