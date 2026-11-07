import assert from "node:assert/strict";
import {createServer} from "node:http";
import {randomUUID} from "node:crypto";
import {chromium} from "playwright";
import {createHandler} from "../src/http.mjs";
import {hashPassword} from "../src/crypto.mjs";

const org=randomUUID(),student=randomUUID(),teacher=randomUUID(),unassigned=randomUUID();
const password="staging-only-password-2026";
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
  this.sessions=new Map();this.attempts=[];this.drafts=[];
 }
 async ping(){return true}
 async recordLoginAttempt(){return true}
 async lookupLogin(email,slug){return slug==="agsa-pilot"&&this.accounts.has(email)?{...this.accounts.get(email),email}:null}
 async createSession({tokenHash,csrfHash,userId,organizationId}){
  const item=[...this.accounts.entries()].find(([,v])=>v.userId===userId);
  this.sessions.set(tokenHash,{userId,organizationId,csrfHash,role:item[1].role,email:item[0]});
 }
 async getSession(hash){return this.sessions.get(hash)||null}
 async revokeSession(hash){this.sessions.delete(hash)}
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
handler=createHandler(store,{publicOrigin:base,nodeEnv:"test",allowInsecureLocal:true,
 logError:e=>{throw e}});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const pageErrors=[];
async function login(page,email){
 await page.locator("#organization").fill("agsa-pilot");
 await page.locator("#email").fill(email);
 await page.locator("#password").fill(password);
 await page.locator("#loginButton").click();
 await page.locator("#profileEmail").waitFor({state:"visible"});
 assert.equal(await page.locator("#profileEmail").textContent(),email);
}
try{
 const desktop=await browser.newPage({viewport:{width:1260,height:870}});
 desktop.on("pageerror",e=>pageErrors.push("desktop: "+e.message));
 await desktop.goto(base+"/portal/");
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
 assert.equal(await desktop.locator("#loginPanel").isVisible(),true);
 assert.equal((await desktop.request.get(base+"/api/v1/me")).status(),401);
 await login(desktop,"pilot.teacher@example.org");
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
 await phone.close();
 assert.deepEqual(pageErrors,[]);
 console.log("Portal browser integration passed: same-origin CSP, no leaked unauthenticated data, student submission, instructor assignments/drafts, CSRF-backed actions and responsive mobile accounts.");
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
