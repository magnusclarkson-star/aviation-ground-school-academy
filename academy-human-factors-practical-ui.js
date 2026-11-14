/* Course 11 picture-led self-study exercises: touch-friendly and in-app only. */
(function(root){"use strict";
const model=root.AGSAHumanFactorsPractical,atlas=root.AGSAOriginalPictureAtlas;
const host=document.getElementById("humanFactorsPracticalLab");
if(!model||!atlas||!host)return;
model.validate(atlas);
const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n};
let active=0,route="scouts";const responses=new Map(),pictures=new Map();
const header=el("header");header.className="human-lab-header";
const kicker=el("p","COURSE 11 · HUMAN FACTORS");kicker.className="human-lab-kicker";
const title=el("h3","Recognise hazards, protect attention, speak up");title.id="humanFactorsLabTitle";
const intro=el("p","Four illustrated classroom situations using the Academy's original teaching pictures. Tap a picture to enlarge it; explore the checks without a flight clearance or formal grade.");
const focus=el("p");focus.className="human-lab-focus";
header.append(kicker,title,intro,focus);
const progress=el("p");progress.className="human-lab-progress";progress.setAttribute("role","status");progress.setAttribute("aria-live","polite");
const reading=el("div");reading.className="human-lab-reading";
const nav=el("nav");nav.className="human-lab-nav";nav.setAttribute("aria-label","Human-factors exercise navigation");
const prev=el("button","Previous"),next=el("button","Next");
prev.type=next.type="button";prev.addEventListener("click",()=>{if(active){active--;render()}});
next.addEventListener("click",()=>{if(active<model.cases.length-1){active++;render()}});
nav.append(prev,next);
const foot=el("p","Self-study only · no medical evaluation, operational go/no-go decision, investigation finding, formal grade or document download. Academy notes remain in this view.");
foot.className="human-lab-foot";
host.append(header,progress,reading,nav,foot);
const zoom=el("dialog");zoom.className="human-lab-dialog";zoom.setAttribute("aria-label","Enlarged Academy human factors illustration");
const zoomTitle=el("h3"),zoomCanvas=el("canvas"),close=el("button","Close picture");
close.type="button";close.addEventListener("click",()=>zoom.close());
zoom.addEventListener("click",e=>{if(e.target===zoom)zoom.close()});
zoom.append(zoomTitle,zoomCanvas,close);document.body.append(zoom);
function imageFor(src){
 if(!pictures.has(src)){
  const img=new Image();img.decoding="async";
  pictures.set(src,new Promise((resolve,reject)=>{
   img.onload=()=>resolve(img);img.onerror=()=>reject(Error("Original picture unavailable"));img.src=src;
  }));
 }
 return pictures.get(src);
}
async function paint(canvas,asset,scale=1){
 const [x,y,w,h]=asset.rect;canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
 canvas.setAttribute("role","img");canvas.setAttribute("aria-label",asset.alt);
 try{
  const img=await imageFor(asset.src),ctx=canvas.getContext("2d");
  if(ctx){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(img,x,y,w,h,0,0,canvas.width,canvas.height)}
 }catch{canvas.setAttribute("aria-label","Original teaching picture unavailable")}
}
function figure(id){
 const asset=atlas.getById(id),fig=el("figure");fig.className="human-lab-figure";
 const trigger=el("button");trigger.type="button";trigger.className="human-lab-picture-trigger";
 trigger.setAttribute("aria-label","Enlarge original picture: "+asset.title);
 const canvas=el("canvas");canvas.className="human-lab-picture";void paint(canvas,asset);
 const cue=el("span","Tap to enlarge");cue.className="human-lab-zoom-cue";
 trigger.append(canvas,cue);
 trigger.addEventListener("click",()=>{
  zoomTitle.textContent=asset.title;void paint(zoomCanvas,asset,Math.min(2.4,1120/asset.rect[2]));
  if(!zoom.open)zoom.showModal();close.focus();
 });
 fig.append(trigger,el("figcaption",asset.title));return fig;
}
function feedback(holder,outcome){
 holder.replaceChildren();holder.dataset.correct=String(outcome.correct);
 holder.append(el("strong",outcome.correct?"Correct concept.":"Review the human-factors distinction."),
  el("p","Recommended response: "+outcome.expected),el("p",outcome.explanation));
 const details=el("details"),list=el("dl");details.className="human-lab-glossary";
 for(const [term,def] of outcome.key)list.append(el("dt",term),el("dd",def));
 details.append(el("summary","Explore key terms"),list);holder.append(details);
}
function readinessCards(){
 const section=el("section");section.className="human-lab-activity";
 section.append(el("h5","IMSAFE — explore personal readiness"),
  el("p","Choose any fictional warning signs. This classroom self-check cannot approve anyone to fly."));
 const cards=el("div");cards.className="human-lab-choice-grid";
 const output=el("div");output.className="human-lab-output";output.setAttribute("role","status");output.setAttribute("aria-live","polite");
 for(const f of model.IMSAFE){
  const label=el("label");label.className="human-lab-checkbox";
  const input=el("input");input.type="checkbox";input.value=f.id;
  label.append(input,el("span",f.name));cards.append(label);
 }
 function update(){
  const selected=Array.from(cards.querySelectorAll("input:checked"),x=>x.value);
  const result=model.readiness(selected);
  output.replaceChildren(el("strong",result.count+" of 6 topics selected"),el("p",result.message));
  if(result.count){
   const ul=el("ul");
   for(const f of result.flags)ul.append(el("li",f.name+": "+f.cue));
   output.append(ul);
  }
 }
 cards.addEventListener("change",update);section.append(cards,output);update();return section;
}
function paveCards(){
 const section=el("section");section.className="human-lab-activity";
 section.append(el("h5","PAVE — four connected areas to review"),
  el("p","Tap a category to reveal why each fictional hazard matters. No numerical score is assigned."));
 const cards=el("div");cards.className="human-lab-risk-grid";
 for(const item of model.PAVE){
  const card=el("div");card.className="human-lab-risk-card";
  const heading=el("strong",item.label),hint=el("p",item.hint);
  const button=el("button","Explore");button.type="button";button.setAttribute("aria-expanded","false");
  const detail=el("p",model.pave(item.id).why);detail.hidden=true;detail.className="human-lab-risk-detail";
  button.addEventListener("click",()=>{
   detail.hidden=!detail.hidden;button.setAttribute("aria-expanded",String(!detail.hidden));
   button.textContent=detail.hidden?"Explore":"Hide detail";
  });
  card.append(heading,hint,button,detail);cards.append(card);
 }
 section.append(cards);return section;
}
function workloadCards(){
 const section=el("section");section.className="human-lab-activity";
 section.append(el("h5","Workload — make the situation easier to see"),
  el("p","A fictional panel contains competing cues. Tap each category to reveal its relevance."));
 const cards=el("div");cards.className="human-lab-risk-grid";
 for(const item of model.WORKLOAD){
  const card=el("div");card.className="human-lab-risk-card";
  const button=el("button",item.label);button.type="button";button.setAttribute("aria-expanded","false");
  const detail=el("p",model.workload(item.id).hint);detail.hidden=true;
  button.addEventListener("click",()=>{detail.hidden=!detail.hidden;button.setAttribute("aria-expanded",String(!detail.hidden))});
  card.append(button,detail);cards.append(card);
 }
 section.append(cards);return section;
}
function reportingSteps(){
 const section=el("section");section.className="human-lab-activity";
 section.append(el("h5","Construct a factual classroom report"),
  el("p","Differentiate the evidence from interpretation. The report is not submitted or stored."));
 const dl=el("dl");dl.className="human-lab-steps";
 for(const [term,meaning] of [
  ["Observed","The simulator indication disagreed with the expected response during the lesson."],
  ["Uncertain","We do not know whether the cause is a model, control or display problem."],
  ["Follow-up","Record the discrepancy for qualified instructor and development review."]])
  dl.append(el("dt",term),el("dd",meaning));
 section.append(dl);return section;
}
function updateProgress(){
 progress.textContent=(active+1)+" of "+model.cases.length+" picture exercises · "+responses.size+" reviewed this visit (ungraded)";
}
function render(){
 const item=model.cases[active];reading.replaceChildren();
 const heading=el("h4",String(item.number).padStart(2,"0")+" · "+item.title);
 const grid=el("div");grid.className="human-lab-grid";
 const gallery=el("div");gallery.className="human-lab-gallery";
 for(const id of item.pictures)gallery.append(figure(id));
 const lesson=el("div");lesson.className="human-lab-lesson";
 const situation=el("p",item.situation),audience=el("p",route==="pilots"?item.pilots:item.scouts);audience.className="human-lab-focus";
 const choices=el("fieldset");choices.className="human-lab-choices";choices.append(el("legend",item.question));
 for(const [i,option] of item.options.entries()){
  const label=el("label"),input=el("input");input.type="radio";input.name="human-"+item.id;input.value=String(i);
  input.checked=responses.get(item.id)?.choice===i;
  label.append(input,el("span",option));choices.append(label);
 }
 const check=el("button","Check the concept");check.type="button";
 const result=el("div");result.className="human-lab-feedback";result.setAttribute("role","status");result.setAttribute("aria-live","polite");
 if(responses.has(item.id))feedback(result,responses.get(item.id).outcome);
 else result.textContent="Inspect the pictures, choose an answer and read the explanation.";
 check.addEventListener("click",()=>{
  const picked=choices.querySelector('input[type="radio"]:checked');
  if(!picked){result.textContent="Select one response first.";return}
  const choice=Number(picked.value),outcome=model.evaluate(item.id,choice);
  responses.set(item.id,{choice,outcome});feedback(result,outcome);updateProgress();
 });
 lesson.append(situation,audience,choices,check,result);
 grid.append(gallery,lesson);reading.append(heading,grid);
 if(item.id==="readiness")reading.append(readinessCards());
 if(item.id==="pave")reading.append(paveCards());
 if(item.id==="workload")reading.append(workloadCards());
 if(item.id==="reporting")reading.append(reportingSteps());
 prev.disabled=active===0;next.disabled=active===model.cases.length-1;updateProgress();
}
function display(moduleId,path){
 host.hidden=moduleId!=="human";
 if(host.hidden){if(zoom.open)zoom.close();return}
 route=path==="pilots"?"pilots":"scouts";
 focus.textContent=route==="pilots"?
  "Enthusiasts & aspiring pilots: identify human-performance hazards and the limits of classroom risk models.":
  "Scouts & Air Scouts: explore teamwork, readiness and respectful hazard reporting with an adult instructor.";
 render();
}
document.addEventListener("agsa:coursebook-module",e=>display(e.detail?.moduleId,e.detail?.route));
document.addEventListener("DOMContentLoaded",()=>{
 const id=new URL(location.href).searchParams.get("module")||"aircraft";
 const named=document.getElementById("moduleTitle")?.textContent||"";
 display(/human factors and decision-making/i.test(named)?"human":id,document.getElementById("route")?.value);
});
})(window);
