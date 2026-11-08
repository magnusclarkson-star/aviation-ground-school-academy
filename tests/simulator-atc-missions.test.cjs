const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const World=require('../flight-sim-atc-world.js');
const Missions=require('../flight-sim-atc-missions.js');
const root=path.resolve(__dirname,'..');

test('all 16 airport settings offer appropriate traffic and safety situations',()=>{
 assert.equal(World.airports.length,16);
 for(const airport of World.airports){
  const types=Missions.available(airport.id);
  assert.equal(types.length,airport.advisory?2:5);
  for(const type of types){
   const mission=Missions.makeMission(airport.id,type);
   assert.equal(mission.airport,airport.id);
   assert.equal(mission.steps.length,2);
   assert.ok(mission.intro.length>35);
   for(const step of mission.steps){
    assert.ok(step.prompt.length>45,airport.id+' '+type);
    assert.equal(step.choices.length,3);
    assert.equal(step.choices.filter(c=>c.correct).length,1);
    for(const choice of step.choices){
     const graded=Missions.evaluate(step,choice.id);
     assert.equal(graded.correct,choice.correct);
     assert.ok(graded.pilot.length>8);
     assert.ok(graded.why.length>25);
    }
    assert.equal(Missions.evaluate(step,'unknown'),null);
    if(airport.advisory){
     assert.notEqual(step.who,'ATC');
     assert.doesNotMatch(step.prompt,/cleared (?:for takeoff|to land)/i);
    }
   }
  }
 }
});
test('Hastings uses traffic advisory only and never supplies runway control scenarios',()=>{
 const a=Missions.makeMission('gfha','runway');
 assert.equal(a.id,'traffic');
 const b=Missions.makeMission('gfha','local-traffic');
 assert.equal(b.id,'local-traffic');
 for(const m of [a,b]){
  for(const step of m.steps)
   assert.ok(step.choices.some(c=>/no control|no tower|not a clearance|no atc|does not/.test(c.why.toLowerCase())));
 }
});
test('wrong runway entry, invented radio frequency, inaccurate traffic report and false landing clearance are rejected',()=>{
 const sample=[
  ['gfll','traffic','seen'],
  ['egll','runway','cross'],
  ['kjfk','handoff','frequency'],
  ['cyyz','urgency','false-clearance'],
  ['yssy','weather','clearance']
 ];
 for(const [airport,type,id] of sample){
  const m=Missions.makeMission(airport,type);
  assert.equal(Missions.evaluate(m.steps[0],id).correct,false,type);
  const right=m.steps[0].choices.find(c=>c.correct);
  assert.equal(Missions.evaluate(m.steps[0],right.id).correct,true);
 }
});

