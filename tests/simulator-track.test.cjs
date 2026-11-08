const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Track=require('../flight-sim-track.js');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
const app=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
test('correctly preserves synthetic X/Z positions, selected sample, and missing data fallback',()=>{
 assert.deepEqual(Track.prepare(null),[]);
 const row=Track.prepare([{lateralM:12,forwardM:-1400,phase:'approach'},
  {lateralM:21,forwardM:-1200,phase:'approach'}]);
 assert.deepEqual(row,[{index:0,x:12,z:-1400,headingDeg:null,phase:'approach'},
  {index:1,x:21,z:-1200,headingDeg:null,phase:'approach'}]);
 assert.match(Track.describe(row,1),/9.0 m lateral and 200.0 m forward/);
 assert.match(Track.describe(row,1),/Not a GPS location/);
 assert.match(Track.describe(Track.prepare([{lateralM:2,phase:'roll'}]),0),/Older synthetic traces may not include/);
});
test('malformed and huge coordinates are ignored, samples bounded',()=>{
 const values=[{lateralM:9,forwardM:15},{lateralM:Infinity,forwardM:1},
 {lateralM:'1',forwardM:8},{lateralM:22,forwardM:1e50}];
 const points=Track.prepare(values);
 assert.deepEqual(points.map(x=>x.x),[9,null,null,22]);
 assert.deepEqual(points.map(x=>x.z),[15,1,8,null]);
 assert.equal(Track.prepare(Array.from({length:700},()=>({lateralM:0,forwardM:0}))).length,600);
 assert.match(Track.describe(points,3),/no usable synthetic position/);
});
test('flight path canvas responds to selected sample and gracefully handles legacy trace',()=>{
 const calls=[];
 const ctx={
  clearRect(){calls.push('clear')},fillRect(){},fillText(){},
  beginPath(){calls.push('begin')},moveTo(){},lineTo(){},stroke(){calls.push('stroke')},
  arc(){calls.push('dot')},fill(){}
 };
 const canvas={width:720,height:360,getContext:()=>ctx};
 const valid=[{lateralM:0,forwardM:0},{lateralM:3,forwardM:100},{lateralM:6,forwardM:200}];
 const result=Track.draw(canvas,valid,1);
 assert.equal(result.available,true);assert.equal(result.count,3);
 assert.match(result.description,/sample 2/);
 assert.ok(calls.includes('dot'));
 assert.equal(Track.draw(canvas,[{lateralM:2}],0).available,false);
 assert.equal(Track.draw(null,valid,1).available,true);
});
test('heading is normalized, phase explained, and glyph direction changes',()=>{
 const points=Track.prepare([
  {lateralM:0,forwardM:0,headingDeg:0,phase:'roll'},
  {lateralM:10,forwardM:30,headingDeg:450,phase:'climb'},
  {lateralM:20,forwardM:60,headingDeg:NaN,phase:'unknown'},
  {lateralM:30,forwardM:90,headingDeg:-90,phase:'approach'}
 ]);
 assert.deepEqual(points.map(p=>p.headingDeg),[0,90,null,270]);
 assert.match(Track.phaseExplanation('climb'),/fictional simulation indicates upward flight/);
 assert.match(Track.phaseExplanation('nonexistent'),/Unknown phase/);
 assert.match(Track.describe(points,1),/Recorded fictional heading: 90.0 degrees/);
 assert.match(Track.describe(points,1),/Climb/);
 const segments=[];
 const ctx={
  beginPath(){},moveTo(x,y){segments.push(['start',x,y])},
  lineTo(x,y){segments.push(['line',x,y])},fill(){},stroke(){}
 };
 assert.equal(Track.drawAircraft(ctx,{x:150,y:180},0),true);
 const noseAt0=segments[0];segments.length=0;
 assert.equal(Track.drawAircraft(ctx,{x:150,y:180},90),true);
 const noseAt90=segments[0];
 assert.ok(noseAt0[2]<180,'north-facing nose must be above center');
 assert.ok(noseAt90[1]>150,'east-facing nose must be right of center');
 assert.equal(Track.drawAircraft(ctx,{x:150,y:180},null),false);
});
test('flight path is opt-in and synchronized to the independent replay cursor',()=>{
 assert.ok(html.includes('src="flight-sim-track.js"'));
 for(const id of ['traceTrackPanel','traceTrackCanvas','traceTrackDescription'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.ok(app.includes('B.draw($("traceTrackCanvas"),trace.exportData().observations,idx)'));
 assert.ok(app.includes('traceTrackDescription").textContent=position.description'));
 assert.ok(app.includes('playback.seek(Number($("traceReplayIndex").value))'));
 const source=fs.readFileSync(path.join(root,'flight-sim-track.js'),'utf8');
 for(const denied of ['fetch(', 'XMLHttpRequest','sendBeacon','localStorage','sessionStorage','navigator.geolocation'])
  assert.ok(!source.includes(denied));
});
