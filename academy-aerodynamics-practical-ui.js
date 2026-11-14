/* Course 03 pictorial aerodynamics classroom lab. Reuses original images;
 * no server calls, downloads, stored answers or aircraft control changes. */
(function(root){"use strict";
const lab=root.AGSAAerodynamicsPractical,atlas=root.AGSAOriginalPictureAtlas;
const host=document.getElementById("aerodynamicsPracticalLab");
if(!lab||!atlas||!host)return;
lab.validate(atlas);
const el=(tag,content)=>{const node=document.createElement(tag);if(content!==undefined)node.textContent=content;return node};
let current=0,route="scouts";
const responses=new Map();
const heading=el("header");heading.className="aero-lab-heading";
const eyebrow=el("p","COURSE 03 · ORIGINAL ILLUSTRATIONS + INTERACTIVE AERODYNAMICS");
eyebrow.className="aero-lab-eyebrow";
const title=el("h3","Explore forces, airflow and stall awareness");title.id="aerodynamicsLabTitle";
const introduction=el("p","Study the Academy's approved wing and aircraft illustrations. Explore four conceptual situations and try a bounded classroom bank/load-factor comparison.");
const focus=el("p");focus.className="aero-lab-pathway";
heading.append(eyebrow,title,introduction,focus);
const progress=el("p");progress.className="aero-lab-progress";progress.setAttribute("role","status");progress.setAttribute("aria-live","polite");
const reading=el("div");reading.className="aero-lab-reading";
const nav=el("nav");nav.className="aero-lab-nav";nav.setAttribute("aria-label","Aerodynamics lesson navigation");
const back=el("button","Previous concept"),next=el("button","Next concept");back.type=next.type="button";
back.addEventListener("click",()=>{if(current>0){current--;render()}});
next.addEventListener("click",()=>{if(current<lab.cases.length-1){current++;render()}});
nav.append(back,next);
const notice=el("p","Pictures and calculations are conceptual educational aids only, not aircraft-specific performance data, an operational manoeuvre or a verified examination. Lessons stay inside this app.");notice.className="aero-lab-notice";
host.append(heading,progress,reading,nav,notice);
const zoom=el("dialog");zoom.className="aero-lab-dialog";zoom.setAttribute("aria-label","Enlarged original aerodynamic teaching image");
const zoomTitle=el("h3"),zoomCanvas=el("canvas"),zoomClose=el("button","Close picture");
zoomClose.type="button";
zoomClose.addEventListener("click",()=>zoom.close());
zoom.addEventListener("click",e=>{if(e.target===zoom)zoom.close()});
zoom.append(zoomTitle,zoomCanvas,zoomClose);document.body.append(zoom);
const imageCache=new Map();
function loadImage(src){
 if(!imageCache.has(src)){
  const image=new Image();image.decoding="async";
  imageCache.set(src,new Promise((resolve,reject)=>{
   image.onload=()=>resolve(image);
   image.onerror=()=>reject(Error("Original Academy picture unavailable"));
   image.src=src;
  }));
 }
 return imageCache.get(src);
}
async function renderImage(canvas,asset,multiplier=1){
 const [x,y,w,h]=asset.rect;
 canvas.width=Math.round(w*multiplier);canvas.height=Math.round(h*multiplier);
 canvas.setAttribute("role","img");canvas.setAttribute("aria-label",asset.alt);
 try{
  const image=await loadImage(asset.src);
  const ctx=canvas.getContext("2d");
  if(ctx){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(image,x,y,w,h,0,0,canvas.width,canvas.height)}
 }catch{
  canvas.setAttribute("aria-label","Original teaching illustration unavailable");
 }
}
function illustration(id){
 const asset=atlas.getById(id);
 const figure=el("figure");figure.className="aero-lab-figure";
 const button=el("button");button.type="button";button.className="aero-lab-image-button";
 button.setAttribute("aria-label","Enlarge original Academy illustration: "+asset.title);
 const canvas=el("canvas");canvas.className="aero-lab-image";
 void renderImage(canvas,asset);
 const cue=el("span","Tap to enlarge");cue.className="aero-lab-image-cue";
 button.append(canvas,cue);
 button.addEventListener("click",()=>{
  zoomTitle.textContent=asset.title;
  void renderImage(zoomCanvas,asset,Math.min(2.5,1150/asset.rect[2]));
  if(!zoom.open)zoom.showModal();
  zoomClose.focus();
 });
 figure.append(button,el("figcaption",asset.title));
 return figure;
}
function makeResult(holder,result){
 holder.replaceChildren();holder.dataset.correct=String(result.correct);
 const header=el("strong",result.correct?"Correct reasoning.":"Review the aerodynamic principle.");
 holder.append(header,el("p","Recommended response: "+result.expected),el("p",result.explanation));
 const details=el("details");details.className="aero-lab-key";
 const summary=el("summary","Open the visual concept key"),list=el("dl");
 for(const [term,definition] of result.key)list.append(el("dt",term),el("dd",definition));
 details.append(summary,list);holder.append(details);
}
function comparison(){
 const outer=el("section");outer.className="aero-lab-comparison";
 const title=el("h5","Interactive classroom comparison — steady level turn");
 const expl=el("p","Move the bank angle between 0° and 60°. This example assumes a coordinated constant-altitude turn, unchanged aircraft weight and configuration. It does not represent a particular aeroplane's approved limits or recommended bank.");
 const label=el("label","Bank angle: ");
 const number=el("strong","0°");number.className="aero-lab-bank-value";
 const slider=el("input");slider.id="aeroClassroomBank";slider.type="range";
 slider.min="0";slider.max="60";slider.step="5";slider.value="0";
 slider.setAttribute("aria-label","Illustrative bank angle, 0 through 60 degrees");
 label.htmlFor=slider.id;label.append(number);
 const loadLine=el("p"),speedLine=el("p");loadLine.className=speedLine.className="aero-lab-metric";
 const loadBar=el("div"),speedBar=el("div");loadBar.className=speedBar.className="aero-lab-bar";
 const loadFill=el("span"),speedFill=el("span");
 loadBar.append(loadFill);speedBar.append(speedFill);
 const caution=el("p");caution.className="aero-lab-caution";
 function update(){
  const value=lab.levelTurn(Number(slider.value));
  number.textContent=value.angle+"°";
  loadLine.textContent="Illustrative load factor: "+value.loadFactor.toFixed(2)+" g";
  speedLine.textContent="Relative stall-speed factor: "+value.speedMultiplier.toFixed(2)+" × (about "+value.relativeIncreasePercent.toFixed(1)+"% above 1 g)";
  loadFill.style.width=(value.loadFactor/2*100).toFixed(1)+"%";
  speedFill.style.width=(value.speedMultiplier/Math.sqrt(2)*100).toFixed(1)+"%";
  caution.textContent=value.caution;
 }
 slider.addEventListener("input",update);
 outer.append(title,expl,label,slider,loadLine,loadBar,speedLine,speedBar,caution);
 update();return outer;
}
function render(){
 const lesson=lab.cases[current];
 reading.replaceChildren();
 const heading=el("h4",String(lesson.number).padStart(2,"0")+" · "+lesson.title);
 const two=el("div");two.className="aero-lab-grid";
 const gallery=el("div");gallery.className="aero-lab-gallery";
 for(const id of lesson.pictures)gallery.append(illustration(id));
 const panel=el("div");panel.className="aero-lab-panel";
 const objective=el("p",lesson.observation);
 const routeNote=el("p",route==="scouts"?lesson.scouts:lesson.pilots);routeNote.className="aero-lab-pathway";
 const questions=el("fieldset");questions.className="aero-lab-questions";
 questions.append(el("legend",lesson.question));
 for(const [i,option] of lesson.options.entries()){
  const choice=el("label"),input=el("input"),text=el("span",option);
  input.type="radio";input.name="aero-"+lesson.id;input.value=String(i);
  input.checked=responses.get(lesson.id)?.selected===i;
  choice.append(input,text);questions.append(choice);
 }
 const check=el("button","Check my reasoning");check.type="button";check.className="aero-lab-check";
 const result=el("div");result.className="aero-lab-result";
 result.setAttribute("role","status");result.setAttribute("aria-live","polite");
 const prior=responses.get(lesson.id);
 if(prior)makeResult(result,prior.result);
 else result.textContent="Look closely at the illustration, choose a response and review the explanation.";
 check.addEventListener("click",()=>{
  const picked=questions.querySelector('input[type="radio"]:checked');
  if(!picked){result.textContent="Choose one response before checking.";return}
  const selected=Number(picked.value),outcome=lab.evaluate(lesson.id,selected);
  responses.set(lesson.id,{selected,result:outcome});
  makeResult(result,outcome);showProgress();
 });
 panel.append(objective,routeNote,questions,check,result);
 two.append(gallery,panel);reading.append(heading,two);
 if(lesson.id==="bank-and-load")reading.append(comparison());
 back.disabled=current===0;next.disabled=current===lab.cases.length-1;
 showProgress();
}
function showProgress(){
 progress.textContent=(current+1)+" of "+lab.cases.length+" aerodynamics illustrations · "+responses.size+" responses reviewed during this visit (ungraded)";
}
function show(moduleId,newRoute){
 host.hidden=moduleId!=="aerodynamics";
 if(host.hidden){if(zoom.open)zoom.close();return}
 route=newRoute==="pilots"?"pilots":"scouts";
 focus.textContent=route==="scouts"?
  "Scouts & Air Scouts: inspect the pictures, name each force and discuss the comparisons with your appointed adult instructor.":
  "Enthusiasts & aspiring pilots: connect the pictures to forces, relative wind, critical angle of attack and idealised level-turn relationships.";
 render();
}
document.addEventListener("agsa:coursebook-module",e=>show(e.detail?.moduleId,e.detail?.route));
document.addEventListener("DOMContentLoaded",()=>{
 const params=new URL(location.href).searchParams;
 const selected=document.getElementById("moduleTitle")?.textContent||"";
 show(/principles of flight and aerodynamics/i.test(selected)?"aerodynamics":params.get("module")||"aircraft",
   document.getElementById("route")?.value);
});
})(window);
