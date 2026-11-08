import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const W=require("../flight-sim-loading.js");
const M=require("../flight-sim-model.js");
const D=require("../flight-sim-aerodynamics.js");
const G=require("../flight-sim-guidance.js");
const near=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<=eps,`Expected ${a} near ${b}`);
const advance=(s,input,n=10)=>{for(let i=0;i<n;i++)M.step(s,input,.05);return s};
const keys=["pilotKg","passengerKg","baggageKg","fuelKg"];

assert.deepEqual(W.validate(),W.DEFAULT);
assert.deepEqual(W.validate({...W.DEFAULT}),W.DEFAULT);
for(const key of keys){
 assert.equal(typeof W.RULES[key].arm,"number");
 assert.ok(W.RULES[key].max>=W.RULES[key].min);
}
assert.deepEqual(Object.keys(W.RULES),keys);
assert.throws(()=>W.validate(null),/object/);
assert.throws(()=>W.validate([]),/object/);
assert.throws(()=>W.validate({...W.DEFAULT,secret:1}),/Unknown/);
assert.throws(()=>W.validate({...W.DEFAULT,pilotKg:"80"}),/whole-kilogram/);
assert.throws(()=>W.validate({...W.DEFAULT,pilotKg:81}),/whole-kilogram/);
assert.throws(()=>W.validate({...W.DEFAULT,passengerKg:-5}),/whole-kilogram/);
assert.throws(()=>W.validate({...W.DEFAULT,fuelKg:10}),/whole-kilogram/);
assert.throws(()=>W.validate({...W.DEFAULT,baggageKg:Infinity}),/whole-kilogram/);
assert.throws(()=>W.evaluate("737"),/Unknown fictional/);

for(const [name,nominal] of [["trainer",840],["sport",700],["touring",1170]]){
 const result=W.evaluate(name);
 assert.equal(result.totalKg,nominal,"default mass must match prior invented physics");
 assert.equal(result.stations.length,5);
 near(result.stations.reduce((a,s)=>a+s.massKg,0),result.totalKg);
 near(result.stations.reduce((a,s)=>a+s.massKg*s.armM,0),result.momentKgM);
 near(result.cgArmM,result.momentKgM/result.totalKg);
 near(result.cgPercentMAC,100*(result.cgArmM-W.MAC.leadingM)/W.MAC.lengthM);
 assert.equal(result.withinFictionalBand,true);
 assert.match(result.balanceLabel,/Inside the imaginary/);
 assert.match(result.disclaimer,/NOT AIRCRAFT LIMITS/);
 assert.ok(result.pitchAuthority>.75&&result.pitchAuthority<1.35);
 assert.ok(result.wingLoadingKgM2>35);
 assert.equal(Object.isFrozen(result.loadout),true);
}

const balanced=W.evaluate("trainer");
const rear=W.evaluate("trainer",{...W.DEFAULT,passengerKg:125,baggageKg:70,fuelKg:15,pilotKg:45});
assert.ok(rear.cgPercentMAC>W.MAC.maxPercent,"rear payload should move CG outside imaginary comparison band");
assert.equal(rear.withinFictionalBand,false);
assert.match(rear.balanceLabel,/Aft of/);
const heavy=W.evaluate("trainer",{pilotKg:120,passengerKg:130,baggageKg:80,fuelKg:90});
assert.ok(heavy.totalKg>heavy.maxIllustrativeKg);
assert.equal(heavy.withinFictionalBand,false);
assert.match(heavy.balanceLabel,/Above/);
assert.ok(heavy.wingLoadingKgM2>balanced.wingLoadingKgM2);
assert.ok(rear.pitchAuthority>balanced.pitchAuthority);
const original=W.DEFAULT.pilotKg;
const copy={...W.DEFAULT,pilotKg:95};
const copyResult=W.evaluate("trainer",copy);copy.pilotKg=100;
assert.equal(copyResult.loadout.pilotKg,95,"input mutation cannot affect evaluated loadout");
assert.equal(W.DEFAULT.pilotKg,original);

const aLoad={pilotKg:80,passengerKg:70,baggageKg:0,fuelKg:75};
const bLoad={pilotKg:80,passengerKg:30,baggageKg:40,fuelKg:75};
const a=W.evaluate("trainer",aLoad),b=W.evaluate("trainer",bLoad);
assert.equal(a.totalKg,b.totalKg,"equal mass shifted aft changes CG without changing total mass");
assert.ok(b.cgPercentMAC>a.cgPercentMAC);
assert.ok(b.pitchAuthority>a.pitchAuthority);

const classic=M.makeState("airplane","approach",{physicsId:"classic",loadout:bLoad});
assert.equal(classic.physicsId,"classic");
assert.equal(classic.loading,undefined,"classic physics must ignore experimental loading");
const classInput=M.makeInput();classInput.pitch=-.55;
const unchanged=M.makeState("airplane","approach");
advance(classic,classInput);advance(unchanged,classInput);
assert.deepEqual(classic,unchanged,"classic trajectory is unchanged by loadout option");

const rotor=M.makeState("helicopter","runway",{physicsId:"aero",loadout:bLoad});
assert.equal(rotor.physicsId,"classic");
assert.equal(rotor.loading,undefined,"conceptual rotorcraft cannot acquire airplane station data");

const fore=M.makeState("airplane","approach",{physicsId:"aero",loadout:aLoad});
const aft=M.makeState("airplane","approach",{physicsId:"aero",loadout:bLoad});
const simInput=M.makeInput();simInput.pitch=-.68;simInput.throttle=.58;simInput.flaps=20;
advance(fore,simInput,12);advance(aft,simInput,12);
assert.ok(aft.pitchDeg>fore.pitchDeg,"aft CG changes invented pitch sensitivity");
near(aft.loading.totalKg,fore.loading.totalKg);
assert.equal(aft.loading.cgPercentMAC>b.cgPercentMAC-1e-6,true);
assert.ok(Number.isFinite(aft.speedKt)&&Number.isFinite(fore.speedKt));

const standard=M.makeState("airplane","approach",{physicsId:"aero"});
const loaded=M.makeState("airplane","approach",{physicsId:"aero",loadout:{
 pilotKg:120,passengerKg:130,baggageKg:80,fuelKg:90
}});
const trim=M.makeInput();trim.pitch=.15;trim.throttle=.5;trim.flaps=20;
near(D.sample(standard,trim).massKg,840);
near(D.sample(loaded,trim).massKg,1070);
assert.ok(D.sample(loaded,trim).loadFactor<D.sample(standard,trim).loadFactor,
 "same synthetic lift supports lower normalized loading at heavier mass");
advance(standard,trim,15);advance(loaded,trim,15);
assert.notEqual(standard.verticalMs,loaded.verticalMs);
assert.equal(D.indications(loaded).massKg,1070);
assert.equal(D.indications(loaded).withinFictionalBand,false);
assert.match(D.indications(loaded).balanceLabel,/Above/);
assert.ok(Number.isFinite(D.indications(loaded).cgPercentMAC));
assert.ok(Number.isFinite(D.indications(loaded).energy));

const invalid={pilotKg:100,passengerKg:0,baggageKg:5,fuelKg:14};
assert.throws(()=>M.makeState("airplane","runway",{physicsId:"aero",loadout:invalid}),/whole-kilogram/);
assert.throws(()=>M.makeState("airplane","runway",{physicsId:"aero",loadout:"invalid"}),/object/);

console.log("Weight-and-balance model passed: 3 invented profiles, moments and %MAC, station validation, aft/mass cautions, mass-dependent lift/acceleration, CG pitch response and unchanged Classic/rotorcraft.");
