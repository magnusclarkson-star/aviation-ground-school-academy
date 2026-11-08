/* Aviation Ground School Academy — curated, locally available explanations.
 * Hand-written educational content, NOT generative AI or certified instruction.
 * Exported for offline model tests and shared by public AI Instructor UI.
 */
(function(root){
"use strict";
const lessons=[
 {id:"forces",group:"Foundations",name:"The four forces of flight",time:"4 min",
  intro:"Lift, weight, thrust and drag are the four main forces used to explain aircraft motion.",
  body:"Lift acts approximately perpendicular to the relative airflow around the wing. Weight acts toward Earth's centre. Thrust helps propel an aircraft forward, while drag opposes its motion through the air. A change in one force often changes the balance of the others. These are explanations of forces, not an instruction to fly a particular aircraft.",
  question:"Which force acts approximately opposite the direction of motion through the air?",
  options:["Lift","Drag","Weight"],correct:1,
  explanation:"Drag acts to oppose motion relative to the surrounding air. Its size depends on speed, shape and aircraft configuration.",
  terms:["lift","weight","thrust","drag","four forces","flying"]},
 {id:"instruments",group:"Cockpit",name:"Read the primary flight instruments",time:"6 min",
  intro:"A cockpit's instruments support a cross-check of attitude, altitude, airspeed, direction and rate of change.",
  body:"The attitude indicator or PFD horizon represents aircraft pitch and bank relative to the horizon. The airspeed indicator reports indicated airspeed, the altimeter reports pressure-based altitude after correct setting, and the vertical speed indicator shows a trend in climb or descent rate. In flight training, instructors teach a coordinated instrument scan rather than relying on any one indication. Our Academy cockpit is a simplified demonstration and may not match real instrumentation.",
  question:"Which display is normally used to visualize pitch and bank?",
  options:["Attitude indicator","Altimeter","Airspeed indicator"],correct:0,
  explanation:"The attitude indicator or primary flight display attitude presentation shows pitch and bank. Cross-check it with other instruments.",
  terms:["instrument","pfd","horizon","attitude","altimeter","airspeed","vertical speed","vsi"]},
 {id:"controls",group:"Cockpit",name:"Yoke, joystick, pedals and throttle",time:"5 min",
  intro:"Different aircraft can use a yoke, centre stick or side stick, but the basic control axes are similar.",
  body:"A yoke or joystick commonly controls ailerons for roll and elevators for pitch. Rudder pedals control yaw; the throttle controls engine power. Flight behaviour depends on aircraft design, conditions and speed, and control coordination changes with flight phase. In the Academy simulator, you can practise recognising how synthetic instrument indications change while using touch controls, but it does not establish real-world handling technique.",
  question:"Which control commonly commands yaw?",
  options:["Flap selector","Rudder pedals","Altimeter"],correct:1,
  explanation:"Rudder pedals control the rudder and are used to influence yaw. How much to use depends on a specific aircraft and flight situation.",
  terms:["yoke","joystick","control","rudder","pedal","throttle","yaw","pitch","roll"]},
 {id:"flaps",group:"Aerodynamics",name:"Flaps, lift and drag",time:"5 min",
  intro:"Flaps change wing configuration and typically change lift and drag together.",
  body:"Extending flaps usually increases the wing's camber and may increase lift at a given angle of attack, while also adding drag. Larger flap settings often create proportionally more drag, affecting descent performance and speed. Approved flap use and limiting airspeeds depend on the specific aircraft's flight manual. The values in Cockpit V3 are relative teaching indices, not actual lift coefficients, operating limits or a substitute for a POH/AFM.",
  question:"What happens when flaps are extended in many conventional aircraft?",
  options:["Only thrust changes","Lift and drag can both change","The altimeter changes its setting"],correct:1,
  explanation:"Flap deployment commonly affects both lift and drag. Actual effects and limits vary by aircraft and flap setting.",
  terms:["flap","drag","camber","approach","landing","lift index"]},
 {id:"weather",group:"Safety",name:"Weather awareness and preflight decisions",time:"6 min",
  intro:"Good preflight planning combines weather information, regulations and an instructor's guidance.",
  body:"Students should learn the roles of observations such as METARs, aerodrome forecasts such as TAFs, NOTAMs and local aviation authority information. Visibility, cloud, wind, turbulence and convective hazards can affect safety. A briefing from this educational tool is never a current weather report, regulatory clearance or a go/no-go decision; always use authorised up-to-date sources and an appropriately qualified instructor.",
  question:"Which statement about this app's weather lessons is correct?",
  options:["They replace official flight briefings","They automatically clear a flight","They are educational and not current operational weather"],correct:2,
  explanation:"This app supplies background concepts only; use authorised, current weather and briefing sources for real operations.",
  terms:["weather","metar","taf","notam","wind","visibility","cloud","briefing","flight plan"]},
 {id:"radio",group:"Communications",name:"Aviation radio fundamentals",time:"5 min",
  intro:"Clarity, listening and correct readbacks are essential components of safe aviation communication.",
  body:"Pilots learn standard ICAO spelling words, concise radio phraseology, listening for callsigns and reading back safety-critical instructions where required. Phraseology and procedures vary with local rules, airspace and service. The Academy can help you study concepts and sample phrases, but it is not an air traffic control service and must not be used for live traffic instructions.",
  question:"What is the appropriate use of this AI Instructor for radio training?",
  options:["Practising concepts and sample phraseology","Obtaining real air traffic clearance","Replacing current charts and procedures"],correct:0,
  explanation:"Use the tool only for educational exercises. Real clearances and operational procedures come from authorised services and training sources.",
  terms:["radio","communication","atc","alphabet","clearance","phonetic","phraseology"]},
 {id:"anatomy",group:"Aircraft foundations",name:"Recognise aircraft parts and systems",time:"6 min",
  intro:"Learn the names and broad functions of an aeroplane's major components without assuming every aircraft is built alike.",
  body:"The fuselage carries people, payload and equipment; the wings produce most lift on a conventional aeroplane; the empennage generally contains horizontal and vertical stabilising surfaces. Ailerons typically affect roll, elevators pitch and the rudder yaw. An aeroplane may use a fixed or retractable undercarriage and a range of engine, electrical and fuel systems. Aircraft types differ substantially, so accurate identification and system checks must come from the specific approved flight manual and an instructor.",
  question:"Which component usually houses passengers and most onboard equipment?",
  options:["Fuselage","Aileron","Rudder"],correct:0,
  explanation:"The fuselage is the central body of a conventional aeroplane. It typically contains occupants, cargo and many systems.",
  terms:["aircraft parts","aircraft anatomy","fuselage","wing","tail","empennage","landing gear","aircraft systems"]},
 {id:"preflight",group:"Safety",name:"Preflight preparation and responsible decisions",time:"7 min",
  intro:"Before an actual flight, a pilot and instructor must plan, assess risks and use procedures approved for the aircraft and location.",
  body:"Ground-school students learn why pilots review weather and NOTAM information, aircraft documents, loading and performance, personal readiness, airspace, fuel planning and known aircraft limitations. They also learn what an aircraft-specific exterior inspection is intended to reveal. This Academy cannot determine airworthiness or flight readiness and does not supply a usable checklist, weather briefing or clearance. Use the current approved aircraft flight manual, authorised information sources and qualified instructor supervision for real preflight preparation.",
  question:"Which source provides the correct aircraft-specific inspection and limitations?",
  options:["A generic practice app","An unrelated online checklist","The applicable approved aircraft flight manual and procedures"],correct:2,
  explanation:"Aircraft-specific limitations and procedures come from the applicable approved documents, interpreted with proper training and local requirements.",
  terms:["preflight","walk around","walk-around","flight manual","checklist","airworthiness","risk","inspection","fuel planning","personal readiness"]}
];
function lessonById(id){return lessons.find(x=>x.id===id)||lessons[0]}
function evaluateQuiz(id,index){
 const lesson=lessonById(id);
 if(!Number.isInteger(index)||index<0||index>=lesson.options.length)throw Error("Choose a valid response");
 return {correct:index===lesson.correct,explanation:lesson.explanation,correctIndex:lesson.correct};
}
function localAnswer(question,topic){
 if(typeof question!=="string"||!question.trim())throw Error("Enter a question first");
 const q=question.trim().toLowerCase();
 // Never pretend this keyword matching is a connected generative AI model.
 const matching=lessons.map(l=>({
  lesson:l,score:l.terms.reduce((sum,term)=>sum+(q.includes(term)?term.length>=5?3:1:0),0)
 })).sort((a,b)=>b.score-a.score);
 const best=matching[0].score>0?matching[0].lesson:lessonById(topic);
 return {
  mode:"CURATED_GUIDANCE",
  lessonId:best.id,
  text:best.intro+" "+best.body+"\n\nThis is a curated lesson excerpt, not a live AI answer. For unusual questions, check an instructor and authoritative training materials."
 };
}
function voiceScript(id,style="mentor"){
 const lesson=lessonById(id);
 const lead=style==="scouts"?"Air Scouts, here is today's discovery challenge. ":
  style==="exam"?"Theory review. Listen for the key aviation concept. ":
  "Welcome to your next aviation ground-school lesson. ";
 return lead+lesson.intro+" "+lesson.body+" Quick question: "+lesson.question;
}
const api={lessons,lessonById,evaluateQuiz,localAnswer,voiceScript};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAAIInstructorLessons=api;
})(typeof window!=="undefined"?window:null);
