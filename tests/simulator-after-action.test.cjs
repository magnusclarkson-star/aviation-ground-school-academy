const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const A=require('../flight-sim-after-action.js');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
const app=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
const trace=(mode,observations)=>({schema:'academy.synthetic-flight-trace.v1',synthetic:true,mode,observations});
test('no analysis without a suitable opt-in synthetic trace',()=>{
 assert.equal(A.summarise(null).available,false);
 assert.equal(A.summarise({observations:[{},{}]}).available,false);
 assert.equal(A.summarise(trace('airplane',[])).available,false);
 assert.equal(A.summarise(trace('airplane',[{t:1}])).available,false);
});
test('fixed-wing reflection reports numeric observations without scoring skills',()=>{
 const d=A.summarise(trace('airplane',[
  {t:1,phase:'roll',altitudeM:0,speedKt:15,bankDeg:0,verticalMs:0},
  {t:2,phase:'climb',altitudeM:12,speedKt:50,bankDeg:8,verticalMs:2.5},
  {t:3,phase:'approach',altitudeM:8,speedKt:46,bankDeg:3,verticalMs:-2}
 ]));
 assert.equal(d.available,true);
 assert.match(d.text,/Synthetic height range: 0 to 12 m/);
 assert.match(d.text,/Phases observed: roll → climb → approach/);
 assert.ok(d.prompts.some(s=>s.includes('runway-to-climb transition')));
 assert.ok(d.prompts.some(s=>s.includes('during approach or rollout')));
 assert.match(d.warning,/SME_REVIEW_REQUIRED/);
 assert.doesNotMatch(d.text,/passed|failed|qualified pilot/i);
});
test('conceptual helicopter cases and malformed values do not break narrative',()=>{
 const d=A.summarise(trace('helicopter',[
  {t:0,phase:'lift',altitudeM:0,bankDeg:NaN,speedKt:12},
  {t:1,phase:'hover',altitudeM:8,bankDeg:Infinity,speedKt:15}
 ]));
 assert.equal(d.available,true);
 assert.match(d.text,/conceptual helicopter/);
 assert.match(d.text,/Synthetic bank range: not recorded/);
 assert.ok(d.prompts.some(s=>s.includes('conceptual helicopter lift')));
});
test('at most 600 samples and no personal or real-world values are reported',()=>{
 const observations=Array.from({length:900},(_,i)=>({t:i,phase:'flight',altitudeM:i,bankDeg:0,speedKt:20}));
 const d=A.summarise(trace('airplane',observations));
 assert.equal(d.observedSamples,600);
 assert.match(d.warning,/not instructor assessment/);
});
test('UI remains opt-in, local, and hidden before summary generation',()=>{
 assert.ok(html.includes('src="flight-sim-after-action.js"'));
 for(const id of ['traceInsights','traceInsightsPanel','traceInsightsFacts','traceInsightsPrompts','traceInsightsWarning'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('id="traceInsightsPanel" hidden'));
 assert.ok(app.includes('Z.summarise(trace.exportData())'));
 assert.ok(app.includes('traceInsights").addEventListener("click"'));
 assert.ok(app.includes('traceInsightsPanel").hidden=true'));
 const src=fs.readFileSync(path.join(root,'flight-sim-after-action.js'),'utf8');
 for(const forbidden of ['fetch(', 'XMLHttpRequest','sendBeacon','localStorage','sessionStorage'])
  assert.ok(!src.includes(forbidden));
});
