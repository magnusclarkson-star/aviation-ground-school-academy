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

test('front-wheel markers 26/27 are overlapping guides, not the actual nose-gear mesh',()=>{
 const nose=fixture.parts.find(part=>part.name==='noseGear');
 assert.ok(nose,'actual nose-gear assembly exists as a separate part');
 const groups=[26,27].map(material=>detail.g.find(group=>group[0]===material));
 for(const group of groups)assert.ok(group&&group[1].length===57,'front guide group has 19 triangles');
 const bbox=group=>{
  const indices=[...new Set(group[1])];
  return [0,1,2].map(axis=>{
   const coords=indices.map(i=>detail.v[3*i+axis]/1000);
   return [Math.min(...coords),Math.max(...coords)];
  });
 };
 const [a,b]=groups.map(bbox);
 for(let axis=0;axis<3;axis++){
  assert.ok(Math.abs(a[axis][0]-b[axis][0])<.05,'overlapping guide minimum '+axis);
  assert.ok(Math.abs(a[axis][1]-b[axis][1])<.05,'overlapping guide maximum '+axis);
 }
 assert.ok(a[2][1]>3.4,'front guides reach forward of main gear');
});

test('upper-tail marker is a one-metre box outside the actual fin',()=>{
 const marker=detail.g.find(group=>group[0]===33);
 assert.ok(marker,'tail marker exists');
 assert.equal(marker[1].length,18);
 const ids=[...new Set(marker[1])];
 const bounds=[0,1,2].map(axis=>{
  const coords=ids.map(i=>detail.v[3*i+axis]/1000);
  return [Math.min(...coords),Math.max(...coords)];
 });
 assert.ok(bounds[1][0]>=2.7&&bounds[1][1]>=3.7,'guide sits high above tail');
 assert.ok(bounds[2][0]<-8,'guide protrudes aft of aircraft fin');
 const fin=fixture.parts.find(part=>part.name==='tail');
 assert.ok(fin&&fin.g.length,'actual vertical fin remains separate');
});
