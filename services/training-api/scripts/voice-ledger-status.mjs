/* Read-only operator health summary; never prints actor UUIDs, provider IDs,
 * handles, credentials, student records or transcript content.
 */
import {createPool} from "../src/postgres.mjs";
if(process.env.AGSA_ALLOW_INSECURE_LOCAL==="1"&&process.env.NODE_ENV==="production")
 throw Error("Refusing insecure production operator mode");
const pool=createPool(process.env);
try{
 const r=await pool.query(`
  SELECT state,COUNT(*)::integer AS count,
   COUNT(*) FILTER(WHERE state='ending' AND next_attempt_at<now()-interval '5 minutes')::integer AS overdue,
   MAX(attempt_count)::integer AS max_attempts
  FROM realtime_voice_calls
  GROUP BY state ORDER BY state`);
 const summary=Object.fromEntries(r.rows.map(row=>[row.state,{
  count:row.count,overdue:row.overdue,maxAttempts:row.max_attempts
 }]));
 console.log(JSON.stringify({component:"realtime-voice-recovery",summary},null,2));
 if(Number(summary.uncertain?.count||0)>0||Number(summary.ending?.overdue||0)>0){
  console.error("ACTION REQUIRED: unresolved call identity or overdue upstream hangup. Inspect private DB and provider dashboard.");
  process.exitCode=2;
 }
}finally{await pool.end()}
