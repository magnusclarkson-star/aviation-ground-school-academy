/* Proposed specialist Academy course catalogue: non-accredited editorial planning content. */
(function(root){"use strict";
const revision="2026-11-13-planned-specialisms-v1";
const courses=Object.freeze([
 {
  "id": "avionics-engineering",
  "title": "Avionics Engineering Foundations",
  "category": "Technical",
  "level": "Foundation to advanced",
  "priority": 1,
  "modules": [
   "Electrical and electronic principles",
   "Aircraft power generation and distribution",
   "Analogue sensors and digital data buses",
   "Communication, navigation and surveillance systems",
   "Flight instruments and glass cockpits",
   "Automatic flight control and integrated avionics",
   "Wiring diagrams, test equipment and fault analysis",
   "Airworthiness documentation and maintenance human factors"
  ],
  "outcome": "Explain avionics architecture, interpret conceptual circuit diagrams, identify the roles of aircraft electronic systems and analyse simulated faults without claiming maintenance certification.",
  "references": [
   "FAA Aviation Maintenance Technician Handbook",
   "EASA Part-66 B2/B2L reference areas"
  ],
  "practical": "Virtual circuit tracing, instrument-system diagrams and supervised equipment familiarisation",
  "note": "A theory course, not an engineering degree, Part-66 licence, maintenance approval or practical sign-off."
 },
 {
  "id": "aircraft-accident-investigation",
  "title": "Aircraft Accident & Incident Investigation",
  "category": "Safety & Investigation",
  "level": "Foundation to professional",
  "priority": 1,
  "modules": [
   "Investigation purpose, independence and ICAO Annex 13",
   "Occurrence classification, notification and response planning",
   "Accident site safety, evidence preservation and chain of custody",
   "Wreckage examination, structures and powerplant evidence",
   "Flight data and cockpit voice recorder principles",
   "Operations, weather, maintenance and human factors analysis",
   "Witness interviews, factual findings and causal analysis",
   "Safety recommendations, investigation reporting and family-sensitive communication"
  ],
  "outcome": "Describe evidence-based, prevention-focused investigation principles and analyse fictional case studies using source-traceable reasoning.",
  "references": [
   "ICAO Annex 13",
   "ICAO Doc 9756",
   "ICAO Circular 298"
  ],
  "practical": "Fictional investigation case files, evidence logs, mapping and report drafting",
  "note": "Does not appoint the student as a State investigator or authorise work at a real accident scene."
 },
 {
  "id": "aviation-safety-management",
  "title": "Aviation Safety Management Systems",
  "category": "Safety & Investigation",
  "level": "Foundation to professional",
  "priority": 2,
  "modules": [
   "Safety policy and accountability",
   "Hazard identification and reporting",
   "Risk assessment and controls",
   "Safety assurance and performance monitoring",
   "Safety promotion and communication",
   "SMS improvement case study"
  ],
  "outcome": "Construct a fictional safety-risk register and explain safety policy, risk management, assurance and promotion.",
  "references": [
   "ICAO Doc 9859",
   "ICAO Annex 19"
  ],
  "practical": "Hazard register and corrective-action exercises",
  "note": "Professional familiarisation only; no regulator's SMS approval is issued."
 },
 {
  "id": "flight-data-analysis",
  "title": "Flight Data Monitoring & Investigation Analytics",
  "category": "Safety & Investigation",
  "level": "Intermediate",
  "priority": 2,
  "modules": [
   "Flight parameter types and data quality",
   "Time synchronisation and event reconstruction",
   "Flight path and energy-state analysis",
   "Trend analysis and exceedance awareness",
   "Confidentiality and data governance",
   "Technical findings and evidence limitations"
  ],
  "outcome": "Interpret synthetic flight data while distinguishing observed values from causal conclusions.",
  "references": [
   "ICAO Doc 9756",
   "ICAO Doc 9859"
  ],
  "practical": "Synthetic data plots, timeline reconstruction and evidence worksheets",
  "note": "No access to real protected recorder or operator data is included."
 },
 {
  "id": "aircraft-maintenance",
  "title": "Aircraft Maintenance Engineering Fundamentals",
  "category": "Technical",
  "level": "Foundation",
  "priority": 2,
  "modules": [
   "Aircraft materials and structures",
   "Basic mechanical and electrical systems",
   "Maintenance documentation",
   "Inspection concepts and defect reporting",
   "Human factors in maintenance",
   "Quality and continued-airworthiness awareness"
  ],
  "outcome": "Recognise maintenance-system principles, document concepts and limitations of student inspections.",
  "references": [
   "FAA Aviation Maintenance Technician Handbooks",
   "EASA Part-66 B1/B2"
  ],
  "practical": "Supervised identification and non-operational documentation exercises",
  "note": "Not a mechanic licence or authority to certify an aircraft release to service."
 },
 {
  "id": "aircraft-propulsion",
  "title": "Aircraft Engines & Propulsion Systems",
  "category": "Technical",
  "level": "Foundation to intermediate",
  "priority": 3,
  "modules": [
   "Piston engine principles",
   "Gas turbine architecture",
   "Propeller and rotor transmission principles",
   "Fuel and lubrication",
   "Engine indication and health monitoring",
   "Maintenance safety awareness"
  ],
  "outcome": "Explain the principles of propulsion and identify major operating-system relationships.",
  "references": [
   "FAA Pilot's Handbook of Aeronautical Knowledge",
   "FAA Aviation Maintenance Technician Handbooks"
  ],
  "practical": "Engine component diagrams and system-flow models",
  "note": "No engine type endorsement or maintenance authorisation."
 },
 {
  "id": "aviation-cybersecurity",
  "title": "Aviation Cybersecurity & Connected Aircraft",
  "category": "Technical",
  "level": "Intermediate",
  "priority": 3,
  "modules": [
   "Connected aircraft architecture",
   "Avionics network segmentation concepts",
   "Threat modelling and risk assessment",
   "Data protection and operational resilience",
   "Security incident reporting",
   "Safety-security coordination"
  ],
  "outcome": "Identify broad cybersecurity risks in aircraft and aviation ground systems using defensive case studies.",
  "references": [
   "ICAO aviation cybersecurity resources",
   "Applicable operator security manuals"
  ],
  "practical": "Threat models and simulated defensive risk reviews",
  "note": "No operational penetration testing or live aircraft security activity."
 },
 {
  "id": "aviation-human-factors",
  "title": "Human Factors & Crew Resource Management",
  "category": "Safety & Investigation",
  "level": "Foundation",
  "priority": 2,
  "modules": [
   "Attention and workload",
   "Fatigue, stress and decision-making",
   "Human performance limitations",
   "Team communication and assertiveness",
   "Error management and reporting",
   "Case-based crew coordination"
  ],
  "outcome": "Explain human-performance hazards and propose safe communication and teamwork practices.",
  "references": [
   "ICAO human factors guidance",
   "FAA Pilot's Handbook of Aeronautical Knowledge"
  ],
  "practical": "Role-play and fictional scenario discussions",
  "note": "Not a substitute for operator-approved recurrent training."
 },
 {
  "id": "aviation-quality-auditing",
  "title": "Aviation Quality Assurance & Regulatory Auditing",
  "category": "Safety & Investigation",
  "level": "Intermediate",
  "priority": 3,
  "modules": [
   "Quality management concepts",
   "Regulatory source hierarchy",
   "Audit planning and evidence",
   "Document control and findings",
   "Corrective action verification",
   "Audit report writing"
  ],
  "outcome": "Prepare a mock audit programme with traceable evidence and findings.",
  "references": [
   "ICAO USOAP CMA guidance",
   "Applicable authority-approved quality manuals"
  ],
  "practical": "Simulated audit plan and finding log",
  "note": "No external auditor appointment or professional certification."
 },
 {
  "id": "airport-operations",
  "title": "Airport & Ground Handling Operations",
  "category": "Operations",
  "level": "Foundation",
  "priority": 2,
  "modules": [
   "Airfield layout and movement safety",
   "Apron and ramp awareness",
   "Ground handling roles",
   "Dangerous goods awareness",
   "Passenger and baggage processes",
   "Incident reporting and turnaround coordination"
  ],
  "outcome": "Describe major aerodrome operations and identify common coordination and safety concerns.",
  "references": [
   "ICAO Annex 14 subject areas",
   "IATA ground operations guidance"
  ],
  "practical": "Fictional turnaround, ramp hazard and apron maps",
  "note": "No live ramp access qualification or dangerous goods authorisation."
 },
 {
  "id": "atc-communications",
  "title": "Air Traffic Services & Aviation Radiotelephony",
  "category": "Operations",
  "level": "Foundation",
  "priority": 2,
  "modules": [
   "ATS roles and controlled airspace",
   "Callsigns and phonetic alphabet",
   "Listening, clearances and readbacks",
   "Navigation and surveillance service awareness",
   "Communication failure concepts",
   "Fictional radio scenarios"
  ],
  "outcome": "Distinguish routine, urgent and instructional aviation radio messages in safe simulations.",
  "references": [
   "ICAO Annex 11",
   "ICAO Doc 4444 subject areas"
  ],
  "practical": "Recorded classroom-only tower and pilot role-play",
  "note": "Does not qualify an air traffic controller, issue a pilot radio licence or create actual ATC clearance."
 },
 {
  "id": "uas-drone",
  "title": "Uncrewed Aircraft Systems & Drone Safety",
  "category": "Operations",
  "level": "Foundation to intermediate",
  "priority": 2,
  "modules": [
   "UAS categories and terminology",
   "Airspace and local requirements",
   "Systems and sensors",
   "Flight planning and weather awareness",
   "Privacy and public safety",
   "Risk assessment and incident reporting"
  ],
  "outcome": "Identify responsible UAS planning concepts and determine when local authorisation is needed.",
  "references": [
   "SLCAA applicable UAS regulations",
   "ICAO UAS guidance"
  ],
  "practical": "Virtual flight planning and risk worksheets",
  "note": "No remote-pilot authorisation, drone licence or operational permission."
 },
 {
  "id": "aviation-meteorology",
  "title": "Aviation Meteorology & Weather Briefing",
  "category": "Operations",
  "level": "Foundation to intermediate",
  "priority": 2,
  "modules": [
   "Atmospheric structure and stability",
   "Pressure, temperature and density altitude",
   "Clouds and convective hazards",
   "METAR and TAF interpretation",
   "Wind, visibility and icing awareness",
   "Weather decision-making"
  ],
  "outcome": "Interpret fictional weather observations and assess information gaps before any real briefing.",
  "references": [
   "FAA Aviation Weather Handbook",
   "ICAO weather service guidance"
  ],
  "practical": "Fictional aviation weather products and route hazard review",
  "note": "Current official weather and qualified instruction remain required for real flight."
 },
 {
  "id": "aerial-navigation",
  "title": "Air Navigation & Flight Planning",
  "category": "Operations",
  "level": "Foundation to intermediate",
  "priority": 2,
  "modules": [
   "Maps and coordinate systems",
   "True/magnetic references",
   "Headings, tracks and wind drift",
   "Time-distance-speed calculations",
   "Route and airspace planning",
   "Navigation error and contingency"
  ],
  "outcome": "Construct a classroom route with coherent calculations and explain why real plans need current approved information.",
  "references": [
   "FAA Pilot's Handbook of Aeronautical Knowledge",
   "Applicable state aeronautical publications"
  ],
  "practical": "Interactive route planning with synthetic data",
  "note": "Classroom plans are not a real flight release."
 },
 {
  "id": "aviation-emergency-response",
  "title": "Aviation Emergency Response & Search-and-Rescue Awareness",
  "category": "Operations",
  "level": "Intermediate",
  "priority": 3,
  "modules": [
   "Emergency-response organisation",
   "Airport and State agency roles",
   "First notification and coordination",
   "Scene hazards and public protection",
   "Family assistance and communication",
   "Exercise planning and lessons learned"
  ],
  "outcome": "Explain emergency-response coordination and protection of people and evidence through case studies.",
  "references": [
   "ICAO Annex 12 subject areas",
   "ICAO family assistance guidance"
  ],
  "practical": "Tabletop emergency management exercises",
  "note": "Not an emergency-responder or rescue certification; practical qualifications require authorised providers."
 },
 {
  "id": "aircraft-design",
  "title": "Aircraft Design, Flight Dynamics & Simulation",
  "category": "Technical",
  "level": "Intermediate",
  "priority": 3,
  "modules": [
   "Aerodynamic configuration",
   "Stability and control",
   "Loads and structures",
   "Propulsion-performance tradeoffs",
   "Simulation assumptions and validation",
   "Conceptual aircraft design critique"
  ],
  "outcome": "Understand simplified aircraft design tradeoffs and the limits of educational flight simulation.",
  "references": [
   "FAA Pilot's Handbook of Aeronautical Knowledge",
   "Academic flight mechanics references"
  ],
  "practical": "Conceptual design and unvalidated simulator experiments",
  "note": "Not an engineering degree or approved flight simulation training device programme."
 }
]);
function validate(){if(courses.length!==16||new Set(courses.map(c=>c.id)).size!==courses.length)throw Error("Catalogue must contain sixteen unique courses");for(const c of courses){if(c.modules.length<6||!c.note||!c.outcome||!["Technical","Safety & Investigation","Operations"].includes(c.category)||![1,2,3].includes(c.priority))throw Error("Incomplete catalogue course "+c.id)}return {courses:courses.length,plannedLessons:courses.reduce((a,c)=>a+c.modules.length,0),revision}}
const api=Object.freeze({revision,courses,validate,priorities:{1:"Priority launch",2:"Phase two",3:"Future expansion"},status:"PROPOSED_SYLLABI_NOT_APPROVED"});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSASpecialistCatalogue=api;
})(typeof window!=="undefined"?window:null);
