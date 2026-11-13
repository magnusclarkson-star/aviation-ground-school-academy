'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const Paint=require('../flight-sim-native-livery.js');
const Mesh=require('../flight-sim-3d.js').Mesh;
const Exterior=require('../flight-sim-airframe-geometry.js');
const imported=[
 ['f22',require('../flight-sim-f22-airframe.js').parseF22,'f22-fguk-exterior.json','Left_Wing_0',30000],
 ['f35',require('../flight-sim-f35-airframe.js').parseF35,'f35b-fg-exterior.json','fuselage',19000],
 ['typhoon',require('../flight-sim-typhoon-airframe.js').parseTyphoon,'typhoon-fg-exterior.json','wing',17000]
];
test('Livery painter remains finite, deterministic and leaves non-skin parts unchanged',()=>{
 const base=[.5,.55,.60];
 for(const [id] of imported){
  const a=Paint.paint(id,id==='f22'?'Left_Wing_0':id==='f35'?'fuselage':'wing',2,.35,1,base);
  const b=Paint.paint(id,id==='f22'?'Left_Wing_0':id==='f35'?'fuselage':'wing',2,.35,1,base);
  assert.deepEqual(a,b);
  assert.ok(a.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
  assert.notDeepEqual(a,base);
  for(const name of ['canopy','noseGear','gear:wheel.L','intake'])
   assert.deepEqual(Paint.paint(id,name,2,.35,1,base),base);
 }
});
test('F-22 lower fuselage stays matte while upper camouflage and other fighters stay intact',()=>{
 const base=[.66,.73,.77];
 const low=Paint.paint('f22','Fuselage_2',1.5,-1.70,-2.4,base);
 assert.ok(low.every((c,i)=>c<base[i]-.16),
  'source Raptor underside and wheel-well shoulders must not look white');
 assert.deepEqual(Paint.paint('f22','Fuselage_2',1.5,-1.30,-2.4,base),base);
 assert.deepEqual(Paint.paint('f22','Fuselage_2',0,-1.70,-2.4,base),base,
  'centreline and nose must stay unchanged');
 assert.deepEqual(Paint.paint('f22','Fuselage_2',1.5,-1.70,-4.4,base),base,
  'aft fuselage cannot acquire a dark paint stripe');
 assert.deepEqual(Paint.paint('f35','fuselage',1.5,-1.70,-2.4,base),base);
 assert.deepEqual(Paint.paint('f22','Left_Wing_0',1.5,-1.70,-2.4,base),base);
});
test('Imported fighter paint maintains real licensed geometry and creates multiple tones',()=>{
 for(const [id,parse,file,primary,minTriangles] of imported){
  const model=parse(fs.readFileSync(path.join(root,'assets/aircraft',file),'utf8'));
  assert.ok(model.triangles>minTriangles,id+' triangle regression');
  assert.ok(model.primitives.every(p=>p.colors.every(c=>Number.isFinite(c)&&c>=0&&c<=1)));
  const shades=new Set();
  for(const p of model.primitives.filter(p=>p.sourceName===primary))
   for(let i=0;i<p.colors.length;i+=3)
    shades.add(Array.from(p.colors.slice(i,i+3),c=>c.toFixed(2)).join(','));
  assert.ok(shades.size>5,id+' visual skin uniform');
 }
});
test('F/A-18 in-flight airframe uses native finish without altering its topology',()=>{
 const m=new Mesh();assert.equal(Exterior.populate(m,'fa18'),'fa18');
 const mesh=m.finish();
 assert.ok(mesh.triangles>=800);
 assert.ok(Array.from(mesh.colors).every(v=>Number.isFinite(v)&&v>=0&&v<=1));
 const shades=new Set();
 for(let i=0;i<mesh.colors.length;i+=3)
  shades.add(Array.from(mesh.colors.slice(i,i+3),c=>c.toFixed(2)).join(','));
 assert.ok(shades.size>40);
});
