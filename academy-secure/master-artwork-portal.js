// Admin-only exact certificate master artwork upload. The browser does not
// manipulate or re-encode original PNGs; server compares SHA-256 to owner selection.
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const controls={
 FORMAL_TRADITIONAL:{id:"artworkFormal",file:"formal-traditional-burgundy.png"},
 SCOUT_MODERN:{id:"artworkScout",file:"scouts-modern-aviation.png"},
 ENTHUSIAST_NAVY_GOLD:{id:"artworkEnthusiast",file:"enthusiast-navy-gold.png"}
};
let role=null;
const status=message=>{$("masterArtworkStatus").textContent=message};
async function refresh(){
 if(role!=="accountable_manager")return;
 try{
  const response=await fetch("/api/admin/certificate-master/status",{cache:"no-store",credentials:"same-origin"});
  const body=await response.json();
  if(!response.ok)throw Error(body.error||"Cannot read original artwork status");
  const lines=body.originalMasters.map(item=>item.filename+" — "+(item.installed?"Original installed ✓":"Not installed"));
  status(lines.join(" | ")+(body.allInstalled?" | All 3 approved designs ready.":" | Printing an uninstalled style is disabled."));
 }catch(e){status("Artwork check failed: "+e.message)}
}
async function upload(style){
 const slot=controls[style];if(role!=="accountable_manager"||!slot)return;
 const file=$(slot.id).files?.[0];
 if(!file){status("Select the original "+slot.file+" PNG first.");return}
 if(file.type!=="image/png"||file.size<50000||file.size>6000000){
  status("Only the original PNG between 50 KB and 6 MB is supported.");return
 }
 try{
  status("Checking and storing original "+slot.file+"…");
  const response=await fetch("/api/admin/certificate-master/"+style,{
   method:"POST",headers:{"Content-Type":"image/png"},credentials:"same-origin",
   cache:"no-store",body:file
  });
  const data=await response.json();
  if(!response.ok)throw Error(data.error||"Original artwork upload rejected");
  if(!data.originalMasterStored)throw Error("No original artwork storage confirmation");
  $(slot.id).value="";
  await refresh();
 }catch(e){status("Artwork not stored: "+e.message)}
}
document.querySelectorAll("[data-artwork-upload]").forEach(button=>{
 button.addEventListener("click",()=>void upload(button.dataset.artworkUpload))
});
$("refreshMasterArtwork").addEventListener("click",()=>void refresh());
document.addEventListener("agsa:session",event=>{
 role=event.detail.user?.role||null;
 if(role==="accountable_manager")void refresh();
 else status("Sign in as the Academy administrator to configure original certificate artwork.");
});
})();
