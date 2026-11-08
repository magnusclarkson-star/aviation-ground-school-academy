const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const World=require('../flight-sim-atc-world.js');
const Drill=require('../flight-sim-atc-practice.js');
const root=path.join(__dirname,'..');
test('every international airport provides a suitable scripted readback, never a clearance at Hastings',()=>{
 for(const airport of World.airports){
  const sequence=Drill.sequenceFor(airport.id,'normal');
  assert.equal(sequence.length,airport.advisory?2:5,airport.id);
  for(const type of sequence){
   const example=Drill.makeDrill(airport.id,type);
   assert.equal(example.airport,airport.id);
   assert.ok(example.instruction.length>30);
   assert.ok(example.answer.length>20);
   assert.ok(example.checks.length>=3);
   assert.equal(Drill.evaluate(example,example.answer).passed,true,airport.id+' '+type+' '+example.answer);
   if(airport.advisory)assert.doesNotMatch(example.instruction,/cleared (?:for takeoff|to land)/i);
  }
 }
});
test('situation selection brings the targeted exercise first',()=>{
 assert.equal(Drill.sequenceFor('kjfk','go-around')[0],'go-around');
 assert.equal(Drill.sequenceFor('egll','readback')[0],'altitude');
 assert.equal(Drill.sequenceFor('gfha','go-around')[0],'advisory-departure');
});
test('wrong runway, wrong operation, wrong altitude and omitted callsign are flagged',()=>{
 const hold=Drill.makeDrill('egll','hold-short');
 assert.equal(Drill.evaluate(hold,'Runway two six left, hold short of runway two six left, Academy Four Two One').passed,false);
 assert.equal(Drill.evaluate(hold,'Runway two seven right, cleared for takeoff, Academy Four Two One').passed,false);
 assert.equal(Drill.evaluate(hold,'Runway two seven right, hold short').passed,false);
 assert.ok(Drill.evaluate(hold,'Hold short runway 27R, Academy 421').passed);
 const alt=Drill.makeDrill('kjfk','altitude');
 assert.equal(Drill.evaluate(alt,'Maintain five thousand feet, Academy Four Two One').passed,false);
 assert.ok(Drill.evaluate(alt,'Maintain 3000, Academy 421').passed);
 const ga=Drill.makeDrill('yssy','go-around');
 assert.equal(Drill.evaluate(ga,'Going around, climb straight ahead to three thousand feet, Academy 421').passed,false);
});
function mock(){
 const els=new Map(),handlers={};
 function element(id){if(!els.has(id))els.set(id,{
  id,value:'',textContent:'',hidden:false,dataset:{},events:{},
  addEventListener(name,handler){this.events[name]=handler;},
 });return els.get(id);}
 const doc={hidden:false,getElementById:element,addEventListener(name,handler){handlers[name]=handler;}};
 const utterances=[],speech={cancelCalls:0,speak(utter){utterances.push(utter);},cancel(){this.cancelCalls++;},getVoices(){return[{lang:'en-GB',name:'Mock British'},{lang:'en-US',name:'Mock American'}];}};
 class Utter{constructor(text){this.text=text;}}
 const win={speechSynthesis:speech,SpeechSynthesisUtterance:Utter,addEventListener(){}};
 return {doc,win,element,handlers,utterances,speech};
}
test('phone-friendly practice provides one voiced ATC call, correction and follow-up without microphone',()=>{
 const x=mock(),events=[];
 let airport='gfll';
 const session=Drill.attach({windowLike:x.win,documentLike:x.doc,getAirport:()=>airport,getSituation:()=> 'normal',
  onBegin:()=>events.push('begin'),onTransmissionStart:()=>events.push('key'),
  onTransmissionEnd:()=>events.push('squelch'),onFinish:()=>events.push('finish')});
 assert.equal(session.stats().attempts,0);
 assert.equal(x.utterances.length,0);
 x.element('atcDrillHear').events.click();
 assert.equal(x.utterances.length,1);
 x.utterances[0].onstart();
 x.utterances[0].onend();
 assert.deepEqual(events,['begin','key','squelch','finish']);
 x.element('atcDrillResponse').value='roger';
 x.element('atcDrillCheck').events.click();
 assert.equal(session.stats().attempts,1);
 assert.equal(session.stats().correct,0);
 x.element('atcDrillResponse').value=session.getDrill().answer;
 x.element('atcDrillCheck').events.click();
 assert.equal(session.stats().attempts,1);
 assert.equal(session.stats().correct,1);
 x.element('atcDrillCheck').events.click();
 assert.equal(session.stats().correct,1);
 x.element('atcDrillNext').events.click();
 assert.match(session.getDrill().title,/takeoff/i);
 airport='gfha';x.element('atcAirport').events.change();
 assert.match(session.getDrill().title,/Uncontrolled/i);
 assert.doesNotMatch(session.getDrill().instruction,/cleared for takeoff/i);
});
test('page hide stops speech and text-only fallback remains usable',()=>{
 const x=mock(),session=Drill.attach({windowLike:x.win,documentLike:x.doc});
 session.hear();x.utterances[0].onstart();
 x.doc.hidden=true;x.handlers.visibilitychange();
 assert.equal(x.speech.cancelCalls,1);
 const y=mock();delete y.win.SpeechSynthesisUtterance;
 const textOnly=Drill.attach({windowLike:y.win,documentLike:y.doc});
 assert.equal(textOnly.supported,false);
 assert.equal(textOnly.hear(),false);
 y.element('atcDrillResponse').value=textOnly.getDrill().answer;
 assert.equal(textOnly.check().passed,true);
});
test('HTML, scripts and audio coordination are present without microphone, storage or network',()=>{
 const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
 const script=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'flight-sim-atc-practice.css'),'utf8');
 const source=fs.readFileSync(path.join(root,'flight-sim-atc-practice.js'),'utf8');
 for(const id of ['atcDrillName','atcDrillInstruction','atcDrillResponse','atcDrillHear','atcDrillCheck','atcDrillNext','atcDrillReveal','atcDrillAnswer','atcDrillFeedback','atcDrillStatus','atcDrillProgress','atcDrillLesson'])
  assert.ok(html.includes('id="'+id+'"'),id);
 for(const file of ['flight-sim-atc-practice.js','flight-sim-atc-practice.css'])
  assert.ok(html.includes(file),file);
 assert.match(script,/atcPractice=AP\.attach/);
 assert.match(script,/atcPractice\?\.stop\(\)/);
 assert.match(css,/atc-readback-lab/);
 for(const forbidden of ['getUserMedia','fetch(', 'XMLHttpRequest','sendBeacon','localStorage','sessionStorage'])
  assert.ok(!source.includes(forbidden),forbidden);
});
