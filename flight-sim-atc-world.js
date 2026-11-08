/* Geographic, fictional ATC teaching scenarios. Airport identifiers are real,
 * but runway choices, facilities, situations and clearances are ILLUSTRATIVE.
 * No real radio frequencies, live traffic, charts or operational authority.
 */
(function(root){"use strict";
const airports=Object.freeze([
 {id:"gfll",name:"Freetown International — Lungi",code:"GFLL / FNA",region:"Sierra Leone",ground:"Lungi Ground",tower:"Lungi Tower",approach:"Lungi Approach",runway:"one two",lang:"en-GB"},
 {id:"gfha",name:"Freetown city — Hastings Airfield",code:"GFHA / HGS",region:"Sierra Leone",ground:"Hastings Traffic",tower:"Hastings Traffic",approach:"Hastings Traffic",runway:"zero nine",lang:"en-GB",advisory:true},
 {id:"egll",name:"London Heathrow",code:"EGLL / LHR",region:"United Kingdom",ground:"Heathrow Ground",tower:"Heathrow Tower",approach:"Heathrow Director",runway:"two seven right",lang:"en-GB"},
 {id:"egcc",name:"Manchester",code:"EGCC / MAN",region:"United Kingdom",ground:"Manchester Ground",tower:"Manchester Tower",approach:"Manchester Approach",runway:"two three right",lang:"en-GB"},
 {id:"lfpg",name:"Paris Charles de Gaulle",code:"LFPG / CDG",region:"Europe",ground:"De Gaulle Ground",tower:"De Gaulle Tower",approach:"Paris Approach",runway:"two six left",lang:"en-GB"},
 {id:"eddf",name:"Frankfurt",code:"EDDF / FRA",region:"Europe",ground:"Frankfurt Ground",tower:"Frankfurt Tower",approach:"Frankfurt Radar",runway:"two five left",lang:"en-GB"},
 {id:"eham",name:"Amsterdam Schiphol",code:"EHAM / AMS",region:"Europe",ground:"Schiphol Ground",tower:"Schiphol Tower",approach:"Schiphol Approach",runway:"one eight right",lang:"en-GB"},
 {id:"kjfk",name:"New York JFK",code:"KJFK / JFK",region:"United States",ground:"Kennedy Ground",tower:"Kennedy Tower",approach:"New York Approach",runway:"three one left",lang:"en-US",us:true},
 {id:"klax",name:"Los Angeles International",code:"KLAX / LAX",region:"United States",ground:"Los Angeles Ground",tower:"Los Angeles Tower",approach:"SoCal Approach",runway:"two five right",lang:"en-US",us:true},
 {id:"cyyz",name:"Toronto Pearson",code:"CYYZ / YYZ",region:"Canada",ground:"Toronto Ground",tower:"Toronto Tower",approach:"Toronto Arrival",runway:"two three",lang:"en-CA"},
 {id:"cyvr",name:"Vancouver",code:"CYVR / YVR",region:"Canada",ground:"Vancouver Ground",tower:"Vancouver Tower",approach:"Vancouver Arrival",runway:"two six left",lang:"en-CA"},
 {id:"hkjk",name:"Nairobi Jomo Kenyatta",code:"HKJK / NBO",region:"Africa",ground:"Nairobi Ground",tower:"Nairobi Tower",approach:"Nairobi Approach",runway:"zero six",lang:"en-GB"},
 {id:"dgaa",name:"Accra Kotoka",code:"DGAA / ACC",region:"Africa",ground:"Accra Ground",tower:"Accra Tower",approach:"Accra Approach",runway:"two one",lang:"en-GB"},
 {id:"faor",name:"Johannesburg OR Tambo",code:"FAOR / JNB",region:"Africa",ground:"Johannesburg Ground",tower:"Johannesburg Tower",approach:"Johannesburg Radar",runway:"zero three left",lang:"en-ZA"},
 {id:"yssy",name:"Sydney Kingsford Smith",code:"YSSY / SYD",region:"Australia",ground:"Sydney Ground",tower:"Sydney Tower",approach:"Sydney Approach",runway:"one six right",lang:"en-AU"},
 {id:"ymml",name:"Melbourne Tullamarine",code:"YMML / MEL",region:"Australia",ground:"Melbourne Ground",tower:"Melbourne Tower",approach:"Melbourne Approach",runway:"one six",lang:"en-AU"}
].map(a=>Object.freeze(a)));
const situations=Object.freeze([
 {id:"normal",name:"Normal departure / return"},
 {id:"go-around",name:"Approach: go-around"},
 {id:"readback",name:"Incorrect readback: correction"},
 {id:"radio-check",name:"Before departure: radio check"}
].map(x=>Object.freeze(x)));
const getAirport=id=>airports.find(a=>a.id===id)||airports[0];
const getSituation=id=>situations.find(s=>s.id===id)||situations[0];
const P=text=>Object.freeze({speaker:"Pilot",text});
const C=text=>Object.freeze({speaker:"Tower",text});
const callsign="Academy Four Two One";
function dialogue(stage,mode="airplane",scenario="runway",airportId="gfll",situationId="normal"){
 if(!["before","during","after"].includes(stage))throw Error("Unsupported worldwide radio stage");
 const a=getAirport(airportId),s=getSituation(situationId).id,r=a.runway,id=callsign;
 const arrival=scenario==="approach",heli=mode==="helicopter";
 if(a.advisory){
  // Hastings ATC service status is not verified. No Tower takeoff/landing clearances.
  if(stage==="before")return Object.freeze([
   P(a.ground+", "+id+", at the illustrated apron, conducting a radio check before local training."),
   C(id+", Academy training radio, readability five. This is an exercise, not an aerodrome control service."),
   P("Readability five, "+id+". Intend local training departure, illustrated runway "+r+"."),
   C(id+", Academy training radio acknowledges. Confirm the applicable procedures with the aerodrome operator for real flying."),
   P(id+", holding clear of the fictional runway, all checks complete.")
  ]);
  if(stage==="during")return Object.freeze([
   P(a.tower+", "+id+", simulated "+(s==="go-around"?"go-around":"circuit")+", runway "+r+", remaining in the practice area."),
   C(id+", Academy training radio acknowledges. Maintain visual awareness; no traffic separation is provided."),
   P(id+", observing the illustrated circuit and other simulated traffic."),
   C(id+", report when clear of the fictional landing area.")
  ]);
  return Object.freeze([
   P(a.ground+", "+id+", clear of the illustrated landing area, taxiing to the practice apron."),
   C(id+", Academy training radio acknowledges. This exercise does not represent live aerodrome operations."),
   P("Returning to the simulated apron, "+id+"."),
   C(id+", training radio scenario complete.")
  ]);
 }
 if(stage==="before"&&s==="radio-check")return Object.freeze([
  P(a.ground+", "+id+", at the training apron, radio check."),
  C(id+", "+a.ground+", readability five. Pass your request."),
  P("Readability five, "+id+". Request taxi for "+(heli?"helicopter":"aeroplane")+" training."),
  C(id+", simulated taxi to holding point runway "+r+", hold short of runway "+r+"."),
  P("Taxi to holding point runway "+r+", hold short of runway "+r+", "+id+".")
 ]);
 if(stage==="before"){
  if(heli)return Object.freeze([
   P(a.ground+", "+id+", training helicopter at the illustrated apron, request departure instructions."),
   C(id+", "+a.ground+", remain at the practice pad, hold position pending further instructions."),
   P("Holding position at the practice pad, "+id+"."),
   C(id+", contact "+a.tower+" for the simulated departure."),
   P(a.tower+", "+id+", ready at the practice pad, request departure."),
   C(id+", "+a.tower+", cleared for simulated departure from the designated training pad."),
   P("Cleared for simulated departure from the training pad, "+id+".")
  ]);
  return Object.freeze([
   P(a.ground+", "+id+", at the training apron, request taxi for a local training departure."),
   C(id+", "+a.ground+", "+(a.us?"taxi to runway ":"taxi to holding point runway ")+r+", hold short of runway "+r+"."),
   P("Taxi to "+(a.us?"runway ":"holding point runway ")+r+", hold short of runway "+r+", "+id+"."),
   C(id+", contact "+a.tower+" when ready for departure."),
   P(a.tower+", "+id+", holding short runway "+r+", ready for departure."),
   C(id+", "+a.tower+", runway "+r+", cleared for takeoff."),
   P("Runway "+r+", cleared for takeoff, "+id+".")
  ]);
 }
 if(stage==="during"&&s==="readback")return Object.freeze([
  P(a.approach+", "+id+", request confirmation of assigned altitude."),
  C(id+", "+a.approach+", maintain three thousand feet."),
  P("Maintaining five thousand feet, "+id+"."),
  C(id+", negative. Maintain three thousand feet. I say again, three thousand feet."),
  P("Correction, maintaining three thousand feet, "+id+"."),
  C(id+", readback correct. Continue the training exercise.")
 ]);
 if(stage==="during"&&s==="go-around")return Object.freeze([
  P(a.tower+", "+id+", going around, approach unstable."),
  C(id+", "+a.tower+", roger. Go around, climb straight ahead to two thousand feet."),
  P("Going around, climb straight ahead to two thousand feet, "+id+"."),
  C(id+", contact "+a.approach+" for further training instructions."),
  P("Contact "+a.approach+", "+id+".")
 ]);
 if(stage==="during"&&arrival)return Object.freeze([
  P(a.approach+", "+id+", on the simulated final approach, runway "+r+"."),
  C(id+", "+a.approach+", continue approach and contact "+a.tower+"."),
  P(a.tower+", "+id+", established final runway "+r+", request landing."),
  C(id+", "+a.tower+", runway "+r+", cleared to land."),
  P("Runway "+r+", cleared to land, "+id+".")
 ]);
 return Object.freeze([
  P(a.approach+", "+id+", passing one thousand feet, climbing two thousand feet."),
  C(id+", "+a.approach+", continue climb to two thousand feet, report level."),
  P("Climb to two thousand feet, will report level, "+id+"."),
  C(id+", roger. Remain within the published training scenario, no live traffic information is supplied.")
 ]);
 }
 return Object.freeze([
  P(a.tower+", "+id+", runway vacated after the simulated landing."),
  C(id+", "+a.tower+", roger, contact "+a.ground+" for taxi."),
  P(a.ground+", "+id+", runway vacated, request taxi to the practice apron."),
  C(id+", "+a.ground+", taxi to the practice apron, use the illustrated route only."),
  P("Taxi to the practice apron, "+id+".")
 ]);
}
const api=Object.freeze({airports,situations,getAirport,getSituation,dialogue});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightATCWorld=api;
})(typeof window!=="undefined"?window:null);
