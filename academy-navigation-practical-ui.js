/* Course 07 original-picture navigation. All routes, map coordinates, winds
 * and readings are fictional classroom models, never real flight planning. */
(function(root){"use strict";
const model=root.AGSANavigationPractical,atlas=root.AGSAOriginalPictureAtlas;
const host=document.getElementById("navigationPracticalLab");
if(!model||!atlas||!host)return;
model.validate(atlas);
const el=(tag,value)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=value;return node};
let current=0,route="scouts";
const responses=new Map(),pictureCache=new Map();
const header=el("header");header.className="nav-lab-header";
const kicker=el("p","COURSE 07 · PICTORIAL NAVIGATION & PLANNING");kicker.className="nav-lab-kicker";
const title=el("h3","Learn charts, wind drift and route estimates");title.id="navigationLabTitle";
const intro=el("p","Study the Academy's approved chart pictures, then use a deliberately fictional training route to compare heading, ground track, wind and elapsed time.");
const routeFocus=el("p");routeFocus.className="nav-lab-focus";
header.append(kicker,title,intro,routeFocus);
const progress=el("p");progress.className="nav-lab-progress";progress.setAttribute("role","status");progress.setAttribute("aria-live","polite");
const reading=el("div");reading.className="nav-lab-reading";
const nav=el("nav");nav.className="nav-lab-controls";nav.setAttribute("aria-label","Navigation lesson concepts");
const prev=el("button","Previous navigation concept"),next=el("button","Next navigation concept");
prev.type=next.type="button";
prev.addEventListener("click",()=>{if(current>0){current--;draw()}});
next.addEventListener("click",()=>{if(current<model.cases.length-1){current++;draw()}});
nav.append(prev,next);
const foot=el("p","Training map, wind and timing are invented. No real aeronautical chart, current airspace boundary, terrain clearance, fuel requirement, clearance or operational route is provided. Notes stay in the Academy.");
foot.className="nav-lab-foot";
host.append(header,progress,reading,nav,foot);
const zoom=el("dialog");zoom.className="nav-lab-zoom";zoom.setAttribute("aria-label","Enlarged approved Academy navigation illustration");
const zoomHeading=el("h3"),zoomCanvas=el("canvas"),close=el("button","Close picture");
close.type="button";close.addEventListener("click",()=>zoom.close());
zoom.addEventListener("click",e=>{if(e.target===zoom)zoom.close()});
zoom.append(zoomHeading,zoomCanvas,close);document.body.append(zoom);
function image(src){
 if(!pictureCache.has(src)){
  const pic=new Image();pic.decoding="async";
  pictureCache.set(src,new Promise((resolve,reject)=>{
   pic.onload=()=>resolve(pic);pic.onerror=()=>reject(Error("Approved original navigation picture unavailable"));pic.src=src;
  }));
 }
 return pictureCache.get(src);
}
async function drawPicture(canvas,asset,multiplier=1){
 const [sx,sy,sw,sh]=asset.rect;
 canvas.width=Math.round(sw*multiplier);canvas.height=Math.round(sh*multiplier);
 canvas.setAttribute("role","img");canvas.setAttribute("aria-label",asset.alt);
 try{
  const pic=await image(asset.src),ctx=canvas.getContext("2d");
  if(ctx){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(pic,sx,sy,sw,sh,0,0,canvas.width,canvas.height)}
 }catch{canvas.setAttribute("aria-label","Original navigation illustration unavailable")}
}
function picture(id){
 const asset=atlas.getById(id),figure=el("figure");figure.className="nav-lab-figure";
 const button=el("button");button.type="button";button.className="nav-lab-picture-button";
 button.setAttribute("aria-label","Enlarge original Academy navigation picture: "+asset.title);
 const canvas=el("canvas");canvas.className="nav-lab-picture";void drawPicture(canvas,asset);
 const cue=el("span","Tap to enlarge");cue.className="nav-lab-enlarge";
 button.append(canvas,cue);
 button.addEventListener("click",()=>{
  zoomHeading.textContent=asset.title;
  void drawPicture(zoomCanvas,asset,Math.min(2.2,1150/asset.rect[2]));
  if(!zoom.open)zoom.showModal();close.focus();
 });
 figure.append(button,el("figcaption",asset.title));return figure;
}
function makeFeedback(holder,result){
 holder.replaceChildren();holder.dataset.correct=String(result.correct);
 holder.append(el("strong",result.correct?"Correct navigation concept.":"Review this navigation distinction."),
  el("p","Recommended response: "+result.expected),el("p",result.explanation));
 const details=el("details");details.className="nav-lab-key";
 const dl=el("dl");
 for(const [name,definition] of result.key)dl.append(el("dt",name),el("dd",definition));
 details.append(el("summary","Open illustrated navigation terms"),dl);
 holder.append(details);
}
function arrow(ctx,x0,y0,x1,y1,color,width=5){
 ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=width;ctx.lineCap="round";
 ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
 const angle=Math.atan2(y1-y0,x1-x0),a=13;
 ctx.beginPath();ctx.moveTo(x1,y1);
 ctx.lineTo(x1-a*Math.cos(angle-.5),y1-a*Math.sin(angle-.5));
 ctx.lineTo(x1-a*Math.cos(angle+.5),y1-a*Math.sin(angle+.5));
 ctx.closePath();ctx.fill();
}
function drawTrainingMap(canvas,result){
 const ctx=canvas.getContext("2d");if(!ctx)return;
 const w=800,h=280;canvas.width=w;canvas.height=h;
 ctx.fillStyle="#09293b";ctx.fillRect(0,0,w,h);
 ctx.strokeStyle="#2b5670";ctx.lineWidth=1;
 for(let x=30;x<w;x+=42){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
 for(let y=20;y<h;y+=42){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
 ctx.fillStyle="#c9e1eb";ctx.font="bold 18px system-ui";ctx.fillText("FICTIONAL TRAINING MAP · NOT TO SCALE",22,30);
 ctx.font="bold 17px system-ui";ctx.fillText("N",746,45);
 arrow(ctx,752,88,752,52,"#cdeefa",3);
 const ax=140,ay=180,bx=640,by=180;
 ctx.setLineDash([10,7]);arrow(ctx,ax,ay,bx,by,"#54d1ea",4);ctx.setLineDash([]);
 ctx.fillStyle="#f6deb0";ctx.font="bold 18px system-ui";
 ctx.fillText("A",ax-6,ay+33);ctx.fillText("B",bx-6,by+33);
 ctx.beginPath();ctx.arc(ax,ay,8,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.arc(bx,by,8,0,Math.PI*2);ctx.fill();
 // With an eastbound desired track, negative correction points north.
 const correction=result.correctionDegrees*Math.PI/180;
 const length=215,angle=correction; // screen Y increases downwards; negative WCA points north
 arrow(ctx,ax,ay,ax+length*Math.cos(angle),ay+length*Math.sin(angle),"#ffd08a",6);
 ctx.font="bold 16px system-ui";
 ctx.fillStyle="#d8f2fb";ctx.fillText("Desired track 090° true",332,168);
 ctx.fillStyle="#ffe1ae";ctx.fillText("True heading "+result.trueHeading.toFixed(1)+"°",170,110);
 ctx.fillStyle="#d6e4ee";ctx.font="14px system-ui";
 ctx.fillText("Wind FROM "+String(result.windFrom).padStart(3,"0")+"° at "+result.windSpeed+" kt",24,257);
 canvas.setAttribute("role","img");
 canvas.setAttribute("aria-label","Fictional eastbound track 090 degrees true between points A and B; computed true heading "+result.trueHeading.toFixed(1)+" degrees, wind from "+result.windFrom+" degrees at "+result.windSpeed+" knots. Not an aeronautical chart.");
}
function windPractice(){
 const section=el("section");section.className="nav-lab-simulator";section.setAttribute("aria-label","Fictional heading versus track wind exercise");
 const heading=el("h5","Interactive wind triangle — fictional A to B");
 const text=el("p","Desired track 090° TRUE; assumed true airspeed 90 kt. Choose wind direction FROM and speed. All values are synthetic and ignore magnetic variation, changing winds, aircraft limitations and approved procedures.");
 const grid=el("div");grid.className="nav-lab-chooser";
 const dirBox=el("div");const dirLabel=el("label","Wind FROM");
 const direction=el("select");direction.id="navWindFrom";
 const choices=[[0,"000° · North"],[90,"090° · East"],[180,"180° · South"],[270,"270° · West"]];
 for(const [degrees,label] of choices){const opt=el("option",label);opt.value=String(degrees);direction.append(opt)}
 direction.value="0";dirLabel.htmlFor=direction.id;dirBox.append(dirLabel,direction);
 const speedBox=el("div"),speedLabel=el("label","Wind speed: ");
 const speedText=el("strong","15 kt");speedText.className="nav-lab-speed";
 const speed=el("input");speed.id="navWindSpeed";speed.type="range";speed.min="0";speed.max="25";speed.step="5";speed.value="15";
 speed.setAttribute("aria-label","Fictional wind speed 0–25 knots");speedLabel.htmlFor=speed.id;
 speedLabel.append(speedText);speedBox.append(speedLabel,speed);
 grid.append(dirBox,speedBox);
 const map=el("canvas");map.className="nav-lab-training-map";
 const readout=el("div");readout.className="nav-lab-metrics";readout.setAttribute("role","status");
 readout.setAttribute("aria-live","polite");
 const track=el("p"),headingText=el("p"),ground=el("p");
 track.className="nav-lab-track-readout";headingText.className="nav-lab-heading-readout";ground.className="nav-lab-gs-readout";
 readout.append(track,headingText,ground);
 const caution=el("p");caution.className="nav-lab-caution";
 function update(){
  const data=model.windTriangle(Number(direction.value),Number(speed.value));
  speedText.textContent=data.windSpeed+" kt";
  track.textContent="Desired track: "+data.desiredTrack.toFixed(0)+"° TRUE";
  headingText.textContent="Illustrative true heading: "+data.trueHeading.toFixed(1)+"°";
  ground.textContent="Illustrative groundspeed: "+data.groundspeed.toFixed(1)+" kt";
  caution.textContent=data.note;
  drawTrainingMap(map,data);
 }
 direction.addEventListener("change",update);speed.addEventListener("input",update);
 section.append(heading,text,grid,map,readout,caution);update();return section;
}
function timePractice(){
 const section=el("section");section.className="nav-lab-simulator";section.setAttribute("aria-label","Fictional route leg time estimate");
 const heading=el("h5","Route leg estimate — constant groundspeed");
 const intro=el("p","Change invented leg distance and assumed average groundspeed. This calculates elapsed time only—not fuel, aircraft endurance, reserve or flight permission.");
 const fields=el("div");fields.className="nav-lab-chooser";
 const distBox=el("div"),speedBox=el("div");
 const distLabel=el("label","Fictional distance: "),distOut=el("strong","90 NM");
 const dist=el("input");dist.id="navLegDistance";dist.type="range";dist.min="45";dist.max="120";dist.step="15";dist.value="90";
 dist.setAttribute("aria-label","Fictional leg distance 45–120 nautical miles");distLabel.htmlFor=dist.id;distLabel.append(distOut);distBox.append(distLabel,dist);
 const speedLabel=el("label","Assumed groundspeed: "),speedOut=el("strong","60 kt");
 const gs=el("input");gs.id="navLegGroundspeed";gs.type="range";gs.min="60";gs.max="120";gs.step="15";gs.value="60";
 gs.setAttribute("aria-label","Assumed groundspeed 60–120 knots");speedLabel.htmlFor=gs.id;speedLabel.append(speedOut);speedBox.append(speedLabel,gs);
 fields.append(distBox,speedBox);
 const result=el("p");result.className="nav-lab-time-readout";result.setAttribute("role","status");result.setAttribute("aria-live","polite");
 const caution=el("p");caution.className="nav-lab-caution";
 function update(){
  const estimate=model.timeEstimate(Number(dist.value),Number(gs.value));
  distOut.textContent=estimate.distanceNM+" NM";speedOut.textContent=estimate.groundspeedKT+" kt";
  result.textContent="Estimated constant-speed time: "+estimate.minutes.toFixed(1)+" minutes";
  caution.textContent=estimate.note;
 }
 dist.addEventListener("input",update);gs.addEventListener("input",update);
 section.append(heading,intro,fields,result,caution);update();return section;
}
function draw(){
 const item=model.cases[current];reading.replaceChildren();
 const h=el("h4",String(item.number).padStart(2,"0")+" · "+item.title);
 const two=el("div");two.className="nav-lab-grid";
 const gallery=el("div");gallery.className="nav-lab-gallery";
 for(const id of item.pictures)gallery.append(picture(id));
 const lesson=el("div");lesson.className="nav-lab-lesson";
 const situation=el("p",item.situation);
 const cue=el("p",route==="scouts"?item.scouts:item.pilots);cue.className="nav-lab-focus";
 const options=el("fieldset");options.className="nav-lab-options";
 options.append(el("legend",item.question));
 for(const [i,option] of item.options.entries()){
  const label=el("label"),input=el("input");input.type="radio";
  input.name="nav-exercise-"+item.id;input.value=String(i);input.checked=responses.get(item.id)?.choice===i;
  label.append(input,el("span",option));options.append(label);
 }
 const button=el("button","Check navigation concept");button.type="button";button.className="nav-lab-check";
 const result=el("div");result.className="nav-lab-feedback";result.setAttribute("role","status");result.setAttribute("aria-live","polite");
 const earlier=responses.get(item.id);
 if(earlier)makeFeedback(result,earlier.answer);
 else result.textContent="Examine the picture and fictional route, choose an answer, then review the explanation.";
 button.addEventListener("click",()=>{
  const choice=options.querySelector('input[type="radio"]:checked');
  if(!choice){result.textContent="Choose one response before checking.";return}
  const selected=Number(choice.value),answer=model.evaluate(item.id,selected);
  responses.set(item.id,{choice:selected,answer});makeFeedback(result,answer);updateProgress();
 });
 lesson.append(situation,cue,options,button,result);two.append(gallery,lesson);reading.append(h,two);
 if(item.id==="wind-triangle")reading.append(windPractice());
 if(item.id==="time-distance")reading.append(timePractice());
 prev.disabled=current===0;next.disabled=current===model.cases.length-1;updateProgress();
}
function updateProgress(){progress.textContent=(current+1)+" of "+model.cases.length+" navigation exercises · "+responses.size+" reviewed on this page (ungraded)"}
function display(moduleId,path){
 host.hidden=moduleId!=="navigation";
 if(host.hidden){if(zoom.open)zoom.close();return}
 route=path==="pilots"?"pilots":"scouts";
 routeFocus.textContent=route==="scouts"?
  "Scouts & Air Scouts: locate chart features and work through the imaginary route with your appointed adult instructor.":
  "Enthusiasts & aspiring pilots: relate true heading, track, wind, speed and chart currency without relying on these examples for an actual flight.";
 draw();
}
document.addEventListener("agsa:coursebook-module",e=>display(e.detail?.moduleId,e.detail?.route));
document.addEventListener("DOMContentLoaded",()=>{
 const query=new URL(location.href).searchParams;
 const selected=document.getElementById("moduleTitle")?.textContent||"";
 display(/navigation and flight planning concepts/i.test(selected)?"navigation":query.get("module")||"aircraft",
  document.getElementById("route")?.value);
});
})(window);
