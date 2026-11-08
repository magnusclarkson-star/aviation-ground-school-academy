/* On-device replay of fictional data only. No network, no stored identity. */
(function(root){'use strict';
const metrics=[
 {key:'altitudeM',name:'HEIGHT',unit:'m',color:'#2a73be'},
 {key:'speedKt',name:'AIRSPEED',unit:'kt',color:'#198673'},
 {key:'bankDeg',name:'BANK',unit:'deg',color:'#b4772d'}
];
const finite=(v)=>typeof v==='number'&&Number.isFinite(v);
function prepare(observations){
 if(!Array.isArray(observations))return [];
 return observations.slice(0,600).map((sample,i)=>({
  t:finite(sample?.t)?sample.t:i,
  phase:typeof sample?.phase==='string'?sample.phase.slice(0,24):'unknown',
  ...Object.fromEntries(metrics.map(m=>[m.key,finite(sample?.[m.key])?sample[m.key]:null]))
 }));
}
function describe(rows,index){
 if(!rows.length)return 'No simulated samples recorded.';
 const i=Math.max(0,Math.min(rows.length-1,Math.trunc(Number(index)||0))),s=rows[i];
 const fmt=(key,unit)=>s[key]===null?'not recorded':s[key].toFixed(1)+' '+unit;
 return 'Sample '+(i+1)+' of '+rows.length+'; fictional time '+s.t.toFixed(1)+' seconds; phase '+s.phase+
 '; height '+fmt('altitudeM','m')+'; airspeed '+fmt('speedKt','kt')+'; bank '+fmt('bankDeg','degrees')+'.';
}
function draw(canvas,observations,index){
 const rows=prepare(observations);
 if(!canvas||!canvas.getContext)return rows;
 const ctx=canvas.getContext('2d');if(!ctx)return rows;
 const w=canvas.width,h=canvas.height;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#f9fbff';ctx.fillRect(0,0,w,h);
 if(!rows.length){ctx.fillStyle='#273e55';ctx.font='16px system-ui';ctx.fillText('No private samples to replay',18,35);return rows;}
 const left=90,right=w-22,top=18,band=(h-36)/metrics.length;
 metrics.forEach((m,n)=>{
  const y0=top+n*band,plotTop=y0+26,plotBottom=y0+band-18;
  const values=rows.map(s=>s[m.key]).filter(finite);
  if(!values.length)return;
  let lo=Math.min(...values),hi=Math.max(...values);if(lo===hi){lo-=1;hi+=1;}
  const x=i=>left+(right-left)*(rows.length===1?0:i/(rows.length-1));
  const y=v=>plotBottom-(v-lo)/(hi-lo)*(plotBottom-plotTop);
  ctx.fillStyle='#1c344b';ctx.font='bold 13px system-ui';ctx.fillText(m.name,10,y0+14);
  ctx.font='11px system-ui';ctx.fillText(hi.toFixed(1)+' '+m.unit,10,plotTop+10);
  ctx.fillText(lo.toFixed(1),10,plotBottom);
  ctx.strokeStyle='#d2dce8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,plotTop);ctx.lineTo(right,plotTop);ctx.moveTo(left,plotBottom);ctx.lineTo(right,plotBottom);ctx.stroke();
  ctx.beginPath();let moved=false;
  rows.forEach((s,i)=>{if(s[m.key]===null){moved=false;return;}if(!moved){ctx.moveTo(x(i),y(s[m.key]));moved=true;}else ctx.lineTo(x(i),y(s[m.key]));});
  ctx.strokeStyle=m.color;ctx.lineWidth=2.5;ctx.stroke();
  const k=Math.max(0,Math.min(rows.length-1,Math.trunc(Number(index)||0)));
  ctx.strokeStyle='#555e6c';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x(k),plotTop);ctx.lineTo(x(k),plotBottom);ctx.stroke();
  if(rows[k][m.key]!==null){ctx.beginPath();ctx.arc(x(k),y(rows[k][m.key]),4,0,2*Math.PI);ctx.fillStyle=m.color;ctx.fill();}
 });
 return rows;
}
const api={prepare,describe,draw};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.AGSAFlightReplay=api;
})(typeof window!=='undefined'?window:null);
