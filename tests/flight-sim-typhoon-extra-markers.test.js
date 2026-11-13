'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'flight-sim-typhoon-airframe.js'),'utf8');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'assets/aircraft/typhoon-fg-exterior.json'),'utf8'));
const detail=fixture.parts.find(part=>part.name==='details');

test('Typhoon source helper markers are excluded without removing genuine wingtip lights',()=>{
 assert.ok(detail,'Typhoon source detail group exists');
 const skipped=[26,27,31,32,33];
 assert.match(source,/part\.name==="details"&&\[26,27,31,32,33\]\.includes\(group\[0\]\)\)continue/);
 for(const material of skipped){
  const g=detail.g.find(group=>group[0]===material);
  assert.ok(g,'source marker group '+material+' remains identifiable for auditable filtering');
 }
 for(const light of [34,35,36,37,38,39]){
  assert.ok(detail.g.some(group=>group[0]===light),'tiny navigation-light source preserved '+light);
  assert.ok(!skipped.includes(light),'legitimate light group not filtered');
 }
});

test('Typhoon source still includes required flight geometry and control surfaces',()=>{
 const names=new Set(fixture.parts.map(part=>part.name));
 for(const required of ['fuselage','wing','tail','canopy','elevator.L','elevator.R',
  'flaperon.L','flaperon.R','rudder','mainGearLeft','mainGearRight','noseGear']){
  assert.ok(names.has(required),'source retains '+required);
 }
 assert.match(source,/return \{primitives,images:\[\],vertices,triangles,bounds/);
});
