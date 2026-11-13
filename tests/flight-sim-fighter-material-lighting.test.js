'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const renderer=require('../flight-sim-3d.js');
const source=fs.readFileSync(path.join(__dirname,'../flight-sim-3d.js'),'utf8');
const material=renderer.fighterMaterialFor;

test('canopy, metal and painted fighter panels receive separate lighting',()=>{
 for(const id of ['f22','f35','typhoon','su37','fa18']){
  assert.equal(material(id,'canopy',{opacity:.4}),2,id);
  assert.equal(material(id,'Left_Nozzle_Inner_Sid',{opacity:1}),3,id);
  assert.equal(material(id,'Fuselage_2',{painted:true}),1,id);
  assert.equal(material(id,'wing',{painted:false}),0,id);
 }
});

test('fighter reflectance never applies to trainer and helicopter source parts',()=>{
 for(const id of ['c172','r44',undefined]){
  assert.equal(material(id,'canopy',{opacity:.4}),0);
  assert.equal(material(id,'fuselage',{painted:true}),0);
  assert.equal(material(id,'engine',{painted:true}),0);
 }
});

test('wheels, gear, hatches and cockpit hardware retain original finishes',()=>{
 for(const id of ['f22','f35','typhoon','su37','fa18']){
  for(const name of ['mainGearLeft','right-main-wheel','gear:wheel.F',
     'geardoor2.R','cabin','cockpit','navLight'])
   assert.equal(material(id,name,{painted:true}),0,id+' '+name);
  assert.equal(material(id,'wing',{opacity:.49,painted:true}),0);
  assert.equal(material(id,'wing',{partAxis:4,painted:true}),0);
 }
});

test('native shader uses view-dependent highlights with safe reset and no extra textures',()=>{
 assert.match(source,/out vec3 vWorldPosition;/);
 assert.match(source,/out vec3 vWorldNormal;/);
 assert.match(source,/uniform int uC172Pass,uR44Skin,uFighterMaterial;/);
 assert.match(source,/vec3 viewDir=normalize\(uEye-vWorldPosition\);/);
 assert.match(source,/if\(uFighterMaterial>0\)/);
 assert.match(source,/gl\.uniform1i\(uni\.uFighterMaterial,0\);/);
 assert.match(source,/float painted=uFighterMaterial==4\?/);
 assert.match(source,/gl\.uniform1i\(uni\.uFighterMaterial,fighterMaterialFor\(id,/);
 assert.match(source,/gl\.uniform1i\(uni\.uFighterMaterial,fa18Panel\?4:0\)/);
});
