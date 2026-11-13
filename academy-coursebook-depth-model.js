/* Academy deep ground-school learning model. Original editorial teaching material; unverified device-only progress. */
(function(root){"use strict";
const A=root?.AGSADepthPartA||(typeof module!=="undefined"?require("./academy-coursebook-depth-a.js"):null);
const B1=root?.AGSADepthPartB1||(typeof module!=="undefined"?require("./academy-coursebook-depth-b1.js"):null);
const B2=root?.AGSADepthPartB2||(typeof module!=="undefined"?require("./academy-coursebook-depth-b2.js"):null);
const Core=root?.AGSACompleteCoursebook||(typeof module!=="undefined"?require("./academy-coursebook-data.js"):null);
const REVISION="2026-11-13-depth-1", KEY="agsa.coursebook.depthAttempts.v1", FINAL_KEY="agsa.coursebook.capstoneAttempts.v1";
const units=Object.freeze([...A,...B1,...B2]);
const references=Object.freeze({
 pha:{name:"FAA Pilot’s Handbook of Aeronautical Knowledge",url:"https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak"},
 afh:{name:"FAA Airplane Flying Handbook",url:"https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook"},
 library:{name:"FAA Aviation Handbooks and Manuals",url:"https://www.faa.gov/regulations_policies/handbooks_manuals/aviation"},
 easa:{name:"EASA Easy Access Rules for Aircrew",url:"https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-aircrew"}
});
const chapterMap=Object.freeze({
 orientation:["Introduction to Flying","Aeronautical Decision-Making"],
 aircraft:["Aircraft Construction","Flight Controls"],
 aerodynamics:["Principles of Flight","Aerodynamics of Flight"],
 systems:["Aircraft Systems","Flight Manuals and Other Documents"],
 instruments:["Flight Instruments"],
 meteorology:["Weather Theory","Aviation Weather Services"],
 navigation:["Navigation"],
 airspace:["Airport Operations","Airspace"],
 communications:["Airport Operations","Aeronautical Information Manual"],
 performance:["Weight and Balance","Aircraft Performance"],
 human:["Aeronautical Decision-Making","Aeromedical Factors"],
 rotorcraft:["Principles of Flight","Flight Controls","Helicopter Flying Handbook"]
});
const subjectMap=Object.freeze({
 orientation:"Operational procedures",aircraft:"Aircraft general knowledge",
 aerodynamics:"Principles of flight",systems:"Aircraft general knowledge",
 instruments:"Aircraft general knowledge",meteorology:"Meteorology",
 navigation:"Navigation",airspace:"Air law",communications:"Communications",
 performance:"Flight performance and planning",human:"Human performance",
 rotorcraft:"Principles of flight"
});
function unit(id){return units.find(x=>x.id===id)||null}
function validate(){
 if(!Core||Core.validate().modules!==12||units.length!==12||new Set(units.map(x=>x.id)).size!==12)throw Error("Deep curriculum must match all twelve core subjects");
 const ids=new Set(Core.modules.map(x=>x.id));
 for(const u of units){
  if(!ids.has(u.id)||!chapterMap[u.id]||!subjectMap[u.id]||!u.focus?.scouts||!u.focus?.pilots||!Array.isArray(u.glossary)||u.glossary.length!==3)throw Error("Incomplete pathway or reference "+u.id);
  if(u.lessons?.length!==3||u.questions?.length!==3||u.scenario?.options?.length!==3)throw Error("Incomplete deep lessons "+u.id);
  for(const s of u.lessons)if(typeof s.title!=="string"||s.concept.length<190||s.example.length<115||s.task.length<55)throw Error("Incomplete explained lesson "+u.id+" / "+s.title);
  for(const q of u.questions)if(q.length!==4||q[0].length<25||q[1]?.length!==3||new Set(q[1]).size!==3||!Number.isInteger(q[2])||q[2]<0||q[2]>2||q[3].length<25)throw Error("Invalid deep question "+u.id);
  if(!Number.isInteger(u.scenario.answer)||u.scenario.answer<0||u.scenario.answer>2||u.scenario.why.length<40)throw Error("Invalid applied case "+u.id);
 }
 return {modules:12,advancedLessons:36,advancedQuestions:36,scenarios:12,capstoneQuestions:24,revision:REVISION};
}
function grade(id,answers,caseAnswer){
 const u=unit(id);if(!u)throw Error("Unknown deep module");
 if(!Array.isArray(answers)||answers.length!==3||answers.some(a=>!Number.isInteger(a)||a<0||a>2)||!Number.isInteger(caseAnswer)||caseAnswer<0||caseAnswer>2)throw Error("Answer the scenario and all three questions");
 const checks=u.questions.map((q,i)=>({correct:answers[i]===q[2],selected:answers[i],correctIndex:q[2],answer:q[1][q[2]],explanation:q[3]}));
 const caseCorrect=caseAnswer===u.scenario.answer,correct=checks.filter(x=>x.correct).length+(caseCorrect?1:0);
 return {id,revision:REVISION,correct,total:4,caseCorrect,practiceTargetMet:correct>=3&&caseCorrect,checks,
  caseFeedback:{correct:caseCorrect,answer:u.scenario.options[u.scenario.answer],explanation:u.scenario.why}};
}
function cleanHistory(raw){
 return (Array.isArray(raw)?raw:[]).filter(x=>x&&unit(x.id)&&x.revision===REVISION&&Number.isInteger(x.correct)&&x.correct>=0&&x.correct<=4&&typeof x.caseCorrect==="boolean"&&Number.isSafeInteger(x.at)&&x.at>0).slice(-96)
 .map(x=>({id:x.id,revision:REVISION,correct:x.correct,caseCorrect:x.caseCorrect,at:x.at}));
}
function attemptsOverview(history,route="scouts"){
 const path=Core.routes[route];if(!path)throw Error("Unknown route");
 const data=cleanHistory(history),items=path.map(id=>{
  const attempts=data.filter(x=>x.id===id),latest=attempts.at(-1);
  return {id,attempts:attempts.length,latestCorrect:latest?.correct??null,metTarget:!!latest&&latest.correct>=3&&latest.caseCorrect};
 });
 const next=items.find(x=>!x.attempts)||items.find(x=>!x.metTarget);
 return {revision:REVISION,attempts:data.length,practised:items.filter(x=>x.attempts>0).length,metTarget:items.filter(x=>x.metTarget).length,nextId:next?.id??null,items};
}
function capstoneQuestions(seed=0){
 if(!Number.isSafeInteger(seed)||seed<0)throw Error("Invalid capstone seed");
 const picks=units.flatMap(u=>u.questions.slice(0,2).map((q,i)=>({id:u.id+"-deep-"+i,moduleId:u.id,prompt:q[0],options:[...q[1]],answer:q[2],explanation:q[3]})));
 let state=(seed>>>0)||0x9e3779b9;
 const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0};
 for(let i=picks.length-1;i>0;i--){const j=random()%(i+1);[picks[i],picks[j]]=[picks[j],picks[i]]}
 return picks;
}
function gradeCapstone(answers,seed=0){
 const questions=capstoneQuestions(seed);
 if(!Array.isArray(answers)||answers.length!==24||answers.some(a=>!Number.isInteger(a)||a<0||a>2))throw Error("Complete all 24 capstone questions");
 const feedback=questions.map((q,i)=>({id:q.id,moduleId:q.moduleId,correct:answers[i]===q.answer,chosen:answers[i],answer:q.options[q.answer],explanation:q.explanation}));
 const correct=feedback.filter(x=>x.correct).length;
 return {revision:REVISION,correct,total:24,percent:Math.round(correct/24*100),practiceTargetMet:correct>=18,feedback};
}
function cleanFinal(raw){
 return (Array.isArray(raw)?raw:[]).filter(x=>x&&x.revision===REVISION&&Number.isInteger(x.correct)&&x.correct>=0&&x.correct<=24&&Number.isSafeInteger(x.at)&&x.at>0).slice(-20).map(x=>({revision:REVISION,correct:x.correct,at:x.at}));
}
function completion(coreHistory,deepHistory,finalHistory){
 const core=Core.clean(coreHistory),deep=attemptsOverview(deepHistory);
 const coreCount=Core.modules.filter(m=>{const last=core.filter(x=>x.id===m.id).at(-1);return !!last&&last.correct>=2}).length;
 const final=cleanFinal(finalHistory),best=Math.max(0,...final.map(x=>x.correct));
 return {coreTargetCount:coreCount,deepTargetCount:deep.metTarget,capstoneBest:final.length?best:null,
  selfStudyRouteComplete:coreCount===12&&deep.metTarget===12&&best>=18,
  status:"UNVERIFIED_SELF_STUDY_ONLY"};
}
function exportSummary(coreHistory,deepHistory,finalHistory,route="scouts",now=new Date().toISOString()){
 if(!Core.routes[route]||!Number.isFinite(Date.parse(now)))throw Error("Invalid export metadata");
 return {schema:"agsa.coursebook.deep-self-study.v1",revision:REVISION,pathway:route,createdAt:new Date(now).toISOString(),
  status:"UNVERIFIED_EDITABLE_DEVICE_RECORD",corePractice:Core.clean(coreHistory),
  advancedPractice:cleanHistory(deepHistory),capstonePractice:cleanFinal(finalHistory),
  summary:completion(coreHistory,deepHistory,finalHistory),
  notice:"This is a self-study souvenir, not an Academy-issued certificate, course credit, verified examination, instructor endorsement or aviation qualification."};
}
const api=Object.freeze({REVISION,KEY,FINAL_KEY,units,references,chapterMap,subjectMap,unit,validate,grade,cleanHistory,attemptsOverview,capstoneQuestions,gradeCapstone,cleanFinal,completion,exportSummary});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSADeepCoursebook=api;
})(typeof window!=="undefined"?window:null);
