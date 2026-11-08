/* Curriculum review worksheet: local-only unsigned JSON download.
 * No login, remote data transfer, approvals, or student records.
 */
(()=>{"use strict";
const L=window.AGSAAIInstructorLessons,C=window.AGSACurriculum,R=window.AGSACurriculumReview;
const $=id=>document.getElementById(id);
if(!L||!C||!R){document.body.insertAdjacentText("afterbegin","Curriculum review tools unavailable.");return}
const node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
function render(id){
 const {lesson,curriculum}=R.detail(id);
 $("reviewTitle").textContent=lesson.name;
 $("reviewRevision").textContent="Draft version "+curriculum.version+" · "+curriculum.reviewStatus.replaceAll("_"," ");
 $("reviewIntro").textContent=lesson.intro;
 $("reviewBody").textContent=lesson.body;
 $("reviewActivity").textContent=curriculum.activity;
 $("reviewScope").textContent="Safety boundary: "+curriculum.scope;
 $("reviewQuestion").textContent=lesson.question;
 $("reviewAnswer").textContent="Correct response: "+lesson.options[lesson.correct]+". "+lesson.explanation;
 const goals=$("reviewObjectives");goals.replaceChildren();
 for(const item of curriculum.objectives)goals.appendChild(node("li",item));
 const sources=$("reviewSources");sources.replaceChildren();
 for(const ref of curriculum.references){
  const li=document.createElement("li"),a=document.createElement("a");
  a.href=ref.url;a.target="_blank";a.rel="noopener noreferrer";
  a.textContent=ref.publisher+" · "+ref.title;
  li.appendChild(a);li.appendChild(node("span"," — Suggested topic: "+ref.topic));
  sources.appendChild(li);
 }
}
function clear(){
 $("reviewForm").reset();
 $("reviewStatus").textContent="Draft cleared locally. No review was submitted or approved.";
}
function exportDraft(event){
 event.preventDefault();
 const judgements={};
 for(const item of R.dimensions)judgements[item.id]=$(item.id).value;
 try{
  const result=R.draft($("reviewLesson").value,{judgements,comments:$("reviewComments").value,
   nextAction:$("reviewNextAction").value});
  const blob=new Blob([JSON.stringify(result,null,2)+"\n"],{type:"application/json"});
  const objectUrl=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=objectUrl;link.download="agsa-curriculum-review-"+result.snapshot.lessonId+"-UNSIGNED.json";
  document.body.appendChild(link);link.click();link.remove();
  // The object URL stays valid until page exit. Revoke after the download
  // request has been dispatched without relying on an arbitrary timer.
  window.addEventListener("pagehide",()=>URL.revokeObjectURL(objectUrl),{once:true});
  $("reviewStatus").textContent="Unsigned discussion draft prepared for local download. No school approval, instructor identity or source review has been verified.";
 }catch(error){
  $("reviewStatus").textContent=error instanceof Error?error.message:"Could not prepare draft.";
 }
}
function start(){
 C.validate(L.lessons.map(l=>l.id));
 for(const lesson of L.lessons){
  const opt=node("option",lesson.group+" · "+lesson.name);opt.value=lesson.id;
  $("reviewLesson").appendChild(opt);
 }
 for(const item of R.dimensions){
  const group=document.createElement("fieldset");group.className="review-fieldset";
  const legend=node("legend",item.label),select=document.createElement("select");
  select.id=item.id;select.name=item.id;
  select.setAttribute("aria-label",item.label+" judgement");
  for(const [value,label] of [
   ["not-reviewed","Not reviewed"],
   ["needs-edits","Needs edits"],
   ["discuss-with-instructor","Discuss with qualified instructor"]
  ]){
   const opt=node("option",label);opt.value=value;select.appendChild(opt);
  }
  group.appendChild(legend);group.appendChild(select);
  $("reviewChecklist").appendChild(group);
 }
 const asked=new URL(location.href).searchParams.get("lesson");
 $("reviewLesson").value=C.get(asked)?asked:L.lessons[0].id;
 render($("reviewLesson").value);
 $("reviewLesson").addEventListener("change",()=>{
  clear();
  render($("reviewLesson").value);
 });
 $("reviewForm").addEventListener("submit",exportDraft);
 $("reviewClear").addEventListener("click",clear);
}
start();
})();
