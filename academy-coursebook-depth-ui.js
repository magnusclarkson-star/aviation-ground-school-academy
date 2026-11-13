/* Academy deeper learning page: accessible browser-only scenarios and cumulative review. */
(()=>{"use strict";
const D=window.AGSADeepCoursebook,C=window.AGSACompleteCoursebook,$=id=>document.getElementById(id);
if(!D||!C){document.body.insertAdjacentText("afterbegin","Advanced lessons are temporarily unavailable.");return}
D.validate();
const text=(tag,body)=>{const e=document.createElement(tag);e.textContent=String(body);return e};
const safeRead=key=>{try{const raw=window.localStorage.getItem(key);return raw&&raw.length<28000?JSON.parse(raw):[]}catch{return []}};
const safeWrite=(key,data)=>{try{window.localStorage.setItem(key,JSON.stringify(data));return true}catch{return false}};
let deepHistory=D.cleanHistory(safeRead(D.KEY)),finalHistory=D.cleanFinal(safeRead(D.FINAL_KEY));
let activeId=new URL(location.href).searchParams.get("module")||C.modules[0].id;
if(!D.unit(activeId))activeId=C.modules[0].id;
let route=C.routes[$("route").value]?$("route").value:"scouts";
let advancedComplete=false,capstoneSession=null;
function coreHistory(){return C.clean(safeRead("agsa.coursebook.attempts.v1"))}
function summary(){
 const view=D.attemptsOverview(deepHistory,route),complete=D.completion(coreHistory(),deepHistory,finalHistory);
 const best=complete.capstoneBest===null?"Not attempted":complete.capstoneBest+"/24";
 $("deepCourseProgress").textContent="Introductory checks meeting target: "+complete.coreTargetCount+"/12 · Advanced scenarios and checks: "+complete.deepTargetCount+"/12 · Best cumulative review: "+best+". All progress is an editable local self-study record.";
 $("completionCelebration").hidden=!complete.selfStudyRouteComplete;
 const last=deepHistory.filter(x=>x.id===activeId).at(-1);
 $("deepModuleStatus").textContent=last?(last.correct>=3&&last.caseCorrect?"Local advanced practice target met ("+last.correct+"/4)":"Review advised ("+last.correct+"/4)"):"Advanced scenario not practised";
 return view;
}
function buildRadioGroup(field,stem,options,name,className="question"){
 const set=document.createElement("fieldset");set.className=className;
 set.appendChild(text("legend",stem));
 options.forEach((option,i)=>{
  const label=document.createElement("label"),input=document.createElement("input");
  input.type="radio";input.name=name;input.value=String(i);
  label.appendChild(input);label.appendChild(text("span",String.fromCharCode(65+i)+". "+option));
  set.appendChild(label);
 });
 field.appendChild(set);
 return set;
}
function showModule(id,choice=route){
 if(!D.unit(id))return;
 activeId=id;
 route=C.routes[choice]?choice:"scouts";
 advancedComplete=false;
 const u=D.unit(id),reading=$("deepReading");reading.replaceChildren();
 $("deepRouteFocus").textContent=(route==="scouts"?"Air Scout activity: ":"Aspiring-pilot study focus: ")+u.focus[route];
 u.lessons.forEach((lesson,i)=>{
  const article=document.createElement("article");article.className="deep-lesson";
  article.appendChild(text("h4","Extended lesson "+(i+4)+": "+lesson.title));
  article.appendChild(text("p",lesson.concept));
  const worked=text("p","Worked example: "+lesson.example);worked.className="worked";article.appendChild(worked);
  const task=text("p","Try it: "+lesson.task);task.className="task";article.appendChild(task);
  reading.appendChild(article);
 });
 const terms=$("deepGlossary");terms.replaceChildren();
 u.glossary.forEach(([term,definition])=>{terms.appendChild(text("dt",term));terms.appendChild(text("dd",definition))});
 $("deepReference").textContent="Suggested FAA reading: "+D.chapterMap[id].join("; ")+". Broad EASA-style subject label: "+D.subjectMap[id]+". These are editorial pointers, not a checked qualification syllabus.";
 const caseHolder=$("deepScenario");caseHolder.replaceChildren();
 caseHolder.appendChild(text("h4",u.scenario.title));caseHolder.appendChild(text("p",u.scenario.situation));
 buildRadioGroup(caseHolder,"What is the best decision?",u.scenario.options,"case");
 const holder=$("deepQuestions");holder.replaceChildren();
 u.questions.forEach((question,i)=>buildRadioGroup(holder,(i+1)+". "+question[0],question[1],"deep"+i));
 $("deepSubmit").disabled=false;$("deepAnswers").replaceChildren();$("deepAnswers").hidden=true;
 $("deepFeedback").textContent="Complete the scenario and all three advanced questions.";summary();
}
function checkAdvanced(event){
 event.preventDefault();if(advancedComplete)return;
 const form=$("deepForm"),picked=form.querySelector('input[name="case"]:checked');
 if(!picked){$("deepFeedback").textContent="Choose an option in the applied situation first.";form.querySelector('input[name="case"]').focus();return}
 const answers=[];
 for(let i=0;i<3;i++){
  const selection=form.querySelector('input[name="deep'+i+'"]:checked');
  if(!selection){$("deepFeedback").textContent="Answer all three advanced questions.";form.querySelector('input[name="deep'+i+'"]').focus();return}
  answers.push(Number(selection.value));
 }
 const result=D.grade(activeId,answers,Number(picked.value));
 deepHistory=D.cleanHistory([...deepHistory,{id:activeId,revision:D.REVISION,correct:result.correct,caseCorrect:result.caseCorrect,at:Date.now()}]);
 const stored=safeWrite(D.KEY,deepHistory);
 advancedComplete=true;$("deepSubmit").disabled=true;
 form.querySelectorAll('input[type="radio"]').forEach(input=>input.disabled=true);
 $("deepFeedback").textContent=result.correct+"/4 correct. "+(result.practiceTargetMet?"Local advanced target met.":"Review the decision and question explanations, then retry.")+(stored?" Saved on this device.":" Browser storage is unavailable; results will be lost when the page closes.")+" No formal assessment credit.";
 const explanations=$("deepAnswers");explanations.replaceChildren();
 explanations.appendChild(text("li",(result.caseCorrect?"Scenario correct. ":"Scenario for review. ")+"Preferred response: "+result.caseFeedback.answer+". "+result.caseFeedback.explanation));
 result.checks.forEach((item,i)=>explanations.appendChild(text("li","Question "+(i+1)+": "+(item.correct?"Correct. ":"Review. ")+"Answer: "+item.answer+". "+item.explanation)));
 explanations.hidden=false;summary();
 document.dispatchEvent(new CustomEvent("agsa:coursebook-advanced-checked",{detail:{moduleId:activeId}}));
}
function readMore(){
 if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){$("deepFeedback").textContent="Speech playback is unavailable in this browser.";return}
 window.speechSynthesis.cancel();const u=D.unit(activeId);
 const narration=[u.focus[route],...u.lessons.flatMap(l=>[l.title,l.concept,l.example,l.task])].join(". ");
 const voice=new SpeechSynthesisUtterance(narration);voice.lang="en";voice.rate=.95;
 window.speechSynthesis.speak(voice);
}
function startCapstone(){
 const seed=Math.floor(Date.now()/1000);
 capstoneSession={seed,questions:D.capstoneQuestions(seed)};
 const container=$("capstoneQuestions");container.replaceChildren();
 capstoneSession.questions.forEach((q,i)=>buildRadioGroup(container,(i+1)+". "+q.prompt,q.options,"capstone"+i,"question capstone-question"));
 $("capstoneForm").hidden=false;$("submitCapstone").disabled=false;
 $("capstoneExplanations").hidden=true;$("capstoneAnswerList").replaceChildren();
 $("capstoneFeedback").textContent="Answer all 24 questions. This review is device-only and unverified.";
 $("capstoneForm").scrollIntoView({block:"start",behavior:"smooth"});
}
function checkCapstone(e){
 e.preventDefault();if(!capstoneSession)return;
 const answers=[],form=$("capstoneForm");
 for(let i=0;i<24;i++){
  const chosen=form.querySelector('input[name="capstone'+i+'"]:checked');
  if(!chosen){$("capstoneFeedback").textContent="Answer all 24 questions before checking.";form.querySelector('input[name="capstone'+i+'"]').focus();return}
  answers.push(Number(chosen.value));
 }
 const result=D.gradeCapstone(answers,capstoneSession.seed);
 finalHistory=D.cleanFinal([...finalHistory,{revision:D.REVISION,correct:result.correct,at:Date.now()}]);
 const stored=safeWrite(D.FINAL_KEY,finalHistory);
 $("submitCapstone").disabled=true;form.querySelectorAll('input[type="radio"]').forEach(input=>input.disabled=true);
 $("capstoneFeedback").textContent=result.correct+"/24 ("+result.percent+"%) correct. "+(result.practiceTargetMet?"Cumulative self-study target met.":"Revise weaker topics and try a new review.")+(stored?" Saved on this device.":" Storage unavailable.")+" Not a verified examination.";
 const list=$("capstoneAnswerList");list.replaceChildren();
 result.feedback.forEach((x,i)=>list.appendChild(text("li",(i+1)+". "+(x.correct?"Correct. ":"Review. ")+"Subject: "+x.moduleId+". Preferred answer: "+x.answer+". "+x.explanation)));
 $("capstoneExplanations").hidden=false;
 summary();
 document.dispatchEvent(new CustomEvent("agsa:coursebook-capstone-checked"));
}
function exportAll(){
 const doc=D.exportSummary(coreHistory(),deepHistory,finalHistory,route);
 const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)+"\n"],{type:"application/json"}));
 const a=document.createElement("a");a.href=url;a.download="academy-unverified-self-study-record.json";
 document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1800);
}
document.addEventListener("agsa:coursebook-module",event=>showModule(event.detail.moduleId,event.detail.route));
document.addEventListener("agsa:coursebook-core-checked",summary);
document.addEventListener("agsa:coursebook-cleared",()=>{
 deepHistory=[];finalHistory=[];
 try{window.localStorage.removeItem(D.KEY);window.localStorage.removeItem(D.FINAL_KEY)}catch{}
 showModule(activeId,route);
 $("capstoneForm").hidden=true;$("capstoneExplanations").hidden=true;
 $("capstoneFeedback").textContent="Local self-study history cleared.";summary();
});
$("deepForm").addEventListener("submit",checkAdvanced);
$("deepRetry").addEventListener("click",()=>showModule(activeId,route));
$("deepReadAloud").addEventListener("click",readMore);
$("deepStopAudio").addEventListener("click",()=>{if("speechSynthesis" in window)window.speechSynthesis.cancel()});
$("startCapstone").addEventListener("click",startCapstone);
$("capstoneForm").addEventListener("submit",checkCapstone);
$("cancelCapstone").addEventListener("click",()=>{$("capstoneForm").hidden=true;capstoneSession=null});
$("exportFullProgress").addEventListener("click",exportAll);
showModule(activeId,route);summary();
})();
