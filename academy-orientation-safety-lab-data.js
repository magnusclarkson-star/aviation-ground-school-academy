/* Course 01 — Safety Observation Lab. Fictional, instructor-review-pending,
   device-only learning content; never contributes to verified academic credit. */
(function(root){"use strict";
const REVISION="2026-11-14-orientation-practical-1";
const cases=Object.freeze([
 Object.freeze({
  id:"briefing",number:1,picture:"photo-01",
  title:"Before approaching the training aircraft",
  illustration:"Approved Academy photograph: instructor and learner briefing. The group situation below is fictional and is not a claim about anyone shown.",
  situation:"At a supervised Air Scout aviation visit, some learners start walking towards a demonstration aircraft before the instructor has explained the safe viewing boundary.",
  question:"What is the safest first decision?",
  options:Object.freeze([
   "Wait outside the activity boundary and ask the supervising instructor for a briefing.",
   "Follow the group because others are already walking towards the aircraft.",
   "Touch a visible flight control to find out what it does."
  ]),answer:0,
  fact:"The safety boundary has not been explained to the group.",
  assumption:"It is not established that the aircraft is safe to approach or touch.",
  immediate:"Remain at the agreed meeting point and ask the supervising adult for clear boundaries.",
  report:"Tell the instructor what you observed, without identifying or blaming other learners.",
  explanation:"Seeing an aircraft or other learners nearby does not establish permission. A responsible instructor sets the boundary and supervises the activity.",
  scouts:"Air Scouts: pause with your patrol and ask your appointed adult leader to confirm the safe viewing area.",
  pilots:"Aspiring pilots: distinguish a classroom visit from authorised aircraft access and preflight instruction."
 }),
 Object.freeze({
  id:"walkway",number:2,picture:"photo-02",
  title:"An obstruction near the walking route",
  illustration:"Approved Academy photograph: trainer aircraft on an apron. The equipment case in this fictional scenario is described for learning; it may not appear in the photo.",
  situation:"In a fictional aircraft-display area, an equipment case has been left across the marked visitor walking route. No one has been injured.",
  question:"Which response shows early hazard prevention?",
  options:Object.freeze([
   "Step off the route and lead the group between parked aircraft to get around it.",
   "Stop before the obstruction, keep the group clear and tell the responsible supervising adult.",
   "Post a photo accusing a named person of causing the hazard."
  ]),answer:1,
  fact:"An equipment case obstructs the fictional marked visitor route.",
  assumption:"Who left the case, and why, are unknown.",
  immediate:"Keep people clear of the obstruction without entering a restricted or unfamiliar area.",
  report:"Alert the supervising adult or designated site operator, who can arrange an authorised correction.",
  explanation:"A hazard can be reported before anyone is hurt. Entering an unfamiliar aircraft area or blaming someone without evidence introduces new risks.",
  scouts:"Air Scouts: stay together, keep a safe distance and inform the patrol's responsible adult.",
  pilots:"Aspiring pilots: avoid self-authorised apron movement; notify the person responsible for the site."
 }),
 Object.freeze({
  id:"diagram",number:3,picture:"detail-11",
  title:"An unexpected instrument lesson",
  illustration:"Approved Academy safety-management illustration. The mismatched instrument description is a fictional classroom situation, not something proven by the image.",
  situation:"During a simulated instrument lesson, the display graphic does not match its written explanation. A classmate suggests memorising the graphic anyway.",
  question:"What is the most useful evidence-based action?",
  options:Object.freeze([
   "Assume the aircraft instrument must be defective.",
   "Ignore the mismatch because the picture is in an Academy lesson.",
   "Note the exact mismatch, pause relying on the image and request a source-based instructor review."
  ]),answer:2,
  fact:"The fictional display and its explanation disagree.",
  assumption:"Neither the cause nor the real aircraft behaviour is proven by the discrepancy.",
  immediate:"Do not use the disputed graphic as an operational reference.",
  report:"Record the lesson section and conflicting indications for an authorised content reviewer.",
  explanation:"Good safety culture separates a verifiable observation from a guessed cause, then checks authoritative information before correcting teaching material.",
  scouts:"Air Scouts: ask your instructor to help check the picture and explain what is uncertain.",
  pilots:"Aspiring pilots: document the observed discrepancy and compare it with a current approved source and qualified instruction."
 })
]);
const reportFields=Object.freeze([
 Object.freeze({id:"observed",label:"1. What did you directly observe?",placeholder:"Example: In a fictional briefing area, a case blocked the marked visitor path."}),
 Object.freeze({id:"consequence",label:"2. What could happen if no one acts?",placeholder:"Example: A learner may trip or move into an unfamiliar aircraft area."}),
 Object.freeze({id:"protect",label:"3. What immediate safe step would you take?",placeholder:"Example: Stop at the boundary, keep the group clear and do not move equipment."}),
 Object.freeze({id:"notify",label:"4. Who should receive the report?",placeholder:"Example: The supervising adult or designated safety lead."})
]);
function get(id){return cases.find(c=>c.id===id)||null}
function checkDecision(id,answer){
 const item=get(id);
 if(!item||!Number.isInteger(answer)||answer<0||answer>=item.options.length)
  throw Error("Choose one of the fictional safety responses");
 return Object.freeze({id,correct:answer===item.answer,answer:item.options[item.answer],
  explanation:item.explanation,fact:item.fact,assumption:item.assumption,
  immediate:item.immediate,report:item.report});
}
function reviewReport(raw){
 const values={};const missing=[];
 for(const field of reportFields){
  const value=typeof raw?.[field.id]==="string"?raw[field.id].trim():"";
  if(value.length<12||value.length>320)missing.push(field.label);
  values[field.id]=value.slice(0,320);
 }
 return Object.freeze({complete:missing.length===0,missing,
  note:"Fictional classroom practice only. Do not enter real names, personal data, photographs, aircraft identifiers or exact locations. Nothing is uploaded or saved.",
  values:Object.freeze(values)});
}
function validate(atlas){
 if(cases.length!==3||reportFields.length!==4||new Set(cases.map(c=>c.id)).size!==3)
  throw Error("Course 01 must have three distinct pictorial situations and four report fields");
 for(const item of cases){
  if(item.options.length!==3||!Number.isInteger(item.answer)||item.answer<0||item.answer>2||
   item.situation.length<100||item.explanation.length<100||!item.scouts||!item.pilots)
   throw Error("Incomplete safety practice: "+item.id);
  const picture=atlas?.getById(item.picture);
  if(!picture||!["photographs","detailed"].includes(picture.group))
   throw Error("Course 01 must reuse an existing owner-approved illustrated picture: "+item.picture);
 }
 return Object.freeze({course:"orientation",cases:3,reportFields:4,status:"OPTIONAL_UNVERIFIED_LEARNING",revision:REVISION});
}
const api=Object.freeze({REVISION,cases,reportFields,get,checkDecision,reviewReport,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAOrientationSafetyLab=api;
})(typeof window!=="undefined"?window:null);
