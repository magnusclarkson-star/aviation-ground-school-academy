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
 ['f35','db911de503c74285a8d506951df786d6','andertan']
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
 assert.ok(!js.includes('typhoon:{uid:'),'inaccurate hosted Typhoon must not replace native airframe');
 assert.match(js,/id==="typhoon"&&gpuVisible\?"Typhoon · FlightGear 3D"/);

 assert.match(js,/if\(id==="c172"\)phase=renderer\.realC172Status/);
 assert.match(js,/else if\(id==="r44"\)phase=renderer\.realR44Status/);
});

test('Typhoon 360 exposes the actual GPL source with paired underside intake ducts',()=>{
 const source=fs.readFileSync(path.join(root,'flight-sim-typhoon-airframe.js'),'utf8');
 assert.match(source,/assets\/aircraft\/typhoon-fg-exterior\.json/);
 const data=JSON.parse(fs.readFileSync(path.join(root,'assets/aircraft/typhoon-fg-exterior.json'),'utf8'));
 assert.equal(data.format,'agsa-fg-typhoon-v1');
 const detail=data.parts.find(p=>p.name==='details');
 const dark=detail.g.find(g=>g[0]===22);
 assert.ok(dark&&dark[1].length/3>=100,'underside duct panels must not disappear');
 const sample=[...new Set(dark[1])].map(i=>detail.v.slice(i*3,i*3+3).map(x=>x/1000));
 assert.ok(sample.some(([x,y,z])=>x<-.7&&y<-.6&&z>2.5),'port chin duct');
 assert.ok(sample.some(([x,y,z])=>x>.7&&y<-.6&&z>2.5),'starboard chin duct');
 const fallback=fs.readFileSync(path.join(root,'flight-sim-airframe-geometry.js'),'utf8');
 assert.match(fallback,/bifurcated\* ventral chin intake/);
 assert.match(fallback,/for\(const sign of \[-1,1\]\)\{/);
});
