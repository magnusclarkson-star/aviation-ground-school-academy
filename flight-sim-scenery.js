/* Animated vector airfield outside view, drawn locally without location/GPS,
 * live imagery, network access, terrain elevation data or aircraft certification.
 * Perspective scenery is an illustration, NOT a validated visual system.
 */
(function(root){"use strict";
const RAD=Math.PI/180;
function project(state,x,y,z,width=960,height=540){
 const dx=x-state.xM,dz=z-state.zM,yaw=state.headingDeg*RAD;
 const lateral=dx*Math.cos(yaw)-dz*Math.sin(yaw);
 const ahead=dx*Math.sin(yaw)+dz*Math.cos(yaw);
 const relativeY=y-state.altitudeM-2.2,pitch=state.pitchDeg*RAD;
 const heightAxis=relativeY*Math.cos(pitch)-ahead*Math.sin(pitch);
 const depth=relativeY*Math.sin(pitch)+ahead*Math.cos(pitch);
 if(depth<4)return null;
 const focal=height*1.2;
 return {x:width/2+lateral*focal/depth,y:height*.49-heightAxis*focal/depth,depth};
}
function draw(canvas,state,{reducedMotion=false,lighting="day"}={}){
 const palette=root?.AGSAFlightLighting?.choose?.(lighting)||{
  sky2d:["#175784","#78c4e0","#dceaf0"],clouds:"#e0f4f4a1",
  hills:"#587e85",grass:["#729576","#507c5c","#355f4b"]
 };
 const ctx=canvas?.getContext?.("2d");
 if(!ctx)return false;
 const width=canvas.width||960,height=canvas.height||540;
 const w=width,h=height;
 const sky=ctx.createLinearGradient(0,0,0,h);
 sky.addColorStop(0,palette.sky2d[0]);sky.addColorStop(.55,palette.sky2d[1]);sky.addColorStop(1,palette.sky2d[2]);
 ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 ctx.save();
 ctx.translate(w/2,h/2);
 ctx.rotate(-state.rollDeg*RAD);
 ctx.translate(-w/2,-h/2);
 const horizon=h*.49+Math.tan(state.pitchDeg*RAD)*h*1.2;
 // Clouds and remote hills drift slowly as the heading changes, with a
 // smaller parallax effect than the foreground runway and roadside trees.
 const cloudOffset=state.headingDeg*3+(reducedMotion?0:state.zM*.008);
 for(let i=-2;i<7;i++){
  const x=((i*227+138-cloudOffset)%(w+460)+w+460)%(w+460)-120;
  const y=horizon-130-(i%3)*33+(reducedMotion?0:Math.sin(state.time*.1+i)*4);
  ctx.fillStyle=palette.clouds;
  ctx.beginPath();
  ctx.ellipse(x,y,68,13,0,0,Math.PI*2);
  ctx.ellipse(x+32,y-11,42,18,0,0,Math.PI*2);
  ctx.ellipse(x-23,y-9,36,15,0,0,Math.PI*2);
  ctx.fill();
 }
 ctx.fillStyle=palette.hills;
 ctx.beginPath();ctx.moveTo(-w,horizon+30);
 for(let i=0;i<=24;i++){
  const x=-w+i*(3*w/24);
  const ridge=26*Math.sin(i*.64+state.headingDeg*.018)+21*Math.sin(i*1.22+2);
  ctx.lineTo(x,horizon-20+ridge);
 }
 ctx.lineTo(w*3,h*2);ctx.lineTo(-w,h*2);ctx.fill();
 const grass=ctx.createLinearGradient(0,horizon,0,h*2);
 grass.addColorStop(0,palette.grass[0]);grass.addColorStop(.5,palette.grass[1]);grass.addColorStop(1,palette.grass[2]);
 ctx.fillStyle=grass;ctx.fillRect(-w,horizon,w*3,h*3);
 // Alternating foreground field bands and a few roadside features use
 // projection, making forward movement visually observable without photos.
 function poly(points,color,stroke=null,lineWidth=1){
  const pts=points.map(q=>project(state,q[0],q[1],q[2],w,h));
  if(pts.some(p=>!p))return false;
  if(pts.every(p=>p.x<-w||p.x>2*w||p.y<-h||p.y>2*h))return false;
  ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
  ctx.fillStyle=color;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke()}
  return true;
 }
 function line(a,b,color,widthPx=2){
  const A=project(state,...a,w,h),B=project(state,...b,w,h);
  if(!A||!B)return;
  ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);
  ctx.strokeStyle=color;ctx.lineWidth=widthPx;ctx.stroke();
 }
 for(let z=3000;z>=-3000;z-=150){
  const alternate=Math.floor(z/150)%2===0;
  const shade=alternate?"#8baa7950":"#b1bf7d30";
  poly([[-800,0,z],[-70,0,z],[-70,0,z+75],[-800,0,z+75]],shade);
  poly([[70,0,z],[800,0,z],[800,0,z+75],[70,0,z+75]],shade);
 }
 if(state.mode==="helicopter"){
  // Distinct rotorcraft scenario: an abstract helipad, never a real-world
  // helipad marking or airport data.
  const sides=12,outer=[];
  for(let i=0;i<sides;i++){
   const theta=i*2*Math.PI/sides;
   outer.push([33*Math.cos(theta),0,33*Math.sin(theta)]);
  }
  poly(outer,"#303d48","#eef6d9",4);
  for(let i=0;i<sides;i++){
   const a=outer[i],b=outer[(i+1)%sides];
   line([a[0]*.82,.08,a[2]*.82],[b[0]*.82,.08,b[2]*.82],"#f2d274",4);
  }
  // Enclosed H on the helipad plane.
  for(const x of [-8,8])line([x,.15,-12],[x,.15,12],"#f6f8ef",8);
  line([-8,.15,0],[8,.15,0],"#f6f8ef",8);
  for(let i=0;i<20;i++){
   const angle=i*2*Math.PI/20;
   const x=140*Math.cos(angle),z=140*Math.sin(angle);
   const tree=project(state,x,0,z,w,h);
   if(!tree||tree.depth>2000||tree.y<0||tree.y>h*1.5)continue;
   const r=Math.min(35,350/tree.depth);
   ctx.fillStyle="#284f38";
   ctx.beginPath();ctx.arc(tree.x,tree.y-r*.9,r,0,Math.PI*2);ctx.fill();
  }
 }else{
  // A 1,800 metre fictional strip; segments far-to-near create a
  // single-perspective runway and animated centre line.
  for(let z=1800;z>=-120;z-=60){
   const far=z+60,near=z;
   if(near<state.zM+7||far>2000)continue;
   poly([[-20,0,near],[20,0,near],[20,0,far],[-20,0,far]],
    Math.floor(z/60)%2?"#4f5a61":"#535e64");
   line([-20,.1,near],[-20,.1,far],"#eef3e2",3);
   line([20,.1,near],[20,.1,far],"#eef3e2",3);
   if((z>=70&&z<1740)&&Math.floor(z/60)%2===0)
    poly([[-1.2,.15,near+11],[1.2,.15,near+11],[1.2,.15,near+42],[-1.2,.15,near+42]],"#f5f5e3");
  }
  // Threshold bars and number-like symbols are intentionally fictional.
  for(const threshold of [0,1750]){
   for(const x of [-15,-10,-5,5,10,15]){
    poly([[x-1.4,.2,threshold+8],[x+1.4,.2,threshold+8],
     [x+1.4,.2,threshold+25],[x-1.4,.2,threshold+25]],"#eaf4dd");
   }
  }
  for(let z=1800;z>=0;z-=120){
   for(const x of [-24,24]){
    const p=project(state,x,.4,z,w,h);
    if(!p||p.depth>1900||p.x<-20||p.x>w+20||p.y<0||p.y>h)continue;
    const r=Math.min(5,260/p.depth+1);
    ctx.fillStyle="#ffe6a3";ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
   }
  }
  // Lightweight tropical trees, fences and hangars form a moving horizon.
  for(let z=2600;z>=-950;z-=87){
   if(z<state.zM+6)continue;
   for(const side of [-1,1]){
    const seed=Math.sin(z*.18+side*5.6);
    const x=side*(90+Math.abs(seed)*145),p=project(state,x,0,z,w,h);
    if(!p||p.depth>2100||p.y<0||p.y>h+55||p.x<-25||p.x>w+25)continue;
    const heightPx=Math.min(125,4200/p.depth)*(0.7+Math.abs(seed)*.6);
    const crown=Math.max(2,heightPx*.35);
    ctx.fillStyle="#503e31";
    ctx.fillRect(p.x-1.6,p.y-heightPx*.72,3.2,heightPx*.72);
    ctx.fillStyle=side===1?"#31573f":"#386c47";
    ctx.beginPath();ctx.ellipse(p.x,p.y-heightPx*.9,crown,crown*.75,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#4d7d4f7a";ctx.beginPath();ctx.arc(p.x-crown*.3,p.y-heightPx,crown*.55,0,Math.PI*2);ctx.fill();
   }
  }
  // Simple shaded buildings provide a 3D depth cue beside the runway.
  // The positions are synthetic and unrelated to any real-world airport.
  for(const [x,z,top] of [[125,410,11],[-185,960,14],[125,1510,9]]){
   const x2=x+53,z2=z+78;
   poly([[x,0,z],[x2,0,z],[x2,top,z],[x,top,z]],"#536778");
   poly([[x2,0,z],[x2,0,z2],[x2,top,z2],[x2,top,z]],"#364e5e");
   poly([[x,top,z],[x2,top,z],[x2,top,z2],[x,top,z2]],"#b5c7d0");
   poly([[x,top,z],[x2,top,z],[x2,top+4,z+28],[x,top+4,z+28]],"#c2d0d3");
  }
  // Procedural windsocks point *downwind*. Their physical geometry is an
  // educational illustration, not a meteorological measurement.
  for(const [x,z] of [[55,170],[-58,1000]]){
   const windX=Number.isFinite(state.windXMps)?state.windXMps:0;
   const windZ=Number.isFinite(state.windZMps)?state.windZMps:0;
   const strength=Math.hypot(windX,windZ),scale=strength>.25?7/strength:0;
   const endX=x+windX*scale,endZ=z+windZ*scale;
   const peak=12;
   line([x,0,z],[x,peak,z],"#e1e2da",3);
   // Staggered triangular fabric sections approximate a windsock in depth.
   if(strength>.25){
    for(let i=0;i<4;i++){
     const k=i/4,n=(i+1)/4;
     const wide=Math.max(.3,1.4*(1-k));
     const narrow=Math.max(.15,1.4*(1-n));
     const x0=x+(endX-x)*k,z0=z+(endZ-z)*k;
     const x1=x+(endX-x)*n,z1=z+(endZ-z)*n;
     poly([[x0,peak+wide,z0],[x0,peak-wide,z0],
      [x1,peak-narrow,z1],[x1,peak+narrow,z1]],
      i%2?"#f9e5df":"#dd644e");
    }
   }else{
    line([x,peak,z],[x+.6,peak-4,z+1],"#df6652",4);
   }
  }
 }
 ctx.restore();
 // Fixed airframe reference cue and non-certified horizon tick marks.
 ctx.strokeStyle="#ffffffc4";ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(w*.43,h*.53);ctx.lineTo(w*.485,h*.53);
 ctx.moveTo(w*.515,h*.53);ctx.lineTo(w*.57,h*.53);
 ctx.moveTo(w*.5,h*.515);ctx.lineTo(w*.5,h*.555);ctx.stroke();
 ctx.strokeStyle="#ffffff45";ctx.lineWidth=1;
 for(const x of [.1,.9]){
  ctx.beginPath();ctx.moveTo(w*x,h*.1);ctx.lineTo(w*x,h*.9);ctx.stroke();
 }
 return true;
}
const api={project,draw};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightScenery=api;
})(typeof window!=="undefined"?window:null);
