/* Cockpit Studio V3 — original educational analogue and touchscreen instrument interface. */
(function(){
"use strict";
const M=window.CockpitV3Model;
if(!M){document.body.insertAdjacentHTML("afterbegin","<p>Flight model could not load.</p>");return}
const $=id=>document.getElementById(id);
const deg=d=>d*Math.PI/180;
const sin=Math.sin,cos=Math.cos,round=Math.round;
const clamp=M.clamp;
let state=M.makeState(),input=M.makeInput(),mode="analog",pfdPage="pfd";
let focus=0,paused=false,previous=0,lastDraw=0,presetUntil=0,trail=[],controlStyle="yoke";
let mission=null,lastMissionPhase=null,skillsSession=null;
const instruments=[
 ["asi","Airspeed indicator","The indicated airspeed needle uses a numbered dial with colored reference arcs. Airspeed changes with throttle, pitch and flaps. The arcs are conceptual and MUST be checked against a real aircraft's approved operating handbook."],
 ["att","Attitude indicator","The miniature aircraft is fixed. Blue represents sky, brown represents ground, and the moving horizon shows pitch and bank. Pulling the yoke raises the nose and moves the horizon down."],
 ["alt","Altimeter","Multiple needles identify hundreds, thousands and ten-thousands of feet. A real altimeter needs a correct barometric setting; this simplified lesson uses a fixed example setting."],
 ["tc","Turn coordinator","The miniature aircraft indicates the sense of turning, while the inclinometer ball illustrates slip and skid. Rate of turn is not the same thing as bank angle."],
 ["hdg","Heading indicator","A compass rose rotates behind the fixed aircraft and lubber line. Its heading changes with the simulated turning flight. This is not linked to actual magnetometer data."],
 ["vsi","Vertical speed indicator","A marked needle indicates climb or descent in hundreds of feet per minute. Real vertical-speed instruments may lag, so cross-check with the altimeter and attitude indicator."]
];
function polar(r,a,cx=120,cy=120){return [cx+sin(deg(a))*r,cy-cos(deg(a))*r]}
function point(r,a,cx,cy){const p=polar(r,a,cx,cy);return p[0].toFixed(2)+","+p[1].toFixed(2)}
function pathArc(r,a,b,steps=30,color="#fff",width=5){
 let points=[];for(let i=0;i<=steps;i++)points.push(point(r,a+(b-a)*i/steps));
 return '<polyline points="'+points.join(" ")+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="butt"/>';
}
function tick(r,a,len=8,width=2,color="#eef6ff",cx=120,cy=120){
 let x=polar(r,a,cx,cy),y=polar(r-len,a,cx,cy);
 return '<line x1="'+x[0].toFixed(1)+'" y1="'+x[1].toFixed(1)+'" x2="'+y[0].toFixed(1)+'" y2="'+y[1].toFixed(1)+'" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round"/>';
}
function labelAt(r,a,text,size=13,color="#f2f8fd",cx=120,cy=120){
 let p=polar(r,a,cx,cy);
 return '<text x="'+p[0].toFixed(1)+'" y="'+(p[1]+size*.34).toFixed(1)+'" text-anchor="middle" fill="'+color+'" font-family="Arial,sans-serif" font-weight="700" font-size="'+size+'">'+text+'</text>';
}
function basicFace(id,body,label){
 return '<svg viewBox="0 0 240 240" aria-label="'+label+'" role="img"><defs><radialGradient id="bg-'+id+'" cx="40%" cy="25%" r="80%"><stop offset="0" stop-color="#2d3740"/><stop offset=".55" stop-color="#10151d"/><stop offset="1" stop-color="#03060c"/></radialGradient><clipPath id="clip-'+id+'"><circle cx="120" cy="120" r="95"/></clipPath></defs><circle cx="120" cy="120" r="116" fill="#0b131d" stroke="#7c8e9a" stroke-width="7"/><circle cx="120" cy="120" r="107" fill="#111b26" stroke="#394654" stroke-width="8"/><circle cx="120" cy="120" r="99" fill="url(#bg-'+id+')" stroke="#111e2c" stroke-width="3"/>'+body+'<path d="M30 62 Q120 6 210 62" fill="none" stroke="#ffffff" stroke-opacity=".08" stroke-width="5"/><circle cx="120" cy="120" r="104" fill="none" stroke="#8c9ba8" stroke-width="1"/></svg>';
}
function needle(id,len=66,color="#f3fcff",width=5){
 return '<g id="'+id+'" transform="rotate(0 120 120)"><path d="M'+(-width/2)+' 135 L0 '+(-len+120)+' L'+(width/2)+' 135 Z" transform="translate(120 0)" fill="'+color+'" stroke="#141e29" stroke-width="1"/><circle cx="120" cy="120" r="6.5" fill="#aebcc8" stroke="#151d27" stroke-width="2"/></g>';
}
function makeASI(){
 let body=pathArc(92,-130+40/200*260,-130+110/200*260,40,"#f8fafb",4)
  +pathArc(87,-130+55/200*260,-130+135/200*260,44,"#55d17b",5)
  +pathArc(87,-130+135/200*260,-130+160/200*260,15,"#f7c250",5);
 for(let v=0;v<=200;v+=10){let a=-130+v/200*260;body+=tick(94,a,v%20===0?12:6,v%20===0?2.8:1.4);
 if(v%20===0)body+=labelAt(64,a,String(v),v===0?12:13);}
 body+='<text x="120" y="159" text-anchor="middle" fill="#d3e8f9" font-size="12" font-weight="800">KNOTS</text><text x="120" y="172" text-anchor="middle" fill="#92b7cf" font-size="9">IAS • DEMO</text>';
 body+=needle("hand-asi",70);
 return basicFace("asi",body,"Marked analogue airspeed indicator with colored operating arcs");
}
function makeATT(){
 let ladder='';for(let p=-30;p<=30;p+=5){if(p===0)continue;let y=-p*3.6,major=p%10===0;
 let l=major?35:18;
 ladder+='<line x1="'+(-l)+'" y1="'+y+'" x2="'+l+'" y2="'+y+'" stroke="#fff" stroke-width="2"/>';
 if(major)ladder+='<text x="'+(-l-13)+'" y="'+(y+5)+'" fill="white" font-size="12" text-anchor="end">'+Math.abs(p)+'</text><text x="'+(l+13)+'" y="'+(y+5)+'" fill="white" font-size="12">'+Math.abs(p)+'</text>';
 }
 let body='<g clip-path="url(#clip-att)"><g id="att-motion" transform="translate(120 120) rotate(0) translate(0 0)"><rect x="-260" y="-250" width="520" height="250" fill="#2c82bd"/><rect x="-260" y="0" width="520" height="250" fill="#946444"/><line x1="-260" y1="0" x2="260" y2="0" stroke="#f1f3dc" stroke-width="3"/>'+ladder+'</g></g>';
 for(const a of [-60,-45,-30,-20,-10,0,10,20,30,45,60])body+=tick(97,a,a%30===0?13:7,a===0?4:2);
 body+='<path d="M120 20 L114 34 L126 34 Z" fill="#f8eeec"/><g id="att-bank-arrow"><path d="M120 38 L113 48 L127 48 Z" fill="#ffc75c"/></g>';
 body+='<path d="M57 120 H96 L111 130 H129 L144 120 H183" stroke="#151a21" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M57 120 H96 L111 130 H129 L144 120 H183" stroke="#f6ce72" stroke-width="5" stroke-linecap="round" fill="none"/>';
 body+='<circle cx="120" cy="120" r="6" fill="#fbe0a2"/>';
 return basicFace("att",body,"Analogue attitude indicator with marked pitch ladder and bank scale");
}
function makeALT(){
 let body='';
 for(let v=0;v<100;v+=2){let a=v/100*360;body+=tick(96,a,v%10===0?15:v%5===0?10:5,v%10===0?2.6:1.2);
 if(v%10===0)body+=labelAt(69,a,String(v/10),15)}
 body+='<text x="120" y="149" text-anchor="middle" fill="#d5edf9" font-size="11">ALT</text><text x="120" y="163" text-anchor="middle" fill="#e5bb74" font-size="10">BARO 29.92</text>';
 body+=needle("hand-alt100",76,"#f9f9f9",3)+needle("hand-alt1000",60,"#eff8ff",7)+needle("hand-alt10000",42,"#e4bd8c",8);
 return basicFace("alt",body,"Marked circular altimeter with hundreds thousands and ten thousands pointers");
}
function makeTC(){
 let body='';
 body+='<text x="55" y="77" fill="white" font-size="13" text-anchor="middle">L</text><text x="185" y="77" fill="white" font-size="13" text-anchor="middle">R</text>';
 body+='<path d="M39 87v17 M201 87v17" stroke="white" stroke-width="4"/>';
 body+='<g id="tc-plane" transform="rotate(0 120 121)"><path d="M120 89 l9 21 47 9 -1 8 -48 -5 -7 22 -7 -22 -48 5 -1 -8 47 -9 Z" fill="#e9f3fc" stroke="#93a6b9" stroke-width="2"/></g>';
 body+='<text x="120" y="168" text-anchor="middle" fill="#f3f6fc" font-size="11" font-weight="700">2 MIN TURN</text>';
 body+='<path d="M74 184 Q120 214 166 184" fill="none" stroke="#a9b6c1" stroke-width="10"/><path d="M74 184 Q120 214 166 184" fill="none" stroke="#111720" stroke-width="6"/>';
 body+='<g id="tc-ball"><circle cx="120" cy="201" r="8" fill="#f0f2f4" stroke="#13161f" stroke-width="3"/></g>';
 body+='<path d="M108 188 v18 M132 188 v18" stroke="#e9efff" stroke-width="2"/>';
 return basicFace("tc",body,"Turn coordinator with airplane symbol standard-rate references and slip skid ball");
}
function makeHDG(){
 let body='<g id="hdg-card" transform="rotate(0 120 120)">';
 for(let v=0;v<360;v+=5){body+=tick(97,v,v%30===0?14:v%10===0?8:4,v%30===0?2.8:1.2);
 if(v%30===0){let l=v===0?"N":v===90?"E":v===180?"S":v===270?"W":String(v/10).padStart(2,"0");body+=labelAt(68,v,l,15)}}
 body+='</g><path d="M120 16 L113 34 L127 34 Z" fill="#f6d078"/><path d="M120 94 L134 130 L120 122 L106 130 Z" fill="#e2edf6" stroke="#8ca9c1" stroke-width="2"/><text x="120" y="161" text-anchor="middle" fill="#b1cfe2" font-size="11">HEADING</text>';
 return basicFace("hdg",body,"Heading indicator with 36 position compass rose, compass points and fixed lubber line");
}
function makeVSI(){
 const angle=v=>90-(v/2000)*120;
 let body=pathArc(90,210,-30,55,"#9ba8b6",3);
 for(let v=-2000;v<=2000;v+=250){let a=angle(v);body+=tick(96,a,v%500===0?12:6,v%500===0?2.8:1.3);
 if(v%500===0){let txt=v===0?"0":String(Math.abs(v/1000)).replace(".5",".5");body+=labelAt(68,a,txt,11)}}
 body+='<text x="120" y="161" font-size="10" text-anchor="middle" fill="#bbd5eb">VERT SPEED</text><text x="120" y="173" font-size="9" text-anchor="middle" fill="#bbd5eb">1000 FT/MIN</text><text x="50" y="153" fill="#f5d58c" font-size="9">DN</text><text x="177" y="108" fill="#f5d58c" font-size="9">UP</text>';
 body+=needle("hand-vsi",77,"#f6f5ef",5);
 return basicFace("vsi",body,"Vertical speed indicator with zero, climb and descent tick labels");
}
function buildAnalogue(){
 $("dial-asi").innerHTML=makeASI();$("dial-att").innerHTML=makeATT();
 $("dial-alt").innerHTML=makeALT();$("dial-tc").innerHTML=makeTC();
 $("dial-hdg").innerHTML=makeHDG();$("dial-vsi").innerHTML=makeVSI();
}
function setAngle(id,value){const node=$(id);if(node)node.setAttribute("transform","rotate("+value.toFixed(1)+" 120 120)")}
function renderAnalogue(){
 let s=state;
 setAngle("hand-asi",-130+s.speed/200*260);
 $("att-motion").setAttribute("transform","translate(120 120) rotate("+(-s.roll).toFixed(2)+") translate(0 "+(s.pitch*3.6).toFixed(2)+")");
 setAngle("att-bank-arrow",s.roll);
 setAngle("hand-alt100",(s.altitude%1000)/1000*360);
 setAngle("hand-alt1000",(s.altitude%10000)/10000*360);
 setAngle("hand-alt10000",(s.altitude%100000)/100000*360);
 setAngle("tc-plane",clamp(s.turnRate/3*24,-28,28));
 $("tc-ball").setAttribute("transform","translate("+(clamp(s.slip,-1,1)*25).toFixed(1)+" 0)");
 setAngle("hdg-card",-s.heading);
 setAngle("hand-vsi",90-clamp(s.verticalSpeed,-2000,2000)/2000*120);
 $("read-asi").textContent=round(s.speed)+" KT IAS";
 $("read-att").textContent=s.pitch.toFixed(1)+"° PITCH · "+s.roll.toFixed(1)+"° BANK";
 $("read-alt").textContent=round(s.altitude).toLocaleString()+" FT";
 $("read-tc").textContent=s.turnRate.toFixed(1)+"°/S · BALL "+(Math.abs(s.slip)<.15?"CENTERED":s.slip>0?"RIGHT":"LEFT");
 $("read-hdg").textContent=String(round(s.heading)%360).padStart(3,"0")+"° HDG";
 $("read-vsi").textContent=round(s.verticalSpeed)+" FPM";
}
function renderPFD(){
 let s=state,lines=[],pitchLines=[];
 for(let d=-30;d<=30;d+=5){if(d===0)continue;let y=-d*5;let len=d%10===0?48:24;
 pitchLines.push('<line x1="'+(-len/2)+'" y1="'+y+'" x2="'+(len/2)+'" y2="'+y+'" stroke="white" stroke-width="2"/>');
 if(d%10===0)pitchLines.push('<text x="'+(-len/2-13)+'" y="'+(y+4)+'" text-anchor="end" fill="white" font-size="12">'+Math.abs(d)+'</text><text x="'+(len/2+13)+'" y="'+(y+4)+'" fill="white" font-size="12">'+Math.abs(d)+'</text>');
 }
 let spdTicks=[],altTicks=[];
 for(let o=-3;o<=3;o++){let sp=round(s.speed/10)*10-o*10,alt=round(s.altitude/100)*100-o*100;
 spdTicks.push('<text x="83" y="'+(218+o*29)+'" text-anchor="end" fill="white" font-size="14">'+sp+'</text><line x1="89" y1="'+(213+o*29)+'" x2="96" y2="'+(213+o*29)+'" stroke="white"/>');
 altTicks.push('<text x="558" y="'+(218+o*29)+'" fill="white" font-size="14">'+alt+'</text><line x1="540" y1="'+(213+o*29)+'" x2="552" y2="'+(213+o*29)+'" stroke="white"/>');
 }
 let comp=[];
 for(let o=-4;o<=4;o++){let hd=(round(s.heading/10)*10+o*10+360)%360;
 let x=340+o*38;let h=hd===0?"N":hd===90?"E":hd===180?"S":hd===270?"W":String(hd/10).padStart(2,"0");
 comp.push('<text x="'+x+'" y="463" fill="#d4efff" text-anchor="middle" font-size="15">'+h+'</text><line x1="'+x+'" y1="438" x2="'+x+'" y2="446" stroke="white"/>');
 }
 const display='<defs><clipPath id="pfdHorizonClip"><rect x="110" y="20" width="448" height="398" rx="7"/></clipPath><linearGradient id="pfdSky" x2="0" y2="1"><stop stop-color="#0e4b9b"/><stop offset="1" stop-color="#5eaad0"/></linearGradient><linearGradient id="pfdEarth" x2="0" y2="1"><stop stop-color="#a36a43"/><stop offset="1" stop-color="#4e2b20"/></linearGradient></defs>'+
 '<rect width="680" height="490" fill="#051321"/><g clip-path="url(#pfdHorizonClip)"><g id="pfdHorizon" transform="translate(334 215) rotate('+(-s.roll).toFixed(2)+') translate(0 '+(s.pitch*5).toFixed(2)+')"><rect x="-550" y="-560" width="1100" height="560" fill="url(#pfdSky)"/><rect x="-550" y="0" width="1100" height="560" fill="url(#pfdEarth)"/><line x1="-550" y1="0" x2="550" y2="0" stroke="white" stroke-width="4"/>'+pitchLines.join("")+'</g></g>'+
 '<rect x="0" y="20" width="108" height="398" fill="#091b2e" stroke="#53738d" stroke-width="2"/><rect x="558" y="20" width="122" height="398" fill="#091b2e" stroke="#53738d" stroke-width="2"/>'+
 spdTicks.join("")+altTicks.join("")+
 '<rect x="7" y="188" width="101" height="48" fill="#10141c" stroke="#e8f5ff" stroke-width="2"/><text x="57" y="218" fill="white" font-weight="800" text-anchor="middle" font-size="27">'+round(s.speed)+'</text>'+
 '<rect x="559" y="188" width="117" height="48" fill="#10141c" stroke="#e8f5ff" stroke-width="2"/><text x="615" y="218" fill="white" font-weight="800" text-anchor="middle" font-size="27">'+round(s.altitude)+'</text>'+
 '<rect x="200" y="13" width="268" height="29" fill="#0b293b" opacity=".92"/><text x="334" y="33" fill="#d0f2ff" font-size="16" font-weight="700" text-anchor="middle">PFD · LEARNING MODE</text>'+
 '<path d="M220 213 H288 L310 227 H358 L380 213 H448" fill="none" stroke="#f5d15e" stroke-width="8"/><circle cx="334" cy="216" r="7" fill="#f5d15e"/>'+
 '<path d="M334 47 L326 61 L342 61 Z" fill="#fff"/><rect x="5" y="2" width="100" height="17" fill="#081522"/><text x="55" y="15" fill="#80d9f5" text-anchor="middle" font-size="13">AIRSPEED</text>'+
 '<text x="618" y="14" fill="#80d9f5" text-anchor="middle" font-size="13">ALTITUDE</text>'+
 '<rect x="0" y="430" width="680" height="60" fill="#071827"/>'+comp.join("")+
 '<path d="M340 432 L330 445 L350 445 Z" fill="#fcd26e"/><text x="340" y="483" text-anchor="middle" font-size="13" fill="#ffd480">'+(round(s.heading)%360)+'° HDG</text>'+
 '<rect x="563" y="260" width="108" height="125" fill="#091c29"/><text x="613" y="284" text-anchor="middle" fill="#88d8ed" font-size="11">VS FPM</text><text x="613" y="329" text-anchor="middle" fill="#fff" font-size="24">'+round(s.verticalSpeed)+'</text>';
 // The attitude horizon depicts pitch/roll. Yaw is indicated separately
 // through a slip-skid cue and rate-of-turn annotation; no false yaw horizon.
 const slipX=(334+clamp(s.slip,-1,1)*25).toFixed(1);
 const turnText="TURN "+s.turnRate.toFixed(1)+"°/s";
 const flapMode=input.flapPitchMode==="noseUp"?"UP":input.flapPitchMode==="noseDown"?"DOWN":"NONE";
 const cue='<g id="pfdSlipIndicator" aria-label="Slip skid indicator">'
  +'<rect x="295" y="376" width="78" height="34" rx="6" fill="#061625" stroke="#b9d4e3" stroke-width="2"/>'
  +'<line x1="325" y1="382" x2="325" y2="402" stroke="#eff9fd" stroke-width="2"/>'
  +'<line x1="343" y1="382" x2="343" y2="402" stroke="#eff9fd" stroke-width="2"/>'
  +'<circle id="pfdSlipBall" cx="'+slipX+'" cy="392" r="7" fill="#ffd47a" stroke="#0d2535" stroke-width="2"/>'
  +'<text x="334" y="371" text-anchor="middle" font-size="12" fill="#f9e6bb">SLIP / SKID</text></g>'
  +'<rect x="254" y="53" width="165" height="39" rx="7" fill="#071c30" fill-opacity=".9" stroke="#33536e"/>'
  +'<text id="pfdTurnRate" x="336" y="70" text-anchor="middle" fill="#f8d47b" font-size="13">'+turnText+'</text>'
  +'<text x="336" y="86" text-anchor="middle" fill="#bedfee" font-size="11">FLAP PITCH '+flapMode+' '+s.flapPitchBias.toFixed(1)+'°</text>';
 $("pfdSvg").innerHTML=display+cue;
 $("dv-speed").textContent=round(s.speed);
 $("dv-alt").textContent=round(s.altitude).toLocaleString();
 $("dv-vs").textContent=round(s.verticalSpeed);
 $("dv-hdg").textContent=(round(s.heading)%360)+"°";
 $("dv-bank").textContent=s.roll.toFixed(1)+"°";
 $("dv-pitch").textContent=s.pitch.toFixed(1)+"°";
 $("dv-turn").textContent=s.turnRate.toFixed(1)+"°/s";
 $("dv-slip").textContent=Math.abs(s.slip)<.15?"CENTERED":s.slip>0?"RIGHT":"LEFT";
 $("dv-flap-pitch").textContent=(s.flapPitchBias>=0?"+":"")+s.flapPitchBias.toFixed(1)+"°";
 $("digitalClock").textContent="SIM "+Math.floor(s.elapsed/60)+":"+String(Math.floor(s.elapsed%60)).padStart(2,"0");
}
function renderMap(){
 let s=state,range=0.024;
 let poly=trail.slice(-150).map(p=>{return [(270+(p.x-s.x)/range*160).toFixed(1),(145-(p.y-s.y)/range*160).toFixed(1)].join(",")}).join(" ");
 $("mapViewport").innerHTML='<svg viewBox="0 0 540 290" aria-label="Illustrative ground track from model motion" role="img"><path d="M0 145H540M270 0V290" stroke="#78d4ed" stroke-width="1" stroke-dasharray="5 10" opacity=".4"/><polyline points="'+poly+'" fill="none" stroke="#ffd46a" stroke-width="3"/><g transform="translate(270 145) rotate('+s.heading.toFixed(1)+')"><path d="M0 -28 L11 15 L0 8 L-11 15 Z" fill="#f5d777" stroke="#fff" stroke-width="1"/></g><text x="14" y="30" fill="#d7f4fa" font-size="16">TRACK '+(round(s.heading)%360)+'°</text><text x="14" y="268" fill="#d7f4fa" font-size="15">FORWARD '+s.distance.toFixed(2)+' NM</text></svg>';
}
function renderEngine(){
 let p=round(state.power);
 $("engineData").innerHTML='<div class="pfd-tile"><small>POWER COMMAND</small><strong>'+p+'%</strong><p>Derived from the throttle. Not a real engine RPM or manifold pressure reading.</p></div><div class="pfd-tile"><small>FLAPS SELECTED</small><strong>'+round(input.flaps)+'°</strong></div><div class="pfd-tile"><small>FLAPS INDICATED</small><strong>'+state.flaps.toFixed(1)+'°</strong></div><div class="pfd-tile"><small>RELATIVE LIFT POTENTIAL</small><strong>'+state.liftIndex.toFixed(2)+'×</strong></div><div class="pfd-tile"><small>RELATIVE DRAG</small><strong>'+state.dragIndex.toFixed(2)+'×</strong></div><div class="pfd-tile"><small>TRAINING AIRSPEED</small><strong>'+round(state.speed)+' KT</strong></div><div class="pfd-tile"><small>VERTICAL SPEED</small><strong>'+round(state.verticalSpeed)+' FPM</strong></div>';
}
function updateFlapIllustration(){
 // Move only the hinged trailing-edge flap, not the fixed wing. Animation is
 // driven by the model's actual flap value, which approaches the selected detent.
 const selected=clamp(input.flaps,0,30);
 const indicated=clamp(state.flaps,0,30);
 $("flapWingSurface").setAttribute("transform","rotate("+indicated.toFixed(2)+" 207 93)");
 $("flapSvgAngle").textContent=indicated.toFixed(1)+"°";
 $("flapCommanded").textContent=round(selected)+"°";
 $("flapIndicated").textContent=indicated.toFixed(1)+"°";
 $("flapTravelMeter").value=indicated;
 $("flapLiftIndex").textContent=state.liftIndex.toFixed(2)+"×";
 $("flapDragIndex").textContent=state.dragIndex.toFixed(2)+"×";
 $("flapLiftProgress").value=state.liftIndex;
 $("flapDragProgress").value=state.dragIndex;
 $("flapIAS").textContent=round(state.speed)+" kt";
 $("flapVSI").textContent=round(state.verticalSpeed)+" ft/min";
 let message;
 if(indicated<1){
  message="Clean-wing reference: flap lift and drag additions are not applied. Try 10° and compare the response.";
 }else if(indicated<=15){
  message="Early flap extension: the model adds proportionally more lift potential than drag. With pitch and power unchanged, a small temporary upward tendency may appear.";
 }else{
  message="Larger flap deflections: drag grows much faster. Watch for reduced airspeed and a possible steeper descent at the same pitch and power.";
 }
 if(paused)message+=" Flight is paused; resume to observe changes.";
 $("flapContext").textContent=message;
}
function paint(){
 updateFlapIllustration();
 renderAnalogue();renderPFD();if(pfdPage==="map")renderMap();if(pfdPage==="engine")renderEngine();
 if(window.CockpitV3Focus)window.CockpitV3Focus.update();
 $("distance").textContent=state.distance.toFixed(2)+" NM";
 $("turnrate").textContent=state.turnRate.toFixed(1)+"°/s";
 let t=round(state.elapsed);$("elapsed").textContent=Math.floor(t/60)+":"+String(t%60).padStart(2,"0");
 $("outThrottle").textContent=round(input.throttle)+"%";
 $("outTrim").textContent=round(input.trim*100)+"%";
 $("outFlaps").textContent=round(input.flaps)+"°";
 const d=Math.abs(state.roll)>5?(state.roll>0?"Banking right.":"Banking left."):Math.abs(state.pitch)>3?(state.pitch>0?"Nose-high attitude.":"Nose-low attitude."):"Near level attitude.";
 $("teachingFeedback").innerHTML="<p><strong>"+d+"</strong> Airspeed "+round(state.speed)+" kt; vertical speed "+round(state.verticalSpeed)+" ft/min. The readings change from controls, not direct touches on the dial.</p>";
 if(mode==="skills")renderSkills();
}
function syncMissionControls(){
 $("throttle").value=String(round(input.throttle));
 $("trim").value=String(round(input.trim*100));
 $("flapPitchMode").value=input.flapPitchMode;
 setFlaps(input.flaps);
}
function startMission(phase="roll"){
 const training=window.CockpitV3Mission;
 if(!training)throw Error("Guided flight mission could not load");
 if(!mission)mission=training.make(phase);
 else training.setup(mission,phase);
 state=mission.state;input=mission.input;
 presetUntil=0;trail=[];
 paused=false;$("pauseBtn").setAttribute("aria-pressed","false");$("pauseBtn").textContent="Pause flight";
 syncMissionControls();
 lastMissionPhase=mission.phase;
 if(window.CockpitV3Focus)window.CockpitV3Focus.dockMission(mission.phase);
 renderMission();
}
function renderMission(){
 if(!mission||mode!=="mission")return;
 const cfg=window.CockpitV3Mission.phases[mission.phase];
 if(!cfg)return;
 $("missionPhase").textContent=cfg.title;
 $("missionTask").textContent=cfg.task;
 $("missionGoal").textContent=cfg.goal;
 $("missionMiniPhase").textContent=cfg.title;
 $("missionMiniHint").textContent=cfg.goal;
 $("missionState").textContent=mission.state.grounded?"RUNWAY · ON GROUND":"AIRBORNE · "+round(mission.state.altitude)+" FT";
 $("missionIAS").textContent=round(mission.state.speed)+" kt";
 $("missionHeight").textContent=round(mission.state.altitude)+" ft AGL";
 $("missionVSI").textContent=round(mission.state.verticalSpeed)+" fpm";
 $("missionFlaps").textContent=round(input.flaps)+"°";
 $("missionFeedback").textContent=mission.message+(mission.lastCheck?" · "+mission.lastCheck:"");
 const steps=["roll","climb","approach","landing","rollout"];
 let pos=steps.indexOf(mission.phase);
 if(mission.phase==="climbReady")pos=2;
 if(mission.phase==="review")pos=3;
 if(mission.phase==="complete")pos=5;
 for(let i=0;i<steps.length;i++){
  const node=document.querySelector('[data-phase="'+steps[i]+'"]');
  if(node)node.setAttribute("data-status",i<pos?"complete":i===pos?"current":"upcoming");
 }
 $("missionContinue").classList.toggle("hidden",mission.phase!=="climbReady");
 $("missionGoAround").classList.toggle("hidden",!["approach","landing","review"].includes(mission.phase));
 $("missionRepeat").classList.toggle("hidden",!["review","complete"].includes(mission.phase));
}
function selectSkillTask(id){
 const Skills=window.CockpitV3Skills;
 if(!Skills)throw Error("Skills practice module did not load");
 skillsSession=Skills.create(id);
 state=M.makeState();input=M.makeInput();trail=[];presetUntil=0;
 paused=false;$("pauseBtn").setAttribute("aria-pressed","false");$("pauseBtn").textContent="Pause flight";
 $("throttle").value="55";$("trim").value="0";
 $("flapPitchMode").value=input.flapPitchMode;
 setFlaps(0);
 $("skillsSelect").value=id;
 if(window.CockpitV3Focus)window.CockpitV3Focus.dockSkills(id);
 renderSkills();
}
function renderSkills(){
 if(!skillsSession||mode!=="skills")return;
 const Skills=window.CockpitV3Skills;
 const task=Skills.tasks[skillsSession.id];
 const running=skillsSession.status==="running";
 const done=skillsSession.status==="finished";
 $("skillsBriefing").textContent=task.briefing;
 $("skillsTarget").textContent=task.target;
 $("skillsStage").textContent=running?"OBSERVING":done?(skillsSession.passed?"TARGET MET":"REVIEW"):"READY";
 $("skillsElapsed").textContent=skillsSession.elapsed.toFixed(1)+" / "+Skills.duration.toFixed(1)+" s";
 $("skillsMatched").textContent=skillsSession.percent+"%";
 $("skillsProgress").value=skillsSession.elapsed;
 $("skillsResult").textContent=skillsSession.feedback;
 $("skillsMiniPhase").textContent=task.title;
 $("skillsMiniHint").textContent=running
  ?skillsSession.elapsed.toFixed(1)+"s / "+Skills.duration+"s · "+skillsSession.percent+"% within target"
  :done?("Result: "+skillsSession.percent+"% · "+(skillsSession.passed?"example target met":"repeat practice"))
  :"Example target: "+task.target;
 $("skillsSelect").disabled=running;
 $("skillsStart").disabled=running;
 $("skillsEnd").disabled=!running;
 $("skillsExport").disabled=!done;
 $("skillsStart").textContent=done?"Start new observation":"Start 12-second observation";
 $("skillsSummary").classList.toggle("hidden",!done);
 if(done){
  $("skillsOutcome").textContent=skillsSession.passed?"PRACTICE TARGET MET":skillsSession.stopReason==="ended"?"INCOMPLETE":"PRACTICE AGAIN";
  $("skillsScore").textContent=skillsSession.percent+"% (target ≥"+Skills.threshold+"%)";
  $("skillsStreak").textContent=(skillsSession.maxStreak*Skills.sampleInterval).toFixed(1)+" s";
  $("skillsReviewNote").textContent=skillsSession.feedback+" The optional JSON records only synthetic readings and is not a signed assessment.";
 }
}
function downloadSkillReport(){
 if(!skillsSession||skillsSession.status!=="finished")return;
 const report=window.CockpitV3Skills.report(skillsSession);
 const blob=new Blob([JSON.stringify(report,null,2)+"\n"],{type:"application/json"});
 const href=URL.createObjectURL(blob);
 const anchor=document.createElement("a");
 anchor.href=href;
 anchor.download="academy-unofficial-"+skillsSession.id+"-practice.json";
 document.body.appendChild(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(href),250);
}
function setMode(next){
 const wasMission=mode==="mission",wasSkills=mode==="skills";
 if(next==="mission"&&!wasMission){
  mission=null;
  mode="mission";
  pfdPage="pfd";
  startMission("roll");
  setPFD("pfd");
 }else if(next==="skills"&&!wasSkills){
  mission=null;
  mode="skills";
  pfdPage="pfd";
  selectSkillTask($("skillsSelect").value||"level");
  setPFD("pfd");
 }else if((wasMission||wasSkills)&&next!=="mission"&&next!=="skills"){
  mission=null;skillsSession=null;state=M.makeState();input=M.makeInput();trail=[];presetUntil=0;
  $("throttle").value="55";$("trim").value="0";$("flapPitchMode").value=input.flapPitchMode;setFlaps(0);
 }
 mode=next;
 const focused=window.CockpitV3Focus;
 if(focused){
  if(next==="focus")focused.dock(focus,instruments);
  else if(next==="digital")focused.dockDigital(focus,instruments,pfdPage);
  else if(next==="mission")focused.dockMission(mission.phase);
  else if(next==="skills")focused.dockSkills(skillsSession.id);
  else focused.restore();
 }
 $("focusMode").setAttribute("aria-pressed",String(mode==="focus"));
 $("analogMode").setAttribute("aria-pressed",String(mode==="analog"));
 $("digitalMode").setAttribute("aria-pressed",String(mode==="digital"));
 $("missionMode").setAttribute("aria-pressed",String(mode==="mission"));
 $("skillsMode").setAttribute("aria-pressed",String(mode==="skills"));
 $("focusSection").classList.toggle("hidden",mode!=="focus");
 $("analogSection").classList.toggle("hidden",mode!=="analog");
 $("digitalSection").classList.toggle("hidden",!["digital","mission","skills"].includes(mode));
 $("missionPanel").classList.toggle("hidden",mode!=="mission");
 $("missionMiniStatus").classList.toggle("hidden",mode!=="mission");
 $("skillsPanel").classList.toggle("hidden",mode!=="skills");
 $("skillsMiniStatus").classList.toggle("hidden",mode!=="skills");
 $("mapTab").disabled=mode==="skills";
 $("engineTab").disabled=mode==="skills";
 $("controlOverview").classList.toggle("hidden",["focus","digital","mission","skills"].includes(mode));
 document.querySelector(".lesson-bar").classList.toggle("hidden",mode==="mission"||mode==="skills");
 paint();
 renderMission();
 renderSkills();
}
function setPFD(next){
 pfdPage=next;
 ["pfd","map","engine"].forEach(k=>{
  $(k+"Tab").setAttribute("aria-pressed",String(next===k));
 });
 $("pfdView").classList.toggle("hidden",next!=="pfd");
 $("mapView").classList.toggle("active",next==="map");
 $("engineView").classList.toggle("active",next==="engine");
 if(next==="map")renderMap();if(next==="engine")renderEngine();
 if(mode==="digital"&&window.CockpitV3Focus)window.CockpitV3Focus.dockDigital(focus,instruments,next);
}
function setFocus(n){
 focus=(n+instruments.length)%instruments.length;
 let x=instruments[focus];
 $("focusCount").textContent="INSTRUMENT "+(focus+1)+" / "+instruments.length;
 $("focusTitle").textContent=x[1];$("focusText").textContent=x[2];
 for(const y of instruments){$("tile-"+y[0]).setAttribute("aria-current",String(y===x));}
 const focused=window.CockpitV3Focus;
 if(focused){
  focused.highlight(focus,instruments);
  if(mode==="focus")focused.dock(focus,instruments);
  if(mode==="digital")focused.dockDigital(focus,instruments,pfdPage);
 }
}
function reset(){
 if(mode==="mission"){startMission("roll");paint();return;}
 if(mode==="skills"){selectSkillTask(skillsSession?skillsSession.id:"level");paint();return;}
 state=M.makeState();input=M.makeInput();trail=[];presetUntil=0;
 $("throttle").value="55";$("trim").value="0";
 $("flapPitchMode").value=input.flapPitchMode;
 setFlaps(0);paint();
}
function setFlaps(n){
 // The physical flap selector is shared across every instrument workstation.
 // Change its commanded detent immediately; modelled flap travel follows over time.
 input.flaps=n;
 for(const v of [0,10,20,30])$("flaps"+v).setAttribute("aria-pressed",String(n===v));
 $("outFlaps").textContent=n+"°";
 $("focusFlapsState").textContent=n+"°";
 $("digitalFlapsState").textContent=n+"°";
 updateFlapIllustration();
 if(mode==="mission"&&mission)renderMission();
}
function applyPreset(type){
 presetUntil=performance.now()+4300;
 input.trim=0;$("trim").value="0";
 if(type==="level"){input.yokeX=0;input.yokeY=0;input.throttle=55;state.pitch=0;state.roll=0;}
 if(type==="climb"){input.yokeX=0;input.yokeY=-.7;input.throttle=87;}
 if(type==="right"){input.yokeX=.75;input.yokeY=0;input.throttle=67;}
 if(type==="descend"){input.yokeX=0;input.yokeY=.55;input.throttle=32;}
 $("throttle").value=String(input.throttle);
 $("teachingFeedback").textContent="Demonstrating "+type+" for a few seconds. Take over with the controls at any time.";
}
function releaseYoke(){input.yokeX=0;input.yokeY=0;$("grip").style.transform="translate(0px,0px)"}
function cancelPreset(){presetUntil=0}
function selectControlStyle(next){
 controlStyle=next==="joystick"?"joystick":"yoke";
 $("controlTypeYoke").setAttribute("aria-pressed",String(controlStyle==="yoke"));
 $("controlTypeStick").setAttribute("aria-pressed",String(controlStyle==="joystick"));
 $("controlPad").classList.toggle("joystick-layout",controlStyle==="joystick");
 $("gripTypeLabel").textContent=controlStyle==="joystick"?"STICK":"YOKE";
 $("grip").setAttribute("aria-label","Drag "+(controlStyle==="joystick"?"joystick":"yoke")+" left or right for bank, up or down for pitch. Use arrow keys on desktop.");
 $("controlStyleHint").textContent=controlStyle==="joystick"
  ?"Joystick: move the stick sideways to bank or forward/back to change pitch. Touch dragging uses the same aircraft state."
  :"Yoke: turn left or right to bank; push forward or pull back to pitch.";
}
function wireControls(){
 $("controlTypeYoke").onclick=()=>selectControlStyle("yoke");
 $("controlTypeStick").onclick=()=>selectControlStyle("joystick");
 $("flapPitchMode").addEventListener("change",e=>{input.flapPitchMode=e.target.value;});
 selectControlStyle("yoke");
 $("focusMode").onclick=()=>setMode("focus");
 $("analogMode").onclick=()=>setMode("analog");
 $("digitalMode").onclick=()=>setMode("digital");
 $("missionMode").onclick=()=>setMode("mission");
 $("skillsMode").onclick=()=>setMode("skills");
 $("skillsSelect").onchange=e=>{
  if(mode==="skills"&&skillsSession?.status!=="running"){selectSkillTask(e.target.value);paint();}
 };
 $("skillsStart").onclick=()=>{
  if(mode!=="skills"||!skillsSession)return;
  if(skillsSession.status==="finished")selectSkillTask(skillsSession.id);
  window.CockpitV3Skills.begin(skillsSession);
  renderSkills();
 };
 $("skillsEnd").onclick=()=>{
  if(mode!=="skills"||skillsSession?.status!=="running")return;
  skillsSession.final=window.CockpitV3Skills.snapshot(state,input);
  window.CockpitV3Skills.finish(skillsSession,"ended");
  renderSkills();
 };
 $("skillsRetry").onclick=()=>{if(mode==="skills"){selectSkillTask($("skillsSelect").value);paint();}};
 $("skillsExport").onclick=downloadSkillReport;
 $("missionRestart").onclick=()=>{startMission("roll");paint();};
 $("missionContinue").onclick=()=>{
  if(mission&&mission.phase==="climbReady"){
   window.CockpitV3Mission.approach(mission);
   state=mission.state;input=mission.input;syncMissionControls();
   lastMissionPhase=mission.phase;
   window.CockpitV3Focus.dockMission(mission.phase);
   setPFD("pfd");paint();renderMission();
  }
 };
 $("missionRepeat").onclick=()=>{if(mission){startMission("approach");paint();}};
 $("missionGoAround").onclick=()=>{
  if(mission){
   window.CockpitV3Mission.goAround(mission);
   syncMissionControls();window.CockpitV3Focus.dockMission(mission.phase);
   setPFD("pfd");paint();renderMission();
  }
 };
 document.querySelectorAll("[data-mission-stage]").forEach(btn=>btn.addEventListener("click",()=>{
  if(mode==="mission"){
   startMission(btn.dataset.missionStage);
   setPFD("pfd");paint();
   const details=btn.closest("details");if(details)details.open=false;
  }
 }));
 $("pfdTab").onclick=()=>setPFD("pfd");$("mapTab").onclick=()=>setPFD("map");$("engineTab").onclick=()=>setPFD("engine");
 $("prevFocus").onclick=()=>setFocus(focus-1);$("nextFocus").onclick=()=>setFocus(focus+1);
 $("narrateFocus").onclick=()=>{
  if(!("speechSynthesis" in window))return;
  speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(instruments[focus][1]+". "+instruments[focus][2]);u.rate=.94;speechSynthesis.speak(u);
 };
 $("pauseBtn").onclick=()=>{paused=!paused;$("pauseBtn").setAttribute("aria-pressed",String(paused));$("pauseBtn").textContent=paused?"Resume flight":"Pause flight";};
 $("resetBtn").onclick=reset;
 $("throttle").addEventListener("input",e=>{cancelPreset();input.throttle=Number(e.target.value);$("outThrottle").textContent=round(input.throttle)+"%";});
 $("trim").addEventListener("input",e=>{cancelPreset();input.trim=Number(e.target.value)/100;$("outTrim").textContent=round(input.trim*100)+"%";});
 for(const n of [0,10,20,30])$("flaps"+n).onclick=()=>setFlaps(n);
 $("presetLevel").onclick=()=>applyPreset("level");$("presetClimb").onclick=()=>applyPreset("climb");
 $("presetRight").onclick=()=>applyPreset("right");$("presetDescend").onclick=()=>applyPreset("descend");
 const grip=$("grip"),pad=$("controlPad");
 let drag=null;
 function moveGrip(e){
  const box=pad.getBoundingClientRect();
  let dx=clamp((e.clientX-(box.left+box.width/2))/(box.width*(controlStyle==="joystick"?.31:.34)),-1,1);
  let dy=clamp((e.clientY-(box.top+box.height/2))/(box.height*(controlStyle==="joystick"?.29:.3)),-1,1);
  input.yokeX=dx;input.yokeY=dy;
  grip.style.transform="translate("+(dx*48).toFixed(0)+"px,"+(dy*25).toFixed(0)+"px)";
 }
 grip.addEventListener("pointerdown",e=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  cancelPreset();drag=e.pointerId;
  grip.setPointerCapture(e.pointerId);
  moveGrip(e);e.preventDefault();
 });
 grip.addEventListener("pointermove",e=>{if(drag===e.pointerId)moveGrip(e)});
 for(const t of ["pointerup","pointercancel","lostpointercapture"])grip.addEventListener(t,e=>{if(drag===e.pointerId){drag=null;releaseYoke()}});
 grip.addEventListener("keydown",e=>{
  const cmd={ArrowLeft:["yokeX",-1],ArrowRight:["yokeX",1],ArrowUp:["yokeY",-1],ArrowDown:["yokeY",1]};
  if(cmd[e.key]){e.preventDefault();cancelPreset();input[cmd[e.key][0]]=cmd[e.key][1]*.6;}
 });
 grip.addEventListener("keyup",()=>releaseYoke());
 function bindHold(id,key,value){
  const el=$(id);let keyActive=false;
  el.addEventListener("pointerdown",e=>{cancelPreset();input[key]=value;el.classList.add("pressed");if(el.setPointerCapture)el.setPointerCapture(e.pointerId)});
  for(const kind of ["pointerup","pointercancel","lostpointercapture"])el.addEventListener(kind,()=>{input[key]=0;el.classList.remove("pressed")});
  el.addEventListener("keydown",e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();cancelPreset();input[key]=value;keyActive=true;}});
  el.addEventListener("keyup",()=>{if(keyActive){input[key]=0;keyActive=false;}});
 }
 bindHold("leftRudder","rudder",-1);bindHold("rightRudder","rudder",1);
 bindHold("noseUp","yokeY",-.75);bindHold("noseDown","yokeY",.75);
 bindHold("bankLeft","yokeX",-.75);bindHold("bankRight","yokeX",.75);
 const keys=new Set();
 window.addEventListener("keydown",e=>{
  if(e.target.matches("input,select,textarea"))return;
  if(e.code==="KeyA"||e.code==="KeyD"){keys.add(e.code);cancelPreset();input.rudder=keys.has("KeyD")?1:keys.has("KeyA")?-1:0;}
 });
 window.addEventListener("keyup",e=>{keys.delete(e.code);input.rudder=keys.has("KeyD")?1:keys.has("KeyA")?-1:0});
 window.addEventListener("blur",()=>{releaseYoke();input.rudder=0;});
 $("runSelfTest").onclick=()=>{
  const s=M.makeState(),a=M.makeInput();
  a.yokeY=-.65;a.throttle=82;for(let i=0;i<180;i++)M.step(s,a,1/40);
  const climb=s.pitch>3&&s.altitude>3500&&s.verticalSpeed>0;
  a.yokeY=0;a.yokeX=.75;let hd=s.heading;for(let i=0;i<180;i++)M.step(s,a,1/40);
  const turn=s.roll>10&&Math.abs(s.heading-hd)>.5;
  const ok=climb&&turn&&s.distance>0;
  $("selfTestResult").textContent=ok?"PASS — climb, bank, heading and forward movement responded.":"CHECK REQUIRED — a flight model relationship did not respond as expected.";
 };
}
function frame(now){
 if(!previous)previous=now;
 let dt=clamp((now-previous)/1000,0,.1);previous=now;
 if(!paused){
  if(presetUntil&&now>presetUntil){presetUntil=0;releaseYoke();}
  if(mode==="mission"&&mission){
   const phaseBefore=mission.phase;
   window.CockpitV3Mission.step(mission,dt);
   state=mission.state;input=mission.input;
   if(phaseBefore!==mission.phase){
    lastMissionPhase=mission.phase;
    if(window.CockpitV3Focus)window.CockpitV3Focus.dockMission(mission.phase);
   }
  }else {
   M.step(state,input,dt);
   if(mode==="skills"&&skillsSession?.status==="running")window.CockpitV3Skills.observe(skillsSession,state,input,dt);
  }
  if(!trail.length||Math.hypot(trail[trail.length-1].x-state.x,trail[trail.length-1].y-state.y)>.00008){
   trail.push({x:state.x,y:state.y});if(trail.length>260)trail.shift();
  }
 }
 if(now-lastDraw>90){lastDraw=now;paint();if(mode==="mission")renderMission();}
 requestAnimationFrame(frame);
}
buildAnalogue();
wireControls();
if(window.CockpitV3Focus)window.CockpitV3Focus.init(instruments,setFocus);
setFocus(0);
setPFD("pfd");
const queryMode=new URLSearchParams(window.location.search).get("mode");
setMode(queryMode==="mission"?"mission":queryMode==="skills"?"skills":"focus");
paint();
requestAnimationFrame(frame);
})();