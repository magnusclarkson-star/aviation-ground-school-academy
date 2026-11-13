/* Original advanced Academy module content B1; SME review required. */
(function(root){"use strict";const units=[
 {
  "id": "navigation",
  "focus": {
   "scouts": "Plot a fictional route between landmarks and explain why a compass heading is not always the ground track.",
   "pilots": "Work through a simple time-distance estimate and identify where wind, fuel and chart currency introduce uncertainty."
  },
  "glossary": [
   [
    "Groundspeed",
    "Speed of movement relative to the Earth."
   ],
   [
    "True north",
    "Direction toward the geographic North Pole."
   ],
   [
    "Dead reckoning",
    "Estimating position using a known point, direction, speed and elapsed time."
   ]
  ],
  "lessons": [
   {
    "title": "Coordinates, heading, track and north",
    "concept": "A position can be described by latitude and longitude, while directions may refer to true or magnetic north. Heading is where the nose points; track is the direction of travel over the Earth. Variation and compass errors depend on location and equipment. A number without its reference can be misleading.",
    "example": "A fictional aeroplane points northeast while a crosswind pushes its ground path eastward. The GPS track and compass heading may differ even when both instruments are functioning.",
    "task": "Sketch true north, magnetic north, heading, wind and ground track. Explain which describe direction of the aircraft versus movement."
   },
   {
    "title": "Time, distance and fuel planning concepts",
    "concept": "At constant groundspeed, time in hours equals distance in nautical miles divided by groundspeed in knots. Real routes include changing winds, climbs, descents and delay, so one calculation is only a preliminary estimate. Fuel planning also needs aircraft-specific approved consumption and reserves, rather than a generic guess.",
    "example": "A fictional 90 NM leg at 60 kt takes 1.5 hours; at 45 kt it takes 2 hours. This arithmetic does not establish fuel endurance or permission for flight.",
    "task": "Calculate time for 75 NM at 50 kt and 100 kt. Explain why an aircraft's fuel need cannot be inferred from that result alone."
   },
   {
    "title": "Chart currency, navigation error and contingency",
    "concept": "Visual navigation depends on identifiable features and suitable current charts. Radio and satellite navigation each have coverage, database and interpretation limitations. A route line on a display does not authorise airspace entry or ensure terrain clearance. Errors in data entry and obsolete information remain important.",
    "example": "A learner sees a fictional GPS route across a controlled airspace boundary but has an older paper chart. The correct learning response is to verify current authoritative publications and applicable permissions.",
    "task": "Write three questions that test the source, validity and operational limits of an illustrated navigation route."
   }
  ],
  "scenario": {
   "title": "Route line through controlled airspace",
   "situation": "An Academy navigator draws a magenta line crossing a controlled boundary. Someone says the line authorises entry. What is the best response?",
   "options": [
    "A drawn route is itself a clearance",
    "Verify current airspace rules and obtain applicable authorisation",
    "GPS graphics replace every regulation"
   ],
   "answer": 1,
   "why": "A route display is information, not operational permission."
  },
  "questions": [
   [
    "At 75 kt groundspeed, 150 NM takes approximately...",
    [
     "One hour",
     "Two hours",
     "Four hours"
    ],
    1,
    "Dividing 150 nautical miles by 75 knots gives two hours."
   ],
   [
    "A crosswind can make which quantities differ?",
    [
     "Heading and ground track",
     "Engine count and wing span",
     "Cockpit colour and cloud base"
    ],
    0,
    "Heading is the nose direction; wind can shift ground track."
   ],
   [
    "A usable real navigation plan requires...",
    [
     "One unverified screenshot",
     "An obsolete map",
     "Current charts, applicable airspace information and checks"
    ],
    2,
    "Current authoritative sources and permissions matter."
   ]
  ]
 },
 {
  "id": "airspace",
  "focus": {
   "scouts": "Discuss runway, taxiway and apron markings on a fictional airport plan.",
   "pilots": "Separate national air law, service provision, controlled-airspace requirements and ATC clearances."
  },
  "glossary": [
   [
    "AIP",
    "Aeronautical Information Publication."
   ],
   [
    "NOTAM",
    "Time-sensitive aeronautical information notice."
   ],
   [
    "Controlled airspace",
    "Airspace where ATC service is provided according to its classification."
   ]
  ],
  "lessons": [
   {
    "title": "Airspace classes and state requirements",
    "concept": "Airspace is organised to manage traffic, risk and services. Classification can affect communication, equipment, clearances and visibility rules depending on national implementation. A rule familiar from another country cannot automatically be assumed to apply in Sierra Leone or elsewhere; consult the responsible state authority and current aeronautical publications.",
    "example": "Two fictional states classify similar airspace around aerodromes differently. Students should locate which authority publishes each state's requirements instead of copying a foreign table.",
    "task": "Make a comparison table naming the responsible source for airspace requirements in two hypothetical states."
   },
   {
    "title": "Aerodrome signs, markings and boundaries",
    "concept": "Runway numbers roughly indicate magnetic orientation, while signs and markings distinguish runways, taxiways, aprons and holding positions. Their published meanings support safe movement on the ground. A runway-incursion risk arises when a vehicle or aircraft crosses a protected surface without proper authorisation.",
    "example": "At a fictional crossing, a taxiway meets a runway. Identifying a holding-position marking is an awareness exercise; the drawing itself cannot grant taxi permission.",
    "task": "Sketch a runway, parallel taxiway, apron and holding position and label the purpose of each."
   },
   {
    "title": "Publications, restrictions and responsibilities",
    "concept": "AIP material, NOTAMs, charts and airport publications communicate different categories of information. Their effective dates matter because runway status, obstacles, services and airspace restrictions can change. Legal permission, an ATC service and an instructor's recommendation are separate matters.",
    "example": "A classroom airport diagram labels a runway usable. A current official notice may close it, so real operations require current authorised information instead of classroom assumptions.",
    "task": "Contrast a permanent publication amendment with a short-lived notice and explain why both must be checked."
   }
  ],
  "scenario": {
   "title": "Using an overseas rule near Freetown",
   "situation": "A student claims that a rule from a foreign handbook automatically governs controlled airspace in Sierra Leone. What should the class do?",
   "options": [
    "Follow the overseas rule without checking",
    "Consult applicable state rules and current publications",
    "Ignore airspace classifications"
   ],
   "answer": 1,
   "why": "International standards are implemented by states through their own regulatory framework."
  },
  "questions": [
   [
    "Who implements binding aviation rules in a state?",
    [
     "A flight-sim forum",
     "The competent state authority under applicable law",
     "Any airport visitor"
    ],
    1,
    "Legal duties depend on applicable state law and competent authorities."
   ],
   [
    "Runway designations generally reflect...",
    [
     "Approximate magnetic orientation",
     "Passenger capacity",
     "Fuel type"
    ],
    0,
    "Runway numbers generally reflect rounded magnetic heading."
   ],
   [
    "NOTAMs can convey...",
    [
     "Pilot licence grades",
     "Engine oil viscosity only",
     "Qualifying aeronautical changes or hazards"
    ],
    2,
    "Notices provide specified time-sensitive aeronautical information."
   ]
  ]
 },
 {
  "id": "communications",
  "focus": {
   "scouts": "Practise a fictional callsign with the spelling alphabet and a careful listening exercise.",
   "pilots": "Label request, instruction, clearance, readback and acknowledgement in a training-only dialogue."
  },
  "glossary": [
   [
    "Callsign",
    "Radio identifier for a station or aircraft."
   ],
   [
    "Readback",
    "Repeating key information to confirm accurate receipt."
   ],
   [
    "Clearance",
    "Operational authorisation from an authorised air traffic service."
   ]
  ],
  "lessons": [
   {
    "title": "Message structure, callsigns and clarity",
    "concept": "Good radio exchanges identify the called station and speaker before conveying relevant information concisely. Standard phraseology and the spelling alphabet help prevent ambiguous letters and numbers. Exact radio wording depends on applicable procedures, and classroom scripts must not be transmitted as real clearances.",
    "example": "A learner gives a destination in a fictional call but omits the callsign. Another learner cannot identify who is speaking. A better structured call reduces uncertainty without increasing volume.",
    "task": "Draft a short fictional radio call with the called station, callsign, purpose and relevant location."
   },
   {
    "title": "Instructions, clearances and correction",
    "concept": "A clearance is distinct from traffic information, a request and an acknowledgement. Critical clearances and instructions may require accurate readback under applicable rules. Both participants contribute to identifying mistakes, and a wrong readback should be corrected; a polished delivery does not make incorrect content safe.",
    "example": "A class exercise uses a fictitious runway number that the listener repeats incorrectly. The correction process helps learners recognise why every number matters.",
    "task": "Highlight the instruction, readback and acknowledgement in a fictional dialogue and spot one inserted error."
   },
   {
    "title": "Urgency, distress and equipment failure concepts",
    "concept": "Aviation has established conventions for emergency, urgency and routine communications. Loss of radio communication involves rules and procedures that vary with airspace, flight conditions and equipment. Introductory students should learn the distinctions, not memorise an invented emergency sequence from this Academy.",
    "example": "In a simulator lesson, the radio becomes silent. The learning questions include which equipment and published procedures might matter; the exercise provides no instruction for a real failure.",
    "task": "Create a glossary distinguishing routine, urgent and distress communication without providing live emergency frequencies."
   }
  ],
  "scenario": {
   "title": "A wrong runway number in a readback",
   "situation": "During a role-play, a learner repeats a different runway number from the fictional instruction. What is the appropriate next step?",
   "options": [
    "Identify and correct the inconsistency",
    "Ignore all runway numbers",
    "Repeat the wrong number more confidently"
   ],
   "answer": 0,
   "why": "Readback and correction serve as safeguards against misunderstanding."
  },
  "questions": [
   [
    "A callsign helps identify...",
    [
     "Airspeed",
     "The station or aircraft transmitting",
     "Engine torque"
    ],
    1,
    "Callsigns help listeners distinguish participants."
   ],
   [
    "A readback is meant to...",
    [
     "Verify important information",
     "Calculate fuel endurance",
     "Start the autopilot"
    ],
    0,
    "Repeating critical instructions can reveal mistakes."
   ],
   [
    "Real operational clearances come from...",
    [
     "An Academy sound file",
     "A public practice quiz",
     "An authorised air traffic service"
    ],
    2,
    "An educational simulator cannot authorise airspace or runway use."
   ]
  ]
 }
];if(typeof module!=="undefined"&&module.exports)module.exports=units;if(root)root.AGSADepthPartB1=units;})(typeof window!=="undefined"?window:null);
