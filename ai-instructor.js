/* Public Aviation AI Instructor Studio.
 * Offline lessons are curated human-authored text, not generative AI.
 * The browser's speech engine is optional and never contacts the Academy API.
 */
(()=>{"use strict";
const L=window.AGSAAIInstructorLessons,P=window.AGSAInstructorProgress,$=id=>document.getElementById(id);
if(!L){document.body.insertAdjacentText("afterbegin","Lessons unavailable.");return}
let lessonId="forces",style="mentor",answered=false,lastSpoken="",voices=[],recognition=null;
const lessonIds=L.lessons.map(l=>l.id);
let history=P?P.load(window.localStorage,lessonIds):[];
function renderPractice(){
 if(!P)return;
 const o=P.overview(history,L.lessons);
 $("practiceSummary").textContent=o.total?o.total+" checkpoints · "+o.correct+" correct ("+o.percent+"%).":"No quiz checkpoints recorded yet.";
 const next=L.lessonById(o.recommended);
 $("practiceRecommendation").textContent="Suggested next lesson: "+next.name+". "+(o.total?"Based on your practice history.":"Start here, or choose any lesson above.");
 $("practiceNext").dataset.lesson=next.id;
}
function storePractice(){
 if(!P)return;
 if(!P.save(window.localStorage,history,lessonIds))$("practiceStorageNote").textContent="This browser blocked local storage. Progress will last only until the page closes.";
 renderPractice();
}
const speech="speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;
const speechAPI=speech?window.speechSynthesis:null;
function sayStatus(text){$("voiceStatus").textContent=text}
function populateVoices(){
 if(!speech)return;
 const previous=$("voiceSelect").value;
 voices=speechAPI.getVoices();
 $("voiceSelect").replaceChildren();
 const def=document.createElement("option");def.value="";def.textContent="Default system voice";$("voiceSelect").appendChild(def);
 voices.forEach((voice,i)=>{
  const opt=document.createElement("option");opt.value=String(i);
  opt.textContent=voice.name+" · "+voice.lang+(voice.localService?" · device":" · service");
  $("voiceSelect").appendChild(opt);
 });
 if(previous&&Number(previous)<voices.length)$("voiceSelect").value=previous;
 sayStatus(voices.length?voices.length+" device/browser voices detected. Audio is synthetic, not a human instructor.":
  "Speech may use your system's default voice. If silent, check the phone speech settings.");
}
function stop(){
 if(speech)speechAPI.cancel();
 sayStatus(speech?"Narration stopped.":"Speech output is unavailable on this browser.");
}
function speak(text){
 if(!speech){sayStatus("Voice narration unavailable. You can read the lesson instead.");return false}
 const trimmed=String(text||"").trim();
 if(!trimmed)return false;
 speechAPI.cancel();
 const utterance=new SpeechSynthesisUtterance(trimmed.slice(0,4000));
 utterance.lang="en";
 utterance.rate=Number($("voiceRate").value)||1;
 const selected=$("voiceSelect").value;
 if(selected!==""&&voices[Number(selected)])utterance.voice=voices[Number(selected)];
 utterance.onstart=()=>sayStatus("Reading aloud using a computer-generated voice.");
 utterance.onerror=event=>sayStatus("Speech playback stopped or failed. Check browser voice settings.");
 utterance.onend=()=>sayStatus("Reading complete. Choose a new lesson or question.");
 lastSpoken=trimmed;
 try{speechAPI.speak(utterance);return true}catch{sayStatus("Could not start speech playback.");return false}
}
function text(tag,value){
 const el=document.createElement(tag);el.textContent=value;return el;
}
function setStyle(next){
 if(!["mentor","scouts","exam"].includes(next))return;
 style=next;
 document.querySelectorAll(".instructor").forEach(button=>{
  const active=button.dataset.style===style;
  button.classList.toggle("selected",active);
  button.setAttribute("aria-pressed",active?"true":"false");
 });
}
function selectLesson(id){
 const lesson=L.lessonById(id);
 lessonId=lesson.id;
 $("lessonSelect").value=lesson.id;
 $("lessonTitle").textContent=lesson.name;
 $("lessonIntro").textContent=lesson.intro;
 $("lessonBody").textContent=lesson.body;
 $("quizQuestion").textContent=lesson.question;
 $("quizResult").textContent="";
 const choices=$("quizAnswers");choices.replaceChildren();
 lesson.options.forEach((option,index)=>{
  const button=text("button",String.fromCharCode(65+index)+". "+option);
  button.type="button";button.dataset.answer=String(index);
  button.setAttribute("aria-pressed","false");
  button.addEventListener("click",()=>selectAnswer(index));
  choices.appendChild(button);
 });
 answered=false;
 $("answerPanel").hidden=true;
 if(speech)speechAPI.cancel();
 const currentUrl=new URL(window.location.href);
 currentUrl.searchParams.set("lesson",lesson.id);
 history.replaceState(null,"",currentUrl.pathname+currentUrl.search);
}
function selectAnswer(index){
 const evaluation=L.evaluateQuiz(lessonId,index);
 answered=true;
 if(P){history=P.record(history,lessonId,evaluation.correct,lessonIds);storePractice();}
 document.querySelectorAll("#quizAnswers button").forEach(button=>{
  const idx=Number(button.dataset.answer);
  button.classList.toggle("correct",idx===evaluation.correctIndex);
  button.classList.toggle("incorrect",idx===index&&!evaluation.correct);
  button.setAttribute("aria-pressed",idx===index?"true":"false");
 });
 $("quizResult").textContent=(evaluation.correct?"Correct. ":"Not quite. ")+evaluation.explanation;
}
function submitQuestion(event){
 event.preventDefault();
 const q=$("questionInput").value.trim();
 if(!q){$("questionInput").focus();return;}
 const answer=L.localAnswer(q,lessonId);
 $("answerText").textContent=answer.text;
 $("answerPanel").hidden=false;
}
function startMicrophone(){
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Recognition){$("microphoneNote").textContent="Speech dictation is not supported by this browser. Type your question instead.";return;}
 if(recognition){try{recognition.stop()}catch{}recognition=null}
 recognition=new Recognition();
 recognition.lang="en-US";recognition.interimResults=false;recognition.maxAlternatives=1;
 recognition.onresult=event=>{
  const transcript=event.results[0]?.[0]?.transcript;
  if(transcript)$("questionInput").value=String(transcript).slice(0,400);
  $("microphoneNote").textContent="Dictation complete. Review the text, then select Find lesson answer.";
 };
 recognition.onerror=()=>{
  $("microphoneNote").textContent="Dictation failed or was denied. Type your question instead.";
 };
 recognition.onend=()=>{
  $("microphoneButton").disabled=false;recognition=null;
 };
 $("microphoneButton").disabled=true;
 $("microphoneNote").textContent="Listening for a short study question. Your browser may send microphone audio to its speech service.";
 try{recognition.start()}catch{
  $("microphoneButton").disabled=false;
  $("microphoneNote").textContent="Microphone could not start. Type your question instead.";
 }
}
function initialise(){
 if(P){
  renderPractice();
  $("practiceNext").addEventListener("click",()=>selectLesson($("practiceNext").dataset.lesson));
  $("practiceReset").addEventListener("click",()=>{
   if(!window.confirm("Clear this device’s saved quiz history?"))return;
   history=[];storePractice();
  });
 }else $("practiceStorageNote").textContent="Revision record unavailable; you can still complete lessons.";
 L.lessons.forEach(lesson=>{
  const opt=document.createElement("option");opt.value=lesson.id;opt.textContent=lesson.group+" · "+lesson.name;
  $("lessonSelect").appendChild(opt);
 });
 const requested=new URL(location.href).searchParams.get("lesson");
 selectLesson(L.lessons.some(l=>l.id===requested)?requested:"forces");
 document.querySelectorAll(".instructor").forEach(button=>button.addEventListener("click",()=>setStyle(button.dataset.style)));
 $("lessonSelect").addEventListener("change",event=>selectLesson(event.target.value));
 $("readLesson").addEventListener("click",()=>speak(L.voiceScript(lessonId,style)));
 $("repeatLesson").addEventListener("click",()=>speak(lastSpoken||L.voiceScript(lessonId,style)));
 $("stopVoice").addEventListener("click",stop);
 $("speakAnswer").addEventListener("click",()=>speak($("answerText").textContent));
 $("voiceRate").addEventListener("input",()=>{$("rateValue").textContent=Number($("voiceRate").value).toFixed(1)+"×"});
 $("questionForm").addEventListener("submit",submitQuestion);
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 $("microphoneButton").disabled=!Recognition;
 $("microphoneButton").addEventListener("click",startMicrophone);
 if(speech){
  populateVoices();
  speechAPI.addEventListener?.("voiceschanged",populateVoices);
 }else{
  for(const id of ["readLesson","repeatLesson","stopVoice","speakAnswer","voiceSelect","voiceRate"])$(id).disabled=true;
  sayStatus("This browser does not support speech synthesis. Read the lesson on screen or enable device speech support.");
 }
 window.addEventListener("pagehide",()=>{if(speech)speechAPI.cancel();if(recognition)recognition.abort()});
}
initialise();
})();