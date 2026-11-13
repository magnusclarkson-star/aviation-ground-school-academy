/* Academy coursebook: offline reading and local-only self-check progress. */
(()=>{"use strict";
const M=window.AGSACompleteCoursebook;
const $=id=>document.getElementById(id);
if(!M){document.body.insertAdjacentText("afterbegin","Course content unavailable.");return}
M.validate();
const KEY="agsa.coursebook.attempts.v1",PATHKEY="agsa.coursebook.route.v1";
let storage=null;try{storage=window.localStorage}catch{}
function get(key){try{return storage?.getItem(key)||null}catch{return null}}
function put(key,value){try{storage?.setItem(key,value);return !!storage}catch{return false}}
function text(tag,value){const e=document.createElement(tag);e.textContent=String(value);return e}
let history=[];try{const raw=get(KEY);if(raw&&raw.length<20000)history=M.clean(JSON.parse(raw))}catch{}
const query=new URL(location.href).searchParams;
let route=M.routes[query.get("path")]?query.get("path"):M.routes[get(PATHKEY)]?get(PATHKEY):"scouts";
let id=M.modules.some(m=>m.id===query.get("module"))?query.get("module"):M.routes[route][0];
let completed=false;
function ordered(){return M.routes[route].map(mid=>M.modules.find(m=>m.id===mid))}
function latest(mid){return history.filter(x=>x.id===mid).at(-1)}
function progress(){
 const done=M.modules.filter(m=>history.some(x=>x.id===m.id)).length;
 $("courseProgress").value=done;
 $("progressLabel").textContent=done+" of 12 modules practised · "+history.length+" checks saved locally";
 const next=ordered().find(m=>!latest(m.id))||ordered().find(m=>latest(m.id).correct<2);
 $("nextLesson").disabled=!next;
 $("nextLesson").textContent=next?"Continue suggested: "+next.title:"All modules practised — revisit any topic";
 $("nextLesson").dataset.module=next?.id||"";
 const saved=!!storage;
 $("storageStatus").textContent=saved?"Progress saved only on this browser/device; these are unverified practice checks.":"Storage unavailable; progress lasts only while this page is open.";
}
function updateUrl(){
 const u=new URL(location.href);u.searchParams.set("path",route);u.searchParams.set("module",id);
 historyReplace(u.pathname+u.search+u.hash);
}
function historyReplace(url){try{window.history.replaceState(null,"",url)}catch{}}
function renderList(){
 const list=$("moduleList");list.replaceChildren();
 const needle=$("search").value.trim().toLowerCase();
 for(const m of ordered()){
  if(needle&&!((m.title+" "+m.level+" "+m.sections.map(s=>s.title).join(" ")).toLowerCase().includes(needle)))continue;
  const button=document.createElement("button");button.type="button";button.dataset.module=m.id;
  button.setAttribute("aria-pressed",String(m.id===id));
  button.appendChild(text("strong",m.number+". "+m.title));
  const previous=latest(m.id);
  button.appendChild(text("span",m.level+" · "+(previous?(previous.correct>=2?"Practice target met":"Revise")+", "+previous.correct+"/3":"Not yet practised")));
  button.lastChild.className="module-note";
  button.addEventListener("click",()=>select(m.id));
  list.appendChild(button);
 }
}
function renderQuiz(){
 completed=false;$("submitQuiz").disabled=false;$("answers").hidden=true;
 $("answers").replaceChildren();$("quizResult").textContent="Read the lessons, then answer the questions.";
 const holder=$("quizQuestions");holder.replaceChildren();
 const m=M.modules.find(m=>m.id===id);
 m.quiz.forEach((q,i)=>{
  const group=document.createElement("fieldset");group.className="question";
  group.appendChild(text("legend",(i+1)+". "+q.question));
  q.options.forEach((choice,option)=>{
   const label=document.createElement("label"),input=document.createElement("input");
   input.type="radio";input.name="q"+i;input.value=String(option);
   label.appendChild(input);label.appendChild(text("span",String.fromCharCode(65+option)+". "+choice));
   group.appendChild(label);
  });
  holder.appendChild(group);
 });
}
function select(nextId){
 if(!M.modules.some(x=>x.id===nextId))return;
 if("speechSynthesis" in window)window.speechSynthesis.cancel();
 id=nextId;updateUrl();renderList();renderQuiz();
 const m=M.modules.find(m=>m.id===id);
 $("moduleTitle").textContent=m.number+". "+m.title;$("moduleLevel").textContent=m.level.toUpperCase();
 $("moduleMeta").textContent=m.minutes+" min suggested reading · 3 lesson sections · 3 review questions · editorial draft";
 $("objectives").replaceChildren(...m.objectives.map(x=>text("li",x)));
 const reading=$("lessonReading");reading.replaceChildren();
 m.sections.forEach((s,i)=>{
  const article=document.createElement("article");
  article.appendChild(text("h3","Lesson "+(i+1)+": "+s.title));
  article.appendChild(text("p",s.body));reading.appendChild(article);
 });
 $("studyActivity").textContent=m.activity;$("reference").href=m.reference;
 const order=M.routes[route],index=order.indexOf(id);
 $("previousModule").disabled=index===0;$("followingModule").disabled=index===order.length-1;
}
function submit(e){
 e.preventDefault();if(completed)return;
 const answers=[];
 for(let i=0;i<3;i++){
  const picked=$("quizQuestions").querySelector('input[name="q'+i+'"]:checked');
  if(!picked){$("quizResult").textContent="Answer all three questions before checking.";const field=$("quizQuestions").querySelectorAll("fieldset")[i];field.querySelector("input").focus();return}
  answers.push(Number(picked.value));
 }
 const result=M.grade(id,answers);completed=true;
 history=M.clean([...history,{id,correct:result.correct,revision:M.REVISION,at:Date.now()}]);
 put(KEY,JSON.stringify(history));
 $("submitQuiz").disabled=true;
 $("quizQuestions").querySelectorAll("input").forEach(input=>input.disabled=true);
 $("quizResult").textContent=result.correct+" of 3 correct. "+(result.metTarget?"Self-study target met.":"Review the explanations and try again.")+" This is not a verified exam or certificate.";
 const list=$("answers");list.replaceChildren();list.hidden=false;
 result.feedback.forEach((x,i)=>{
  const li=text("li",(x.pass?"Correct. ":"Review. ")+
   "Answer: "+M.modules.find(m=>m.id===id).quiz[i].options[x.correct]+". "+x.explanation);
  list.appendChild(li);
 });
 renderList();progress();
}
function download(){
 const doc={schema:"agsa.coursebook.study-practice.v1",status:"UNVERIFIED_BROWSER_ONLY",revision:M.REVISION,pathway:route,exportedAt:new Date().toISOString(),attempts:M.clean(history),warning:"Editable learner-local practice only. No verified student, instructor approval, certification, school credit or licence."};
 const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)+"\n"],{type:"application/json"}));
 const a=document.createElement("a");a.href=url;a.download="agsa-coursebook-unverified-progress.json";
 document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1200);
}
$("route").value=route;
$("route").addEventListener("change",e=>{if(!M.routes[e.target.value])return;route=e.target.value;put(PATHKEY,route);select(M.routes[route][0]);progress()});
$("search").addEventListener("input",renderList);
$("quizForm").addEventListener("submit",submit);
$("retryQuiz").addEventListener("click",renderQuiz);
$("nextLesson").addEventListener("click",()=>{if($("nextLesson").dataset.module)select($("nextLesson").dataset.module)});
$("previousModule").addEventListener("click",()=>{const orderedIds=M.routes[route];const i=orderedIds.indexOf(id);if(i>0)select(orderedIds[i-1])});
$("followingModule").addEventListener("click",()=>{const orderedIds=M.routes[route];const i=orderedIds.indexOf(id);if(i<orderedIds.length-1)select(orderedIds[i+1])});
$("downloadRecord").addEventListener("click",download);
$("clearRecord").addEventListener("click",()=>{
 if(!window.confirm("Clear coursebook practice results stored on this device?"))return;
 history=[];try{storage?.removeItem(KEY)}catch{}
 renderList();renderQuiz();progress();
});
$("readAloud").addEventListener("click",()=>{
 if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){$("quizResult").textContent="Your device does not support speech playback.";return}
 window.speechSynthesis.cancel();const m=M.modules.find(m=>m.id===id);
 const utterance=new SpeechSynthesisUtterance([m.title,...m.sections.flatMap(s=>[s.title,s.body])].join(". "));
 utterance.lang="en";utterance.rate=.95;window.speechSynthesis.speak(utterance);
});
$("stopReading").addEventListener("click",()=>{if("speechSynthesis" in window)window.speechSynthesis.cancel()});
select(id);progress();
})();