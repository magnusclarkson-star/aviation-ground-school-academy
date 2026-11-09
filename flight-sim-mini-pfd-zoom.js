/* The small always-live PFD enlarges in place: no duplicate SVG IDs or
 * stale instrument values. The cockpit's separate glass display uses its
 * own zoom handler. Both remain operable on touch and keyboard.
 */
(function(root){"use strict";
 function attach(doc=root?.document){
  const panel=doc?.querySelector?.("#flightInstruments .mini-pfd");
  if(!panel)return null;
  const close=doc.createElement("button");
  close.type="button";
  close.className="agsa-mini-pfd-close";
  close.textContent="Close ×";
  close.setAttribute("aria-label","Close enlarged primary flight display");
  close.hidden=true;
  panel.appendChild(close);
  panel.tabIndex=0;
  panel.setAttribute("role","button");
  panel.setAttribute("aria-expanded","false");
  panel.setAttribute("aria-label","Enlarge live primary flight display");
  let expanded=false;
  function setExpanded(value){
   expanded=!!value;
   panel.classList.toggle("agsa-mini-pfd-expanded",expanded);
   panel.setAttribute("aria-expanded",String(expanded));
   panel.setAttribute("aria-label",expanded?"Enlarged primary flight display; activate to close":"Enlarge live primary flight display");
   close.hidden=!expanded;
   if(expanded)close.focus({preventScroll:true});else panel.focus({preventScroll:true});
   return expanded;
  }
  panel.addEventListener("click",event=>{
   if(event.target===close){event.stopPropagation();setExpanded(false);return;}
   setExpanded(!expanded);
  });
  panel.addEventListener("keydown",event=>{
   if(event.target===close)return;
   if(event.key!=="Enter"&&event.key!==" ")return;
   event.preventDefault();setExpanded(!expanded);
  });
  doc.addEventListener("pointerdown",event=>{
   if(expanded&&!panel.contains(event.target))setExpanded(false);
  });
  doc.addEventListener("keydown",event=>{
   if(event.key==="Escape"&&expanded){event.preventDefault();setExpanded(false);}
  });
  return Object.freeze({setExpanded,isExpanded:()=>expanded});
 }
 const api={attach};
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root?.document)attach(root.document);
 if(root)root.AGSAMiniPFDZoom=api;
})(typeof window!=="undefined"?window:null);
