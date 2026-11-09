import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const {createEngine,model}=require("../flight-sim-engine-audio.js");

class Param{
 constructor(){this.value=0}
 setTargetAtTime(value){this.value=value}
}
class Node{
 connect(other){return other}
 disconnect(){this.disconnected=true}
}
class Osc extends Node{
 constructor(){super();this.frequency=new Param();this.started=false;this.stopped=false}
 start(){this.started=true}
 stop(){this.stopped=true}
}
class Source extends Node{
 start(){this.started=true}
 stop(){this.stopped=true}
}
class Gain extends Node{constructor(){super();this.gain=new Param()}}
class Filter extends Node{constructor(){super();this.frequency=new Param()}}
const contexts=[];
class MockAudioContext{
 constructor(){
  this.currentTime=0;this.sampleRate=8000;this.state="running";
  this.destination=new Node();this.oscillators=[];this.sources=[];
  this.gains=[];this.filters=[];this.closed=false;contexts.push(this);
 }
 createOscillator(){const v=new Osc();this.oscillators.push(v);return v}
 createBuffer(_channels,length,_rate){
  assert.ok(length>0&&length<=48000);
  const samples=new Float32Array(length);
  return {getChannelData:()=>samples};
 }
 createBufferSource(){const v=new Source();this.sources.push(v);return v}
 createGain(){const v=new Gain();this.gains.push(v);return v}
 createBiquadFilter(){const v=new Filter();this.filters.push(v);return v}
 resume(){return Promise.resolve()}
 close(){this.closed=true;return Promise.resolve()}
}
const win={AudioContext:MockAudioContext,addEventListener(){}};
const doc={hidden:false,addEventListener(){}};
const audio=createEngine({windowLike:win,documentLike:doc});

assert.equal(model("airplane",.8,0).airflowGain,0);
assert.ok(model("airplane",.8,120).airflowGain>.10);
assert.ok(model("airplane",.8,300).airflowGain<=.20);
assert.ok(model("jet",.9,200).harmonicHz>1000);
assert.ok(model("helicopter",.6,10).chopHz>12);
assert.equal(audio.status().active,false);
assert.equal(contexts.length,0,"audio never starts without a learner gesture");
assert.equal(await audio.start("airplane",.7,0),true);
const ctx=contexts.at(-1);
assert.equal(ctx.oscillators.length,4);
assert.equal(ctx.sources.length,1,"Web Audio creates one looping local wind noise source");
assert.equal(ctx.sources[0].started,true);
const wind=ctx.gains.at(-1),filter=ctx.filters.at(-1);
assert.equal(wind.gain.value,0,"no wind noise while stationary");
audio.update("airplane",.7,140);
assert.ok(wind.gain.value>.12&&wind.gain.value<=.20,
 "airflow rises with simulated airspeed");
assert.ok(filter.frequency.value>800,"wind texture becomes brighter with airspeed");
audio.update("helicopter",.55,0);
assert.equal(wind.gain.value,0,"hover without forward airspeed has no wind rush");
assert.equal(audio.status().mode,"helicopter");
audio.setDuck(true,.55);
assert.equal(audio.status().duck,true);
audio.stop();
assert.equal(ctx.sources[0].stopped,true,"stop halts looping wind source");
assert.equal(ctx.closed,true,"stop releases the Web Audio context");
assert.equal(audio.status().active,false);
assert.equal(await audio.start("jet",.8,180),true);
assert.ok(contexts.length>=2,"restarting gets a new clean audio context");
audio.stop();
console.log("Engine sound passed: idle piston, helicopter blade pulse, jet whine, airspeed airflow, ATC ducking and audio cleanup.");
