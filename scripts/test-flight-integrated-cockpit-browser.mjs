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
 assert.equal(await desktop.locator('#restartFlight').count(),1,'there is one live restart control');
 assert.equal(await desktop.locator('#restartFlight').evaluate(el=>!!el.closest('#cockpitStation')),true,'restart is visibly inside cockpit');
 assert.equal(await desktop.locator('#restartFlight').isVisible(),true);
 assert.match(await desktop.locator('#restartFlight').textContent(),/Restart/i);
 assert.equal(await desktop.locator('#restartFlight').evaluate(el=>el.parentElement.id),'cockpitRestartDock',
  'Restart is physically below the collective rather than in the top toolbar');
 assert.ok((await desktop.locator('#restartFlight').boundingBox()).height>=30,'compact Restart remains tappable');
 const layout=await desktop.evaluate(()=>{
  const box=id=>document.querySelector(id).getBoundingClientRect();
  const d=box('#cockpitVisualPanel'),y=box('#controlPad'),p=box('#leftRudder'),t=box('#powerPanel');
  return {instrumentsAbove:d.bottom<=y.top+35,
   centered:Math.abs(y.left+y.width/2-(box('#cockpitMain').left+box('#cockpitMain').width/2))<55,
   pedalsBelow:p.top>=y.bottom-12,throttleRight:t.left>y.left+y.width/2};
 });
 assert.equal(layout.instrumentsAbove,true,'gauges sit on dashboard above the yoke');
 assert.equal(layout.centered,true,'yoke centered in the actual dashboard');
 assert.equal(layout.pedalsBelow,true,'pedals physically underneath the yoke');
 assert.equal(layout.throttleRight,true,'throttle sits to the right of the yoke');
 assert.equal(await desktop.locator('#axisReadouts').count(),1,'one live bank/pitch block, never cloned');
 assert.equal(await desktop.locator('#axisReadouts').evaluate(el=>el.parentElement.id),'axisPedalDock',
  'Cessna bank and pitch are no longer below the yoke');
 assert.ok(await desktop.evaluate(()=>{
  const pedal=document.querySelector('.rudder-pedals').getBoundingClientRect();
  const readouts=document.querySelector('#axisReadouts').getBoundingClientRect();
  const grip=document.querySelector('#controlPad').getBoundingClientRect();
  return readouts.left>=pedal.right-3&&readouts.top>=grip.top;
 }), 'Cessna tiny bank/pitch sit right of rudder pedals');
 assert.equal(await desktop.locator('.cockpit-avionics').count(),1,'Cessna radio stack beside six-pack');
 const cessnaDesktop=await desktop.evaluate(()=>{
  const box=sel=>document.querySelector(sel).getBoundingClientRect();
  const dial=box('#cockpitVisualPanel .cockpit-gauge');
  const cluster=box('#cockpitVisualPanel .cockpit-sixpack');
  const nav=box('#cockpitVisualPanel .cockpit-nav-screen');
  return {dialWidth:dial.width,navRight:nav.left>=cluster.right-3,navVisible:nav.width>=120};
 });
 assert.ok(cessnaDesktop.dialWidth<=104,'Cessna round gauges are smaller than the old 148px dials');
 assert.ok(cessnaDesktop.navRight&&cessnaDesktop.navVisible,
  'Cessna navigator must sit to the right of the six-pack, not below');
 assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),false,'help is hidden until learner taps ⓘ');
 assert.equal(await desktop.locator('#cockpitZoomPanel').isVisible(),false,'instrument is normal size initially');
 // Backlight is always available in More without another large toolbar item.
 assert.equal(await desktop.locator('#cockpitStation').getAttribute('data-instrument-backlight'),'green');
 const firstGauge=desktop.locator('#cockpitVisualPanel .cockpit-gauge-title').first();
 const originalGauge=await firstGauge.boundingBox();
 assert.equal(await firstGauge.evaluate(el=>getComputedStyle(el).color),'rgb(198, 255, 225)');
 await desktop.locator('#cockpitHelpToggle').click();
 await desktop.locator('#cockpitBacklightPicker [data-cockpit-backlight="blue"]').click();
 assert.equal(await desktop.locator('#cockpitStation').getAttribute('data-instrument-backlight'),'blue');
 assert.equal(await firstGauge.evaluate(el=>getComputedStyle(el).color),'rgb(212, 234, 255)');
 assert.equal(await desktop.locator('#cockpitBacklightPicker [data-cockpit-backlight="blue"]').getAttribute('aria-pressed'),'true');
 // The inline dimmer stays in More; each step must change illumination,
 // not tile dimensions or any of the flight model's instrument values.
 const dimmer=desktop.locator('#cockpitBacklightDimmer');
 assert.equal(await dimmer.inputValue(),'2','normal brightness is the initial selection');
 await dimmer.evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(await desktop.locator('#cockpitStation').getAttribute('data-instrument-dimmer'),'dim');
 assert.equal(await desktop.locator('#cockpitBacklightLevel').textContent(),'DIM');
 assert.equal(await firstGauge.evaluate(el=>getComputedStyle(el).color),'rgb(145, 169, 189)');
 await dimmer.evaluate(el=>{el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(await desktop.locator('#cockpitStation').getAttribute('data-instrument-dimmer'),'bright');
 assert.equal(await desktop.locator('#cockpitBacklightLevel').textContent(),'BRIGHT');
 assert.equal(await firstGauge.evaluate(el=>getComputedStyle(el).color),'rgb(224, 243, 255)');
 await dimmer.evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(await firstGauge.evaluate(el=>getComputedStyle(el).color),'rgb(212, 234, 255)');
 const litGauge=await firstGauge.boundingBox();
 assert.ok(Math.abs(originalGauge.height-litGauge.height)<1,
  'backlighting must not resize round instruments or shift flight controls');
 await desktop.locator('#cockpitBacklightPicker [data-cockpit-backlight="off"]').click();
 assert.equal(await desktop.locator('#cockpitStation').getAttribute('data-instrument-backlight'),'off');
 await desktop.locator('#cockpitBacklightPicker [data-cockpit-backlight="green"]').click();
 assert.equal(await firstGauge.evaluate(el=>getComputedStyle(el).color),'rgb(198, 255, 225)');
 await desktop.locator('#cockpitHelpToggle').click();
 assert.equal(await desktop.locator('#cockpitControlFocusToggle').count(),0,'no control expansion button');
 assert.equal(await desktop.locator('#cockpitExtraControls').count(),0,'no surprise additional control panels');
 await desktop.locator('#cockpitHelpToggle').click();
 await desktop.locator('#cockpitHelpChoices [data-cockpit-help="controls"]').click();
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
 await desktop.locator('#cockpitHelpToggle').click();
 await desktop.locator('#cockpitHelpChoices [data-cockpit-help="radio"]').click();
 assert.match(await desktop.locator('#cockpitInfoText').textContent(),/Listen to the controller/);
 await desktop.keyboard.press('Escape');
 assert.equal(await desktop.locator('#cockpitInfoPanel').isVisible(),false);
 assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-gauge').count(),8);
 assert.deepEqual((await desktop.locator('#cockpitVisualPanel .cockpit-gauge-title').allTextContents()).slice(0,3),['AIRSPEED','ATTITUDE','ALTIMETER']);
 assert.deepEqual((await desktop.locator('#cockpitVisualPanel .cockpit-gauge-title').allTextContents()).slice(3),['TURN COORD.','HEADING','VERTICAL SPEED','ENGINE IND.','THROTTLE']);
 // Change displays in-place; the same simulated flight state remains active.
 await desktop.locator('#cockpitInstrumentStyle').click();
 assert.equal(await desktop.locator('#cockpitStation').getAttribute('data-instruments'),'glass');
 assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-mfd').count(),3,'trainer glass cockpit has live flight, map and systems displays');
 assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-gauge').count(),0,'round dials replaced by glass displays');
 assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-mfd-nav').count(),1,'glass navigation map remains available');
 assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-mfd-head').first().evaluate(
  el=>getComputedStyle(el).color),'rgb(198, 255, 225)',
  'glass displays inherit the green lighting without losing navigation');
 await desktop.locator('#cockpitInstrumentStyle').click();
 assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-gauge').count(),8,'trainer round gauges restored');

 assert.equal(await desktop.locator('#controlPad').evaluate(el=>el.closest('#cockpitStation')!==null),true,'active yoke is INSIDE the cockpit, never duplicated');
 assert.equal(await desktop.locator('#leftRudder').evaluate(el=>el.closest('#cockpitStation')!==null),true,'rudder pedals are in the cockpit');
 assert.equal(await desktop.locator('#power').evaluate(el=>el.closest('#cockpitStation')!==null),true,'throttle is in cockpit');
 await desktop.locator('#startApproach').click();
 await desktop.waitForTimeout(350);
 assert.ok(Number(await desktop.locator('[data-live-value="alt"]').textContent())>150,'analog height follows flight model in feet');
 assert.ok(Number(await desktop.locator('#readAlt').textContent())>40,'original numeric height remains available');
 await desktop.locator('#pauseFlight').click();
 assert.equal(await desktop.locator('#pauseFlight').getAttribute('aria-pressed'),'true');
 await desktop.locator('#restartFlight').click();
 assert.equal(await desktop.locator('#pauseFlight').getAttribute('aria-pressed'),'false','restart resumes a paused flight');
 assert.equal(await desktop.locator('#cockpitRestartStatus').textContent(),'Flight restarted');
 assert.ok(await desktop.locator('#miniAttitude').isVisible(),'legacy synthetic attitude remains present');
 await desktop.locator('#cockpitAircraftSelect').selectOption('r44');
 await desktop.locator('#cockpitHelpToggle').click();
 await desktop.locator('#cockpitHelpChoices [data-cockpit-help="controls"]').click();
 assert.match(await desktop.locator('#cockpitInfoText').textContent(),/Cyclic/,'rotor controls help changes by aircraft');
 await desktop.locator('#cockpitInfoClose').click();
 assert.equal(await desktop.locator('#typeCyclic').getAttribute('aria-pressed'),'true');
 assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-gauge').count(),8,
  'R44 has eight compact analogue dials in two rows');
 assert.deepEqual(await desktop.locator('#cockpitVisualPanel .cockpit-gauge-title').allTextContents(),
  ['AIRSPEED','ATTITUDE','ALTIMETER','VERTICAL SPEED','HEADING','DUAL TACH','MANIFOLD PROXY','TURN / SLIP']);
 assert.equal(await desktop.locator('#cockpitVisualPanel [data-gauge="heading"]').count(),1,
  'R44 heading appears in its own live analogue gauge');
 assert.equal(await desktop.locator('[data-rotor-tbar]').isVisible(),true,
  'R44 has a recognizable T-bar cyclic geometry');
 assert.match(await desktop.locator('#cockpitVisualPanel').textContent(),/DUAL TACH/);
 assert.match(await desktop.locator('#cockpitVisualPanel').textContent(),/MANIFOLD PROXY/);
 assert.equal(await desktop.locator('#collectivePanel').isVisible(),true);
 assert.equal(await desktop.locator('#axisReadouts').evaluate(el=>el.parentElement.id),'axisCollectiveDock',
  'R44 cyclic bank/pitch indications move to the top of collective');
 assert.ok(await desktop.evaluate(()=>{
  const readouts=document.querySelector('#axisReadouts').getBoundingClientRect();
  const lever=document.querySelector('#collectivePanel .r44-collective-mechanism').getBoundingClientRect();
  return readouts.bottom<=lever.top+4;
 }), 'R44 tiny readouts sit above collective mechanism');
 assert.equal(await desktop.locator('#bankHoldToggle').isVisible(),false,
  'bank hold remains airplane-only');
 assert.equal(await desktop.locator('.r44-collective-mechanism').isVisible(),true);
 const restartDockPosition=await desktop.evaluate(()=>{
  const collective=document.getElementById('collectivePanel').getBoundingClientRect();
  const restart=document.getElementById('restartFlight').getBoundingClientRect();
  return {sameColumn:Math.abs((collective.left+collective.width/2)-(restart.left+restart.width/2))<50,
   below:restart.top>=collective.bottom-2,
   notInToolbar:!document.querySelector('#cockpitStation .cockpit-actions #restartFlight')};
 });
 assert.equal(restartDockPosition.sameColumn,true,'Restart is aligned with the helicopter collective');
 assert.equal(restartDockPosition.below,true,'Restart is visibly beneath the collective');
 assert.equal(restartDockPosition.notInToolbar,true,'Restart is absent from top cockpit toolbar');
 await desktop.locator('#cockpitInstrumentStyle').click();
 assert.equal(await desktop.locator('#cockpitStation').getAttribute('data-instruments'),'glass');
 assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-mfd').count(),3,'helicopter glass cockpit displays all three screens');
 assert.equal(await desktop.locator('#cockpitVisualPanel [data-r44-lesson]').count(),1,'helicopter lesson remains in glass mode');
 assert.equal(await desktop.locator('#collectivePanel').isVisible(),true,'glass instruments do not remove collective');
 await desktop.locator('#cockpitInstrumentStyle').click();
 assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-gauge').count(),8,'round helicopter instruments restored');

 const rotorDesktop=await desktop.evaluate(()=>{
  const box=sel=>document.querySelector(sel).getBoundingClientRect();
  return {left:box('#collectivePanel').left,cyclic:box('#controlPad').left,
   feet:box('#leftRudder').top,cyclicBottom:box('#controlPad').bottom};
 });
 assert.ok(rotorDesktop.left<rotorDesktop.cyclic,
  'R44 collective sits to the left of its centrally mounted cyclic');
 assert.ok(rotorDesktop.feet>=rotorDesktop.cyclicBottom-12,'rotor pedals remain beneath the cyclic');
 assert.equal(await desktop.locator('#flapPanel').isVisible(),false);
 assert.equal(await desktop.locator('#brake').isVisible(),false);
 // Jet layouts default to glass, and the mode remains switchable.
 await desktop.locator('#cockpitInstrumentStyle').click();
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
  if(id==='su37'){
   assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-mfd').count(),2,
    'Su-37 retains its compact dual display arrangement');
   assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-mfd-sysnav [data-nav-map]').count(),1,
    'Su-37 has a live moving navigation map');
   assert.equal(await desktop.locator('#cockpitVisualPanel .cockpit-mfd-sysnav [data-mfd-value]').count(),3,
    'Su-37 retains power, RPM and vertical speed engine indications');
   const coords=await desktop.evaluate(()=>{
    const panel=document.querySelector('#cockpitVisualPanel');
    window.AGSAFlightNavigation.paint(panel,{xM:375,zM:-720,headingDeg:37,trackDeg:39,groundSpeedKt:88});
    const map=panel.querySelector('.cockpit-mfd-sysnav [data-nav-map]');
    return {position:map.dataset.navPosition,heading:map.dataset.navHeading};
   });
   assert.equal(coords.position,'375.0,-720.0','Su-37 navigator tracks aircraft position');
   assert.equal(coords.heading,'37.0','Su-37 navigator follows heading');
   await desktop.locator('#cockpitVisualPanel .cockpit-mfd-sysnav').click({position:{x:80,y:65}});
   assert.equal(await desktop.locator('#cockpitZoomContent .cockpit-mfd-sysnav [data-nav-map]').count(),1,
    'Su-37 navigation enlarges on touch');
   await desktop.locator('#cockpitZoomClose').click();
  }
  assert.equal(await desktop.locator('#cockpitJetHud').isVisible(),true);
  assert.equal(await desktop.locator('#cockpitAircraftNotice').textContent(),'FLIGHT DISPLAYS');
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
 assert.equal(await phone.locator('#axisReadouts').count(),1);
 assert.equal(await phone.locator('#axisReadouts').evaluate(el=>el.parentElement.id),'axisPedalDock');
 assert.ok(await phone.evaluate(()=>{
  const box=id=>document.querySelector(id).getBoundingClientRect();
  return box('#axisReadouts').left>=box('.rudder-pedals').right-3;
 }), 'phone Cessna bank/pitch are right of pedals, not under yoke');
 assert.ok(await phone.locator('#cockpitVisualPanel .cockpit-gauge').first().isVisible());
 assert.equal(await phone.locator('#cockpitVisualPanel .cockpit-gauge').count(),8);
 const cessnaPhone=await phone.evaluate(()=>{
  const box=sel=>document.querySelector(sel).getBoundingClientRect();
  const panel=box('#cockpitVisualPanel'),cluster=box('#cockpitVisualPanel .cockpit-sixpack');
  const nav=box('#cockpitVisualPanel .cockpit-nav-screen');
  const gauges=[...document.querySelectorAll('#cockpitVisualPanel .cockpit-gauge')];
  return {
   dialMax:Math.max(...gauges.map(el=>el.getBoundingClientRect().width)),
   rightSide:nav.left>=cluster.right-3&&nav.top<cluster.bottom,
   mapFits:nav.right<=panel.right+2&&nav.width>=100,
   noOverflow:document.documentElement.scrollWidth<=innerWidth+2
  };
 });
 assert.ok(cessnaPhone.dialMax<=80,'Cessna phone dials are smaller, two rows of three');
 assert.ok(cessnaPhone.rightSide&&cessnaPhone.mapFits,
  'Cessna moving navigator must share the same row to the right of six smaller dials');
 assert.ok(cessnaPhone.noOverflow,'Cessna navigator must not create horizontal phone scrolling');
 assert.ok(await phone.locator('#flightGrip').isVisible());
 const restart=phone.locator('#restartFlight');
 assert.equal(await restart.evaluate(el=>!!el.closest('#cockpitStation')),true);
 const row=await phone.evaluate(()=>{
  const ids=['cockpitAircraftPhotoButton','cockpitInstrumentStyle','cockpitFocusButton','cockpitHelpToggle'];
  const boxes=ids.map(id=>document.getElementById(id).getBoundingClientRect());
  return {boxes:boxes.map(b=>({x:b.x,y:b.y,width:b.width,height:b.height})),
   choicesVisible:getComputedStyle(document.getElementById('cockpitHelpChoices')).display!=='none',
   bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth,
   typeHeight:document.getElementById('typeCyclic').getBoundingClientRect().height};
 });
 console.log("Mobile cockpit toolbar geometry:",JSON.stringify(row));
 assert.ok(row.boxes.every(b=>b.height>=30&&b.height<=44),
  'aircraft photo, instrument selector, cockpit and More fit in a slim toolbar');
 assert.ok(row.boxes[0].width>row.boxes[1].width,
  'aircraft photo is wider than the compact glass switch');
 assert.ok(Math.max(...row.boxes.map(b=>b.y))-Math.min(...row.boxes.map(b=>b.y))<=5,
  'four top controls occupy one row; Restart is down by collective');
 assert.equal(row.choicesVisible,false,'three secondary information actions are initially tucked away');
 assert.ok(row.bodyWidth<=row.viewport+2,'the compact cockpit must not overflow the phone');
 assert.ok(row.typeHeight<=46,'large redundant aircraft family buttons have been shortened');
 await phone.locator('#cockpitHelpToggle').tap();
 assert.equal(await phone.locator('#cockpitHelpToggle').getAttribute('aria-expanded'),'true');
 assert.equal(await phone.locator('#cockpitHelpChoices [data-cockpit-help="controls"]').isVisible(),true);
 await phone.locator('#cockpitHelpChoices [data-cockpit-help="controls"]').tap();
 assert.equal(await phone.locator('#cockpitHelpToggle').getAttribute('aria-expanded'),'false');
 assert.match(await phone.locator('#cockpitInfoText').textContent(),/Yoke, stick or cyclic/);
 await phone.locator('#cockpitInfoClose').tap();
 assert.ok((await restart.boundingBox()).height>=30,'phone Restart remains a compact usable target');
 await restart.tap();
 assert.equal(await phone.locator('#cockpitRestartStatus').textContent(),'Flight restarted');
 const value=await phone.evaluate(()=>{
  const station=document.querySelector('#cockpitStation'),pad=document.querySelector('#controlPad'),
   pedals=document.querySelector('#rightRudder'),scene=document.querySelector('.scene-panel'),
   page=document.documentElement;
  const a=pad.getBoundingClientRect(),b=pedals.getBoundingClientRect(),c=station.getBoundingClientRect(),d=document.querySelector("#cockpitVisualPanel").getBoundingClientRect();
  return {sameCockpit:station.contains(pad)&&station.contains(pedals),
    noOverflow:page.scrollWidth<=innerWidth+2,scrollable:scene.scrollHeight>0,
    width:window.innerWidth,padX:a.x,pedalsX:b.x,stationX:c.x,
    padWidth:a.width,padHeight:a.height,pedalsWidth:b.width,pedalY:b.y,gaugeHeight:d.height,stationWidth:c.width,stageHeight:scene.getBoundingClientRect().height,
    gaugeY:d.y,padY:a.y,stickyScene:getComputedStyle(document.querySelector(".scene-shell")).position};
 });
 assert.equal(value.sameCockpit,true,'gauge panel, yoke and pedals share the same cockpit');
 assert.equal(value.noOverflow,true,'mobile cockpit has no horizontal overflow');
 assert.ok(value.padWidth>50&&value.pedalsWidth>20,'touch targets remain large enough');
 assert.ok(value.padY>=value.gaugeY+value.gaugeHeight-35,'yoke starts below dashboard instruments');
 assert.ok(value.pedalY>=value.padY+value.padHeight-10,'rudder pedals sit underneath the yoke');
 assert.ok(Math.abs((value.padX+value.padWidth/2)-(value.stationX+value.stationWidth/2))<55,'yoke is centered in cockpit');
 assert.equal(value.stickyScene,'sticky','small windscreen remains visible without covering other lessons');
 await phone.locator('#cockpitVisualPanel .cockpit-info-dot').first().tap();
 assert.equal(await phone.locator('#cockpitInfoPanel').isVisible(),true,'info button is touch accessible on 390px phone');
 assert.equal(await phone.locator('#cockpitZoomPanel').isVisible(),false);
 await phone.locator('#cockpitInfoClose').tap();
 await phone.locator('#cockpitAircraftSelect').selectOption('f35');
 assert.equal(await phone.locator('#cockpitJetHud').isVisible(),true);
 assert.equal(await phone.locator('#cockpitVisualPanel .cockpit-mfd').count(),3);
 for(const id of ['fa18','f22','f35','typhoon','su37']){
  await phone.locator('#cockpitAircraftSelect').selectOption(id);
  const layout=await phone.evaluate(()=>{
   const panel=document.querySelector('#cockpitVisualPanel').getBoundingClientRect();
   const screens=[...document.querySelectorAll('#cockpitVisualPanel .cockpit-mfd')]
    .map(el=>el.getBoundingClientRect());
   const map=document.querySelector('#cockpitVisualPanel .cockpit-mfd-nav');
   const pfd=document.querySelector('#cockpitVisualPanel .cockpit-mfd-pfd');
   const nav=map?.getBoundingClientRect(),flight=pfd?.getBoundingClientRect();
   return {
    panelHeight:panel.height,screenCount:screens.length,
    allVisible:screens.every(v=>v.width>=75&&v.height>=55&&v.right<=panel.right+2),
    noOverflow:document.documentElement.scrollWidth<=innerWidth+2,
    navWithPfd:!nav||!flight||Math.abs(nav.top-flight.top)<=8
   };
  });
  assert.ok(layout.allVisible&&layout.noOverflow,
   id+' phone glass displays fit dashboard with no clipping '+JSON.stringify(layout));
  if(id==='su37'){
   assert.equal(await phone.locator('#cockpitVisualPanel .cockpit-mfd-sysnav [data-nav-map]').count(),1,
    'Su-37 navigator is visible on Android');
   assert.equal(await phone.locator('#cockpitVisualPanel .cockpit-mfd-sysnav [data-mfd-value]').count(),3,
    'three compact Su-37 system values are retained on Android');
  }
  assert.ok(layout.panelHeight<=280,id+' phone screens must not push yoke too far down '+JSON.stringify(layout));
  if(id==='fa18'||id==='f35'||id==='typhoon')
   assert.ok(layout.navWithPfd,id+' navigation should share top row with PFD');
 }
 await phone.locator('#cockpitAircraftSelect').selectOption('r44');
 assert.equal(await phone.locator('#axisReadouts').evaluate(el=>el.parentElement.id),'axisCollectiveDock',
  'phone helicopter moves same bank/pitch above collective');
 assert.equal(await phone.locator('#collectivePanel').isVisible(),true);
 assert.equal(await phone.locator('#powerPanel').isVisible(),false);
 assert.equal(await phone.locator('#cockpitVisualPanel .cockpit-gauge').count(),8);
 await phone.locator('#cockpitHelpToggle').tap();
 await phone.locator('#cockpitBacklightPicker [data-cockpit-backlight="blue"]').tap();
 assert.equal(await phone.locator('#cockpitStation').getAttribute('data-instrument-backlight'),'blue');
 assert.equal(await phone.locator('#cockpitVisualPanel .cockpit-gauge-title').first().evaluate(
  el=>getComputedStyle(el).color),'rgb(212, 234, 255)',
  'R44 dials illuminate blue on phone screens');
 await phone.locator('#cockpitBacklightDimmer').evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(await phone.locator('#cockpitStation').getAttribute('data-instrument-dimmer'),'dim');
 assert.equal(await phone.locator('#cockpitBacklightLevel').textContent(),'DIM');
 assert.equal(await phone.locator('#cockpitVisualPanel .cockpit-gauge-title').first().evaluate(
  el=>getComputedStyle(el).color),'rgb(145, 169, 189)');
 await phone.locator('#cockpitBacklightDimmer').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
  'compact phone dimmer does not cause horizontal scrolling');
 await phone.locator('#cockpitHelpToggle').tap();
 assert.ok(await phone.evaluate(()=>{
  const c=document.getElementById('collectivePanel').getBoundingClientRect();
  const r=document.getElementById('restartFlight').getBoundingClientRect();
  return r.top>=c.bottom-2&&r.width<c.width+2;
 }), 'Restart visibly below collective on phone');
 await phone.locator('#cockpitInstrumentStyle').tap();
 assert.equal(await phone.locator('#cockpitVisualPanel .cockpit-mfd').count(),3,'phone helicopter glass switch works');
 assert.equal(await phone.locator('#cockpitVisualPanel [data-mfd-horizon]').count(),1,'glass attitude tracks flight motion');
 await phone.locator('#cockpitInstrumentStyle').tap();
 assert.equal(await phone.locator('#cockpitVisualPanel .cockpit-gauge').count(),8,'phone helicopter round switch works');
 assert.equal(await phone.locator('#cockpitVisualPanel [data-r44-hover]').textContent(),'ON PAD',
  'on-pad hover cue reflects the grounded state');

 assert.equal(await phone.locator('#cockpitVisualPanel [data-r44-lesson]').textContent(),
  '1/4 · TAKEOFF','the integrated R44 lesson begins automatically');
 const detail=phone.locator('#cockpitVisualPanel .r44-lesson-strip .cockpit-info-dot');
 await detail.tap();
 assert.equal(await phone.locator('#cockpitInfoTitle').textContent(),'R44 guided lesson');
 assert.match(await phone.locator('#cockpitInfoText').textContent(),/hover/i);
 await phone.locator('#cockpitInfoClose').tap();
 const turnInstruction=await phone.evaluate(()=>{
  const G=window.AGSAFlightGuidance;
  const state=window.AGSAImmersiveFlight.makeState('helicopter');
  const session=G.start(state);
  const hovering={...state,onGround:false,phase:'hover',altitudeM:4,
   headingDeg:350,verticalMs:0,groundSpeedKt:.4,yawRateDegS:0,
   time:3,hoverAchieved:false};
  G.observe(session,hovering,['liftoff']);
  G.observe(session,{...hovering,time:12,hoverAchieved:true,hoverHoldSec:8},['hoverHeld']);
  const panel=document.querySelector('#cockpitVisualPanel');
  window.AGSACockpitIntegrated.paint(panel,hovering,{powerPct:85},
   {throttle:0,collective:.48,rudder:0},'r44',document,session);
  return {label:panel.querySelector('[data-r44-lesson]').textContent,
   hint:panel.querySelector('[data-r44-lesson]').getAttribute('aria-label')};
 });
 assert.equal(turnInstruction.label,'3/4 · 90° TURN');
 assert.match(turnInstruction.hint,/90°/);

 const flightCue=await phone.evaluate(()=>{
  const state=window.AGSAImmersiveFlight.makeState('helicopter');
  Object.assign(state,{onGround:false,phase:'hover',altitudeM:3,
   verticalMs:0,groundSpeedKt:7.3});
  window.AGSACockpitIntegrated.paint(document.getElementById('cockpitVisualPanel'),
   state,{powerPct:84},{throttle:0,collective:.75,rudder:0},'r44',document);
  return document.querySelector('#cockpitVisualPanel [data-r44-hover]').textContent;
 });
 assert.equal(flightCue,'DRIFTING · GS 7 KT',
  'live R44 mini instrument announces measured ground drift during hover');
 const precisionCues=await phone.evaluate(()=>{
  const panel=document.getElementById('cockpitVisualPanel');
  const st=window.AGSAImmersiveFlight.makeState('helicopter');
  Object.assign(st,{onGround:false,phase:'hover',altitudeM:4,
   verticalMs:0,groundSpeedKt:.4,hoverHoldSec:3.2,hoverBestSec:3.2});
  const draw=()=>window.AGSACockpitIntegrated.paint(panel,st,
   {powerPct:85},{throttle:0,collective:.495,rudder:0},'r44',document);
  draw();
  const counting=panel.querySelector('[data-r44-hover]').textContent;
  Object.assign(st,{onGround:true,phase:'landed',landingGrade:'precision',
   hoverHoldSec:0,groundSpeedKt:0});
  draw();
  const landed=panel.querySelector('[data-r44-hover]').textContent;
  return {counting,landed};
 });
 assert.deepEqual(precisionCues,{counting:'HOVER 3/8 S · GS 0 KT',
  landed:'PRECISION LANDING'},
  'phone hover mini-panel shows measured hold time and precision landing result');
 const visibleGauges=await phone.locator('#cockpitVisualPanel .cockpit-gauge').evaluateAll(
  els=>els.filter(el=>getComputedStyle(el).display!=='none')
   .sort((a,b)=>Number(getComputedStyle(a).order)-Number(getComputedStyle(b).order))
   .map(el=>el.dataset.gauge));
 assert.deepEqual(visibleGauges,
  ['speed','attitude','alt','rpm','heading','vsi','power','turn'],
  'all eight R44 instruments must be visible together without a hidden/expand action');
 const panelLayout=await phone.evaluate(()=>{
  const panel=document.querySelector('#cockpitVisualPanel');
  const deck=document.querySelector('#cockpitMain');
  const gauges=[...panel.querySelectorAll('.cockpit-gauge')];
  const box=panel.getBoundingClientRect(),r=el=>el.getBoundingClientRect();
  const faces=gauges.map(g=>r(g)),cs=getComputedStyle(panel);
  return {screen:innerWidth,bodyWidth:document.documentElement.scrollWidth,
   borderRadius:parseFloat(cs.borderTopLeftRadius),
   background:cs.backgroundImage,
   top:box.top,bottom:box.bottom,
   widths:faces.map(g=>g.width),lefts:faces.map(g=>g.left),
   rights:faces.map(g=>g.right),tops:faces.map(g=>g.top),
   deckRadius:parseFloat(getComputedStyle(deck).borderTopLeftRadius)};
 });
 assert.ok(panelLayout.borderRadius<=8&&panelLayout.deckRadius<=8,
  'the unnecessary oval dashboard frame is flat on the R44');
 assert.equal(panelLayout.background,'none',
  'oversized oval background decoration has been removed from instrument panel');
 assert.ok(Math.min(...panelLayout.widths)>=65,
  'eight individual phone gauges remain finger-readable, not tiny thumbnails');
 assert.ok(panelLayout.rights.every(x=>x<=panelLayout.screen+1)&&
  panelLayout.lefts.every(x=>x>=0),
  'no R44 instrument is cut off horizontally at 390 px');
 assert.ok(Math.max(...panelLayout.tops)-Math.min(...panelLayout.tops)<220,
  'all eight R44 gauges fit into two compact rows instead of a tall oval');
 assert.ok(panelLayout.bodyWidth<=panelLayout.screen+2,'R44 cockpit must not overflow phone');
 assert.equal(await phone.locator('#cockpitVisualPanel .r44-secondary-toggle').count(),0,
  'obsolete show-all control no longer wastes screen height');
 assert.equal(await phone.locator('#cockpitVisualPanel [data-r44-live="heading"]').textContent(),'000°');
 await phone.waitForFunction(()=>
  document.querySelector('#cockpitVisualPanel [data-r44-live="power"]').textContent==='48%');
 assert.equal(await phone.locator('#cockpitVisualPanel [data-r44-live="power"]').textContent(),'48%');
 const heading=phone.locator('#cockpitVisualPanel [data-gauge="heading"]');
 const headingBounds=await heading.boundingBox();
 assert.ok(headingBounds.width>=65&&headingBounds.height>=65,
  'the visible heading dial remains individually tappable: '+JSON.stringify(headingBounds));
 await heading.tap();
 assert.equal(await phone.locator('#cockpitZoomPanel').isVisible(),true,
  'tapping the visible R44 heading instrument still enlarges only that instrument');
 await phone.locator('#cockpitZoomClose').tap();
 const rotorPhone=await phone.evaluate(()=>{
  const rect=id=>document.querySelector(id).getBoundingClientRect();
  return {collective:rect('#collectivePanel'),cyclic:rect('#controlPad'),
   pedals:rect('#leftRudder'),input:rect('#collective')};
 });
 assert.ok(rotorPhone.collective.right<=rotorPhone.cyclic.left+16,
  'collective and centre cyclic are independently reachable with two thumbs');
 assert.ok(rotorPhone.pedals.top>=rotorPhone.cyclic.bottom-13,
  'R44 pedals remain below cyclic on a 390px phone');
 assert.ok(rotorPhone.input.height>=38,'collective slider retains a finger-sized hit target');
 await phone.locator('#collective').evaluate(el=>{
  el.value='85';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 assert.equal(await phone.locator('#collectiveValue').textContent(),'85%');
 await phone.waitForTimeout(150);
 assert.equal(await phone.locator('#cockpitVisualPanel [data-r44-live="power"]').textContent(),'85%',
  'compact R44 collective readout tracks the real live input');
 const leverUp=await phone.locator('#collectivePanel').evaluate(el=>
  el.style.getPropertyValue('--r44-collective-angle'));
 await phone.locator('#collective').evaluate(el=>{
  el.value='20';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const leverDown=await phone.locator('#collectivePanel').evaluate(el=>
  el.style.getPropertyValue('--r44-collective-angle'));
 assert.ok(Number.parseFloat(leverUp)<Number.parseFloat(leverDown),
  'collective handle physically moves as the flight lift command changes');
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 // Re-enter glass style after checking analogue helicopter, then rotate the
 // phone and verify that glass fighter displays remain horizontally visible.
 await phone.locator('#cockpitInstrumentStyle').tap();
 await phone.setViewportSize({width:844,height:390});
 for(const id of ['fa18','f22','f35','typhoon','su37']){
  await phone.locator('#cockpitAircraftSelect').selectOption(id);
  const fit=await phone.evaluate(()=>{
   const panel=document.querySelector('#cockpitVisualPanel').getBoundingClientRect();
   const controls=document.querySelector('#controlPad').getBoundingClientRect();
   const screens=[...document.querySelectorAll('#cockpitVisualPanel .cockpit-mfd')]
    .map(el=>el.getBoundingClientRect());
   return {
    horizontal:document.documentElement.scrollWidth<=innerWidth+2,
    instrumentsAboveControls:panel.bottom<=controls.top+15,
    allInside:screens.every(v=>v.left>=panel.left-2&&v.right<=panel.right+2),
    heights:screens.map(v=>Math.round(v.height)),
    panelHeight:panel.height
   };
  });
  assert.ok(fit.horizontal&&fit.instrumentsAboveControls&&fit.allInside,
   id+' landscape glass displays remain inside cockpit above flight controls '+JSON.stringify(fit));
  assert.ok(fit.panelHeight<=185,id+' glass panel fits shallow screen');
 }
 assert.deepEqual(errors,[],'no JS runtime errors');
 console.log('Unified cockpit passed: 7 aircraft styles, analog T layout, rotorcraft gauges, fighter MFDs, cockpit controls and phone geometry.');
}finally{await browser.close();}
