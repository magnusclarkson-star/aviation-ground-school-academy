'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const inspect=fs.readFileSync(path.join(root,'flight-sim-inspection.js'),'utf8');
const sourceNotes=fs.readFileSync(path.join(root,'assets/aircraft/TEXTURED-360-SOURCES.md'),'utf8');

test('approved Cessna and Robinson 360 views cannot be silently swapped for third-party embeds',()=>{
  for(const id of ['c172','r44']){
    assert.doesNotMatch(inspect,new RegExp(id+':\\\\{uid:'),'no external replacement for '+id);
  }
  assert.match(inspect,/id==="c172"\)phase=renderer\.realC172Status/);
  assert.match(inspect,/id==="r44"\)phase=renderer\.realR44Status/);
  assert.match(sourceNotes,/Approved local Academy native model/);
});

test('Eurofighter 360 uses the same source airframe as flight rather than an unrelated hosted model',()=>{
  assert.doesNotMatch(inspect,/typhoon:\{uid:/);
  assert.match(inspect,/"typhoon"\]\.includes\(id\)/);
  assert.match(inspect,/Typhoon · FlightGear 3D/);
  assert.match(sourceNotes,/paired rectangular ventral intakes/);
});

test('switching aircraft clears previous frame and hides canvases until the matching selection draws',()=>{
  assert.match(inspect,/lastRenderedId=null;\s*canvas3D\.hidden=true;\s*canvas2D\.hidden=true;\s*ctx\.clearRect/);
  assert.match(inspect,/const stale=lastRenderedId!==id/);
  assert.match(inspect,/const gpuVisible=usingGPU&&!loading&&!failed&&!stale/);
  assert.match(inspect,/lastRenderedId=id;\s*syncModelVisibility\(\)/);
});

test('hosted Super Hornet exterior does not overwrite its native flight geometry',()=>{
  assert.match(inspect,/fa18:\{uid:"9e852037bf2141dcb3fda17013958131"/);
  assert.match(inspect,/const model=!orbit\.interior\?texturedModels\[selected\(\)\]:null/);
  assert.match(inspect,/if\(syncTexturedViewer\(\)\)/);
  assert.match(sourceNotes,/not.*substituted into the live flight/s);
});
