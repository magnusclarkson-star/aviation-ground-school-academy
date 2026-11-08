const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const Recorder=require('../flight-sim-recorder.js');
const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
const app=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
function state(){return {mode:'airplane',scenario:'runway',phase:'roll',altitudeM:0,speedKt:20,headingDeg:30,verticalMs:0,rollDeg:0,pitchDeg:0,xM:0};}
const input={bank:0,pitch:0,rudder:0,throttle:.5,flaps:10};
test('off by default and explicit start / stop',()=>{
 const r=Recorder.makeRecorder();
 r.sample(state(),input,1);
 assert.equal(r.status().samples,0);
 r.start(state());for(let i=0;i<15;i++)r.sample(state(),input,.08);
 assert.equal(r.status().samples,1);
 r.stop();r.sample(state(),input,3);assert.equal(r.status().samples,1);
});
test('bounded trace contains synthetic whitelisted fields only',()=>{
 const r=Recorder.makeRecorder();r.start(state());
 for(let i=0;i<8500;i++)r.sample(state(),input,.08);
 const d=r.exportData();assert.equal(d.trainingCredit,false);
 assert.equal(d.instructorVerified,false);
 assert.equal(d.reviewStatus,'SME_REVIEW_REQUIRED');
 assert.equal(d.observations.length,Recorder.MAX_SAMPLES);
 assert.equal(r.status().active,false);
 assert.deepEqual(Object.keys(d.observations[0]),['t','phase','altitudeM','speedKt','headingDeg','verticalMs','bankDeg','pitchDeg','lateralM','bankInput','pitchInput','rudderInput','powerInput','flapDeg']);
});
test('reset and scenario mismatch never preserve old observations',()=>{
 const r=Recorder.makeRecorder();r.start(state());
 for(let i=0;i<15;i++)r.sample(state(),input,.08);
 r.sample({...state(),scenario:'approach'},input,.08);
 assert.equal(r.status().active,false);
 r.clear();assert.equal(r.status().samples,0);
});
test('HTML explicit opt-in and reset wiring exist; no network in recorder',()=>{
 for(const id of ['traceStart','traceStop','traceDownload','traceClear','traceStatus'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('flight-sim-recorder.js'));
 assert.ok(app.includes('trace.sample(state,input,dt)'));
 assert.ok(app.includes('function clearTrace()'));
 assert.ok(app.includes('trace.start(state)'));
 const src=fs.readFileSync(path.join(root,'flight-sim-recorder.js'),'utf8');
 for(const term of ['fetch(', 'XMLHttpRequest','localStorage','sessionStorage','sendBeacon'])assert.ok(!src.includes(term));
});
