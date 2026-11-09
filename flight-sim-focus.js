/* Optional single-screen cockpit view: isolates the live flight deck without
 * moving, cloning or resizing individual steering controls in JS. */
(function(root){"use strict";
function attach({documentLike,windowLike}={}){
 const doc=documentLike||root?.document,win=windowLike||root;
 const button=doc?.getElementById("cockpitFocusButton");
 const panel=doc?.querySelector(".scene-panel");
 const station=doc?.getElementById("cockpitStation");
 if(!button||!panel||!station)throw Error("Cockpit focus requires flight deck and toggle");
 let active=false,previousScroll=0;
 const status=doc.getElementById("cockpitFocusStatus");
 function setFocus(next){
  const selected=Boolean(next);
  if(selected===active)return active;
  if(selected)previousScroll=Math.max(0,win?.scrollY||0);
  active=selected;
  doc.body.dataset.cockpitFocus=active?"on":"off";
  panel.dataset.focused=active?"true":"false";
  button.setAttribute("aria-pressed",String(active));
  button.textContent=active?"↙ Exit cockpit":"⛶ Cockpit view";
  button.setAttribute("aria-label",active?"Exit cockpit-only flight view":"Enter cockpit-only flight view");
  if(status)status.textContent=active?"Cockpit-only view enabled":"Cockpit-only view closed";
  if(!active&&win?.scrollTo)win.scrollTo({top:previousScroll,behavior:"instant"});
  return active;
 }
 button.addEventListener("click",()=>setFocus(!active));
 doc.addEventListener("keydown",event=>{
  if(event.key!=="Escape"||!active)return;
  // The cockpit's existing Escape handler owns the enlarged instrument and
  // help panel; leaving the deck must be a *separate* Escape or Exit action.
  if(!doc.getElementById("cockpitZoomPanel")?.hidden||
     !doc.getElementById("cockpitInfoPanel")?.hidden)return;
  setFocus(false);
 },true);
 doc.body.dataset.cockpitFocus="off";
 return Object.freeze({setFocus,isFocused:()=>active});
}
const api=Object.freeze({attach});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAImmersiveCockpitFocus=api;
})(typeof window!=="undefined"?window:null);
