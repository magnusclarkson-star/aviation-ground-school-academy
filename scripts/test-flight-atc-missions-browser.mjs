import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{
  window.__atcMissionTrial={voices:[],radioStarts:0};
  class Param{setValueAtTime(){}linearRampToValueAtTime(){}setTargetAtTime(){}exponentialRampToValueAtTime(){}}
  class Node{connect(target){return target;}disconnect(){}start(){window.__atcMissionTrial.radioStarts++}stop(){}}
  class Ctx{
   constructor(){this.sampleRate=8000;this.currentTime=0;this.state='running';this.destination=new Node();}
   createBuffer(ch,length){return {getChannelData(){return new Float32Array(length)}};}
   createBufferSource(){return Object.assign(new Node(),{loop:false});}
   createBiquadFilter(){return Object.assign(new Node(),{frequency:{value:0}});}
   createGain(){return Object.assign(new Node(),{gain:new Param()});}
   createOscillator(){return Object.assign(new Node(),{frequency:new Param()});}
   resume(){return Promise.resolve();}
   suspend(){return Promise.resolve();}
  }
  Object.defineProperty(window,'AudioContext',{value:Ctx,configurable:true});
  class Utter{constructor(text){this.text=text;}}
  Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:Utter});
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
   speak(utter){
    window.__atcMissionTrial.voices.push(utter);
    queueMicrotask(()=>{utter.onstart?.();utter.onend?.();});
   },
   cancel(){},
   getVoices(){return[{lang:'en-GB',name:'British Controller'},{lang:'en-GB',name:'Pilot'},{lang:'en-US',name:'US Controller'}];}
  }});
 });
 await page.goto(pathToFileURL(path.resolve('flight-sim.html')).href,{waitUntil:'load'});
 assert.equal(await page.locator('#atcMissionSelect option').count(),5);
 assert.equal(await page.locator('#atcMissionChoices button').count(),3);
 assert.equal(await page.evaluate(()=>window.__atcMissionTrial.voices.length),0,'no autoplay on page load');
 await page.locator('#atcMissionSelect').selectOption('runway');
 assert.match(await page.locator('#atcMissionPrompt').textContent(),/hold position/i);
 await page.locator('#atcMissionHear').click();
 assert.equal(await page.evaluate(()=>window.__atcMissionTrial.voices.length),1);
 await page.locator('#atcMissionChoices button').filter({hasText:'Acknowledge and hold position'}).click();
 assert.match(await page.locator('#atcMissionFeedback').textContent(),/Appropriate response/);
 assert.match(await page.locator('#atcMissionScore').textContent(),/Appropriate responses: 1/);
 assert.equal(await page.locator('#atcMissionNext').isDisabled(),false);
 assert.equal(await page.evaluate(()=>window.__atcMissionTrial.voices.length),3);
 assert.ok(await page.evaluate(()=>window.__atcMissionTrial.radioStarts)>0,'radio sound keying generated');
 await page.locator('#atcMissionNext').click();
 assert.match(await page.locator('#atcMissionPrompt').textContent(),/hold short of runway/i);
 await page.locator('#atcAirport').selectOption('gfha');
 assert.equal(await page.locator('#atcMissionSelect option').count(),2);
 assert.match(await page.locator('#atcMissionIntro').textContent(),/no verified tower service/i);
 assert.doesNotMatch(await page.locator('#atcMissionPrompt').textContent(),/cleared for takeoff/i);
 await page.locator('#atcMissionSelect').selectOption('local-traffic');
 assert.match(await page.locator('#atcMissionPrompt').textContent(),/not verified/i);
 await page.locator('#atcAirport').selectOption('kjfk');
 await page.locator('#atcMissionSelect').selectOption('handoff');
 assert.match(await page.locator('#atcMissionPrompt').textContent(),/contact/i);
 await page.locator('#atcMissionHear').click();
 const lang=await page.evaluate(()=>window.__atcMissionTrial.voices.at(-1).lang);
 assert.equal(lang,'en-US');
 assert.deepEqual(errors,[],'no browser runtime errors');
 console.log('Phone ATC missions: guided responses, radio effects, airport switching and no-autoplay passed.');
}finally{await browser.close();}
