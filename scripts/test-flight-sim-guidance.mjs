import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const G=require("../flight-sim-guidance.js");
const M=require("../flight-sim-model.js");

const runway=M.makeState("airplane");
const controls=M.makeInput("airplane");
let session=G.start(runway);
assert.equal(session.mode,"airplane");
assert.equal(session.scenario,"runway");
assert.deepEqual(session.phaseVisits,["roll"]);
assert.match(G.guidance(runway,controls).text,/throttle/);
assert.equal(G.guidance({...runway,speedKt:36},controls).tag,"RUNWAY · ACCELERATING");
assert.equal(G.guidance({...runway,speedKt:55},controls).tag,"RUNWAY · PITCH RESPONSE");

runway.phase="climb";runway.altitudeM=35;runway.verticalMs=2.6;runway.speedKt=83;runway.time=13;
G.observe(session,runway,["liftoff","climb"]);
assert.deepEqual(session.phaseVisits,["roll","climb"]);
assert.equal(session.liftoffs,1);
assert.equal(session.maxHeight,35);
assert.equal(G.guidance(runway,controls).tag,"CLIMB · INSTRUMENT CROSS-CHECK");
assert.equal(G.guidance({...runway,speedKt:31},controls).level,"caution");
assert.equal(G.guidance({...runway,phase:"flight"},controls).tag,"FREE FLIGHT · BANK AND LEVEL");
G.observe(session,{...runway,phase:"flight",time:18,xM:49,altitudeM:120,verticalMs:-2.4});
assert.equal(session.maxHeight,120);
assert.equal(session.maxOffset,49);
assert.equal(session.minVertical,-2.4);
assert.equal(session.elapsed,18);
assert.deepEqual(session.phaseVisits,["roll","climb","flight"]);

const shortFinal=M.makeState("airplane","approach");
assert.match(G.guidance(shortFinal,controls).tag,/SHORT FINAL/);
assert.equal(G.guidance({...shortFinal,xM:34},controls).level,"caution");
assert.match(G.guidance({...shortFinal,verticalMs:-5},controls).tag,/RAPID DESCENT/);
assert.equal(G.guidance({...shortFinal,speedKt:32},controls).level,"caution");
const finalSession=G.start(shortFinal);
G.observe(finalSession,{...shortFinal,phase:"rollout",time:25,altitudeM:0},["touchdown"]);
G.observe(finalSession,{...shortFinal,phase:"complete",time:38,altitudeM:0},["completed"]);
assert.equal(finalSession.landings,1);
assert.equal(G.guidance({...shortFinal,phase:"rollout"},controls).tag,"AFTER TOUCHDOWN · ROLLOUT");
assert.equal(G.guidance({...shortFinal,phase:"complete"},controls).complete,true);
const report=G.summary(finalSession,{...shortFinal,phase:"complete"});
assert.equal(report.outcome,"Fictional exercise completed");
assert.equal(report.seconds,38);
assert.equal(report.touchdowns,1);
assert.match(report.warning,/No training credit/);
assert.equal("studentId" in report,false);

const failed=G.start(shortFinal);
G.observe(failed,{...shortFinal,phase:"halted",time:10,altitudeM:0},["hardLanding"]);
assert.equal(G.summary(failed,{...shortFinal,phase:"halted"}).stopEvents,1);
assert.equal(G.guidance({...shortFinal,phase:"halted"},controls).level,"caution");

const heli=M.makeState("helicopter"),cyclic=M.makeInput("helicopter");
assert.equal(G.guidance(heli,cyclic).tag,"ROTORCRAFT · BEFORE LIFT");
for(const phase of ["lift","hover","flight"]){
 const cue=G.guidance({...heli,phase},cyclic);
 assert.match(cue.tag,/ROTORCRAFT/);
}
assert.equal(G.guidance({...heli,phase:"landed"},cyclic).complete,true);

assert.equal(session.r44Lesson,null,"airplane practice retains no rotorcraft lesson");
const mission=G.start(heli);
assert.equal(mission.r44Lesson.stage,"takeoff");
assert.equal(G.r44LessonStatus(mission,heli).short,"1/4 · TAKEOFF");
assert.match(G.guidance(heli,cyclic,mission).text,/hover/i);
assert.equal(G.guidance(heli,cyclic,mission).complete,false);
const inHover={...heli,onGround:false,phase:"hover",altitudeM:4,
 groundSpeedKt:.4,verticalMs:0,yawRateDegS:0,time:3,
 headingDeg:355,xM:0,zM:0};
