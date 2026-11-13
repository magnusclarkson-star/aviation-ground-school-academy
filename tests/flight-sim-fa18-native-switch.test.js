'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const renderer=fs.readFileSync(path.join(root,'flight-sim-3d.js'),'utf8');
const page=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
const worker=fs.readFileSync(path.join(root,'flight-sim-sw.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,
 'assets/aircraft/fa18e-native-manifest.json'),'utf8'));

test('licensed import is opt-in and original simulator remains safe',()=>{
 assert.equal(manifest.enabled,false);
 assert.equal(manifest.path,'assets/aircraft/fa18e-native.glb');
 assert.equal(manifest.sourceModelId,'9e852037bf2141dcb3fda17013958131');
 assert.equal(manifest.requireControls,true);
 assert.match(renderer,/function importFA18\(\)/);
 assert.match(renderer,/if\(!model\)\{realFA18Status="fallback";return;\}/);
 assert.match(renderer,/id==="fa18"&&realFA18Status==="loading"/);
 assert.match(renderer,/id==="fa18"\?realFA18/);
 assert.match(renderer,/id==="fa18"&&realModel\?\[\]/);
});
test('imported aircraft overlays no obsolete procedural aircraft',()=>{
 assert.match(renderer,/id==="fa18"\|\|id==="f22"\|\|id==="f35"/);
 assert.match(renderer,/pendingSourceJet\)\{/);
 assert.match(renderer,/sourceJet&&!realModel/);
 assert.match(renderer,/licensed-fa18e-native-glb/);
 assert.match(renderer,/selectedJet==="fa18"\)importFA18\(\)/);
});
test('source gear and flight controls animate through imported primitive path',()=>{
 const pattern=/\(isMolen\|\|isMolenC172\|\|id==="fa18"\|\|id==="f22"/g;
 assert.equal([...renderer.matchAll(pattern)].length,2);
 assert.match(renderer,/model\.primitives\.map\(uploadImported\)/);
 assert.match(renderer,/const images=bitmapList\.map\(bitmap=>\{/);
 assert.match(renderer,/gl\.generateMipmap\(gl\.TEXTURE_2D\)/);
});
test('only published assets are precached; missing GLB is not requested offline',()=>{
 assert.match(page,/flight-sim-fa18-airframe\.js\?v=20261113-native-fa18-source1/);
 assert.ok(page.indexOf('flight-sim-fa18-airframe.js')<
  page.indexOf('flight-sim-3d.js'));
 assert.match(worker,/assets\/aircraft\/fa18e-native-manifest\.json/);
 assert.doesNotMatch(worker,/"assets\/aircraft\/fa18e-native\.glb"/);
 assert.match(worker,/agsa-flight-sim-v2-20261113-native-fa18-source1/);
});
