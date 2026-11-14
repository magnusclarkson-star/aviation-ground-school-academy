import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {chromium} from "playwright";

const root=process.cwd();
const allowed=new Set(["academy-coursebook.html","academy-coursebook.css","academy-coursebook.js","academy-coursebook-data.js","academy-coursebook-depth-a.js","academy-coursebook-depth-b1.js","academy-coursebook-depth-b2.js","academy-coursebook-depth-model.js","academy-coursebook-depth-ui.js","academy-coursebook-illustrations.js","academy-coursebook-pictorial-ui.js","academy-approved-visuals.js","academy-approved-visuals-ui.js","academy-original-picture-atlas.js","academy-original-picture-atlas-ui.js","academy-coursebook-visual-lessons.js","academy-coursebook-visual-ui.js","academy-coursebook-chapters-a.js","academy-coursebook-chapters-b.js","academy-coursebook-chapters-c.js","academy-coursebook-chapters.js","academy-coursebook-chapter-ui.js","academy-coursebook-layout-v2.css","academy-coursebook-focus-v3.css","academy-coursebook-classic-v4.css","academy-coursebook-classic-v4.js","academy-coursebook-layout-v2.js","academy-approved-visual-gallery.html","academy-certificate-gallery.html","academy-certificate-gallery.css","academy-certificate-gallery.js","assets/lecture-visuals/ground-school-visuals-12-topic.webp","assets/lecture-visuals/aviation-learning-overview.webp","assets/lecture-visuals/aviation-real-world-photographs.webp","assets/lecture-visuals/illustrated-cessna-structures-lecture.webp","academy-brand.js","academy-certificate-ui.mjs","academy-certificate-core.mjs","academy-certificate-eligibility.mjs"]);
for(const [prefix,parts] of [["formal",7],["scout",5],["enthusiast",5]])
 for(let i=0;i<parts;i++)allowed.add("assets/certificates/original-"+prefix+".part"+String(i).padStart(2,"0")+".txt");
