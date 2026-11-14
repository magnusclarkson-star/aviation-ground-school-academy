// Device-only Academy learning milestone PDFs. Never official or identity-verified.
import {buildCertificatePdf,certificateFilename} from "./academy-certificate-core.mjs";
import {eligibleModules,eligibleProgramme,prepareSelfStudyAward,INTRO_KEY} from "./academy-certificate-eligibility.mjs";
const $=id=>document.getElementById(id);
const Core=window.AGSACompleteCoursebook,Deep=window.AGSADeepCoursebook;
if(Core&&Deep&&$("certificatesPanel")){
 const PROCESSED="agsa.coursebook.auto-certs.v1";
 const read=key=>{try{return JSON.parse(localStorage.getItem(key)||"[]")}catch{return []}};
 const records=()=>({rawCore:read(INTRO_KEY),rawAdvanced:read(Deep.KEY),rawCapstone:read(Deep.FINAL_KEY)});
 const message=value=>{$("certificateMessage").textContent=value};
 let downloading=false;
 function eligible(){
  const values=records();
  return {modules:eligibleModules(Core,Deep,values.rawCore,values.rawAdvanced),
   programme:eligibleProgramme(Core,Deep,values.rawCore,values.rawAdvanced,values.rawCapstone),...values};
 }
 function refresh(){
  const state=eligible(),select=$("certificateModule"),old=select.value;select.replaceChildren();
  const placeholder=document.createElement("option");
  placeholder.value="";placeholder.textContent=state.modules.length?"Choose completed module":"No module certificate earned yet";
  select.appendChild(placeholder);
  for(const m of state.modules){
   const o=document.createElement("option");o.value=m.id;o.textContent=m.title;select.appendChild(o);
  }
  select.value=state.modules.some(m=>m.id===old)?old:"";
  const selected=state.modules.length>0;
  $("downloadModuleCertificate").disabled=!selected;
  $("printModuleCertificate").disabled=!selected;
  $("downloadProgrammeCertificate").disabled=!state.programme;
  $("printProgrammeCertificate").disabled=!state.programme;
  $("certificateProgress").textContent=state.modules.length+"/12 module certificates available. "+
   (state.programme?"Full foundation self-study milestone achieved.":"The final foundation certificate is unlocked after all module practice goals and the 24-question review.")+
   " These browser records are unverified educational achievements.";
  return state;
 }
 function prep(programme=false,id){
  const state=eligible();
  const name=$("certificateLearnerName").value.trim()||"Academy Learner";
  const record=prepareSelfStudyAward({Core,Deep,id,programme,name,...state,now:new Date().toISOString()});
  record.style="ACADEMY_STANDARD"; // One consistent public PDF design; no user template selection.
  return record;
 }
 function asUrl(record){
  const bytes=buildCertificatePdf(record);
  return URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));
 }
 function download(record){
  const url=asUrl(record),a=document.createElement("a");
  a.href=url;a.download=certificateFilename(record);
  document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),30000);
  message("Certificate PDF download requested. Check your browser Downloads. This is an unsigned self-study achievement.");
 }
 function print(record){
  const url=asUrl(record),frame=document.createElement("iframe");
  frame.style.cssText="position:absolute;width:1px;height:1px;left:-10000px";
  frame.title="Academy self-study certificate print preview";
  frame.onload=()=>{
   try{frame.contentWindow?.focus();frame.contentWindow?.print();
    message("Print requested. Your browser may require permission or a separate print action.");}
   catch{message("Printing was blocked by this browser. Download the PDF and print it from your device.");}
   window.setTimeout(()=>{frame.remove();URL.revokeObjectURL(url)},60000);
  };
  frame.src=url;document.body.appendChild(frame);
 }
 function action(fn){try{fn()}catch(e){message(e.message)}}
 $("downloadModuleCertificate").addEventListener("click",()=>action(()=>download(prep(false,$("certificateModule").value))));
 $("printModuleCertificate").addEventListener("click",()=>action(()=>print(prep(false,$("certificateModule").value))));
 $("downloadProgrammeCertificate").addEventListener("click",()=>action(()=>download(prep(true))));
 $("printProgrammeCertificate").addEventListener("click",()=>action(()=>print(prep(true))));
 function autoNewMilestones(){
  if(downloading)return;
  const state=refresh();
  if(!$("certificateAutoDownload").checked)return;
  const milestones=state.modules.map(m=>"module:"+m.id);
  if(state.programme)milestones.push("programme");
  let previous=[];try{previous=JSON.parse(localStorage.getItem(PROCESSED)||"[]")}catch{}
  const pending=milestones.filter(id=>!previous.includes(id));
  if(!pending.length)return;
  // Never generate more than one automatic download at a time, especially on mobile.
  const first=pending[0];downloading=true;
  try{
   const awarded=first==="programme"?prep(true):prep(false,first.slice(7));
   download(awarded);
   const next=[...new Set([...previous,first])].slice(-100);
   try{localStorage.setItem(PROCESSED,JSON.stringify(next))}catch{}
   if($("certificateAutoPrint").checked)print(awarded);
  }catch(e){message("Certificate not generated: "+e.message)}
  finally{downloading=false}
 }
 // Synchronously triggered after a user-initiated practice submission.
 for(const event of ["agsa:coursebook-core-checked","agsa:coursebook-advanced-checked","agsa:coursebook-capstone-checked"])
  document.addEventListener(event,autoNewMilestones);
 document.addEventListener("agsa:coursebook-module",refresh);
 document.addEventListener("agsa:coursebook-cleared",()=>{
  try{localStorage.removeItem(PROCESSED)}catch{}
  refresh();
 });
 $("certificateAutoDownload").addEventListener("change",refresh);
 // Initial loading shows earned PDFs but does not unexpectedly download old awards.
 refresh();
}
