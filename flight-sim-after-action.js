/* Private, rule-based after-action reflection for fictional flight recorder.
 * This does not measure competency or import live/real aircraft data.
 */
(function(root){'use strict';
const WARNING='SME_REVIEW_REQUIRED · Fictional simulator observations, not instructor assessment, flight training credit, aircraft performance guidance or certification.';
const clampNumber=(v,lo,hi)=>typeof v==='number'&&Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):null;
const ROUND=v=>v===null?'unavailable':String(Math.round(v*10)/10);
const validPhases=new Set(['roll','climb','flight','approach','rollout','complete','halted','pad','lift','hover','landed']);
function summarise(exported){
 if(!exported||exported.schema!=='academy.synthetic-flight-trace.v1'||exported.synthetic!==true||
   !Array.isArray(exported.observations))return {available:false,text:'No compatible, private synthetic flight trace is available.',prompts:[],warning:WARNING};
 const raw=exported.observations.slice(0,600);
 const points=raw.map((s,i)=>({
  t:clampNumber(s?.t,0,3600)??i,
  altitudeM:clampNumber(s?.altitudeM,-1000,100000),
  speedKt:clampNumber(s?.speedKt,0,2000),
  verticalMs:clampNumber(s?.verticalMs,-1000,1000),
  bankDeg:clampNumber(s?.bankDeg,-180,180),
  lateralM:clampNumber(s?.lateralM,-100000,100000),
  phase:validPhases.has(s?.phase)?s.phase:null
 }));
 if(points.length<2)return {available:false,text:'Record at least two synthetic samples before asking for a summary.',prompts:[],warning:WARNING};
 const list=(key)=>points.map(p=>p[key]).filter(v=>v!==null);
 const range=(key)=>{const a=list(key);return a.length?{min:Math.min(...a),max:Math.max(...a)}:null;};
 const speed=range('speedKt'),height=range('altitudeM'),vertical=range('verticalMs'),bank=range('bankDeg');
 const phases=[...new Set(points.map(p=>p.phase).filter(Boolean))];
 const elapsed=Math.max(0,points.at(-1).t-points[0].t);
 const mode=exported.mode==='helicopter'?'conceptual helicopter':'fictional fixed-wing aircraft';
 const facts=[
  'Private synthetic flight trace ('+mode+').',
  'Observed samples: '+points.length+' · approximate recorded span: '+ROUND(elapsed)+' seconds.',
  'Synthetic height range: '+(height?ROUND(height.min)+' to '+ROUND(height.max)+' m':'not recorded')+'.',
  'Synthetic airspeed range: '+(speed?ROUND(speed.min)+' to '+ROUND(speed.max)+' kt':'not recorded')+'.',
  'Synthetic bank range: '+(bank?ROUND(bank.min)+' to '+ROUND(bank.max)+' degrees':'not recorded')+'.',
  'Synthetic vertical-rate range: '+(vertical?ROUND(vertical.min)+' to '+ROUND(vertical.max)+' m/s':'not recorded')+'.',
  'Phases observed: '+(phases.length?phases.join(' → '):'not recorded')+'.'
 ];
 const prompts=['Use the time scrubber to compare the instrument trends with the control movements you remember.'];
 if(phases.includes('roll')&&phases.includes('climb'))prompts.push('Find the fictional runway-to-climb transition. Which instrument indications changed near it?');
 if(phases.includes('approach')||phases.includes('rollout'))prompts.push('Look at the synthetic height and descent trend during approach or rollout. Which changes should be discussed with a qualified instructor?');
 if(phases.includes('lift')||phases.includes('hover')||phases.includes('landed'))prompts.push('Compare conceptual helicopter lift, hover or landing phases with the invented height trend; no helicopter technique is being assessed.');
 if(bank&&(Math.abs(bank.min)>5||Math.abs(bank.max)>5))prompts.push('Inspect an indicated bank change. Compare the associated synthetic heading and ground-track readings in the simulator.');
 if(!prompts.slice(1).length)prompts.push('Identify one reference and comparison moment, and note what the simplified model cannot demonstrate.');
 prompts.push('Write down one uncertainty or question for a qualified instructor. No conclusions about pilot skill can be drawn.');
 return {available:true,text:facts.join('\n'),prompts,warning:WARNING,observedSamples:points.length};
}
const api={summarise,WARNING};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.AGSAFlightAfterAction=api;
})(typeof window!=='undefined'?window:null);
