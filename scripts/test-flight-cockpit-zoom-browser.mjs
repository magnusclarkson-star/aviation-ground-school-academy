import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const url=pathToFileURL(path.resolve('flight-sim.html')).href;
const errors=[];
try{
 const desktop=await browser.newPage({viewport:{width:1200,height:900}});
 desktop.on('pageerror',e=>errors.push('desktop '+e.message));
 await desktop.goto(url,{waitUntil:'load'});
 const gauge=desktop.locator('#cockpitVisualPanel .cockpit-gauge').first();
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),false);
 await gauge.click();
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),true,'tap gauge opens an enlarged live instrument');
 assert.match(await desktop.locator('#cockpitZoomTitle').textContent(),/AIRSPEED/);
 assert.equal(await desktop.locator('#cockpitZoomContent .cockpit-gauge').count(),1);
 await desktop.locator('#startApproach').click();
 await desktop.waitForTimeout(300);
 assert.equal(
  await desktop.locator('#cockpitZoomContent [data-live-value="speed"]').textContent(),
  await desktop.locator('#cockpitVisualPanel [data-live-value="speed"]').textContent(),
  'zoomed instrument keeps updating from the same flight model');
 await desktop.locator('#cockpitZoomClose').click();
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),false);
 const pad=desktop.locator('#controlPad');
 const baseHeight=await pad.evaluate(el=>el.getBoundingClientRect().height);
 await desktop.locator('#cockpitTouchScale').selectOption('large');
 assert.ok(await pad.evaluate(el=>el.getBoundingClientRect().height)>baseHeight+20,'larger thumb control option changes real pad size');
 assert.equal(await desktop.locator('#cockpitExtraControls').isVisible(),false,'extra controls hidden until expanded');
 await desktop.locator('#cockpitControlFocusToggle').click();
 assert.equal(await desktop.locator('#cockpitStation').getAttribute('data-control-focus'),'expanded');
 assert.equal(await desktop.locator('#cockpitExtraControls').isVisible(),true,'expanded cockpit adds extra thumb buttons');
 const oldPower=Number(await desktop.locator('#power').inputValue());
 await desktop.locator('#cockpitPowerUp').click();
 assert.equal(Number(await desktop.locator('#power').inputValue()),Math.min(100,oldPower+5));
 const flapBefore=Number(await desktop.locator('#flaps').inputValue());
 await desktop.locator('#cockpitFlapsUp').click();
 assert.equal(Number(await desktop.locator('#flaps').inputValue()),Math.min(30,flapBefore+10));
 assert.equal(await desktop.locator('#cockpitControlFocusToggle').getAttribute('aria-pressed'),'true');
 assert.equal(await desktop.locator('#cockpitStation').evaluate(el=>el.contains(document.getElementById('leftRudder'))),true);
 await desktop.locator('#cockpitTouchSensitivity').selectOption('1.3');
 assert.equal(await desktop.locator('#cockpitTouchSensitivity').inputValue(),'1.3');
 await desktop.locator('#cockpitControlFocusToggle').click();
 assert.equal(await desktop.locator('#cockpitStation').getAttribute('data-control-focus'),'normal');
 await desktop.locator('#cockpitAircraftSelect').selectOption('f35');
 await desktop.locator('#cockpitVisualPanel .cockpit-mfd').first().click();
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),true,'fighter display zoom is live');
 assert.equal(await desktop.locator('#cockpitZoomContent .cockpit-mfd').count(),1);
 await desktop.locator('#cockpitAircraftSelect').selectOption('r44');
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),false,'switching aircraft clears old display zoom');
 assert.equal(await desktop.locator('#collectivePanel').isVisible(),true);
 await desktop.locator('#cockpitControlFocusToggle').click();
 assert.equal(await desktop.locator('#cockpitExtraControls').isVisible(),true);
 assert.equal(await desktop.locator('#cockpitFlapsUp').isVisible(),false,'no flap stepper on Robinson-style helicopter');
 const collectiveBefore=Number(await desktop.locator('#collective').inputValue());
 await desktop.locator('#cockpitPowerUp').click();
 assert.equal(Number(await desktop.locator('#collective').inputValue()),Math.min(100,collectiveBefore+5));
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on('pageerror',e=>errors.push('phone '+e.message));
 await phone.goto(url,{waitUntil:'load'});
 assert.equal(await phone.locator('#cockpitStation').getAttribute('data-orientation'),'portrait');
 assert.equal(await phone.locator('#cockpitStation').getAttribute('data-control-focus'),'normal');
 await phone.locator('#controlPad').tap();
 assert.equal(await phone.locator('#cockpitStation').getAttribute('data-control-focus'),'expanded',
  'one finger touching control expands on-cockpit steering and pedal area');
 assert.equal(await phone.locator('#cockpitExtraControls').isVisible(),true);
 assert.ok(await phone.locator('#cockpitPowerUp').isVisible());
 await phone.locator('#cockpitTouchScale').selectOption('large');
 const expandedHeight=await phone.locator('#controlPad').evaluate(el=>el.getBoundingClientRect().height);
 assert.ok(expandedHeight>=150,'expanded touch controls are larger than initial 390px layout');
 const inCockpit=await phone.evaluate(()=>{
  const c=document.getElementById('cockpitStation');
  return ['controlPad','leftRudder','rightRudder','power'].every(id=>c.contains(document.getElementById(id)));
 });
 assert.equal(inCockpit,true,'no controls duplicated or moved away from the instruments');
 await phone.locator('#cockpitControlFocusToggle').tap();
 assert.equal(await phone.locator('#cockpitStation').getAttribute('data-control-focus'),'normal');

 await phone.setViewportSize({width:844,height:390});
 await phone.waitForTimeout(100);
 assert.equal(await phone.locator('#cockpitStation').getAttribute('data-orientation'),'landscape');
 assert.match(await phone.locator('#cockpitRotationStatus').textContent(),/Landscape cockpit active/);
 const landscape=await phone.evaluate(()=>{
  const panel=document.querySelector('#cockpitVisualPanel').getBoundingClientRect();
  const grip=document.querySelector('#controlPad').getBoundingClientRect();
  return {noOverflow:document.documentElement.scrollWidth<=innerWidth+2,
   gaugesX:panel.left,gaugesWidth:panel.width,gripX:grip.left,gripWidth:grip.width,
   grid:getComputedStyle(document.querySelector('#cockpitMain')).gridTemplateColumns};
 });
 assert.equal(landscape.noOverflow,true,'flipped phone has no horizontal scroll');
 assert.ok(landscape.gripX>landscape.gaugesX,'landscape flight controls sit next to gauges');
 assert.ok(landscape.gripWidth>50&&landscape.gaugesWidth>140);
 await phone.locator('#cockpitAircraftSelect').selectOption('fa18');
 assert.equal(await phone.locator('#cockpitStation').getAttribute('data-orientation'),'landscape');
 assert.ok(await phone.locator('#cockpitVisualPanel .cockpit-mfd').first().isVisible());

 await phone.setViewportSize({width:390,height:844});
 await phone.waitForTimeout(100);
 assert.equal(await phone.locator('#cockpitStation').getAttribute('data-orientation'),'portrait');
 assert.equal(await phone.locator('#cockpitTouchScale').inputValue(),'large','user control size does not reset on rotation');
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[],'no JS errors while zooming, enlarging or rotating');
 console.log('Cockpit interactions passed: live tap-to-zoom gauges and fighter MFDs; touch-to-expand, scale and sensitivity; portrait/landscape rotation.');
} finally {await browser.close();}
