/* Four additional original flagship specialist lectures and eight teaching diagrams.
 * They are FREE, UNGRADED samples. No aircraft maintenance instruction, investigator
 * appointment, official examination, student data, or access-control bypass.
 */
(function(root){"use strict";
const REVISION="2026-11-14-specialist-extension-v1";
const units=Object.freeze({
 "avionics-engineering":Object.freeze([
  Object.freeze({
   id:"av-power-distribution",title:"03 · Aircraft power distribution and protected loads",
   objective:"Explain the difference between generation, protected distribution, electrical load priority and the evidence needed to interpret a fictional aircraft power interruption.",
   sections:Object.freeze([
    Object.freeze({heading:"Generation is not the same as distribution",body:"Aircraft electrical power can originate from batteries, generators or other approved sources depending on the design. Distribution buses route that energy to equipment groups while protective devices and switching arrangements limit particular failure effects. The supply indicated in a diagram does not prove that a selected unit is energised: the configuration, path continuity, contactor state and applicable control logic all matter. In this conceptual lecture, follow the relationships without assuming that one aircraft's wiring diagram applies to another."}),
    Object.freeze({heading:"Protected loads and priorities",body:"Different avionics functions may be connected to separate buses or protected paths. Some aircraft are designed to preserve essential equipment during certain supply failures, while other loads may be shed. The word essential describes a documented design role, not a universal list of instruments. A learner should distinguish electrical power availability from navigation-data validity and display function. A screen can be illuminated while its sensor inputs are invalid, or dark while another system remains powered."}),
    Object.freeze({heading:"Reason from evidence without resetting equipment",body:"A fictional display goes blank while a companion display remains illuminated. The observation limits the hypothesis: a common complete electrical loss is less consistent with the evidence, but a failed screen still is not proved. Possible explanations include a distinct supply path, protective device, connector, data interface or internal hardware. Real faults need aircraft-approved maintenance instructions, qualified technicians and relevant records. This exercise deliberately offers no circuit-breaker reset, isolation or maintenance procedure."})
   ]),
   figureIds:Object.freeze(["av-bus-distribution","av-load-priority"]),
   takeaway:Object.freeze(["Generation, distribution and utilisation are distinct functions.","The status of one powered display does not establish the health of every avionics component.","An observed symptom narrows possibilities; it does not authorise a repair."]),
   scenario:Object.freeze({title:"Fictional dual-display ground trainer",text:"A classroom mock-up shows Display A dark and Display B illuminated. The diagram indicates two labelled equipment feeders, but the student has no access to their actual measured states. Discuss which claims can be made from the observation, and which remain untested hypotheses.",focus:"Record the observed difference and identify missing source, protection and data-path evidence without prescribing aircraft maintenance action."}),
   quiz:Object.freeze([
    Object.freeze({question:"Why can a dark display not, by itself, prove that its screen hardware is faulty?",options:["The panel colour identifies the cause.","Several supply, switching, connection or internal paths could explain the symptom.","It proves the entire aircraft has lost all electrical power.","A student can safely reset any breaker to confirm."],answer:1,explanation:"A symptom has several plausible causes. Qualified maintenance and the approved data are needed to investigate an actual aircraft."}),
    Object.freeze({question:"Which statement about essential electrical loads is most accurate?",options:["Every aircraft uses the same essential-load list.","Essential means that protection can never fail.","An illuminated screen always carries valid navigation information.","The applicable aircraft design determines which buses and functions are protected or prioritised."],answer:3,explanation:"Load priority is defined by type-specific architecture and documentation, not by the appearance of an instrument."})
   ])
  }),
  Object.freeze({
   id:"av-com-nav",title:"04 · Communication and navigation signal chains",
   objective:"Trace conceptual antenna, receiver, processing and display relationships, and explain how uncertainty in a data source affects cockpit information.",
   sections:Object.freeze([
    Object.freeze({heading:"Signals travel through systems, not just screens",body:"Communication and navigation systems combine antennas, cabling, receivers, processing and cockpit interfaces. A pilot may see a single indication, but that presentation can depend on several independently functioning components and external radio or satellite signals. Some installations also integrate position, heading and other sensor inputs. The lecture's block diagrams simplify that architecture; connector pinouts, frequency planning, installation tests and approved avionics modifications are intentionally outside the classroom exercise."}),
    Object.freeze({heading:"A received value is not automatically trustworthy",body:"An indication may be missing, degraded or inconsistent because of signal geometry, interference, antenna faults, data-source selection, processing errors or limitations in the particular system. The learner should separate signal availability from signal validity and presentation. Two displays agreeing may share a common source, while independent indications can disagree without revealing which is correct. Cross-checking requires approved operational guidance, aircraft configuration knowledge and authoritative information."}),
    Object.freeze({heading:"Document the information path and the unknowns",body:"In a simulated scenario, one display labels a navigation source unavailable while another shows a position estimate. A good technical note identifies the selected sources, observed annunciations and the limits of the simulation, without declaring either display accurate. An investigator, maintainer and pilot may ask different questions about the same symptom. Real aircraft handling and maintenance belong to qualified persons using approved manuals, rather than a trial-and-error response from the illustration."})
   ]),
   figureIds:Object.freeze(["av-radio-chain","av-data-validity"]),
   takeaway:Object.freeze(["Trace the source, signal path, processing and cockpit presentation separately.","Availability and validity are not interchangeable.","Common-source agreement is not proof of independent confirmation."]),
   scenario:Object.freeze({title:"Two fictional navigation indications",text:"A desktop avionics demonstrator shows one position indication beside a 'source unavailable' message and a separate display that continues to update. The student does not know whether either channel uses the same antenna or processor. Identify what the observed messages show and which architecture facts are missing.",focus:"Compare the claimed data paths and avoid assuming independence merely because there are two screens."}),
   quiz:Object.freeze([
    Object.freeze({question:"What is the principal limitation of comparing two displays that share one sensor?",options:["They are always independent.","Both displays must be incorrect.","Agreement may reflect the same underlying source rather than independent confirmation.","The larger display is automatically authoritative."],answer:2,explanation:"Common sources can create common-mode errors; the underlying architecture matters."}),
    Object.freeze({question:"Which is the best way to describe an unavailable navigation input in a classroom report?",options:["Identify the observed source message and the unresolved cause.","State that the antenna has certainly failed.","State that the aircraft is outside every service area.","Replace a radio without authorised diagnosis."],answer:0,explanation:"A factual report distinguishes an indication from hypotheses about its root cause."})
   ])
  })
 ]),
 "aircraft-accident-investigation":Object.freeze([
  Object.freeze({
   id:"ai-classification",title:"03 · Occurrence classification and notification reasoning",
   objective:"Distinguish an initial occurrence account from a verified classification, and identify why independent authority and applicable notification arrangements matter.",
   sections:Object.freeze([
    Object.freeze({heading:"An initial report is a starting point",body:"A first occurrence message may contain incomplete or conflicting descriptions of damage, injuries, aircraft operation and location. Classification under applicable law and international provisions requires the actual facts and the authorised definitions; it is not determined by the emotional language of a social-media post. Students should identify what was observed, what was reported by others, and which key elements remain unverified. A fictional timeline can demonstrate disciplined uncertainty without presenting a real accident as classroom entertainment."}),
    Object.freeze({heading:"Authority and notification are separate questions",body:"The State's investigation authority, operator, regulator, air traffic services and other parties may have different legal obligations. Which entity is notified, how quickly and by whom depends on the occurrence, jurisdiction and current applicable requirements. ICAO Annex 13 establishes an international framework for relevant investigations, but it does not turn a student into an authorised investigator. The Academy diagrams therefore show responsibility categories and information flow, not jurisdiction-specific instructions or dispatch checklists."}),
    Object.freeze({heading:"Preserve the distinction between fact and inference",body:"A witness reports that an aircraft 'fell from the sky' near an aerodrome, while an airport log merely records an unscheduled landing and emergency response. Neither phrase alone resolves the investigation classification or causal sequence. In structured casework, record the original source, timing, uncertainties and verified material separately. An independent authority evaluates the eventual information under the governing rules, and a classroom learner should never fabricate a time, source or confirmed classification."})
   ]),
   figureIds:Object.freeze(["ai-intake-triage","ai-notification-lines"]),
   takeaway:Object.freeze(["Initial reports are not authoritative final classifications.","Notification responsibilities must be checked against current jurisdictional rules.","Preserve exact source attribution and uncertainty in every fictional case."]),
   scenario:Object.freeze({title:"Synthetic aerodrome event report",text:"A fictional airport duty log calls an event an 'emergency landing', while a public message calls it an 'accident'. There is no independently verified injury, damage or operation detail yet. Explain why classification remains unresolved and how a factual preliminary record differs from an official investigative finding.",focus:"Record the distinct sources and missing facts. Do not assign legal classification from a headline."}),
   quiz:Object.freeze([
    Object.freeze({question:"Who should make a legally meaningful occurrence classification?",options:["Any social-media witness.","The loudest reporter.","A trainee from a single photograph.","The responsible authorised process using the applicable definitions and verified facts."],answer:3,explanation:"Classification depends on authority, current rules and facts, not first impressions."}),
    Object.freeze({question:"Which sentence is the most defensible initial classroom record?",options:["The engine definitely failed, because the aircraft diverted.","The log reports an emergency arrival; damage and injury information are not yet verified.","This must be a serious incident because the video looks dramatic.","The investigation has already assigned liability."],answer:1,explanation:"The wording preserves what is known, identifies the source and keeps uncertainty visible."})
   ])
  }),
  Object.freeze({
   id:"ai-wreckage",title:"04 · Wreckage, systems and physical evidence reasoning",
   objective:"Explain how investigators compare structures, component evidence and alternative explanations while protecting scene authority and the chain of custody.",
   sections:Object.freeze([
    Object.freeze({heading:"Physical evidence requires context",body:"An aircraft component found away from the main debris field is a location observation, not proof that the component separated before the occurrence. Investigators consider terrain, impact sequence, post-impact movement, recovery activity, witness information and the component's documented condition. A photograph can preserve an item in place but may omit scale, orientation or the wider distribution. Classroom interpretation should therefore name the uncertainty and avoid announcing a causal mechanism from one dramatic image."}),
    Object.freeze({heading:"Multiple evidence streams challenge hypotheses",body:"Technical examination may compare structural features, maintenance history, relevant system records, recorded data, photographs and credible witness accounts. Observations from different streams can support or contradict a proposed sequence, but their reliability and provenance must be assessed independently. Evidence bags, transfers and analytical reports require continuity, and specialist testing is undertaken by authorised personnel. The diagram illustrates cross-source reasoning, never a field collection protocol or handling instruction."}),
    Object.freeze({heading:"Separate findings, unknowns and safety lessons",body:"Suppose a fictional debris photograph shows a detached inspection panel, but no reliable record establishes its position before impact. 'Panel found detached' is an observation; 'panel caused loss of control' is a hypothesis requiring additional evidence. An investigation may identify safety issues even when a specific causal detail remains undetermined. A sound report should expose the reasoning, relevant limitations and source traceability without turning the search for prevention into a presumption of individual blame."})
   ]),
   figureIds:Object.freeze(["ai-debris-context","ai-evidence-matrix"]),
   takeaway:Object.freeze(["Location after an occurrence does not prove pre-occurrence separation.","Compare independently sourced evidence and preserve continuity.","Distinguish observation, hypothesis, tested finding and safety recommendation."]),
   scenario:Object.freeze({title:"Fictional detached-panel exercise",text:"An illustrated evidence map labels a separated panel as item E-12. A student asserts that the panel detached in flight, but the photographs provide no pre-impact sequence or transport history. Discuss how to word a factual observation and list at least two alternative explanations requiring analysis.",focus:"The finding needs scene context, item provenance and independent corroboration; causation cannot be inferred from a single picture."}),
   quiz:Object.freeze([
    Object.freeze({question:"What can a photograph of a detached component establish on its own?",options:["Only aspects of its documented appearance and photographed location, subject to provenance.","That it detached before impact.","That a named engineer caused the event.","That its maintenance records are complete."],answer:0,explanation:"A photograph is a limited observation; temporal and causal claims require additional corroboration."}),
    Object.freeze({question:"Which approach best fits prevention-focused investigation reasoning?",options:["Use a single dramatic image as definitive proof.","Suppress uncertain evidence because it is inconvenient.","Cross-check physical, recorded and testimonial evidence while documenting what remains unknown.","Assume an unverified hypothesis is a final finding."],answer:2,explanation:"Traceable, corroborated analysis and explicit uncertainty support reliable safety learning."})
   ])
  })
 ])
});
const specs=Object.freeze({
 "av-bus-distribution":["GENERATION → PROTECTED DISTRIBUTION","Functional power route",["Source","Switching","Protected bus","Equipment"],["Battery / generator","Control logic","Priority and feed","Display / radio"],"An electrical path can be interrupted at multiple places."],
 "av-load-priority":["ELECTRICAL LOAD PRIORITIES","Different functions and paths",["Supply A","Distribution","Supply B","Equipment"],["Primary source","Essential or other bus","Alternate path","Function and data"],"Power availability does not guarantee data validity."],
 "av-radio-chain":["COMMUNICATION SIGNAL CHAIN","Conceptual information flow",["Antenna","Receiver","Processing","Cockpit"],["External signal","Signal input","Decoded information","Audio / indicator"],"An indication depends on the whole configured path."],
 "av-data-validity":["NAVIGATION VALIDITY QUESTIONS","Do not trust a screen by appearance",["Sensor","Source label","Data status","Interpretation"],["Origin and quality","Selected channel","Valid or degraded","Cross-check context"],"Two displays can share a common source and common failure."],
 "ai-intake-triage":["INITIAL OCCURRENCE INFORMATION","Separate report from classification",["First report","Source check","Known facts","Open questions"],["Unverified account","Time and origin","Confirmed details","Missing essentials"],"An initial headline is not a legal investigation classification."],
 "ai-notification-lines":["AUTHORITY & INFORMATION FLOW","Jurisdiction determines obligations",["Occurrence","Relevant State","Authority","Other parties"],["Reported facts","Applicable law","Independent inquiry","Defined roles"],"Do not infer a universal notification checklist from this drawing."],
 "ai-debris-context":["PHYSICAL EVIDENCE IN CONTEXT","Post-event position is not sequence",["Item location","Scene context","Possible paths","Tested finding"],["Photographed state","Terrain and impact","Alternative causes","Evidence-supported"],"A found object does not prove when or how it separated."],
 "ai-evidence-matrix":["INDEPENDENT EVIDENCE STREAMS","Analyse without blame",["Physical","Recorded","Witness","Analysis"],["Structures / parts","System evidence","Credibility context","Compare sources"],"Document uncertainty as well as corroboration and findings."]
});
const escape=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function getPlate(id){
 const spec=specs[id];if(!spec)return null;
 const [title,subtitle,labels,details,footer]=spec;
 const nodes=labels.map((name,i)=>{
  const x=34+i*265,y=199;
  const rect='<rect x="'+x+'" y="'+y+'" width="230" height="176" rx="16" fill="'+(i%2?"#ebf5fa":"#eaf7f4")+'" stroke="#75a6be" stroke-width="3"/>';
  const badge='<circle cx="'+(x+35)+'" cy="'+(y+35)+'" r="20" fill="#176f90"/>'+
    '<text x="'+(x+35)+'" y="'+(y+42)+'" fill="#fff" font-size="19" font-weight="800" text-anchor="middle">'+(i+1)+'</text>';
  const a='<text x="'+(x+115)+'" y="'+(y+92)+'" fill="#143e55" font-size="21" font-weight="750" text-anchor="middle">'+escape(name)+'</text>';
  const b='<text x="'+(x+115)+'" y="'+(y+131)+'" fill="#3b5868" font-size="16" text-anchor="middle">'+escape(details[i])+'</text>';
  return rect+badge+a+b;
 }).join("");
 const arrows=[0,1,2].map(i=>{
  const x=264+i*265;
  return '<line x1="'+x+'" y1="288" x2="'+(x+32)+'" y2="288" stroke="#168189" stroke-width="5"/>'+
   '<polygon points="'+(x+32)+',278 '+(x+46)+',288 '+(x+32)+',298" fill="#168189"/>';
 }).join("");
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 650" role="img">'+
 '<title>'+escape(title)+'</title><desc>'+escape(subtitle)+'</desc>'+
 '<rect width="1100" height="650" fill="#f9fcfe"/>'+
 '<rect x="15" y="15" width="1070" height="620" rx="16" fill="white" stroke="#c0d5df" stroke-width="2"/>'+
 '<rect x="15" y="15" width="1070" height="110" rx="16" fill="#12384f"/>'+
 '<text x="44" y="65" fill="#fff" font-family="Arial,sans-serif" font-size="26" font-weight="800">'+escape(title)+'</text>'+
 '<text x="44" y="97" fill="#d6eef6" font-family="Arial,sans-serif" font-size="17">'+escape(subtitle)+'</text>'+
 '<text x="45" y="163" fill="#26536c" font-size="18" font-family="Arial,sans-serif">Four related questions to explore — not an operational procedure</text>'+
 nodes+arrows+
 '<rect x="52" y="435" width="996" height="112" rx="14" fill="#e6f1f7" stroke="#93b9cb"/>'+
 '<text x="550" y="471" text-anchor="middle" fill="#154460" font-family="Arial,sans-serif" font-size="20" font-weight="800">INTERPRETATION LIMIT</text>'+
 '<text x="550" y="507" text-anchor="middle" fill="#25495d" font-family="Arial,sans-serif" font-size="17">'+escape(footer)+'</text>'+
 '<rect x="36" y="574" width="1028" height="44" rx="9" fill="#18384b"/>'+
 '<text x="550" y="601" text-anchor="middle" fill="#e8f6fc" font-size="15" font-family="Arial,sans-serif">Aviation Ground School Academy · Original conceptual teaching diagram</text>'+
 '</svg>';
 return Object.freeze({id,svg,alt:"Original Academy conceptual diagram titled "+title+". The four labelled steps are "+labels.join(", ")+". "+footer+" It is a learning illustration, not approved documentation."});
}
function validate(){
 const ids=Object.keys(specs);
 if(ids.length!==8)throw Error("Eight additional original technical diagrams required");
 let total=0;
 for(const [id,array] of Object.entries(units)){
  if(array.length!==2)throw Error("Two additional lessons required for "+id);
  for(const u of array){
   total++;
   if(u.sections.length!==3||u.sections.some(s=>s.body.length<340)||u.figureIds.length!==2||
     u.quiz.length!==2||u.takeaway.length!==3||u.objective.length<75||u.scenario.text.length<150)
    throw Error("Incomplete specialist extension "+u.id);
   for(const figureId of u.figureIds)if(!specs[figureId])throw Error("Unknown new diagram "+figureId);
   for(const q of u.quiz)if(q.options.length!==4||q.answer<0||q.answer>3||q.options[q.answer].length<20)
    throw Error("Incomplete practice check "+u.id);
  }
 }
 for(const id of ids){
  const figure=getPlate(id);
  if(figure.svg.length<1700||figure.alt.length<100||!figure.svg.includes("</svg>")||
   /<script|foreignObject|<image /i.test(figure.svg))throw Error("Invalid extension diagram "+id);
 }
 return Object.freeze({additionalLessons:total,additionalPlates:ids.length,
   additionalQuestions:8,status:"UNACCREDITED_PUBLIC_SAMPLES",revision:REVISION});
}
const api=Object.freeze({REVISION,units,getPlate,validate,plateIds:Object.freeze(Object.keys(specs))});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSASpecialistExtension=api;
})(typeof window!=="undefined"?window:null);
