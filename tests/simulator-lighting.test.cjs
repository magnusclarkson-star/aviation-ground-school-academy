const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const Lighting=require('../flight-sim-lighting.js');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
test('daylight, warm evening and dusk are static, bounded palettes',()=>{
 assert.deepEqual(Lighting.ids,['day','golden','dusk']);
 assert.equal(Lighting.choose('unknown'),Lighting.choose('day'));
 assert.equal(Lighting.choose('__proto__'),Lighting.choose('day'));
 for(const key of Lighting.ids){
  const p=Lighting.choose(key);
  assert.equal(Object.isFrozen(p),true);
  for(const k of ['skyLow','skyHigh','fog','light']){
   assert.equal(p[k].length,3);
   assert.ok(p[k].every(x=>Number.isFinite(x)&&x>=0&&x<=1.2));
  }
  for(const k of ['sky2d','grass']){
   assert.equal(p[k].length,3);
   assert.ok(p[k].every(x=>/^#[a-fA-F0-9]{6}$/.test(x)));
  }
 }
 assert.notDeepEqual(Lighting.choose('day').skyHigh,Lighting.choose('dusk').skyHigh);
});
test('scenery only changes light, not aircraft physics, instrument panels or haptic controls',()=>{
 const s=read('flight-sim.js'),html=read('flight-sim.html'),canvas=read('flight-sim-scenery.js');
 const webgl=read('flight-sim-3d.js');
 for(const id of ['visualMode','cameraMode','lightingMode','lightingStatus','flightInstruments','controlPad'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(html.includes('src="flight-sim-lighting.js"'));
 for(const val of ['day','golden','dusk'])assert.ok(html.includes('option value="'+val+'"'));
 assert.ok(s.includes('lighting:lightingId()'));
 assert.ok(s.includes('L.choose($("lightingMode").value)'));
 assert.ok(s.includes('S.draw(canvas,state,{reducedMotion:prefersLessMotion,lighting:lightingId(),view:$("cameraMode").value,airframeId:airframeId()})'));
 assert.ok(canvas.includes('sky.addColorStop(0,palette.sky2d[0])'));
 assert.ok(canvas.includes('grass.addColorStop(1,palette.grass[2])'));
 for(const key of ['uSkyLow','uSkyHigh','uFogColor','uLightColor'])
  assert.ok(webgl.includes(key));
 for(const forbidden of ['fetch(', 'localStorage','sessionStorage','navigator.vibrate','XMLHttpRequest'])
  assert.ok(!read('flight-sim-lighting.js').includes(forbidden));
});
