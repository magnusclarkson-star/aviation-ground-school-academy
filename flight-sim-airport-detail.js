/* Fictional apron / parked aircraft / approach-light props shared by 2D and 3D.
 * Synthetic local X/Z coordinates in metres, never real airport data.
 * This is a scenery study, not a chart, aerodrome layout, or procedure.
 */
(function(root){"use strict";
const freezeList=rows=>Object.freeze(rows.map(row=>Object.freeze({...row})));
const config=Object.freeze({
 runwayLengthM:1800,
 taxiway:freezeList([
  {ax:20,az:280,bx:220,bz:280,widthM:17},
  {ax:220,az:280,bx:220,bz:545,widthM:17},
  {ax:220,az:545,bx:185,bz:600,widthM:14}
 ]),
 apron:Object.freeze({left:124,right:368,near:306,far:704}),
 parkedTrainers:freezeList([
  {x:168,z:455,headingDeg:20,paint:"blue"},
  {x:290,z:590,headingDeg:-15,paint:"gold"}
 ]),
 serviceVehicles:freezeList([{x:324,z:395,paint:"yellow"},{x:325,z:648,paint:"white"}]),
 approachLights:freezeList([
  {x:0,z:-240},{x:0,z:-180},{x:0,z:-120},{x:0,z:-60},
  {x:-9,z:-120},{x:9,z:-120},{x:-9,z:-60},{x:9,z:-60}
 ]),
 rampLights:freezeList([{x:112,z:340},{x:360,z:340},{x:112,z:690},{x:360,z:690}]),
 holdLine:Object.freeze({ax:42,az:280,bx:42,bz:314})
});
function strip(ax,az,bx,bz,halfWidth,y=.14){
 if(![ax,az,bx,bz,halfWidth,y].every(Number.isFinite)||halfWidth<=0)return [];
 const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);
 if(len<=.001)return [];
 const nx=dz/len*halfWidth,nz=-dx/len*halfWidth;
 return [[ax+nx,y,az+nz],[ax-nx,y,az-nz],[bx-nx,y,bz-nz],[bx+nx,y,bz+nz]];
}
function aircraftFootprint(x,z,headingDeg=0){
 if(![x,z,headingDeg].every(Number.isFinite))return null;
 const yaw=headingDeg*Math.PI/180,forward=[Math.sin(yaw),Math.cos(yaw)],
 side=[Math.cos(yaw),-Math.sin(yaw)];
 const point=(ahead,across,y=.15)=>[
  x+ahead*forward[0]+across*side[0],y,
  z+ahead*forward[1]+across*side[1]
 ];
 return Object.freeze({
  spine:[point(-5,0),point(5,0)],
  wings:[point(-.1,-7),point(-.1,7)],
  tail:[point(-3.5,-2.7),point(-3.5,2.7)],
  nose:point(5,0)
 });
}
const api={config,strip,aircraftFootprint};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightAirportDetail=api;
})(typeof window!=="undefined"?window:null);
