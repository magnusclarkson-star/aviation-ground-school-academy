/* Run with: node --test tests/flight-sim-visuals.test.cjs
 * Tests render/math behavior without a browser, audio, or network.
 */
"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Camera=require("../flight-sim-camera-rig.js");
const Render=require("../flight-sim-3d.js");
const Scenery=require("../flight-sim-scenery.js");
const Flight=require("../flight-sim-model.js");
const Navigation=require("../flight-sim-navigation.js");
const MiniPFD=require("../flight-sim-mini-pfd-zoom.js");
const airframe=require("../flight-sim-airframe-geometry.js");
const pose=(view,eyeX=0,craftX=0,yaw=0)=>({
 view,eye:[eyeX,10,12],craft:[craftX,1.5,0],yaw,pitch:-.1,roll:0
});
test("exterior viewpoint damps movement without changing actual aircraft location",()=>{
 const rig=Camera.create({responseMs:180});
 rig.next(pose("chase",0,0),100,"c172");
 const result=rig.next(pose("chase",20,20),133,"c172");
 assert.ok(result.eye[0]>0&&result.eye[0]<20);
 assert.equal(result.craft[0],20);
});
test("view change, aircraft change and scenario teleport snap immediately",()=>{
 const rig=Camera.create();
 rig.next(pose("chase",0,0),100,"c172");
 assert.equal(rig.next(pose("side",20,20),133,"c172").eye[0],20);
 assert.equal(rig.next(pose("side",21,21),166,"r44").eye[0],21);
 assert.equal(rig.next(pose("side",500,500),200,"r44").eye[0],500);
});
test("cockpit camera is instantaneous; compass wrap uses short direction",()=>{
 const rig=Camera.create();
 rig.next(pose("chase",0,0),100,"c172");
 assert.equal(rig.next(pose("cockpit",17,15),133,"c172").eye[0],17);
 assert.ok(Camera.turn(359*Math.PI/180,Math.PI/180)>0);
 assert.ok(Camera.turn(359*Math.PI/180,Math.PI/180)<.05);
});
test("airframe shadows are valid and aircraft-specific",()=>{
 const counts=[];
 for(const id of airframe.IDS){
  const mesh=Render.buildShadow(id);
  assert.ok(mesh.vertices>0,id);
  assert.ok(Array.from(mesh.positions).every(Number.isFinite),id);
  counts.push(mesh.vertices);
 }
 assert.ok(new Set(counts).size>1);
});
test("3D runway and helipad stay under mobile mesh budget",()=>{
 for(const mode of ["airplane","helicopter"]){
  const mesh=Render.buildWorld(mode);
  assert.ok(mesh.vertices>0&&mesh.vertices<130000);
 }
});
test("2D fallback draws day and dusk without images or WebGL",()=>{
 const gradient={addColorStop(){}};
 let glowCount=0;
 const ctx=new Proxy({
  createLinearGradient(){return gradient},
  createRadialGradient(){glowCount++;return gradient}
 },{get(target,key){
  return key in target?target[key]:()=>{};
 },set(target,key,value){target[key]=value;return true}});
 const canvas={width:960,height:540,getContext:()=>ctx};
 const flight={mode:"airplane",xM:0,zM:0,altitudeM:8,
  headingDeg:0,pitchDeg:0,rollDeg:0,time:0};
 assert.equal(Scenery.draw(canvas,flight,{lighting:"day",view:"cockpit"}),true);
 assert.equal(glowCount,0);
 assert.equal(Scenery.draw(canvas,flight,{lighting:"dusk",view:"cockpit"}),true);
 assert.ok(glowCount>0);
});


test("banked trainer performs a 170-degree return turn without teleporting",()=>{
 const state=Flight.makeState("airplane","runway",{airframeId:"c172"});
 const inputs=Flight.makeInput("airplane");
 inputs.throttle=1;inputs.pitch=-.48;
 let started=false,startTime=0,startHeading=0,turned=false;
 for(let n=0;n<2600;n++){
  if(!started&&!state.onGround&&state.zM>=700){
   started=true;startTime=state.time;startHeading=state.headingDeg;
   inputs.bank=1;
  }
  Flight.step(state,inputs,.05);
  if(started){
   const delta=((state.headingDeg-startHeading+360)%360);
   if(delta>=170){turned=true;break;}
  }
  assert.notEqual(state.phase,"halted","unexpected runway excursion");
 }
 assert.ok(started,"trainer must take off and begin the return turn");
 assert.ok(turned,"turn must complete before an excessive cross-country flight");
 assert.ok(state.time-startTime<42,"180° should be practical in a compact circuit");
 assert.ok(Math.abs(state.xM)<1700,"return turn must stay inside near-field scenery");
 assert.ok(state.altitudeM>0,"turn must not forcibly land the aircraft");
});
test("navigation keeps the home runway in view and calculates bearing",()=>{
 const nearby=Navigation.coordinates({xM:0,zM:900,headingDeg:90});
 const far=Navigation.coordinates({xM:1000,zM:6000,headingDeg:0});
 assert.equal(nearby.runwayDistanceM,0);
 assert.ok(far.runwayDistanceM>5000);
 assert.ok(far.scale<nearby.scale);
 assert.ok(far.runwayBearingDeg>180&&far.runwayBearingDeg<225);
 assert.ok(far.runwayText.includes("BRG"));
 assert.ok(["L","R","HOLD"].includes(far.runwayTurn));
});
test("compact PFD opens and closes through touch without cloning the live SVG",()=>{
 const listeners=new Map(),buttons=[];
 const panel={
  children:[],attributes:{},classList:{
   entries:new Set(),toggle(name,enabled){
    if(enabled)this.entries.add(name);else this.entries.delete(name);
   }
  },firstChild:null,
  setAttribute(name,value){this.attributes[name]=value},
  addEventListener(name,handler){listeners.set("panel:"+name,handler)},
  insertBefore(child){this.children.unshift(child);buttons.push(child)},
  focus(){},
  contains(el){return el===this||this.children.includes(el)}
 };
 const doc={
  querySelector(selector){return selector==="#flightInstruments .mini-pfd"?panel:null},
  createElement(tag){assert.equal(tag,"button");return {
   setAttribute(){},focus(){},hidden:true
  }},
  addEventListener(name,handler){listeners.set("doc:"+name,handler)}
 };
 const zoom=MiniPFD.attach(doc);
 assert.equal(zoom.isExpanded(),false);
 listeners.get("panel:click")({target:panel});
 assert.equal(zoom.isExpanded(),true);
 assert.equal(panel.attributes["aria-expanded"],"true");
 assert.equal(panel.children.length,1,"existing instruments must not be cloned");
 listeners.get("panel:click")({target:buttons[0],stopPropagation(){}});
 assert.equal(zoom.isExpanded(),false);
 zoom.setExpanded(true);
 listeners.get("doc:keydown")({key:"Escape",preventDefault(){}});
 assert.equal(zoom.isExpanded(),false);
});
