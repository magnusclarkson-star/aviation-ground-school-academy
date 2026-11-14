/* Course 05 pictorial instrument practice. Uses cropped views of the owner's
 * original Academy artwork. All exercise answers stay in page memory. */
(function(root){"use strict";
const model=root.AGSAInstrumentPractical,atlas=root.AGSAOriginalPictureAtlas;
const host=document.getElementById("instrumentsPracticalLab");
if(!model||!atlas||!host)return;
model.validate(atlas);
const make=(tag,value)=>{const x=document.createElement(tag);if(value!==undefined)x.textContent=value;return x};
let active=0,route="scouts";
const choices=new Map(),pictureCache=new Map();
const header=make("header");header.className="inst-lab-head";
const eyebrow=make("p","COURSE 05 · ILLUSTRATED FLIGHT INSTRUMENTS");eyebrow.className="inst-lab-kicker";
const title=make("h3","Read instruments, identify sources and compare displays");title.id="instrumentsLabTitle";
const intro=make("p","Look at the approved analogue and glass-cockpit pictures. Practise recognising indications, pressure sources and simulated disagreements—without changing the actual flight simulator.");
const focus=make("p");focus.className="inst-lab-focus";header.append(eyebrow,title,intro,focus);
const progress=make("p");progress.className="inst-lab-progress";
progress.setAttribute("role","status");progress.setAttribute("aria-live","polite");
const body=make("div");body.className="inst-lab-reading";
const nav=make("nav");nav.className="inst-lab-nav";nav.setAttribute("aria-label","Instrument study exercise navigation");
const prev=make("button","Previous instrument"),next=make("button","Next instrument");
prev.type=next.type="button";
prev.addEventListener("click",()=>{if(active>0){active--;render()}});
next.addEventListener("click",()=>{if(active<model.cases.length-1){active++;render()}});
nav.append(prev,next);
const footer=make("p","Original pictures and diagrams are educational references, not calibrated aircraft instruments. Fictional examples cannot certify airworthiness, actual sensor faults, clearance or cockpit operating limits. Answers and teaching notes are not downloaded.");footer.className="inst-lab-foot";
host.append(header,progress,body,nav,footer);
const zoom=make("dialog");zoom.className="inst-lab-dialog";zoom.setAttribute("aria-label","Enlarged approved instrument illustration");
const zoomHeading=make("h3"),zoomCanvas=make("canvas"),close=make("button","Close picture");
close.type="button";close.addEventListener("click",()=>zoom.close());
zoom.addEventListener("click",e=>{if(e.target===zoom)zoom.close()});
zoom.append(zoomHeading,zoomCanvas,close);document.body.append(zoom);
function image(src){
 if(!pictureCache.has(src)){
  const picture=new Image();picture.decoding="async";
  pictureCache.set(src,new Promise((resolve,reject)=>{
   picture.onload=()=>resolve(picture);
   picture.onerror=()=>reject(Error("Approved original illustration unavailable"));
   picture.src=src;
  }));
 }
 return pictureCache.get(src);
}
async function draw(canvas,asset,scale=1){
 const [x,y,w,h]=asset.rect;
 canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
 canvas.setAttribute("role","img");canvas.setAttribute("aria-label",asset.alt);
 try{
  const pic=await image(asset.src),ctx=canvas.getContext("2d");
  if(ctx){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(pic,x,y,w,h,0,0,canvas.width,canvas.height)}
 }catch{canvas.setAttribute("aria-label","Original course illustration unavailable")}
}
function figure(id){
 const asset=atlas.getById(id),figure=make("figure");figure.className="inst-lab-figure";
 const button=make("button");button.type="button";button.className="inst-lab-picture-button";
 button.setAttribute("aria-label","Enlarge original instrument picture: "+asset.title);
 const canvas=make("canvas");canvas.className="inst-lab-picture";void draw(canvas,asset);
 const cue=make("span","Tap to enlarge");cue.className="inst-lab-enlarge";
 button.append(canvas,cue);
 button.addEventListener("click",()=>{
  zoomHeading.textContent=asset.title;
  void draw(zoomCanvas,asset,Math.min(2.4,1150/asset.rect[2]));
  if(!zoom.open)zoom.showModal();close.focus();
 });
 figure.append(button,make("figcaption",asset.title));return figure;
}
function feedback(panel,result){
 panel.replaceChildren();panel.dataset.correct=String(result.correct);
 panel.append(make("strong",result.correct?"Correct instrument concept.":"Review what this indication measures."),
   make("p","Recommended: "+result.expected),make("p",result.explanation));
 const details=make("details");details.className="inst-lab-key";
 const dl=make("dl");
 for(const [term,description] of result.key)dl.append(make("dt",term),make("dd",description));
 details.append(make("summary","Open the illustrated instrument key"),dl);panel.append(details);
}
function sensorLab(){
 const panel=make("section");panel.className="inst-lab-sensors";
 const heading=make("h5","Interactive source map — conventional instruments");
 const intro=make("p","Choose an instrument. Its teaching card shows the measured source(s) and indicated quantity, not a real aircraft plumbing diagram.");
 const buttons=make("div");buttons.className="inst-lab-source-tabs";
 const graphic=make("div");graphic.className="inst-lab-source-content";
 const options=[["airspeed","Airspeed"],["altimeter","Altimeter"],["vsi","Vertical speed"]];
 function select(key){
  const card=model.sourceCard(key);graphic.replaceChildren();
  const title=make("h6",card.label),flow=make("div");flow.className="inst-lab-source-flow";
  for(const input of card.inputs){
   const b=make("div",input);b.className="inst-lab-source-node";flow.append(b);
  }
  const arrow=make("span","→");arrow.className="inst-lab-source-arrow";arrow.setAttribute("aria-hidden","true");
  const output=make("div",card.output);output.className="inst-lab-source-output";
  flow.append(arrow,output);
  const note=make("p",card.note);note.className="inst-lab-source-note";
  graphic.append(title,flow,note);graphic.dataset.source=key;
  for(const button of buttons.children)button.setAttribute("aria-pressed",String(button.dataset.source===key));
 }
 for(const [key,label] of options){
  const button=make("button",label);button.type="button";button.dataset.source=key;
  button.addEventListener("click",()=>select(key));buttons.append(button);
 }
 panel.append(heading,intro,buttons,graphic);select("airspeed");return panel;
}
function render(){
 const item=model.cases[active];body.replaceChildren();
 const h=make("h4",String(item.number).padStart(2,"0")+" · "+item.title);
 const layout=make("div");layout.className="inst-lab-grid";
 const images=make("div");images.className="inst-lab-gallery";
 for(const id of item.pictures)images.append(figure(id));
 const lesson=make("div");lesson.className="inst-lab-lesson";
 const prompt=make("p",item.prompt);
 const routeNote=make("p",route==="scouts"?item.scouts:item.pilots);routeNote.className="inst-lab-focus";
 const field=make("fieldset");field.className="inst-lab-questions";
 field.append(make("legend",item.question));
 for(const [index,option] of item.options.entries()){
  const label=make("label"),input=make("input");
  input.type="radio";input.name="inst-case-"+item.id;input.value=String(index);
  input.checked=choices.get(item.id)?.choice===index;
  label.append(input,make("span",option));field.append(label);
 }
 const check=make("button","Check instrument reasoning");check.type="button";check.className="inst-lab-check";
 const answer=make("div");answer.className="inst-lab-feedback";
 answer.setAttribute("role","status");answer.setAttribute("aria-live","polite");
 const old=choices.get(item.id);
 if(old)feedback(answer,old.result);
 else answer.textContent="Read the original picture, select an answer and then view the explanation.";
 check.addEventListener("click",()=>{
  const selection=field.querySelector('input[type="radio"]:checked');
  if(!selection){answer.textContent="Choose a response before checking.";return}
  const choice=Number(selection.value),result=model.evaluate(item.id,choice);
  choices.set(item.id,{choice,result});feedback(answer,result);update();
 });
 lesson.append(prompt,routeNote,field,check,answer);
 layout.append(images,lesson);body.append(h,layout);
 if(item.id==="pressure")body.append(sensorLab());
 prev.disabled=active===0;next.disabled=active===model.cases.length-1;update();
}
function update(){
 progress.textContent=(active+1)+" of "+model.cases.length+" instrument exercises · "+choices.size+" decisions reviewed this visit (ungraded)";
}
function display(moduleId,path){
 host.hidden=moduleId!=="instruments";
 if(host.hidden){if(zoom.open)zoom.close();return}
 route=path==="pilots"?"pilots":"scouts";
 focus.textContent=route==="scouts"?
  "Scouts & Air Scouts: identify each instrument's basic purpose and discuss the pictures with your adult instructor.":
  "Enthusiasts & aspiring pilots: connect each displayed value to its underlying sensor or reference and distinguish indications from operational authority.";
 render();
}
document.addEventListener("agsa:coursebook-module",e=>display(e.detail?.moduleId,e.detail?.route));
document.addEventListener("DOMContentLoaded",()=>{
 const query=new URL(location.href).searchParams;
 const title=document.getElementById("moduleTitle")?.textContent||"";
 display(/flight instruments and electronic displays/i.test(title)?"instruments":query.get("module")||"aircraft",
  document.getElementById("route")?.value);
});
})(window);
