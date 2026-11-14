/* Course 05: illustrated instruments reasoning for scouts and aspiring pilots.
   Concept-only fictional signals; never use for real operations or assessments.
   Owner-approved pictures are displayed unchanged via atlas crops. */
(function(root){"use strict";
const REVISION="2026-11-14-instrument-practical-v1";
const cases=Object.freeze([
 Object.freeze({
  id:"six-pack",number:1,title:"Recognise the six primary instrument indications",
  pictures:Object.freeze(["detail-03","overview-03"]),
  prompt:"Study the original six-pack pictures. Find airspeed, attitude, altitude, turn indication, heading and vertical speed. Look for what each dial actually measures or depicts, not merely its position.",
  question:"Which pairing is correct for a conventional instrument?",
  options:Object.freeze([
   "A pressure altimeter primarily indicates direction of flight over the ground.",
   "An attitude indicator depicts pitch and bank orientation.",
   "A vertical-speed indicator directly reports fuel pressure."
  ]),answer:1,
  explanation:"The attitude indicator displays pitch and bank relative to a depicted horizon. A pressure altimeter uses static pressure and an appropriate selected reference. A conventional vertical-speed indicator detects changing static pressure to show a rate-of-altitude-change indication. The particular instruments and their sensing designs vary by installation.",
  key:Object.freeze([
   ["Airspeed indicator","Pressure-derived speed relative to air (pitot and static)"],
   ["Attitude indicator","Pitch and bank orientation"],
   ["Altimeter","Pressure-based indicated altitude (static pressure and reference)"],
   ["Turn coordinator / indicator","Turn-related angular motion and, for some types, roll-rate information"],
   ["Heading indicator","Directional orientation, from design-dependent source"],
   ["Vertical-speed indicator","Static-pressure-derived indication of altitude-change rate"]
  ]),
  scouts:"Air Scouts: name the six indications on the original picture, then match each with a physical quantity.",
  pilots:"Enthusiasts and aspiring pilots: explain why an indicated number is not itself proof that its sensing source is reliable."
 }),
 Object.freeze({
  id:"pressure",number:2,title:"Trace pitot and static measurement sources",
  pictures:Object.freeze(["detail-03"]),
  prompt:"Use the instrument picture, then try the classroom sensor-source selector beneath it. The simple cards illustrate dependencies, not real piping or fault-finding.",
  question:"In a conventional pitot-static installation, which statement is accurate?",
  options:Object.freeze([
   "The conventional airspeed indicator uses a pitot-versus-static pressure difference.",
   "The attitude indicator requires the same pitot pressure as airspeed.",
   "The altimeter obtains its primary measurement from fuel quantity."
  ]),answer:0,
  explanation:"A conventional airspeed indicator responds to a pitot-minus-static pressure relationship. Pressure altimeters use static pressure with the applicable pressure reference; a conventional VSI responds to static-pressure change over time. Aircraft installations vary, and neither this picture nor a source card authorises diagnosis or use in a real aircraft.",
  key:Object.freeze([
   ["Pitot pressure","Senses impact/total-pressure input for a conventional airspeed instrument"],
   ["Static pressure","Ambient pressure reference used for airspeed, pressure altitude and VSI in conventional installations"],
   ["Pressure reference","Selected pressure setting used to interpret altimeter indication"],
   ["Source disagreement","A clue to investigate under approved aircraft-specific guidance, not a diagnosis"]
  ]),
  scouts:"Air Scouts: compare the colour-labelled teaching source cards and their instrument functions.",
  pilots:"Enthusiasts and aspiring pilots: identify which of the three conventional instruments depend on static pressure, without assuming a single specific system layout."
 }),
 Object.freeze({
  id:"orientation",number:3,title:"Separate attitude, heading and ground track",
  pictures:Object.freeze(["overview-03","cessna-04"]),
  prompt:"Examine the original panel, then consider a fictional example: an aircraft's displayed magnetic heading is 090°, its ground track reads 080°, and its attitude graphic remains level. These indications describe different quantities.",
  question:"What is the soundest conceptual conclusion?",
  options:Object.freeze([
   "Heading and track must always be identical.",
   "A level attitude picture proves the aircraft has no horizontal wind drift.",
   "Heading is where the nose points; ground track is the direction of motion over the ground."
  ]),answer:2,
  explanation:"Heading depicts the direction the aircraft nose points relative to a directional reference; ground track depicts motion over Earth. Wind may contribute to the difference. Attitude shows pitch/bank orientation and is a third kind of information. The fictional figures are not a real flight plan, ATC clearance or calibrated cockpit reference.",
  key:Object.freeze([
   ["Pitch and bank","Orientation relative to the indicated artificial horizon"],
   ["Heading","Aircraft's nose direction relative to a specified directional reference"],
   ["Ground track","Direction of movement over Earth"],
   ["Navigation display","Depicts sensor- and database-dependent information, not permission to enter airspace"]
  ]),
  scouts:"Air Scouts: point to the attitude, heading and navigation pictures and explain why they answer different questions.",
  pilots:"Enthusiasts and aspiring pilots: distinguish heading from track and consider how sensor or reference errors could complicate comparisons."
 }),
 Object.freeze({
  id:"glass-disagreement",number:4,title:"Review a fictional disagreement between displays",
  pictures:Object.freeze(["cessna-04","detail-03"]),
  prompt:"Compare the approved conventional instrument picture with the illustrated cockpit. In a fictional training screen, a primary attitude display shows a right bank while a separate simulated horizon source remains level. No failed component is identified.",
  question:"What is the best student-level response to this fictional inconsistency?",
  options:Object.freeze([
   "Record the two observed indications, avoid assuming which source is wrong and request instructor-led comparison with approved information.",
   "Assume the glass display is correct simply because it is newer.",
   "Declare the aircraft airworthy and disregard the conflicting indication."
  ]),answer:0,
  explanation:"An attractive electronic display can receive inaccurate, unavailable or inconsistent inputs, just as conventional instruments can be affected by source or reference faults. The discrepancy identifies something worth investigating, not the failed unit or an operational response. A real crew would use aircraft-approved abnormal guidance and qualified instruction, not this public teaching app.",
  key:Object.freeze([
   ["PFD","Primary flight display combining selected flight indications"],
   ["AHRS","Electronic attitude and heading reference source in many glass systems"],
   ["ADC","Air-data computer that may process measured pressure and temperature inputs"],
   ["Cross-check","Compare independent available information to recognise inconsistency without guessing the cause"]
  ]),
  scouts:"Air Scouts: write down only what each fictional indicator shows, not a guessed failed part.",
  pilots:"Enthusiasts and aspiring pilots: consider sensor independence and why two screens may still share a common data source."
 })
]);
const sourceCards=Object.freeze({
 airspeed:Object.freeze({label:"Airspeed indicator",inputs:Object.freeze(["Pitot total-pressure input","Static-pressure reference"]),output:"Pressure-derived indicated airspeed",note:"Conventional teaching model. Not an approved wiring, pitot tube or test procedure."}),
 altimeter:Object.freeze({label:"Pressure altimeter",inputs:Object.freeze(["Static pressure","Selected pressure reference"]),output:"Indicated pressure-based altitude",note:"A displayed altitude is not automatically height above nearby terrain."}),
 vsi:Object.freeze({label:"Vertical-speed indicator",inputs:Object.freeze(["Static-pressure change over time"]),output:"Indicated rate of altitude change",note:"Conventional instrument concept, with possible indication lag and installation differences."})
});
function get(id){return cases.find(x=>x.id===id)||null}
function evaluate(id,choice){
 const c=get(id);
 if(!c||!Number.isInteger(choice)||choice<0||choice>=c.options.length)
  throw Error("Choose one instrument-reading response");
 return Object.freeze({id,correct:choice===c.answer,expected:c.options[c.answer],explanation:c.explanation,key:c.key});
}
function sourceCard(name){
 const c=sourceCards[name];if(!c)throw Error("Unknown classroom instrument source");
 return c;
}
function validate(atlas){
 if(cases.length!==4||new Set(cases.map(c=>c.id)).size!==4)
  throw Error("Expected four illustrated instrument cases");
 let views=0;
 for(const c of cases){
  if(c.options.length!==3||c.answer<0||c.answer>2||
    c.prompt.length<120||c.explanation.length<200||c.key.length<4||!c.scouts||!c.pilots)
    throw Error("Incomplete conceptual instrument case "+c.id);
  for(const id of c.pictures){
   const asset=atlas?.getById(id);
   if(!asset||!["detailed","overview","cessna"].includes(asset.group))
    throw Error("Instrument case must reuse approved Academy image "+id);
   views++;
  }
 }
 if(Object.keys(sourceCards).length!==3)throw Error("Expected three pitot-static source cards");
 return Object.freeze({moduleId:"instruments",cases:4,pictureViews:views,sourceCards:3,
  status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:REVISION});
}
const api=Object.freeze({REVISION,cases,sourceCards,get,evaluate,sourceCard,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAInstrumentPractical=api;
})(typeof window!=="undefined"?window:null);
