import assert from "node:assert/strict";
import {createServer} from "node:http";
import {randomUUID} from "node:crypto";
import {chromium} from "playwright";
import {createHandler} from "../src/http.mjs";
import {hashPassword,hashSha256,generateSecret} from "../src/crypto.mjs";
import {totpAtStep,checkTotp} from "../src/mfa.mjs";
const demoTotpSecret="JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";

const org=randomUUID(),student=randomUUID(),teacher=randomUUID(),unassigned=randomUUID();
const password="staging-only-password-2026";
const inviteToken=generateSecret();
const exampleReport={
 schema:"agsa.practice-observation.v1",
 createdAt:"2026-11-07T19:25:00.000Z",
 task:{id:"flap",title:"Flap configuration observation"},
 observation:{samples:120,matchedSamples:100,matchedPercent:83,observedSeconds:12,outcome:"PRACTICE_TARGET_MET"},
 studentId:"SPOOFED_STUDENT_ID",certificate:true
};
class FakeStore{
 constructor(passwordHash){
  this.accounts=new Map([
   ["pilot.student@example.org",{userId:student,organizationId:org,role:"student",passwordHash}],
   ["pilot.teacher@example.org",{userId:teacher,organizationId:org,role:"instructor",passwordHash}],
   ["pilot.unassigned@example.org",{userId:unassigned,organizationId:org,role:"instructor",passwordHash}]
  ]);
  this.sessions=new Map();this.attempts=[];this.drafts=[];this.mfaSteps=new Map();
  this.verified=new Set([teacher,unassigned]);this.inviteHash=hashSha256(inviteToken);this.aiCalls=new Map();
 }
 async ping(){return true}
 async recordLoginAttempt(){return true}
 async lookupLogin(email,slug){
  const found=this.accounts.get(email);
  return slug==="agsa-pilot"&&found&&this.verified.has(found.userId)?{...found,email}:null;
 }
 async consumeEmailVerification(hash){
  if(hash!==this.inviteHash||this.verified.has(student))return false;
  this.verified.add(student);this.inviteHash=null;return true;
 }
 async consumeInstructorOtp({userId,code}){
  const step=checkTotp(demoTotpSecret,code,Date.now(),this.mfaSteps.get(userId)??-1);
  if(step===null)return false;
  this.mfaSteps.set(userId,step);return true;
 }
 async createSession({tokenHash,csrfHash,userId,organizationId}){
  const item=[...this.accounts.entries()].find(([,v])=>v.userId===userId);
  this.sessions.set(tokenHash,{userId,organizationId,csrfHash,role:item[1].role,email:item[0]});
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
  const prior=this.attempts.find(x=>x.studentId===actor.userId&&x.organizationId===actor.organizationId&&x.key===key);
  if(prior)return {created:false,conflict:prior.digest!==digest,id:prior.id,submittedAt:prior.submittedAt};
  const entry={id:randomUUID(),studentId:actor.userId,organizationId:actor.organizationId,key,digest,report,
   sourceStatus:"UNVERIFIED_BROWSER_REPORT",submittedAt:new Date().toISOString()};
  this.attempts.push(entry);
  return {created:true,conflict:false,id:entry.id,submittedAt:entry.submittedAt};
 }
 async listOwnAttempts(actor){
  return this.attempts.filter(x=>x.studentId===actor.userId&&x.organizationId===actor.organizationId);
 }
 async listAssignedAttempts(actor){
  return actor.userId===teacher?this.attempts.filter(x=>x.studentId===student&&x.organizationId===actor.organizationId):[];
 }
 async createFeedbackDraft(actor,draft){
  const allowed=actor.userId===teacher&&this.attempts.some(x=>x.id===draft.attemptId&&x.studentId===student);
  if(!allowed)throw Object.assign(new Error("Not assigned"),{status:403,code:"not_assigned"});
  const row={id:randomUUID(),attemptId:draft.attemptId,instructorId:actor.userId,organizationId:org,
   rubric:draft.rubric,comments:draft.comments,proposedNextAction:draft.proposedNextAction,
   status:"UNVERIFIED_DRAFT",createdAt:new Date().toISOString()};
  this.drafts.push(row);
  return row;
 }
 async listOwnFeedback(actor){
  return this.drafts.filter(x=>x.instructorId===actor.userId&&x.organizationId===actor.organizationId);
 }
}
const store=new FakeStore(await hashPassword(password));
let handler=null;
const server=createServer((req,res)=>handler(req,res));
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
const base="http://127.0.0.1:"+server.address().port;
const aiEnv={
 OPENAI_API_KEY:"fake-provider-credentials-for-tests-only",
 AGSA_AI_ENABLED:"1",AGSA_AI_VOICE_ENABLED:"1",
 AGSA_AI_TEXT_MODEL:"gpt-6-luna"
};
let providerCalls=0;
const aiRequest=async(url)=>{
 providerCalls++;
 if(url.endsWith("/v1/responses"))return new Response(JSON.stringify({
  output:[{type:"message",content:[{type:"output_text",text:"Lift is an aerodynamic force that can be discussed in classroom lessons."}]}]
 }),{status:200,headers:{"Content-Type":"application/json"}});
 if(url.endsWith("/v1/audio/speech"))return new Response(Buffer.alloc(256,65),{status:200});
 throw Error("Unexpected provider request");
};
handler=createHandler(store,{publicOrigin:base,nodeEnv:"test",allowInsecureLocal:true,mfaKey:Buffer.alloc(32,2),
 aiEnv,aiRequest,logError:e=>{throw e}});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const pageErrors=[];
