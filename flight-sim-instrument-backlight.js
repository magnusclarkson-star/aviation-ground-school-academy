/* Cockpit instrument backlight; local appearance preference only.
   Green and blue illuminate live round gauges and glass avionics without
   changing instrument data, browser scenery light or flight controls. */
(function(root){"use strict";
 const MODES=Object.freeze(["green","blue","off"]);
 const KEY="agsa.cockpit.instrumentBacklight.v1";
 const DIMMER_KEY="agsa.cockpit.instrumentDimmer.v1";
 const LEVELS=Object.freeze(["dim","normal","bright"]);
 const normalizeLevel=value=>LEVELS.includes(value)?value:"normal";
 const normalize=value=>MODES.includes(value)?value:"green";
 function attach({documentLike,windowLike}={}){
  const doc=documentLike||root?.document,win=windowLike||root;
  const station=doc?.getElementById?.("cockpitStation");
  const picker=doc?.getElementById?.("cockpitBacklightPicker");
  const dimmer=doc?.getElementById?.("cockpitBacklightDimmer");
  const readout=doc?.getElementById?.("cockpitBacklightLevel");
  if(!station||!picker||!dimmer||!readout)
   throw Error("Cockpit backlight requires existing flight deck and dimmer controls");
  let stored=null,storedLevel=null;
  try{stored=win?.localStorage?.getItem(KEY);
   storedLevel=win?.localStorage?.getItem(DIMMER_KEY)}catch{}
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
  function setLevel(value){
   const level=normalizeLevel(value);
   station.dataset.instrumentDimmer=level;
   dimmer.value=String(LEVELS.indexOf(level)+1);
   readout.textContent=level==="dim"?"DIM":level==="bright"?"BRIGHT":"NORMAL";
   dimmer.setAttribute("aria-valuetext",readout.textContent);
   try{win?.localStorage?.setItem(DIMMER_KEY,level)}catch{}
   return level;
  }
  picker.addEventListener("click",event=>{
   const button=event.target?.closest?.("[data-cockpit-backlight]");
   if(button&&picker.contains(button))apply(button.dataset.cockpitBacklight);
  });
  dimmer.addEventListener("input",()=>setLevel(LEVELS[Number(dimmer.value)-1]));
  dimmer.addEventListener("change",()=>setLevel(LEVELS[Number(dimmer.value)-1]));
  apply(stored);setLevel(storedLevel);
  return Object.freeze({apply,setLevel,current:()=>station.dataset.instrumentBacklight,
   currentLevel:()=>station.dataset.instrumentDimmer});
 }
 function start(){
  if(!root?.document)return;
  if(root.document.readyState==="loading")
   root.document.addEventListener("DOMContentLoaded",()=>attach({documentLike:root.document,windowLike:root}),{once:true});
  else attach({documentLike:root.document,windowLike:root});
 }
 const api=Object.freeze({MODES,LEVELS,normalize,normalizeLevel,attach});
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root){root.AGSAInstrumentBacklight=api;start();}
})(typeof window!=="undefined"?window:null);
