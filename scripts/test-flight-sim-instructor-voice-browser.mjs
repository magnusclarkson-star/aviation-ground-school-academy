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

 // Independent R44 voice page: selecting the helicopter is the user gesture.
 // The 4 lesson stages speak once each, but never interrupt the ATC queue.
 const coachPage=await browser.newPage({viewport:{width:1200,height:900}});
 coachPage.on("pageerror",e=>errors.push("R44 voice "+e.message));
 await coachPage.addInitScript(()=>{
  window.__coachSpeech=[];window.__coachCancel=0;
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{
   speak(utterance){window.__coachSpeech.push({text:utterance.text,rate:utterance.rate})},
   cancel(){window.__coachCancel++},
   getVoices(){return []}
  }});
  Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,
   value:class{constructor(text){this.text=text}}});
 });
 await coachPage.goto(url,{waitUntil:"load"});
 assert.equal(await coachPage.evaluate(()=>window.__coachSpeech.length),0,
  "spoken R44 guidance must not start on page load");
 await coachPage.locator("#cockpitAircraftSelect").selectOption("r44");
 assert.equal(await coachPage.locator("#r44VoiceToggle").getAttribute("aria-pressed"),"true");
 assert.equal(await coachPage.evaluate(()=>window.__coachSpeech.length),1,
  "R44 selection is the explicit gesture that arms a short stage prompt");
 assert.match(await coachPage.evaluate(()=>window.__coachSpeech.at(-1).text),
  /Lift into a steady hover/);
 await coachPage.waitForTimeout(200);
 assert.equal(await coachPage.evaluate(()=>window.__coachSpeech.length),1,
  "animation frames cannot spam the instructor announcement");
 // The R44 lesson strip is deliberately hidden to protect pedal space.
 // The live voice control is now reachable via the existing More button.
 await coachPage.locator("#cockpitHelpToggle").click();
 const reachableVoice=coachPage.locator("#r44VoiceMoreToggle");
 assert.ok(await reachableVoice.isVisible(),
  "R44 voice must be reachable without adding cockpit clutter");
 await reachableVoice.click();
 assert.equal(await reachableVoice.getAttribute("aria-pressed"),"false");
 assert.equal(await coachPage.locator("#r44VoiceToggle").getAttribute("aria-pressed"),"false");
 const mutedCount=await coachPage.evaluate(()=>window.__coachSpeech.length);
 await coachPage.waitForTimeout(150);
 assert.equal(await coachPage.evaluate(()=>window.__coachSpeech.length),mutedCount);
 if(!(await reachableVoice.isVisible()))await coachPage.locator("#cockpitHelpToggle").click();
 await reachableVoice.click();
 assert.equal(await reachableVoice.getAttribute("aria-pressed"),"true");
 assert.equal(await coachPage.evaluate(()=>window.__coachSpeech.length),mutedCount+1,
  "unmuting repeats the current stage only after the learner taps");
 await coachPage.locator("#collective").evaluate(el=>{
  el.value="82";el.dispatchEvent(new Event("input",{bubbles:true}));
 });
 await coachPage.waitForFunction(()=>document.querySelector("[data-r44-lesson]")?.
   textContent.includes("2/4 · HOVER"),null,{timeout:8000});
 assert.match(await coachPage.evaluate(()=>window.__coachSpeech.at(-1).text),
  /Hold your position and height/);
 const cancelBeforeATC=await coachPage.evaluate(()=>window.__coachCancel);
 await coachPage.locator("#atcBefore").click();
 assert.ok((await coachPage.evaluate(()=>window.__coachCancel))>cancelBeforeATC,
  "ATC spoken conversation interrupts the lesson voice, never the reverse");
 assert.match(await coachPage.evaluate(()=>window.__coachSpeech.at(-1).text),
  /Academy|pilot|Tower|runway|helipad/i);
 const duringATC=await coachPage.evaluate(()=>window.__coachSpeech.length);
 await coachPage.waitForTimeout(150);
 assert.equal(await coachPage.evaluate(()=>window.__coachSpeech.length),duringATC);
 await coachPage.locator("#atcStop").click();
 await coachPage.locator("#pauseFlight").click();
 assert.equal(await coachPage.locator("#pauseFlight").getAttribute("aria-pressed"),"true");
 await coachPage.close();

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
 assert.ok(control&&pedal&&pedal.y>=control.y+control.height-12&&pedal.y-control.y<280,
  "pedals remain below the centered yoke when narration panel expands");
 await phone.locator("#cockpitAircraftSelect").selectOption("r44");
 assert.equal(await phone.locator("#r44VoiceToggle").isVisible(),false,
  "the old R44 lesson strip remains hidden to preserve pedal space");
 await phone.locator("#cockpitHelpToggle").tap();
 assert.equal(await phone.locator("#r44VoiceMoreToggle").isVisible(),true,
  "R44 spoken instructor control is reachable inside More on a phone");
 assert.equal(await phone.locator("#r44VoiceMoreToggle").isDisabled(),true,
  "unsupported phone stays silent without removing text-based guidance");
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  "R44 mute icon cannot create horizontal scrolling on a 390px phone");
 assert.deepEqual(errors,[]);
 await phone.close();
 console.log("Instructor voice browser passed: no auto-play, Scout/pilot scripts, slower pace, reference/comparison/feedback speech, stop/hide, unsupported 390px phone and text-only self-check.");
}finally{await browser.close();}
