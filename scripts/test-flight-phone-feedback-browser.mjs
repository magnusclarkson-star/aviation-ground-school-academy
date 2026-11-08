import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const file=pathToFileURL(path.resolve('flight-sim.html')).href;
const errors=[];
try{
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on('pageerror',e=>errors.push(e.message));
 await phone.addInitScript(()=>{
  window.__phoneProbe={contexts:[],vibrations:[],htmlAudio:[]};
  class BackupAudio{
   constructor(){window.__phoneProbe.htmlAudio.push(this);this.volume=1;}
   play(){this.played=true;return Promise.resolve();}
   pause(){this.paused=true;}
   load(){}
   removeAttribute(){}
  }
  Object.defineProperty(window,'Audio',{configurable:true,value:BackupAudio});
  class Param{
   constructor(){this.value=0;}
   setTargetAtTime(v){this.value=v;}
   setValueAtTime(v){this.value=v;}
   linearRampToValueAtTime(v){this.value=v;}
   exponentialRampToValueAtTime(v){this.value=v;}
  }
  class Node{connect(other){return other;}disconnect(){}}
  class Osc extends Node{
   constructor(){super();this.frequency=new Param();this.started=false;this.stopped=false;}
   start(){this.started=true;}
   stop(){this.stopped=true;}
  }
  class Gain extends Node{constructor(){super();this.gain=new Param();}}
  class Filter extends Node{constructor(){super();this.frequency=new Param();}}
  class Audio{
   constructor(){
    this.currentTime=0;this.state='running';this.destination=new Node();
    this.oscillators=[];this.closed=false;window.__phoneProbe.contexts.push(this);
   }
   createOscillator(){const o=new Osc();this.oscillators.push(o);return o;}
   createGain(){return new Gain();}
   createBiquadFilter(){return new Filter();}
   resume(){return Promise.resolve();}
   close(){this.closed=true;return Promise.resolve();}
  }
  Object.defineProperty(window,'AudioContext',{configurable:true,value:Audio});
  Object.defineProperty(navigator,'vibrate',{configurable:true,value:(pattern)=>{
   window.__phoneProbe.vibrations.push(pattern);return true;
  }});
 });
 await phone.goto(file,{waitUntil:'load'});
 assert.equal(await phone.locator('#engineAudioToggle').getAttribute('aria-pressed'),'false');
 assert.equal(await phone.locator('#hapticsToggle').getAttribute('aria-pressed'),'false');
 assert.equal(await phone.evaluate(()=>window.__phoneProbe.contexts.length),0,'Web Audio stays off until click');
 assert.equal(await phone.evaluate(()=>window.__phoneProbe.vibrations.length),0,'phone vibration stays off until click');
 assert.equal(await phone.locator('#phoneFeedbackStart').isVisible(),true,'phone activation must be prominent');
 await phone.locator('#phoneSoundTest').click();
 await phone.waitForFunction(()=>document.querySelector('#phoneFeedbackStatus')?.textContent.includes('Short test tone requested'));
 assert.equal(await phone.evaluate(()=>window.__phoneProbe.contexts.length),1);
 assert.equal(await phone.evaluate(()=>window.__phoneProbe.contexts[0].oscillators[0].started),true);
 assert.equal(await phone.locator('#hapticsToggle').getAttribute('aria-pressed'),'false');
 await phone.locator('#phoneAudioBackup').click();
 assert.equal(await phone.evaluate(()=>window.__phoneProbe.htmlAudio.length),1,'backup audio is only opened after a click');
 assert.equal(await phone.evaluate(()=>window.__phoneProbe.htmlAudio[0].played),true);
 assert.match(await phone.locator('#phoneFeedbackStatus').textContent(),/Backup audio playback requested/);
 await phone.locator('#phoneDiagnostics').evaluate(e=>e.open=true);
 await phone.locator('#phoneRefreshDiagnostics').click();
 const report=await phone.locator('#phoneDiagnosticsText').inputValue();
 assert.match(report,/Web Audio API: available/);
 assert.match(report,/HTML audio backup: available/);
 assert.match(report,/Last backup speaker test: playback requested/);
 assert.match(report,/Media volume: not readable/);
 assert.doesNotMatch(report,/userAgent|IMEI|telephone|geolocation/);
 await phone.locator('#phoneVibrationTest').click();
 const diagnostic=await phone.evaluate(()=>window.__phoneProbe.vibrations.at(-1));
 assert.deepEqual(diagnostic,[80,35,80],'explicit test requests a noticeable bounded pattern');
 assert.equal(await phone.locator('#hapticsToggle').getAttribute('aria-pressed'),'false','test never opts learner in to flight haptics');
 await phone.locator('#phoneFeedbackStart').click();
 await phone.waitForFunction(()=>document.querySelector('#engineAudioToggle')?.getAttribute('aria-pressed')==='true');
 assert.equal(await phone.locator('#hapticsToggle').getAttribute('aria-pressed'),'true');
 assert.equal(await phone.evaluate(()=>window.__phoneProbe.contexts.length),3,'speaker + engine + radio cue contexts created after a user click');
 assert.equal(await phone.locator('#engineAudioVolume').inputValue(),'100');
 assert.equal(await phone.locator('#engineAudioTexture').inputValue(),'textured');
 assert.equal(await phone.locator('#atcAutoToggle').getAttribute('aria-pressed'),'true','tower automatically armed by one-tap full flight');
 assert.equal(await phone.locator('#radioToneToggle').getAttribute('aria-pressed'),'true','radio cue automatically enabled');
 assert.match(await phone.locator('#fullFlightLaunchStatus').textContent(),/Full flight mode requested/);
 const engine=await phone.evaluate(()=>window.__phoneProbe.contexts[1].oscillators[0].frequency.value);
 await phone.locator('#power').evaluate(e=>{e.value='95';e.dispatchEvent(new Event('input',{bubbles:true}));});
 await phone.waitForTimeout(350);
 const louder=await phone.evaluate(()=>window.__phoneProbe.contexts[1].oscillators[0].frequency.value);
 assert.ok(louder>engine,'simulated engine pitch responds to power change');
 assert.match(await phone.locator('#phoneFeedbackStatus').textContent(),/Full flight requested — engine ON/);
 await phone.locator('#phoneFeedbackStop').click();
 assert.equal(await phone.locator('#engineAudioToggle').getAttribute('aria-pressed'),'false');
 assert.equal(await phone.locator('#hapticsToggle').getAttribute('aria-pressed'),'false');
 assert.equal(await phone.evaluate(()=>window.__phoneProbe.contexts[1].closed),true);
 assert.equal(await phone.evaluate(()=>window.__phoneProbe.contexts[2].closed),true,'stop also closes the radio cue');
 assert.equal(await phone.locator('#atcAutoToggle').getAttribute('aria-pressed'),'false');
 assert.equal(await phone.locator('#radioToneToggle').getAttribute('aria-pressed'),'false');
 assert.equal(await phone.evaluate(()=>window.__phoneProbe.vibrations.at(-1)),0,'stop cancels vibration');
 await phone.locator('#fullFlightLaunch').click();
 await phone.waitForFunction(()=>document.querySelector('#engineAudioToggle')?.getAttribute('aria-pressed')==='true');
 assert.equal(await phone.locator('#engineAudioVolume').inputValue(),'100');
 assert.equal(await phone.locator('#hapticsToggle').getAttribute('aria-pressed'),'true');
 assert.equal(await phone.locator('#atcAutoToggle').getAttribute('aria-pressed'),'true');
 await phone.locator('#pauseFlight').click();
 assert.equal(await phone.locator('#engineAudioToggle').getAttribute('aria-pressed'),'false','pause stops sound');
 await phone.locator('#pauseFlight').click();
 await phone.waitForFunction(()=>document.querySelector('#engineAudioToggle')?.getAttribute('aria-pressed')==='true');
 assert.equal(await phone.locator('#atcAutoToggle').getAttribute('aria-pressed'),'true','resume restores the full radio experience');
 await phone.locator('#phoneFeedbackStop').click();
 assert.equal(await phone.locator('#flightInstruments').isVisible(),true);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no horizontal phone overflow');
 assert.deepEqual(errors,[]);
 await phone.close();
 console.log('Phone audio/haptics direct tests, combined enable/stop and controls passed.');
}finally{await browser.close();}
