import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createPool,PgStore} from "../src/postgres.mjs";
import {hashSha256,hashPassword} from "../src/crypto.mjs";
import {validateModuleClaim} from "../src/module-learning.mjs";
import {ClientError} from "../src/validation.mjs";

const uri=process.env.AGSA_TEST_DATABASE_URL;
if(!uri)throw Error("Module recovery integration requires an isolated test DB");
const where=new URL(uri);
if(!["127.0.0.1","localhost"].includes(where.hostname)||where.pathname!=="/agsa_training_test")
 throw Error("Refusing to run module tests outside the disposable localhost test database");

test("module claims are append-only, tenant-scoped and assigned-instructor only",async()=>{
 const pool=createPool({DATABASE_URL:uri,NODE_ENV:"test",PGSSL_MODE:"disable"});
 const db=new PgStore(pool);
 const org1=randomUUID(),org2=randomUUID(),s1=randomUUID(),s2=randomUUID(),
  teacher=randomUUID(),otherTeacher=randomUUID(),outsider=randomUUID();
 const suffix=randomUUID().slice(0,10);
 const users=[s1,s2,teacher,otherTeacher,outsider],orgs=[org1,org2];
 const student={userId:s1,organizationId:org1,role:"student"};
 const second={userId:s2,organizationId:org1,role:"student"};
 const assigned={userId:teacher,organizationId:org1,role:"instructor"};
 const notAssigned={userId:otherTeacher,organizationId:org1,role:"instructor"};
 const anotherOrg={userId:outsider,organizationId:org2,role:"instructor"};
 const make=(id="foundations",correct=5)=>validateModuleClaim({
  schema:"agsa.private.module-practice-claim.v1",moduleId:id,revision:"2026-11-08.1",correct,total:6});
 try{
  const pw=await hashPassword("synthetic-database-test-password-2026");
  await pool.query("INSERT INTO organizations(id,slug,legal_name,country_code) VALUES($1,$3,'Fictional Module Org One','SL'),($2,$4,'Fictional Module Org Two','SL')",
   [org1,org2,"module-one-"+suffix,"module-two-"+suffix]);
  for(const [i,user] of users.entries())
   await pool.query("INSERT INTO users(id,email,password_hash,email_verified_at) VALUES($1,$2,$3,now())",
    [user,"module-"+suffix+"-"+i+"@example.org",pw]);
  for(const [user,org,role] of [
   [s1,org1,"student"],[s2,org1,"student"],[teacher,org1,"instructor"],
   [otherTeacher,org1,"instructor"],[outsider,org2,"instructor"]
  ])await pool.query("INSERT INTO memberships(user_id,organization_id,role) VALUES($1,$2,$3)",[user,org,role]);

  const initial=make(),digest=hashSha256(JSON.stringify(initial)),key="module_test_first_001";
  const [a,b]=await Promise.all([db.createModuleClaim(student,key,digest,initial),db.createModuleClaim(student,key,digest,initial)]);
  assert.equal(Number(a.created)+Number(b.created),1,"concurrent replay should create exactly one row");
  assert.equal(a.id,b.id);
  assert.equal(a.conflict,false);
  assert.equal(b.conflict,false);
  const conflict=await db.createModuleClaim(student,key,hashSha256("tampered"),make("foundations",1));
  assert.equal(conflict.conflict,true);
  assert.equal((await db.listOwnModuleClaims(student,20)).length,1);
  assert.equal((await db.listOwnModuleClaims(second,20)).length,0);
  assert.equal((await db.listAssignedModuleClaims(assigned,20)).length,0);
  assert.equal((await db.listAssignedModuleClaims(notAssigned,20)).length,0);
  assert.equal((await db.listAssignedModuleClaims(anotherOrg,20)).length,0);

  await pool.query("INSERT INTO instructor_assignments(organization_id,instructor_id,student_id) VALUES($1,$2,$3)",
   [org1,teacher,s1]);
  const allowed=await db.listAssignedModuleClaims(assigned,20);
  assert.equal(allowed.length,1);
  assert.equal(allowed[0].studentId,s1);
  assert.equal(allowed[0].claimedCorrect,5);
  assert.equal(allowed[0].sourceStatus,"UNVERIFIED_CLIENT_SELF_CHECK");
  assert.equal((await db.listAssignedModuleClaims(notAssigned,20)).length,0);
  assert.equal((await db.listAssignedModuleClaims(anotherOrg,20)).length,0);
  assert.ok(!("email" in allowed[0]));
  assert.ok(!("answers" in allowed[0]));

  const secondSubmission=await db.createModuleClaim(second,key,hashSha256(JSON.stringify(make("cockpit",2))),make("cockpit",2));
  assert.equal(secondSubmission.created,true,"the same idempotency key can be used by a different student");
  assert.equal((await db.listOwnModuleClaims(student,20)).length,1);
  assert.equal((await db.listOwnModuleClaims(second,20)).length,1);

  await pool.query("UPDATE instructor_assignments SET active=false WHERE organization_id=$1 AND instructor_id=$2 AND student_id=$3",
   [org1,teacher,s1]);
  assert.equal((await db.listAssignedModuleClaims(assigned,20)).length,0,"assignment revocation removes access");
  await pool.query("UPDATE instructor_assignments SET active=true WHERE organization_id=$1 AND instructor_id=$2 AND student_id=$3",
   [org1,teacher,s1]);
  await pool.query("UPDATE memberships SET status='suspended' WHERE organization_id=$1 AND user_id=$2",[org1,s1]);
  assert.equal((await db.listAssignedModuleClaims(assigned,20)).length,0,"student suspension removes access");
  await assert.rejects(db.createModuleClaim(student,"suspended_claim_1234",digest,initial),
   e=>e instanceof ClientError&&e.status===403);
  await pool.query("UPDATE memberships SET status='active' WHERE organization_id=$1 AND user_id=$2",[org1,s1]);

  await assert.rejects(pool.query("UPDATE module_practice_claims SET source_status='APPROVED' WHERE id=$1",[a.id]),
   /source_status|check constraint/i,"database must reject forged approved status");
  await assert.rejects(pool.query("UPDATE module_practice_claims SET flight_credit=true WHERE id=$1",[a.id]),
   /flight_credit|check constraint/i,"flight credit must never become true");

  // The first insert already consumed one of 24 daily slots; a different
  // student's submissions do not count toward this actor's limit.
  for(let i=1;i<24;i++){
   const claim=make(i%2?"cockpit":"awareness",i%7);
   await db.createModuleClaim(student,"module_test_limit_"+String(i).padStart(3,"0"),
    hashSha256(JSON.stringify(claim)),claim);
  }
  assert.equal((await db.listOwnModuleClaims(student,50)).length,24);
  await assert.rejects(db.createModuleClaim(student,"module_test_limit_025",digest,initial),
   e=>e instanceof ClientError&&e.status===429&&e.code==="module_daily_limit");
  const old=await db.createModuleClaim(student,key,digest,initial);
  assert.equal(old.created,false,"safe retries remain valid even at the daily limit");

  const counts=await pool.query(`
   SELECT COUNT(*)::integer AS total FROM audit_events
   WHERE organization_id=$1 AND action='module.self_check.import'`,[org1]);
  assert.equal(counts.rows[0].total,25,"one audit event per inserted module claim only");
 }finally{
  try{
   await pool.query("DELETE FROM audit_events WHERE organization_id = ANY($1::uuid[]) OR actor_user_id=ANY($2::uuid[])",[orgs,users]);
   await pool.query("DELETE FROM module_practice_claims WHERE organization_id=ANY($1::uuid[])",[orgs]);
   await pool.query("DELETE FROM instructor_assignments WHERE organization_id=ANY($1::uuid[])",[orgs]);
   await pool.query("DELETE FROM memberships WHERE organization_id=ANY($1::uuid[])",[orgs]);
   await pool.query("DELETE FROM users WHERE id=ANY($1::uuid[])",[users]);
   await pool.query("DELETE FROM organizations WHERE id=ANY($1::uuid[])",[orgs]);
  }finally{await pool.end()}
 }
});
