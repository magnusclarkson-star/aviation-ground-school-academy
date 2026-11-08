const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const H=require('../flight-sim-haptics.js');
const FX=require('../flight-sim-feedback-visual.js');
const root=path.resolve(__dirname,'..');

test('strong manual vibration request is finite and does not enable automatic flight haptics',()=>{
 const requests=[],doc={hidden:false};
 let clock=100;
 const h=H.createHaptics({
  navigatorLike:{vibrate(pattern){requests.push(pattern);return true;}},
  documentLike:doc,clock:()=>clock
 });
 assert.equal(h.status().requestCount,0);
 assert.equal(h.status().strongTestCount,0);
 const result=h.testStrong();
 assert.equal(result.accepted,true);
 assert.deepEqual(requests,[[180,100,180]]);
 assert.equal(requests[0].reduce((a,b)=>a+b,0),460);
 assert.equal(h.isEnabled(),false);
 assert.equal(h.status().requestCount,1);
 assert.equal(h.status().acceptedCount,1);
 assert.equal(h.status().strongTestCount,1);
 clock=400;h.setEnabled(true);
 assert.equal(h.pulse('control'),false,'manual test should not be interrupted by immediate short cue');
 clock=900;assert.equal(h.pulse('control'),true);
 assert.equal(h.status().requestCount,2);
 assert.equal(h.status().acceptedCount,2);
 h.setEnabled(false);
 assert.equal(requests.at(-1),0);
});
test('blocked vibration is reported accurately and never claimed as physical movement',()=>{
 const h=H.createHaptics({navigatorLike:{vibrate(){return false;}},documentLike:{hidden:false}});
 const r=h.testStrong();
 assert.equal(r.supported,true);assert.equal(r.accepted,false);
 assert.equal(h.status().requestCount,1);
 assert.equal(h.status().acceptedCount,0);
 const unsupported=H.createHaptics({navigatorLike:{},documentLike:{hidden:false}});
 assert.equal(unsupported.testStrong().accepted,false);
 assert.equal(unsupported.status().requestCount,0);
});
test('visual flight feedback remains independent from vibrator and reports flight events',()=>{
 assert.deepEqual(FX.describe({phase:'roll'},[]).label,'GROUND ROLL');
 assert.equal(FX.describe({phase:'flight'},[]).kind,'motion');
 assert.equal(FX.describe({phase:'roll'},['turbulence']).kind,'rough');
 assert.equal(FX.describe({phase:'approach'},['touchdown']).label,'TOUCHDOWN');
 assert.equal(FX.describe({phase:'flight'},['hardLanding']).kind,'impact');
 assert.equal(FX.describe({phase:'unknown'},[]).kind,'idle');
 assert.equal(FX.describe(null,['__proto__']).kind,'idle');
 for(const desc of [FX.describe({phase:'roll'},[]),FX.describe({phase:'flight'},['turn'])])
  assert.match(desc.warning,/does not confirm/);
});
test('published simulator has always-on synthetic flight cue and explicit stronger haptic test',()=>{
 const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'flight-sim.css'),'utf8');
 assert.ok(html.includes('src="flight-sim-feedback-visual.js"'));
 assert.ok(html.includes('id="flightFeedbackVisual"'));
 assert.ok(html.includes('id="phoneVibrationStrongTest"'));
 assert.ok(html.includes('id="phoneVibrationResult"'));
 assert.ok(js.includes('FX.describe(state,events)'));
 assert.ok(js.includes('haptics.testStrong()'));
 assert.ok(js.includes('haptics.status()'));
 assert.ok(js.includes('updateVisualFeedback(now,result.events)'));
 assert.ok(css.includes('.flight-feedback-visual'));
 for(const file of ['flight-sim-haptics.js','flight-sim-feedback-visual.js']){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  for(const forbidden of ['getUserMedia','fetch(','XMLHttpRequest','localStorage','sessionStorage','sendBeacon'])
   assert.ok(!text.includes(forbidden),file+': '+forbidden);
 }
});
