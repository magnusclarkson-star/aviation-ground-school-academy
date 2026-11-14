/* Course 09 — no real radio, microphone, network, recording or downloads.
 * Synthetic browser speech is optional and only starts on user click. */
(function(root){"use strict";
const model=root.AGSAATCRadioPractical,atlas=root.AGSAOriginalPictureAtlas;
const host=document.getElementById("radioPracticalLab");
if(!model||!atlas||!host)return;
model.validate(atlas);
const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n};
let active=0,route="scouts";
const responses=new Map(),images=new Map();
const heading=el("header");heading.className="radio-lab-heading";
const kicker=el("p","COURSE 09 · FICTIONAL ATC RADIO TRAINER");kicker.className="radio-lab-kicker";
const title=el("h3","Practise listening, callsigns and accurate readbacks");title.id="radioLabTitle";
const intro=el("p","Use the original Academy radio pictures. Listen to invented exchanges using device speech where supported, identify a wrong readback, and learn the international spelling alphabet.");
const focus=el("p");focus.className="radio-lab-focus";heading.append(kicker,title,intro,focus);
const progress=el("p");progress.className="radio-lab-progress";progress.setAttribute("role","status");progress.setAttribute("aria-live","polite");
const reading=el("div");reading.className="radio-lab-reading";
const nav=el("nav");nav.className="radio-lab-nav";nav.setAttribute("aria-label","Radio communication lesson concepts");
const previous=el("button","Previous radio exercise"),next=el("button","Next radio exercise");
previous.type=next.type="button";
previous.addEventListener("click",()=>{if(active>0){active--;render()}});
next.addEventListener("click",()=>{if(active<model.scenarios.length-1){active++;render()}});
nav.append(previous,next);
const footer=el("p","All speakers, callsigns, stations and instructions here are fictional and are NEVER an actual clearance or radio transmission. No microphone is activated; no speech is recorded, uploaded or downloaded. Exact real phraseology depends on current State procedures.");
footer.className="radio-lab-footer";
host.append(heading,progress,reading,nav,footer);
const zoom=el("dialog");zoom.className="radio-lab-dialog";zoom.setAttribute("aria-label","Enlarged approved Academy radio illustration");
const zoomTitle=el("h3"),zoomCanvas=el("canvas"),close=el("button","Close picture");
close.type="button";close.addEventListener("click",()=>zoom.close());
zoom.addEventListener("click",e=>{if(e.target===zoom)zoom.close()});
zoom.append(zoomTitle,zoomCanvas,close);document.body.append(zoom);
function loadImage(src){
 if(!images.has(src)){
  const image=new Image();image.decoding="async";
  images.set(src,new Promise((resolve,reject)=>{
   image.onload=()=>resolve(image);
   image.onerror=()=>reject(Error("Approved image unavailable"));
   image.src=src;
  }));
 }
 return images.get(src);
}
async function draw(canvas,asset,scale=1){
 const [sx,sy,w,h]=asset.rect;
 canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
 canvas.setAttribute("role","img");canvas.setAttribute("aria-label",asset.alt);
 try{
  const image=await loadImage(asset.src),ctx=canvas.getContext("2d");
  if(ctx){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(image,sx,sy,w,h,0,0,canvas.width,canvas.height)}
 }catch{canvas.setAttribute("aria-label","Original Academy radio illustration unavailable")}
}
function originalPicture(id){
 const asset=atlas.getById(id),figure=el("figure");figure.className="radio-lab-figure";
 const button=el("button");button.type="button";button.className="radio-lab-picture-button";
 button.setAttribute("aria-label","Enlarge original Academy radio picture: "+asset.title);
 const canvas=el("canvas");canvas.className="radio-lab-picture";void draw(canvas,asset);
 const cue=el("span","Tap to enlarge");cue.className="radio-lab-enlarge";button.append(canvas,cue);
 button.addEventListener("click",()=>{
  zoomTitle.textContent=asset.title;void draw(zoomCanvas,asset,Math.min(2.3,1100/asset.rect[2]));
  if(!zoom.open)zoom.showModal();close.focus();
 });
 figure.append(button,el("figcaption",asset.title));return figure;
}
let audioToken=0;
function stopAudio(){
 audioToken++;
 if("speechSynthesis" in root)try{root.speechSynthesis.cancel()}catch{}
}
function playLines(lines,status){
 stopAudio();
 if(!("speechSynthesis" in root)||typeof root.SpeechSynthesisUtterance!=="function"){
  status.textContent="Device speech is unavailable here. Use Show transcript to read or practise aloud.";
  return;
 }
 const token=audioToken;
 status.textContent="Playing fictional radio exchange using the device voice…";
 function speakAt(index){
  if(token!==audioToken)return;
  if(index>=lines.length){status.textContent="Example finished. Replay or open the transcript.";return}
  const item=lines[index];
  let utterance;
  try{utterance=new root.SpeechSynthesisUtterance(item.line)}catch{
   status.textContent="Device speech is unavailable. Open the transcript instead.";return
  }
  utterance.lang="en-GB";
  utterance.rate=item.speaker==="Controller"?0.91:0.98;
  utterance.pitch=item.speaker==="Controller"?0.84:1.08;
  utterance.volume=1;
  utterance.onend=()=>speakAt(index+1);
  utterance.onerror=()=>{if(token===audioToken)status.textContent="Voice playback unavailable. Read the transcript instead."};
  try{root.speechSynthesis.speak(utterance)}catch{
   status.textContent="Voice playback unavailable. Read the transcript instead.";
  }
 }
 speakAt(0);
}
function dialogue(scenario){
 const section=el("section");section.className="radio-lab-dialogue";
 section.append(el("h5","Listen to a fictional pilot–controller exchange"));
 const caption=el("p","Playback uses your device's optional synthetic voice, not real ATC recordings or any radio frequency.");
 const toolbar=el("div");toolbar.className="radio-lab-audio-buttons";
 const listen=el("button","Listen to example"),stop=el("button","Stop audio"),toggle=el("button","Show transcript");
 listen.type=stop.type=toggle.type="button";
 const status=el("p","Audio is off. You can read the transcript without playing sound.");
 status.className="radio-lab-audio-status";status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const transcript=el("ol");transcript.className="radio-lab-transcript";transcript.hidden=true;
 for(const item of scenario.dialogue){
  const line=el("li");line.append(el("strong",item.speaker+": "),el("span",item.line));transcript.append(line);
 }
 listen.addEventListener("click",()=>playLines(scenario.dialogue,status));
 stop.addEventListener("click",()=>{stopAudio();status.textContent="Playback stopped."});
 toggle.addEventListener("click",()=>{
  transcript.hidden=!transcript.hidden;
  toggle.textContent=transcript.hidden?"Show transcript":"Hide transcript";
  toggle.setAttribute("aria-expanded",String(!transcript.hidden));
 });
 toggle.setAttribute("aria-expanded","false");
 toolbar.append(listen,stop,toggle);
 section.append(caption,toolbar,status,transcript);return section;
}
function alphabetPractice(){
 const section=el("section");section.className="radio-lab-alphabet";
 section.append(el("h5","Explore the full A–Z radiotelephony alphabet"));
 const help=el("p","Tap any letter to see its official spelling word. You can also try a short classroom word; do not enter a real callsign or personal information.");
 const board=el("div");board.className="radio-lab-letters";
 const label=el("div","A — Alfa");label.className="radio-lab-letter-meaning";
 label.setAttribute("role","status");label.setAttribute("aria-live","polite");
 for(const item of model.alphabet){
  const button=el("button",item.letter);button.type="button";button.dataset.letter=item.letter;
  button.setAttribute("aria-pressed",String(item.letter==="A"));
  button.addEventListener("click",()=>{
   const word=model.alphabetWord(item.letter);
   label.textContent=item.letter+" — "+word;
   for(const b of board.children)b.setAttribute("aria-pressed",String(b===button));
  });board.append(button);
 }
 const field=el("div");field.className="radio-lab-speller";
 const inputLabel=el("label","Practice letters (maximum 24)");
 const input=el("input");input.id="radioSpellingInput";input.type="text";input.maxLength=24;input.autocomplete="off";input.spellcheck=false;
 input.value="ABC";inputLabel.htmlFor=input.id;
 const result=el("output");result.className="radio-lab-spelled";
 const render=()=>{
  try{
   const words=model.spell(input.value);
   result.textContent=words.length?words.join(" · "):"Type a few letters to see their radio spelling words.";
   result.dataset.valid="true";
  }catch{
   result.textContent="Use letters A–Z and spaces only. No numbers, identifiers or personal details.";
   result.dataset.valid="false";
  }
 };
 input.addEventListener("input",render);field.append(inputLabel,input,result);render();
 section.append(help,board,label,field);return section;
}
function showAnswer(element,result){
 element.replaceChildren();element.dataset.correct=String(result.correct);
 element.append(el("strong",result.correct?"Correct radio communication concept.":"Review the communication and readback."),
  el("p","Recommended answer: "+result.expected),el("p",result.explanation));
 const glossary=el("details");glossary.className="radio-lab-key";
 const list=el("dl");
 for(const [term,meaning] of result.key)list.append(el("dt",term),el("dd",meaning));
 glossary.append(el("summary","Open communication terminology"),list);element.append(glossary);
}
function render(){
 stopAudio();
 const item=model.scenarios[active];reading.replaceChildren();
 const heading=el("h4",String(item.number).padStart(2,"0")+" · "+item.title);
 const grid=el("div");grid.className="radio-lab-grid";
 const images=el("div");images.className="radio-lab-gallery";
 for(const id of item.pictures)images.append(originalPicture(id));
 const lesson=el("div");lesson.className="radio-lab-lesson";
 const situation=el("p",item.situation);
 const pathNote=el("p",route==="scouts"?item.scouts:item.pilots);pathNote.className="radio-lab-focus";
 const options=el("fieldset");options.className="radio-lab-questions";
 options.append(el("legend",item.question));
 for(const [index,value] of item.options.entries()){
  const label=el("label"),input=el("input");input.type="radio";input.value=String(index);
  input.name="radio-practice-"+item.id;input.checked=responses.get(item.id)?.choice===index;
  label.append(input,el("span",value));options.append(label);
 }
 const check=el("button","Check radio answer");check.type="button";check.className="radio-lab-check";
 const outcome=el("div");outcome.className="radio-lab-feedback";
 outcome.setAttribute("role","status");outcome.setAttribute("aria-live","polite");
 const savedAnswer=responses.get(item.id);
 if(savedAnswer)showAnswer(outcome,savedAnswer.result);
 else outcome.textContent="Study the picture, listen or read the fictional exchange, and select the safest answer.";
 check.addEventListener("click",()=>{
  const selected=options.querySelector('input[type="radio"]:checked');
  if(!selected){outcome.textContent="Select one answer before checking.";return}
  const choice=Number(selected.value),result=model.evaluate(item.id,choice);
  responses.set(item.id,{choice,result});showAnswer(outcome,result);update();
 });
 lesson.append(situation,pathNote,options,check,outcome);grid.append(images,lesson);
 reading.append(heading,grid,dialogue(item));
 if(item.id==="phonetics")reading.append(alphabetPractice());
 previous.disabled=active===0;next.disabled=active===model.scenarios.length-1;update();
}
function update(){
 progress.textContent=(active+1)+" of "+model.scenarios.length+" radio exercises · "+responses.size+" reviewed this visit (ungraded)";
}
function display(moduleId,path){
 host.hidden=moduleId!=="communications";
 if(host.hidden){stopAudio();if(zoom.open)zoom.close();return}
 route=path==="pilots"?"pilots":"scouts";
 focus.textContent=route==="scouts"?
  "Scouts & Air Scouts: identify the fictional speaker, practise standard letters and discuss mistakes with an appointed adult instructor.":
  "Enthusiasts & aspiring pilots: distinguish requests, instructions, readbacks, corrections and authentic operational authority.";
 render();
}
document.addEventListener("agsa:coursebook-module",e=>display(e.detail?.moduleId,e.detail?.route));
document.addEventListener("DOMContentLoaded",()=>{
 const params=new URL(location.href).searchParams;
 const selected=document.getElementById("moduleTitle")?.textContent||"";
 display(/radiotelephony and atc awareness/i.test(selected)?"communications":params.get("module")||"aircraft",
  document.getElementById("route")?.value);
});
root.addEventListener("pagehide",stopAudio);
})(window);
