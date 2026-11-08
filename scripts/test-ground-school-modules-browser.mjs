import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {chromium} from "playwright";

const root=process.cwd();
const allowed=new Set(["ground-school-modules.html","ground-school-modules.css","ground-school-modules.js","ground-school-modules-ui.js","ai-instructor-lessons.js","ai-instructor-curriculum.js","ai-instructor.css"]);
const server=createServer(async(req,res)=>{
 const name=new URL(req.url,"http://localhost").pathname.slice(1);
 if(!allowed.has(name)){res.writeHead(404);res.end();return}
 try{
  const bytes=await readFile(path.join(root,name));
  res.writeHead(200,{"Content-Type":name.endsWith(".js")?"text/javascript":name.endsWith(".css")?"text/css":"text/html"});
  res.end(bytes);
 }catch{res.writeHead(404);res.end()}
});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve)});
const base="http://127.0.0.1:"+server.address().port+"/ground-school-modules.html";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
async function answer(page,indices){
 for(let i=0;i<indices.length;i++)
  await page.locator(".assessment-question").nth(i).locator('input[type="radio"]').nth(indices[i]).check();
}
try{
 const desktop=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
 desktop.on("pageerror",e=>errors.push("desktop: "+e.message));
 await desktop.goto(base+"?path=scouts&module=awareness",{waitUntil:"load"});
 assert.equal(await desktop.locator("#pathScouts").getAttribute("aria-pressed"),"true");
 assert.equal(await desktop.locator("#moduleChoices button").count(),4);
 assert.match(await desktop.locator("#moduleChoices button").nth(2).textContent(),/Weather and communications/);
 assert.match(await desktop.locator("#currentModuleTitle").textContent(),/Weather and communications/);
 assert.equal(await desktop.locator(".assessment-question").count(),6);
 assert.equal(await desktop.locator(".lesson-card a").count(),2);
 assert.match(await desktop.locator(".lesson-card a").first().getAttribute("href"),/ai-instructor\.html\?lesson=weather/);
 await desktop.locator("#submitCheckpoint").click();
 assert.match(await desktop.locator("#checkpointFeedback").textContent(),/Select an answer for each/);
 assert.match(await desktop.locator("#progressSummary").textContent(),/0 of 4/);
 // Both sets of questions are fixed, human authored; this is intentionally
 // inspectable practice rather than a hidden high-stakes exam key.
 await answer(desktop,[2,1,0,0,2,1]);
 await desktop.locator("#submitCheckpoint").click();
 assert.match(await desktop.locator("#checkpointFeedback").textContent(),/6 of 6 correct/);
 assert.match(await desktop.locator("#checkpointFeedback").textContent(),/not an official grade/i);
 assert.equal(await desktop.locator("#checkpointFeedback").getAttribute("data-result"),"target");
 assert.equal(await desktop.locator("#submitCheckpoint").isDisabled(),true);
 assert.equal(await desktop.locator(".assessment-question input:disabled").count(),18);
 assert.equal(await desktop.locator("#answerExplanations li").count(),6);
 assert.match(await desktop.locator("#progressSummary").textContent(),/1 of 4/);
 assert.equal(await desktop.evaluate(()=>JSON.parse(localStorage.getItem("agsa.groundschool.moduleAttempts.v1")).length),1);
 await desktop.reload();
 assert.match(await desktop.locator("#progressSummary").textContent(),/1 of 4/,"device-local progress survives a reload");
 assert.match(await desktop.locator("#currentModuleTitle").textContent(),/Weather and communications/);
 await desktop.locator("#pathPilots").click();
 assert.equal(await desktop.locator("#pathPilots").getAttribute("aria-pressed"),"true");
 assert.equal(await desktop.locator("#pathScouts").getAttribute("aria-pressed"),"false");
 assert.match(new URL(desktop.url()).search,/path=pilots/);
 assert.match(await desktop.locator("#moduleChoices button").nth(2).textContent(),/Configuration and preparation/);
 assert.match(await desktop.locator("#progressSummary").textContent(),/1 of 4/,"both paths clearly share anonymous device practice");
 await desktop.locator("#moduleChoices button[data-module=awareness]").click();
 assert.match(await desktop.locator("#currentModuleTitle").textContent(),/Weather and communications/);
 await desktop.locator("#retryCheckpoint").click();
 await answer(desktop,[0,0,1,1,0,0]); // Known incorrect for every question.
 await desktop.locator("#submitCheckpoint").click();
 assert.match(await desktop.locator("#checkpointFeedback").textContent(),/0 of 6 correct/);
 assert.equal(await desktop.locator("#checkpointFeedback").getAttribute("data-result"),"review");
 assert.equal(await desktop.locator("#answerExplanations li").count(),6);
 assert.equal(await desktop.evaluate(()=>JSON.parse(localStorage.getItem("agsa.groundschool.moduleAttempts.v1")).length),2);
 const downloadPromise=desktop.waitForEvent("download");
 await desktop.locator("#exportModules").click();
 const download=await downloadPromise;
 assert.equal(download.suggestedFilename(),"agsa-module-practice-UNVERIFIED.json");
 const exported=JSON.parse(await readFile(await download.path(),"utf8"));
 assert.equal(exported.schema,"agsa.local-module-checkpoints.v1");
 assert.equal(exported.recordStatus,"UNVERIFIED_DEVICE_ONLY");
 assert.equal(exported.attempts.length,2);
 assert.ok(!("name" in exported));
 desktop.once("dialog",dialog=>dialog.accept());
 await desktop.locator("#clearModules").click();
 assert.match(await desktop.locator("#progressSummary").textContent(),/0 of 4/);
 assert.equal(await desktop.evaluate(()=>localStorage.getItem("agsa.groundschool.moduleAttempts.v1")),null);
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone: "+e.message));
 await phone.goto(base+"?path=pilots&module=foundations",{waitUntil:"load"});
 assert.equal(await phone.locator("#pathPilots").getAttribute("aria-pressed"),"true");
 assert.equal(await phone.locator("#moduleChoices button").count(),4);
 assert.equal(await phone.locator(".assessment-question").count(),6);
 assert.equal(await phone.locator(".assessment-question").first().locator("label").count(),3);
 assert.equal(await phone.locator("#moduleLessons .lesson-card").count(),2);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),
  "all controls should fit a 390px touchscreen without horizontal scrolling");
 await phone.locator("#pathScouts").tap();
 assert.match(await phone.locator("#currentModuleTitle").textContent(),/Aircraft and the forces/);
 await phone.locator("#moduleChoices button[data-module=cockpit]").tap();
 assert.equal(await phone.locator(".assessment-question").count(),6);
 await phone.locator("#moduleChoices button[data-module=foundations]").tap();
 await answer(phone,[1,1,0,1,2,2]); // Some correct, some intentionally incorrect.
 await phone.locator("#submitCheckpoint").tap();
 assert.match(await phone.locator("#checkpointFeedback").textContent(),/of 6 correct/);
 assert.match(await phone.locator("#progressSummary").textContent(),/1 of 4/);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2));
 assert.deepEqual(errors,[]);
 await phone.close();
 console.log("Module browser passed: desktop/390px touch, both pathway orders, 6-question feedback, duplicate prevention, reload-safe device progress, retakes, unsigned export and deletion.");
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
