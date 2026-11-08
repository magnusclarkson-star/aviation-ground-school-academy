/* Three guided, browser-local *observational* flight-simulator exercises.
 * All content is SME_REVIEW_REQUIRED; this is scripted (NOT generative AI).
 * Never grade, certify, log flight hours or persist a personal record.
 */
(function(root){"use strict";
const LESSONS=Object.freeze({
 "cg-shift":Object.freeze({
  id:"cg-shift",title:"Where does the imaginary CG move?",
  audience:"Air Scouts and pilot beginners",review:"SME_REVIEW_REQUIRED",
  preset:Object.freeze({mode:"airplane",profileId:"trainer",physicsId:"aero",windId:"calm",scenario:"runway",resetLoading:true}),
  objective:"Compare mass moments and centre-of-gravity changes after moving imaginary baggage aft.",
  question:"In this invented loading diagram, why did adding rear baggage move the centre of gravity aft?",
  choices:Object.freeze([
   Object.freeze({id:"a",text:"It increased the moment at a station farther behind the fictional datum."}),
   Object.freeze({id:"b",text:"It changed the direction of the imaginary wind."}),
   Object.freeze({id:"c",text:"It means the load is approved for an actual aircraft."})
  ]),
  correct:"a",
  explanation:"Mass multiplied by its invented arm changes total moment; the centre of gravity is total moment divided by total mass. This model's reference band is not a real aircraft loading limit."
 }),
 "wind-track":Object.freeze({
  id:"wind-track",title:"Heading versus track",
  audience:"Air Scouts and aspiring pilots",review:"SME_REVIEW_REQUIRED",
  preset:Object.freeze({mode:"airplane",profileId:"trainer",physicsId:"classic",windId:"crosswind",scenario:"approach",resetLoading:false}),
  objective:"Observe how the fictional ground track changes with crosswind while the nose heading remains similar.",
  question:"What best explains the different heading and track indications in this fictional crosswind?",
  choices:Object.freeze([
   Object.freeze({id:"a",text:"Heading is the aircraft's nose direction; track shows its motion over the ground."}),
   Object.freeze({id:"b",text:"Wind always changes the nose heading automatically by the same angle."}),
   Object.freeze({id:"c",text:"A ground track is the same as the aircraft's angle of attack."})
  ]),
  correct:"a",
  explanation:"Airflow adds a ground-relative component to the simulated motion. Heading describes orientation; track describes movement across the ground. This is not a crosswind landing procedure."
 }),
 "energy-flaps":Object.freeze({
  id:"energy-flaps",title:"Flaps, drag and energy",
  audience:"Aviation enthusiasts and aspiring pilots",review:"SME_REVIEW_REQUIRED",
  preset:Object.freeze({mode:"airplane",profileId:"trainer",physicsId:"aero",windId:"calm",scenario:"approach",resetLoading:true}),
  objective:"Compare the imaginary wing-force readouts after selecting full flaps in experimental final approach.",
  question:"What does the experimental force display illustrate when the flap selector changes?",
  choices:Object.freeze([
   Object.freeze({id:"a",text:"Changing flap setting changes the model's invented lift and drag coefficients."}),
   Object.freeze({id:"b",text:"The simulator displays manufacturer-approved landing speeds."}),
   Object.freeze({id:"c",text:"Flaps do not affect either lift or drag in the model."})
  ]),
  correct:"a",
  explanation:"The imaginary wing model changes both lift and drag when flaps change. The computed coefficients are fabricated, not data for any real aircraft."
 })
});
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
function lesson(id){
 if(!own(LESSONS,id))throw Error("Unknown educational simulator exercise");
 return LESSONS[id];
}
function matches(preset,state){
 return state?.mode===preset.mode && state?.scenario===preset.scenario &&
  state?.profileId===preset.profileId && state?.windId===preset.windId &&
  state?.physicsId===preset.physicsId;
}
function begin(id,state){
 const data=lesson(id);
 if(!matches(data.preset,state))throw Error("Set the fictional preset before beginning this exercise");
 const session={
  id,stage:0,done:false,interrupted:false,feedback:"",
  baseline:null,latest:null,
  // Holds only a small, transient description of the current exercise.
  // No names, account IDs, dates, grades, scores or telemetry histories.
  review:data.review
 };
 return observe(session,state,null);
}
function observe(session,state,input){
 if(!session)throw Error("Exercise session required");
 if(session.done||session.interrupted)return session;
 const data=lesson(session.id);
 if(!matches(data.preset,state)){
  session.interrupted=true;
  session.feedback="The aircraft or scenario changed. Restart this guided exercise to compare consistent fictional conditions.";
  return session;
 }
 const load=state.loading;
 if(session.id==="cg-shift"&&session.stage===1&&load&&session.baseline){
  const shifted=load.loadout.baggageKg>=session.baseline.baggageKg+40&&
   load.totalKg>session.baseline.massKg&&
   load.cgPercentMAC>session.baseline.cgPercentMAC+1;
  if(shifted){
   session.latest={massKg:load.totalKg,cgPercentMAC:load.cgPercentMAC,
    baggageKg:load.loadout.baggageKg};
   session.stage=2;session.feedback=
    "Observed: greater fictional mass and an aft CG shift. Compare the moments, then choose an explanation.";
  }
 }
 if(session.id==="wind-track"&&session.stage===0){
  const track=Number(state.trackDeg),heading=Number(state.headingDeg);
  const delta=Number.isFinite(track)&&Number.isFinite(heading)?
   Math.abs(((track-heading+540)%360)-180):0;
  if(state.time>=.9&&Math.abs(state.xM)>=5&&delta>=1.5){
   session.stage=1;session.latest={
    trackDeg:track,headingDeg:heading,lateralOffsetM:state.xM
   };
   session.feedback="Observed: the imaginary aircraft's path over the ground differs from its nose direction.";
  }
 }
 if(session.id==="energy-flaps"&&session.stage===0&&input?.flaps===30&&
  state.time>.1&&Number(state.dragN)>0&&Number(state.energyJPerKg)>0){
  session.stage=1;session.latest={flapDeg:30,dragN:state.dragN,energyJPerKg:state.energyJPerKg};
  session.feedback="Observed: full fictional flaps selected while drag and energy are displayed. Interpret the illustrated relationship.";
 }
 return session;
}
function recordBaseline(session,state){
 if(!session||session.id!=="cg-shift"||session.stage!==0||session.interrupted||session.done)
  return false;
 if(!matches(lesson(session.id).preset,state)||!state.loading)return false;
 session.baseline={
  massKg:state.loading.totalKg,
  cgPercentMAC:state.loading.cgPercentMAC,
  baggageKg:state.loading.loadout.baggageKg
 };
 session.stage=1;
 session.feedback="Baseline captured for this page only. Add at least 40 kg of imaginary rear baggage, then release the slider.";
 return true;
}
function respond(session,choice){
 if(!session||session.done||session.interrupted)throw Error("Active exercise required");
 const data=lesson(session.id);
 const reflectionStage=session.id==="cg-shift"?2:1;
 if(session.stage!==reflectionStage)throw Error("Complete the observation before answering");
 if(!data.choices.some(option=>option.id===choice))throw Error("Choose a listed reflection answer");
 const matchesExplanation=choice===data.correct;
 if(matchesExplanation){
  session.done=true;session.feedback="This matches the fictional illustration. "+data.explanation+
   " You have completed a self-guided observation, not a graded assessment or a training credit.";
 }else session.feedback=
  "That explanation does not match the model's illustration. Review the readouts and try another reflection choice; no grade is recorded.";
 return matchesExplanation;
}
function view(session){
 if(!session)return {active:false};
 const data=lesson(session.id);
 const reflectionStage=session.id==="cg-shift"?2:1;
 const prompt=session.interrupted?
  "Restart the exercise to restore its illustrated scenario.":
  session.done?"Observational practice complete. You may repeat it or return to free flying.":
  session.id==="cg-shift"&&session.stage===0?
   "Read the initial fictional mass and CG; press Record baseline once you have inspected them.":
  session.id==="cg-shift"&&session.stage===1?
   "Increase rear baggage by at least 40 kg and release the slider. Notice the changing mass, moment and CG.":
  session.id==="wind-track"&&session.stage===0?
   "Observe the moving runway and compare heading, track and offset until the crosswind causes visible drift.":
  session.id==="energy-flaps"&&session.stage===0?
   "While on fictional final approach, choose 30° flaps; watch the drag and energy display update.":
  "Read the observation, then choose the explanation that matches what this model illustrated.";
 return {
  active:true,id:session.id,title:data.title,objective:data.objective,
  prompt,stage:session.stage,completed:session.done,interrupted:session.interrupted,
  feedback:session.feedback,showRecord:session.id==="cg-shift"&&session.stage===0,
  showQuestion:session.stage===reflectionStage&&!session.done&&!session.interrupted,
  question:data.question,choices:data.choices,explanation:data.explanation,
  stepText:session.done?"Observation complete":session.interrupted?"Needs restart":
    "Observation "+(session.stage+1)+" of "+(reflectionStage+1),
  review:data.review
 };
}
const api={LESSONS,lesson,begin,observe,recordBaseline,respond,view,matches};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightExercises=api;
})(typeof window!=="undefined"?window:null);
