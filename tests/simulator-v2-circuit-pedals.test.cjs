"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Circuit=require("../flight-sim-circuit-guide.js");
const Pedals=require("../flight-sim-touch-pedals.js");

function plane(overrides={}){
 return {mode:"airplane",scenario:"runway",phase:"flight",onGround:false,
  xM:0,zM:0,headingDeg:0,trackDeg:0,speedKt:80,groundSpeedKt:80,
  altitudeM:130,...overrides};
}
test("C172 turn lead advances departure only after actual pilot turn",()=>{
 const c=Circuit.create(plane());
 assert.equal(c.stage,"departure");
 Circuit.update(c,plane({zM:1470,headingDeg:0}));
 assert.equal(c.stage,"departure");
 Circuit.update(c,plane({zM:1470,headingDeg:85}));
 assert.equal(c.stage,"crosswind");
});
test("C172 route does not advance on ground, premature turns or distant corners",()=>{
 const c=Circuit.create(plane());
 Circuit.update(c,plane({zM:1500,headingDeg:90,onGround:true}));
 assert.equal(c.stage,"departure");
 Circuit.update(c,plane({zM:500,headingDeg:90}));
 assert.equal(c.stage,"departure");
});
test("C172 circuit stages progress with real position and heading",()=>{
 const c=Circuit.create(plane({scenario:"runway"}));
 Circuit.update(c,plane({zM:1700,headingDeg:90}));
 assert.equal(c.stage,"crosswind");
 Circuit.update(c,plane({xM:700,zM:1900,headingDeg:180}));
 assert.equal(c.stage,"downwind");
 Circuit.update(c,plane({xM:900,zM:-1550,headingDeg:205}));
 assert.equal(c.stage,"base");
 Circuit.update(c,plane({xM:280,zM:-1300,headingDeg:355}));
 assert.equal(c.stage,"final");
 const feedback=Circuit.status(c,plane({xM:45,zM:-1200,headingDeg:0,trackDeg:0}));
 assert.match(feedback.finalCue,/E45m/);
});
test("C172 circuit transitions to landed only when flight state reports rollout",()=>{
 const c=Circuit.create(plane());
 Circuit.update(c,plane({phase:"rollout",onGround:true}));
 assert.equal(c.stage,"landed");
 assert.equal(Circuit.status(c,plane({phase:"rollout"})).active,false);
});
test("R44 overlapping touch pedals cancel yaw and clear held input history",()=>{
 const p=Pedals.create();
 assert.ok(p.step({right:true,mode:"helicopter",dt:.08})>0);
 assert.equal(p.step({left:true,right:true,mode:"helicopter",dt:.08}),0);
 const resumed=p.step({right:true,mode:"helicopter",dt:.016});
 assert.ok(resumed>0&&resumed<.25,"release must restart from a fine input");
 assert.equal(p.step({mode:"helicopter",dt:.016}),0);
});
test("R44 touch pedal commands remain clamped and symmetric",()=>{
 const p=Pedals.create();
 for(let i=0;i<300;i++)p.step({left:true,mode:"helicopter",dt:.1});
 assert.equal(p.step({left:true,mode:"helicopter",dt:.1}),-1);
 p.reset();
 assert.equal(p.step({right:true,mode:"airplane",dt:.016}),1);
 assert.equal(p.step({mode:"airplane",dt:.016}),0);
});
