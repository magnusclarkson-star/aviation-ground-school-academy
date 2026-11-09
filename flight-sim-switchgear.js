/* Compact physical-look cockpit switch panel. Controls the existing scenery
 * selectors, not a second model of the flight. Nothing touches steering input. */
(function(root){"use strict";
const SWITCHES=Object.freeze([
 Object.freeze({id:"view",target:"cameraMode",label:"VIEW",choices:Object.freeze(["cockpit","chase"]),
  displays:Object.freeze({cockpit:"PILOT",chase:"CHASE"})}),
 Object.freeze({id:"graphics",target:"visualMode",label:"SCENE",choices:Object.freeze(["3d","2d"]),
  displays:Object.freeze({"3d":"3D","2d":"2D"})}),
 Object.freeze({id:"light",target:"lightingMode",label:"LIGHT",choices:Object.freeze(["day","golden","dusk"]),
  displays:Object.freeze({day:"DAY",golden:"GOLD",dusk:"DUSK"})}),
 Object.freeze({id:"frame",target:"cockpitFrameToggle",label:"FRAME",choices:Object.freeze(["on","off"]),
  displays:Object.freeze({on:"ON",off:"OFF"})})
]);
const format=(x)=>String(Math.max(0,Math.round(Number(x)||0)));
function nextValue(def,current){
 const currentIndex=def.choices.indexOf(current);
 return def.choices[(currentIndex+1)%def.choices.length];
}
function attach({documentLike,windowLike}={}){
 const doc=documentLike||root?.document,win=windowLike||root;
 const $=id=>doc.getElementById(id),panel=$("cockpitSwitchPanel");
 if(!panel)throw Error("Cockpit switch panel was not found");
 const items=SWITCHES.map(def=>({def,select:$(def.target),button:$(("cockpitSwitch_"+def.id))}));
 if(items.some(({select,button})=>!select||!button))throw Error("One or more scenery switches were not found");
 const status=$("cockpitSwitchStatus");
 function sync(){
  for(const {def,select,button} of items){
   const selected=select.value;
   const readout=button.querySelector(".cockpit-switch-value");
   if(readout)readout.textContent=def.displays[selected]||selected.toUpperCase();
   button.dataset.position=selected;
   button.disabled=select.disabled;
   button.setAttribute("aria-label",def.label+": "+(def.displays[selected]||selected)+". Tap to change.");
  }
 }
 for(const {def,select,button} of items){
  button.addEventListener("click",()=>{
   if(button.disabled)return;
   select.value=nextValue(def,select.value);
   select.dispatchEvent(new win.Event("change",{bubbles:true}));
   sync();
   if(status)status.textContent=def.label+" "+button.querySelector(".cockpit-switch-value")?.textContent;
  });
  select.addEventListener("change",sync);
 }
 function update(){
  const speed=$("readSpeed")?.textContent||"0";
  const power=$("power")?.value||"0";
  const collective=$("collective")?.value||"0";
  const mode=$("cockpitStation")?.dataset.family;
  const flaps=$("flaps")?.value||"0";
  const ias=$("cockpitIndicatorSpeed"),engine=$("cockpitIndicatorPower"),
   flap=$("cockpitIndicatorFlap");
  if(ias)ias.textContent=format(speed)+" KT";
  if(engine)engine.textContent=format(mode==="rotor"?collective:power)+"%";
  if(flap){
   flap.parentElement.hidden=mode==="rotor";
   flap.textContent=format(flaps)+"°";
  }
 }
 sync();update();
 return Object.freeze({sync,update,nextValue});
}
const api=Object.freeze({SWITCHES,nextValue,attach});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSACockpitSwitchgear=api;
})(typeof window!=="undefined"?window:null);
