/* Bounded, opt-in, device-only fictional flight trace. No persistence or network. */
(function(root){'use strict';
const MAX_SAMPLES=600, INTERVAL=1;
const rounded=(x,d=1)=>Number.isFinite(x)?Number(x.toFixed(d)):null;
const phaseAllowed=new Set(['roll','climb','flight','approach','rollout','complete','halted','pad','lift','hover','landed']);
function makeRecorder(){
 let active=false, elapsed=0, sampleCount=0, samples=[], reason='Not started', mode=null,scenario=null;
 function clear(){active=false;elapsed=0;sampleCount=0;samples=[];reason='Cleared';mode=null;scenario=null;}
 function start(state){clear();if(!state||!['airplane','helicopter'].includes(state.mode))throw Error('Synthetic aircraft required');mode=state.mode;scenario=state.scenario;active=true;reason='Recording';}
 function sample(state,input,dt){
  if(!active)return;
  if(!state||state.mode!==mode||state.scenario!==scenario){active=false;reason='Aircraft or scenario changed';return;}
  if(!Number.isFinite(dt)||dt<=0)return;
  elapsed+=Math.min(.08,dt);
  const target=Math.floor(elapsed/INTERVAL);
  if(target<=sampleCount)return;
  sampleCount=target;
  if(samples.length>=MAX_SAMPLES){active=false;reason='Ten-minute recording limit reached';return;}
  samples.push({
   t:rounded(elapsed),phase:phaseAllowed.has(state.phase)?state.phase:'other',
   altitudeM:rounded(state.altitudeM),speedKt:rounded(state.speedKt),
   headingDeg:rounded(state.headingDeg),verticalMs:rounded(state.verticalMs),
   bankDeg:rounded(state.rollDeg),pitchDeg:rounded(state.pitchDeg),
   lateralM:rounded(state.xM),forwardM:rounded(state.zM),
   bankInput:rounded(input.bank,2),pitchInput:rounded(input.pitch,2),
   rudderInput:rounded(input.rudder,2),powerInput:rounded(mode==='helicopter'?input.collective:input.throttle,2),
   flapDeg:mode==='airplane'?rounded(input.flaps,0):null
  });
  if(samples.length>=MAX_SAMPLES){active=false;reason='Ten-minute recording limit reached';}
 }
 function stop(){if(active){active=false;reason='Stopped by learner';}}
 function status(){return {active,seconds:rounded(elapsed),samples:samples.length,reason};}
 function exportData(){
  return {schema:'academy.synthetic-flight-trace.v1',reviewStatus:'SME_REVIEW_REQUIRED',
   synthetic:true,trainingCredit:false,instructorVerified:false,
   mode,scenario,sampling:'approximately 1 sample per simulated second; capped at 600 points',
   observations:samples.map(s=>({...s}))};
 }
 return {start,sample,stop,clear,status,exportData};
}
const api={makeRecorder,MAX_SAMPLES};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.AGSAFlightRecorder=api;
})(typeof window!=='undefined'?window:null);
