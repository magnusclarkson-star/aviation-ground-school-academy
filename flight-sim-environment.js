/* Educational fictional aircraft/environment profiles for the Academy.
 * Numbers are deliberately invented for contrast; none reproduces a
 * particular make/model, POH, flight-tested handling or safe flight limit.
 */
(function(root){"use strict";
const profiles=Object.freeze({
 trainer:Object.freeze({
  id:"trainer",name:"Basic trainer · stable",description:"Moderate fictional response and a gentle introduction to aircraft attitude.",
  bankDeg:32,pitchDeg:13,rollResponse:2,pitchResponse:1.7,
  groundAccel:7.5,rotationKt:47,approachKt:73,stallKt:39,
  airborneBaseKt:55,airbornePowerKt:70,airborneDragKt:.34,
  climbLift:.92,climbPower:2,climbCap:6,turnBank:.047,turnRudder:1.1
 }),
 sport:Object.freeze({
  id:"sport",name:"Sport trainer · responsive",description:"Lighter, quicker simulated pitch and bank responses with a slower fictional approach.",
  bankDeg:39,pitchDeg:16,rollResponse:2.7,pitchResponse:2.2,
  groundAccel:7.0,rotationKt:42,approachKt:67,stallKt:34,
  airborneBaseKt:48,airbornePowerKt:64,airborneDragKt:.30,
  climbLift:1.02,climbPower:2.25,climbCap:6.5,turnBank:.055,turnRudder:1.3
 }),
 touring:Object.freeze({
  id:"touring",name:"Touring trainer · steady",description:"Higher fictional airspeed, slightly slower control response and a longer-feeling landing approach.",
  bankDeg:27,pitchDeg:11,rollResponse:1.5,pitchResponse:1.4,
  groundAccel:8.3,rotationKt:55,approachKt:84,stallKt:45,
  airborneBaseKt:66,airbornePowerKt:77,airborneDragKt:.40,
  climbLift:.85,climbPower:1.9,climbCap:5.5,turnBank:.04,turnRudder:.9
 })
});
const winds=Object.freeze({
 calm:Object.freeze({id:"calm",name:"Calm conditions",description:"No background wind. The default demonstrations are unchanged.",x:0,z:0,gust:0}),
 crosswind:Object.freeze({id:"crosswind",name:"Left crosswind · illustrative",description:"Sideways airflow moves the fictional aircraft right while airborne.",x:4.5,z:0,gust:0}),
 headwind:Object.freeze({id:"headwind",name:"Headwind · illustrative",description:"Airflow toward the viewer reduces ground speed on a straight approach.",x:0,z:-6.0,gust:0}),
 gusts:Object.freeze({id:"gusts",name:"Gusty crosswind · illustrative",description:"An invented, deterministic varying side breeze; not actual weather.",x:2.8,z:-2.4,gust:1.7})
});
function selectProfile(id){
 if(!Object.hasOwn(profiles,id))throw Error("Unknown fictional airframe profile");
 return profiles[id];
}
function selectWind(id){
 if(!Object.hasOwn(winds,id))throw Error("Unknown fictional wind setting");
 return winds[id];
}
function windAt(id,time=0){
 const preset=selectWind(id);
 const t=Number.isFinite(time)?Math.max(0,time):0;
 const factor=preset.gust?Math.sin(t*.63)*.7+Math.sin(t*1.51+1.3)*.3:0;
 const x=preset.x+preset.gust*factor,z=preset.z+(preset.gust*.3*Math.sin(t*.81));
 const strength=Math.hypot(x,z);
 return {id:preset.id,x,z,speedKt:strength/.514444};
}
function describeWind(id){return selectWind(id).name}
function compassTrack(x,z){
 if(Math.hypot(x,z)<.05)return 0;
 return (Math.atan2(x,z)*180/Math.PI+360)%360;
}
// The imaginary strip is aligned north/south and usable in either direction.
// Distinguish a controlled runway touchdown from crossing the pavement
// sideways. These are forgiving *game* thresholds, not aviation limits.
function runwayAlignment(headingDeg,trackDeg){
 const axisError=angle=>{
  if(!Number.isFinite(angle))return 180;
  return Math.abs(((angle%180)+270)%180-90);
 };
 const headingErrorDeg=axisError(headingDeg);
 const trackErrorDeg=axisError(trackDeg);
 return {headingErrorDeg,trackErrorDeg,
  aligned:headingErrorDeg<=30&&trackErrorDeg<=35};
}
const api={profiles,winds,selectProfile,selectWind,windAt,describeWind,compassTrack,runwayAlignment};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightEnvironment=api;
})(typeof window!=="undefined"?window:null);
