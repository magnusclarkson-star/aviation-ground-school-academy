/* Aviation Ground School Academy — fictional, device-only module checkpoints.
 * This is a public answer key and self-check exercise, NOT a secure exam.
 * No instructor authentication, flight proficiency rating, certificate,
 * accredited training hours, student identity or cloud record is produced.
 */
(function(root){
"use strict";
const L=root?.AGSAAIInstructorLessons||(typeof module!=="undefined"?require("./ai-instructor-lessons.js"):null);
const C=root?.AGSACurriculum||(typeof module!=="undefined"?require("./ai-instructor-curriculum.js"):null);
const REVISION="2026-11-08.1",STORAGE_KEY="agsa.groundschool.moduleAttempts.v1",MAX=48;
const modules=Object.freeze([
 {id:"foundations",title:"Module 1 · Aircraft and the forces of flight",lessons:["forces","anatomy"],
  summary:"Explore basic aerodynamics and recognise the main parts of a conventional aeroplane."},
 {id:"cockpit",title:"Module 2 · Controls and flight instruments",lessons:["controls","instruments"],
  summary:"Identify control axes and read the simplified primary instrument indications."},
 {id:"operations",title:"Module 3 · Configuration and preparation",lessons:["flaps","preflight"],
  summary:"Investigate the simplified flap model and the limits of preflight teaching tools."},
 {id:"awareness",title:"Module 4 · Weather and communications",lessons:["weather","radio"],
  summary:"Identify information sources and distinguish educational radio practice from ATC."}
]);
const paths=Object.freeze({
 scouts:{id:"scouts",name:"Scouts and Air Scouts",description:"An introductory, youth-accessible offline route; no connected AI, personal profiles or supervised youth training.",
  moduleIds:["foundations","cockpit","awareness","operations"]},
 pilots:{id:"pilots",name:"Aviation enthusiasts and aspiring pilots",description:"A conceptual foundation before formal lessons with a qualified instructor; not PPL/CPL theory credit.",
  moduleIds:["foundations","cockpit","operations","awareness"]}
});
const extras={
 forces:[
  ["Which force acts toward the centre of the Earth?",["Thrust","Weight","Drag"],1,"Weight is the gravitational force acting toward Earth's centre."],
  ["Why might changing power affect more than just thrust?",["Other forces and aircraft motion can change","It always leaves airspeed unchanged","It switches gravity off"],0,"Aircraft speed, attitude and aerodynamic forces can change as the balance of forces changes."]
 ],
 anatomy:[
  ["What is the empennage on a conventional aeroplane?",["A landing wheel","The tail assembly","The engine throttle"],1,"The empennage generally consists of stabilising and control surfaces in the tail area."],
  ["Which primary control surface usually influences roll?",["Rudder","Elevator","Aileron"],2,"Ailerons on conventional aeroplanes primarily influence roll; designs vary."]
 ],
 controls:[
  ["What does the engine throttle commonly command?",["Engine power","Altimeter setting","Yaw directly"],0,"The throttle controls engine power, which influences motion indirectly."],
  ["Moving the joystick to the side principally commands which axis?",["Pitch","Roll","Altitude setting"],1,"Lateral yoke or stick movement typically commands ailerons and roll on conventional aircraft."]
 ],
 instruments:[
  ["What does a vertical-speed indicator show?",["Current air temperature","Selected flap detent","Trend in climb or descent rate"],2,"A VSI indicates a rate-of-altitude-change trend, not a direct flight clearance."],
  ["What is the altimeter indication normally based upon?",["Air pressure and its setting","GPS track alone","Fuel quantity"],0,"A conventional altimeter uses pressure and its selected reference setting; limitations apply."]
 ],
 flaps:[
  ["Where should approved flap limitations for a specific aircraft be checked?",["This fictional demo's 20° selection","That aircraft's approved flight manual","A generic social-media video"],1,"Approved aircraft-specific settings, procedures and speeds come from its applicable flight manual."],
  ["At larger flap settings on many conventional aircraft, what can rise appreciably?",["Engine cylinder count","Earth's gravity","Aerodynamic drag"],2,"Larger flap deflections commonly increase drag, with aircraft-specific effects."]
 ],
 preflight:[
  ["What are NOTAMs used for?",["Notices concerning aeronautical facilities, services or hazards","Daily aircraft battery readings","Generic weather forecasts only"],0,"NOTAMs provide notices relevant to aviation operations; check the applicable current service."],
  ["Can this public ground-school module establish whether an aircraft is airworthy?",["Yes, after six questions","No, it cannot determine airworthiness","Yes, if a student scores full marks"],1,"Only proper aircraft documentation, required checks and competent authorised people determine flight readiness."]
 ],
 weather:[
  ["What does a TAF commonly provide?",["A flight clearance","A forecast for a designated aerodrome","An aircraft maintenance approval"],1,"A TAF is an aerodrome forecast, subject to relevant local rules and updates."],
  ["What kind of information does a METAR normally contain?",["An aerodrome weather observation report","A certificate of airworthiness","A clearance readback"],0,"METAR is a standard aviation routine weather observation report."]
 ],
 radio:[
  ["Why is the aviation spelling alphabet useful?",["To replace ATC instructions","To describe weather radar","To communicate letters clearly"],2,"Standardised spelling words improve clarity, especially for callsigns and ambiguous letters."],
  ["Who issues actual air traffic clearances where required?",["The Academy's fictional tutor","Authorised air traffic services","A simulated cockpit's quiz engine"],1,"Real-world ATC instructions and clearances must come from authorised air traffic services."]
 ]
};
const bank=Object.freeze(L.lessons.flatMap(lesson=>{
 const list=[{id:lesson.id+"-0",lessonId:lesson.id,prompt:lesson.question,
   choices:[...lesson.options],correct:lesson.correct,explanation:lesson.explanation},
  ...extras[lesson.id].map(([prompt,choices,correct,explanation],index)=>({
   id:lesson.id+"-"+(index+1),lessonId:lesson.id,prompt,choices,correct,explanation
  }))];
 return list;
}));
function items(moduleId){
 const group=modules.find(m=>m.id===moduleId);
 if(!group)throw Error("Unknown module");
 return group.lessons.flatMap(id=>bank.filter(q=>q.lessonId===id));
}
function validate(){
 C.validate(L.lessons.map(l=>l.id));
 const ids=L.lessons.map(l=>l.id);
 if(modules.length!==4||bank.length!==24||new Set(bank.map(q=>q.id)).size!==24)throw Error("Module bank must contain 24 unique questions");
 if(new Set(modules.flatMap(m=>m.lessons)).size!==8||modules.some(m=>m.lessons.length!==2||items(m.id).length!==6))
  throw Error("All eight lessons must belong to exactly one two-lesson module");
 if(ids.some(id=>!extras[id]||extras[id].length!==2))throw Error("Incomplete lesson question bank");
 for(const item of bank){
  if(!ids.includes(item.lessonId)||item.prompt.length<18||item.explanation.length<25||
    !Array.isArray(item.choices)||item.choices.length!==3||new Set(item.choices).size!==3||
    !Number.isInteger(item.correct)||item.correct<0||item.correct>2)
   throw Error("Invalid fictional assessment question "+item.id);
 }
 for(const path of Object.values(paths))
  if(path.moduleIds.length!==4||new Set(path.moduleIds).size!==4||
     modules.some(m=>!path.moduleIds.includes(m.id)))throw Error("Invalid pathway ordering");
 return {moduleCount:modules.length,lessonCount:ids.length,questionCount:bank.length,revision:REVISION};
}
function grade(moduleId,answers){
 const questions=items(moduleId);
 if(!Array.isArray(answers)||answers.length!==questions.length||answers.some(v=>!Number.isInteger(v)||v<0||v>2))
  throw Error("Answer all six questions before checking your understanding");
 const details=questions.map((q,i)=>({
  id:q.id,lessonId:q.lessonId,selected:answers[i],correctIndex:q.correct,
  correct:answers[i]===q.correct,explanation:q.explanation
 }));
 const correct=details.filter(x=>x.correct).length;
 return {moduleId,revision:REVISION,correct,total:questions.length,percent:Math.round(100*correct/questions.length),
  practiceTargetMet:correct>=5,details};
}
function clean(raw){
 const data=Array.isArray(raw)?raw:[];
 const valid=new Set(modules.map(m=>m.id));
 return data.filter(v=>v&&valid.has(v.moduleId)&&v.revision===REVISION&&
  Number.isInteger(v.correct)&&v.correct>=0&&v.correct<=6&&v.total===6&&
  Number.isSafeInteger(v.at)&&v.at>0)
 .slice(-MAX).map(v=>({moduleId:v.moduleId,revision:REVISION,correct:v.correct,total:6,at:v.at}));
}
function load(storage){
 try{
  const raw=storage.getItem(STORAGE_KEY);
  if(typeof raw!=="string"||raw.length>15000)return [];
  return clean(JSON.parse(raw));
 }catch{return []}
}
function record(history,result,now=Date.now()){
 if(!result||result.revision!==REVISION||!modules.some(m=>m.id===result.moduleId)||
  !Number.isInteger(result.correct)||result.correct<0||result.correct>6||result.total!==6||
  !Number.isSafeInteger(now)||now<=0)throw Error("Invalid practice checkpoint result");
 return clean([...clean(history),{moduleId:result.moduleId,revision:REVISION,correct:result.correct,total:6,at:now}]);
}
function save(storage,history){
 try{storage.setItem(STORAGE_KEY,JSON.stringify(clean(history)));return true}catch{return false}
}
function clear(storage){
 try{storage.removeItem(STORAGE_KEY);return true}catch{return false}
}
function overview(history,pathId="scouts"){
 const p=paths[pathId];if(!p)throw Error("Unknown learning pathway");
 const records=clean(history);
 const summary=p.moduleIds.map(id=>{
  const past=records.filter(x=>x.moduleId===id);
  const latest=past.at(-1);
  return {moduleId:id,attempts:past.length,
   latestScore:latest?.correct??null,percent:latest?Math.round(latest.correct/6*100):null,
   practiceTargetMet:!!latest&&latest.correct>=5};
 });
 const next=summary.find(x=>x.attempts===0)||summary.find(x=>!x.practiceTargetMet);
 return {pathId,revision:REVISION,attempts:records.length,
  modulesPractised:summary.filter(x=>x.attempts>0).length,
  modulesMeetingPracticeTarget:summary.filter(x=>x.practiceTargetMet).length,
  nextModuleId:next?.moduleId??null,modules:summary};
}
function exportProgress(history,pathId="scouts",at=new Date().toISOString()){
 const result=overview(history,pathId);
 if(!Number.isFinite(Date.parse(at)))throw Error("Invalid export timestamp");
 return {schema:"agsa.local-module-checkpoints.v1",recordStatus:"UNVERIFIED_DEVICE_ONLY",
  assessmentRevision:REVISION,pathId,createdAt:new Date(at).toISOString(),
  attempts:clean(history),summary:result,
  warning:"Self-reported browser-local fictional quiz checks only. Editable and unauthenticated. No learner identity, school enrolment, instructor approval, training credit or certification."};
}
const api={REVISION,STORAGE_KEY,modules,paths,bank,items,validate,grade,clean,load,record,save,clear,overview,exportProgress};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAModuleCheckpoints=api;
})(typeof window!=="undefined"?window:null);
