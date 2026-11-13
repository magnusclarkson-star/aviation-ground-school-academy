/* Original, editable SVG lecture diagrams. All drawings are schematic, not aircraft-specific operating guidance. */
(function(root){"use strict";
const P=Object.freeze({ink:"#16334c",blue:"#156b9a",teal:"#087f81",amber:"#bd762a",red:"#b84d47",sky:"#edf7fc",paper:"#f9fcff",line:"#8ba9bd",muted:"#425f71",white:"#ffffff"});
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const tx=(x,y,value,size=19,colour=P.ink,weight=650,anchor="start")=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" font-family="system-ui,Arial,sans-serif" font-size="'+size+'" font-weight="'+weight+'" fill="'+colour+'">'+esc(value)+'</text>';
const rect=(x,y,w,h,fill=P.white,stroke=P.line,round=15)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+round+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2"/>';
const circle=(x,y,r,fill=P.white,stroke=P.line,width=3)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'"/>';
const ellipse=(x,y,rx,ry,fill=P.white,stroke=P.line)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2"/>';
const line=(x1,y1,x2,y2,c=P.ink,w=3,dash="")=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';
const poly=(points,fill,stroke=P.ink,width=3)=>'<polygon points="'+points+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="round"/>';
const arrow=(x1,y1,x2,y2,c=P.blue,w=5)=>{
 const a=Math.atan2(y2-y1,x2-x1),k=13;
 const p1=(x2-k*Math.cos(a-.5)).toFixed(1)+","+(y2-k*Math.sin(a-.5)).toFixed(1);
 const p2=(x2-k*Math.cos(a+.5)).toFixed(1)+","+(y2-k*Math.sin(a+.5)).toFixed(1);
 return line(x1,y1,x2,y2,c,w)+poly(x2+","+y2+" "+p1+" "+p2,c,c,1);
};
const box=(x,y,w,h,title,subtitle,colour=P.sky)=>{
 let s=rect(x,y,w,h,colour,P.line,14)+tx(x+w/2,y+34,title,20,P.ink,750,"middle");
 if(subtitle)s+=tx(x+w/2,y+65,subtitle,15,P.muted,450,"middle");
 return s;
};
const pill=(x,y,w,s,colour=P.sky)=>rect(x,y-25,w,36,colour,"#a7c0cf",18)+tx(x+w/2,y,s,15,P.ink,650,"middle");
function sheet(title,subtitle,drawing){
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 440" width="840" height="440">'+
  '<title>'+esc(title)+'</title><desc>'+esc(subtitle)+'</desc>'+
  '<rect width="840" height="440" fill="'+P.paper+'"/>'+
  rect(14,12,812,414,P.white,"#d7e5eb",14)+
  tx(38,55,title,25,P.ink,800)+tx(38,80,subtitle,14,P.muted,450)+
  line(38,99,800,99,"#d6e6ee",2)+drawing+
  '</svg>';
}
const diagrams=Object.freeze({
 orientation:{
  section:0,title:"The aviation learning pathway",
  alt:"Three distinct learning stages: ground theory, simulated practice and supervised flight; hazard reporting improves all three.",
  caption:"Theory develops understanding; a practice simulator supports exploration; real flight training requires qualified supervision. Report and review hazards throughout.",
  build:()=>sheet("From knowledge to supervised practice","Learning steps are not interchangeable",
   box(44,145,224,102,"GROUND THEORY","Concepts and judgement")+
   arrow(279,192,313,192,P.blue)+
   box(323,145,225,102,"SIMULATOR PRACTICE","Conceptual rehearsal",P.sky)+
   arrow(559,192,593,192,P.teal)+
   box(603,145,194,102,"SUPERVISED FLIGHT","Qualified instructor","#e8f7f1")+
   arrow(420,288,420,336,P.amber)+
   pill(237,387,365,"Safety reports → review → improvement","#fff3da")+
   tx(420,423,"Simulator practice does not independently establish flight-training credit.",14,P.muted,450,"middle"))
 },
 aircraft:{
  section:1,title:"Primary aircraft surfaces — top view",
  alt:"Top-down generic aeroplane: wings, fuselage, ailerons on outer trailing wings, flaps inboard, elevators on the horizontal tail and rudder on the fin.",
  caption:"On conventional aeroplanes, ailerons chiefly affect roll, elevators pitch and the rudder yaw. This is a generic diagram, not a Cessna-specific drawing.",
  build:()=>sheet("Major assemblies and control surfaces","Simplified top view · not to scale",
   poly("419,122 433,152 441,320 421,388 401,320 408,152","#e2eef5")+
   poly("401,184 183,246 177,279 406,239", "#b5dcea")+
   poly("440,184 657,246 663,279 434,239","#b5dcea")+
   poly("406,331 319,355 319,375 419,351","#c9dfe9")+
   poly("435,331 521,355 521,375 421,351","#c9dfe9")+
   poly("420,327 406,373 419,403 432,373","#8bbdcd")+
   poly("197,254 247,241 250,266 190,277",P.amber)+
   poly("593,241 644,254 652,277 590,266",P.amber)+
   poly("278,224 347,205 350,239 280,257",P.teal)+
   poly("493,205 563,224 561,257 490,239",P.teal)+
   tx(41,150,"AILERONS",18,P.amber,800)+line(134,154,204,252,P.amber,2)+
   tx(682,151,"FLAPS",18,P.teal,800)+line(679,159,537,230,P.teal,2)+
   tx(47,351,"ELEVATORS",18,P.ink,800)+line(170,351,323,361,P.ink,2)+
   tx(682,355,"RUDDER",18,P.ink,800)+line(677,357,426,382,P.ink,2)+
   tx(422,123,"NOSE",13,P.muted,550,"middle"))
 },
 aerodynamics:{
  section:0,title:"Four forces acting on an aeroplane",
  alt:"Lift arrow upward, weight downward, thrust to the right and drag to the left, arranged around a conceptual aeroplane.",
  caption:"Lift and weight, thrust and drag act in different directions. Whether forces balance depends on flight condition; arrows are conceptual.",
  build:()=>sheet("The four forces of flight","Conceptual directions for simplified steady flight",
   poly("360,225 500,225 525,246 332,246", "#a9d2e3",P.blue,3)+
   poly("415,201 450,201 473,239 392,239", "#d5e9f2",P.ink,2)+
   arrow(424,213,424,131,P.blue,6)+tx(440,140,"LIFT",19,P.blue,800)+
   arrow(424,260,424,346,P.red,6)+tx(440,337,"WEIGHT",19,P.red,800)+
   arrow(543,237,727,237,P.teal,6)+tx(626,219,"THRUST",19,P.teal,800,"middle")+
   arrow(320,237,114,237,P.amber,6)+tx(215,219,"DRAG",19,P.amber,800,"middle")+
   pill(263,396,319,"Direction shown is schematic",P.sky))
 },
 systems:{
  section:1,title:"How fuel and electrical systems connect",
  alt:"Conceptual fuel flow from tank via control valve to engine, and electrical supply from alternator and battery via bus to avionics.",
  caption:"Fuel supply and electrical power serve different aircraft needs. The drawing is a learning block diagram, not an aircraft wiring or fuel schematic.",
  build:()=>sheet("Aircraft fuel and electrical systems","Illustrative functional relationships; actual aircraft designs differ",
   tx(69,135,"FUEL PATH",17,P.amber,800)+
   box(42,156,174,79,"FUEL TANK","Stored energy","#fff3df")+
   arrow(229,199,262,199,P.amber)+
   box(272,156,144,79,"VALVE","Control","#fff3df")+
   arrow(429,199,463,199,P.amber)+
   box(474,156,172,79,"ENGINE","Power","#fff3df")+
   tx(68,278,"ELECTRICAL PATH",17,P.blue,800)+
   box(42,298,170,73,"ALTERNATOR","Generator",P.sky)+
   arrow(224,336,285,336,P.blue)+
   box(294,298,150,73,"BUS","Distribution",P.sky)+
   arrow(458,336,511,336,P.blue)+
   box(521,298,234,73,"INSTRUMENTS + RADIO","Electrical loads",P.sky)+
   box(674,155,122,80,"BATTERY","Backup",P.sky)+
   line(732,237,732,273,P.blue,3)+line(732,273,360,273,P.blue,3)+arrow(360,273,360,295,P.blue,3))
 },
 instruments:{
  section:0,title:"Six basic flight instruments",
  alt:"Conventional six-pack arrangement: top row airspeed, attitude, altimeter; lower row turn coordinator, heading indicator and vertical speed.",
  caption:"These six instrument functions provide different information. Display layouts and sensor systems vary by aircraft and glass-cockpit design.",
  build:()=>{const items=[["ASI","Air speed"],["ATT","Pitch / bank"],["ALT","Altitude"],["TURN","Turn / slip"],["HDG","Heading"],["VSI","Climb / descent"]];
   let d="";items.forEach(([abbr,label],i)=>{const x=190+(i%3)*225,y=190+Math.floor(i/3)*130;
    d+=circle(x,y,49,"#173d5c","#4e89a5",4)+circle(x,y,35,"#294d67","#9bc9da",1)+tx(x,y+6,abbr,21,P.white,800,"middle")+tx(x,y+70,label,16,P.ink,650,"middle");});
   return sheet("The conventional six-pack","Functions to recognise; not calibrated cockpit indications",d);
  }
 },
 meteorology:{
  section:1,title:"Weather hazards and a briefing",
  alt:"Illustrated cloud, wind and precipitation symbols; four weather-briefing elements are wind, visibility, cloud and pressure.",
  caption:"Examine wind, visibility, cloud and hazardous weather together. A classroom sketch cannot replace current official aviation weather information.",
  build:()=>sheet("Build a complete weather picture","One observation is never the whole briefing",
   ellipse(166,207,66,29,P.sky,"#88b7cb")+ellipse(196,190,48,35,P.sky,"#88b7cb")+
   ellipse(135,190,37,29,P.sky,"#88b7cb")+
   arrow(65,162,118,162,P.blue,4)+tx(48,143,"WIND",17,P.blue,750)+
   line(155,243,142,278,P.blue,3)+line(186,243,173,278,P.blue,3)+line(217,243,204,278,P.blue,3)+
   poly("289,221 301,248 273,248",P.amber,P.amber,1)+
   tx(281,283,"Hazards",15,P.amber,750,"middle")+
   box(346,141,192,82,"WIND","Direction + speed",P.sky)+
   box(556,141,232,82,"VISIBILITY","Operational limits",P.sky)+
   box(346,253,192,82,"CLOUD","Base / amount",P.sky)+
   box(556,253,232,82,"PRESSURE","Setting context",P.sky)+
   tx(556,395,"Weather can change faster than a training illustration.",14,P.muted,450,"middle"))
 },
 navigation:{
  section:0,title:"Heading, wind and ground track",
  alt:"Compass rose with north, east, south and west; heading arrow differs from the displaced ground-track arrow due to wind.",
  caption:"Heading is where the aircraft points; track is its movement across the ground. Wind may make the two directions differ. Not a navigation calculation.",
  build:()=>sheet("Heading is not always ground track","North is at the top · simplified wind-drift example",
   circle(281,258,116,"#f1f8fa","#91b8c7",3)+
   line(281,144,281,372,"#c5d5dd",2)+line(165,258,397,258,"#c5d5dd",2)+
   tx(281,131,"N",19,P.ink,800,"middle")+tx(281,403,"S",19,P.ink,800,"middle")+
   tx(146,263,"W",19,P.ink,800,"middle")+tx(416,263,"E",19,P.ink,800,"middle")+
   arrow(281,293,281,176,P.blue,6)+
   arrow(281,293,352,194,P.teal,6)+
   arrow(463,190,520,223,P.amber,5)+
   pill(536,195,245,"Blue: aircraft heading",P.sky)+
   pill(536,252,245,"Teal: ground track","#e6f8f4")+
   pill(536,309,245,"Amber: wind influence","#fff2dc")+
   tx(515,390,"Compare actual weather and chart data before planning.",14,P.muted,450))
 },
 airspace:{
  section:1,title:"Published airspace limits",
  alt:"Layered vertical airspace bands above an aerodrome, bounded by published floors and ceilings rather than assumed generic heights.",
  caption:"Controlled airspace has defined lateral and vertical limits. Check the current State aeronautical information publication and charts.",
  build:()=>sheet("Airspace boundaries are published","Not a depiction of any specific country's airspace classes",
   rect(54,144,538,95,"#d7eaf5",P.blue,0)+
   rect(54,239,538,93,"#e2f8f6",P.teal,0)+
   rect(54,332,538,54,"#f4efd9",P.amber,0)+
   tx(76,194,"UPPER BAND · published ceiling",18,P.ink,700)+
   tx(76,290,"LOWER BAND · published floor",18,P.ink,700)+
   tx(76,363,"SURFACE / AERODROME",18,P.ink,700)+
   line(54,239,595,239,P.blue,2,"9 6")+
   line(54,332,595,332,P.teal,2,"9 6")+
   box(617,163,179,88,"LATERAL LIMITS","Also matter",P.sky)+
   box(617,282,179,88,"VERIFY AIP","Current charts", "#fff4dd"))
 },
 communications:{
  section:1,title:"Aviation radio exchange",
  alt:"A simplified communication cycle: listen, pilot call, ATS reply, readback, confirm and continue monitoring.",
  caption:"Listen first, communicate clearly, read back required items and continue monitoring. Phraseology and readback rules must follow current local procedures.",
  build:()=>sheet("A basic aviation radio exchange","Conceptual sequence; not an ATC script or clearance",
   box(37,172,140,90,"1. LISTEN","Frequency",P.sky)+
   arrow(186,216,212,216,P.blue,4)+
   box(218,172,150,90,"2. PILOT CALL","Identification",P.sky)+
   arrow(379,216,405,216,P.blue,4)+
   box(411,172,150,90,"3. ATS REPLY","Instructions","#e6f7ed")+
   arrow(571,216,598,216,P.teal,4)+
   box(604,172,197,90,"4. READBACK","Confirm as required","#e6f7ed")+
   arrow(691,274,691,325,P.amber,4)+
   pill(510,367,279,"Continue monitoring for changes", "#fff3da")+
   tx(420,410,"Not every ATS exchange follows this exact sequence.",14,P.muted,450,"middle"))
 },
 performance:{
  section:1,title:"Weight, arm and moment",
  alt:"Lever with reference datum, weight loads at different arms and center of gravity; moment equals weight times arm.",
  caption:"A load farther from the datum has a larger moment for the same weight. Use approved aircraft data to calculate limits; this is not a load sheet.",
  build:()=>sheet("Weight and balance: the lever idea","Moment = weight × arm · schematic, not a loading calculation",
   line(155,249,707,249,P.blue,8)+
   poly("422,258 383,335 461,335","#c5d9e3",P.blue,2)+
   arrow(232,156,232,238,P.amber,5)+
   arrow(600,121,600,238,P.red,5)+
   tx(232,140,"WEIGHT A",17,P.amber,750,"middle")+
   tx(600,108,"WEIGHT B",17,P.red,750,"middle")+
   line(154,222,154,281,P.ink,3)+tx(156,305,"DATUM",17,P.ink,800)+
   arrow(422,187,422,228,P.teal,4)+tx(422,177,"CG",18,P.teal,800,"middle")+
   arrow(153,372,230,372,P.amber,3)+tx(190,395,"arm A",15,P.amber,700,"middle")+
   arrow(155,419,598,419,P.red,3)+tx(370,408,"arm B (longer)",15,P.red,700,"middle"))
 },
 human:{
  section:1,title:"Practical safety decision loop",
  alt:"A circular aviation safety loop: observe, identify hazard, assess the risk, take authorised action, monitor outcomes.",
  caption:"Good decisions are checked again after action. Workload, fatigue and incomplete information can affect judgement; seek qualified guidance.",
  build:()=>sheet("A safety decision-making loop","Monitor results; revisit the decision when new information appears",
   box(41,167,145,91,"OBSERVE","Gather facts",P.sky)+
   arrow(196,210,216,210,P.blue)+
   box(224,167,148,91,"IDENTIFY","Spot hazards",P.sky)+
   arrow(382,210,404,210,P.blue)+
   box(411,167,135,91,"ASSESS","Risk / options","#fff1da")+
   arrow(556,210,576,210,P.amber)+
   box(583,167,177,91,"ACT + REVIEW","Within authority","#e8f7ed")+
   line(675,271,675,333,P.teal,3)+arrow(675,333,110,333,P.teal,4)+
   arrow(110,330,110,272,P.teal,4)+
   pill(231,395,390,"Fatigue and stress can change risk perception",P.sky))
 },
 rotorcraft:{
  section:0,title:"Helicopter control forces",
  alt:"Generic helicopter side diagram labeling main rotor lift, cyclic disc tilt, collective lift change, tail rotor yaw control and landing skids.",
  caption:"A helicopter uses rotor lift and controls that differ from conventional aeroplanes. Cyclic, collective and anti-torque inputs require type-appropriate instruction.",
  build:()=>sheet("Helicopter flight-control concepts","Illustrative rotorcraft, not an R44 control schematic",
   line(227,183,584,183,P.ink,6)+line(411,183,411,224,P.ink,6)+
   arrow(411,186,411,128,P.blue,5)+tx(433,143,"MAIN ROTOR LIFT",18,P.blue,800)+
   ellipse(416,284,122,58,"#b7d9e5",P.blue)+
   poly("515,271 700,248 702,278 524,306","#a1cad7",P.blue,2)+
   ellipse(705,263,20,7,P.teal,P.teal)+
   line(331,331,327,353,P.ink,4)+line(499,331,508,353,P.ink,4)+line(290,355,550,355,P.ink,6)+
   tx(45,156,"CYCLIC",19,P.teal,800)+arrow(120,168,290,229,P.teal,3)+
   tx(43,215,"Disc tilt",15,P.muted,450)+
   tx(620,137,"TAIL ROTOR",18,P.amber,800)+arrow(714,150,707,243,P.amber,4)+
   tx(618,176,"Yaw control",15,P.muted,450)+
   pill(75,403,340,"Collective: rotor blade pitch / lift",P.sky))
 }
});
function validate(){
 const expected=["orientation","aircraft","aerodynamics","systems","instruments","meteorology","navigation","airspace","communications","performance","human","rotorcraft"];
 if(Object.keys(diagrams).length!==expected.length||expected.some(id=>!diagrams[id]))throw Error("Each ground-school module needs its own original educational picture");
 for(const [id,item] of Object.entries(diagrams)){
  if(!Number.isInteger(item.section)||item.section<0||item.section>2||item.caption.length<90||item.alt.length<75)throw Error("Incomplete pictorial metadata: "+id);
  const svg=item.build();if(!svg.startsWith("<svg ")||!svg.endsWith("</svg>")||!svg.includes("<title>")||!svg.includes("<desc>")||svg.includes("<script")||svg.includes("http://www.w3.org")===false)throw Error("Invalid pictorial SVG "+id);
 }
 return {modules:12,figures:12,format:"SVG",notes:"Conceptual pictorials; subject-matter review required"};
}
function get(id){const entry=diagrams[id];return entry?{id,title:entry.title,section:entry.section,caption:entry.caption,alt:entry.alt,svg:entry.build()}:null}
const api=Object.freeze({get,validate,modules:Object.freeze(Object.keys(diagrams))});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSACoursebookIllustrations=api;
})(typeof window!=="undefined"?window:null);
