'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/aircraft/typhoon-fg-exterior.json'),'utf8'));
const typhoon=require('../flight-sim-typhoon-airframe.js');
const details=source.parts.find(p=>p.name==='details');
const get=(m)=>details.g.find(group=>group[0]===m)[1];
const countRemoved=(m)=>{let removed=0;const faces=get(m);for(let j=0;j<faces.length;j+=3)if(typhoon.isConstructionPinTriangle(details,m,faces.slice(j,j+3)))removed++;return removed;};
test('remaining extraneous nose-gear and rear upper-fuselage pins are removed at source coordinates',()=>{
 assert.equal(countRemoved(28),792);
 assert.equal(countRemoved(29),598);
 assert.equal(countRemoved(30),264);
 assert.equal(countRemoved(38),118);
 assert.equal(get(28).length/3-countRemoved(28),99,'keep unrelated mesh on wingtip');
});
test('wingtip navigation housings and actual landing gear are not removed',()=>{
 for(const m of [34,35,36,37,39])assert.equal(countRemoved(m),0);
 for(const id of ['noseGear','mainGearLeft','mainGearRight','wing','fuselage','tail','rudder','elevator.L','elevator.R']){
  const part=source.parts.find(p=>p.name===id);
  assert.ok(part);
  for(const [material,faces] of part.g)for(let j=0;j<faces.length;j+=3)
   assert.equal(typhoon.isConstructionPinTriangle(part,material,faces.slice(j,j+3)),false);
 }
});
test('mesh parses without old indicators and remains under mobile size budget',()=>{
 const parsed=typhoon.parseTyphoon(JSON.stringify(source));
 assert.ok(parsed.triangles>=16000&&parsed.triangles<17000);
 assert.ok(parsed.primitives.length>40);
 assert.ok(parsed.primitives.some(p=>p.sourceName==='noseGear'));
 assert.ok(parsed.primitives.some(p=>p.sourceName==='tail'));
});