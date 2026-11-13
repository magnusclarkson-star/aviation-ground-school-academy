/* Original advanced Academy module content B2; SME review required. */
(function(root){"use strict";const units=[
 {
  "id": "performance",
  "focus": {
   "scouts": "Explore how adjusting fictional load and temperature changes a safety margin, without using operational data.",
   "pilots": "Understand approved performance-chart inputs and centre-of-gravity limitations."
  },
  "glossary": [
   [
    "Centre of gravity",
    "Effective location of the total mass."
   ],
   [
    "Moment",
    "Product of a force or weight and its distance from a chosen datum."
   ],
   [
    "Performance margin",
    "Difference between required and available capability."
   ]
  ],
  "lessons": [
   {
    "title": "Weight, balance and moments",
    "concept": "Aircraft mass and mass distribution affect stability, controllability and structural loads. A simple weight-and-balance model uses the product of weight and arm as a moment. The sum of moments divided by total weight gives a calculated centre-of-gravity arm. A real decision requires the aircraft's current documented empty weight, load data and permitted envelope.",
    "example": "In a fictional model, a 20 kg block is placed 1 metre from the datum and a 10 kg block 2 metres away. Their total moment is 40 kg·m and total mass 30 kg, giving an average arm of about 1.33 metres. This arithmetic does not authorise aircraft loading.",
    "task": "Compute moments for two model blocks. Then explain why the correct arithmetic is not enough without approved limits."
   },
   {
    "title": "Runway performance and environmental variables",
    "concept": "Takeoff and landing distances are affected by mass, density altitude, runway gradient, wind, surface condition and aircraft configuration. Performance charts apply only under their stated assumptions. Some published figures are based on standard technique and controlled conditions; the actual operation must meet applicable requirements and safety margins.",
    "example": "Two fictional runways have identical lengths but different surface conditions and winds. Identical runway length does not imply identical available performance margin.",
    "task": "Write a list of chart inputs that must be known before calculating aircraft-specific takeoff or landing performance."
   },
   {
    "title": "Uncertainty, margins and alternatives",
    "concept": "A sound performance review includes uncertainty, reserves and alternatives. High temperature and elevation may reduce some engine and aerodynamic performance capabilities. Gaps in weather, runway status or loading data make the answer indeterminate, regardless of simulator confidence. Safe decisions require the applicable aircraft manual and qualified oversight.",
    "example": "A classroom question gives a runway length but no aircraft mass, wind or slope. Learners should explain why no safe conclusion follows rather than inventing a plausible takeoff speed.",
    "task": "Identify three missing inputs in a fictional runway scenario and propose where authoritative data would be obtained."
   }
  ],
  "scenario": {
   "title": "Weight within limits, centre of gravity outside",
   "situation": "A fictional aircraft's total weight meets a stated maximum, but its centre of gravity falls outside the model's permitted envelope. What is the key conclusion?",
   "options": [
    "Total mass is enough",
    "The loading arrangement must also meet centre-of-gravity limits",
    "Only outside temperature matters"
   ],
   "answer": 1,
   "why": "Total weight and mass distribution are separate constraints."
  },
  "questions": [
   [
    "Moment divided by total weight gives...",
    [
     "A calculated centre-of-gravity arm",
     "A radio frequency",
     "An engine compression ratio"
    ],
    0,
    "The average arm relative to a specified datum follows moment divided by weight."
   ],
   [
    "Valid aircraft performance estimates require...",
    [
     "An unrelated simulator score",
     "Applicable approved performance information and current conditions",
     "An obsolete photo"
    ],
    1,
    "Aircraft-specific documents and actual conditions determine relevant performance."
   ],
   [
    "What typically increases density altitude?",
    [
     "High temperature",
     "Cabin light intensity",
     "Runway sign colour"
    ],
    0,
    "Higher temperature generally raises density altitude at a given pressure altitude."
   ]
  ]
 },
 {
  "id": "human",
  "focus": {
   "scouts": "Role-play how a group member can raise a concern about weather or unsafe pressure respectfully.",
   "pilots": "Identify plan-continuation bias, changing risk and degradation of situational awareness."
  },
  "glossary": [
   [
    "Situational awareness",
    "Awareness of current conditions and likely developments."
   ],
   [
    "Confirmation bias",
    "Giving undue weight to evidence supporting an existing belief."
   ],
   [
    "External pressure",
    "Pressure from schedules, expectations and other outside demands."
   ]
  ],
  "lessons": [
   {
    "title": "Personal readiness and workload",
    "concept": "Fatigue, illness, stress, medication and distraction can impair attention, judgement and decision-making. A person can perform a simple routine task yet struggle with the same task under high workload or uncertainty. Good safety culture makes it acceptable to recognise limitations and seek guidance rather than maintain an appearance of confidence.",
    "example": "A tired learner may still complete a short quiz quickly, yet overlook several small changes in a complicated scenario. A good result does not prove readiness for a demanding real-world activity.",
    "task": "Make a fictional readiness reflection with sleep, focus, stress and uncertainty as topics; keep private medical details out of any public app."
   },
   {
    "title": "Bias, pressure and decision traps",
    "concept": "Confirmation bias encourages people to seek data that supports the decision they already want to make. Plan-continuation bias makes changing a schedule feel like failure. Structured risk reviews encourage students to ask what evidence would change their decision, which alternatives exist and whether new facts invalidate initial assumptions.",
    "example": "A group wants to proceed with an outdoor demonstration while visibility decreases. Someone cites only the earlier good forecast. The group should evaluate newer information and consider a safer alternative.",
    "task": "Write two respectful questions that challenge a plan when conditions are changing."
   },
   {
    "title": "Teamwork, leadership and speaking up",
    "concept": "Crew and team resource management involves roles, monitoring, clear communication and timely reporting. Effective collaboration does not mean every person has the same authority; it means potentially important observations reach those responsible for decisions. Separating facts from guesses makes reports easier to use.",
    "example": "A junior member notices an out-of-date chart at an aviation briefing. Instead of staying silent, they can identify the date, say why it matters and ask the responsible person to verify the source.",
    "task": "Practise a three-part communication: observation, concern and specific request for verification."
   }
  ],
  "scenario": {
   "title": "Schedule pressure and deteriorating conditions",
   "situation": "Guests have arrived for an aviation demonstration but conditions have deteriorated. Which decision reflects good risk management?",
   "options": [
    "Ignore the change because guests are waiting",
    "Reassess hazards and postpone or modify if necessary",
    "Treat punctuality as proof of safety"
   ],
   "answer": 1,
   "why": "External pressure should not override reassessment when the risk picture changes."
  },
  "questions": [
   [
    "Confirmation bias is...",
    [
     "Seeking disconfirming evidence",
     "Favouring information that supports a prior view",
     "Reading a chart twice"
    ],
    1,
    "Confirmation bias can lead to selective interpretation."
   ],
   [
    "Which can impair vigilance?",
    [
     "Fatigue",
     "Well-defined roles",
     "Clear briefings"
    ],
    0,
    "Fatigue can reduce attention and judgement."
   ],
   [
    "A healthy safety culture supports...",
    [
     "Concealing hazards",
     "Silence from junior learners",
     "Speaking up about specific safety concerns"
    ],
    2,
    "Early warning and factual communication help manage risk."
   ]
  ]
 },
 {
  "id": "rotorcraft",
  "focus": {
   "scouts": "Use a rotor diagram to identify lift, torque and tail-rotor function without trying to operate a real helicopter.",
   "pilots": "Compare helicopter controls, rotor-energy concepts and aircraft-specific limitations."
  },
  "glossary": [
   [
    "Collective",
    "Control that changes main-rotor blade pitch collectively."
   ],
   [
    "Cyclic",
    "Control that varies blade pitch with rotor azimuth."
   ],
   [
    "Autorotation",
    "Rotor-driven flight regime maintained by airflow through the rotor rather than engine torque."
   ]
  ],
  "lessons": [
   {
    "title": "Main rotor forces and anti-torque",
    "concept": "A helicopter rotor develops lift through rotating airfoils. In a common single-main-rotor arrangement, turning the rotor creates reaction torque that requires an anti-torque system such as a tail rotor. Helicopters with coaxial or tandem rotors handle torque differently. A single rotorcraft diagram cannot represent the details of every design.",
    "example": "A drawing with a main rotor and tail rotor shows opposing moments. It illustrates principles but does not establish an actual helicopter's tail-rotor direction, control limit or correct pedal movement.",
    "task": "Label the main rotor, tail rotor and torque reaction on a fictional helicopter diagram."
   },
   {
    "title": "Cyclic, collective and helicopter flight regimes",
    "concept": "Collective changes the main rotor blades' overall pitch setting. Cyclic varies pitch through each rotor revolution, changing the rotor-force distribution. Hovering and forward flight involve different airflow characteristics, torque and power demands. Real helicopter coordination is specialised and must be practised with a qualified instructor.",
    "example": "Increasing a fictional simulator's collective may show additional lift, but a real helicopter also changes induced flow, torque and power demand. A lone slider cannot capture those coupled effects.",
    "task": "Create a concept map linking three primary helicopter controls with lift, rotor attitude and yaw. Mark each unvalidated simulator simplification."
   },
   {
    "title": "Rotor energy and emergency-training boundaries",
    "concept": "Rotor speed and energy, engine power, structural loads and environmental conditions are critical in rotorcraft. Autorotation is an aerodynamic flight regime sustained by airflow through the rotor, not a generic scripted escape sequence. Approved emergency procedures depend on type and condition and require supervised practical instruction.",
    "example": "A classroom scenario imagines an engine power loss. The correct conceptual study focus is why rotor-energy management and approved procedures matter; this Academy must not substitute a universal manoeuvre sequence.",
    "task": "Name three reasons an R44 student needs type-specific approved training rather than a Cessna checklist or generic flight simulation."
   }
  ],
  "scenario": {
   "title": "The misleading yoke-cyclic analogy",
   "situation": "A student assumes the R44 cyclic behaves exactly like a Cessna yoke, so the same procedures apply. Which reply is accurate?",
   "options": [
    "The analogy is sufficient for real flight",
    "Rotor dynamics and controls differ; obtain helicopter-specific instruction",
    "The R44 has no aircraft-specific limits"
   ],
   "answer": 1,
   "why": "Rotorcraft controls, performance and emergencies require specialist training."
  },
  "questions": [
   [
    "Collective chiefly changes...",
    [
     "Overall main-rotor blade pitch",
     "Runway designator",
     "Navigation database"
    ],
    0,
    "Collective changes rotor blade pitch collectively."
   ],
   [
    "A conventional tail rotor helps...",
    [
     "Charge the starter battery",
     "Counter main-rotor torque and control yaw",
     "Generate all main rotor lift"
    ],
    1,
    "A tail rotor provides anti-torque and yaw control in many conventional helicopters."
   ],
   [
    "Autorotation involves...",
    [
     "A licence endorsement",
     "A radio frequency",
     "Rotor energy sustained by airflow rather than engine drive"
    ],
    2,
    "Airflow through the rotor supplies the energy needed for autorotation."
   ]
  ]
 }
];if(typeof module!=="undefined"&&module.exports)module.exports=units;if(root)root.AGSADepthPartB2=units;})(typeof window!=="undefined"?window:null);
