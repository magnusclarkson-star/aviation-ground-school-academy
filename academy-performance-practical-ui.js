/* Course 10 — an optional, ungraded picture-led classroom lab.
 * No real aircraft loading figures or flight-performance data are provided. */
(function(root){"use strict";
const model=root.AGSAPerformancePractical,atlas=root.AGSAOriginalPictureAtlas;
const host=document.getElementById("performancePracticalLab");
if(!model||!atlas||!host)return;
model.validate(atlas);
const el=(tag,value)=>{const x=document.createElement(tag);if(value!==undefined)x.textContent=value;return x};
let active=0,route="scouts";const responses=new Map(),pictures=new Map();
const heading=el("header");heading.className="perf-lab-heading";
const kicker=el("p","COURSE 10 · ILLUSTRATED WEIGHT, BALANCE & PERFORMANCE");kicker.className="perf-lab-kicker";
const title=el("h3","Explore loading, centre of gravity and performance variables");title.id="performanceLabTitle";
const intro=el("p","Study the Academy's original illustrated lessons, then move fictional loads and compare qualitative conditions. No numbers represent a Cessna, R44 or another real aircraft.");
const focus=el("p");focus.className="perf-lab-focus";heading.append(kicker,title,intro,focus);
const progress=el("p");progress.className="perf-lab-progress";progress.setAttribute("role","status");progress.setAttribute("aria-live","polite");
const reading=el("div");reading.className="perf-lab-reading";
const nav=el("nav");nav.className="perf-lab-nav";nav.setAttribute("aria-label","Weight and performance exercise navigation");
const previous=el("button","Previous performance exercise"),next=el("button","Next performance exercise");
previous.type=next.type="button";
previous.addEventListener("click",()=>{if(active>0){active--;render()}});
next.addEventListener("click",()=>{if(active<model.cases.length-1){active++;render()}});
nav.append(previous,next);
const foot=el("p","All example masses, loading locations, CG markers and performance comparisons are invented. No approved aircraft mass limits, CG envelope, runway distance, flight clearance or operating instruction is given. Lesson notes and calculations remain in this app view.");
foot.className="perf-lab-foot";
host.append(heading,progress,reading,nav,foot);
const zoom=el("dialog");zoom.className="perf-lab-dialog";zoom.setAttribute("aria-label","Enlarged original Academy performance illustration");
const zoomHeading=el("h3"),zoomCanvas=el("canvas"),close=el("button","Close picture");
close.type="button";close.addEventListener("click",()=>zoom.close());
zoom.addEventListener("click",e=>{if(e.target===zoom)zoom.close()});
zoom.append(zoomHeading,zoomCanvas,close);document.body.append(zoom);
function loadImage(src){
 if(!pictures.has(src)){
  const image=new Image();image.decoding="async";
  pictures.set(src,new Promise((resolve,reject)=>{
   image.onload=()=>resolve(image);
   image.onerror=()=>reject(Error("Original performance picture unavailable"));
   image.src=src;
  }));
 }
 return pictures.get(src);
}
async function drawImage(canvas,asset,scale=1){
 const [x,y,w,h]=asset.rect;
 canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
 canvas.setAttribute("role","img");canvas.setAttribute("aria-label",asset.alt);
 try{
  const pic=await loadImage(asset.src),ctx=canvas.getContext("2d");
  if(ctx){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(pic,x,y,w,h,0,0,canvas.width,canvas.height)}
 }catch{canvas.setAttribute("aria-label","Original approved teaching picture unavailable")}
}
function original(id){
 const asset=atlas.getById(id),figure=el("figure");figure.className="perf-lab-figure";
 const button=el("button");button.type="button";button.className="perf-lab-picture-button";
 button.setAttribute("aria-label","Enlarge original Academy performance illustration: "+asset.title);
 const canvas=el("canvas");canvas.className="perf-lab-picture";void drawImage(canvas,asset);
 const cue=el("span","Tap to enlarge");cue.className="perf-lab-enlarge";
 button.append(canvas,cue);button.addEventListener("click",()=>{
  zoomHeading.textContent=asset.title;
  void drawImage(zoomCanvas,asset,Math.min(2.3,1150/asset.rect[2]));
  if(!zoom.open)zoom.showModal();close.focus();
 });
 figure.append(button,el("figcaption",asset.title));return figure;
}
function feedback(holder,outcome){
 holder.replaceChildren();holder.dataset.correct=String(outcome.correct);
 holder.append(el("strong",outcome.correct?"Correct loading and performance concept.":"Review this loading or performance distinction."),
  el("p","Recommended: "+outcome.expected),el("p",outcome.explanation));
 const details=el("details");details.className="perf-lab-key";
 const dl=el("dl");
 for(const [term,definition] of outcome.key)dl.append(el("dt",term),el("dd",definition));
 details.append(el("summary","Open the performance terminology"),dl);holder.append(details);
}
function drawBeam(canvas,result){
 const ctx=canvas.getContext("2d");if(!ctx)return;
 const width=760,height=216;canvas.width=width;canvas.height=height;
 ctx.fillStyle="#102e43";ctx.fillRect(0,0,width,height);
 ctx.strokeStyle="#366074";ctx.lineWidth=1;
 for(let x=45;x<width;x+=42){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke()}
 ctx.fillStyle="#f5e2b6";ctx.font="bold 17px system-ui";ctx.fillText("FICTIONAL MASS–ARM BEAM · NOT AN AIRCRAFT",20,28);
 const left=90,right=695;
 function xAt(arm){return left+(arm/3)* (right-left)}
 ctx.strokeStyle="#9cbece";ctx.lineWidth=8;ctx.lineCap="round";
 ctx.beginPath();ctx.moveTo(left,124);ctx.lineTo(right,124);ctx.stroke();
 const min=xAt(model.FICTIONAL.cgMinM),max=xAt(model.FICTIONAL.cgMaxM);
 ctx.fillStyle="#1b6c62";ctx.fillRect(min,112,max-min,24);
 ctx.fillStyle="#d7f8ee";ctx.font="bold 12px system-ui";ctx.fillText("Invented CG band",min,103);
 for(const [index,station] of result.stations.entries()){
  const x=xAt(station.armM),shade=["#86d9ed","#eec17f","#a6f1c0"][index];
  ctx.fillStyle=shade;ctx.strokeStyle=shade;ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x,118);ctx.lineTo(x,62);ctx.stroke();
  ctx.fillRect(x-24,43,48,20);
  ctx.fillStyle="#f5fbff";ctx.font="bold 12px system-ui";
  ctx.fillText(station.massKg+" kg",x-22,36);
 }
 const cx=xAt(result.cgM);
 ctx.fillStyle="#ffe29b";ctx.beginPath();ctx.moveTo(cx,132);ctx.lineTo(cx-10,152);ctx.lineTo(cx+10,152);ctx.closePath();ctx.fill();
 ctx.fillStyle="#ffe7b9";ctx.font="bold 15px system-ui";ctx.fillText("CG "+result.cgM.toFixed(3)+" m",Math.max(25,Math.min(590,cx-35)),177);
 ctx.fillStyle="#e4f3fc";ctx.font="13px system-ui";ctx.fillText("Datum 0 m",35,198);
 ctx.fillText("Arms increase → (not to scale)",465,198);
 canvas.setAttribute("role","img");
 canvas.setAttribute("aria-label","Classroom beam with fictional base load 300 kg at arm 1.2 m, front load 50 kg at arm 1.5 m, rear load "+result.aftMassKg+" kg at arm 2.6 m, and computed CG "+result.cgM.toFixed(3)+" m. Invented CG band 1.10 to 1.50 m.");
}
function loadingLab(){
 const section=el("section");section.className="perf-lab-calculation";
 section.append(el("h5","Move the fictional rear load — mass and balance are separate checks"),
  el("p","A completely invented beam carries 300 kg at 1.20 m and 50 kg at 1.50 m. Change the rear load at 2.60 m. Compare calculated moments, total mass and the purely fictional CG band."));
 const label=el("label","Rear classroom load: "),value=el("strong","25 kg");
 const slider=el("input");slider.id="perfRearLoad";slider.type="range";slider.min="0";slider.max="150";slider.step="25";slider.value="25";
 slider.setAttribute("aria-label","Fictional rear load, 0 to 150 kilograms");
 label.htmlFor=slider.id;label.append(value);
 const canvas=el("canvas");canvas.className="perf-lab-beam";
 const table=el("table");table.className="perf-lab-moment-table";
 const caption=el("caption","Invented station mass × arm calculations");
 const head=el("thead"),headerRow=el("tr");
 for(const term of ["Fictional station","Mass (kg)","Arm (m)","Moment (kg·m)"])headerRow.append(el("th",term));
 head.append(headerRow);const tbody=el("tbody");table.append(caption,head,tbody);
 const readout=el("div");readout.className="perf-lab-results";readout.setAttribute("role","status");readout.setAttribute("aria-live","polite");
 const total=el("p"),cg=el("p"),massCheck=el("p"),cgCheck=el("p");
 total.className="perf-lab-total";cg.className="perf-lab-cg";massCheck.className="perf-lab-mass-check";cgCheck.className="perf-lab-cg-check";
 readout.append(total,cg,massCheck,cgCheck);
 const caution=el("p");caution.className="perf-lab-caution";
 function update(){
  const result=model.loading(Number(slider.value));value.textContent=result.aftMassKg+" kg";
  tbody.replaceChildren();
  for(const item of result.stations){
   const row=el("tr");
   for(const x of [item.label,item.massKg.toFixed(0),item.armM.toFixed(2),item.momentKgM.toFixed(1)])row.append(el("td",x));
   tbody.append(row);
  }
  const row=el("tr");row.className="perf-lab-table-total";
  for(const x of ["Total",String(result.totalMassKg),"—",result.totalMomentKgM.toFixed(1)])row.append(el("td",x));
  tbody.append(row);
  total.textContent="Total: "+result.totalMassKg+" kg · "+result.totalMomentKgM.toFixed(1)+" kg·m";
  cg.textContent="Computed CG: "+result.cgM.toFixed(3)+" m";
  massCheck.textContent="Fictional mass check: "+(result.withinMass?"within 475 kg example maximum":"outside 475 kg example maximum");
  cgCheck.textContent="Fictional CG check: "+(result.withinCg?"within 1.10–1.50 m teaching band":"outside 1.10–1.50 m teaching band");
  massCheck.dataset.within=String(result.withinMass);cgCheck.dataset.within=String(result.withinCg);
  caution.textContent=result.note;drawBeam(canvas,result);
 }
 slider.addEventListener("input",update);
 section.append(label,slider,canvas,table,readout,caution);update();return section;
}
function conditionsLab(){
 const section=el("section");section.className="perf-lab-conditions";
 section.append(el("h5","Explore qualitative runway-performance influences"),
  el("p","Tap each classroom factor to compare two general conditions. No runway metres or takeoff/landing clearance can be inferred."));
 const cards=el("div");cards.className="perf-lab-condition-grid";
 for(const [name,data] of Object.entries(model.CONDITIONS)){
  const card=el("div");card.className="perf-lab-condition";
  const heading=el("strong",name==="density"?"Density altitude":name==="surface"?"Runway condition":name==="mass"?"Loading":"Wind component");
  const button=el("button","Compare conditions");button.type="button";button.dataset.factor=name;button.setAttribute("aria-pressed","false");
  const state=el("p");state.className="perf-lab-condition-state";
  const meaning=el("p");meaning.className="perf-lab-condition-effect";
  const update=adverse=>{
   const result=model.condition(name,adverse);
   button.setAttribute("aria-pressed",String(adverse));button.textContent=adverse?"Return to baseline":"Compare conditions";
   state.textContent=result.label;meaning.textContent=adverse?result.effect:"Baseline comparison only. No numerical performance claim.";
  };
  button.addEventListener("click",()=>update(button.getAttribute("aria-pressed")!=="true"));
  card.append(heading,state,button,meaning);cards.append(card);update(false);
 }
 const warning=el("p","These are conditional, qualitative teaching comparisons—not validated aircraft-specific runway performance, stopping distance, terrain clearance or margin calculations. Use authoritative aircraft and aerodrome data for real operations.");
 warning.className="perf-lab-caution";
 section.append(cards,warning);return section;
}
function render(){
 const item=model.cases[active];reading.replaceChildren();
 const title=el("h4",String(item.number).padStart(2,"0")+" · "+item.title);
 const grid=el("div");grid.className="perf-lab-grid";
 const gallery=el("div");gallery.className="perf-lab-gallery";
 for(const id of item.pictures)gallery.append(original(id));
 const lesson=el("div");lesson.className="perf-lab-lesson";
 const situation=el("p",item.situation);
 const routeText=el("p",route==="scouts"?item.scouts:item.pilots);routeText.className="perf-lab-focus";
 const choices=el("fieldset");choices.className="perf-lab-options";choices.append(el("legend",item.question));
 for(const [index,answer] of item.options.entries()){
  const label=el("label"),input=el("input");input.type="radio";input.name="perf-"+item.id;input.value=String(index);
  input.checked=responses.get(item.id)?.choice===index;
  label.append(input,el("span",answer));choices.append(label);
 }
 const check=el("button","Check performance concept");check.type="button";check.className="perf-lab-check";
 const result=el("div");result.className="perf-lab-feedback";result.setAttribute("role","status");result.setAttribute("aria-live","polite");
 const saved=responses.get(item.id);
 if(saved)feedback(result,saved.answer);
 else result.textContent="Inspect the original picture, select a response and review its explanation.";
 check.addEventListener("click",()=>{
  const selected=choices.querySelector('input[type="radio"]:checked');
  if(!selected){result.textContent="Choose one response before checking.";return}
  const choice=Number(selected.value),answer=model.evaluate(item.id,choice);
  responses.set(item.id,{choice,answer});feedback(result,answer);updateProgress();
 });
 lesson.append(situation,routeText,choices,check,result);grid.append(gallery,lesson);
 reading.append(title,grid);
 if(item.id==="moments"||item.id==="envelope")reading.append(loadingLab());
 if(item.id==="conditions")reading.append(conditionsLab());
 previous.disabled=active===0;next.disabled=active===model.cases.length-1;
 updateProgress();
}
function updateProgress(){
 progress.textContent=(active+1)+" of "+model.cases.length+" illustrated exercises · "+responses.size+" reviewed this visit (ungraded)";
}
function display(id,path){
 host.hidden=id!=="performance";
 if(host.hidden){if(zoom.open)zoom.close();return}
 route=path==="pilots"?"pilots":"scouts";
 focus.textContent=route==="scouts"?
  "Scouts & Air Scouts: compare the fictional loads and safety questions with an adult instructor.":
  "Enthusiasts & aspiring pilots: relate mass and moment arithmetic to the separate requirement for approved aircraft-specific limits and performance charts.";
 render();
}
document.addEventListener("agsa:coursebook-module",e=>display(e.detail?.moduleId,e.detail?.route));
document.addEventListener("DOMContentLoaded",()=>{
 const query=new URL(location.href).searchParams;
 const name=document.getElementById("moduleTitle")?.textContent||"";
 display(/weight, balance and performance/i.test(name)?"performance":query.get("module")||"aircraft",
  document.getElementById("route")?.value);
});
})(window);
