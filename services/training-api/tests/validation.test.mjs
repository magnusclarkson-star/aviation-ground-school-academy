import test from "node:test";
import assert from "node:assert/strict";
import {hashPassword,verifyPassword,hashSha256,generateSecret,normalizeEmail,secureEquals} from "../src/crypto.mjs";
import {validateAttempt,validateDraft,validateIdempotencyKey,ClientError} from "../src/validation.mjs";

function originalReport(){
 return {
  schema:"agsa.practice-observation.v1",
  createdAt:"2026-11-07T20:15:00.000Z",
  task:{id:"turn",title:"Controlled bank and turn",exampleTarget:"Fictional teaching threshold"},
  observation:{samples:120,matchedSamples:91,matchedPercent:76,observedSeconds:12,outcome:"PRACTICE_TARGET_MET"},
  userId:"SHOULD_NOT_PERSIST",privateNotes:"Do not keep this PII",
  finalIllustrativeIndications:{pitchDeg:2,bankDeg:15}
 };
}
test("memory-hard salted hashes verify and differ per user",async()=>{
 const a=await hashPassword("long-passphrase-123!");
 const b=await hashPassword("long-passphrase-123!");
 assert.notEqual(a,b);
 assert.equal(await verifyPassword("long-passphrase-123!",a),true);
 assert.equal(await verifyPassword("wrong-passphrase",a),false);
 assert.equal(await verifyPassword("something","invalid-format"),false);
 assert.throws(()=>normalizeEmail("invalid"),/Invalid email/);
 assert.equal(normalizeEmail("  PERSON@EXAMPLE.ORG "),"person@example.org");
 await assert.rejects(hashPassword("short"),/12/);
});
test("opaque random tokens and timing-safe equality",()=>{
 const a=generateSecret(),b=generateSecret();
 assert.match(a,/^[A-Za-z0-9_-]{43}$/);
 assert.notEqual(a,b);
 assert.equal(hashSha256(a).length,64);
 assert.equal(secureEquals(a,a),true);
 assert.equal(secureEquals(a,b),false);
 assert.equal(secureEquals(a,a+"x"),false);
});
test("browser report is stored as strict unverified allowlist",()=>{
 const x=validateAttempt(originalReport());
 assert.equal(x.taskId,"turn");
 assert.equal(x.flightCredit,false);
 assert.equal(x.certificateEligible,false);
 assert.equal(x.observations.matchedPercent,76);
 assert.equal(JSON.stringify(x).includes("SHOULD_NOT_PERSIST"),false);
 assert.equal(JSON.stringify(x).includes("Do not keep"),false);
 assert.match(x.provenance,/USER_EDITABLE/);
 assert.ok(!Object.hasOwn(x,"userId"));
});
test("fake or inconsistent scores and bad schemas are rejected",()=>{
 const base=originalReport();
 assert.throws(()=>validateAttempt({...base,schema:"random"}),ClientError);
 assert.throws(()=>validateAttempt({...base,observation:{...base.observation,matchedSamples:200}}),/figures/);
 assert.throws(()=>validateAttempt({...base,observation:{...base.observation,matchedPercent:5}}),/Score/);
 assert.throws(()=>validateAttempt({...base,observation:{...base.observation,matchedSamples:12,matchedPercent:10,outcome:"PRACTICE_TARGET_MET"}}),/Inconsistent/);
 assert.throws(()=>validateAttempt({...base,createdAt:"garbage"}),/timestamp/);
 assert.throws(()=>validateIdempotencyKey("bad key"),ClientError);
 assert.equal(validateIdempotencyKey("submission_123456"),"submission_123456");
});
test("instructor drafts never accept client-issued authority or role",()=>{
 const draft=validateDraft({
  attemptId:"6c033b66-e174-44ef-9950-e7851dfeb7bc",
  rubric:{instrumentScan:"needs-discussion",controlCoordination:"practice-recommended",riskAwareness:"not-reviewed"},
  comments:"Discuss the simulated horizon",proposedNextAction:"Repeat practice",
  instructorId:"spoofed",signOff:true,approved:true
 });
 assert.ok(!("approved" in draft));
 assert.ok(!("signOff" in draft));
 assert.ok(!("instructorId" in draft));
 assert.throws(()=>validateDraft({...draft,comments:"",proposedNextAction:""}),/Provide valid/);
 assert.throws(()=>validateDraft({...draft,rubric:{...draft.rubric,instrumentScan:"PASS"}}),/rubric/);
 assert.throws(()=>validateDraft({...draft,attemptId:"not-a-uuid"}),/Invalid attempt/);
});
