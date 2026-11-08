/* Academy curriculum metadata: reference pointers and draft teaching objectives.
 * Sources are official publisher landing pages, not content endorsements,
 * an approved syllabus crosswalk, or proof of qualified instructor sign-off.
 */
(function(root){
"use strict";
const sources=Object.freeze({
 phak:{id:"faa-phak",publisher:"FAA",title:"Pilot's Handbook of Aeronautical Knowledge (FAA-H-8083-25C)",
  url:"https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak"},
 afh:{id:"faa-afh",publisher:"FAA",title:"Airplane Flying Handbook (FAA-H-8083-3C)",
  url:"https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook"},
 aim:{id:"faa-aim",publisher:"FAA",title:"Aeronautical Information Manual (AIM)",
  url:"https://www.faa.gov/air_traffic/publications/atpubs/aim_html/index.html"},
 easa:{id:"easa-aircrew",publisher:"EASA",title:"Easy Access Rules for Aircrew",
  url:"https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-aircrew"}
});
const revision="2026-11-08.1";
const entries=[
 {id:"forces",objectives:[
  "Identify lift, weight, thrust and drag using a simple force diagram.",
  "Explain why changes in power or configuration affect more than one force.",
  "Recognise the difference between an illustrative model and real aircraft performance."],
  activity:"Draw four labelled arrows around a fictional aeroplane, then explain each force using your own words.",
  scope:"Concept explanation only; no aircraft performance figures.",
  references:[{source:"phak",topic:"Principles of Flight and Aerodynamics of Flight"}]},
 {id:"instruments",objectives:[
  "Point out pitch and bank indications on a simplified attitude display.",
  "Distinguish indicated airspeed, altitude and vertical-speed information.",
  "Explain why real instrument indications must be cross-checked and verified."],
  activity:"In Cockpit V3, change the simulated pitch and bank; describe how the horizon representation changes.",
  scope:"The Academy's PFD is illustrative and not a qualified navigation display.",
  references:[{source:"phak",topic:"Flight Instruments"}]},
 {id:"controls",objectives:[
  "Identify which primary controls usually affect pitch, roll and yaw.",
  "Distinguish control commands from delayed aerodynamic responses.",
  "Compare yoke and joystick as alternative ways to command the same simplified axes."],
  activity:"Switch between Yoke and Joystick in the Academy cockpit and match each control to a display change.",
  scope:"Not aircraft-specific handling, coordinated-control technique or flight instruction.",
  references:[{source:"phak",topic:"Flight Controls"},{source:"afh",topic:"Basic Flight Maneuvers"}]},
 {id:"flaps",objectives:[
  "Describe how conventional flap extension can influence lift and drag.",
  "Explain the distinction between selected and indicated flap position.",
  "Recognise that flap limits and pitching effects depend on a specific aircraft."],
  activity:"Move the fictional flap selector from 0° to 20° and compare selected position, indicated position and relative drag.",
  scope:"No flap speeds, settings or performance limits for a real aircraft.",
  references:[{source:"phak",topic:"Flight Controls and Aerodynamics"}]},
 {id:"weather",objectives:[
  "Distinguish basic METAR observations from TAF forecasts.",
  "Explain why weather, NOTAMs and local rules are separate preflight inputs.",
  "Recognise that an educational lesson cannot issue a flight go/no-go decision."],
  activity:"Identify whether each sample briefing item describes an observation, forecast, notice or personal decision.",
  scope:"No current weather, flight planning, forecasting or operational decisions.",
  references:[{source:"phak",topic:"Weather Theory and Aviation Weather Services"}]},
 {id:"radio",objectives:[
  "Explain the purpose of the aviation spelling alphabet and callsigns.",
  "Identify why concise transmissions and correct readbacks matter.",
  "Distinguish sample communications exercises from actual ATC instructions."],
  activity:"Practise spelling a fictional callsign aloud and discuss when a qualified instructor would require a readback.",
  scope:"No live frequency, clearance, phraseology authorisation or ATC guidance.",
  references:[{source:"aim",topic:"Air traffic communication procedures"}]},
 {id:"anatomy",objectives:[
  "Identify the fuselage, wings, tail assembly and landing gear.",
  "Describe the broad role of primary control surfaces.",
  "Recognise that engine, electrical and other systems vary by aircraft design."],
  activity:"Label the main components on a generic aeroplane sketch; note what may differ on another aircraft.",
  scope:"Conventional aeroplane introduction; not type-specific systems training.",
  references:[{source:"phak",topic:"Aircraft Construction and Aircraft Systems"}]},
 {id:"preflight",objectives:[
  "List the kinds of information pilots consider before a flight.",
  "Explain the purpose of aircraft-specific inspection procedures.",
  "Identify when official sources, approved aircraft documents and qualified instructors are required."],
  activity:"Sort fictional preparation cards into documents, weather, aircraft, personal readiness and training supervision.",
  scope:"No authorised checklist, airworthiness finding, flight clearance or operational go/no-go advice.",
  references:[{source:"phak",topic:"Aeronautical Decision-Making and Flight Manuals"},{source:"afh",topic:"Ground Operations"}]}
];
const records=Object.freeze(entries.map(entry=>Object.freeze({
 ...entry,version:revision,reviewStatus:"SME_REVIEW_REQUIRED",references:entry.references.map(ref=>{
  const src=sources[ref.source];
  return Object.freeze({id:src.id,publisher:src.publisher,title:src.title,topic:ref.topic,url:src.url});
 })
})));
function get(id){return records.find(entry=>entry.id===id)||null;}
function validate(lessonIds){
 if(!Array.isArray(lessonIds)||lessonIds.length!==records.length)throw Error("Every public lesson requires curriculum metadata");
 const ids=new Set(lessonIds),found=new Set();
 for(const item of records){
  if(!ids.has(item.id)||found.has(item.id))throw Error("Unknown or repeated curriculum lesson "+item.id);
  found.add(item.id);
  if(item.reviewStatus!=="SME_REVIEW_REQUIRED"||!/^2026-11-08\.\d+$/.test(item.version))throw Error("Curriculum publication status must remain draft");
  if(!Array.isArray(item.objectives)||item.objectives.length<3||item.objectives.some(v=>typeof v!=="string"||v.length<25))throw Error("Missing measurable lesson objectives");
  if(typeof item.activity!=="string"||item.activity.length<40||typeof item.scope!=="string"||item.scope.length<35)throw Error("Curriculum requires activity and safety scope");
  if(!Array.isArray(item.references)||!item.references.length)throw Error("Each lesson requires a publisher reference");
  for(const ref of item.references){
   if(!Object.values(sources).some(x=>x.id===ref.id&&x.url===ref.url))throw Error("Non-allowlisted resource");
   const url=new URL(ref.url);
   if(url.protocol!=="https:"||!["www.faa.gov","www.easa.europa.eu"].includes(url.hostname))throw Error("Reference URL not allowed");
  }
 }
 return {lessons:records.length,revision,allRequireReview:true};
}
const api={revision,records,get,validate,sources};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSACurriculum=api;
})(typeof window!=="undefined"?window:null);
