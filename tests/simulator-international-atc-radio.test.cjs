const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const World=require('../flight-sim-atc-world.js');
const Radio=require('../flight-sim-atc-radio.js');
const Effects=require('../flight-sim-radio-effects.js');
const root=path.resolve(__dirname,'..');
test('international airport selection includes Freetown city and 15 further settings across seven regions',()=>{
 assert.equal(World.airports.length,16);
 assert.ok(World.airports.some(a=>a.id==='gfha'&&a.code.startsWith('GFHA')));
 assert.ok(World.airports.some(a=>a.id==='gfll'&&a.code.startsWith('GFLL')));
 for(const region of ['Sierra Leone','United Kingdom','Europe','United States','Canada','Africa','Australia'])
  assert.ok(World.airports.some(a=>a.region===region),region);
 for(const a of World.airports)assert.match(a.code,/^[A-Z]{4} \/ [A-Z]{3}$/);
});
test('world radio examples use alternating pilot/ATC messages with takeoff and landing clearance readbacks',()=>{
 for(const a of World.airports){
  for(const stage of Radio.STAGES){
   const d=World.dialogue(stage,'airplane',stage==='during'?'approach':'runway',a.id);
   assert.ok(d.length>=4,a.id+':'+stage);
   d.forEach((l,i)=>{assert.equal(l.speaker,i%2?'Tower':'Pilot');assert.ok(l.text.length>20&&l.text.length<240);});
   assert.deepEqual(Radio.dialogue(stage,'airplane','approach',a.id),World.dialogue(stage,'airplane','approach',a.id));
  }
  const departure=World.dialogue('before','airplane','runway',a.id).map(x=>x.text).join(' ');
  const approach=World.dialogue('during','airplane','approach',a.id).map(x=>x.text).join(' ');
  if(a.advisory){
   assert.doesNotMatch(departure,/cleared for takeoff/i);
   assert.doesNotMatch(approach,/cleared to land/i);
  }else{
   assert.match(departure,/hold short/i);
   assert.match(departure,/cleared for takeoff/i);
   assert.match(approach,/cleared to land/i);
  }
 }
});
test('go-around and incorrect readback require correction while radio check includes readability',()=>{
 const go=World.dialogue('during','airplane','approach','egll','go-around').map(x=>x.text).join(' ');
 const bad=World.dialogue('during','airplane','runway','kjfk','readback').map(x=>x.text).join(' ');
 const check=World.dialogue('before','airplane','runway','yssy','radio-check').map(x=>x.text).join(' ');
 assert.match(go,/go around/i);assert.match(go,/two thousand/i);
 assert.match(bad,/five thousand/i);assert.match(bad,/negative.*three thousand/i);
 assert.match(check,/readability five/i);
 assert.throws(()=>World.dialogue('not-a-stage'),/Unsupported/);
});
test('radio audio effects gracefully fall back without WebAudio or microphone',()=>{
 const fx=Effects.createEffects({windowLike:{}});
 assert.deepEqual(fx.status(),{supported:false,enabled:false,active:false});
 assert.equal(fx.enable(),false);
 assert.equal(fx.begin(),false);
 assert.equal(fx.burst(),false);
 assert.equal(fx.disable(),false);
});
test('local radio sound generator keys each speech event, provides squelch noise and stops cleanly',()=>{
 let started=0,stopped=0;
 class AudioContext{
  constructor(){this.sampleRate=8000;this.currentTime=0;this.state='running';this.destination={};}
  createBuffer(channels,len){return {getChannelData(){return new Float32Array(len)}};}
  createBufferSource(){return {loop:false,connect(){},start(){started++},stop(){stopped++}};}
  createBiquadFilter(){return {frequency:{value:0},connect(){}};}
  createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}},connect(){}};}
  createOscillator(){return {frequency:{setValueAtTime(){}},connect(){},start(){started++},stop(){stopped++}};}
  suspend(){this.state='suspended';return Promise.resolve();}
  resume(){this.state='running';return Promise.resolve();}
 }
 const fx=Effects.createEffects({windowLike:{AudioContext}});
 assert.equal(fx.enable(),true);
 assert.equal(fx.begin(),true);
 assert.equal(fx.status().active,true);
 fx.end();assert.equal(fx.status().active,false);
 assert.ok(started>=3);assert.ok(stopped>=2);
 assert.equal(fx.disable(),false);assert.equal(fx.status().enabled,false);
});
test('UI wiring provides airport, situation, radio FX and mobile-safe start/stop integration',()=>{
 const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'flight-sim.css'),'utf8');
 for(const id of ['atcAirport','atcSituation','radioFxChoice','radioFxStatus'])
  assert.ok(html.includes('id="'+id+'"'),id);
 for(const file of ['flight-sim-atc-world.js','flight-sim-radio-effects.js','flight-sim-atc-radio.js'])
  assert.ok(html.includes('src="'+file+'"'));
 assert.match(html,/value="on" selected>ON/);
 for(const key of ['getAirport:','getSituation:','onTransmissionStart:','onTransmissionEnd:','radioFx.disable()'])
  assert.ok(js.includes(key),key);
 assert.match(css,/international-atc-options select/);
 for(const file of ['flight-sim-atc-world.js','flight-sim-radio-effects.js']){
  const src=fs.readFileSync(path.join(root,file),'utf8');
  for(const forbidden of ['getUserMedia','fetch(', 'XMLHttpRequest','sendBeacon','localStorage','sessionStorage'])
   assert.ok(!src.includes(forbidden),file+' '+forbidden);
 }
});
