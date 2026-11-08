import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const X=require("../flight-sim-exercises.js");
const W=require("../flight-sim-loading.js");
const D=require("../flight-sim-aerodynamics.js");

assert.equal(X.STATUS,"SME_REVIEW_REQUIRED");
assert.deepEqual(Object.keys(X.DEFINITIONS),["cgTransfer","massIncrease","fuelShift","flapTrade"]);
assert.throws(()=>X.get("invalid"),/Unknown Academy/);
assert.throws(()=>X.values("cgTransfer","wrong"),/Unknown exercise stage/);
assert.throws(()=>X.begin("massIncrease","jet"),/Unknown fictional/);
assert.equal(X.begin().reference,null);
assert.equal(X.begin().comparison,null);

for(const profileId of ["trainer","sport","touring"]){
 for(const def of Object.values(X.DEFINITIONS)){
  const start=X.begin(def.id,profileId);
  assert.equal(start.profileId,profileId);
  assert.equal(start.id,def.id);
  assert.ok(def.question.includes("?"),"each study includes a question");
  assert.ok(def.goal.length>30&&def.rationale.length>60);
  const a=X.values(def.id,"reference",profileId);
  const b=X.values(def.id,"comparison",profileId);
  assert.equal(Object.isFrozen(a),true);
  assert.equal(Object.isFrozen(a.loadout),true);
  assert.deepEqual(a.loadout,def.reference);
  assert.deepEqual(b.loadout,def.comparison);
  assert.equal(a.flaps,def.referenceFlaps);
  assert.equal(b.flaps,def.comparisonFlaps);
  assert.equal(a.totalKg,W.evaluate(profileId,def.reference).totalKg);
  assert.equal(b.totalKg,W.evaluate(profileId,def.comparison).totalKg);
  assert.equal(a.cl,D.coefficients(4,def.referenceFlaps,profileId).cl);
  assert.equal(b.cd,D.coefficients(4,def.comparisonFlaps,profileId).cd);
  assert.equal(a.referenceAngleDeg,4);
  assert.equal(X.observationText(null),"Not observed yet");

  const empty=X.review(start,"aft");
  assert.equal(empty.status,"incomplete","cannot check an unobserved comparison");
  assert.equal(empty.trainingCredit,undefined);
  assert.equal(start.feedback,null,"incomplete attempt is not recorded");
  const premature=X.record(start,"comparison",{
   profileId,loadout:b.loadout,flaps:b.flaps
  });
  assert.equal(premature.ok,false);
  assert.equal(start.comparison,null);

  const tampered=X.record(start,"reference",{
   profileId,loadout:{...a.loadout,fuelKg:a.loadout.fuelKg+1},flaps:a.flaps
  });
  assert.equal(tampered.ok,false);
  assert.equal(start.reference,null);
  const wrongFlaps=X.record(start,"reference",{
   profileId,loadout:a.loadout,flaps:a.flaps===30?0:30
  });
  assert.equal(wrongFlaps.ok,false);
  assert.equal(X.record(start,"reference",{
   profileId,loadout:a.loadout,flaps:a.flaps
  }).ok,true);
  assert.ok(X.observationText(start.reference).includes("CG"));
  assert.equal(start.comparison,null);
  assert.equal(X.review(start,"aft").status,"incomplete");
  assert.equal(X.record(start,"comparison",{
   profileId,loadout:b.loadout,flaps:b.flaps
  }).ok,true);
  assert.ok(X.evidence(start).includes("Comparison − Reference: mass"));
  assert.ok(X.evidence(start).includes("invented CL"));
  assert.ok(X.evidence(start).includes("imaginary MAC"));

  assert.equal(X.review(start,"").status,"choose");
  assert.equal(X.review(start,"unknown-choice").status,"choose");
  const expected=X.expected(def.id,profileId);
  assert.ok(def.options.some(c=>c.id===expected),"numeric expected answer appears in choices");
  const wrong=def.options.find(o=>o.id!==expected);
  const revisit=X.review(start,wrong.id);
  assert.equal(revisit.status,"revisit");
  assert.match(revisit.message,/Model explanation:/);
  assert.equal(revisit.assessed,false);
  assert.equal(revisit.trainingCredit,false);
  assert.equal(revisit.reviewStatus,X.STATUS);
  const matching=X.review(start,expected);
  assert.equal(matching.status,"matches-model");
  assert.equal(matching.trainingCredit,false);
  assert.equal(matching.assessed,false);
  assert.equal(matching.reviewStatus,"SME_REVIEW_REQUIRED");
  assert.equal(start.feedback.status,"matches-model");
  // Reapplying reference destroys old comparison/feedback; no stale pass.
  assert.equal(X.record(start,"reference",{
   profileId,loadout:a.loadout,flaps:a.flaps
  }).ok,true);
  assert.equal(start.comparison,null);
  assert.equal(start.feedback,null);
  assert.equal(X.review(start,expected).status,"incomplete");
 }
}
assert.equal(X.expected("cgTransfer"),"aft");
assert.equal(X.expected("massIncrease"),"higher");
assert.equal(X.expected("fuelShift"),"aft-lighter");
assert.equal(X.expected("flapTrade"),"both");

const cgA=X.values("cgTransfer","reference");
const cgB=X.values("cgTransfer","comparison");
assert.equal(cgA.totalKg,cgB.totalKg);
assert.ok(cgB.momentKgM>cgA.momentKgM);
assert.ok(cgB.cgPercentMAC>cgA.cgPercentMAC);
const massA=X.values("massIncrease","reference");
const massB=X.values("massIncrease","comparison");
assert.ok(massB.totalKg>massA.totalKg);
assert.ok(massB.wingLoadingKgM2>massA.wingLoadingKgM2);
const fuelA=X.values("fuelShift","reference");
const fuelB=X.values("fuelShift","comparison");
assert.equal(fuelA.totalKg-fuelB.totalKg,50);
assert.ok(fuelB.cgPercentMAC>fuelA.cgPercentMAC);
const flapA=X.values("flapTrade","reference");
const flapB=X.values("flapTrade","comparison");
assert.equal(flapA.totalKg,flapB.totalKg);
assert.equal(flapA.cgPercentMAC,flapB.cgPercentMAC);
assert.ok(flapB.cl>flapA.cl);
assert.ok(flapB.cd>flapA.cd);

const snapshot=X.begin("cgTransfer");
assert.equal(X.record(snapshot,"reference",{
 profileId:"sport",loadout:cgA.loadout,flaps:cgA.flaps
}).ok,false,"cannot mix airframe profiles");
assert.equal(X.record(snapshot,"reference",null).ok,false,"invalid observations rejected");
assert.throws(()=>X.record(null,"reference",{}),/session required/);
assert.throws(()=>X.review(null,"aft"),/session required/);

console.log("Conceptual exercises passed: 4 deterministic model-backed comparisons in 3 imaginary airframes, gated observations, stale comparison clearing, rationales and no training-credit/approval claims.");
