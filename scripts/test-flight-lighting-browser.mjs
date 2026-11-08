import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:[
 '--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader'
]});
const url=pathToFileURL(path.resolve('flight-sim.html')).href;
const errors=[];
const pixel2d=page=>page.locator('#outsideView').evaluate(c=>
 Array.from(c.getContext('2d').getImageData(16,16,1,1).data).slice(0,3));
const pixel3d=page=>page.locator('#outsideView3D').evaluate(c=>{
 const gl=c.getContext('webgl2');if(!gl||gl.isContextLost())return null;
 const result=new Uint8Array(4);
 gl.readPixels(Math.floor(c.width/2),Math.max(0,c.height-16),1,1,gl.RGBA,gl.UNSIGNED_BYTE,result);
 return Array.from(result).slice(0,3);
});
try{
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on('pageerror',e=>errors.push(e.message));
 await phone.goto(url,{waitUntil:'load'});
 assert.equal(await phone.locator('#lightingMode').inputValue(),'day');
 await phone.locator('#visualMode').selectOption('2d');
 await phone.locator('#pauseFlight').click();
 const originalSpeed=await phone.locator('#readSpeed').textContent();
 const originalHeading=await phone.locator('#readHeading').textContent();
 const day=await pixel2d(phone);
 await phone.locator('#lightingMode').selectOption('golden');
 const evening=await pixel2d(phone);
 assert.notDeepEqual(day,evening,'2D evening palette must visibly change the outside view');
 assert.match(await phone.locator('#lightingStatus').textContent(),/Warm evening selected/);
 await phone.locator('#lightingMode').selectOption('dusk');
 const dusk=await pixel2d(phone);
 assert.notDeepEqual(dusk,evening,'2D dusk palette must visibly differ from evening');
 assert.notDeepEqual(dusk,day,'2D dusk palette must differ from daylight');
 assert.match(await phone.locator('#lightingStatus').textContent(),/instruments and flight dynamics unchanged/);
 assert.equal(await phone.locator('#readSpeed').textContent(),originalSpeed);
 assert.equal(await phone.locator('#readHeading').textContent(),originalHeading);
 assert.equal(await phone.locator('#miniAttitude').isVisible(),true);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no horizontal phone overflow');
 await phone.locator('#lightingMode').selectOption('day');
 assert.deepEqual(await pixel2d(phone),day,'return to daylight must recover initial 2D palette');
 // GPU-based scenery is optional, but when available its sky responds too.
 await phone.locator('#visualMode').selectOption('3d');
 if(await phone.locator('#outsideView3D').isVisible()){
  const skyDay=await pixel3d(phone);
  await phone.locator('#lightingMode').selectOption('golden');
  await phone.waitForTimeout(160);
  const skyGold=await pixel3d(phone);
  assert.ok(skyDay&&skyGold,'GPU sky readback must work if renderer is active');
  assert.notDeepEqual(skyDay,skyGold,'WebGL2 sky must change with selected preset');
  await phone.locator('#lightingMode').selectOption('dusk');
  await phone.waitForTimeout(160);
  const skyDusk=await pixel3d(phone);
  assert.notDeepEqual(skyGold,skyDusk,'WebGL2 dusk should differ from golden hour');
 }else{
  assert.equal(await phone.locator('#outsideView').isVisible(),true,'2D fallback remains available');
 }
 assert.deepEqual(errors,[]);
 await phone.close();
 console.log('Optional 2D/3D fictional lighting and mobile instrument visibility passed.');
}finally{await browser.close();}
