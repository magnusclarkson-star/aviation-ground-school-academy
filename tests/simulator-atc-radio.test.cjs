const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Radio=require('../flight-sim-atc-radio.js');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
const script=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
test('all before, during and after scripts alternate pilot/tower and preserve fictional warning',()=>{
 assert.deepEqual(Radio.STAGES,['before','during','after']);
 for(const mode of ['airplane','helicopter']){
  for(const stage of Radio.STAGES){
   const lines=Radio.dialogue(stage,mode,'approach');
   assert.ok(lines.length>=4);
   for(let i=0;i<lines.length;i++){
    assert.equal(lines[i].speaker,i%2?'Tower':'Pilot');
    assert.ok(lines[i].text.length>40&&lines[i].text.length<250);
   }
   assert.ok(lines.some(x=>/fictional|simulat|imaginary|conceptual|not a real|no real|classroom|educational/i.test(x.text)));
  }
 }
 assert.match(Radio.dialogue('before','airplane','runway').map(x=>x.text).join(' '),/departure/);
 assert.match(Radio.dialogue('during','airplane','approach').map(x=>x.text).join(' '),/landing clearance/);
 assert.match(Radio.dialogue('after','airplane','runway').map(x=>x.text).join(' '),/landing/);
 assert.match(Radio.dialogue('during','helicopter','runway').map(x=>x.text).join(' '),/hover/);
 assert.throws(()=>Radio.dialogue('invalid'),/Unsupported/);
 assert.equal(Radio.makeAll('airplane','runway').length,13);
});
function mockWorld({voices=true}={}){
 const els=new Map(),docListeners={};
 function element(id){
  if(!els.has(id))els.set(id,{
   id,textContent:'',disabled:false,children:[],handlers:{},className:'',
   addEventListener(event,fn){this.handlers[event]=fn;},
   replaceChildren(){this.children=[];},
   appendChild(x){this.children.push(x);},
   append(...items){this.children.push(...items)}
  });
  return els.get(id);
 }
 const doc={hidden:false,getElementById:element,
  createElement(name){return {name,textContent:'',children:[],className:'',append(...items){this.children.push(...items);}};},
  addEventListener(name,fn){docListeners[name]=fn;}};
 class Utter{constructor(text){this.text=text;}}
 const spoken=[],speech={cancelled:0,speak(u){spoken.push(u);},cancel(){this.cancelled++},getVoices(){return voices?[{lang:'en-GB',name:'Pilot'},{lang:'en-US',name:'Tower'}]:[]}};
 const win={speechSynthesis:speech,SpeechSynthesisUtterance:Utter,addEventListener(){}};
 return {els,doc,win,spoken,speech,docListeners,element};
}
test('radio defaults to written transcript with no speech and plays alternating device voices only after click',()=>{
 const env=mockWorld(),events=[];
 const radio=Radio.attach({windowLike:env.win,documentLike:env.doc,getMode:()=> 'airplane',
  getScenario:()=> 'approach',onBegin:()=>events.push('begin'),onFinish:()=>events.push('finish')});
 assert.equal(env.spoken.length,0);
 assert.equal(radio.isSpeaking(),false);
 assert.equal(env.element('atcTranscript').children.length,5);
 assert.equal(radio.play('during'),true);
 assert.equal(radio.isSpeaking(),true);
 assert.equal(env.spoken.length,4);
 assert.equal(env.spoken[0].pitch,1.17);
 assert.equal(env.spoken[1].pitch,.78);
 assert.notEqual(env.spoken[0].voice,env.spoken[1].voice);
 assert.match(env.element('atcStatus').textContent,/Speaking/);
 env.spoken.at(-1).onend();
 assert.equal(radio.isSpeaking(),false);
 assert.deepEqual(events,['begin','finish']);
 assert.equal(radio.play('after'),true);
 env.element('atcStop').handlers.click();
 assert.equal(radio.isSpeaking(),false);
 assert.ok(env.speech.cancelled>=1);
});
test('complete flight exchange contains all stages; tab hiding interrupts the synthetic dialogue',()=>{
 const env=mockWorld(),radio=Radio.attach({windowLike:env.win,documentLike:env.doc,
  getMode:()=> 'helicopter',getScenario:()=> 'runway'});
 env.element('atcAll').handlers.click();
 assert.equal(env.spoken.length,Radio.makeAll('helicopter','runway').length);
 assert.equal(radio.isSpeaking(),true);
 env.doc.hidden=true;env.docListeners.visibilitychange();
 assert.equal(radio.isSpeaking(),false);
 assert.match(env.element('atcStatus').textContent,/Page hidden/);
});
test('without synthesized voice, transcript remains readable and all buttons work',()=>{
 const env=mockWorld();
 delete env.win.SpeechSynthesisUtterance;
 const radio=Radio.attach({windowLike:env.win,documentLike:env.doc});
 assert.equal(radio.supported,false);
 assert.equal(radio.play('before'),false);
 assert.equal(env.spoken.length,0);
 assert.equal(env.element('atcTranscript').children.length,5);
 assert.match(env.element('atcStatus').textContent,/unavailable/);
});
test('radio UI requires user gesture and no microphone or network',()=>{
 for(const id of ['atcBefore','atcDuring','atcAfter','atcAll','atcStop','atcTranscript','atcStatus'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('src="flight-sim-atc-radio.js?v=20261110-fullcircuit1"'));
 assert.ok(script.includes('atcRadio=F.attach('));
 assert.ok(script.includes('onBegin:()=>{'));
 assert.ok(script.includes('instructorVoice?.isSpeaking()'));
 const code=fs.readFileSync(path.join(root,'flight-sim-atc-radio.js'),'utf8');
 for(const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage','getUserMedia','sendBeacon'])
  assert.ok(!code.includes(forbidden));
});

test('phase-linked radio includes one arrival exchange after a full runway circuit',()=>{
 const env=mockWorld();
 const radio=Radio.attach({windowLike:env.win,documentLike:env.doc,
  getMode:()=> 'airplane',getScenario:()=> 'runway',getPhase:()=> 'roll'});
 radio.arm(true);
 assert.equal(radio.cuePhase('climb'),true);
 assert.match(env.element('atcTranscript').children.map(item=>item.children[1]?.textContent).join(' '),/reports a climb/);
 const spokenBefore=env.spoken.length;
 assert.equal(radio.cuePhase('approach'),true,
  'returning to runway must speak final despite earlier climb exchange');
 assert.ok(env.spoken.length>spokenBefore);
 const transcript=env.element('atcTranscript').children.map(item=>item.children[1]?.textContent).join(' ');
 assert.match(transcript,/reports an approach/);
 assert.match(transcript,/landing clearance/);
 assert.equal(radio.cuePhase('approach'),false,
  'same final-approach radio phase never plays repeatedly');
 assert.equal(radio.cuePhase('flight'),false,
  'already-delivered departure flight stage is unchanged');
 assert.equal(radio.cuePhase('rollout'),true);
 assert.match(env.element('atcTranscript').children.map(item=>item.children[1]?.textContent).join(' '),/completed the simulated landing/);
 radio.disarm();
});
