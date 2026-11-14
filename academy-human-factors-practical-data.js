/* Course 11 — picture-led human factors, threat recognition and classroom decisions.
 * Original Academy artwork only. Ungraded and non-operational. */
(function(root){"use strict";
const REVISION="2026-11-14-human-factors-practical-v1";
const cases=Object.freeze([
 Object.freeze({
  id:"readiness",number:1,title:"Recognise personal readiness",
  pictures:Object.freeze(["overview-09","detail-09"]),
  situation:"A fictional learner has had little sleep and feels distracted before a scheduled practical lesson. Another student is worried about disappointing the group if the lesson is postponed. Explore the personal factors rather than assuming enthusiasm means fitness.",
  question:"Which response best demonstrates sound personal-risk awareness?",
  options:Object.freeze(["Ignore fatigue because the lesson was booked.","Recognise the signs, disclose uncertainty and reassess with a qualified instructor.","Use a successful quiz result as proof of fitness."]),answer:1,
  explanation:"Fatigue, illness, medication effects, stress and external pressure can affect perception and judgement. An IMSAFE self-check prompts honest reflection, not a medical diagnosis or licence to operate. Formal fitness assessments and decisions are made under the applicable rules and qualified guidance.",
  key:Object.freeze([["IMSAFE","A common pilot self-check covering Illness, Medication, Stress, Alcohol, Fatigue, and Emotion/Eating"],["Fatigue","Can reduce vigilance and decision quality"],["Medication","Side effects and suitability require qualified guidance"],["External pressure","Schedule or peer expectations that can bias a judgement"],["Self-awareness","Recognising when additional assessment is needed"]]),
  scouts:"Air Scouts: discuss why someone should speak up when tired or unwell instead of trying to impress the group.",
  pilots:"Aspiring pilots: distinguish an IMSAFE prompt from an aeromedical approval or authorised fitness assessment."
 }),
 Object.freeze({
  id:"pave",number:2,title:"Connect hazards using the PAVE model",
  pictures:Object.freeze(["detail-09"]),
  situation:"In a purely fictional planning discussion, a pilot is tired, a maintenance discrepancy is not yet explained, the forecast is deteriorating and passengers want to arrive on schedule. The hazards span several categories and can reinforce one another.",
  question:"Which statement best describes a PAVE review?",
  options:Object.freeze(["It looks at Pilot, Aircraft, enVironment and External pressures together.","It proves that one good weather report cancels all other risks.","It replaces current operational and regulatory requirements."]),answer:0,
  explanation:"PAVE groups risk factors into Pilot, Aircraft, enVironment and External pressures. It helps expose interacting hazards rather than giving a universal numeric safety score. Finding a hazard may require additional information, authorised action, postponement or a changed plan; the classroom cannot decide whether any actual flight should proceed.",
  key:Object.freeze([["Pilot","Personal readiness and competence"],["Aircraft","Condition, documents and applicable limitations"],["enVironment","Weather, terrain, airspace and operating conditions"],["External pressures","Time, expectations and commitments"],["Risk management","Ongoing identification, assessment and management of threats"]]),
  scouts:"Air Scouts: tap each PAVE card and explain one hazard in a supervised group briefing.",
  pilots:"Aspiring pilots: describe why independent hazards may combine and why the final decision needs current information."
 }),
 Object.freeze({
  id:"workload",number:3,title:"Prioritise when attention becomes overloaded",
  pictures:Object.freeze(["overview-09"]),
  situation:"During a fictional flight simulation, the training screen shows an unexpected indication as a passenger asks a question and a nonessential reminder appears. The exercise tests recognition of distraction and fixation, not emergency handling of any aircraft.",
  question:"What is the best general human-factors lesson?",
  options:Object.freeze(["Attempt every competing task simultaneously.","Fixate on the nonessential reminder until it disappears.","Recognise task saturation, protect essential awareness and prioritise with appropriate support."]),answer:2,
  explanation:"High workload can narrow attention, reduce cross-checking and cause fixation on a single item. Training should build prioritisation, communication and use of available resources. Specific flight priorities, checklists and emergency actions must follow approved aircraft procedures and qualified instruction, not this demonstration.",
  key:Object.freeze([["Task saturation","More simultaneous demands than a person can manage effectively"],["Fixation","Attention captured by one issue while other cues are missed"],["Situational awareness","Understanding the current circumstances and their likely development"],["Workload sharing","Appropriate coordination of tasks and available resources"],["Distraction management","Identifying and handling nonessential demands"]]),
  scouts:"Air Scouts: recognise how distractions can hide a more important safety cue.",
  pilots:"Aspiring pilots: connect workload management to situational awareness and crew/resource management."
 }),
 Object.freeze({
  id:"reporting",number:4,title:"Speak up, report and learn",
  pictures:Object.freeze(["detail-09","overview-11"]),
  situation:"A student notices that a simulator shows an impossible response. Another learner says not to mention it because the lesson is nearly over. The group must choose between concealing the error and raising a clear concern.",
  question:"Which response supports a constructive aviation safety culture?",
  options:Object.freeze(["Hide the discrepancy to avoid delaying the lesson.","Treat the simulator as authoritative even if it contradicts evidence.","Explain what was observed, report the discrepancy and request instructor review."]),answer:2,
  explanation:"Early hazard reporting and respectful challenge help teams learn and stop errors spreading. A useful report records what was observed, where and when it occurred, and what further review is required. Student observations are not formal investigation findings or proof of an aircraft fault.",
  key:Object.freeze([["Speak up","Raise a specific concern clearly and respectfully"],["Observation","What was actually seen or measured"],["Assumption","An interpretation that may need testing"],["Reporting","Use the appropriate educational or organisational channel"],["Just culture","Accountability and learning without automatically equating error with blame"]]),
  scouts:"Air Scouts: practise describing a problem without guessing who caused it.",
  pilots:"Aspiring pilots: separate observations, assumptions and follow-up action in an incident-style note."
 })
]);
const IMSAFE=Object.freeze([
 Object.freeze({id:"illness",name:"Illness",cue:"Symptoms or poor health may affect performance."}),
 Object.freeze({id:"medication",name:"Medication",cue:"Side effects and restrictions require qualified advice."}),
 Object.freeze({id:"stress",name:"Stress",cue:"Pressure can narrow attention or judgement."}),
 Object.freeze({id:"alcohol",name:"Alcohol",cue:"Impairment and legal limits are serious safety concerns."}),
 Object.freeze({id:"fatigue",name:"Fatigue",cue:"Lack of rest can reduce vigilance."}),
 Object.freeze({id:"emotion",name:"Emotion / eating",cue:"Emotional strain or inadequate nourishment can affect readiness."})
]);
const PAVE=Object.freeze([
 Object.freeze({id:"pilot",label:"P · Pilot",hint:"The learner is tired",why:"A personal readiness hazard; assess fitness and seek appropriate advice."}),
 Object.freeze({id:"aircraft",label:"A · Aircraft",hint:"A discrepancy has not been explained",why:"Aircraft status and required documentation need authorised review."}),
 Object.freeze({id:"environment",label:"V · enVironment",hint:"The forecast is deteriorating",why:"Current and expected environmental conditions matter."}),
 Object.freeze({id:"pressure",label:"E · External pressures",hint:"Passengers expect to arrive on time",why:"Schedule expectations can create unsafe pressure."})
]);
const WORKLOAD=Object.freeze([
 Object.freeze({id:"essential",label:"Essential safety awareness",hint:"Protect attention for the situation and any immediate hazards."}),
 Object.freeze({id:"support",label:"Appropriate help and communication",hint:"Use trained people and authorised procedures when appropriate."}),
 Object.freeze({id:"secondary",label:"Nonessential interruption",hint:"Recognise lower-priority demands rather than dividing attention endlessly."})
]);
function get(id){return cases.find(x=>x.id===id)||null}
function evaluate(id,choice){
 const c=get(id);
 if(!c||!Number.isInteger(choice)||choice<0||choice>=c.options.length)
  throw Error("Choose a valid human-factors classroom answer");
 return Object.freeze({id,correct:choice===c.answer,expected:c.options[c.answer],explanation:c.explanation,key:c.key});
}
function readiness(selected){
 if(!Array.isArray(selected)||selected.some(id=>!IMSAFE.some(x=>x.id===id))||new Set(selected).size!==selected.length)
  throw Error("Choose unique known IMSAFE prompts");
 const flags=IMSAFE.filter(x=>selected.includes(x.id));
 return Object.freeze({count:flags.length,flags:Object.freeze(flags),
  message:flags.length?"One or more prompts need honest follow-up; this is not a fitness approval or an operational go/no-go result.":"No concern selected in this classroom prompt. That does not establish fitness for any flight."});
}
function pave(id){
 const c=PAVE.find(x=>x.id===id);
 if(!c)throw Error("Choose a PAVE risk category");
 return c;
}
function workload(id){
 const c=WORKLOAD.find(x=>x.id===id);
 if(!c)throw Error("Choose a workload concept");
 return c;
}
function validate(atlas){
 if(cases.length!==4||new Set(cases.map(x=>x.id)).size!==4)throw Error("Four human-factors picture lessons required");
 let pictureViews=0;
 for(const c of cases){
  if(c.options.length!==3||!Number.isInteger(c.answer)||c.answer<0||c.answer>2||
   c.situation.length<140||c.explanation.length<180||c.key.length!==5||!c.scouts||!c.pilots)
   throw Error("Incomplete human-factors lesson "+c.id);
  for(const picture of c.pictures){
   const a=atlas?.getById(picture);
   if(!a||!["detailed","overview"].includes(a.group))
    throw Error("Only approved original human-factors teaching pictures may be used "+picture);
   pictureViews++;
  }
 }
 if(IMSAFE.length!==6||PAVE.length!==4||WORKLOAD.length!==3)throw Error("Missing classroom prompt set");
 return Object.freeze({moduleId:"human",cases:4,pictureViews,readinessPrompts:6,paveCategories:4,
  status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:REVISION});
}
const api=Object.freeze({REVISION,cases,IMSAFE,PAVE,WORKLOAD,get,evaluate,readiness,pave,workload,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAHumanFactorsPractical=api;
})(typeof window!=="undefined"?window:null);
