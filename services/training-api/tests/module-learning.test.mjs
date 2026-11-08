import test from "node:test";
import assert from "node:assert/strict";
import {validateModuleClaim,MODULE_ASSESSMENT_REVISION,MODULE_SOURCE_STATUS,MODULE_CLAIM_DAILY_LIMIT} from "../src/module-learning.mjs";
import {ClientError} from "../src/validation.mjs";

const payload={schema:"agsa.private.module-practice-claim.v1",moduleId:"foundations",
 revision:"2026-11-08.1",correct:5,total:6};
test("strict module claim validator rejects forged or impossible official-training data",()=>{
 assert.equal(MODULE_ASSESSMENT_REVISION,"2026-11-08.1");
 assert.equal(MODULE_SOURCE_STATUS,"UNVERIFIED_CLIENT_SELF_CHECK");
 assert.equal(MODULE_CLAIM_DAILY_LIMIT,24);
 const result=validateModuleClaim(payload);
 assert.deepEqual(result,{moduleId:"foundations",revision:"2026-11-08.1",correct:5,total:6,
  sourceStatus:"UNVERIFIED_CLIENT_SELF_CHECK",flightCredit:false,certificateEligible:false});
 assert.equal(validateModuleClaim({...payload,correct:0}).correct,0);
 assert.equal(validateModuleClaim({...payload,correct:6}).correct,6);
 for(const id of ["foundations","cockpit","operations","awareness"])
  assert.equal(validateModuleClaim({...payload,moduleId:id}).moduleId,id);
 for(const bad of [
  null,{},[],{...payload,moduleId:"unknown"},{...payload,revision:"2026-11-08.0"},
  {...payload,total:5},{...payload,total:"6"},{...payload,correct:7},
  {...payload,correct:-1},{...payload,correct:2.5},{...payload,correct:"6"},
  {...payload,studentId:"spoofed"},{...payload,organizationId:"other"},
  {...payload,certificateEligible:true},{...payload,flightCredit:true},
  {...payload,approved:true},{...payload,score:100},
  {...payload,schema:"agsa.local-module-checkpoints.v1"}
 ]){
  assert.throws(()=>validateModuleClaim(bad),error=>
   error instanceof ClientError&&error.status===400&&error.code==="invalid_module_claim");
 }
 assert.ok(!JSON.stringify(result).includes("spoofed"));
});
