/* Original Academy learning content; two public sample lessons per specialist programme.
 * Not an approved course, official examination, credential or licence.
 */
(function(root){"use strict";
const REVISION="2026-11-13-specialist-samples-1";
const programmes=Object.freeze({
 "avionics-engineering":{
  title:"Avionics Engineering Foundations",
  strapline:"Understand the electrical architecture behind modern flight instruments.",
  subtitle:"Structured sample lessons · not engineering certification",
  sourceLinks:[
   {title:"FAA Aviation Maintenance Technician Handbook — General",url:"https://www.faa.gov/regulations_policies/handbooks_manuals/aviation"},
   {title:"EASA aircraft maintenance licensing overview",url:"https://www.easa.europa.eu/en/domains/aircraft-products/continuing-airworthiness/aircraft-maintenance-licensing"}
  ],
  units:[
   {
    id:"av-electrical",title:"01 · Electrical fundamentals and aircraft circuits",
    objective:"Distinguish voltage, current, resistance, continuity and protection in a simplified training circuit.",
    sections:[
     {heading:"Electrical quantities have different jobs",body:"Voltage describes electrical potential difference. Current is the rate at which charge moves through a conducting path; resistance is the opposition to that movement. In a simple direct-current (DC) circuit, the relationship between voltage (V), current (I) and resistance (R) is expressed by V = I × R. For example, if a simulated 24-volt supply drives a purely resistive 12-ohm training load, the ideal current would be 2 amperes. This calculation is an illustration of the principle, not a prediction of actual avionics behaviour: electronic equipment has complex internal circuitry, transient currents and protective design features."},
     {heading:"A complete path and an intentionally open path",body:"A circuit needs a valid supply, a return path and an appropriate load. A switch opens or closes a commanded path. Protection devices such as circuit breakers or fuses are designed to limit damage under certain abnormal conditions; they do not make unsafe handling acceptable. Many aircraft distribute power through separate buses, with equipment supplied or isolated according to the approved aircraft design. A diagram may show a battery, a protected bus, a load and return—but each symbol represents a function, not permission to touch or test live aircraft conductors."},
     {heading:"Read schematics before interpreting a fault",body:"Start at the source and follow the drawing through isolation, protection, distribution, load and return. Identify the specified voltage, component labels, connector references and whether the diagram shows a normal or alternate power path. If a fictional cockpit display does not power on, an open circuit is only one possibility: switching logic, an internal display fault, a data-bus failure or a deliberately shed load may look similar to a student. Fault diagnosis on a real aircraft requires authorised maintenance personnel, maintenance data, relevant tooling and safety precautions."}
    ],
    figureIds:["dc-circuit","fault-path"],
    takeaway:["Voltage, current and resistance describe different electrical properties.","A protected supply path still requires the approved circuit and load specifications.","A single cockpit symptom does not prove which component failed."],
    scenario:{title:"Synthetic ground-training bench",text:"A simulated 24 V source powers a nominal 12 Ω resistive indicator load. The test monitor reports approximately 2 A and the power switch is closed. A student suggests replacing the display because its annunciator is dark. What additional distinction should be made before concluding the display has failed?",focus:"A measurement from a simple load is not an avionics diagnostic result. Check the limitations of what the observation actually proves."},
    quiz:[
     {question:"In the simplified training calculation, a 24 V supply across a 12 Ω resistive load produces approximately:",options:["0.5 A","2 A","12 A","288 A"],answer:1,explanation:"For an ideal resistor, I = V / R = 24 / 12 = 2 A. Real avionics loads require their specified operating characteristics."},
     {question:"A dark cockpit display should lead a learner to conclude:",options:["The display has certainly failed internally.","The power bus has certainly failed.","Several supply, control, data and equipment possibilities must be distinguished.","The protection device must be bypassed."],answer:2,explanation:"The same visible symptom can arise from different causes. Do not bypass aircraft protective devices."}
    ]
   },
   {
    id:"av-avionics-architecture",title:"02 · Digital avionics and flight-display architecture",
    objective:"Explain how sensors, data paths, display processing and pilot indications work together without equating one display with one sensor.",
    sections:[
     {heading:"From a sensed quantity to a displayed indication",body:"A modern flight display is the visible result of a chain: a physical quantity is sensed, conditioned and converted into a usable signal; processing equipment applies calculations and validity rules; a data link or network transfers information; then a display renders the resulting indication. A primary flight display may show attitude, airspeed, altitude, heading and status messages, but those values do not necessarily come from the same sensor. It is important to separate the data source, the processing step, the transfer path and the visible screen when discussing failures."},
     {heading:"Redundancy and source comparison",body:"Critical aircraft systems may have multiple sources and independent pathways, but the exact architecture depends on the aircraft and equipment type. Source-selection controls, annunciations, failure flags and comparator warnings help crews identify discrepancies. A blank screen does not establish that the air-data system is invalid, and a plausible-looking display does not by itself establish that the data are correct. Sound avionics thinking therefore asks where each displayed parameter came from, how its integrity is checked and what approved crew information describes an abnormal condition."},
     {heading:"Digital interfaces are not interchangeable",body:"Avionics may exchange data over purpose-designed serial or network interfaces. ARINC and other aviation interface families describe certain message and electrical characteristics, but a classroom block diagram is not an installation specification. The correct data labels, pinouts, isolation, electromagnetic compatibility and approved configuration depend on the specific system and certified design. Maintenance students should practise diagram interpretation using a safe simulated bus model and leave installation or troubleshooting of powered aircraft systems to authorised personnel."}
    ],
    figureIds:["avionics-chain","sensor-crosscheck"],
    takeaway:["Different displayed values may come from different physical sensors and processors.","A working display does not guarantee accurate input; integrity flags and comparisons matter.","A technical block diagram explains functions, not actual wiring or certified interfaces."],
    scenario:{title:"Two inconsistent indications",text:"A fictional glass cockpit presents one airspeed value on the main display and another on a standby display. The two indications disagree. A trainee argues that the larger screen must always be correct. Explain why display size cannot determine sensor accuracy, and what information would be needed to reason further.",focus:"Separate sensor, processing, electrical power, data transmission, status flags and approved operating procedures."},
    quiz:[
     {question:"Which sequence best represents the information path for a modern displayed aircraft parameter?",options:["Display → sensor → power fuse → radio","Sensor → conditioning/processing → data path → display","Wiring colour → aircraft skin → display","Aircraft registration → airspeed indication"],answer:1,explanation:"Most electronic indications are products of sensing, processing and transmission before being rendered."},
     {question:"If two independent displays disagree, the first sound educational conclusion is:",options:["The larger display is necessarily right.","The smaller display is necessarily right.","The disagreement needs source and validity assessment using approved procedures.","A learner should disconnect the sensors to identify the faulty one."],answer:2,explanation:"No conclusion about accuracy follows from display size. Only approved procedures and authoritative maintenance/flight information govern real responses."}
    ]
   }
  ]
 },
 "aircraft-accident-investigation":{
  title:"Aircraft Accident & Incident Investigation",
  strapline:"Reconstruct evidence responsibly to understand hazards and improve safety.",
  subtitle:"Fictional casework · State investigator authority not conferred",
  sourceLinks:[
   {title:"ICAO Annex 13 overview",url:"https://store.icao.int/en/annex-13-aircraft-accident-and-incident-investigation"},
   {title:"ICAO Accident Investigation Section resources",url:"https://www.icao.int/safety/AIG"},
   {title:"ICAO Doc 9756 Part III overview",url:"https://store.icao.int/en/manual-of-aircraft-accident-and-incident-investigation-part-iii-investigation-doc-9756-part-3"}
  ],
  units:[
   {
    id:"ai-purpose",title:"01 · Investigation mandate, independence and prevention",
    objective:"Distinguish safety investigation from liability proceedings and identify why independence, records and controlled communication matter.",
    sections:[
     {heading:"The purpose is prevention",body:"The central purpose of an aircraft accident or incident safety investigation under ICAO Annex 13 is preventing further occurrences. The investigation seeks to establish the sequence of events, assess contributing factors and identify improvements that can reduce future risk. It is not undertaken to assign personal blame or determine legal liability. Judicial and administrative processes may exist separately under applicable law, but a safety investigator must not confuse their purpose with the prevention-focused function of the independent investigation authority."},
     {heading:"Who has authority to investigate?",body:"The relevant State accident investigation framework determines who may conduct and participate in an investigation, including the responsibilities of the State of Occurrence and other States under Annex 13. Investigators act through an authorised State agency and formal procedures, not merely because they have studied a course. Independence protects the investigation from conflicts that could distort evidence selection, analytical judgement or reporting. A student can study a fictional event file; they cannot use course completion as authorisation to enter an accident scene, examine a protected recorder or release an official finding."},
     {heading:"Keep factual evidence separate from analysis",body:"A disciplined case record separates observed facts, uncertain witness statements, tested propositions and eventual findings. Statements about the aircraft trajectory, weather or technical condition need traceable sources. If two accounts conflict, both should be recorded faithfully and examined against independent evidence rather than forcing early agreement. Investigators also need to protect sensitive information and communicate through the authority's approved channels. Independent analysis should remain open to revision as better evidence becomes available."}
    ],
    figureIds:["investigation-mandate","evidence-reasoning"],
    takeaway:["Prevention is the purpose of Annex 13 safety investigation, not determination of blame.","Only authorised personnel can carry out official investigative functions.","Facts, hypotheses, analysis and official findings must remain distinguishable."],
    scenario:{title:"Fictional regional-airport occurrence",text:"A small training aircraft sustains serious damage during an attempted landing. A bystander immediately posts a claim that a particular pilot error caused the accident. An independent safety team has not yet analysed weather, maintenance or recorder information. What should a training investigator record, and what must remain unproven?",focus:"Do not treat public speculation as a tested fact. Describe the claim as a claim and preserve relevant evidence through authorised procedures."},
    quiz:[
     {question:"What is the primary objective of an Annex 13 safety investigation?",options:["Assign liability to an individual.","Prevent future accidents and incidents.","Determine insurance compensation.","Prosecute a named pilot."],answer:1,explanation:"Annex 13 places prevention at the centre of the safety investigation. Other legal proceedings are separate."},
     {question:"A social media allegation about the cause of an accident should initially be handled as:",options:["A verified finding.","An authorised investigation conclusion.","An unverified statement that may require proper assessment.","Proof that other evidence may be discarded."],answer:2,explanation:"A statement is a source claim, not established causal evidence."}
    ]
   },
   {
    id:"ai-evidence",title:"02 · Scene evidence, continuity and safe documentation",
    objective:"Recognise evidence preservation, controlled access and chain-of-custody principles using fictional, non-operational case material.",
    sections:[
     {heading:"Scene safety comes before collection",body:"An aircraft accident site may contain fuel, sharp debris, pressurised containers, hazardous materials, unstable structures, damaged batteries and other health risks. Emergency responders and authorised investigators follow locally approved incident command, hazard assessment and personal protective procedures. A student should never approach or manipulate wreckage merely to complete a learning activity. When making a fictional evidence plan, begin by identifying who controls the scene, what hazards may exist and how uninvolved people and emergency work are protected."},
     {heading:"Record context before moving an item",body:"Photographs, mapping, measurements, orientation sketches and contemporaneous notes help preserve context. The relative position of major components, impact marks and environmental features may be important to later reconstruction. For training, label a synthetic site sketch with a reference grid, time, direction and observer; distinguish an original observation from an interpretation. Evidence movement or sampling at a real scene must only occur under authority-controlled procedures, especially where actions might damage or alter a material feature."},
     {heading:"A chain of custody is a traceable history",body:"Controlled records should show the unique evidence identifier, nature of the item, who recorded or received it, when and where transfers occurred and why a transfer was made. Storage location and integrity controls matter because a gap can weaken confidence in the evidence's identity or condition. Digital files also benefit from protected originals and verifiable copy history. A cryptographic hash can indicate whether digital bytes have changed since recording, but a matching hash does not prove the original photograph was accurate, authentic or taken at the claimed location."}
    ],
    figureIds:["scene-map","custody-log"],
    takeaway:["Personal safety and emergency response always take priority at a real scene.","Preserve the location and context of a fictional evidence item before discussing it.","A chain of custody documents item identity and each controlled transfer; hashes are one supporting tool, not proof of truth."],
    scenario:{title:"Synthetic evidence bag and photo series",text:"In a classroom case, an investigator records a detached component as item E-07, photographs it in position and logs a transfer to a specialist. The transfer record omits the receiving time. Discuss why that gap matters and what should be reported rather than fabricated.",focus:"A missing transfer detail is a documentation limitation. Do not invent timestamps or retroactively create an eyewitness observation."},
    quiz:[
     {question:"Which step comes first when considering work at an aircraft accident site?",options:["Handle the most interesting wreckage.","Make an immediate causal conclusion.","Confirm authorised scene control and assess hazards.","Publish photographs of identifiable victims."],answer:2,explanation:"Safety, emergency activity and legal scene authority take precedence over evidence work."},
     {question:"A matching SHA-256 hash for two evidence files demonstrates:",options:["That both files contain a truthful account.","That the files match in bytes, subject to the hash algorithm's properties.","That the scene was legally entered.","That the image contains no misleading perspective."],answer:1,explanation:"A hash is useful for digital integrity checks; it does not establish provenance or truthfulness."}
    ]
   }
  ]
 }
});
function validate(){
 const keys=Object.keys(programmes);
 if(keys.length!==2)throw Error("Exactly two flagship specialist programme previews expected");
 for(const id of keys){
  const p=programmes[id];
  if(p.units.length!==2||p.sourceLinks.length<2)throw Error("Flagship lessons incomplete: "+id);
  const ids=new Set();
  for(const u of p.units){
   if(ids.has(u.id))throw Error("Duplicate specialist unit");
   ids.add(u.id);
   if(u.sections.length!==3||u.figureIds.length!==2||u.quiz.length!==2||u.takeaway.length!==3||
    u.sections.some(s=>s.body.length<340)||u.quiz.some(q=>q.options.length!==4||q.answer<0||q.answer>3)||
    u.scenario.text.length<150||u.objective.length<75)
    throw Error("Specialist lesson needs complete taught content, paired illustrations and checks: "+u.id);
  }
 }
 return {courses:2,publicSampleLessons:4,figures:8,knowledgeChecks:8,status:"UNACCREDITED_SAMPLE_CONTENT"};
}
const api=Object.freeze({revision:REVISION,programmes,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSASpecialistSampleLessons=api;
})(typeof window!=="undefined"?window:null);