function createFake(){
 const elements=new Map(),docEvents={};
 function el(id){
  if(!elements.has(id))elements.set(id,{
   id,value:'traffic',textContent:'',disabled:false,hidden:false,dataset:{},children:[],events:{},
   addEventListener(ev,fn){this.events[ev]=fn;},
   appendChild(child){this.children.push(child);},
   replaceChildren(...nodes){this.children=[...nodes];},
   append(...nodes){this.children.push(...nodes);}
  });
  return elements.get(id);
 }
 const doc={hidden:false,getElementById:el,addEventListener(type,fn){docEvents[type]=fn;},
  createElement(tag){return {tag,textContent:'',value:'',disabled:false,dataset:{},children:[],events:{},
   addEventListener(ev,fn){this.events[ev]=fn;},append(...x){this.children.push(...x)}};
  }};
 const utterances=[],synth={cancelled:0,speak(u){utterances.push(u);},cancel(){this.cancelled++;},
  getVoices(){return [{lang:'en-GB',name:'One'},{lang:'en-GB',name:'Two'}];}};
 class Utter{constructor(t){this.text=t;}}
 const win={speechSynthesis:synth,SpeechSynthesisUtterance:Utter,addEventListener(){}};
 return {el,doc,docEvents,win,utterances,synth};
}
test('mobile workflow: chosen pilot response produces radio sequence and session-only feedback',()=>{
 const t=createFake(),events=[];let airport='gfll';
 const ui=Missions.attach({windowLike:t.win,documentLike:t.doc,getAirport:()=>airport,
  onBegin:()=>events.push('begin'),onTransmissionStart:()=>events.push('ptt'),
  onTransmissionEnd:()=>events.push('squelch'),onFinish:()=>events.push('finish')});
 assert.equal(ui.supported,true);
 assert.equal(ui.getMission().id,'traffic');
 assert.equal(t.utterances.length,0);
 assert.equal(t.el('atcMissionSelect').children.length,5);
 assert.equal(ui.hear(),true);
 assert.equal(t.utterances.length,1);
 t.utterances[0].onstart();t.utterances[0].onend();
 assert.deepEqual(events,['begin','ptt','squelch','finish']);
 assert.equal(ui.answer('seen').correct,false);
 assert.equal(ui.stats().trials,1);assert.equal(ui.stats().correct,0);
 assert.equal(ui.answer('negative'),null,'no multiple responses to one transmission');
 assert.equal(t.el('atcMissionNext').disabled,false);
 assert.equal(ui.next(),true);assert.equal(ui.getStep(),1);
 assert.equal(ui.answer('seen').correct,true);
 assert.equal(ui.stats().correct,1);
 assert.equal(t.el('atcMissionFeedback').dataset.result,'complete');
 assert.equal(ui.next(),true);assert.equal(ui.getStep(),0);
 assert.equal(t.el('atcMissionTranscript').children.length,1);
 airport='gfha';t.el('atcAirport').events.change();
 assert.equal(ui.getMission().advisory,true);
 assert.equal(t.el('atcMissionSelect').children.length,2);
 assert.equal(ui.getMission().id,'traffic');
 assert.equal(t.el('atcMissionChoices').children.length,3);
});
test('speaker fallback, cancellation and page-hide have no microphone dependencies',()=>{
 const t=createFake();
 const ui=Missions.attach({windowLike:t.win,documentLike:t.doc});
 ui.hear();t.utterances[0].onstart();
 t.doc.hidden=true;t.docEvents.visibilitychange();
 assert.equal(t.synth.cancelled,1);
 const x=createFake();delete x.win.SpeechSynthesisUtterance;
 const textOnly=Missions.attach({windowLike:x.win,documentLike:x.doc});
 assert.equal(textOnly.supported,false);assert.equal(textOnly.hear(),false);
 assert.equal(textOnly.answer('negative').correct,true);
});
test('page integration includes safe mobile controls and radio FX wiring',()=>{
 const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'flight-sim-atc-missions.css'),'utf8');
 const module=fs.readFileSync(path.join(root,'flight-sim-atc-missions.js'),'utf8');
 for(const id of ['atcMissionSelect','atcMissionTitle','atcMissionIntro','atcMissionStep','atcMissionPrompt','atcMissionQuestion','atcMissionChoices','atcMissionFeedback','atcMissionTranscript','atcMissionScore','atcMissionStatus','atcMissionHear','atcMissionStop','atcMissionNext']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.ok(html.includes('flight-sim-atc-missions.js'));
 assert.ok(html.includes('flight-sim-atc-missions.css'));
 assert.match(js,/atcMissions=AM\.attach/);
 assert.match(js,/radioFx\.begin\(\);radioTone\.pulse\(\)/);
 assert.match(js,/atcMissions\?\.stop\(\)/);
 assert.match(css,/@media\(max-width:500px\)/);
 for(const forbidden of ['getUserMedia','fetch(', 'XMLHttpRequest', 'sendBeacon','localStorage','sessionStorage'])
  assert.ok(!module.includes(forbidden),forbidden);
});