G.observe(mission,inHover,["liftoff"]);
assert.equal(mission.r44Lesson.stage,"hover","stage 2 requires the helicopter to lift");
assert.equal(G.r44LessonStatus(mission,inHover).short,"2/4 · HOVER");
const held={...inHover,time:12,hoverAchieved:true,hoverHoldSec:8};
G.observe(mission,held,["hoverHeld"]);
assert.equal(mission.r44Lesson.stage,"turn");
assert.equal(mission.r44Lesson.turnStartHeading,355);
assert.equal(G.r44LessonStatus(mission,held).short,"3/4 · 90° TURN");
const excessive={...held,time:14,headingDeg:85,yawRateDegS:15};
G.observe(mission,excessive,[]);
assert.equal(mission.r44Lesson.stage,"turn","spinning fast is not a controlled turn");
const overshot={...held,time:17,headingDeg:120,yawRateDegS:0};
G.observe(mission,overshot,[]);
assert.equal(mission.r44Lesson.stage,"turn","overshooting the target is not completion");
const turned={...held,time:18,headingDeg:85,yawRateDegS:1,
 groundSpeedKt:1.2,verticalMs:.1,xM:3,zM:4};
G.observe(mission,turned,[]);
assert.equal(mission.r44Lesson.stage,"return",
 "wrapped 355° to 085° heading counts as exactly 90 degrees");
assert.equal(mission.r44Lesson.turnsCompleted,1);
assert.equal(G.r44LessonStatus(mission,turned).short,"4/4 · RETURN & LAND");
assert.match(G.guidance(turned,cyclic,mission).text,/helipad centre/i);
G.observe(mission,{...turned,onGround:true,phase:"landed",
 altitudeM:0,landingGrade:"precision",time:26},["touchdown"]);
assert.equal(mission.r44Lesson.status,"completed");
assert.equal(G.r44LessonStatus(mission,turned).short,"LESSON COMPLETE");
assert.equal(G.guidance({...turned,phase:"landed"},cyclic,mission).complete,true);
G.observe(mission,{...turned,time:27},[]);
assert.equal(mission.r44Lesson.turnsCompleted,1,"terminal mission does not repeat transitions");
const premature=G.start(heli);
G.observe(premature,{...heli,onGround:true,phase:"landed",landingGrade:"precision",time:6},["touchdown"]);
assert.equal(premature.r44Lesson.status,"incomplete",
 "a precision touchdown without guided hover and turn cannot complete the mission");
const failedMission=G.start(heli);
G.observe(failedMission,{...heli,onGround:true,phase:"halted",time:8},["hardLanding"]);
assert.equal(failedMission.r44Lesson.status,"stopped");
assert.equal(G.r44LessonStatus(failedMission,heli).short,"RESTART AFTER CONTACT");
const newMission=G.start(heli);
assert.equal(newMission.r44Lesson.stage,"takeoff","restart creates a fresh guided lesson");
assert.equal(G.r44LessonStatus(session,runway),null);

