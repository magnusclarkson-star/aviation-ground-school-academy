import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const errors=[];
const setMass=async(page,id,value,commit=true)=>page.locator("#"+id).evaluate((el,args)=>{
 el.value=String(args.value);
 el.dispatchEvent(new Event("input",{bubbles:true}));
 if(args.commit)el.dispatchEvent(new Event("change",{bubbles:true}));
},{value,commit});
const value=async(page,id)=>page.locator("#"+id).textContent();
try{
 const desktop=await browser.newPage({viewport:{width:1200,height:900}});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 assert.equal(await desktop.locator("#physicsSelect").inputValue(),"classic");
 assert.equal(await desktop.locator("#loadingWrap").isVisible(),false);
 await desktop.locator("#startApproach").click();
 assert.equal(await value(desktop,"readSpeed"),"73","classic approach unchanged");
 await desktop.locator("#physicsSelect").selectOption("aero");
 assert.equal(await desktop.locator("#loadingWrap").isVisible(),true);
 assert.equal(await value(desktop,"loadingMass"),"840 kg");
 assert.equal(await value(desktop,"loadingMoment"),"1714.0 kg·m");
 assert.equal(await value(desktop,"loadingCg"),"45.4%");
 assert.equal(await value(desktop,"loadingWing"),"49.4 kg/m²");
 assert.match(await value(desktop,"loadingStatus"),/Inside the imaginary comparison band/);
 assert.equal(await desktop.locator("#loadingStatus").getAttribute("data-level"),"normal");

 const beforeCg=parseFloat(await value(desktop,"loadingCg"));
 await setMass(desktop,"loadBaggage",40,false);
 assert.equal(await value(desktop,"loadBaggageValue"),"40 kg");
 assert.equal(await value(desktop,"loadingMass"),"880 kg");
 assert.ok(parseFloat(await value(desktop,"loadingCg"))>beforeCg);
 assert.match(await value(desktop,"loadingStatus"),/Release the slider/);
 await setMass(desktop,"loadBaggage",40,true);
 assert.equal(await value(desktop,"loadingMass"),"880 kg");
 assert.equal(await value(desktop,"readSpeed"),"73","committing a loadout restarts current imaginary final approach");
 assert.equal(await value(desktop,"coachElapsed"),"0 s");
 assert.doesNotMatch(await value(desktop,"loadingStatus"),/Release the slider/);
 const actual=await desktop.evaluate(()=>{
  const W=window.AGSAFlightLoading;
  return W.evaluate("trainer",{pilotKg:80,passengerKg:35,baggageKg:40,fuelKg:75});
 });
 assert.ok(Math.abs(parseFloat(await value(desktop,"loadingCg"))-actual.cgPercentMAC)<.051);
 assert.equal(await desktop.locator("#loadingCgMarker").evaluate(el=>el.style.left),
  Math.min(100,Math.max(0,actual.cgPercentMAC)).toFixed(1)+"%");

 await setMass(desktop,"loadPilot",45);
 await setMass(desktop,"loadPassenger",125);
 await setMass(desktop,"loadBaggage",70);
 await setMass(desktop,"loadFuel",15);
 assert.equal(await desktop.locator("#loadingStatus").getAttribute("data-level"),"caution");
 assert.match(await value(desktop,"loadingStatus"),/Aft of the imaginary CG band/);
 assert.equal(await desktop.locator("#energyPanel").isVisible(),true);
 await desktop.waitForTimeout(300);
 assert.ok(Number((await value(desktop,"aeroLoad")).split(" ")[0])>=0);
 assert.ok(await desktop.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 // A more heavily loaded profile illustrates mass effects in the same model.
 await desktop.locator("#profileSelect").selectOption("sport");
 assert.match(await value(desktop,"environmentStatus"),/Sport trainer/);
 assert.equal(await desktop.locator("#loadingWrap").isVisible(),true);
 assert.ok(parseFloat(await value(desktop,"loadingMass"))>700);
 await desktop.locator("#typeCyclic").click();
 assert.equal(await desktop.locator("#loadingWrap").isVisible(),false);
 assert.equal(await desktop.locator("#energyPanel").isVisible(),false);
 assert.equal(await value(desktop,"systemsEngineLabel"),"ROTOR SPEED · SIM");
 await desktop.locator("#typeYoke").click();
 assert.equal(await desktop.locator("#loadingWrap").isVisible(),true);
 assert.equal(await desktop.locator("#loadBaggage").inputValue(),"70");
 await desktop.locator("#physicsSelect").selectOption("classic");
 assert.equal(await desktop.locator("#loadingWrap").isVisible(),false);
 assert.equal(await desktop.locator("#energyPanel").isVisible(),false);
 assert.equal(await value(desktop,"readSpeed"),"0",
  "return to classic resets to runway setup instead of leaking experimental flight state");
 assert.deepEqual(errors,[]);
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone "+e.message));
 await phone.addInitScript(()=>{
  const context=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
   if(kind==="webgl2"&&this.id==="outsideView3D")return null;
   return context.call(this,kind,...args);
  };
 });
 await phone.goto(url,{waitUntil:"load"});
 await phone.locator("#physicsSelect").selectOption("aero");
 await phone.locator("#loadingWrap").scrollIntoViewIfNeeded();
 assert.ok(await phone.locator("#loadingWrap").isVisible());
 assert.equal(await value(phone,"loadingMass"),"840 kg");
 await setMass(phone,"loadPassenger",100);
 assert.equal(await value(phone,"loadPassengerValue"),"100 kg");
 assert.equal(await value(phone,"loadingMass"),"905 kg");
 assert.ok(await phone.locator("#outsideView").isVisible());
 assert.ok(await phone.locator("#miniAttitude").isVisible());
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  "four loading sliders cannot introduce phone horizontal overflow");
 await phone.locator("#rightRudder").scrollIntoViewIfNeeded();
 const pad=await phone.locator("#controlPad").boundingBox();
 const pedal=await phone.locator("#rightRudder").boundingBox();
 assert.ok(pad&&pedal&&pedal.y>=pad.y+pad.height-12&&pedal.y-pad.y<280,
  "loading controls must not damage the original two-thumb touch layout");
 await phone.locator("#startApproach").tap();
 await phone.waitForTimeout(350);
 assert.ok(await phone.locator("#energyPanel").isVisible());
 assert.ok(await phone.locator("#loadingWrap").isVisible());
 assert.equal(await value(phone,"loadingMass"),"905 kg");
 await phone.locator("#physicsSelect").selectOption("classic");
 assert.equal(await phone.locator("#loadingWrap").isVisible(),false);
 assert.ok(await phone.locator("#outsideView").isVisible());
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[]);
 await phone.close();

 console.log("Loading browser passed: Classic isolation, calculated mass/moment/CG, live previews and reset-on-release, fictional aft warning, profile/rotorcraft changes and 390px phone.");
}finally{await browser.close();}
