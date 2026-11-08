/* Fictional, branching ATC training decisions. Airport labels are geographic context
 * only; these are NOT real ATC communications, traffic, weather, runways or procedures.
 * No microphone, recordings, persistence or network requests. */
(function(root){"use strict";
const World=root?.AGSAFlightATCWorld||(typeof module!=="undefined"&&module.exports?require("./flight-sim-atc-world.js"):null);
const CALLSIGN="Academy Four Two One";
const TYPES=Object.freeze([
 {id:"traffic",title:"Traffic advisory and visual contact"},
 {id:"runway",title:"Runway incursion prevention"},
 {id:"handoff",title:"Tower frequency handoff"},
 {id:"urgency",title:"Urgency call and intentions"},
 {id:"weather",title:"Unsafe approach and go-around"},
 {id:"local-traffic",title:"Uncontrolled airfield traffic calls"}
]);
const selected=(id)=>TYPES.find(t=>t.id===id)||TYPES[0];
function option(id,label,radio,correct,why,reply){
 return Object.freeze({id,label,radio,correct:correct===true,why,reply:reply||""});
}
function makeMission(airportId="gfll",id="traffic"){
 const a=World.getAirport(airportId),advisory=a.advisory===true,runway=a.runway;
 let steps=[];
 if(advisory){
  id=id==="local-traffic"?"local-traffic":"traffic";
  if(id==="traffic"){
   steps=[
    {who:"Instructor",prompt:"Scenario near "+a.name+": another aircraft reports entering the imaginary circuit. You cannot see it. How should you respond on the training traffic frequency?",question:"You have NOT spotted the fictional aircraft.",choices:[
      option("negative","State that traffic is not in sight",a.tower+", "+CALLSIGN+", traffic not in sight, maintaining lookout.",true,"Do not claim visual contact until the traffic is genuinely seen.","Academy instructor acknowledges. Remain alert; the exercise provides no separation service."),
      option("seen","Claim the traffic is in sight",a.tower+", "+CALLSIGN+", traffic in sight.",false,"The scenario expressly says the traffic is not visible. Never invent visual contact."),
      option("cleared","Assume there is a circuit clearance",a.tower+", "+CALLSIGN+", cleared to join.",false,"No control clearance or verified aerodrome ATC service exists in this exercise.")
    ]},
    {who:"Instructor",prompt:"Second scenario: you are approaching the fictional circuit and need to announce your own position and intention.",question:"Which call provides useful situational information without claiming permission?",choices:[
      option("self","Announce position and intention",a.tower+", "+CALLSIGN+", joining the simulated circuit for runway "+runway+", remaining visual.",true,"Self-announced traffic information is not a takeoff or landing clearance.","Academy instructor: position and intentions acknowledged for classroom learning only."),
      option("land","Declare cleared to land",CALLSIGN+", cleared to land runway "+runway+".",false,"You cannot invent a clearance or treat a self-announced call as one."),
      option("silent","Assume traffic has cleared",CALLSIGN+", continuing without a position report.",false,"The lesson is to communicate position and intentions appropriately, not make assumptions.")
    ]}
   ];
  }else{
   steps=[
    {who:"Instructor",prompt:"At "+a.name+" the current air traffic service status is not verified. For this classroom exercise, select the best kind of transmission.",question:"What call avoids inventing a controller?",choices:[
      option("advisory","Self-announce intentions",a.tower+", "+CALLSIGN+", holding clear of the illustrated runway "+runway+", preparing to depart.",true,"A training traffic report must not imply an ATC takeoff clearance.","Academy instructor: thanks. This is not an aerodrome control clearance."),
      option("request","Request a guaranteed takeoff clearance",a.tower+", "+CALLSIGN+", request takeoff clearance.",false,"Do not assume the presence of a tower or control service."),
      option("cross","Assume the runway is yours",CALLSIGN+", runway entry approved.",false,"Permission or traffic separation must never be invented.")
    ]},
    {who:"Instructor",prompt:"A second aircraft is transmitting on the imaginary traffic frequency.",question:"What is the safest radio discipline in this teaching scenario?",choices:[
      option("listen","Listen until the channel is clear",CALLSIGN+", will listen before transmitting.",true,"Avoid stepping on another transmission. Frequency coordination depends on hearing others.","Academy instructor: correct; keep transmissions brief and relevant."),
      option("interrupt","Talk over the other aircraft",CALLSIGN+", interrupting now.",false,"Transmitting over another station can obscure safety information."),
      option("silent","Turn off the radio permanently",CALLSIGN+", radio off for the remainder.",false,"This does not address the lesson on listening and orderly transmissions.")
    ]}
   ];
  }
 }else if(id==="runway"){
  steps=[
   {who:"ATC",prompt:CALLSIGN+", "+a.ground+", hold position. Vehicle reported near the illustrated runway intersection.",question:"What do you read back?",choices:[
    option("hold","Acknowledge and hold position","Holding position, "+CALLSIGN+".",true,"A hold-position instruction is not a crossing or takeoff clearance.","Roger, "+CALLSIGN+". Remain stopped; further instructions will follow."),
    option("cross","Continue toward the runway","Continuing across, "+CALLSIGN+".",false,"This directly contradicts the hold-position instruction."),
    option("takeoff","Assume cleared for takeoff","Cleared for takeoff, "+CALLSIGN+".",false,"No takeoff clearance has been given.")
   ]},
   {who:"ATC",prompt:CALLSIGN+", "+a.ground+", hold short of runway "+runway+".",question:"Choose the readback that includes the runway.",choices:[
    option("precise","Read back runway and hold short","Hold short of runway "+runway+", "+CALLSIGN+".",true,"The correct runway designation and explicit hold-short wording are safety-critical.","Readback correct. Maintain position pending further instructions."),
    option("roger","Say only 'Roger'","Roger, "+CALLSIGN+".",false,"Read back the runway holding instruction."),
    option("entry","Enter the runway","Entering runway "+runway+", "+CALLSIGN+".",false,"A hold-short instruction does not authorize runway entry.")
   ]}
  ];
 }else if(id==="handoff"){
  steps=[
   {who:"ATC",prompt:CALLSIGN+", "+a.approach+", contact "+a.tower+" when instructed for this simulated exercise.",question:"What should you acknowledge?",choices:[
    option("handoff","Read back the new station","Contact "+a.tower+", "+CALLSIGN+".",true,"Acknowledge the transfer so the controller knows it was received.","Roger, "+CALLSIGN+"."),
    option("frequency","Invent a radio frequency","Changing to one two three decimal four five, "+CALLSIGN+".",false,"No frequency was supplied. Never invent one."),
    option("silence","Switch without any acknowledgement","No readback.",false,"Acknowledge a controller's change instruction.")
   ]},
   {who:"ATC",prompt:CALLSIGN+", "+a.tower+", pass your intentions.",question:"What is an appropriate request?",choices:[
    option("request","State your request without claiming a clearance",a.tower+", "+CALLSIGN+", request simulated approach to runway "+runway+".",true,"A request is not a clearance. Make the intention clear and concise.","Roger, "+CALLSIGN+", request received. Await further classroom instructions."),
    option("assume","Claim you have already been cleared","Already cleared to land, "+CALLSIGN+".",false,"No landing clearance was given."),
    option("skip","Transmit no callsign","Approach please.",false,"Include aircraft identification and a clear request.")
   ]}
  ];
 }else if(id==="urgency"){
  steps=[
   {who:"Instructor",prompt:"A fictional engine indication becomes abnormal. After managing the aircraft, you decide an urgency call is warranted. Which message communicates the problem?",question:"The seriousness of a real emergency must be judged by the pilot. This classroom example assumes an urgency (PAN) situation.",choices:[
    option("pan","Give an urgency call with nature and request","PAN PAN, PAN PAN, PAN PAN, "+a.approach+", "+CALLSIGN+", single engine trainer, abnormal engine indication, request assistance.",true,"Communicate the urgency, aircraft identification, nature and assistance requested when able.",""+CALLSIGN+", "+a.approach+", roger PAN. Say intentions when able."),
    option("dismiss","Treat the abnormal indication as irrelevant","All normal, "+CALLSIGN+".",false,"Concealing a known issue prevents controllers from helping."),
    option("false-clearance","Assume an emergency landing is cleared","Cleared myself to land, "+CALLSIGN+".",false,"Emergency priorities are not the same as claiming a clearance you were never given.")
   ]},
   {who:"ATC",prompt:CALLSIGN+", "+a.approach+", say intentions, persons on board and fuel remaining when able.",question:"How should the pilot respond, with priorities in mind?",choices:[
    option("able","Give intentions and details when able",""+a.approach+", "+CALLSIGN+", intend return to the fictional training field. Two persons on board, endurance one hour.",true,"Answer when able and avoid distractions from aircraft control. All figures are fictional.","Roger, "+CALLSIGN+". Further training assistance available."),
    option("invent","Claim an approach has been cleared","Cleared for approach, "+CALLSIGN+".",false,"The controller asked for information, not a clearance readback."),
    option("ignore","Claim there was no issue","No problem, request routine sightseeing, "+CALLSIGN+".",false,"That ignores the simulated urgency and controller's question.")
   ]}
  ];
 }else if(id==="weather"){
  steps=[
   {who:"ATC",prompt:CALLSIGN+", "+a.approach+", updated simulated wind reported. Advise if unable to continue the training approach.",question:"The instructor says the conditions exceed this learner's current limits. What is appropriate?",choices:[
    option("unable","Say unable and request another option","Unable to continue approach, request alternative instructions, "+CALLSIGN+".",true,"A pilot can report inability instead of accepting conditions beyond competence.",""+CALLSIGN+", roger. Continue the simulated exercise with a safe alternative."),
    option("accept","Continue regardless of limits","Continuing without reassessment, "+CALLSIGN+".",false,"Safety decisions must not be overridden merely to finish an exercise."),
    option("clearance","Assume cleared to land","Cleared to land runway "+runway+", "+CALLSIGN+".",false,"No landing clearance was issued.")
   ]},
   {who:"ATC",prompt:CALLSIGN+", "+a.tower+", go around. Training runway "+runway+".",question:"Which readback acknowledges the simulated go-around?",choices:[
    option("go","Acknowledge going around","Going around, "+CALLSIGN+".",true,"A clear go-around acknowledgement confirms receipt.","Roger, "+CALLSIGN+". Continue the exercise with the instructor."),
    option("land","Say cleared to land","Cleared to land runway "+runway+", "+CALLSIGN+".",false,"A go-around instruction is not landing clearance."),
    option("roger","Assume runway departure clearance","Cleared for takeoff, "+CALLSIGN+".",false,"A go-around does not issue a fresh takeoff clearance.")
   ]}
  ];
 }else{
  id="traffic";
  steps=[
   {who:"ATC",prompt:CALLSIGN+", "+a.approach+", traffic two o'clock, two miles, light aircraft, same indicated altitude, report in sight.",question:"The exercise depiction does NOT show the traffic. What should you say?",choices:[
    option("negative","Report traffic not in sight","Negative contact, "+CALLSIGN+".",true,"Never claim visual contact with traffic you have not identified.","Roger, "+CALLSIGN+". Continue lookout and report traffic when sighted."),
    option("seen","Claim to have traffic in sight","Traffic in sight, "+CALLSIGN+".",false,"This is an inaccurate report based on the scenario."),
    option("clear","Assume controller has cleared a path","Clear of traffic, "+CALLSIGN+".",false,"Traffic information is not a clearance nor a guarantee of separation.")
   ]},
   {who:"ATC",prompt:CALLSIGN+", "+a.approach+", report traffic in sight. In this second exercise frame your instructor has now positively identified the fictional aircraft.",question:"What response accurately reflects the new condition?",choices:[
    option("seen","Confirm traffic in sight","Traffic in sight, "+CALLSIGN+".",true,"Only report traffic in sight when actually identified.","Roger, "+CALLSIGN+". Maintain situational awareness."),
    option("unable","Report unable to hear","Unable radio, "+CALLSIGN+".",false,"This is inconsistent with receiving and answering the instruction."),
    option("cleared","Claim landing clearance","Cleared to land, "+CALLSIGN+".",false,"Seeing traffic is not equivalent to landing clearance.")
   ]}
  ];
 }
 return Object.freeze({id,airport:a.id,airportName:a.name,title:selected(id).title,advisory,
  intro:advisory?"Uncontrolled-airfield training: no verified tower service and no ATC clearance.":"Controlled-airport-style training: simulated ATC only, no real traffic or clearances.",
  steps:Object.freeze(steps.map(s=>Object.freeze({...s,choices:Object.freeze(s.choices)})))});
}
function available(airportId="gfll"){return World.getAirport(airportId).advisory?["traffic","local-traffic"]:["traffic","runway","handoff","urgency","weather"];}
function evaluate(step,choiceId){
 const pick=step.choices.find(c=>c.id===choiceId);
 if(!pick)return null;
 return Object.freeze({correct:pick.correct,why:pick.why,pilot:pick.radio,controller:pick.reply,option:pick.id});
}
function attach({windowLike,documentLike,getAirport=()=>"gfll",onBegin=()=>{},
 onTransmissionStart=()=>{},onTransmissionEnd=()=>{},onFinish=()=>{}}={}){
 const win=windowLike||root,doc=documentLike||win?.document,el=id=>doc.getElementById(id);
 if(!doc?.getElementById)throw Error("ATC mission training needs a page");
 const synth=win?.speechSynthesis,Utter=win?.SpeechSynthesisUtterance,
  supported=typeof synth?.speak==="function"&&typeof synth?.cancel==="function"&&typeof Utter==="function";
 const selector=el("atcMissionSelect"),choicesNode=el("atcMissionChoices"),log=el("atcMissionTranscript");
 let airport="",mission,stepIndex=0,answered=false,voicePlaying=false,serial=0;
 let trials=0,correctCount=0;
 const write=message=>{el("atcMissionStatus").textContent=message;};
 function stop(){
  ++serial;
  if(voicePlaying){voicePlaying=false;try{synth.cancel();}catch{}
   onTransmissionEnd();onFinish();
  }
 }
 function logLine(who,message){
  const item=doc.createElement("li"),strong=doc.createElement("strong"),span=doc.createElement("span");
  strong.textContent=who+": ";span.textContent=message;
  item.className=who==="Pilot"?"atc-pilot":"atc-tower";
  item.append(strong,span);log.appendChild(item);
 }
 function current(){return mission.steps[stepIndex];}
 function buildChoices(step){
  choicesNode.replaceChildren();
  for(const c of step.choices){
   const button=doc.createElement("button");button.type="button";button.textContent=c.label;
   button.dataset.choice=c.id;
   button.addEventListener("click",()=>answer(c.id));
   choicesNode.appendChild(button);
  }
 }
 function showStep(){
  stop();answered=false;
  const step=current();
  el("atcMissionTitle").textContent=mission.title+" · "+mission.airportName;
  el("atcMissionIntro").textContent=mission.intro;
  el("atcMissionStep").textContent="Radio challenge "+(stepIndex+1)+" of "+mission.steps.length;
  el("atcMissionPrompt").textContent=step.prompt;
  el("atcMissionQuestion").textContent=step.question;
  el("atcMissionFeedback").textContent="Listen to the simulated transmission, then choose the response you would give.";
  el("atcMissionFeedback").dataset.result="waiting";
  el("atcMissionNext").disabled=true;
  buildChoices(step);
  logLine(step.who,step.prompt);
  el("atcMissionScore").textContent="Decisions: "+trials+" · Appropriate responses: "+correctCount+" · stored only during this page session";
  write(supported?"Ready. Tap Hear radio call, then select a pilot reply.":"Voice unavailable: read the call and choose a pilot reply.");
 }
 function changeLocation(){
  stop();airport=getAirport();
  const allowed=available(airport),old=selector.value;
  selector.replaceChildren();
  for(const id of allowed){
   const op=doc.createElement("option");op.value=id;op.textContent=selected(id).title;selector.appendChild(op);
  }
  selector.value=allowed.includes(old)?old:allowed[0];
  choose();
 }
 function choose(){
  stop();stepIndex=0;log.replaceChildren();
  mission=makeMission(airport,selector.value);
  showStep();
 }
 function voice(lines){
  stop();
  if(!supported||doc.hidden){write("Speech unavailable or page hidden; written training conversation remains available.");return false;}
  try{
   onBegin();
   const gen=++serial, a=World.getAirport(airport),v=typeof synth.getVoices==="function"?synth.getVoices().filter(t=>/^en(?:-|$)/i.test(t.lang||"")):[],
    match=v.find(t=>String(t.lang).toLowerCase()===String(a.lang).toLowerCase()),controller=match||v[0]||null,
    pilot=v.find(t=>t!==controller)||controller;
   voicePlaying=true;
   for(let i=0;i<lines.length;i++){
    const entry=lines[i],u=new Utter(entry.text);
    u.lang=a.lang||"en-GB";u.rate=entry.who==="Pilot"?.96:.87;u.pitch=entry.who==="Pilot"?1.16:.79;u.volume=1;
    if(v.length)u.voice=entry.who==="Pilot"?pilot:controller;
    u.onstart=()=>{if(gen===serial)onTransmissionStart(entry);};
    u.onend=()=>{if(gen!==serial)return;onTransmissionEnd(entry);
      if(i===lines.length-1){voicePlaying=false;onFinish();write("Simulated radio transmission complete.");}};
    u.onerror=()=>{if(gen===serial){stop();write("Browser speech interrupted; use the written conversation.");}};
    synth.speak(u);
   }
   write("Simulated radio transmissions playing with PTT effects.");
   return true;
  }catch{stop();onFinish();write("Speech could not start; written scenario is still usable.");return false;}
 }
 function hear(){return voice([{who:current().who,text:current().prompt}]);}
 function answer(choiceId){
  if(answered)return null;
  stop();
  const result=evaluate(current(),choiceId);
  if(!result)return null;
  answered=true;trials++;if(result.correct)correctCount++;
  for(const button of choicesNode.children)button.disabled=true;
  logLine("Pilot",result.pilot);
  if(result.controller&&result.correct)logLine(current().who==="Instructor"?"Instructor":"ATC",result.controller);
  const feedback=(result.correct?"Appropriate response. ":"Review this response. ")+result.why;
  el("atcMissionFeedback").textContent=feedback;
  el("atcMissionFeedback").dataset.result=result.correct?"complete":"review";
  el("atcMissionNext").disabled=false;
  el("atcMissionNext").textContent=stepIndex===mission.steps.length-1?"Restart this scenario":"Next transmission";
  el("atcMissionScore").textContent="Decisions: "+trials+" · Appropriate responses: "+correctCount+" · stored only during this page session";
  write(result.correct?"Decision recorded; hear the pilot and controller exchange.":"Decision reviewed. See the instructor explanation; try a new scenario.");
  const lines=[{who:"Pilot",text:result.pilot}];
  if(result.correct&&result.controller)lines.push({who:current().who==="Instructor"?"Instructor":"ATC",text:result.controller});
  voice(lines);
  return result;
 }
 function next(){
  stop();
  if(!answered)return false;
  if(stepIndex===mission.steps.length-1){stepIndex=0;log.replaceChildren();}
  else stepIndex++;
  showStep();return true;
 }
 el("atcMissionHear").addEventListener("click",hear);
 el("atcMissionNext").addEventListener("click",next);
 el("atcMissionStop").addEventListener("click",()=>{stop();write("Radio paused. Written conversation remains visible.");});
 selector.addEventListener("change",choose);
 el("atcAirport").addEventListener("change",changeLocation);
 doc.addEventListener?.("visibilitychange",()=>{if(doc.hidden){stop();write("Page hidden: radio effects stopped.");}});
 win?.addEventListener?.("pagehide",stop);
 changeLocation();
 return Object.freeze({stop,hear,next,answer,choose,getMission:()=>mission,getStep:()=>stepIndex,stats:()=>({trials,correct:correctCount}),supported});
}
const api=Object.freeze({TYPES,makeMission,available,evaluate,attach});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightATCMissions=api;
})(typeof window!=="undefined"?window:null);
