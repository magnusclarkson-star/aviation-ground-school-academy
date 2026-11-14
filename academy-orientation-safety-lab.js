/* Course 01 visual safety lab. Uses only the owner's existing Academy
   artwork atlas and in-memory learner choices; never edits approved pictures. */
(function(root){"use strict";
const model=root.AGSAOrientationSafetyLab,atlas=root.AGSAOriginalPictureAtlas;
const host=document.getElementById("orientationSafetyLab");
if(!model||!atlas||!host)return;
model.validate(atlas);
const el=(tag,label)=>{const n=document.createElement(tag);if(label!==undefined)n.textContent=label;return n};
const answers=new Map();
let current=0,route="scouts",ready=false;
const intro=el("div");intro.className="orientation-lab-head";
const kicker=el("p","COURSE 01 · PICTORIAL PRACTICAL");
kicker.className="orientation-lab-kicker";
const title=el("h3","Safety observation lab");
title.id="orientationLabTitle";
const lead=el("p","Look at each original Academy picture, read its fictional situation and choose a safe response. Then practise a short factual hazard report.");
const routeFocus=el("p");routeFocus.className="orientation-lab-route";
intro.append(kicker,title,lead,routeFocus);
const progress=el("p");progress.className="orientation-lab-progress";
progress.setAttribute("role","status");progress.setAttribute("aria-live","polite");
const frame=el("div");frame.className="orientation-lab-frame";
const nav=el("div");nav.className="orientation-lab-nav";
const previous=el("button","Previous situation"),next=el("button","Next situation");
previous.type=next.type="button";
previous.addEventListener("click",()=>{if(current>0){current--;renderCase()}});
next.addEventListener("click",()=>{if(current<model.cases.length-1){current++;renderCase()}});
nav.append(previous,next);
const report=el("details");report.className="orientation-lab-report";
const reportHeading=el("summary","Fictional safety observation report · four short steps");
const reportIntro=el("p","Use an invented classroom example. Do not enter real people's names, contact details, photographs, aircraft registrations or precise locations. This worksheet is not stored or sent anywhere.");
const fields=new Map();
const reportBody=el("div");reportBody.className="orientation-lab-report-grid";
for(const field of model.reportFields){
 const wrapper=el("div");wrapper.className="orientation-lab-field";
 const label=el("label",field.label),input=el("textarea");
 input.id="orientationLabReport-"+field.id;input.rows=2;
 input.maxLength=320;input.placeholder=field.placeholder;
 label.htmlFor=input.id;wrapper.append(label,input);
 reportBody.appendChild(wrapper);fields.set(field.id,input);
}
const reportActions=el("div");reportActions.className="orientation-lab-report-actions";
const checkReport=el("button","Check report structure"),clearReport=el("button","Clear worksheet");
checkReport.type=clearReport.type="button";
const reportFeedback=el("p","Four factual fields make an observation useful to the responsible supervisor.");
reportFeedback.id="orientationLabReportFeedback";
reportFeedback.className="orientation-lab-feedback";
reportFeedback.setAttribute("role","status");reportFeedback.setAttribute("aria-live","polite");
checkReport.addEventListener("click",()=>{
 const values=Object.fromEntries([...fields].map(([key,input])=>[key,input.value]));
 const review=model.reviewReport(values);
 reportFeedback.textContent=review.complete?
  "All four reporting fields are present. Check that you separate what you saw from any unproven cause. Ask your supervising instructor to review your fictional report; this is not a verified assessment.":
  "Complete the following fields with at least 12 characters each: "+review.missing.join("; ")+".";
 reportFeedback.dataset.complete=String(review.complete);
});
clearReport.addEventListener("click",()=>{
 for(const input of fields.values())input.value="";
 reportFeedback.textContent="Worksheet cleared from this page.";
 reportFeedback.removeAttribute("data-complete");
});
reportActions.append(checkReport,clearReport);
report.append(reportHeading,reportIntro,reportBody,reportActions,reportFeedback);
const foot=el("p","Optional, ungraded classroom practice. Images are approved Academy artwork; the described hazards are fictional. Do not use these exercises as operational instructions.");
foot.className="orientation-lab-foot";
host.append(intro,progress,frame,nav,report,foot);
function updateProgress(){
 progress.textContent=(current+1)+" of "+model.cases.length+" illustrated situations · "+answers.size+" decisions reviewed · self-study only";
}
function showPicture(item){
 const asset=atlas.getById(item.picture),figure=el("figure");
 figure.className="orientation-lab-picture";
 const canvas=el("canvas");
 canvas.setAttribute("role","img");canvas.setAttribute("aria-label",asset.alt);
 const [sx,sy,sw,sh]=asset.rect;
 canvas.width=sw;canvas.height=sh;
 const caption=el("figcaption",item.illustration);
 const original=el("a","View the complete original Academy picture");
 original.href=asset.src;original.target="_blank";original.rel="noopener noreferrer";
 figure.append(canvas,caption,original);
 const image=new Image();image.decoding="async";
 image.addEventListener("load",()=>{
  const ctx=canvas.getContext("2d");
  if(ctx){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(image,sx,sy,sw,sh,0,0,sw,sh)}
 },{once:true});
 image.addEventListener("error",()=>{
  caption.textContent="Original teaching picture unavailable; read the fictional situation below.";
 },{once:true});
 image.src=asset.src;
 return figure;
}
function addFeedback(target,result){
 target.replaceChildren();
 const heading=el("strong",result.correct?"Good safety judgement.":"Review this safer response.");
 const answer=el("p","Recommended: "+result.answer);
 const explanation=el("p",result.explanation);
 const dl=el("dl");dl.className="orientation-lab-fact-grid";
 for(const [name,value] of [
  ["Observed fact",result.fact],["Not yet proven",result.assumption],
  ["Immediate protection",result.immediate],["Report to",result.report]
 ]){
  dl.append(el("dt",name),el("dd",value));
 }
 target.append(heading,answer,explanation,dl);
 target.dataset.correct=String(result.correct);
}
function renderCase(){
 const item=model.cases[current];
 frame.replaceChildren();
 const heading=el("h4",item.number+". "+item.title);
 const pic=showPicture(item);
 const caseBody=el("div");caseBody.className="orientation-lab-situation";
 const situation=el("p",item.situation);
 const focus=el("p",route==="scouts"?item.scouts:item.pilots);
 focus.className="orientation-lab-route";
 const fieldset=el("fieldset"),legend=el("legend",item.question);
 fieldset.className="orientation-lab-options";fieldset.appendChild(legend);
 for(const [index,option] of item.options.entries()){
  const label=el("label"),radio=el("input"),description=el("span",option);
  radio.type="radio";radio.name="orientation-case-"+item.id;radio.value=String(index);
  if(answers.get(item.id)?.selected===index)radio.checked=true;
  label.append(radio,description);fieldset.appendChild(label);
 }
 const check=el("button","Check this decision");check.type="button";
 check.className="orientation-lab-check";
 const feedback=el("div");feedback.className="orientation-lab-feedback";
 feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
 feedback.textContent="Choose one response, then reveal the observation, the uncertainty and the safe reporting steps.";
 check.addEventListener("click",()=>{
  const chosen=fieldset.querySelector('input[type="radio"]:checked');
  if(!chosen){feedback.textContent="Select a response before checking.";return}
  const selected=Number(chosen.value),result=model.checkDecision(item.id,selected);
  answers.set(item.id,{selected,result});
  addFeedback(feedback,result);updateProgress();
 });
 const previousAnswer=answers.get(item.id);
 if(previousAnswer)addFeedback(feedback,previousAnswer.result);
 caseBody.append(situation,focus,fieldset,check,feedback);
 const row=el("div");row.className="orientation-lab-case-grid";
 row.append(pic,caseBody);
 frame.append(heading,row);
 previous.disabled=current===0;next.disabled=current===model.cases.length-1;
 updateProgress();
}
function display(moduleId,nextRoute){
 host.hidden=moduleId!=="orientation";
 if(host.hidden)return;
 route=nextRoute==="pilots"?"pilots":"scouts";
 routeFocus.textContent=route==="scouts"?
  "Scouts & Air Scouts: observe with an appointed adult leader and keep the group together.":
  "Enthusiasts & aspiring pilots: practise separating evidence, operational access and accountable reporting.";
 if(!ready){ready=true;renderCase()}else renderCase();
}
document.addEventListener("agsa:coursebook-module",event=>{
 display(event.detail?.moduleId,event.detail?.route);
});
document.addEventListener("DOMContentLoaded",()=>{
 const query=new URL(location.href).searchParams;
 display(query.get("module")||"aircraft",document.getElementById("route")?.value);
});
})(window);
