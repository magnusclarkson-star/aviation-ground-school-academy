/* Original owner-approved visual previews only.
 * The earlier approximate CSS redrawing is hidden. A source PNG can be shown
 * only if it exactly matches the owner's original SHA-256 fingerprint.
 * Local previews never upload signature or student data to a server.
 */
(()=>{
"use strict";
const source={
 formal:{style:"FORMAL_TRADITIONAL",filename:"formal-traditional-burgundy.png",sha:"6050a0603674d7b5e402c0c21b477ef76b04b107e6abc61c13a314978d5f7986"},
 scout:{style:"SCOUT_MODERN",filename:"scouts-modern-aviation.png",sha:"e5a3fe35698e9637a37ffb24218ee1fbf79074e0232d0e93199eca7ccf8d98c9"},
 enthusiast:{style:"ENTHUSIAST_NAVY_GOLD",filename:"enthusiast-navy-gold.png",sha:"03de002823c75cbe8f7a93ad756bd7361f51f51287f4f8ecb1ccc93c5d4e8be1"}
};
const urls=new Map(),verify=(blob)=>window.crypto.subtle.digest("SHA-256",blob);
function store(){
 return new Promise((resolve,reject)=>{
  if(!("indexedDB" in window))return reject(Error("Browser storage is unavailable"));
  const req=indexedDB.open("agsa-original-certificate-artwork-v1",1);
  req.onupgradeneeded=()=>req.result.createObjectStore("masters");
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error("Local artwork storage unavailable"));
 });
}
async function save(style,blob){
 const db=await store();
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction("masters","readwrite");
  tx.objectStore("masters").put(blob,style);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 })}finally{db.close()}
}
async function load(style){
 const db=await store();
 try{return await new Promise((resolve,reject)=>{
  const req=db.transaction("masters","readonly").objectStore("masters").get(style);
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 })}finally{db.close()}
}
async function verifyImage(file,meta){
 if(!file||file.type!=="image/png"||file.size<50000||file.size>6000000)
  throw Error("Select the unmodified original PNG, 50 KB to 6 MB");
 if(!window.crypto?.subtle)throw Error("Secure browser context is required for original artwork verification");
 const hash=Array.from(new Uint8Array(await verify(await file.arrayBuffer())),x=>x.toString(16).padStart(2,"0")).join("");
 if(hash!==meta.sha)throw Error("This file is not the exact approved original. No substitute will be displayed.");
 return file;
}
function render(name,blob,view,button){
 const previous=urls.get(name);if(previous)URL.revokeObjectURL(previous);
 const url=URL.createObjectURL(blob);urls.set(name,url);
 view.replaceChildren();
 const img=document.createElement("img");
 img.src=url;img.alt="Exact original approved "+source[name].style+" certificate artwork, with a SAMPLE NOT ISSUED preview overlay";
 img.loading="lazy";img.className="approved-master-art";
 view.appendChild(img);
 const stamp=document.createElement("span");stamp.className="sample-watermark";
 stamp.textContent="SAMPLE · NOT ISSUED";view.appendChild(stamp);
 button.disabled=false;
}
async function configure(name){
 const meta=source[name],card=document.querySelector('[data-sample="'+name+'"]');
 if(!card)return;
 const wrap=card.querySelector(".sheet-wrap"),btn=card.querySelector("[data-print]");
 const holder=document.createElement("div");holder.className="master-local-picker";
 const caption=document.createElement("p");caption.textContent="Exact original image only ("+meta.filename+")";
 const input=document.createElement("input");input.type="file";input.accept=".png,image/png";
 input.setAttribute("aria-label","Choose approved original "+name+" PNG");
 const status=document.createElement("p");status.role="status";
 const view=document.createElement("div");view.className="exact-master-preview";
 holder.append(caption,input,status,view);wrap.prepend(holder);
 btn.disabled=true;status.textContent="Original master not loaded on this device. The old simplified drawing is intentionally hidden.";
 input.addEventListener("change",async()=>{
  const file=input.files?.[0];if(!file)return;
  try{
   await verifyImage(file,meta);render(name,file,view,btn);
   status.textContent="Verified exact original image. Ready for specimen printing.";
   try{await save(meta.style,file);status.textContent+=" Saved only in this browser."}
   catch{status.textContent+=" Browser storage disabled; select it again next visit."}
  }catch(e){status.textContent=e.message;btn.disabled=true}
 });
 try{
  const cached=await load(meta.style);
  if(cached){await verifyImage(cached,meta);render(name,cached,view,btn);
   status.textContent="Verified original image restored from local browser storage."}
 }catch{}
 btn.addEventListener("click",()=>{
  if(btn.disabled)return;
  document.body.dataset.printStyle=name;
  window.print();
 });
}
document.querySelectorAll(".certificate").forEach(el=>el.hidden=true);
document.querySelectorAll(".switches").forEach(el=>el.hidden=true);
document.addEventListener("DOMContentLoaded",()=>{});
for(const name of Object.keys(source))void configure(name);
window.addEventListener("afterprint",()=>document.body.removeAttribute("data-print-style"));
window.addEventListener("pagehide",()=>{for(const u of urls.values())URL.revokeObjectURL(u)});
})();
