/* Four freely viewable specialist lesson previews with original owner-shown imagery.
 * Knowledge checks are ungraded, local to the visible page and not recorded.
 */
(()=>{"use strict";
const model=window.AGSASpecialistSampleLessons;
const plates=window.AGSASpecialistTechnicalPlates;
const approved=window.AGSAApprovedLectureVisuals;
const catalogue=window.AGSASpecialistCatalogue;
if(!model||!plates||!approved||!catalogue)return;
model.validate();plates.validate();approved.validate();catalogue.validate();
const $=id=>document.getElementById(id),create=(tag,value)=>{
 const node=document.createElement(tag);if(value!==undefined)node.textContent=String(value);return node;
};
const keys=Object.keys(model.programmes);
const url=new URL(window.location.href);
let activeCourse=keys.includes(url.searchParams.get("course"))?url.searchParams.get("course"):keys[0];
let activeIndex=Math.min(1,Math.max(0,Number.parseInt(url.searchParams.get("lesson")||"1",10)-1||0));
function state(){
 const p=model.programmes[activeCourse];return {p,u:p.units[activeIndex]};
}
const viewer=$("technicalZoom"),vTitle=$("technicalZoomTitle"),vImg=$("technicalZoomImage"),vCaption=$("technicalZoomCaption");
$("closeTechnicalZoom").addEventListener("click",()=>viewer.close());
viewer.addEventListener("click",e=>{if(e.target===viewer)viewer.close()});
function showDiagram(plate,caption){
 vTitle.textContent="Supplemental technical diagram — "+plate.id.replaceAll("-"," ");
 vImg.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(plate.svg);
 vImg.alt=plate.alt;vCaption.textContent=caption;
 if(typeof viewer.showModal==="function")viewer.showModal();
 else viewer.setAttribute("open","");
 $("closeTechnicalZoom").focus();
}
function technicalPlate(plateId){
 const p=plates.get(plateId);
 if(!p)return document.createDocumentFragment();
 const detail=create("details");detail.className="technical-plate";
 const summary=create("summary","Show supplementary labelled technical diagram");
 const fig=create("figure"),img=create("img");
 img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(p.svg);
 img.alt=p.alt;img.loading="lazy";img.decoding="async";img.width=1100;img.height=650;
 const cap=create("figcaption","This is an original conceptual diagram supporting the previously shown Academy illustration. It is not approved equipment documentation or scene guidance.");
 const enlarge=create("button","Enlarge technical diagram");enlarge.type="button";
 enlarge.addEventListener("click",()=>showDiagram(p,cap.textContent));
 fig.append(img,cap,enlarge);detail.append(summary,fig);
 return detail;
}
function renderCourseButtons(){
 const area=$("moduleButtons"),{p}=state();
 area.replaceChildren();
 p.units.forEach((unit,i)=>{
  const button=create("button",unit.title);button.type="button";
  button.classList.toggle("active",i===activeIndex);
  button.setAttribute("aria-pressed",i===activeIndex?"true":"false");
  button.addEventListener("click",()=>select(activeCourse,i));
  area.appendChild(button);
 });
 const course=catalogue.courses.find(x=>x.id===activeCourse);
 $("upcomingList").replaceChildren();
 for(const title of (course?.modules||[]).slice(2))$("upcomingList").appendChild(create("li",title));
}
function renderSection(unit,section,i){
 const el=create("section");el.className="lesson-subsection";
 el.appendChild(create("h3",section.heading));
 const para=create("p",section.body);el.appendChild(para);
 if(i===0){
  const exact=approved.getSpecialist(activeCourse)[activeIndex];
  const renderer=window.AGSACoursebookApprovedFigure;
  if(exact&&renderer)el.appendChild(renderer.figure(exact));
 }
 if(unit.figureIds[i])el.appendChild(technicalPlate(unit.figureIds[i]));
 return el;
}
function renderQuiz(u){
 const questions=$("questionList");questions.replaceChildren();
 u.quiz.forEach((q,i)=>{
  const field=create("fieldset");field.className="quiz-question";
  field.appendChild(create("legend",(i+1)+". "+q.question));
  q.options.forEach((opt,n)=>{
   const label=create("label"),input=create("input");
   input.type="radio";input.name="q"+i;input.value=String(n);
   label.append(input,create("span",opt));field.appendChild(label);
  });
  const result=create("p");result.className="quiz-feedback";result.id="questionFeedback"+i;
  field.appendChild(result);questions.appendChild(field);
 });
 $("quizResult").textContent="";
}
function render(){
 const {p,u}=state();
 $("courseHeading").textContent=p.title;
 $("courseTagline").textContent=p.strapline+" · "+p.subtitle;
 document.querySelectorAll("[data-course]").forEach(b=>{
  b.setAttribute("aria-pressed",b.dataset.course===activeCourse?"true":"false");
 });
 renderCourseButtons();
 $("lessonHeading").textContent=u.title;
 $("lessonObjective").textContent="Learning objective: "+u.objective;
 const container=$("lectureSections");container.replaceChildren();
 u.sections.forEach((section,i)=>container.appendChild(renderSection(u,section,i)));
 $("keyPoints").replaceChildren();u.takeaway.forEach(x=>$("keyPoints").appendChild(create("li",x)));
 $("caseTitle").textContent=u.scenario.title;
 $("caseText").textContent=u.scenario.text;
 $("caseFocus").textContent=u.scenario.focus;
 $("referenceLinks").replaceChildren();
 p.sourceLinks.forEach(link=>{
  const li=create("li"),a=create("a",link.title);a.href=link.url;a.target="_blank";a.rel="noopener noreferrer";
  li.appendChild(a);$("referenceLinks").appendChild(li);
 });
 renderQuiz(u);
 $("previousLesson").disabled=activeIndex===0;
 $("nextLesson").disabled=activeIndex===p.units.length-1;
 const next=new URL(window.location.href);next.searchParams.set("course",activeCourse);
 next.searchParams.set("lesson",String(activeIndex+1));
 window.history.replaceState(null,"",next.pathname+next.search+next.hash);
}
function select(course,index){
 if(!keys.includes(course))return;
 if(viewer.open)viewer.close();
 const old=activeCourse;activeCourse=course;
 activeIndex=old===course?Math.max(0,Math.min(model.programmes[course].units.length-1,index)):0;
 render();
 if(window.scrollY>550)$("lessonHeading").scrollIntoView({behavior:"smooth",block:"start"});
}
document.querySelectorAll("[data-course]").forEach(b=>{
 b.addEventListener("click",()=>select(b.dataset.course,0));
});
$("previousLesson").addEventListener("click",()=>select(activeCourse,activeIndex-1));
$("nextLesson").addEventListener("click",()=>select(activeCourse,activeIndex+1));
$("quizForm").addEventListener("submit",event=>{
 event.preventDefault();
 const {u}=state(),form=$("quizForm");let count=0,answered=0;
 u.quiz.forEach((q,i)=>{
  const chosen=form.querySelector('input[name="q'+i+'"]:checked');
  const feedback=$("questionFeedback"+i);
  if(chosen){answered++;if(Number(chosen.value)===q.answer)count++}
  feedback.textContent=(chosen?(Number(chosen.value)===q.answer?"Correct. ":"Review your answer. "):"Unanswered. ")+q.explanation;
 });
 $("quizResult").textContent=answered===u.quiz.length?
  count+" of "+u.quiz.length+" questions correct — informal practice only; no academic record created.":
  "Answered "+answered+" of "+u.quiz.length+" questions. You can select answers and check again; no grade is recorded.";
});
render();
})();
