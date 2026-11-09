/* Lightweight touchdown and hard-landing visual cues shared by 2D/WebGL views.
 * Overlay never captures touches, does not change flight physics, and respects
 * reduced-motion settings. Particles are capped for low-power Android devices.
 */
(function(root){"use strict";
function create({documentLike=root?.document,reducedMotion=false}={}){
 const doc=documentLike, shell=doc?.querySelector?.(".scene-shell");
 if(!shell)return {update(){},destroy(){}};
 const canvas=doc.createElement("canvas");
 canvas.setAttribute("aria-hidden","true");
 canvas.className="agsa-touchdown-fx";
 Object.assign(canvas.style,{position:"absolute",inset:"0",width:"100%",height:"100%",
  pointerEvents:"none",zIndex:"4",opacity:"1"});
 if(root?.getComputedStyle?.(shell)?.position==="static")shell.style.position="relative";
 shell.appendChild(canvas);
 const ctx=canvas.getContext("2d");
 let particles=[],flash=0,lastTime=0,lastImpact=0,active=true;
 const motionReduced=()=>reducedMotion||root?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
 function resize(){
  const w=Math.max(1,Math.round(shell.clientWidth||960)),h=Math.max(1,Math.round(shell.clientHeight||540));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 }
 function emit(strength,mode){
  const now=Date.now();
  if(now-lastImpact<350)return;
  lastImpact=now;resize();
  flash=strength;
  if(motionReduced())return;
  const count=mode==="helicopter"?12:strength>.7?22:14;
  const cx=canvas.width*.5,cy=canvas.height*.75;
  for(let i=0;i<count;i++){
   const a=Math.PI*(1.05+(.9*i/Math.max(1,count-1)));
   const speed=(.8+(i%5)*.28)*(strength>.7?1.5:1);
   particles.push({x:cx+(i%4-1.5)*12,y:cy+((i%3)-1)*4,
    vx:Math.cos(a)*speed*1.8,vy:Math.sin(a)*speed-.4,
    age:0,life:340+(i%6)*70,r:2+(i%4)*2});
  }
  if(particles.length>40)particles=particles.slice(-40);
 }
 function update(now,events=[],state={}){
  if(!active||!ctx)return;
  resize();
  const dt=lastTime?Math.max(0,Math.min(50,now-lastTime)):16;
  lastTime=now;
  if(events.includes("hardLanding"))emit(.85,state.mode);
  else if(events.includes("touchdown"))emit(.45,state.mode);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(flash>.01){
   ctx.fillStyle="rgba(255,223,171,"+(flash*.10)+")";
   ctx.fillRect(0,0,canvas.width,canvas.height);
   flash*=Math.pow(.83,dt/16);
  }else flash=0;
  if(motionReduced()){particles=[];return;}
  for(const p of particles){
   p.age+=dt;p.x+=p.vx*dt/16;p.y+=p.vy*dt/16;
   p.vy+=.035*dt/16;
   const alpha=Math.max(0,1-p.age/p.life)*.4;
   ctx.fillStyle="rgba(210,192,150,"+alpha+")";
   ctx.beginPath();ctx.arc(p.x,p.y,p.r*(1+p.age/p.life),0,Math.PI*2);ctx.fill();
  }
  particles=particles.filter(p=>p.age<p.life);
 }
 function destroy(){active=false;particles=[];canvas.remove();}
 return {update,destroy};
}
const api={create};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSATouchdownFX=api;
})(typeof window!=="undefined"?window:null);
