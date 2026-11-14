/* Specialist sample units 05–08 for two flagship pathways.
 * Independent educational content; ungraded, no operational instructions.
 * No individual student records, regulator credit, approved maintenance tasks or
 * authority to investigate actual occurrences are created by this material. */
(function(root){"use strict";
const REVISION="2026-11-14-specialist-units-05-08-v1";
const unit=(id,title,objective,sections,figureIds,takeaway,scenario,quiz)=>
 Object.freeze({id,title,objective,sections:sections.map(([heading,body])=>Object.freeze({heading,body})),
 figureIds:Object.freeze(figureIds),takeaway:Object.freeze(takeaway),
 scenario:Object.freeze(scenario),quiz:Object.freeze(quiz.map(x=>Object.freeze(x)))});
const programmes=Object.freeze({
 "avionics-engineering":Object.freeze([
  unit("av-glass","05 · Flight instruments and glass-cockpit data",
   "Distinguish aircraft sensing, processing, display symbology and failure annunciations, and explain why a glass cockpit is not a source of truth by itself.",
   [
    ["Measurements begin outside the display","A modern primary flight display combines information originating in multiple systems. Air-data measurements, inertial sensors, magnetic references and navigation equipment may each contribute to selected indications. Some parameters depend on derived values or cross-system calculations. A colourful display does not generate those measurements independently. The student should trace each displayed value to its source and note when two apparently separate indications share a sensor or processing path."],
    ["Presentation and validity must be considered separately","A flight display may show an apparently precise number while the source is degraded, misconfigured or unavailable. Validity flags, comparator messages, annunciations and instrument cross-checks are essential parts of system design. A simulator may imitate them without implementing the actual logic of any certified aircraft. This lesson distinguishes visible symbology from data integrity and makes no inference about a particular model, instrument, certification basis or real response to a failed indication."],
    ["Failure awareness is evidence-based","Suppose a fictional training cockpit displays unequal airspeed values on two independent screens. Before naming a failed instrument, determine whether both displays are fed by the same air-data computer, separate sensing paths or a selected standby input. Environmental conditions and intentional training faults may also alter the presentation. Learners should describe the disagreement and missing architectural facts. Actual flight responses or maintenance tests require the appropriate aircraft operating and maintenance documents."]
   ],
   ["av-display-sources","av-disagreement"],
   ["A display presents data from underlying sources and processing.","A plausible-looking indication can be invalid or degraded.","Confirm source independence before interpreting agreement or disagreement."],
   {title:"Synthetic glass-cockpit comparison",text:"Two graphical flight displays on a classroom bench disagree about indicated airspeed by a visible amount. A source-selection label is missing from one display. The student must identify what is observed and what cannot yet be inferred about the sensing chain, rather than selecting the prettiest-looking screen.",focus:"Separate displayed value, data source, validity status and real approved procedures."},
   [
    {question:"What is the best interpretation of a plausible-looking number on a glass display?",options:["The value must be correct because it is digital.","The display presentation alone cannot establish source validity.","A precise font proves sensor calibration.","A secondary screen is automatically an independent reference."],answer:1,explanation:"Presentation quality and data validity are different properties. Source relationships and annunciations matter."},
    {question:"If two displays disagree, what should a classroom investigator establish first?",options:["Which bezel is newer.","Which is brighter.","Whether they share or independently obtain data and what status messages show.","Which value is closer to a guess."],answer:2,explanation:"The architecture and observed validity information are needed before considering hypotheses."}
   ]),
  unit("av-automation","06 · Automatic flight control and integrated avionics",
   "Describe the relationships among sensors, mode selection, flight guidance, actuator interfaces and human monitoring, without treating a conceptual diagram as operating instructions.",
   [
    ["Automation is a set of linked functions","Automatic flight control can combine sensing, guidance logic, selected modes and control commands. The precise architecture varies substantially by aircraft. Flight directors, autopilots, navigation computers and alerting systems may share data while performing distinct roles. A teaching block diagram helps students ask which function generates a target, which reports aircraft state and which applies control. It is not a wiring drawing, certified design model or procedure for engaging an autopilot."],
    ["Mode awareness is a human-systems problem","In a hypothetical aircraft, a pilot expects one guidance mode but the cockpit annunciation shows another. The gap between expectation and observed mode is the key training issue. Students should learn that selected, armed and active modes may be different concepts; the manufacturer defines the actual terminology and system transitions. Automation does not remove the need to monitor the aircraft, verify indications and follow type-specific procedures under qualified instruction."],
    ["Integration also creates shared dependencies","Several systems may depend on the same navigation position, attitude source or electrical path. Increased integration can improve information exchange, yet create common-source failure or configuration risks. A single loss of input may affect more than one display or automatic function; conversely, duplicated equipment does not always establish independent redundancy. Students should interpret system diagrams cautiously, distinguishing a failure indication, a possible cause and confirmed system status."]
   ],
   ["av-guidance-loop","av-mode-awareness"],
   ["Mode annunciation deserves attention as much as selected intent.","Guidance, sensing and control interfaces have different functions.","Shared data or power can link apparently independent systems."],
   {title:"Fictional automation status mismatch",text:"A simulated flight director panel shows a selected target while the active-mode label differs from what the learner expected. There is no validated aircraft model and no actual aircraft motion. Describe the difference between an intention, a displayed mode and an inferred control response, noting the additional information required.",focus:"Describe the observed annunciation without prescribing mode-selection sequences for real flight."},
   [
    {question:"Which distinction is most important when studying automation?",options:["The colour of the button and the aircraft registration.","Expected guidance, displayed active mode and observed aircraft response are not necessarily identical.","Automatic systems cannot share sensors.","A selected target proves the autopilot is engaged."],answer:1,explanation:"Automation awareness requires separating what was selected, what is active and what is actually happening."},
    {question:"Why can integrated avionics share a failure consequence?",options:["They must always be built by the same manufacturer.","A single digital display controls the entire aircraft.","Every system has separate power and data.","Different functions can rely on a common sensor, power path or data source."],answer:3,explanation:"Common dependencies can influence multiple functions even where the cockpit shows separate controls."}
   ]),
  unit("av-diagrams","07 · Wiring diagrams, test equipment and fault analysis",
   "Read conceptual electrical schematics and simulated measurements, identify alternative hypotheses and document limitations without instructing unqualified aircraft maintenance.",
   [
    ["A schematic is a structured description of connections","An electrical schematic uses symbols, component identifiers, labels and references to represent relationships among supplies, protective devices, switches, loads and returns. The layout of a drawing need not resemble the physical layout of the aircraft. A student must distinguish a circuit path from a connector pin, a reference designation from a measured value, and a system-level diagram from maintenance instructions. Only current approved aircraft data can be used for actual installation or troubleshooting."],
    ["Test equipment introduces its own limitations","An abstract voltage reading depends on where it was taken, the instrument configuration, its accuracy, calibration and the circuit conditions. A reading from an unpowered training bench is different from one taken on a live aircraft; neither a plausible figure nor a continuity symbol independently establishes a fault. The educational exercise presents measurements as pre-recorded fictional facts. It does not direct learners to touch conductors, defeat protective devices or apply test voltages to equipment."],
    ["Fault analysis should compare possible explanations","A simulated cockpit communication unit appears offline while other equipment is operational. Hypotheses could involve its individual supply, switching, internal equipment, data interfaces or the training software. Strong technical reasoning describes which observations support each hypothesis and what evidence is absent. Students should not 'repair' a fault simply by assuming that a dark indicator means an open circuit. Real maintenance requires appropriately authorised personnel, safety controls, approved manuals and records."]
   ],
   ["av-schematic-reading","av-measurement-limits"],
   ["A functional schematic is not a physical installation drawing.","Measurement quality and configuration affect interpretation.","One symptom can arise from several independent or shared causes."],
   {title:"Fictional protected-feed diagram",text:"A classroom schematic labels source S, protection P, bus B and display D. A worksheet reports that D is dark but does not specify test location, instrument calibration or configuration state. Discuss what the drawing explains and why the supplied observation does not establish which component has failed.",focus:"Identify the missing conditions and document only what the simulated evidence actually supports."},
   [
    {question:"What is a key limitation of a schematic when assessing a real aircraft fault?",options:["It always shows exact physical cable routes.","It proves each component is energised.","It depicts intended relationships, not actual measured serviceability.","It makes approved manuals unnecessary."],answer:2,explanation:"A drawing shows intended connectivity; actual states depend on configuration and validated measurement."},
    {question:"What makes a fictional instrument reading meaningful?",options:["Known measurement location, instrument condition and circuit context.","An attractive screen graphic.","A value copied from another aircraft type.","A learner guessing which fuse to replace."],answer:0,explanation:"A reading must be interpreted with its origin, context and limitations."}
   ]),
  unit("av-airworthiness","08 · Airworthiness documentation and maintenance human factors",
   "Explain why technical documentation, configuration control, maintenance records and human performance are inseparable from aviation electronic system safety.",
   [
    ["Configuration is part of the technical answer","Two aircraft with the same type name may carry different equipment revisions, software builds, supplemental installations and approved modifications. Applicability, serial number, effectivity and revision status therefore matter when reading maintenance or operational references. A classroom diagram is useful for understanding a function but cannot determine which drawing or service bulletin applies to a specific airframe. Students should recognise the need for controlled documents and traceable configuration records."],
    ["Maintenance records support continuing airworthiness","Recorded work, defect reports, inspections, release documentation and component histories provide evidence of what was observed, authorised and completed. A missing entry does not prove that work was never performed; an entry alone does not prove that the work was correct. Quality systems depend on traceability, review, qualified sign-off and adherence to the applicable legal framework. This lesson teaches record interpretation, not how to issue a certificate of release to service."],
    ["Human factors shape technical outcomes","Communication failures, time pressure, fatigue, interruptions, assumptions and weak handovers can undermine an otherwise sound technical process. In a fictional shift-change example, a technician mentions a display anomaly verbally but the handover log is incomplete. A disciplined response distinguishes the recorded facts from an unverified diagnosis and makes the information gap visible for authorised follow-up. Reporting culture and peer checking help prevent unexamined assumptions from becoming maintenance decisions."]
   ],
   ["av-doc-control","av-human-factors"],
   ["Aircraft applicability and document revisions are central to technical decisions.","A maintenance entry is a traceable record, not proof that every inference is correct.","Clear handovers reduce the risk of missed or assumed information."],
   {title:"Synthetic avionics shift handover",text:"A fictional avionics team reports an intermittent display warning in a verbal discussion, while the written log has no detail of the warning's time, source or reproduction. A later team reviews the log and considers the defect closed. Explain why the evidence is incomplete and which uncertainties need to be reported through authorised processes.",focus:"Separate evidence, staff communication and accountable sign-off without creating a maintenance release."},
   [
    {question:"Why does aircraft configuration matter when selecting technical documents?",options:["Every aircraft model has one unchanged installation.","A diagram always reveals the aircraft's serial number.","Only the colour scheme matters.","Modifications, equipment variants and revision effectivity can change which data applies."],answer:3,explanation:"Current, applicable documentation must match the particular aircraft and equipment configuration."},
    {question:"Which is a human-factors risk in a maintenance handover?",options:["Recording exact source information.","An undocumented assumption that a reported anomaly was already resolved.","Using current approved references.","Identifying the staff member responsible for follow-up."],answer:1,explanation:"Assumptions without traceable evidence can obscure a real unresolved issue."}
   ])
 ]),
 "aircraft-accident-investigation":Object.freeze([
  unit("ai-recorders","05 · Flight data and cockpit voice recorder principles",
   "Distinguish recorded parameters, cockpit audio, metadata and continuity, and explain why recording availability never automatically proves event causation.",
   [
    ["Recorders capture selected information, not an entire event","Flight data recorders and cockpit voice recorders can provide important evidence, subject to the installation, recording duration, parameters, sampling, operation and data recovery. Not every aircraft carries equivalent equipment. A plotted value may be derived, filtered, missing or identified by a system label rather than a direct sensor. Students should treat a recorder as one evidence stream and avoid assuming that the presence of a parameter proves the accuracy of its source."],
    ["Time correlation requires careful validation","Different datasets can use different time bases, offsets and sampling rates. A classroom timeline might show a synthetic altitude trace and an operator report, but aligning them is not as simple as matching screen positions. Investigators assess provenance, timing accuracy, conversion and uncertainties before building a sequence. Recorder work also involves authorised access and technical protocols; the Academy's diagram is not a retrieval, download, decryption or data-processing procedure."],
    ["Audio evidence demands context and protection","Cockpit voice information can contain private or sensitive material, ambiguous speakers, competing sounds and environmental effects. Interpretation requires legal safeguards, careful attribution and corroboration with other sources. A transcript may not capture tone, timing or uncertain words. Students must never treat a fabricated sound clip or synthetic transcript as proof of an actual cockpit exchange. The fictional exercise uses text labels only and does not disclose protected recordings."]
   ],
   ["ai-recorder-sources","ai-timeline-alignment"],
   ["A recorded parameter is a measurement stream with limitations.","Independent datasets need validated time alignment.","Cockpit audio requires protected, contextual and lawful handling."],
   {title:"Synthetic recorder and log timeline",text:"A classroom timeline shows a fictional data parameter at 12:02:15 and an operations log entry at 12:04. No common time reference is supplied, and the plotted parameter has an unknown sample rate. Students should explain why a precise causal sequence cannot be asserted and identify the missing metadata.",focus:"Time bases, configuration, provenance and uncertainty precede any event-sequence finding."},
   [
    {question:"Why can two recorder traces be difficult to align?",options:["All aircraft use one globally identical clock.","Plots are automatically synchronised when copied into a report.","Time references and sampling intervals can differ and require validation.","Audio is always more accurate than flight data."],answer:2,explanation:"Clock offsets, different rates and source uncertainty affect reconstructed timing."},
    {question:"What does a recorder's displayed parameter establish on its own?",options:["A recorded value existed in that dataset, subject to source and quality limits.","Its underlying sensor was certainly accurate.","A unique accident cause.","That the operator had complied with every procedure."],answer:0,explanation:"Recording is evidence of a dataset value, not automatically proof of underlying truth or causation."}
   ]),
  unit("ai-context","06 · Operations, weather, maintenance and human factors",
   "Compare independent occurrence evidence from operations, environment, maintenance and people, keeping uncertainties and potential interactions visible.",
   [
    ["The operating context spans several domains","An occurrence is rarely explained by one isolated observation. Flight planning, operating conditions, airspace, weather, aircraft state, organisational arrangements and human performance may all be relevant, depending on the event. An apparently simple timeline can conceal several parallel information streams. In a fictional case, a weather bulletin, maintenance note and operational log may each describe only one aspect of the environment. Students must resist arranging them into a causal story before validating the sources."],
    ["Weather information has its own limitations","A forecast describes anticipated conditions and an observation describes a specific reported place and time; neither automatically establishes what the aircraft encountered. Local terrain effects, changing conditions, time and position must be considered against the available evidence. The Academy never substitutes classroom weather products for actual investigation data or live flight planning. The learner should describe the reported wind, cloud or visibility source without asserting that it caused an event merely because the conditions were adverse."],
    ["Human factors must be analysed without hindsight bias","Fatigue, communication, training, workload, supervision and external pressures can influence a situation, but a person's later outcome does not prove that an earlier decision was unreasonable. Investigators examine the information and options available at the time, together with equipment, organisational and environmental influences. A maintenance defect report can be relevant without establishing a maintenance cause. Balanced analysis preserves counter-evidence, avoids blame-first reasoning and tests how several factors may have interacted."]
   ],
   ["ai-evidence-domains","ai-context-interactions"],
   ["Each information stream has its own time, location and reliability.","Adverse conditions are not automatically causal factors.","Human performance should be assessed in context rather than with hindsight."],
   {title:"Fictional multi-source airport case",text:"A fictional flight log notes a diversion; a nearby weather report indicates low cloud; a maintenance note records an earlier intermittent indication. There is no verified link between those reports and the reason for the diversion. Explain how to organise the evidence streams without claiming an untested cause.",focus:"Assess time, applicability, source credibility, alternatives and potential interactions."},
   [
    {question:"What is the danger of citing bad weather as the sole cause from one report?",options:["It makes the report too short.","The report may not represent the aircraft's exact circumstances or establish causation.","Forecasts are never useful.","Weather cannot contribute to an occurrence."],answer:1,explanation:"Weather evidence needs context, corroboration and a causal link; a report alone is insufficient."},
    {question:"Which approach reduces hindsight bias?",options:["Judge a decision using information available at the time and organisational context.","Assume a bad outcome means the pilot ignored obvious signs.","Exclude maintenance and system factors.","Treat every witness recollection as perfect."],answer:0,explanation:"Investigative reasoning should reconstruct conditions and decision context as experienced then."}
   ]),
  unit("ai-interviews","07 · Witness accounts, factual findings and analysis",
   "Explain how source attribution, memory limitations, corroboration and alternative hypotheses shape responsible factual findings.",
   [
    ["A witness is a source, not an automatic conclusion","A witness account may identify timing, sound, location or perceived movement, but human memory can be influenced by distance, stress, later discussion and misleading questions. Two confident witnesses may describe the same event differently. Investigators preserve source identity, original wording, interview context and uncertainties as permitted by the applicable process. The Academy does not offer a real interview script, witness contact plan or authority to obtain protected information."],
    ["Keep observation and inference in different columns","A factual finding should be supported by identified evidence. 'The witness reported a sharp noise' describes a statement; 'an engine exploded' is an inference requiring testing. Photos, logs, recorded data and independent witness material can corroborate or challenge one another. Students should compare hypotheses against both supporting and contradictory evidence. When the evidence is inadequate, recording that limitation is more reliable than inventing a definitive mechanism."],
    ["Analysis is a traceable argument","A sound analytical explanation shows what was found, how it was assessed, why alternatives were accepted or rejected, and which elements remain uncertain. Causal and contributing factor terminology depends on the applicable investigation framework and the evidence. The objective is prevention rather than assigning civil or criminal liability. Educational casework should be explicit that its named events, people and records are fictional to prevent false attribution to actual operators or investigators."]
   ],
   ["ai-witness-reliability","ai-finding-ladder"],
   ["Witness confidence and accuracy are not interchangeable.","Citations, corroboration and contradiction belong in analytical reasoning.","A limitation or unresolved hypothesis must remain visible in findings."],
   {title:"Synthetic eyewitness disagreement",text:"Two fictional observers describe a loud noise at different times, while a simulated airport log notes an alert activation. Neither witness saw the system that made the sound. Students must separate the reported observations from their own proposed explanations, and explain how a factual finding could remain limited.",focus:"Use source attribution and alternative hypotheses without assuming an accident mechanism."},
   [
    {question:"Which statement is a properly attributed observation?",options:["The landing gear failed because the noise was loud.","The witness proved the aircraft's engine exploded.","Witness A reports hearing a noise near the runway; its source is not verified.","The crew must have been negligent."],answer:2,explanation:"Attribution preserves the witness's report without claiming an unverified physical cause."},
    {question:"What strengthens an analytical finding?",options:["Repeating one hypothesis many times.","Ignoring contradictory records.","Hiding uncertainty for a polished story.","Traceable evidence, consideration of alternatives and clear uncertainty."],answer:3,explanation:"Analysis should show the evidence path and assess both supporting and contradictory information."}
   ]),
  unit("ai-recommendations","08 · Safety recommendations, reporting and family-sensitive communication",
   "Describe prevention-focused safety recommendations, clear evidence-based reporting and respectful handling of affected people and protected information.",
   [
    ["Safety recommendations address identifiable risk","An investigation may produce recommendations that seek to reduce a safety risk without establishing individual liability. Each recommendation should be grounded in an evidenced hazard or system weakness, identify an appropriate responsible recipient and provide a basis for a meaningful response. Students can practise describing a fictional risk and a broad prevention goal. They cannot issue authoritative State safety recommendations or direct an operator or regulator to implement a change."],
    ["A report must make its reasoning auditable","Investigation reports normally distinguish factual information, analysis, conclusions and safety action under the applicable authority's framework. Clear source references, consistent terminology, document version control and explicit limitations support independent review. A persuasive narrative cannot replace missing evidence. Students should avoid identifying real persons in exercises or constructing imagined accusations. The Academy's reporting examples are original fictional classroom material and not official investigation templates."],
    ["Communication is a safety and human responsibility","People affected by an aviation occurrence deserve dignity, privacy and appropriate information through authorised channels. Public speculation, premature findings and release of sensitive imagery can cause additional harm and undermine the process. Family communication roles, timelines and disclosure rules depend on law and organisational arrangements. A classroom learner should focus on respectful language, protection of personal details and honest distinctions between confirmed information and matters still being investigated."]
   ],
   ["ai-safety-action","ai-sensitive-communication"],
   ["A safety recommendation should follow an evidenced risk.","Reporting separates facts, analysis, conclusions and action.","Respectful communication protects people and the integrity of an investigation."],
   {title:"Fictional airport-safety briefing",text:"A classroom case identifies repeated ambiguity in a made-up airport signage example, but the record does not identify any individual responsible or show a confirmed accident outcome. Students consider how to describe a safety concern, propose a generic prevention aim, and communicate cautiously without portraying an untested allegation as a finding.",focus:"State the evidence and prevention purpose while respecting uncertainty and affected people."},
   [
    {question:"What is the central purpose of a safety recommendation?",options:["Punish a person before the analysis is complete.","Reduce an evidenced safety risk through an appropriate recipient or action.","Assign criminal responsibility.","Guarantee that no future incident can occur."],answer:1,explanation:"Recommendations are focused on preventing or reducing identified risks, not assigning blame."},
    {question:"Which message best respects affected people during an ongoing investigation?",options:["Publish unverified names to answer public curiosity.","Announce a cause before reviewing evidence.","Share graphic images to demonstrate urgency.","Provide verified information within authorised boundaries and acknowledge unresolved matters."],answer:3,explanation:"Respectful, authorised communication protects privacy and avoids premature conclusions."}
   ])
 ])
});
const diagramSpecs=Object.freeze({
 "av-display-sources":["FLIGHT DISPLAY INFORMATION","Trace underlying information",["Air-data","Inertial","Processing","Display"],["Pressure / values","Motion reference","Validity / fusion","Pilot presentation"],"A screen is a presentation, not independent proof of accuracy."],
 "av-disagreement":["COMPARE AIRCRAFT INDICATIONS","Check independence before inference",["Screen A","Source map","Screen B","Status"],["Value observed","Shared or separate?","Value observed","Validity message"],"Different numbers do not identify which source is right."],
 "av-guidance-loop":["AUTOMATION FUNCTIONS","Conceptual control relationships",["Sensing","Guidance","Mode status","Interface"],["Aircraft state","Selected objective","Active / armed","Control system"],"Selected intent and active mode can differ."],
 "av-mode-awareness":["MODE AWARENESS","Intent, status, response",["Pilot intent","Selection","Annunciation","Observation"],["Expected path","Mode request","Active state","What happened"],"Mode annunciation is evidence; expectations are not."],
 "av-schematic-reading":["READING A SCHEMATIC","Functions are not physical locations",["Source","Protection","Distribution","Load"],["Supply label","Protective element","Switch / bus","Equipment"],"Schematic connectivity does not show live serviceability."],
 "av-measurement-limits":["ASSESSING A READING","Context matters before diagnosis",["Where?","How?","State?","Meaning?"],["Test location","Equipment accuracy","System condition","Supported claim"],"A displayed voltage without context proves little."],
 "av-doc-control":["CONTROLLED TECHNICAL DATA","Use current, applicable material",["Type","Configuration","Revision","Approval"],["Aircraft identity","Installed equipment","Current issue","Authorised scope"],"One model name is not enough to select a maintenance procedure."],
 "av-human-factors":["MAINTENANCE HANDOVER","Separate evidence from assumptions",["Observation","Record","Communication","Follow-up"],["What occurred?","Source and time","Who was told?","Authorised review"],"Unrecorded assumptions can conceal unresolved technical issues."],
 "ai-recorder-sources":["RECORDED DATA SOURCES","Signals and recording context",["Sensor","Recorded data","Metadata","Analysis"],["Accuracy?","Parameter stored","Time and units","Cross-check"],"Recording a number does not prove its sensor was correct."],
 "ai-timeline-alignment":["TIMELINE CORRELATION","Align independent time bases",["Dataset A","Clock offset","Dataset B","Sequence"],["Sample time","Uncertainty","Other source","Qualified comparison"],"Do not invent a precise sequence from unaligned timestamps."],
 "ai-evidence-domains":["MULTI-DOMAIN EVIDENCE","Different sources and limitations",["Operations","Weather","Maintenance","People"],["Event context","Place and time","Defect records","Decision context"],"Each stream has different provenance and possible gaps."],
 "ai-context-interactions":["ANALYSE INTERACTIONS","Avoid single-factor explanations",["Conditions","Equipment","Organisation","Hypotheses"],["Environment","Aircraft state","Processes","Test alternatives"],"A co-occurring hazard is not automatically causal."],
 "ai-witness-reliability":["WITNESS REPORTS","Source is not conclusion",["Account","Context","Corroboration","Finding"],["Exact wording","View and timing","Independent data","Qualified statement"],"Witness confidence and precision may differ from accuracy."],
 "ai-finding-ladder":["FROM REPORT TO FINDING","Preserve the evidence ladder",["Statement","Observation","Hypothesis","Finding"],["Attributed source","Verified fact","Testable idea","Supported result"],"Never promote an untested hypothesis into a factual finding."],
 "ai-safety-action":["PREVENTION-FOCUSED ACTION","Recommendations need a basis",["Hazard","Evidence","Recipient","Response"],["Identified risk","Supported reason","Appropriate body","Safety improvement"],"An Academy exercise cannot issue official recommendations."],
 "ai-sensitive-communication":["RESPONSIBLE COMMUNICATION","Protect people and evidence",["Verified fact","Uncertainty","Privacy","Authority"],["What is known","What is pending","Who is protected","Who may disclose"],"Accuracy and dignity both matter during an investigation."]
});
const esc=x=>String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function getPlate(id){
 const spec=diagramSpecs[id];if(!spec)return null;
 const [title,subtitle,labels,descriptions,warning]=spec;
 const nodes=labels.map((label,i)=>{
  const x=42+i*263,y=201;
  return '<rect x="'+x+'" y="'+y+'" width="219" height="170" rx="15" fill="'+(i%2?"#e8f4fa":"#e6f7f4")+'" stroke="#83aabc" stroke-width="2"/>'+
   '<circle cx="'+(x+31)+'" cy="'+(y+32)+'" r="19" fill="#196a84"/>'+
   '<text x="'+(x+31)+'" y="'+(y+39)+'" font-size="18" fill="#fff" font-weight="800" text-anchor="middle">'+(i+1)+'</text>'+
   '<text x="'+(x+110)+'" y="'+(y+93)+'" fill="#163f56" font-size="20" font-weight="800" text-anchor="middle">'+esc(label)+'</text>'+
   '<text x="'+(x+110)+'" y="'+(y+128)+'" fill="#425c69" font-size="15" text-anchor="middle">'+esc(descriptions[i])+'</text>';
 }).join("");
 const arrows=[0,1,2].map(i=>{
  const x=262+i*263;return '<path d="M'+x+' 286 l22 0 m-7 -7 l8 7 l-8 7" stroke="#137e83" stroke-width="4" fill="none"/>';
 }).join("");
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 650" role="img">'+
 '<title>'+esc(title)+'</title><desc>'+esc(subtitle)+'</desc>'+
 '<rect width="1100" height="650" fill="#f9fcff"/><rect x="16" y="15" width="1068" height="620" rx="17" fill="#fff" stroke="#d1e3eb" stroke-width="2"/>'+
 '<rect x="16" y="15" width="1068" height="113" rx="17" fill="#12384f"/>'+
 '<text x="43" y="64" fill="#fff" font-size="27" font-family="Arial,sans-serif" font-weight="800">'+esc(title)+'</text>'+
 '<text x="43" y="99" fill="#d5ebf6" font-size="17" font-family="Arial,sans-serif">'+esc(subtitle)+'</text>'+
 '<text x="43" y="163" fill="#23495d" font-family="Arial,sans-serif" font-size="18">Explore these relationships · conceptual only, never an operational checklist</text>'+
 nodes+arrows+
 '<rect x="48" y="437" width="1004" height="110" rx="14" fill="#e9f3f7" stroke="#a7cad8"/>'+
 '<text x="550" y="476" text-anchor="middle" fill="#143e53" font-size="20" font-family="Arial,sans-serif" font-weight="800">INTERPRETATION LIMIT</text>'+
 '<text x="550" y="514" text-anchor="middle" fill="#23495d" font-size="17" font-family="Arial,sans-serif">'+esc(warning)+'</text>'+
 '<rect x="35" y="574" width="1030" height="45" rx="9" fill="#17384d"/>'+
 '<text x="550" y="601" text-anchor="middle" fill="#f3fcff" font-size="15" font-family="Arial,sans-serif">Aviation Ground School Academy · Original conceptual teaching diagram</text></svg>';
 return Object.freeze({id,svg,alt:"Academy illustration titled "+title+". Four conceptual elements: "+labels.join(", ")+". "+warning+" This is educational, not approved technical or investigative guidance."});
}
function validate(){
 if(Object.keys(programmes).length!==2||Object.keys(diagramSpecs).length!==16)
  throw Error("Eight specialist units and sixteen new diagrams required");
 const figureIds=new Set(),unitIds=new Set();
 for(const [courseId,units] of Object.entries(programmes)){
  if(units.length!==4||!["avionics-engineering","aircraft-accident-investigation"].includes(courseId))
   throw Error("Each flagship requires exactly units 05–08");
  units.forEach((u,index)=>{
   if(!u.title.startsWith(String(index+5).padStart(2,"0")+" · ")||unitIds.has(u.id))throw Error("Unexpected lesson numbering or duplicate");
   unitIds.add(u.id);
   if(u.objective.length<85||u.sections.length!==3||u.sections.some(s=>s.heading.length<15||s.body.length<340)||
     u.figureIds.length!==2||u.takeaway.length!==3||u.scenario.text.length<150||u.quiz.length!==2)
    throw Error("Incomplete specialist lesson "+u.id);
   for(const id of u.figureIds){
    if(figureIds.has(id)||!diagramSpecs[id])throw Error("Duplicate or unknown specialist diagram "+id);
    figureIds.add(id);
   }
   for(const q of u.quiz){
    if(q.options.length!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3||
       q.explanation.length<65)throw Error("Incomplete specialist question "+u.id);
   }
  });
 }
 for(const id of Object.keys(diagramSpecs)){
  const fig=getPlate(id);
  if(!figureIds.has(id)||fig.svg.length<1800||fig.alt.length<110||!fig.svg.includes("</svg>")||
    /<script|foreignObject|<image\s/i.test(fig.svg))throw Error("Invalid concept image "+id);
 }
 return Object.freeze({courses:2,additionalUnits:8,additionalDiagrams:16,additionalPracticeQuestions:16,
  status:"UNACCREDITED_SELF_STUDY_ONLY",revision:REVISION});
}
const api=Object.freeze({REVISION,programmes,getPlate,validate,diagramIds:Object.freeze(Object.keys(diagramSpecs))});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSASpecialistUnits58=api;
})(typeof window!=="undefined"?window:null);
