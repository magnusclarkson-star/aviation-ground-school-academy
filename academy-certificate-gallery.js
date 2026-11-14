/* Always-visible standard Academy specimen. No uploads, fingerprint checks,
   client storage, personal data or template picker are required. */
(()=>{
 "use strict";
 const button=document.getElementById("printStandard");
 const sample=document.getElementById("academyStandard");
 if(!button||!sample)return;
 button.addEventListener("click",()=>{
  document.body.dataset.printStyle="formal";
  window.print();
 });
 window.addEventListener("afterprint",()=>document.body.removeAttribute("data-print-style"));
})();
