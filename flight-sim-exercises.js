/* Instructor-review-ready conceptual exercises built against the fictional
 * Academy weight/balance and energy models. The published content is
 * SME_REVIEW_REQUIRED. This is unsigned, ungraded local self-check only.
 */
(function(root){"use strict";
const W=root?.AGSAFlightLoading||(typeof module!=="undefined"?require("./flight-sim-loading.js"):null);
const D=root?.AGSAFlightAerodynamics||(typeof module!=="undefined"?require("./flight-sim-aerodynamics.js"):null);
if(!W||!D)throw Error("The fictional loading and energy modules are required");
const STATUS="SME_REVIEW_REQUIRED";
const defaults=()=>({...W.DEFAULT});
const DEFINITIONS=Object.freeze({
 cgTransfer:Object.freeze({
  id:"cgTransfer",title:"01 · Moving a load aft",
  goal:"Compare two imaginary loadouts with exactly the same total mass.",
  rationale:"The same mass moved to a larger imaginary station arm creates a greater total moment. Therefore the calculated centre of gravity moves aft despite unchanged mass.",
  question:"A 40 kg fictional load moves from the rear occupant station to the farther-aft baggage station. What happens to centre of gravity?",
  prompt:"Apply Reference, then Comparison. Examine total mass, moment and CG before selecting an explanation.",
  options:Object.freeze([
   {id:"aft",label:"CG moves aft while total mass stays the same"},
   {id:"forward",label:"CG moves forward while total mass stays the same"},
   {id:"same",label:"CG and total mass both stay unchanged"}
  ]),
  reference:Object.freeze({pilotKg:80,passengerKg:70,baggageKg:0,fuelKg:75}),
  comparison:Object.freeze({pilotKg:80,passengerKg:30,baggageKg:40,fuelKg:75}),
  referenceFlaps:10,comparisonFlaps:10
 }),
 massIncrease:Object.freeze({
  id:"massIncrease",title:"02 · Mass and wing loading",
  goal:"Keep the fictional wing area unchanged and compare a heavier load.",
  rationale:"Wing loading is mass divided by wing area in this model. When the imaginary mass rises and the fictional wing area stays fixed, its kg/m² rises; this alone does not establish safe aircraft performance.",
  question:"When extra imaginary occupants and baggage increase the mass without changing wing area, what happens to wing loading?",
  prompt:"Apply both conditions. Compare the total mass and mass-per-wing-area values.",
  options:Object.freeze([
   {id:"higher",label:"Wing loading increases"},
   {id:"lower",label:"Wing loading decreases"},
   {id:"same",label:"Wing loading remains unchanged"}
  ]),
  reference:Object.freeze({...W.DEFAULT}),
  comparison:Object.freeze({pilotKg:105,passengerKg:95,baggageKg:40,fuelKg:75}),
  referenceFlaps:10,comparisonFlaps:10
 }),
 fuelShift:Object.freeze({
  id:"fuelShift",title:"03 · Changing imaginary fuel load",
  goal:"Explore a change in mass forward of the initial imaginary CG.",
  rationale:"The imaginary fuel station lies forward of the initial CG. Removing mass there lowers total mass but moves the remaining model's weighted-average position aft. No real in-flight fuel burn is simulated.",
  question:"The model loses 50 kg of imaginary fuel from a forward-of-CG station. Which trend appears?",
  prompt:"Compare the fuel figures, mass and CG. This model has no fuel burn in flight; each setup is restarted.",
  options:Object.freeze([
   {id:"aft-lighter",label:"Total mass decreases and CG shifts aft"},
   {id:"forward-lighter",label:"Total mass decreases and CG shifts forward"},
   {id:"aft-heavier",label:"Total mass increases and CG shifts aft"}
  ]),
  reference:Object.freeze({...W.DEFAULT}),
  comparison:Object.freeze({...W.DEFAULT,fuelKg:25}),
  referenceFlaps:10,comparisonFlaps:10
 }),
 flapTrade:Object.freeze({
  id:"flapTrade",title:"04 · Fictional flap lift–drag comparison",
  goal:"Compare invented lift and drag coefficients at one common angle of attack.",
  rationale:"At the same arbitrary 4° angle of attack, the invented flap-coefficient formula increases both CL and CD. That is a comparison of these fabricated parameters, not a real flap performance guarantee.",
  question:"At the same invented 4° angle of attack, what happens when flap selection changes from 0° to 30°?",
  prompt:"Use Reference and Comparison to see the flap selector change. The coefficient figures are a fixed-angle illustration, not a real-aircraft performance claim.",
  options:Object.freeze([
   {id:"both",label:"The fictional lift and drag coefficients both rise"},
   {id:"lift-only",label:"Lift coefficient rises but drag coefficient falls"},
   {id:"neither",label:"Both coefficients remain unchanged"}
  ]),
  reference:Object.freeze({...W.DEFAULT}),
  comparison:Object.freeze({...W.DEFAULT}),
  referenceFlaps:0,comparisonFlaps:30
 })
});
const isObject=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
function get(id){
 if(!Object.hasOwn(DEFINITIONS,id))throw Error("Unknown Academy conceptual exercise");
 return DEFINITIONS[id];
}
function values(id,stage,profileId="trainer"){
 const d=get(id);
 if(stage!=="reference"&&stage!=="comparison")throw Error("Unknown exercise stage");
 const loadout=stage==="reference"?d.reference:d.comparison;
 const flaps=stage==="reference"?d.referenceFlaps:d.comparisonFlaps;
 const loading=W.evaluate(profileId,loadout);
 const aero=D.coefficients(4,flaps,profileId);
 return Object.freeze({
  stage,id,profileId,loadout:Object.freeze({...loadout}),flaps,
  totalKg:loading.totalKg,momentKgM:loading.momentKgM,
  cgPercentMAC:loading.cgPercentMAC,wingLoadingKgM2:loading.wingLoadingKgM2,
  cl:aero.cl,cd:aero.cd,referenceAngleDeg:4
 });
}
function expected(id,profileId="trainer"){
 const a=values(id,"reference",profileId),b=values(id,"comparison",profileId);
 const diff=(x,y)=>x>y+1e-9?"higher":x<y-1e-9?"lower":"same";
 if(id==="cgTransfer"){
  if(diff(b.totalKg,a.totalKg)!=="same")throw Error("Transfer exercise must keep the mass constant");
  return diff(b.cgPercentMAC,a.cgPercentMAC)==="higher"?"aft":"forward";
 }
 if(id==="massIncrease")return diff(b.wingLoadingKgM2,a.wingLoadingKgM2);
 if(id==="fuelShift")return diff(b.totalKg,a.totalKg)==="lower"?
  (diff(b.cgPercentMAC,a.cgPercentMAC)==="higher"?"aft-lighter":"forward-lighter"):"aft-heavier";
 if(id==="flapTrade")return diff(b.cl,a.cl)==="higher"&&diff(b.cd,a.cd)==="higher"?
  "both":diff(b.cl,a.cl)==="higher"?"lift-only":"neither";
 throw Error("Unknown exercise");
}
function begin(id="cgTransfer",profileId="trainer"){
 get(id);W.evaluate(profileId);
 return {id,profileId,reference:null,comparison:null,feedback:null};
}
function matches(actual,goal){
 if(!isObject(actual)||actual.profileId!==goal.profileId||
  actual.flaps!==goal.flaps||!isObject(actual.loadout))return false;
 try{
  const payload=W.validate(actual.loadout);
  return Object.keys(W.RULES).every(key=>payload[key]===goal.loadout[key]);
 }catch{return false}
}
function record(session,stage,actual){
 if(!isObject(session))throw Error("Exercise session required");
 const goal=values(session.id,stage,session.profileId);
 if(!matches(actual,goal))return {ok:false,message:"Setup did not match this exercise. Apply the suggested fictional configuration again."};
 if(stage==="reference"){
  session.reference=goal;
  session.comparison=null;
 }else{
  if(!session.reference)return {ok:false,message:"Apply the Reference setup before the Comparison setup."};
  session.comparison=goal;
 }
 session.feedback=null;
 return {ok:true,message:stage==="reference"?
  "Reference observation recorded. Apply Comparison to see what changed.":
  "Comparison observation recorded. Choose a conceptual explanation and check it."};
}
function observationText(obs){
 if(!obs)return "Not observed yet";
 return obs.totalKg.toFixed(0)+" kg · CG "+obs.cgPercentMAC.toFixed(1)+
  "% MAC · wing "+obs.wingLoadingKgM2.toFixed(1)+" kg/m² · "+
  obs.flaps+"° flaps";
}
function evidence(session){
 const a=session?.reference,b=session?.comparison;
 if(!a||!b)return "Reference and Comparison must both be observed.";
 if(a.profileId!==b.profileId)throw Error("Mixed aircraft profiles are not comparable");
 const delta=(x,y,digits=1)=>((x-y>=0?"+":"")+(x-y).toFixed(digits));
 return "Comparison − Reference: mass "+delta(b.totalKg,a.totalKg,0)+" kg; "+
  "moment "+delta(b.momentKgM,a.momentKgM,1)+" kg·m; "+
  "CG "+delta(b.cgPercentMAC,a.cgPercentMAC,1)+"% imaginary MAC; "+
  "wing loading "+delta(b.wingLoadingKgM2,a.wingLoadingKgM2,1)+" kg/m²; "+
  "invented CL "+delta(b.cl,a.cl,3)+"; invented CD "+delta(b.cd,a.cd,3)+
  " (both evaluated at fictional AoA 4°).";
}
function review(session,answer){
 if(!isObject(session))throw Error("Exercise session required");
 const d=get(session.id);
 if(!session.reference||!session.comparison)
  return {status:"incomplete",message:"Apply the Reference and Comparison setups before checking an explanation.",evidence:evidence(session)};
 if(typeof answer!=="string"||!d.options.some(o=>o.id===answer))
  return {status:"choose",message:"Choose one of the listed conceptual explanations.",evidence:evidence(session)};
 const correct=answer===expected(session.id,session.profileId);
 const message=correct?
  "Your selected explanation matches this fictional model's calculated comparison. It is a practice self-check, not an instructor assessment.":
  "That explanation does not match the invented comparison figures. Recheck the direction of the change and try again.";
 const result={status:correct?"matches-model":"revisit",
  message:message+" Model explanation: "+d.rationale,
  evidence:evidence(session),
  reviewStatus:STATUS,assessed:false,trainingCredit:false};
 session.feedback=result;
 return result;
}
const api={STATUS,DEFINITIONS,get,values,expected,begin,record,observationText,evidence,review};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightExercises=api;
})(typeof window!=="undefined"?window:null);
