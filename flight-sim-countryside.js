/* Shared fictional rural landmarks for WebGL2 and lightweight phone Canvas.
 * Every crop patch and track segment has a fixed local X/Z position: no
 * GPS, satellite tiles, external images, per-frame randomness or camera
 * anchored objects. Repeating them in both renderers improves the feeling
 * of travelling through an actual world during a complete circuit.
 */
(function(root){"use strict";
const freeze=o=>Object.freeze(o);
const fields=freeze([
 {x:-1600,z:-2700,w:470,d:420,color:"#98a66d"},
 {x:-900,z:-2350,w:340,d:530,color:"#ada76e"},
 {x:650,z:-2700,w:410,d:440,color:"#9ba571"},
 {x:1190,z:-2050,w:500,d:330,color:"#b2a86d"},
 {x:-1700,z:-1280,w:610,d:490,color:"#8f9f6a"},
 {x:-970,z:-900,w:380,d:410,color:"#b0ae74"},
 {x:630,z:-1320,w:440,d:620,color:"#9da96e"},
 {x:1210,z:-670,w:450,d:500,color:"#ac9f66"},
 {x:-1560,z:-140,w:530,d:470,color:"#9caa73"},
 {x:-890,z:560,w:350,d:480,color:"#9eaa69"},
 {x:650,z:260,w:400,d:480,color:"#b5ab71"},
 {x:1220,z:570,w:490,d:420,color:"#899b67"},
 {x:-1650,z:1240,w:590,d:470,color:"#a0ab71"},
 {x:-920,z:1710,w:370,d:390,color:"#b3a26b"},
 {x:670,z:1540,w:440,d:520,color:"#92a56d"},
 {x:1210,z:2160,w:510,d:480,color:"#9eac75"},
 {x:-1650,z:2550,w:560,d:540,color:"#a2a96d"},
 {x:-850,z:2860,w:430,d:420,color:"#8fa56f"},
 {x:670,z:2860,w:480,d:410,color:"#b4a56c"},
 {x:1200,z:3200,w:510,d:460,color:"#98a572"}
].map(f=>freeze(f)));
const tracks=[];
for(const side of [-1,1]){
 for(let i=0;i<10;i++){
  const az=-3050+i*720,bz=az+720;
  const ax=side*(1070+65*Math.sin(i*.7+side));
  const bx=side*(1070+65*Math.sin((i+1)*.7+side));
  tracks.push(freeze({ax,az,bx,bz,widthM:11}));
 }
}
const farmTracks=freeze(tracks);
function terrainHeight(x,z){
 const edge=Math.max(0,Math.abs(x)-650),far=Math.max(0,z-2100);
 return Math.min(210,edge*.052+far*.015*(.55+.45*Math.sin(x*.002+z*.004)));
}
function trackCorners(track){
 const dx=track.bx-track.ax,dz=track.bz-track.az,len=Math.hypot(dx,dz)||1;
 const ox=-dz/len*track.widthM/2,oz=dx/len*track.widthM/2;
 return [[track.ax+ox,track.az+oz],[track.bx+ox,track.bz+oz],
  [track.bx-ox,track.bz-oz],[track.ax-ox,track.az-oz]];
}
const api=freeze({fields,farmTracks,terrainHeight,trackCorners});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSACountryside=api;
})(typeof window!=="undefined"?window:null);
