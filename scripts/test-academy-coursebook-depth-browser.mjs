import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {chromium} from "playwright";

const root=process.cwd();
const allowed=new Set(["academy-coursebook.html","academy-coursebook.css","academy-coursebook.js","academy-coursebook-data.js","academy-coursebook-depth-a.js","academy-coursebook-depth-b1.js","academy-coursebook-depth-b2.js","academy-coursebook-depth-model.js","academy-coursebook-depth-ui.js","academy-coursebook-illustrations.js","academy-coursebook-pictorial-ui.js","academy-brand.js","academy-certificate-ui.mjs","academy-certificate-core.mjs","academy-certificate-eligibility.mjs"]);
const server=createServer(async(req,res)=>{
 const name=new URL(req.url,"http://localhost").pathname.slice(1);
 if(!allowed.has(name)){res.writeHead(404);res.end();return}
 try{
  const bytes=await readFile(path.join(root,name));
  res.writeHead(200,{"Content-Type":(name.endsWith(".js")||name.endsWith(".mjs"))?"text/javascript":name.endsWith(".css")?"text/css":"text/html"});
  res.end(bytes);
 }catch{res.writeHead(404);res.end()}
});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve)});
const base="http://127.0.0.1:"+server.address().port+"/academy-coursebook.html";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
const correctCore=async page=>{
 const indices=await page.evaluate(()=>{
  const id=new URL(location.href).searchParams.get("module"),m=window.AGSACompleteCoursebook.modules.find(m=>m.id===id);
  return m.quiz.map(q=>q.answer);
 });
 for(let i=0;i<indices.length;i++)await page.locator("#quizQuestions fieldset").nth(i).locator('input[type="radio"]').nth(indices[i]).check();
 await page.locator("#submitQuiz").click();
};
const correctAdvanced=async page=>{
 const indices=await page.evaluate(()=>{
  const id=new URL(location.href).searchParams.get("module"),u=window.AGSADeepCoursebook.unit(id);
  return {caseAnswer:u.scenario.answer,questions:u.questions.map(q=>q[2])};
 });
 await page.locator("#deepScenario fieldset input").nth(indices.caseAnswer).check();
 for(let i=0;i<3;i++)await page.locator("#deepQuestions fieldset").nth(i).locator("input").nth(indices.questions[i]).check();
 await page.locator("#deepSubmit").click();
};
try{
 const desktop=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
 desktop.on("pageerror",e=>errors.push("desktop: "+e.message));
 await desktop.goto(base+"?path=scouts&module=orientation",{waitUntil:"load"});
 assert.equal(await desktop.locator("#deepReading .deep-lesson").count(),3);
 assert.equal(await desktop.locator("#certificatesPanel").count(),1);
 assert.equal(await desktop.locator("#downloadProgrammeCertificate").isDisabled(),true);
 assert.equal(await desktop.locator("#deepGlossary dt").count(),3);
 assert.equal(await desktop.locator("#deepQuestions fieldset").count(),3);
 assert.equal(await desktop.locator("#deepScenario fieldset").count(),1);
 assert.match(await desktop.locator("#deepRouteFocus").textContent(),/Air Scout/);
 await desktop.locator("#deepSubmit").click();
 assert.match(await desktop.locator("#deepFeedback").textContent(),/Choose an option/);
 await correctCore(desktop);
 assert.match(await desktop.locator("#quizResult").textContent(),/3 of 3 correct/);
 await correctAdvanced(desktop);
 assert.match(await desktop.locator("#deepFeedback").textContent(),/4\/4 correct/);
 assert.match(await desktop.locator("#deepCourseProgress").textContent(),/1\/12/);
 await desktop.reload();
 assert.match(await desktop.locator("#deepModuleStatus").textContent(),/target met/);
 await desktop.locator("#route").selectOption("pilots");
 assert.match(await desktop.locator("#deepRouteFocus").textContent(),/Aspiring-pilot/);
 await desktop.locator('#moduleList button[data-module="meteorology"]').click();
 assert.match(await desktop.locator("#moduleTitle").textContent(),/weather/i);
 assert.match(await desktop.locator("#deepReading .deep-lesson").nth(0).textContent(),/density/i);
 await desktop.locator("#startCapstone").click();
 assert.equal(await desktop.locator("#capstoneQuestions fieldset").count(),24);
 await desktop.evaluate(()=>{
  const D=window.AGSADeepCoursebook,lookup=new Map();
  D.units.forEach(u=>u.questions.slice(0,2).forEach(q=>lookup.set(q[0],q[2])));
  document.querySelectorAll("#capstoneQuestions fieldset").forEach((f,i)=>{
   const title=f.querySelector("legend").textContent.replace(/^\d+\.\s*/,"");
   const correct=lookup.get(title);
   if(!Number.isInteger(correct))throw Error("Capstone item missing in source: "+title);
   f.querySelectorAll("input")[correct].checked=true;
  });
 });
 await desktop.locator("#submitCapstone").click();
 assert.match(await desktop.locator("#capstoneFeedback").textContent(),/24\/24/);
 assert.equal(await desktop.locator("#capstoneAnswerList li").count(),24);
 const downloadPromise=desktop.waitForEvent("download");
 await desktop.locator("#exportFullProgress").click();
 const download=await downloadPromise;
 const exportData=JSON.parse(await readFile(await download.path(),"utf8"));
 assert.equal(exportData.schema,"agsa.coursebook.deep-self-study.v1");
 assert.equal(exportData.status,"UNVERIFIED_EDITABLE_DEVICE_RECORD");
 assert.ok(!("certificate" in exportData));
 await desktop.evaluate(()=>{
  const Core=window.AGSACompleteCoursebook,D=window.AGSADeepCoursebook;
  localStorage.setItem("agsa.coursebook.attempts.v1",JSON.stringify(Core.modules.map((m,i)=>({id:m.id,revision:Core.REVISION,correct:3,at:i+1}))));
  localStorage.setItem(D.KEY,JSON.stringify(D.units.map((u,i)=>({id:u.id,revision:D.REVISION,correct:4,caseCorrect:true,at:i+1}))));
 });
 await desktop.reload();
 assert.equal(await desktop.locator("#completionCelebration").isVisible(),true);
 assert.match(await desktop.locator("#completionCelebration").textContent(),/not a qualification/i);
 desktop.once("dialog",dialog=>dialog.accept());
 await desktop.locator("#clearRecord").click();
 assert.equal(await desktop.locator("#completionCelebration").isVisible(),false);
 assert.equal(await desktop.evaluate(()=>localStorage.getItem(window.AGSADeepCoursebook.KEY)),null);
 assert.deepEqual(errors,[]);
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone: "+e.message));
 await phone.goto(base+"?path=scouts&module=rotorcraft",{waitUntil:"load"});
 assert.match(await phone.locator("#deepReading .deep-lesson").nth(0).textContent(),/rotor/i);
 assert.equal(await phone.locator("#deepQuestions fieldset").count(),3);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),"390px phone must not scroll horizontally");
 await correctAdvanced(phone);
 assert.match(await phone.locator("#deepFeedback").textContent(),/4\/4 correct/);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2));
 await phone.close();
 assert.deepEqual(errors,[]);
 console.log("Deep Academy browser passed: desktop/Android-sized touch, scenarios, local revision, routes, 24-question capstone, unsigned export, deletion and self-study milestone.");
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
