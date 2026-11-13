'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {Mesh}=require('../flight-sim-3d.js');
const {populate,buildJetParts}=require('../flight-sim-airframe-geometry.js');
const source=fs.readFileSync(path.join(__dirname,'../flight-sim-airframe-geometry.js'),'utf8');

test('Super Hornet exterior has one continuous detailed geometry hull',()=>{
 const mesh=new Mesh();
 assert.equal(populate(mesh,'fa18'),'fa18');
 const out=mesh.finish();
 // Preserve a small Android geometry budget while materially increasing
 // canopy, LEX, intake and exhaust detail over the earlier 820-triangle jet.
 assert.ok(out.triangles>=1400&&out.triangles<=2600);
 assert.ok(Array.from(out.positions).every(Number.isFinite));
 assert.ok(Array.from(out.colors).every(x=>Number.isFinite(x)&&x>=0&&x<=1));
 let minZ=Infinity,maxZ=-Infinity,minX=Infinity,maxX=-Infinity;
 for(let i=0;i<out.positions.length;i+=3){
  minX=Math.min(minX,out.positions[i]);
  maxX=Math.max(maxX,out.positions[i]);
  minZ=Math.min(minZ,out.positions[i+2]);
  maxZ=Math.max(maxZ,out.positions[i+2]);
 }
 assert.ok(minZ< -7.5 && maxZ>8,'single correctly oriented hull and nose');
 assert.ok(minX < -7 && maxX>7,'two symmetric wings');
});

test('Animated aircraft controls and retractable undercarriage remain a single set',()=>{
 const parts=buildJetParts(Mesh,'fa18');
 const names=parts.map(p=>p.name);
 for(const name of ['leftAileron','rightAileron','leftFlap','rightFlap',
    'elevatorLeft','elevatorRight','rudderLeft','rudderRight',
    'noseGear','mainGearLeft','mainGearRight']){
  assert.equal(names.filter(x=>x===name).length,1,name);
 }
 for(const part of parts)assert.ok(Array.from(part.mesh.positions).every(Number.isFinite));
});

test('New details do not reintroduce the obsolete generic fighter',()=>{
 assert.match(source,/else if\(id==="fa18"\)addFA18\(mesh\)/);
 assert.match(source,/function addFA18\(m\)/);
 assert.match(source,/aft canopy frame/i);
 assert.match(source,/low-profile wing root/i);
 assert.match(source,/exhaustZ=-5\.74-1\.64/);
 assert.doesNotMatch(source,/genericJet\(mesh,"fa18"\)/);
});
