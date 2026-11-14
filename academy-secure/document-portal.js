/* Academy document administration and student PDF access.
 * Roles are enforced by the private server, not by this presentation file. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
let account=null,layouts=[];
const note=(value,bad=false)=>{const el=$("flash");el.className=bad?"error":"ok";el.textContent=String(value)};
const show=(id,on)=>{$(id).hidden=!on};
async function call(path,method="GET",data){
 const response=await fetch(path,{method,credentials:"same-origin",cache:"no-store",
  headers:{"Accept":"application/json",...(data!==undefined?{"Content-Type":"application/json"}:{})},
  body:data===undefined?undefined:JSON.stringify(data)});
 const body=await response.json().catch(()=>({error:"Unexpected private server response"}));
 if(!response.ok)throw Error(body.error||"Private request refused");
 return body;
}
async function attempt(f){try{await f()}catch(e){note(e.message,true)}}
const amountMinor=major=>{
 const v=String(major).trim();if(!/^(0|[0-9]+)(\.[0-9]{1,2})?$/.test(v))throw Error("Enter a nonnegative monetary amount with two decimals");
 const [integer,decimal=""]=v.split(".");
 const value=BigInt(integer)*100n+BigInt((decimal+"00").slice(0,2));
 if(value>100000000000n)throw Error("Amount exceeds allowed fee");return Number(value);
};
const discountBps=value=>{
 const n=Number(value);if(!Number.isFinite(n)||n<0||n>100||Math.round(n*100)!==n*100)throw Error("Discount must be 0–100% with at most two decimal places");
 return Math.round(n*100);
};
function readForm(id){return Object.fromEntries(new FormData($(id)).entries())}
async function reloadAdmin(){
 if(account?.role!=="accountable_manager")return;
 const [fees,grants,settings]=await Promise.all([
  call("/api/admin/documents/fees"),call("/api/admin/documents/grants"),call("/api/admin/documents/layouts")
 ]);
 layouts=settings.layouts||[];
 $("docFeeRegister").textContent=JSON.stringify(fees.plans.map(p=>({
  id:p.id,type:p.kind,course:p.course_id||"All courses",country:p.country_code,currency:p.currency,
  minorUnits:p.amount_minor,status:p.status
 })),null,2);
 $("docGrantRegister").textContent=JSON.stringify(grants.grants.map(g=>({
  id:g.id,student:g.email,kind:g.kind,course:g.course_id,grantType:g.grant_type,
  status:g.status,balanceMinor:g.payable_minor,currency:g.currency
 })),null,2);
 changeLayout();
}
function changeLayout(){
 const f=$("docLayoutForm"),selected=layouts.find(x=>x.id===$("docAudience").value);
 const defaults={
  FORMAL:"FORMAL_TRADITIONAL",SCOUT:"SCOUT_MODERN",
  ENTHUSIAST:"ENTHUSIAST_NAVY_GOLD",TRANSCRIPT:"FORMAL_TRADITIONAL"
 };
 // The owner approved the three originals. The audience fixes the exact design.
 f.elements.style.value=defaults[$("docAudience").value];
 f.elements.enabled.checked=!!selected?.enabled;
 const fields=["showSeal","showSignature","showCertificateNumber","showCompletionDate",
  "showCourseTitle","showInstructorLine","autoDownload","autoPrint"];
 for(const key of fields)
  f.elements[key].checked=typeof selected?.options?.[key]==="boolean"?selected.options[key]:
   ["showCertificateNumber","showCompletionDate","showCourseTitle"].includes(key);
}
function bind(id,url,payload,after){
 $(id).addEventListener("submit",event=>{
  event.preventDefault();void attempt(async()=>{
   const data=readForm(id),body=payload(data);
   const result=await call(typeof url==="function"?url(data):url,"POST",body);
   note("Saved: "+JSON.stringify(result).slice(0,380));
   if(after)await after();else if(account?.role==="accountable_manager")await reloadAdmin();
  });
 });
}
bind("docFeeForm","/api/admin/documents/fees",data=>({
 kind:data.kind,courseId:data.kind==="CERTIFICATE"?data.courseId.trim():undefined,
 countryCode:data.countryCode.toUpperCase(),currency:data.currency,
 amountMinor:amountMinor(data.majorAmount)
}));
bind("docLayoutForm","/api/admin/documents/layouts",data=>{
 const f=$("docLayoutForm"),options={};
 for(const name of ["showSeal","showSignature","showCertificateNumber","showCompletionDate",
  "showCourseTitle","showInstructorLine","autoDownload","autoPrint"])
  options[name]=f.elements[name].checked;
 options.showQrVerification=false;
 return {audience:data.audience,style:data.style,enabled:f.elements.enabled.checked,options};
});
bind("docAudienceForm","/api/admin/documents/course-audience",data=>({
 courseId:data.courseId.trim(),audience:data.audience
}));
bind("docGrantForm","/api/admin/documents/grants",data=>({
 studentId:data.studentId,kind:data.kind,feePlanId:data.feePlanId,
 completionId:data.kind==="CERTIFICATE"?data.completionId:undefined,
 grantType:data.grantType,discountBps:discountBps(data.discountPercent),reason:data.reason
}));
bind("docPaymentForm",data=>"/api/admin/documents/grants/"+encodeURIComponent(data.grantId)+"/confirm-payment",
 data=>({amountMinor:amountMinor(data.majorAmount),reference:data.reference,
  evidenceSha256:data.evidenceSha256.trim(),notes:data.notes}));
bind("docRevokeForm",data=>"/api/admin/documents/grants/"+encodeURIComponent(data.grantId)+"/revoke",
 data=>({reason:data.reason}));
bind("docIdentityForm","/api/admin/documents/verify-identity",data=>({
 studentId:data.studentId,legalName:data.legalName,evidenceSha256:data.evidenceSha256.trim()
}));
async function reloadStudent(){
 if(account?.role!=="student")return;
 const data=await call("/api/my/documents"),list=$("studentDocumentList");
 list.replaceChildren();
 if(!data.documents.length){list.textContent="No formal certificate or transcript release has been awarded yet.";return}
 for(const grant of data.documents){
  const row=document.createElement("p");row.className="evidence-item";
  const label=document.createElement("span");
  label.textContent=grant.kind+" · "+(grant.course_title||"Combined academic transcript")+
   " · "+grant.status+(grant.status==="PENDING_PAYMENT"?" (release fee pending)":"");
  row.appendChild(label);
  if(grant.status==="ACTIVE"){
   const link=document.createElement("a");
   link.href="/api/my/documents/"+encodeURIComponent(grant.id)+"/download";
   link.download="agsa-"+grant.kind.toLowerCase()+".pdf";
   link.textContent="  Download printable PDF";
   link.style.marginLeft="12px";link.rel="nofollow";
   row.appendChild(link);
   const printable=document.createElement("a");
   printable.href="/api/my/documents/"+encodeURIComponent(grant.id)+"/print";
   printable.target="_blank";
   printable.rel="noopener noreferrer nofollow";
   printable.textContent="  Open for printing";
   printable.style.marginLeft="12px";
   row.appendChild(printable);
  }
  list.appendChild(row);
 }
}
$("docAudience").addEventListener("change",changeLayout);
$("refreshDocumentAdmin").addEventListener("click",()=>void attempt(reloadAdmin));
$("refreshStudentDocuments").addEventListener("click",()=>void attempt(reloadStudent));
document.addEventListener("agsa:session",event=>{
 account=event.detail.user||null;
 show("adminDocumentSettings",account?.role==="accountable_manager");
 show("studentDocuments",account?.role==="student");
 show("docQualityIdentity",account?.role==="quality_manager");
 if(account?.role==="accountable_manager")void attempt(reloadAdmin);
 if(account?.role==="student")void attempt(reloadStudent);
 if(!account){layouts=[];$("studentDocumentList").replaceChildren()}
});
changeLayout();
})();
