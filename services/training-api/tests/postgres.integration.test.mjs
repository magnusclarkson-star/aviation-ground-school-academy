import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createPool,PgStore} from "../src/postgres.mjs";
import {hashSha256,generateSecret,hashPassword} from "../src/crypto.mjs";
import {ClientError} from "../src/validation.mjs";
import {encryptTotpSecret,totpAtStep} from "../src/mfa.mjs";

const connection=process.env.AGSA_TEST_DATABASE_URL;
if(!connection)throw Error("AGSA_TEST_DATABASE_URL is required for the isolated PostgreSQL integration suite");
const target=new URL(connection);
if(!["127.0.0.1","localhost"].includes(target.hostname)||target.pathname!=="/agsa_training_test")
 throw Error("Refusing integration tests outside localhost/agsa_training_test");
const pool=createPool({DATABASE_URL:connection,NODE_ENV:"test",PGSSL_MODE:"disable"});
const db=new PgStore(pool);
test("isolated PostgreSQL enforces student scoping and assigned-instructor writes",async t=>{
 const org1=randomUUID(),org2=randomUUID(),
 student1=randomUUID(),student2=randomUUID(),
 teacher1=randomUUID(),teacher2=randomUUID(),outsider=randomUUID();
 const users=[student1,student2,teacher1,teacher2,outsider];
 const orgs=[org1,org2];
 const suffix=randomUUID().slice(0,9);
 const pw=await hashPassword("test-integration-password-only-30");
 try{
  await pool.query(`INSERT INTO organizations(id,slug,legal_name,country_code)
     VALUES($1,$3,'AGSA Fake Training Org One','SL'),($2,$4,'AGSA Fake Training Org Two','SL')`,
    [org1,org2,"test-org-one-"+suffix,"test-org-two-"+suffix]);
  for(const [i,id] of users.entries()){
   await pool.query("INSERT INTO users(id,email,password_hash) VALUES($1,$2,$3)",[id,"staging-"+i+"-"+suffix+"@example.org",pw]);
  }
  for(const [id,org,role] of [[student1,org1,"student"],[student2,org1,"student"],[teacher1,org1,"instructor"],[teacher2,org1,"instructor"],[outsider,org2,"instructor"]]){
   await pool.query("INSERT INTO memberships(user_id,organization_id,role) VALUES($1,$2,$3)",[id,org,role]);
  }
  const mfaKey=Buffer.alloc(32,19);
  const totpSecret="GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  const step=Math.floor(Date.now()/30000),otp=totpAtStep(totpSecret,step);
  assert.equal(await db.consumeInstructorOtp({
   userId:teacher1,organizationId:org1,code:otp,encryptionKey:mfaKey
  }),false,"unenrolled instructor must fail closed");
  await pool.query(`INSERT INTO instructor_mfa(organization_id,instructor_id,encrypted_secret)
    VALUES($1,$2,$3)`,[org1,teacher1,encryptTotpSecret(totpSecret,mfaKey)]);
  assert.equal(await db.consumeInstructorOtp({
   userId:teacher1,organizationId:org2,code:otp,encryptionKey:mfaKey
  }),false,"MFA enrollment is organisation scoped");
  assert.equal(await db.consumeInstructorOtp({
   userId:teacher1,organizationId:org1,code:"999999",encryptionKey:mfaKey
  }),false,"wrong OTP denied");
  const parallel=await Promise.all([
   db.consumeInstructorOtp({userId:teacher1,organizationId:org1,code:otp,encryptionKey:mfaKey}),
   db.consumeInstructorOtp({userId:teacher1,organizationId:org1,code:otp,encryptionKey:mfaKey})
  ]);
  assert.deepEqual(parallel.sort(),[false,true],"simultaneous reuse of one TOTP can only succeed once");
  assert.equal(await db.consumeInstructorOtp({
   userId:teacher1,organizationId:org1,code:otp,encryptionKey:mfaKey
  }),false,"replayed TOTP denied");
  const mfaEvents=await pool.query(`SELECT COUNT(*)::integer AS count FROM audit_events
    WHERE organization_id=$1 AND action='auth.mfa.verify'`,[org1]);
  assert.equal(mfaEvents.rows[0].count,1,"exactly one audit event for consumed code");
  const student={userId:student1,organizationId:org1,role:"student"};
  const otherStudent={userId:student2,organizationId:org1,role:"student"};
  const teacher={userId:teacher1,organizationId:org1,role:"instructor"};
  const otherTeacher={userId:teacher2,organizationId:org1,role:"instructor"};
  const crossOrg={userId:outsider,organizationId:org2,role:"instructor"};
  assert.equal(await db.ping(),true);
  const known=await db.lookupLogin("staging-0-"+suffix+"@example.org","test-org-one-"+suffix);
  assert.equal(known.userId,student1);
  assert.equal(known.role,"student");
  assert.equal(await db.lookupLogin("staging-0-"+suffix+"@example.org","test-org-two-"+suffix),null);
  const sessionToken=hashSha256(generateSecret()),csrfHash=hashSha256(generateSecret());
  await db.createSession({tokenHash:sessionToken,csrfHash,userId:student1,organizationId:org1,
   expiresAt:new Date(Date.now()+3600000).toISOString()});
  const signed=await db.getSession(sessionToken);
  assert.equal(signed.userId,student1);
  assert.equal(signed.csrfHash,csrfHash);

  const report={
   schema:"agsa.api.unverified-practice.v1",taskId:"turn",
   claimedCreatedAt:"2026-11-07T20:00:00.000Z",
   outcome:"PRACTICE_TARGET_MET",
   observations:{samples:120,matchedSamples:90,matchedPercent:75,observedSeconds:12},
   provenance:"USER_EDITABLE_BROWSER_REPORT_NOT_INDEPENDENTLY_VERIFIED",
   flightCredit:false,certificateEligible:false
  };
  const digest=hashSha256(JSON.stringify(report)),key="test_submit_12345";
  const submitted=await db.createAttempt(student,key,digest,report);
  assert.equal(submitted.created,true);
  const prior=await db.createAttempt(student,key,digest,report);
  assert.equal(prior.created,false);
  assert.equal(prior.id,submitted.id);
  const conflict=await db.createAttempt(student,key,hashSha256("different"),report);
  assert.equal(conflict.conflict,true);
  const studentList=await db.listOwnAttempts(student,20);
  assert.equal(studentList.length,1);
  assert.equal(studentList[0].report.flightCredit,false);
  assert.equal((await db.listOwnAttempts(otherStudent,20)).length,0);
  assert.equal((await db.listAssignedAttempts(teacher,20)).length,0);
  assert.equal((await db.listAssignedAttempts(crossOrg,20)).length,0);

  await pool.query("INSERT INTO instructor_assignments(organization_id,instructor_id,student_id) VALUES($1,$2,$3)",[org1,teacher1,student1]);
  assert.equal((await db.listAssignedAttempts(teacher,20)).length,1);
  assert.equal((await db.listAssignedAttempts(otherTeacher,20)).length,0);
  const draft={attemptId:submitted.id,
   rubric:{instrumentScan:"needs-discussion",controlCoordination:"practice-recommended",riskAwareness:"not-reviewed"},
   comments:"Simulation review, not accredited",proposedNextAction:"Retry simulated controlled turn"};
  await assert.rejects(db.createFeedbackDraft(otherTeacher,draft),e=>e instanceof ClientError&&e.status===403);
  await assert.rejects(db.createFeedbackDraft(crossOrg,draft),e=>e instanceof ClientError&&e.status===403);
  const created=await db.createFeedbackDraft(teacher,draft);
  assert.equal(created.status,"UNVERIFIED_DRAFT");
  assert.equal((await db.listOwnFeedback(teacher,20)).length,1);
  assert.equal((await db.listOwnFeedback(otherTeacher,20)).length,0);
  await pool.query("UPDATE instructor_assignments SET active=false WHERE organization_id=$1 AND instructor_id=$2 AND student_id=$3",[org1,teacher1,student1]);
  assert.equal((await db.listAssignedAttempts(teacher,20)).length,0);
  await assert.rejects(db.createFeedbackDraft(teacher,draft),e=>e instanceof ClientError&&e.status===403);
  await pool.query("UPDATE memberships SET status='suspended' WHERE organization_id=$1 AND user_id=$2",[org1,student1]);
  assert.equal(await db.getSession(sessionToken),null,"role revocation also blocks session");
  await pool.query("UPDATE memberships SET status='active' WHERE organization_id=$1 AND user_id=$2",[org1,student1]);
  await db.revokeSession(sessionToken,student);
  assert.equal(await db.getSession(sessionToken),null);
  await assert.rejects(pool.query("UPDATE practice_attempts SET source_status='APPROVED' WHERE id=$1",[submitted.id]),/source_status|check constraint/i);
  const events=await pool.query("SELECT action FROM audit_events WHERE organization_id=$1 ORDER BY occurred_at",[org1]);
  assert.ok(events.rows.some(x=>x.action==="practice.submit"));
  assert.ok(events.rows.some(x=>x.action==="feedback.draft.create"));
  assert.ok(events.rows.some(x=>x.action==="session.logout"));
  const throttleKeys=[hashSha256("rate-ip-"+suffix),hashSha256("rate-user-"+suffix)];
  for(let i=1;i<=8;i++)assert.equal(await db.recordLoginAttempt(throttleKeys),true);
  assert.equal(await db.recordLoginAttempt(throttleKeys),false,"ninth login in 15-minute identity window rate-limited");
 }finally{
  // All data are synthetic; isolate cleanup to identifiers created in this test.
  try{
   await pool.query("DELETE FROM audit_events WHERE organization_id = ANY($1::uuid[])",[orgs]);
   await pool.query("DELETE FROM feedback_drafts WHERE organization_id = ANY($1::uuid[])",[orgs]);
   await pool.query("DELETE FROM practice_attempts WHERE organization_id = ANY($1::uuid[])",[orgs]);
   await pool.query("DELETE FROM sessions WHERE organization_id = ANY($1::uuid[])",[orgs]);
   await pool.query("DELETE FROM instructor_assignments WHERE organization_id = ANY($1::uuid[])",[orgs]);
   await pool.query("DELETE FROM instructor_mfa WHERE organization_id = ANY($1::uuid[])",[orgs]);
   await pool.query("DELETE FROM memberships WHERE organization_id = ANY($1::uuid[])",[orgs]);
   await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])",[users]);
   await pool.query("DELETE FROM organizations WHERE id = ANY($1::uuid[])",[orgs]);
  }finally{await pool.end()}
 }
});
