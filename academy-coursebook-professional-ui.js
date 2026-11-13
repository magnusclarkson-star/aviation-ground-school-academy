/* Professional ground-school reference plates with explicit photo credits.
 * External photos are lazy-loaded from Wikimedia Commons; local teaching
 * diagrams remain available when offline or when the image host is blocked.
 */
(()=>{"use strict";
const media=window.AGSAProfessionalCoursebookMedia,core=window.AGSACompleteCoursebook;
if(!media||!core)return;
media.validate(core.modules);
const make=(tag,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=String(txt);return e};
const dialog=document.createElement("dialog");dialog.id="academyPhotoDialog";dialog.className="academy-photo-dialog";
dialog.setAttribute("aria-labelledby","academyPhotoDialogTitle");
const dTitle=make("h3");dTitle.id="academyPhotoDialogTitle";
const dImg=document.createElement("img");dImg.alt="";dImg.loading="eager";dImg.decoding="async";
const dCaption=make("p");dCaption.className="academy-photo-context";
const dCredit=make("p");dCredit.className="academy-photo-source";
const dClose=make("button","Close image");dClose.type="button";
dClose.addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
dialog.append(dTitle,dImg,dCaption,dCredit,dClose);document.body.appendChild(dialog);
function sourceLink(item){
 const a=make("a","Source & photo credit");
 a.href=item.source;a.target="_blank";a.rel="noopener noreferrer";
 return a;
}
function licenseLink(item){
 const a=make("a",item.license);
 a.href=item.licenseUrl;a.target="_blank";a.rel="noopener noreferrer";
 return a;
}
function creditLine(item){
 const p=make("p");p.className="academy-photo-source";
 p.append(make("span","Image: "+item.credit+" · "),licenseLink(item),make("span"," · "),sourceLink(item));
 return p;
}
function zoom(item){
 dTitle.textContent=item.title;
 dImg.alt=item.alt;
 dImg.src=item.fallbackSrc;
 dImg.onerror=()=>{dImg.onerror=null;dImg.src=item.src};
 dCaption.textContent=item.caption;
 dCredit.replaceChildren(make("span",item.credit+" · "),licenseLink(item),make("span"," · "),sourceLink(item));
 if(dialog.open)return;
 if(typeof dialog.showModal==="function")dialog.showModal();
 else dialog.setAttribute("open","");
 dClose.focus();
}
function figureFor(item){
 const figure=document.createElement("figure");figure.className="academy-reference-photo";
 figure.dataset.mediaId=item.id;
 const header=document.createElement("div");header.className="academy-reference-head";
 header.append(make("span","PHOTO REFERENCE · REAL AVIATION"),make("h4",item.title));
 const trigger=document.createElement("button");trigger.type="button";trigger.className="academy-reference-zoom";
 trigger.setAttribute("aria-label","Enlarge professional aviation visual: "+item.title);
 const img=document.createElement("img");img.src=item.src;img.alt=item.alt;img.loading="lazy";
 img.decoding="async";img.referrerPolicy="no-referrer";
 img.width=960;img.height=590;
 const cue=make("span","Tap photograph to inspect details");
 cue.className="academy-reference-cue";trigger.append(img,cue);
 const failed=make("p","The reference image is temporarily unavailable. The labelled diagram in this lesson remains available.");
 failed.className="academy-image-fallback";failed.hidden=true;
 let attemptedOriginal=false;
 img.onerror=()=>{
  if(!attemptedOriginal){attemptedOriginal=true;img.src=item.fallbackSrc;return}
  trigger.hidden=true;failed.hidden=false;
 };
 trigger.addEventListener("click",()=>zoom(item));
 const caption=make("figcaption",item.caption);
 figure.append(header,trigger,failed,caption,creditLine(item));
 return figure;
}
function render(id){
 const reading=document.getElementById("lessonReading"),unit=media.get(id);
 if(!reading||!unit.length)return;
 if(dialog.open)dialog.close();
 reading.querySelectorAll(".academy-reference-photo").forEach(el=>el.remove());
 const articles=reading.querySelectorAll("article");
 const deeper=document.getElementById("deepReading");
 if(deeper)deeper.querySelectorAll(".academy-reference-photo,.academy-photo-deep-link").forEach(el=>el.remove());
 unit.forEach((item,i)=>{
  const panel=figureFor(item);
  // The primary high-quality visual sits beside the core explanation. The
  // second photograph, when available, belongs in the extended lesson rather
  // than crowding the introductory reading with two tall reference plates.
  const deepLesson=deeper?.querySelector(".deep-lesson");
  if(i===1&&deepLesson){deepLesson.appendChild(panel);return}
  const article=articles[item.section];if(!article)return;
  const concept=article.querySelector(".lesson-pictorial");
  if(concept)article.insertBefore(panel,concept);
  else article.appendChild(panel);
 });
 if(deeper?.querySelector(".deep-lesson")&&unit.length===1){
  const link=make("button","Review the photographic reference: "+unit[0].title);
  link.type="button";link.className="academy-photo-deep-link";
  link.addEventListener("click",()=>reading.querySelector(".academy-reference-photo")?.scrollIntoView({behavior:"smooth",block:"center"}));
  deeper.querySelector(".deep-lesson").appendChild(link);
 }
 const index=document.getElementById("photoReferenceCount");
 if(index)index.textContent=unit.length+" detailed image reference"+(unit.length===1?"":"s")+
  " + original labelled concept diagram";
}
document.addEventListener("agsa:coursebook-module",e=>{
 const id=e.detail?.moduleId;
 if(id&&media.get(id).length)queueMicrotask(()=>render(id));
});
document.addEventListener("DOMContentLoaded",()=>{
 const requested=new URL(location.href).searchParams.get("module");
 const id=media.get(requested).length?requested:core.modules[0]?.id;
 if(id)render(id);
});
})();
