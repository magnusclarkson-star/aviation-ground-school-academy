'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const renderer=require('../flight-sim-3d.js');
const source=fs.readFileSync(path.join(__dirname,'../flight-sim-3d.js'),'utf8');

test('original RGBA fighter texture is small, repeatable and opaque',()=>{
 const a=renderer.makeFighterSurfaceMap(256),b=renderer.makeFighterSurfaceMap(256);
 assert.equal(a.size,256);
 assert.equal(a.data.length,256*256*4);
 assert.deepEqual(a.data,b.data);
 assert.ok(a.data.every(v=>v>=0&&v<=255));
 for(let i=3;i<a.data.length;i+=4)assert.equal(a.data[i],255);
 // Seams and fasteners actually exist, unlike a uniform colour swatch.
 assert.ok(a.data.some((v,i)=>i%4===1&&v===160),'panel seams present');
 assert.ok(a.data.some((v,i)=>i%4===2&&v===114),'fasteners present');
 assert.ok(new Set(a.data.filter((v,i)=>i%4===0)).size>10,
  'subtle paint grain present');
});

test('native bitmap generation refuses excessive memory allocations',()=>{
 for(const n of [-1,0,16,63,65,513,Infinity,NaN])
  assert.throws(()=>renderer.makeFighterSurfaceMap(n));
 assert.equal(renderer.makeFighterSurfaceMap(64).data.length,64*64*4);
});

test('microtexture is bound only to selected fighter hulls and controls',()=>{
 assert.match(source,/uSkinMicroTexture/);
 assert.match(source,/gl\.activeTexture\(gl\.TEXTURE1\)/);
 assert.match(source,/gl\.uniform1i\(uni\.uSkinMicroTexture,1\)/);
 assert.match(source,/const finishId=microTexture\?\(\{f22:1,f35:2,typhoon:3,fa18:4,su37:5\}\[id\]\|\|0\):0/);
 assert.match(source,/part\.sourceName\|\|null/);
 assert.match(source,/if\(!part\|\|!part\.sourceName\|\|\(part\.opacity\?\?1\)<\.99\|\|part\.partAxis===4\)/);
 assert.match(source,/gl\.uniform1f\(uni\.uSkinFinish,0\);/);
 assert.match(source,/if\(gl\.getError\(\)===gl\.NO_ERROR\)/);
 assert.match(source,/gl\.uniform1f\(uni\.uSkinFinish,id==="fa18"\?finishId:0\)/);
 assert.match(source,/const fa18Panel=id==="fa18"&&!part\.gearName/);
 assert.match(source,/vColor\.r>\.39&&vColor\.g>\.43&&vColor\.b>\.47/);
});

test('all existing flight-model source components retain their own paint selection',()=>{
 const livery=require('../flight-sim-native-livery.js');
 for(const name of ['Fuselage_2','Left_Wing_0','left-flap_1'])
  assert.ok(livery.skinPart('f22',name));
 for(const name of ['fuselage','tail','flaperonL'])
  assert.ok(livery.skinPart('f35',name));
 for(const name of ['fuselage','wing','flaperon1.L'])
  assert.ok(livery.skinPart('typhoon',name));
 for(const id of ['f22','f35','typhoon'])
  for(const name of ['canopy','noseGear','left-main-wheel','gear:wheel.L'])
   assert.equal(livery.skinPart(id,name),false,id+': '+name);
});
