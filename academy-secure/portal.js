/* Private same-origin Academy records console; authorisation is always enforced by server roles. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
let actor=null;
const show=(id,yes)=>{$(id).hidden=!yes};
const say=(message,error=false)=>{const el=$("flash");el.className=error?"error":"ok";el.textContent=String(message)};
const object=record=>JSON.stringify(record,null,2);
async function call(path,{method="GET",data}={}){
 const options={method,credentials:"same-origin",cache:"no-store",headers:{"Accept":"application/json"}};
 if(data!==undefined){options.headers["Content-Type"]="application/json";options.body=JSON.stringify(data)}
 const response=await fetch(path,options);
 const result=await response.json().catch(()=>({error:"Unexpected server response"}));
 if(!response.ok)throw new Error(result.error||"Request rejected by private server");
 return result;
}
async function refreshStatus(){
 try{
  const status=await call("/api/public/approval");
  $("authorityStatus").textContent="Authority status: "+status.authorityStatus+". No official accreditation is claimed by this website.";
 }catch{$("authorityStatus").textContent="Authority status could not be verified; no official status should be assumed."}
}
async function records(){
 try{
  const [enrolments,assessments,completions]=await Promise.all([
   call("/api/my/enrolments"),call("/api/my/assessments"),call("/api/my/completions")]);
  $("myEnrolments").textContent=object(enrolments.enrolments);
  $("myAssessments").textContent=object(assessments.assessmentRecords);
  $("myCompletions").textContent=object(completions.courseCompletions);
 }catch(e){say(e.message,true)}
}
async function readiness(){
 if(!actor||!["accountable_manager","head_of_training","quality_manager"].includes(actor.role))return;
 try{
  const [state,register]=await Promise.all([call("/api/admin/readiness"),call("/api/authority/register")]);
  $("readiness").textContent="Internally recorded approvals: "+object(state.schoolDocumentChecks)+
   "\nSchool operations gate: "+(state.schoolApprovedForOperationsInApp?"Open on internally attested documents; independently verify with SLCAA":"Closed")+
   "\nCourse revisions: "+state.courses.length;
  $("evidenceList").replaceChildren();
  register.evidence.forEach(item=>{
   const row=document.createElement("div");row.className="evidence-item";
   row.textContent=item.type+" · "+item.scope+" · "+item.reference+" · "+item.status+" · "+item.id;
   $("evidenceList").appendChild(row);
  });
 }catch(e){say(e.message,true)}
}
function activeUi(){
 const role=actor?.role;
 show("authPanel",!actor);show("dashboard",!!actor);
 $("sessionBadge").textContent=actor?actor.email+" · "+role:"Not signed in";
 if(!actor)return;
 $("myRole").textContent=role;
 const staff=role!=="student";show("staffDashboard",staff);
 const permitted={
  inviteForm:["accountable_manager","head_of_training"],
  evidenceForm:["accountable_manager","head_of_training"],
  reviewEvidenceForm:["quality_manager"],
  revokeEvidenceForm:["quality_manager"],
  disableAccountForm:["accountable_manager"],
  courseForm:["accountable_manager","head_of_training"],
  stageForm:["head_of_training"],
  courseReviewForm:["quality_manager"],
  enrolForm:["head_of_training"],
  trainingForm:["instructor"],
  examForm:["examiner"],
  completionForm:["head_of_training"],
  attestForm:["quality_manager"]
 };
 for(const [id,roles] of Object.entries(permitted))show(id,roles.includes(role));
 // A privileged account may only be invited by an accountable manager.
 for(const option of $("inviteForm").querySelectorAll('option')){
  if(!["student","instructor"].includes(option.value))option.disabled=role!=="accountable_manager";
 }
 if(["quality_manager","head_of_training","accountable_manager"].includes(role))void readiness();
 void records();
}
async function identify(){
 try{const data=await call("/api/me");actor=data.user}
 catch{actor=null}
 activeUi();
}
async function action(fn){
 try{await fn()}catch(e){say(e.message,true)}
}
function wireForm(id,path,mapper){
 const form=$(id);
 form.addEventListener("submit",event=>{event.preventDefault();void action(async()=>{
  const fd=Object.fromEntries(new FormData(form).entries());
  const request=mapper?mapper(fd):fd;
  const target=typeof path==="function"?path(request):path;
  const result=await call(target,{method:"POST",data:request});
  say(id+" accepted: "+JSON.stringify(result));
  form.reset();
  if(id==="inviteForm")$("invitationResult").textContent="One-use invitation secret: "+result.inviteToken+"\nShare privately. This token will not be displayed again.";
  if(["evidenceForm","reviewEvidenceForm","courseForm","courseReviewForm"].includes(id))await readiness();
  await refreshStatus();
 })});
}
$("loginForm").addEventListener("submit",event=>{
 event.preventDefault();void action(async()=>{
  await call("/api/login",{method:"POST",data:{email:$("loginEmail").value,password:$("loginPassword").value}});
  $("loginPassword").value="";say("Sign-in accepted.");await identify();
 });
});
$("activateForm").addEventListener("submit",event=>{
 event.preventDefault();void action(async()=>{
  await call("/api/activate",{method:"POST",data:{email:$("activateEmail").value,token:$("activateToken").value,
   password:$("activatePassword").value,adultConfirmed:$("adultConfirm").checked}});
  $("activateForm").reset();say("Invitation accepted. Sign in with your new password.");
 });
});
$("logout").addEventListener("click",()=>void action(async()=>{
 await call("/api/logout",{method:"POST",data:{}});actor=null;activeUi();say("Signed out.");
}));
$("refreshRecords").addEventListener("click",()=>void records());
$("refreshReadiness").addEventListener("click",()=>void readiness());
wireForm("inviteForm","/api/invitations",fd=>({...fd,adultOnly:fd.role==="student"}));
wireForm("evidenceForm","/api/authority/evidence",fd=>({...fd,effectiveFrom:fd.effectiveFrom+"T00:00:00Z",
 effectiveUntil:fd.effectiveUntil?fd.effectiveUntil+"T00:00:00Z":null}));
wireForm("reviewEvidenceForm",fd=>"/api/authority/evidence/"+encodeURIComponent(fd.id)+"/review",
 fd=>({decision:fd.decision,reviewNotes:fd.reviewNotes,id:fd.id}));
wireForm("revokeEvidenceForm",fd=>"/api/authority/evidence/"+encodeURIComponent(fd.id)+"/revoke",
 fd=>({id:fd.id,reason:fd.reason}));
wireForm("disableAccountForm",fd=>"/api/admin/users/"+encodeURIComponent(fd.id)+"/disable",
 fd=>({id:fd.id,reason:fd.reason}));
wireForm("courseForm","/api/courses",fd=>({...fd,minutesPlanned:Number(fd.minutesPlanned)}));
wireForm("stageForm",fd=>"/api/courses/"+encodeURIComponent(fd.courseId)+"/stages",
 fd=>({courseId:fd.courseId,stageKey:fd.stageKey,standard:fd.standard}));
wireForm("courseReviewForm",fd=>"/api/courses/"+encodeURIComponent(fd.courseId)+"/review");
wireForm("enrolForm","/api/enrolments");
wireForm("trainingForm",fd=>"/api/enrolments/"+encodeURIComponent(fd.enrolmentId)+"/stages");
wireForm("examForm","/api/assessments");
wireForm("completionForm","/api/completion-requests");
wireForm("attestForm",fd=>"/api/completion-requests/"+encodeURIComponent(fd.requestId)+"/attest",
 fd=>({requestId:fd.requestId,confirmDocumentsChecked:fd.confirmDocumentsChecked==="on",
  confirmStagesChecked:fd.confirmStagesChecked==="on"}));
void refreshStatus();void identify();
})();
