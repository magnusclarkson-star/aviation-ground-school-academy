/* Academy private admin signature capture. Never write PNG, password or
 * decrypted signature to localStorage, a URL, a log or public GitHub files.
 */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const canvas=$("signaturePad"),context=canvas.getContext("2d",{willReadFrequently:false});
let owner=null,hasInk=false,activePointer=null,previewUrl=null,stored=false;
context.strokeStyle="#163E60";context.fillStyle="#163E60";
context.lineWidth=4;context.lineCap="round";context.lineJoin="round";
const checks={
 formalCertificates:"sigFormal",
 scoutCertificates:"sigScouts",
 enthusiastCertificates:"sigEnthusiast",
 transcripts:"sigTranscript",
 academySeal:"sigSeal"
};
function status(message){$("signatureStatus").textContent=message}
function allPreferences(){return Object.fromEntries(Object.entries(checks).map(([key,id])=>[key,$(id).checked]))}
function readPreferences(prefs){for(const [key,id] of Object.entries(checks))$(id).checked=prefs?.[key]===true}
function clearPreview(){
 if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}
 $("savedSignaturePreview").removeAttribute("src");$("savedSignaturePreview").hidden=true;
 $("savedSignatureEmpty").hidden=false;
}
function clearDrawing(){context.clearRect(0,0,canvas.width,canvas.height);hasInk=false;activePointer=null}
function coords(event){const r=canvas.getBoundingClientRect();return {
 x:Math.max(0,Math.min(canvas.width,(event.clientX-r.left)*canvas.width/r.width)),
 y:Math.max(0,Math.min(canvas.height,(event.clientY-r.top)*canvas.height/r.height))
}}
canvas.addEventListener("pointerdown",event=>{
 if(!owner||event.isPrimary===false||activePointer!==null)return;
 event.preventDefault();activePointer=event.pointerId;
 canvas.setPointerCapture?.(event.pointerId);
 const p=coords(event);context.beginPath();context.arc(p.x,p.y,2,0,Math.PI*2);context.fill();
 context.beginPath();context.moveTo(p.x,p.y);hasInk=true;
});
canvas.addEventListener("pointermove",event=>{
 if(activePointer!==event.pointerId)return;event.preventDefault();
 const p=coords(event);context.lineTo(p.x,p.y);context.stroke();
 context.beginPath();context.moveTo(p.x,p.y);
});
function stopDrawing(event){
 if(activePointer!==event.pointerId)return;
 event.preventDefault();activePointer=null;
 try{canvas.releasePointerCapture?.(event.pointerId)}catch{}
}
canvas.addEventListener("pointerup",stopDrawing);
canvas.addEventListener("pointercancel",stopDrawing);
canvas.addEventListener("lostpointercapture",()=>{activePointer=null});
$("clearSignaturePad").addEventListener("click",clearDrawing);
$("signatureUpload").addEventListener("change",async()=>{
 const file=$("signatureUpload").files?.[0];if(!file)return;
 try{
  if(!["image/png","image/jpeg"].includes(file.type)||file.size>3*1024*1024)
   throw Error("Select a PNG or JPEG image smaller than 3 MB");
  let image;
  if(typeof createImageBitmap==="function"){
   image=await createImageBitmap(file);
  }else{
   image=await new Promise((resolve,reject)=>{
    const item=new Image(),url=URL.createObjectURL(file);
    item.onload=()=>{URL.revokeObjectURL(url);resolve(item)};
    item.onerror=()=>{URL.revokeObjectURL(url);reject(Error("Image cannot be opened"))};
    item.src=url;
   });
  }
  const w=image.width||image.naturalWidth,h=image.height||image.naturalHeight;
  if(!w||!h||w*h>10000000)throw Error("Signature image dimensions are unsupported");
  clearDrawing();const scale=Math.min((canvas.width-45)/w,(canvas.height-35)/h);
  const dw=Math.round(w*scale),dh=Math.round(h*scale);
  context.drawImage(image,(canvas.width-dw)/2,(canvas.height-dh)/2,dw,dh);
  image.close?.();hasInk=true;
  status("Signature image prepared locally. Confirm your password and choose Save to store it privately.");
 }catch(e){status(e.message)}finally{$("signatureUpload").value=""}
});
async function request(path,{method="GET",payload,image=false}={}){
 const res=await fetch(path,{method,credentials:"same-origin",cache:"no-store",
  headers:{Accept:image?"image/png":"application/json",...(payload?{"Content-Type":"application/json"}:{})},
  body:payload?JSON.stringify(payload):undefined});
 if(image){
  if(!res.ok)throw Error("The private saved signature cannot be viewed");
  const blob=await res.blob();
  if(blob.type!=="image/png"||blob.size>145000)throw Error("Unexpected private image response");
  return blob;
 }
 const data=await res.json().catch(()=>({error:"Unexpected secure server response"}));
 if(!res.ok)throw Error(data.error||"Administrator signature request rejected");
 return data;
}
async function refresh(){
 if(!owner)return;
 const data=await request("/api/admin/signature");
 stored=data.stored;
 readPreferences(data.preferences);
 status(data.stored?"Encrypted signature saved (fingerprint "+String(data.fingerprint).slice(0,14)+"…). Last change: "+
  new Date(data.changedAt).toLocaleString()+". No document has been signed automatically.":
  "No administrator signature has been saved yet. Draw or upload your own signature to begin.");
 if(!data.encryptionConfigured)status("Private storage is not configured: the host must provide a dedicated secret encryption key before any signature can be saved.");
 $("previewSignature").disabled=!data.stored;
 $("saveSignaturePreferences").disabled=!data.stored;
 $("removeSignature").disabled=!data.stored;
 $("saveSignature").disabled=!data.encryptionConfigured;
 if(!data.stored)clearPreview();
}
async function action(fn){
 try{await fn()}catch(e){status(e.message)}
 finally{$("signatureConfirmPassword").value=""}
}
function confirmPassword(){
 const password=$("signatureConfirmPassword").value;
 if(password.length<12||password.length>200)throw Error("Enter your current administrator password to confirm this sensitive action");
 return password;
}
function requireOwnerConsent(){
 if(!$("signatureOwnerConsent").checked)throw Error("Tick the confirmation that this is your genuine signature and you authorise its selected uses");
}
$("saveSignature").addEventListener("click",()=>void action(async()=>{
 if(!owner)throw Error("Sign in as the Academy administrator");
 if(!hasInk)throw Error("Draw your signature first or upload your existing signature image");
 requireOwnerConsent();
 const password=confirmPassword();
 const encoded=canvas.toDataURL("image/png").split(",")[1];
 if(!encoded||encoded.length>196000)throw Error("Signature is too large. Use a simpler stroke or crop the uploaded image");
 const saved=await request("/api/admin/signature",{method:"POST",payload:{
  pngBase64:encoded,preferences:allPreferences(),confirmPassword:password,confirmOwnSignature:true
 }});
 status("Signature stored securely. No certificate, transcript or public file was signed. Fingerprint "+saved.fingerprint.slice(0,14)+"…");
 clearDrawing();clearPreview();stored=true;await refresh();
}));
$("saveSignaturePreferences").addEventListener("click",()=>void action(async()=>{
 if(!stored)throw Error("Store your signature first");
 requireOwnerConsent();
 await request("/api/admin/signature/preferences",{method:"POST",payload:{
  preferences:allPreferences(),confirmPassword:confirmPassword()
 }});
 status("Use permissions updated. Each actual document still needs its own authorised release.");
 await refresh();
}));
$("removeSignature").addEventListener("click",()=>void action(async()=>{
 if(!stored)throw Error("No signature is stored");
 if(!confirm("Permanently remove the encrypted signature from the Academy's active database? Existing issued documents are unchanged."))return;
 await request("/api/admin/signature",{method:"DELETE",payload:{confirmRemove:true,confirmPassword:confirmPassword()}});
 clearDrawing();clearPreview();readPreferences(null);stored=false;
 $("signatureOwnerConsent").checked=false;
 status("Encrypted signature removed from the private active database. Check backup retention with your hosting provider.");
 await refresh();
}));
$("previewSignature").addEventListener("click",()=>void action(async()=>{
 if(!stored)throw Error("No saved signature exists");
 const blob=await request("/api/admin/signature/preview",{image:true});
 clearPreview();previewUrl=URL.createObjectURL(blob);
 $("savedSignaturePreview").src=previewUrl;$("savedSignaturePreview").hidden=false;
 $("savedSignatureEmpty").hidden=true;
 status("Private signature preview opened for the signed-in administrator only.");
}));
$("refreshSignature").addEventListener("click",()=>void action(refresh));
document.addEventListener("agsa:session",event=>{
 owner=event.detail.user?.role==="accountable_manager"?event.detail.user:null;
 $("adminSignaturePanel").hidden=!owner;
 if(!owner){
  clearDrawing();clearPreview();stored=false;readPreferences(null);
  $("signatureConfirmPassword").value="";
  $("signatureOwnerConsent").checked=false;return;
 }
 void action(refresh);
});
})();
