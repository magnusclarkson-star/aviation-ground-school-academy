/* Position-linked local-airfield navigation display.
 * Uses only the current simulator xM/zM/headingDeg/trackDeg state. */
(function(root){"use strict";
 const NS="http://www.w3.org/2000/svg";
 const SCALE=.048; // 1 nautical mile is about 89 px on this illustrative map
 const finite=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
 const bound=(v,limit)=>Math.max(-limit,Math.min(limit,finite(v)));
 const bearing=v=>((finite(v)%360)+360)%360;
 function coordinates(state){
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
  // Zooms out as the field recedes, allowing the runway to remain on the
  // heading-up map throughout a normal circuit, then zooms in on approach.
  const scale=Math.max(.0055,Math.min(SCALE,77/Math.max(1600,runwayDistanceM)));
  return Object.freeze({
   xM:x,zM:z,headingDeg:heading,trackDeg:track,
   groundSpeedKt:groundSpeed,scale,
   runwayDistanceM,runwayBearingDeg,runwayLandingHeadingDeg,runwayTurn,
   runwayText:"RWY "+(runwayDistanceM>=1000?(runwayDistanceM/1000).toFixed(1)+" km":Math.round(runwayDistanceM)+" m")+
    " · BRG "+String(Math.round(runwayBearingDeg)%360).padStart(3,"0")+"° · "+runwayTurn,
   worldTransform:"translate(110 82) rotate("+heading.toFixed(2)+") scale("+scale.toFixed(5)+" "+(-scale).toFixed(5)+") translate("+(-x).toFixed(2)+" "+(-z).toFixed(2)+")",
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
  node(doc,"rect",{x:-23,y:0,width:46,height:1800,rx:4,fill:"#526065",stroke:"#9aac9a","stroke-width":6},base);
  node(doc,"rect",{x:58,y:20,width:20,height:1760,fill:"#596b6b",stroke:"#65787a","stroke-width":3},base);
  node(doc,"path",{d:"M0 140 H68 M0 1610 H68",stroke:"#86937d","stroke-width":26,fill:"none"},base);
  node(doc,"line",{x1:0,y1:35,x2:0,y2:1760,stroke:"#edf5e4","stroke-width":4,"stroke-dasharray":"75 65"},base);
  node(doc,"path",{d:"M-18 80 L0 140 L18 80 M-18 1720 L0 1660 L18 1720",
   stroke:"#e8e6d2","stroke-width":6,fill:"none"},base);
  node(doc,"circle",{cx:-250,cy:-170,r:41,fill:"#3b646b",stroke:"#d3d1a3","stroke-width":7},base);
  node(doc,"path",{d:"M-280 -170 H-220 M-250 -200 V-140",stroke:"#e8dfac","stroke-width":8},base);
  for(const [x,z] of [[120,220],[140,340],[160,510],[165,890],[-160,370]]){
   node(doc,"rect",{x,y:z,width:65,height:85,rx:4,fill:"#364c50",stroke:"#658186","stroke-width":3},base);
  }
  // Heading-up map: central aircraft is fixed; the airfield moves under it.
  node(doc,"circle",{cx:110,cy:82,r:43,stroke:"#9fc1bb66","stroke-width":1,
   fill:"none","stroke-dasharray":"3 4"},svg);
  node(doc,"circle",{cx:110,cy:82,r:82,stroke:"#9fc1bb55","stroke-width":1,
   fill:"none","stroke-dasharray":"3 6"},svg);
  node(doc,"path",{d:"M110 0 V8 M110 156 V160 M0 82 H9 M211 82 H220",
   stroke:"#c9e7db99","stroke-width":1.5,fill:"none"},svg);
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
 function paint(holder,state){
  if(!holder?.querySelectorAll)return;
  const c=coordinates(state);
  for(const el of holder.querySelectorAll("[data-nav-map]")){
   el.querySelector("[data-nav-world]")?.setAttribute("transform",c.worldTransform);
   el.querySelector("[data-nav-track-pointer]")?.setAttribute("transform",c.trackRotation);
   el.dataset.navPosition=c.xM.toFixed(1)+","+c.zM.toFixed(1);
   el.dataset.navHeading=c.headingDeg.toFixed(1);
   for(const field of el.querySelectorAll("[data-nav-field]")){
    const value=field.dataset.navField;
    field.textContent=value==="heading"?"HDG "+String(Math.round(c.headingDeg)%360).padStart(3,"0"):
     value==="track"?"TRK "+String(Math.round(c.trackDeg)%360).padStart(3,"0"):
     value==="position"?c.positionText:
     value==="runway"?c.runwayText:
     "GS "+Math.round(c.groundSpeedKt);
   }
  }
  return c;
 }
 const api=Object.freeze({SCALE,coordinates,build,paint});
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.AGSAFlightNavigation=api;
})(typeof window!=="undefined"?window:null);
