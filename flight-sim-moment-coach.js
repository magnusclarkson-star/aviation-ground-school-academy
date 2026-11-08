/* Device-only, ungraded learning questions for a selected synthetic replay sample.
 * Never assesses real pilot skills, approved limits, or instructor competency.
 */
(function(root){'use strict';
const STATUS='SME_REVIEW_REQUIRED';
const TYPES=new Set(['scouts','pilots']);
const phases=new Set(['roll','climb','flight','approach','rollout','complete','halted','pad','lift','hover','landed']);
const value=(sample,key)=>typeof sample?.[key]==='number'&&Number.isFinite(sample[key])?sample[key]:null;
const fmt=(v,unit)=>v===null?'not recorded':(Math.round(v*10)/10)+' '+unit;
function inspect(samples,position,pathway='scouts'){
 const records=Array.isArray(samples)?samples.slice(0,600):[];
 const level=TYPES.has(pathway)?pathway:'scouts';
 if(!records.length)return {available:false,title:'No fictional replay moment selected',observations:'Start and stop a private recording before inspecting its samples.',question:'',warning:STATUS};
 const index=Math.max(0,Math.min(records.length-1,Math.trunc(Number(position)||0)));
 const current=records[index]||{},prior=records[Math.max(0,index-1)]||{};
 const phase=phases.has(current.phase)?current.phase:'unknown';
 const oldPhase=phases.has(prior.phase)?prior.phase:'unknown';
 const rows=[
  'Fictional time: '+fmt(value(current,'t'),'s'),
  'Synthetic height: '+fmt(value(current,'altitudeM'),'m'),
  'Synthetic airspeed: '+fmt(value(current,'speedKt'),'kt'),
  'Synthetic bank: '+fmt(value(current,'bankDeg'),'degrees'),
  'Synthetic heading: '+fmt(value(current,'headingDeg'),'degrees')
 ];
 const changes=[];
 for(const [key,label,unit] of [['altitudeM','height','m'],['speedKt','airspeed','kt'],['bankDeg','bank','degrees']]){
  const a=value(prior,key),b=value(current,key);
  if(index>0&&a!==null&&b!==null){
   const delta=Math.round((b-a)*10)/10;
   changes.push(label+' '+(delta>0?'+':'')+delta+' '+unit+' since previous recorded sample');
  }
 }
 if(index>0&&phase!==oldPhase)changes.push('Fictional phase changed: '+oldPhase+' to '+phase);
 const generic={
  roll:'Compare the runway scene and the indicated change in speed.',
  climb:'Compare the height trend with the fictional climb phase.',
  flight:'Compare bank and heading indications as the scene moves.',
  approach:'Compare the fictional height trend and runway alignment.',
  rollout:'Compare the movement of the simulated runway and synthetic speed trend.',
  complete:'Look back at a previous phase and describe the differences.',
  halted:'Note the indicated conditions and discuss where the fictional model may mislead.',
  pad:'Identify what the model shows while the helicopter is on the helipad.',
  lift:'Compare collective input with the fictional height change.',
  hover:'Observe the fictional height and lateral position over time.',
  landed:'Compare the lift and landing phases in the simulated helipad scene.',
  unknown:'Describe only what the recorded values and scene actually demonstrate.'
 };
 const pilot={
  roll:'Compare the synthetic roll-phase speed trend with recorded power input. This is not takeoff speed guidance.',
  climb:'Compare vertical trend, fictional pitch and speed changes without applying real aircraft limitations.',
  flight:'Compare synthetic bank, heading and imaginary wind/track indications. This is not a manoeuvre standard.',
  approach:'Examine height, descent trend and fictional alignment. This is not a landing procedure.',
  rollout:'Compare the synthetic speed trend with the illustrated brake and throttle commands.',
  complete:'Identify an uncertain model assumption before considering a real-world training interpretation.',
  halted:'Ask which invented flight-model assumptions may explain the halted phase.',
  pad:'Distinguish collective, cyclic and pedal commands in this unvalidated rotorcraft illustration.',
  lift:'Compare the conceptual collective command with synthetic vertical indications.',
  hover:'Compare fictional drift and height fluctuations with the indicated control inputs.',
  landed:'Compare the simulated landing cue with previously recorded height and vertical trend.',
  unknown:generic.unknown
 };
 const question=(level==='pilots'?pilot:generic)[phase]+' What should you ask a qualified aviation instructor about the model limitations?';
 return {
  available:true,
  title:'Replay moment '+(index+1)+' of '+records.length+' · '+phase,
  observations:rows.concat(changes.length?['Recorded changes: '+changes.join('; ')]:['First recorded sample; no previous comparison.']).join('\n'),
  question,
  warning:STATUS+' · Fictional measurements only. No grade, verified instructor guidance, aircraft operating limits or training credit.'
 };
}
const api={inspect,STATUS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.AGSAFlightMomentCoach=api;
})(typeof window!=='undefined'?window:null);
