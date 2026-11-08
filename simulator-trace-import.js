/* Offline, explicit import of fictional observations selected by the learner.
 * Pure validation; no storage, network, identity or remote services.
 */
(function(root){'use strict';
const MAX_FILE_BYTES=512*1024, MAX_SAMPLES=600;
function validateTrace(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return {ok:false,reason:'The selected data is not a trace object.'};
 if(value.schema!=='academy.synthetic-flight-trace.v1'||value.synthetic!==true)
  return {ok:false,reason:'This is not an Academy synthetic flight trace.'};
 if(!['airplane','helicopter'].includes(value.mode))
  return {ok:false,reason:'The trace has an unknown fictional aircraft type.'};
 if(!Array.isArray(value.observations)||value.observations.length<2||value.observations.length>MAX_SAMPLES)
  return {ok:false,reason:'A trace must have between 2 and 600 synthetic samples.'};
 // Do not retain unsolicited data fields from a JSON file (names, paths, tokens).
 const fields=['t','phase','altitudeM','speedKt','verticalMs','bankDeg','lateralM'];
 const points=value.observations.map(s=>{
  const p={};for(const k of fields){
   const v=s&&typeof s==='object'&&!Array.isArray(s)?s[k]:undefined;
   if(k==='phase'){p[k]=typeof v==='string'?v.slice(0,24):null;}
   else p[k]=typeof v==='number'&&Number.isFinite(v)?v:null;
  }
  return p;
 });
 return {ok:true,trace:{schema:'academy.synthetic-flight-trace.v1',synthetic:true,mode:value.mode,observations:points}};
}
const api={validateTrace,MAX_FILE_BYTES,MAX_SAMPLES};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.AGSATraceImport=api;
})(typeof window!=='undefined'?window:null);
