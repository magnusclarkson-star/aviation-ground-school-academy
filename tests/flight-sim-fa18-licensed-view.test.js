'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
const js=fs.readFileSync(path.join(root,'flight-sim-inspection.js'),'utf8');
const css=fs.readFileSync(path.join(root,'flight-sim-inspection.css'),'utf8');
const records=[
 ['fa18','9e852037bf2141dcb3fda17013958131','KOG_THORNS'],
 ['f22','2a64abf0866a405c865466c7642ca689','NLM'],
 ['f35','db911de503c74285a8d506951df786d6','andertan'],
 ['typhoon','b3ede3f4280f4bf99ebbd4ebc7f5480d','Chenzoss']
];
test('each verified external model has a source id and attributed author',()=>{
 for(const [id,uid,author] of records){
  assert.match(js,new RegExp(id+':\\{uid:"'+uid+'"'));
  assert.ok(js.includes('author:"'+author+'"'));
 }
 assert.match(js,/CC BY/);
 assert.doesNotMatch(js,/su37:\\{uid:/);
});
test('external model remains exclusive to selected aircraft exterior',()=>{
 assert.match(js,/!orbit\.interior\?texturedModels\[selected\(\)\]:null/);
 assert.match(js,/texturedViewer\.hidden=!active/);
 assert.match(js,/texturedFrame\.removeAttribute\("src"\)/);
 assert.match(js,/texturedFrame\.getAttribute\("src"\)!==src/);
 assert.match(css,/\.aircraft-inspect-superhornet\[hidden\]/);
});
test('external renderer has exact source attribution, accessible UI and distinct training mode',()=>{
 assert.match(html,/id="aircraftInspectSuperHornetFrame"/);
 assert.match(html,/id="aircraftInspectTexturedCredit"/);
 assert.match(html,/id="aircraftInspectTexturedSource"/);
 assert.match(js,/Family reference model, not verified as F-35B-specific/);
 assert.match(js,/if\(syncTexturedViewer\(\)\)/);
});

test('approved C172 and R44 360 views remain native and not externally replaced',()=>{
 assert.ok(!js.includes('c172:{uid:'));
 assert.ok(!js.includes('r44:{uid:'));
 assert.match(js,/if\(id==="c172"\)phase=renderer\.realC172Status/);
 assert.match(js,/else if\(id==="r44"\)phase=renderer\.realR44Status/);
});
