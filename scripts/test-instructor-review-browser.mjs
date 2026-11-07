import assert from "node:assert/strict";
import path from "node:path";
import {readFile} from "node:fs/promises";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const Model=require("../instructor-review-model.js");
const url=pathToFileURL(path.resolve("instructor-review.html")).href;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
try{
 const desktop=await browser.newPage({viewport:{width:1300,height:850},acceptDownloads:true});
 desktop.on("pageerror",e=>errors.push("desktop: "+e.message));
 await desktop.goto(url,{waitUntil:"load"});
 assert.equal(await desktop.locator("#reportPanel").isVisible(),false);
 assert.equal(await desktop.locator("#reviewPanel").isVisible(),false);
 await desktop.locator("#demoLoad").click();
 assert.equal(await desktop.locator("#reportPanel").isVisible(),true);
 assert.equal(await desktop.locator("#reviewPanel").isVisible(),true);
 assert.equal(await desktop.locator("#sourceScore").textContent(),"76%");
 assert.match(await desktop.locator("#sourceNotice").textContent(),/FICTIONAL EXAMPLE/);
 assert.equal(await desktop.locator("#sourceSuggestions li").count(),2);
 await desktop.locator("#draftDownload").click();
 assert.match(await desktop.locator("#reviewStatus").textContent(),/Enter at least one/);
 await desktop.locator("#rubricScan").selectOption("needs-discussion");
 await desktop.locator("#rubricRisk").selectOption("practice-recommended");
 await desktop.locator("#reviewComment").fill("The simulated heading and bank should be discussed with an instructor.");
 await desktop.locator("#reviewNext").fill("Repeat controlled turn practice and observe slip/skid.");
 const downloadPromise=desktop.waitForEvent("download");
 await desktop.locator("#draftDownload").click();
 const download=await downloadPromise;
 assert.match(download.suggestedFilename(),/UNVERIFIED-turn-review-draft\.json/);
 const draft=JSON.parse(await readFile(await download.path(),"utf8"));
 assert.equal(draft.schema,Model.draftSchema);
 assert.equal(draft.recordStatus,"UNVERIFIED_DRAFT_ONLY");
 assert.match(draft.notice,/NOT AN INSTRUCTOR SIGN-OFF/);
 assert.equal(draft.reviewQuestions.rubric.instrumentScan,"needs-discussion");
 assert.equal(draft.reviewQuestions.comments,"The simulated heading and bank should be discussed with an instructor.");

 // Import unsigned report from actual browser file picker with hostile display value.
 const hostile={...Model.demo(),task:{...Model.demo().task,title:"<img src=x onerror=alert('bad')>"}};
 await desktop.locator("#reportFile").setInputFiles({
  name:"self-practice.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(hostile))
 });
 assert.equal(await desktop.locator("#sourceTask").textContent(),hostile.task.title);
 assert.equal(await desktop.locator("#reportPanel img").count(),0,"untrusted display text not interpreted as markup");

 const journal={
  schema:"agsa.local-journal.v1",records:[
   {id:"one",taskId:"flap",taskTitle:"Flaps",storedAt:"2026-11-07T19:00:00Z",outcome:"INCOMPLETE",score:31,observedSeconds:4,suggestedNextSteps:["Wait for deployment"]},
   {id:"two",taskId:"turn",taskTitle:"Turn",storedAt:"2026-11-07T19:01:00Z",outcome:"PRACTICE_TARGET_MET",score:85,observedSeconds:12}
  ]
 };
 await desktop.locator("#reportFile").setInputFiles({name:"journal.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(journal))});
 assert.equal(await desktop.locator("#recordSelect option").count(),2);
 assert.equal(await desktop.locator("#sourceScore").textContent(),"31%");
 await desktop.locator("#recordSelect").selectOption("1");
 assert.equal(await desktop.locator("#sourceScore").textContent(),"85%");
 assert.match(await desktop.locator("#sourceNotice").textContent(),/journal summary/i);
 await desktop.locator("#reportFile").setInputFiles({name:"invalid.json",mimeType:"application/json",buffer:Buffer.from('{"schema":"bad"}')});
 assert.equal(await desktop.locator("#reviewPanel").isVisible(),false,"invalid import clears previous context");
 assert.match(await desktop.locator("#importStatus").textContent(),/Could not open/);
 await desktop.locator("#reportFile").setInputFiles({name:"huge.json",mimeType:"application/json",buffer:Buffer.alloc(263000,97)});
 assert.match(await desktop.locator("#importStatus").textContent(),/256 KB/);

 await desktop.locator("#demoLoad").click();
 await desktop.locator("#clearReview").click();
 assert.equal(await desktop.locator("#reviewPanel").isVisible(),false);
 await desktop.reload({waitUntil:"load"});
 assert.equal(await desktop.locator("#reportPanel").isVisible(),false,"no hidden browser persistence");
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,acceptDownloads:true});
 phone.on("pageerror",e=>errors.push("phone: "+e.message));
 await phone.goto(url,{waitUntil:"load"});
 await phone.locator("#demoLoad").tap();
 assert.equal(await phone.locator("#reportPanel").isVisible(),true);
 await phone.locator("#reviewNext").fill("Repeat the synthetic task; no flight credit.");
 const phoneDownload=phone.waitForEvent("download");
 await phone.locator("#draftDownload").tap();
 const mobileDraft=JSON.parse(await readFile(await (await phoneDownload).path(),"utf8"));
 assert.equal(mobileDraft.source.claimedScorePercent,76);
 assert.ok(mobileDraft.reviewQuestions.proposedNextAction.includes("no flight credit"));
 await phone.close();
 assert.deepEqual(errors,[],"No JavaScript page errors");
 console.log("Instructor review browser passed: desktop/mobile, demo, unsigned draft download, file/journal intake, XSS inert text, size/schema rejection, clearing and no persistence.");
}finally{await browser.close()}
