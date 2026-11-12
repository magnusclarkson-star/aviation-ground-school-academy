'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
const js=fs.readFileSync(path.join(root,'flight-sim-inspection.js'),'utf8');
const css=fs.readFileSync(path.join(root,'flight-sim-inspection.css'),'utf8');

test('Super Hornet licensed external model is sourced and credited',()=>{
 assert.match(html,/id="aircraftInspectSuperHornet"/);
 assert.match(html,/id="aircraftInspectSuperHornetFrame"/);
 assert.match(html,/KOG_THORNS/);
 assert.match(html,/sketchfab\.com\/3d-models\/boeing-fa-18e-super-hornet-9e852037bf2141dcb3fda17013958131/);
 assert.match(js,/sketchfab\.com\/models\/9e852037bf2141dcb3fda17013958131\/embed/);
});
test('viewer is used only for F-A-18E exterior and not the interior or flight scene',()=>{
 assert.match(js,/selected\(\)==="fa18"&&!orbit\.interior/);
 assert.match(js,/hornetViewer\.hidden=!active/);
 assert.match(js,/hornetFrame\.removeAttribute\("src"\)/);
 assert.match(css,/\.aircraft-inspect-superhornet\[hidden\]/);
});
