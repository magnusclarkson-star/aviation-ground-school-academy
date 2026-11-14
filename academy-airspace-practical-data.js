/* Course 08: airspace, aerodrome and rule-source awareness.
 * All example geometry, signs and zones are FICTIONAL teaching diagrams.
 * Actual State regulations/AIP/NOTAM/current charts always take priority. */
(function(root){"use strict";
const REVISION="2026-11-14-airspace-airports-practical-v1";
const cases=Object.freeze([
 Object.freeze({
  id:"boundaries",number:1,title:"Recognise airspace lateral and vertical limits",
  pictures:Object.freeze(["detail-12","overview-05"]),
  situation:"An invented circular training zone has a drawn horizontal boundary and a stated lower and upper altitude limit. Neither the drawing nor the original Academy pictures represents real Sierra Leone airspace.",
  question:"What must be checked to understand the extent of an actual defined airspace area?",
  options:Object.freeze([
   "Only the colour used to fill the area on a classroom map.",
   "Its published lateral boundary, vertical limits, effective status and applicable State requirements.",
   "Only the aircraft's heading and the size of its navigation display."
  ]),answer:1,
  explanation:"Airspace boundaries describe both a horizontal footprint and a vertical extent. Some designated areas may also vary by status or effective time. Regulatory classification, entry conditions and required services differ by State and operation. A labelled map or a moving-map route does not establish permission. Consult current official AIP, charts, amendments and relevant NOTAMs with qualified instruction.",
  key:Object.freeze([
   ["Lateral boundary","The horizontal extent of a defined airspace area"],
   ["Lower limit","Published floor of an area, with specified datum and units"],
   ["Upper limit","Published ceiling of an area, with specified datum and units"],
   ["Effective status","Published times, activation or other applicability conditions"],
   ["Authority","Applicable State regulations and authoritative current aeronautical information"]
  ]),
  scouts:"Air Scouts: identify the side, top and bottom of the fictional zone with your adult leader.",
  pilots:"Enthusiasts and pilots: identify the need for current horizontal boundaries, vertical reference and effective-status checks."
 }),
 Object.freeze({
  id:"aerodrome",number:2,title:"Understand runway, taxiway, apron and holding position",
  pictures:Object.freeze(["overview-05","photo-02"]),
  situation:"The original airport-related pictures introduce aircraft movement areas. On the separate invented airport diagram, Taxiway A connects an apron to a marked runway holding position. The illustration is not a real aerodrome plan or taxi instruction.",
  question:"At a fictional controlled aerodrome, what does a runway holding-position marking signify?",
  options:Object.freeze([
   "It is merely a recommended photography point for visitors.",
   "It confirms the aircraft already has runway-entry clearance.",
   "It identifies a boundary where runway entry must not be assumed; the applicable authorisation and procedures must be followed."
  ]),answer:2,
  explanation:"A holding-position marking identifies a location where runway access is controlled by applicable aerodrome procedures and authorisations. A familiar layout, aircraft position or a drawn taxi path is not itself a clearance. Runways, taxiways and aprons have distinct purposes and may be subject to special restrictions; local markings and procedures must be checked in current authorised aerodrome information.",
  key:Object.freeze([
   ["Runway","Defined area intended for aircraft takeoff and landing"],
   ["Taxiway","Defined route supporting aircraft ground movement"],
   ["Apron","Area for aircraft parking, loading or servicing activities"],
   ["Runway holding position","Designated protective boundary for which relevant movement authorisation matters"],
   ["Airport chart","Published airport configuration and details, subject to currency and local rules"]
  ]),
  scouts:"Air Scouts: point out the apron, taxiway, holding position and runway on the invented drawing without treating it as a real airport.",
  pilots:"Enthusiasts and pilots: distinguish an illustrated taxi path from a specific clearance and a current aerodrome chart."
 }),
 Object.freeze({
  id:"runways",number:3,title:"Interpret runway numbers and directions",
  pictures:Object.freeze(["overview-05"]),
  situation:"A classroom-only runway is drawn with nominal magnetic directions 090° and 270°, and labelled 09 and 27. These numbers are an idealised pair; actual runway designations and corrections depend on authoritative aerodrome publications.",
  question:"Why are the two opposing ends of this fictional runway labelled 09 and 27?",
  options:Object.freeze([
   "They represent approximate reciprocal magnetic directions 090° and 270° under the usual runway naming convention.",
   "They mean the runway is exactly 9,270 metres long.",
   "They provide an aircraft weight limit in thousands of kilograms."
  ]),answer:0,
  explanation:"Under the common runway numbering convention, a runway designator reflects the magnetic direction viewed from the approach end, rounded to the nearest ten degrees and expressed without its trailing zero. Opposite ends are generally about 180 degrees apart and their designators differ by 18; local official designations must be used, especially where magnetic variation, parallel runways or other applicable rules affect labels.",
  key:Object.freeze([
   ["Runway 09","Nominal landing or takeoff direction approximately 090° magnetic"],
   ["Runway 27","Reciprocal direction approximately 270° magnetic"],
   ["Magnetic bearing","Bearing relative to magnetic north, not automatically true north"],
   ["Published designation","Authoritative local runway name, not derived from a student drawing"],
   ["Parallel suffix","L, C or R may distinguish parallel runway designations where applicable"]
  ]),
  scouts:"Air Scouts: rotate a paper runway sketch 180° and compare 09 with 27.",
  pilots:"Enthusiasts and pilots: state why a nominal runway number cannot replace current magnetic variation and published airport data."
 }),
 Object.freeze({
  id:"authority",number:4,title:"Separate Academy learning from State aviation authority",
  pictures:Object.freeze(["detail-12"]),
  situation:"At a fictional airport briefing, an overseas classroom diagram, an old airport chart and a current State-issued notice conflict about the status of a runway. A classmate claims that passing the Academy quiz is enough to decide which rule applies.",
  question:"Which reference and permission principle is correct?",
  options:Object.freeze([
   "Foreign example rules always override Sierra Leone's current legally applicable documents.",
   "A training quiz gives the learner an authority-issued licence and runway-entry permission.",
   "Check applicable State law and current authoritative publications, including notices, and obtain any required operational authorisation separately."
  ]),answer:2,
  explanation:"The State's applicable aviation rules and authorised aeronautical information govern real operations. International standards influence national frameworks, but a rule illustrated for another State cannot simply be substituted for local requirements. AIP material, amendments, supplements and NOTAMs serve different information roles. Academy self-study practice is not a licence, air traffic clearance, aerodrome permission or proof of airworthiness.",
  key:Object.freeze([
   ["SLCAA","Sierra Leone Civil Aviation Authority: national regulatory context"],
   ["AIP","Aeronautical Information Publication and current amendments"],
   ["NOTAM","Official time-sensitive aeronautical information notice"],
   ["State-specific rule","Binding national legal requirements applicable to the operation"],
   ["ATC authorisation","Where applicable, a specific operational permission; not implied by a lesson or screen"]
  ]),
  scouts:"Air Scouts: ask your adult leader to explain the difference between a rule lesson and an official permission.",
  pilots:"Enthusiasts and pilots: name current official source types and avoid treating a foreign chart or course score as a Sierra Leone flight authorisation."
 })
]);
const airportParts=Object.freeze([
 Object.freeze({id:"apron",title:"Apron",definition:"Invented aircraft parking, loading and servicing area; not a runway or permission to move",kind:"area"}),
 Object.freeze({id:"taxiway",title:"Taxiway A",definition:"Illustrated ground route between apron and holding position; NOT an issued taxi clearance",kind:"route"}),
 Object.freeze({id:"hold",title:"Runway holding position",definition:"Protective boundary on the fictional taxiway. Do not infer runway entry authority from the diagram",kind:"boundary"}),
 Object.freeze({id:"runway",title:"Runway 09 / 27",definition:"Invented reciprocal runway designations only; no real airport geometry or status",kind:"surface"})
]);
const airspaceParts=Object.freeze([
 Object.freeze({id:"lateral",title:"Lateral boundary",definition:"Horizontal footprint; geographic coordinates and source validity needed for a real chart"}),
 Object.freeze({id:"floor",title:"Lower limit / floor",definition:"Published altitude or flight-level lower boundary with its reference and units"}),
 Object.freeze({id:"ceiling",title:"Upper limit / ceiling",definition:"Published altitude or flight-level upper boundary with its reference and units"}),
 Object.freeze({id:"status",title:"Current status / applicability",definition:"Publication effective dates, operational activation and any relevant NOTAM conditions"})
]);
function get(id){return cases.find(c=>c.id===id)||null}
function evaluate(id,choice){
 const c=get(id);
 if(!c||!Number.isInteger(choice)||choice<0||choice>=c.options.length)
  throw Error("Choose one fictional airspace or aerodrome response");
 return Object.freeze({id,correct:choice===c.answer,expected:c.options[c.answer],explanation:c.explanation,key:c.key});
}
function part(group,id){
 const list=group==="airport"?airportParts:group==="airspace"?airspaceParts:null;
 if(!list)throw Error("Unknown fictional diagram group");
 const found=list.find(x=>x.id===id);
 if(!found)throw Error("Unknown fictional diagram part");
 return found;
}
function runway(number){
 if(!Number.isInteger(number)||number<1||number>36)
  throw Error("Select a published-style runway number from 01 to 36");
 return Object.freeze({
  number:String(number).padStart(2,"0"),
  reciprocal:String(((number+17)%36)+1).padStart(2,"0"),
  nominalMagnetic:Number((number*10)%360),
  note:"Classroom convention only. Real runway designation comes from the published aerodrome chart; rounding, parallel suffix and magnetic variation are not solved here."
 });
}
function validate(atlas){
 if(cases.length!==4||new Set(cases.map(c=>c.id)).size!==4)throw Error("Four distinct Course 08 picture cases are required");
 let views=0;
 for(const c of cases){
  if(c.options.length!==3||!Number.isInteger(c.answer)||c.answer<0||c.answer>2||
   c.situation.length<155||c.explanation.length<210||c.key.length<5||
   !c.scouts||!c.pilots)throw Error("Incomplete Course 08 case: "+c.id);
  for(const id of c.pictures){
   const image=atlas?.getById(id);
   if(!image||!["overview","detailed","photographs"].includes(image.group))
    throw Error("Course 08 requires original owner-approved teaching pictures: "+id);
   views++;
  }
 }
 if(airportParts.length!==4||airspaceParts.length!==4||runway(9).reciprocal!=="27"||runway(27).reciprocal!=="09")
  throw Error("Incomplete conceptual airport/airspace diagrams");
 return Object.freeze({moduleId:"airspace",cases:4,pictureViews:views,diagramParts:8,
  status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:REVISION});
}
const api=Object.freeze({REVISION,cases,airportParts,airspaceParts,get,evaluate,part,runway,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAirspaceAirportPractical=api;
})(typeof window!=="undefined"?window:null);
