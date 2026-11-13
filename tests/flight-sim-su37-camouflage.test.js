'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parseSu37,su37SkinColor}=require('../flight-sim-su37-airframe.js');
const fixture=fs.readFileSync(path.join(__dirname,'../assets/aircraft/su37-fguk-exterior.json'),'utf8');

test('Native Su-37 licensed mesh remains complete after camouflage paint',()=>{
 const mesh=parseSu37(fixture);
 assert.ok(mesh.triangles>=18000 && mesh.triangles<=26000);
 assert.ok(mesh.primitives.some(x=>x.sourceName==='wing'));
 assert.ok(mesh.primitives.some(x=>x.sourceName==='canopy'));
 assert.ok(mesh.primitives.every(p=>Array.from(p.colors).every(c=>Number.isFinite(c)&&c>=0&&c<=1)));
});

test('Camouflage follows aircraft coordinates, without recolouring wheels or glass',()=>{
 const base=[.50,.50,.50];
 assert.deepEqual(su37SkinColor('noseGear',0,.5,0,base),base);
 assert.deepEqual(su37SkinColor('canopy',0,.5,0,base),base);
 assert.deepEqual(su37SkinColor('mainGearLeft',0,.5,0,base),base);
 assert.deepEqual(su37SkinColor('wing',3,-1,2,base),base);
 const top=su37SkinColor('wing',3,.5,2,base);
 assert.notDeepEqual(top,base);
 assert.deepEqual(top,su37SkinColor('wing',3,.5,2,base));
 const wing=parseSu37(fixture).primitives.filter(p=>p.sourceName==='wing');
 const colors=new Set();
 for(const part of wing)
  for(let j=0;j<part.colors.length;j+=3)
   colors.add(Array.from(part.colors.slice(j,j+3),v=>v.toFixed(2)).join(','));
 assert.ok(colors.size>12,'Wings should show multiple native paint tones');
});
