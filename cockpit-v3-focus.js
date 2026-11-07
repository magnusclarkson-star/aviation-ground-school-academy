/* Academy V3: one live instrument and only its related *original* functioning controls.
   Instrument and hardware DOM nodes are moved, not cloned; existing handlers remain active.
   By leaving the dial itself read-only we avoid fake knob-like controls on instruments. */
(function(global){
"use strict";
const $=id=>document.getElementById(id);
const spec={
 asi:{controls:["throttle","yoke","flaps"],hint:"Airspeed: advance or reduce throttle, change the pitch with the yoke, or select flaps. Watch the needle change over time."},
 att:{controls:["yoke","throttle"],hint:"Attitude: move the yoke sideways for bank or vertically for pitch. Throttle changes power, but not the attitude directly."},
 alt:{controls:["yoke","throttle"],hint:"Altitude: use the yoke for pitch and throttle for power. A climb or descent gradually changes the altimeter hands."},
 tc:{controls:["yoke","rudder"],hint:"Turn coordinator: command a bank using the yoke. Press and hold rudder to observe the simulated slip/skid ball."},
 hdg:{controls:["yoke","rudder"],hint:"Heading: bank with the yoke for a gradual heading change. Rudder also affects yaw in this simplified model."},
 vsi:{controls:["yoke","throttle"],hint:"Vertical speed: change pitch with the yoke and power with the throttle. The needle responds to the simulated climb or descent rate."}
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
 }
 initialized=true;
}
function highlight(index,instruments){
 if(!initialized)return;
 chosen=instruments[index][0];
 for(const [id] of instruments){
   const b=$("focusSelect-"+id);
   if(b)b.setAttribute("aria-pressed",String(id===chosen));
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
 $("focusControlsHint").textContent=item.hint;
 chosen=id;
 highlight(index,instruments);
 update();
}
function update(){
 if(!initialized)return;
 const source=$("read-"+chosen);
 const target=$("focusValue");
 if(source&&target)target.textContent=source.textContent;
}
global.CockpitV3Focus={init,restore,dock,highlight,update,spec};
})(window);
