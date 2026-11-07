/* AGSA Instructor Review Workbench — UNVERIFIED DOCUMENT REVIEW ONLY.
 * Stateless parsing and draft creation. No identity, authentication or certification.
 * Import contents are untrusted and may have been edited by anyone.
 */
(function(root){
 "use strict";
 const version="agsa.review-workbench.v1";
 const draftSchema="agsa.unverified-review-draft.v1";
 const allowedTasks=["level","climb","turn","descent","flap"];
 const outcomes=["PRACTICE_TARGET_MET","PRACTICE_AGAIN","INCOMPLETE"];
 const rubricKeys=["instrumentScan","controlCoordination","riskAwareness"];
 const rubricChoices=["not-reviewed","needs-discussion","practice-recommended"];
 const maxBytes=262144;
 const maxEntries=20;
 const trunc=(s,n)=>typeof s==="string"?s.slice(0,n):"";
 const object=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
 const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
 function normalizedTime(value){
  if(typeof value!=="string"||value.length>40||!/^\d{4}-\d\d-\d\dT/.test(value)||!Number.isFinite(Date.parse(value)))throw Error("Invalid report timestamp.");
  return value;
 }
 function normalizeReport(report){
  if(!object(report)||report.schema!=="agsa.practice-observation.v1")throw Error("Only supported AGSA practice report JSON is accepted.");
  if(!object(report.task)||!allowedTasks.includes(report.task.id))throw Error("Practice task is missing or unsupported.");
  const obs=report.observation;
  if(!object(obs)||!outcomes.includes(obs.outcome)||!integer(obs.samples,0,120)||
     !integer(obs.matchedSamples,0,obs.samples)||!integer(obs.matchedPercent,0,100)||
     !Number.isFinite(obs.observedSeconds)||obs.observedSeconds<0||obs.observedSeconds>12.2)throw Error("Practice observation figures are invalid.");
  if(Math.abs(obs.matchedPercent-(obs.samples?100*obs.matchedSamples/obs.samples:0))>1.1)throw Error("Percentage and observed samples do not match.");
  const timestamp=normalizedTime(report.createdAt);
  const feedback=object(report.automatedPracticeFeedback)?report.automatedPracticeFeedback:null;
  const notes=feedback&&Array.isArray(feedback.nextSteps)?feedback.nextSteps.filter(v=>typeof v==="string").slice(0,3).map(v=>v.slice(0,240)):[];
  return {
   key:"report-"+timestamp+"-"+report.task.id,
   sourceType:"individual-report",taskId:report.task.id,taskTitle:trunc(report.task.title,100)||report.task.id,
   createdAt:timestamp,outcome:obs.outcome,score:obs.matchedPercent,observedSeconds:obs.observedSeconds,
   sampleCount:obs.samples,sourceEvidence:"User-supplied, editable and unsigned browser report. Claims cannot be independently verified.",
   sourceHint:trunc(report.task.exampleTarget,300),
   autoSuggestions:notes,
   finalIllustrativeIndications:object(report.finalIllustrativeIndications)?{
    pitchDeg:Number.isFinite(report.finalIllustrativeIndications.pitchDeg)?report.finalIllustrativeIndications.pitchDeg:null,
    bankDeg:Number.isFinite(report.finalIllustrativeIndications.bankDeg)?report.finalIllustrativeIndications.bankDeg:null,
    airspeedKt:Number.isFinite(report.finalIllustrativeIndications.airspeedKt)?report.finalIllustrativeIndications.airspeedKt:null,
    verticalSpeedFpm:Number.isFinite(report.finalIllustrativeIndications.verticalSpeedFpm)?report.finalIllustrativeIndications.verticalSpeedFpm:null
   }:null
  };
 }
 function normalizeJournalRecord(item,i){
  if(!object(item)||!allowedTasks.includes(item.taskId)||!integer(item.score,0,100)||
     !outcomes.includes(item.outcome))throw Error("Journal entry "+(i+1)+" is invalid.");
  const timestamp=normalizedTime(item.storedAt);
  return {
   key:"journal-"+i+"-"+timestamp,
   sourceType:"local-journal-export",taskId:item.taskId,taskTitle:trunc(item.taskTitle,100)||item.taskId,
   createdAt:timestamp,outcome:item.outcome,score:item.score,
   observedSeconds:Number.isFinite(item.observedSeconds)&&item.observedSeconds>=0&&item.observedSeconds<=12.2?item.observedSeconds:null,
   sampleCount:null,sourceEvidence:"User-supplied, editable, unsigned local journal summary. No original observation samples or verified identity.",
   sourceHint:"Journal summary only — finer-grained observations are unavailable.",
   autoSuggestions:Array.isArray(item.suggestedNextSteps)?item.suggestedNextSteps.filter(v=>typeof v==="string").slice(0,3).map(v=>v.slice(0,240)):[],
   finalIllustrativeIndications:null
  };
 }
 function parse(input){
  if(!object(input))throw Error("Expected a JSON object.");
  if(input.schema==="agsa.practice-observation.v1")return {kind:"individual-report",records:[normalizeReport(input)]};
  if(input.schema==="agsa.local-journal.v1"){
   if(!Array.isArray(input.records)||input.records.length>maxEntries)throw Error("Journal must contain at most 20 entries.");
   const records=input.records.map(normalizeJournalRecord);
   return {kind:"local-journal-export",records};
  }
  throw Error("Unsupported report format. Upload an unofficial AGSA skills report or exported local practice journal.");
 }
 function parseText(raw){
  if(typeof raw!=="string")throw Error("Text is required.");
  if(new TextEncoder().encode(raw).length>maxBytes)throw Error("Import exceeds the 256 KB limit.");
  let data;
  try{data=JSON.parse(raw)}catch(e){throw Error("Invalid JSON — upload a complete .json file exported from AGSA.");}
  return parse(data);
 }
 function reviewDraft(record,answers,time){
  if(!object(record)||!allowedTasks.includes(record.taskId)||!outcomes.includes(record.outcome))throw Error("Choose a supported report to review.");
  if(!object(answers))throw Error("Review notes required.");
  const rubric={};
  for(const key of rubricKeys){
   const val=answers[key];
   if(!rubricChoices.includes(val))throw Error("Invalid rubric selection: "+key);
   rubric[key]=val;
  }
  const commentary=trunc(answers.commentary,1200).trim();
  const nextAction=trunc(answers.nextAction,600).trim();
  if(!commentary&&!nextAction)throw Error("Enter at least one review note or proposed next action.");
  const createdAt=typeof time==="string"?normalizedTime(time):new Date().toISOString();
  return {
   schema:draftSchema,
   recordStatus:"UNVERIFIED_DRAFT_ONLY",
   notice:"THIS IS NOT AN INSTRUCTOR SIGN-OFF, OFFICIAL STUDENT RECORD, EXAM RESULT, CERTIFICATE OR FLIGHT-TIME CREDIT.",
   generatedAt:createdAt,
   source:{type:record.sourceType,taskId:record.taskId,taskTitle:record.taskTitle,
    claimedPracticeTime:record.createdAt,claimedOutcome:record.outcome,claimedScorePercent:record.score,
    evidenceLimit:record.sourceEvidence},
   reviewQuestions:{rubric,comments:commentary,proposedNextAction:nextAction},
   requirementsBeforeOfficialUse:[
    "Authenticated student and instructor identities with verified instructor qualifications and authorization.",
    "Approved course and source-backed competency standards instead of illustrative scoring thresholds.",
    "Server-side tamper-evident original records and audit history, retention and privacy controls.",
    "Supervisor/instructor assessment of appropriate source evidence and formal sign-off under competent authority rules."
   ]
  };
 }
 function demo(){
  return {
   schema:"agsa.practice-observation.v1",
   createdAt:"2026-11-07T18:00:00.000Z",
   disclaimer:"DEMO — UNOFFICIAL SELF-PRACTICE REPORT, NOT A CERTIFICATE",
   task:{id:"turn",title:"Controlled bank and turn",exampleTarget:"Fictional practice: bank 8°–32°, turn rate 0.5–5°/s, coordinated turn."},
   observation:{observedSeconds:12,samples:120,matchedSamples:91,matchedPercent:76,
    outcome:"PRACTICE_TARGET_MET"},
   finalIllustrativeIndications:{pitchDeg:1.1,bankDeg:19.2,airspeedKt:95,verticalSpeedFpm:15},
   automatedPracticeFeedback:{nextSteps:["Practise smoother bank corrections.","Compare slip/skid to turn rate."]}
  };
 }
 const api={version,draftSchema,maxBytes,maxEntries,allowedTasks,rubricKeys,rubricChoices,parse,parseText,reviewDraft,demo};
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.AGSAReviewModel=api;
})(typeof window!=="undefined"?window:null);
