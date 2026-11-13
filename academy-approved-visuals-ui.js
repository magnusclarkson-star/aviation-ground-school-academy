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
function showModule(id){
 const area=document.getElementById("lessonReading"),item=catalogue.getModule(id);
 if(!area||!item)return;
 area.querySelectorAll(".approved-visual-figure").forEach(x=>x.remove());
 const articles=area.querySelectorAll("article");
 if(!articles.length)return;
 const target=articles[0];
 // The exact approved picture comes first; diagrams below explain individual functions.
 const image=figure(item);
 const concept=target.querySelector(".lesson-pictorial");
 if(concept)target.insertBefore(image,concept);
 else target.appendChild(image);
 const count=document.getElementById("photoReferenceCount");
 if(count)count.textContent="Original illustration from the pictures previously shown to you · tap to enlarge. Accompanying labelled schematic remains below.";
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
