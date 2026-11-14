/* Course 12: picture-led helicopter concepts and R44 familiarisation.
 * Educational concepts only; original Academy pictures, no aircraft model changes. */
(function(root){"use strict";
const REVISION="2026-11-14-rotorcraft-practical-v1";
const cases=Object.freeze([
 Object.freeze({
  id:"controls",number:1,title:"Identify the helicopter controls",
  pictures:Object.freeze(["detail-10","overview-10"]),
  situation:"An Air Scout points to the collective, cyclic and pedals on an illustrated helicopter teaching sheet. Each control has a different primary purpose, yet a real helicopter responds to combinations of inputs rather than a single isolated movement.",
  question:"Which pairing correctly explains the primary role of helicopter controls?",
  options:Object.freeze(["Collective changes main-rotor blade pitch together; cyclic changes rotor-disc control forces; pedals manage yaw.","Collective only turns the nose; pedals only move the aircraft forward.","Cyclic opens the cabin doors; collective operates the radio."]),
  answer:0,
  explanation:"Collective changes the pitch of main-rotor blades collectively, changing rotor thrust and the power required. Cyclic changes blade pitch around the rotation to redirect the rotor system's aerodynamic force. In a conventional single-main-rotor helicopter, anti-torque pedals change tail-rotor thrust to manage yaw. The R44 has interconnected power and rotor governing arrangements; these cards are concepts, not manipulation instructions.",
  scouts:"Air Scouts: name the three main controls and describe one general purpose for each.",
  pilots:"Aspiring helicopter pilots: explain why each input can affect other aircraft responses and requires coordinated instruction.",
  key:Object.freeze([["Collective","Overall main-rotor blade pitch"],["Cyclic","Cyclic blade-pitch variation and rotor-disc control"],["Anti-torque pedals","Yaw control through tail-rotor thrust"],["Throttle/governor","Engine/rotor speed management depends on type and configuration"]])
 }),
 Object.freeze({
  id:"hover",number:2,title:"Understand hover awareness",
  pictures:Object.freeze(["overview-10"]),
  situation:"A simulated helicopter appears nearly stationary over a marked landing area. A gust, increased load or high density altitude can change how much attention and performance margin the exercise appears to require, even when the scenery seems to be barely moving.",
  question:"What is the soundest interpretation of a stationary-looking hover?",
  options:Object.freeze(["A stationary picture proves ample power is available.","Hovering still involves continuous control coordination, wind awareness and performance limitations.","Hovering removes the need to monitor surrounding hazards."]),
  answer:1,
  explanation:"A hover is a demanding equilibrium, not a hands-off state. Wind can shift drift and heading demands; load and density altitude affect performance margins. The real pilot must use the applicable flight manual, current conditions and qualified supervision. A static teaching drawing cannot provide a valid hover-performance determination.",
  scouts:"Air Scouts: explain why the ground reference may seem still while the pilot remains busy.",
  pilots:"Aspiring helicopter pilots: distinguish visual drift awareness from an actual hover power-availability assessment.",
  key:Object.freeze([["Hover","Flight with little movement relative to a ground reference"],["Drift","Unintended movement relative to the reference"],["Wind","Air movement influencing aircraft handling"],["Power margin","Available versus required power, checked with actual data"]])
 }),
 Object.freeze({
  id:"transition",number:3,title:"Compare hover and forward flight",
  pictures:Object.freeze(["detail-10"]),
  situation:"Three classroom drawings show a helicopter above a helipad, moving away from the pad, and travelling through the air. The learner must recognise that airflow through the rotor changes with movement, but no single drawing identifies the aircraft's exact speed or safe operating state.",
  question:"Which statement best describes translating flight?",
  options:Object.freeze(["Rotor airflow stays identical to that in a stationary hover.","A generic picture establishes the correct transition speed for every R44.","As forward motion develops, rotor inflow and efficiency can change; type-specific limits and conditions still matter."]),
  answer:2,
  explanation:"During transition, the rotor encounters a changing airflow environment, including the benefit of effective translational lift. This concept is not an instruction to use a fixed speed or pitch setting. Actual helicopter performance and behaviour depend on configuration, gross weight, wind, density altitude and flight-manual requirements.",
  scouts:"Air Scouts: compare the relative movement of the aircraft and the helipad across three pictures.",
  pilots:"Aspiring helicopter pilots: discuss effective translational lift without treating an illustration as an airspeed reference.",
  key:Object.freeze([["Rotor inflow","Airflow through the rotor disc"],["Transition","Movement between hover and forward flight"],["Translational lift","Rotor efficiency changes as airflow becomes more horizontal and organised"],["Flight envelope","Actual type-specific approved operating limitations"]])
 }),
 Object.freeze({
  id:"r44-sources",number:4,title:"Find the right R44 safety information",
  pictures:Object.freeze(["overview-10","detail-10"]),
  situation:"A student sees a convincing R44 cockpit illustration but wants to know the limits, approved procedures and new safety notices for a particular training helicopter. The illustration, the operator's aircraft records and the manufacturer's current publications serve different purposes.",
  question:"Which is the appropriate starting point for authoritative R44 operating information?",
  options:Object.freeze(["Assume any internet simulator displays current R44 limits.","Use the applicable current R44 Pilot's Operating Handbook and supplements, safety notices, and qualified operator or instructor guidance.","Use the Academy picture's instrument needle positions as approved performance data."]),
  answer:1,
  explanation:"The current approved flight manual and applicable supplements define type- and aircraft-specific operating information; Robinson's safety notices and other current publications add important safety context. Qualified instruction and the actual aircraft's configuration remain essential. The Academy diagram is suitable for familiarisation only, never for extracting operating numbers or emergency procedures.",
  scouts:"Air Scouts: identify why a teaching illustration and an official flight manual are different sources.",
  pilots:"Aspiring helicopter pilots: distinguish a POH limitation, an R44 safety notice and a classroom concept before supervised instruction.",
  key:Object.freeze([["POH","Pilot's Operating Handbook and the applicable flight manual material"],["Supplement","Additional approved information for fitted equipment or configuration"],["Safety notice","Manufacturer's safety information to check for currency"],["Instructor","Type-appropriate qualified teaching and supervision"]])
 })
]);
const CONTROLS=Object.freeze([
 Object.freeze({id:"collective",label:"Collective",effect:"Changes the main rotor blades' overall pitch together, affecting rotor thrust and power demand.",cue:"Think: overall blade pitch, not a simple altitude button."}),
 Object.freeze({id:"cyclic",label:"Cyclic",effect:"Varies main rotor blade pitch around each revolution to redirect the rotor system's aerodynamic force.",cue:"Think: disc orientation and movement, not a direct joystick translation."}),
 Object.freeze({id:"pedals",label:"Anti-torque pedals",effect:"On an R44-style conventional tail-rotor helicopter, change tail-rotor thrust and influence yaw.",cue:"Think: nose direction; coordination still matters."}),
 Object.freeze({id:"power",label:"Throttle / governor",effect:"Related to engine and rotor speed management; arrangements vary by helicopter and configuration.",cue:"Think: engine/rotor speed management. Do not infer a procedure."})
]);
const HOVER_FACTORS=Object.freeze([
 Object.freeze({id:"wind",label:"Wind & gusts",cue:"Watch changing drift, relative wind and surroundings. A still image cannot describe the wind."}),
 Object.freeze({id:"load",label:"Aircraft mass",cue:"Loading changes required rotor thrust and may reduce performance margins."}),
 Object.freeze({id:"density",label:"Density altitude",cue:"Hot, high or lower-density conditions can impair helicopter performance; consult real data."})
]);
const PHASES=Object.freeze([
 Object.freeze({id:"hover",label:"Hover",relative:"Near the ground reference",cue:"Rotor works in a hover airflow regime; attention to reference, drift and available power remains essential."}),
 Object.freeze({id:"transition",label:"Transition",relative:"Moving relative to the ground",cue:"Airflow through the rotor changes; effective translational lift becomes relevant without implying a universal speed."}),
 Object.freeze({id:"forward",label:"Forward flight",relative:"Clearly translating",cue:"Rotor and airframe effects change with flight condition; do not infer real performance from this card."})
]);
const SOURCES=Object.freeze([
 Object.freeze({id:"poh",label:"R44 POH & applicable supplements",cue:"Use the current applicable aircraft documents to locate approved limitations, systems, procedures and performance.",url:"https://www.robinsonheli.com/publications"}),
 Object.freeze({id:"notice",label:"Robinson safety notices",cue:"Check the manufacturer's current notices, revisions and applicability for the particular aircraft.",url:"https://www.robinsonheli.com/publications"}),
 Object.freeze({id:"instructor",label:"Qualified R44 instructor",cue:"Confirm understanding, suitability and supervised practice with an appropriately qualified instructor.",url:null})
]);
function select(arr,id,name){const item=arr.find(x=>x.id===id);if(!item)throw Error("Unknown "+name+" concept");return item}
function evaluate(id,choice){
 const item=select(cases,id,"rotorcraft lesson");
 if(!Number.isInteger(choice)||choice<0||choice>=item.options.length)throw Error("Choose a valid rotorcraft classroom answer");
 return Object.freeze({correct:choice===item.answer,expected:item.options[item.answer],explanation:item.explanation,key:item.key});
}
function validate(atlas){
 if(cases.length!==4||new Set(cases.map(x=>x.id)).size!==4)throw Error("Four rotorcraft lessons required");
 let pictureViews=0;
 for(const c of cases){
  if(c.options.length!==3||c.answer<0||c.answer>2||c.situation.length<130||c.explanation.length<190||c.key.length!==4||!c.scouts||!c.pilots)
   throw Error("Incomplete rotorcraft lesson "+c.id);
  for(const id of c.pictures){
   const picture=atlas?.getById(id);
   if(!picture||picture.moduleId!=="rotorcraft"||!["overview","detailed"].includes(picture.group))
    throw Error("Use only approved original rotorcraft pictures: "+id);
   pictureViews++;
  }
 }
 if(CONTROLS.length!==4||HOVER_FACTORS.length!==3||PHASES.length!==3||SOURCES.length!==3)throw Error("Incomplete concept cards");
 return Object.freeze({moduleId:"rotorcraft",cases:cases.length,pictureViews,controls:CONTROLS.length,
  hoverFactors:HOVER_FACTORS.length,phases:PHASES.length,sources:SOURCES.length,
  status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:REVISION});
}
const api=Object.freeze({REVISION,cases,CONTROLS,HOVER_FACTORS,PHASES,SOURCES,
 evaluate,control:id=>select(CONTROLS,id,"control"),hover:id=>select(HOVER_FACTORS,id,"hover"),
 phase:id=>select(PHASES,id,"flight phase"),source:id=>select(SOURCES,id,"document source"),validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSARotorcraftPractical=api;
})(typeof window!=="undefined"?window:null);
