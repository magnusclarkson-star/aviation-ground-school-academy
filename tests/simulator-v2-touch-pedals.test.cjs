const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('../flight-sim-touch-pedals.js');

test('airplane touchscreen pedals remain immediate',()=>{
 const pedals=create();
 assert.equal(pedals.step({left:true,mode:'airplane',dt:.016}),-1);
 assert.equal(pedals.step({right:true,mode:'airplane',dt:.016}),1);
});
test('R44 brief touch offers fine yaw but sustained hold reaches authority',()=>{
 const pedals=create();
 let yaw=pedals.step({right:true,mode:'helicopter',dt:.016});
 assert.ok(yaw>.22&&yaw<.3);
 for(let i=0;i<40;i++)yaw=pedals.step({right:true,mode:'helicopter',dt:.016});
 assert.ok(yaw>=1-1e-8);
 assert.equal(pedals.step({mode:'helicopter',dt:.016}),0);
});
test('switching airplane to helicopter cannot inherit full pedal travel',()=>{
 const pedals=create();
 assert.equal(pedals.step({right:true,mode:'airplane',dt:.016}),1);
 const yaw=pedals.step({right:true,mode:'helicopter',dt:.016});
 assert.ok(yaw>=.22&&yaw<.3);
});
test('reset and neutral opposing pedals clear stale yaw',()=>{
 const pedals=create();
 pedals.step({right:true,mode:'helicopter',dt:.1});
 pedals.reset();
 assert.equal(pedals.status().right,0);
 assert.equal(pedals.step({left:true,right:true,mode:'helicopter',dt:0}),0);
 assert.equal(pedals.step({mode:'helicopter',dt:.1}),0);
});
test('invalid time-step does not spike helicopter pedal travel',()=>{
 const pedals=create();
 assert.equal(pedals.step({left:true,mode:'helicopter',dt:Infinity}),-.22);
});
