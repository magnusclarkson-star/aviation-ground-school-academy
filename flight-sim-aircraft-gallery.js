/* Seven locally hosted aircraft portrait illustrations for the cockpit selector.
   Visual reference only: flight physics, live gauges and cockpit controls are
   kept independent of this optional image gallery. */
(function(root){"use strict";
const FRAMES=Object.freeze([
 {id:"c172",name:"Cessna 172",src:"aircraft-c172.webp",alt:"White high-wing Cessna 172-style training aeroplane on an airfield"},
 {id:"r44",name:"Robinson R44",src:"aircraft-r44.webp",alt:"Blue Robinson R44-style helicopter on a helipad"},
 {id:"fa18",name:"F/A-18 Super Hornet",src:"aircraft-fa18.webp",alt:"Twin-tail F/A-18 Super Hornet-style jet on a flight deck"},
 {id:"f22",name:"F-22 Raptor",src:"aircraft-f22.webp",alt:"Angular grey F-22 Raptor-style jet on an airfield"},
 {id:"f35",name:"F-35 Lightning II",src:"aircraft-f35.webp",alt:"Single-engine F-35 Lightning II-style jet on an airfield"},
 {id:"typhoon",name:"Eurofighter Typhoon",src:"aircraft-typhoon.webp",alt:"Grey Eurofighter Typhoon-style delta-wing jet in flight"},
 {id:"su37",name:"Su-37",src:"aircraft-su37.webp",alt:"Camouflaged Su-37-style twin-tail jet above an airfield"}
].map(Object.freeze));
const byId=id=>FRAMES.find(f=>f.id===id)||FRAMES[0];
function attach({documentLike}={}){
 const doc=documentLike||root?.document;
 const actions=doc?.querySelector?.("#cockpitStation .cockpit-actions");
 const select=doc?.getElementById?.("cockpitAircraftSelect");
 if(!actions||!select)throw Error("Aircraft pictures need the flight cockpit selector and action bar");
 if(doc.getElementById("cockpitAircraftPhotoButton"))throw Error("Aircraft picture gallery already attached");
 const element=(tag,className)=>{const el=doc.createElement(tag);if(className)el.className=className;return el;};
 const button=element("button","aircraft-photo-button");
 button.type="button";button.id="cockpitAircraftPhotoButton";
 button.setAttribute("aria-label","Open pictures of all seven aircraft");
 button.setAttribute("aria-expanded","false");
 button.setAttribute("aria-controls","cockpitAircraftGallery");
 const buttonPhoto=element("img","aircraft-photo-preview");
 buttonPhoto.id="cockpitAircraftPhotoPreview";buttonPhoto.alt="";
 buttonPhoto.width=64;buttonPhoto.height=46;buttonPhoto.decoding="async";buttonPhoto.src=FRAMES[0].src;
 const buttonCaption=element("span","aircraft-photo-label");buttonCaption.textContent="AIRCRAFT PICTURES";
 button.append(buttonPhoto,buttonCaption);
 const more=doc.getElementById("cockpitHelpChoices");
 const helpToggle=doc.getElementById("cockpitHelpToggle");
 const inspect=doc.getElementById("aircraftInspectOpen");
 const focus=doc.getElementById("cockpitFocusButton");
 const win=doc.defaultView||root;
 const narrow=()=>win?.matchMedia?.(
  "(max-width:740px), (orientation:landscape) and (max-height:620px) and (min-width:600px)"
 )?.matches??false;
 function placePhotoAction(){
  // Aircraft picture is the main selector and must stay visible on phones.
  if(button.parentElement!==actions)actions.insertBefore(button,doc.getElementById("cockpitInstrumentStyle")||focus||helpToggle);
  // Move only the secondary 360-degree inspection control into More.
  if(narrow()&&more&&inspect&&inspect.parentElement!==more){
   more.appendChild(inspect);
  }else if(!narrow()&&inspect&&inspect.parentElement!==actions){
   actions.insertBefore(inspect,focus||helpToggle);
  }
 }
 placePhotoAction();
 win?.addEventListener?.("resize",placePhotoAction);

 const overlay=element("div","aircraft-gallery-overlay");
 overlay.id="cockpitAircraftGallery";overlay.hidden=true;
 overlay.setAttribute("role","dialog");
 overlay.setAttribute("aria-modal","true");
 overlay.setAttribute("aria-labelledby","cockpitGalleryHeading");
 const card=element("div","aircraft-gallery-card");
 const header=element("div","aircraft-gallery-header");
 const title=element("div","aircraft-gallery-heading");
 const eyebrow=element("span");eyebrow.textContent="AIRCRAFT GALLERY";
 const model=element("strong");model.id="cockpitGalleryHeading";
 title.append(eyebrow,model);
 const inspectButton=element("button","aircraft-gallery-inspect");
 inspectButton.type="button";inspectButton.id="cockpitAircraftGalleryInspect";
 inspectButton.textContent="⟳ 360° Rotate";
 inspectButton.setAttribute("aria-label","Open the selected aircraft in the interactive 360 degree viewer");
 inspectButton.setAttribute("aria-controls","aircraftInspectDialog");
 const closeButton=element("button","aircraft-gallery-close");
 closeButton.type="button";closeButton.id="cockpitAircraftGalleryClose";
 closeButton.setAttribute("aria-label","Close aircraft pictures");
 closeButton.textContent="Close ✕";
 header.append(title,inspectButton,closeButton);
 const largePhoto=element("img","aircraft-gallery-image");
 largePhoto.id="cockpitAircraftGalleryImage";
 largePhoto.loading="lazy";largePhoto.decoding="async";largePhoto.width=1024;largePhoto.height=768;
 largePhoto.tabIndex=0;
 largePhoto.setAttribute("role","button");
 largePhoto.setAttribute("aria-label","Enlarge the selected aircraft and rotate it in 360 degrees");
 const choices=element("div","aircraft-gallery-choices");
 choices.setAttribute("role","group");
 choices.setAttribute("aria-label","Choose another aircraft picture");
 const thumbnails=new Map();
 for(const aircraft of FRAMES){
  const item=element("button","aircraft-gallery-choice");
  item.type="button";item.dataset.aircraftId=aircraft.id;
  item.setAttribute("aria-label","Show "+aircraft.name+" aircraft picture");
  item.setAttribute("aria-pressed","false");
  const image=element("img");image.src=aircraft.src;image.alt="";
  image.loading="lazy";image.decoding="async";image.width=86;image.height=65;
  const label=element("span");label.textContent=aircraft.name;
  item.append(image,label);
  item.addEventListener("click",()=>{
   if(select.value!==aircraft.id){
    select.value=aircraft.id;
    // The main cockpit change listener remains authoritative for the
    // selected airframe, cockpit control and instrument configuration.
    select.dispatchEvent(new Event("change",{bubbles:true}));
   }
   update(aircraft.id);
  });
  choices.appendChild(item);
  thumbnails.set(aircraft.id,item);
 }
 card.append(header,largePhoto,choices);
 overlay.appendChild(card);
 doc.body.appendChild(overlay);
 let active=byId(select.value).id;
 function update(id){
  const aircraft=byId(id);active=aircraft.id;
  if(buttonPhoto.getAttribute("src")!==aircraft.src)buttonPhoto.src=aircraft.src;
  if(largePhoto.getAttribute("src")!==aircraft.src)largePhoto.src=aircraft.src;
  largePhoto.alt=aircraft.alt;
  model.textContent=aircraft.name;
  for(const [key,thumb] of thumbnails){
   thumb.setAttribute("aria-pressed",String(key===aircraft.id));
  }
 }
 function close(){
  if(overlay.hidden)return;
  overlay.hidden=true;delete doc.body.dataset.aircraftGallery;
  button.setAttribute("aria-expanded","false");
  button.focus({preventScroll:true});
 }
 function open(){
  update(select.value);
  doc.body.dataset.aircraftGallery="on";
  // A model picture is not an audio or flight-start command. Any queued R44
  // lesson speech/ATC is silenced before the gallery opens.
  doc.dispatchEvent(new Event("agsa:gallery-open"));
  overlay.hidden=false;button.setAttribute("aria-expanded","true");
  closeButton.focus({preventScroll:true});
 }
 function open360(){
  // Only one modal at a time. The existing inspector is authoritative
  // for drag, pinch, zoom and animation and uses the currently selected
  // aircraft. Keep its original More menu button available as a fallback.
  close();
  if(inspect)inspect.click();
 }
 inspectButton.addEventListener("click",open360);
 largePhoto.addEventListener("click",open360);
 largePhoto.addEventListener("keydown",event=>{
  if(event.key==="Enter"||event.key===" "){
   event.preventDefault();open360();
  }
 });
 button.addEventListener("click",()=>overlay.hidden?open():close());
 closeButton.addEventListener("click",close);
 overlay.addEventListener("click",event=>{if(event.target===overlay)close();});
 overlay.addEventListener("keydown",event=>{
  if(event.key==="Tab"){
   const focusables=[inspectButton,closeButton,largePhoto,...thumbnails.values()];
   const index=focusables.indexOf(doc.activeElement);
   if(event.shiftKey&&index===0){event.preventDefault();focusables[focusables.length-1].focus();}
   else if(!event.shiftKey&&index===focusables.length-1){event.preventDefault();focusables[0].focus();}
  }
 });
 doc.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&!overlay.hidden){
   event.preventDefault();event.stopImmediatePropagation();close();
  }
 },true);
 doc.addEventListener("agsa:aircraft-changed",event=>update(event.detail?.id),false);
 select.addEventListener("change",()=>update(select.value));
 update(active);
 return Object.freeze({open,close,update,frames:FRAMES});
}
function start(){
 if(!root?.document)return;
 if(root.document.readyState==="loading"){
  root.document.addEventListener("DOMContentLoaded",()=>attach({documentLike:root.document}),{once:true});
 }else attach({documentLike:root.document});
}
const api=Object.freeze({FRAMES,byId,attach});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root){root.AGSAAircraftGallery=api;start();}
})(typeof window!=="undefined"?window:null);
