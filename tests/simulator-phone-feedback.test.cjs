const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const H=require('../flight-sim-haptics.js');
const Probe=require('../flight-sim-phone-probe.js');
const Engine=require('../flight-sim-engine-audio.js');
const root=path.resolve(__dirname,'..');
test('vibration is opt-in; a user-triggered strong test is bounded and throttles later requests',()=>{
 let now=0;const calls=[],doc={hidden:false};
 const nav={vibrate:p=>{calls.push(p);return true;}};
 const h=H.createHaptics({navigatorLike:nav,documentLike:doc,clock:()=>now});
 assert.equal(h.supported,true);assert.equal(h.isEnabled(),false);
 assert.equal(h.pulse('control'),false);assert.equal(calls.length,0);
 assert.deepEqual(h.test(),{supported:true,accepted:true,reason:'browser accepted request'});
 assert.equal(calls.length,1);assert.deepEqual(calls[0],[80,35,80]);
 assert.equal(h.isEnabled(),false,'speaker-style diagnostic must not arm automatic vibration');
 h.setEnabled(true);
 assert.equal(h.pulse('control'),false,'automatic cue must not interrupt the explicit test');
 now=400;assert.equal(h.pulse('control'),true);
 assert.deepEqual(calls.at(-1),H.patterns.control);
 now=900;h.setStrength('gentle');assert.equal(h.pulse('rudder'),true);
 assert.ok(calls.at(-1)[0]<H.patterns.rudder[0]);
 assert.ok(Object.values(H.patterns).every(p=>p.reduce((a,b)=>a+b,0)<=200));
 h.setEnabled(false);assert.equal(calls.at(-1),0);
});
test('during actual fictional movement periodic runway/airflow pulses happen only when opted in',()=>{
 let now=0,doc={hidden:false};const patterns=[],nav={vibrate:x=>{patterns.push(x);return true;}};
 const h=H.createHaptics({navigatorLike:nav,documentLike:doc,clock:()=>now});
 assert.equal(h.ambience({phase:'roll',speedKt:35},{turbulence:.4}),false);
 h.setEnabled(true);assert.equal(h.ambience({phase:'roll',speedKt:0},{}),false);
 now=2000;assert.equal(h.ambience({phase:'roll',speedKt:35},{}),true);
 now=4000;assert.equal(h.ambience({phase:'flight',speedKt:58},{turbulence:.15}),true);
 now=5000;assert.equal(h.ambience({phase:'flight',speedKt:58},{turbulence:.15}),false);
 now=7600;assert.equal(h.ambience({phase:'flight',speedKt:58},{turbulence:.15}),true);
 assert.equal(h.ambience({phase:'flight',speedKt:58},{turbulence:0}),false);
 doc.hidden=true;now=9000;assert.equal(h.ambience({phase:'roll',speedKt:50},{}),false);
 assert.equal(h.test().accepted,false);
});
test('hardware rejection and unsupported browsers are reported, not mistaken for actual movement',()=>{
 const blocked=H.createHaptics({navigatorLike:{vibrate:()=>false},documentLike:{hidden:false}});
 assert.equal(blocked.test().accepted,false);
 const no=H.createHaptics({navigatorLike:{},documentLike:{hidden:false}});
 assert.equal(no.supported,false);assert.equal(no.test().accepted,false);
 assert.equal(no.setEnabled(true),false);
});
function mockAudioWorld(state='running'){
 const contexts=[],events={};
 class Param{
  constructor(){this.value=0;this.history=[];}
  setValueAtTime(v,t){this.value=v;this.history.push([v,t]);}
  linearRampToValueAtTime(v,t){this.value=v;this.history.push([v,t]);}
 }
 class Osc{
  constructor(){this.frequency={value:0};this.started=false;this.stopped=false;}
  connect(){}
  disconnect(){}
  start(){this.started=true;}
  stop(){this.stopped=true;}
 }
 class Gain{constructor(){this.gain=new Param();}connect(){}disconnect(){}}
 class Audio{
  constructor(){this.currentTime=0;this.state=state;this.destination={};this.oscs=[];this.closed=false;contexts.push(this);}
  createOscillator(){const o=new Osc();this.oscs.push(o);return o;}
  createGain(){return new Gain();}
  resume(){return Promise.resolve();}
  close(){this.closed=true;return Promise.resolve();}
 }
 const doc={hidden:false,addEventListener(k,fn){events[k]=fn;}};
 const win={AudioContext:Audio,addEventListener(){}};
 return {contexts,doc,win,events};
}
test('test-speaker tone only opens after direct action and has a short stop schedule',async()=>{
 const world=mockAudioWorld(),speaker=Probe.createProbe({windowLike:world.win,documentLike:world.doc});
 assert.equal(world.contexts.length,0);assert.equal(speaker.supported,true);
 const result=await speaker.testSpeaker();
 assert.equal(result.started,true);assert.equal(world.contexts.length,1);
 assert.equal(world.contexts[0].oscs.length,1);
 assert.equal(world.contexts[0].oscs[0].started,true);
 assert.equal(world.contexts[0].oscs[0].stopped,true);
 speaker.stop();assert.equal(world.contexts[0].closed,true);
});
test('suspended browser audio and unsupported audio surface clear diagnostics',async()=>{
 const blocked=mockAudioWorld('suspended'),speaker=Probe.createProbe({windowLike:blocked.win,documentLike:blocked.doc});
 const result=await speaker.testSpeaker();
 assert.equal(result.started,false);assert.match(result.reason,/suspended/);assert.equal(blocked.contexts[0].closed,true);
 const unavailable=Probe.createProbe({windowLike:{addEventListener(){}},documentLike:{hidden:false,addEventListener(){}}});
 assert.equal((await unavailable.testSpeaker()).supported,false);
});
test('sound default is stronger yet amplitude remains low and safe',()=>{
 const idle=Engine.model('airplane',0),full=Engine.model('airplane',1);
 assert.ok(idle.engineLevel>=.1&&idle.engineLevel<.2);
 assert.ok(full.engineLevel>idle.engineLevel&&full.engineLevel<.3);
 assert.ok(idle.primaryHz>=100&&idle.primaryHz<=250,"idle fundamental must be usable on a typical phone speaker");
 assert.ok(idle.harmonicHz>=250,"sound needs audible upper harmonics on small speakers");
});
test('full settings are ready at maximum before browser gesture, and complete activation is explicit',()=>{
 const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
 assert.ok(html.indexOf('id="fullFlightLaunch"')<html.indexOf('class="scene-panel"'));
 assert.ok(html.includes('id="engineAudioVolume" type="range" min="0" max="100" step="1" value="100"'));
 assert.ok(html.includes('<option value="textured" selected>'));
 assert.ok(html.includes('<option value="noticeable" selected>'));
 assert.ok(js.includes('const engineStart=engineAudio.start(audioMode(),audioPower(),audioAirspeed())'), 'full flight engine starts with the selected airframe voice');
 assert.ok(js.includes('const cueStarted=radioTone.enable(true)'));
 assert.ok(js.includes('const radioArmed=document.body.dataset.aircraftInspect!=="on"&&atcRadio?.arm(true)===true'),
  'ATC activates only outside 360 inspection');
 assert.ok(js.includes('haptics.setEnabled(true)'));
 assert.ok(js.includes('for(const id of ["fullFlightLaunch","phoneFeedbackStart"])'));
 assert.ok(js.includes('if(fullFlightWanted)void startFullFlight()'),'reset must preserve chosen effects');
 assert.ok(js.includes('if(changed&&fullFlightWanted)void startFullFlight()'),'aircraft change restores chosen effects');
 assert.ok(js.includes('}else if(fullFlightWanted){void startFullFlight();}'),'resume restores chosen effects');
});
test('mobile UI is visible near the outside view and keeps original controls',()=>{
 const h=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
 const j=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
 for(const id of ['fullFlightLaunch','fullFlightLaunchStatus','phoneFeedbackStart','phoneFeedbackStop','phoneSoundTest','phoneVibrationTest','phoneFeedbackStatus','hapticsStrength'])
  assert.ok(h.includes('id="'+id+'"'),id);
 assert.ok(h.indexOf('id="phoneFeedbackStart"')<h.indexOf('class="lab-grid"'));
 assert.ok(h.includes('src="flight-sim-phone-probe.js"'));
 assert.ok(j.includes('phoneProbe.testSpeaker()'));
 assert.ok(j.includes('haptics.test()'));
 assert.ok(j.includes('haptics.ambience(state,input)'));
 assert.ok(j.includes('syncHapticsUI()'));
 assert.ok(h.includes('id="controlPad"')&&h.includes('id="flightInstruments"'));
 for(const file of ['flight-sim-phone-probe.js','flight-sim-haptics.js']){
  const src=fs.readFileSync(path.join(root,file),'utf8');
  for(const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'getUserMedia'])
   assert.ok(!src.includes(forbidden),file+' '+forbidden);
 }
});
