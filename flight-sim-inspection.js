/* Touch-friendly, aircraft-specific orbit viewer. The inspection canvas never
 * receives or changes flight control input; it only renders the current type. */
(function(root){"use strict";
 const limits=Object.freeze({minDistance:17,maxDistance:70,minElevation:-65,maxElevation:78});
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
 const wrap=degrees=>((degrees%360)+360)%360;
 function orbitStep(orbit,deltaX,deltaY){
  return Object.freeze({
   azimuth:wrap((orbit?.azimuth??0)+deltaX*.55),
   elevation:clamp((orbit?.elevation??28)+deltaY*.38,limits.minElevation,limits.maxElevation),
   distance:clamp(orbit?.distance??30,limits.minDistance,limits.maxDistance)
  });
 }
 function zoomStep(orbit,factor){
  return Object.freeze({...orbit,distance:clamp(orbit.distance*factor,
   limits.minDistance,limits.maxDistance)});
 }
 // Enlarging the gap between two fingers zooms in, just like an aircraft photo.
 function pinchStep(orbit,previousSpan,nextSpan){
  if(!Number.isFinite(previousSpan)||!Number.isFinite(nextSpan)||
     previousSpan<=0||nextSpan<=0)return Object.freeze({...orbit});
  return zoomStep(orbit,previousSpan/nextSpan);
 }
 function separation(points){
  const [a,b]=Array.from(points.values());
  return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;
 }
 function attach({documentLike,windowLike}={}){
  const doc=documentLike||root?.document,win=windowLike||root;
  const $=id=>doc.getElementById(id);
  const trigger=$("aircraftInspectOpen"),modal=$("aircraftInspectDialog"),
   viewport=$("aircraftInspectViewport"),canvas3D=$("aircraftInspectCanvas3D"),
   canvas2D=$("aircraftInspectCanvas2D"),select=$("cockpitAircraftSelect");
  if(!trigger||!modal||!viewport||!canvas3D||!canvas2D||!select)
   throw Error("360° inspector requires its cockpit controls and canvases");
  let orbit={azimuth:0,elevation:26,distance:30};
  let renderer=null,raf=0,last=0,drag=null,autoRotate=false,usingGPU=false;
  // Pointer IDs are tracked independently so a second touch changes zoom,
  // rather than making the model unexpectedly spin or the flight yoke move.
  const pointers=new Map();
  let pinchSpan=0;
  const ctx=canvas2D.getContext("2d",{alpha:false});
  const engine=win.AGSAFlight3D,exterior=win.AGSAExteriorChase2D,types=win.AGSAExteriorAirframes;
  if(!engine||!exterior||!types)throw Error("360° inspector needs 3D airframe and 2D fallback engines");
  const selected=()=>types.IDS.includes(select.value)?select.value:"c172";
  function updateHeading(){
   const id=selected();
   $("aircraftInspectModelSelect").value=id;
   $("aircraftInspectModel").textContent=types.LABELS[id];
   $("aircraftInspectAngles").textContent="AZ "+String(Math.round(orbit.azimuth)).padStart(3,"0")+
    "° · EL "+Math.round(orbit.elevation)+"°";
   $("aircraftInspectZoomValue").textContent=Math.round(30/orbit.distance*100)+"%";
   $("aircraftInspectSpin").setAttribute("aria-pressed",String(autoRotate));
   $("aircraftInspectSpin").textContent=autoRotate?"Stop rotation":"Auto rotate";
  }
  function fallback(){
   usingGPU=false;
   if(renderer){renderer.destroy();renderer=null}
   canvas3D.hidden=true;canvas2D.hidden=false;
   $("aircraftInspectRenderMode").textContent="2D view";
  }
  function render(now){
   if(modal.hidden)return;
   const id=selected();
   updateHeading();
   if(autoRotate&&last)orbit={...orbit,azimuth:wrap(orbit.azimuth+
    Math.min(.08,(now-last)/1000)*17)};
   last=now;
   const spin=now/1000;
   const animation=id==="r44"?{mainRotor:spin*35,tailRotor:spin*122}:
    id==="c172"?{propeller:spin*43}:{};
   const state={mode:id==="r44"?"helicopter":"airplane",xM:0,zM:0,
    altitudeM:0,headingDeg:0,pitchDeg:0,rollDeg:0};
   if(renderer&&usingGPU){
    try{if(!renderer.draw(state,{view:"inspect",airframeId:id,orbit,animation,lighting:"day"}))
     fallback();
    }catch{fallback()}
   }
   if(!usingGPU){
    const rect=viewport.getBoundingClientRect(),pixelRatio=Math.min(1.25,win.devicePixelRatio||1);
    const w=Math.max(1,Math.min(960,Math.round(rect.width*pixelRatio)));
    const h=Math.max(1,Math.min(630,Math.round(rect.height*pixelRatio)));
    if(canvas2D.width!==w||canvas2D.height!==h){
     canvas2D.width=w;canvas2D.height=h;
    }
    const gradient=ctx.createLinearGradient(0,0,0,h);
    gradient.addColorStop(0,"#263f51");gradient.addColorStop(1,"#09151d");
    ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
    exterior.paint(ctx,state,{id,width:w,height:h,view:"inspect",orbit,animation});
   }
   // 24 fps is sufficient for inspection and protects mobile battery.
   raf=win.requestAnimationFrame(frame);
  }
  function frame(now){if(!modal.hidden&&now-lastFrameTime>=40){lastFrameTime=now;render(now)}
   else if(!modal.hidden)raf=win.requestAnimationFrame(frame)}
  let lastFrameTime=0;
  function open(){
   if(!modal.hidden)return;
   orbit={azimuth:0,elevation:26,distance:30};autoRotate=false;last=0;lastFrameTime=0;
   modal.hidden=false;doc.body.dataset.aircraftInspect="on";
   trigger.setAttribute("aria-expanded","true");
   canvas2D.hidden=false;canvas3D.hidden=true;
   if(!renderer){
    try{renderer=engine.createRenderer(canvas3D,{inspectionOnly:true,onLost:fallback})}catch{renderer=null}
   }
   usingGPU=Boolean(renderer);
   canvas3D.hidden=!usingGPU;canvas2D.hidden=usingGPU;
   $("aircraftInspectRenderMode").textContent=usingGPU?"3D view":"2D view";
   updateHeading();
   $("aircraftInspectClose").focus({preventScroll:true});
   raf=win.requestAnimationFrame(frame);
  }
  function close(){
   if(modal.hidden)return;
   modal.hidden=true;delete doc.body.dataset.aircraftInspect;
   trigger.setAttribute("aria-expanded","false");
   win.cancelAnimationFrame(raf);raf=0;last=0;
   drag=null;pointers.clear();pinchSpan=0;
   trigger.focus({preventScroll:true});
  }
  function reset(){
   orbit={azimuth:0,elevation:26,distance:30};
   autoRotate=false;updateHeading();
  }
  $("aircraftInspectModelSelect").addEventListener("change",event=>{
   const id=event.target.value;
   if(!types.IDS.includes(id))return;
   if(select.value!==id){
    select.value=id;
    select.dispatchEvent(new Event("change",{bubbles:true}));
   }
   updateHeading();
  });
  trigger.addEventListener("click",open);
  $("aircraftInspectClose").addEventListener("click",close);
  $("aircraftInspectReset").addEventListener("click",reset);
  $("aircraftInspectZoomIn").addEventListener("click",()=>{orbit=zoomStep(orbit,.81);updateHeading()});
  $("aircraftInspectZoomOut").addEventListener("click",()=>{orbit=zoomStep(orbit,1.22);updateHeading()});
  $("aircraftInspectSpin").addEventListener("click",()=>{autoRotate=!autoRotate;updateHeading()});
  modal.addEventListener("click",event=>{if(event.target===modal)close()});
  viewport.addEventListener("pointerdown",event=>{
   if(modal.hidden||(event.pointerType==="mouse"&&event.button!==0)||
      pointers.has(event.pointerId))return;
   pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
   viewport.setPointerCapture(event.pointerId);
   if(pointers.size===1){
    drag={id:event.pointerId,x:event.clientX,y:event.clientY};pinchSpan=0;
   }else{
    drag=null;pinchSpan=separation(pointers);
   }
   autoRotate=false;
   event.preventDefault();
  });
  viewport.addEventListener("pointermove",event=>{
   const pointer=pointers.get(event.pointerId);
   if(!pointer)return;
   pointer.x=event.clientX;pointer.y=event.clientY;
   if(pointers.size>=2){
    const span=separation(pointers);
    if(pinchSpan>0&&span>0)orbit=pinchStep(orbit,pinchSpan,span);
    pinchSpan=span;drag=null;
   }else if(drag?.id===event.pointerId){
    orbit=orbitStep(orbit,event.clientX-drag.x,event.clientY-drag.y);
    drag.x=event.clientX;drag.y=event.clientY;
   }
   event.preventDefault();
  });
  for(const type of ["pointerup","pointercancel","lostpointercapture"])
   viewport.addEventListener(type,event=>{
    if(!pointers.delete(event.pointerId))return;
    if(pointers.size===1){
     const [id,point]=pointers.entries().next().value;
     drag={id,x:point.x,y:point.y};pinchSpan=0;
    }else{
     drag=null;pinchSpan=separation(pointers);
    }
   });
  viewport.addEventListener("wheel",event=>{
   if(modal.hidden)return;
   event.preventDefault();
   orbit=zoomStep(orbit,event.deltaY>0?1.08:.92);
  },{passive:false});
  doc.addEventListener("keydown",event=>{
   if(modal.hidden)return;
   if(event.key==="Escape"){event.preventDefault();event.stopImmediatePropagation();close();return}
   if(event.key==="ArrowLeft"||event.key==="ArrowRight"||
      event.key==="ArrowUp"||event.key==="ArrowDown"){
    event.preventDefault();event.stopImmediatePropagation();
    orbit=orbitStep(orbit,event.key==="ArrowLeft"?-15:event.key==="ArrowRight"?15:0,
     event.key==="ArrowUp"?-10:event.key==="ArrowDown"?10:0);return;
   }
   if(event.key==="Tab"){
    const els=[ $("aircraftInspectClose"),$("aircraftInspectModelSelect"),$("aircraftInspectZoomIn"),
      $("aircraftInspectZoomOut"),$("aircraftInspectReset"),$("aircraftInspectSpin") ];
    const first=els[0],last=els[els.length-1];
    if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus()}
   }
  },true);
  doc.addEventListener("agsa:aircraft-changed",()=>{if(!modal.hidden)updateHeading()});
  return Object.freeze({open,close,reset,getOrbit:()=>({...orbit}),isOpen:()=>!modal.hidden});
 }
 function start(){
  if(!root?.document)return;
  if(root.document.readyState==="loading")
   root.document.addEventListener("DOMContentLoaded",()=>attach({documentLike:root.document,windowLike:root}),{once:true});
  else attach({documentLike:root.document,windowLike:root});
 }
 const api=Object.freeze({orbitStep,zoomStep,pinchStep,attach});
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root){root.AGSAInspection=api;start();}
})(typeof window!=="undefined"?window:null);
