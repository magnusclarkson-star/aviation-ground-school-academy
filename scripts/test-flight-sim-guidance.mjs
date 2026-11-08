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

runway.phase="climb";runway.altitudeM=35;runway.verticalMs=2.6;runway.time=13;
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
assert.throws(()=>G.start({phase:"unknown"}),/state required/);
assert.throws(()=>G.observe(session,heli,[]),/Start a new practice session/);
assert.throws(()=>G.guidance(null,controls),/required/);
assert.throws(()=>G.observe(session,runway,null),/must be a list/);
console.log("Immersive practice guidance passed: fictional takeoff, climb, free flight, approach, warning states, rotorcraft and session-only observation summary.");