async function login(page,email){
 await page.locator("#organization").fill("agsa-pilot");
 await page.locator("#email").fill(email);
 await page.locator("#password").fill(password);
 if(email.includes("teacher")||email.includes("unassigned"))
  await page.locator("#verificationCode").fill(totpAtStep(demoTotpSecret,Math.floor(Date.now()/30000)));
 await page.locator("#loginButton").click();
 await page.locator("#profileEmail").waitFor({state:"visible"});
 assert.equal(await page.locator("#profileEmail").textContent(),email);
}
try{
 const desktop=await browser.newPage({viewport:{width:1260,height:870}});
 desktop.on("pageerror",e=>pageErrors.push("desktop: "+e.message));
 await desktop.addInitScript(()=>{
  window.Audio=class{
   constructor(url){this.src=url;this.onended=null}
   async play(){window.__mockAudioPlayed=true;return true}
   pause(){}
  };
 });
 await desktop.goto(base+"/portal/#verify-email="+inviteToken);
 assert.equal(await desktop.locator("#verifyPanel").isVisible(),true);
 assert.equal(await desktop.evaluate(()=>window.location.hash),"","invitation fragment erased immediately");
 await desktop.locator("#loginPanel").waitFor({state:"visible"});
 await desktop.locator("#organization").fill("agsa-pilot");
 await desktop.locator("#email").fill("pilot.student@example.org");
 await desktop.locator("#password").fill(password);
 await desktop.locator("#loginButton").click();
 await desktop.waitForFunction(()=>document.querySelector("#globalStatus").textContent.includes("Sign-in unsuccessful"));
 assert.equal(await desktop.locator("#workspace").isVisible(),false,
  "student must not sign in until email ownership is confirmed");
 assert.equal(store.verified.has(student),false,"invitation is not auto-consumed by opening URL");
 await desktop.locator("#verifyButton").click();
 await desktop.waitForFunction(()=>document.querySelector("#verifyStatus").textContent.includes("Email confirmed"));
 assert.equal(store.verified.has(student),true,"deliberate verification activates staging email");
 assert.equal(await desktop.locator("#verifyButton").isVisible(),false);
 assert.equal(await desktop.locator("#loginPanel").isVisible(),true);
 assert.equal(await desktop.locator("#workspace").isVisible(),false);
 assert.equal(await desktop.locator("#loadingPanel").isVisible(),false);
 assert.equal((await desktop.request.get(base+"/api/v1/me")).status(),401);
 const portalResponse=await desktop.request.get(base+"/portal");
 assert.equal(portalResponse.status(),200);
 assert.match(portalResponse.headers()["content-security-policy"],/script-src 'self'/);
 assert.match(portalResponse.headers()["cache-control"],/no-store/);
 assert.equal((await desktop.request.get(base+"/portal/unknown-secret")).status(),401,"unknown portal path cannot serve arbitrary files");
 await login(desktop,"pilot.student@example.org");
 assert.equal(await desktop.locator("#studentPanel").isVisible(),true);
 assert.equal(await desktop.locator("#instructorPanel").isVisible(),false);
 assert.equal((await desktop.request.get(base+"/api/v1/instructor/assigned-attempts")).status(),403);
 await desktop.waitForFunction(()=>document.querySelector("#aiAvailability").textContent.includes("enabled for fictional"));
 assert.equal(await desktop.locator("#aiAskButton").isDisabled(),false);
 await desktop.locator("#aiQuestion").fill("What is lift?");
 const preAI=providerCalls;
 await desktop.locator("#aiAskButton").click();
 assert.match(await desktop.locator("#aiTutorStatus").textContent(),/acknowledge/);
 assert.equal(providerCalls,preAI,"no AI request before explicit consent");
 await desktop.locator("#aiTopic").selectOption("forces");
 await desktop.locator("#aiStyle").selectOption("mentor");
 await desktop.locator("#aiConsent").check();
 await desktop.locator("#aiAskButton").click();
 await desktop.waitForFunction(()=>document.querySelector("#aiAnswer").textContent.includes("Lift is an aerodynamic"));
 assert.equal(await desktop.locator("#aiAnswerPanel").isVisible(),true);
 assert.match(await desktop.locator("#aiAnswerPanel").textContent(),/AI-generated/);
 assert.equal(providerCalls,preAI+1);
 assert.equal(await desktop.locator("#aiConsent").isChecked(),false);
 await desktop.locator("#aiVoiceChoice").selectOption("coral");
 await desktop.locator("#aiSpeak").click();
 await desktop.waitForFunction(()=>window.__mockAudioPlayed===true);
 assert.equal(providerCalls,preAI+2);
 assert.match(await desktop.locator("#aiTutorStatus").textContent(),/AI-generated voice/);
 await desktop.locator("#aiStop").click();
 assert.match(await desktop.locator("#aiTutorStatus").textContent(),/stopped/);
 await desktop.locator("#reportFile").setInputFiles({
  name:"flap-practice.json",mimeType:"application/json",
  buffer:Buffer.from(JSON.stringify(exampleReport))
 });
 await desktop.locator("#submitButton").click();
 await desktop.waitForFunction(()=>document.querySelector("#submissionStatus").textContent.includes("Report submitted"));
 assert.equal(await desktop.locator("#studentList .list-item").count(),1);
 assert.equal(store.attempts.length,1);
 assert.equal(store.attempts[0].report.flightCredit,false);
 assert.equal(JSON.stringify(store.attempts[0].report).includes("SPOOFED_STUDENT_ID"),false);
 await desktop.reload({waitUntil:"load"});
 assert.equal(await desktop.locator("#studentPanel").isVisible(),true);
 await desktop.locator("#studentList .list-item").first().waitFor();
 await desktop.locator("#logoutButton").click();
 await desktop.locator("#loginPanel").waitFor({state:"visible"});
 assert.equal((await desktop.request.get(base+"/api/v1/me")).status(),401);
 // An instructor password without an authenticator code must not work.
 await desktop.locator("#organization").fill("agsa-pilot");
 await desktop.locator("#email").fill("pilot.teacher@example.org");
 await desktop.locator("#password").fill(password);
 await desktop.locator("#loginButton").click();
 await desktop.waitForFunction(()=>document.querySelector("#globalStatus").textContent.includes("Sign-in unsuccessful"));
 assert.equal(await desktop.locator("#workspace").isVisible(),false);
 await login(desktop,"pilot.teacher@example.org");
 assert.equal(await desktop.locator("#verificationCode").inputValue(),"","MFA code cleared after login");
 assert.equal(await desktop.locator("#studentPanel").isVisible(),false);
 assert.equal(await desktop.locator("#instructorPanel").isVisible(),true);
 assert.equal((await desktop.request.get(base+"/api/v1/practice-attempts")).status(),403);
 await desktop.locator("#assignedList .list-item").first().waitFor();
 assert.equal(await desktop.locator("#assignedList .list-item").count(),1);
 await desktop.locator("#assignedList button").first().click();
 assert.equal(await desktop.locator("#selectedAttempt").isVisible(),true);
 assert.equal(await desktop.locator("#feedbackButton").isDisabled(),false);
 await desktop.locator("#rubricScan").selectOption("needs-discussion");
 await desktop.locator("#rubricControl").selectOption("practice-recommended");
 await desktop.locator("#comments").fill("This is only a fictional discussion note.");
 await desktop.locator("#nextAction").fill("Repeat simulated flap practice.");
 await desktop.locator("#feedbackButton").click();
 await desktop.waitForFunction(()=>document.querySelector("#feedbackStatus").textContent.includes("Saved UNVERIFIED_DRAFT"));
 await desktop.locator("#feedbackList .list-item").first().waitFor();
 assert.equal(store.drafts.length,1);
 assert.equal(store.drafts[0].instructorId,teacher);
 assert.equal(store.drafts[0].status,"UNVERIFIED_DRAFT");
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 phone.on("pageerror",e=>pageErrors.push("phone: "+e.message));
 await phone.goto(base+"/portal/");
 await login(phone,"pilot.unassigned@example.org");
 assert.equal(await phone.locator("#instructorPanel").isVisible(),true);
 assert.equal(await phone.locator("#assignedList .list-item").count(),0);
 assert.equal(await phone.locator("#feedbackButton").isDisabled(),true);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),"No sideways mobile overflow");
 await phone.locator("#logoutButton").tap();
 await login(phone,"pilot.student@example.org");
 assert.equal(await phone.locator("#studentList .list-item").count(),1);
 assert.equal(await phone.locator("#studentPanel").isVisible(),true);
 await phone.waitForFunction(()=>document.querySelector("#aiAvailability").textContent.includes("enabled for fictional"));
 await phone.locator("#aiTopic").selectOption("instruments");
 await phone.locator("#aiQuestion").fill("What does the artificial horizon show?");
 await phone.locator("#aiConsent").check();
 await phone.locator("#aiAskButton").tap();
 await phone.waitForFunction(()=>document.querySelector("#aiAnswer").textContent.includes("Lift is an aerodynamic"));
 assert.equal(await phone.locator("#aiAnswerPanel").isVisible(),true);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),
  "Mobile AI tutoring controls must not overflow horizontally");
 await phone.close();
 assert.deepEqual(pageErrors,[]);
 console.log("Portal browser integration passed: same-origin CSP, no leaked unauthenticated data, student submission, instructor assignments/drafts, CSRF-backed actions and responsive mobile accounts.");
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
