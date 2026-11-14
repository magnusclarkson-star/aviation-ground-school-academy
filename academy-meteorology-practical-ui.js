/* Course 06 picture-led weather practice. Reports are invented, no API calls,
   no notes download, no user-specific record, and no real flight briefing. */
(function(root){"use strict";
const model=root.AGSAMeteorologyPractical,atlas=root.AGSAOriginalPictureAtlas;
const host=document.getElementById("meteorologyPracticalLab");
if(!model||!atlas||!host)return;
model.validate(atlas);
const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n};
let active=0,route="scouts";const responses=new Map(),cache=new Map();
const head=el("header");head.className="wx-lab-head";
const eyebrow=el("p","COURSE 06 · PICTORIAL AVIATION WEATHER");eyebrow.className="wx-lab-eyebrow";
const title=el("h3","Recognise weather hazards and decode reports");title.id="meteorologyLabTitle";
const intro=el("p","Examine the Academy's original cloud drawings. Compare fictional observations, forecasts and weather changes using interactive coded-message cards.");
const focus=el("p");focus.className="wx-lab-focus";
head.append(eyebrow,title,intro,focus);
const progress=el("p");progress.className="wx-lab-progress";progress.setAttribute("role","status");progress.setAttribute("aria-live","polite");
const reading=el("div");reading.className="wx-lab-reading";
const controls=el("nav");controls.className="wx-lab-navigation";controls.setAttribute("aria-label","Weather study exercises");
const prev=el("button","Previous weather exercise"),next=el("button","Next weather exercise");
prev.type=next.type="button";
prev.addEventListener("click",()=>{if(active>0){active--;render()}});
next.addEventListener("click",()=>{if(active<model.cases.length-1){active++;render()}});
controls.append(prev,next);
const foot=el("p","All station identifiers, reports and scenarios are fictional classroom examples. No current conditions, airport clearance, go/no-go advice or operational forecast is provided. Your answers are not stored or exported.");foot.className="wx-lab-foot";
host.append(head,progress,reading,controls,foot);
const zoom=el("dialog");zoom.className="wx-lab-dialog";zoom.setAttribute("aria-label","Enlarged approved cloud illustration");
const zoomTitle=el("h3"),zoomCanvas=el("canvas"),close=el("button","Close picture");
close.type="button";
close.addEventListener("click",()=>zoom.close());zoom.addEventListener("click",e=>{if(e.target===zoom)zoom.close()});
zoom.append(zoomTitle,zoomCanvas,close);document.body.append(zoom);
function image(src){
 if(!cache.has(src)){
  const p=new Image();p.decoding="async";
  cache.set(src,new Promise((resolve,reject)=>{
   p.onload=()=>resolve(p);p.onerror=()=>reject(Error("Original approved weather illustration unavailable"));p.src=src;
  }));
 }
 return cache.get(src);
}
async function draw(canvas,asset,multiplier=1){
 const [x,y,w,h]=asset.rect;canvas.width=Math.round(w*multiplier);canvas.height=Math.round(h*multiplier);
 canvas.setAttribute("role","img");canvas.setAttribute("aria-label",asset.alt);
 try{
  const picture=await image(asset.src),ctx=canvas.getContext("2d");
  if(ctx){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(picture,x,y,w,h,0,0,canvas.width,canvas.height)}
 }catch{canvas.setAttribute("aria-label","Weather teaching image unavailable")}
}
function picture(id){
 const asset=atlas.getById(id),figure=el("figure");figure.className="wx-lab-figure";
 const button=el("button");button.type="button";button.className="wx-lab-picture-button";
 button.setAttribute("aria-label","Enlarge approved Academy cloud picture: "+asset.title);
 const canvas=el("canvas");canvas.className="wx-lab-picture";void draw(canvas,asset);
 const cue=el("span","Tap to enlarge");cue.className="wx-lab-picture-cue";button.append(canvas,cue);
 button.addEventListener("click",()=>{
  zoomTitle.textContent=asset.title;
  void draw(zoomCanvas,asset,Math.min(2.3,1150/asset.rect[2]));
  if(!zoom.open)zoom.showModal();close.focus();
 });
 figure.append(button,el("figcaption",asset.title));return figure;
}
function feedback(holder,result){
 holder.replaceChildren();holder.dataset.correct=String(result.correct);
 holder.append(el("strong",result.correct?"Correct interpretation.":"Review the weather evidence."),
  el("p","Recommended answer: "+result.expected),el("p",result.explanation));
 const details=el("details");details.className="wx-lab-key";
 const dl=el("dl");
 for(const [word,meaning] of result.key)dl.append(el("dt",word),el("dd",meaning));
 details.append(el("summary","Open the weather terms and meanings"),dl);
 holder.append(details);
}
function codedReport(type){
 const sample=model.report(type);
 const panel=el("section");panel.className="wx-lab-decode";
 panel.setAttribute("aria-label","Invented "+type.toUpperCase()+" coded bulletin");
 panel.append(el("h5","Interactive "+type.toUpperCase()+" decoder · fictional ZZZZ"));
 const instruction=el("p","Select each coded group to reveal what it means. All times are UTC. This is not a live weather service.");
 const line=el("div");line.className="wx-lab-code-line";
 line.setAttribute("role","group");line.setAttribute("aria-label","Select coded "+type.toUpperCase()+" weather groups");
 const output=el("div");output.className="wx-lab-code-meaning";
 output.setAttribute("role","status");output.setAttribute("aria-live","polite");
 for(const [index,group] of sample.groups.entries()){
  const button=el("button",group.token);button.type="button";button.dataset.token=group.token;
  button.setAttribute("aria-pressed",String(index===0));
  button.addEventListener("click",()=>{
   const chosen=model.decode(type,index);
   for(const item of line.children)item.setAttribute("aria-pressed",String(item===button));
   output.textContent=chosen.token+" — "+chosen.meaning;
   output.dataset.token=chosen.token;
  });
  line.append(button);
 }
 output.textContent=sample.groups[0].token+" — "+sample.groups[0].meaning;
 output.dataset.token=sample.groups[0].token;
 panel.append(instruction,line,output);
 if(type==="taf"){
  const time=el("div");time.className="wx-lab-time-grid";
  const valid=el("div");valid.className="wx-lab-time-valid";
  valid.append(el("strong","Forecast validity"),el("span","Day 14 12:00 → Day 15 12:00 UTC"));
  const tempo=el("div");tempo.className="wx-lab-time-tempo";
  tempo.append(el("strong","Temporary weather group"),el("span","Day 14 14:00–18:00 UTC · 4000 TSRA BKN015CB"));
  time.append(valid,tempo);panel.append(time);
 }
 return panel;
}
function cloudKey(){
 const panel=el("section");panel.className="wx-lab-cloud-steps";
 panel.append(el("h5","Conceptual cloud-growth comparison"));
 const steps=el("div");steps.className="wx-lab-step-grid";
 for(const [name,description,signal] of [
  ["Shallow cumulus","Limited vertical extent in the classroom example","Not proof of safe conditions"],
  ["Towering cumulus","Growing vertical development may indicate convection","Check developing hazards"],
  ["Cumulonimbus","May include thunderstorms, lightning, heavy precipitation and turbulence","Consult current authoritative hazards information"]
 ]){
  const item=el("div");item.className="wx-lab-step";
  item.append(el("strong",name),el("p",description),el("span",signal));steps.append(item);
 }
 panel.append(steps,el("p","The comparison is conceptual; do not infer actual cloud height, severity or airspace conditions from this original illustration."));
 return panel;
}
function render(){
 const item=model.cases[active];reading.replaceChildren();
 const h=el("h4",String(item.number).padStart(2,"0")+" · "+item.title);
 const layout=el("div");layout.className="wx-lab-grid";
 const gallery=el("div");gallery.className="wx-lab-gallery";
 for(const id of item.pictures)gallery.append(picture(id));
 const lesson=el("div");lesson.className="wx-lab-lesson";
 const situation=el("p",item.situation);
 const path=el("p",route==="scouts"?item.scouts:item.pilots);path.className="wx-lab-focus";
 const field=el("fieldset");field.className="wx-lab-questions";
 field.append(el("legend",item.question));
 for(const [index,option] of item.options.entries()){
  const label=el("label"),input=el("input");
  input.type="radio";input.name="wx-"+item.id;input.value=String(index);
  input.checked=responses.get(item.id)?.choice===index;
  label.append(input,el("span",option));field.append(label);
 }
 const check=el("button","Check weather interpretation");check.type="button";check.className="wx-lab-check";
 const answer=el("div");answer.className="wx-lab-feedback";
 answer.setAttribute("role","status");answer.setAttribute("aria-live","polite");
 const previous=responses.get(item.id);
 if(previous)feedback(answer,previous.result);
 else answer.textContent="Study the picture and any coded report, select an answer and review the explanation.";
 check.addEventListener("click",()=>{
  const selected=field.querySelector('input[type="radio"]:checked');
  if(!selected){answer.textContent="Choose one response before checking.";return}
  const choice=Number(selected.value),result=model.evaluate(item.id,choice);
  responses.set(item.id,{choice,result});feedback(answer,result);update();
 });
 lesson.append(situation,path,field,check,answer);
 layout.append(gallery,lesson);reading.append(h,layout);
 if(item.id==="clouds")reading.append(cloudKey());
 if(item.id==="metar"||item.id==="taf")reading.append(codedReport(item.id));
 prev.disabled=active===0;next.disabled=active===model.cases.length-1;update();
}
function update(){progress.textContent=(active+1)+" of "+model.cases.length+" weather exercises · "+responses.size+" responses reviewed this visit (ungraded)"}
function display(id,newRoute){
 host.hidden=id!=="meteorology";
 if(host.hidden){if(zoom.open)zoom.close();return}
 route=newRoute==="pilots"?"pilots":"scouts";
 focus.textContent=route==="scouts"?
  "Scouts & Air Scouts: compare cloud pictures and interpret fictional messages with your adult instructor.":
  "Enthusiasts & aspiring pilots: distinguish observations, forecasts, time groups, weather hazards and their source limitations.";
 render();
}
document.addEventListener("agsa:coursebook-module",e=>display(e.detail?.moduleId,e.detail?.route));
document.addEventListener("DOMContentLoaded",()=>{
 const query=new URL(location.href).searchParams;
 const selected=document.getElementById("moduleTitle")?.textContent||"";
 display(/aviation weather and interpreting reports/i.test(selected)?"meteorology":query.get("module")||"aircraft",
  document.getElementById("route")?.value);
});
})(window);
