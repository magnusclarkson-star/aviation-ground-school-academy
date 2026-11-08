const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const Coach=require('../flight-sim-moment-coach.js');
const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
const app=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
const points=[
 {t:0,phase:'roll',altitudeM:0,speedKt:15,bankDeg:0,headingDeg:0,privateName:'do not display'},
 {t:1,phase:'climb',altitudeM:12,speedKt:38,bankDeg:8,headingDeg:2,location:'private address'},
 {t:2,phase:'approach',altitudeM:9,speedKt:36,bankDeg:4,headingDeg:5}
];
test('no synthetic data means no coaching; never classifies competence',()=>{
 const p=Coach.inspect(null,0);
 assert.equal(p.available,false);
 assert.match(p.warning,/SME_REVIEW_REQUIRED/);
});
test('selected moment contains fictional deltas and phase transition',()=>{
 const p=Coach.inspect(points,1,'pilots');
 assert.equal(p.available,true);
 assert.match(p.title,/moment 2 of 3 · climb/);
 assert.match(p.observations,/height \+12 m since previous recorded sample/);
 assert.match(p.observations,/phase changed: roll to climb/);
 assert.match(p.question,/fictional pitch and speed changes/);
 assert.match(p.warning,/No grade/);
 assert.doesNotMatch(JSON.stringify(p),/private address|do not display/);
});
test('Scouts and aspiring pilot tracks provide distinct questions, never unsafe procedures',()=>{
 const s=Coach.inspect(points,2,'scouts');
 const a=Coach.inspect(points,2,'pilots');
 assert.notEqual(s.question,a.question);
 assert.match(s.question,/fictional height trend/);
 assert.match(a.question,/descent trend/);
 assert.match(a.warning,/No grade/);
});
test('index bounded and missing values never turn into invented numbers',()=>{
 assert.match(Coach.inspect(points,500,'scouts').title,/3 of 3/);
 assert.match(Coach.inspect([{phase:'hover'}],-10,'pilots').observations,/not recorded/);
 assert.equal(Coach.inspect([],3).available,false);
});
test('replay UI links selected moment and pathway with no remote service',()=>{
 for(const id of ['traceMomentPanel','traceMomentPathway','traceMomentTitle','traceMomentFacts','traceMomentQuestion','traceMomentNotice'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('src="flight-sim-moment-coach.js"'));
 assert.ok(app.includes('C.inspect(trace.exportData().observations,idx'));
 assert.ok(app.includes('traceMomentPathway").addEventListener("change",refreshReplay'));
 const code=fs.readFileSync(path.join(root,'flight-sim-moment-coach.js'),'utf8');
 for(const bad of ['fetch(','XMLHttpRequest','localStorage','sessionStorage','sendBeacon'])assert.ok(!code.includes(bad));
});
