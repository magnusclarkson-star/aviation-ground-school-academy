import test from "node:test";
import assert from "node:assert/strict";
import {validatePrice,calculateAward,studentHasAccess,isOwner,financialAccessIsNotAccreditation} from "../fees-policy.mjs";
test("only the accountable manager controls prices and scholarships",()=>{
 assert.equal(isOwner("accountable_manager"),true);
 for(const role of ["student","head_of_training","quality_manager","examiner","instructor",undefined])
  assert.equal(isOwner(role),false);
 assert.deepEqual(validatePrice({countryCode:"SL",currency:"SLE",billingPeriod:"MONTHLY",amountMinor:150000}),
  {countryCode:"SL",currency:"SLE",billingPeriod:"MONTHLY",amountMinor:150000});
 for(const invalid of [
  {countryCode:"si",currency:"SLE",billingPeriod:"MONTHLY",amountMinor:100},
  {countryCode:"SL",currency:"XYZ",billingPeriod:"MONTHLY",amountMinor:100},
  {countryCode:"SL",currency:"SLE",billingPeriod:"WEEKLY",amountMinor:100},
  {countryCode:"SL",currency:"SLE",billingPeriod:"YEARLY",amountMinor:10.5},
  {countryCode:"SL",currency:"SLE",billingPeriod:"YEARLY",amountMinor:-1}
 ])assert.throws(()=>validatePrice(invalid));
});
test("full scholarship or waiver activates access without payment",()=>{
 const full=calculateAward({grossMinor:150000,grantType:"SCHOLARSHIP",discountBps:10000});
 assert.deepEqual({due:full.payableMinor,discount:full.discountMinor,status:full.status},
  {due:0,discount:150000,status:"ACTIVE"});
 assert.equal(calculateAward({grossMinor:150000,grantType:"WAIVER",discountBps:10000}).status,"ACTIVE");
 assert.equal(calculateAward({grossMinor:0,grantType:"FREE",discountBps:10000}).status,"ACTIVE");
 assert.throws(()=>calculateAward({grossMinor:1000,grantType:"FREE",discountBps:10000}));
 assert.throws(()=>calculateAward({grossMinor:150000,grantType:"PAID",discountBps:10000}));
 assert.throws(()=>calculateAward({grossMinor:150000,grantType:"SCHOLARSHIP",discountBps:0}));
});
test("partial scholarship retains exact balance, including half-cent roundings",()=>{
 const grant=calculateAward({grossMinor:150001,grantType:"SCHOLARSHIP",discountBps:6000});
 assert.equal(grant.discountMinor,90001);
 assert.equal(grant.payableMinor,60000);
 assert.equal(grant.status,"PENDING_PAYMENT");
 const simple=calculateAward({grossMinor:150000,grantType:"PROMOTION",discountBps:2500});
 assert.equal(simple.discountMinor,37500);
 assert.equal(simple.payableMinor,112500);
 assert.equal(calculateAward({grossMinor:199,grantType:"SCHOLARSHIP",discountBps:5000}).discountMinor,100);
});
test("expiring, revoked, unpaid and cross-course grants never unlock content",()=>{
 const now=new Date("2026-11-13T12:00:00.000Z");
 const sample={course_id:"ppl-theory",status:"ACTIVE",starts_at:"2026-11-12T10:00:00.000Z",expires_at:"2026-12-13T00:00:00.000Z"};
 assert.equal(studentHasAccess([sample],"ppl-theory",now),true);
 assert.equal(studentHasAccess([sample],"other-course",now),false);
 assert.equal(studentHasAccess([{...sample,status:"PENDING_PAYMENT"}],"ppl-theory",now),false);
 assert.equal(studentHasAccess([{...sample,status:"REVOKED"}],"ppl-theory",now),false);
 assert.equal(studentHasAccess([{...sample,expires_at:"2026-11-13T11:00:00.000Z"}],"ppl-theory",now),false);
 assert.equal(studentHasAccess([{...sample,starts_at:"2026-11-14T00:00:00.000Z"}],"ppl-theory",now),false);
 assert.equal(studentHasAccess([{...sample,expires_at:null}],"ppl-theory",now),true);
 assert.equal(studentHasAccess([],"ppl-theory",now),false);
});
test("financial grants never establish aviation qualifications",()=>{
 const v=financialAccessIsNotAccreditation();
 assert.equal(v.paymentCanGrant,"COURSE_CONTENT_ACCESS_ONLY");
 assert.equal(v.grantsTrainingCredit,false);
 assert.equal(v.grantsPilotLicence,false);
 assert.equal(v.grantsExaminationAuthority,false);
});
