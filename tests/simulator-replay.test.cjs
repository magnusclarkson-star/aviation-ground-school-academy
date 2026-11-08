const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const Replay=require('../flight-sim-replay.js');
const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
const app=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
test('empty and malformed traces remain safe',()=>{
 assert.deepEqual(Replay.prepare(null),[]);
 assert.equal(Replay.describe([],0),'No simulated samples recorded.');
 assert.deepEqual(Replay.prepare([{t:1,altitudeM:10,speedKt:4,bankDeg:2},{t:'bad',altitudeM:Infinity}]),[
 {t:1,phase:'unknown',altitudeM:10,speedKt:4,bankDeg:2},
 {t:1,phase:'unknown',altitudeM:null,speedKt:null,bankDeg:null}
 ]);
});
test('bounded observations and readable selected sample details',()=>{
 const input=Array.from({length:750},(_,i)=>({t:i,phase:'climb',altitudeM:i/2,speedKt:i/3,bankDeg:0}));
 const prepared=Replay.prepare(input);assert.equal(prepared.length,600);
 assert.match(Replay.describe(prepared,9999),/Sample 600 of 600/);
 assert.match(Replay.describe(prepared,0),/height 0.0 m/);
});
test('chart can render when a canvas context exists',()=>{
 const calls=[];
 const ctx={
  clearRect(){calls.push('clear')},fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){calls.push('stroke')},arc(){},fill(){}
 };
 const canvas={width:720,height:360,getContext:()=>ctx};
 const data=[{t:1,altitudeM:12,speedKt:25,bankDeg:0},{t:2,altitudeM:14,speedKt:31,bankDeg:4}];
 assert.equal(Replay.draw(canvas,data,1).length,2);
 assert.ok(calls.includes('stroke'));
 assert.equal(Replay.draw(canvas,[],0).length,0);
});
test('replay opt-in wiring, keyboard scrubber, and no external requests',()=>{
 assert.ok(html.includes('flight-sim-replay.js'));
 for(const id of ['traceReplay','traceReplayPanel','traceReplayCanvas','traceReplayIndex','traceReplayDetail'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('type="range" id="traceReplayIndex"'));
 assert.ok(app.includes('Q.draw($("traceReplayCanvas"),rows,idx)'));
 assert.ok(app.includes('trace.exportData().observations'));
 assert.ok(app.includes('traceReplayIndex").addEventListener("input",()=>{'));
 assert.ok(app.includes('traceReplayPanel").hidden=true'));
 const code=fs.readFileSync(path.join(root,'flight-sim-replay.js'),'utf8');
 for(const term of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'sendBeacon'])assert.ok(!code.includes(term));
});
