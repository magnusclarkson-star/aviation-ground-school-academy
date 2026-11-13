/* Private Academy tuition controls — admin-only UI, all enforcement is server-side.
   No payment is collected here; only externally verified settlements are attested. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
let user=null,plans=[],grants=[],students=[];
const clean=(tag,txt)=>{const el=document.createElement(tag);el.textContent=String(txt);return el};
function show(id,on){$(id).hidden=!on}
function message(msg,error=false){const el=$("flash");el.className=error?"error":"ok";el.textContent=String(msg)}
async function api(path,method="GET",data){
 const res=await fetch(path,{method,credentials:"same-origin",cache:"no-store",
  headers:{Accept:"application/json",...(data!==undefined?{"Content-Type":"application/json"}:{})},
  body:data!==undefined?JSON.stringify(data):undefined});
 const result=await res.json().catch(()=>({error:"Private server response unavailable"}));
 if(!res.ok)throw Error(result.error||"The private server rejected this request");
 return result;
}
const minor=value=>BigInt(String(value));
function money(minorValue,currency){
 const n=minor(minorValue),neg=n<0n?"-":"",positive=n<0n?-n:n;
 return neg+(currency||"")+" "+(positive/100n).toString()+"."+String(positive%100n).padStart(2,"0");
}
function amountMinor(value){
 const v=String(value||"").trim();
 if(!/^(0|[0-9]+)(\.[0-9]{1,2})?$/.test(v))throw Error("Enter a non-negative fee with at most two decimal places");
 const [main,decimal=""]=v.split(".");
 const n=BigInt(main)*100n+BigInt((decimal+"00").slice(0,2));
 if(n>100000000000n)throw Error("Amount exceeds supported tuition limits");
 return Number(n);
}
function percentageBps(value){
 const v=String(value??"").trim();
 if(!/^(0|[0-9]{1,3})(\.[0-9]{1,2})?$/.test(v))throw Error("Enter a discount between 0 and 100 with at most 2 decimal places");
 const [main,decimal=""]=v.split(".");
 const n=Number(main)*100+Number((decimal+"00").slice(0,2));
 if(n<0||n>10000)throw Error("Discount must be between 0% and 100%");
 return n;
}
function selectOptions(id,options,placeholder){
 const root=$(id),previous=root.value;root.replaceChildren();
 const choose=document.createElement("option");choose.value="";choose.disabled=true;choose.textContent=placeholder;root.appendChild(choose);
 options.forEach(item=>{const o=document.createElement("option");o.value=item.value;o.textContent=item.label;root.appendChild(o)});
 root.value=options.some(x=>x.value===previous)?previous:"";
 if(!root.value)root.selectedIndex=0;
}
function describeGrant(g){
 const paid=money(g.payable_minor,g.currency),gross=money(g.gross_minor,g.currency);
 const expiry=g.expires_at?new Date(g.expires_at).toLocaleDateString():"No automatic end";
 return (g.student_email||"You")+" · "+g.course_title+" · "+g.grant_type+" ("+g.discount_bps/100+"% off) · "+
   gross+" list / "+paid+" due · "+g.status+" · "+expiry;
}
function renderFinance(){
 const current=plans.filter(x=>x.status==="ACTIVE"),toSelect=current.map(p=>({value:p.id,
  label:p.course_title+" · "+p.country_code+" · "+money(p.amount_minor,p.currency)+" · "+p.billing_period}));
 selectOptions("grantPlanSelect",toSelect,"Select active fee plan");
 selectOptions("grantStudentSelect",students.filter(x=>x.active&&x.adult_confirmed).map(x=>({
  value:x.id,label:x.email+" · "+x.id.slice(0,8)
 })),"Select eligible adult student");
 const fees=$("feePlanList");fees.replaceChildren();
 if(!plans.length)fees.appendChild(clean("p","No private course prices have been configured."));
 plans.forEach(p=>{
  const card=clean("div",(p.status==="ACTIVE"?"Active":"Past")+" · "+p.course_title+" ["+p.course_id+
   "] · "+p.country_code+" · "+money(p.amount_minor,p.currency)+" · "+p.billing_period);
  card.className="evidence-item";fees.appendChild(card);
 });
 const box=$("grantList");box.replaceChildren();
 if(!grants.length)box.appendChild(clean("p","No scholarships or access grants have been awarded."));
 grants.forEach(g=>{const row=clean("div",describeGrant(g));row.className="evidence-item";box.appendChild(row)});
 selectOptions("pendingGrantSelect",grants.filter(g=>g.status==="PENDING_PAYMENT").map(g=>({
  value:g.id,label:describeGrant(g)
 })),"Select grant awaiting settlement");
 selectOptions("revokeGrantSelect",grants.filter(g=>["ACTIVE","PENDING_PAYMENT"].includes(g.status)).map(g=>({
  value:g.id,label:describeGrant(g)
 })),"Select an active or pending grant");
 previewGrant();
}
function previewGrant(){
 const p=plans.find(x=>x.id===$("grantPlanSelect").value),type=$("grantType").value;
 const info=$("grantPreview");
 if(!p){info.textContent="Choose an active country/currency fee plan to preview the scholarship and balance.";return}
 try{
  const bps=percentageBps($("grantPercent").value);
  const gross=minor(p.amount_minor),discount=(gross*BigInt(bps)+5000n)/10000n;
  const due=gross-discount;
  info.textContent="Course: "+p.course_title+" · "+p.country_code+" · "+p.billing_period+
   " · Regular fee "+money(gross,p.currency)+" · Scholarship/discount "+money(discount,p.currency)+
   " · Balance "+money(due,p.currency)+
   (due===0n?" · Access active immediately after administrator award.":" · Access held until manual payment confirmation.");
  if(type==="PAID"&&bps!==0)info.textContent+=" Paid places require 0% discount.";
  if(type==="FREE"&&gross!==0n)info.textContent+=" FREE grants require a zero-price plan.";
 }catch(e){info.textContent=e.message}
}
function setDiscountByType(){
 const type=$("grantType").value;
 const input=$("grantPercent");
 if(type==="PAID"){input.value="0";input.readOnly=true}
 else if(type==="WAIVER"||type==="FREE"){input.value="100";input.readOnly=true}
 else{input.readOnly=false;input.value=type==="SCHOLARSHIP"?"100":"25"}
 previewGrant();
}
async function refreshFinance(){
 if(user?.role!=="accountable_manager")return;
 const [feeData,grantData,studentData]=await Promise.all([
  api("/api/admin/fees"),api("/api/admin/grants"),api("/api/admin/students")
 ]);
 plans=feeData.plans;grants=grantData.grants;students=studentData.students;renderFinance();
}
async function refreshStudent(){
 if(user?.role!=="student")return;
 const data=await api("/api/my/access"),box=$("myAccessList");box.replaceChildren();
 const owned=data.accessGrants,active=owned.filter(g=>g.status==="ACTIVE"&&
  (!g.expires_at||new Date(g.expires_at).getTime()>Date.now()));
 $("myAccessStatus").textContent=active.length+" active private course place(s). Administrator scholarships and access changes are reflected here; financial access does not confer an official qualification.";
 if(!owned.length)box.appendChild(clean("p","No administrator-controlled place is currently assigned to this account."));
 owned.forEach(g=>{
  const row=document.createElement("section");row.className="evidence-item";
  row.appendChild(clean("p",describeGrant(g)));
  if(active.some(x=>x.id===g.id)){
   const button=clean("button","Check private learning access");
   button.type="button";
   button.addEventListener("click",()=>void task(async()=>{
    const r=await api("/api/my/courses/"+encodeURIComponent(g.course_id)+"/access");
    message(r.course.title+" · "+r.course.revision+" — "+r.contentAccess+
      ". Access alone never awards formal training credit.");
   }));
   row.appendChild(button);
  }
  box.appendChild(row);
 });
}
async function task(fn){
 try{await fn()}catch(e){message(e.message,true)}
}
function registerForm(id,fn){
 $(id).addEventListener("submit",e=>{e.preventDefault();void task(async()=>{
  const data=Object.fromEntries(new FormData($(id)).entries());
  const response=await fn(data);
  message(id+" saved: "+JSON.stringify(response));
  await refreshFinance();
 })});
}
registerForm("feeForm",async d=>api("/api/admin/fees","POST",{
 courseId:d.courseId.trim(),countryCode:String(d.countryCode).toUpperCase(),
 currency:d.currency,billingPeriod:d.billingPeriod,amountMinor:amountMinor(d.amountMajor)
}));
registerForm("grantForm",async d=>{
 const discountBps=percentageBps(d.discountPercent);
 const result=await api("/api/admin/grants","POST",{
  studentId:d.studentId,planId:d.planId,grantType:d.grantType,discountBps,reason:d.reason
 });
 $("grantForm").reset();setDiscountByType();return result;
});
registerForm("confirmPaymentForm",async d=>{
 let evidenceSha256=String(d.evidenceSha256||"").trim();
 const file=$("paymentReceiptFile").files?.[0];
 if(file){
  if(file.size>8*1024*1024)throw Error("For this demonstration, receipt documents must be no larger than 8 MB");
  if(!["application/pdf","image/png","image/jpeg"].includes(file.type))throw Error("Use a PDF, PNG or JPEG receipt");
  if(!window.crypto?.subtle)throw Error("A secure browser context is required to fingerprint a receipt");
  const digest=await window.crypto.subtle.digest("SHA-256",await file.arrayBuffer());
  evidenceSha256=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
 }
 if(!/^[a-f0-9]{64}$/i.test(evidenceSha256))throw Error("Provide a 64-character receipt SHA-256 or select a receipt file");
 const selected=grants.find(g=>g.id===d.grantId);
 if(!selected)throw Error("Select a pending grant");
 const balance=amountMinor(d.amountMajor);
 if(BigInt(balance)!==BigInt(selected.payable_minor))throw Error("The confirmed amount must exactly equal the outstanding balance: "+money(selected.payable_minor,selected.currency));
 const response=await api("/api/admin/grants/"+encodeURIComponent(d.grantId)+"/confirm-payment","POST",{
  amountMinor:balance,reference:d.reference,evidenceSha256,notes:d.notes
 });
 $("confirmPaymentForm").reset();return response;
});
registerForm("revokeGrantForm",async d=>{
 if(!window.confirm("Revoke this learner's private course access? Historical academic and payment records remain."))throw Error("Revocation cancelled");
 const response=await api("/api/admin/grants/"+encodeURIComponent(d.grantId)+"/revoke","POST",{reason:d.reason});
 $("revokeGrantForm").reset();return response;
});
$("grantType").addEventListener("change",setDiscountByType);
$("grantPercent").addEventListener("input",previewGrant);
$("grantPlanSelect").addEventListener("change",previewGrant);
$("refreshFinance").addEventListener("click",()=>void task(refreshFinance));
$("refreshMyAccess").addEventListener("click",()=>void task(refreshStudent));
document.addEventListener("agsa:session",event=>{
 user=event.detail.user||null;
 show("ownerFinance",user?.role==="accountable_manager");
 show("myAccessPanel",user?.role==="student");
 if(user?.role==="accountable_manager")void task(refreshFinance);
 if(user?.role==="student")void task(refreshStudent);
 if(!user){plans=[];grants=[];students=[];$("feePlanList").replaceChildren();$("grantList").replaceChildren();$("myAccessList").replaceChildren()}
});
setDiscountByType();
})();
