import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const url=pathToFileURL(path.resolve('flight-sim.html')).href;
try{
 const desktop=await browser.newPage({viewport:{width:1240,height:900}});
 desktop.on('pageerror',e=>errors.push('desktop '+e.message));
 await desktop.goto(url,{waitUntil:'load'});
 assert.equal(await desktop.locator('#cockpitAircraftSelect').inputValue(),'c172');
 assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),false,'help is hidden until learner taps ⓘ');
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),false,'instrument is normal size initially');
 assert.equal(await desktop.locator('#cockpitControlFocusToggle').count(),0,'no control expansion button');
 assert.equal(await desktop.locator('#cockpitExtraControls').count(),0,'no surprise additional control panels');
 await desktop.locator('[data-cockpit-help="controls"]').click();
 assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),true);
 assert.match(await desktop.locator('#cockpitInfoText').textContent(),/Yoke, stick or cyclic/);
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),false,'help does not enlarge instruments');
 await desktop.locator('#cockpitInfoClose').click();
 assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),false);
 await desktop.locator('#cockpitVisualPanel .cockpit-info-dot').first().click();
 assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),true,'instrument ⓘ opens a brief description');
 assert.match(await desktop.locator('#cockpitInfoTitle').textContent(),/Airspeed/);
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),false,'info icon does not enlarge gauge');
 await desktop.locator('#cockpitVisualPanel .cockpit-gauge').first().click({position:{x:65,y:75}});
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),true,'face tap enlarges instrument');
 assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),false,'enlarged gauge replaces help');
 await desktop.keyboard.press('Escape');
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),false,'Escape restores normal gauge');
 await desktop.locator('[data-cockpit-help="radio"]').click();
 assert.match(await desktop.locator('#cockpitInfoText').textContent(),/Listen to the controller/);
 await desktop.keyboard.press('Escape');
 assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),false);
 assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-gauge').count(),6);
 assert.deepEqual((await desktop.locator('#cockpitVisualPanel .cockpit-gauge-title').allTextContents()).slice(0,3),['AIRSPEED','ATTITUDE','ALTIMETER']);
 assert.deepEqual((await desktop.locator('#cockpitVisualPanel .cockpit-gauge-title').allTextContents()).slice(3),['TURN COORD.','HEADING','VERTICAL SPEED']);
 assert.equal(await desktop.locator('#controlPad').evaluate(el=>el.closest('#cockpitStation')!==null),true,'active yoke is INSIDE the cockpit, never duplicated');
 assert.equal(await desktop.locator('#leftRudder').evaluate(el=>el.closest('#cockpitStation')!==null),true,'rudder pedals are in the cockpit');
 assert.equal(await desktop.locator('#power').evaluate(el=>el.closest('#cockpitStation')!==null),true,'throttle is in cockpit');
 await desktop.locator('#startApproach').click();
 await desktop.waitForTimeout(350);
 assert.ok(Number(await desktop.locator('[data-live-value="alt"]').textContent())>150,'analog height follows flight model in feet');
 assert.ok(Number(await desktop.locator('#readAlt').textContent())>40,'original numeric height remains available');
 assert.ok(await desktop.locator('#miniAttitude').isVisible(),'legacy synthetic attitude remains present');
 await desktop.locator('#cockpitAircraftSelect').selectOption('r44');
 await desktop.locator('[data-cockpit-help="controls"]').click();
 assert.match(await desktop.locator('#cockpitInfoText').textContent(),/Cyclic/,'rotor controls help changes by aircraft');
 await desktop.locator('#cockpitInfoClose').click();
 assert.equal(await desktop.locator('#typeCyclic').getAttribute('aria-pressed'),'true');
 assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-gauge').count(),6);
 assert.match(await desktop.locator('#cockpitVisualPanel').textContent(),/DUAL TACH/);
 assert.match(await desktop.locator('#cockpitVisualPanel').textContent(),/MANIFOLD PROXY/);
 assert.equal(await desktop.locator('#collectivePanel').isVisible(),true);
 assert.equal(await desktop.locator('#flapPanel').isVisible(),false);
 assert.equal(await desktop.locator('#brake').isVisible(),false);
 for(const [id,expectedClass] of [['fa18','cockpit-mfd-triple'],['f22','cockpit-mfd-quad'],['f35','cockpit-mfd-panoramic'],['typhoon','cockpit-mfd-triple'],['su37','cockpit-mfd-dual']]){
  await desktop.locator('#cockpitAircraftSelect').selectOption(id);
  if(id==='f35'){
   await desktop.locator('#cockpitVisualPanel .cockpit-info-dot').first().click();
   assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),true);
   assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),false);
   await desktop.locator('#cockpitVisualPanel .cockpit-mfd').first().click({position:{x:65,y:65}});
   assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),true);
   assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),false);
   await desktop.locator('#cockpitZoomClose').click();
  }
  assert.equal(await desktop.locator('#typeStick').getAttribute('aria-pressed'),'true',id+' selects fighter stick');
  assert.equal(await desktop.locator('#cockpitStation').getAttribute('data-airframe'),id);
  assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-mfd-grid').count(),1);
  assert.ok(await desktop.locator('.'+expectedClass).count()>0,id+' unique layout');
  assert.equal(await desktop.locator('#cockpitJetHud').isVisible(),true);
  assert.match(await desktop.locator('#cockpitAircraftNotice').textContent(),/fictional trainer flight model/i);
  assert.equal(await desktop.locator('#cockpitVisualPanel').evaluate(el=>el.closest('#cockpitStation')!==null),true);
  assert.equal(await desktop.locator('#controlPad').evaluate(el=>el.closest('#cockpitStation')!==null),true);
 }
 await desktop.locator('#typeYoke').click();
 assert.equal(await desktop.locator('#cockpitAircraftSelect').inputValue(),'c172');
 assert.equal(await desktop.locator('#cockpitJetHud').isVisible(),false);
 await desktop.locator('#typeCyclic').click();
 assert.equal(await desktop.locator('#cockpitAircraftSelect').inputValue(),'r44');
 await desktop.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on('pageerror',e=>errors.push('phone '+e.message));
 await phone.goto(url,{waitUntil:'load'});
 assert.ok(await phone.locator('#cockpitVisualPanel .cockpit-gauge').first().isVisible());
 assert.ok(await phone.locator('#flightGrip').isVisible());
 const value=await phone.evaluate(()=>{
  const station=document.querySelector('#cockpitStation'),pad=document.querySelector('#controlPad'),
   pedals=document.querySelector('#rightRudder'),scene=document.querySelector('.scene-panel'),
   page=document.documentElement;
  const a=pad.getBoundingClientRect(),b=pedals.getBoundingClientRect(),c=station.getBoundingClientRect(),d=document.querySelector("#cockpitVisualPanel").getBoundingClientRect();
  return {sameCockpit:station.contains(pad)&&station.contains(pedals),
    noOverflow:page.scrollWidth<=innerWidth+2,scrollable:scene.scrollHeight>0,
    width:window.innerWidth,padX:a.x,pedalsX:b.x,stationX:c.x,
    padWidth:a.width,pedalsWidth:b.width,stageHeight:scene.getBoundingClientRect().height,
    gaugeY:d.y,padY:a.y,stickyScene:getComputedStyle(document.querySelector(".scene-shell")).position};
 });
 assert.equal(value.sameCockpit,true,'gauge panel, yoke and pedals share the same cockpit');
 assert.equal(value.noOverflow,true,'mobile cockpit has no horizontal overflow');
 assert.ok(value.padWidth>50&&value.pedalsWidth>20,'touch targets remain large enough');
 assert.ok(Math.abs(value.gaugeY-value.padY)<85,'instruments and control pad share the same glance row');
 assert.equal(value.stickyScene,'sticky','small windscreen remains visible without covering other lessons');
 await phone.locator('#cockpitVisualPanel .cockpit-info-dot').first().tap();
 assert.equal(await phone.locator('#cockpitInfoPanel').isVisible(),true,'info button is touch accessible on 390px phone');
 assert.equal(await phone.locator('#cockpitZoomPanel').isVisible(),false);
 await phone.locator('#cockpitInfoClose').tap();
 await phone.locator('#cockpitAircraftSelect').selectOption('f35');
 assert.equal(await phone.locator('#cockpitJetHud').isVisible(),true);
 assert.equal(await phone.locator('#cockpitVisualPanel .cockpit-mfd').count(),3);
 await phone.locator('#cockpitAircraftSelect').selectOption('r44');
 assert.equal(await phone.locator('#collectivePanel').isVisible(),true);
 assert.equal(await phone.locator('#powerPanel').isVisible(),false);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 assert.deepEqual(errors,[],'no JS runtime errors');
 console.log('Unified cockpit passed: 7 aircraft styles, analog T layout, rotorcraft gauges, fighter MFDs, cockpit controls and phone geometry.');
}finally{await browser.close();}
