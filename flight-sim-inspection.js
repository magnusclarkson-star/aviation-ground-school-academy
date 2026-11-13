/* Touch-friendly, aircraft-specific orbit viewer. The inspection canvas never
 * receives or changes flight control input; it only renders the current type. */
(function(root){"use strict";
 const limits=Object.freeze({minDistance:6.8,maxDistance:70,minElevation:-65,maxElevation:78});
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
 const wrap=degrees=>((degrees%360)+360)%360;
 function orbitStep(orbit,deltaX,deltaY){
  return Object.freeze({
   ...orbit,
   azimuth:wrap((orbit?.azimuth??0)+deltaX*.55),
   elevation:clamp((orbit?.elevation??28)+deltaY*.38,limits.minElevation,limits.maxElevation),
   distance:clamp(orbit?.distance??30,
    orbit?.interior?1.45:limits.minDistance,
    orbit?.interior?12:limits.maxDistance)
  });
 }
 function zoomStep(orbit,factor){
  return Object.freeze({...orbit,distance:clamp(orbit.distance*factor,
   orbit.interior?1.45:limits.minDistance,orbit.interior?12:limits.maxDistance)});
 }
 // Enlarging the gap between two fingers zooms in, just like an aircraft photo.
 function pinchStep(orbit,previousSpan,nextSpan){
  if(!Number.isFinite(previousSpan)||!Number.isFinite(nextSpan)||
     previousSpan<=0||nextSpan<=0)return Object.freeze({...orbit});
  return zoomStep(orbit,previousSpan/nextSpan);
 }
 // Double-tap toggles a useful close view while preserving the exact
 // aircraft bearing and elevation. Fitted size returns to 100% on second use.
 function doubleTapZoom(orbit,far=18){
  const fitted=orbit.interior?3:far;
  const close=orbit.interior?1.8:far<=12?7.6:9;
  return Object.freeze({...orbit,
   distance:orbit.distance<fitted*.86?fitted:close});
 }
 function separation(points){
  const [a,b]=Array.from(points.values());
  return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;
 }
 // The five fighters differ substantially in wingspan/length. One fixed
 // 18-metre camera radius made the smaller Typhoon and F-35B look like tiny
 // thumbnails on phones. Keep the approved C172/R44 framing unchanged.
 function fitDistanceFor(id){
  const fitted={c172:12,r44:16,fa18:15,f22:16,f35:15,
   typhoon:14,su37:17};
  return fitted[id]??18;
 }
 function attach({documentLike,windowLike}={}){
  const doc=documentLike||root?.document,win=windowLike||root;
  const $=id=>doc.getElementById(id);
  const trigger=$("aircraftInspectOpen"),modal=$("aircraftInspectDialog"),
   viewport=$("aircraftInspectViewport"),canvas3D=$("aircraftInspectCanvas3D"),
   canvas2D=$("aircraftInspectCanvas2D"),select=$("cockpitAircraftSelect");
  if(!trigger||!modal||!viewport||!canvas3D||!canvas2D||!select)
   throw Error("360° inspector requires its cockpit controls and canvases");
  let orbit={azimuth:0,elevation:26,distance:18};
  let renderer=null,raf=0,last=0,drag=null,autoRotate=false,usingGPU=false;
  let lastRenderedId=null;
  // Pointer IDs are tracked independently so a second touch changes zoom,
  // rather than making the model unexpectedly spin or the flight yoke move.
  const pointers=new Map(),tapStarts=new Map();
  let pinchSpan=0,lastTap=null;
  const ctx=canvas2D.getContext("2d",{alpha:false});
  const engine=win.AGSAFlight3D,exterior=win.AGSAExteriorChase2D,types=win.AGSAExteriorAirframes;
  if(!engine||!exterior||!types)throw Error("360° inspector needs 3D airframe and 2D fallback engines");
  const selected=()=>types.IDS.includes(select.value)?select.value:"c172";
  const interiorButton=$("aircraftInspectInterior");
  const exteriorButton=$("aircraftInspectExterior");
  // Author-hosted 360° textured exteriors. Interior mode and all active
  // flight physics stay on the existing local meshes. Only one iframe is
  // mounted at any time to avoid exhausting mobile GPU resources.
  const texturedViewer=$("aircraftInspectSuperHornet");
  const texturedFrame=$("aircraftInspectSuperHornetFrame");
  const texturedTitle=$("aircraftInspectTexturedTitle");
  const texturedCredit=$("aircraftInspectTexturedCredit");
  const texturedLink=$("aircraftInspectTexturedSource");
  const texturedModels=Object.freeze({
   fa18:{uid:"9e852037bf2141dcb3fda17013958131",
    name:"F/A-18E Super Hornet",author:"KOG_THORNS",license:"CC BY",
    page:"https://sketchfab.com/3d-models/boeing-fa-18e-super-hornet-9e852037bf2141dcb3fda17013958131"},
   f22:{uid:"2a64abf0866a405c865466c7642ca689",
    name:"F-22 Raptor",author:"NLM",license:"CC BY",
    page:"https://sketchfab.com/3d-models/f22-raptor-free-2a64abf0866a405c865466c7642ca689"},
   f35:{uid:"db911de503c74285a8d506951df786d6",
    name:"F-35 Lightning II (family reference)",author:"andertan",license:"CC BY",
    page:"https://sketchfab.com/3d-models/lockheed-martin-f35-lightning-ii-db911de503c74285a8d506951df786d6",
    note:"Family reference model, not verified as F-35B-specific"},
   typhoon:{uid:"b3ede3f4280f4bf99ebbd4ebc7f5480d",
    name:"Eurofighter Typhoon",author:"Chenzoss",license:"CC BY",
    page:"https://sketchfab.com/3d-models/eurofighter-typhoon-3d-b3ede3f4280f4bf99ebbd4ebc7f5480d"},
   c172:{uid:"be55bf96a63b41fdb953b6829ff0d4bf",
    name:"Cessna 172SP",author:"NLM",license:"CC BY",
    page:"https://sketchfab.com/3d-models/free-cessna-172sp-be55bf96a63b41fdb953b6829ff0d4bf"},
   r44:{uid:"36e3498a5dc54d16a6d964f9b525deb8",
    name:"Robinson R44",author:"syarifudinirfan701",license:"CC BY",
    page:"https://sketchfab.com/3d-models/robinson-r44-36e3498a5dc54d16a6d964f9b525deb8"}
   // Su-37 retains its local viewer until a source-authentic and clearly
   // licensed Su-37 model is verified; Su-35 is not interchangeable.
  });
  const externalControls=["aircraftInspectZoomIn","aircraftInspectZoomOut",
   "aircraftInspectReset","aircraftInspectSpin"];
  function syncTexturedViewer(){
   const model=!orbit.interior?texturedModels[selected()]:null;
   const active=!modal.hidden&&Boolean(model);
   texturedViewer.hidden=!active;
   for(const id of externalControls)$(id).disabled=active;
   if(!active){
    // Prevent invisible Sketchfab views from consuming phone memory.
    if(texturedFrame.hasAttribute("src"))texturedFrame.removeAttribute("src");
    return false;
   }
   const src="https://sketchfab.com/models/"+model.uid+
    "/embed?autostart=1&ui_infos=0&ui_controls=1&ui_watermark=1";
   if(texturedFrame.getAttribute("src")!==src)
    texturedFrame.setAttribute("src",src);
   texturedFrame.title="Rotate the "+model.name+" textured 3D model";
   texturedTitle.textContent=model.name;
   texturedCredit.textContent="3D: "+model.author+" · "+model.license+
    (model.note?" · "+model.note:"");
   texturedLink.href=model.page;
   canvas3D.hidden=true;canvas2D.hidden=true;
   viewport.dataset.modelLoading="off";
   $("aircraftInspectLoading").textContent="";
   $("aircraftInspectRenderMode").textContent="Textured 3D · "+selected().toUpperCase();
   $("aircraftInspectDescription").textContent=
    "Drag in the model to rotate · Pinch inside to zoom · Exterior only · "+
    model.author+" ("+model.license+")";
   return true;
  }
  const interiorDistance=id=>id==="f22"||id==="su37"?4.35:id==="r44"?3.25:2.90;
  function setInterior(on){
   // Never silently display the exterior silhouette when WebGL2 is absent.
   if(on&&!usingGPU){
    $("aircraftInspectLoading").textContent="Interior 3D requires WebGL2 on this device.";
    viewport.dataset.interiorUnsupported="on";
    return;
   }
   delete viewport.dataset.interiorUnsupported;
   if(Boolean(orbit.interior)===on)return;
   orbit={azimuth:on?24:0,elevation:on?15:26,
    distance:on?interiorDistance(selected()):fitDistance(),interior:on};
   autoRotate=false;lastRenderedId=null;
   canvas3D.hidden=true;canvas2D.hidden=true;
   updateHeading();
   syncTexturedViewer();
  }
  // The two compact training aircraft need closer framing than large jets.
  const fitDistance=()=>fitDistanceFor(selected());
  function updateHeading(){
   const id=selected();
   $("aircraftInspectModelSelect").value=id;
   $("aircraftInspectModel").textContent=types.LABELS[id];
   $("aircraftInspectAngles").textContent="AZ "+String(Math.round(orbit.azimuth)).padStart(3,"0")+
    "° · EL "+Math.round(orbit.elevation)+"°";
   $("aircraftInspectZoomValue").textContent=Math.round(
    (orbit.interior?interiorDistance(id):fitDistance())/orbit.distance*100)+"%";
   $("aircraftInspectSpin").setAttribute("aria-pressed",String(autoRotate));
   $("aircraftInspectSpin").textContent=autoRotate?"Stop rotation":"Auto rotate";
   interiorButton.setAttribute("aria-pressed",String(Boolean(orbit.interior)));
   exteriorButton.setAttribute("aria-pressed",String(!orbit.interior));
   $("aircraftInspectDescription").textContent=orbit.interior?
    "Interior study · Drag to look around · Pinch to zoom · Exterior returns to the full aircraft.":
    "Exterior 360° · Drag to rotate · Pinch or double tap to zoom.";
  }
  function fallback(){
   usingGPU=false;
   if(orbit.interior){
    orbit={azimuth:0,elevation:26,distance:fitDistance(),interior:false};
    viewport.dataset.interiorUnsupported="on";
   }
   interiorButton.disabled=true;
   updateHeading();
   if(renderer){renderer.destroy();renderer=null}
   canvas3D.hidden=true;canvas2D.hidden=false;
   viewport.dataset.modelLoading="off";
   $("aircraftInspectRenderMode").textContent="2D view";
  }
  // The genuine F-22/F-35B meshes load on demand. Hide BOTH canvases
  // while loading, so switching from another jet never exposes a stale frame
  // or the old procedural aircraft. This does not affect the pilot controls.
  function syncModelVisibility(){
   const id=selected();
   let phase="ready";
   // A cockpit is an independent local mesh, so no exterior download is
   // required when the user selects Interior.
   if(renderer&&usingGPU&&!orbit.interior){
    if(id==="c172")phase=renderer.realC172Status;
    else if(id==="r44")phase=renderer.realR44Status;
    else if(["f22","f35","su37","typhoon"].includes(id))
     phase=renderer.prepareAirframe?.(id)??"fallback";
   }
   const loading=Boolean(usingGPU&&(phase==="loading"||phase==="idle"));
   const failed=Boolean(usingGPU&&phase==="fallback");
   const stale=lastRenderedId!==id;
   const gpuVisible=usingGPU&&!loading&&!failed&&!stale;
   // Do not show the old procedural 2D fighter in the seconds before its
   // genuine 3D mesh becomes ready. The loading panel names the selection
   // until the first matching 3D frame has successfully rendered.
   canvas3D.hidden=!gpuVisible;
   canvas2D.hidden=loading||gpuVisible;
   if(stale){
    ctx.clearRect(0,0,canvas2D.width,canvas2D.height);
   }
   viewport.dataset.modelLoading=loading?"on":"off";
   const statusText=viewport.dataset.interiorUnsupported==="on"?
    "Interior 3D requires WebGL2. Exterior view is available.":
    loading?"Loading "+types.LABELS[id]+" 3D model…":
    failed?types.LABELS[id]+" 3D unavailable — showing 2D view.":
    "";
   const statusLabel=$("aircraftInspectLoading");
   if(statusLabel&&statusLabel.textContent!==statusText)
    statusLabel.textContent=statusText;
   const modeText=gpuVisible?"3D view":loading?"Loading 3D":"2D fallback";
   // Make a stale browser bundle immediately detectable on Android. If
   // this label is missing, the phone has not loaded the dedicated mesh.
   $("aircraftInspectRenderMode").textContent=
    id==="su37"&&gpuVisible?"Su-37 · Native painted 3D":
    id==="fa18"?"Super Hornet V3 · "+modeText:modeText;
   return {loading,failed,gpuVisible};
  }
  function paint2D(state,id,animation){
   const rect=viewport.getBoundingClientRect();
   const pixelRatio=Math.min(1.25,win.devicePixelRatio||1);
   const w=Math.max(1,Math.min(960,Math.round(rect.width*pixelRatio)));
   const h=Math.max(1,Math.min(630,Math.round(rect.height*pixelRatio)));
   if(canvas2D.width!==w||canvas2D.height!==h){
    canvas2D.width=w;canvas2D.height=h;
   }
   const gradient=ctx.createLinearGradient(0,0,0,h);
   gradient.addColorStop(0,"#263f51");
   gradient.addColorStop(1,"#09151d");
   ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
   exterior.paint(ctx,state,{id,width:w,height:h,view:"inspect",orbit,animation});
  }
  function render(now){
   if(modal.hidden)return;
   const id=selected();
   updateHeading();
   if(syncTexturedViewer()){
    last=now;
    raf=win.requestAnimationFrame(frame);
    return;
   }
   const phase=syncModelVisibility();
   if(autoRotate&&last)orbit={...orbit,azimuth:wrap(orbit.azimuth+
    Math.min(.08,(now-last)/1000)*17)};
   last=now;
   const spin=now/1000;
   const animation=id==="r44"?{mainRotor:spin*35,tailRotor:spin*122,rotorBlurOpacity:.14}:
    id==="c172"?{propeller:spin*43}:{};
   const state={mode:id==="r44"?"helicopter":"airplane",xM:0,zM:0,
    altitudeM:0,headingDeg:0,pitchDeg:0,rollDeg:0};
   // Preserve the 2D aircraft while the matching 3D mesh is pending. Even
   // a failed WebGL draw must not leave both canvases invisible.
   let drawn=false;
   if(renderer&&usingGPU&&!phase.loading&&!phase.failed){
    try{drawn=Boolean(renderer.draw(state,{
     view:"inspect",airframeId:id,orbit,animation,lighting:"day"
    }));}catch(error){
     if(typeof console!=="undefined")console.warn("360° 3D draw:",error);
     fallback();
    }
   }
   if(!drawn){
    canvas3D.hidden=true;
    canvas2D.hidden=phase.loading;
    // A model in transit must not flash the earlier simplified exterior.
    // Real GPU failure keeps the explicit 2D fallback available.
    if(!phase.loading)try{paint2D(state,id,animation)}
    catch(error){
     if(typeof console!=="undefined")console.warn("360° 2D draw:",error);
     $("aircraftInspectLoading").textContent="Aircraft preview could not be drawn. Close and reopen the inspector.";
     viewport.dataset.modelLoading="unavailable";
    }
   }else{
    lastRenderedId=id;
    syncModelVisibility();
   }
   raf=win.requestAnimationFrame(frame);
  }
  function frame(now){if(!modal.hidden&&now-lastFrameTime>=40){lastFrameTime=now;render(now)}
   else if(!modal.hidden)raf=win.requestAnimationFrame(frame)}
  let lastFrameTime=0;
  function open(){
   if(!modal.hidden)return;
   orbit={azimuth:0,elevation:26,distance:fitDistance()};autoRotate=false;last=0;lastFrameTime=0;
   lastRenderedId=null;
   modal.hidden=false;doc.body.dataset.aircraftInspect="on";
   // Inspection is visual only: entering it must not trigger a tower or
   // lesson voice, even when a full-flight audio session was armed.
   doc.dispatchEvent(new Event("agsa:inspection-open"));
   trigger.setAttribute("aria-expanded","true");
   canvas2D.hidden=true;canvas3D.hidden=true;
   ctx.clearRect(0,0,canvas2D.width,canvas2D.height);
   viewport.dataset.modelLoading="on";
   $("aircraftInspectLoading").textContent="Preparing "+types.LABELS[selected()]+"…";
   if(!renderer){
    try{renderer=engine.createRenderer(canvas3D,{inspectionOnly:true,onLost:fallback})}catch{renderer=null}
   }
   usingGPU=Boolean(renderer);
   interiorButton.disabled=!usingGPU;
   delete viewport.dataset.interiorUnsupported;
   syncModelVisibility();
   updateHeading();
   syncTexturedViewer();
   $("aircraftInspectClose").focus({preventScroll:true});
   raf=win.requestAnimationFrame(frame);
  }
  function close(){
   if(modal.hidden)return;
   modal.hidden=true;delete doc.body.dataset.aircraftInspect;
   texturedViewer.hidden=true;
   // Stop a hidden external 3D renderer using the phone GPU.
   texturedFrame.removeAttribute("src");
   viewport.dataset.modelLoading="off";
   trigger.setAttribute("aria-expanded","false");
   win.cancelAnimationFrame(raf);raf=0;last=0;lastRenderedId=null;
   drag=null;pointers.clear();tapStarts.clear();pinchSpan=0;lastTap=null;
   // On narrow phones the inspector launch button lives inside the collapsed
   // More menu. Returning keyboard focus there leaves it invisible; restore
   // focus to the always-visible aircraft picture action instead.
   const photoButton=$("cockpitAircraftPhotoButton");
   const triggerVisible=trigger.getClientRects().length>0;
   (triggerVisible?trigger:photoButton||trigger).focus({preventScroll:true});
  }
  function reset(){
   orbit=orbit.interior?
    {azimuth:24,elevation:15,distance:interiorDistance(selected()),interior:true}:
    {azimuth:0,elevation:26,distance:fitDistance(),interior:false};
   autoRotate=false;updateHeading();
  }
  $("aircraftInspectModelSelect").addEventListener("change",event=>{
   const id=event.target.value;
   if(!types.IDS.includes(id))return;
   delete viewport.dataset.interiorUnsupported;
   if(select.value!==id){
    select.value=id;
    select.dispatchEvent(new Event("change",{bubbles:true}));
   }
   lastRenderedId=null;
   canvas3D.hidden=true;
   canvas2D.hidden=true;
   ctx.clearRect(0,0,canvas2D.width,canvas2D.height);
   orbit={...orbit,distance:orbit.interior?interiorDistance(id):fitDistance()};
   updateHeading();
   if(!modal.hidden){syncModelVisibility();syncTexturedViewer();}
  });
  interiorButton.addEventListener("click",()=>setInterior(true));
  exteriorButton.addEventListener("click",()=>setInterior(false));
  trigger.addEventListener("click",open);
  const closeButton=$("aircraftInspectClose");
  closeButton.addEventListener("click",close);
  // A browser may suppress the synthetic click immediately after a pinch.
  // Close directly on a released touch as well, without affecting keyboard
  // or mouse clicks (close() is already safe to call more than once).
  closeButton.addEventListener("pointerup",event=>{
   if(event.pointerType==="touch")close();
  });
  $("aircraftInspectReset").addEventListener("click",reset);
  $("aircraftInspectZoomIn").addEventListener("click",()=>{orbit=zoomStep(orbit,.81);updateHeading()});
  $("aircraftInspectZoomOut").addEventListener("click",()=>{orbit=zoomStep(orbit,1.22);updateHeading()});
  $("aircraftInspectSpin").addEventListener("click",()=>{autoRotate=!autoRotate;updateHeading()});
  modal.addEventListener("click",event=>{if(event.target===modal)close()});
  viewport.addEventListener("pointerdown",event=>{
   if(modal.hidden||(event.pointerType==="mouse"&&event.button!==0)||
      pointers.has(event.pointerId))return;
   pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
   tapStarts.set(event.pointerId,{x:event.clientX,y:event.clientY,
    time:event.timeStamp,moved:false});
   viewport.setPointerCapture(event.pointerId);
   if(pointers.size===1){
    drag={id:event.pointerId,x:event.clientX,y:event.clientY};pinchSpan=0;
   }else{
    drag=null;pinchSpan=separation(pointers);lastTap=null;
    for(const start of tapStarts.values())start.moved=true;
   }
   autoRotate=false;
   event.preventDefault();
  });
  viewport.addEventListener("pointermove",event=>{
   const pointer=pointers.get(event.pointerId);
   if(!pointer)return;
   const start=tapStarts.get(event.pointerId);
   if(start&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>12){
    start.moved=true;lastTap=null;
   }
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
    const wasSingle=pointers.size===1,start=tapStarts.get(event.pointerId);
    if(!pointers.delete(event.pointerId))return;
    tapStarts.delete(event.pointerId);
    // Two quick, stationary taps enlarge or fit the selected aircraft.
    // A drag or pinch never counts toward this gesture.
    const valid=type==="pointerup"&&wasSingle&&start&&!start.moved&&
     event.timeStamp-start.time<350;
    if(valid&&lastTap&&event.timeStamp-lastTap.time<360&&
       Math.hypot(event.clientX-lastTap.x,event.clientY-lastTap.y)<36){
     orbit=doubleTapZoom(orbit,fitDistance());lastTap=null;updateHeading();
    }else if(valid){
     lastTap={x:event.clientX,y:event.clientY,time:event.timeStamp};
    }else lastTap=null;
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
   // Preserve native arrow-key operation of the aircraft dropdown and
   // any future editable controls inside the inspection dialog.
   // Only use arrow keys to orbit while focus is on a non-editable control.
   const active=doc.activeElement;
   const nativeInput=active&&(active.matches?.("select,input,textarea,[contenteditable]")||
    active.isContentEditable);
   if(nativeInput)return;
   if(event.key==="ArrowLeft"||event.key==="ArrowRight"||
      event.key==="ArrowUp"||event.key==="ArrowDown"){
    event.preventDefault();event.stopImmediatePropagation();
    orbit=orbitStep(orbit,event.key==="ArrowLeft"?-15:event.key==="ArrowRight"?15:0,
     event.key==="ArrowUp"?-10:event.key==="ArrowDown"?10:0);return;
   }
   if(event.key==="Tab"){
    // Match the actual DOM tab order so focus never escapes the modal
    // and shift-Tab from the first field wraps to the last button.
    const els=[ $("aircraftInspectModelSelect"),$("aircraftInspectClose"),
      interiorButton,exteriorButton,$("aircraftInspectZoomOut"),
      $("aircraftInspectZoomIn"),$("aircraftInspectReset"),$("aircraftInspectSpin") ];
    const first=els[0],last=els[els.length-1];
    if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus()}
   }
  },true);
  // Update immediately when either aircraft dropdown changes; do not leave
  // the previous 3D frame onscreen until the next animation tick.
  select.addEventListener("change",()=>{
   if(!modal.hidden){updateHeading();syncModelVisibility()}
  });
  doc.addEventListener("agsa:aircraft-changed",()=>{
   if(!modal.hidden){updateHeading();syncModelVisibility()}
  });
  return Object.freeze({open,close,reset,getOrbit:()=>({...orbit}),isOpen:()=>!modal.hidden});
 }
 function start(){
  if(!root?.document)return;
  if(root.document.readyState==="loading")
   root.document.addEventListener("DOMContentLoaded",()=>attach({documentLike:root.document,windowLike:root}),{once:true});
  else attach({documentLike:root.document,windowLike:root});
 }
 const api=Object.freeze({orbitStep,zoomStep,pinchStep,doubleTapZoom,fitDistanceFor,attach});
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root){root.AGSAInspection=api;start();}
})(typeof window!=="undefined"?window:null);
