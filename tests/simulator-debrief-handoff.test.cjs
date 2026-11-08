// Static contract test for the device-only scenario handoff.
// Run: node --test tests/simulator-debrief-handoff.test.cjs
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const simulator=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
const debrief=fs.readFileSync(path.join(root,'simulator-debrief.html'),'utf8');
const keys=['takeoff','approach','turn','rotorcraft','loading'];
test('each practice exercise links to its corresponding reflection',()=>{
  for(const key of keys) assert.match(simulator,new RegExp('simulator-debrief\\.html\\?scenario='+key+'["\\']'));
});
test('handoff strictly permits known scenario keys',()=>{
  assert.match(debrief,/new URLSearchParams\(window\.location\.search\)\.get\('scenario'\)/);
  assert.match(debrief,/Object\.prototype\.hasOwnProperty\.call\(scenarios,handoff\)/);
  for(const key of keys) assert.match(debrief,new RegExp('\\b'+key+':\\{'));
});
test('debrief remains unsigned, ungraded and learner-controlled',()=>{
  assert.match(debrief,/trainingCredit:false/);
  assert.match(debrief,/instructorVerified:false/);
  assert.match(debrief,/simulatorTelemetry:false/);
  assert.match(debrief,/SME_REVIEW_REQUIRED/);
  assert.match(debrief,/byId\('export'\)\.addEventListener\('click'/);
  assert.doesNotMatch(debrief,/localStorage\.|sessionStorage\.|fetch\(|XMLHttpRequest|sendBeacon/);
});
