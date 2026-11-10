/* Moving airfield-service vehicles shared by 2D, WebGL and tests.
 * Synthetic fixed-world airport activity: purely visual, never collidable,
 * never controlled by the pilot and never based on location or real roads.
 */
(function(root){"use strict";
const TWO_PI=Math.PI*2;
const routes=Object.freeze([
 Object.freeze({id:"follow-me",kind:"service",color:"#f2b72e",
  x:-105,z:485,radiusX:18,radiusZ:280,periodSec:260,phase:0}),
 Object.freeze({id:"crew-shuttle",kind:"shuttle",color:"#6ea8d2",
  x:105,z:1050,radiusX:22,radiusZ:310,periodSec:310,phase:1.85})
]);
function pose(route,time=0,reducedMotion=false){
 const timeSec=Number.isFinite(time)?Math.max(0,time):0;
 const angle=(route.phase+(reducedMotion?0:timeSec)*TWO_PI/route.periodSec)%TWO_PI;
 const ca=Math.cos(angle),sa=Math.sin(angle);
 const x=route.x+route.radiusX*ca,z=route.z+route.radiusZ*sa;
 const dx=-route.radiusX*sa,dz=route.radiusZ*ca;
 return Object.freeze({id:route.id,kind:route.kind,color:route.color,
  x,z,headingRad:Math.atan2(dx,dz),timeSec:reducedMotion?0:timeSec});
}
function sample(time=0,reducedMotion=false){
 return routes.map(route=>pose(route,time,reducedMotion));
}
function roadSegments(route,steps=48){
 const n=Math.max(8,Math.min(96,Math.floor(Number.isFinite(steps)?steps:48)));
 const out=[];
 const point=(i,offset)=>{
  const p=i*TWO_PI/n;
  const x=route.x+route.radiusX*Math.cos(p),z=route.z+route.radiusZ*Math.sin(p);
  const dx=-route.radiusX*Math.sin(p),dz=route.radiusZ*Math.cos(p);
  const length=Math.hypot(dx,dz)||1;
  return [x+dz/length*offset,z-dx/length*offset];
 };
 for(let i=0;i<n;i++)
  out.push(Object.freeze([point(i,-3.2),point(i,3.2),
   point(i+1,3.2),point(i+1,-3.2)].map(Object.freeze)));
 return Object.freeze(out);
}
// Road strips are static; calculate the trigonometry once, not every phone frame.
const roadPolygons=Object.freeze(routes.flatMap(route=>roadSegments(route,48)));
const api=Object.freeze({routes,pose,sample,roadSegments,roadPolygons});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAAirfieldTraffic=api;
})(typeof window!=="undefined"?window:null);
