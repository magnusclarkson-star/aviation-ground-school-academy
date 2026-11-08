/* AGSA integrated cockpit - original educational artwork and fictional values.
 * Not a Cessna, Robinson, Boeing, Lockheed Martin, Eurofighter or Sukhoi
 * flight trainer. Physical configurations and instrument options vary.
 * Fighter layouts provide non-tactical display familiarisation only.
 * No weapons, tactical logic, real flight-envelope figures or certified instruments.
 */
(function(root){"use strict";
const FRAMES=Object.freeze([
 {id:"c172",title:"Cessna 172 · Classic",family:"trainer",control:"yoke",layout:"analog",caption:"Classic training-aircraft six-pack in T configuration",pilot:"Dual-handled yoke",theme:"civil"},
 {id:"r44",title:"Robinson R44 · Raven",family:"rotor",control:"cyclic",layout:"analog",caption:"Later analogue-style rotorcraft instrument cluster",pilot:"Cyclic + collective + anti-torque pedals",theme:"rotor"},
 {id:"fa18",title:"F/A-18 · Super Hornet",family:"jet",control:"stick",layout:"triple",caption:"Three-display naval-jet-inspired flight panel",pilot:"Centre control stick and power lever",theme:"naval"},
 {id:"f22",title:"F-22 · Raptor",family:"jet",control:"stick",layout:"quad",caption:"Four-display modern-jet-inspired flight panel",pilot:"Side-stick-inspired learning control",theme:"raptor"},
 {id:"f35",title:"F-35 · Lightning II",family:"jet",control:"stick",layout:"panoramic",caption:"Large panoramic-display-inspired flight panel",pilot:"Side-stick-inspired learning control",theme:"lightning"},
 {id:"typhoon",title:"Eurofighter · Typhoon",family:"jet",control:"stick",layout:"triple",caption:"Three-display European-jet-inspired flight panel",pilot:"Centre stick / power lever",theme:"typhoon"},
 {id:"su37",title:"Su-37 · Terminator (concept)",family:"jet",control:"stick",layout:"dual",caption:"Two-display demonstrator-inspired flight panel",pilot:"Centre control stick and power lever",theme:"flanker"}
].map(x=>Object.freeze(x)));
const byId=id=>FRAMES.find(p=>p.id===id)||FRAMES[0];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(Number(n))?Number(n):0));
const rnd=n=>Math.round(Number.isFinite(Number(n))?Number(n):0);
function snapshot(state,systems,input,profileId){
 const profile=byId(profileId),hdg=((rnd(state?.headingDeg)%360)+360)%360;
 const speed=clamp(state?.speedKt,0,400),ft=Math.max(0,clamp(state?.altitudeM,0,50000)*3.28084),
  vs=clamp(state?.verticalMs,-40,40)*196.8504,pitch=clamp(state?.pitchDeg,-75,75),bank=clamp(state?.rollDeg,-85,85),
  throttle=clamp(input?.throttle,0,1)*100,collective=clamp(input?.collective,0,1)*100;
 const power=profile.family==="rotor"?collective:throttle;
 const rpm=clamp(systems?.powerPct??(profile.family==="rotor"?84:throttle),0,100);
 const values={speed:rnd(speed),alt:rnd(ft),vsi:rnd(vs),heading:String(hdg).padStart(3,"0"),
  bank:rnd(bank),pitch:rnd(pitch),power:rnd(power),rpm:rnd(rpm),ground:rnd(state?.groundSpeedKt??speed)};
 return Object.freeze({profile:profile.id,values:Object.freeze(values),
  pitch,bank,power,rpm,heading:hdg,
  angles:Object.freeze({
   speed:-130+clamp(speed,0,180)*260/180,
   alt:-180+(ft%1000)*.36,
   vsi:clamp(vs/2000,-1,1)*125,
   heading:hdg,turn:clamp(bank/35,-1,1)*90,
   rpm:-130+rpm*2.6,power:-130+power*2.6
  })});
}
const ANALOG={
 trainer:[["speed","AIRSPEED","KT"],["attitude","ATTITUDE","PITCH / BANK"],["alt","ALTIMETER","FT AGL"],
  ["turn","TURN COORD.","BANK · SIM"],["heading","HEADING","DEG"],["vsi","VERTICAL SPEED","FT/MIN"]],
 rotor:[["vsi","VERTICAL SPEED","FT/MIN"],["speed","AIRSPEED","KT"],["rpm","DUAL TACH","% · SIM"],
  ["attitude","ATTITUDE · OPT.","PITCH / BANK"],["alt","ALTIMETER","FT AGL"],["power","MANIFOLD PROXY","POWER %"]]
};
function makeAnalogFace(doc,id,label,unit){
 const face=doc.createElement("div");face.className="cockpit-gauge";face.dataset.gauge=id;
 const heading=doc.createElement("div");heading.className="cockpit-gauge-title";heading.textContent=label;
 const svg=doc.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.setAttribute("viewBox","0 0 100 100");svg.setAttribute("aria-hidden","true");
 const ns="http://www.w3.org/2000/svg";
 function node(tag,attrs,parent=svg){const e=doc.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));parent.appendChild(e);return e;}
 node("circle",{cx:50,cy:50,r:47,fill:"#070f16",stroke:"#899faa","stroke-width":3});
 node("circle",{cx:50,cy:50,r:39,fill:id==="attitude"?"#245d7e":"#101c28",stroke:"#344b5b","stroke-width":1});
 if(id==="attitude"){
  const defs=node("defs",{}),clip=node("clipPath",{id:"cockpit-gauge-horizon-clip"},defs);
  // Each panel contains one attitude indicator; all profiles rebuild the panel.
  node("circle",{cx:50,cy:50,r:37},clip);
  const clipped=node("g",{"clip-path":"url(#cockpit-gauge-horizon-clip)"});
  const horizon=node("g",{"data-live-horizon":"true"},clipped);
  node("rect",{x:-12,y:-62,width:124,height:112,fill:"#2c80ac"},horizon);
  node("rect",{x:-12,y:50,width:124,height:120,fill:"#896345"},horizon);
  node("line",{x1:-12,x2:112,y1:50,y2:50,stroke:"#f3f8fa","stroke-width":2},horizon);
  for(const offset of [-22,-11,11,22])node("line",{x1:37,x2:63,y1:50+offset,y2:50+offset,stroke:"#d7edf5","stroke-width":1},horizon);
  node("path",{d:"M15 50 H35 L44 55 H56 L65 50 H85",stroke:"#f1c96e","stroke-width":4,fill:"none"});
 }else{
  for(let j=0;j<=12;j++){
   const t=-130+j*260/12;
   node("line",{x1:50,y1:11,x2:50,y2:j%3===0?20:16,stroke:j%3===0?"#f3e8d1":"#87a2b5","stroke-width":j%3===0?2:1,
    transform:"rotate("+t+" 50 50)"});
  }
  const hand=node("g",{"data-live-needle":"true"});
  node("path",{d:"M48 51 L50 16 L52 51Z",fill:"#ffe0a1"},hand);
  node("circle",{cx:50,cy:50,r:3,fill:"#d3e4eb"});
 }
 const output=doc.createElement("strong");output.className="cockpit-gauge-number";output.dataset.liveValue=id;output.textContent="0";
 const unitEl=doc.createElement("small");unitEl.textContent=unit;
 face.append(heading,svg,output,unitEl);
 face.setAttribute("role","button");
 face.tabIndex=0;
 face.setAttribute("aria-label","Enlarge "+label+" simulated instrument");
 return face;
}
function digitalScreen(doc,kind,index){
 const screen=doc.createElement("div");screen.className="cockpit-mfd cockpit-mfd-"+kind;
 const header=doc.createElement("div");header.className="cockpit-mfd-head";header.textContent=
   kind==="pfd"?"FLIGHT DISPLAY":kind==="nav"?"NAVIGATION · SIM":kind==="engine"?"SYSTEMS · SIM":
   kind==="att"?"ATTITUDE · SIM":"FLIGHT DATA";
 const body=doc.createElement("div");body.className="cockpit-mfd-body";
 if(kind==="pfd"||kind==="att"){
  const sky=doc.createElement("div");sky.className="cockpit-mfd-attitude";
  const horizon=doc.createElement("div");horizon.className="cockpit-mfd-horizon";horizon.dataset.mfdHorizon="true";
  const wings=doc.createElement("div");wings.className="cockpit-mfd-wings";
  sky.append(horizon,wings);
  const labels=doc.createElement("div");labels.className="cockpit-mfd-readouts";
  for(const [k,n] of [["speed","IAS KT"],["alt","HEIGHT FT"],["heading","HDG"]]){
   const c=doc.createElement("span");c.textContent=n+" ";
   const v=doc.createElement("strong");v.dataset.mfdValue=k;v.textContent="0";
   c.appendChild(v);labels.appendChild(c);
  }
  body.append(sky,labels);
 }else {
  const lines=kind==="nav"?[["heading","HDG"],["ground","GS KT"],["alt","HEIGHT FT"]]:
   [["power","POWER %"],["rpm","ENGINE PROXY %"],["vsi","VERT FT/MIN"]];
  for(const [key,label] of lines){
   const row=doc.createElement("div");row.className="cockpit-mfd-line";
   const cap=doc.createElement("span");cap.textContent=label;
   const num=doc.createElement("strong");num.dataset.mfdValue=key;num.textContent="0";
   row.append(cap,num);body.appendChild(row);
  }
 }
 const foot=doc.createElement("div");foot.className="cockpit-mfd-foot";foot.textContent="TRAINING DISPLAY "+(index+1)+" · NO TACTICAL DATA";
 screen.append(header,body,foot);
 screen.setAttribute("role","button");
 screen.tabIndex=0;
 screen.setAttribute("aria-label","Enlarge "+header.textContent+" simulated display");
 return screen;
}
function buildPanel(doc,profile,holder){
 holder.replaceChildren();
 holder.dataset.airframe=profile.id;holder.dataset.family=profile.family;
 if(profile.family==="jet"){
  const screenKinds=profile.layout==="panoramic"?["pfd","nav","engine"]:
   profile.layout==="quad"?["nav","pfd","att","engine"]:
   profile.layout==="dual"?["pfd","engine"]:["nav","pfd","engine"];
  const row=doc.createElement("div");
  row.className="cockpit-mfd-grid cockpit-mfd-"+profile.layout;
  for(let i=0;i<screenKinds.length;i++)row.appendChild(digitalScreen(doc,screenKinds[i],i));
  holder.appendChild(row);
 }else{
  const grid=doc.createElement("div");grid.className="cockpit-sixpack";
  for(const [id,name,unit] of ANALOG[profile.family])grid.appendChild(makeAnalogFace(doc,id,name,unit));
  holder.appendChild(grid);
 }
}
function paint(holder,state,systems,input,profileId,doc){
 const s=snapshot(state,systems,input,profileId);
 for(const el of holder.querySelectorAll("[data-live-value]")){
  const id=el.dataset.liveValue;
  const value=id==="attitude"?s.values.pitch+"° / "+s.values.bank+"°":
   id==="turn"?(s.values.bank>=0?"+":"")+s.values.bank+"°":
   id==="rpm"?s.values.rpm+" / "+s.values.rpm+"%":
   id==="power"?s.values.power+"%":String(s.values[id]??"0");
  el.textContent=value;
 }
 for(const el of holder.querySelectorAll("[data-live-needle]")){
  const id=el.closest("[data-gauge]")?.dataset.gauge||"speed";
  el.setAttribute("transform","rotate("+(s.angles[id]??0).toFixed(2)+" 50 50)");
 }
 for(const el of holder.querySelectorAll("[data-live-horizon]")){
  el.setAttribute("transform","translate(0 "+(s.pitch*.65).toFixed(2)+") rotate("+(-s.bank).toFixed(2)+" 50 50)");
 }
 for(const el of holder.querySelectorAll("[data-mfd-value]")){
  el.textContent=String(s.values[el.dataset.mfdValue]??0);
 }
 for(const el of holder.querySelectorAll("[data-mfd-horizon]")){
  el.style.transform="translateY("+(s.pitch*1.1).toFixed(2)+"px) rotate("+(-s.bank).toFixed(2)+"deg)";
 }
 const hud=doc.getElementById("cockpitJetHud");
 if(hud){
  hud.hidden=byId(profileId).family!=="jet";
  doc.getElementById("cockpitHudSpeed").textContent=String(s.values.speed);
  doc.getElementById("cockpitHudAlt").textContent=String(s.values.alt);
  doc.getElementById("cockpitHudHeading").textContent=s.values.heading;
  doc.getElementById("cockpitHudPitch").textContent=(s.values.pitch>=0?"+":"")+s.values.pitch;
 }
 return s;
}
function attach({documentLike,onSelect=()=>{},getState=()=>null,getSystems=()=>null,getInput=()=>null}={}){
 const doc=documentLike||root?.document;if(!doc?.getElementById)throw Error("Cockpit requires the simulator document");
 const $=id=>doc.getElementById(id);
 const wrap=$("cockpitMain"),holder=$("cockpitVisualPanel"),control=$("controlTitle")?.closest(".control-panel");
 const zoomPanel=$("cockpitZoomPanel"),zoomContent=$("cockpitZoomContent"),zoomTitle=$("cockpitZoomTitle");
 const cockpitStation=$("cockpitStation");
 const touchSize=$("cockpitTouchScale"),sensitivity=$("cockpitTouchSensitivity");
 const win=root||null;
 if(!zoomPanel||!zoomContent||!zoomTitle||!touchSize||!sensitivity)throw Error("Instrument zoom or touch configuration missing");
 if(!wrap||!holder||!control)throw Error("Cockpit controls or panel missing");
 // Move, never duplicate: existing pointer events, IDs and instrument hooks survive.
 wrap.appendChild(control);
 const select=$("cockpitAircraftSelect");
 select.replaceChildren();
 for(const frame of FRAMES){
  const option=doc.createElement("option");option.value=frame.id;option.textContent=frame.title;
  select.appendChild(option);
 }
 let active="c172";
 function closeZoom(){
  zoomPanel.hidden=true;
  zoomContent.replaceChildren();
  zoomTitle.textContent="Instrument";
 }
 function openZoom(tile){
  const clone=tile.cloneNode(true);
  clone.removeAttribute("role");
  clone.removeAttribute("tabindex");
  clone.removeAttribute("aria-label");
  // Duplicate SVG clipping IDs must be unique in the live document.
  const clip=clone.querySelector("clipPath[id]");
  if(clip){
   const original=clip.id,unique=original+"-zoom";
   clip.id=unique;
   for(const el of clone.querySelectorAll("[clip-path]")){
    if(el.getAttribute("clip-path")==="url(#"+original+")")el.setAttribute("clip-path","url(#"+unique+")");
   }
  }
  zoomContent.replaceChildren(clone);
  zoomTitle.textContent=tile.querySelector(".cockpit-gauge-title, .cockpit-mfd-head")?.textContent||"Instrument";
  zoomPanel.hidden=false;
  update();
 }
 holder.addEventListener("click",event=>{
  const tile=event.target?.closest?.(".cockpit-gauge, .cockpit-mfd");
  if(tile&&holder.contains(tile))openZoom(tile);
 });
 holder.addEventListener("keydown",event=>{
  if(event.key!=="Enter"&&event.key!==" ")return;
  const tile=event.target?.closest?.(".cockpit-gauge, .cockpit-mfd");
  if(!tile||!holder.contains(tile))return;
  event.preventDefault();openZoom(tile);
 });
 $("cockpitZoomClose").addEventListener("click",closeZoom);
 doc.addEventListener("keydown",event=>{if(event.key==="Escape"&&!zoomPanel.hidden)closeZoom();});
 const focusButton=$("cockpitControlFocusToggle");
 let focusExpanded=false;
 function setControlFocus(enabled){
  focusExpanded=Boolean(enabled);
  cockpitStation.dataset.controlFocus=focusExpanded?"expanded":"normal";
  focusButton.setAttribute("aria-pressed",String(focusExpanded));
  focusButton.textContent=focusExpanded?"Return to normal controls":"Expand flight controls";
  focusButton.setAttribute("aria-label",focusExpanded?"Return to normal cockpit control size":"Enlarge the on-cockpit flight controls");
  return focusExpanded;
 }
 focusButton.addEventListener("click",()=>setControlFocus(!focusExpanded));
 // Expand only once the touch gesture finishes, so an active two-finger
 // steering or rudder press cannot be shifted halfway through a manoeuvre.
 for(const id of ["controlPad","leftRudder","rightRudder","brake"]){
  $(id).addEventListener("pointerup",event=>{
   if(event.pointerType!=="mouse"||event.button===0)setControlFocus(true);
  });
 }
 for(const id of ["power","collective","flaps"]){
  $(id).addEventListener("change",()=>setControlFocus(true));
 }
 doc.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&focusExpanded)setControlFocus(false);
 });
 setControlFocus(false);
 const sizes=new Set(["compact","standard","large"]);
 function resizeControls(){
  const size=sizes.has(touchSize.value)?touchSize.value:"standard";
  cockpitStation.dataset.touchSize=size;
 }
 touchSize.addEventListener("change",resizeControls);
 resizeControls();
 function refreshOrientation(){
  const landscape=Boolean(win&&win.innerWidth>win.innerHeight&&win.innerHeight<=620);
  const mobile=Boolean(win&&win.innerWidth<=740&&win.innerHeight>win.innerWidth);
  cockpitStation.dataset.orientation=landscape?"landscape":mobile?"portrait":"desktop";
  $("cockpitRotationStatus").textContent=landscape?
   "Landscape cockpit active · instruments and controls spread across the wider screen. Rotate upright to restore portrait layout.":
   mobile?"Portrait cockpit active · rotate the phone sideways for a wider flight deck.":
   "Responsive cockpit active · layout adjusts automatically to screen dimensions.";
 }
 win?.addEventListener?.("resize",refreshOrientation);
 win?.addEventListener?.("orientationchange",refreshOrientation);
 refreshOrientation();
 function choose(id,{notify=false}={}){
  const profile=byId(id);active=profile.id;select.value=active;
  const deck=$("cockpitStation");
  deck.dataset.airframe=profile.id;deck.dataset.family=profile.family;
  $("cockpitAircraftLabel").textContent=profile.title;
  $("cockpitAircraftCaption").textContent=profile.caption+" · "+profile.pilot;
  $("cockpitAircraftNotice").textContent=profile.family==="jet"?
   "Military cockpit familiarisation only. All five jets reuse the fictional trainer flight model; no jet-specific aerodynamics, avionics, weapons or operational limits.":
   profile.family==="rotor"?
    "R44-inspired later analogue layout. Dual-tach and manifold indications are invented proxies; no certified rotorcraft performance.":
    "C172-style traditional T six-pack. Gauges show invented trainer values, not an approved Cessna instrument installation.";
  $("cockpitGripLabel").textContent=profile.pilot;
  $("cockpitJetHud").hidden=profile.family!=="jet";
  buildPanel(doc,profile,holder);
  closeZoom();
  setControlFocus(false);
  if(notify)onSelect(profile.control,profile.id);
  update();
  return profile;
 }
 function update(){
  const state=getState(),sys=getSystems(),input=getInput();
  if(state){
   paint(holder,state,sys,input,active,doc);
   if(!zoomPanel.hidden)paint(zoomContent,state,sys,input,active,doc);
  }
 }
 select.addEventListener("change",()=>choose(select.value,{notify:true}));
 // Existing mode buttons remain useful and continue to select the correct family.
 for(const [button,defaultId] of [["typeYoke","c172"],["typeStick","fa18"],["typeCyclic","r44"]]){
  $(button).addEventListener("click",()=>{
   if(button==="typeStick"&&byId(active).family==="jet")return;
   choose(defaultId);
  });
 }
 choose("c172");
 return Object.freeze({choose,update,openZoom,closeZoom,refreshOrientation,setControlFocus,
  sensitivity:()=>clamp(sensitivity.value,.5,1.5),
  getProfile:()=>byId(active),profiles:FRAMES});
}
const api=Object.freeze({FRAMES,byId,snapshot,attach,paint,buildPanel});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSACockpitIntegrated=api;
})(typeof window!=="undefined"?window:null);
