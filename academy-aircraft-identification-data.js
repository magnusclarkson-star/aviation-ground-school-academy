/* Course 02 original-picture aircraft identification and controls practice.
 * All images are existing approved Academy atlas crops. No aircraft/model edits.
 * Self-study only; reviewer sign-off and verified exams remain separate. */
(function(root){"use strict";
const REVISION="2026-11-14-aircraft-practical-v1";
const cases=Object.freeze([
 Object.freeze({
  id:"airframe",number:1,title:"Identify the major airframe assemblies",
  pictures:Object.freeze(["cessna-01"]),
  observation:"Inspect the original high-wing trainer illustration. Trace where the wings attach to the fuselage, locate the tail assembly and find the landing gear.",
  question:"Which group correctly identifies the main assemblies of this conventional aeroplane?",
  options:Object.freeze([
   "Rotors, collective, anti-torque system and skids only",
   "Fuselage, wings, empennage and landing gear",
   "Radios, altimeter, compass and seat belts"
  ]),answer:1,
  explanation:"The fuselage connects and accommodates major items; wings provide lift in normal fixed-wing flight; the empennage is the conventional tail assembly; the landing gear supports the aircraft on the ground.",
  visualKey:Object.freeze([
   ["Fuselage","Main body connecting wings, tail, cabin and equipment"],
   ["Wing","Fixed lifting surface on the depicted trainer"],
   ["Empennage","Conventional tail assembly, including stabilising and control elements"],
   ["Landing gear","Supporting structure for ground contact"]
  ]),
  scouts:"Air Scouts: point out each assembly in the picture, then explain which one connects the other structures.",
  pilots:"Aspiring pilots: distinguish structural assemblies from cockpit instruments and flight control inputs."
 }),
 Object.freeze({
  id:"surfaces",number:2,title:"Match control surfaces to their functions",
  pictures:Object.freeze(["cessna-02"]),
  observation:"Examine the approved close-up picture of control surfaces. Compare the outboard aileron, trailing-edge flap, elevator and rudder in a conventional trainer.",
  question:"Which conventional surface-to-function statement is correct?",
  options:Object.freeze([
   "Ailerons mainly control roll, elevators command pitch and the rudder commands yaw.",
   "Flaps are the primary steering control for yaw and elevators extend the landing gear.",
   "The rudder primarily changes altitude and ailerons set engine thrust."
  ]),answer:0,
  explanation:"In a conventional aeroplane ailerons normally generate a rolling moment, the elevator changes pitching moment, and the rudder changes yawing moment. Flaps alter wing configuration and aerodynamic characteristics; they are not the primary yaw control.",
  visualKey:Object.freeze([
   ["Aileron","Outboard wing trailing-edge roll control in many conventional trainers"],
   ["Elevator","Horizontal tail control producing a pitching moment"],
   ["Rudder","Vertical tail control producing a yawing moment"],
   ["Flap","High-lift/configuration surface; not the aircraft steering rudder"]
  ]),
  scouts:"Air Scouts: point at the correct pictured surfaces before reading the explanation.",
  pilots:"Aspiring pilots: distinguish the purpose of a conventional primary control surface from a high-lift device."
 }),
 Object.freeze({
  id:"axes",number:3,title:"Understand roll, pitch and yaw",
  pictures:Object.freeze(["cessna-03"]),
  observation:"Study the approved three-axis aircraft movement illustration. Imagine a model aeroplane rotating around each axis, one at a time.",
  question:"Which description correctly matches aircraft movement to its axis?",
  options:Object.freeze([
   "Roll is nose up/down; pitch is nose left/right; yaw is wingtip up/down.",
   "Roll, pitch and yaw are different names for a climb.",
   "Roll tilts the wings, pitch moves the nose up/down and yaw turns the nose left/right."
  ]),answer:2,
  explanation:"Roll is rotation about the aircraft's longitudinal axis; pitch about its lateral axis; yaw about its vertical axis. A control input can create secondary effects, so the axis description is the starting point rather than a complete flight-dynamics model.",
  visualKey:Object.freeze([
   ["Longitudinal axis","Nose to tail — roll"],
   ["Lateral axis","Wingtip to wingtip — pitch"],
   ["Vertical axis","Top to bottom — yaw"]
  ]),
  scouts:"Air Scouts: use a paper model and gently demonstrate each axis while describing the movement.",
  pilots:"Aspiring pilots: explain why a banked aircraft's heading may change over time even though bank and yaw are not the same rotation."
 }),
 Object.freeze({
  id:"rotorcraft",number:4,title:"Compare fixed-wing and rotorcraft configurations",
  pictures:Object.freeze(["cessna-01","overview-10"]),
  observation:"Compare the high-wing trainer picture with the original helicopter rotor-and-controls illustration. The two vehicles generate and control lift in different ways.",
  question:"What is the most accurate general comparison?",
  options:Object.freeze([
   "A helicopter uses a fixed wing as its only source of lift and normally has ailerons at the rotor tips.",
   "A conventional trainer has fixed wings; a helicopter's powered rotor generates lift, with rotorcraft-specific controls.",
   "Both aircraft have the same engine, primary controls and approved operating procedures."
  ]),answer:1,
  explanation:"A conventional fixed-wing trainer uses wings moving through air for its main lift, while a helicopter uses rotating blades. A conventional single-main-rotor helicopter also uses cyclic, collective and anti-torque control arrangements. Real aircraft handling and limitations require type-specific qualified instruction.",
  visualKey:Object.freeze([
   ["Aeroplane wing","Fixed lifting surface — not a helicopter main rotor"],
   ["Main rotor","Rotating lifting and control system on the helicopter"],
   ["Cyclic","Changes rotor-disc orientation through the rotor control system"],
   ["Collective","Changes blade pitch collectively in typical helicopter systems"]
  ]),
  scouts:"Air Scouts: identify one visible structural difference without attempting to operate either aircraft.",
  pilots:"Aspiring pilots: avoid applying fixed-wing control and performance assumptions to the R44."
 })
]);
function get(id){return cases.find(x=>x.id===id)||null}
function evaluate(id,choice){
 const c=get(id);
 if(!c||!Number.isInteger(choice)||choice<0||choice>=c.options.length)
  throw Error("Select one aircraft identification response");
 return Object.freeze({id,correct:choice===c.answer,correctIndex:c.answer,
  expected:c.options[c.answer],explanation:c.explanation,visualKey:c.visualKey});
}
function validate(atlas){
 if(cases.length!==4||new Set(cases.map(x=>x.id)).size!==4)
  throw Error("Aircraft identification practical requires exactly four distinct activities");
 let pictures=0;
 for(const c of cases){
  if(c.options.length!==3||!Number.isInteger(c.answer)||c.answer<0||c.answer>2||
   c.observation.length<95||c.explanation.length<135||c.visualKey.length<3||
   !c.scouts||!c.pilots)throw Error("Incomplete aircraft teaching case "+c.id);
  for(const id of c.pictures){
   const item=atlas?.getById(id);
   if(!item||!["cessna","overview"].includes(item.group))throw Error("Only approved aircraft illustrations permitted: "+id);
   pictures++;
  }
 }
 return Object.freeze({moduleId:"aircraft",cases:4,sourcePictureViews:pictures,
  status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:REVISION});
}
const api=Object.freeze({REVISION,cases,get,evaluate,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAAircraftStructurePractical=api;
})(typeof window!=="undefined"?window:null);
