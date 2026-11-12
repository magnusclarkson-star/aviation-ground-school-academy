'use strict';
// Regression: the Hornet's animated parts must be fitted to its own airframe,
// not carried over from the old shared fighter mesh.
const test=require('node:test');
const assert=require('node:assert/strict');
const {Mesh}=require('../flight-sim-3d.js');
const aircraft=require('../flight-sim-airframe-geometry.js');

test('F/A-18 uses a complete dedicated exterior mesh',()=>{
 const m=new Mesh();
 assert.equal(aircraft.populate(m,'fa18'),'fa18');
 const exterior=m.finish();
 assert.ok(exterior.triangles>700);
 assert.ok(exterior.positions.length>2000);
 assert.ok(Array.from(exterior.positions).every(Number.isFinite));
});

test('F/A-18 movable surfaces are mirrored and remain within their wings and tail',()=>{
 const parts=aircraft.buildJetParts(Mesh,'fa18');
 const names=['leftAileron','rightAileron','leftFlap','rightFlap',
  'elevatorLeft','elevatorRight','rudderLeft','rudderRight'];
 const xRange=name=>{
  const part=parts.find(p=>p.name===name);
  assert.ok(part,'missing '+name);
  const xs=[];
  for(let i=0;i<part.mesh.positions.length;i+=3)
   xs.push(part.mesh.positions[i]);
  return [Math.min(...xs),Math.max(...xs)];
 };
 for(const name of names)assert.ok(xRange(name)[0]!==xRange(name)[1],name);
 for(const name of ['Aileron','Flap']){
  assert.ok(xRange('left'+name)[1]<0);
  assert.ok(xRange('right'+name)[0]>0);
 }
 for(const name of ['elevator','rudder']){
  assert.ok(xRange(name+'Left')[1]<0);
  assert.ok(xRange(name+'Right')[0]>0);
 }
 assert.equal(parts.filter(p=>p.name==='noseGear').length,1);
 assert.equal(parts.filter(p=>p.name==='mainGearLeft').length,1);
 assert.equal(parts.filter(p=>p.name==='mainGearRight').length,1);
});
