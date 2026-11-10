/* Position-linked local-airfield navigation display.
 * Uses only the current simulator xM/zM/headingDeg/trackDeg state. */
(function(root){"use strict";
 const NS="http://www.w3.org/2000/svg";
 const Circuit=root?.AGSACircuitGuide||(typeof module!=="undefined"?require("./flight-sim-circuit-guide.js"):null);
 const SCALE=.048; // 1 nautical mile is about 89 px on this illustrative map
 const finite=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
 const bound=(v,limit)=>Math.max(-limit,Math.min(limit,finite(v)));
 const bearing=v=>((finite(v)%360)+360)%360;
 function coordinates(state,circuit=null){
  const x=bound(state?.xM,50000),z=bound(state?.zM,50000),
   heading=bearing(state?.headingDeg),track=bearing(state?.trackDeg??heading),
   groundSpeed=Math.max(0,Math.min(999,finite(state?.groundSpeedKt)));
  // Runway centre is a fixed local point: 0 m east, 900 m north.
  // Distance is horizontal map distance, NOT distance along an approach.
  const dx=-x,dz=900-z,runwayDistanceM=Math.hypot(dx,dz);
  const runwayBearingDeg=bearing(Math.atan2(dx,dz)*180/Math.PI);
  const correction=((runwayBearingDeg-heading+540)%360)-180;
  const runwayTurn=correction>5?"R":correction< -5?"L":"HOLD";
  const runwayLandingHeadingDeg=z>=900?180:0;
  const heli=state?.mode==="helicopter";
  const padDistanceM=Math.hypot(x,z);
  const padBearingDeg=bearing(Math.atan2(-x,-z)*180/Math.PI);
  const padRelativeDeg=((padBearingDeg-heading+540)%360)-180;
  const padTurn=padRelativeDeg>5?"R":padRelativeDeg< -5?"L":"AHEAD";
  const hoverAirborne=heli&&state?.onGround===false;
  const hoverStable=hoverAirborne&&finite(state?.altitudeM)>=2&&
   finite(state?.altitudeM)<=9&&padDistanceM<=10&&
   groundSpeed<2&&Math.abs(finite(state?.verticalMs))<.45&&
   Math.abs(finite(state?.yawRateDegS))<3;
  const hoverHold=hoverStable?Math.max(0,Math.min(8,Math.floor(finite(state?.hoverHoldSec)))):0;
  // The helicopter's moving map should tell learners WHICH WAY they are
  // actually drifting, not merely that the pad is slipping sideways.
  // Resolve simulated forward/lateral motion and wind into world X/Z.
  // This is feedback only; it does not steer, stabilise or apply GPS hold.
  const hRad=heading*Math.PI/180;
  const f=finite(state?.forwardMs),l=finite(state?.lateralMs);
  const driftEast=f*Math.sin(hRad)+l*Math.cos(hRad)+finite(state?.windXMps);
  const driftNorth=f*Math.cos(hRad)-l*Math.sin(hRad)+finite(state?.windZMps);
  const driftDirection=Math.hypot(driftEast,driftNorth)>.35?
   Math.abs(driftEast)>=Math.abs(driftNorth)?
    (driftEast>=0?"E":"W"):(driftNorth>=0?"N":"S"):null;
  const hoverText=!hoverAirborne?null:hoverStable?
   "HOV "+hoverHold+"/8":groundSpeed>=2?
   "DRIFT"+(driftDirection?" "+driftDirection:""):
   Math.abs(finite(state?.verticalMs))>=.45?"VERT":"POSITION";
  const leg=heli?null:(Circuit?.status(circuit,state)||null);
  // Keep the next circuit waypoint visible as a small direction pointer
  // even when that fixed waypoint is outside the map's narrow viewport.
  // The heading-up arrow is only a drawing; it never changes controls.
  const waypointRelativeDeg=leg?.active?
   ((leg.waypointBearingDeg-heading+540)%360)-180:
   heli&&padDistanceM>2?padRelativeDeg:null;
  // Zooms out as the field recedes, allowing the runway to remain on the
  // heading-up map throughout a normal circuit, then zooms in on approach.
  // The 60-m-wide helipad is nearly invisible at runway-map scale.
  // Use a short-range heading-up pad map while preserving the original
  // Cessna circuit scale for all airplane states.
  const scale=heli?
   Math.max(.095,Math.min(.55,75/Math.max(130,padDistanceM))):
   Math.max(.0055,Math.min(SCALE,77/Math.max(1600,runwayDistanceM)));
  return Object.freeze({
   xM:x,zM:z,headingDeg:heading,trackDeg:track,
   groundSpeedKt:groundSpeed,scale,isHelipad:heli,
   padDistanceM,padBearingDeg,padTurn,hoverAirborne,hoverStable,hoverText,
   runwayDistanceM,runwayBearingDeg,runwayLandingHeadingDeg,runwayTurn,leg,
   projectedTouchdownX:leg?.projectedTouchdownX??null,
   landingProjectionCue:leg?.landingProjectionCue??null,
   waypointRotation:waypointRelativeDeg===null?null:
    "rotate("+waypointRelativeDeg.toFixed(2)+" 110 82)",
   circuitText:leg?(leg.finalCue?leg.label+" "+(leg.waypointDistanceM>=1000?(leg.waypointDistanceM/1000).toFixed(1)+" km":Math.round(leg.waypointDistanceM)+" m")+" · "+leg.finalCue:
    leg.turnNow?"NEXT R "+String(leg.nextCourseDeg).padStart(3,"0")+"° · "+Math.round(leg.waypointDistanceM)+" m":
    leg.short+" · "+leg.turn+" · WP "+String(Math.round(leg.waypointBearingDeg)%360).padStart(3,"0")+"°"):null,
   padText:padDistanceM<2?"PAD CENTER":
    "PAD "+Math.round(padDistanceM)+" m · BRG "+
    String(Math.round(padBearingDeg)%360).padStart(3,"0")+"° · "+padTurn,
   runwayText:"RWY "+(runwayDistanceM>=1000?(runwayDistanceM/1000).toFixed(1)+" km":Math.round(runwayDistanceM)+" m")+
    " · BRG "+String(Math.round(runwayBearingDeg)%360).padStart(3,"0")+"° · "+runwayTurn,
   worldTransform:"translate(110 82) rotate("+(-heading).toFixed(2)+") scale("+scale.toFixed(5)+" "+(-scale).toFixed(5)+") translate("+(-x).toFixed(2)+" "+(-z).toFixed(2)+")",
   trackRotation:"rotate("+(track-heading).toFixed(2)+" 110 82)",
   positionText:(x<0?"W":"E")+Math.round(Math.abs(x))+" "+(z<0?"S":"N")+Math.round(Math.abs(z))
  });
 }
 function node(doc,tag,attrs={},parent){
  const el=doc.createElementNS(NS,tag);
  for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));
  parent?.appendChild(el);
  return el;
 }
 function build(doc){
  const box=doc.createElement("div");
  box.className="cockpit-nav-scene";
  box.dataset.navMap="live";
  const svg=node(doc,"svg",{viewBox:"0 0 220 160","aria-hidden":"true",focusable:"false"});
  const base=node(doc,"g",{"data-nav-world":"true"},svg);
  // The origin is the simulated field; x is east and z is north, in metres.
  const grid=[];
  for(let n=-6000;n<=6000;n+=500){
   grid.push("M"+n+" -6000 V6000","M-6000 "+n+" H6000");
  }
  node(doc,"path",{d:grid.join(" "),stroke:"#31565b","stroke-width":12,fill:"none"},base);
  const airport=node(doc,"g",{"data-nav-airfield":"true"},base);
  node(doc,"rect",{x:-23,y:0,width:46,height:1800,rx:4,fill:"#526065",stroke:"#9aac9a","stroke-width":6},airport);
  // The circuit is a fixed dashed suggestion over the local field map.
  // It never moves the aircraft or overrides touch controls.
  const route=Circuit?.PATH||[];
  if(route.length){
   const line=route.map(([x,z],i)=>(i?"L":"M")+x+" "+z).join(" ");
   node(doc,"path",{d:line,fill:"none",stroke:"#edc579","stroke-width":28,
    "stroke-dasharray":"95 100","stroke-linejoin":"round","data-nav-circuit-route":"true",visibility:"hidden"},airport);
  }
  const waypoint=node(doc,"circle",{cx:0,cy:0,r:75,fill:"#f2d99a",
   stroke:"#113b49","stroke-width":18,"data-nav-circuit-waypoint":"true"},airport);
  waypoint.setAttribute("visibility","hidden");
  // A small movable diamond shows where the current *ground track* would
  // intersect the illustrated runway at z=150 m. Amber means projected
  // crossing outside the strip; teal means projected crossing on it.
  const predicted=node(doc,"path",{
   d:"M0 -48 L48 0 L0 48 L-48 0 Z",
   "data-nav-landing-prediction":"true",visibility:"hidden",
   fill:"#f1b77a",stroke:"#294b4d","stroke-width":12},base);
  predicted.setAttribute("transform","translate(0 150)");
  node(doc,"rect",{x:58,y:20,width:20,height:1760,fill:"#596b6b",stroke:"#65787a","stroke-width":3},airport);
  node(doc,"path",{d:"M0 140 H68 M0 1610 H68",stroke:"#86937d","stroke-width":26,fill:"none"},airport);
  node(doc,"line",{x1:0,y1:35,x2:0,y2:1760,stroke:"#edf5e4","stroke-width":4,"stroke-dasharray":"75 65"},airport);
  node(doc,"path",{d:"M-18 80 L0 140 L18 80 M-18 1720 L0 1660 L18 1720",
   stroke:"#e8e6d2","stroke-width":6,fill:"none"},airport);
  node(doc,"circle",{cx:-250,cy:-170,r:41,fill:"#3b646b",stroke:"#d3d1a3","stroke-width":7},airport);
  node(doc,"path",{d:"M-280 -170 H-220 M-250 -200 V-140",stroke:"#e8dfac","stroke-width":8},airport);
  for(const [x,z] of [[120,220],[140,340],[160,510],[165,890],[-160,370]]){
   node(doc,"rect",{x,y:z,width:65,height:85,rx:4,fill:"#364c50",stroke:"#658186","stroke-width":3},airport);
  }
  const helipad=node(doc,"g",{"data-nav-helipad":"true",visibility:"hidden"},base);
  node(doc,"circle",{cx:0,cy:0,r:30,fill:"#33454f",
   stroke:"#edcb7b","stroke-width":2},helipad);
  node(doc,"circle",{cx:0,cy:0,r:21,fill:"none",
   stroke:"#a0dce3","stroke-width":1.6},helipad);
  node(doc,"circle",{cx:0,cy:0,r:9,fill:"none",
   stroke:"#d8e5dd","stroke-width":1.2},helipad);
  node(doc,"path",{d:"M-8 -12 V12 M8 -12 V12 M-8 0 H8",
   stroke:"#f1f5e8","stroke-width":3,fill:"none"},helipad);
  // Heading-up map: central aircraft is fixed; the airfield moves under it.
  node(doc,"circle",{cx:110,cy:82,r:43,stroke:"#9fc1bb66","stroke-width":1,
   fill:"none","stroke-dasharray":"3 4"},svg);
  // A subtle hover stability ring is instrument feedback, not a map object.
  // It avoids introducing another oversized status button on phones.
  node(doc,"circle",{cx:110,cy:82,r:43,fill:"none",
   "data-nav-hover-cue":"true",visibility:"hidden",
   stroke:"#f0c680","stroke-width":2.5},svg);
  node(doc,"circle",{cx:110,cy:82,r:82,stroke:"#9fc1bb55","stroke-width":1,
   fill:"none","stroke-dasharray":"3 6"},svg);
  node(doc,"path",{d:"M110 0 V8 M110 156 V160 M0 82 H9 M211 82 H220",
   stroke:"#c9e7db99","stroke-width":1.5,fill:"none"},svg);
  // A small amber pointer on the upper navigation ring indicates the
  // bearing to the active circuit waypoint, including off-screen targets.
  const circuitPointer=node(doc,"g",{"data-nav-circuit-pointer":"true",
   visibility:"hidden"},svg);
  node(doc,"path",{d:"M110 7 L105 19 L110 16 L115 19 Z",
   stroke:"#392f1a","stroke-width":1,fill:"#ffe0a1"},circuitPointer);
  const track=node(doc,"g",{"data-nav-track-pointer":"true"},svg);
  node(doc,"path",{d:"M110 23 L104 37 L110 33 L116 37 Z",
   stroke:"#a8f1df","stroke-width":1,fill:"#80ebc5"},track);
  node(doc,"path",{d:"M110 35 V59",stroke:"#80ebc5","stroke-width":1,
   "stroke-dasharray":"3 3"},track);
  node(doc,"path",{d:"M110 52 L105 78 L83 87 L83 92 L106 88 L107 103 L99 109 L99 113 L110 110 L121 113 L121 109 L113 103 L114 88 L137 92 L137 87 L115 78 Z",
   stroke:"#12373a","stroke-width":2,fill:"#ffe6a4"},svg);
  const north=node(doc,"text",{x:8,y:13,fill:"#d8f1d7","font-size":11,"font-weight":750},svg);
  north.textContent="UP";
  box.appendChild(svg);
  const readouts=doc.createElement("div");
  readouts.className="cockpit-nav-readouts";
  for(const [key,initial] of [["heading","HDG 000"],["track","TRK 000"],["position","E0 N0"],["speed","GS 0"],["runway","RWY · BRG 000°"]]){
   const field=doc.createElement("span");
   field.dataset.navField=key;
   field.textContent=initial;
   readouts.appendChild(field);
  }
  box.appendChild(readouts);
  return box;
 }
 function paint(holder,state,circuit=null){
  if(!holder?.querySelectorAll)return;
  const c=coordinates(state,circuit);
  for(const el of holder.querySelectorAll("[data-nav-map]")){
   el.querySelector("[data-nav-world]")?.setAttribute("transform",c.worldTransform);
   el.querySelector("[data-nav-airfield]")?.setAttribute("visibility",c.isHelipad?"hidden":"visible");
   el.querySelector("[data-nav-helipad]")?.setAttribute("visibility",c.isHelipad?"visible":"hidden");
   el.dataset.navTarget=c.isHelipad?"helipad":"runway";
   const hoverRing=el.querySelector("[data-nav-hover-cue]");
   if(hoverRing){
    hoverRing.setAttribute("visibility",c.hoverAirborne?"visible":"hidden");
    hoverRing.setAttribute("stroke",c.hoverStable?"#80ebc5":"#f0c680");
   }
   el.querySelector("[data-nav-track-pointer]")?.setAttribute("transform",c.trackRotation);
   const circuitPointer=el.querySelector("[data-nav-circuit-pointer]");
   if(circuitPointer){
    circuitPointer.setAttribute("visibility",c.waypointRotation?"visible":"hidden");
    if(c.waypointRotation)circuitPointer.setAttribute("transform",c.waypointRotation);
   }
   const guideLine=el.querySelector("[data-nav-circuit-route]");
   guideLine?.setAttribute("visibility",c.leg?.active?"visible":"hidden");
   const predicted=el.querySelector("[data-nav-landing-prediction]");
   if(predicted){
    const valid=Number.isFinite(c.projectedTouchdownX);
    predicted.setAttribute("visibility",valid?"visible":"hidden");
    if(valid){
     predicted.setAttribute("transform","translate("+c.projectedTouchdownX.toFixed(2)+" 150)");
     predicted.setAttribute("fill",
      Math.abs(c.projectedTouchdownX)<=24?"#92e8c5":"#f1b77a");
    }
   }
   const wp=el.querySelector("[data-nav-circuit-waypoint]");
   if(wp){
    // The status carries the current leg, whose target is a fixed local
    // point from the declared leg table, never an inferred GPS location.
    const target=c.leg?.waypoint;
    if(target){wp.setAttribute("cx",String(target[0]));wp.setAttribute("cy",String(target[1]));}
    wp.setAttribute("visibility",target&&c.leg.active?"visible":"hidden");
   }
   el.dataset.navPosition=c.xM.toFixed(1)+","+c.zM.toFixed(1);
   el.dataset.navHeading=c.headingDeg.toFixed(1);
   for(const field of el.querySelectorAll("[data-nav-field]")){
    const value=field.dataset.navField;
    field.textContent=value==="heading"?"HDG "+String(Math.round(c.headingDeg)%360).padStart(3,"0"):
     value==="track"?"TRK "+String(Math.round(c.trackDeg)%360).padStart(3,"0"):
     value==="position"?c.positionText:
     value==="runway"?(c.isHelipad?c.padText:(c.circuitText||c.runwayText)):
     "GS "+Math.round(c.groundSpeedKt)+(c.hoverText?" · "+c.hoverText:"");
   }
  }
  return c;
 }
 const api=Object.freeze({SCALE,coordinates,build,paint});
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.AGSAFlightNavigation=api;
})(typeof window!=="undefined"?window:null);
