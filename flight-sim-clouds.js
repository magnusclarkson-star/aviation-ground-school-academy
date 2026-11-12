/* Deterministic, shared simulated cloud layer for the Academy's WebGL
 * scenery and lightweight Canvas fallback. Clouds are world objects and move
 * downwind over simulated time, NOT objects tied to the aircraft/camera.
 * No real weather API, position or network data.
 */
(function(root){"use strict";
const cloudSeed=(index,salt)=>{
 const n=Math.sin(index*127.1+salt*311.9)*43758.5453;
 return n-Math.floor(n);
};
const clouds=Object.freeze(Array.from({length:35},(_,i)=>Object.freeze({
 id:"cloud-"+i,
 x:-4100+cloudSeed(i,1)*8200,
 y:760+cloudSeed(i,2)*580,
 z:480+cloudSeed(i,3)*9900,
 size:72+cloudSeed(i,4)*92
})));
function drift(time=0,windXMps=0,windZMps=0,reducedMotion=false){
 const t=reducedMotion?0:Math.max(0,Number.isFinite(time)?time:0);
 const wx=Number.isFinite(windXMps)?windXMps:0;
 const wz=Number.isFinite(windZMps)?windZMps:0;
 // Light background circulation is visual only. A real selected simulator
 // wind adds directional movement, without changing the flight model.
 return Object.freeze({x:t*(1.1+wx*.72),z:t*(.42+wz*.72)});
}
const api=Object.freeze({clouds,drift});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightClouds=api;
})(typeof window!=="undefined"?window:null);
