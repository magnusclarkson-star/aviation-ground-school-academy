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
  slip:clamp((input?.rudder??0)*.72-bank/120,-1,1),
  angles:Object.freeze({
   speed:-130+clamp(speed,0,180)*260/180,
   alt:(ft%1000)*.36,
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
const HELP=Object.freeze({
 speed:{title:"Airspeed",text:"Shows airspeed in knots. Compare it with the attitude and height while flying."},
 attitude:{title:"Attitude indicator",text:"Blue is sky, brown is ground. The horizon tilts with bank and moves with pitch."},
 alt:{title:"Altimeter",text:"Shows height in feet above the simulated ground. Watch height during climb and descent."},
 turn:{title:"Turn coordinator",text:"This exercise displays a simplified bank indication. Use the heading to see the turn develop."},
 heading:{title:"Heading indicator",text:"Shows which compass direction the nose is pointing. A steady heading means a steady course in calm wind."},
 vsi:{title:"Vertical speed",text:"Positive values indicate a climb; negative values indicate descent. Read in feet per minute."},
 rpm:{title:"Dual tachometer",text:"Compares illustrated engine and rotor speed. Keep a close scan during helicopter practice."},
 power:{title:"Power indication",text:"Watch the helicopter's simulated collective-power indication when changing lift."},
 "mfd-pfd":{title:"Flight display",text:"Shows the artificial horizon, airspeed, height and heading together."},
 "mfd-att":{title:"Attitude display",text:"Follow the horizon to see pitch and bank. The centre mark represents your reference."},
 "mfd-nav":{title:"Navigation display",text:"Shows heading and ground speed. Compare heading with the outside view."},
 "mfd-engine":{title:"Systems display",text:"Shows the training power, engine indication and vertical speed."},
 panel:{title:"Flight instruments",text:"Tap any gauge or screen to enlarge its live reading. Tap the small ⓘ on a gauge for what it means."},
 controls:{title:"Flight controls",text:"Yoke, stick or cyclic: drag left/right to bank and up/down to pitch. Hold a rudder pedal with another finger. Use throttle or collective to change power or lift."},
 radio:{title:"Radio",text:"Listen to the controller, note the instruction, then respond in the radio training section. Radio audio starts after you tap its controls."}
});
function addInfoDot(doc,element,key,name){
 const dot=doc.createElement("button");
 dot.type="button";
 dot.className="cockpit-info-dot";
 dot.dataset.cockpitHelp=key;
 dot.textContent="ⓘ";
 dot.setAttribute("aria-label","Information about "+name);
 dot.setAttribute("aria-controls","cockpitInfoPanel");
 dot.setAttribute("aria-expanded","false");
 element.appendChild(dot);
}
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
 }else if(id==="heading"){
  const card=node("g",{"data-live-heading-card":"true"});
  // Heading rotates the compass card opposite aircraft heading.
  for(let j=0;j<72;j++){
   const angle=j*5;
   node("line",{x1:50,y1:11,x2:50,y2:j%6===0?18:j%3===0?15:13,
    stroke:j%6===0?"#f5f2df":"#aab5b7","stroke-width":j%6===0?1.6:.8,
    transform:"rotate("+angle+" 50 50)"},card);
  }
  for(let j=0;j<12;j++){
   const a=j*30*Math.PI/180;
   const labels=["N","3","6","E","12","15","S","21","24","W","30","33"];
   const el=node("text",{
    x:(50+27*Math.sin(a)).toFixed(2),y:(50-27*Math.cos(a)).toFixed(2),
    "text-anchor":"middle","dominant-baseline":"middle","font-size":j%3===0?8:6.8,
    "font-weight":j%3===0?800:650,fill:j===0?"#f0c878":"#e9eee7"
   },card);
   el.textContent=labels[j];
  }
  node("path",{d:"M50 9 L46 20 L54 20 Z",fill:"#f2d58b"});
  node("line",{x1:50,y1:37,x2:50,y2:63,stroke:"#e4f0e9","stroke-width":1.4});
  node("line",{x1:37,y1:50,x2:63,y2:50,stroke:"#e4f0e9","stroke-width":1.4});
  node("circle",{cx:50,cy:50,r:2.3,fill:"#f2d58b"});
 }else if(id==="alt"){
  for(let j=0;j<50;j++){
   node("line",{x1:50,y1:11,x2:50,y2:j%5===0?20:16,
    stroke:j%5===0?"#f7f2df":"#aab6ba","stroke-width":j%5===0?1.7:.7,
    transform:"rotate("+(j*7.2)+" 50 50)"});
  }
  for(let j=0;j<10;j++){
   const a=j*36*Math.PI/180;
   const el=node("text",{x:(50+29*Math.sin(a)).toFixed(2),
    y:(50-29*Math.cos(a)).toFixed(2),"font-size":7.5,
    fill:"#e6eee9","text-anchor":"middle","dominant-baseline":"middle","font-weight":700});
   el.textContent=String(j);
  }
  const thousands=node("g",{"data-live-alt-thousands":"true"});
  node("path",{d:"M47 53 L49.8 32 L53 53Z",fill:"#d9e3df",stroke:"#778991","stroke-width":.6},thousands);
  const hundreds=node("g",{"data-live-alt-hundreds":"true"});
  node("path",{d:"M48.4 52 L50 15 L51.6 52Z",fill:"#f2e3be"},hundreds);
  node("circle",{cx:50,cy:50,r:3,fill:"#d6e3de",stroke:"#424f55","stroke-width":1});
 }else if(id==="turn"){
  for(const angle of [-45,-22.5,0,22.5,45]){
   node("line",{x1:50,y1:12,x2:50,y2:angle===0?20:17,
    stroke:"#f3f1e8","stroke-width":angle===0?2:1,
    transform:"rotate("+angle+" 50 50)"});
  }
  const airplane=node("g",{"data-live-turn-airplane":"true"});
  node("path",{d:"M29 51 L44 49 L48 42 L52 42 L56 49 L71 51 L71 55 L55 54 L53 61 L47 61 L45 54 L29 55Z",
   fill:"#e5e6e1",stroke:"#7d8e98","stroke-width":.8},airplane);
  node("path",{d:"M26 74 Q50 85 74 74",stroke:"#ddd4be","stroke-width":3,fill:"none"});
  node("circle",{cx:50,cy:78,r:5,fill:"#30383d",stroke:"#aaa99c","stroke-width":1});
  node("circle",{cx:50,cy:77,r:3.2,fill:"#e6e7e3","data-live-slip":"true"});
 }else{
  const dialLabels={
   speed:["0","40","80","120","160"],alt:["0","2","4","6","8"],
   vsi:["-2","-1","0","+1","+2"],turn:["L","•","0","•","R"],
   heading:["W","30","N","6","E"],rpm:["0","25","50","75","100"],
   power:["0","25","50","75","100"]
  };
  const labels=dialLabels[id]||dialLabels.speed;
  for(let j=0;j<=20;j++){
   const angle=-130+j*260/20;
   node("line",{x1:50,y1:10,x2:50,y2:j%5===0?19:15,
    stroke:j%5===0?"#f2f0e5":"#99a5a8",
    "stroke-width":j%5===0?1.9:.75,
    transform:"rotate("+angle+" 50 50)"});
  }
  for(let j=0;j<5;j++){
   const angle=(-130+j*260/4)*Math.PI/180;
   const t=node("text",{x:(50+30*Math.sin(angle)).toFixed(2),
    y:(50-30*Math.cos(angle)).toFixed(2),fill:"#eeeada","font-size":7.4,
    "font-family":"sans-serif","font-weight":650,"text-anchor":"middle",
    "dominant-baseline":"middle"});
   t.textContent=labels[j];
  }
  if(id==="speed"||id==="rpm"){
   const ring=(start,end,color)=>{
    const theta=a=>a*Math.PI/180;
    const point=a=>({x:50+39*Math.sin(theta(a)),y:50-39*Math.cos(theta(a))});
    const p=point(start),q=point(end);
    node("path",{d:"M"+p.x.toFixed(2)+" "+p.y.toFixed(2)+" A39 39 0 0 1 "+q.x.toFixed(2)+" "+q.y.toFixed(2),
     fill:"none",stroke:color,"stroke-width":3,"stroke-linecap":"round"});
   };
   if(id==="speed"){ring(-45,58,"#75a984");ring(58,111,"#dfd074");ring(111,130,"#c87965");}
   else{ring(-70,85,"#7cab81");ring(85,130,"#cfad72");}
  }
  if(id==="turn"){
   node("path",{d:"M29 55 H40 L49 50 L60 55 H71",stroke:"#dce8e8","stroke-width":2.5,fill:"none"});
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
 addInfoDot(doc,face,id,label);
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
 addInfoDot(doc,screen,"mfd-"+kind,header.textContent);
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
  if(profile.id==="c172"){
   const avionics=doc.createElement("div");
   avionics.className="cockpit-avionics";
   avionics.setAttribute("aria-hidden","true");
   avionics.innerHTML=`<div class="avionics-topline">NAV / COM</div>
    <div class="avionics-radio"><small>COM 1</small><span>118.000</span><i aria-hidden="true"></i></div>
    <div class="avionics-radio"><small>NAV 1</small><span>110.300</span><i aria-hidden="true"></i></div>
    <div class="avionics-screen"><span class="avionics-screen-label">MAP</span>
     <div class="avionics-track"></div><span class="avionics-plane">✈</span>
    </div><div class="avionics-buttons"><i></i><i></i><i></i><i></i><i></i></div>`;
   holder.appendChild(avionics);
  }
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
 for(const el of holder.querySelectorAll("[data-live-heading-card]")){
  el.setAttribute("transform","rotate("+(-s.heading).toFixed(2)+" 50 50)");
 }
 for(const el of holder.querySelectorAll("[data-live-alt-hundreds]")){
  el.setAttribute("transform","rotate("+s.angles.alt.toFixed(2)+" 50 50)");
 }
 for(const el of holder.querySelectorAll("[data-live-alt-thousands]")){
  const thousands=(Number(s.values.alt)%10000)/10000*360;
  el.setAttribute("transform","rotate("+thousands.toFixed(2)+" 50 50)");
 }
 for(const el of holder.querySelectorAll("[data-live-turn-airplane]")){
  el.setAttribute("transform","rotate("+s.bank.toFixed(2)+" 50 50)");
 }
 for(const el of holder.querySelectorAll("[data-live-slip]")){
  el.setAttribute("cx",(50+s.slip*12).toFixed(2));
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
 const infoPanel=$("cockpitInfoPanel"),infoTitle=$("cockpitInfoTitle"),infoText=$("cockpitInfoText");
 const cockpitStation=$("cockpitStation");
 const win=root||null;
 if(!zoomPanel||!zoomContent||!zoomTitle||!infoPanel||!infoTitle||!infoText)throw Error("Cockpit info or zoom controls missing");
 if(!wrap||!holder||!control)throw Error("Cockpit controls or panel missing");
 // Move, never duplicate: existing pointer events, IDs and instrument hooks survive.
 wrap.appendChild(control);
 wrap.classList.add("cockpit-flightdeck");
 const launch=doc.querySelector(".full-flight-launch");
 const stationHeader=cockpitStation.querySelector(".cockpit-station-head");
 if(launch&&stationHeader)stationHeader.appendChild(launch);
 const about=doc.querySelector(".sim-about");
 const main=doc.querySelector("main");
 if(about&&main)main.appendChild(about);
 const select=$("cockpitAircraftSelect");
 select.replaceChildren();
 for(const frame of FRAMES){
  const option=doc.createElement("option");option.value=frame.id;option.textContent=frame.title;
  select.appendChild(option);
 }
 let active="c172";
 function closeInfo(){
  infoPanel.hidden=true;
  for(const button of cockpitStation.querySelectorAll("[data-cockpit-help]"))button.setAttribute("aria-expanded","false");
 }
 function openInfo(key,trigger){
  let selected=HELP[key];
  if(key==="panel"){
   selected=byId(active).family==="rotor"?
    {title:"Helicopter instruments",text:"Scan rotor and engine indications, airspeed, attitude, height and vertical speed. Tap a gauge to enlarge it."}:
    byId(active).family==="jet"?
    {title:"Flight displays",text:"Primary display: horizon, speed and height. Navigation: heading and ground speed. Systems: power and climb."}:HELP.panel;
  }
  if(key==="controls"&&byId(active).family==="rotor"){
   selected={title:"Helicopter controls",text:"Cyclic: move to change pitch and roll. Collective: change lift. Pedals: turn the nose. Keep them in view together."};
  }
  if(!selected)return false;
  closeZoom();
  closeInfo();
  infoTitle.textContent=selected.title;
  infoText.textContent=selected.text;
  infoPanel.hidden=false;
  trigger?.setAttribute("aria-expanded","true");
  return true;
 }
 function closeZoom(){
  zoomPanel.hidden=true;
  zoomContent.replaceChildren();
  zoomTitle.textContent="Instrument";
 }
 function openZoom(tile){
  closeInfo();
  const clone=tile.cloneNode(true);
  clone.querySelector(".cockpit-info-dot")?.remove();
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
  const dot=event.target?.closest?.(".cockpit-info-dot");
  if(dot){
   event.preventDefault();
   event.stopPropagation();
   openInfo(dot.dataset.cockpitHelp,dot);
   return;
  }
  const tile=event.target?.closest?.(".cockpit-gauge, .cockpit-mfd");
  if(tile&&holder.contains(tile))openZoom(tile);
 });
 holder.addEventListener("keydown",event=>{
  if(event.target?.closest?.(".cockpit-info-dot"))return;
  if(event.key!=="Enter"&&event.key!==" ")return;
  const tile=event.target?.closest?.(".cockpit-gauge, .cockpit-mfd");
  if(!tile||!holder.contains(tile))return;
  event.preventDefault();openZoom(tile);
 });
 $("cockpitZoomClose").addEventListener("click",closeZoom);
 $("cockpitInfoClose").addEventListener("click",closeInfo);
 for(const button of cockpitStation.querySelectorAll(".cockpit-info-toolbar [data-cockpit-help]")){
  button.addEventListener("click",()=>{
   const key=button.dataset.cockpitHelp;
   if(!infoPanel.hidden&&button.getAttribute("aria-expanded")==="true")closeInfo();
   else openInfo(key,button);
  });
 }
 doc.addEventListener("keydown",event=>{
  if(event.key!=="Escape")return;
  if(!zoomPanel.hidden)closeZoom();
  if(!infoPanel.hidden)closeInfo();
 });
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
  $("cockpitAircraftNotice").textContent=profile.family==="jet"?"FLIGHT DISPLAYS":profile.family==="rotor"?"ROTORCRAFT INSTRUMENTS":"PRIMARY FLIGHT INSTRUMENTS";
  $("cockpitGripLabel").textContent=profile.pilot;
  $("cockpitJetHud").hidden=profile.family!=="jet";
  buildPanel(doc,profile,holder);
  closeZoom();
  closeInfo();
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
 return Object.freeze({choose,update,openZoom,closeZoom,openInfo,closeInfo,refreshOrientation,
  sensitivity:()=>1,
  getProfile:()=>byId(active),profiles:FRAMES});
}
const api=Object.freeze({FRAMES,HELP,byId,snapshot,attach,paint,buildPanel});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSACockpitIntegrated=api;
})(typeof window!=="undefined"?window:null);
