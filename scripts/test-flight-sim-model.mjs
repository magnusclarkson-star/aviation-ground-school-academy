import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const M=require("../flight-sim-model.js");
const S=require("../flight-sim-scenery.js");
function simulate(s,u,seconds,events=[]){
 const ticks=Math.round(seconds/.05);
 for(let i=0;i<ticks;i++){
  const result=M.step(s,u,.05);
  events.push(...result.events);
  if(["complete","landed","halted"].includes(s.phase))break;
 }
 return s;
}
const slow=M.step(M.makeState(),M.makeInput(),0);
assert.equal(slow.state.time,0);
assert.deepEqual(slow.events,[]);
assert.throws(()=>M.makeState("jetliner"),/Unsupported/);

const runway=M.makeState("airplane");
const depart=M.makeInput("airplane");
depart.throttle=1;depart.pitch=-.72;depart.flaps=10;
const cues=[];
simulate(runway,depart,35,cues);
assert.ok(cues.includes("liftoff"),"runway departure needs speed, thrust and rotation");
assert.ok(!runway.onGround,"airplane should become airborne");
assert.ok(runway.altitudeM>65,"a fictional aeroplane should climb after rotation");
assert.ok(runway.zM>100&&runway.speedKt>40,"outside scene has forward motion");
assert.ok(["climb","flight"].includes(runway.phase));
assert.ok(runway.altitudeM<250,"no instant altitude teleport");
const offsetBefore=runway.xM,hdgBefore=runway.headingDeg;
depart.bank=.65;
simulate(runway,depart,5);
assert.ok(Math.abs(runway.rollDeg)>10);
assert.ok(Math.abs(runway.xM-offsetBefore)>1||Math.abs(runway.headingDeg-hdgBefore)>1,"bank produces visible turn");
assert.ok(cues.some(x=>x==="climb"));

const noRotate=M.makeState("airplane");
const noRotateInput=M.makeInput();
noRotateInput.throttle=1;
simulate(noRotate,noRotateInput,15);
assert.equal(noRotate.onGround,true,"speed alone should not rotate the training aircraft");
assert.equal(noRotate.altitudeM,0);

const approach=M.makeState("airplane","approach");
assert.equal(approach.zM,-1450);
assert.equal(approach.phase,"approach");
const finalInput=M.makeInput("airplane");
finalInput.throttle=.49;finalInput.flaps=20;finalInput.pitch=.22;
const landingEvents=[];
simulate(approach,finalInput,72,landingEvents);
assert.equal(approach.phase,"rollout","controlled fictional short final should reach runway");
assert.ok(landingEvents.includes("touchdown"));
assert.ok(approach.altitudeM===0&&approach.onGround);
finalInput.throttle=0;finalInput.brake=true;finalInput.pitch=0;
simulate(approach,finalInput,20,landingEvents);
assert.equal(approach.phase,"complete","brakes should end the runway rollout");
assert.ok(landingEvents.includes("completed"));

const hard=M.makeState("airplane","approach");
hard.altitudeM=.01;hard.verticalMs=-6;hard.xM=88;hard.zM=500;
const hardInput=M.makeInput();hardInput.pitch=.9;hardInput.throttle=.05;
const impact=M.step(hard,hardInput,.1);
assert.equal(impact.state.phase,"halted","off-runway contact cannot count as a successful landing");
assert.ok(impact.events.includes("hardLanding"));
assert.equal(M.step(hard,hardInput,.1).state.time,hard.time);

const heli=M.makeState("helicopter");
const collective=M.makeInput("helicopter");collective.collective=.82;
const liftEvents=[];
simulate(heli,collective,5,liftEvents);
assert.ok(liftEvents.includes("liftoff"),"collective raises helicopter in training model");
assert.ok(heli.altitudeM>2);
assert.equal(heli.onGround,false);
const beforeZ=heli.zM;
collective.pitch=-.6;
simulate(heli,collective,4);
assert.ok(heli.zM>beforeZ+1,"cyclic commands forward translation");
collective.pitch=0;collective.bank=0;collective.collective=.32;
const helipadEvents=[];
simulate(heli,collective,30,helipadEvents);
assert.ok(heli.onGround&&["landed","halted"].includes(heli.phase));
if(heli.phase==="landed")assert.ok(helipadEvents.includes("touchdown"));
else assert.ok(helipadEvents.includes("hardLanding"));
const h2=M.makeState("helicopter");
const h2i=M.makeInput("helicopter");h2i.collective=.8;
simulate(h2,h2i,3);
h2i.collective=.34;simulate(h2,h2i,10);
assert.equal(h2.phase,"landed","collective-only lift and gentle return should finish on pad");

const q=M.makeState("airplane","approach");
const center=S.project(q,0,0,0);
const right=S.project(q,20,0,0);
assert.ok(center&&right&&right.x>center.x);
assert.ok(Math.abs(center.x-480)<1);
const moved={...q,zM:-600};
const far=S.project(q,20,0,0),near=S.project(moved,20,0,0);
assert.ok(near.x>far.x,"runway edge expands as aircraft approaches");
const yawed=S.project({...q,headingDeg:25},0,0,0);
assert.ok(yawed.x<center.x,"heading changes apparent runway alignment");
assert.equal(S.project(q,0,0,-1500),null,"objects behind the camera are clipped");
console.log("Immersive flight model passed: runway liftoff, turn, final-approach landing/rollout, off-runway impact, collective/helipad and perspective scenery.");
