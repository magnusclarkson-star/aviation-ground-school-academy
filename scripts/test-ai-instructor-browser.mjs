import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const allowed=new Set(["ai-instructor.html","ai-instructor.js","ai-instructor-lessons.js","ai-instructor-progress.js","ai-instructor-curriculum.js","ai-instructor.css","curriculum-review.html","curriculum-review.js","curriculum-review-model.js"]);
const server=createServer(async(req,res)=>{
 const name=new URL(req.url,"http://localhost").pathname.slice(1);
 if(!allowed.has(name)){res.writeHead(404);res.end();return}
 try{
  const bytes=await readFile(path.join(root,name));
  const type=name.endsWith(".js")?"text/javascript":name.endsWith(".css")?"text/css":"text/html";
  res.writeHead(200,{"Content-Type":type});res.end(bytes);
 }catch{res.writeHead(404);res.end()}
});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve)});
const base="http://127.0.0.1:"+server.address().port+"/ai-instructor.html";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[];
async function buildPage(mobile){
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1220,height:880},hasTouch:mobile,isMobile:mobile});
 page.on("pageerror",e=>failures.push(e.message));
 await page.addInitScript(()=>{
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{
   getVoices:()=>[{name:"Synthetic testing device voice",lang:"en-GB",localService:true}],
   speak:utterance=>{window.__speechText=utterance.text;utterance.onstart?.();utterance.onend?.()},
   cancel:()=>{window.__cancelCount=(window.__cancelCount||0)+1},
   addEventListener:()=>{}
  }});
  window.SpeechSynthesisUtterance=class{
   constructor(text){this.text=text}
  };
 });
 await page.goto(base,{waitUntil:"load"});
 await page.locator("#quizAnswers button").first().waitFor();
 return page;
}
try{
 const p=await buildPage(false);
 assert.equal(await p.locator("#lessonSelect option").count(),8);
 assert.equal(await p.locator("#lessonObjectives li").count(),3);
 assert.match(await p.locator("#lessonRevision").textContent(),/Qualified subject-matter review required/);
 assert.equal(await p.locator("#lessonReferences a[href^='https://www.faa.gov/']").count(),1);
 assert.equal(await p.locator(".instructor").count(),3);
 assert.match(await p.locator("#voiceStatus").textContent(),/device\/browser voices detected/);
 await p.locator("#instructorScouts").click();
 assert.equal(await p.locator("#instructorScouts").getAttribute("aria-pressed"),"true");
 await p.locator("#readLesson").click();
 assert.match(await p.evaluate(()=>window.__speechText),/Air Scouts/);
 assert.match(await p.evaluate(()=>window.__speechText),/four main forces/);
 await p.locator("#lessonSelect").selectOption("flaps");
 assert.match(await p.locator("#lessonTitle").textContent(),/Flaps, lift and drag/);
 assert.match(new URL(p.url()).search,/lesson=flaps/);
 await p.locator("#quizAnswers button").nth(1).click();
 assert.match(await p.locator("#quizResult").textContent(),/Correct/);
 assert.match(await p.locator("#practiceSummary").textContent(),/1 checkpoints/);
 assert.equal(await p.locator("#quizAnswers button").nth(1).isDisabled(),true,"repeat quiz presses must not inflate progress");
 assert.match(await p.locator("#practiceRecommendation").textContent(),/Suggested next lesson/);
 assert.equal(await p.locator("#quizAnswers button").nth(1).getAttribute("aria-pressed"),"true");
 await p.locator("#questionInput").fill("What does the PFD horizon show?");
 await p.locator("#questionButton").click();
 assert.equal(await p.locator("#answerPanel").isVisible(),true);
 assert.match(await p.locator("#answerPanel").textContent(),/CURATED LESSON EXCERPT/);
 assert.match(await p.locator("#answerText").textContent(),/attitude indicator/i);
 assert.match(await p.locator("#answerText").textContent(),/not a live AI answer/);
 await p.locator("#speakAnswer").click();
 assert.match(await p.evaluate(()=>window.__speechText),/attitude indicator/i);
 await p.locator("#voiceRate").fill("1.2");
 assert.equal(await p.locator("#rateValue").textContent(),"1.2×");
 await p.locator("#stopVoice").click();
 assert.match(await p.locator("#voiceStatus").textContent(),/stopped/);
 await p.locator("#questionInput").fill("<img src=x onerror=alert(1)>");
 await p.locator("#questionButton").click();
 assert.equal(await p.locator("#answerPanel img").count(),0,"user text not converted into DOM");
 assert.ok(!p.url().includes("api.openai.com"),"no provider call made by public demo");
 await p.close();
 const phone=await buildPage(true);
 await phone.locator("#instructorExam").tap();
 await phone.locator("#lessonSelect").selectOption("controls");
 await phone.locator("#readLesson").tap();
 assert.match(await phone.evaluate(()=>window.__speechText),/Theory review/);
 await phone.locator("#quizAnswers button").nth(1).tap();
 assert.match(await phone.locator("#quizResult").textContent(),/Correct/);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),
  "no horizontal overflow on 390px touchscreen");
 assert.deepEqual(failures,[]);
 await phone.close();
 const review=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
 review.on("pageerror",e=>failures.push("curriculum: "+e.message));
 await review.goto(base.replace("ai-instructor.html","curriculum-review.html?lesson=preflight"),{waitUntil:"load"});
 assert.equal(await review.locator("#reviewLesson option").count(),8);
 assert.equal(await review.locator("#reviewLesson").inputValue(),"preflight");
 assert.match(await review.locator("#reviewTitle").textContent(),/Preflight/);
 assert.equal(await review.locator("#reviewObjectives li").count(),3);
 assert.equal(await review.locator("#reviewSources a").count(),2);
 assert.equal(await review.locator(".review-fieldset").count(),6);
 assert.match(await review.locator("#reviewRevision").textContent(),/SME REVIEW REQUIRED/);
 assert.equal(await review.locator("html").getAttribute("lang"),"en");
 assert.equal(await review.locator("#reviewSources img").count(),0);
 await review.locator("#reviewComments").fill("Review the source-to-claim mapping for airworthiness guidance.");
 await review.locator("#factualAccuracy").selectOption("needs-edits");
 const downloadPromise=review.waitForEvent("download");
 await review.locator("#reviewDownload").click();
 const download=await downloadPromise;
 assert.match(download.suggestedFilename(),/preflight-UNSIGNED\.json$/);
 const payload=JSON.parse(await readFile(await download.path(),"utf8"));
 assert.equal(payload.recordStatus,"UNVERIFIED_DRAFT_ONLY");
 assert.equal(payload.createsCourseApproval,false);
 assert.equal(payload.authenticatesReviewer,false);
 assert.equal(payload.snapshot.lessonId,"preflight");
 assert.equal(payload.snapshot.referencePointers.length,2);
 assert.equal(payload.observations.judgements.factualAccuracy,"needs-edits");
 await review.locator("#reviewClear").click();
 assert.match(await review.locator("#reviewStatus").textContent(),/cleared locally/);
 assert.equal(await review.locator("#reviewComments").inputValue(),"");
 assert.ok(await review.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),
  "curriculum worksheet should not overflow 390px phone screen");
 assert.deepEqual(failures,[]);
 await review.close();
 console.log("Public AI Instructor passed: 8 lessons, objectives, official reading links, quiz protection, desktop/mobile voice, and unsigned curriculum review JSON.");
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
