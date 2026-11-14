/* Course 10 — fictional loading and performance concepts.
 * Numerical examples are deliberately NOT data for any real aircraft. */
(function(root){"use strict";
const REVISION="2026-11-14-performance-practical-v1";
const cases=Object.freeze([
 Object.freeze({
  id:"moments",number:1,title:"Understand mass, arm and moment",
  pictures:Object.freeze(["overview-08","detail-08"]),
  situation:"A classroom beam represents three fictional loads. Each has a mass and distance from a defined reference datum. A real aircraft's empty mass, arms and weighing records are different and must come from its approved documents.",
  question:"How is the moment of one fictional load calculated when mass and arm use consistent units?",
  options:Object.freeze([
   "Multiply its mass by its arm from the reference datum.",
   "Divide its mass by the runway heading.",
   "Add the aircraft registration number to its mass."
  ]),answer:0,
  explanation:"In this simplified mass-arm model, the moment is mass multiplied by its horizontal distance from a chosen reference datum. Summing the moments and dividing by total mass gives a model centre-of-gravity position. These classroom values do not describe the approved weight-and-balance configuration or load stations of any aircraft.",
  key:Object.freeze([
   ["Reference datum","Chosen origin for measuring longitudinal arms"],
   ["Mass","Quantity of matter, in the classroom example kilograms"],
   ["Arm","Distance from the datum, in metres here"],
   ["Moment","Mass × arm, in kg·m for this simplified exercise"],
   ["Total CG","Total moment divided by total mass"]
  ]),
  scouts:"Air Scouts: use the moment table and compare how much a load matters when placed farther from the datum.",
  pilots:"Aspiring pilots: distinguish theoretical moment arithmetic from approved aircraft-specific weighing data, stations and envelopes."
 }),
 Object.freeze({
  id:"envelope",number:2,title:"Discover why total mass and balance are separate",
  pictures:Object.freeze(["overview-08"]),
  situation:"Move a fictional rear load on a classroom beam. A made-up maximum total mass and a shaded CG teaching band help show two different checks. Neither boundary belongs to a Cessna, Robinson helicopter or other real aircraft.",
  question:"If a fictional loading is below its maximum permitted mass but outside its stated CG band, what follows?",
  options:Object.freeze([
   "Being under total mass is enough to make every loading arrangement acceptable.",
   "The balance condition fails independently of the total-mass check.",
   "Only the colour of the mass indicator matters."
  ]),answer:1,
  explanation:"Total mass and its distribution are distinct restrictions. Moving a load farther from the datum increases its moment, potentially moving the centre of gravity out of a fictional teaching band even when total mass is below the teaching maximum. A real approved envelope may vary with mass and configuration; never use this simple rectangular demonstration for real loading.",
  key:Object.freeze([
   ["Maximum mass","One separate, aircraft-specific constraint"],
   ["CG envelope","Approved allowable balance region, potentially mass-dependent"],
   ["Forward / aft CG","Different balance conditions with handling implications"],
   ["Load redistribution","Changes station moments; real changes require authorised source data"],
   ["Classroom band","An invented visual range, not an aircraft-approved limit"]
  ]),
  scouts:"Air Scouts: compare the mass result with the separate CG result; both classroom indicators must be understood.",
  pilots:"Aspiring pilots: explain why a constant shaded CG band cannot substitute for a real mass-dependent approved envelope."
 }),
 Object.freeze({
  id:"conditions",number:3,title:"Explore conditions affecting performance",
  pictures:Object.freeze(["detail-08"]),
  situation:"An imaginary performance lesson compares conditions using qualitative cards. Heavier loading, higher density altitude, tailwind and reduced runway braking can change performance; no numeric takeoff or landing distance is estimated.",
  question:"Which conclusion is generally sound when density altitude increases?",
  options:Object.freeze([
   "High density altitude always guarantees a shorter takeoff for every aircraft.",
   "Density altitude has nothing to do with aircraft performance.",
   "Many conventional aircraft have reduced climb and takeoff performance under higher density-altitude conditions."
  ]),answer:2,
  explanation:"At higher density altitude, reduced air density can adversely affect aerodynamic and propulsion performance, especially for many conventional piston-powered aircraft. Actual effects depend on aircraft type, configuration and conditions. A qualitative trend card cannot establish real runway distances, climb gradient or clearance of obstacles.",
  key:Object.freeze([
   ["Density altitude","Pressure altitude adjusted for nonstandard temperature"],
   ["Aircraft mass","A performance-chart input, not just a loading check"],
   ["Wind component","Headwind/tailwind effects depend on approved calculation context"],
   ["Runway condition","Surface state may affect braking and required landing distance"],
   ["Approved charts","Aircraft-specific figures for relevant conditions and assumptions"]
  ]),
  scouts:"Air Scouts: compare classroom condition cards; identify which information would be missing from a real decision.",
  pilots:"Aspiring pilots: explain how performance-chart inputs and runway/obstacle constraints require approved aircraft data."
 }),
 Object.freeze({
  id:"missing-data",number:4,title:"Recognise incomplete runway-performance information",
  pictures:Object.freeze(["overview-08","detail-08"]),
  situation:"A fictional learner is told that a runway is 900 metres long and the weather is warm, but the scenario omits aircraft type, loading, airport elevation, wind component, surface condition and current approved performance charts.",
  question:"Can a real-world takeoff or landing safety margin be established from this fictional description?",
  options:Object.freeze([
   "Yes; runway length by itself proves enough distance.",
   "No; the missing aircraft-specific performance data and conditions make the operational result indeterminate.",
   "Yes; any correct multiple-choice answer grants real runway approval."
  ]),answer:1,
  explanation:"Available runway distance alone cannot determine performance. Appropriate actual aircraft data, loading, configuration, environment, runway condition/slope, applicable margins, restrictions and approved methods are essential. The classroom deliberately avoids flight-critical speeds, takeoff/landing distances or a go/no-go recommendation.",
  key:Object.freeze([
   ["Available distance","Published runway distances and any applicable constraints"],
   ["Required distance","Aircraft- and condition-dependent, determined from approved data"],
   ["Performance margin","Difference between applicable available and required capability"],
   ["Uncertainty","Missing data prevents a reliable operational conclusion"],
   ["Instructor review","Qualified oversight and authoritative documentation for formal training"]
  ]),
  scouts:"Air Scouts: list at least three missing facts and explain why a guess could be unsafe.",
  pilots:"Aspiring pilots: identify the approved flight manual, loading information and current aerodrome/environmental sources needed for a proper calculation."
 })
]);
const FICTIONAL=Object.freeze({
 emptyMassKg:300,emptyArmM:1.2,frontMassKg:50,frontArmM:1.5,aftArmM:2.6,
 aftLoadOptions:Object.freeze([0,25,50,75,100,125,150]),
 maxMassKg:475,cgMinM:1.1,cgMaxM:1.5
});
function get(id){return cases.find(c=>c.id===id)||null}
function evaluate(id,choice){
 const c=get(id);
 if(!c||!Number.isInteger(choice)||choice<0||choice>=c.options.length)
  throw Error("Choose a fictional weight-and-balance response");
 return Object.freeze({id,correct:choice===c.answer,expected:c.options[c.answer],
  explanation:c.explanation,key:c.key});
}
function loading(aftMassKg){
 if(!FICTIONAL.aftLoadOptions.includes(aftMassKg))
  throw Error("Choose one of the invented rear-load masses");
 const baseMoment=FICTIONAL.emptyMassKg*FICTIONAL.emptyArmM;
 const frontMoment=FICTIONAL.frontMassKg*FICTIONAL.frontArmM;
 const aftMoment=aftMassKg*FICTIONAL.aftArmM;
 const totalMass=FICTIONAL.emptyMassKg+FICTIONAL.frontMassKg+aftMassKg;
 const totalMoment=baseMoment+frontMoment+aftMoment;
 const cgM=totalMoment/totalMass;
 return Object.freeze({
  aftMassKg,
  stations:Object.freeze([
   Object.freeze({label:"Fictional base mass",massKg:FICTIONAL.emptyMassKg,armM:FICTIONAL.emptyArmM,momentKgM:baseMoment}),
   Object.freeze({label:"Fictional forward load",massKg:FICTIONAL.frontMassKg,armM:FICTIONAL.frontArmM,momentKgM:frontMoment}),
   Object.freeze({label:"Fictional rear load",massKg:aftMassKg,armM:FICTIONAL.aftArmM,momentKgM:aftMoment})
  ]),
  totalMassKg:totalMass,totalMomentKgM:totalMoment,
  cgM:Number(cgM.toFixed(3)),
  withinMass:totalMass<=FICTIONAL.maxMassKg,
  withinCg:cgM>=FICTIONAL.cgMinM&&cgM<=FICTIONAL.cgMaxM,
  note:"The mass limit 475 kg, arms and 1.10–1.50 m CG band are INVENTED classroom numbers, not an aircraft envelope or a loading approval."
 });
}
const CONDITIONS=Object.freeze({
 mass:Object.freeze({normal:"Illustrative lighter loading",adverse:"Illustrative heavier loading",effect:"Higher mass generally increases takeoff and landing distance requirements and can reduce climb margins, subject to type-specific data."}),
 density:Object.freeze({normal:"Lower density altitude",adverse:"Higher density altitude",effect:"Higher density altitude commonly reduces takeoff and climb performance for many conventional aircraft; use aircraft-specific data."}),
 wind:Object.freeze({normal:"Illustrative headwind",adverse:"Illustrative tailwind",effect:"Tailwind can increase required takeoff and landing ground distances relative to a headwind, under comparable conditions."}),
 surface:Object.freeze({normal:"Dry runway in model",adverse:"Reduced runway braking in model",effect:"Reduced runway braking may adversely affect stopping performance; type-specific runway data and actual conditions are essential."})
});
function condition(name,adverse){
 const c=CONDITIONS[name];
 if(!c||typeof adverse!=="boolean")throw Error("Choose a fictional environmental comparison");
 return Object.freeze({name,adverse,label:adverse?c.adverse:c.normal,effect:c.effect,
  note:"Qualitative educational comparison. Does not calculate runway metres, obstacle clearance, speed or operational safety."});
}
function validate(atlas){
 if(cases.length!==4||new Set(cases.map(c=>c.id)).size!==4)
  throw Error("Four performance picture lessons required");
 let pictureViews=0;
 for(const c of cases){
  if(c.options.length!==3||!Number.isInteger(c.answer)||c.answer<0||c.answer>2||
   c.situation.length<125||c.explanation.length<190||c.key.length!==5||!c.scouts||!c.pilots)
   throw Error("Incomplete performance practice "+c.id);
  for(const id of c.pictures){
   const asset=atlas?.getById(id);
   if(!asset||!["overview","detailed"].includes(asset.group))
    throw Error("Only existing approved performance pictures may be shown "+id);
   pictureViews++;
  }
 }
 const l=loading(100);
 if(!l.withinMass||l.withinCg||loading(150).withinMass||
    loading(0).totalMassKg!==350||loading(0).totalMomentKgM!==435)
  throw Error("Fictional CG illustration no longer matches the teaching assumptions");
 if(Object.keys(CONDITIONS).length!==4)throw Error("Expected four qualitative condition groups");
 return Object.freeze({moduleId:"performance",cases:4,pictureViews,conditionGroups:4,
  status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:REVISION});
}
const api=Object.freeze({REVISION,cases,FICTIONAL,CONDITIONS,get,evaluate,loading,condition,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAPerformancePractical=api;
})(typeof window!=="undefined"?window:null);
