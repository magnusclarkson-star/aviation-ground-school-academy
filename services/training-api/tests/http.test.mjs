import test from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {randomUUID} from "node:crypto";
import {createHandler} from "../src/http.mjs";
import {hashPassword,hashSha256,generateSecret} from "../src/crypto.mjs";
import {ClientError} from "../src/validation.mjs";
import {totpAtStep,checkTotp} from "../src/mfa.mjs";
const exampleMfaSecret="JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";

const orgA=randomUUID(),orgB=randomUUID();
const studentA=randomUUID(),studentB=randomUUID(),instructorA=randomUUID(),unassignedInstructor=randomUUID(),instructorB=randomUUID();
const validReport=()=>({
 schema:"agsa.practice-observation.v1",
 createdAt:"2026-11-07T20:15:00.000Z",
 task:{id:"level",title:"Straight and level"},
 observation:{samples:120,matchedSamples:90,matchedPercent:75,observedSeconds:12,outcome:"PRACTICE_TARGET_MET"},
 sensitive:"SHOULD_BE_DROPPED",approved:true
});
class FakeStore{
 constructor(passwordHash){
  this.byEmail=new Map();
  for(const u of [
   {id:studentA,org:orgA,slug:"academy-one",email:"s1@example.org",role:"student"},
   {id:studentB,org:orgA,slug:"academy-one",email:"s2@example.org",role:"student"},
   {id:instructorA,org:orgA,slug:"academy-one",email:"t1@example.org",role:"instructor"},
   {id:unassignedInstructor,org:orgA,slug:"academy-one",email:"t2@example.org",role:"instructor"},
   {id:instructorB,org:orgB,slug:"academy-two",email:"teacher@example.org",role:"instructor"}
  ])this.byEmail.set(u.slug+"|"+u.email,{...u,passwordHash});
  this.sessions=new Map();
  this.attempts=[];
  this.feedback=[];
  this.assignments=new Set([orgA+"|"+instructorA+"|"+studentA]);
  this.allowLogin=true;
  this.mfaSteps=new Map();
  this.verified=new Set([studentA,instructorA,unassignedInstructor,instructorB]);
  this.inviteHash=null;
  this.aiCalls=new Map();
 }
 async ping(){return true}
 async lookupLogin(email,slug){
  const u=this.byEmail.get(slug+"|"+email);if(!u||!this.verified.has(u.id))return null;
  return {userId:u.id,email:u.email,passwordHash:u.passwordHash,organizationId:u.org,role:u.role};
 }
 async recordLoginAttempt(){return this.allowLogin}
 async consumeEmailVerification(hash){
  if(hash!==this.inviteHash||this.verified.has(studentB))return false;
  this.verified.add(studentB);this.inviteHash=null;return true;
 }
 async consumeInstructorOtp({userId,code}){
  const step=checkTotp(exampleMfaSecret,code,Date.now(),this.mfaSteps.get(userId)??-1);
  if(step===null)return false;
  this.mfaSteps.set(userId,step);return true;
 }
 async createSession({tokenHash,csrfHash,userId,organizationId}){
  const row=[...this.byEmail.values()].find(u=>u.id===userId&&u.org===organizationId);
  this.sessions.set(tokenHash,{userId,organizationId,csrfHash,role:row.role,email:row.email});
 }
 async getSession(hash){
  const actor=this.sessions.get(hash)||null;
  return actor&&this.verified.has(actor.userId)?actor:null;
 }
 async revokeSession(hash){this.sessions.delete(hash)}
 async reserveAiUsage(actor,kind,maxCount){
  const key=actor.organizationId+"|"+actor.userId+"|"+kind;
  const used=this.aiCalls.get(key)||0;
  if(used>=maxCount)return false;
  this.aiCalls.set(key,used+1);
  return true;
 }
 async createAttempt(actor,key,digest,report){
  const prev=this.attempts.find(x=>x.organizationId===actor.organizationId&&x.studentId===actor.userId&&x.key===key);
  if(prev)return {created:false,conflict:prev.digest!==digest,id:prev.id,submittedAt:prev.submittedAt};
  const row={id:randomUUID(),organizationId:actor.organizationId,studentId:actor.userId,key,digest,report,sourceStatus:"UNVERIFIED_BROWSER_REPORT",submittedAt:new Date().toISOString()};
  this.attempts.push(row);
  return {created:true,conflict:false,id:row.id,submittedAt:row.submittedAt};
 }
 async listOwnAttempts(actor,limit){
  return this.attempts.filter(x=>x.studentId===actor.userId&&x.organizationId===actor.organizationId).slice(-limit).map(x=>({id:x.id,report:x.report,sourceStatus:x.sourceStatus}));
 }
 async listAssignedAttempts(actor,limit){
  return this.attempts.filter(x=>x.organizationId===actor.organizationId&&this.assignments.has(actor.organizationId+"|"+actor.userId+"|"+x.studentId)).slice(-limit).map(x=>({id:x.id,studentId:x.studentId,report:x.report}));
 }
 async createFeedbackDraft(actor,draft){
  const attempt=this.attempts.find(x=>x.id===draft.attemptId&&x.organizationId===actor.organizationId);
  if(!attempt||!this.assignments.has(actor.organizationId+"|"+actor.userId+"|"+attempt.studentId))
   throw new ClientError(403,"not_assigned","Not assigned");
  const value={id:randomUUID(),attemptId:attempt.id,organizationId:actor.organizationId,instructorId:actor.userId,
   rubric:draft.rubric,comments:draft.comments,proposedNextAction:draft.proposedNextAction,status:"UNVERIFIED_DRAFT"};
  this.feedback.push(value);
  return {id:value.id,createdAt:new Date().toISOString(),status:value.status};
 }
 async listOwnFeedback(actor,limit){return this.feedback.filter(x=>x.organizationId===actor.organizationId&&x.instructorId===actor.userId).slice(-limit)}
}