assert.throws(()=>G.start({phase:"unknown"}),/state required/);
assert.throws(()=>G.observe(session,heli,[]),/Start a new practice session/);
assert.throws(()=>G.guidance(null,controls),/required/);
assert.throws(()=>G.observe(session,runway,null),/must be a list/);
// Circuit cues must respond to the current position rather than telling
// learners to fly a fixed heading after they overshoot a turn. Both engines
// share the same local runway map and warning priorities.
for(const physicsId of ["classic","aero"]){
 const model=M.makeState("airplane","runway",{physicsId});
 const pilot=M.makeInput("airplane");
 const progress=G.start(model);
 Object.assign(model,{phase:"flight",onGround:false,xM:250,zM:1900,
  headingDeg:90,trackDeg:90,altitudeM:120,speedKt:86,verticalMs:0});
 progress.circuit.stage="crosswind";
 const first=G.guidance(model,pilot,progress);
 assert.equal(first.tag,"RETURN CIRCUIT · CROSSWIND");
 assert.match(first.text,/TURN LEFT 0[56][0-9]°/);
 assert.match(first.text,/to CROSSWIND/);
 model.xM=520;
 const second=G.guidance(model,pilot,progress);
 assert.notEqual(second.text,first.text,
  "new aircraft position must update bearing and distance to waypoint");
 model.speedKt=10;model.phase="climb";
 const slow=G.guidance(model,pilot,progress);
 assert.equal(slow.tag,"FICTIONAL LOW-ENERGY CUE",
  physicsId+" navigation may never mask critical low-speed observation");
 assert.equal(slow.level,"caution");
}
// Circuit height prompts follow actual position/height and remain subordinate
// to low-speed caution, in both the Classic and experimental learning modes.
const heightState=M.makeState("airplane","runway");
Object.assign(heightState,{phase:"flight",onGround:false,xM:700,zM:300,
 headingDeg:180,trackDeg:180,altitudeM:230,speedKt:90,verticalMs:0});
const heightProgress=G.start(heightState);
heightProgress.circuit.stage="downwind";
assert.match(G.guidance(heightState,M.makeInput(),heightProgress).text,/HGT ↓ 145m/);
heightState.altitudeM=145;
assert.match(G.guidance(heightState,M.makeInput(),heightProgress).text,/HGT OK/);
heightState.altitudeM=70;
assert.match(G.guidance(heightState,M.makeInput(),heightProgress).text,/HGT ↑ 145m/);
heightProgress.circuit.stage="base";
assert.match(G.guidance(heightState,M.makeInput(),heightProgress).text,/HGT ↑ 105m/);
heightState.speedKt=12;
assert.equal(G.guidance(heightState,M.makeInput(),heightProgress).tag,
 "FICTIONAL LOW-ENERGY CUE",
 "circuit height hints cannot override low-speed caution");

// An illustrative jet has a different fictional energy envelope from the
// original basic trainer; warning status must follow the selected airframe.
const fighter=M.makeState("airplane","runway",{airframeId:"f22"});
Object.assign(fighter,{phase:"flight",onGround:false,speedKt:75,altitudeM:130});
const fighterSession=G.start(fighter);
assert.equal(G.guidance(fighter,M.makeInput("airplane"),fighterSession).tag,
 "FICTIONAL LOW-ENERGY CUE");
fighter.speedKt=88;
assert.equal(G.guidance(fighter,M.makeInput("airplane"),fighterSession).tag,
 "RETURN CIRCUIT · DEPARTURE");
const returned=M.makeState("airplane","runway");
const returnedProgress=G.start(returned);
Object.assign(returned,{phase:"approach",onGround:false,xM:130,
 zM:-1100,altitudeM:95,headingDeg:0,trackDeg:0,
 verticalMs:-1.4,speedKt:84});
G.observe(returnedProgress,returned,[]);
const returningCue=G.guidance(returned,M.makeInput(),returnedProgress);
assert.equal(returningCue.tag,"RETURN CIRCUIT · FINAL");
assert.match(returningCue.text,/E130m/);
assert.match(returningCue.text,/L[1-9][0-9]*°/);
assert.equal(returningCue.level,"caution","off-centre return calls for alignment");
returned.xM=0;
G.observe(returnedProgress,returned,[]);
assert.match(G.guidance(returned,M.makeInput(),returnedProgress).text,/CTR/);
returned.verticalMs=-5;
returned.xM=130;
assert.match(G.guidance(returned,M.makeInput(),returnedProgress).tag,/RAPID DESCENT/,
 "high descent rate must override lateral and waypoint cues together");
returned.verticalMs=-1.4;returned.speedKt=12;
assert.equal(G.guidance(returned,M.makeInput(),returnedProgress).tag,
 "SHORT FINAL · LOW ENERGY",
 "off-centre approach must never hide low-speed caution");
assert.match(G.guidance({...runway,phase:"flight",speedKt:83},controls).text,
 /turn back toward the runway/,
 "unguided flight hint should not imply landing requires teleport/reset");

console.log("Immersive practice guidance passed: fictional takeoff, climb, free flight, approach, warning states, rotorcraft and session-only observation summary.");
