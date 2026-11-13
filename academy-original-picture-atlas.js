/* All the original picture panels the Academy owner was previously shown.
 * Panels are cropped VIEWS of four immutable original web images; no replacement imagery.
 * Coordinates are pixels in the source WebP and do not change the master files.
 */
(function(root){"use strict";
const base="assets/lecture-visuals/";
const sources=Object.freeze({
 detailed:{file:"ground-school-visuals-12-topic.webp",width:1214,height:1295,label:"Detailed twelve-topic learning sheet"},
 overview:{file:"aviation-learning-overview.webp",width:1536,height:1024,label:"Aviation illustrated learning overview"},
 photographs:{file:"aviation-real-world-photographs.webp",width:1536,height:1024,label:"Four original aviation study scenes"},
 cessna:{file:"illustrated-cessna-structures-lecture.webp",width:1536,height:1024,label:"Aircraft structures coursebook design"}
});
const detailedTitles=[
 ["Aircraft structure and flight controls","aircraft"],
 ["Aerodynamics and four forces","aerodynamics"],
 ["Six flight instruments","instruments"],
 ["Clouds and aviation meteorology","meteorology"],
 ["Charts and navigation","navigation"],
 ["Aircraft electrical, fuel and hydraulic systems","systems"],
 ["Radio communication","communications"],
 ["Aircraft weight and balance","performance"],
 ["Human factors and flight safety","human"],
 ["Helicopter cyclic, collective and rotor controls","rotorcraft"],
 ["Aviation safety management","orientation"],
 ["Flight planning and performance","airspace"]
];
const overviewTitles=[
 ["Aircraft structure and landing gear","aircraft"],
 ["Airfoil, angle of attack and airflow","aerodynamics"],
 ["Conventional six-pack instruments","instruments"],
 ["Cloud formations and thunderstorms","meteorology"],
 ["Compass, charts and navigation","navigation"],
 ["Aircraft communication radio stack","communications"],
 ["Aircraft systems and technical cutaway","systems"],
 ["Centre of gravity and weight distribution","performance"],
 ["Pilot workload and human factors","human"],
 ["Helicopter main rotor and controls","rotorcraft"],
 ["Safety reporting and hazard management","orientation"],
 ["Aircraft accident investigation steps","airspace"]
];
const scenes=[
 ["Flight instructor and student briefing","orientation",[0,0,765,510]],
 ["High-wing training aircraft on the apron","aircraft",[768,0,768,510]],
 ["Wing-section airflow research","aerodynamics",[0,512,765,512]],
 ["Avionics maintenance and electrical inspection","systems",[768,512,768,512]]
];
const cessnaDetails=[
 ["Detailed Cessna aircraft structure and surfaces","aircraft",[254,160,729,403]],
 ["Close views of ailerons, flaps, elevator and rudder","aircraft",[992,161,535,399]],
 ["Three aircraft movement axes","aerodynamics",[254,572,409,404]],
 ["Detailed trainer cockpit and instruments","instruments",[673,574,519,403]],
 ["Flight controls, key points and questions","aircraft",[1193,570,340,402]]
];
const items=[];
const columnA=[[4,4,309],[320,4,290],[618,4,267],[891,4,292]];
const rowA=[[0,414],[422,464],[892,323]];
detailedTitles.forEach(([name,moduleId],i)=>{
 const col=i%4,row=Math.floor(i/4),[x0,,w]=columnA[col],[y,h]=rowA[row];
 items.push({id:"detail-"+String(i+1).padStart(2,"0"),group:"detailed",source:"detailed",
  rect:[x0,y,w,h],title:name,moduleId,caption:"Original detailed training-sheet panel. Open its source sheet to compare the complete artwork."});
});
const columnsB=[[6,382],[395,370],[771,374],[1153,379]];
const rowsB=[[80,329],[415,299],[721,256]];
overviewTitles.forEach(([name,moduleId],i)=>{
 const col=i%4,row=Math.floor(i/4),[x,w]=columnsB[col],[y,h]=rowsB[row];
 items.push({id:"overview-"+String(i+1).padStart(2,"0"),group:"overview",source:"overview",
  rect:[x,y,w,h],title:name,moduleId,caption:"Original aviation illustrated-learning poster panel, enlarged without replacing the selected picture."});
});
scenes.forEach(([title,moduleId,rect],i)=>{
 items.push({id:"photo-"+String(i+1).padStart(2,"0"),group:"photographs",source:"photographs",
  rect,title,moduleId,caption:"An original image from the four-panel professional aviation concept collage."});
});
cessnaDetails.forEach(([title,moduleId,rect],i)=>{
 items.push({id:"cessna-"+String(i+1).padStart(2,"0"),group:"cessna",source:"cessna",
  rect,title,moduleId,caption:"An original detail from the Cessna illustrated coursebook concept. Diagrams and text are educational artwork."});
});
const sorted=Object.freeze(items.map(item=>Object.freeze({
 ...item,rect:Object.freeze(item.rect),src:base+sources[item.source].file,
 sourceWidth:sources[item.source].width,sourceHeight:sources[item.source].height,
 groupLabel:sources[item.source].label,
 alt:"Previously shown original Academy picture — "+item.title
})));
function getById(id){return sorted.find(item=>item.id===id)||null}
function byModule(moduleId){return Object.freeze(sorted.filter(item=>item.moduleId===moduleId))}
function byGroup(group){return Object.freeze(sorted.filter(item=>group==="all"||item.group===group))}
function validate(){
 if(sorted.length!==33||Object.keys(sources).length!==4)throw Error("All 33 original picture details must be indexed");
 const ids=new Set();
 for(const item of sorted){
  const [x,y,w,h]=item.rect;
  if(ids.has(item.id)||x<0||y<0||w<100||h<100||x+w>item.sourceWidth||y+h>item.sourceHeight||
    item.title.length<14||item.caption.length<30)throw Error("Invalid or duplicate original picture panel "+item.id);
  ids.add(item.id);
 }
 const counts=Object.fromEntries(Object.keys(sources).map(key=>[key,sorted.filter(x=>x.source===key).length]));
 if(counts.detailed!==12||counts.overview!==12||counts.photographs!==4||counts.cessna!==5)throw Error("Expected 12+12+4+5 original panel views");
 return Object.freeze({masterPictures:4,panelViews:33,groupCounts:counts});
}
const api=Object.freeze({sources,items:sorted,byGroup,byModule,getById,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAOriginalPictureAtlas=api;
})(typeof window!=="undefined"?window:null);
