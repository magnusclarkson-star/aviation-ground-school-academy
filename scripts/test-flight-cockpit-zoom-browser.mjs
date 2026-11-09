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
 assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),false);
 assert.equal(await desktop.locator('#cockpitControlFocusToggle').count(),0,
  'no control-expansion toggle after learner requested instrument zoom only');
 assert.equal(await desktop.locator('#cockpitExtraControls').count(),0,
  'no extra automatic flight controls');
 const pad=desktop.locator('#controlPad');
 const originalSize=await pad.evaluate(el=>el.getBoundingClientRect().height);
 const relativeY=async(page,id)=>page.evaluate(id=>{
  const panel=document.querySelector('#cockpitMain').getBoundingClientRect();
  return document.querySelector(id).getBoundingClientRect().top-panel.top;
 },id);
 const controlPosition=await relativeY(desktop,'#controlPad');
 const pedalPosition=await relativeY(desktop,'#leftRudder');
 assert.ok(await desktop.locator('#cockpitVisualPanel [data-live-heading-card]').count()===1,
   'a rotating compass card replaces the old fake heading needle');
 assert.equal(await desktop.locator('#cockpitVisualPanel [data-live-alt-hundreds]').count(),1);
 assert.equal(await desktop.locator('#cockpitVisualPanel [data-live-alt-thousands]').count(),1);
 assert.equal(await desktop.locator('#cockpitVisualPanel [data-live-slip]').count(),1);
 const instrumentMechanics=await desktop.evaluate(()=>{
  const panel=document.querySelector('#cockpitVisualPanel');
  window.AGSACockpitIntegrated.paint(panel,{
   speedKt:82,groundSpeedKt:79,altitudeM:152.4,verticalMs:1,
   headingDeg:90,pitchDeg:5,rollDeg:0
  },{powerPct:70},{throttle:.75,collective:0,rudder:1},'c172',document);
  return {
   card:panel.querySelector('[data-live-heading-card]').getAttribute('transform'),
   hundreds:panel.querySelector('[data-live-alt-hundreds]').getAttribute('transform'),
   thousands:panel.querySelector('[data-live-alt-thousands]').getAttribute('transform'),
   slip:panel.querySelector('[data-live-slip]').getAttribute('cx')
  };
 });
 assert.equal(instrumentMechanics.card,'rotate(-90.00 50 50)');
 assert.equal(instrumentMechanics.hundreds,'rotate(180.00 50 50)');
 assert.equal(instrumentMechanics.thousands,'rotate(18.00 50 50)');
 assert.ok(Number(instrumentMechanics.slip)>58,'rudder moves slip ball');

 await desktop.locator('#cockpitVisualPanel .cockpit-info-dot').first().click();
 assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),true);
 assert.match(await desktop.locator('#cockpitInfoTitle').textContent(),/Airspeed/);
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),false,
  'instrument ⓘ button opens description without enlarging gauge');
 await desktop.locator('#cockpitInfoClose').click();
 await gauge.click({position:{x:65,y:75}});
 assert.equal(await desktop.locator('#cockpitZoomPanel').evaluate(el=>getComputedStyle(el).position),'absolute',
   'enlarged gauge floats over the dashboard rather than entering the layout');
 const shiftedPad=await relativeY(desktop,'#controlPad');
 const shiftedPedal=await relativeY(desktop,'#leftRudder');
 assert.ok(Math.abs(shiftedPad-controlPosition)<1,'zoom does not move centered yoke');
 assert.ok(Math.abs(shiftedPedal-pedalPosition)<1,'zoom does not move rudder pedals');
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),true,
  'tapping instrument face enlarges only that instrument');
 assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),false);
 assert.equal(await desktop.locator('#cockpitZoomContent .cockpit-gauge').count(),1);
 await desktop.locator('#startApproach').click();
 await desktop.waitForTimeout(300);
 assert.equal(
  await desktop.locator('#cockpitZoomContent [data-live-value="speed"]').textContent(),
  await desktop.locator('#cockpitVisualPanel [data-live-value="speed"]').textContent(),
  'enlarged instrument keeps updating with the flight model');
 await desktop.locator('#cockpitZoomClose').click();
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),false);

 await pad.click({position:{x:85,y:65}});
 assert.equal(await pad.evaluate(el=>el.getBoundingClientRect().height),originalSize,
  'touching or clicking flight controls does not enlarge them');
 assert.equal(await desktop.locator('#cockpitStation').getAttribute('data-control-focus'),null);
 assert.equal(await desktop.locator('#cockpitStation').evaluate(el=>el.contains(document.getElementById('leftRudder'))),true);
 await desktop.locator('[data-cockpit-help="controls"]').click();
 assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),true);
 assert.match(await desktop.locator('#cockpitInfoText').textContent(),/Yoke/);
 await desktop.locator('[data-cockpit-help="controls"]').click();
 assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),false,'tapping same info button closes it');

 await desktop.locator('#cockpitAircraftSelect').selectOption('f35');
 await desktop.locator('#cockpitVisualPanel .cockpit-mfd').first().click({position:{x:65,y:75}});
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),true,'fighter flight display enlarges');
 assert.equal(await desktop.locator('#cockpitZoomContent .cockpit-mfd').count(),1);
 await desktop.locator('#cockpitAircraftSelect').selectOption('r44');
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),false,'aircraft switching resets enlarged instrument');
 assert.equal(await desktop.locator('#collectivePanel').isVisible(),true);
 await desktop.locator('[data-cockpit-help="controls"]').click();
 assert.match(await desktop.locator('#cockpitInfoText').textContent(),/Cyclic/,'rotorcraft info is contextual');
 await desktop.keyboard.press('Escape');
 assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),false);
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on('pageerror',e=>errors.push('phone '+e.message));
 await phone.goto(url,{waitUntil:'load'});
 assert.equal(await phone.locator('#cockpitStation').getAttribute('data-orientation'),'portrait');
 const phonePad=phone.locator('#controlPad');
 const phoneSize=await phonePad.evaluate(el=>el.getBoundingClientRect().height);
 await phonePad.tap();
 assert.equal(await phonePad.evaluate(el=>el.getBoundingClientRect().height),phoneSize,
  'touching yoke does not expand flight control area');
 assert.equal(await phone.locator('#cockpitStation').getAttribute('data-control-focus'),null);
 assert.equal(await phone.locator('#cockpitExtraControls').count(),0);
 const phonePadPosition=await relativeY(phone,'#controlPad');
 await phone.locator('#cockpitVisualPanel .cockpit-info-dot').first().tap();
 assert.equal(await phone.locator('#cockpitInfoPanel').isVisible(),true);
 assert.equal(await phone.locator('#cockpitZoomPanel').isVisible(),false);
 await phone.locator('#cockpitInfoClose').tap();
 await phone.locator('#cockpitVisualPanel .cockpit-gauge').first().tap({position:{x:32,y:35}});
 assert.equal(await phone.locator('#cockpitZoomPanel').isVisible(),true);
 assert.equal(await phone.locator('#cockpitZoomPanel').evaluate(el=>getComputedStyle(el).position),'absolute');
 const phonePadAfterZoom=await relativeY(phone,'#controlPad');
 assert.ok(Math.abs(phonePadPosition-phonePadAfterZoom)<1,
  'phone instrument zoom never moves the yoke touch target');
 await phone.locator('#cockpitZoomClose').tap();
 const inCockpit=await phone.evaluate(()=>{
  const c=document.getElementById('cockpitStation');
  return ['controlPad','leftRudder','rightRudder','power'].every(id=>c.contains(document.getElementById(id)));
 });
 assert.equal(inCockpit,true,'instruments and active flight controls remain in the cockpit');

 await phone.setViewportSize({width:844,height:390});
 await phone.waitForTimeout(100);
 assert.equal(await phone.locator('#cockpitStation').getAttribute('data-orientation'),'landscape');
 const landscape=await phone.evaluate(()=>{
  const panel=document.querySelector('#cockpitVisualPanel').getBoundingClientRect();
  const grip=document.querySelector('#controlPad').getBoundingClientRect();
  return {noOverflow:document.documentElement.scrollWidth<=innerWidth+2,
   gaugesX:panel.left,gaugesWidth:panel.width,gripX:grip.left,gripWidth:grip.width};
 });
 assert.equal(landscape.noOverflow,true,'rotated phone fits without horizontal scrolling');
 assert.ok(landscape.gripX>landscape.gaugesX,'landscape shows controls next to gauges');
 assert.ok(landscape.gripWidth>50&&landscape.gaugesWidth>140);
 await phone.locator('#cockpitAircraftSelect').selectOption('fa18');
 assert.equal(await phone.locator('#cockpitStation').getAttribute('data-orientation'),'landscape');
 assert.ok(await phone.locator('#cockpitVisualPanel .cockpit-mfd').first().isVisible());
 await phone.setViewportSize({width:390,height:844});
 await phone.waitForTimeout(100);
 assert.equal(await phone.locator('#cockpitStation').getAttribute('data-orientation'),'portrait');
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[],'no desktop or phone runtime errors');
 console.log('Cockpit passed: instrument-only zoom, short contextual ⓘ help, unchanged touch controls, helicopter/fighter panels and phone rotation.');
}finally{await browser.close();}
