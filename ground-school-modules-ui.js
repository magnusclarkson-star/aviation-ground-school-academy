/* Introductory module practice UI. All inputs stay in the browser.
 * No backend, personal account, certificate, exam identity or remote AI.
 */
(()=>{"use strict";
const M=window.AGSAModuleCheckpoints,L=window.AGSAAIInstructorLessons,C=window.AGSACurriculum;
const $=id=>document.getElementById(id);
if(!M||!L||!C){document.body.insertAdjacentText("afterbegin","Module practice is temporarily unavailable.");return}
M.validate();
const text=(tag,value)=>{
 const node=document.createElement(tag);node.textContent=String(value);return node;
};
let storage=null;
try{storage=window.localStorage}catch{}
let history=M.load(storage||{getItem:()=>null});
const requested=new URL(location.href).searchParams;
let pathId=M.paths[requested.get("path")]?requested.get("path"):"scouts";
const startingModule=requested.get("module");
let moduleId=M.modules.some(m=>m.id===startingModule)?startingModule:M.paths[pathId].moduleIds[0];
let completed=false;
function writeUrl(){
 const next=new URL(window.location.href);
 next.searchParams.set("path",pathId);next.searchParams.set("module",moduleId);
 window.history.replaceState(null,"",next.pathname+next.search+next.hash);
}
function renderProgress(){
 const o=M.overview(history,pathId);
 $("progressSummary").textContent=o.modulesPractised+" of 4 modules practised";
 $("progressDetail").textContent=o.modulesMeetingPracticeTarget+" of 4 currently meet the fictional practice target; "+o.attempts+" recorded checks on this device.";
 $("moduleProgress").value=o.modulesPractised;
 $("pathScouts").setAttribute("aria-pressed",String(pathId==="scouts"));
 $("pathPilots").setAttribute("aria-pressed",String(pathId==="pilots"));
 $("pathDescription").textContent=M.paths[pathId].description;
 const next=M.modules.find(m=>m.id===o.nextModuleId);
 $("nextModule").disabled=!next;
 $("nextModule").textContent=next?"Continue suggested: "+next.title.split(" · ")[0]:"All modules practised — choose a module to revise";
 const choices=$("moduleChoices");
 choices.replaceChildren();
 for(const id of M.paths[pathId].moduleIds){
  const m=M.modules.find(x=>x.id===id),summary=o.modules.find(x=>x.moduleId===id);
  const button=document.createElement("button");
  button.type="button";button.dataset.module=id;
  button.setAttribute("aria-pressed",String(moduleId===id));
  button.appendChild(text("span",m.title));
  const note=summary.attempts===0?"Not yet practised":
   summary.practiceTargetMet?"Local practice target met ("+summary.latestScore+"/6)":
   "Revise suggested ("+summary.latestScore+"/6)";
  button.appendChild(text("small",note+" · "+summary.attempts+" check"+(summary.attempts===1?"":"s")));
  button.addEventListener("click",()=>selectModule(id));
  choices.appendChild(button);
 }
}
function renderLessons(){
 const item=M.modules.find(m=>m.id===moduleId);
 $("currentModuleTitle").textContent=item.title;
 $("currentModuleSummary").textContent=item.summary;
 $("currentModuleStatus").textContent="Draft lessons · 6 fictional practice questions · no training credit";
 const container=$("moduleLessons");container.replaceChildren();
 for(const id of item.lessons){
  const lesson=L.lessons.find(x=>x.id===id),meta=C.get(id);
  const card=document.createElement("div");card.className="lesson-card";
  const a=document.createElement("a");
  a.href="ai-instructor.html?lesson="+encodeURIComponent(id);
  a.textContent=lesson.name+" · read or listen";
  card.appendChild(a);
  card.appendChild(text("p",meta.objectives[0]+" Draft only; subject-matter review required."));
  container.appendChild(card);
 }
}
function renderQuestions(){
 completed=false;
 $("submitCheckpoint").disabled=false;
 $("retryCheckpoint").disabled=false;
 $("checkpointFeedback").dataset.result="";
 $("checkpointFeedback").textContent="Answer all six questions, then check your understanding.";
 $("answerExplanations").replaceChildren();
 $("answerExplanations").hidden=true;
 const list=$("assessmentQuestions");list.replaceChildren();
 M.items(moduleId).forEach((q,index)=>{
  const group=document.createElement("fieldset");group.className="assessment-question";
  group.appendChild(text("legend",(index+1)+". "+q.prompt));
  q.choices.forEach((choice,n)=>{
   const label=document.createElement("label");
   const input=document.createElement("input");
   input.type="radio";input.name="question"+index;input.value=String(n);
   label.appendChild(input);label.appendChild(text("span",String.fromCharCode(65+n)+". "+choice));
   group.appendChild(label);
  });
  list.appendChild(group);
 });
}
function selectModule(id){
 if(!M.modules.some(m=>m.id===id))return;
 moduleId=id;writeUrl();renderProgress();renderLessons();renderQuestions();
}
function changePath(id){
 if(!M.paths[id])return;
 pathId=id;
 const o=M.overview(history,pathId);
 selectModule(o.nextModuleId||M.paths[id].moduleIds[0]);
}
function submitCheck(event){
 event.preventDefault();
 if(completed)return;
 const chosen=[];
 for(let i=0;i<6;i++){
  const input=$("assessmentQuestions").querySelector('input[name="question'+i+'"]:checked');
  if(!input){
   $("checkpointFeedback").textContent="Select an answer for each of the six questions before submitting.";
   $("checkpointFeedback").dataset.result="review";
   $("assessmentQuestions").querySelectorAll("fieldset")[i].querySelector("input").focus();
   return;
  }
  chosen.push(Number(input.value));
 }
 const result=M.grade(moduleId,chosen);
 history=M.record(history,result);
 if(!M.save(storage||{setItem:()=>{throw Error("storage unavailable")}},history))
  $("storageStatus").textContent="Browser storage is blocked. Practice remains available only until you leave this page.";
 else $("storageStatus").textContent="Recorded on this device only; not shared with the Academy or an instructor.";
 completed=true;
 $("submitCheckpoint").disabled=true;
 for(const input of $("assessmentQuestions").querySelectorAll("input"))input.disabled=true;
 $("checkpointFeedback").dataset.result=result.practiceTargetMet?"target":"review";
 $("checkpointFeedback").textContent=result.correct+" of "+result.total+" correct ("+result.percent+"%). "+
  (result.practiceTargetMet?"Local practice target met.":"Review the explanations and try again.")+
  " This is not an official grade or evidence of training competence.";
 const explanations=$("answerExplanations");explanations.replaceChildren();
 result.details.forEach((detail,i)=>{
  const q=M.items(moduleId)[i],li=document.createElement("li");
  li.appendChild(text("strong",(i+1)+". "+(detail.correct?"Correct":"Review")+" · Correct response: "+q.choices[detail.correctIndex]));
  li.appendChild(text("span",detail.explanation));
  explanations.appendChild(li);
 });
 explanations.hidden=false;
 renderProgress();
}
function exportSummary(){
 const result=M.exportProgress(history,pathId);
 const blob=new Blob([JSON.stringify(result,null,2)+"\n"],{type:"application/json"});
 const objectUrl=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=objectUrl;a.download="agsa-module-practice-UNVERIFIED.json";
 document.body.appendChild(a);a.click();a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(objectUrl),1500);
 $("storageStatus").textContent="Unsigned, editable practice JSON requested for local download. No school record was created.";
}
function clearHistory(){
 if(!window.confirm("Clear the module practice history stored in this browser? This cannot be undone."))return;
 history=[];
 const erased=M.clear(storage||{removeItem:()=>{throw Error("storage unavailable")}});
 renderProgress();
 $("storageStatus").textContent=erased?"Local module history cleared on this device.":"In-memory practice cleared; browser storage could not be changed.";
 if(completed)renderQuestions();
}
function initialise(){
 $("pathScouts").addEventListener("click",()=>changePath("scouts"));
 $("pathPilots").addEventListener("click",()=>changePath("pilots"));
 $("nextModule").addEventListener("click",()=>{
  const next=M.overview(history,pathId).nextModuleId;
  if(next)selectModule(next);
 });
 $("exportModules").addEventListener("click",exportSummary);
 $("clearModules").addEventListener("click",clearHistory);
 $("assessmentForm").addEventListener("submit",submitCheck);
 $("retryCheckpoint").addEventListener("click",renderQuestions);
 selectModule(moduleId);
}
initialise();
})();
