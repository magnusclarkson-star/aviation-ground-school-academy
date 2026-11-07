/* Academy V3: one live instrument and only its related *original* functioning controls.
   Instrument and hardware DOM nodes are moved, not cloned; existing handlers remain active.
   By leaving the dial itself read-only we avoid fake knob-like controls on instruments. */
(function(global){
"use strict";
const $=id=>document.getElementById(id);
const spec={
 asi:{controls:["throttle","yoke","flaps"],hint:"Airspeed: advance or reduce throttle, change the pitch with the yoke, or select flaps. Watch the needle change over time."},
 att:{controls:["yoke","throttle","flaps"],hint:"Attitude: move the yoke sideways for bank or vertically for pitch. Throttle changes power, but not the attitude directly."},
 alt:{controls:["yoke","throttle","flaps"],hint:"Altitude: use the yoke for pitch and throttle for power. A climb or descent gradually changes the altimeter hands."},
 tc:{controls:["yoke","rudder","flaps"],hint:"Turn coordinator: command a bank using the yoke. Press and hold rudder to observe the simulated slip/skid ball."},
 hdg:{controls:["yoke","rudder","flaps"],hint:"Heading: bank with the yoke for a gradual heading change. Rudder also affects yaw in this simplified model."},
 vsi:{controls:["yoke","throttle","flaps"],hint:"Vertical speed: change pitch with the yoke and power with the throttle. The needle responds to the simulated climb or descent rate."}
};
const origins=new Map();
let initialized=false, chosen="asi";
function saveLocation(id){
 const element=$(id);
 if(!element||!element.parentNode)throw new Error("Focused cockpit: missing source "+id);
 const marker=document.createComment("return "+id);
 element.parentNode.insertBefore(marker,element);
 origins.set(id,{element,marker});
}
function restore(){
 for(const {element,marker} of origins.values()){
   if(element.parentNode!==marker.parentNode||element.previousSibling!==marker){
     marker.parentNode.insertBefore(element,marker.nextSibling);
   }
 }
}
function init(instruments,selectInstrument){
 if(initialized)return;
 instruments.forEach(([id])=>saveLocation("tile-"+id));
 for(const key of ["yoke","throttle","rudder","flaps"])saveLocation("control-"+key);
 const selector=$("focusSelector");
 for(let i=0;i<instruments.length;i++){
   const [id,name]=instruments[i];
   const button=document.createElement("button");
   button.type="button";
   button.id="focusSelect-"+id;
   button.textContent=name;
   button.setAttribute("aria-pressed","false");
   button.addEventListener("click",()=>selectInstrument(i));
   selector.appendChild(button);
   const digitalButton=document.createElement("button");
   digitalButton.type="button";
   digitalButton.id="digitalFocusSelect-"+id;
   digitalButton.textContent=({asi:"Airspeed",att:"Attitude",alt:"Altitude",tc:"Turn/Slip",hdg:"Heading",vsi:"VSI"})[id]||name;
   digitalButton.setAttribute("aria-label","Show controls for "+name);
   digitalButton.setAttribute("aria-pressed","false");
   digitalButton.addEventListener("click",()=>selectInstrument(i));
   $("digitalFocusSelector").appendChild(digitalButton);
 }
 initialized=true;
}
function highlight(index,instruments){
 if(!initialized)return;
 chosen=instruments[index][0];
 for(const [id] of instruments){
   const b=$("focusSelect-"+id);
   if(b)b.setAttribute("aria-pressed",String(id===chosen));
   const db=$("digitalFocusSelect-"+id);
   if(db)db.setAttribute("aria-pressed",String(id===chosen));
 }
}
function dock(index,instruments){
 if(!initialized)return;
 const id=instruments[index][0],item=spec[id];
 if(!item)throw new Error("Focused cockpit: unsupported instrument "+id);
 restore();
 const dial=$("tile-"+id),dialDock=$("focusDialDock"),controlDock=$("focusControlDock");
 dialDock.appendChild(dial);
 for(const key of item.controls)controlDock.appendChild($("control-"+key));
 $("focusControlsTitle").textContent="Relevant controls — "+instruments[index][1];
 $("focusControlsHint").textContent=item.hint+" Flap selection is always available, although a flap change does not directly change every instrument.";
 chosen=id;
 highlight(index,instruments);
 update();
}
function dockDigital(index,instruments,page){
 if(!initialized)return;
 const chosenId=instruments[index][0];
 let keys,title,hint;
 if(page==="map"){
   keys=["yoke","rudder","throttle","flaps"];
   title="Navigation map — change aircraft track";
   hint="Bank with the yoke, apply rudder or change power. The synthetic ground track responds as the aircraft travels forward.";
 }else if(page==="engine"){
   keys=["throttle","flaps"];
   title="Engine display — power and flaps";
   hint="Move the actual throttle control or select flaps. Watch the digital power and flap indications change immediately.";
 }else{
   const choice=spec[chosenId];
   if(!choice)throw new Error("Unknown digital training instrument "+chosenId);
   keys=choice.controls;
   title="Touch controls — "+instruments[index][1];
   hint=choice.hint;
 }
 restore();
 const target=$("digitalControlDock");
 for(const key of keys)target.appendChild($("control-"+key));
 $("digitalControlsTitle").textContent=title;
 $("digitalControlsHint").textContent=hint+" Flaps remain selectable on every digital page; their primary model effect is on airspeed.";
 $("digitalFocusSelector").classList.toggle("hidden",page!=="pfd");
 highlight(index,instruments);
}
function dockMission(phase){
 if(!initialized)return;
 const pick={
  roll:["throttle","yoke","flaps"],
  climb:["yoke","throttle","flaps"],
  climbReady:["yoke","throttle","flaps"],
  approach:["throttle","yoke","flaps"],
  landing:["yoke","throttle","flaps"],
  rollout:["throttle","rudder","flaps"],
  review:["throttle","yoke","flaps"],
  complete:["throttle","flaps"]
 };
 const keys=pick[phase]||pick.roll;
 restore();
 const target=$("digitalControlDock");
 for(const key of keys)target.appendChild($("control-"+key));
 $("digitalControlsTitle").textContent="Working controls — guided flight";
 $("digitalControlsHint").textContent="Operate the actual yoke, throttle, flaps or rudder below while watching the live touchscreen. The lesson instructions remain just above.";
 $("digitalFocusSelector").classList.add("hidden");
}
function update(){
 if(!initialized)return;
 const source=$("read-"+chosen);
 const target=$("focusValue");
 if(source&&target)target.textContent=source.textContent;
}
global.CockpitV3Focus={init,restore,dock,dockDigital,dockMission,highlight,update,spec};
})(window);
