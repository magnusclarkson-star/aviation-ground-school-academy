import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const errors=[];
const t=async(page,id)=>page.locator("#"+id).textContent();
const setRange=async(page,id,value)=>page.locator("#"+id).evaluate((el,v)=>{
 el.value=String(v);
 el.dispatchEvent(new Event("input",{bubbles:true}));
 el.dispatchEvent(new Event("change",{bubbles:true}));
},value);
try{
 const desktop=await browser.newPage({viewport:{width:1200,height:900}});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 assert.equal(await desktop.locator("#exerciseLab").isVisible(),false,
  "no exercise UI in default Classic mode");
 assert.equal(await desktop.locator("#physicsSelect").inputValue(),"classic");
 await desktop.locator("#physicsSelect").selectOption("aero");
 assert.equal(await desktop.locator("#exerciseLab").isVisible(),true);
 assert.equal(await desktop.locator("#loadingWrap").isVisible(),true);
 assert.equal(await desktop.locator("#exerciseSelect option").count(),4);
 assert.match(await t(desktop,"exerciseReviewStatus"),/SME_REVIEW_REQUIRED/);
 assert.match(await desktop.locator("#exerciseLab").textContent(),/not an instructor/i);
 assert.equal(await t(desktop,"exerciseReferenceFact"),"Not observed yet");
 assert.equal(await t(desktop,"exerciseComparisonFact"),"Not observed yet");
 await desktop.locator("#exerciseCheck").click();
 assert.match(await t(desktop,"exerciseFeedback"),/Apply the Reference and Comparison/);
 await desktop.locator("#exerciseComparison").click();
 assert.match(await t(desktop,"exerciseFeedback"),/Apply Reference first/);
 await desktop.locator("#exerciseReference").click();
 assert.equal(await desktop.locator("#loadPassenger").inputValue(),"70");
 assert.equal(await desktop.locator("#loadBaggage").inputValue(),"0");
 assert.equal(await t(desktop,"loadingMass"),"875 kg");
 assert.match(await t(desktop,"exerciseReferenceFact"),/875 kg/);
 assert.match(await t(desktop,"exerciseFeedback"),/Reference observation recorded/);
 await desktop.locator("#exerciseComparison").click();
 assert.equal(await desktop.locator("#loadPassenger").inputValue(),"30");
 assert.equal(await desktop.locator("#loadBaggage").inputValue(),"40");
 assert.equal(await t(desktop,"loadingMass"),"875 kg");
 assert.match(await t(desktop,"exerciseComparisonFact"),/875 kg/);
 assert.match(await t(desktop,"exerciseEvidence"),/CG \+/);
 await desktop.locator("#exerciseAnswer").selectOption("forward");
 await desktop.locator("#exerciseCheck").click();
 assert.equal(await desktop.locator("#exerciseFeedback").getAttribute("data-result"),"revisit");
 assert.match(await t(desktop,"exerciseFeedback"),/does not match/i);
 assert.match(await t(desktop,"exerciseFeedback"),/Model explanation/);
 await desktop.locator("#exerciseAnswer").selectOption("aft");
 await desktop.locator("#exerciseCheck").click();
 assert.equal(await desktop.locator("#exerciseFeedback").getAttribute("data-result"),"matches-model");
 assert.match(await t(desktop,"exerciseFeedback"),/not an instructor assessment/i);
 // Manual load changes invalidate stale observations and matching results.
 await setRange(desktop,"loadBaggage",50);
 assert.equal(await t(desktop,"exerciseReferenceFact"),"Not observed yet");
 assert.equal(await t(desktop,"exerciseComparisonFact"),"Not observed yet");
 assert.match(await t(desktop,"exerciseFeedback"),/earlier observations|manually changed/i);

 await desktop.locator("#exerciseSelect").selectOption("massIncrease");
 await desktop.locator("#exerciseReference").click();
 await desktop.locator("#exerciseComparison").click();
 assert.match(await t(desktop,"exerciseEvidence"),/wing loading \+/);
 await desktop.locator("#exerciseAnswer").selectOption("higher");
 await desktop.locator("#exerciseCheck").click();
 assert.equal(await desktop.locator("#exerciseFeedback").getAttribute("data-result"),"matches-model");

 await desktop.locator("#exerciseSelect").selectOption("fuelShift");
 await desktop.locator("#exerciseReference").click();
 await desktop.locator("#exerciseComparison").click();
 assert.equal(await desktop.locator("#loadFuel").inputValue(),"25");
 assert.match(await t(desktop,"exerciseEvidence"),/mass -50 kg/);
 await desktop.locator("#exerciseAnswer").selectOption("aft-lighter");
 await desktop.locator("#exerciseCheck").click();
 assert.equal(await desktop.locator("#exerciseFeedback").getAttribute("data-result"),"matches-model");

 await desktop.locator("#exerciseSelect").selectOption("flapTrade");
 await desktop.locator("#exerciseReference").click();
 assert.equal(await desktop.locator("#flaps").inputValue(),"0");
 await desktop.locator("#exerciseComparison").click();
 assert.equal(await desktop.locator("#flaps").inputValue(),"30");
 assert.match(await t(desktop,"exerciseEvidence"),/invented CL \+/);
 assert.match(await t(desktop,"exerciseEvidence"),/invented CD \+/);
 await desktop.locator("#exerciseAnswer").selectOption("both");
 await desktop.locator("#exerciseCheck").click();
 assert.equal(await desktop.locator("#exerciseFeedback").getAttribute("data-result"),"matches-model");
 await desktop.locator("#flaps").selectOption("20");
 assert.equal(await t(desktop,"exerciseReferenceFact"),"Not observed yet");
 assert.match(await t(desktop,"exerciseFeedback"),/Manual flap change/);

 await desktop.locator("#profileSelect").selectOption("sport");
 assert.equal(await desktop.locator("#exerciseLab").isVisible(),true);
 assert.equal(await t(desktop,"exerciseReferenceFact"),"Not observed yet");
 await desktop.locator("#exerciseReference").click();
 assert.match(await t(desktop,"exerciseReferenceFact"),/700 kg/);
 await desktop.locator("#typeCyclic").click();
 assert.equal(await desktop.locator("#exerciseLab").isVisible(),false);
 assert.equal(await desktop.locator("#loadingWrap").isVisible(),false);
 await desktop.locator("#typeYoke").click();
 assert.equal(await desktop.locator("#exerciseLab").isVisible(),true);
 assert.equal(await t(desktop,"exerciseReferenceFact"),"Not observed yet");
 await desktop.locator("#physicsSelect").selectOption("classic");
 assert.equal(await desktop.locator("#exerciseLab").isVisible(),false);
 await desktop.locator("#physicsSelect").selectOption("aero");
 assert.equal(await desktop.locator("#exerciseLab").isVisible(),true);
 await desktop.locator("#exerciseClear").click();
 assert.match(await t(desktop,"exerciseFeedback"),/Observations cleared/);
 assert.deepEqual(errors,[]);
 await desktop.close();

 // Force the same low-spec 2D path learners may see on an older phone.
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone "+e.message));
 await phone.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
   if(kind==="webgl2"&&this.id==="outsideView3D")return null;
   return original.call(this,kind,...args);
  };
 });
 await phone.goto(url,{waitUntil:"load"});
 assert.equal(await phone.locator("#exerciseLab").isVisible(),false);
 await phone.locator("#physicsSelect").selectOption("aero");
 assert.equal(await phone.locator("#exerciseLab").isVisible(),true);
 await phone.locator("#exerciseSelect").selectOption("cgTransfer");
 await phone.locator("#exerciseReference").tap();
 await phone.locator("#exerciseComparison").tap();
 await phone.locator("#exerciseAnswer").selectOption("aft");
 await phone.locator("#exerciseCheck").tap();
 assert.equal(await phone.locator("#exerciseFeedback").getAttribute("data-result"),"matches-model");
 assert.equal(await phone.locator("#outsideView3D").isVisible(),false);
 assert.ok(await phone.locator("#outsideView").isVisible());
 assert.ok(await phone.locator("#miniAttitude").isVisible());
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  "interactive exercise comparison must not cause horizontal phone overflow");
 await phone.locator("#controlPad").scrollIntoViewIfNeeded();
 const scene=await phone.locator(".scene-shell").boundingBox();
 const pad=await phone.locator("#controlPad").boundingBox();
 const pedal=await phone.locator("#rightRudder").boundingBox();
 assert.equal(await phone.locator(".scene-shell").evaluate(el=>getComputedStyle(el).position),"sticky","windscreen remains sticky within the cockpit");
 assert.ok(pad&&pedal&&Math.abs(pad.y-pedal.y)<145,"two-thumb control layout remains intact");
 await phone.locator("#instrumentToggle").tap();
 assert.equal(await phone.locator("#miniAttitude").isVisible(),false);
 assert.equal(await phone.locator("#exerciseLab").isVisible(),true);
 await phone.locator("#physicsSelect").selectOption("classic");
 assert.equal(await phone.locator("#exerciseLab").isVisible(),false);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[]);
 await phone.close();
 console.log("Conceptual exercise browser passed: four model-backed lessons, gated observations, correction and stale-data invalidation, SME labels, 2D fallback and 390px touch controls.");
}finally{await browser.close();}
