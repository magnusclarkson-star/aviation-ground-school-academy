/* Original Academy introductory theory coursebook. Draft teaching material; not an approved syllabus. */
(function(root){"use strict";
const REVISION="2026-11-13-coursebook-v1";
const modules=Object.freeze([
 {
  "id": "orientation",
  "title": "Aviation orientation and safety culture",
  "level": "Foundations",
  "number": 1,
  "minutes": 18,
  "objectives": [
   "Explain how ground school fits flight training using the key concepts presented in this lesson.",
   "Explain air scouts and aviation careers using the key concepts presented in this lesson.",
   "Explain safety and reporting using the key concepts presented in this lesson."
  ],
  "sections": [
   {
    "title": "How ground school fits flight training",
    "body": "Ground school builds the vocabulary and reasoning used before and during practical instruction. It complements, rather than replaces, a qualified instructor, approved aircraft documentation, and supervised flight experience. Students should distinguish an educational illustration from a checklist that can be used on a real aircraft."
   },
   {
    "title": "Air Scouts and aviation careers",
    "body": "Air Scouts can explore science, teamwork, observation and responsible communication. Enthusiasts may explore civilian and military careers, engineering, air traffic services, meteorology and maintenance. Career routes, medical requirements and licensing differ between countries and operators."
   },
   {
    "title": "Safety and reporting",
    "body": "Aviation safety benefits from reporting hazards and learning from incidents without hiding mistakes. If unsure during an exercise, stop, ask questions and use authorised guidance. Never copy simulator settings directly into a real aircraft."
   }
  ],
  "activity": "Create a short written explanation of how ground school fits flight training, then compare it with air scouts and aviation careers. Identify one question for an instructor.",
  "quiz": [
   {
    "id": "orientation-0",
    "question": "What does ground school primarily support?",
    "options": [
     "Knowledge and decision-making",
     "Replacing all practical flying",
     "Issuing a pilot licence"
    ],
    "answer": 0,
    "explanation": "Ground school develops understanding; real qualifications and flight training require authorised processes."
   },
   {
    "id": "orientation-1",
    "question": "Which activity is appropriate for an Air Scout lesson?",
    "options": [
     "Practising observation and teamwork",
     "Operating an aircraft without supervision",
     "Issuing ATC clearances"
    ],
    "answer": 0,
    "explanation": "Supervised observation and teamwork are appropriate educational activities."
   },
   {
    "id": "orientation-2",
    "question": "What should a learner do when a simulator conflicts with an aircraft flight manual?",
    "options": [
     "Trust the simulator",
     "Use the current approved manual and qualified instructor",
     "Use whichever figure is faster"
    ],
    "answer": 1,
    "explanation": "Approved aircraft information and qualified instruction take priority."
   }
  ],
  "reference": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
  "reviewStatus": "SME_REVIEW_REQUIRED"
 },
 {
  "id": "aircraft",
  "title": "Aircraft structures and configurations",
  "level": "Foundations",
  "number": 2,
  "minutes": 22,
  "objectives": [
   "Explain major assemblies using the key concepts presented in this lesson.",
   "Explain control surfaces using the key concepts presented in this lesson.",
   "Explain fixed-wing and rotorcraft using the key concepts presented in this lesson."
  ],
  "sections": [
   {
    "title": "Major assemblies",
    "body": "The fuselage houses people and equipment; wings produce much of the lift on conventional aeroplanes; the empennage provides stability and control; the undercarriage supports ground operations. Airframes vary, so a helicopter or delta-wing fighter will not share every component of a conventional trainer."
   },
   {
    "title": "Control surfaces",
    "body": "On many conventional aeroplanes ailerons chiefly command roll, elevators pitch and rudders yaw. Tabs, flaps, slats and spoilers have additional purposes. Fly-by-wire types may blend multiple surface movements through computer control laws."
   },
   {
    "title": "Fixed-wing and rotorcraft",
    "body": "A helicopter uses a powered rotor to generate lift and control forces, with cyclic, collective and anti-torque arrangements depending on design. Rotorcraft operations and limitations require specialist type-appropriate training, not aeroplane assumptions."
   }
  ],
  "activity": "Create a short written explanation of major assemblies, then compare it with control surfaces. Identify one question for an instructor.",
  "quiz": [
   {
    "id": "aircraft-0",
    "question": "What is the empennage?",
    "options": [
     "Tail assembly",
     "Nose wheel",
     "Electrical bus"
    ],
    "answer": 0,
    "explanation": "The empennage is the conventional aeroplane tail assembly."
   },
   {
    "id": "aircraft-1",
    "question": "Which primary control normally affects roll?",
    "options": [
     "Ailerons",
     "Altimeter",
     "Fuel selector"
    ],
    "answer": 0,
    "explanation": "Ailerons typically change the rolling moment on conventional aeroplanes."
   },
   {
    "id": "aircraft-2",
    "question": "Why is the R44 not flown using Cessna-specific procedures?",
    "options": [
     "Rotorcraft systems and handling differ",
     "Both aircraft use identical controls",
     "Helicopters have no limitations"
    ],
    "answer": 0,
    "explanation": "Rotorcraft require separate approved procedures and specialist instruction."
   }
  ],
  "reference": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
  "reviewStatus": "SME_REVIEW_REQUIRED"
 },
 {
  "id": "aerodynamics",
  "title": "Principles of flight and aerodynamics",
  "level": "Flight theory",
  "number": 3,
  "minutes": 26,
  "objectives": [
   "Explain forces and airflow using the key concepts presented in this lesson.",
   "Explain angle of attack and stall using the key concepts presented in this lesson.",
   "Explain stability and control using the key concepts presented in this lesson."
  ],
  "sections": [
   {
    "title": "Forces and airflow",
    "body": "Lift, weight, thrust and drag describe key aerodynamic and mechanical forces. Lift arises from pressure distribution and airflow momentum changes around a wing or rotor. Force balance affects whether motion changes; it is not a promise that an aircraft will hold a given speed or height."
   },
   {
    "title": "Angle of attack and stall",
    "body": "Angle of attack is the angle between a wing's chord reference and relative airflow. Exceeding a wing's critical angle of attack can produce a stall at different indicated airspeeds. Load factor, configuration and turbulence influence stall margin."
   },
   {
    "title": "Stability and control",
    "body": "Static stability is the initial tendency after a disturbance; dynamic stability concerns motion over time. Bank, pitch and yaw motions are coupled, and actual handling depends on design and flight condition. Simulator animations are conceptual, not a validated handling model."
   }
  ],
  "activity": "Create a short written explanation of forces and airflow, then compare it with angle of attack and stall. Identify one question for an instructor.",
  "quiz": [
   {
    "id": "aerodynamics-0",
    "question": "What defines an aerodynamic stall?",
    "options": [
     "Critical angle of attack is exceeded",
     "The engine is switched off",
     "The wheels stop turning"
    ],
    "answer": 0,
    "explanation": "An aerodynamic stall is fundamentally related to exceeding critical angle of attack."
   },
   {
    "id": "aerodynamics-1",
    "question": "During an increasing banked level turn, load factor generally...",
    "options": [
     "Increases",
     "Becomes zero",
     "Always decreases"
    ],
    "answer": 0,
    "explanation": "Maintaining level flight at greater bank generally raises load factor."
   },
   {
    "id": "aerodynamics-2",
    "question": "Which force opposes motion through air?",
    "options": [
     "Drag",
     "Weight",
     "Thrust"
    ],
    "answer": 0,
    "explanation": "Drag generally acts opposite relative motion through the air."
   }
  ],
  "reference": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
  "reviewStatus": "SME_REVIEW_REQUIRED"
 },
 {
  "id": "systems",
  "title": "Powerplants and aircraft systems",
  "level": "Flight theory",
  "number": 4,
  "minutes": 18,
  "objectives": [
   "Explain propulsion overview using the key concepts presented in this lesson.",
   "Explain fuel and electrical systems using the key concepts presented in this lesson.",
   "Explain hydraulic and environmental systems using the key concepts presented in this lesson."
  ],
  "sections": [
   {
    "title": "Propulsion overview",
    "body": "Piston engines, turbines and electric motors convert stored energy into propulsion or shaft power. Propellers accelerate air to create thrust, while helicopters use engine power to drive rotor systems. Different aircraft have different operating limitations and emergency procedures."
   },
   {
    "title": "Fuel and electrical systems",
    "body": "Fuel storage, pumps, valves and indicators support propulsion; electrical systems supply instruments, communications and other equipment. A battery and alternator may supply a basic trainer, while larger aircraft use more complex generators and buses. A single gauge reading is not proof that a system is healthy."
   },
   {
    "title": "Hydraulic and environmental systems",
    "body": "Some aircraft use hydraulics to operate landing gear, brakes and flying surfaces. Pressurisation, oxygen and anti-ice systems serve different purposes. Students should learn what the systems do before studying type-specific normal and abnormal checklists."
   }
  ],
  "activity": "Create a short written explanation of propulsion overview, then compare it with fuel and electrical systems. Identify one question for an instructor.",
  "quiz": [
   {
    "id": "systems-0",
    "question": "What commonly recharges the battery in a light piston aeroplane?",
    "options": [
     "Alternator",
     "Altimeter",
     "Flap"
    ],
    "answer": 0,
    "explanation": "An alternator typically powers the electrical system and charges the battery while the engine runs."
   },
   {
    "id": "systems-1",
    "question": "Which system might actuate landing gear on a larger aircraft?",
    "options": [
     "Hydraulic system",
     "Compass card",
     "Static port alone"
    ],
    "answer": 0,
    "explanation": "Hydraulic systems commonly power moving mechanisms including some landing gear."
   },
   {
    "id": "systems-2",
    "question": "Where are specific engine and fuel limitations found?",
    "options": [
     "Applicable aircraft flight manual",
     "A generic app tutorial",
     "A different aircraft's checklist"
    ],
    "answer": 0,
    "explanation": "Type-specific limitations belong in the applicable approved documents."
   }
  ],
  "reference": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
  "reviewStatus": "SME_REVIEW_REQUIRED"
 },
 {
  "id": "instruments",
  "title": "Flight instruments and electronic displays",
  "level": "Flight theory",
  "number": 5,
  "minutes": 22,
  "objectives": [
   "Explain pitot-static basics using the key concepts presented in this lesson.",
   "Explain attitude and heading using the key concepts presented in this lesson.",
   "Explain situational awareness using the key concepts presented in this lesson."
  ],
  "sections": [
   {
    "title": "Pitot-static basics",
    "body": "Airspeed indication uses pitot and static pressure measurements, whereas a pressure altimeter interprets static pressure using a selected reference. A vertical-speed indicator shows pressure-derived altitude-change trend. Incorrect settings or blocked ports can produce misleading indications."
   },
   {
    "title": "Attitude and heading",
    "body": "An attitude indicator shows aircraft orientation relative to a depicted horizon. Heading instruments and magnetic compasses have different error sources. Glass cockpits combine information on electronic displays but can fail or disagree, so cross-check principles remain important."
   },
   {
    "title": "Situational awareness",
    "body": "A navigation screen can show position, route and traffic or terrain information when properly equipped, configured and current. It does not grant clearance, replace lookout or override published limitations. Academy instruments show simulated data rather than certified readings."
   }
  ],
  "activity": "Create a short written explanation of pitot-static basics, then compare it with attitude and heading. Identify one question for an instructor.",
  "quiz": [
   {
    "id": "instruments-0",
    "question": "Which input does a conventional pressure altimeter primarily use?",
    "options": [
     "Static pressure",
     "Fuel flow",
     "Wheel rotation"
    ],
    "answer": 0,
    "explanation": "A pressure altimeter uses static pressure with a selected reference setting."
   },
   {
    "id": "instruments-1",
    "question": "What is an attitude indicator intended to show?",
    "options": [
     "Pitch and bank orientation",
     "Fuel purity",
     "Required licence type"
    ],
    "answer": 0,
    "explanation": "Attitude indications depict aircraft orientation relative to the horizon."
   },
   {
    "id": "instruments-2",
    "question": "A simulated GPS course display is...",
    "options": [
     "An educational indication, not ATC clearance",
     "Authority to enter restricted airspace",
     "Proof of airworthiness"
    ],
    "answer": 0,
    "explanation": "Displays cannot issue operational permission or demonstrate aircraft fitness."
   }
  ],
  "reference": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
  "reviewStatus": "SME_REVIEW_REQUIRED"
 },
 {
  "id": "meteorology",
  "title": "Aviation weather and interpreting reports",
  "level": "Planning",
  "number": 6,
  "minutes": 26,
  "objectives": [
   "Explain atmosphere and pressure using the key concepts presented in this lesson.",
   "Explain weather products using the key concepts presented in this lesson.",
   "Explain hazard recognition using the key concepts presented in this lesson."
  ],
  "sections": [
   {
    "title": "Atmosphere and pressure",
    "body": "Pressure, temperature and moisture affect weather and aircraft performance. Unstable air can generate vertical motion and convective clouds; winds can vary with height and terrain. Weather conditions can change more quickly than a prepared lesson can reflect."
   },
   {
    "title": "Weather products",
    "body": "A METAR is a routine aviation observation for an aerodrome; a TAF provides an aerodrome forecast. SIGMETs describe specified significant weather hazards in a region. Read the issue time, validity period and applicable service definitions before interpreting any real report."
   },
   {
    "title": "Hazard recognition",
    "body": "Visibility reduction, strong winds, wind shear, turbulence, icing and thunderstorms are examples of hazards. A fictional briefing can teach pattern recognition but not make a flight release or go/no-go decision. Obtain current authorised products and qualified advice for real operations."
   }
  ],
  "activity": "Create a short written explanation of atmosphere and pressure, then compare it with weather products. Identify one question for an instructor.",
  "quiz": [
   {
    "id": "meteorology-0",
    "question": "What does a TAF provide?",
    "options": [
     "Aerodrome forecast",
     "Pilot licence",
     "Aircraft weight certificate"
    ],
    "answer": 0,
    "explanation": "TAFs provide forecasts for designated aerodromes."
   },
   {
    "id": "meteorology-1",
    "question": "What does a METAR normally represent?",
    "options": [
     "Weather observation",
     "ATC takeoff clearance",
     "Engine service log"
    ],
    "answer": 0,
    "explanation": "METAR is a standard routine aerodrome weather observation."
   },
   {
    "id": "meteorology-2",
    "question": "Which is an important convective-weather hazard?",
    "options": [
     "Thunderstorm activity",
     "A fixed paint colour",
     "A cockpit seat position"
    ],
    "answer": 0,
    "explanation": "Thunderstorms can involve turbulence, lightning, hail and other hazards."
   }
  ],
  "reference": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
  "reviewStatus": "SME_REVIEW_REQUIRED"
 },
 {
  "id": "navigation",
  "title": "Navigation and flight planning concepts",
  "level": "Planning",
  "number": 7,
  "minutes": 18,
  "objectives": [
   "Explain position and direction using the key concepts presented in this lesson.",
   "Explain planning a route using the key concepts presented in this lesson.",
   "Explain navigation equipment using the key concepts presented in this lesson."
  ],
  "sections": [
   {
    "title": "Position and direction",
    "body": "Latitude and longitude describe geographic position. Heading is the direction the nose points, whereas track is the path over the ground. Wind can make heading and track differ; true and magnetic references must also be distinguished."
   },
   {
    "title": "Planning a route",
    "body": "Aeronautical charts, current airspace information, terrain, weather, NOTAMs, fuel and alternates all inform a route plan. An example time calculation uses time equals distance divided by groundspeed, with compatible units. Real navigation requires the current publications and applicable training."
   },
   {
    "title": "Navigation equipment",
    "body": "Visual landmarks, magnetic instruments, radio navigation and satellite positioning have different strengths and limitations. GPS information can be stale, unavailable or incorrectly entered. Proper cross-checking and contingency planning matter more than a single screen."
   }
  ],
  "activity": "Create a short written explanation of position and direction, then compare it with planning a route. Identify one question for an instructor.",
  "quiz": [
   {
    "id": "navigation-0",
    "question": "What is ground track?",
    "options": [
     "Actual path over the ground",
     "Nose direction only",
     "Engine thrust direction"
    ],
    "answer": 0,
    "explanation": "Track is the direction of movement relative to the ground."
   },
   {
    "id": "navigation-1",
    "question": "What can cause heading and track to differ?",
    "options": [
     "Wind drift",
     "Paint colour",
     "Seat adjustment"
    ],
    "answer": 0,
    "explanation": "Wind can move an aircraft sideways relative to its heading."
   },
   {
    "id": "navigation-2",
    "question": "If a fictional route is 120 NM and groundspeed is 60 kt, estimated time is...",
    "options": [
     "Two hours",
     "Thirty minutes",
     "Four hours"
    ],
    "answer": 0,
    "explanation": "At 60 nautical miles per hour, 120 nautical miles requires two hours in this simple example."
   }
  ],
  "reference": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
  "reviewStatus": "SME_REVIEW_REQUIRED"
 },
 {
  "id": "airspace",
  "title": "Airspace, airports and aviation rules",
  "level": "Planning",
  "number": 8,
  "minutes": 22,
  "objectives": [
   "Explain airspace structure using the key concepts presented in this lesson.",
   "Explain aerodromes and surfaces using the key concepts presented in this lesson.",
   "Explain regulatory responsibilities using the key concepts presented in this lesson."
  ],
  "sections": [
   {
    "title": "Airspace structure",
    "body": "States classify and manage airspace with controlled, restricted, prohibited and other designations, depending on their aviation rules. Entry, equipment and communication requirements vary by location and flight type. Learners must use the current rules of the jurisdiction concerned."
   },
   {
    "title": "Aerodromes and surfaces",
    "body": "Runway numbers broadly relate to runway magnetic orientation and may change as magnetic variation evolves. Signs, markings, lighting, taxiways and holding positions communicate specific information. Airfield layouts and procedures must be checked in current publications."
   },
   {
    "title": "Regulatory responsibilities",
    "body": "Pilot licences, medical requirements, aircraft documentation, airworthiness, flight rules and operational approvals are legal responsibilities. ICAO sets international standards and recommended practices; individual states implement requirements through their authorities. This Academy does not grant regulatory approval."
   }
  ],
  "activity": "Create a short written explanation of airspace structure, then compare it with aerodromes and surfaces. Identify one question for an instructor.",
  "quiz": [
   {
    "id": "airspace-0",
    "question": "Who defines binding local operating requirements?",
    "options": [
     "Relevant state aviation authority and applicable law",
     "A fictional flight lab",
     "Any social media account"
    ],
    "answer": 0,
    "explanation": "Operational requirements come from applicable law and authorised authorities."
   },
   {
    "id": "airspace-1",
    "question": "What does a runway designation generally indicate?",
    "options": [
     "Approximate magnetic orientation",
     "Passenger count",
     "Groundspeed"
    ],
    "answer": 0,
    "explanation": "Runway numbers are generally based on magnetic heading rounded to tens of degrees."
   },
   {
    "id": "airspace-2",
    "question": "Can passing an Academy quiz authorise entry to controlled airspace?",
    "options": [
     "No",
     "Yes",
     "Only on mobile phones"
    ],
    "answer": 0,
    "explanation": "Access requirements are set by applicable regulations and real ATC procedures."
   }
  ],
  "reference": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
  "reviewStatus": "SME_REVIEW_REQUIRED"
 },
 {
  "id": "communications",
  "title": "Radiotelephony and ATC awareness",
  "level": "Operations",
  "number": 9,
  "minutes": 26,
  "objectives": [
   "Explain listening and callsigns using the key concepts presented in this lesson.",
   "Explain readback and acknowledgement using the key concepts presented in this lesson.",
   "Explain communication failures using the key concepts presented in this lesson."
  ],
  "sections": [
   {
    "title": "Listening and callsigns",
    "body": "Aviators listen before transmitting and use clear callsigns, standard phrases and phonetic spelling to reduce misunderstanding. Sample conversations are useful only for learning the structure of communications. Frequencies and actual phraseology requirements are jurisdiction-specific."
   },
   {
    "title": "Readback and acknowledgement",
    "body": "Some ATC instructions and clearances require accurate readback; controllers may correct errors. A student should distinguish a readback, a request and a clearance. No voice or chatbot exercise in this Academy provides a real clearance."
   },
   {
    "title": "Communication failures",
    "body": "Loss of radio contact is a serious operational topic requiring airspace-specific and aircraft-specific training. Emergency and urgency communications have defined procedures. Students should learn the concepts but must not depend on fictional scripts for real-world emergency action."
   }
  ],
  "activity": "Create a short written explanation of listening and callsigns, then compare it with readback and acknowledgement. Identify one question for an instructor.",
  "quiz": [
   {
    "id": "communications-0",
    "question": "Why use the aviation spelling alphabet?",
    "options": [
     "Improve clarity of letters",
     "Replace runway markings",
     "Measure visibility"
    ],
    "answer": 0,
    "explanation": "Standardised spelling words reduce ambiguity in radio transmissions."
   },
   {
    "id": "communications-1",
    "question": "Who may issue real ATC clearances?",
    "options": [
     "Authorised air traffic service",
     "Academy course software",
     "Any passenger"
    ],
    "answer": 0,
    "explanation": "Real ATC clearances come from authorised air traffic services."
   },
   {
    "id": "communications-2",
    "question": "What is a readback?",
    "options": [
     "Repeating critical information for verification",
     "Deleting a flight plan",
     "Switching on autopilot"
    ],
    "answer": 0,
    "explanation": "Readback allows ATC and pilots to identify communication errors."
   }
  ],
  "reference": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
  "reviewStatus": "SME_REVIEW_REQUIRED"
 },
 {
  "id": "performance",
  "title": "Weight, balance and performance",
  "level": "Operations",
  "number": 10,
  "minutes": 18,
  "objectives": [
   "Explain mass and centre of gravity using the key concepts presented in this lesson.",
   "Explain takeoff and landing considerations using the key concepts presented in this lesson.",
   "Explain aircraft limitations using the key concepts presented in this lesson."
  ],
  "sections": [
   {
    "title": "Mass and centre of gravity",
    "body": "Aircraft loading affects total mass and centre of gravity. Loads outside approved limits can impair controllability, stability or structure. Calculations must use actual aircraft documents and approved loading data."
   },
   {
    "title": "Takeoff and landing considerations",
    "body": "Required runway distance depends on aircraft performance, mass, wind, runway condition, temperature, altitude and other factors. Higher density altitude generally reduces engine and aerodynamic performance in many aircraft. An educational simulator cannot calculate a safe real-world takeoff distance."
   },
   {
    "title": "Aircraft limitations",
    "body": "Operating limits can include airspeeds, mass, centre of gravity and environmental conditions. Numbers may be different even between similar variants. The current approved manual and qualified pilot are essential for real performance decisions."
   }
  ],
  "activity": "Create a short written explanation of mass and centre of gravity, then compare it with takeoff and landing considerations. Identify one question for an instructor.",
  "quiz": [
   {
    "id": "performance-0",
    "question": "What can a centre-of-gravity position outside limits affect?",
    "options": [
     "Control and stability",
     "Only exterior paint",
     "Only GPS position"
    ],
    "answer": 0,
    "explanation": "Centre-of-gravity limits are central to safe loading and handling."
   },
   {
    "id": "performance-1",
    "question": "Higher density altitude commonly...",
    "options": [
     "Reduces many aircraft performance margins",
     "Improves all takeoff performance",
     "Changes licence validity"
    ],
    "answer": 0,
    "explanation": "High density altitude can decrease engine, propeller and wing performance."
   },
   {
    "id": "performance-2",
    "question": "Where should real takeoff distance be calculated?",
    "options": [
     "Approved aircraft performance data and current conditions",
     "A generic simulator score",
     "An unrelated aircraft chart"
    ],
    "answer": 0,
    "explanation": "Use aircraft-specific approved data and current environmental inputs."
   }
  ],
  "reference": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
  "reviewStatus": "SME_REVIEW_REQUIRED"
 },
 {
  "id": "human",
  "title": "Human factors and decision-making",
  "level": "Operations",
  "number": 11,
  "minutes": 22,
  "objectives": [
   "Explain personal readiness using the key concepts presented in this lesson.",
   "Explain risk management using the key concepts presented in this lesson.",
   "Explain crew cooperation and reporting using the key concepts presented in this lesson."
  ],
  "sections": [
   {
    "title": "Personal readiness",
    "body": "Fatigue, stress, illness, medication and distractions can impair judgement and performance. People may overestimate their abilities, especially in familiar situations. Recognising limitations and seeking qualified support are safety skills."
   },
   {
    "title": "Risk management",
    "body": "Good decisions consider weather, aircraft condition, personal readiness, external pressures and available alternatives. A checklist or risk assessment helps structure thinking but cannot remove uncertainty. Choosing to delay or cancel can be the safer outcome."
   },
   {
    "title": "Crew cooperation and reporting",
    "body": "Clear communication, workload sharing and error reporting help teams catch mistakes early. Students should practise speaking up and asking for clarification when a situation is confusing. A useful safety culture values learning rather than hiding hazards."
   }
  ],
  "activity": "Create a short written explanation of personal readiness, then compare it with risk management. Identify one question for an instructor.",
  "quiz": [
   {
    "id": "human-0",
    "question": "Which factor can reduce situational awareness?",
    "options": [
     "Fatigue",
     "A correctly labelled diagram",
     "A full briefing"
    ],
    "answer": 0,
    "explanation": "Fatigue can impair vigilance, judgement and decision-making."
   },
   {
    "id": "human-1",
    "question": "What is a useful response to strong pressure to fly in doubtful conditions?",
    "options": [
     "Reassess hazards and consider delaying",
     "Ignore the hazards",
     "Rely only on simulator scores"
    ],
    "answer": 0,
    "explanation": "External pressure must not override sound risk management."
   },
   {
    "id": "human-2",
    "question": "What does a positive safety culture encourage?",
    "options": [
     "Reporting hazards and learning",
     "Concealing errors",
     "Avoiding questions"
    ],
    "answer": 0,
    "explanation": "Early communication and learning help mitigate risk."
   }
  ],
  "reference": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
  "reviewStatus": "SME_REVIEW_REQUIRED"
 },
 {
  "id": "rotorcraft",
  "title": "Helicopter fundamentals and R44 familiarisation",
  "level": "Specialist pathways",
  "number": 12,
  "minutes": 26,
  "objectives": [
   "Explain rotor lift and controls using the key concepts presented in this lesson.",
   "Explain hovering and transition using the key concepts presented in this lesson.",
   "Explain type-specific safety using the key concepts presented in this lesson."
  ],
  "sections": [
   {
    "title": "Rotor lift and controls",
    "body": "A helicopter's main rotor provides aerodynamic lift and control forces. Collective changes overall blade pitch, cyclic varies blade pitch through the rotation, and anti-torque controls address yaw in many single-main-rotor helicopters. Control responses differ from aeroplane inputs."
   },
   {
    "title": "Hovering and transition",
    "body": "Hovering requires continuous coordinated corrections and attention to available power and wind. Translational flight changes rotor airflow and handling. This text explains principles but gives no pilot technique, power limits or procedure for an R44."
   },
   {
    "title": "Type-specific safety",
    "body": "Rotor speed limits, engine limits, weight and balance, autorotation, tail rotor considerations and emergency procedures demand approved rotorcraft instruction. A generic training animation cannot establish safe handling or substitute for a Robinson-approved flight manual."
   }
  ],
  "activity": "Create a short written explanation of rotor lift and controls, then compare it with hovering and transition. Identify one question for an instructor.",
  "quiz": [
   {
    "id": "rotorcraft-0",
    "question": "What does helicopter collective normally change?",
    "options": [
     "Overall main rotor blade pitch",
     "The heading bug",
     "Only the cabin temperature"
    ],
    "answer": 0,
    "explanation": "Collective changes main rotor blade pitch collectively."
   },
   {
    "id": "rotorcraft-1",
    "question": "What does cyclic normally influence?",
    "options": [
     "Rotor disc tilt and aircraft movement",
     "Fuel colour",
     "Cabin door lock"
    ],
    "answer": 0,
    "explanation": "Cyclic input changes blade pitch cyclically to control rotor forces and orientation."
   },
   {
    "id": "rotorcraft-2",
    "question": "Is a generic R44 simulator enough for real helicopter flight qualification?",
    "options": [
     "No, type-appropriate supervised instruction is needed",
     "Yes, after three quizzes",
     "Yes, if the screen is photorealistic"
    ],
    "answer": 0,
    "explanation": "Practical rotorcraft instruction and applicable approval remain necessary."
   }
  ],
  "reference": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
  "reviewStatus": "SME_REVIEW_REQUIRED"
 }
]);
const routes=Object.freeze({scouts:["orientation","aircraft","aerodynamics","instruments","meteorology","communications","human","rotorcraft","systems","navigation","airspace","performance"],pilots:["orientation","aircraft","aerodynamics","systems","instruments","meteorology","navigation","airspace","communications","performance","human","rotorcraft"]});
function validate(){
 if(modules.length!==12||new Set(modules.map(x=>x.id)).size!==12)throw Error("Expected twelve distinct course modules");
 for(const m of modules){if(m.reviewStatus!=="SME_REVIEW_REQUIRED"||m.sections.length!==3||m.quiz.length!==3||m.objectives.length!==3)throw Error("Incomplete module "+m.id);
  for(const q of m.quiz)if(q.options.length!==3||new Set(q.options).size!==3||!Number.isInteger(q.answer)||q.answer<0||q.answer>2||q.explanation.length<30)throw Error("Bad question "+q.id);
 }
 for(const route of Object.values(routes))if(route.length!==12||new Set(route).size!==12||route.some(id=>!modules.some(m=>m.id===id)))throw Error("Incomplete learner route");
 return {modules:12,lessons:36,questions:36,revision:REVISION};
}
function grade(id,answers){const m=modules.find(m=>m.id===id);if(!m)throw Error("Unknown module");if(!Array.isArray(answers)||answers.length!==3||answers.some(n=>!Number.isInteger(n)||n<0||n>2))throw Error("Answer all three questions");let correct=0;const feedback=m.quiz.map((q,i)=>{let pass=q.answer===answers[i];if(pass)correct++;return {question:q.question,selected:answers[i],correct:q.answer,pass,explanation:q.explanation};});return {id,correct,total:3,metTarget:correct>=2,feedback,revision:REVISION};}
function clean(raw){const list=Array.isArray(raw)?raw:[];const ids=new Set(modules.map(m=>m.id));return list.filter(x=>x&&ids.has(x.id)&&x.revision===REVISION&&Number.isInteger(x.correct)&&x.correct>=0&&x.correct<=3&&Number.isSafeInteger(x.at)&&x.at>0).slice(-60).map(x=>({id:x.id,correct:x.correct,revision:REVISION,at:x.at}));}
const api=Object.freeze({REVISION,modules,routes,validate,grade,clean});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSACompleteCoursebook=api;
})(typeof window!=="undefined"?window:null);
