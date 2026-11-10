import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const url=pathToFileURL(path.resolve("flight-sim.html")).href;
const browser=await chromium.launch({headless:true,args:[
 "--no-sandbox","--enable-webgl","--use-gl=angle","--use-angle=swiftshader-webgl",
 "--enable-unsafe-swiftshader"
]});
const errors=[];
async function gpuSupported(page){
 return page.evaluate(()=>{
  try{const c=document.createElement("canvas"),gl=c.getContext("webgl2");
   return Boolean(gl&&!gl.isContextLost()&&gl.getParameter(gl.MAX_VERTEX_ATTRIBS)>=3);
  }catch{return false}
 });
}
async function gpuSignature(page){
 return page.evaluate(()=>{
  const canvas=document.getElementById("outsideView3D");
  const gl=canvas.getContext("webgl2");
  if(!gl||gl.isContextLost())return null;
  const width=Math.min(96,canvas.width),height=Math.min(72,canvas.height);
  const pixels=new Uint8Array(width*height*4);
  const x=Math.floor((canvas.width-width)/2),y=Math.floor((canvas.height-height)/2);
  gl.readPixels(x,y,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  let hash=2166136261>>>0;
  const hues=new Set();
  for(let i=0;i<pixels.length;i+=53){
   hash=Math.imul(hash^pixels[i],16777619)>>>0;
   hues.add(Math.floor(pixels[i]/12)+":"+Math.floor(pixels[i+1]/12)+":"+Math.floor(pixels[i+2]/12));
  }
  return {hash,colors:hues.size,width:canvas.width,height:canvas.height,
   version:gl.getParameter(gl.VERSION)};
 });
}
try{
 const desktop=await browser.newPage({viewport:{width:1200,height:900}});
 desktop.on("pageerror",e=>errors.push("desktop "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 const forestFraming=await desktop.evaluate(()=>{
  const C=window.AGSACountryside,T=window.AGSAFlight3D,
   S=window.AGSAFlightScenery;
  if(!C||!T||!S)return null;
  const tree=C.trees[0],state={mode:"airplane",xM:tree.x+25,
   zM:tree.z-140,altitudeM:75,headingDeg:0,pitchDeg:0,rollDeg:0,
   groundSpeedKt:65};
  const before=S.project(state,tree.x,tree.h,tree.z,960,540);
  const after=S.project({...state,xM:state.xM+55},
   tree.x,tree.h,tree.z,960,540);
  const chase=T.cameraPose(state,"chase"),
   rotor=T.cameraPose({...state,mode:"helicopter"},"chase");
  return {treeCount:C.trees.length,farmCount:C.farmsteads.length,
   parallax:before&&after?before.x-after.x:null,
   chaseDistance:Math.hypot(chase.eye[0]-chase.craft[0],
    chase.eye[2]-chase.craft[2]),
   rotorDistance:Math.hypot(rotor.eye[0]-rotor.craft[0],
    rotor.eye[2]-rotor.craft[2])};
 });
 assert.ok(forestFraming,"live browser loads shared tree and camera geometry");
 assert.equal(forestFraming.treeCount,60);
 assert.ok(forestFraming.farmCount>=9);
 assert.ok(forestFraming.parallax>50,"fixed trees must move with aircraft position");
 assert.ok(forestFraming.chaseDistance<31&&forestFraming.rotorDistance<25);
 // The actual browser must have loaded the shared wind module before both
 // renderer scripts. This complements the Node geometry/flight-model tests.
 const windVisual=await desktop.evaluate(()=>{
  const wind=window.AGSAFlightWindsocks;
  const three=window.AGSAFlight3D;
  if(!wind||!three)return null;
  const direction=wind.sample(4.5,0,0,true);
  const fabric=three.buildWindsockFabric(wind.positions[0]);
  return {count:wind.positions.length,tipXM:direction.tipXM,
   vertices:fabric.vertices,finite:fabric.positions.every(Number.isFinite)};
 });
 assert.ok(windVisual,"shared windsock module loads in the browser");
 assert.equal(windVisual.count,2);
 assert.ok(Math.abs(windVisual.tipXM-7)<1e-8);
 assert.equal(windVisual.vertices,96);
 assert.equal(windVisual.finite,true);
 const groundTraffic=await desktop.evaluate(()=>{
  const traffic=window.AGSAAirfieldTraffic,graphics=window.AGSAFlight3D;
  if(!traffic||!graphics)return null;
  const start=traffic.sample(0),after=traffic.sample(20);
  return {vehicleCount:start.length,roadCount:traffic.roadPolygons.length,
   moved:start.every((v,i)=>Math.hypot(v.x-after[i].x,v.z-after[i].z)>3),
   reducedStationary:JSON.stringify(traffic.sample(0,true))===
    JSON.stringify(traffic.sample(50,true)),
   serviceMesh:graphics.buildGroundVehicle("service").vertices};
 });
 assert.ok(groundTraffic,"moving airfield traffic loads on desktop and phone pages");
 assert.equal(groundTraffic.vehicleCount,2);
 assert.equal(groundTraffic.roadCount,96);
 assert.ok(groundTraffic.moved);
 assert.ok(groundTraffic.reducedStationary);
 assert.ok(groundTraffic.serviceMesh>360&&groundTraffic.serviceMesh<650);
 const mapPointer=await desktop.evaluate(()=>{
  const N=window.AGSAFlightNavigation,holder=document.createElement("div");
  holder.appendChild(N.build(document));
  const state={mode:"airplane",scenario:"runway",phase:"flight",onGround:false,
   xM:0,zM:1750,headingDeg:0,trackDeg:0,groundSpeedKt:75};
  N.paint(holder,state,{stage:"crosswind"});
  const pointer=holder.querySelector("[data-nav-circuit-pointer]");
  const visible=pointer.getAttribute("visibility");
  const transform=pointer.getAttribute("transform");
  N.paint(holder,state,null);
  return {visible,transform,hidden: pointer.getAttribute("visibility")};
 });
 assert.equal(mapPointer.visible,"visible","active circuit waypoint arrow appears on map");
 assert.equal(mapPointer.transform,"rotate(60.95 110 82)",
  "map waypoint arrow rotates toward the real next waypoint bearing");
 assert.equal(mapPointer.hidden,"hidden","waypoint arrow hides when circuit is inactive");
 const padMap=await desktop.evaluate(()=>{
  const N=window.AGSAFlightNavigation,map=document.createElement("section");
  map.appendChild(N.build(document));
  const heli={mode:"helicopter",scenario:"helipad",xM:30,zM:0,
   headingDeg:0,trackDeg:0,groundSpeedKt:3};
  const first=N.paint(map,heli);
  const heliFrame={mode:map.querySelector("[data-nav-map]").dataset.navTarget,
   pad:map.querySelector("[data-nav-helipad]").getAttribute("visibility"),
   runway:map.querySelector("[data-nav-airfield]").getAttribute("visibility"),
   text:map.querySelector('[data-nav-field="runway"]').textContent,
   scale:first.scale,
   pointer:map.querySelector("[data-nav-circuit-pointer]").getAttribute("transform")};
  N.paint(map,{...heli,mode:"airplane",scenario:"runway"},{stage:"departure"});
  const fixedWing={mode:map.querySelector("[data-nav-map]").dataset.navTarget,
   pad:map.querySelector("[data-nav-helipad]").getAttribute("visibility"),
   runway:map.querySelector("[data-nav-airfield]").getAttribute("visibility")};
  return {heliFrame,fixedWing};
 });
 assert.equal(padMap.heliFrame.mode,"helipad");
 assert.equal(padMap.heliFrame.pad,"visible");
 assert.equal(padMap.heliFrame.runway,"hidden");
 assert.match(padMap.heliFrame.text,/PAD 30 m · BRG 270°/);
 assert.ok(padMap.heliFrame.scale>.45);
 assert.equal(padMap.heliFrame.pointer,"rotate(-90.00 110 82)");
 assert.deepEqual(padMap.fixedWing,{mode:"runway",pad:"hidden",runway:"visible"},
  "switching from R44 back to Cessna restores runway map, without stale pads");
 const touchdownMap=await desktop.evaluate(()=>{
  const N=window.AGSAFlightNavigation,map=document.createElement("section");
  map.appendChild(N.build(document));
  const approach={mode:"airplane",scenario:"runway",phase:"approach",
   onGround:false,xM:150,zM:-950,headingDeg:0,trackDeg:0,
   altitudeM:80,speedKt:88,groundSpeedKt:88,verticalMs:-1};
  N.paint(map,approach,{stage:"final"});
  const prediction=map.querySelector("[data-nav-landing-prediction]");
  const off={visible:prediction.getAttribute("visibility"),
   transform:prediction.getAttribute("transform"),
   fill:prediction.getAttribute("fill")};
  N.paint(map,{...approach,trackDeg:352},{stage:"final"});
  const corrected={transform:prediction.getAttribute("transform"),
   fill:prediction.getAttribute("fill")};
  N.paint(map,{...approach,mode:"helicopter",scenario:"helipad"},null);
  const heliHidden=prediction.getAttribute("visibility");
  N.paint(map,{...approach,phase:"complete",onGround:true},{stage:"landed"});
  const stopped=prediction.getAttribute("visibility");
  return {off,corrected,heliHidden,stopped};
 });
 assert.equal(touchdownMap.off.visible,"visible");
 assert.equal(touchdownMap.off.transform,"translate(150.00 150)");
 assert.equal(touchdownMap.off.fill,"#f1b77a");
 assert.notEqual(touchdownMap.corrected.transform,touchdownMap.off.transform,
  "landing prediction moves with actual changed ground track");
 assert.equal(touchdownMap.heliHidden,"hidden");
 assert.equal(touchdownMap.stopped,"hidden");
 const hoverFeedback=await desktop.evaluate(()=>{
  const N=window.AGSAFlightNavigation,container=document.createElement("div");
  container.appendChild(N.build(document));
  const s={mode:"helicopter",scenario:"helipad",phase:"hover",
   onGround:false,xM:2,zM:1,altitudeM:5,groundSpeedKt:1,
   verticalMs:.1,yawRateDegS:0,hoverHoldSec:5};
  N.paint(container,s);
  const ring=container.querySelector("[data-nav-hover-cue]");
  const speed=container.querySelector('[data-nav-field="speed"]');
  const fixed={visibility:ring.getAttribute("visibility"),
   color:ring.getAttribute("stroke"),text:speed.textContent};
  N.paint(container,{...s,groundSpeedKt:6,hoverHoldSec:0});
  const slipping={color:ring.getAttribute("stroke"),text:speed.textContent};
  N.paint(container,{...s,onGround:true});
  return {fixed,slipping,grounded:ring.getAttribute("visibility")};
 });
 assert.equal(hoverFeedback.fixed.visibility,"visible");
 assert.equal(hoverFeedback.fixed.color,"#80ebc5");
 assert.match(hoverFeedback.fixed.text,/HOV 5\/8/);
 assert.equal(hoverFeedback.slipping.color,"#f0c680");
 assert.match(hoverFeedback.slipping.text,/DRIFT/);
 assert.equal(hoverFeedback.grounded,"hidden");
 const driftVectorUI=await desktop.evaluate(()=>{
  const N=window.AGSAFlightNavigation,container=document.createElement("div");
  container.appendChild(N.build(document));
  N.paint(container,{mode:"helicopter",scenario:"helipad",phase:"hover",
   onGround:false,xM:2,zM:1,headingDeg:0,trackDeg:90,
   groundSpeedKt:4,forwardMs:0,lateralMs:2,altitudeM:5,
   verticalMs:0,yawRateDegS:0,hoverHoldSec:0});
  return container.querySelector('[data-nav-field="speed"]').textContent;
 });
 assert.match(driftVectorUI,/GS 4 · DRIFT E/,
  "phone navigator shows actual eastward rotorcraft drift, not only DRIFT");
 const observedSkid=await desktop.evaluate(()=>{
  const M=window.AGSAImmersiveFlight,G=window.AGSAFlightGuidance;
  const s=M.makeState("helicopter"),practice=G.start(s);
  Object.assign(s,{phase:"hover",onGround:false,altitudeM:.01,
   verticalMs:-1.15,groundSpeedKt:0,xM:1.5,zM:-.5});
  const input=M.makeInput("helicopter");input.collective=.2;input.turbulence=0;
  const events=M.step(s,input,.05).events;
  G.observe(practice,s,events);
  const lesson=G.r44LessonStatus(practice,s);
  return {phase:s.phase,events,hint:lesson.hint,
   grade:s.touchdownData?.grade,offset:s.touchdownData?.padOffsetM,
   report:G.summary(practice,s).rotorTouchdown};
 });
 assert.equal(observedSkid.phase,"landed");
 assert.ok(observedSkid.events.includes("touchdown"));
 assert.equal(observedSkid.grade,"standard");
 assert.match(observedSkid.hint,/SKIDS .* · DRIFT .* · PAD /);
 assert.ok(observedSkid.offset>1&&observedSkid.offset<2);
 assert.ok(observedSkid.report.sinkMs>0,
  "browser lesson must show measured pre-contact skid sink rate");
 const hedgerowParallax=await desktop.evaluate(()=>{
  const S=window.AGSAFlightScenery,C=window.AGSACountryside;
  const hedge=C.hedgerows[0],canvas=document.createElement("canvas");
  canvas.width=960;canvas.height=540;
  const ctx=canvas.getContext("2d"),originalFill=ctx.fill;
  let hedgeFills=0;
  ctx.fill=function(...args){if(this.fillStyle===hedge.color)hedgeFills++;
   return originalFill.apply(this,args);
  };
  const state={mode:"airplane",xM:hedge.x+30,zM:hedge.z-280,
   altitudeM:90,headingDeg:0,rollDeg:0,pitchDeg:0,time:0};
  S.draw(canvas,state,{reducedMotion:true});
  const before=S.project(state,hedge.x,hedge.h,hedge.z,960,540);
  const after=S.project({...state,xM:state.xM+55},hedge.x,
   hedge.h,hedge.z,960,540);
  return {hedgeFills,before:before?.x,after:after?.x,count:C.hedgerows.length};
 });
 assert.equal(hedgerowParallax.count,8);
 assert.ok(hedgerowParallax.hedgeFills>0,
  "mobile fallback actually draws close rural windbreaks");
 assert.ok(hedgerowParallax.after<hedgerowParallax.before-40,
  "position-linked hedge shifts when flying laterally, even with reduced motion");
 const ruralParallax=await desktop.evaluate(()=>{
  const S=window.AGSAFlightScenery,canvas=document.createElement("canvas");
  canvas.width=960;canvas.height=540;
  const ctx=canvas.getContext("2d"),original=ctx.ellipse;
  let first=null;
  ctx.ellipse=function(x,...rest){
   if(first===null)first=x;
   return original.call(this,x,...rest);
  };
  const s={mode:"airplane",xM:0,zM:0,altitudeM:100,
   headingDeg:0,pitchDeg:0,rollDeg:0,time:0};
  S.draw(canvas,s,{reducedMotion:true});
  const before=first;first=null;
  S.draw(canvas,{...s,xM:500},{reducedMotion:true});
  return {before,after:first};
 });
 assert.ok(ruralParallax.after<ruralParallax.before-4,
  "even in reduced-motion mode, distant clouds shift with real lateral flight");
 const runwayDrawn=await desktop.evaluate(()=>{
  const canvas=document.createElement("canvas");
  canvas.width=960;canvas.height=540;
  const ctx=canvas.getContext("2d");
  const fill=ctx.fill;
  let count=0;
  ctx.fill=function(...args){
   if(this.fillStyle==="#4f5a61"||this.fillStyle==="#535e64")count++;
   return fill.apply(this,args);
  };
  const state={mode:"airplane",xM:0,zM:2450,altitudeM:145,
   headingDeg:180,rollDeg:0,pitchDeg:0,time:0,windXMps:0,windZMps:0};
  window.AGSAFlightScenery.draw(canvas,state,{view:"cockpit"});
  return count;
 });
 assert.ok(runwayDrawn>4,"runway stays visible in 2D southbound return view");
 const rolloutEdgeCoach=await desktop.evaluate(()=>{
  const G=window.AGSAFlightGuidance,M=window.AGSAImmersiveFlight;
  const s={...M.makeState("airplane","approach"),phase:"rollout",
   onGround:true,xM:23,zM:600,altitudeM:0,speedKt:36,
   rolloutBrakePressure:.8,rolloutDistanceM:240};
  const edge=G.guidance(s,M.makeInput());
  s.xM=0;
  const centre=G.guidance(s,M.makeInput());
  return {edge,centre};
 });
 assert.equal(rolloutEdgeCoach.edge.level,"caution");
 assert.equal(rolloutEdgeCoach.edge.tag,"RUNWAY EDGE · ROLLOUT");
 assert.match(rolloutEdgeCoach.edge.text,/RWY E23 m/);
 assert.equal(rolloutEdgeCoach.centre.level,"normal");
 assert.match(rolloutEdgeCoach.centre.text,/ROLL 240 m/);
 const stopAwareness=await desktop.evaluate(()=>{
  const M=window.AGSAImmersiveFlight,G=window.AGSAFlightGuidance,
   E=window.AGSAFlightEnvironment;
  const s={...M.makeState("airplane","approach"),phase:"rollout",
   onGround:true,xM:0,zM:1760,headingDeg:0,trackDeg:0,
   speedKt:50,rolloutBrakePressure:.1,altitudeM:0};
  const i={...M.makeInput(),throttle:0,flaps:20};
  const end=G.guidance(s,i);
  const forecast=E.runwayStopForecast(s,i,M.flightProfile(s));
  const onLongRunway=G.guidance({...s,zM:500,rolloutBrakePressure:1},i);
  const side=G.guidance({...s,xM:22},i);
  return {end,remaining:forecast.remainingM,side,onLongRunway};
 });
 assert.equal(stopAwareness.remaining,40);
 assert.equal(stopAwareness.end.tag,"RUNWAY END · ROLLOUT");
 assert.equal(stopAwareness.end.level,"caution");
 assert.equal(stopAwareness.side.tag,"RUNWAY EDGE · ROLLOUT");
 assert.equal(stopAwareness.onLongRunway.level,"normal");
 const rolloutResult=await desktop.evaluate(()=>{
  const M=window.AGSAImmersiveFlight,G=window.AGSAFlightGuidance;
  return ["classic","aero"].map(physicsId=>{
   const s=M.makeState("airplane","approach",{physicsId});
   Object.assign(s,{phase:"rollout",onGround:true,xM:27,zM:700,
    headingDeg:90,trackDeg:90,speedKt:52,altitudeM:0});
   const input=M.makeInput("airplane");input.throttle=0;
   const events=M.step(s,input,.1).events;
   return {physicsId,phase:s.phase,events,tag:G.guidance(s,input).tag};
  });
 });
 for(const r of rolloutResult){
  assert.equal(r.phase,"halted",r.physicsId+" runway exit stops rollout");
  assert.ok(r.events.includes("runwayExcursion"),"browser model emits excursion event");
  assert.equal(r.tag,"RUNWAY EXCURSION",
   "cockpit learning cue reports the actual cause of the interrupted landing");
 }
 const approachRefs=await desktop.evaluate(()=>{
  const Airport=window.AGSAFlightAirportDetail,S=window.AGSAFlightScenery;
  const canvas=document.createElement("canvas");
  canvas.width=960;canvas.height=540;
  const ctx=canvas.getContext("2d");
  const fill=ctx.fill;
  let drawn=0;
  ctx.fill=function(...args){
   if(this.fillStyle==="#ffe8b6")drawn++;
   return fill.apply(this,args);
  };
  const state={mode:"airplane",xM:0,zM:-1800,altitudeM:140,
   headingDeg:0,pitchDeg:0,rollDeg:0,time:0,windXMps:0,windZMps:0};
  S.draw(canvas,state,{view:"cockpit",lighting:"day"});
  const light=Airport.config.approachLights.find(p=>p.z===-600&&p.x===0);
  const aligned=S.project(state,light.x,.18,light.z,960,540);
  state.xM=140;
  const offset=S.project(state,light.x,.18,light.z,960,540);
  return {count:drawn,expected:Airport.config.approachLights.length,
   alignedX:aligned?.x,offsetX:offset?.x};
 });
 assert.equal(approachRefs.expected,18);
 assert.equal(approachRefs.count,approachRefs.expected,
  "approach light string should be visible on a returning mobile 2D final");
 assert.ok(approachRefs.offsetX<approachRefs.alignedX,
  "approach light positions move with the world, not a static cockpit overlay");
 const rural=await desktop.evaluate(()=>{
  const S=window.AGSAFlightScenery,C=window.AGSACountryside;
  const f=C.fields[0],canvas=document.createElement("canvas");
  canvas.width=960;canvas.height=540;
  const ctx=canvas.getContext("2d"),original=ctx.fill;
  let patches=0;
  ctx.fill=function(...args){
   if(this.fillStyle===f.color)patches++;
   return original.apply(this,args);
  };
  const aircraft={mode:"airplane",xM:f.x-250,zM:f.z-1300,altitudeM:130,
   headingDeg:0,pitchDeg:0,rollDeg:0,time:0,windXMps:0,windZMps:0};
  S.draw(canvas,aircraft,{view:"cockpit"});
  const a=S.project(aircraft,f.x,C.terrainHeight(f.x,f.z),f.z);
  const b=S.project({...aircraft,xM:aircraft.xM+100},
   f.x,C.terrainHeight(f.x,f.z),f.z);
  return {fields:C.fields.length,tracks:C.farmTracks.length,patches,
   firstX:a?.x,laterX:b?.x};
 });
 assert.equal(rural.fields,20);
 assert.equal(rural.tracks,20);
 assert.ok(rural.patches>0,"2D world draws a shared countryside field");
 assert.ok(rural.laterX<rural.firstX,
  "country field shifts with aircraft movement, not a static scrolling overlay");
 const farmhouseParallax=await desktop.evaluate(()=>{
  const S=window.AGSAFlightScenery,C=window.AGSACountryside;
  const farm=C.farmsteads[0],canvas=document.createElement("canvas");
  canvas.width=960;canvas.height=540;
  const ctx=canvas.getContext("2d"),oldFill=ctx.fill;
  let roofs=0;
  ctx.fill=function(...args){
   if(this.fillStyle===farm.roof)roofs++;
   return oldFill.apply(this,args);
  };
  const s={mode:"airplane",xM:farm.x,zM:farm.z-200,
   headingDeg:0,altitudeM:30,pitchDeg:0,rollDeg:0,time:0};
  S.draw(canvas,s,{view:"cockpit"});
  const before=S.project(s,farm.x+farm.w/2,14,farm.z,960,540);
  const after=S.project({...s,xM:s.xM+65},
   farm.x+farm.w/2,14,farm.z,960,540);
  return {count:C.farmsteads.length,roofs,before:before?.x,after:after?.x};
 });
 assert.ok(farmhouseParallax.count>=9);
 assert.ok(farmhouseParallax.roofs>0,
  "the mobile 2D canvas paints a real farm roof");
 assert.ok(farmhouseParallax.after<farmhouseParallax.before,
  "farmstead stays in world coordinates as the airplane passes");
 const towerParallax=await desktop.evaluate(()=>{
  const S=window.AGSAFlightScenery,C=window.AGSACountryside;
  const t=C.towers[0],canvas=document.createElement("canvas");
  canvas.width=960;canvas.height=540;
  const ctx=canvas.getContext("2d"),original=ctx.fill;
  let painted=0;
  ctx.fill=function(...args){
   if(this.fillStyle===t.color)painted++;
   return original.apply(this,args);
  };
  const s={mode:"airplane",xM:t.x,zM:t.z-280,altitudeM:40,
   headingDeg:0,rollDeg:0,pitchDeg:0,time:0};
  S.draw(canvas,s,{view:"cockpit"});
  const before=S.project(s,t.x,t.height,t.z,960,540);
  const after=S.project({...s,xM:s.xM+70},t.x,t.height,t.z,960,540);
  return {count:C.towers.length,painted,xBefore:before.x,xAfter:after.x};
 });
 assert.equal(towerParallax.count,3);
 assert.ok(towerParallax.painted>=1,"north tower should be drawn in mobile Canvas scenery");
 assert.ok(towerParallax.xAfter<towerParallax.xBefore,
  "a fixed tower shifts relative to moving cockpit, never sticks to the screen");
 const treeScene=await desktop.evaluate(()=>{
  const S=window.AGSAFlightScenery;
  const list=xM=>{
   const middle=S.treeColumnAt(xM);
   return Array.from({length:7},(_,n)=>{
    const column=middle+n-3;
    return {column,x:S.treeWorldX(column,600)};
   });
  };
  return {a:list(129),b:list(131)};
 });
 const before=new Map(treeScene.a.map(p=>[p.column,p.x]));
 const after=new Map(treeScene.b.map(p=>[p.column,p.x]));
 const unchanged=[...before].filter(([column,x])=>after.get(column)===x);
 assert.equal(unchanged.length,6,
  "moving across the phone's landscape grid cannot teleport the tree line");


 assert.equal(await desktop.locator("#visualMode").inputValue(),"3d");
 assert.equal(await desktop.locator("#cameraMode").inputValue(),"cockpit");
 assert.ok(await desktop.locator("#outsideView").isVisible());
 const supports=await gpuSupported(desktop);
 const active=await desktop.locator(".scene-shell").evaluate(el=>el.classList.contains("three-dimensional"));
 if(supports){
  assert.equal(active,true,"supported browser should start in actual WebGL2 mode");
  assert.equal(await desktop.locator("#outsideView3D").isVisible(),true);
  assert.equal(await desktop.locator("#cameraMode").isDisabled(),false);
  assert.match(await desktop.locator("#visualStatus").textContent(),/3D WebGL2 airfield active/);
  await desktop.waitForTimeout(450);
  const pilot=await gpuSignature(desktop);
  assert.ok(pilot?.version?.includes("WebGL 2"),"GPU must be an actual WebGL2 context");
  assert.ok(pilot.colors>5,"three-dimensional mesh must draw multiple colors, not an empty/flat canvas");
  await desktop.locator("#cameraMode").selectOption("chase");
  assert.equal(await desktop.locator("#cockpitFrame").getAttribute("data-view"),"chase");
  assert.equal(await desktop.locator("#cockpitFrame").isVisible(),false,"outside chase view must not have cockpit overlay");
  await desktop.waitForTimeout(450);
  const chase=await gpuSignature(desktop);
  assert.ok(chase?.colors>5);
  assert.notEqual(chase.hash,pilot.hash,"chase camera changes rendered pixels using actual 3D aircraft");
  assert.equal(await desktop.locator("#flightPhase").textContent(),"RUNWAY ROLL",
   "changing visual camera does not reset the simulated flight");
  await desktop.locator("#startApproach").click();
  await desktop.waitForTimeout(900);
  const runway=await gpuSignature(desktop);
  assert.notEqual(runway.hash,chase.hash,"camera and aircraft move through genuine perspective 3D scene");
  await desktop.locator("#typeCyclic").click();
  await desktop.waitForTimeout(350);
  const heli=await gpuSignature(desktop);
  assert.ok(heli?.colors>5);
  assert.notEqual(heli.hash,runway.hash,"helipad and 3D rotorcraft scenery differ from runway");
  assert.equal(await desktop.locator("#cameraMode").inputValue(),"chase");
 }else{
  assert.equal(active,false);
  assert.equal(await desktop.locator("#cameraMode").isEnabled(),true,"outside aircraft chase works in 2D fallback");
  assert.match(await desktop.locator("#visualStatus").textContent(),/Automatically using 2D/);
  console.log("WebGL2 unavailable on this runner; asserted normal 2D auto fallback.");
 }
 await desktop.locator("#visualMode").selectOption("2d");
 assert.equal(await desktop.locator(".scene-shell").evaluate(el=>el.classList.contains("three-dimensional")),false);
 assert.equal(await desktop.locator("#outsideView3D").isVisible(),false);
 assert.equal(await desktop.locator("#cameraMode").isEnabled(),true,"outside aircraft chase works in 2D fallback");
 assert.ok(await desktop.locator("#outsideView").isVisible());
 assert.equal(await desktop.evaluate(()=>!!document.getElementById("outsideView").getContext("2d")),true);
 await desktop.locator("#visualMode").selectOption("3d");
 if(supports){
  assert.equal(await desktop.locator("#outsideView3D").isVisible(),true,"3D re-enable should reinitialize GPU buffers");
  await desktop.locator("#cameraMode").selectOption("cockpit");
  const glOk=await gpuSignature(desktop);
  assert.ok(glOk&&glOk.colors>5);
 }
 // Simulate a GPU context-loss event where the Chromium test driver
 // exposes it. The original 2D canvas must remain available immediately.
 if(supports){
  const lost=await desktop.evaluate(()=>{
   const gl=document.querySelector("#outsideView3D").getContext("webgl2");
   const extension=gl?.getExtension("WEBGL_lose_context");
   if(!extension)return false;
   extension.loseContext();return true;
  });
  if(lost){
   await desktop.waitForFunction(()=>!document.querySelector(".scene-shell")
    .classList.contains("three-dimensional"),null,{timeout:3500});
   assert.equal(await desktop.locator("#outsideView3D").isVisible(),false);
   assert.equal(await desktop.locator("#outsideView").isVisible(),true);
   assert.match(await desktop.locator("#visualStatus").textContent(),/2D/i);
   assert.equal(await desktop.locator("#visualStatus").getAttribute("data-status"),"fallback",
    "regardless of async context-loss event timing, a user must see the active fallback state");
   assert.equal(await desktop.locator("#cameraMode").isEnabled(),true,"outside aircraft chase works in 2D fallback");
  }
 }
 assert.deepEqual(errors,[]);
 await desktop.close();

 // A phone browser with WebGL explicitly denied must remain fully usable.
 const fallback=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 fallback.on("pageerror",e=>errors.push("fallback "+e.message));
 await fallback.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
   if(this.id==="outsideView3D"&&kind==="webgl2")return null;
   return original.call(this,kind,...args);
  };
 });
 await fallback.goto(url,{waitUntil:"load"});
 assert.equal(await fallback.locator("#visualMode").inputValue(),"3d");
 assert.equal(await fallback.locator("#outsideView3D").isVisible(),false);
 assert.match(await fallback.locator("#visualStatus").textContent(),/2D scenery/);
 assert.equal(await fallback.locator("#cameraMode").isEnabled(),true,"outside aircraft remains viewable without WebGL on Android");
 assert.ok(await fallback.locator("#outsideView").isVisible());
 assert.ok(await fallback.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 await fallback.locator("#typeStick").tap();
 await fallback.locator("#startApproach").tap();
 assert.equal(await fallback.locator("#flightPhase").textContent(),"FINAL APPROACH");
 assert.ok(Number(await fallback.locator("#readAlt").textContent())>75);
 await fallback.waitForTimeout(650);
 const pixels=await fallback.evaluate(()=>{
  const canvas=document.querySelector("#outsideView"),ctx=canvas.getContext("2d");
  const p=ctx.getImageData(300,140,180,150).data;
  let signature=0;for(let i=0;i<p.length;i+=103)signature=(signature*31+p[i])>>>0;
  return signature;
 });
 assert.notEqual(pixels,0,"2D fallback must actually paint canvas pixels");
 await fallback.locator("#visualMode").selectOption("2d");
 assert.match(await fallback.locator("#visualStatus").textContent(),/Lightweight 2D selected/);
 await fallback.locator("#visualMode").selectOption("3d");
 assert.equal(await fallback.locator("#cockpitFrame").getAttribute("data-view"),"cockpit");
 assert.match(await fallback.locator("#visualStatus").textContent(),/Automatically using 2D/);
 assert.ok(await fallback.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[]);
 await fallback.close();

 // 390px touch screens with WebGL2 retain the original two-thumb layout.
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone "+e.message));
 await phone.goto(url,{waitUntil:"load"});
 const on3D=await phone.locator("#outsideView3D").isVisible();
 if(await gpuSupported(phone)){
  assert.equal(on3D,true);
  await phone.locator("#cameraMode").selectOption("chase");
  await phone.waitForTimeout(350);
  const sig=await gpuSignature(phone);
  assert.ok(sig&&sig.colors>5);
  assert.ok(sig.width<=960&&sig.height<=540,"GPU render-size budget protects phone");
 }
 await phone.locator("#controlPad").scrollIntoViewIfNeeded();
 assert.equal(await phone.locator(".scene-shell").evaluate(el=>getComputedStyle(el).position),"sticky","only the shallow windscreen sticks within the cockpit");
 assert.equal(await phone.locator("#controlPad").evaluate(el=>!!el.closest("#cockpitStation")),true);
 assert.equal(await phone.locator("#brake").evaluate(el=>getComputedStyle(el).touchAction),
  "none","holding the brake under a second finger must not scroll or pinch-zoom");
 assert.equal(await phone.locator("#controlPad").evaluate(el=>getComputedStyle(el).touchAction),
  "none","mobile yoke retains independent no-scroll pointer capture");
 assert.notEqual(await phone.locator("body").evaluate(el=>getComputedStyle(el).touchAction),
  "none","the user must still be able to scroll normally elsewhere");
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.ok(await phone.locator("#rightRudder").isVisible());
 await phone.locator("#visualMode").selectOption("2d");
 assert.ok(await phone.locator("#outsideView").isVisible());

 // Protect the user's most-used Android touch gesture: tapping the live
 // mini PFD must enlarge this very instrument, without duplicate SVGs.
 const miniPfd=phone.locator("#flightInstruments .mini-pfd");
 await miniPfd.locator("#miniAttitude").tap();
 assert.equal(await miniPfd.getAttribute("aria-expanded"),"true",
  "tapping the miniature live PFD opens its own enlarged display");
 assert.ok(await miniPfd.locator(".agsa-mini-pfd-close").isVisible());
 assert.ok(await miniPfd.evaluate(el=>el.getBoundingClientRect().width>innerWidth*.8),
  "enlarged PFD fills most of a narrow mobile screen");
 assert.equal(await phone.locator("#miniAttitude").count(),1,
  "PFD enlargement uses the live SVG rather than duplicating instrument IDs");
 await miniPfd.locator(".agsa-mini-pfd-close").tap();
 assert.equal(await miniPfd.getAttribute("aria-expanded"),"false");
 assert.ok(await miniPfd.evaluate(el=>document.activeElement===el),
  "closing miniature PFD returns keyboard focus to the live instrument");

 // Every analog round gauge should also open above the phone cockpit and
 // restore focus to the original live tile when dismissed.
 const analogGauge=phone.locator("#cockpitVisualPanel .cockpit-gauge").first();
 await analogGauge.tap();
 assert.ok(await phone.locator("#cockpitZoomPanel").isVisible(),
  "round cockpit instrument opens its full-size zoom on touch");
 assert.ok(await phone.locator("#cockpitZoomContent .cockpit-gauge").isVisible());
 await phone.locator("#cockpitZoomClose").tap();
 assert.ok(await phone.locator("#cockpitZoomPanel").isHidden());
 assert.ok(await analogGauge.evaluate(el=>document.activeElement===el),
  "closing zoom returns focus to the same aircraft instrument");

 // On a small touch screen a deliberate HOLD+finger release retains the
 // bank for the circuit, but an interrupted/cancelled gesture must LEVEL
 // the plane rather than leave a surprise 38-degree turn engaged.
 const hold=phone.locator("#bankHoldToggle");
 assert.ok(await hold.isVisible());
 await hold.tap();
 assert.equal(await hold.getAttribute("aria-pressed"),"true");
 const touchYoke=async(type,id)=>{
  await phone.locator("#controlPad").evaluate((pad,{type,id})=>{
   const b=pad.getBoundingClientRect();
   const event=new PointerEvent(type,{bubbles:true,cancelable:true,
    pointerType:"touch",pointerId:id,button:0,
    clientX:b.left+b.width*.85,clientY:b.top+b.height*.5});
   pad.dispatchEvent(event);
  },{type,id});
 };
 await touchYoke("pointerdown",91);
 assert.ok(parseInt(await phone.locator("#cmdBank").textContent())>60,
  "touching the right side of the phone yoke commands a strong right bank");
 await touchYoke("pointerup",91);
 assert.equal(await hold.textContent(),"LEVEL");
 assert.ok(parseInt(await phone.locator("#cmdBank").textContent())>60,
  "a deliberate yoke release retains bank only when hold is armed");
 await hold.tap();
 assert.equal(await hold.getAttribute("aria-pressed"),"false");
 assert.match(await phone.locator("#cmdBank").textContent(),/^\+?0%$/);
 await hold.tap();
 await touchYoke("pointerdown",92);
 await touchYoke("pointercancel",92);
 assert.equal(await hold.getAttribute("aria-pressed"),"false",
  "Android touch cancellation must disarm the bank hold");
 assert.match(await phone.locator("#cmdBank").textContent(),/^\+?0%$/,
  "Android touch cancellation must level the plane");
 await hold.tap();
 await touchYoke("pointerdown",93);
 await touchYoke("lostpointercapture",93);
 assert.equal(await hold.getAttribute("aria-pressed"),"false",
  "lost pointer capture must not latch a long turn");
 assert.match(await phone.locator("#cmdBank").textContent(),/^\+?0%$/);
 // Real multi-touch usability check at the actual 390 px mobile viewport:
 // a short anti-torque pedal tap must be gentle, a longer hold stronger,
 // while another finger can hold brakes and fly the cyclic independently.
 await phone.locator("#cockpitAircraftSelect").selectOption("r44");
 assert.equal(await phone.locator("#cockpitStation").getAttribute("data-family"),"rotor");
 const touchButton=async(elementId,type,pointerId)=>{
  await phone.locator("#"+elementId).evaluate((el,{type,pointerId})=>{
   const b=el.getBoundingClientRect();
   el.dispatchEvent(new PointerEvent(type,{
    bubbles:true,cancelable:true,pointerType:"touch",pointerId,button:0,
    clientX:b.left+b.width*.5,clientY:b.top+b.height*.5
   }));
  },{type,pointerId});
 };
 const rudderPct=async()=>Number((await phone.locator("#cmdRudder").textContent()).match(/-?\d+/)?.[0]||0);
 await touchButton("rightRudder","pointerdown",103);
 const smallPedal=await rudderPct();
 assert.ok(smallPedal>=15&&smallPedal<=22,
  "R44 touchscreen pedal starts at gentle yaw rather than jumping to full travel");
 await phone.waitForTimeout(560);
 const heldPedal=await rudderPct();
 assert.ok(heldPedal>smallPedal+10&&heldPedal<=100,
  "sustained R44 touch progressively gains pedal authority without a second button");
 await touchButton("brake","pointerdown",104);
 await touchYoke("pointerdown",105);
 assert.ok(parseInt(await phone.locator("#cmdBank").textContent())>55,
  "cyclic remains available while a separate finger controls the rotor pedals");
 assert.ok(await phone.locator("#brake").evaluate(el=>el.classList.contains("held")));
 assert.ok(await rudderPct()>0);
 await touchYoke("pointerup",105);
 assert.ok(await rudderPct()>0,
  "releasing cyclic does not inadvertently release a second pedal finger");
 await touchButton("brake","pointerup",104);
 assert.ok(await rudderPct()>0);
 await touchButton("rightRudder","pointerup",103);
 assert.equal(await rudderPct(),0);
 assert.ok(!await phone.locator("#brake").evaluate(el=>el.classList.contains("held")));
 // Fixed-wing buttons remain the familiar direct rudder controls.
 await phone.locator("#cockpitAircraftSelect").selectOption("c172");
 await touchButton("leftRudder","pointerdown",106);
 assert.equal(await rudderPct(),-100);
 await touchButton("leftRudder","pointerup",106);
 assert.equal(await rudderPct(),0);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[]);
 await phone.close();
 console.log("WebGL2 browser passed: genuine GPU scene and moving chase camera when supported; explicit mode switching, 2D fallback, rejected WebGL and 390px phone layout.");
}finally{await browser.close();}
