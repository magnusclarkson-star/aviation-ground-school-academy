/* Deterministic, private replay cursor for sampled fictional observations.
 * No timers, network, storage, aircraft commands or automatic playback.
 */
(function(root){'use strict';
function makePlayer(){
 let count=0,index=0,playing=false,carry=0;
 const boundedIndex=value=>Math.min(Math.max(0,Math.floor(Number.isFinite(Number(value))?Number(value):0)),Math.max(0,count-1));
 function load(value){
  if(!Number.isInteger(value)||value<0||value>600)throw Error('Expected 0–600 fictional samples');
  count=value;index=0;carry=0;playing=false;
  return status();
 }
 function seek(value){index=boundedIndex(value);carry=0;return status();}
 function play(){
  if(count<2){playing=false;return status();}
  if(index>=count-1)index=0;
  carry=0;playing=true;return status();
 }
 function pause(){playing=false;carry=0;return status();}
 function tick(deltaSeconds){
  if(!playing||!Number.isFinite(deltaSeconds)||deltaSeconds<=0)return status();
  carry+=Math.min(.25,deltaSeconds);
  while(carry>=1&&playing){carry-=1;index+=1;if(index>=count-1){index=count-1;playing=false;carry=0;}}
  return status();
 }
 function status(){return {count,index,playing,atEnd:count>0&&index===count-1};}
 return {load,seek,play,pause,tick,status};
}
const api={makePlayer};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.AGSAFlightPlayback=api;
})(typeof window!=='undefined'?window:null);
