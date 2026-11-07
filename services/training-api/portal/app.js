/* Private staging dashboard. No credentials or account records in browser storage.
 * Authentication, role permissions, student ownership and instructor assignment
 * are enforced by the independent backend, never by UI visibility.
 */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const state={user:null,attempts:[],assigned:[],drafts:[],selectedId:null,pendingUpload:null};
const csrfNames=["__Host-AGSA-CSRF","agsa_local_csrf"];
let connectedAiEnabled=false,connectedVoiceEnabled=false,lastAiText="",activeAudio=null,activeAudioUrl=null;
// A fragment token is not sent to the server by navigation. Remove it from
// history immediately, hold it only in memory, and wait for a deliberate click.
const invitation=new URLSearchParams(location.hash.slice(1)).get("verify-email");
let pendingVerifyToken=typeof invitation==="string"&&/^[A-Za-z0-9_-]{43}$/.test(invitation)?invitation:null;
if(location.hash)history.replaceState(null,"",location.pathname+location.search);

function status(id,message,tone=""){
 const el=$(id);el.textContent=message;
 if(tone)el.dataset.tone=tone;else el.removeAttribute("data-tone");
 el.classList.remove("hidden");
}
function show(id,visible){$(id).classList.toggle("hidden",!visible);}
function one(tag,text,cls){
 const el=document.createElement(tag);
 if(typeof text==="string")el.textContent=text;
 if(cls)el.className=cls;
 return el;
}
function removeAll(id){const target=$(id);target.replaceChildren();return target;}
function csrfToken(){
 for(const item of document.cookie.split(";")){
  const index=item.indexOf("=");if(index===-1)continue;
  const name=item.slice(0,index).trim();
  if(csrfNames.includes(name))return item.slice(index+1).trim();
 }
 return "";
}
async function api(path,{method="GET",payload,key}={}){
 const headers={Accept:"application/json"};
 if(method!=="GET"){
  headers["Content-Type"]="application/json";
  if(path!=="/api/v1/auth/login"&&path!=="/api/v1/auth/verify-email"){
   const token=csrfToken();
   if(!token)throw Error("Session verification token is missing. Please sign in again.");
   headers["X-AGSA-CSRF"]=token;
  }
 }
 if(key)headers["Idempotency-Key"]=key;
 let response;
 try{
  response=await fetch(path,{method,credentials:"same-origin",cache:"no-store",headers,
   ...(payload!==undefined?{body:JSON.stringify(payload)}:{})});
 }catch{throw Error("Could not connect to the private training API. Check that staging is running.");}
 let data;
 try{data=await response.json();}catch{throw Error("The training API returned an unexpected response.");}
 if(!response.ok){
  const detail=typeof data.message==="string"?data.message:"Request denied";
  const error=new Error(detail);error.status=response.status;error.code=data.error;throw error;
 }
 return data;
}
function resetSession(message){
 state.user=null;state.attempts=[];state.assigned=[];state.drafts=[];state.selectedId=null;
 state.pendingUpload=null;
 stopNarration();
 lastAiText="";connectedAiEnabled=false;connectedVoiceEnabled=false;
 $("aiQuestion").value="";$("aiConsent").checked=false;
 $("aiAskButton").disabled=true;$("aiSpeak").disabled=true;
 show("aiAnswerPanel",false);
 $("password").value="";$("verificationCode").value="";
 $("reportFile").value="";
 removeAll("studentList");
 removeAll("assignedList");removeAll("feedbackList");
 show("loadingPanel",false);show("loginPanel",true);show("workspace",false);
 show("studentPanel",false);show("instructorPanel",false);
 if(message)status("globalStatus",message);
 else show("globalStatus",false);
}
async function loadUser(){
 try{
  const result=await api("/api/v1/me");
  if(!result.user||!["student","instructor"].includes(result.user.role))throw Error("Unsupported account role");
  state.user=result.user;
  show("loadingPanel",false);show("loginPanel",false);show("workspace",true);
  show("globalStatus",false);
  $("profileEmail").textContent=state.user.email;
  $("profileRole").textContent=(state.user.role==="student"?"Student":"Instructor")+" · Organisation "+state.user.organizationId;
  show("studentPanel",state.user.role==="student");
  show("instructorPanel",state.user.role==="instructor");
  if(state.user.role==="student")await refreshStudent();
  else await refreshInstructor();
  await refreshAiStatus();
 }catch(err){
  if(err.status===401){resetSession();return;}
  resetSession(err.message);
 }
}
function fmtTime(raw){
 const date=new Date(raw);
 return Number.isFinite(date.getTime())?date.toLocaleString():String(raw||"unknown time");
}
function badgeText(outcome){return String(outcome||"UNVERIFIED").replaceAll("_"," ");}
function populateAttemptCard(item,includeStudent=false){
 const card=one("article",undefined,"list-item");
 const task=String(item.report?.taskId||"Unknown task");
 const title=one("strong",task.replaceAll("_"," ").toUpperCase());card.appendChild(title);
 const percent=item.report?.observations?.matchedPercent;
 const summary=typeof percent==="number"?percent+"% claimed target match":"Score unavailable";
 card.appendChild(one("p",summary+" · "+fmtTime(item.submittedAt),"meta"));
 if(includeStudent)card.appendChild(one("p","Student ID: "+String(item.studentId||""),"meta"));
 card.appendChild(one("p","UNVERIFIED BROWSER REPORT · NO FLIGHT CREDIT","mark"));
 return card;
}
async function refreshStudent(){
 if(state.user?.role!=="student")return;
 try{
  const res=await api("/api/v1/practice-attempts?limit=30");
  state.attempts=Array.isArray(res.items)?res.items:[];
  const target=removeAll("studentList");
  if(!state.attempts.length)target.appendChild(one("p","No practice reports submitted yet.","muted"));
  for(const item of state.attempts)target.appendChild(populateAttemptCard(item));
 }catch(e){status("submissionStatus","Could not refresh your attempts: "+e.message,"error");}
}
async function submitPractice(event){
 event.preventDefault();
 const file=$("reportFile").files?.[0];
 if(!file){status("submissionStatus","Select a JSON report first.","error");return;}
 if(file.size>32768){status("submissionStatus","The report exceeds the 32 KB staging limit.","error");return;}
 $("submitButton").disabled=true;
 try{
  const text=await file.text();
  const report=JSON.parse(text);
  if(!report||typeof report!=="object"||report.schema!=="agsa.practice-observation.v1")
   throw Error("Choose a report downloaded from Skills Practice, not an exported journal.");
  const fingerprint=file.name+":"+file.size+":"+file.lastModified;
  if(!state.pendingUpload||state.pendingUpload.fingerprint!==fingerprint)
   state.pendingUpload={fingerprint,key:crypto.randomUUID()};
  const result=await api("/api/v1/practice-attempts",{
   method:"POST",payload:report,key:state.pendingUpload.key
  });
  status("submissionStatus",(result.created?"Report submitted":"Matching previous submission found")+
   ". It remains unverified and carries no flight credit.","success");
  $("reportFile").value="";
  state.pendingUpload=null;
  await refreshStudent();
 }catch(e){status("submissionStatus","Submission unsuccessful: "+e.message,"error");}
 finally{$("submitButton").disabled=false;}
}
function renderAssigned(){
 const target=removeAll("assignedList");
 if(!state.assigned.length){target.appendChild(one("p","No active assignments with practice submissions.","muted"));return;}
 for(const item of state.assigned){
  const card=populateAttemptCard(item,true);
  const button=one("button",item.id===state.selectedId?"Selected":"Review attempt");
  button.type="button";button.disabled=item.id===state.selectedId;
  button.addEventListener("click",()=>selectAttempt(item.id));
  card.appendChild(button);target.appendChild(card);
 }
}
function selectAttempt(id){
 const attempt=state.assigned.find(item=>item.id===id);
 if(!attempt){state.selectedId=null;show("selectedAttempt",false);$("feedbackButton").disabled=true;return;}
 state.selectedId=id;show("selectedAttempt",true);
 $("selectedTask").textContent=String(attempt.report?.taskId||"Unknown");
 $("selectedScore").textContent=String(attempt.report?.observations?.matchedPercent??"—")+"% (unverified)";
 $("selectedId").textContent=id;
 $("feedbackButton").disabled=false;
 status("feedbackStatus","Draft review is ready. Use fictional practice feedback only.");
 renderAssigned();
}
async function refreshInstructor(){
 if(state.user?.role!=="instructor")return;
 try{
  const result=await api("/api/v1/instructor/assigned-attempts?limit=30");
  state.assigned=Array.isArray(result.items)?result.items:[];
  renderAssigned();
  if(state.selectedId&&state.assigned.some(x=>x.id===state.selectedId))selectAttempt(state.selectedId);
  else{state.selectedId=null;show("selectedAttempt",false);$("feedbackButton").disabled=true;}
  await refreshDrafts();
 }catch(e){status("feedbackStatus","Could not refresh assignments: "+e.message,"error");}
}
async function refreshDrafts(){
 if(state.user?.role!=="instructor")return;
 try{
  const result=await api("/api/v1/instructor/feedback-drafts?limit=30");
  state.drafts=Array.isArray(result.items)?result.items:[];
  const target=removeAll("feedbackList");
  if(!state.drafts.length)target.appendChild(one("p","No feedback drafts yet.","muted"));
  for(const item of state.drafts){
   const card=one("article",undefined,"list-item");
   card.appendChild(one("strong","UNVERIFIED FEEDBACK DRAFT"));
   card.appendChild(one("p","Attempt: "+String(item.attemptId||"")+" · "+fmtTime(item.createdAt),"meta"));
   card.appendChild(one("p",String(item.comments||item.proposedNextAction||""),"meta"));
   target.appendChild(card);
  }
 }catch(e){status("feedbackStatus","Could not refresh draft feedback: "+e.message,"error");}
}
async function submitFeedback(event){
 event.preventDefault();
 if(!state.selectedId){status("feedbackStatus","Select an assigned attempt.","error");return;}
 $("feedbackButton").disabled=true;
 try{
  const payload={
   attemptId:state.selectedId,
   rubric:{
    instrumentScan:$("rubricScan").value,
    controlCoordination:$("rubricControl").value,
    riskAwareness:$("rubricRisk").value
   },
   comments:$("comments").value,
   proposedNextAction:$("nextAction").value
  };
  const result=await api("/api/v1/instructor/feedback-drafts",{method:"POST",payload});
  status("feedbackStatus","Saved "+result.status+" — no instructor signature or official assessment was issued.","success");
  $("comments").value="";$("nextAction").value="";
  await refreshDrafts();
 }catch(e){status("feedbackStatus","Draft could not be saved: "+e.message,"error");}
 finally{$("feedbackButton").disabled=!state.selectedId;}
}
async function signIn(event){
 event.preventDefault();
 const button=$("loginButton");button.disabled=true;
 try{
  await api("/api/v1/auth/login",{method:"POST",payload:{
   organization:$("organization").value,
   email:$("email").value,
   password:$("password").value,
   verificationCode:$("verificationCode").value
  }});
  $("password").value="";$("verificationCode").value="";
  await loadUser();
 }catch(e){$("password").value="";$("verificationCode").value="";status("globalStatus","Sign-in unsuccessful: "+e.message,"error");}
 finally{button.disabled=false;}
}
async function signOut(){
 $("logoutButton").disabled=true;
 try{await api("/api/v1/auth/logout",{method:"POST",payload:{}});}
 catch(e){status("globalStatus","Unable to confirm logout. The current session may still be active: "+e.message,"error");$("logoutButton").disabled=false;return;}
 resetSession("Signed out. No user credentials were stored by this page.");
 $("logoutButton").disabled=false;
}
async function confirmEmail(){
 if(!pendingVerifyToken){status("verifyStatus","This invitation link is invalid or missing.","error");return;}
 $("verifyButton").disabled=true;
 try{
  await api("/api/v1/auth/verify-email",{method:"POST",payload:{token:pendingVerifyToken}});
  pendingVerifyToken=null;
  $("verifyButton").classList.add("hidden");
  status("verifyStatus","Email confirmed for the staging account. You may now sign in with your password and, if you are an instructor, your authenticator code.","success");
 }catch(error){
  status("verifyStatus","Email confirmation unsuccessful: "+error.message,"error");
 }finally{$("verifyButton").disabled=false;}
}
$("verifyButton").addEventListener("click",confirmEmail);
if(pendingVerifyToken){
 show("verifyPanel",true);
}else if(invitation!==null){
 show("verifyPanel",true);
 $("verifyButton").disabled=true;
 status("verifyStatus","Invalid verification invitation. Request a new email from your staging operator.","error");
}
async function refreshAiStatus(){
 try{
  const data=await api("/api/v1/ai/status");
  connectedAiEnabled=data.enabled===true;
  connectedVoiceEnabled=data.voiceEnabled===true;
  $("aiAskButton").disabled=!connectedAiEnabled;
  status("aiAvailability",connectedAiEnabled?
   "Connected text AI is enabled for fictional staging accounts. Text quota: "+data.limits.text+
   " questions/day; natural voice quota: "+data.limits.voice+" clips/day (if enabled).":
   "Connected AI is not enabled on this private staging server. The public guided lessons and device narration are available without it.");
  const ttsOption=$("aiVoiceChoice").querySelectorAll("option");
  ttsOption.forEach((option,i)=>{if(i>0)option.disabled=!connectedVoiceEnabled});
  $("aiVoiceChoice").value="device";
 }catch(e){
  connectedAiEnabled=false;connectedVoiceEnabled=false;
  $("aiAskButton").disabled=true;
  status("aiAvailability","Connected AI availability could not be checked: "+e.message,"error");
 }
}
async function askAiQuestion(event){
 event.preventDefault();
 if(!connectedAiEnabled){
  status("aiTutorStatus","AI answers are not configured. Use the free curated spoken lessons instead.","error");return;
 }
 if(!$("aiConsent").checked){
  status("aiTutorStatus","Please acknowledge that your question will be sent to the external AI provider.","error");return;
 }
 const question=$("aiQuestion").value.trim();
 if(question.length<3||question.length>500){
  status("aiTutorStatus","Please type a study question of 3–500 characters.","error");return;
 }
 $("aiAskButton").disabled=true;
 stopNarration();
 try{
  const result=await api("/api/v1/ai/ask",{method:"POST",payload:{
   question,topic:$("aiTopic").value,style:$("aiStyle").value
  }});
  if(result.mode!=="GENERATIVE_AI"||typeof result.answer!=="string")throw Error("AI response format was invalid");
  lastAiText=result.answer;
  $("aiAnswer").textContent=lastAiText;
  show("aiAnswerPanel",true);
  $("aiSpeak").disabled=false;
  status("aiTutorStatus","AI-generated study response received. Check important claims against authorised training materials.","success");
  $("aiConsent").checked=false;
 }catch(e){status("aiTutorStatus","Could not get a connected instructor answer: "+e.message,"error");}
 finally{$("aiAskButton").disabled=!connectedAiEnabled}
}
function stopNarration(){
 if(window.speechSynthesis)try{window.speechSynthesis.cancel()}catch{}
 if(activeAudio){activeAudio.pause();activeAudio.src="";activeAudio=null;}
 if(activeAudioUrl){URL.revokeObjectURL(activeAudioUrl);activeAudioUrl=null;}
}
async function playAiVoice(){
 if(!lastAiText)return;
 stopNarration();
 const choice=$("aiVoiceChoice").value;
 if(choice==="device"){
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){
   status("aiTutorStatus","Device speech is unavailable in this browser.","error");return;
  }
  try{
   const utterance=new SpeechSynthesisUtterance(lastAiText.slice(0,1800));
   utterance.lang="en";utterance.rate=1;
   window.speechSynthesis.speak(utterance);
   status("aiTutorStatus","Speaking with a synthetic voice available on your device.");
  }catch(e){status("aiTutorStatus","Device narration could not start.","error")}
  return;
 }
 if(!connectedVoiceEnabled){
  status("aiTutorStatus","Natural generated speech is not configured. Select the device voice instead.","error");return;
 }
 $("aiSpeak").disabled=true;
 try{
  const token=csrfToken();
  if(!token)throw Error("Your secure session token is missing");
  const response=await fetch("/api/v1/ai/voice",{
   method:"POST",credentials:"same-origin",cache:"no-store",
   headers:{"Content-Type":"application/json","X-AGSA-CSRF":token},
   body:JSON.stringify({text:lastAiText.slice(0,700),voice:choice})
  });
  if(!response.ok){
   let detail="Voice service unavailable";
   try{const body=await response.json();detail=body.message||detail}catch{}
   throw Error(detail);
  }
  const blob=await response.blob();
  if(blob.size<32||blob.size>900000)throw Error("Unexpected audio size");
  activeAudioUrl=URL.createObjectURL(blob);
  activeAudio=new Audio(activeAudioUrl);
  activeAudio.onended=()=>{stopNarration();status("aiTutorStatus","AI voice narration completed.")};
  await activeAudio.play();
  status("aiTutorStatus","Playing AI-generated voice (not a human instructor).");
 }catch(e){stopNarration();status("aiTutorStatus","Natural speech could not play: "+e.message,"error");}
 finally{$("aiSpeak").disabled=false}
}
$("aiQuestionForm").addEventListener("submit",askAiQuestion);
$("aiSpeak").addEventListener("click",playAiVoice);
$("aiStop").addEventListener("click",()=>{stopNarration();status("aiTutorStatus","Narration stopped.")});
$("loginForm").addEventListener("submit",signIn);
$("logoutButton").addEventListener("click",signOut);
$("submissionForm").addEventListener("submit",submitPractice);
$("feedbackForm").addEventListener("submit",submitFeedback);
$("refreshStudent").addEventListener("click",refreshStudent);
$("refreshInstructor").addEventListener("click",refreshInstructor);
$("refreshFeedback").addEventListener("click",refreshDrafts);
loadUser();
})();