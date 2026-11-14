/* Display the owner's exact approved PNG masters, reconstructed from their
   unmodified base64 transport segments. Never redraw or substitute artwork. */
(()=>{
"use strict";
const ROOT="assets/certificates/";
const sources={
 formal:{slug:"original-formal",parts:7,sha:"6050a0603674d7b5e402c0c21b477ef76b04b107e6abc61c13a314978d5f7986"},
 scout:{slug:"original-scout",parts:5,sha:"e5a3fe35698e9637a37ffb24218ee1fbf79074e0232d0e93199eca7ccf8d98c9"},
 enthusiast:{slug:"original-enthusiast",parts:5,sha:"03de002823c75cbe8f7a93ad756bd7361f51f51287f4f8ecb1ccc93c5d4e8be1"}
};
const urls=new Map();
async function loadOriginal(key){
 const meta=sources[key],card=document.querySelector('[data-original="'+key+'"]');
 if(!card)return;
 const status=card.querySelector(".load-status"),img=card.querySelector(".original-artwork");
 const button=card.querySelector("[data-print]");
 try{
  const parts=await Promise.all(Array.from({length:meta.parts},(_,i)=>{
   const filename=ROOT+meta.slug+".part"+String(i).padStart(2,"0")+".txt";
   return fetch(filename,{cache:"force-cache"}).then(res=>{
    if(!res.ok)throw Error("Original artwork segment unavailable");
    return res.text();
   });
  }));
  const encoded=parts.join("");
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw Error("Original image data is incomplete");
  const binary=atob(encoded),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  if(!window.crypto?.subtle)throw Error("Original artwork verification requires HTTPS");
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),x=>x.toString(16).padStart(2,"0")).join("");
  if(hash!==meta.sha)throw Error("Original image authenticity check failed");
  const url=URL.createObjectURL(new Blob([bytes],{type:"image/png"}));urls.set(key,url);
  img.onload=()=>{button.disabled=false;status.textContent="Original approved artwork verified and displayed."};
  img.onerror=()=>{button.disabled=true;status.textContent="Image preview could not be displayed."};
  img.src=url;
 }catch(error){status.textContent=String(error.message||error);button.disabled=true}
}
document.querySelectorAll("[data-original]").forEach(card=>{
 const key=card.dataset.original,btn=card.querySelector("[data-print]");
 btn.addEventListener("click",()=>{if(!btn.disabled){document.body.dataset.printStyle=key;window.print()}});
 void loadOriginal(key);
});
window.addEventListener("afterprint",()=>document.body.removeAttribute("data-print-style"));
window.addEventListener("pagehide",()=>{for(const url of urls.values())URL.revokeObjectURL(url)});
})();
