import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const file=pathToFileURL(path.resolve('flight-sim.html')).href;
const errors=[];
try{
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on('pageerror',error=>errors.push(error.message));
 await phone.addInitScript(()=>{
  window.__audioTrial={contexts:[],spoken:[],cancelled:0};
  class Param{constructor(){this.value=0;}setTargetAtTime(value){this.value=value;}}
  class Node{connect(node){return node;}disconnect(){}}
  class Osc extends Node{constructor(){super();this.frequency=new Param();this.started=false;this.stopped=false;}
   start(){this.started=true;}stop(){this.stopped=true;}}
  class Gain extends Node{constructor(){super();this.gain=new Param();}}
  class Filter extends Node{constructor(){super();this.frequency=new Param();}}
  class MockContext{
   constructor(){this.currentTime=0;this.destination=new Node();this.oscillators=[];this.closed=false;window.__audioTrial.contexts.push(this);}
   createOscillator(){const o=new Osc();this.oscillators.push(o);return o;}
   createGain(){return new Gain();}
   createBiquadFilter(){return new Filter();}
   resume(){return Promise.resolve();}
   close(){this.closed=true;return Promise.resolve();}
  }
  Object.defineProperty(window,'AudioContext',{configurable:true,value:MockContext});
  class Utter{constructor(text){this.text=text;}}
  Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:Utter});
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
   speak(utter){window.__audioTrial.spoken.push(utter);},
   cancel(){window.__audioTrial.cancelled++;},
   getVoices(){return [{lang:'en-GB',name:'Student'},{lang:'en-GB',name:'Tower'}];}
  }});
 });
 await phone.goto(file,{waitUntil:'load'});
 assert.equal(await phone.locator('#engineAudioToggle').getAttribute('aria-pressed'),'false');
 assert.equal(await phone.evaluate(()=>window.__audioTrial.contexts.length),0,'no automatic audio context');
 assert.equal(await phone.evaluate(()=>window.__audioTrial.spoken.length),0,'no automatic voice playback');
 assert.equal(await phone.locator('#atcTranscript li').count(),5,'written before-departure transcript exists');
 await phone.locator('#atcDuring').click();
 assert.equal(await phone.locator('#atcTranscript li').count(),4);
 assert.match(await phone.locator('#atcTranscript').textContent(),/fictional|simulat/i);
 assert.equal(await phone.evaluate(()=>window.__audioTrial.spoken.length),4);
 await phone.locator('#atcStop').click();
 assert.match(await phone.locator('#atcStatus').textContent(),/stopped/);
 await phone.locator('#atcAll').click();
 assert.equal(await phone.locator('#atcTranscript li').count(),13);
 assert.equal(await phone.evaluate(()=>window.__audioTrial.spoken.length),17);
 await phone.locator('#atcStop').click();
 await phone.locator('#engineAudioToggle').click();
 await phone.waitForFunction(()=>document.querySelector('#engineAudioToggle').getAttribute('aria-pressed')==='true');
 assert.equal(await phone.evaluate(()=>window.__audioTrial.contexts.length),1);
 const first=await phone.evaluate(()=>window.__audioTrial.contexts[0].oscillators[0].frequency.value);
 await phone.locator('#power').evaluate(e=>{e.value='95';e.dispatchEvent(new Event('input',{bubbles:true}));});
 await phone.waitForTimeout(350);
 const second=await phone.evaluate(()=>window.__audioTrial.contexts[0].oscillators[0].frequency.value);
 assert.ok(second>first,'engine pitch follows simulated power');
 await phone.locator('#pauseFlight').click();
 assert.equal(await phone.locator('#engineAudioToggle').getAttribute('aria-pressed'),'false','pause stops engine audio');
 assert.equal(await phone.evaluate(()=>window.__audioTrial.contexts[0].closed),true);
 await phone.locator('#typeCyclic').click();
 await phone.locator('#atcBefore').click();
 assert.match(await phone.locator('#atcTranscript').textContent(),/helipad/);
 await phone.locator('#atcStop').click();
 await phone.locator('#engineAudioToggle').click();
 await phone.waitForFunction(()=>document.querySelector('#engineAudioToggle').getAttribute('aria-pressed')==='true');
 const chop=await phone.evaluate(()=>window.__audioTrial.contexts.at(-1).oscillators[2].frequency.value);
 assert.ok(chop>=12&&chop<=20,'rotor-like pulse selected for conceptual helicopter');
 await phone.locator('#engineAudioToggle').click();
 assert.equal(await phone.locator('#engineAudioToggle').getAttribute('aria-pressed'),'false');
 assert.equal(await phone.locator('#flightInstruments').isVisible(),true);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[]);
 await phone.close();
 console.log('Phone ATC transcript, opt-in audio, power response, pause mute and helicopter rotor switch passed.');
}finally{await browser.close();}
