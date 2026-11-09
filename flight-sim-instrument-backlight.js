/* Cockpit instrument backlight; local appearance preference only.
   Green and blue illuminate live round gauges and glass avionics without
   changing instrument data, browser scenery light or flight controls. */
(function(root){"use strict";
 const MODES=Object.freeze(["green","blue","off"]);
 const KEY="agsa.cockpit.instrumentBacklight.v1";
 const normalize=value=>MODES.includes(value)?value:"green";
 function attach({documentLike,windowLike}={}){
  const doc=documentLike||root?.document,win=windowLike||root;
  const station=doc?.getElementById?.("cockpitStation");
  const picker=doc?.getElementById?.("cockpitBacklightPicker");
  if(!station||!picker)throw Error("Cockpit backlight requires existing flight deck and More menu");
  let stored=null;
  try{stored=win?.localStorage?.getItem(KEY)}catch{}
  function apply(value){
   const mode=normalize(value);
   station.dataset.instrumentBacklight=mode;
   for(const button of picker.querySelectorAll("[data-cockpit-backlight]")){
    const pressed=button.dataset.cockpitBacklight===mode;
    button.setAttribute("aria-pressed",String(pressed));
   }
   try{win?.localStorage?.setItem(KEY,mode)}catch{}
   return mode;
  }
  picker.addEventListener("click",event=>{
   const button=event.target?.closest?.("[data-cockpit-backlight]");
   if(button&&picker.contains(button))apply(button.dataset.cockpitBacklight);
  });
  apply(stored);
  return Object.freeze({apply,current:()=>station.dataset.instrumentBacklight});
 }
 function start(){
  if(!root?.document)return;
  if(root.document.readyState==="loading")
   root.document.addEventListener("DOMContentLoaded",()=>attach({documentLike:root.document,windowLike:root}),{once:true});
  else attach({documentLike:root.document,windowLike:root});
 }
 const api=Object.freeze({MODES,normalize,attach});
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root){root.AGSAInstrumentBacklight=api;start();}
})(typeof window!=="undefined"?window:null);
