/* Course 06: original-picture weather practice and invented coded reports.
   Classroom examples only; no live weather, flight briefing or student files. */
(function(root){"use strict";
const REVISION="2026-11-14-meteorology-practical-v1";
const cases=Object.freeze([
 {id:"clouds",number:1,title:"Recognise clouds and convective development",pictures:["overview-04","detail-04"],
 situation:"Compare the original Academy cloud illustrations, including shallow-looking cloud and vertical cloud development. These are educational drawings, not current observations, and they do not establish the weather at a real airport.",
 question:"Which cloud observation may suggest an aviation weather hazard?",
 options:["All cumulus clouds contain exactly the same turbulence and rain.","Strong vertical growth may accompany convection, thunderstorms, heavy rain or turbulence; consult current weather information.","A clear-looking classroom picture proves a route is safe."],answer:1,
 explanation:"Developing towering cumulus and cumulonimbus can be associated with convection, lightning, heavy precipitation, turbulence and wind shear. Cloud appearance can suggest something to investigate but cannot establish actual conditions for a particular flight. Use suitable current authoritative reports, forecasts and warnings under qualified supervision.",
 key:[["Shallow cumulus","May have limited vertical growth; appearance alone does not certify safe conditions"],["Towering cumulus","Vertical development can indicate strengthening convection"],["Cumulonimbus","Thunderstorm-related cloud with potentially severe hazards"],["Evidence","Current observations, forecasts and significant-weather information"]],
 scouts:"Air Scouts: compare the illustrated cloud shapes and explain why a drawing cannot confirm the weather outside.",
 pilots:"Aspiring pilots: distinguish real-time observations, hazard advisories and visual clues from an old picture."},
 {id:"metar",number:2,title:"Decode a fictional METAR observation",pictures:["overview-04"],
 situation:"At the invented training aerodrome ZZZZ the fictional observation is METAR ZZZZ 141200Z 21012KT 6000 -RA SCT018 BKN035 26/23 Q1010=. The station does not represent an operational airport or a real report.",
 question:"In this international METAR example, what does the group 6000 mean?",
 options:["Six hours of forecast validity.","A runway that is 6,000 metres long.","Reported prevailing horizontal visibility of 6,000 metres."],answer:2,
 explanation:"In this example 6000 means prevailing visibility 6,000 metres. The coded report is a timed observation, not a forecast. 141200Z indicates day 14 at 12:00 UTC, 21012KT wind from 210 degrees true at 12 knots, -RA light rain, SCT018 scattered cloud around 1,800 feet and BKN035 broken cloud at 3,500 feet above aerodrome level, 26/23 temperature and dew point in Celsius, and Q1010 QNH pressure in hPa. Local/state conventions vary.",
 key:[["METAR","Aerodrome weather observation"],["141200Z","Day 14 at 12:00 UTC"],["6000","Visibility 6,000 metres in this invented international example"],["-RA","Light rain"],["SCT018","Scattered cloud based around 1,800 ft above aerodrome"],["Q1010","QNH 1010 hPa"]],
 scouts:"Air Scouts: touch each coded group to reveal its meaning, then identify the visibility group.",
 pilots:"Aspiring pilots: distinguish a timed observation from a forecast and note the importance of jurisdiction-specific conventions."},
 {id:"taf",number:3,title:"Read a fictional TAF and temporary weather",pictures:["detail-04"],
 situation:"A training forecast for invented aerodrome ZZZZ reads TAF ZZZZ 141100Z 1412/1512 22010KT 9999 SCT025 TEMPO 1414/1418 4000 TSRA BKN015CB=. All time periods are UTC and the bulletin has no operational status.",
 question:"What does TEMPO 1414/1418 mean in this forecast example?",
 options:["Temporary forecast conditions may occur between 14:00 and 18:00 UTC on day 14.","A continuous observation made at 14:18 local time.","No thunderstorms can occur during this four-hour interval."],answer:0,
 explanation:"The issued time 141100Z is day 14 at 11:00 UTC and validity 1412/1512 runs from day 14 12:00 UTC to day 15 12:00 UTC. TEMPO 1414/1418 defines a temporary group within day 14 from 14:00 to 18:00 UTC. In that group 4000 means 4,000 metres visibility, TSRA thunderstorm with rain, and BKN015CB a broken cumulonimbus cloud layer near 1,500 feet above aerodrome level. The actual applicability of TAF groups follows the State's products and rules.",
 key:[["TAF","Aerodrome forecast, not a weather observation"],["141100Z","Issued day 14 at 11:00 UTC"],["1412/1512","Validity day 14 noon to day 15 noon UTC"],["TEMPO 1414/1418","Temporary conditions within day 14 14:00–18:00 UTC"],["TSRA","Thunderstorm with rain"],["BKN015CB","Broken cumulonimbus layer around 1,500 ft above aerodrome"]],
 scouts:"Air Scouts: compare the forecast issue time and validity period, then locate the temporary group.",
 pilots:"Aspiring pilots: distinguish a forecast possibility from a current observation or clearance."},
 {id:"hazards",number:4,title:"Use observations, forecasts and warnings together",pictures:["overview-04","detail-04"],
 situation:"A fictional learner sees an attractive clear-sky Academy illustration but receives a synthetic weather bulletin describing reduced visibility and thunderstorms for an imaginary region. The illustration is not an observation, and the bulletin is not real flight data.",
 question:"What is the best evidence-based conclusion?",
 options:["The old weather picture proves conditions are safe.","Separate the illustration from actual conditions; consult timely authoritative products with an instructor.","Ignore significant-weather warnings whenever the picture is bright."],answer:1,
 explanation:"A classroom drawing cannot establish current wind, visibility, cloud or storm location. A METAR reports an observation at its location and time, a TAF forecasts conditions over a period, and warnings or advisories may identify additional hazards across a wider region. Appropriate sources vary by jurisdiction. A real operational decision requires approved procedures, current evidence and qualified instruction.",
 key:[["Observation","Condition reported at a particular site and time"],["Forecast","Expected conditions over a stated period or region"],["Significant-weather advisory","Specified hazards according to issuing authority"],["Teaching illustration","Explanatory picture, not live aviation evidence"]],
 scouts:"Air Scouts: explain to the adult instructor why the pictures cannot tell you if the weather is safe right now.",
 pilots:"Aspiring pilots: explain the different questions answered by METAR, TAF and current hazards information."}
].map(x=>Object.freeze({...x,pictures:Object.freeze(x.pictures),options:Object.freeze(x.options),key:Object.freeze(x.key)})));
const reportSamples=Object.freeze({
 metar:Object.freeze({text:"METAR ZZZZ 141200Z 21012KT 6000 -RA SCT018 BKN035 26/23 Q1010=",groups:Object.freeze([
 ["METAR","Routine aerodrome weather observation"],["ZZZZ","Invented training station; not a real briefing"],["141200Z","Day 14, 12:00 UTC"],["21012KT","Wind from 210° true at 12 knots"],["6000","Visibility 6,000 metres in this international example"],["-RA","Light rain"],["SCT018","Scattered cloud at 1,800 feet above aerodrome level"],["BKN035","Broken cloud at 3,500 feet above aerodrome level"],["26/23","Air temperature 26°C, dew point 23°C"],["Q1010","QNH 1010 hectopascals"]
 ].map(([token,meaning])=>Object.freeze({token,meaning})))}),
 taf:Object.freeze({text:"TAF ZZZZ 141100Z 1412/1512 22010KT 9999 SCT025 TEMPO 1414/1418 4000 TSRA BKN015CB=",groups:Object.freeze([
 ["TAF","Aerodrome forecast, not observation"],["ZZZZ","Invented station; no operational weather"],["141100Z","Issued day 14 at 11:00 UTC"],["1412/1512","Valid day 14 12:00 through day 15 12:00 UTC"],["22010KT","Forecast wind from 220° true at 10 knots"],["9999","Forecast visibility 10 km or more"],["SCT025","Scattered cloud at about 2,500 ft above aerodrome level"],["TEMPO","Temporary forecast change group"],["1414/1418","Day 14, 14:00–18:00 UTC"],["4000","Visibility 4,000 metres in temporary group"],["TSRA","Thunderstorm with rain"],["BKN015CB","Broken cumulonimbus at about 1,500 ft above aerodrome level"]
 ].map(([token,meaning])=>Object.freeze({token,meaning})))})
});
function get(id){return cases.find(c=>c.id===id)||null}
function evaluate(id,choice){const c=get(id);if(!c||!Number.isInteger(choice)||choice<0||choice>=c.options.length)throw Error("Choose one fictional weather response");return Object.freeze({id,correct:choice===c.answer,expected:c.options[c.answer],explanation:c.explanation,key:c.key})}
function report(name){if(!reportSamples[name])throw Error("Unknown fictional weather report");return reportSamples[name]}
function decode(name,index){const data=report(name);if(!Number.isInteger(index)||index<0||index>=data.groups.length)throw Error("Unknown weather code group");return data.groups[index]}
function validate(atlas){
 if(cases.length!==4||new Set(cases.map(c=>c.id)).size!==4)throw Error("Expected four distinct weather cases");
 let views=0;
 for(const c of cases){
  if(c.options.length!==3||!Number.isInteger(c.answer)||c.answer<0||c.answer>2||c.situation.length<130||c.explanation.length<200||c.key.length<4||!c.scouts||!c.pilots)throw Error("Incomplete Course 06 case "+c.id);
  for(const id of c.pictures){const pic=atlas?.getById(id);if(!pic||!["detailed","overview"].includes(pic.group))throw Error("Only approved cloud drawings can be shown: "+id);views++}
 }
 for(const r of Object.values(reportSamples))if(!r.text.includes("ZZZZ")||r.groups.length<9||r.groups.some(g=>!r.text.includes(g.token)||!g.meaning))throw Error("Incomplete fictional code guide");
 return Object.freeze({moduleId:"meteorology",cases:4,pictureViews:views,reportSamples:2,status:"OPTIONAL_SELF_STUDY_SME_REVIEW_REQUIRED",revision:REVISION});
}
const api=Object.freeze({REVISION,cases,reportSamples,get,evaluate,report,decode,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAMeteorologyPractical=api;
})(typeof window!=="undefined"?window:null);
