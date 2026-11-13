/* Aviation Academy technical visuals: eight original detailed explanatory SVG plates.
 * Not installation drawings, approved maintenance procedures, or scene instructions.
 */
(function(root){"use strict";
const C={navy:"#0b2942",blue:"#176fa3",teal:"#118b8d",gold:"#c89546",red:"#b4514f",text:"#18364d",muted:"#4c6172",pale:"#eaf5f9",mint:"#e9f7f4",cream:"#fff4e5",white:"#ffffff",grid:"#d5e7ef"};
const e=x=>String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const T=(x,y,v,size=20,c=C.text,weight=650,anchor="middle")=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" font-family="Arial,system-ui,sans-serif" font-size="'+size+'" font-weight="'+weight+'" fill="'+c+'">'+e(v)+'</text>';
const L=(x1,y1,x2,y2,c=C.blue,w=4,dash="")=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round" '+(dash?'stroke-dasharray="'+dash+'"':'')+'/>';
const R=(x,y,w,h,fill=C.white,stroke=C.grid,rad=16)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+rad+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2"/>';
const P=(pts,fill,stroke=C.blue)=>'<polygon points="'+pts+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2" stroke-linejoin="round"/>';
const A=(x1,y1,x2,y2,col=C.teal,w=5)=>{let a=Math.atan2(y2-y1,x2-x1),r=14,c=col;return L(x1,y1,x2,y2,c,w)+P(x2+","+y2+" "+(x2-r*Math.cos(a-.5)).toFixed(1)+","+(y2-r*Math.sin(a-.5)).toFixed(1)+" "+(x2-r*Math.cos(a+.5)).toFixed(1)+","+(y2-r*Math.sin(a+.5)).toFixed(1),c,c)};
const Node=(x,y,w,h,head,sub,fill=C.pale)=>{
 let s=R(x,y,w,h,fill,C.grid,14)+T(x+w/2,y+35,head,20,C.navy,780);
 if(sub)s+=T(x+w/2,y+64,sub,15,C.muted,470);
 return s;
};
const Mark=(x,y,n,col=C.blue)=>'<circle cx="'+x+'" cy="'+y+'" r="20" fill="'+col+'"/>'+T(x,y+7,n,19,C.white,800);
const footer=msg=>R(31,550,1038,70,C.navy,C.navy,12)+T(550,593,msg,17,C.white,640);
function plate(title,sub,body,foot){
 const lines=Array.from({length:20},(_,i)=>L(40+i*52,112,40+i*52,535,C.grid,.7)+"").join("");
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 650" role="img">'+
  '<title>'+e(title)+'</title><desc>'+e(sub)+'</desc>'+
  '<rect width="1100" height="650" fill="#f9fcfd"/>'+
  R(13,13,1074,624,C.white,C.grid,18)+
  R(13,13,1074,95,C.navy,C.navy,17)+
  T(47,59,title,29,C.white,800,"start")+T(48,84,sub,15,"#d5e6f0",450,"start")+
  '<g opacity=".22">'+lines+'</g>'+body+footer(foot)+
  '</svg>';
}
function circuit(){
 let s=Node(45,210,195,126,"24 V DC","Training source",C.pale);
 s+=L(240,272,330,272,C.red,5)+L(330,272,365,272,C.red,5);
 s+=R(291,249,53,46,C.cream,C.gold,6)+T(318,278,"CB",18,C.navy,800);
 s+=L(365,272,405,272,C.red,5)+Node(405,210,210,126,"POWER BUS","Protected supply",C.cream);
 s+=A(619,271,673,271,C.red,4)+Node(678,210,170,126,"LOAD","Display unit",C.mint);
 s+=L(848,272,945,272,C.blue,5)+L(945,272,945,411,C.blue,5);
 s+=L(945,411,143,411,C.blue,5)+L(143,411,143,341,C.blue,5);
 s+=T(549,397,"RETURN PATH",17,C.blue,800);
 s+=Mark(318,194,"1",C.gold)+T(318,171,"Protected feeder",17,C.text,700);
 s+=Mark(507,188,"2",C.blue)+T(507,159,"Distribution",17,C.text,700);
 s+=Mark(760,186,"3",C.teal)+T(760,157,"Function / load",17,C.text,700);
 return plate("DC ELECTRICAL CIRCUIT — FUNCTIONAL PATH","Classroom block circuit · component ratings and protection vary by airframe",s,
  "Power → protection → bus → load → return; never bypass protection.");
}
function fault(){
 let s=Node(37,184,220,115,"SYMPTOM","Display is dark",C.cream);
 s+=A(267,241,327,241,C.gold)+Node(337,163,222,150,"EVIDENCE","Not proof of cause",C.pale);
 s+=A(568,236,625,236,C.blue);
 s+=Node(636,156,210,144,"POSSIBILITIES","Separate hypotheses",C.mint);
 s+=R(852,145,201,207,C.white,C.grid,12);
 s+=T(950,184,"Power or switching",16,C.text,760);s+=L(862,196,1041,196,C.grid,2);
 s+=T(950,233,"Data path or sensor",16,C.text,760);s+=L(862,249,1041,249,C.grid,2);
 s+=T(950,284,"Display hardware",16,C.text,760);
 s+=R(204,391,692,99,C.pale,C.blue,10);
 s+=T(550,429,"TECHNICAL REASONING",21,C.navy,780)+
    T(550,461,"Compare independent indications, documented status and approved data.",18,C.muted,450);
 s+=A(744,304,744,390,C.gold);
 return plate("FAULT PATH — A SYMPTOM IS NOT A DIAGNOSIS","Multiple underlying conditions may produce the same visible display symptom",s,
  "Training diagrams are not permission to test or disconnect aircraft systems.");
}
function avionics(){
 let s=Node(41,236,179,122,"SENSOR","Physical quantity",C.pale);
 s+=A(227,294,280,294,C.blue);
 s+=Node(288,236,198,122,"AIR / ATT DATA","Interpret + validate",C.pale);
 s+=A(493,294,544,294,C.blue);
 s+=Node(551,236,184,122,"DATA LINK","Digital transfer",C.cream);
 s+=A(742,294,793,294,C.teal);
 s+=Node(800,236,238,122,"PFD / MFD","Pilot presentation",C.mint);
 s+=P("88,212 146,180 204,212",C.pale,C.blue)+
   T(143,164,"Pressure / angle",15,C.muted,550);
 s+=R(810,151,218,56,C.navy,C.navy,9)+T(919,185,"ATT  •  ALT  •  IAS",17,C.white,700);
 s+=R(242,412,618,75,C.white,C.grid,10)+
   T(551,442,"Each layer can fail, disagree or report invalid data.",18,C.navy,750)+
   T(551,469,"One display may integrate several independent data sources.",16,C.muted,450);
 return plate("FROM PHYSICAL SENSOR TO ELECTRONIC FLIGHT DISPLAY","Functional chain: sense → validate → transmit → present",s,
  "A glass panel is the final presentation layer, not the source of every value.");
}
function crosscheck(){
 let s=Node(61,182,219,104,"SOURCE A","Air-data channel",C.pale);
 s+=Node(61,355,219,104,"SOURCE B","Independent standby",C.mint);
 s+=A(288,232,394,289,C.blue)+A(288,404,394,326,C.teal);
 s+=Node(403,246,271,121,"COMPARE","Status + plausibility",C.cream);
 s+=A(687,305,752,305,C.gold);
 s+=R(758,181,258,247,C.navy,C.navy,17);
 s+=T(887,218,"DISPLAY STATUS",21,C.white,750);
 s+=T(887,277,"AIRSPEED  102",19,"#8be5e1",750);
 s+=L(785,290,989,290,"#567a8f",2);
 s+=T(887,333,"STANDBY    96",19,"#f5c981",750);
 s+=T(887,387,"DISAGREEMENT",20,"#f7b9af",820);
 s+=T(540,458,"Training conclusion: disagreement requires investigation, not blind preference.",17,C.muted,570);
 return plate("SOURCE COMPARISON — VALIDITY MATTERS","Conceptual redundancy and differing indications, not a specific aircraft procedure",s,
  "Display size does not establish which input is correct.");
}
function mandate(){
 let s=Node(47,184,224,124,"OCCURRENCE","Facts to establish",C.pale);
 s+=A(278,241,347,241,C.blue);
 s+=Node(355,184,263,124,"INDEPENDENT AIA","Authority + mandate",C.mint);
 s+=A(626,241,697,241,C.teal);
 s+=Node(706,184,333,124,"SAFETY IMPROVEMENT","Contributing factors",C.cream);
 s+=R(89,366,922,107,C.white,C.grid,11);
 s+=T(550,409,"INVESTIGATE WHAT HAPPENED AND WHY",24,C.navy,800);
 s+=T(550,445,"Not a proceeding to apportion blame or liability",20,C.red,720);
 return plate("ANNEX 13 — THE SAFETY INVESTIGATION MANDATE","Independent investigation is focused on preventing future occurrences",s,
  "An Academy course cannot appoint or authorise a State investigator.");
}
function reason(){
 let s=Node(44,174,218,109,"OBSERVATIONS","Source and time",C.pale);
 s+=Node(44,343,218,109,"STATEMENTS","Claims + context",C.cream);
 s+=A(270,224,354,277,C.blue)+A(270,397,354,314,C.gold);
 s+=Node(363,244,235,118,"TEST HYPOTHESES","Corroborate limits",C.mint);
 s+=A(607,301,669,301,C.teal);
 s+=Node(677,244,352,118,"ANALYSIS","Findings + uncertainty",C.pale);
 s+=R(310,400,479,83,C.cream,C.gold,12)+
    T(549,432,"UNCERTAINTY IS DOCUMENTED",20,C.navy,750)+
    T(549,460,"New evidence may change a preliminary interpretation.",16,C.muted,550);
 return plate("FACTS, STATEMENTS AND ANALYTICAL JUDGEMENTS","A source claim must not be converted into a confirmed cause without evaluation",s,
  "Do not force early agreement between conflicting accounts.");
}
function scene(){
 let s=R(51,147,648,326,"#e3e9e6","#91b0b5",14);
 for(let i=1;i<7;i++)s+=L(51+i*93,149,51+i*93,473,"#b7cbd0",1,"5 7");
 for(let i=1;i<4;i++)s+=L(52,147+i*82,697,147+i*82,"#b7cbd0",1,"5 7");
 s+=T(82,177,"N ↑",22,C.navy,800);
 s+=P("266,234 419,251 506,306 333,329","#c8dbe2",C.blue)+
    T(391,289,"FICTIONAL AREA",18,C.navy,780);
 s+=Mark(223,268,"A",C.gold)+Mark(541,379,"B",C.gold)+Mark(416,419,"C",C.gold);
 s+=Node(733,151,308,112,"SCENE AUTHORITY","Controlled access",C.cream)+
    Node(733,289,308,112,"DOCUMENTATION","Photos + grid + notes",C.pale);
 s+=T(882,465,"A, B, C are synthetic training items.",16,C.muted,650);
 return plate("SYNTHETIC EVIDENCE-SITE MAP","Illustrative grid for a classroom case; NOT an actual incident scene",s,
  "Site hazards and authorised scene control take priority over documentation.");
}
function custody(){
 let s=Node(41,221,192,114,"E-07","Original item",C.pale);
 s+=A(241,276,294,276,C.blue)+
    Node(303,221,212,114,"RECORDED","ID + context + time",C.pale);
 s+=A(521,276,580,276,C.blue)+
    Node(588,221,212,114,"TRANSFER","From → to / when",C.cream);
 s+=A(808,276,855,276,C.teal)+
    Node(862,221,191,114,"STORED","Integrity + access",C.mint);
 s+=R(105,402,889,74,C.cream,C.gold,10)+
    T(549,430,"MISSING TRANSFER TIME = RECORD LIMITATION",20,C.navy,750)+
    T(549,457,"Report the gap; never invent a timestamp to close it.",17,C.red,700);
 return plate("CHAIN OF CUSTODY — DOCUMENT THE ITEM HISTORY","Who controlled which evidence, when it moved and why",s,
  "A file hash checks bytes, not the truth or original provenance of a photograph.");
}
const generators=Object.freeze({
 "dc-circuit":circuit,"fault-path":fault,"avionics-chain":avionics,
 "sensor-crosscheck":crosscheck,"investigation-mandate":mandate,
 "evidence-reasoning":reason,"scene-map":scene,"custody-log":custody
});
function get(id){
 const f=generators[id];return f?Object.freeze({id,svg:f(),alt:{
  "dc-circuit":"A detailed conceptual DC circuit shows a 24-volt supply, circuit protection, protected power bus, display load and return conductor.",
  "fault-path":"Three-step reasoning diagram separates a dark display symptom from evidence and multiple possible power, data or equipment causes.",
  "avionics-chain":"Technical flow diagram shows sensor, air-data processing, digital data link and flight display with arrows for information transfer.",
  "sensor-crosscheck":"Two independent sensing channels feed a comparator and a dark flight display shows fictional unequal airspeed indications.",
  "investigation-mandate":"Process flow from an occurrence through an independent investigation authority to safety improvements, explicitly separate from blame.",
  "evidence-reasoning":"Observations and statements feed hypothesis testing, which leads to qualified findings while preserving uncertainty.",
  "scene-map":"Fictional incident site grid with north arrow and labelled A, B, C synthetic evidence points, alongside scene authority and documentation.",
  "custody-log":"Flowchart of synthetic evidence item E-07 from identification through recording, transfer and protected storage; warns against inventing missing times."
 }[id]}):null;
}
function validate(){
 const keys=Object.keys(generators);if(keys.length!==8)throw Error("Eight technical illustrations are required");
 for(const key of keys){
  const x=get(key);
  if(!x?.svg.includes('<svg ')||!x.svg.includes('</svg>')||
   !x.svg.includes('<title>')||!x.svg.includes('<desc>')||x.alt.length<100||
   x.svg.includes("<script")||x.svg.length<1500)throw Error("Incomplete technical plate "+key);
 }
 return {figures:8,format:"original self-contained SVG"};
}
const api=Object.freeze({get,validate,ids:Object.freeze(Object.keys(generators))});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSASpecialistTechnicalPlates=api;
})(typeof window!=="undefined"?window:null);
