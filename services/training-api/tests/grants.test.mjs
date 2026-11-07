import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {grantStatements,roleName} from "../src/grants.mjs";
import {createPool} from "../src/postgres.mjs";

test("role SQL uses escaped, distinct identifiers with narrow privileges",()=>{
 assert.equal(roleName("agsa_app"),'"agsa_app"');
 assert.throws(()=>roleName("app;DROP TABLE users;"),/Invalid/);
 assert.throws(()=>roleName("app owner"),/Invalid/);
 assert.throws(()=>grantStatements("duplicate","duplicate"),/differ/);
 const sql=grantStatements("ci_web","ci_bootstrap").join(";\n");
 assert.ok(sql.includes('GRANT INSERT ON public.audit_events TO "ci_web"'));
 assert.ok(!sql.includes('GRANT UPDATE ON public.audit_events'));
 assert.ok(!sql.includes('GRANT DELETE ON public.audit_events'));
 assert.ok(sql.includes('GRANT UPDATE(revoked_at) ON public.sessions'));
 assert.ok(sql.includes('GRANT UPDATE(active) ON public.instructor_assignments TO "ci_bootstrap"'));
 assert.ok(sql.includes('GRANT UPDATE(last_used_step) ON public.instructor_mfa TO "ci_web"'));
 assert.ok(sql.includes('GRANT SELECT,INSERT ON public.instructor_mfa TO "ci_bootstrap"'));
 assert.ok(!sql.includes('GRANT UPDATE(encrypted_secret) ON public.instructor_mfa TO "ci_web"'));
 assert.ok(!sql.includes('GRANT UPDATE(active) ON public.instructor_assignments TO "ci_web"'));
 assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION public.consume_email_challenge(char(64)) TO "ci_web"'));
 assert.ok(sql.includes('GRANT SELECT,INSERT ON public.email_verification_challenges TO "ci_bootstrap"'));
 assert.ok(!sql.includes('GRANT UPDATE(email_verified_at) ON public.users TO "ci_web"'));
 assert.ok(sql.includes('GRANT SELECT,INSERT ON public.ai_daily_usage TO "ci_web"'));
 assert.ok(sql.includes('GRANT UPDATE(request_count) ON public.ai_daily_usage TO "ci_web"'));
});
test("real PostgreSQL denies runtime audit changes, approvals and role escalation",async t=>{
 const uri=process.env.AGSA_TEST_DATABASE_URL;
 if(!uri){t.skip("AGSA_TEST_DATABASE_URL required for isolated database test");return;}
 const target=new URL(uri);
 if(!["127.0.0.1","localhost"].includes(target.hostname)||target.pathname!=="/agsa_training_test")
  throw Error("Refusing to run database privilege tests against any non-local/non-test database");
 const pool=createPool({DATABASE_URL:uri,NODE_ENV:"test",PGSSL_MODE:"disable"});
 const tag=randomUUID().replaceAll("-","").slice(0,9);
 const app="agsa_ci_app_"+tag,provision="agsa_ci_prov_"+tag;
 const client=await pool.connect();
 const checkPrivilege=async(role,table,priv)=>(
   await client.query("SELECT has_table_privilege($1,$2,$3) AS allowed",[role,"public."+table,priv])
 ).rows[0].allowed;
 async function expectDenied(role,query){
  await client.query("BEGIN");
  try{
   await client.query("SET LOCAL ROLE "+roleName(role));
   await assert.rejects(client.query(query),e=>e.code==="42501","role should have insufficient_privilege");
  }finally{await client.query("ROLLBACK")}
 }
 try{
  const status=await client.query("SELECT current_setting('is_superuser') AS privileged");
  assert.equal(status.rows[0].privileged,"on","isolation CI test requires disposable superuser fixture");
  await client.query("CREATE ROLE "+roleName(app)+" NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE");
  await client.query("CREATE ROLE "+roleName(provision)+" NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE");
  await client.query("BEGIN");
  try{for(const sql of grantStatements(app,provision))await client.query(sql);
   await client.query("COMMIT");
  }catch(e){await client.query("ROLLBACK");throw e}
  for(const table of ["practice_attempts","feedback_drafts"]){
   assert.equal(await checkPrivilege(app,table,"SELECT"),true);
   assert.equal(await checkPrivilege(app,table,"INSERT"),true);
   assert.equal(await checkPrivilege(app,table,"UPDATE"),false);
   assert.equal(await checkPrivilege(app,table,"DELETE"),false);
  }
  assert.equal(await checkPrivilege(app,"audit_events","INSERT"),true);
  for(const action of ["SELECT","UPDATE","DELETE"])
   assert.equal(await checkPrivilege(app,"audit_events",action),false);
  assert.equal(await checkPrivilege(provision,"audit_events","INSERT"),true);
  assert.equal(await checkPrivilege(provision,"audit_events","UPDATE"),false);
  assert.equal(await checkPrivilege(app,"instructor_assignments","INSERT"),false);
  assert.equal(await checkPrivilege(app,"instructor_assignments","UPDATE"),false);
  assert.equal(await checkPrivilege(provision,"instructor_assignments","INSERT"),true);
  assert.equal(await checkPrivilege(app,"sessions","DELETE"),false);
  assert.equal(await checkPrivilege(app,"instructor_mfa","SELECT"),true);
  assert.equal(await checkPrivilege(app,"instructor_mfa","INSERT"),false);
  assert.equal(await checkPrivilege(app,"instructor_mfa","DELETE"),false);
  assert.equal(await checkPrivilege(app,"instructor_mfa","UPDATE"),false);
  const mfaCounter=await client.query("SELECT has_column_privilege($1,'public.instructor_mfa','last_used_step','UPDATE') AS allowed",[app]);
  assert.equal(mfaCounter.rows[0].allowed,true);
  const mfaSecret=await client.query("SELECT has_column_privilege($1,'public.instructor_mfa','encrypted_secret','UPDATE') AS allowed",[app]);
  assert.equal(mfaSecret.rows[0].allowed,false);
  await expectDenied(app,"UPDATE public.instructor_mfa SET encrypted_secret='newsecret' WHERE false");
  assert.equal(await checkPrivilege(app,"users","UPDATE"),false);
  assert.equal(await checkPrivilege(app,"ai_daily_usage","SELECT"),true);
  assert.equal(await checkPrivilege(app,"ai_daily_usage","INSERT"),true);
  assert.equal(await checkPrivilege(app,"ai_daily_usage","DELETE"),false);
  assert.equal(await checkPrivilege(app,"ai_daily_usage","UPDATE"),false);
  const aiUsageField=await client.query(
   "SELECT has_column_privilege($1,'public.ai_daily_usage','request_count','UPDATE') AS allowed",[app]);
  assert.equal(aiUsageField.rows[0].allowed,true);
  const aiUserField=await client.query(
   "SELECT has_column_privilege($1,'public.ai_daily_usage','user_id','UPDATE') AS allowed",[app]);
  assert.equal(aiUserField.rows[0].allowed,false);
  await expectDenied(app,"UPDATE public.ai_daily_usage SET user_id=gen_random_uuid() WHERE false");
  assert.equal(await checkPrivilege(app,"email_verification_challenges","SELECT"),false);
  assert.equal(await checkPrivilege(app,"email_verification_challenges","INSERT"),false);
  assert.equal(await checkPrivilege(app,"email_verification_challenges","UPDATE"),false);
  assert.equal(await checkPrivilege(provision,"email_verification_challenges","INSERT"),true);
  assert.equal(await checkPrivilege(provision,"users","UPDATE"),false);
  const verifyGrant=await client.query(
   "SELECT has_function_privilege($1,'public.consume_email_challenge(character(64))','EXECUTE') AS allowed",
   [app]);
  assert.equal(verifyGrant.rows[0].allowed,true);
  await expectDenied(app,"UPDATE public.users SET email_verified_at=now() WHERE false");
  await expectDenied(app,"UPDATE public.email_verification_challenges SET consumed_at=now() WHERE false");
  const column=await client.query("SELECT has_column_privilege($1,'public.sessions','revoked_at','UPDATE') AS allowed",[app]);
  assert.equal(column.rows[0].allowed,true);
  const other=await client.query("SELECT has_column_privilege($1,'public.sessions','user_id','UPDATE') AS allowed",[app]);
  assert.equal(other.rows[0].allowed,false);
  await expectDenied(app,"SELECT * FROM public.audit_events LIMIT 0");
  await expectDenied(app,"UPDATE public.practice_attempts SET source_status='APPROVED' WHERE false");
  await expectDenied(app,"DELETE FROM public.audit_events WHERE false");
  await expectDenied(app,"UPDATE public.memberships SET role='instructor' WHERE false");
  await expectDenied(app,"CREATE TABLE public.ci_unapproved_records (id integer)");
  await expectDenied(provision,"UPDATE public.audit_events SET action='tampered' WHERE false");
  const seq=await client.query("SELECT has_sequence_privilege($1,'public.audit_events_id_seq','USAGE') AS allowed",[app]);
  assert.equal(seq.rows[0].allowed,true);
 }finally{
  await client.query("RESET ROLE").catch(()=>{});
  await client.query("REASSIGN OWNED BY "+roleName(app)+" TO CURRENT_USER").catch(()=>{});
  await client.query("DROP OWNED BY "+roleName(app)).catch(()=>{});
  await client.query("DROP OWNED BY "+roleName(provision)).catch(()=>{});
  await client.query("DROP ROLE IF EXISTS "+roleName(app)).catch(()=>{});
  await client.query("DROP ROLE IF EXISTS "+roleName(provision)).catch(()=>{});
  client.release();
  await pool.end();
 }
});
