/* Every earlier image is available in full AND as one of 33 enlarged panel views.
 * Browser canvases draw pixel-exact crops of the four pre-existing local files;
 * no new substituted or externally downloaded artwork is used.
 */
(()=>{"use strict";
const atlas=window.AGSAOriginalPictureAtlas;
if(!atlas)return;
const report=atlas.validate(),root=document.getElementById("atlasItems"),count=document.getElementById("atlasCount");
const filters=document.getElementById("atlasFilters");
if(!root||!count||!filters)return;
const sourceCache=new Map(),panels=new Map();
const make=(tag,txt)=>{const node=document.createElement(tag);if(txt!==undefined)node.textContent=txt;return node};
function source(item){
 if(sourceCache.has(item.src))return sourceCache.get(item.src);
 const p=new Promise((resolve,reject)=>{
  const img=new Image();img.decoding="async";
  img.onload=()=>resolve(img);
  img.onerror=()=>reject(Error("Original picture is unavailable on this website"));
  img.src=item.src;
 });
 sourceCache.set(item.src,p);return p;
}
function paint(img,item,canvas,maxWidth){
 const [x,y,w,h]=item.rect,scale=Math.min(1.8,maxWidth/w);
 canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
 const context=canvas.getContext("2d",{alpha:false});
 if(!context)throw Error("Drawing canvas is unavailable");
 context.imageSmoothingEnabled=true;
 context.imageSmoothingQuality="high";
 context.fillStyle="#fff";context.fillRect(0,0,canvas.width,canvas.height);
 context.drawImage(img,x,y,w,h,0,0,canvas.width,canvas.height);
}
const modal=document.createElement("dialog");modal.id="atlasZoomDialog";modal.className="atlas-zoom";
modal.setAttribute("aria-labelledby","atlasZoomTitle");
const h=make("h3");h.id="atlasZoomTitle";
const view=document.createElement("canvas");view.setAttribute("role","img");
const explain=make("p");explain.className="atlas-caption";
const full=make("a","Open complete original picture");
full.target="_blank";full.rel="noopener noreferrer";
const close=make("button","Close enlarged picture");close.type="button";
close.addEventListener("click",()=>modal.close());
modal.addEventListener("click",event=>{if(event.target===modal)modal.close()});
modal.append(h,view,explain,full,close);document.body.appendChild(modal);
async function zoom(item){
 try{
  const img=await source(item);
  h.textContent=item.title;
  explain.textContent=item.caption+" This is a cropped view of the full original, not a redesigned replacement.";
  view.setAttribute("aria-label",item.alt);
  paint(img,item,view,1140);
  full.href=item.src;
  if(!modal.open){
   if(modal.showModal)modal.showModal();else modal.setAttribute("open","");
   close.focus();
  }
 }catch(e){
  const msg=document.getElementById("atlasStatus");
  if(msg)msg.textContent="Image could not be enlarged: "+e.message;
 }
}
function one(item){
 const card=make("article");card.className="atlas-item";card.dataset.group=item.group;card.id="panel-"+item.id;
 const eyebrow=make("span",item.groupLabel);eyebrow.className="atlas-eyebrow";
 const heading=make("h3",item.title);
 const button=make("button");button.type="button";button.className="atlas-picture-button";
 button.setAttribute("aria-label","Open enlarged original panel: "+item.title);
 const canvas=make("canvas");canvas.className="atlas-panel-canvas";canvas.setAttribute("role","img");canvas.setAttribute("aria-label",item.alt);
 // Reserve space before the bitmap is decoded so the mobile layout doesn't jump.
 canvas.width=Math.min(420,item.rect[2]);canvas.height=Math.round(canvas.width*item.rect[3]/item.rect[2]);
 const cue=make("span","Tap to enlarge this original picture");cue.className="atlas-cue";
 button.append(canvas,cue);
 const caption=make("p",item.caption);
 const openFull=make("a","View its entire original composition");
 openFull.href=item.src;openFull.target="_blank";openFull.rel="noopener noreferrer";
 button.addEventListener("click",()=>void zoom(item));
 card.append(eyebrow,heading,button,caption,openFull);
 source(item).then(img=>paint(img,item,canvas,500)).catch(()=>{
  canvas.hidden=true;
  cue.textContent="Image unavailable — open the original file";
  button.disabled=true;
 });
 return card;
}
for(const item of atlas.items){
 const card=one(item);root.appendChild(card);panels.set(item.id,card);
}
const groups=[
 ["all","All 33 picture details"],
 ["detailed","Detailed course sheet (12)"],
 ["overview","Aviation overview (12)"],
 ["photographs","Four aviation photographs"],
 ["cessna","Cessna lesson details (5)"]
];
let active="all";
const buttons=new Map();
function show(group){
 active=group;
 let visible=0;
 for(const item of atlas.items){
  const shown=group==="all"||item.group===group;
  panels.get(item.id).hidden=!shown;
  if(shown)visible++;
 }
 for(const [key,btn] of buttons)btn.setAttribute("aria-pressed",key===group?"true":"false");
 count.textContent=visible+" enlarged picture details displayed. Four complete original pictures are shown above.";
 const url=new URL(location.href);
 if(group==="all")url.searchParams.delete("group");else url.searchParams.set("group",group);
 history.replaceState(null,"",url);
}
for(const [key,label] of groups){
 const btn=make("button",label);btn.type="button";btn.setAttribute("aria-pressed","false");
 btn.addEventListener("click",()=>show(key));
 filters.appendChild(btn);buttons.set(key,btn);
}
show(groups.some(g=>g[0]===new URL(location.href).searchParams.get("group"))?
 new URL(location.href).searchParams.get("group"):"all");
// Make direct links from lessons reveal and focus the requested original crop.
const requested=location.hash.startsWith("#panel-")?location.hash.slice(7):null;
const target=requested?atlas.getById(requested):null;
if(target){
 show(target.group);
 const card=panels.get(target.id);
 if(card)requestAnimationFrame(()=>card.scrollIntoView({behavior:"smooth",block:"center"}));
}
document.querySelectorAll(".gallery-original-link").forEach(link=>{
 link.target="_blank";link.rel="noopener noreferrer";
});
})();
