/* Course 12: compact original-picture rotorcraft exercises; no simulator/model writes. */
(function(root){"use strict";
const model=root.AGSARotorcraftPractical,atlas=root.AGSAOriginalPictureAtlas;
const host=document.getElementById("rotorcraftPracticalLab");
if(!host||!model||!atlas)return;
model.validate(atlas);
const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n};
let active=0,route="scouts";
const answers=new Map(),imageCache=new Map();
const header=el("header");header.className="rotor-lab-header";
const kicker=el("p","COURSE 12 · HELICOPTER FUNDAMENTALS");kicker.className="rotor-lab-kicker";
const title=el("h3","Explore helicopter controls and the R44");title.id="rotorcraftLabTitle";
const intro=el("p","Four compact picture exercises using the Academy's approved helicopter teaching sheets. Tap to enlarge; explore the cards and check each idea.");
const audience=el("p");audience.className="rotor-lab-focus";
header.append(kicker,title,intro,audience);
const progress=el("p");progress.className="rotor-lab-progress";progress.setAttribute("role","status");progress.setAttribute("aria-live","polite");
const reading=el("div");reading.className="rotor-lab-reading";
const nav=el("nav");nav.className="rotor-lab-nav";nav.setAttribute("aria-label","Rotorcraft exercise navigation");
const prev=el("button","Previous exercise"),next=el("button","Next exercise");
prev.type=next.type="button";prev.addEventListener("click",()=>{if(active>0){active--;render()}});
next.addEventListener("click",()=>{if(active<model.cases.length-1){active++;render()}});
nav.append(prev,next);
const foot=el("p","Illustrated self-study only · not a control procedure, aircraft-specific calculation, formal assessment or flight qualification. No learning answers are uploaded or saved.");
foot.className="rotor-lab-foot";
const refs=el("p");refs.className="rotor-lab-references";
const docLink=el("a","Robinson current R44 publications");docLink.href="https://www.robinsonheli.com/publications";docLink.target="_blank";docLink.rel="noopener noreferrer";
const faaLink=el("a","FAA Helicopter Flying Handbook");faaLink.href="https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook";faaLink.target="_blank";faaLink.rel="noopener noreferrer";
refs.append(docLink,el("span"," · "),faaLink);
host.append(header,progress,reading,nav,foot,refs);
const dialog=el("dialog");dialog.className="rotor-lab-dialog";dialog.setAttribute("aria-label","Enlarged original helicopter teaching picture");
const dlgHeading=el("h3"),dlgCanvas=el("canvas"),dlgClose=el("button","Close picture");
dlgClose.type="button";dlgClose.addEventListener("click",closeDialog);
dialog.addEventListener("click",e=>{if(e.target===dialog)closeDialog()});
dialog.append(dlgHeading,dlgCanvas,dlgClose);document.body.append(dialog);
function closeDialog(){if(typeof dialog.close==="function"&&dialog.open)dialog.close();else dialog.removeAttribute("open")}
function imageFor(src){
 if(!imageCache.has(src)){
  const image=new Image();image.decoding="async";
  const promise=new Promise((resolve,reject)=>{
   image.onload=()=>resolve(image);image.onerror=()=>reject(Error("Original picture unavailable"));image.src=src;
  });
  imageCache.set(src,promise);
 }
 return imageCache.get(src);
}
async function paint(canvas,asset,scale=1){
 const [x,y,w,h]=asset.rect;
 canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
 canvas.setAttribute("role","img");canvas.setAttribute("aria-label",asset.alt);
 try{
  const image=await imageFor(asset.src),ctx=canvas.getContext("2d");
  if(ctx){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(image,x,y,w,h,0,0,canvas.width,canvas.height)}
 }catch{canvas.setAttribute("aria-label","Original helicopter picture could not be loaded")}
}
function figure(id){
 const asset=atlas.getById(id),fig=el("figure");fig.className="rotor-lab-figure";
 const open=el("button");open.type="button";open.className="rotor-lab-picture-button";
 open.setAttribute("aria-label","Enlarge: "+asset.title);
 const picture=el("canvas");picture.className="rotor-lab-picture";void paint(picture,asset);
 const cue=el("span","Tap to enlarge");cue.className="rotor-lab-picture-cue";
 open.append(picture,cue);
 open.addEventListener("click",()=>{
  dlgHeading.textContent=asset.title;
  void paint(dlgCanvas,asset,Math.min(2.5,1120/asset.rect[2]));
  if(typeof dialog.showModal==="function"){if(!dialog.open)dialog.showModal()}else dialog.setAttribute("open","");
  dlgClose.focus();
 });
 fig.append(open,el("figcaption",asset.title));return fig;
}
function detailCards(title,description,items,lookup){
 const section=el("section");section.className="rotor-lab-activity";
 section.append(el("h5",title),el("p",description));
 const buttons=el("div");buttons.className="rotor-lab-options";
 const output=el("div");output.className="rotor-lab-explorer";output.setAttribute("role","status");output.setAttribute("aria-live","polite");
 let selected=items[0].id;
 function display(){
  const item=lookup(selected);
  output.replaceChildren(el("strong",item.label));
  if(item.relative)output.append(el("p",item.relative));
  output.append(el("p",item.effect||item.cue));
  if(item.effect&&item.cue)output.append(el("p",item.cue));
  if(item.url){const link=el("a","Open manufacturer's publications");link.href=item.url;link.target="_blank";link.rel="noopener noreferrer";output.append(link)}
  Array.from(buttons.children).forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.id===selected)));
 }
 for(const item of items){
  const b=el("button",item.label);b.type="button";b.dataset.id=item.id;
  b.setAttribute("aria-pressed","false");
  b.addEventListener("click",()=>{selected=item.id;display()});buttons.append(b);
 }
 section.append(buttons,output);display();return section;
}
function activityFor(id){
 if(id==="controls")return detailCards("Touch the control to learn its role",
  "Explore concepts only. These buttons do not move the helicopter.",
  model.CONTROLS,model.control);
 if(id==="hover")return detailCards("What changes hover awareness?",
  "Select a factor and see why a stationary-looking helicopter still needs a full assessment.",
  model.HOVER_FACTORS,model.hover);
 if(id==="transition")return detailCards("Three flight conditions",
  "Compare the stages conceptually; no speed, power or handling targets are prescribed.",
  model.PHASES,model.phase);
 return detailCards("Where should a student look?",
  "Choose a source. Official operating data must come from the current applicable documents and instructor.",
  model.SOURCES,model.source);
}
function showOutcome(holder,outcome){
 holder.replaceChildren();
 holder.dataset.correct=String(outcome.correct);
 holder.append(el("strong",outcome.correct?"Concept recognised.":"Review the concept."),
  el("p","Recommended response: "+outcome.expected),
  el("p",outcome.explanation));
 const more=el("details");more.className="rotor-lab-terms";
 const dl=el("dl");
 for(const [term,definition] of outcome.key)dl.append(el("dt",term),el("dd",definition));
 more.append(el("summary","Review four key terms"),dl);holder.append(more);
}
function updateProgress(){progress.textContent=(active+1)+" of 4 picture exercises · "+answers.size+" reviewed this visit (ungraded)"}
function render(){
 const item=model.cases[active];reading.replaceChildren();
 reading.append(el("h4",String(item.number).padStart(2,"0")+" · "+item.title));
 const grid=el("div");grid.className="rotor-lab-grid";
 const gallery=el("div");gallery.className="rotor-lab-gallery";
 for(const id of item.pictures)gallery.append(figure(id));
 const lesson=el("div");lesson.className="rotor-lab-lesson";
 lesson.append(el("p",item.situation));
 const pathCue=el("p",route==="pilots"?item.pilots:item.scouts);pathCue.className="rotor-lab-path";lesson.append(pathCue);
 const field=el("fieldset");field.className="rotor-lab-choices";
 field.append(el("legend",item.question));
 for(let i=0;i<item.options.length;i++){
  const label=el("label"),input=el("input");input.type="radio";input.name="rotor-"+item.id;input.value=String(i);
  input.checked=answers.get(item.id)?.choice===i;
  label.append(input,el("span",item.options[i]));field.append(label);
 }
 const check=el("button","Check understanding");check.type="button";
 const result=el("div");result.className="rotor-lab-feedback";result.setAttribute("role","status");result.setAttribute("aria-live","polite");
 if(answers.has(item.id))showOutcome(result,answers.get(item.id).outcome);
 else result.textContent="Study the picture, select one answer and check the explanation.";
 check.addEventListener("click",()=>{
  const selected=field.querySelector('input[type="radio"]:checked');
  if(!selected){result.textContent="Choose one answer first.";return}
  const choice=Number(selected.value),outcome=model.evaluate(item.id,choice);
  answers.set(item.id,{choice,outcome});showOutcome(result,outcome);updateProgress();
 });
 lesson.append(field,check,result);grid.append(gallery,lesson);reading.append(grid,activityFor(item.id));
 prev.disabled=active===0;next.disabled=active===model.cases.length-1;updateProgress();
}
function display(moduleId,path){
 host.hidden=moduleId!=="rotorcraft";
 if(host.hidden){closeDialog();return}
 route=path==="pilots"?"pilots":"scouts";
 audience.textContent=route==="pilots"?
  "Aviation enthusiasts & aspiring pilots: learn system relationships and recognise when approved R44 documents are required.":
  "Scouts & Air Scouts: explore the pictures, identify controls, compare flight conditions and ask an instructor questions.";
 render();
}
document.addEventListener("agsa:coursebook-module",e=>display(e.detail?.moduleId,e.detail?.route));
document.addEventListener("DOMContentLoaded",()=>{
 const params=new URL(location.href).searchParams;
 const selected=params.get("module")||"aircraft";
 const label=document.getElementById("moduleTitle")?.textContent||"";
 display(/helicopter fundamentals and r44/i.test(label)?"rotorcraft":selected,document.getElementById("route")?.value);
});
})(window);
