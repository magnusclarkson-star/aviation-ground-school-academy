/* Contextual, deterministic cockpit teaching cues.
 * Fictional simulator thresholds only. No external AI, network requests,
 * learner identity, persistent recording or aircraft-specific instruction.
 */
(function(root){
"use strict";
const abs=Math.abs;
const num=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const output=(key,text)=>({key,text});
function cue(id,state={},input={}){
 const pitch=num(state.pitch),bank=num(state.roll),speed=num(state.speed);
 const vs=num(state.verticalSpeed),turn=abs(num(state.turnRate));
 const slip=abs(num(state.slip)),flaps=num(state.flaps),drag=num(state.dragIndex,1);
 switch(id){
 case "level":
  if(abs(pitch)>3)return output("pitch","Observe the pitch ladder: this model is outside the near-level attitude target.");
  if(abs(bank)>5)return output("bank","Observe the horizon: the bank indication is outside this example's wings-level range.");
  if(turn>.4)return output("heading","Cross-check the turn-rate indication while monitoring bank.");
  if(speed<75||speed>125)return output("speed","Compare indicated airspeed with the example's 75 to 125 knot range.");
  return output("level-ok","The level-flight example indications are currently within target. Keep scanning the instruments.");
 case "climb":
  if(num(input.throttle)<60)return output("power","The example climb target includes at least 60 percent simulated power.");
  if(pitch<4||pitch>16)return output("pitch","Compare pitch against the example climb range of 4 to 16 degrees.");
  if(vs<300||vs>2200)return output("vertical","Check vertical speed alongside pitch and power in this simulated climb.");
  if(abs(bank)>12)return output("bank","The bank exceeds the example's 12-degree climb range.");
  if(speed<60)return output("speed","Watch the model's indicated airspeed during the climb.");
  return output("climb-ok","The example climb indications are presently within target. Continue scanning.");
 case "turn":
  if(abs(bank)<8||abs(bank)>32)return output("bank","Watch the moving horizon: the example turn calls for 8 to 32 degrees of bank.");
  if(slip>.2)return output("slip","Observe the slip/skid ball and rudder indication: the model shows uncoordinated turning.");
  if(turn<.5||turn>5)return output("rate","Compare the turn-rate cue with the example 0.5 to 5 degrees per second range.");
  if(speed<65)return output("speed","Check simulated indicated airspeed during the turn.");
  return output("turn-ok","The example turn indications are currently within target. Monitor horizon, slip and heading.");
 case "descent":
  if(pitch>-3||pitch<-16)return output("pitch","Compare pitch with the example descent range of minus 3 to minus 16 degrees.");
  if(vs>-250||vs<-2200)return output("vertical","Cross-check the vertical speed indication and the attitude ladder.");
  if(abs(bank)>12)return output("bank","The model's bank exceeds the example descent range.");
  if(speed<60)return output("speed","Watch simulated airspeed as the vertical-speed indication changes.");
  return output("descent-ok","The example descent indications are presently within target. Keep cross-checking.");
 case "flap":
  if(num(input.flaps)!==20)return output("selection","The flap observation uses the 20-degree detent. Compare selected and indicated position.");
  if(flaps<17||flaps>23)return output("travel","Watch the indicated flaps travel toward the selected 20 degrees.");
  if(drag<=1.25)return output("drag","Compare the relative drag meter with its clean-wing reference.");
  if(speed<55||speed>145)return output("speed","Compare simulated airspeed with the example flap observation range.");
  return output("flap-ok","The flap example indications are within target. Compare lift, drag and airspeed.");
 default:
  return output("unknown","Select a supported cockpit practice objective.");
 }
}
function shouldSpeak({enabled=false,elapsed=0,key="",lastKey="",lastAt=-100}={}){
 const t=Number(elapsed),previous=Number(lastAt);
 return !!enabled&&Number.isFinite(t)&&t>=1&&Number.isFinite(previous)
   &&t-previous>=3.5&&(key!==lastKey||t-previous>=7);
}
const api={cue,shouldSpeak};
if(root)root.CockpitV3LiveCoach=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
