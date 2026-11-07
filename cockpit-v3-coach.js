/* Automated practice feedback — educational reflection, NOT an instructor sign-off.
   Analyses 0.1-second in-memory samples against intentionally fictional limits. */
(function(root){
"use strict";
const abs=Math.abs;
const spec={
 level:[
  ["pitch","Pitch attitude",s=>abs(s.pitchDeg)<=3,"Use a small fore/aft yoke or stick input, then release and compare the pitch ladder."],
  ["bank","Wing level",s=>abs(s.bankDeg)<=5,"Reduce sideways yoke or stick input and watch the horizon settle toward level."],
  ["heading","Turn tendency",s=>abs(s.turnRateDegS)<=.4,"Cross-check the turn-rate cue and keep the bank near zero."],
  ["speed","Airspeed",s=>s.airspeedKt>=75&&s.airspeedKt<=125,"Try a modest throttle adjustment and wait for the simulated airspeed to respond."]
 ],
 climb:[
  ["pitch","Climb pitch",s=>s.pitchDeg>=4&&s.pitchDeg<=16,"Use small nose-up inputs and monitor the attitude ladder, avoiding exaggerated pitch."],
  ["vsi","Positive climb",s=>s.verticalSpeedFpm>=300&&s.verticalSpeedFpm<=2200,"Compare the VSI and altimeter; adjust pitch and power gradually."],
  ["bank","Controlled wings",s=>abs(s.bankDeg)<=12,"Maintain a moderate bank close to level during the climb exercise."],
  ["speed","Airspeed",s=>s.airspeedKt>=60,"Observe airspeed while changing pitch; the model can slow during steep climbs."],
  ["power","Power command",s=>s.throttlePercent>=60,"Increase the simulated throttle above the example target before the observation."]
 ],
 turn:[
  ["bank","Bank angle",s=>abs(s.bankDeg)>=8&&abs(s.bankDeg)<=32,"Use the yoke or stick to hold a gentle, observable bank angle."],
  ["rate","Turn rate",s=>abs(s.turnRateDegS)>=.5&&abs(s.turnRateDegS)<=5,"Read the turn-rate cue and use a smaller bank if the turn is excessive."],
  ["slip","Turn coordination",s=>abs(s.slip)<=.2,"Watch the slip/skid ball and practise gentle rudder coordination. This is a simplified response model."],
  ["speed","Airspeed",s=>s.airspeedKt>=65,"Use the throttle as required to keep the demonstration speed above its example band."]
 ],
 descent:[
  ["pitch","Descent pitch",s=>s.pitchDeg<=-3&&s.pitchDeg>=-16,"Command a small nose-down attitude, then cross-check the pitch ladder."],
  ["vsi","Descent rate",s=>s.verticalSpeedFpm<=-250&&s.verticalSpeedFpm>=-2200,"Monitor vertical speed and adjust pitch/power rather than holding an excessive nose-down input."],
  ["bank","Wings",s=>abs(s.bankDeg)<=12,"Keep the bank near level for this descent task."],
  ["speed","Airspeed",s=>s.airspeedKt>=60,"Watch for the airspeed response to pitch and power adjustments."]
 ],
 flap:[
  ["command","Flap selection",s=>s.selectedFlapsDeg===20,"Select the 20° detent before starting this example observation."],
  ["travel","Flap travel",s=>s.indicatedFlapsDeg>=17&&s.indicatedFlapsDeg<=23,"Wait for the indicated flap position to approach the selected setting."],
  ["drag","Relative drag",s=>s.relativeDragIndex>1.25,"Compare the drag meter to its clean-wing reference as the flap travels."],
  ["speed","Airspeed",s=>s.airspeedKt>=55&&s.airspeedKt<=145,"Observe airspeed while changing flap configuration and power."]
 ]
};
function analyse(session){
 if(!session||!spec[session.id])throw Error("Unsupported task for feedback");
 const samples=Array.isArray(session.telemetry)?session.telemetry:[];
 const duration=samples.length;
 const criteria=spec[session.id].map(([id,label,check,advice])=>{
  const valid=samples.filter(check).length;
  return {id,label,matchedSamples:valid,totalSamples:duration,percent:duration?Math.round(valid/duration*100):0,advice};
 });
 const weak=criteria.filter(x=>x.percent<80).sort((a,b)=>a.percent-b.percent);
 const strong=criteria.filter(x=>x.percent>=80).sort((a,b)=>b.percent-a.percent);
 let headline;
 if(session.status!=="finished")headline="Complete the observation to receive an automated practice review.";
 else if(session.stopReason==="ended")headline="Practice ended early; use the review to prepare for another attempt.";
 else headline=session.passed?"You met this exercise's fictional practice target.":"You were outside the fictional target for too much of this attempt.";
 const tips=weak.slice(0,2).map(x=>x.advice);
 if(!tips.length)tips.push("Repeat the exercise with smaller, smoother control inputs and keep cross-checking the other instruments.");
 return {
  label:"Automated practice coach — no instructor review",
  headline,
  highlights:strong.slice(0,2).map(x=>x.label+" stayed within its example band for "+x.percent+"% of observations."),
  improvements:weak.slice(0,3).map(x=>x.label+" met its example band for "+x.percent+"% of observations."),
  nextSteps:tips,
  criterionScores:criteria.map(({id,label,matchedSamples,totalSamples,percent})=>({id,label,matchedSamples,totalSamples,percent}))
 };
}
const api={analyse};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.CockpitV3Coach=api;
})(typeof window!=="undefined"?window:null);
