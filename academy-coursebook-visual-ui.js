/* Picture-led "illustrated field notes" module renderer.
 * The approved four artwork masters are never modified. Any framed excerpt is
 * rendered from its stored source pixels and links back to the entire original.
 * Existing assessments and local course records remain independent.
 */
(function(root){"use strict";
const M=root.AGSACompleteCoursebook,library=root.AGSAVisualFirstLessons,atlas=root.AGSAOriginalPictureAtlas;
if(!M||!library||!atlas)return;
library.validate(M.modules,atlas);
const $=id=>document.getElementById(id);
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);return node};
const imageRequests=new Map();
const imageFor=src=>{
 if(!imageRequests.has(src))imageRequests.set(src,new Promise((resolve,reject)=>{
  const image=new Image();image.decoding="async";
  image.onload=()=>resolve(image);
  image.onerror=()=>reject(Error("Original local Academy image unavailable"));
  image.src=src;
 }));
 return imageRequests.get(src);
};
let generation=0;
function paint(canvas,asset,width){
 const context=canvas.getContext("2d");
 if(!context)return;
 const [sx,sy,sw,sh]=asset.rect,scale=Math.min(2.2,width/sw);
 canvas.width=Math.round(sw*scale);canvas.height=Math.round(sh*scale);
 context.clearRect(0,0,canvas.width,canvas.height);
 context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";
 return imageFor(asset.src).then(image=>context.drawImage(image,sx,sy,sw,sh,0,0,canvas.width,canvas.height));
}
const modal=el("dialog");modal.id="visualLessonZoom";modal.className="visual-lesson-dialog";
modal.setAttribute("aria-labelledby","visualLessonZoomHeading");
const modalHeading=el("h3");modalHeading.id="visualLessonZoomHeading";
const modalCanvas=el("canvas");modalCanvas.setAttribute("role","img");
const modalCaption=el("p");modalCaption.className="visual-lesson-zoom-caption";
const modalLink=el("a","Inspect full original artwork");modalLink.target="_blank";modalLink.rel="noopener noreferrer";
const modalClose=el("button","Close detailed picture");modalClose.type="button";
modalClose.addEventListener("click",()=>modal.close());
modal.addEventListener("click",e=>{if(e.target===modal)modal.close()});
modal.append(modalHeading,modalCanvas,modalCaption,modalLink,modalClose);
document.body.appendChild(modal);
async function zoom(asset,item){
 modalHeading.textContent=asset.title;
 modalCanvas.setAttribute("aria-label",asset.alt);
 modalCaption.textContent=item.focus+" This is a source-pixel view of an earlier original Academy picture.";
 modalLink.href=asset.src;
 try{await paint(modalCanvas,asset,1160)}
 catch{modalCaption.textContent="The original image is unavailable. Open the gallery's complete picture for reference."}
 if(!modal.open){
  if(typeof modal.showModal==="function")modal.showModal();
  else modal.setAttribute("open","");
  modalClose.focus();
 }
}
function picture(asset,item,activeToken){
 const figure=el("figure");figure.className="visual-lesson-picture";
 const kicker=el("span","ORIGINAL APPROVED ILLUSTRATION");kicker.className="visual-note-kicker";
 const button=el("button");button.type="button";button.className="visual-detail-trigger";
 button.setAttribute("aria-label","Enlarge illustrated learning picture: "+asset.title);
 const canvas=el("canvas");canvas.className="visual-detail-canvas";
 canvas.setAttribute("role","img");canvas.setAttribute("aria-label",asset.alt);
 canvas.width=420;canvas.height=Math.round(420*asset.rect[3]/asset.rect[2]);
 const cue=el("span","Tap to examine this picture");cue.className="visual-note-cue";
 button.append(canvas,cue);button.addEventListener("click",()=>void zoom(asset,item));
 const caption=el("figcaption",asset.title);caption.className="visual-detail-caption";
 const full=el("a","View entire original");full.href=asset.src;full.target="_blank";full.rel="noopener noreferrer";
 figure.append(kicker,button,caption,full);
 paint(canvas,asset,560).catch(()=>{
  if(activeToken!==generation)return;
  canvas.hidden=true;cue.textContent="Picture unavailable — view original in gallery";
  button.disabled=true;
 });
 return figure;
}
function studyCheck(item){
 const box=el("details");box.className="visual-observation-check";
 const summary=el("summary","Think about the picture · "+item.question);
 const answer=el("p",item.answer);
 const note=el("p","Informal reflection — not a graded assessment.");note.className="visual-caption-footnote";
 box.append(summary,answer,note);
 return box;
}
function sectionEnhancement(item,index,token){
 const aside=el("div");aside.className="visual-lesson-study";
 aside.dataset.subtopic=String(index+1);
 if(item.picture){
  const asset=atlas.getById(item.picture);
  if(asset)aside.appendChild(picture(asset,item,token));
 }else{
  const seeDiagram=el("div");seeDiagram.className="visual-concept-signpost";
  seeDiagram.append(el("span","CONCEPT DIAGRAM"),el("p","Use the original labelled diagram in this module to connect the explanation with the aircraft or system."));
  aside.appendChild(seeDiagram);
 }
 const label=el("p","LOOK CLOSELY");label.className="visual-observation-label";
 const focus=el("p",item.focus);focus.className="visual-focus";
 const caption=el("p","CONCEPT IN CONTEXT");caption.className="visual-observation-label";
 const explanation=el("p",item.explain);explanation.className="visual-expanded-explanation";
 const caution=el("p","AVOID THIS MISCONCEPTION");caution.className="visual-observation-label";
 const misconception=el("p",item.misconception);misconception.className="visual-misconception";
 aside.append(label,focus,caption,explanation,caution,misconception,studyCheck(item));
 return aside;
}
function render(moduleId){
 const m=M.modules.find(x=>x.id===moduleId),items=library.get(moduleId);
 const reading=$("lessonReading");
 if(!m||!items||!reading)return;
 const articles=Array.from(reading.children).filter(x=>x.tagName==="ARTICLE");
 if(articles.length!==3)return;
 const current=++generation;
 if(modal.open)modal.close();
 reading.querySelectorAll(".visual-manual-cover,.visual-lesson-study").forEach(x=>x.remove());
 const oldCover=reading.querySelector(".visual-manual-cover");
 if(oldCover)oldCover.remove();
 const cover=el("header");cover.className="visual-manual-cover";
 const strip=el("div");strip.className="visual-manual-strip";
 strip.append(el("span","AVIATION GROUND SCHOOL ACADEMY"),el("span","ILLUSTRATED TRAINING NOTES · "+String(m.number).padStart(2,"0")));
 const title=el("h3",m.title);
 const lead=el("p","First explore the complete original picture. Then study each numbered explanation and its enlarged single-picture detail. Use the labelled concept diagram and knowledge checks to test your understanding.");
 const meta=el("p","ORIGINAL ARTWORK · "+items.filter(x=>x.picture).length+" focused pictures · 3 deeper explanations · 3 picture-based reflections");
 meta.className="visual-manual-meta";
 cover.append(strip,title,lead,meta);
 // This existing figure was already created by the previously approved visual
 // renderer; moving its DOM node preserves its exact original artwork and
 // functioning zoom, without manufacturing new or alternative pictures.
 const featured=reading.querySelector(".approved-visual-figure");
 const pool=reading.querySelector(".related-original-pictures");
 if(featured){
  const hero=el("div");hero.className="visual-manual-hero";
  hero.appendChild(featured);cover.appendChild(hero);
 }
 if(pool){
  const footer=el("div");footer.className="visual-manual-all-pictures";
  footer.appendChild(pool);cover.appendChild(footer);
 }
 reading.prepend(cover);
 articles.forEach((article,index)=>{
  article.classList.add("visual-manual-section");
  article.dataset.lectureIndex=String(index+1);
  const h=article.querySelector("h3");
  if(h&&!h.querySelector(".visual-lecture-num")){
   const badge=el("span","0"+(index+1));
   badge.className="visual-lecture-num";h.prepend(badge);
  }
  // Keep the original coursebook paragraph intact; supplementary content is
  // appended as a separate, clearly labelled educational visual study area.
  article.appendChild(sectionEnhancement(items[index],index,current));
 });
 const count=$("photoReferenceCount");
 if(count)count.textContent="Illustrated training manual: original full artwork, "+items.filter(x=>x.picture).length+
  " focused images placed beside relevant explanations, three reflections and the full 33-picture gallery.";
 const visualNavigation=$("visualSectionNavigation");if(visualNavigation)visualNavigation.replaceChildren(
  ...articles.map((article,index)=>{
   const btn=el("button",(index+1)+". "+m.sections[index].title);
   btn.type="button";btn.addEventListener("click",()=>article.scrollIntoView({behavior:"smooth",block:"start"}));
   return btn;
  })
 );
}
document.addEventListener("agsa:coursebook-module",event=>{
 if(library.get(event.detail?.moduleId))queueMicrotask(()=>render(event.detail.moduleId));
});
document.addEventListener("DOMContentLoaded",()=>{
 const requested=new URL(location.href).searchParams.get("module");
 const route=$("route")?.value||"scouts",fallback=M.routes[route]?.[0]||M.modules[0].id;
 render(library.get(requested)?requested:fallback);
});
})(window);
