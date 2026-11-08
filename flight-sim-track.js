/* Private bird's-eye illustration of a fictional replay trace.
 * Local simulator X/Z metres only: not GPS, a chart, or geographic navigation.
 */
(function(root){'use strict';
const LIMIT=600;
const coordinate=(v)=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=100000?v:null;
function prepare(observations){
 if(!Array.isArray(observations))return [];
 return observations.slice(0,LIMIT).map((s,i)=>({
  index:i,
  x:coordinate(s?.lateralM),
  z:coordinate(s?.forwardM),
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
  ' m lateral and '+round(current.z-first.z)+' m forward relative to the first recorded position. Not a GPS location or measured flight path.';
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
 if(chosen&&chosen.x!==null&&chosen.z!==null)dot(chosen,7,'#9d2e75');
 ctx.fillStyle='#233e57';ctx.fillText('Start ●   End ●   Selected ●',14,h-10);
 return {available:true,count:valid.length,description:describe(points,idx)};
}
const api={prepare,describe,draw,LIMIT};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.AGSAFlightTrack=api;
})(typeof window!=='undefined'?window:null);
