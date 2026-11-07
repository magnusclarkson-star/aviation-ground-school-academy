import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {chromium} from "playwright";

const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,"http://127.0.0.1");
  const target=path.resolve(root,"."+decodeURIComponent(url.pathname));
  if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const data=await readFile(target);
  const ext=path.extname(target).toLowerCase();
  const type={".html":"text/html;charset=utf-8",".js":"text/javascript;charset=utf-8",".svg":"image/svg+xml",".css":"text/css;charset=utf-8"}[ext]||"application/octet-stream";
  res.writeHead(200,{"Content-Type":type});res.end(data);
 }catch(e){res.writeHead(404);res.end("Not found");}
});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve)});
const url="http://127.0.0.1:"+server.address().port+"/cockpit-v3.html?mode=skills";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
async function incomplete(page){
 await page.locator("#skillsStart").click();
 await page.waitForTimeout(420);
 await page.locator("#skillsEnd").click();
 assert.equal(await page.locator("#skillsStage").textContent(),"REVIEW");
 assert.equal(await page.locator("#skillsSave").isEnabled(),true);
}
try{
 const p=await browser.newPage({viewport:{width:1190,height:850},acceptDownloads:true});
 p.on("pageerror",e=>errors.push("desktop: "+e.message));
 await p.goto(url,{waitUntil:"load"});
 await p.locator("#skillsPanel").waitFor({state:"visible"});
 const storageKey="agsa.unofficial-practice-journal.v1";
 assert.equal(await p.evaluate(k=>localStorage.getItem(k),storageKey),null,"no auto-save");
 assert.equal(await p.locator("#skillsSave").isDisabled(),true);
 await incomplete(p);
 assert.match(await p.locator("#coachHeadline").textContent(),/ended early/);
 assert.ok((await p.locator("#coachCriteria .coach-criterion").count())>=4);
 assert.equal(await p.evaluate(k=>localStorage.getItem(k),storageKey),null,"finishing is not permission to save");
 await p.locator("#skillsSave").click();
 assert.equal(await p.locator("#skillsSave").isDisabled(),true,"disable duplicate save");
 assert.equal(await p.locator(".journal-entry").count(),1);
 let contents=JSON.parse(await p.evaluate(k=>localStorage.getItem(k),storageKey));
 assert.equal(contents.schema,"agsa.local-journal.v1");
 assert.equal(contents.records.length,1);
 assert.equal(contents.records[0].outcome,"INCOMPLETE");
 assert.equal("student" in contents.records[0],false);
 await p.reload({waitUntil:"load"});
 assert.equal(await p.locator(".journal-entry").count(),1,"journal persists after refresh");
 await p.locator("#skillsJournal summary").click();
 const downloadPromise=p.waitForEvent("download");
 await p.locator("#skillsExportJournal").click();
 const file=await downloadPromise;
 assert.match(file.suggestedFilename(),/unofficial-practice-journal.json/);
 const report=JSON.parse(await readFile(await file.path(),"utf8"));
 assert.equal(report.records.length,1);
 assert.match(report.disclaimer,/UNVERIFIED/);
 await p.locator("#skillsSelect").selectOption("turn");
 await incomplete(p);await p.locator("#skillsSave").click();
 assert.equal(await p.locator(".journal-entry").count(),2);
 await p.locator(".journal-entry").first().locator("button").click();
 assert.equal(await p.locator(".journal-entry").count(),1,"per-record deletion");
 await p.locator("#skillsClearJournal").click();
 assert.equal(await p.locator(".journal-entry").count(),1,"first click must not delete");
 assert.match(await p.locator("#skillsClearJournal").textContent(),/Confirm/);
 await p.locator("#skillsClearJournal").click();
 assert.equal(await p.locator(".journal-entry").count(),0);
 assert.equal(await p.evaluate(k=>localStorage.getItem(k),storageKey),null,"clear removes local storage key");
 await p.close();
 const phone=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 phone.on("pageerror",e=>errors.push("phone: "+e.message));
 await phone.goto(url,{waitUntil:"load"});
 await phone.locator("#skillsPanel").waitFor({state:"visible"});
 await phone.locator("#skillsSelect").selectOption("flap");
 await incomplete(phone);
 await phone.locator("#skillsSave").tap();
 assert.equal(await phone.locator(".journal-entry").count(),1);
 await phone.reload({waitUntil:"load"});
 assert.equal(await phone.locator(".journal-entry").count(),1);
 assert.deepEqual(errors,[],"no page exceptions");
 await phone.close();
 console.log("Journal browser checks passed: explicit consent save, persistence, rubric feedback, export, individual deletion, two-step clear, and phone touch.");
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
