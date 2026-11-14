/* Course 04 aircraft systems: original-picture classroom exercises.
 * Conceptual diagrams and synthetic fault descriptions only: no real
 * maintenance, live troubleshooting, start, reset or flight procedures. */
(function(root){"use strict";
const REVISION="2026-11-14-aircraft-systems-practical-v1";
const cases=Object.freeze([
 Object.freeze({
  id:"propulsion",number:1,title:"Trace stored energy into propulsion",
  pictures:Object.freeze(["overview-07"]),
  observation:"Inspect the approved aircraft systems cutaway. Identify the powerplant and explain how stored energy can become shaft power or thrust. The picture is conceptual; it is not a serviceable system diagram.",
  question:"Which description best compares common aircraft propulsion systems?",
  options:Object.freeze([
   "A piston engine may turn a propeller, while jet engines generate thrust by accelerating a stream of air.",
   "All aircraft generate propulsion through an electrical bus alone.",
   "A helicopter cyclic control is a fuel pump."
  ]),answer:0,
  explanation:"A piston engine converts fuel energy into shaft work that can drive a propeller. A gas-turbine jet can produce thrust through accelerated airflow; turbine engines can also deliver shaft power. Helicopter rotor systems may receive engine shaft power through a transmission. Actual architecture varies greatly by type.",
  key:Object.freeze([
   ["Energy source","Fuel or electrical storage, depending on aircraft design"],
   ["Powerplant","Converts supplied energy into shaft work or propulsive output"],
   ["Propeller / rotor","Rotating aerodynamic device coupled to its own drive system"],
   ["Thrust","Propulsive force; the mechanism varies among aircraft types"]
  ]),
  scouts:"Air Scouts: point to the illustrated powerplant and describe the difference between energy stored and useful thrust.",
  pilots:"Enthusiasts and pilots: compare the principle of a piston-propeller drive with a turbine-powered rotor without borrowing a real operating checklist."
 }),
 Object.freeze({
  id:"fuel",number:2,title:"Follow a conceptual fuel supply path",
  pictures:Object.freeze(["detail-06"]),
  observation:"Use the approved systems illustration and the simplified flow cards below. Describe the purpose of the tank, selected supply path, filtration and engine fuel delivery; the sequence is only a teaching model.",
  question:"In a simplified fuel-system functional diagram, what is the fuel tank's primary role?",
  options:Object.freeze([
   "It generates aircraft electrical power.",
   "It stores fuel for delivery through an appropriate aircraft-specific supply system.",
   "It measures the aircraft's indicated airspeed."
  ]),answer:1,
  explanation:"The fuel tank stores fuel. Actual supply routes may include vents, pumps, valves, filters, selectors, metering and monitoring elements. Their sequence, redundancy and limitations depend on the aircraft. This illustration does not justify operating any valve, pump, engine or aircraft.",
  key:Object.freeze([
   ["Fuel tank","Stores fuel, subject to design-specific quantity and venting arrangements"],
   ["Fuel distribution","Conceptual aircraft-specific route through appropriate controls and protection"],
   ["Engine fuel delivery","Provides properly managed fuel to the powerplant"],
   ["Indication","A gauge reports a measurement; its reading alone cannot prove the entire path healthy"]
  ]),
  scouts:"Air Scouts: trace the arrows on the teaching cards from storage towards the engine.",
  pilots:"Enthusiasts and pilots: identify what the generic block diagram omits and why approved type-specific documents are necessary."
 }),
 Object.freeze({
  id:"electrical",number:3,title:"Explore electrical sources and a shared bus",
  pictures:Object.freeze(["detail-06"]),
  observation:"Study the Academy's existing electrical-panel illustration and the selectable diagrams below. Compare two fictional displays with a shared electrical bus against a classroom picture with separate supply paths.",
  question:"If two fictional displays depend on one common electrical bus, which statement is most sound?",
  options:Object.freeze([
   "Two displays necessarily prove two independent power supplies.",
   "A single battery-voltage indication verifies the internal condition of every display.",
   "A common bus can be a shared point of dependency for both displays."
  ]),answer:2,
  explanation:"Electrical sources, protective devices, distribution buses, wiring and end equipment form an interconnected architecture. Two displays wired to one bus may share a common-cause power vulnerability. Separate depicted supplies reduce that specific shared dependency but do not demonstrate true system independence or reliability.",
  key:Object.freeze([
   ["Alternator / generator","Converts mechanical rotation into electrical power in many aircraft"],
   ["Battery","Stores energy and may supply selected aircraft circuits depending on design"],
   ["Electrical bus","Distribution point supplying protected circuits"],
   ["Common-cause dependency","One shared component or path whose loss may affect more than one downstream item"]
  ]),
  scouts:"Air Scouts: compare what is shared by the two blue displays in each fictional wiring picture.",
  pilots:"Enthusiasts and pilots: explain why a dark display or changing voltage does not identify the failed component without type-specific evidence."
 }),
 Object.freeze({
  id:"hydraulic",number:4,title:"Identify hydraulic functions and reporting boundaries",
  pictures:Object.freeze(["photo-04","overview-07"]),
  observation:"Look at the approved avionics-maintenance scene and systems artwork. The classroom scenario describes a fictional landing-gear status indication that differs from a separate classroom diagram; the photograph does not show or prove that defect.",
  question:"What should a student conclude from a fictional conflicting gear indication?",
  options:Object.freeze([
   "The gear is safe because a hydraulic actuator exists.",
   "The discrepancy needs factual recording and review under approved type-specific procedures by authorised personnel.",
   "The student should open a hydraulic line to confirm the pressure."
  ]),answer:1,
  explanation:"Hydraulic fluid pressure may move actuators for gear, brakes or controls on some aircraft. Indications, electrical controls, mechanical locks and other systems may interact. A display disagreement alone cannot confirm the actual landing-gear state or its cause. Classroom learners should record the apparent discrepancy and seek qualified, authorised review, not conduct aircraft maintenance.",
  key:Object.freeze([
   ["Hydraulic pressure","A means to transmit power through a fluid"],
   ["Actuator","Converts fluid power into mechanical movement in applicable designs"],
   ["Gear indication","An observed signal or measurement, not proof of system health by itself"],
   ["Maintenance authority","Approved aircraft data, safety precautions and appropriately authorised staff"]
  ]),
  scouts:"Air Scouts: describe what the fictional indicator shows without making up a cause or touching the aircraft.",
  pilots:"Enthusiasts and pilots: distinguish an indication, a hypothesised fault and the evidence required by approved type-specific procedures."
 })
]);
const blockDiagrams=Object.freeze({
 fuel:Object.freeze({title:"Fictional functional fuel path",nodes:Object.freeze(["Fuel storage","Type-specific distribution","Fuel delivery to engine"]),note:"Functions only. Actual valves, pumps, filters, redundancy and operating sequences differ by aircraft."}),
 electricalShared:Object.freeze({title:"Fictional architecture A — shared supply",nodes:Object.freeze(["Generation / battery","One common bus","Display A + Display B"]),note:"The two displays depend on a pictured shared distribution point. No fault or serviceability is inferred."}),
 electricalSeparate:Object.freeze({title:"Fictional architecture B — separate paths",nodes:Object.freeze(["Source / bus A → Display A","Source / bus B → Display B"]),note:"Separate pictured paths remove the one illustrated common bus, not all possible common-cause failures."}),
 hydraulic:Object.freeze({title:"Fictional functional hydraulic path",nodes:Object.freeze(["Fluid power source","Distribution / control","Actuator movement"]),note:"Block-level functions only. No service pressure, component setting, maintenance action or emergency procedure is supplied."})
});
function get(id){return cases.find(x=>x.id===id)||null}
function evaluate(id,answer){
 const item=get(id);
 if(!item||!Number.isInteger(answer)||answer<0||answer>=item.options.length)
  throw Error("Choose a fictional aircraft-systems response");
 return Object.freeze({id,correct:answer===item.answer,answer:item.options[item.answer],
  explanation:item.explanation,key:item.key});
}
function diagram(mode){
 const d=blockDiagrams[mode];
 if(!d)throw Error("Unknown classroom systems diagram");
 return d;
}
function validate(atlas){
 if(cases.length!==4||new Set(cases.map(c=>c.id)).size!==4)
  throw Error("Four distinct aircraft-systems cases required");
 let views=0;
 for(const c of cases){
  if(c.options.length!==3||!Number.isInteger(c.answer)||c.answer<0||c.answer>2||
   c.observation.length<140||c.explanation.length<210||c.key.length!==4||
   !c.scouts||!c.pilots)throw Error("Incomplete aircraft systems classroom case: "+c.id);
  for(const id of c.pictures){
   const picture=atlas?.getById(id);
   if(!picture||!["overview","detailed","photographs"].includes(picture.group))
    throw Error("Only owner-approved systems pictures may be referenced: "+id);
   views++;
  }
 }
 if(Object.keys(blockDiagrams).length!==4)throw Error("Four conceptual systems diagrams expected");
 for(const d of Object.values(blockDiagrams))
  if(d.nodes.length<2||d.note.length<50)throw Error("Systems diagram lacks safety boundary");
 return Object.freeze({moduleId:"systems",cases:4,pictureViews:views,diagrams:4,
  status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:REVISION});
}
const api=Object.freeze({REVISION,cases,blockDiagrams,get,evaluate,diagram,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAAircraftSystemsPractical=api;
})(typeof window!=="undefined"?window:null);
