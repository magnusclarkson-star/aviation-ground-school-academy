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
const Circuit=require("../flight-sim-circuit-guide.js");
const Guidance=require("../flight-sim-guidance.js");
const BankHold=require("../flight-sim-bank-hold.js");
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
 let popoverOpen=0,popoverClosed=0;
 const panel={
  children:[],attributes:{},classList:{
   entries:new Set(),toggle(name,enabled){
    if(enabled)this.entries.add(name);else this.entries.delete(name);
   }
  },firstChild:null,
  setAttribute(name,value){this.attributes[name]=value},
  getAttribute(name){return this.attributes[name]},
  removeAttribute(name){delete this.attributes[name]},
  showPopover(){popoverOpen++},
  hidePopover(){popoverClosed++},
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
 assert.equal(panel.attributes.popover,"manual");
 assert.equal(popoverOpen,1,"enlarged live PFD should enter browser top layer");
 assert.equal(panel.children.length,1,"existing instruments must not be cloned");
 listeners.get("panel:click")({target:buttons[0],stopPropagation(){}});
 assert.equal(zoom.isExpanded(),false);
 assert.equal(popoverClosed,1,"close should leave the browser top layer");
 zoom.setExpanded(true);
 listeners.get("doc:keydown")({key:"Escape",preventDefault(){}});
 assert.equal(zoom.isExpanded(),false);
 assert.equal(popoverClosed,2);
 assert.equal(panel.getAttribute("popover"),undefined);
});


test("a complete departure, two return turns and runway landing remain possible",()=>{
 const state=Flight.makeState("airplane","runway",{airframeId:"c172"});
 const input=Flight.makeInput("airplane");
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 let segment="takeoff",rejoined=false;
 for(let n=0;n<8000;n++){
  if(segment==="takeoff"){
   input.throttle=1;input.pitch=-.5;input.bank=0;
   if(state.zM>1900&&!state.onGround){segment="firstTurn";}
  }else if(segment==="firstTurn"){
   input.bank=1;input.throttle=.7;input.pitch=-.05;
   if(state.headingDeg>=175&&state.headingDeg<210){
    segment="downwind";input.bank=0;
   }
  }else if(segment==="downwind"){
   input.bank=0;input.throttle=.6;input.pitch=-.12;
   if(state.zM< -1900)segment="secondTurn";
  }else if(segment==="secondTurn"){
   input.bank=1;input.throttle=.57;input.pitch=.12;
   if(state.headingDeg>=356||state.headingDeg<12){
    segment="final";input.bank=0;rejoined=true;
   }
  }else{
   const target=(((-state.xM/450*28)%360)+360)%360;
   const diff=((target-state.headingDeg+540)%360)-180;
   input.bank=clamp(diff*.07,-.5,.5);
   const desiredAlt=clamp((-state.zM)/18,0,130);
   input.pitch=clamp(.03+(state.altitudeM-desiredAlt)*.013+
    state.verticalMs*.03,-.3,.64);
   input.throttle=.45;
  }
  Flight.step(state,input,.05);
  if(state.phase==="halted")break;
  if(state.phase==="rollout")break;
 }
 assert.equal(rejoined,true,"the aircraft should reach a runway return leg");
 assert.equal(state.phase,"rollout","the aircraft should touch down without a reset");
 assert.ok(Math.abs(state.xM)<24,"runway centreline is 48 m wide");
 assert.ok(state.zM>=0&&state.zM<=1800,"touchdown is on the original runway");
 assert.ok(state.time<300,"circuit is achievable inside a normal exercise");
});

test("position-aware circuit progresses through departure and return legs",()=>{
 const state=Flight.makeState("airplane","runway",{airframeId:"c172"});
 const progress=Guidance.start(state),seen=[progress.circuit.stage];
 const samples=[
  {xM:0,zM:1700,altitudeM:80,onGround:false,headingDeg:0,phase:"flight"},
  {xM:600,zM:2300,altitudeM:130,onGround:false,headingDeg:160,phase:"flight"},
  {xM:900,zM:-1600,altitudeM:130,onGround:false,headingDeg:180,phase:"flight"},
  {xM:300,zM:-1900,altitudeM:105,onGround:false,headingDeg:350,phase:"flight"},
  {xM:14,zM:610,altitudeM:0,onGround:true,headingDeg:0,phase:"rollout"}
 ];
 for(const sample of samples){
  Object.assign(state,sample);Guidance.observe(progress,state,[]);
  seen.push(progress.circuit.stage);
  const nav=Navigation.coordinates(state,progress.circuit);
  assert.ok(nav.circuitText);
  assert.equal(nav.leg.stage,progress.circuit.stage);
 }
 assert.deepEqual(seen,["departure","crosswind","downwind","base","final","landed"]);
});
test("runway map rotates opposite aircraft heading, with circuit route visible in data",()=>{
 const state=Flight.makeState("airplane","runway");
 state.headingDeg=90;
 const nav=Navigation.coordinates(state,Circuit.create(state));
 assert.ok(nav.worldTransform.includes("rotate(-90.00)"));
 assert.ok(nav.circuitText.includes("DEPARTURE"));
 const rotor=Flight.makeState("helicopter");
 assert.equal(Navigation.coordinates(rotor,Circuit.create(rotor)).leg,null);
});
test("optional phone bank hold sustains a user-commanded turn, then levels on demand",()=>{
 const hold=BankHold.create();
 assert.equal(hold.value(),0);
 hold.setArmed(true);
 assert.equal(hold.release(.72),.72);
 assert.equal(hold.value(),.72);
 assert.equal(hold.value(-.66),-.66,"held keyboard override should take priority");
 assert.equal(hold.value(),.72,"held bank should resume after keyboard override");
 hold.setArmed(false);
 assert.equal(hold.value(),0);
 hold.setArmed(true);
 hold.release(-.85);
 hold.clear();
 assert.equal(hold.status().armed,false);
 assert.equal(hold.value(),0);
});

test("Cessna round six-pack stays tightly grouped without changing R44 or glass layout",()=>{
 const fs=require("node:fs");
 const path=require("node:path");
 const css=fs.readFileSync(path.join(__dirname,"..","flight-sim-c172-compact.css"),"utf8");
 const html=fs.readFileSync(path.join(__dirname,"..","flight-sim.html"),"utf8");
 assert.ok(html.includes("flight-sim-c172-compact.css?v=20261109-c172cluster1"));
 assert.ok(css.includes('#cockpitStation[data-airframe="c172"][data-instruments="round"]'));
 assert.ok(css.includes("grid-template-columns:repeat(3,minmax(0,1fr))"));
 assert.ok(css.includes("grid-template-columns:minmax(0,1fr)!important"));
 assert.ok(css.includes("grid-row:1/4"));
 for(const gauge of ["speed","attitude","alt","turn","heading","vsi"])
  assert.ok(css.includes('[data-gauge="'+gauge+'"]'),"missing "+gauge);
 assert.ok(!css.includes('#cockpitStation[data-family="rotor"]'),
  "Cessna spacing must not affect the R44");
});
