/* Fictional mass-and-balance learning lab.
 * No aircraft-type station arms, approved limits or manufacturer data.
 * The supplied geometry/weights are invented to demonstrate moments, CG
 * changes, mass-dependent acceleration and conceptual pitch sensitivity.
 */
(function(root){"use strict";
const E=root?.AGSAFlightEnvironment||(typeof module!=="undefined"?require("./flight-sim-environment.js"):null);
if(!E)throw Error("Fictional aircraft profiles required");
const ARM=Object.freeze({empty:2.07,pilot:1.60,passenger:2.80,baggage:3.60,fuel:1.90});
const DEFAULT=Object.freeze({pilotKg:80,passengerKg:35,baggageKg:0,fuelKg:75});
const RULES=Object.freeze({
 pilotKg:Object.freeze({min:45,max:120,step:5,arm:ARM.pilot,label:"Front occupant"}),
 passengerKg:Object.freeze({min:0,max:130,step:5,arm:ARM.passenger,label:"Rear occupant"}),
 baggageKg:Object.freeze({min:0,max:80,step:5,arm:ARM.baggage,label:"Rear bags"}),
 fuelKg:Object.freeze({min:15,max:90,step:5,arm:ARM.fuel,label:"Imaginary fuel"})
});
const MAC=Object.freeze({leadingM:1.45,lengthM:1.30,minPercent:30,maxPercent:55});
function validate(loadout=DEFAULT){
 if(!loadout||typeof loadout!=="object"||Array.isArray(loadout))
  throw Error("Fictional loadout must be an object");
 if(Object.keys(loadout).some(k=>!Object.hasOwn(RULES,k)))
  throw Error("Unknown fictional loading station");
 const result={};
 for(const [key,rule] of Object.entries(RULES)){
  const value=loadout[key]??DEFAULT[key];
  if(typeof value!=="number"||!Number.isInteger(value)||
     value<rule.min||value>rule.max||(value-rule.min)%rule.step!==0)
   throw Error(key+" must use the available whole-kilogram station increments");
  result[key]=value;
 }
 return result;
}
function evaluate(profileId="trainer",loadout=DEFAULT){
 const profile=E.selectProfile(profileId);
 const payload=validate(loadout);
 // Designed so the default imaginary payload totals exactly 190 kg.
 const emptyKg=({trainer:650,sport:510,touring:980})[profileId];
 if(!Number.isFinite(emptyKg))throw Error("Unsupported fictional balance profile");
 const stations=[
  {id:"empty",label:"Invented empty airframe",massKg:emptyKg,armM:ARM.empty},
  ...Object.keys(RULES).map(key=>({
   id:key,label:RULES[key].label,massKg:payload[key],armM:RULES[key].arm
  }))
 ];
 const totalKg=stations.reduce((sum,s)=>sum+s.massKg,0);
 const momentKgM=stations.reduce((sum,s)=>sum+s.massKg*s.armM,0);
 const cgArmM=momentKgM/totalKg;
 const cgPercentMAC=(cgArmM-MAC.leadingM)/MAC.lengthM*100;
 const maxIllustrativeKg=profileId==="trainer"?1030:profileId==="sport"?880:1460;
 const withinFictionalBand=cgPercentMAC>=MAC.minPercent&&
  cgPercentMAC<=MAC.maxPercent&&totalKg<=maxIllustrativeKg;
 const balanceLabel=totalKg>maxIllustrativeKg?
  "Above the imaginary reference mass":
  cgPercentMAC>MAC.maxPercent?"Aft of the imaginary CG band":
  cgPercentMAC<MAC.minPercent?"Forward of the imaginary CG band":
  "Inside the imaginary comparison band";
 return {
  profileId,stations,loadout:Object.freeze({...payload}),
  emptyKg,totalKg,momentKgM,cgArmM,cgPercentMAC,
  maxIllustrativeKg,withinFictionalBand,balanceLabel,
  // Deliberately bounded modifier for fictional response only.
  // Aft CG makes an illustrative pitch command more responsive.
  pitchAuthority:Math.max(.76,Math.min(1.34,1+(cgPercentMAC-45)*.012)),
  wingLoadingKgM2:totalKg/({trainer:17,sport:15,touring:20})[profileId],
  disclaimer:"Invented stations and reference band · NOT AIRCRAFT LIMITS"
 };
}
const api={ARM,DEFAULT,RULES,MAC,validate,evaluate};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightLoading=api;
})(typeof window!=="undefined"?window:null);
