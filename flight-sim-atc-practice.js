/* Session-only international ATC readback practice for the fictional Academy simulator.
 * No microphone, user audio recording, network, operational charts, or regulatory grading.
 * Airport and runway labels are illustrative settings only: not current NOTAMs/clearances.
 */
(function(root){"use strict";
const World=root?.AGSAFlightATCWorld||(typeof module!=="undefined"&&module.exports?require("./flight-sim-atc-world.js"):null);
const CALLSIGN="Academy Four Two One";
const CONTROLLED=Object.freeze(["hold-short","takeoff","landing","altitude","go-around"]);
const ADVISORY=Object.freeze(["advisory-departure","advisory-arrival"]);
const DIGITS=Object.freeze({zero:"0",one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9"});
function words(value){
 return String(value||"").toLowerCase().replace(/\brwy\b/g,"runway")
  .replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/g,m=>DIGITS[m])
  .replace(/\b(right|left|centre|center)\b/g,m=>({right:"r",left:"l",centre:"c",center:"c"})[m])
  .replace(/[^a-z0-9]+/g," ").trim();
}
function compact(value){
 let s=words(value);
 // Join spoken runway digits and three-digit callsigns, e.g. 'two seven right'.
 for(let i=0;i<3;i++)s=s.replace(/\b(\d)\s+(\d)\b/g,"$1$2");
 return s.replace(/\s+/g,"");
}
function hasCallsign(answer){return compact(answer).includes("academy421");}
function hasRunway(answer,runway){
 const r=compact(runway),digits=r.match(/^\d+/)?.[0]||"",suffix=r.slice(digits.length);
 const norm=compact(answer);
 return norm.includes("runway"+r)||(digits.length>0&&norm.includes("runway"+String(Number(digits))+suffix));
}
function hasAltitude(answer,thousands){
 const s=compact(answer),n=String(thousands);
 return s.includes(n+"thousand")||s.includes(n+"000");
}
function makeDrill(airportId="gfll",kind="hold-short"){
 const airport=World.getAirport(airportId),r=airport.runway,advisory=airport.advisory===true;
 if(advisory&&!ADVISORY.includes(kind))kind="advisory-departure";
 if(!advisory&&!CONTROLLED.includes(kind))kind="hold-short";
 const runwayTest={label:"Correct runway and designator",test:txt=>hasRunway(txt,r)};
 const callsignTest={label:"Your aircraft callsign",test:hasCallsign};
 const has=(phrase)=>txt=>compact(txt).includes(compact(phrase));
 let title,instruction,answer,checks,facility,lesson;
 if(kind==="hold-short"){
  facility=airport.ground;title="Taxi and runway hold-short readback";
  instruction=CALLSIGN+", "+facility+", "+(airport.us?"taxi to runway ":"taxi to holding point runway ")+r+", hold short of runway "+r+".";
  answer="Taxi to "+(airport.us?"runway ":"holding point runway ")+r+", hold short of runway "+r+", "+CALLSIGN+".";
  checks=[runwayTest,{label:"Explicit 'hold short' acknowledgement",test:has("hold short")},callsignTest];
  lesson="A taxi instruction does not authorize runway entry. Read back any hold-short instruction clearly.";
 }else if(kind==="takeoff"){
  facility=airport.tower;title="Takeoff clearance readback";
  instruction=CALLSIGN+", "+facility+", runway "+r+", cleared for takeoff.";
  answer="Runway "+r+", cleared for takeoff, "+CALLSIGN+".";
  checks=[runwayTest,{label:"'Cleared for takeoff' wording",test:has("cleared for takeoff")},callsignTest];
  lesson="A takeoff clearance is different from taxi or line-up instructions.";
 }else if(kind==="landing"){
  facility=airport.tower;title="Landing clearance readback";
  instruction=CALLSIGN+", "+facility+", runway "+r+", cleared to land.";
  answer="Runway "+r+", cleared to land, "+CALLSIGN+".";
  checks=[runwayTest,{label:"'Cleared to land' wording",test:has("cleared to land")},callsignTest];
  lesson="Read back the landing runway and the clearance, not just 'roger'.";
 }else if(kind==="altitude"){
  facility=airport.approach;title="Correct altitude readback";
  instruction=CALLSIGN+", "+facility+", maintain three thousand feet.";
  answer="Maintain three thousand feet, "+CALLSIGN+".";
  checks=[{label:"Maintain instruction",test:has("maintain")},{label:"Three thousand feet (not five thousand)",test:txt=>hasAltitude(txt,3)&&!hasAltitude(txt,5)},callsignTest];
  lesson="Check the altitude before transmitting; a wrong-number readback needs correction.";
 }else if(kind==="go-around"){
  facility=airport.tower;title="Go-around and climb readback";
  instruction=CALLSIGN+", "+facility+", go around, climb straight ahead to two thousand feet.";
  answer="Going around, climb straight ahead to two thousand feet, "+CALLSIGN+".";
  checks=[{label:"Go-around acknowledgement",test:txt=>/go(?:ing)?\s*around/.test(words(txt))},
   {label:"Climb straight ahead",test:has("climb straight ahead")},{label:"Two thousand feet",test:txt=>hasAltitude(txt,2)&&!hasAltitude(txt,3)},callsignTest];
  lesson="In a real aircraft, fly the safe manoeuvre first. This typed exercise is not an operational procedure.";
 }else{
  facility="Academy practice instructor (not ATC)";
  const arrival=kind==="advisory-arrival";
  title=arrival?"Uncontrolled airfield arrival call":"Uncontrolled airfield departure call";
  instruction="Academy exercise for "+airport.name+": practise a traffic advisory for "+(arrival?"joining the illustrated circuit":"departing the illustrated runway")+" "+r+". No control clearance is being issued.";
  answer=airport.tower+", "+CALLSIGN+", "+(arrival?"joining the simulated circuit for runway ":"departing runway ")+r+", "+(arrival?"remaining visual":"remaining in the illustrated local area")+".";
  checks=[{label:"Identify the traffic audience",test:txt=>compact(txt).includes(compact(airport.tower))},runwayTest,
   {label:arrival?"Describe joining or arriving":"Describe departure",test:txt=>arrival?/join|arriv|inbound/.test(words(txt)):/depart|taking off|leaving/.test(words(txt))},callsignTest];
  lesson="This airfield's real ATS status is not verified. Self-announced training position reports are not takeoff or landing clearances.";
 }
 return Object.freeze({airport:airport.id,kind,title,facility,instruction,answer,lesson,checks:Object.freeze(checks)});
}
function sequenceFor(airportId="gfll",situationId="normal"){
 if(World.getAirport(airportId).advisory)return ADVISORY;
 const first={"normal":"hold-short","go-around":"go-around","readback":"altitude","radio-check":"hold-short"}[situationId]||"hold-short";
 return Object.freeze([first,...CONTROLLED.filter(x=>x!==first)]);
}
function evaluate(drill,reply){
 const text=String(reply||"").slice(0,600);
 const missing=drill.checks.filter(c=>!c.test(text)).map(c=>c.label);
 return Object.freeze({passed:missing.length===0,matched:drill.checks.length-missing.length,total:drill.checks.length,missing,expected:drill.answer});
}
function attach({windowLike,documentLike,getAirport=()=>"gfll",getSituation=()=>"normal",
 onBegin=()=>{},onTransmissionStart=()=>{},onTransmissionEnd=()=>{},onFinish=()=>{}}={}){
 const win=windowLike||root,doc=documentLike||win?.document;
 if(!doc?.getElementById)throw Error("Readback practice needs a page");
 const el=id=>doc.getElementById(id),synth=win?.speechSynthesis,Utter=win?.SpeechSynthesisUtterance;
 const supported=typeof synth?.speak==="function"&&typeof synth?.cancel==="function"&&typeof Utter==="function";
 let index=0,attempts=0,correct=0,checked=false,countedCorrect=false,playing=false,serial=0;
 let activeAirport="",activeSituation="",drill;
 const status=message=>{el("atcDrillStatus").textContent=message;};
 function stop(){
  ++serial;
  if(playing){
   playing=false;try{synth.cancel()}catch{}
   onTransmissionEnd();onFinish();
  }
 }
 function refresh(){
  stop();
  activeAirport=getAirport();activeSituation=getSituation();
  const types=sequenceFor(activeAirport,activeSituation);
  drill=makeDrill(activeAirport,types[index%types.length]);
  checked=false;countedCorrect=false;
  el("atcDrillName").textContent=drill.title+" · "+World.getAirport(activeAirport).name;
  el("atcDrillInstruction").textContent=drill.instruction;
  el("atcDrillLesson").textContent=drill.lesson;
  el("atcDrillResponse").value="";
  el("atcDrillAnswer").hidden=true;
  el("atcDrillAnswer").textContent="Suggested readback: "+drill.answer;
  el("atcDrillFeedback").textContent="Hear the instruction, then type or speak the readback yourself and enter what you said.";
  el("atcDrillFeedback").dataset.result="waiting";
  el("atcDrillProgress").textContent="Practice attempts: "+attempts+" · Complete readbacks: "+correct+" (device only)";
  status(supported?"Ready. Tap Hear ATC to receive a simulated radio call.":"Text-only mode: synthesized voice is unavailable. Read the ATC instruction above.");
 }
 function syncLocation(){
  if(activeAirport!==getAirport()||activeSituation!==getSituation()){index=0;refresh();}
 }
 function hear(){
  syncLocation();stop();
  if(!supported){status("Speech synthesis is unavailable. Read the instruction above.");return false;}
  if(doc.hidden){status("Return to this page to hear the radio instruction.");return false;}
  try{
   onBegin();
   const id=++serial,utter=new Utter(drill.instruction);
   const lang=World.getAirport(activeAirport).lang||"en-GB";
   const voices=typeof synth.getVoices==="function"?synth.getVoices().filter(v=>/^en(?:-|$)/i.test(v.lang||"")):[];
   utter.lang=lang;utter.rate=.88;utter.pitch=.79;utter.volume=1;
   utter.voice=voices.find(v=>(v.lang||"").toLowerCase()===lang.toLowerCase())||voices[0]||null;
   playing=true;
   utter.onstart=()=>{if(id===serial)onTransmissionStart();};
   const done=()=>{if(id!==serial||!playing)return;playing=false;onTransmissionEnd();onFinish();status("ATC transmission completed. Your readback is next.");};
   utter.onend=done;utter.onerror=()=>{done();status("Device speech was interrupted. The instruction remains on screen.");};
   synth.speak(utter);
   status("Receiving simulated ATC instruction with radio effects. No microphone is being used.");
   return true;
  }catch{
   if(playing)stop();else onFinish();
   status("Audio could not start. The written instruction is still available.");return false;
  }
 }
 function check(){
  syncLocation();
  const response=el("atcDrillResponse").value.trim();
  if(!response){status("Enter your readback first. You can use the keyboard on your phone.");return null;}
  const outcome=evaluate(drill,response);
  if(!checked){attempts++;checked=true;}
  if(outcome.passed&&!countedCorrect){correct++;countedCorrect=true;}
  el("atcDrillFeedback").dataset.result=outcome.passed?"complete":"review";
  el("atcDrillFeedback").textContent=outcome.passed?
   "All key items detected in this practice readback. This is an automated text check, not a pilot qualification.":
   "Check these key items: "+outcome.missing.join("; ")+". Compare with the suggested response if needed.";
  el("atcDrillProgress").textContent="Practice attempts: "+attempts+" · Complete readbacks: "+correct+" (device only)";
  status(outcome.passed?"Readback self-check complete. Try the next radio situation.":"Readback needs revision. Correct it and check again.");
  return outcome;
 }
 el("atcDrillHear").addEventListener("click",hear);
 el("atcDrillCheck").addEventListener("click",check);
 el("atcDrillNext").addEventListener("click",()=>{index++;refresh();});
 el("atcDrillReveal").addEventListener("click",()=>{syncLocation();el("atcDrillAnswer").hidden=false;status("Suggested wording shown for learning; this does not count as a correct attempt.");});
 for(const key of ["atcAirport","atcSituation"])el(key).addEventListener("change",()=>{index=0;refresh();});
 doc.addEventListener?.("visibilitychange",()=>{if(doc.hidden){stop();status("Page hidden: readback practice audio stopped.");}});
 win?.addEventListener?.("pagehide",stop);
 refresh();
 return Object.freeze({hear,check,next:()=>{index++;refresh();},stop,refresh,getDrill:()=>drill,stats:()=>({attempts,correct}),supported});
}
const api=Object.freeze({makeDrill,sequenceFor,evaluate,attach,hasRunway,hasCallsign});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightATCPractice=api;
})(typeof window!=="undefined"?window:null);
