/* Cockpit V3 self-practice observation engine.
 * Synthetic targets are invented for this educational application, not aircraft
 * manoeuvre standards, loggable flight credit or instructor sign-off.
 * This module deliberately stores no learner identity or persistent results.
 */
(function(root){
 "use strict";
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 const tasks={
  level:{
   title:"Straight and level",
   briefing:"Hold a near-level pitch and bank, steady heading and moderate airspeed. Use trim and power to explore what affects the instruments.",
   target:"Pitch ±3°, bank ±5°, turn rate within ±0.4°/s, IAS 75–125 kt.",
   keys:["yoke","throttle","rudder","flaps"],
   check:(s)=>Math.abs(s.pitch)<=3&&Math.abs(s.roll)<=5&&Math.abs(s.turnRate)<=.4&&s.speed>=75&&s.speed<=125
  },
  climb:{
   title:"Climb and power",
   briefing:"Increase the simulated throttle and gently pull back while watching attitude, VSI, altitude and IAS. Maintain a modest nose-high attitude.",
   target:"Pitch +4° to +16°, climb 300–2200 fpm, bank within ±12°, IAS ≥60 kt, throttle ≥60%.",
   keys:["yoke","throttle","flaps"],
   check:(s,i)=>s.pitch>=4&&s.pitch<=16&&s.verticalSpeed>=300&&s.verticalSpeed<=2200&&Math.abs(s.roll)<=12&&s.speed>=60&&i.throttle>=60
  },
  turn:{
   title:"Controlled bank and turn",
   briefing:"Hold a moderate bank with the yoke or joystick. Watch the PFD horizon and turn rate; check that the slip/skid ball stays near centre.",
   target:"Bank 8°–32° either direction, turn rate 0.5–5°/s, slip/skid magnitude ≤0.2, IAS ≥65 kt.",
   keys:["yoke","rudder","throttle","flaps"],
   check:(s)=>Math.abs(s.roll)>=8&&Math.abs(s.roll)<=32&&Math.abs(s.turnRate)>=.5&&Math.abs(s.turnRate)<=5&&Math.abs(s.slip)<=.2&&s.speed>=65
  },
  descent:{
   title:"Controlled descent",
   briefing:"Reduce power modestly and command a gentle nose-low attitude. Cross-check VSI, speed and attitude instead of chasing a single instrument.",
   target:"Pitch −3° to −16°, descent −250 to −2200 fpm, bank within ±12°, IAS ≥60 kt.",
   keys:["yoke","throttle","flaps"],
   check:(s)=>s.pitch<=-3&&s.pitch>=-16&&s.verticalSpeed<=-250&&s.verticalSpeed>=-2200&&Math.abs(s.roll)<=12&&s.speed>=60
  },
  flap:{
   title:"Flap configuration observation",
   briefing:"Select 20° flaps and allow the indicator to follow. Observe the rising relative drag index, airspeed and vertical-speed consequences while managing power.",
   target:"Selected flaps 20°, indicated flaps 17°–23°, relative drag >1.25, IAS 55–145 kt.",
   keys:["flaps","throttle","yoke"],
   check:(s,i)=>i.flaps===20&&s.flaps>=17&&s.flaps<=23&&s.dragIndex>1.25&&s.speed>=55&&s.speed<=145
  }
 };
 const ids=Object.keys(tasks);
 const duration=12;
 const sampleInterval=.10;
 const threshold=65;
 function snapshot(s,i){
  const value=v=>Math.round((Number(v)||0)*10)/10;
  return {
   pitchDeg:value(s.pitch),bankDeg:value(s.roll),headingDeg:value(s.heading),
   airspeedKt:value(s.speed),verticalSpeedFpm:value(s.verticalSpeed),
   turnRateDegS:value(s.turnRate),slip:value(s.slip),
   selectedFlapsDeg:value(i.flaps),indicatedFlapsDeg:value(s.flaps),relativeDragIndex:value(s.dragIndex),
   throttlePercent:value(i.throttle),altitudeFt:value(s.altitude)
  };
 }
 function create(id="level"){
  if(!tasks[id])throw new Error("Unknown practice task "+id);
  return {id,status:"ready",elapsed:0,total:0,matched:0,streak:0,maxStreak:0,
    sampleAccumulator:0,percent:0,passed:false,final:null,last:null,telemetry:[],feedback:"Select Start when ready. These are fictional educational targets.",stopReason:null};
 }
 function begin(session){
  if(!tasks[session.id])throw new Error("Invalid task");
  Object.assign(session,{status:"running",elapsed:0,total:0,matched:0,streak:0,maxStreak:0,
   sampleAccumulator:0,percent:0,passed:false,final:null,last:null,telemetry:[],feedback:"Practice running — keep the instrument indications inside the stated target band.",stopReason:null});
  return session;
 }
 function finish(session,reason="time"){
  if(session.status!=="running")return session;
  session.percent=session.total?Math.round(100*session.matched/session.total):0;
  session.passed=reason==="time"&&session.percent>=threshold;
  session.status="finished";
  session.stopReason=reason;
  session.feedback=reason==="ended"?"Stopped early — this attempt is incomplete.":session.passed
    ?"Practice target met for at least 65% of the observed window. Review and repeat to reinforce the skill."
    :"Not yet within the example target for 65% of the window. Review the readings and retry.";
  return session;
 }
 function observe(session,state,input,dt){
  if(session.status!=="running")return session;
  const delta=clamp(Number(dt)||0,0,.1);
  session.elapsed=Math.min(duration,session.elapsed+delta);
  session.sampleAccumulator+=delta;
  while(session.sampleAccumulator>=sampleInterval-1e-8){
   session.sampleAccumulator-=sampleInterval;
   const good=!!tasks[session.id].check(state,input);
   session.total++;
   if(good){session.matched++;session.streak++;session.maxStreak=Math.max(session.maxStreak,session.streak);}
   else session.streak=0;
   session.last=snapshot(state,input);
   session.telemetry.push(session.last);
  }
  session.percent=session.total?Math.round(100*session.matched/session.total):0;
  if(session.elapsed>=duration-.000001){
   session.elapsed=duration;
   session.final=session.last||snapshot(state,input);
   finish(session,"time");
  }
  return session;
 }
 function report(session,createdAt){
  if(session.status!=="finished")throw Error("Finish the practice attempt before exporting");
  const timestamp=typeof createdAt==="string"?createdAt:new Date().toISOString();
  return {
   schema:"agsa.practice-observation.v1",
   disclaimer:"UNOFFICIAL SELF-PRACTICE REPORT — NOT A CERTIFICATE, SIGNED ASSESSMENT, FSTD LOG OR FLIGHT-TIME CREDIT.",
   issuedBy:"Aviation Ground School Academy educational browser prototype",
   createdAt:timestamp,
   task:{id:session.id,title:tasks[session.id].title,exampleTarget:tasks[session.id].target},
   observation:{
    requiredSeconds:duration,observedSeconds:Math.round(session.elapsed*10)/10,
    sampleIntervalSeconds:sampleInterval,samples:session.total,matchedSamples:session.matched,
    matchedPercent:session.percent,requiredPercent:threshold,maxConsecutiveMatchedSeconds:Math.round(session.maxStreak*sampleInterval*10)/10,
    outcome:session.passed?"PRACTICE_TARGET_MET":session.stopReason==="ended"?"INCOMPLETE":"PRACTICE_AGAIN"
   },
   finalIllustrativeIndications:session.final,
   limitations:[
    "Illustrative simulated performance, not validated aircraft dynamics.",
    "No identity verification, instructor sign-off or official training credit.",
    "No recorded personal information, remote submission or server-side audit trail.",
    "An approved training provider must independently assess any training outcomes."
   ]
  };
 }
 const api={tasks,ids,duration,threshold,sampleInterval,create,begin,observe,finish,report,snapshot};
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.CockpitV3Skills=api;
})(typeof window!=="undefined"?window:null);
