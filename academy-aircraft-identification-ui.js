/* Course 02 additive picture-and-answer lab. The original approved aircraft
   models, cockpit layouts and source Academy artwork are never changed. */
(function(root){"use strict";
const lab=root.AGSAAircraftStructurePractical,atlas=root.AGSAOriginalPictureAtlas;
const host=document.getElementById("aircraftIdentificationLab");
if(!lab||!atlas||!host)return;
lab.validate(atlas);
const make=(tag,content)=>{const e=document.createElement(tag);if(content!==undefined)e.textContent=content;return e};
let active=0,route="scouts",hasStarted=false;
const choices=new Map();
const header=make("header");
header.className="aircraft-id-heading";
const eyebrow=make("p","COURSE 02 · PICTURE-LED AIRCRAFT IDENTIFICATION");
eyebrow.className="aircraft-id-eyebrow";
const title=make("h3","Identify structures and control surfaces");
title.id="aircraftLabTitle";
const intro=make("p","Use the original Academy pictures to identify major components, connect control surfaces with movement axes, and compare a fixed-wing trainer with a helicopter.");
const pathway=make("p");pathway.className="aircraft-id-pathway";
header.append(eyebrow,title,intro,pathway);
const progress=make("p");progress.className="aircraft-id-progress";
progress.setAttribute("role","status");progress.setAttribute("aria-live","polite");
const body=make("div");body.className="aircraft-id-body";
const controls=make("nav");controls.className="aircraft-id-controls";controls.setAttribute("aria-label","Aircraft identification situations");
const previous=make("button","Previous picture"),next=make("button","Next picture");
previous.type=next.type="button";
previous.addEventListener("click",()=>{if(active>0){active--;render()}});
next.addEventListener("click",()=>{if(active<lab.cases.length-1){active++;render()}});
controls.append(previous,next);
const foot=make("p","Practice only. These illustrations are conceptual teaching artwork, not engineering drawings or operating manuals. No photo, answer or note is downloaded, uploaded or scored as an official assessment.");
foot.className="aircraft-id-foot";
host.append(header,progress,body,controls,foot);
const zoom=make("dialog");zoom.className="aircraft-id-zoom";zoom.setAttribute("aria-label","Enlarged original aircraft illustration");
const zoomTitle=make("h3"),zoomCanvas=make("canvas"),close=make("button","Close enlarged picture");
close.type="button";
close.addEventListener("click",()=>zoom.close());
zoom.addEventListener("click",e=>{if(e.target===zoom)zoom.close()});
zoom.append(zoomTitle,zoomCanvas,close);
document.body.append(zoom);
function crop(canvas,asset,scale=1){
 const [x,y,w,h]=asset.rect;
 canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
 canvas.setAttribute("role","img");canvas.setAttribute("aria-label",asset.alt);
 const image=new Image();image.decoding="async";
 image.onload=()=>{
  const ctx=canvas.getContext("2d");
  if(ctx){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(image,x,y,w,h,0,0,canvas.width,canvas.height)}
 };
 image.onerror=()=>{canvas.setAttribute("aria-label","Original course illustration unavailable")};
 image.src=asset.src;
}
function imageCard(id){
 const asset=atlas.getById(id);
 const figure=make("figure");figure.className="aircraft-id-figure";
 const button=make("button");button.type="button";button.className="aircraft-id-picture-button";
 button.setAttribute("aria-label","Enlarge original Academy illustration: "+asset.title);
 const canvas=make("canvas");canvas.className="aircraft-id-picture";
 crop(canvas,asset);
 const cue=make("span","Tap to enlarge");
 cue.className="aircraft-id-picture-cue";
 button.append(canvas,cue);
 button.addEventListener("click",()=>{
  zoomTitle.textContent=asset.title;
  crop(zoomCanvas,asset,Math.min(2,1100/asset.rect[2]));
  if(!zoom.open)zoom.showModal();
  close.focus();
 });
 const caption=make("figcaption",asset.title);
 figure.append(button,caption);
 return figure;
}
function feedback(container,result){
 container.replaceChildren();
 container.dataset.correct=String(result.correct);
 const headline=make("strong",result.correct?"Correct identification.":"Review the illustration and matching function.");
 const preferred=make("p","Recommended answer: "+result.expected);
 const why=make("p",result.explanation);
 const key=make("details");key.className="aircraft-id-key";
 const keyHead=make("summary","Open labelled part-and-function key");
 const dl=make("dl");
 for(const [term,meaning] of result.visualKey){dl.append(make("dt",term),make("dd",meaning))}
 key.append(keyHead,dl);
 container.append(headline,preferred,why,key);
}
function render(){
 const item=lab.cases[active];
 body.replaceChildren();
 const h=make("h4",String(item.number).padStart(2,"0")+" · "+item.title);
 const content=make("div");content.className="aircraft-id-content";
 const gallery=make("div");gallery.className="aircraft-id-gallery";
 for(const picture of item.pictures)gallery.append(imageCard(picture));
 const lesson=make("div");lesson.className="aircraft-id-lesson";
 const observation=make("p",item.observation);
 const focus=make("p",route==="scouts"?item.scouts:item.pilots);
 focus.className="aircraft-id-pathway";
 const group=make("fieldset");group.className="aircraft-id-answers";
 group.append(make("legend",item.question));
 for(const [i,option] of item.options.entries()){
  const label=make("label"),input=make("input"),span=make("span",option);
  input.type="radio";input.name="aircraft-id-"+item.id;input.value=String(i);
  input.checked=choices.get(item.id)?.choice===i;
  label.append(input,span);group.append(label);
 }
 const button=make("button","Check identification");button.type="button";button.className="aircraft-id-check";
 const outcome=make("div");outcome.className="aircraft-id-feedback";
 outcome.setAttribute("role","status");outcome.setAttribute("aria-live","polite");
 const prior=choices.get(item.id);
 if(prior)feedback(outcome,prior.result);
 else outcome.textContent="Study the original picture, select one answer and check your reasoning.";
 button.addEventListener("click",()=>{
  const selected=group.querySelector('input[type="radio"]:checked');
  if(!selected){outcome.textContent="Choose an answer before checking.";return}
  const choice=Number(selected.value);
  const result=lab.evaluate(item.id,choice);
  choices.set(item.id,{choice,result});
  feedback(outcome,result);update();
 });
 lesson.append(observation,focus,group,button,outcome);
 content.append(gallery,lesson);body.append(h,content);
 previous.disabled=active===0;next.disabled=active===lab.cases.length-1;
 update();
}
function update(){
 progress.textContent=(active+1)+" of "+lab.cases.length+" picture exercises · "+choices.size+" reviewed on this page (ungraded)";
}
function display(moduleId,path){
 host.hidden=moduleId!=="aircraft";
 if(host.hidden){if(zoom.open)zoom.close();return}
 route=path==="pilots"?"pilots":"scouts";
 pathway.textContent=route==="scouts"?
  "Scouts & Air Scouts: observe each part, name its basic purpose and compare the pictures with your patrol's adult instructor.":
  "Enthusiasts & aspiring pilots: link component function to aircraft axes and distinguish conventional fixed-wing from rotorcraft design.";
 hasStarted=true;
 render();
}
document.addEventListener("agsa:coursebook-module",e=>display(e.detail?.moduleId,e.detail?.route));
document.addEventListener("DOMContentLoaded",()=>{
 const query=new URL(location.href).searchParams;
 const selected=document.getElementById("moduleTitle")?.textContent||"";
 const m=selected.toLowerCase().includes("structures")?"aircraft":query.get("module");
 display(m||"aircraft",document.getElementById("route")?.value);
});
})(window);
