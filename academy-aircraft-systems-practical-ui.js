/* Course 04 visual learning lab. Original Academy illustrations are cropped
 * only on the display canvas. No printable notes, file exports or real
 * maintenance/troubleshooting commands are present. */
(function(root){"use strict";
const model=root.AGSAAircraftSystemsPractical,atlas=root.AGSAOriginalPictureAtlas;
const host=document.getElementById("aircraftSystemsPracticalLab");
if(!model||!atlas||!host)return;
model.validate(atlas);
const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n};
let active=0,route="scouts";
const answers=new Map(),imageCache=new Map();
const heading=el("header");heading.className="systems-lab-head";
const kicker=el("p","COURSE 04 · ILLUSTRATED AIRCRAFT SYSTEMS");kicker.className="systems-lab-kicker";
const title=el("h3","Explore energy, fuel, electricity and hydraulics");title.id="aircraftSystemsLabTitle";
const intro=el("p","Study the original Academy pictures and inspect fictional block diagrams. Each exercise asks you to identify what a system does—not how to operate, repair or troubleshoot a real aircraft.");
const focus=el("p");focus.className="systems-lab-focus";
heading.append(kicker,title,intro,focus);
const progress=el("p");progress.className="systems-lab-progress";progress.setAttribute("role","status");progress.setAttribute("aria-live","polite");
const reading=el("div");reading.className="systems-lab-reading";
const nav=el("nav");nav.className="systems-lab-nav";nav.setAttribute("aria-label","Aircraft-systems concept navigation");
const previous=el("button","Previous system"),next=el("button","Next system");
previous.type=next.type="button";
previous.addEventListener("click",()=>{if(active>0){active--;render()}});
next.addEventListener("click",()=>{if(active<model.cases.length-1){active++;render()}});
nav.append(previous,next);
const notice=el("p","Conceptual classroom learning only. The fault examples are invented and do not identify any real aircraft condition. No aircraft-specific checklists, live maintenance instructions or official assessment credits are provided.");notice.className="systems-lab-notice";
host.append(heading,progress,reading,nav,notice);
const zoom=el("dialog");zoom.className="systems-lab-dialog";zoom.setAttribute("aria-label","Enlarged approved systems illustration");
const zoomHeading=el("h3"),zoomCanvas=el("canvas"),close=el("button","Close picture");
close.type="button";
close.addEventListener("click",()=>zoom.close());
zoom.addEventListener("click",e=>{if(e.target===zoom)zoom.close()});
zoom.append(zoomHeading,zoomCanvas,close);document.body.append(zoom);
function sourceImage(src){
 if(!imageCache.has(src)){
  const img=new Image();img.decoding="async";
  imageCache.set(src,new Promise((resolve,reject)=>{
   img.onload=()=>resolve(img);img.onerror=()=>reject(Error("Approved illustration unavailable"));img.src=src;
  }));
 }
 return imageCache.get(src);
}
async function draw(canvas,asset,scale=1){
 const [sx,sy,sw,sh]=asset.rect;
 canvas.width=Math.round(sw*scale);canvas.height=Math.round(sh*scale);
 canvas.setAttribute("role","img");canvas.setAttribute("aria-label",asset.alt);
 try{
  const image=await sourceImage(asset.src),ctx=canvas.getContext("2d");
  if(ctx){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(image,sx,sy,sw,sh,0,0,canvas.width,canvas.height)}
 }catch{canvas.setAttribute("aria-label","Original teaching illustration could not be loaded")}
}
function pictureCard(id){
 const asset=atlas.getById(id);
 const figure=el("figure");figure.className="systems-lab-figure";
 const button=el("button");button.type="button";button.className="systems-lab-picture-button";
 button.setAttribute("aria-label","Enlarge approved Academy systems picture: "+asset.title);
 const canvas=el("canvas");canvas.className="systems-lab-picture";void draw(canvas,asset);
 const cue=el("span","Tap to enlarge");cue.className="systems-lab-picture-cue";
 button.append(canvas,cue);
 button.addEventListener("click",()=>{
  zoomHeading.textContent=asset.title;
  void draw(zoomCanvas,asset,Math.min(2.2,1150/asset.rect[2]));
  if(!zoom.open)zoom.showModal();
  close.focus();
 });
 figure.append(button,el("figcaption",asset.title));return figure;
}
function showDiagram(target,mode){
 const data=model.diagram(mode);
 target.replaceChildren();
 const h=el("h5",data.title);
 const line=el("div");line.className="systems-lab-flow";line.setAttribute("role","group");
 line.setAttribute("aria-label",data.title+" conceptual flow");
 for(const [i,node] of data.nodes.entries()){
  if(i>0){const arrow=el("span","→");arrow.className="systems-lab-arrow";arrow.setAttribute("aria-hidden","true");line.append(arrow)}
  const box=el("div",node);box.className="systems-lab-node";line.append(box);
 }
 const caveat=el("p",data.note);caveat.className="systems-lab-diagram-note";
 target.append(h,line,caveat);
 target.dataset.diagram=mode;
}
function makeDiagram(id){
 const wrapper=el("section");wrapper.className="systems-lab-diagram";
 if(id==="fuel")showDiagram(wrapper,"fuel");
 else if(id==="hydraulic")showDiagram(wrapper,"hydraulic");
 else if(id==="electrical"){
  const title=el("h5","Compare two imaginary electrical layouts");
  const tabs=el("div");tabs.className="systems-lab-diagram-tabs";
  const shared=el("button","Shared bus"),separate=el("button","Separate paths");
  shared.type=separate.type="button";
  const graphic=el("div");graphic.className="systems-lab-diagram-result";
  const switchTo=mode=>{
   showDiagram(graphic,mode);
   shared.setAttribute("aria-pressed",String(mode==="electricalShared"));
   separate.setAttribute("aria-pressed",String(mode==="electricalSeparate"));
  };
  shared.addEventListener("click",()=>switchTo("electricalShared"));
  separate.addEventListener("click",()=>switchTo("electricalSeparate"));
  tabs.append(shared,separate);wrapper.append(title,tabs,graphic);
  switchTo("electricalShared");
 }else return null;
 return wrapper;
}
function answerResult(target,outcome){
 target.replaceChildren();target.dataset.correct=String(outcome.correct);
 const h=el("strong",outcome.correct?"Correct systems concept.":"Review the system function.");
 const a=el("p","Recommended answer: "+outcome.answer),why=el("p",outcome.explanation);
 const details=el("details");details.className="systems-lab-key";
 const summary=el("summary","Open illustrated-systems vocabulary");
 const dl=el("dl");
 for(const [term,description] of outcome.key)dl.append(el("dt",term),el("dd",description));
 details.append(summary,dl);target.append(h,a,why,details);
}
function render(){
 const item=model.cases[active];
 reading.replaceChildren();
 const h=el("h4",String(item.number).padStart(2,"0")+" · "+item.title);
 const columns=el("div");columns.className="systems-lab-grid";
 const gallery=el("div");gallery.className="systems-lab-gallery";
 for(const id of item.pictures)gallery.append(pictureCard(id));
 const panel=el("div");panel.className="systems-lab-panel";
 const obs=el("p",item.observation);
 const pathText=el("p",route==="scouts"?item.scouts:item.pilots);pathText.className="systems-lab-focus";
 const options=el("fieldset");options.className="systems-lab-options";
 options.append(el("legend",item.question));
 for(const [i,option] of item.options.entries()){
  const label=el("label"),radio=el("input"),text=el("span",option);
  radio.type="radio";radio.name="systems-"+item.id;radio.value=String(i);
  radio.checked=answers.get(item.id)?.selected===i;
  label.append(radio,text);options.append(label);
 }
 const check=el("button","Check system concept");check.type="button";check.className="systems-lab-check";
 const feedback=el("div");feedback.className="systems-lab-feedback";
 feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
 const prior=answers.get(item.id);
 if(prior)answerResult(feedback,prior.outcome);
 else feedback.textContent="Examine the original picture, then select a response and explain your reasoning.";
 check.addEventListener("click",()=>{
  const choice=options.querySelector('input[type="radio"]:checked');
  if(!choice){feedback.textContent="Select a response before checking.";return}
  const selected=Number(choice.value),outcome=model.evaluate(item.id,selected);
  answers.set(item.id,{selected,outcome});answerResult(feedback,outcome);updateProgress();
 });
 panel.append(obs,pathText,options,check,feedback);
 columns.append(gallery,panel);reading.append(h,columns);
 const diagram=makeDiagram(item.id);
 if(diagram)reading.append(diagram);
 previous.disabled=active===0;next.disabled=active===model.cases.length-1;
 updateProgress();
}
function updateProgress(){
 progress.textContent=(active+1)+" of "+model.cases.length+" illustrated system exercises · "+answers.size+" checked on this page (ungraded)";
}
function display(moduleId,path){
 host.hidden=moduleId!=="systems";
 if(host.hidden){if(zoom.open)zoom.close();return}
 route=path==="pilots"?"pilots":"scouts";
 focus.textContent=route==="scouts"?
  "Scouts & Air Scouts: follow the picture arrows and discuss system functions with your appointed adult leader.":
  "Enthusiasts & aspiring pilots: distinguish conceptual architecture, observed indications and approved type-specific operating information.";
 render();
}
document.addEventListener("agsa:coursebook-module",e=>display(e.detail?.moduleId,e.detail?.route));
document.addEventListener("DOMContentLoaded",()=>{
 const params=new URL(location.href).searchParams;
 const name=document.getElementById("moduleTitle")?.textContent||"";
 display(/powerplants and aircraft systems/i.test(name)?"systems":params.get("module")||"aircraft",
  document.getElementById("route")?.value);
});
})(window);
