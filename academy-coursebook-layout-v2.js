/* AGSA reader v2: a phone-friendly module picker backed by the existing
 * coursebook state. Keeps all existing quiz, progress and certificate logic.
 */
(()=>{"use strict";
const list=document.getElementById("moduleList"),jump=document.getElementById("mobileModuleJump");
if(!list||!jump)return;
function sync(){
 const buttons=[...list.querySelectorAll("button[data-module]")];
 if(!buttons.length)return;
 const selection=buttons.find(b=>b.getAttribute("aria-pressed")==="true");
 const selectedId=selection?.dataset.module||buttons[0].dataset.module;
 const fragment=document.createDocumentFragment();
 for(const button of buttons){
  const option=document.createElement("option");
  option.value=button.dataset.module;
  option.textContent=button.querySelector("strong")?.textContent||button.dataset.module;
  fragment.appendChild(option);
 }
 jump.replaceChildren(fragment);
 jump.value=selectedId;
}
jump.addEventListener("change",()=>{
 const button=[...list.querySelectorAll("button[data-module]")].find(b=>b.dataset.module===jump.value);
 if(button)button.click();
});
document.addEventListener("agsa:coursebook-module",()=>queueMicrotask(sync));
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",sync,{once:true});
else sync();
})();