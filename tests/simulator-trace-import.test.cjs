const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const Import=require('../simulator-trace-import.js');
const AfterAction=require('../flight-sim-after-action.js');
const page=fs.readFileSync(path.join(root,'simulator-debrief.html'),'utf8');
const sample=(observations)=>({schema:'academy.synthetic-flight-trace.v1',synthetic:true,mode:'airplane',observations});
test('only explicit synthetic traces with 2-600 rows are accepted',()=>{
 assert.equal(Import.validateTrace({}).ok,false);
 assert.equal(Import.validateTrace(sample([])).ok,false);
 assert.equal(Import.validateTrace(sample([{t:0}])).ok,false);
 assert.equal(Import.validateTrace(sample(Array.from({length:601},(_,i)=>({t:i})))).ok,false);
 assert.equal(Import.validateTrace({...sample([{t:0},{t:1}]),mode:'unknown'}).ok,false);
 assert.equal(Import.MAX_FILE_BYTES,512*1024);
 const output=Import.validateTrace(sample([{t:0},{t:1}]));
 assert.equal(output.ok,true);
 assert.equal(output.trace.observations.length,2);
});
test('unexpected JSON keys, names and location-like fields never enter report',()=>{
 const value=sample([
  {t:0,phase:'roll',altitudeM:0,speedKt:12,bankDeg:0,username:'PERSON NAME',email:'private@example.com',gps:{lat:8,lon:-13}},
  {t:1,phase:'climb',altitudeM:8,speedKt:34,bankDeg:0,sessionToken:'secret'}
 ]);
 const checked=Import.validateTrace(value);
 assert.equal(checked.ok,true);
 assert.ok(!JSON.stringify(checked.trace).includes('private@example.com'));
 assert.ok(!JSON.stringify(checked.trace).includes('PERSON NAME'));
 assert.ok(!JSON.stringify(checked.trace).includes('secret'));
 const d=AfterAction.summarise(checked.trace);
 assert.equal(d.available,true);
 assert.ok(!d.text.includes('private@example.com'));
 assert.match(d.warning,/SME_REVIEW_REQUIRED/);
});
test('debrief import requires a user file choice and can be cleared',()=>{
 assert.ok(page.includes('id="traceImport" type="file"'));
 assert.ok(page.includes('id="traceImportSummary" hidden'));
 assert.ok(page.includes("byId('traceImport').addEventListener('change',async()=>"));
 assert.ok(page.includes("window.AGSATraceImport.validateTrace(data)"));
 assert.ok(page.includes("JSON.parse(await file.text())"));
 assert.ok(page.includes("if(generation!==importGeneration)return;"));
 assert.ok(page.includes("byId('traceImportClear').addEventListener('click',clearImported)"));
 assert.ok(page.includes("byId('reset').addEventListener('click',()=>{clearImported();"));
 for(const term of ['fetch(', 'XMLHttpRequest','sendBeacon','localStorage','sessionStorage'])assert.ok(!fs.readFileSync(path.join(root,'simulator-trace-import.js'),'utf8').includes(term));
});
