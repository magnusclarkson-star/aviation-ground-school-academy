/* Course 07 — picture-led fictional navigation practice, not an operational
 * route planner. No real airspace, current chart or clearance is represented. */
(function(root){"use strict";
const REVISION="2026-11-14-navigation-practical-v1";
const cases=Object.freeze([
 Object.freeze({
  id:"chart-reading",number:1,title:"Read an illustrated chart and position reference",
  pictures:Object.freeze(["overview-05","detail-05"]),
  situation:"Inspect the two existing Academy chart-style illustrations. Imagine a separate fictional training map with point A west of point B; the drawn routes and symbols do not represent current Sierra Leone aeronautical information.",
  question:"Which information is essential before using a real aeronautical chart for flight planning?",
  options:Object.freeze([
   "Only its colour scheme and the aircraft's paintwork.",
   "The chart's currency, coordinate and direction references, units, airspace information and applicable official publications.",
   "A visually straight line, regardless of controlled airspace or terrain."
  ]),answer:1,
  explanation:"Latitude and longitude provide a geographic position, while chart projections, scales and true/magnetic references affect how locations and directions are read. Current official publications and notices establish airspace, obstacles, procedures and restrictions. An attractive educational chart cannot confirm real boundaries, altitude limits or permission to fly.",
  key:Object.freeze([
   ["Latitude / longitude","Angular coordinate references for geographic position"],
   ["True north","Geographic direction reference"],
   ["Magnetic reference","Direction tied to Earth's magnetic field, varying by place and time"],
   ["Scale and units","The basis for interpreting distances and symbols on an actual chart"],
   ["Chart validity","Edition, effective date and current accompanying aeronautical information"]
  ]),
  scouts:"Air Scouts: locate north, identify the two fictional landmarks and explain why the picture alone is not an approved chart.",
  pilots:"Aspiring pilots: identify what requires an effective-date check, a current AIP/chart/NOTAM and the correct geographic/magnetic reference."
 }),
 Object.freeze({
  id:"wind-triangle",number:2,title:"Compare heading, track and wind drift",
  pictures:Object.freeze(["overview-05"]),
  situation:"Use the imaginary straight eastbound route from Training Point A to B. Explore how the direction an aircraft points (heading) can differ from its desired direction over the ground (track). The model is wind-triangle arithmetic only, not a flight-control instruction.",
  question:"What can cause heading and ground track to differ in otherwise steady flight?",
  options:Object.freeze([
   "The colour of the route on a moving map.",
   "A different font on a heading display.",
   "A crosswind, which changes the ground-motion direction relative to the aircraft's nose."
  ]),answer:2,
  explanation:"Heading is where the nose is pointing relative to a defined directional reference. Track is the direction of movement over Earth. With crosswind, an idealised constant-velocity wind triangle shows a different heading needed to maintain a desired track. Actual headings also require reference correction, aircraft performance and conditions that this public teaching model does not address.",
  key:Object.freeze([
   ["True heading","Direction the aircraft nose points, relative to true north"],
   ["Ground track","Direction of movement across Earth's surface"],
   ["Wind from","Meteorological direction from which the wind blows"],
   ["Drift / correction","Conceptual difference between desired track and heading in a steady wind"],
   ["Groundspeed","Rate of travel relative to the ground"]
  ]),
  scouts:"Air Scouts: compare the blue ground-track arrow and gold heading arrow on the fictional map with your instructor.",
  pilots:"Aspiring pilots: distinguish wind FROM versus wind TO and explain why a true heading in a classroom sketch is not automatically a magnetic compass heading."
 }),
 Object.freeze({
  id:"time-distance",number:3,title:"Estimate time using distance and groundspeed",
  pictures:Object.freeze(["detail-12"]),
  situation:"A synthetic chart has a single straight 90-nautical-mile leg between invented Training Points A and B. You may vary the distance and assumed average groundspeed to see how the idealised flight-time estimate changes.",
  question:"In this simplified classroom model, how long is a 90 NM leg at a constant 60 kt groundspeed?",
  options:Object.freeze([
   "90 minutes.",
   "60 minutes.",
   "45 minutes."
  ]),answer:0,
  explanation:"Knots are nautical miles per hour. At constant 60 knots of groundspeed, 90 nautical miles require 90/60 = 1.5 hours or 90 minutes. This omits climb, descent, routing, changing winds, fuel usage, legal reserves, aircraft limits and airspace permissions, and must not be treated as a usable flight plan.",
  key:Object.freeze([
   ["Nautical mile (NM)","Distance unit used in aviation navigation"],
   ["Knot (kt)","One nautical mile per hour"],
   ["Groundspeed","Distance traveled over the ground per unit time"],
   ["Elapsed time","Distance divided by average groundspeed, with consistent units"],
   ["Fuel / reserve planning","Separate aircraft-specific calculation, not derived from this classroom time card"]
  ]),
  scouts:"Air Scouts: work out the fictional time with a calculator and explain what a knot means.",
  pilots:"Aspiring pilots: describe the assumptions and what real-world performance, fuel and wind information must be obtained separately."
 }),
 Object.freeze({
  id:"verification",number:4,title:"Check the limits of a drawn route",
  pictures:Object.freeze(["detail-05","detail-12"]),
  situation:"A fictional moving-map line passes through a shaded training-only area labelled 'permission unknown'. Another learner says a magenta line confirms entry authorisation. The zone and route are not real aviation geography.",
  question:"What should the learner conclude?",
  options:Object.freeze([
   "A drawn line always supersedes actual published airspace rules.",
   "Current authoritative airspace publications and applicable permissions must be verified independently of a drawn route.",
   "A GPS position guarantees obstacle clearance and authorised airspace access."
  ]),answer:1,
  explanation:"A displayed route is not air traffic clearance, an airspace approval, an obstacle-clearance calculation or an assurance of the accuracy/currency of a database. Authoritative State aeronautical information, notices, terrain, weather, communications and applicable rules remain separate considerations. Learners should record the uncertainty and seek qualified instruction instead of acting on the fictional diagram.",
  key:Object.freeze([
   ["Route line","Proposed navigation geometry, not permission"],
   ["Airspace limits","Published lateral and vertical boundaries and applicable rules"],
   ["NOTAM / AIP","Official notices and aeronautical information, dependent on jurisdiction"],
   ["Terrain / obstacle","Must be checked with current appropriate sources"],
   ["Alternative / contingency","A planning consideration requiring aircraft- and situation-specific instruction"]
  ]),
  scouts:"Air Scouts: explain why 'permission unknown' means asking the supervising adult rather than assuming it is safe.",
  pilots:"Aspiring pilots: list the current official references and approvals that must be checked before any real operation."
 })
]);
const ROUTE=Object.freeze({from:"Training Point A",to:"Training Point B",trackTrue:90,trueAirspeed:90});
const VALID_WIND_FROM=Object.freeze([0,90,180,270]);
function get(id){return cases.find(c=>c.id===id)||null}
function evaluate(id,choice){
 const c=get(id);
 if(!c||!Number.isInteger(choice)||choice<0||choice>=c.options.length)
  throw Error("Choose one fictional navigation response");
 return Object.freeze({id,correct:choice===c.answer,expected:c.options[c.answer],explanation:c.explanation,key:c.key});
}
function normalizeDirection(deg){return (deg%360+360)%360}
function windTriangle(windFrom,windSpeed){
 if(!VALID_WIND_FROM.includes(windFrom)||!Number.isInteger(windSpeed)||windSpeed<0||windSpeed>25||windSpeed%5!==0)
  throw Error("Choose a fictional cardinal wind direction and 0–25 kt in five-knot increments");
 // Conventional 2-D true-north/East Cartesian component model. Heading is
 // air-relative velocity; wind direction is FROM, so wind motion is opposite.
 const radians=Math.PI/180,theta=ROUTE.trackTrue*radians,wind=windFrom*radians;
 const windEast=-windSpeed*Math.sin(wind),windNorth=-windSpeed*Math.cos(wind);
 const windRight=windEast*Math.cos(theta)-windNorth*Math.sin(theta);
 const windAlong=windEast*Math.sin(theta)+windNorth*Math.cos(theta);
 const correction=Math.asin(-windRight/ROUTE.trueAirspeed)/radians;
 const heading=normalizeDirection(ROUTE.trackTrue+correction);
 const groundspeed=ROUTE.trueAirspeed*Math.cos(correction*radians)+windAlong;
 return Object.freeze({
  windFrom,windSpeed,desiredTrack:ROUTE.trackTrue,
  trueHeading:Number(heading.toFixed(1)),
  correctionDegrees:Number(correction.toFixed(1)),
  groundspeed:Number(groundspeed.toFixed(1)),
  note:"Mathematical steady-wind, level-route teaching example only. All angles are TRUE, not magnetic; TAS fixed at 90 kt. Not approved flight planning or a recommended manoeuvre."
 });
}
function timeEstimate(distanceNM,groundspeedKT){
 if(!Number.isInteger(distanceNM)||distanceNM<45||distanceNM>120||distanceNM%15!==0||
    !Number.isInteger(groundspeedKT)||groundspeedKT<60||groundspeedKT>120||groundspeedKT%15!==0)
  throw Error("Choose fictional distance 45–120 NM and groundspeed 60–120 kt in 15-unit steps");
 const minutes=distanceNM/groundspeedKT*60;
 return Object.freeze({distanceNM,groundspeedKT,minutes:Number(minutes.toFixed(1)),
  note:"Constant average groundspeed only. This does not compute aircraft fuel, reserve, airspace clearance, terrain, weather or a usable flight plan."});
}
function validate(atlas){
 if(cases.length!==4||new Set(cases.map(c=>c.id)).size!==4)
  throw Error("Course 07 requires four distinct pictorial navigation cases");
 let views=0;
 for(const c of cases){
  if(c.options.length!==3||!Number.isInteger(c.answer)||c.answer<0||c.answer>2||
   c.situation.length<130||c.explanation.length<240||c.key.length<4||!c.scouts||!c.pilots)
   throw Error("Incomplete conceptual navigation case "+c.id);
  for(const id of c.pictures){
   const image=atlas?.getById(id);
   if(!image||!["overview","detailed"].includes(image.group))
    throw Error("Course 07 must use existing approved chart pictures: "+id);
   views++;
  }
 }
 if(Math.abs(windTriangle(0,0).trueHeading-90)>.1||timeEstimate(90,60).minutes!==90)
  throw Error("Fictional arithmetic examples are inconsistent");
 return Object.freeze({moduleId:"navigation",cases:4,pictureViews:views,calculators:2,
  status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:REVISION});
}
const api=Object.freeze({REVISION,cases,ROUTE,VALID_WIND_FROM,get,evaluate,windTriangle,timeEstimate,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSANavigationPractical=api;
})(typeof window!=="undefined"?window:null);
