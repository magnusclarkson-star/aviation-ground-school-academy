/* Guided Flight Exercise V3 — explicitly fictional, accelerated educational model.
 * Never use these thresholds, speeds or controls as operational flight guidance.
 * FAA aircraft training references should inform lessons, not create claimed certification.
 */
(function(root){
 "use strict";
 const Base=root&&root.CockpitV3Model
   ?root.CockpitV3Model
   :(typeof require==="function"?require("./cockpit-v3-model.js"):null);
 if(!Base)throw Error("Cockpit V3 model unavailable");
 const clamp=Base.clamp;
 const phases={
  roll:{title:"1 · Takeoff roll",task:"Set flaps to 0° or 10°, increase simulated power, and observe increasing speed. When above 50 indicated knots, gently command nose-up pitch.",goal:"Build speed then lift off in the fictional trainer."},
  climb:{title:"2 · Initial climb",task:"Keep a modest nose-high attitude and sufficient simulated power. Check that altitude and vertical speed increase; keep bank close to level.",goal:"Reach 80 feet above the fictional runway with a positive climb indication."},
  climbReady:{title:"Climb checkpoint achieved",task:"The departure climb target is met. Continue the exercise using Approach segment; the simulator will openly reposition to a fictional approach entry.",goal:"Press Begin approach segment to continue."},
  approach:{title:"3 · Stabilized approach",task:"Select 20° flaps and use yoke and throttle to establish a controlled, descending approach. Check airspeed, vertical speed and bank.",goal:"Reach approximately 100 feet above the fictional runway with a modest descent."},
  landing:{title:"4 · Landing and roundout",task:"Manage pitch, power and 20°–30° flaps while descending to the synthetic runway. An unstable touchdown will be flagged for review.",goal:"Touch down at a controlled speed and descent rate in this illustrative scenario."},
  rollout:{title:"5 · Landing roll",task:"Reduce simulated throttle and watch the aircraft slow on the synthetic runway.",goal:"Reduce speed below 15 knots to finish the lesson."},
  review:{title:"Review · unstable touchdown",task:"This fictional touchdown exceeded a training target. Review your speed, descent rate, bank and flap setting, then replay approach or practise a go-around.",goal:"Use Repeat approach or Go-around; no flight credit is awarded."},
  complete:{title:"Exercise complete",task:"You completed the synthetic rollout. Review how pitch, power, flaps and airspeed affected the indicated flight path.",goal:"Try another stage or return to the full cockpit."}
 };
 function note(s,message){
  s.message=message;s.events.push(message);if(s.events.length>15)s.events.shift();
 }
 function make(phase="roll"){
  const s={phase:"roll",state:Base.makeState(),input:Base.makeInput(),events:[],message:"",score:0,lastChange:0,clock:0,simMultiplier:2,completed:false,landing:{},lastCheck:""};
  setup(s,phase);
  return s;
 }
 function setup(s,phase){
  if(!["roll","climb","approach","landing"].includes(phase))throw Error("Invalid practice segment");
  const st=Base.makeState(),inpt=Base.makeInput();
  const preset={
   roll:{alt:0,speed:0,power:0,flaps:0,throttle:0,ground:true},
   climb:{alt:12,speed:75,power:75,flaps:0,throttle:75,ground:false},
   approach:{alt:230,speed:86,power:48,flaps:10,throttle:48,ground:false},
   landing:{alt:85,speed:78,power:40,flaps:20,throttle:40,ground:false}
  }[phase];
  Object.assign(st,{altitude:preset.alt,speed:preset.speed,power:preset.power,flaps:preset.flaps,
    verticalSpeed:phase==="approach"?-160:phase==="landing"?-220:0,
    grounded:preset.ground,groundTrack:0,pitch:0,roll:0,heading:270,
    liftIndex:Base.flapEffects(preset.flaps).liftIndex,dragIndex:Base.flapEffects(preset.flaps).dragIndex
  });
  inpt.throttle=preset.throttle;inpt.flaps=preset.flaps;
  s.state=st;s.input=inpt;s.phase=phase;s.clock=0;s.lastChange=0;s.completed=false;s.landing={};
  s.lastCheck="";
  note(s,phase==="roll"?"Fictional runway exercise started. This is not an aircraft-specific procedure.":"Training segment repositioned to "+phase+". Flight state was reset for this lesson.");
  return s;
 }
 function ground(s,dt,rollout){
  const st=s.state,inpt=s.input;
  const rate=(a,b,k)=>a+(b-a)*(1-Math.exp(-k*dt));
  st.power=rate(st.power,clamp(inpt.throttle,0,100),3.2);
  st.flaps=rate(st.flaps,clamp(inpt.flaps,0,30),2.4);
  const fx=Base.flapEffects(st.flaps);
  st.liftIndex=fx.liftIndex;st.dragIndex=fx.dragIndex;
  const target=rollout?(st.power<28?0:Math.max(0,(st.power-28)*.4)) : Math.max(0,(st.power-18)*.93);
  st.speed=rate(st.speed,Math.min(target,78),rollout?1.1:.42);
  st.altitude=0;st.verticalSpeed=0;st.roll=rate(st.roll,0,3);
  st.pitch=rate(st.pitch,-inpt.yokeY*4,1.5);
  st.slip=rate(st.slip,clamp(inpt.rudder,-1,1)*.7,2);
  st.turnRate=clamp(inpt.rudder,-1,1)*.5;
  st.heading=(st.heading+st.turnRate*dt+3600)%360;
  st.groundTrack=(st.groundTrack||0)+st.speed*dt/3600;
  st.distance+=st.speed*dt/3600;st.elapsed+=dt;
 }
 function step(s,dt){
  if(s.completed||s.phase==="review")return s;
  const realDt=clamp(Number(dt)||0,0,.05);
  if(realDt<=0)return s;
  const simDt=realDt*s.simMultiplier;
  const st=s.state,inpt=s.input;
  s.clock+=simDt;
  const prevAltitude=st.altitude;
  if(st.grounded)ground(s,simDt,s.phase==="rollout");
  else Base.step(st,inpt,simDt);
  if(s.phase==="roll"){
   if(st.speed>=49&&inpt.throttle>=70&&inpt.yokeY<=-.23){
    st.grounded=false;st.altitude=3;st.verticalSpeed=175;st.pitch=Math.max(3,st.pitch);
    s.phase="climb";s.score+=1;
    note(s,"Liftoff illustrated: the fictional aircraft is airborne. Maintain a controlled climb.");
   }
  }else if(s.phase==="climb"){
   if(st.altitude>=80&&st.verticalSpeed>=130&&Math.abs(st.roll)<17){
    s.phase="climbReady";s.score+=1;
    note(s,"Climb checkpoint reached. Advance to approach practice when ready.");
   }
  }else if(s.phase==="approach"){
   const configured=inpt.flaps>=20&&st.flaps>14;
   const descending=st.verticalSpeed < -90&&st.verticalSpeed> -1100;
   const controlled=st.speed>=55&&st.speed<=105&&Math.abs(st.roll)<=15;
   s.lastCheck=configured&&descending&&controlled?"STABLE TRAINING BAND":"ADJUST SPEED / CONFIGURATION / DESCENT";
   if(st.altitude<=100){
    if(configured&&descending&&controlled){
     s.phase="landing";s.score+=1;note(s,"Fictional approach checkpoint reached. Continue controlling descent toward touchdown.");
    }else{
     s.phase="review";note(s,"Approach did not meet the example stability gates. Repeat approach or go around in this lesson.");
    }
   }
  }else if(s.phase==="landing"){
   if(prevAltitude>0&&st.altitude<=0){
    const stable=st.speed>=40&&st.speed<=100&&st.verticalSpeed>=-950
      &&Math.abs(st.roll)<15&&inpt.flaps>=20;
    s.landing={speed:st.speed,verticalSpeed:st.verticalSpeed,stable};
    st.grounded=true;st.altitude=0;
    if(stable){s.phase="rollout";s.score+=1;note(s,"Illustrative touchdown within this training scenario. Reduce power for rollout.");}
    else{s.phase="review";note(s,"Unstable illustrative touchdown. Review speed, bank, flaps and rate of descent.");}
   }
  }else if(s.phase==="rollout"&&st.speed<=15&&inpt.throttle<=24){
   s.phase="complete";s.completed=true;s.score+=1;
   note(s,"Completed: takeoff/climb and approach/landing training checkpoints are complete for this scenario.");
  }
  return s;
 }
 function approach(s){return setup(s,"approach");}
 function goAround(s){
  const st=s.state,inpt=s.input;
  st.grounded=false;st.altitude=Math.max(90,st.altitude);st.speed=Math.max(67,st.speed);st.verticalSpeed=0;
  inpt.throttle=86;inpt.yokeY=-.35;inpt.flaps=10;
  s.phase="climb";s.clock=0;
  note(s,"Illustrative go-around selected. Power and climb attitude have been set automatically for the exercise, not for a real aircraft.");
  return s;
 }
 const api={make,setup,step,approach,goAround,phases};
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.CockpitV3Mission=api;
})(typeof window!=="undefined"?window:null);
