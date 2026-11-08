const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Tone=require('../flight-sim-radio-tone.js');
function contextMock(){
 let created=0,closed=0,oscillators=[],envelopes=[],listeners={};
 class Param{
  constructor(){this.value=0;this.events=[];}
  setValueAtTime(v,t){this.value=v;this.events.push([v,t]);}
  exponentialRampToValueAtTime(v,t){this.value=v;this.events.push([v,t]);}
 }
 class Osc{
  constructor(){this.frequency=new Param();this.stopped=false;}
  connect(){}
  disconnect(){}
  start(t){this.started=t;}
  stop(t){this.stopped=true;this.stopAt=t;}
 }
 class Gain{constructor(){this.gain=new Param();envelopes.push(this.gain);}connect(){}disconnect(){}}
 class Audio{
  constructor(){created++;this.currentTime=0;this.destination={};}
  createOscillator(){const o=new Osc();oscillators.push(o);return o;}
  createGain(){return new Gain();}
  resume(){return Promise.resolve();}
  close(){closed++;return Promise.resolve();}
 }
 const doc={hidden:false,addEventListener(k,cb){listeners[k]=cb;}};
 const win={AudioContext:Audio,addEventListener(){}};
 return {win,doc,listeners,oscillators,envelopes,counts:()=>({created,closed})};
}
test('radio cue is silent by default and one opt-in enables tiny bounded chirps',()=>{
 const mock=contextMock(),tone=Tone.createTone({windowLike:mock.win,documentLike:mock.doc});
 assert.deepEqual(tone.status(),{supported:true,enabled:false,signals:0});
 assert.equal(mock.counts().created,0);
 assert.equal(tone.pulse(),false);
 assert.equal(tone.enable(true),true);
 assert.equal(mock.counts().created,1);
 assert.equal(tone.pulse(),true);
 assert.equal(tone.status().signals,1);
 assert.equal(mock.oscillators.length,1);
 assert.equal(mock.oscillators[0].frequency.value,720);
 assert.equal(mock.oscillators[0].stopped,true);
 assert.ok(mock.oscillators[0].stopAt<=.11);
 assert.ok(mock.envelopes[0].events.some(([v])=>v===.035));
 tone.stop();assert.equal(tone.status().enabled,false);
 assert.equal(tone.pulse(),false);assert.equal(mock.counts().closed,1);
});
test('hidden page always closes audio, unsupported browser never opens audio',()=>{
 const mock=contextMock(),tone=Tone.createTone({windowLike:mock.win,documentLike:mock.doc});
 tone.enable(true);mock.doc.hidden=true;mock.listeners.visibilitychange();
 assert.equal(tone.status().enabled,false);
 assert.equal(mock.counts().closed,1);
 assert.equal(tone.enable(true),false);
 const silent=Tone.createTone({windowLike:{addEventListener(){}},documentLike:mock.doc});
 assert.equal(silent.status().supported,false);
 assert.equal(silent.enable(true),false);
});
test('simulator cue implementation requires direct learner control and no remote calls',()=>{
 const root=path.resolve(__dirname,'..');
 const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
 const script=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
 assert.ok(html.includes('id="radioToneToggle" type="button" aria-pressed="false"'));
 assert.ok(html.includes('src="flight-sim-radio-tone.js"'));
 assert.ok(script.includes('Y.createTone({windowLike:window,documentLike:document})'));
 assert.ok(script.includes('radioTone.pulse()'));
 assert.ok(script.includes('radioTone.stop()'));
 const source=fs.readFileSync(path.join(root,'flight-sim-radio-tone.js'),'utf8');
 for(const forbidden of ['getUserMedia','fetch(', 'XMLHttpRequest','sessionStorage','localStorage','sendBeacon'])
  assert.ok(!source.includes(forbidden));
});
