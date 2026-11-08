/* Private bird's-eye illustration of a fictional replay trace.
 * Local simulator X/Z metres only: not GPS, a chart, or geographic navigation.
 */
(function(root){'use strict';
const LIMIT=600;
const coordinate=(v)=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=100000?v:null;
const heading=(v)=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=3600?((v%360)+360)%360:null;
const PHASES=Object.freeze({
 roll:'Runway roll — the fictional aircraft is moving along the simulated ground.',
 climb:'Climb — the fictional simulation indicates upward flight.',
 flight:'Free flight — observe fictional position and instrument trends.',
 approach:'Approach — the simulator depicts a runway arrival, not a real procedure.',
 rollout:'Rollout — the simulator depicts ground movement after its touchdown cue.',
 complete:'Exercise complete — replay the previous synthetic observations.',
 halted:'Exercise halted — the fictional model has stopped progression.',
 pad:'Helipad ready — conceptual rotorcraft begins on its imaginary landing area.',
 lift:'Lift — the simplified rotorcraft model is moving upward.',
 hover:'Hover — the simplified rotorcraft model depicts low-speed airborne position.',
 landed:'Helipad landed — the fictional rotorcraft is back on the simulated ground.'
});
function phaseExplanation(value){return PHASES[value]||'Unknown phase — this recording does not contain a recognized fictional phase.';}

function prepare(observations){
 if(!Array.isArray(observations))return [];
 return observations.slice(0,LIMIT).map((s,i)=>({
  index:i,
  x:coordinate(s?.lateralM),
  z:coordinate(s?.forwardM),
  headingDeg:heading(s?.headingDeg),
  phase:typeof s?.phase==='string'?s.phase.slice(0,24):'unknown'
 }));
}
function describe(points,index){
 const usable=points.filter(p=>p.x!==null&&p.z!==null);
 if(!usable.length)return 'No local X/Z position samples. Older synthetic traces may not include forward position.';
 const i=Math.min(Math.max(0,Math.trunc(Number(index)||0)),points.length-1);
 const current=points[i];
 if(!current||current.x===null||current.z===null)return 'Selected replay sample has no usable synthetic position.';
 const first=usable[0];
 const round=n=>(Math.round(n*10)/10).toFixed(1);
 return 'Bird’s-eye fictional position, sample '+(i+1)+': '+round(current.x-first.x)+
  ' m lateral and '+round(current.z-first.z)+' m forward relative to the first recorded position. '+
  'Recorded fictional heading: '+(current.headingDeg===null?'not available':round(current.headingDeg)+' degrees')+'. '+
  'Phase: '+phaseExplanation(current.phase)+' Not a GPS location or measured flight path.';
}
// A local top-down aircraft glyph; 0° points toward +Z (top of chart).
// Avoid image files, font glyphs and canvas transforms for consistent phones.
function drawAircraft(ctx,p,headingDeg){
 if(headingDeg===null)return false;
 const r=headingDeg*Math.PI/180,forward={x:Math.sin(r),y:-Math.cos(r)};
 const side={x:-forward.y,y:forward.x};
 const at=(ahead,across)=>({x:p.x+forward.x*ahead+side.x*across,y:p.y+forward.y*ahead+side.y*across});
 const shape=[[15,0],[0,4],[-3,12],[-6,12],[-3,3],[-12,3],[-13,6],[-15,6],[-15,-6],[-13,-6],[-12,-3],[-3,-3],[-6,-12],[-3,-12],[0,-4]];
 const first=at(shape[0][0],shape[0][1]);ctx.beginPath();ctx.moveTo(first.x,first.y);
 for(let i=1;i<shape.length;i++){const q=at(shape[i][0],shape[i][1]);ctx.lineTo(q.x,q.y);}
 ctx.lineTo(first.x,first.y);
 ctx.fillStyle='#9d2e75';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
 return true;
}
function draw(canvas,observations,index){
 const points=prepare(observations),valid=points.filter(p=>p.x!==null&&p.z!==null);
 if(!canvas?.getContext)return {available:valid.length>0,count:valid.length,description:describe(points,index)};
 const ctx=canvas.getContext('2d');if(!ctx)return {available:valid.length>0,count:valid.length,description:describe(points,index)};
 const w=canvas.width,h=canvas.height;
 ctx.clearRect(0,0,w,h);
 ctx.fillStyle='#f6faff';ctx.fillRect(0,0,w,h);
 ctx.font='13px system-ui';ctx.fillStyle='#1e354a';
 ctx.fillText('FICTIONAL TOP-DOWN X/Z TRACK · NO GPS',14,24);
 if(!valid.length){ctx.fillText('No synthetic X/Z coordinates available to plot.',14,59);return {available:false,count:0,description:describe(points,index)};}
 const xs=valid.map(p=>p.x),zs=valid.map(p=>p.z);
 const left=Math.min(...xs),right=Math.max(...xs),near=Math.min(...zs),far=Math.max(...zs);
 const centerX=(left+right)/2,centerZ=(near+far)/2;
 const spanX=Math.max(10,right-left),spanZ=Math.max(10,far-near);
 const scale=Math.min((w-90)/spanX,(h-115)/spanZ);
 const project=p=>({x:w/2+(p.x-centerX)*scale,y:(h+35)/2-(p.z-centerZ)*scale});
 ctx.strokeStyle='#c4d4e5';ctx.lineWidth=1;
 ctx.beginPath();ctx.moveTo(38,44);ctx.lineTo(38,h-33);ctx.lineTo(w-20,h-33);ctx.stroke();
 ctx.fillStyle='#334f69';ctx.fillText('Forward (Z)',44,57);ctx.fillText('Lateral (X) →',Math.max(40,w-145),h-11);
 ctx.beginPath();let drawing=false,prior=null;
 for(const p of points){
  if(p.x===null||p.z===null){drawing=false;prior=null;continue;}
  const at=project(p);
  if(!drawing){ctx.moveTo(at.x,at.y);drawing=true;}else ctx.lineTo(at.x,at.y);
  prior=at;
 }
 ctx.strokeStyle='#16739f';ctx.lineWidth=3;ctx.stroke();
 const dot=(p,r,color)=>{
  const q=project(p);ctx.beginPath();ctx.arc(q.x,q.y,r,0,2*Math.PI);
  ctx.fillStyle=color;ctx.fill();
 };
 dot(valid[0],5,'#147553');
 dot(valid[valid.length-1],5,'#9a591c');
 const idx=Math.max(0,Math.min(points.length-1,Math.trunc(Number(index)||0)));
 const chosen=points[idx];
 if(chosen&&chosen.x!==null&&chosen.z!==null){
  const q=project(chosen);
  if(!drawAircraft(ctx,q,chosen.headingDeg))dot(chosen,7,'#9d2e75');
 }
 ctx.fillStyle='#233e57';ctx.fillText('Start ●   End ●   Selected ✈',14,h-10);
 return {available:true,count:valid.length,description:describe(points,idx)};
}
const api={prepare,describe,draw,drawAircraft,phaseExplanation,LIMIT};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.AGSAFlightTrack=api;
})(typeof window!=='undefined'?window:null);
