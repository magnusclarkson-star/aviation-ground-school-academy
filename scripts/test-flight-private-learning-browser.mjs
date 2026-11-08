import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const url=file=>pathToFileURL(path.resolve(file)).href;
const errors=[];
try{
 const desktop=await browser.newPage({viewport:{width:1180,height:820}});
 desktop.on('pageerror',err=>errors.push('debrief: '+err.message));
 await desktop.goto(url('simulator-debrief.html'),{waitUntil:'load'});
 assert.equal(await desktop.locator('#traceImportSummary').isVisible(),false);
 const trace={schema:'academy.synthetic-flight-trace.v1',synthetic:true,mode:'airplane',observations:[
  {t:0,phase:'roll',speedKt:18,altitudeM:0,bankDeg:0,email:'private@example.com'},
  {t:1,phase:'climb',speedKt:35,altitudeM:10,bankDeg:3,username:'private'}
 ]};
 await desktop.locator('#traceImport').setInputFiles({name:'synthetic-flight.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(trace))});
 await phone.waitForFunction(()=>Number((document.querySelector('#traceStatus')?.textContent||'').match(/[0-9]+ samples/)?.[0]?.split(' ')[0]||0)>=2,null,{timeout:12000});
 assert.equal(await desktop.locator('#traceImportSummary').isVisible(),true);
 const facts=await desktop.locator('#traceImportFacts').textContent();
 assert.match(facts,/Synthetic height range: 0 to 10 m/);
 assert.doesNotMatch(facts,/private@example.com/);
 await desktop.locator('#traceImportClear').click();
 assert.equal(await desktop.locator('#traceImportSummary').isVisible(),false);
 await desktop.locator('#traceImport').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{}')});
 await desktop.waitForFunction(()=>document.querySelector('#traceImportStatus').textContent.includes('not an Academy synthetic flight trace'));
 assert.equal(await desktop.locator('#traceImportSummary').isVisible(),false);
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on('pageerror',err=>errors.push('phone: '+err.message));
 await phone.goto(url('flight-sim.html'),{waitUntil:'load'});
 assert.equal(await phone.locator('#traceStart').isDisabled(),false);
 assert.equal(await phone.locator('#traceReplay').isDisabled(),true);
 await phone.locator('#traceStart').click();
 await phone.waitForFunction(()=>/\\b[2-9] samples\\b|\\b[1-9]\\d+ samples\\b/.test(document.querySelector('#traceStatus')?.textContent||''),null,{timeout:12000});
 await phone.locator('#traceStop').click();
 await phone.locator('#traceReplay').click();
 assert.equal(await phone.locator('#traceReplayPanel').isVisible(),true);
 assert.equal(await phone.locator('#tracePlayPause').isDisabled(),false);
 assert.equal(await phone.locator('#tracePlayPause').getAttribute('aria-pressed'),'false');
 await phone.locator('#tracePlayPause').click();
 assert.equal(await phone.locator('#tracePlayPause').getAttribute('aria-pressed'),'true');
 await phone.waitForFunction(()=>Number(document.querySelector('#traceReplayIndex').value)>=1,null,{timeout:4500});
 await phone.locator('#tracePlayPause').click();
 assert.equal(await phone.locator('#tracePlayPause').getAttribute('aria-pressed'),'false');
 await phone.locator('#traceClear').click();
 assert.equal(await phone.locator('#traceReplayPanel').isVisible(),false);
 assert.equal(await phone.locator('#traceReplay').isDisabled(),true);
 assert.deepEqual(errors,[]);
 await phone.close();
 console.log('Private simulator replay and manual local debrief import browser acceptance passed.');
}finally{await browser.close();}
