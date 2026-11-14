/* Course 09: wholly fictional radio exchanges and spelling practice.
 * No frequency, real callsign, live clearance or microphone processing. */
(function(root){"use strict";
const REVISION="2026-11-14-radio-lesson-v1";
const alphabet=Object.freeze([
 ["A","Alfa"],["B","Bravo"],["C","Charlie"],["D","Delta"],
 ["E","Echo"],["F","Foxtrot"],["G","Golf"],["H","Hotel"],
 ["I","India"],["J","Juliett"],["K","Kilo"],["L","Lima"],
 ["M","Mike"],["N","November"],["O","Oscar"],["P","Papa"],
 ["Q","Quebec"],["R","Romeo"],["S","Sierra"],["T","Tango"],
 ["U","Uniform"],["V","Victor"],["W","Whiskey"],["X","X-ray"],
 ["Y","Yankee"],["Z","Zulu"]
].map(([letter,word])=>Object.freeze({letter,word})));
const scenarios=Object.freeze([
 Object.freeze({
  id:"first-contact",number:1,title:"Listen, identify the station and make contact",
  pictures:Object.freeze(["overview-06","detail-07"]),
  situation:"A fictional training aircraft wants to tell an invented ground station that it is at the school apron. The listener must identify who was called, who is speaking and the purpose of the message.",
  question:"Which fictional first contact contains the essential identifying elements?",
  options:Object.freeze([
   "Hello, can someone hear me?",
   "Training Ground, Training Seven Two, at the school apron, request information.",
   "Runway cleared; I will start moving now."
  ]),answer:1,
  explanation:"An initial routine contact commonly identifies the called station, the calling aircraft or station, and the needed information or request. Listen before a transmission and use concise standard wording under the actual applicable State procedure. This example contains no real frequency or permission to move an aircraft.",
  key:Object.freeze([
   ["Called station","Who is being contacted"],
   ["Callsign","Who is transmitting"],
   ["Position or context","Relevant location or operating context, as applicable"],
   ["Purpose","The request or message"],
   ["Listen first","Avoid blocking an existing exchange and check that the expected station is active"]
  ]),
  dialogue:Object.freeze([
   Object.freeze({speaker:"Pilot",line:"Training Ground, Training Seven Two, at the school apron, request information."}),
   Object.freeze({speaker:"Controller",line:"Training Seven Two, Training Ground, standby."}),
   Object.freeze({speaker:"Pilot",line:"Standing by, Training Seven Two."})
  ]),
  scouts:"Air Scouts: identify the two speakers and their names in the fictional exchange; never use an Academy audio clip on an actual radio.",
  pilots:"Enthusiasts and aspiring pilots: distinguish a request from any explicit clearance, and note that a standby reply does not authorise taxi."
 }),
 Object.freeze({
  id:"phonetics",number:2,title:"Spell ambiguous letters with standard words",
  pictures:Object.freeze(["overview-06"]),
  situation:"The fictional instructor asks a learner to clarify the three classroom letters A B C. Practice tapping the complete A–Z international radiotelephony alphabet beneath this card.",
  question:"Which spelling corresponds to the letters A B C in the international radiotelephony alphabet?",
  options:Object.freeze([
   "Alpha, Beta, Copy.",
   "Able, Baker, Charlie.",
   "Alfa, Bravo, Charlie."
  ]),answer:2,
  explanation:"The internationally specified spelling words are Alfa, Bravo and Charlie, with the distinctive official spellings Alfa and Juliett. Standard words reduce ambiguity when individual letters are hard to hear. Approximate pronunciation and the use of the alphabet must follow the applicable radiotelephony guidance; this is a classroom demonstration only.",
  key:Object.freeze([
   ["Alfa","A — ICAO spelling, not Alpha"],
   ["Bravo","B"],
   ["Charlie","C"],
   ["Juliett","J — the official spelling includes a final t"],
   ["Phonetic alphabet","Standard words used to spell letters intelligibly"]
  ]),
  dialogue:Object.freeze([
   Object.freeze({speaker:"Instructor",line:"Training Seven Two, spell the classroom letters A B C."}),
   Object.freeze({speaker:"Student",line:"Alfa, Bravo, Charlie."})
  ]),
  scouts:"Air Scouts: tap a letter and listen to its word, then spell A B C without referring to the answer.",
  pilots:"Enthusiasts and aspiring pilots: use the correct ICAO orthography and distinguish spelling words from numeral pronunciation."
 }),
 Object.freeze({
  id:"readback",number:3,title:"Catch and correct a runway-number readback",
  pictures:Object.freeze(["detail-07"]),
  situation:"A fictional controller instructs Training Seven Two to HOLD SHORT of runway zero niner. The first fictional student response repeats runway two seven. Select the corrected readback and identify why the earlier response was wrong.",
  question:"Which corrected response repeats the fictional holding instruction accurately?",
  options:Object.freeze([
   "Holding short runway zero niner, Training Seven Two.",
   "Cleared to enter runway zero niner, Training Seven Two.",
   "Holding short runway two seven, Training Seven Two."
  ]),answer:0,
  explanation:"The example's instruction is HOLD SHORT RUNWAY 09, and the correct readback must preserve that runway and the restriction, using the aircraft identity. The deliberately wrong earlier response changed runway 09 to 27. A controller correction should prompt a correct readback rather than silent assumption. Local readback rules, phraseology and any real movement permissions must come from the current applicable State procedures.",
  key:Object.freeze([
   ["Instruction","Controller's fictional command: hold short runway zero niner"],
   ["Incorrect readback","The student mistakenly said runway two seven"],
   ["Correction","Restates runway zero niner and the hold-short restriction"],
   ["Identification","Training Seven Two identifies the simulated aircraft"],
   ["No runway entry","Holding short is not permission to enter or cross"]
  ]),
  dialogue:Object.freeze([
   Object.freeze({speaker:"Controller",line:"Training Seven Two, hold short runway zero niner."}),
   Object.freeze({speaker:"Student (incorrect)",line:"Holding short runway two seven, Training Seven Two."}),
   Object.freeze({speaker:"Controller",line:"Correction, hold short runway zero niner."}),
   Object.freeze({speaker:"Pilot",line:"Holding short runway zero niner, Training Seven Two."})
  ]),
  scouts:"Air Scouts: find the changed runway number and explain why the correction matters.",
  pilots:"Enthusiasts and aspiring pilots: distinguish the runway holding instruction from a taxi or runway-entry clearance."
 }),
 Object.freeze({
  id:"uncertainty",number:4,title:"Recognise uncertainty and communication limits",
  pictures:Object.freeze(["overview-06","detail-07"]),
  situation:"In a synthetic radio classroom, one message is not fully audible. A learner assumes that silence means both a radio failure and permission to continue. No real aircraft, frequency or clearance is involved.",
  question:"What is the safest conceptual learning response?",
  options:Object.freeze([
   "Assume a clearance was given if some words were heard.",
   "Acknowledge uncertainty, seek clarification through approved training procedures and avoid diagnosing the cause from silence alone.",
   "Use the Academy's audio playback as an authorised ATC communication."
  ]),answer:1,
  explanation:"Unclear, blocked or missing communication can have different causes, including workload, reception, equipment settings and other factors. The classroom does not diagnose a radio fault or prescribe an operational lost-communications procedure. Actual actions, equipment checks and any emergency or urgency procedures depend on the aircraft, airspace and applicable authority; a qualified instructor must teach them separately.",
  key:Object.freeze([
   ["Unclear message","A message whose contents cannot be confidently understood"],
   ["Clarification","A deliberate request to resolve missing or inconsistent information"],
   ["Radio silence","Not proof by itself of an equipment failure or a clearance"],
   ["Actual failure procedure","Aircraft-, flight- and jurisdiction-specific, not supplied by this practice"],
   ["Simulator speech","Device audio only; not transmission or an operational air traffic service"]
  ]),
  dialogue:Object.freeze([
   Object.freeze({speaker:"Controller",line:"Training Seven Two, [message unreadable in training example]."}),
   Object.freeze({speaker:"Student",line:"Training Ground, Training Seven Two, unable to understand, please repeat."}),
   Object.freeze({speaker:"Instructor",line:"This example stops here. Refer to approved material for real-world requirements."})
  ]),
  scouts:"Air Scouts: explain why asking your instructor is better than guessing what a radio message means.",
  pilots:"Enthusiasts and aspiring pilots: separate a poor-quality message from a diagnosed communications failure and a genuine clearance."
 })
]);
function get(id){return scenarios.find(x=>x.id===id)||null}
function evaluate(id,choice){
 const item=get(id);
 if(!item||!Number.isInteger(choice)||choice<0||choice>=item.options.length)
  throw Error("Choose a fictional radio-practice response");
 return Object.freeze({id,correct:choice===item.answer,expected:item.options[item.answer],
  explanation:item.explanation,key:item.key});
}
function spell(text){
 if(typeof text!=="string"||text.length>24||!/^[A-Za-z ]*$/.test(text))
  throw Error("Use up to 24 classroom letters and spaces, without real callsigns or numbers");
 return Object.freeze(text.toUpperCase().split("").filter(x=>x!==" ").map(letter=>{
  const entry=alphabet.find(x=>x.letter===letter);
  if(!entry)throw Error("Unknown spelling letter");
  return entry.word;
 }));
}
function alphabetWord(letter){
 const word=alphabet.find(x=>x.letter===letter);
 if(!word)throw Error("Select a letter A to Z");
 return word.word;
}
function validate(atlas){
 if(scenarios.length!==4||new Set(scenarios.map(x=>x.id)).size!==4)
  throw Error("Four distinct radio scenarios required");
 let views=0;
 for(const s of scenarios){
  if(s.options.length!==3||!Number.isInteger(s.answer)||s.answer<0||s.answer>2||
   s.situation.length<130||s.explanation.length<200||s.key.length<5||
   s.dialogue.length<2||!s.scouts||!s.pilots)throw Error("Incomplete fictional ATC scenario "+s.id);
  for(const id of s.pictures){
   const asset=atlas?.getById(id);
   if(!asset||!["overview","detailed"].includes(asset.group))
    throw Error("Course 09 must reuse original radio pictures "+id);
   views++;
  }
  if(s.dialogue.some(l=>!["Pilot","Controller","Instructor","Student","Student (incorrect)"].includes(l.speaker)||!l.line))
   throw Error("Unsupported fictional dialogue speaker");
 }
 if(alphabet.length!==26||new Set(alphabet.map(x=>x.letter)).size!==26||
    alphabetWord("A")!=="Alfa"||alphabetWord("J")!=="Juliett")
  throw Error("Full official spelling alphabet must be available");
 return Object.freeze({moduleId:"communications",scenarios:4,pictureViews:views,alphabetLetters:26,
  status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:REVISION});
}
const api=Object.freeze({REVISION,alphabet,scenarios,get,evaluate,spell,alphabetWord,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAATCRadioPractical=api;
})(typeof window!=="undefined"?window:null);
