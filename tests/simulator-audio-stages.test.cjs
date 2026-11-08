const test=require('node:test');
const assert=require('node:assert/strict');
const Radio=require('../flight-sim-atc-radio.js');
const fs=require('node:fs');
const path=require('node:path');

function environment(){
 const nodes=new Map(),listeners={},spoken=[];
 function el(id){
  if(!nodes.has(id))nodes.set(id,{
   textContent:'',attrs:{},handlers:{},children:[],className:'',
   setAttribute(k,v){this.attrs[k]=v;},
   addEventListener(k,cb){this.handlers[k]=cb;},
   replaceChildren(){this.children=[];},
   appendChild(c){this.children.push(c);},
   append(...children){this.children.push(...children);}
  });
  return nodes.get(id);
 }
 const doc={
  hidden:false,
  getElementById:el,
  createElement(name){return {name,textContent:'',children:[],className:'',append(...xs){this.children.push(...xs);}};},
  addEventListener(k,cb){listeners[k]=cb;}
 };
 const synth={cancelCount:0,speak(x){spoken.push(x);},cancel(){this.cancelCount++;},getVoices(){return []}};
 class Utter{constructor(t){this.text=t;}}
 const win={speechSynthesis:synth,SpeechSynthesisUtterance:Utter,addEventListener(){}};
 return {el,doc,win,spoken,synth,listeners};
}
test('phase mapping only recognizes imaginary flight stages and never claims halted to be landed',()=>{
 for(const [phase,stage] of Object.entries({roll:'before',pad:'before',climb:'during',flight:'during',
  approach:'during',lift:'during',hover:'during',rollout:'after',landed:'after',complete:'after'}))
  assert.equal(Radio.stageFromPhase(phase),stage);
 for(const invalid of ['halted','unknown','',null,1,'toString','constructor'])
  assert.equal(Radio.stageFromPhase(invalid),null);
});
test('phase radio starts silent, explicitly arms, fires each stage once, and disarms on learner command',()=>{
 const env=environment();let phase='roll';const calls=[];
 const radio=Radio.attach({windowLike:env.win,documentLike:env.doc,getPhase:()=>phase,
  getMode:()=> 'airplane',getScenario:()=> 'runway',
  onBegin:()=>calls.push('start'),onFinish:()=>calls.push('stop')});
 assert.equal(radio.isArmed(),false);
 assert.equal(env.spoken.length,0);
 assert.equal(env.el('atcAutoToggle').attrs['aria-pressed'],undefined);
 env.el('atcAutoToggle').handlers.click();
 assert.equal(radio.isArmed(),true);
 assert.equal(env.el('atcAutoToggle').attrs['aria-pressed'],'true');
 assert.equal(env.spoken.length,5,'before stage spoken on explicit arming');
 assert.equal(radio.cuePhase('roll'),false,'one-shot stage cannot repeat');
 assert.equal(env.spoken.length,5);
 assert.equal(radio.cuePhase('climb'),true,'during stage follows fictional climb');
 assert.equal(env.spoken.length,9);
 assert.equal(radio.cuePhase('approach'),false,'other during phases cannot repeat');
 assert.equal(radio.cuePhase('rollout'),true,'after stage follows fictional rollout');
 assert.equal(env.spoken.length,13);
 assert.equal(radio.cuePhase('complete'),false,'after stage is one shot');
 assert.equal(radio.cuePhase('halted'),false);
 env.el('atcStop').handlers.click();
 assert.equal(radio.isArmed(),false);
 assert.equal(env.el('atcAutoToggle').attrs['aria-pressed'],'false');
 assert.equal(radio.cuePhase('roll'),false);
 assert.ok(env.synth.cancelCount>0);
 assert.ok(calls.includes('start')&&calls.includes('stop'));
});
test('manual lesson stops automatic cues and hiding browser disarms speech',()=>{
 const env=environment();let phase='pad';
 const radio=Radio.attach({windowLike:env.win,documentLike:env.doc,getMode:()=> 'helicopter',getPhase:()=>phase});
 env.el('atcAutoToggle').handlers.click();assert.equal(radio.isArmed(),true);
 env.el('atcDuring').handlers.click();assert.equal(radio.isArmed(),false);
 const count=env.spoken.length;assert.equal(radio.cuePhase('landed'),false);
 assert.equal(env.spoken.length,count);
 env.el('atcAutoToggle').handlers.click();assert.equal(radio.isArmed(),true);
 env.doc.hidden=true;env.listeners.visibilitychange();
 assert.equal(radio.isArmed(),false);
 assert.equal(radio.isSpeaking(),false);
 assert.match(env.el('atcAutoStatus').textContent,/Page hidden/);
});
test('source wiring respects explicit arm, pauses and reset, and never enables microphone or network',()=>{
 const root=path.resolve(__dirname,'..');
 const script=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
 const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
 assert.ok(html.includes('id="atcAutoToggle" type="button" aria-pressed="false"'));
 assert.ok(html.includes('id="atcAutoStatus"'));
 assert.ok(script.includes('getPhase:()=>state.phase'));
 assert.ok(script.includes('atcRadio?.cuePhase(state.phase)'));
 assert.ok(script.includes('atcRadio?.disarm('));
 const source=fs.readFileSync(path.join(root,'flight-sim-atc-radio.js'),'utf8');
 for(const forbidden of ['getUserMedia','fetch(', 'XMLHttpRequest','localStorage','sessionStorage','sendBeacon']) assert.ok(!source.includes(forbidden));
});
