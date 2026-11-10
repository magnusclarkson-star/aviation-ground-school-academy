/* Animated vector airfield outside view, drawn locally without location/GPS,
 * live imagery, network access, terrain elevation data or aircraft certification.
 * Perspective scenery is an illustration, NOT a validated visual system.
 */
(function(root){"use strict";
const RAD=Math.PI/180;
// Trees belong to fixed world columns, never camera-relative offsets.
// The index changes only as the pilot travels; shared columns retain the
// exact same X coordinate, colour and size as they enter/leave the frame.
const TREE_SPACING_M=260;
const treeColumnAt=x=>Math.round((Number.isFinite(x)?x:0)/TREE_SPACING_M);
const treeWorldX=(column,z)=>column*TREE_SPACING_M+
 Math.sin(z*.091+column*9.2)*51;
const Airport=root?.AGSAFlightAirportDetail||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-airport-detail.js"):null);
const PadDetail=root?.AGSAHelipadDetail||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-helipad-detail.js"):null);
const Countryside=root?.AGSACountryside||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-countryside.js"):null);
const Traffic=root?.AGSAAirfieldTraffic||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-ground-traffic.js"):null);
const Windsocks=root?.AGSAFlightWindsocks||
 (typeof module!=="undefined"&&module.exports&&typeof require==="function"?
 require("./flight-sim-windsocks.js"):null);

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
function draw(canvas,state,{reducedMotion=false,lighting="day",view="cockpit",airframeId=null,animation={}}={}){
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
 function lamp(x,y,r,color="#ffe6a3",cool=false){
  const radius=Math.max(1,r);
  if(lighting==="golden"||lighting==="dusk"){
   const glow=ctx.createRadialGradient(x,y,0,x,y,radius*(lighting==="dusk"?6:4));
   const core=cool?"rgba(133,232,246,.65)":"rgba(255,224,162,.70)";
   glow.addColorStop(0,core);
   glow.addColorStop(.28,cool?"rgba(131,222,239,.23)":"rgba(255,201,107,.22)");
   glow.addColorStop(1,"rgba(255,214,137,0)");
   ctx.fillStyle=glow;ctx.beginPath();
   ctx.arc(x,y,radius*(lighting==="dusk"?6:4),0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
 }
 ctx.save();
 ctx.translate(w/2,h/2);
 ctx.rotate(-state.rollDeg*RAD);
 ctx.translate(-w/2,-h/2);
 const horizon=h*.49+Math.tan(state.pitchDeg*RAD)*h*1.2;
 // Clouds and remote hills drift slowly as the heading changes, with a
 // smaller parallax effect than the foreground runway and roadside trees.
 // Real positional parallax continues even with reduced motion enabled;
 // only synthetic time-based cloud bobbing is suppressed in that mode.
 const cloudOffset=state.headingDeg*3+state.xM*.012+state.zM*.008;
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
  const ridge=26*Math.sin(i*.64+state.headingDeg*.018+state.xM*.0005)+
   21*Math.sin(i*1.22+2+state.zM*.00012);
  ctx.lineTo(x,horizon-20+ridge);
 }
 ctx.lineTo(w*3,h*2);ctx.lineTo(-w,h*2);ctx.fill();
 const grass=ctx.createLinearGradient(0,horizon,0,h*2);
 grass.addColorStop(0,palette.grass[0]);grass.addColorStop(.5,palette.grass[1]);grass.addColorStop(1,palette.grass[2]);
 ctx.fillStyle=grass;ctx.fillRect(-w,horizon,w*3,h*3);
 // Shared fictitious airport detail draws on the same local X/Z axes as 3D.
 // Buildings and parked vehicles do not move, but the view changes as the
 // learner flies, creating parallax and depth without any live location data.
 function drawAirportDetails(){
  if(!Airport)return false;
  const {config,strip,aircraftFootprint}=Airport;
  const a=config.apron;
  poly([[a.left,.1,a.near],[a.right,.1,a.near],
   [a.right,.1,a.far],[a.left,.1,a.far]],"#65737a");
  for(const road of config.taxiway){
   const {ax,az,bx,bz,widthM}=road;
   const surface=strip(ax,az,bx,bz,widthM/2,.18);
   if(surface.length===4)poly(surface,"#57636c");
   const lineShape=strip(ax,az,bx,bz,.38,.22);
   if(lineShape.length===4)poly(lineShape,"#f0d470");
  }
  const mark=config.holdLine;
  const hold=strip(mark.ax,mark.az,mark.bx,mark.bz,.7,.24);
  if(hold.length===4)poly(hold,"#f1ca5b");
  for(const parked of config.parkedTrainers){
   const shape=aircraftFootprint(parked.x,parked.z,parked.headingDeg);
   if(!shape)continue;
   const color=parked.paint==="gold"?"#e8bd73":"#89c1e7";
   const [a,b]=shape.spine,[wl,wr]=shape.wings,[tl,tr]=shape.tail;
   poly(strip(a[0],a[2],b[0],b[2],.8,.9),"#f3f2e8");
   poly(strip(wl[0],wl[2],wr[0],wr[2],.75,1.0),color);
   poly(strip(tl[0],tl[2],tr[0],tr[2],.4,1.1),color);
  }
  for(const truck of config.serviceVehicles){
   const color=truck.paint==="yellow"?"#e8bb70":"#e7e9e2";
   const x=truck.x,z=truck.z;
   poly([[x-2,1.3,z-3],[x+2,1.3,z-3],[x+2,1.3,z+3],[x-2,1.3,z+3]],color);
   poly([[x-1.7,3,z],[x+1.7,3,z],[x+1.7,3,z+2.3],[x-1.7,3,z+2.3]],"#9bb4c3");
  }
  for(const light of config.approachLights){
   const p=project(state,light.x,.18,light.z,w,h);
   if(!p||p.depth>2100||p.x<0||p.x>w||p.y<0||p.y>h)continue;
   // A slightly larger daylit lens stays distinguishable on phone
   // screens even from the far side of the base-to-final turn.
   const r=Math.max(2,Math.min(5,260/p.depth+1.5));
   lamp(p.x,p.y,r,"#ffe8b6");
  }
  for(const light of config.rampLights){
   line([light.x,0,light.z],[light.x,12,light.z],"#9fb5bd",2);
   const p=project(state,light.x,12,light.z,w,h);
   if(!p||p.depth>1800||p.x<0||p.x>w||p.y<0||p.y>h)continue;
   lamp(p.x,p.y,Math.min(5,260/p.depth+1),"#ffe6ad");
  }
  return true;
 }
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
 // Keep scenery bands around the aircraft, not limited to the first
 // three kilometres from the field. This allows a full out-and-back circuit.
 const farBand=Math.ceil((state.zM+3000)/150)*150;
 for(let z=farBand;z>=state.zM-3000;z-=150){
  const alternate=Math.floor(z/150)%2===0;
  const shade=alternate?"#8baa7950":"#b1bf7d30";
  poly([[-800,0,z],[-70,0,z],[-70,0,z+75],[-800,0,z+75]],shade);
  poly([[70,0,z],[800,0,z],[800,0,z+75],[70,0,z+75]],shade);
 }
 // Light-grey service routes match the WebGL geometry, remain attached
 // to airport ground and never slide with the camera or a phone gesture.
 for(const road of Traffic.roadPolygons)
  poly(road.map(([x,z])=>[x,.19,z]),"#606464");
 // Country lanes and planted fields sit in persistent world coordinates.
 // They drift across the phone windscreen because the airplane moves, not
 // because a decorative scrolling image is attached to the camera.
 if(Countryside){
  const heightAt=(x,z)=>Countryside.terrainHeight(x,z)+.14;
  for(const field of Countryside.fields){
   if(Math.abs(field.z-state.zM)>3600)continue;
   const {x,z,w:fw,d,color}=field;
   poly([[x,heightAt(x,z),z],[x+fw,heightAt(x+fw,z),z],
    [x+fw,heightAt(x+fw,z+d),z+d],[x,heightAt(x,z+d),z+d]],color);
  }
  for(const farmRoad of Countryside.farmTracks){
   if(Math.abs(farmRoad.az-state.zM)>3600)continue;
   const corners=Countryside.trackCorners(farmRoad);
   poly(corners.map(([x,z])=>[x,heightAt(x,z)+.02,z]),"#9b8d6c");
  }
  // Nearby hedges change size and position with the actual aircraft,
  // providing strong parallax even on the lightweight Android fallback.
  for(const hedge of Countryside.hedgerows){
   if(Math.abs(hedge.z-state.zM)>3600)continue;
   const {x,z,w,d,h,color}=hedge;
   const y=Countryside.terrainHeight(x,z)+.14;
   poly([[x,y+h,z],[x+w,y+h,z],[x+w,y+h,z+d],[x,y+h,z+d]],color);
   poly([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],"#375b3d");
  }
  // Raised pitched-roof farm buildings use the exact same fixed X/Z
  // coordinates, dimensions and wall/roof colours as WebGL2.
  for(const farm of Countryside.farmsteads){
   if(Math.abs(farm.z-state.zM)>3600)continue;
   const {x,z,w,d,h,wall,roof}=farm,y=Countryside.terrainHeight(x,z)+.14;
   const peak=y+h+Math.min(w,d)*.27;
   poly([[x,y+h,z],[x+w,y+h,z],[x+w,y,z],[x,y,z]],wall);
   poly([[x,y+h,z],[x+w/2,peak,z],
    [x+w/2,peak,z+d],[x,y+h,z+d]],roof);
   poly([[x+w/2,peak,z],[x+w,y+h,z],
    [x+w,y+h,z+d],[x+w/2,peak,z+d]],"#76564e");
  }
  // Project the SAME fixed tower footprints as WebGL, so the distinctive
  // silhouettes actually slide past as the aircraft flies or banks.
  for(const tower of Countryside.towers){
   if(Math.abs(tower.z-state.zM)>3600)continue;
   const {x,z,height:ht,radius:r,color}=tower;
   const y=Countryside.terrainHeight(x,z);
   for(const sx of [-.7,.7])for(const sz of [-.7,.7])
    line([x+sx*r,y,z+sz*r],[x+sx*r,y+ht*.72,z+sz*r],"#526667",2);
   poly([[x-r,y+ht*.7,z-r],[x+r,y+ht*.7,z-r],
    [x+r,y+ht*.95,z-r],[x-r,y+ht*.95,z-r]],color);
   poly([[x-r,y+ht*.95,z-r],[x+r,y+ht*.95,z-r],
    [x+r,y+ht*.95,z+r],[x-r,y+ht*.95,z+r]],"#d7dfd4");
   line([x,y+ht*.96,z],[x,y+ht*1.18,z],"#61777a",2);
  }
 }
 if(state.mode==="helicopter"){
  // A shared fixed X/Z environment matches the 3D helipad geometry. Every
  // projected reference responds to aircraft drift and heading changes.
  if(PadDetail)for(const a of PadDetail.hardstands){
   poly([[a.x,.13,a.z],[a.x+a.w,.13,a.z],
    [a.x+a.w,.13,a.z+a.d],[a.x,.13,a.z+a.d]],a.color);
  }
  // Distinct rotorcraft scenario: an abstract helipad, never a real-world
  // helipad marking or airport data.
  const sides=12,outer=[];
  for(let i=0;i<sides;i++){
   const theta=i*2*Math.PI/sides;
   outer.push([30*Math.cos(theta),0,30*Math.sin(theta)]);
  }
  poly(outer,"#303d48","#eef6d9",4);
  for(let i=0;i<sides;i++){
   const a=outer[i],b=outer[(i+1)%sides];
   line([a[0]*.9,.08,a[2]*.9],[b[0]*.9,.08,b[2]*.9],"#f2d274",4);
  }
  // Enclosed H on the helipad plane.
  for(const x of [-8,8])line([x,.15,-12],[x,.15,12],"#f6f8ef",8);
  line([-8,.15,0],[8,.15,0],"#f6f8ef",8);
  if(PadDetail){
   for(const radius of PadDetail.rings){
    const shade=radius<12?"#80dfe4":"#eef1dd";
    for(const segment of PadDetail.ringSegments(radius))
     line([segment.ax,.18,segment.az],[segment.bx,.18,segment.bz],shade,2);
   }
   for(const mark of PadDetail.referenceLines)
    line([mark.ax,.18,mark.az],[mark.bx,.18,mark.bz],mark.color,3);
   for(const p of PadDetail.pylons){
    poly([[p.x-1.3,.17,p.z-1.3],[p.x+1.3,.17,p.z-1.3],
     [p.x+1.3,.17,p.z+1.3],[p.x-1.3,.17,p.z+1.3]],"#e9e9cc");
    line([p.x,.34,p.z],[p.x,p.height+.4,p.z],"#758389",4);
    const cap=project(state,p.x,p.height+.4,p.z,w,h);
    if(cap&&cap.depth<2100&&cap.x>-20&&cap.x<w+20&&cap.y>-20&&cap.y<h+20){
     const radius=Math.min(10,Math.max(3,180/cap.depth));
     lamp(cap.x,cap.y,radius,p.color,p.color==="#80dfe4");
    }
   }
   for(const b of PadDetail.buildings){
    poly([[b.x,0,b.z],[b.x+b.w,0,b.z],
     [b.x+b.w,b.h,b.z],[b.x,b.h,b.z]],b.color);
    poly([[b.x+b.w,0,b.z],[b.x+b.w,0,b.z+b.d],
     [b.x+b.w,b.h,b.z+b.d],[b.x+b.w,b.h,b.z]],"#425966");
    poly([[b.x,b.h,b.z],[b.x+b.w,b.h,b.z],
     [b.x+b.w,b.h,b.z+b.d],[b.x,b.h,b.z+b.d]],b.roof);
   }
   const posts=PadDetail.fence;
   for(let i=0;i<posts.length;i++){
    const p=posts[i];
    line([p.x,0,p.z],[p.x,p.height,p.z],"#b9c9bf",2);
    if(i<posts.length-1){
     const q=posts[i+1];
     for(const height of [1.3,2.7])
      line([p.x,height,p.z],[q.x,height,q.z],"#9faeaa",2);
    }
   }
  }
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
  // Draw the 1,800 m runway in camera-depth order, not just increasing
  // world-Z order. The previous northbound-only cull removed the entire
  // runway when returning south from the far end of the circuit.
  // project()/poly() already reject geometry behind the selected view.
  const northbound=Math.cos(state.headingDeg*RAD)>=0;
  for(let segment=0;segment<=32;segment++){
   const z=(northbound?1800:-120)+(northbound?-60:60)*segment;
   const far=z+60,near=z;
   poly([[-20,0,near],[20,0,near],[20,0,far],[-20,0,far]],
    Math.floor(z/60)%2?"#4f5a61":"#535e64");
   line([-20,.1,near],[-20,.1,far],"#eef3e2",3);
   line([20,.1,near],[20,.1,far],"#eef3e2",3);
   if((z>=70&&z<1740)&&Math.floor(z/60)%2===0)
    poly([[-1.2,.15,near+11],[1.2,.15,near+11],[1.2,.15,near+42],[-1.2,.15,near+42]],"#f5f5e3");
  }
  // Match the WebGL strip's depth cues on phones using Canvas 2D.
  // Every mark is world-projected, so it moves with the aircraft rather
  // than staying fixed on the glass cockpit display.
  for(let z=0;z<1800;z+=90){
   for(const x of [-23,20.4])
    poly([[x,.06,z],[x+2.6,.06,z],[x+2.6,.06,z+90],[x,.06,z+90]],"#39454d");
   if(z>0&&z<1750)for(const x of [-17,5.5])
    poly([[x,.075,z-.12],[x+11.5,.075,z-.12],
     [x+11.5,.075,z+.12],[x,.075,z+.12]],"#485359");
  }
  for(const end of [0,1800]){
   for(const distance of [130,270,430]){
    const z=end===0?distance:1800-distance-18;
    for(const x of [-12.5,10])
     poly([[x,.115,z],[x+2.5,.115,z],
      [x+2.5,.115,z+18],[x,.115,z+18]],"#cfdad4");
   }
   for(let i=0;i<9;i++){
    const distance=82+i*29,z=end===0?distance:1800-distance-12;
    for(const x of [-6.9,5.3]){
     const shift=(Math.sin(i*11+x)*.5)*.65;
     poly([[x+shift,.105,z],[x+shift+1.2,.105,z],
      [x+shift+1.2,.105,z+8],[x+shift,.105,z+8]],"#465056");
    }
   }
  }
  // Threshold bars and number-like symbols are intentionally fictional.
  for(const threshold of [0,1750]){
   for(const x of [-15,-10,-5,5,10,15]){
    poly([[x-1.4,.2,threshold+8],[x+1.4,.2,threshold+8],
     [x+1.4,.2,threshold+25],[x-1.4,.2,threshold+25]],"#eaf4dd");
   }
  }
  drawAirportDetails();
  for(let z=1800;z>=0;z-=120){
   for(const x of [-24,24]){
    const p=project(state,x,.4,z,w,h);
    if(!p||p.depth>1900||p.x<-20||p.x>w+20||p.y<0||p.y>h)continue;
    const r=Math.min(5,260/p.depth+1);
    lamp(p.x,p.y,r);
   }
  }
  // Visible columns follow the aircraft, but their coordinates stay
  // anchored to the world. The old xBase jumped 360 metres when crossing
  // a 180 m boundary, making the entire tree line snap on mobile.
  const centreColumn=treeColumnAt(state.xM);
  const firstZ=Math.ceil((state.zM+2450)/200)*200;
  for(let z=firstZ;z>=state.zM-2450;z-=200){
   for(let offset=-3;offset<=3;offset++){
    const column=centreColumn+offset;
    const seed=Math.sin(z*.037+column*4.37);
    const x=treeWorldX(column,z);
    if(Math.abs(x)<92&&z>=-1000&&z<2350)continue;
    if(state.mode==="helicopter"&&Math.hypot(x,z)<140)continue;
    const p=project(state,x,0,z,w,h);
    if(!p||p.depth>2500||p.y<0||p.y>h+65||p.x<-55||p.x>w+55)continue;
    const heightPx=Math.min(110,4100/p.depth)*(.7+Math.abs(seed)*.6);
    const crown=Math.max(2,heightPx*.35);
    ctx.fillStyle="#503e31";
    ctx.fillRect(p.x-1.6,p.y-heightPx*.72,3.2,heightPx*.72);
    ctx.fillStyle=column%2?"#31573f":"#386c47";
    ctx.beginPath();ctx.ellipse(p.x,p.y-heightPx*.9,crown,crown*.75,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#4d7d4f7a";ctx.beginPath();
    ctx.arc(p.x-crown*.3,p.y-heightPx,crown*.55,0,Math.PI*2);ctx.fill();
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
  const windsock=Windsocks.sample(state.windXMps,state.windZMps,state.time,reducedMotion);
  for(const {x,z} of Windsocks.positions){
   const endX=x+windsock.tipXM,endZ=z+windsock.tipZM;
   const peak=12;
   line([x,0,z],[x,peak,z],"#e1e2da",3);
   // Staggered triangular fabric sections approximate a windsock in depth.
   if(windsock.active){
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
 // The same two genuine moving ground vehicles appear in Canvas fallback
 // and WebGL. Geometry tracks the synthetic flight clock, not wall time.
 const vehicles=Traffic.sample(state.time,reducedMotion);
 for(const v of vehicles){
  if(Math.abs(v.z-state.zM)>2300)continue;
  const cos=Math.cos(v.headingRad),sin=Math.sin(v.headingRad);
  const p=(x,y,z)=>[v.x+x*cos+z*sin,y+.15,v.z-x*sin+z*cos];
  const box=(x,y,z,ww,hh,dd,color)=>{
   poly([p(x,y+hh,z),p(x+ww,y+hh,z),
    p(x+ww,y+hh,z+dd),p(x,y+hh,z+dd)],color);
   poly([p(x,y,z),p(x+ww,y,z),
    p(x+ww,y+hh,z),p(x,y+hh,z)],color);
   poly([p(x+ww,y,z),p(x+ww,y,z+dd),
    p(x+ww,y+hh,z+dd),p(x+ww,y+hh,z)],color);
   poly([p(x,y,z+dd),p(x+ww,y,z+dd),
    p(x+ww,y+hh,z+dd),p(x,y+hh,z+dd)],color);
  };
  box(-1.18,.27,-2.15,2.36,1.02,4.30,v.color);
  box(-1.02,1.19,-.82,2.04,.82,2.20,
   v.kind==="service"?"#fcd669":"#cfdee6");
  box(-1.07,1.34,-.46,.07,.49,1.25,"#2d546a");
  box(1.0,1.34,-.46,.07,.49,1.25,"#2d546a");
  box(-.9,1.33,1.30,1.80,.44,.07,"#2d546a");
  for(const sign of [-1,1])for(const z of [-1.25,1.26])
   box(sign<0?-1.30:1.08,.07,z-.42,.22,.64,.84,"#1e262c");
 }
 ctx.restore();
 // Grade only the illustrated outside scenery. The cockpit PFD/controls remain
 // outside this canvas, and the stationary white reference cue stays legible.
 if(palette.overlay){ctx.fillStyle=palette.overlay;ctx.fillRect(0,0,w,h);}
 if(view!=="cockpit"){
  const Chase=root?.AGSAExteriorChase2D||
   (typeof module!=="undefined"&&module.exports?require("./flight-sim-exterior-2d.js"):null);
  Chase?.paint(ctx,state,{id:airframeId||(state.mode==="helicopter"?"r44":"c172"),width:w,height:h,view,animation});
 }
 if(view==="cockpit"){
 // Fixed airframe reference cue and non-certified horizon tick marks.
 ctx.strokeStyle="#ffffffc4";ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(w*.43,h*.53);ctx.lineTo(w*.485,h*.53);
 ctx.moveTo(w*.515,h*.53);ctx.lineTo(w*.57,h*.53);
 ctx.moveTo(w*.5,h*.515);ctx.lineTo(w*.5,h*.555);ctx.stroke();
 ctx.strokeStyle="#ffffff45";ctx.lineWidth=1;
 for(const x of [.1,.9]){
  ctx.beginPath();ctx.moveTo(w*x,h*.1);ctx.lineTo(w*x,h*.9);ctx.stroke();
 }
 }
 return true;
}
const api={project,draw,treeColumnAt,treeWorldX};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightScenery=api;
})(typeof window!=="undefined"?window:null);
