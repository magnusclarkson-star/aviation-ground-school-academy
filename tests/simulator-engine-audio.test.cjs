const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const Engine=require('../flight-sim-engine-audio.js');
const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
const script=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
function audioWorld(){
 const contexts=[],listeners={};
 class Param{constructor(){this.value=0;this.history=[];}setTargetAtTime(value){this.value=value;this.history.push(value);}}
 class Node{constructor(){this.connections=[];}connect(node){this.connections.push(node);return node;}disconnect(){this.connections=[];}}
 class Osc extends Node{constructor(){super();this.frequency=new Param();this.started=false;this.stopped=false;}start(){this.started=true;}stop(){this.stopped=true;}}
 class Gain extends Node{constructor(){super();this.gain=new Param();}}
 class Filter extends Node{constructor(){super();this.frequency=new Param();}}
 class AudioContext{
  constructor(){this.currentTime=0;this.destination=new Node();this.oscillators=[];this.closed=false;contexts.push(this);}
  createOscillator(){const o=new Osc();this.oscillators.push(o);return o;}
  createGain(){return new Gain();}
  createBiquadFilter(){return new Filter();}
  resume(){return Promise.resolve();}
  close(){this.closed=true;return Promise.resolve();}
 }
 const doc={hidden:false,addEventListener(event,fn){listeners[event]=fn;}};
 const win={AudioContext,addEventListener(){}};
 return {contexts,listeners,doc,win};
}
test('engine starts only on explicit opt-in, follows fictional power and stays bounded',async()=>{
 const env=audioWorld(),e=Engine.createEngine({windowLike:env.win,documentLike:env.doc});
 assert.equal(e.status().active,false);assert.equal(env.contexts.length,0);
 assert.equal(e.supported,true);
 assert.equal(await e.start('airplane',.2),true);
 assert.equal(env.contexts.length,1);
 assert.ok(env.contexts[0].oscillators.every(x=>x.started));
 assert.equal(e.status().active,true);
 const first=env.contexts[0].oscillators[0].frequency.value;
 e.update('airplane',.95);
 assert.ok(env.contexts[0].oscillators[0].frequency.value>first);
 e.update('helicopter',.5);
 assert.equal(e.status().mode,'helicopter');
 assert.equal(env.contexts[0].oscillators[2].frequency.value,16);
 assert.equal(e.setVolume(900),100);
 e.setDuck(true,.5);assert.equal(e.status().duck,true);
 e.stop();assert.equal(e.status().active,false);
 assert.equal(env.contexts[0].closed,true);
 assert.ok(env.contexts[0].oscillators.every(x=>x.stopped));
});
test('hidden tab stops audio and unsupported browser cannot open context',async()=>{
 const env=audioWorld(),e=Engine.createEngine({windowLike:env.win,documentLike:env.doc});
 await e.start('airplane',.5);env.doc.hidden=true;env.listeners.visibilitychange();
 assert.equal(e.status().active,false);
 assert.equal(await e.start('airplane',.5),false);
 assert.equal(env.contexts.length,1);
 const silent=Engine.createEngine({windowLike:{addEventListener(){}},documentLike:env.doc});
 assert.equal(silent.supported,false);assert.equal(await silent.start('airplane',0),false);
});
test('piston and rotor profiles are compact, mode-specific and safely clamped',()=>{
 const idle=Engine.model('airplane',0),high=Engine.model('airplane',1),heli=Engine.model('helicopter',.9);
 assert.ok(high.primaryHz>idle.primaryHz);
 assert.ok(high.harmonicHz>idle.harmonicHz);
 assert.ok(heli.chopHz>0);
 assert.equal(Engine.model('airplane',99).primaryHz,high.primaryHz);
 assert.ok(high.engineLevel<=.1);
});
test('simulator audio controls remain opt-in, local and independent of instruments',()=>{
 for(const id of ['engineAudioToggle','engineAudioVolume','engineAudioVolumeValue','engineAudioStatus','atcStatus'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('src="flight-sim-engine-audio.js"'));
 assert.ok(script.includes('N.createEngine({windowLike:window,documentLike:document})'));
 assert.ok(script.includes('engineAudio.update(state.mode,audioPower())'));
 assert.ok(script.includes('engineAudio.stop()'));
 assert.ok(html.includes('id="flightInstruments"'));
 assert.ok(html.includes('id="controlPad"'));
 const source=fs.readFileSync(path.join(root,'flight-sim-engine-audio.js'),'utf8');
 for(const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage','sessionStorage','getUserMedia','Audio(', 'sendBeacon'])
  assert.ok(!source.includes(forbidden),'unexpected operation '+forbidden);
});
