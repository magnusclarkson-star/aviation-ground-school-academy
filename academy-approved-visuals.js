/* Exact images previously presented to the Academy owner.
 * Source image pixels are unchanged in composition: WebP encodings of the original
 * four generated illustrations are packaged with the site for reliable display.
 * All crop windows are views into those same images, never replacement artwork.
 */
(function(root){"use strict";
const PATH="assets/lecture-visuals/";
const assets=Object.freeze({
 overview:{file:"aviation-learning-overview.webp",width:1536,height:1024,description:"Previously presented 12-panel aviation learning poster showing aircraft, aerodynamics, instruments, weather, navigation, communications, systems, weight and balance, human factors, rotorcraft, aviation safety and accident investigation."},
 detailed:{file:"ground-school-visuals-12-topic.webp",width:1214,height:1295,description:"Previously presented detailed twelve-section aviation education sheet with Cessna-style aircraft, diagrams, instruments, meteorology, chart work, avionics, safety and accident investigation."},
 photos:{file:"aviation-real-world-photographs.webp",width:1536,height:1024,description:"Previously presented four-panel Academy concept collage: flight instructor briefing a learner, light training aeroplane on an apron, wind tunnel wing airflow research illustration, and aircraft avionics wiring inspection."},
 cessna:{file:"illustrated-cessna-structures-lecture.webp",width:1536,height:1024,description:"Previously presented elaborate coursebook design showing aircraft structural components, wings, ailerons, flaps, elevators, rudder, cockpit controls and an illustrated Academy training layout."}
});
const modulePanels=Object.freeze({
 orientation:{asset:"detailed",full:true,title:"Your original illustrated aviation course overview",alt:"Original detailed multi-topic aviation teaching sheet with authentic-looking aircraft and illustrated cockpit, aviation weather, navigation and safety panels.",caption:"This is the comprehensive illustrated teaching sheet already presented in our conversation. Follow the detailed lesson wording; artwork is illustrative rather than an approved aircraft manual."},
 aircraft:{asset:"cessna",full:true,title:"The aircraft structure coursebook design originally presented",alt:"Original richly illustrated Academy teaching page with a Cessna-style training aeroplane, wings, flaps, elevators, rudder, control axes and analog cockpit controls.",caption:"Identify major structural components and control surfaces on this original training-page design. The actual aircraft's approved documentation governs dimensions, markings and operating limits."},
 aerodynamics:{asset:"overview",cell:[1,0],title:"Original aerodynamic wing and airflow illustration",alt:"Original Academy illustration showing an airfoil, blue streamlines, angle of attack and lift and drag arrows.",caption:"Use the airflow picture to discuss angle of attack, lift, drag and the difference between a teaching depiction and the full aerodynamic behaviour of a wing."},
 systems:{asset:"overview",cell:[2,1],title:"Original detailed aircraft-systems cutaway",alt:"Original Academy poster cutaway of a light aeroplane indicating engine, electrical, fuel and hydraulic system locations.",caption:"Observe where representative systems sit in an airframe. This is illustrated artwork, not a type-specific wiring, fuel or hydraulic diagram."},
 instruments:{asset:"overview",cell:[2,0],title:"Original six-instrument cockpit picture",alt:"Original Academy aviation illustration with detailed analog instrument faces for airspeed, attitude, altitude, turn, heading and vertical speed.",caption:"Compare the illustrated instruments with the companion labelled six-pack diagram. Training instruments vary in calibration and indication conventions."},
 meteorology:{asset:"overview",cell:[3,0],title:"Original atmospheric weather illustration",alt:"Original Academy weather image showing a large cloud formation, wind, pressure, precipitation and lightning symbols.",caption:"Link visible cloud structure to possible hazards, but use current official observations and forecasts for operational decisions."},
 navigation:{asset:"overview",cell:[0,1],title:"Original navigation chart and heading reference",alt:"Original Academy visual of an aeronautical chart section with compass rose and navigation checklist symbols.",caption:"Study the relationship between maps, headings and tracks. The illustrated chart is not an up-to-date or approved navigation publication."},
 airspace:{asset:"detailed",cell:[3,2],title:"Original flight-planning and airspace teaching panel",alt:"Original Academy twelve-topic sheet showing a flight-planning chart, aircraft inset and route planning components.",caption:"A planning visual helps explain why routes and airspace boundaries must be checked against current State aviation information."},
 communications:{asset:"overview",cell:[1,1],title:"Original aviation communications radio-stack picture",alt:"Original Academy illustration of aircraft radio communication and navigation controls with frequency displays and clear checklist icons.",caption:"Recognise the radio equipment visually while learning clear calls, listening and required readbacks. A picture does not provide real ATC authorisation."},
 performance:{asset:"overview",cell:[3,1],title:"Original aircraft weight and balance illustration",alt:"Original Academy illustration of a small business aeroplane with fore-and-aft mass distribution and centre-of-gravity marker.",caption:"Use the weight-and-balance artwork to introduce centre of gravity and the effects of load position; actual calculations require approved aircraft data."},
 human:{asset:"overview",cell:[0,2],title:"Original cockpit human-factors teaching picture",alt:"Original Academy teaching panel with a pilot wearing a headset and human factors reminders about awareness, workload and fatigue.",caption:"Connect crew workload, distraction, fatigue and situational awareness to practical safety decisions, using the written lesson's detailed explanations."},
 rotorcraft:{asset:"overview",cell:[1,2],title:"Original helicopter and control-mechanism illustration",alt:"Original Academy illustration of a blue helicopter, rotor controls and separate insets explaining cyclic, collective and anti-torque concepts.",caption:"Identify rotor systems and broad helicopter-control functions in the same picture previously presented. Type-specific instruction is still required."}
});
const specialists=Object.freeze({
 "avionics-engineering":[
  {asset:"photos",full:true,title:"The previously shown flight-training and avionics reference collage",caption:"The fourth panel illustrates a technician examining an avionics/electrical installation. This is concept imagery, not a real aircraft maintenance procedure."},
  {asset:"overview",cell:[2,1],title:"The original aircraft-systems and avionics cutaway",caption:"Use this previously presented systems cutaway to identify the broader airframe context around electronics and instrument supplies."}
 ],
 "aircraft-accident-investigation":[
  {asset:"overview",cell:[3,2],title:"The originally shown aircraft accident investigation panel",caption:"The illustrated case-study panel depicts wreckage and an investigation sequence. It is not a real accident photograph or evidence record."},
  {asset:"detailed",cell:[2,2],title:"The original aviation safety flow illustration",caption:"Illustrates hazard identification and safety-review principles that can inform prevention-focused investigations."}
 ]
});
function normalize(item){
 if(!item)return null;
 const asset=assets[item.asset];if(!asset)return null;
 const crop=item.cell||null;
 if(crop&&(!Array.isArray(crop)||crop.length!==2||crop[0]<0||crop[0]>3||crop[1]<0||crop[1]>2))throw Error("Invalid original illustration crop");
 return Object.freeze({
  ...item,src:PATH+asset.file,full:!!item.full,crop,originalDescription:asset.description,
  alt:item.alt||asset.description,caption:item.caption,author:"Original Academy illustration previously shown to the owner",
  isArtwork:true,notOperationalReference:true
 });
}
function getModule(id){return normalize(modulePanels[id])}
function getSpecialist(id){return Object.freeze((specialists[id]||[]).map(normalize))}
function validate(){
 const keys=Object.keys(modulePanels);
 if(keys.length!==12||Object.keys(assets).length!==4||Object.keys(specialists).length!==2)throw Error("Original owner-shown illustration catalogue incomplete");
 for(const [key,item] of Object.entries(modulePanels)){
  const image=normalize(item);
  if(!image||image.title.length<25||image.alt.length<65||image.caption.length<100||key.length<3)throw Error("Original lecture illustration missing context for "+key);
 }
 for(const [key,items] of Object.entries(specialists)){
  if(items.length!==2||items.some(x=>!normalize(x)?.src))throw Error("Specialist original artwork missing: "+key);
 }
 return Object.freeze({sourcePictures:4,groundSchoolModules:12,specialistProgrammes:2,externalImages:0});
}
const api=Object.freeze({assets,modulePanels,getModule,getSpecialist,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAApprovedLectureVisuals=api;
})(typeof window!=="undefined"?window:null);
