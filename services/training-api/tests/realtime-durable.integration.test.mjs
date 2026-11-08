import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createPool} from "../src/postgres.mjs";
import {hashPassword} from "../src/crypto.mjs";
import {DurableRealtimeCallRegistry} from "../src/realtime-durable.mjs";

const url=process.env.AGSA_TEST_DATABASE_URL;
if(!url)throw Error("AGSA_TEST_DATABASE_URL is required for the isolated PostgreSQL integration test");
const target=new URL(url);
if(!["127.0.0.1","localhost"].includes(target.hostname)||target.pathname!=="/agsa_training_test")
 throw Error("Refusing durable voice tests outside the isolated localhost/agsa_training_test database");

test("Postgres voice registry recovers from process crashes, races and provider retries",async()=>{
 const pool=createPool({DATABASE_URL:url,NODE_ENV:"test",PGSSL_MODE:"disable"});
 const org=randomUUID(),user=randomUUID(),second=randomUUID();
 const a={organizationId:org,userId:user,role:"student"};
 const other={organizationId:org,userId:second,role:"instructor"};
 const env={OPENAI_API_KEY:"TEST_ONLY_NO_EXTERNAL_VOICE_CALL"};
 const calls=[];
 let failureCount=1;
 const request=async url=>{
  calls.push(url);
  return new Response("",{status:failureCount-->0?503:200});
 };
 const first=new DurableRealtimeCallRegistry({pool,env,request,maxSeconds:120,instanceId:randomUUID()});
 const afterRestart=new DurableRealtimeCallRegistry({pool,env,request,maxSeconds:120,instanceId:randomUUID()});
 const pw=await hashPassword("synthetic-test-only-passphrase-2026");
 try{
  await pool.query("INSERT INTO organizations(id,slug,legal_name,country_code) VALUES($1,$2,'Fictional Voice Test Org','SL')",[org,"voice-test-"+org.slice(0,10)]);
  for(const [id,index] of [[user,1],[second,2]]){
   await pool.query("INSERT INTO users(id,email,password_hash,email_verified_at) VALUES($1,$2,$3,now())",
    [id,"voice-test-"+org.slice(0,10)+"-"+index+"@example.org",pw]);
  }
  await pool.query("INSERT INTO memberships(organization_id,user_id,role) VALUES($1,$2,'student'),($1,$3,'instructor')",[org,user,second]);
  const competing=await Promise.allSettled([first.reserve(a),afterRestart.reserve(a)]);
  assert.equal(competing.filter(x=>x.status==="fulfilled").length,1,
   "concurrent reserve is unique even across API replicas");
  assert.equal(competing.filter(x=>x.status==="rejected"&&x.reason.status===409).length,1);
  const initial=competing.find(x=>x.status==="fulfilled").value;
  assert.equal(await first.abandon(initial),true,"only a pre-provider reservation can be safely abandoned");

  const handle=await first.reserve(a);
  await first.associate(handle,"rtc_durable_success_001");
  await first.activate(handle,"rtc_durable_success_001");
  await assert.rejects(afterRestart.stop(handle,other),e=>e.status===403);
  assert.equal((await pool.query("SELECT state FROM realtime_voice_calls WHERE handle=$1",[handle])).rows[0].state,"active");
  await pool.query("UPDATE realtime_voice_calls SET expires_at=now()-interval '1 second' WHERE handle=$1",[handle]);
  await Promise.all([first.sweep(),afterRestart.sweep()]);
  assert.equal(calls.length,1,"one worker claims an expired provider call");
  let row=(await pool.query("SELECT state,attempt_count,last_error_code FROM realtime_voice_calls WHERE handle=$1",[handle])).rows[0];
  assert.equal(row.state,"ending","a failed provider hangup remains retryable");
  assert.equal(row.last_error_code,"provider_hangup_unconfirmed");
  assert.equal(row.attempt_count,1);
  await pool.query("UPDATE realtime_voice_calls SET next_attempt_at=now()-interval '1 second' WHERE handle=$1",[handle]);
  await afterRestart.sweep();
  row=(await pool.query("SELECT state,attempt_count,resolved_at FROM realtime_voice_calls WHERE handle=$1",[handle])).rows[0];
  assert.equal(row.state,"closed");
  assert.equal(row.attempt_count,2);
  assert.ok(row.resolved_at);
  assert.equal(calls.length,2);
  assert.equal(await first.stop(handle,a),false);

  const late=await first.reserve(a);
  await pool.query("UPDATE realtime_voice_calls SET expires_at=now()-interval '1 second' WHERE handle=$1",[late]);
  await afterRestart.sweep();
  assert.equal((await pool.query("SELECT state FROM realtime_voice_calls WHERE handle=$1",[late])).rows[0].state,"uncertain");
  await assert.rejects(first.reserve(a),e=>e.status===409,"unreconciled negotiation blocks fresh billable calls");
  await assert.rejects(first.associate(late,"rtc_late_provider_001"),/cancelled or expired/);
  await afterRestart.sweep();
  assert.equal((await pool.query("SELECT state FROM realtime_voice_calls WHERE handle=$1",[late])).rows[0].state,"closed",
   "late provider ID can still be durably hung up");

  const pending=await first.reserve(a);
  await pool.query("UPDATE realtime_voice_calls SET expires_at=now()-interval '1 second' WHERE handle=$1",[pending]);
  await afterRestart.sweep();
  assert.equal((await pool.query("SELECT state,provider_call_id FROM realtime_voice_calls WHERE handle=$1",[pending])).rows[0].state,"uncertain");
  assert.equal(await afterRestart.stop(pending,a),true);
  assert.equal((await pool.query("SELECT state FROM realtime_voice_calls WHERE handle=$1",[pending])).rows[0].state,"uncertain",
   "unknown provider calls must never be falsely marked resolved");
  await assert.rejects(first.reserve(a),e=>e.status===409);

  const otherHandle=await first.reserve(other);
  await first.associate(otherHandle,"rtc_separate_actor_001");
  await first.activate(otherHandle,"rtc_separate_actor_001");
  assert.equal(await afterRestart.stopForActor(other),true);
  assert.equal((await pool.query("SELECT state FROM realtime_voice_calls WHERE handle=$1",[otherHandle])).rows[0].state,"closed");
  assert.equal(await first.stop(otherHandle,other),false);
  assert.ok(calls.every(x=>x.startsWith("https://api.openai.com/v1/realtime/calls/")&&x.endsWith("/hangup")));
 }finally{
  try{
   // A test-only UNKNOWN row must not be silently released by application
   // code; isolated test DB cleanup is a distinct, explicit operator action.
   await pool.query("DELETE FROM realtime_voice_calls WHERE organization_id=$1",[org]);
   await pool.query("DELETE FROM memberships WHERE organization_id=$1",[org]);
   await pool.query("DELETE FROM users WHERE id=ANY($1::uuid[])",[[user,second]]);
   await pool.query("DELETE FROM organizations WHERE id=$1",[org]);
  }finally{await pool.end()}
 }
});
