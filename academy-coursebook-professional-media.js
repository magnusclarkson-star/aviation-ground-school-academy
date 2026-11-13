/* Professionally sourced visual teaching references, paired with original labelled SVG concept diagrams.
 * Copyright: image files are hotlinked UNMODIFIED from Wikimedia Commons, with explicit attribution.
 * License and source links are visible with every figure; inspect source page before reuse.
 * These reference photographs complement but never supersede the actual aircraft manuals.
 */
(function(root){"use strict";
const pd="https://creativecommons.org/publicdomain/mark/1.0/";
const cc3="https://creativecommons.org/licenses/by-sa/3.0/";
const cc4="https://creativecommons.org/licenses/by-sa/4.0/";
const data=Object.freeze({
 orientation:[
 {file:"Cessna172InstructorAndStudent.png",hash:"e/e3",max:960,section:0,title:"Flight training: instructor and student",
  alt:"A flight instructor and student photographed beside a Cessna 172 training aircraft.",
  caption:"A real flight-school setting. Ground lessons support informed practical training, but a school or simulator does not replace qualified flight instruction.",
  credit:"Ahunt",license:"Public domain",licenseUrl:pd}
 ],
 aircraft:[
 {file:"Airplane_major_components.png",hash:"e/e6",max:960,section:0,title:"FAA: major aircraft assemblies",
  alt:"FAA aircraft diagram identifies the fuselage, wings, tail assembly, landing gear and powerplant.",
  caption:"Identify the real aircraft assemblies first; then locate the ailerons, elevators, rudder and flaps in the accompanying labelled control-surface diagram.",
  credit:"US Federal Aviation Administration",license:"Public domain (US government)",licenseUrl:pd},
 {file:"FlapsLNAGT2.jpg",hash:"c/c5",max:600,section:2,title:"Close-up: Cessna 172 wing flaps",
  alt:"Close photograph of the inboard wing flaps of a Cessna 172 seen from behind.",
  caption:"Flaps are fitted along the inboard trailing wing edge. Their effects and operating limits are aircraft-specific.",
  credit:"Gudleik Alvik",license:"CC BY-SA 3.0",licenseUrl:cc3}
 ],
 aerodynamics:[
 {file:"Airfoil-Wind_tunnel.jpg",hash:"a/af",max:960,section:0,title:"Airflow research: wing section in a wind tunnel",
  alt:"Photograph of a real airfoil wing section in a research wind tunnel under an unusual negative angle-of-attack condition.",
  caption:"A real wind-tunnel study demonstrates that airflow patterns depend on angle of attack. This photograph is a negative-angle example, not a universal picture of normal cruise.",
  credit:"Aerom",license:"CC BY-SA 3.0",licenseUrl:cc3}
 ],
 systems:[
 {file:"Aircraft_electrical_system_schematic.png",hash:"9/91",max:800,section:0,title:"FAA: aircraft electrical system overview",
  alt:"Detailed FAA electrical-system schematic showing the connections between electrical generation, distribution and powered equipment.",
  caption:"Trace generation, storage, switching, protection and distribution on a published example diagram. This is not a wiring diagram for the selected simulator aircraft.",
  credit:"US Federal Aviation Administration",license:"Public domain (US government)",licenseUrl:pd},
 {file:"Avionics.jpg",hash:"1/1c",max:960,section:2,title:"Real avionics maintenance workstation",
  alt:"Photograph showing aviation electronic systems and avionics work in a maintenance setting.",
  caption:"Avionics inspection and fault isolation require appropriate training, test equipment and maintenance approval. Do not work on aircraft wiring from a coursebook diagram.",
  credit:"Sk3lm",license:"CC BY-SA 4.0",licenseUrl:cc4}
 ],
 instruments:[
 {file:"Six_flight_instruments.JPG",hash:"0/07",max:960,section:0,title:"Photograph: six basic flight instruments",
  alt:"Six analog flight instruments: airspeed, attitude, altimeter, turn coordinator, heading indicator and vertical-speed indicator arranged in a two-by-three panel.",
  caption:"Compare the actual dial faces, scale markings and scan arrangement with the simplified instrument-function chart. Display and calibration depend on aircraft type.",
  credit:"Meggar",license:"CC BY-SA 3.0",licenseUrl:cc3},
 {file:"Cessna172cockpit.jpg",hash:"f/f2",max:960,section:2,title:"Real Cessna 172 instrument panel",
  alt:"Detailed photograph of the analog cockpit and instrumentation of a Cessna 172.",
  caption:"Observe how instruments, navigation equipment, engine controls and switches are distributed in a real light-aircraft panel.",
  credit:"Wikimedia Commons contributor",license:"Public domain (author dedication)",licenseUrl:pd}
 ],
 meteorology:[
 {file:"Cumulonimbus7_-_NOAA.jpg",hash:"a/a1",max:960,section:0,title:"NOAA: towering cumulonimbus and anvil",
  alt:"National Oceanic and Atmospheric Administration photograph showing a large cumulonimbus cloud with an anvil-shaped top.",
  caption:"Towering convection may involve strong updrafts, lightning, severe turbulence, precipitation and hail. Weather photographs do not replace current forecasts.",
  credit:"US National Oceanic and Atmospheric Administration",license:"Public domain (US government)",licenseUrl:pd},
 {file:"Thunderstorm_anvil_-_NOAA.jpg",hash:"e/ee",max:960,section:2,title:"NOAA: mature thunderstorm anvil",
  alt:"Photograph of an anvil thunderstorm at sunset illustrating the lateral spread of the upper storm cloud.",
  caption:"The anvil can spread far from the convective core. Assess observed weather together with official briefings and forecasts.",
  credit:"US National Oceanic and Atmospheric Administration",license:"Public domain (US government)",licenseUrl:pd}
 ],
 navigation:[
 {file:"VFR-Kodiak_Sectional_Aeronautical_Chart%2C_%28FAA%29%2C_2024.jpg",hash:"4/41",max:960,section:0,title:"FAA: example VFR sectional chart",
  alt:"An actual FAA VFR aeronautical sectional chart of the Kodiak area of Alaska showing symbols, terrain and aeronautical data.",
  caption:"Read chart symbols, elevation, airspace boundaries and route context. This is a historical US training example, not current Sierra Leone chart data or flight planning information.",
  credit:"US Federal Aviation Administration",license:"Public domain (US government)",licenseUrl:pd}
 ],
 airspace:[
 {file:"Airspace_classes_%28United_States%29.png",hash:"2/2b",max:960,section:0,title:"FAA: example airspace structure",
  alt:"A detailed FAA airspace classification diagram illustrating example United States airspace floors and ceilings.",
  caption:"The drawing illustrates how published airspace may be layered and bounded. It describes the United States, not Sierra Leone; always use current State AIP and charts.",
  credit:"US Federal Aviation Administration",license:"Public domain (US government)",licenseUrl:pd}
 ],
 communications:[
 {file:"Inside_the_Airport_Control_Tower.jpg",hash:"e/e0",max:400,section:0,title:"Inside a functioning airport control tower",
  alt:"Photograph of an airport control tower interior with working consoles and an elevated view over airport operations.",
  caption:"Observe the tower work environment while practising concise pilot calls, active listening and required readbacks. The illustration does not constitute a real clearance.",
  credit:"Toyotaboy95",license:"CC BY-SA 3.0",licenseUrl:cc3}
 ],
 performance:[
 {file:"Weight_control_and_balance_of_an_aircraft.png",hash:"6/67",max:500,section:0,title:"FAA: loading and centre-of-gravity effects",
  alt:"FAA teaching illustration showing how different loads influence an aircraft's balance and centre-of-gravity position.",
  caption:"Understand why a load's weight and arm influence the aircraft moment. Use approved weight-and-balance data—not the illustration—to assess a real aircraft.",
  credit:"US Federal Aviation Administration",license:"Public domain (US government)",licenseUrl:pd}
 ],
 human:[
 {file:"Human_fatigue_study.jpg",hash:"b/bf",max:960,section:0,title:"NASA: crew fatigue study in a flight simulator",
  alt:"Two pilots in a full-motion cockpit simulator during NASA human-performance and fatigue research.",
  caption:"NASA research illustrates why fatigue, monitoring, shared awareness and sound communication are central to aviation decision-making.",
  credit:"NASA Ames Research Center",license:"Public domain (US government)",licenseUrl:pd}
 ],
 rotorcraft:[
 {file:"Heli.robinsonr44.750pix.jpg",hash:"2/29",max:640,section:0,title:"Real Robinson R44 helicopter",
  alt:"Photograph of a Robinson R44 light helicopter showing fuselage, main rotor, tail rotor and landing skids.",
  caption:"Identify the actual rotor mast, main rotor, tail rotor, cabin and landing skids before reviewing cyclic, collective and anti-torque control effects.",
  credit:"Adrian Pingstone",license:"Public domain (author dedication)",licenseUrl:pd},
 {file:"Helicopter_Robinson_R44.jpg",hash:"b/b7",max:960,section:2,title:"Robinson R44: additional aircraft view",
  alt:"Real Robinson R44 helicopter photographed in daylight, showing the two-bladed main rotor, tail boom, cockpit cabin and landing skids.",
  caption:"Compare airframe proportions and visible rotor components with the instructional helicopter control diagram; this photo is not a cockpit-operating reference.",
  credit:"Tomas62",license:"CC BY-SA 3.0",licenseUrl:cc3}
 ]
});
function url(file,hash,max,thumb){
 const encoded=file.replace(/%([0-9A-F]{2})/g,(m,hex)=>"%"+hex.toUpperCase());
 const base="https://upload.wikimedia.org/wikipedia/commons/"+(thumb?"thumb/":"")+hash+"/"+encoded;
 return thumb?base+"/"+max+"px-"+encoded:base;
}
function sourceUrl(file){return "https://commons.wikimedia.org/wiki/File:"+file}
function get(moduleId){
 const items=data[moduleId];return items?items.map((v,i)=>Object.freeze({
  id:moduleId+"-"+i,moduleId,section:v.section,title:v.title,alt:v.alt,caption:v.caption,
  src:url(v.file,v.hash,v.max,true),fallbackSrc:url(v.file,v.hash,v.max,false),
  source:sourceUrl(v.file),credit:v.credit,license:v.license,licenseUrl:v.licenseUrl
 })):Object.freeze([]);
}
function validate(modules){
 const keys=Object.keys(data);
 if(keys.length!==12||modules&&(!Array.isArray(modules)||modules.length!==12||modules.some(m=>!keys.includes(m.id))))throw Error("The professional media library must cover all twelve Ground School modules");
 let count=0;
 for(const id of keys){
  for(const asset of get(id)){
   count++;
   if(!Number.isInteger(asset.section)||asset.section<0||asset.section>2||
    asset.title.length<20||asset.alt.length<70||asset.caption.length<100||
    !asset.credit||!asset.license||!asset.licenseUrl.startsWith("https://creativecommons.org/")||
    !asset.src.startsWith("https://upload.wikimedia.org/wikipedia/commons/")||
    !asset.source.startsWith("https://commons.wikimedia.org/wiki/File:"))
    throw Error("Missing image attribution or educational description: "+asset.id);
  }
 }
 if(count<16)throw Error("Too few authoritative visual references");
 return Object.freeze({modules:12,referenceImages:count,originalConceptDiagrams:12,totalVisuals:count+12});
}
const api=Object.freeze({get,validate,ids:Object.freeze(Object.keys(data))});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAProfessionalCoursebookMedia=api;
})(typeof window!=="undefined"?window:null);