test("private staging API enforces cookies, CSRF, tenant boundaries, role assignments and replay safety",async t=>{
 const password="a-long-strong-test-passphrase-27";
 const store=new FakeStore(await hashPassword(password));
 const aiEnv={
  OPENAI_API_KEY:"fake-testing-provider-key-value-not-live",
  AGSA_AI_ENABLED:"1",AGSA_AI_VOICE_ENABLED:"1",
  AGSA_AI_TEXT_MODEL:"gpt-6-luna"
 };
 let providerCalls=0;
 const aiRequest=async(url,opts)=>{
  providerCalls++;
  assert.equal(opts.headers.Authorization,"Bearer "+aiEnv.OPENAI_API_KEY);
  if(url.endsWith("/v1/responses"))return new Response(JSON.stringify({
   output:[{type:"message",content:[{type:"output_text",text:"Lift is a force. Check approved teaching materials."}]}]
  }),{status:200,headers:{"Content-Type":"application/json"}});
  if(url.endsWith("/v1/audio/speech"))return new Response(Buffer.alloc(64,67),{status:200});
  throw Error("Unexpected provider route");
 };
 const server=createServer(createHandler(store,{publicOrigin:"http://127.0.0.1:3100",
  nodeEnv:"test",allowInsecureLocal:true,mfaKey:Buffer.alloc(32,1),aiEnv,aiRequest,
  logError:e=>{throw e;}}));
 await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const root="http://127.0.0.1:"+server.address().port;
 async function ask(method,path,body,auth={},headers={}){
  const h={Origin:"http://127.0.0.1:3100",...headers};
  if(body!==undefined)h["Content-Type"]="application/json";
  if(auth.cookies)h.Cookie=auth.cookies;
  if(auth.csrf)h["X-AGSA-CSRF"]=auth.csrf;
  const response=await fetch(root+path,{method,headers:h,...(body!==undefined?{body:JSON.stringify(body)}:{})});
  const result=await response.json();
  return {status:response.status,body:result,headers:response.headers};
 }
 async function login(email,organization="academy-one"){
  const verificationCode=(email.startsWith("t")||email.includes("teacher"))?totpAtStep(exampleMfaSecret,Math.floor(Date.now()/30000)):"";
  const r=await ask("POST","/api/v1/auth/login",{email,password,organization,verificationCode});
  assert.equal(r.status,200,JSON.stringify(r.body));
  const set=r.headers.getSetCookie();
  const cookies=set.map(x=>x.split(";")[0]).join("; ");
  const csrf=/agsa_local_csrf=([^;]+)/.exec(cookies)?.[1];
  assert.ok(csrf);
  assert.ok(/agsa_local_session=/.test(cookies));
  assert.equal(cookies.includes(password),false);
  return {cookies,csrf};
 }
 await t.test("public probes do not reveal private data",async()=>{
  assert.equal((await ask("GET","/api/v1/health")).body.status,"ok");
  assert.equal((await ask("GET","/api/v1/ready")).body.status,"ready");
  assert.equal((await ask("GET","/api/v1/me")).status,401);
  assert.equal((await ask("GET","/api/v1/practice-attempts")).status,401);
 });
 await t.test("login rejects bad origins, fake users and wrong passwords without exposing IDs",async()=>{
  assert.equal((await ask("POST","/api/v1/auth/login",{email:"s1@example.org",password,organization:"academy-one"},{},{Origin:"https://evil.example"})).status,403);
  const wrong=await ask("POST","/api/v1/auth/login",{email:"s1@example.org",password:"incorrect_password",organization:"academy-one"});
  const missing=await ask("POST","/api/v1/auth/login",{email:"missing@example.org",password,organization:"academy-one"});
  assert.equal(wrong.status,401);
  assert.equal(missing.status,401);
  assert.equal(wrong.body.error,missing.body.error);
  store.allowLogin=false;
  assert.equal((await ask("POST","/api/v1/auth/login",{email:"s1@example.org",password,organization:"academy-one"})).status,429);
  store.allowLogin=true;
 });
 await t.test("instructor password alone or invalid OTP must not issue session",async()=>{
  const base={email:"t1@example.org",password,organization:"academy-one"};
  const noCode=await ask("POST","/api/v1/auth/login",base);
  assert.equal(noCode.status,401);
  assert.equal(noCode.headers.getSetCookie().length,0);
  const bad=await ask("POST","/api/v1/auth/login",{...base,verificationCode:"000000"});
  assert.equal(bad.status,401);
  assert.equal(bad.headers.getSetCookie().length,0);
 });
 const inviteToken=generateSecret();
 store.inviteHash=hashSha256(inviteToken);
 await t.test("unverified account fails login until its inbox token is consumed once",async()=>{
  const before=await ask("POST","/api/v1/auth/login",{
   email:"s2@example.org",password,organization:"academy-one"
  });
  assert.equal(before.status,401);
  assert.equal(before.headers.getSetCookie().length,0);
  const malformed=await ask("POST","/api/v1/auth/verify-email",{token:"bad-token"});
  assert.equal(malformed.status,400);
  const unknown=await ask("POST","/api/v1/auth/verify-email",{token:generateSecret()});
  assert.equal(unknown.status,400);
  const verified=await ask("POST","/api/v1/auth/verify-email",{token:inviteToken});
  assert.equal(verified.status,200);
  assert.equal(verified.body.status,"email_verified");
  assert.equal(verified.headers.getSetCookie().length,0);
  assert.equal((await ask("POST","/api/v1/auth/verify-email",{token:inviteToken})).status,400,
   "a reused token must not verify again");
 });
 const s1=await login("s1@example.org");
 const s2=await login("s2@example.org");
 const t1=await login("t1@example.org");
 await t.test("same 30-second instructor OTP cannot create a second session",async()=>{
  const reused=await ask("POST","/api/v1/auth/login",{
   email:"t1@example.org",password,organization:"academy-one",
   verificationCode:totpAtStep(exampleMfaSecret,Math.floor(Date.now()/30000))
  });
  assert.equal(reused.status,401);
  assert.equal(reused.headers.getSetCookie().length,0);
 });
 const t2=await login("t2@example.org");
 const other=await login("teacher@example.org","academy-two");
 await t.test("authenticated identity comes only from session; insecure requests fail",async()=>{
  const me=await ask("GET","/api/v1/me",undefined,s1);
  assert.equal(me.body.user.role,"student");
  assert.equal(me.body.user.id,studentA);
  assert.equal(me.body.trainingStatus,"UNACCREDITED_STAGING_DEMO");
  const noCsrf=await ask("POST","/api/v1/practice-attempts",validReport(),{cookies:s1.cookies},{"Idempotency-Key":"request_unique_1234"});
  assert.equal(noCsrf.status,403);
  const badCsrf=await ask("POST","/api/v1/practice-attempts",validReport(),{cookies:s1.cookies,csrf:"wrong"},{"Idempotency-Key":"request_unique_1234"});
  assert.equal(badCsrf.status,403);
  assert.equal((await ask("GET","/api/v1/instructor/assigned-attempts",undefined,s1)).status,403);
  assert.equal((await ask("POST","/api/v1/practice-attempts",validReport(),t1,{"Idempotency-Key":"request_unique_1234"})).status,403);
 });
 let attemptId;
 await t.test("student submissions are allowlisted and idempotent; student isolation holds",async()=>{
  const first=await ask("POST","/api/v1/practice-attempts",validReport(),s1,{"Idempotency-Key":"request_unique_1234"});
  assert.equal(first.status,201,JSON.stringify(first.body));
  attemptId=first.body.id;
  assert.equal(first.body.status,"UNVERIFIED_BROWSER_REPORT");
  assert.equal(first.body.flightCredit,false);
  assert.equal(store.attempts.length,1);
  assert.equal(JSON.stringify(store.attempts[0].report).includes("SHOULD_BE_DROPPED"),false);
  const replay=await ask("POST","/api/v1/practice-attempts",validReport(),s1,{"Idempotency-Key":"request_unique_1234"});
  assert.equal(replay.status,200);
  assert.equal(replay.body.id,attemptId);
  assert.equal(replay.body.created,false);
  const changed={...validReport(),createdAt:"2026-11-07T20:18:00.000Z"};
  assert.equal((await ask("POST","/api/v1/practice-attempts",changed,s1,{"Idempotency-Key":"request_unique_1234"})).status,409);
  const ours=await ask("GET","/api/v1/practice-attempts",undefined,s1);
  const theirs=await ask("GET","/api/v1/practice-attempts",undefined,s2);
  assert.equal(ours.body.items.length,1);
  assert.equal(theirs.body.items.length,0);
  assert.equal((await ask("GET","/api/v1/practice-attempts?limit=999",undefined,s1)).status,400);
  assert.equal((await ask("POST","/api/v1/practice-attempts",validReport(),s1)).status,400);
 });
 await t.test("only an assigned instructor in the same organization may draft feedback",async()=>{
  const assigned=await ask("GET","/api/v1/instructor/assigned-attempts",undefined,t1);
  assert.equal(assigned.body.items.length,1);
  assert.equal(assigned.body.items[0].id,attemptId);
  assert.equal((await ask("GET","/api/v1/instructor/assigned-attempts",undefined,t2)).body.items.length,0);
  assert.equal((await ask("GET","/api/v1/instructor/assigned-attempts",undefined,other)).body.items.length,0);
  const draft={attemptId,rubric:{instrumentScan:"needs-discussion",controlCoordination:"practice-recommended",riskAwareness:"not-reviewed"},
   comments:"Discuss the hypothetical PFD response",proposedNextAction:"Repeat a synthetic turn",instructorId:instructorB,officialAssessment:true};
  assert.equal((await ask("POST","/api/v1/instructor/feedback-drafts",draft,s1)).status,403);
  assert.equal((await ask("POST","/api/v1/instructor/feedback-drafts",draft,t2)).status,403);
  assert.equal((await ask("POST","/api/v1/instructor/feedback-drafts",draft,other)).status,403);
  const written=await ask("POST","/api/v1/instructor/feedback-drafts",draft,t1);
  assert.equal(written.status,201,JSON.stringify(written.body));
  assert.equal(written.body.assessment,false);
  assert.equal(store.feedback.length,1);
  assert.equal(store.feedback[0].instructorId,instructorA);
  assert.equal(JSON.stringify(store.feedback[0]).includes("officialAssessment"),false);
  assert.equal((await ask("GET","/api/v1/instructor/feedback-drafts",undefined,t1)).body.items.length,1);
  assert.equal((await ask("GET","/api/v1/instructor/feedback-drafts",undefined,t2)).body.items.length,0);
 });
 await t.test("AI questions require login, CSRF and per-account usage limits",async()=>{
  assert.equal((await ask("GET","/api/v1/ai/status")).status,401);
  const flags=await ask("GET","/api/v1/ai/status",undefined,s1);
  assert.equal(flags.status,200);
  assert.equal(flags.body.enabled,true);
  assert.equal(flags.body.voiceEnabled,true);
  assert.equal(flags.body.limits.text,12);
  assert.equal(JSON.stringify(flags.body).includes(aiEnv.OPENAI_API_KEY),false);
  const question={question:"What is lift?",topic:"forces",style:"mentor"};
  assert.equal((await ask("POST","/api/v1/ai/ask",question)).status,401);
  assert.equal((await ask("POST","/api/v1/ai/ask",question,{cookies:s1.cookies})).status,403);
  assert.equal((await ask("POST","/api/v1/ai/ask",{...question,question:"a"},s1)).status,400);
  assert.equal((await ask("POST","/api/v1/ai/ask",{...question,style:"not-valid"},s1)).status,400);
  const before=providerCalls;
  for(let i=0;i<12;i++){
   const reply=await ask("POST","/api/v1/ai/ask",question,s1);
   assert.equal(reply.status,200,JSON.stringify(reply.body));
   assert.equal(reply.body.mode,"GENERATIVE_AI");
   assert.equal(JSON.stringify(reply.body).includes(aiEnv.OPENAI_API_KEY),false);
  }
  assert.equal(providerCalls-before,12);
  assert.equal((await ask("POST","/api/v1/ai/ask",question,s1)).status,429);
  assert.equal((await ask("POST","/api/v1/ai/ask",question,s2)).status,200);
  assert.equal((await ask("POST","/api/v1/ai/ask",question,t1)).status,200);
 });
 await t.test("natural voice is CSRF protected and subject to a separate daily limit",async()=>{
  assert.equal((await ask("POST","/api/v1/ai/voice",{text:"Hello world"},s1,{Origin:"https://unrelated.example"})).status,403);
  assert.equal((await ask("POST","/api/v1/ai/voice",{text:"Hi",voice:"coral"},s1)).status,400);
  for(let i=0;i<5;i++){
   const audio=await fetch(root+"/api/v1/ai/voice",{
    method:"POST",headers:{
     Origin:"http://127.0.0.1:3100","Content-Type":"application/json",
     "X-AGSA-CSRF":s1.csrf,Cookie:s1.cookies
    },body:JSON.stringify({text:"Aviation teaching sample "+i,voice:"coral"})
   });
   assert.equal(audio.status,200);
   assert.equal(audio.headers.get("content-type"),"audio/mpeg");
   assert.equal((await audio.arrayBuffer()).byteLength,64);
  }
  assert.equal((await ask("POST","/api/v1/ai/voice",{text:"Aviation sample",voice:"coral"},s1)).status,429);
 });
 await t.test("logout revokes session and clears cookies",async()=>{
  assert.equal((await ask("POST","/api/v1/auth/logout",{},s1)).status,200);
  assert.equal((await ask("GET","/api/v1/me",undefined,s1)).status,401);
  assert.equal((await ask("GET","/api/v1/me",undefined,s2)).status,200);
 });
});
