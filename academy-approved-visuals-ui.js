/* Shows only the same four Academy visual references previously presented.
 * No substitution service, random image search, Wikimedia replacement, or blank upload placeholder.
 */
(function(root){"use strict";
const catalogue=root.AGSAApprovedLectureVisuals;
if(!catalogue)return;
catalogue.validate();
const make=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);return e};
function cropStyle(image,node){
 const x=image.crop[0],y=image.crop[1];
 node.className="approved-cropped-picture";
 node.setAttribute("role","img");
 node.setAttribute("aria-label",image.alt);
 node.style.backgroundImage="url('"+image.src+"')";
 node.style.backgroundSize="400% 300%";
 node.style.backgroundPosition=(x/3*100)+"% "+(y/2*100)+"%";
 node.style.aspectRatio=image.originalDescription.includes("twelve-section")?"1 / 1.41":"1.125 / 1";
}
function imageContent(item){
 if(item.crop){
  const crop=make("div");cropStyle(item,crop);
  return crop;
 }
 const img=make("img");
 img.src=item.src;img.alt=item.alt;img.loading="lazy";img.decoding="async";
 img.className="approved-full-picture";
 return img;
}
const dialog=make("dialog");dialog.id="approvedVisualLightbox";dialog.className="approved-visual-lightbox";
dialog.setAttribute("aria-labelledby","approvedVisualTitle");
const heading=make("h3");heading.id="approvedVisualTitle";
const large=make("div");large.className="approved-visual-expanded";
const details=make("p");details.className="approved-visual-details";
const viewFull=make("a","Inspect entire original picture");
viewFull.target="_blank";viewFull.rel="noopener noreferrer";viewFull.className="approved-original-file-link";
const close=make("button","Close illustration");close.type="button";
close.addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close()});
dialog.append(heading,large,details,viewFull,close);
document.body.appendChild(dialog);
function expand(item){
 heading.textContent=item.title;
 details.textContent=item.caption;
 large.replaceChildren(imageContent(item));
 viewFull.href=item.src;
 if(!dialog.open){
  if(typeof dialog.showModal==="function")dialog.showModal();
  else dialog.setAttribute("open","");
  close.focus();
 }
}
function figure(item){
 const frame=make("figure");frame.className="approved-visual-figure";
 frame.dataset.source="same-original-owner-shown-picture";
 const head=make("div");head.className="approved-visual-heading";
 const eyebrow=make("span","PREVIOUSLY SHOWN ORIGINAL ACADEMY PICTURE");
 const title=make("h4",item.title);
 head.append(eyebrow,title);
 const button=make("button");button.type="button";button.className="approved-picture-trigger";
 button.setAttribute("aria-label","Enlarge exact Academy illustration: "+item.title);
 button.appendChild(imageContent(item));
 const hint=make("span","Tap to examine this same picture in greater detail");
 hint.className="approved-picture-hint";button.appendChild(hint);
 button.addEventListener("click",()=>expand(item));
 const caption=make("figcaption",item.caption);
 const note=make("p","Original Academy visual concept, displayed without composition changes. Web-optimised file; not operational aircraft, navigation or investigation source data.");
 note.className="approved-picture-source";
 frame.append(head,button,caption,note);
 return frame;
}
/* All related picture details remain original source-pixel crops, drawn only
 * when a learner opens this compact panel. No replacement imagery is fetched.
 */
function earlierPicturesForModule(moduleId){
 const atlas=root.AGSAOriginalPictureAtlas;
 const refs=atlas?.byModule(moduleId)||[];
 if(!refs.length)return null;
 const wrap=make("details");wrap.className="related-original-pictures";
 const summary=make("summary","See all "+refs.length+" earlier picture details for this lesson");
 const box=make("div");box.className="related-original-grid";
 let drawn=false;
 function render(){
  if(drawn)return;drawn=true;
  for(const item of refs){
   const card=make("figure");card.className="related-original-card";
   const heading=make("figcaption",item.title);
   const link=make("a");link.className="related-original-link";
   link.href="academy-approved-visual-gallery.html?group="+encodeURIComponent(item.group)+"#panel-"+encodeURIComponent(item.id);
   link.setAttribute("aria-label","Open larger original panel: "+item.title);
   const canvas=make("canvas");canvas.width=360;canvas.height=Math.round(360*item.rect[3]/item.rect[2]);
   canvas.setAttribute("role","img");canvas.setAttribute("aria-label",item.alt);
   const caption=make("span","View original picture in gallery");caption.className="related-original-cue";
   link.append(canvas,caption);
   card.append(link,heading);box.appendChild(card);
   const image=new Image();image.decoding="async";
   image.onload=()=>{
    const ctx=canvas.getContext("2d");
    if(!ctx)return;
    ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image,...item.rect,0,0,canvas.width,canvas.height);
   };
   image.onerror=()=>{caption.textContent="Picture unavailable — open gallery to inspect original";canvas.hidden=true};
   image.src=item.src;
  }
 }
 wrap.addEventListener("toggle",()=>{if(wrap.open)render()});
 wrap.append(summary,box);
 return wrap;
}
function showModule(id){
 const area=document.getElementById("lessonReading"),item=catalogue.getModule(id);
 if(!area||!item)return;
 area.querySelectorAll(".approved-visual-figure,.related-original-pictures").forEach(x=>x.remove());
 const articles=area.querySelectorAll("article");
 if(!articles.length)return;
 const target=articles[0];
 // The exact approved picture comes first; diagrams below explain individual functions.
 const image=figure(item);
 const concept=target.querySelector(".lesson-pictorial");
 if(concept)target.insertBefore(image,concept);
 else target.appendChild(image);
 const related=earlierPicturesForModule(id);
 if(related)image.after(related);
 const count=document.getElementById("photoReferenceCount");
 if(count)count.textContent="Original featured illustration plus "+(root.AGSAOriginalPictureAtlas?.byModule(id).length||0)+" previously shown supporting pictorials. Open the gallery or the expandable collection under this lesson.";
}
root.AGSACoursebookApprovedFigure=Object.freeze({figure,expand});
document.addEventListener("agsa:coursebook-module",event=>{
 const id=event.detail?.moduleId;if(id&&catalogue.getModule(id))queueMicrotask(()=>showModule(id));
});
document.addEventListener("DOMContentLoaded",()=>{
 const fromUrl=new URL(root.location.href).searchParams.get("module");
 showModule(catalogue.getModule(fromUrl)?fromUrl:root.AGSACompleteCoursebook?.modules[0]?.id);
});
})(window);
