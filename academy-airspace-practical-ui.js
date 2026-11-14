/* Course 08: accessible pictorial learning with fictional airport and airspace.
 * Does not access devices, map services, GPS or live aviation information. */
(function(root){"use strict";
const model=root.AGSAirspaceAirportPractical,atlas=root.AGSAOriginalPictureAtlas;
const host=document.getElementById("airspacePracticalLab");
if(!model||!atlas||!host)return;
model.validate(atlas);
const el=(tag,value)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=value;return node};
let current=0,route="scouts";const answers=new Map(),pictures=new Map();
const header=el("header");header.className="as-lab-header";
const kicker=el("p","COURSE 08 · PICTURE-LED AIRSPACE & AERODROMES");kicker.className="as-lab-kicker";
const title=el("h3","Understand boundaries, surfaces, markings and authority");title.id="airspaceLabTitle";
const introduction=el("p","Use the original Academy illustrations, then explore clearly fictional airspace and airport drawings. Learn what to verify before relying on any real publication.");
const pathway=el("p");pathway.className="as-lab-pathway";header.append(kicker,title,introduction,pathway);
const progress=el("p");progress.className="as-lab-progress";progress.setAttribute("role","status");progress.setAttribute("aria-live","polite");
const reading=el("div");reading.className="as-lab-reading";
const controls=el("nav");controls.className="as-lab-nav";controls.setAttribute("aria-label","Airspace and airport practical navigation");
const previous=el("button","Previous topic"),next=el("button","Next topic");
previous.type=next.type="button";
previous.addEventListener("click",()=>{if(current>0){current--;render()}});
next.addEventListener("click",()=>{if(current<model.cases.length-1){current++;render()}});
controls.append(previous,next);
const footer=el("p","All maps, airspace boundaries, runway labels, signs and situations shown here are invented educational examples. No airport clearance, licence, current NOTAM, airspace authorisation or usable operating instruction is issued. No course notes are downloaded.");
footer.className="as-lab-foot";
host.append(header,progress,reading,controls,footer);
const zoom=el("dialog");zoom.className="as-lab-zoom";zoom.setAttribute("aria-label","Enlarged owner-approved illustration");
const zoomHeading=el("h3"),zoomCanvas=el("canvas"),close=el("button","Close picture");
close.type="button";close.addEventListener("click",()=>zoom.close());
zoom.addEventListener("click",e=>{if(e.target===zoom)zoom.close()});
zoom.append(zoomHeading,zoomCanvas,close);document.body.append(zoom);
function image(src){
 if(!pictures.has(src)){
  const img=new Image();img.decoding="async";
  pictures.set(src,new Promise((resolve,reject)=>{
   img.onload=()=>resolve(img);img.onerror=()=>reject(Error("Approved picture not available"));img.src=src;
  }));
 }
 return pictures.get(src);
}
async function drawCrop(canvas,asset,scale=1){
 const [x,y,w,h]=asset.rect;canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
 canvas.setAttribute("role","img");canvas.setAttribute("aria-label",asset.alt);
 try{
  const picture=await image(asset.src),ctx=canvas.getContext("2d");
  if(ctx){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(picture,x,y,w,h,0,0,canvas.width,canvas.height)}
 }catch{canvas.setAttribute("aria-label","Owner-approved teaching image unavailable")}
}
function original(id){
 const asset=atlas.getById(id),figure=el("figure");figure.className="as-lab-figure";
 const button=el("button");button.type="button";button.className="as-lab-picture-button";
 button.setAttribute("aria-label","Enlarge approved Academy illustration: "+asset.title);
 const canvas=el("canvas");canvas.className="as-lab-picture";void drawCrop(canvas,asset);
 const label=el("span","Tap to enlarge");label.className="as-lab-enlarge";
 button.append(canvas,label);
 button.addEventListener("click",()=>{
  zoomHeading.textContent=asset.title;
  void drawCrop(zoomCanvas,asset,Math.min(2.2,1150/asset.rect[2]));
  if(!zoom.open)zoom.showModal();close.focus();
 });
 figure.append(button,el("figcaption",asset.title));return figure;
}
function feedback(target,outcome){
 target.replaceChildren();target.dataset.correct=String(outcome.correct);
 target.append(el("strong",outcome.correct?"Correct distinction.":"Review this airspace or airport principle."),
  el("p","Recommended response: "+outcome.expected),el("p",outcome.explanation));
 const details=el("details");details.className="as-lab-key";
 const definitions=el("dl");
 for(const [term,meaning] of outcome.key)definitions.append(el("dt",term),el("dd",meaning));
 details.append(el("summary","Open the labelled concept key"),definitions);target.append(details);
}
function detailButtons(group,parts,selected,output,buttons){
 const renderPart=id=>{
  const info=model.part(group,id);
  output.replaceChildren(el("strong",info.title),el("p",info.definition));
  output.dataset.selected=id;
  for(const b of buttons.children)b.setAttribute("aria-pressed",String(b.dataset.part===id));
 };
 for(const p of parts){
  const b=el("button",p.title);b.type="button";b.dataset.part=p.id;
  b.addEventListener("click",()=>renderPart(p.id));buttons.append(b);
 }
 renderPart(selected);
}
function boundaryDiagram(){
 const section=el("section");section.className="as-lab-diagram";
 const h=el("h5","Fictional airspace — two dimensions matter");
 const note=el("p","This coloured cross-section shows a made-up zone only. Select a concept to see what published information a real area requires.");
 const sketch=el("div");sketch.className="as-lab-airspace-cross";sketch.setAttribute("role","img");
 sketch.setAttribute("aria-label","Classroom cross section: a fictional airspace area with upper and lower limits plus a horizontal footprint; not geographic or to scale");
 sketch.append(el("div","Upper limit · fictional"),el("div","Defined airspace volume"),el("div","Lower limit · fictional"));
 const parts=el("div");parts.className="as-lab-diagram-buttons";
 const output=el("div");output.className="as-lab-diagram-info";output.setAttribute("role","status");output.setAttribute("aria-live","polite");
 detailButtons("airspace",model.airspaceParts,"lateral",output,parts);
 const caution=el("p","A vertical drawing cannot show the area’s real boundaries, datum, activation, clearance requirements or current restrictions.");caution.className="as-lab-caution";
 section.append(h,note,sketch,parts,output,caution);return section;
}
function airportDiagram(){
 const section=el("section");section.className="as-lab-diagram";
 section.append(el("h5","Invented airport diagram — identify surfaces and holding position"),
  el("p","No airport is represented. Select the labelled parts to distinguish the apron, taxiway, hold boundary and runway."));
 const sketch=el("div");sketch.className="as-lab-airport-map";sketch.setAttribute("role","img");
 sketch.setAttribute("aria-label","Fictional top-down airport diagram: runway 09/27, connecting Taxiway A, apron and hold line. Not to scale and not an aeronautical chart.");
 const badge=el("span","FICTIONAL · NOT TO SCALE");badge.className="as-lab-map-stamp";
 const runway=el("div");runway.className="as-lab-map-runway";
 runway.append(el("b","09"),el("span","RUNWAY"),el("b","27"));
 const taxiway=el("div","TAXIWAY A");taxiway.className="as-lab-map-taxiway";
 const hold=el("div","HOLD");hold.className="as-lab-map-hold";
 const apron=el("div","APRON");apron.className="as-lab-map-apron";
 sketch.append(badge,runway,taxiway,hold,apron);
 const buttons=el("div");buttons.className="as-lab-diagram-buttons";
 const info=el("div");info.className="as-lab-diagram-info";
 info.setAttribute("role","status");info.setAttribute("aria-live","polite");
 detailButtons("airport",model.airportParts,"hold",info,buttons);
 const warning=el("p","A holding position marks a protective boundary, not permission to enter the runway. Always use the applicable actual airport chart and authorised instructions.");warning.className="as-lab-caution";
 section.append(sketch,buttons,info,warning);return section;
}
function runwayPractice(){
 const section=el("section");section.className="as-lab-diagram";
 section.append(el("h5","Runway number comparison — classroom convention"),
  el("p","Select a nominal magnetic runway designation and see the opposite end. This is not a real aerodrome lookup."));
 const label=el("label","Runway designation");
 const select=el("select");select.id="asRunwayNumber";label.htmlFor=select.id;
 for(const number of [9,18,27,36]){
  const code=String(number).padStart(2,"0");const option=el("option","Runway "+code);
  option.value=String(number);select.append(option);
 }
 select.value="9";
 const readout=el("div");readout.className="as-lab-runway-readout";
 readout.setAttribute("role","status");readout.setAttribute("aria-live","polite");
 const warning=el("p");warning.className="as-lab-caution";
 function update(){
  const data=model.runway(Number(select.value));
  readout.replaceChildren(el("span",data.number),el("strong","⇄"),el("span",data.reciprocal));
  warning.textContent="Nominal direction "+String(data.nominalMagnetic).padStart(3,"0")+"° magnetic. "+data.note;
 }
 select.addEventListener("change",update);
 section.append(label,select,readout,warning);update();return section;
}
function render(){
 const item=model.cases[current];reading.replaceChildren();
 const title=el("h4",String(item.number).padStart(2,"0")+" · "+item.title);
 const layout=el("div");layout.className="as-lab-grid";
 const gallery=el("div");gallery.className="as-lab-gallery";
 for(const id of item.pictures)gallery.append(original(id));
 const lesson=el("div");lesson.className="as-lab-lesson";
 const situation=el("p",item.situation);
 const routeNote=el("p",route==="scouts"?item.scouts:item.pilots);routeNote.className="as-lab-pathway";
 const fieldset=el("fieldset");fieldset.className="as-lab-questions";
 fieldset.append(el("legend",item.question));
 for(const [index,answer] of item.options.entries()){
  const label=el("label"),input=el("input");
  input.type="radio";input.name="as-choice-"+item.id;input.value=String(index);
  input.checked=answers.get(item.id)?.index===index;
  label.append(input,el("span",answer));fieldset.append(label);
 }
 const check=el("button","Check my understanding");check.type="button";check.className="as-lab-check";
 const result=el("div");result.className="as-lab-feedback";
 result.setAttribute("role","status");result.setAttribute("aria-live","polite");
 const prior=answers.get(item.id);
 if(prior)feedback(result,prior.outcome);
 else result.textContent="Inspect the teaching picture and fictional case, select an answer and review its explanation.";
 check.addEventListener("click",()=>{
  const selected=fieldset.querySelector('input[type="radio"]:checked');
  if(!selected){result.textContent="Choose one response before checking.";return}
  const index=Number(selected.value),outcome=model.evaluate(item.id,index);
  answers.set(item.id,{index,outcome});feedback(result,outcome);updateProgress();
 });
 lesson.append(situation,routeNote,fieldset,check,result);layout.append(gallery,lesson);
 reading.append(title,layout);
 if(item.id==="boundaries")reading.append(boundaryDiagram());
 if(item.id==="aerodrome")reading.append(airportDiagram());
 if(item.id==="runways")reading.append(runwayPractice());
 previous.disabled=current===0;next.disabled=current===model.cases.length-1;
 updateProgress();
}
function updateProgress(){progress.textContent=(current+1)+" of "+model.cases.length+" picture exercises · "+answers.size+" reviewed on this page (ungraded)"}
function display(moduleId,newRoute){
 host.hidden=moduleId!=="airspace";
 if(host.hidden){if(zoom.open)zoom.close();return}
 route=newRoute==="pilots"?"pilots":"scouts";
 pathway.textContent=route==="scouts"?
  "Scouts & Air Scouts: use the invented diagrams with your adult instructor to identify boundaries, markings and safe reporting questions.":
  "Enthusiasts & aspiring pilots: distinguish State-published requirements, current aeronautical information and individual operating authorisations.";
 render();
}
document.addEventListener("agsa:coursebook-module",e=>display(e.detail?.moduleId,e.detail?.route));
document.addEventListener("DOMContentLoaded",()=>{
 const query=new URL(location.href).searchParams;
 const selected=document.getElementById("moduleTitle")?.textContent||"";
 display(/airspace, airports and aviation rules/i.test(selected)?"airspace":query.get("module")||"aircraft",
  document.getElementById("route")?.value);
});
})(window);