const server=createServer(async(req,res)=>{
 const name=new URL(req.url,"http://localhost").pathname.slice(1);
 if(!allowed.has(name)){res.writeHead(404);res.end();return}
 try{
  const bytes=await readFile(path.join(root,name));
  res.writeHead(200,{"Content-Type":(name.endsWith(".js")||name.endsWith(".mjs"))?"text/javascript":name.endsWith(".css")?"text/css":name.endsWith(".webp")?"image/webp":"text/html"});
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
 assert.equal(await desktop.locator("#lessonReading .lesson-pictorial").count(),1);
 assert.equal(await desktop.locator("#lessonReading .approved-visual-figure").count(),1);
 assert.equal(await desktop.locator(".visual-manual-cover").count(),1);
 assert.equal(await desktop.locator(".scenic-hero").count(),1);
 assert.equal(await desktop.locator(".quick-controls").count(),1);
 assert.equal(await desktop.locator(".notice-compact").count(),1);
 assert.match(await desktop.locator(".scenic-hero .eyebrow").textContent(),/compact reader v2/i);
 assert.match(await desktop.locator(".scenic-hero .eyebrow").textContent(),/focus layout v3/i);
 assert.equal(await desktop.locator(".scenic-hero").isVisible(),false);
 assert.ok((await desktop.locator(".site-head").boundingBox()).height<=112,
  "Owner-approved banner should occupy one row, not four");
 assert.ok(await desktop.evaluate(()=>getComputedStyle(document.querySelector(".site-head")).backgroundImage.includes("illustrated-cessna-structures-lecture.webp")),
  "Site banner must use the original full-width Academy design");
 assert.ok(await desktop.evaluate(()=>[...document.styleSheets].some(s=>s.href?.includes("academy-coursebook-focus-v3.css"))),
  "Actual browser must apply the V3 stylesheet");
 assert.equal(await desktop.locator(".lesson-tools-collapse").isVisible(),true);
 assert.equal(await desktop.locator(".lesson-tools-collapse").getAttribute("open"),null);
 const readerPanel=await desktop.locator('[aria-label="Lesson reading and self-check"]').boundingBox();
 assert.ok(readerPanel.width>=850,"Textbook reader should use the available 1280px desktop width");
 assert.ok(readerPanel.y<410,"Module title and teaching content should begin near top of screen");
 assert.ok(readerPanel.y<275,"Focused coursebook must reclaim the first desktop viewport");
 assert.ok(await desktop.evaluate(()=>parseFloat(getComputedStyle(document.querySelector("#moduleList button strong")).fontSize)>=13),
  "Desktop module titles must no longer be faint tiny labels");
 assert.ok(await desktop.evaluate(()=>parseFloat(getComputedStyle(document.querySelector("#moduleList button .module-note")).fontSize)>=12),
  "Module supporting labels must remain legible");
 const contrast=await desktop.evaluate(()=>{
  const rgba=s=>{const m=s.match(/[\d.]+/g);return m.slice(0,3).map(Number)};
  const lum=c=>rgba(c).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4)
   .reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const ratio=(text,background)=>{const a=lum(getComputedStyle(document.querySelector(text)).color);
   const b=lum(getComputedStyle(document.querySelector(background)).backgroundColor);
   return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  return {notes:ratio(".textbook-prose p",".academy-textbook-chapter"),
   advanced:ratio(".deep-lesson p",".deep-lesson"),
   introHeading:ratio(".textbook-course-intro h3",".textbook-course-intro")};
 });
 assert.ok(contrast.notes>=7,"Core textbook text must have strong contrast: "+JSON.stringify(contrast));
 assert.ok(contrast.advanced>=7,"Advanced lesson text must have strong contrast: "+JSON.stringify(contrast));
 assert.ok(contrast.introHeading>=4.5,"Course note headings must be legible: "+JSON.stringify(contrast));
 assert.equal(await desktop.locator(".scenic-gold-strip").count(),0); // Retired unused banner row
 assert.ok((await desktop.locator(".hero-scene").evaluate(n=>getComputedStyle(n).backgroundImage)).includes("aviation-real-world-photographs.webp"));
 assert.equal(await desktop.locator(".textbook-course-intro").count(),1);
 assert.equal(await desktop.locator("#lessonReading .academy-textbook-chapter").count(),3);
 assert.equal(await desktop.locator("#lessonReading .textbook-worked-case").count(),3);
 assert.equal(await desktop.locator("#lessonReading .textbook-glossary dt").count(),6);
 assert.equal(await desktop.locator(".textbook-prose p").count(),6);
 assert.match(await desktop.locator(".textbook-course-intro").textContent(),/additional original textbook instruction/i);
 await desktop.locator(".textbook-selfcheck>summary").first().click();
 assert.equal(await desktop.locator(".textbook-selfcheck").first().getAttribute("open"),"");
 assert.equal(await desktop.locator("#lessonReading article.visual-manual-section").count(),3);
 assert.equal(await desktop.locator(".visual-lesson-study").count(),3);
 assert.equal(await desktop.locator(".visual-lesson-picture").count(),3);
 assert.equal(await desktop.locator("#visualSectionNavigation button").count(),3);
 assert.match(await desktop.locator(".visual-manual-cover>h3").textContent(),/orientation and safety culture/i);
 assert.ok((await desktop.locator(".visual-expanded-explanation").first().textContent()).length>300);
 await desktop.locator(".visual-observation-check>summary").first().click();
 assert.equal(await desktop.locator(".visual-observation-check").first().getAttribute("open"),"");
 const firstDetail=desktop.locator(".visual-detail-canvas").first();
 await firstDetail.scrollIntoViewIfNeeded();
 await desktop.waitForFunction(()=>document.querySelector(".visual-detail-canvas").width>420);
 await desktop.locator(".visual-detail-trigger").first().click();
 assert.equal(await desktop.locator("#visualLessonZoom").isVisible(),true);
 assert.equal(await desktop.locator("#visualLessonZoom canvas").evaluate(c=>c.width>0&&c.height>0),true);
 await desktop.locator("#visualLessonZoom button").click();
 assert.equal(await desktop.locator("#visualLessonZoom").isVisible(),false);

 assert.equal(await desktop.locator(".related-original-pictures").count(),1);
 await desktop.locator(".related-original-pictures>summary").click();
 await desktop.locator(".related-original-card").first().waitFor({state:"visible"});
 assert.ok(await desktop.locator(".related-original-card").count()>=2,"Other previously shown visual panels must appear inside the lesson");

 assert.match(await desktop.locator(".approved-visual-heading h4").first().textContent(),/original illustrated aviation/i);
 assert.equal(await desktop.locator("#lessonReading .academy-reference-photo").count(),0);
 const displayed=desktop.locator(".approved-picture-trigger img").first();
 await displayed.scrollIntoViewIfNeeded();
 await displayed.evaluate(img=>img.decode());
 assert.equal(await displayed.evaluate(img=>img.complete&&img.naturalWidth>=1000),true);
 assert.match(await displayed.getAttribute("src"),/ground-school-visuals-12-topic\.webp$/);
 await desktop.locator(".approved-picture-trigger").first().click();
 assert.equal(await desktop.locator("#approvedVisualLightbox").isVisible(),true);
 await desktop.locator("#approvedVisualLightbox button").click();
 assert.equal(await desktop.locator("#approvedVisualLightbox").isVisible(),false);
  assert.equal(await desktop.locator("#deepReading .pictorial-deep-link").count(),1);
 assert.match(await desktop.locator(".lesson-pictorial h4").textContent(),/learning pathway/i);
 assert.equal(await desktop.locator(".lesson-pictorial img").evaluate(img=>img.complete&&img.naturalWidth>0),true);
 await desktop.locator(".diagram-trigger").click();
 assert.equal(await desktop.locator("#academyDiagramDialog").isVisible(),true);
 assert.equal(await desktop.locator("#academyDiagramDialog img").evaluate(img=>img.complete&&img.naturalWidth>0),true);
 await desktop.locator("#academyDiagramDialog button").click();
 assert.equal(await desktop.locator("#academyDiagramDialog").isVisible(),false);
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
 await desktop.locator(".lesson-tools-collapse>summary").click();
 await desktop.locator("#route").selectOption("pilots");
 assert.match(await desktop.locator("#deepRouteFocus").textContent(),/Aspiring-pilot/);
 await desktop.locator('#moduleList button[data-module="meteorology"]').click();
 assert.match(await desktop.locator("#moduleTitle").textContent(),/weather/i);
 assert.equal(await desktop.locator("#lessonReading .academy-textbook-chapter").count(),3);
 assert.match(await desktop.locator(".textbook-prose p").first().textContent(),/atmosphere/i);
 await desktop.locator('#moduleList button[data-module="aircraft"]').click();
 assert.equal(await desktop.locator(".original-coursebook-plate").count(),1,
  "Aircraft lesson must present the owner's original Cessna coursebook");
 const plateRect=await desktop.locator(".original-plate-viewport").boundingBox();
 const teachingRect=await desktop.locator(".textbook-course-intro").boundingBox();
 assert.ok(plateRect.width>=480,"Desktop must preserve a large Cessna teaching picture");
 assert.ok(plateRect.x+plateRect.width<=teachingRect.x+8,
  "Desktop Cessna should sit beside substantial lesson content, not wasted space");
 assert.match(await desktop.locator(".original-plate-viewport img").getAttribute("src"),/illustrated-cessna-structures-lecture\.webp/);
 assert.equal(await desktop.locator(".visual-manual-cover").count(),1);
 await desktop.locator('#moduleList button[data-module="meteorology"]').click();
 assert.equal(await desktop.locator(".original-coursebook-plate").count(),0,
  "Module switch should not leave an unrelated aircraft plate");

 assert.equal(await desktop.locator(".textbook-glossary dt").count(),6);

 assert.equal(await desktop.locator(".visual-manual-cover").count(),1);
 assert.equal(await desktop.locator("#lessonReading article.visual-manual-section").count(),3);
 assert.equal(await desktop.locator(".visual-lesson-picture").count(),2);
 assert.match(await desktop.locator(".visual-manual-cover>h3").textContent(),/weather/i);
 assert.equal(await desktop.locator("#visualSectionNavigation button").count(),3);

 assert.equal(await desktop.locator("#lessonReading .lesson-pictorial").count(),1);
 assert.match(await desktop.locator(".lesson-pictorial h4").textContent(),/weather hazards/i);
 assert.equal(await desktop.locator("#lessonReading .approved-visual-figure").count(),1);
 assert.match(await desktop.locator(".approved-visual-heading h4").first().textContent(),/weather illustration/i);
 assert.match(await desktop.locator(".approved-cropped-picture").first().evaluate(x=>getComputedStyle(x).backgroundImage),/aviation-learning-overview\.webp/);
 assert.equal(await desktop.locator("#deepReading .academy-reference-photo").count(),0);
  assert.equal(await desktop.locator("#deepReading .pictorial-deep-link").count(),1);
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
 await desktop.locator(".lesson-tools-collapse>summary").click();
 await desktop.locator(".study-tools>summary").click();
 await desktop.locator("#clearRecord").click();
 assert.equal(await desktop.locator("#completionCelebration").isVisible(),false);
 assert.equal(await desktop.evaluate(()=>localStorage.getItem(window.AGSADeepCoursebook.KEY)),null);
 assert.deepEqual(errors,[]);
 await desktop.close();

 const wide=await browser.newPage({viewport:{width:1536,height:900}});
 wide.on("pageerror",e=>errors.push("wide: "+e.message));
 await wide.goto(base+"?module=aircraft",{waitUntil:"load"});
 await wide.locator(".original-coursebook-plate").waitFor({state:"visible"});
 const widePlate=await wide.locator(".original-coursebook-plate").boundingBox();
 const wideIntro=await wide.locator(".textbook-course-intro").boundingBox();
 assert.ok(widePlate.width>=540,"Desktop must show a large original Cessna rather than a small thumbnail");
 assert.ok(widePlate.x+widePlate.width<=wideIntro.x+8,
  "Desktop reading content must use the space next to the original Cessna plate");
 assert.ok(wideIntro.width>=360,"Real teaching notes must be readable beside the illustration");
 assert.ok(await wide.locator(".original-plate-viewport img").evaluate(img=>img.complete&&img.naturalWidth>=1000));
 await wide.close();

 const standard=await browser.newPage({viewport:{width:1365,height:850}});
 standard.on("pageerror",e=>errors.push("certificate: "+e.message));
 await standard.goto("http://127.0.0.1:"+server.address().port+"/academy-certificate-gallery.html",{waitUntil:"load"});
 assert.equal(await standard.locator(".certificate-card").count(),3,
  "All three approved original certificate images must be restored");
 assert.equal(await standard.locator('input[type="file"]').count(),0);
 for(const key of ["formal","scout","enthusiast"]){
  const card=standard.locator('[data-original="'+key+'"]');
  await card.locator(".load-status").getByText(/verified and displayed/).waitFor({timeout:30000});
  assert.ok(await card.locator(".original-artwork").evaluate(img=>img.complete&&img.naturalWidth===1491&&img.naturalHeight===1055),
   "Exact original approved PNG must render at full resolution: "+key);
  assert.equal(await card.locator("[data-print]").isDisabled(),false);
  assert.match(await card.textContent(),/SAMPLE · NOT ISSUED/);
 }
 assert.ok((await standard.locator('[data-original="formal"] .sheet-wrap').boundingBox()).width>=800,
  "Desktop should use the available area for original certificate art");
 await standard.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on("pageerror",e=>errors.push("phone: "+e.message));
 await phone.goto(base+"?path=scouts&module=rotorcraft",{waitUntil:"load"});
 assert.match(await phone.locator("#deepReading .deep-lesson").nth(0).textContent(),/rotor/i);
 assert.equal(await phone.locator(".textbook-course-intro").count(),1);
 assert.equal(await phone.locator("#mobileModuleJump option").count(),await phone.locator("#moduleList button").count());
 assert.equal(await phone.locator("#mobileModuleJump").isVisible(),true);
 assert.equal(await phone.locator("#moduleList").isVisible(),false);
 assert.equal(await phone.locator(".scenic-hero").isVisible(),false);
 const mobileHeader=await phone.locator(".site-head").boundingBox();
 assert.ok(mobileHeader.height>=102&&mobileHeader.height<=116,
  "Phone needs the designed compact original-artwork banner, not a cropped photo strip");
 assert.ok(await phone.evaluate(()=>{
  const head=document.querySelector(".site-head");
  const image=getComputedStyle(head).backgroundImage;
  return image.includes("illustrated-cessna-structures-lecture.webp")
   &&!image.includes("aviation-real-world-photographs.webp");
 }),"Phone and desktop must use exactly the same original Cessna coursebook artwork");
 assert.equal(await phone.locator(".site-head .brand-name").isVisible(),true);
 assert.equal(await phone.locator(".site-head .brand-subtitle").isVisible(),true);
 assert.match(await phone.locator(".site-head .brand-name").textContent(),/AVIATION GROUND SCHOOL ACADEMY/);
 assert.ok(await phone.evaluate(()=>{
  const brand=document.querySelector(".site-head .brand").getBoundingClientRect();
  const menu=document.querySelector(".site-head .site-menu>summary").getBoundingClientRect();
  const logo=document.querySelector(".site-head .academy-logo-header").getBoundingClientRect();
  return brand.width>170&&brand.right<=menu.left+2&&logo.right<=brand.left+4;
 }),"Mobile brand, original logo and Academy menu must not overlap");
 assert.equal(await phone.locator(".site-head .menu-short").isVisible(),true);
 await phone.locator(".site-head .site-menu>summary").tap();
 assert.equal(await phone.locator(".site-head nav").isVisible(),true);
 await phone.locator(".site-head .site-menu>summary").tap();
 assert.equal(await phone.locator(".site-head nav").isVisible(),false);

 assert.equal(await phone.locator("#lessonReading .academy-textbook-chapter").count(),3);
 assert.equal(await phone.locator(".textbook-worked-case").count(),3);
 assert.equal(await phone.locator(".textbook-glossary dt").count(),6);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),
   "Long textbook modules and scenic gold header must fit 390px phones");

 assert.equal(await phone.locator(".visual-manual-cover").count(),1);
 assert.equal(await phone.locator("#lessonReading article.visual-manual-section").count(),3);
 assert.equal(await phone.locator(".visual-lesson-picture").count(),2);
 await phone.locator(".visual-detail-trigger").first().tap();
 assert.equal(await phone.locator("#visualLessonZoom").isVisible(),true);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),
   "Visual first lesson and enlarged detail must fit mobile viewport");
 await phone.locator("#visualLessonZoom button").tap();
 assert.equal(await phone.locator("#visualLessonZoom").isVisible(),false);

 assert.equal(await phone.locator("#lessonReading .lesson-pictorial").count(),1);
 assert.equal(await phone.locator("#lessonReading .approved-visual-figure").count(),1);
 assert.equal(await phone.locator(".related-original-pictures").count(),1);
 await phone.locator(".related-original-pictures>summary").tap();
 await phone.locator(".related-original-card").first().waitFor({state:"visible"});
 assert.ok(await phone.locator(".related-original-card").count()>=2,"Phone needs other original pictures for this subject");

 assert.match(await phone.locator(".approved-visual-heading h4").first().textContent(),/helicopter/i);
 assert.match(await phone.locator(".approved-cropped-picture").first().evaluate(x=>getComputedStyle(x).backgroundImage),/aviation-learning-overview\.webp/);
 await phone.locator(".approved-picture-trigger").first().tap();
 assert.equal(await phone.locator("#approvedVisualLightbox").isVisible(),true);
 await phone.locator("#approvedVisualLightbox button").tap();
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),
  "Previously shown aviation artwork must not cause horizontal phone overflow");
  assert.match(await phone.locator(".lesson-pictorial h4").textContent(),/helicopter/i);
 await phone.locator(".diagram-trigger").tap();
 assert.equal(await phone.locator("#academyDiagramDialog").isVisible(),true);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),
   "Enlarged pictorial must not make the 390px phone scroll horizontally");
 await phone.locator("#academyDiagramDialog button").tap();
 assert.equal(await phone.locator("#academyDiagramDialog").isVisible(),false);
 assert.equal(await phone.locator("#deepQuestions fieldset").count(),3);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),"390px phone must not scroll horizontally");
 await correctAdvanced(phone);
 assert.match(await phone.locator("#deepFeedback").textContent(),/4\/4 correct/);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2));
 await phone.locator("#mobileModuleJump").selectOption("aircraft");
 assert.match(await phone.locator("#moduleTitle").textContent(),/aircraft/i);
 assert.equal(await phone.locator(".academy-textbook-chapter").count(),3);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),
  "Compact mobile coursebook must never overflow horizontally");
 await phone.close();

 const smallPhone=await browser.newPage({viewport:{width:320,height:700},isMobile:true,hasTouch:true});
 smallPhone.on("pageerror",e=>errors.push("small-phone: "+e.message));
 await smallPhone.goto(base+"?module=aircraft",{waitUntil:"load"});
 assert.ok(await smallPhone.evaluate(()=>{
  const brand=document.querySelector(".site-head .brand").getBoundingClientRect();
  const menu=document.querySelector(".site-head .site-menu>summary").getBoundingClientRect();
  const logo=document.querySelector(".site-head .academy-logo-header").getBoundingClientRect();
  const image=getComputedStyle(document.querySelector(".site-head")).backgroundImage;
  return brand.right<=menu.left+2&&logo.right<=brand.left+4
   &&image.includes("illustrated-cessna-structures-lecture.webp");
 }),"320px phone must retain original desktop artwork without title/menu collision");
 assert.ok(await smallPhone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  "Phone header must never cause horizontal scrolling on a 320px handset");
 await smallPhone.close();
 // Inspect the dedicated picture atlas at 390px width: every original can be reached
 // even when the large source poster is hard to read inside a small coursebook view.
 const gallery=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 gallery.on("pageerror",e=>errors.push("gallery: "+e.message));
 await gallery.goto("http://127.0.0.1:"+server.address().port+"/academy-approved-visual-gallery.html",{waitUntil:"load"});
 assert.equal(await gallery.locator(".gallery-original-link").count(),4);
 assert.equal(await gallery.locator(".atlas-item").count(),33);
 assert.equal(await gallery.locator(".atlas-item:visible").count(),33);
 await gallery.locator("#atlasFilters button").filter({hasText:"Four aviation photographs"}).tap();
 assert.equal(await gallery.locator(".atlas-item:visible").count(),4);
 await gallery.locator(".atlas-item:visible .atlas-picture-button").first().tap();
 assert.equal(await gallery.locator("#atlasZoomDialog").isVisible(),true);
 assert.ok(await gallery.locator("#atlasZoomDialog canvas").evaluate(c=>c.width>0&&c.height>0));
 await gallery.locator("#atlasZoomDialog button").tap();
 assert.ok(await gallery.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),
  "All 33 source-cropped pictures must fit the phone display");
 await gallery.close();
 assert.deepEqual(errors,[]);
 console.log("Illustrated Academy browser passed: 12 subject diagrams with touch enlargement, desktop/Android-sized touch, scenarios, local revision, routes, 24-question capstone, unsigned export, deletion and self-study milestone.");
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
