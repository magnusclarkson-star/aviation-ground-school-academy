/* Browser-only controller setup and multi-input arbitration.
 * The regular touchscreen and keyboard remain authoritative while held.
 * Flight logic is untouched; this module merely updates fictional inputs.
 */
(function(root){"use strict";
function attach({api,documentLike,navigatorLike,getCurrentInput,getMode,onDisconnect,onDisable,onUpdate}) {
 const doc=documentLike,read=id=>doc.getElementById(id);
 if(!api||!doc)throw Error("Controller UI requires the browser model and document");
 const device=api.makeController({navigatorLike,documentLike:doc});
 let previousState="",previousDisplay="",selectedHasBeenActive=false;
 const options=[
  ["gamepadBank",0],["gamepadPitch",1],["gamepadRudder",2],["gamepadPower","none"]
 ];
 for(const [id,selected] of options){
  const select=read(id);
  if(id==="gamepadRudder"){
   const none=doc.createElement("option");none.value="none";none.textContent="Disabled / touch rudder";select.appendChild(none);
  }
  for(let i=0;i<8;i++){
   const opt=doc.createElement("option");opt.value=String(i);opt.textContent="Axis "+i;
   select.appendChild(opt);
  }
  select.value=String(selected);
 }
 function status(message,code="neutral"){
  if(message===previousDisplay)return;
  previousDisplay=message;
  read("gamepadStatus").dataset.code=code;
  read("gamepadStatus").textContent=message;
 }
 function syncButtons(){
  const on=device.isEnabled();
  read("gamepadToggle").setAttribute("aria-pressed",String(on));
  read("gamepadToggle").textContent=on?"Disable controller":"Enable controller";
  read("gamepadSelect").disabled=!on;
  read("gamepadCalibrate").disabled=!on||device.selected()===null;
 }
 function refresh({autoSelect=false}={}){
  const select=read("gamepadSelect"),oldIndex=device.selected();
  const available=device.devices();
  select.replaceChildren();
  const option=doc.createElement("option");option.value="";option.textContent=available.length?
   "Choose a controller":"No compatible controller detected";
  select.appendChild(option);
  available.forEach(gp=>{
   const option=doc.createElement("option");
   option.value=String(gp.index);
   option.textContent="Controller "+(gp.index+1)+" · "+gp.axes+" axes, "+gp.buttons+" buttons";
   select.appendChild(option);
  });
  if(device.isEnabled()){
   const current=available.find(gp=>gp.index===oldIndex);
   const wanted=current?current:autoSelect?available[0]:null;
   if(wanted){
    device.choose(wanted.index);
    select.value=String(wanted.index);
   }
  }
  syncButtons();
  if(!device.supported){
   read("gamepadToggle").disabled=true;
   status("Gamepad API unavailable in this browser. Touch and keyboard controls remain available.","warning");
  }else if(!device.isEnabled()){
   status("Off. Touch/keyboard controls remain active; no hardware input is read.","neutral");
  }else if(device.selected()===null){
   status("Controller enabled. Connect and move a controller, then refresh or select it.","warning");
  }else{
   status("Controller "+(device.selected()+1)+" connected. Release sticks and calibrate neutral if needed.","positive");
  }
 }
 function configure(){
  try{
   const mapping={
    bank:read("gamepadBank").value,pitch:read("gamepadPitch").value,
    rudder:read("gamepadRudder").value,power:read("gamepadPower").value,
    deadzone:Number(read("gamepadDeadzone").value),
    reversePitch:read("gamepadReversePitch").checked
   };
   device.configure(mapping);
   status("Axis mapping updated. Verify movement in the live readout; calibrate neutral with sticks released.","positive");
  }catch(error){status(error.message,"warning")}
 }
 function resetPower(){
  const input=getCurrentInput();
  device.setPower(getMode?.()==="helicopter"?(input?.collective??0):(input?.throttle??0));
 }
 read("gamepadToggle").addEventListener("click",()=>{
  const enabled=device.enable(!device.isEnabled());
  selectedHasBeenActive=false;previousState="";
  resetPower();
  refresh({autoSelect:enabled});
  if(!enabled){onDisable?.();read("gamepadLive").textContent="BANK 0% · PITCH 0% · RUDDER 0% · POWER inactive";}
 });
 read("gamepadSelect").addEventListener("change",()=>{
  const selected=read("gamepadSelect").value;
  if(selected&&!device.choose(Number(selected)))status("Could not access that controller.","warning");
  else if(selected){selectedHasBeenActive=false;previousState="";resetPower();status("Controller selected; check the axes before simulating.","positive")}
  syncButtons();
 });
 read("gamepadRefresh").addEventListener("click",()=>refresh({autoSelect:true}));
 read("gamepadCalibrate").addEventListener("click",()=>{
  status(device.calibrate()?
   "Neutral captured. Check the live values and try small movements.":
   "Release the sticks/pedals to their neutral positions and try again.","neutral");
 });
 for(const [id] of options)read(id).addEventListener("change",configure);
 read("gamepadDeadzone").addEventListener("change",configure);
 read("gamepadReversePitch").addEventListener("change",configure);
 function poll(dt,{input,mode,dragActive,keyboard,pointers,paused=false}={}){
  if(!device.isEnabled()||paused||doc.hidden)return {active:false,state:"off"};
  const snap=device.read(dt);
  if(snap.state==="disconnected"){
   selectedHasBeenActive=false;
   status("Controller disconnected. Simulation paused to avoid uncontrolled movement. Reconnect, re-enable, then resume.","warning");
   syncButtons();
   read("gamepadLive").textContent="DISCONNECTED · INPUT RELEASED";
   onDisconnect?.();
   return snap;
  }
  if(snap.state!=="active"){
   if(selectedHasBeenActive){
    selectedHasBeenActive=false;
    onDisconnect?.();
   }
   const message=snap.state==="incompatible"?
    "Selected controller has insufficient axes for bank/pitch; choose another or adjust the axis numbers.":
    "Waiting for an active controller. Move a stick/button and refresh the device list if necessary.";
   if(snap.state!==previousState){status(message,"warning");previousState=snap.state}
   return snap;
  }
  selectedHasBeenActive=true;previousState="active";
  const held=keyboard||new Set(),touch=pointers||{};
  const manualBankPitch=dragActive===true||
   ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].some(k=>held.has(k));
  const manualRudder=touch.left!==null&&touch.left!==undefined||
   touch.right!==null&&touch.right!==undefined||held.has("a")||held.has("d");
  const manualBrake=touch.brake!==null&&touch.brake!==undefined||held.has(" ");
  if(!manualBankPitch){input.bank=snap.bank;input.pitch=snap.pitch}
  if(!manualRudder)input.rudder=snap.rudder;
  if(!manualBrake)input.brake=snap.brake;
  if(snap.powerChanged){
   if(mode==="helicopter")input.collective=snap.power;
   else input.throttle=snap.power;
  }
  const percent=v=>Math.round(v*100);
  const values="BANK "+percent(snap.bank)+"% · PITCH "+percent(-snap.pitch)+"% · RUDDER "+percent(snap.rudder)+"% · POWER "+percent(snap.power)+"%";
  read("gamepadLive").textContent=values;
  onUpdate?.();
  if(previousDisplay.includes("Waiting")||previousDisplay.includes("No compatible")||previousDisplay.includes("Off.")){
   status("Controller "+(device.selected()+1)+" active. Live axes are shown below; controls are simulated, not calibrated.","positive");
  }
  return snap;
 }
 if(!device.supported)read("gamepadToggle").disabled=true;
 refresh();
 // Browsers can defer gamepad visibility until a hardware interaction.
 // The next refresh is initiated only by a learner's actual click/event.
 root?.addEventListener?.("gamepadconnected",()=>{if(device.isEnabled())refresh({autoSelect:true})});
 root?.addEventListener?.("gamepaddisconnected",()=>{
  if(device.isEnabled())refresh();
 });
 return {device,poll,resetPower,refresh,isActive:()=>selectedHasBeenActive};
}
const api={attach};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightGamepadUI=api;
})(typeof window!=="undefined"?window:null);
