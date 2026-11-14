/* Course 03: original-illustration aerodynamics reasoning, independent
 * self-study only. Aerodynamic approximations are deliberately constrained
 * to an IDEALISED steady coordinated level turn, not aircraft procedures. */
(function(root){"use strict";
const REVISION="2026-11-14-aerodynamics-practical-v1";
const cases=Object.freeze([
 Object.freeze({
  id:"four-forces",number:1,title:"Identify the four forces of flight",
  pictures:Object.freeze(["overview-02"]),
  observation:"Examine the approved airfoil-and-airflow illustration. Use it to think about lift as an aerodynamic force, then consider the other forces acting on a powered fixed-wing aircraft in straight, unaccelerated flight.",
  question:"Which list names the four forces normally introduced in aeroplane flight theory?",
  options:Object.freeze([
   "Lift, bank, pitch and yaw",
   "Lift, weight, thrust and drag",
   "Air pressure, temperature, altitude and heading"
  ]),answer:1,
  explanation:"Lift is the aerodynamic force perpendicular to the relative airflow, weight acts through the centre of gravity, thrust comes from propulsion, and drag opposes motion relative to the surrounding air. A simple four-arrow diagram assumes a particular flight condition; in other conditions the directions and components require more care.",
  key:Object.freeze([
   ["Lift","Aerodynamic force component perpendicular to the relative airflow"],
   ["Weight","Gravitational force acting toward Earth"],
   ["Thrust","Propulsive force supplied by the propulsion system"],
   ["Drag","Aerodynamic force component opposite relative motion through air"]
  ]),
  scouts:"Air Scouts: name all four forces and point to the airflow over the illustrated wing.",
  pilots:"Aspiring pilots: explain why force balance cannot be inferred from the four arrow lengths in an uncalibrated picture."
 }),
 Object.freeze({
  id:"angle-of-attack",number:2,title:"Understand angle of attack",
  pictures:Object.freeze(["detail-02"]),
  observation:"Inspect the original illustrated wing section and relative airflow. Imagine a line from its leading edge to trailing edge (the wing chord) and compare that line with the direction of the relative airflow.",
  question:"What defines a wing's angle of attack?",
  options:Object.freeze([
   "The angle between the horizon and the aircraft's nose",
   "The angle between the runway and the wingtip",
   "The angle between the wing's reference chord and relative airflow"
  ]),answer:2,
  explanation:"Angle of attack is defined using a wing chord reference and relative airflow. Pitch attitude is measured relative to a horizon or other reference and is not the same measurement. An aircraft can have significant angle of attack in a variety of pitch attitudes and flight paths.",
  key:Object.freeze([
   ["Chord line","Reference straight line from a wing-section leading edge to trailing edge"],
   ["Relative airflow","Air motion seen by the wing, opposite its motion through surrounding air"],
   ["Angle of attack","Angle between the chord reference and the relative airflow"]
  ]),
  scouts:"Air Scouts: draw one chord line and one incoming relative-airflow arrow on a paper wing sketch.",
  pilots:"Aspiring pilots: compare angle of attack with pitch attitude and with the flight-path angle, without assuming any one fixes the other."
 }),
 Object.freeze({
  id:"stall",number:3,title:"Recognise what causes an aerodynamic stall",
  pictures:Object.freeze(["detail-02"]),
  observation:"Revisit the approved airflow panel. Consider two fictional flight conditions with different indicated airspeeds but an increasing wing angle of attack.",
  question:"Which statement is correct for an aerodynamic wing stall?",
  options:Object.freeze([
   "Exceeding the applicable critical angle of attack can stall a wing at different indicated airspeeds.",
   "A stall always means the engine has stopped.",
   "A stall is impossible when an aircraft is moving rapidly."
  ]),answer:0,
  explanation:"The fundamental stall condition is exceeding the wing's critical angle of attack, associated with substantial airflow separation and loss of lift capability. The indicated speed at which this happens varies with weight, load factor and configuration. This conceptual lesson does not specify any aircraft's stall speed or recovery manoeuvre.",
  key:Object.freeze([
   ["Critical angle of attack","Applicable angle at which the wing reaches its maximum lift coefficient for the given configuration"],
   ["Stall","A marked reduction in wing lift capability when the critical angle of attack is exceeded"],
   ["Stall-speed margin","Not a fixed universal value across load factors, configurations and flight conditions"]
  ]),
  scouts:"Air Scouts: explain why an engine failure and an aerodynamic stall are not identical.",
  pilots:"Aspiring pilots: explain why accelerated manoeuvring can increase indicated stall speed even though the stall mechanism remains angle-of-attack related."
 }),
 Object.freeze({
  id:"bank-and-load",number:4,title:"Explore bank angle, load factor and stall-speed relationship",
  pictures:Object.freeze(["cessna-03"]),
  observation:"Use the original three-axes aircraft illustration to locate the roll axis. Compare level turns of different bank angles using the separate idealised classroom model below.",
  question:"In a coordinated constant-altitude turn, increasing bank angle generally means...",
  options:Object.freeze([
   "The wing needs less total lift and the load factor decreases.",
   "The required total lift and load factor increase, raising the indicated stall-speed factor.",
   "The stall-speed factor becomes independent of load factor."
  ]),answer:1,
  explanation:"In the simplified steady coordinated level-turn case, load factor is 1/cos(bank angle) and stall-speed multiplier at unchanged weight and configuration is the square root of load factor. Larger bank angles therefore require more lift to maintain altitude, and the stall-speed multiplier increases. These calculations are illustrative and not flight-plan or aircraft-limit guidance.",
  key:Object.freeze([
   ["Bank angle","The aircraft's rolled attitude relative to the horizon in this idealised turn"],
   ["Load factor","Total aerodynamic load relative to the aircraft weight; 1 g in the idealised wings-level level case"],
   ["Speed multiplier","Square root of load factor for the same aircraft weight and configuration in the simplified model"]
  ]),
  scouts:"Air Scouts: move the classroom slider and describe how the two bar readings change without attempting the manoeuvre.",
  pilots:"Aspiring pilots: connect a greater bank angle in a steady level turn to a higher load factor; do not transfer the example to a real flight without approved training."
 })
]);
function get(id){return cases.find(x=>x.id===id)||null}
function evaluate(id,choice){
 const c=get(id);
 if(!c||!Number.isInteger(choice)||choice<0||choice>=c.options.length)
  throw Error("Select one aerodynamics response");
 return Object.freeze({id,correct:choice===c.answer,expected:c.options[c.answer],explanation:c.explanation,key:c.key});
}
function levelTurn(angle){
 if(!Number.isInteger(angle)||angle<0||angle>60||angle%5!==0)
  throw Error("Choose an idealised 0–60 degree bank in five-degree steps");
 const factor=1/Math.cos(angle*Math.PI/180);
 const multiplier=Math.sqrt(factor);
 return Object.freeze({angle,loadFactor:Number(factor.toFixed(3)),
  speedMultiplier:Number(multiplier.toFixed(3)),
  relativeIncreasePercent:Number(((multiplier-1)*100).toFixed(1)),
  caution:"Simplified steady coordinated constant-altitude turn, unchanged weight and configuration. Not an aircraft flight limit, target bank or operational stall-speed calculation."});
}
function validate(atlas){
 if(cases.length!==4||new Set(cases.map(x=>x.id)).size!==4)
  throw Error("The aerodynamics practical requires four distinct picture exercises");
 let pictureViews=0;
 for(const c of cases){
  if(c.options.length!==3||!Number.isInteger(c.answer)||c.answer<0||c.answer>2||
   c.observation.length<120||c.explanation.length<190||c.key.length<3||
   !c.scouts||!c.pilots)throw Error("Incomplete Course 03 case: "+c.id);
  for(const id of c.pictures){
   const asset=atlas?.getById(id);
   if(!asset||!["overview","detailed","cessna"].includes(asset.group))
    throw Error("Course 03 requires original-approved source imagery: "+id);
   pictureViews++;
  }
 }
 return Object.freeze({moduleId:"aerodynamics",cases:4,pictureViews,
  status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:REVISION});
}
const api=Object.freeze({REVISION,cases,get,evaluate,levelTurn,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAAerodynamicsPractical=api;
})(typeof window!=="undefined"?window:null);
