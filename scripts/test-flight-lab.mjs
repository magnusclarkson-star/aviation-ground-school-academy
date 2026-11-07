import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const elements = new Map();
class FakeElement {
  constructor() {
    this.listeners = {};
    this.attributes = {};
    this.dataset = {};
    this.value = '';
    this.textContent = '';
    this.style = {};
  }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  addEventListener(name, callback) { (this.listeners[name] ??= []).push(callback); }
  emit(name, event = {}) { for (const callback of this.listeners[name] ?? []) callback(event); }
  setPointerCapture(id) { this.pointerCapture = id; }
  querySelectorAll(selector) { return selector === 'input[data-fl2-key]' ? inputs : selector === 'button[data-fl2-set]' ? buttons : []; }
}
const get = id => { if (!elements.has(id)) elements.set(id, new FakeElement()); return elements.get(id); };
const inputs = ['pitch','roll','speed','alt','heading'].map(key => {
  const el = get('fl2-'+key); el.dataset.fl2Key=key; return el;
});
const buttons = [
  ['pitch',5],['pitch',-5],['roll',10],['roll',-10]
].map(([key,delta]) => {
  const el = new FakeElement();
  el.dataset.fl2Set=key;
  el.dataset.fl2Delta=String(delta);
  return el;
});
const document = {createElement:()=>new FakeElement(),head:{appendChild(){}},getElementById:get};
const window = {};
vm.runInNewContext(fs.readFileSync('flight-lab-v2.js','utf8'),{document,window},{filename:'flight-lab-v2.js'});
const lab = window.flightLabV2;
assert.ok(lab && typeof lab.template === 'function' && typeof lab.update === 'function');
const state = {pitch:0,roll:0,speed:110,alt:8200,heading:270};
const markup = lab.template(state);
assert.ok(markup.includes('fl2-instrument-title'));
assert.ok(markup.includes('fl2-pitch') && markup.includes('fl2-roll'));
assert.ok(markup.includes('fl2-stick'));
assert.ok(markup.includes('fl2-attitude'));
assert.ok(markup.includes('fixed yellow miniature aircraft'));
assert.ok(markup.includes('clipPath') && markup.includes('fl2-crop'));
let changes = 0;
const setInstrument=(key,value)=>{state[key]=Number(value);changes++;lab.update(state);};
lab.bind(state,setInstrument);
get('fl2-roll').value='25';
get('fl2-roll').emit('input');
assert.equal(state.roll,25);
assert.equal(get('fl2-card').attributes.transform,'translate(200 200) rotate(-25) translate(0 0)');
assert.equal(get('fl2-bank-pointer').attributes.transform,'rotate(25 200 200)');
get('fl2-pitch').value='10';
get('fl2-pitch').emit('input');
assert.equal(state.pitch,10);
assert.equal(get('fl2-card').attributes.transform,'translate(200 200) rotate(-25) translate(0 66)');
assert.ok(get('fl2-explanation').textContent.includes('horizon moves DOWN'));
get('fl2-level').emit('click');
assert.equal(state.pitch,0);
assert.equal(state.roll,0);
get('fl2-rightbank').emit('click');
assert.equal(state.roll,20);
get('fl2-climb').emit('click');
assert.equal(state.roll,0);
assert.equal(state.pitch,10);
const stick=get('fl2-stick');
stick.emit('pointerdown',{button:0,pointerType:'mouse',pointerId:7,clientX:100,clientY:100,preventDefault(){}});
assert.equal(stick.pointerCapture,7);
stick.emit('pointermove',{pointerId:7,clientX:140,clientY:70});
assert.equal(state.roll,18);
assert.equal(state.pitch,18);
stick.emit('pointerup',{pointerId:7});
stick.emit('pointermove',{pointerId:7,clientX:180,clientY:50});
assert.equal(state.roll,18);
get('fl2-speed').value='125';
get('fl2-speed').emit('input');
assert.equal(state.speed,125);
assert.equal(get('fl2-speed-reading').textContent,'125 kt');
assert.ok(changes>=8);
console.log('Flight Lab checks passed: pitch, bank, horizon rotation, bank pointer, readouts, control grip, button presets, slider input.');
