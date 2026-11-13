/* Mobile-friendly pictorial lecture notes, using local original vector drawings only. */
(()=>{"use strict";
const book=window.AGSACoursebookIllustrations;
if(!book)return;
book.validate();
const modal=document.createElement("dialog");
modal.id="academyDiagramDialog";
modal.className="diagram-lightbox";
modal.setAttribute("aria-labelledby","academyDiagramTitle");
const heading=document.createElement("h3");heading.id="academyDiagramTitle";
const image=document.createElement("img");image.alt="";image.width=840;image.height=440;
const caption=document.createElement("p");caption.className="diagram-explanation";
const close=document.createElement("button");close.type="button";close.textContent="Close enlarged diagram";
close.addEventListener("click",()=>modal.close());
modal.append(heading,image,caption,close);
modal.addEventListener("click",event=>{if(event.target===modal)modal.close()});
document.body.appendChild(modal);
function uri(svg){return "data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(svg)}
function zoom(item){
 if(!modal.open){
  heading.textContent=item.title;
  image.src=uri(item.svg);image.alt=item.alt;
  caption.textContent=item.caption;
  if(typeof modal.showModal==="function")modal.showModal();
  else modal.setAttribute("open","");
  close.focus();
 }
}
function drawFigure(item){
 const figure=document.createElement("figure");figure.className="lesson-pictorial";figure.id="pictorial-"+item.id;
 const h=document.createElement("h4");h.textContent="Illustrated concept · "+item.title;
 const trigger=document.createElement("button");trigger.type="button";trigger.className="diagram-trigger";
 trigger.setAttribute("aria-label","Enlarge diagram: "+item.title);
 const img=document.createElement("img");img.src=uri(item.svg);img.alt=item.alt;img.width=840;img.height=440;
 img.loading="lazy";img.decoding="async";trigger.appendChild(img);
 const expand=document.createElement("span");expand.className="diagram-expand";expand.textContent="Tap diagram to enlarge";
 trigger.appendChild(expand);
 trigger.addEventListener("click",()=>zoom(item));
 const figcaption=document.createElement("figcaption");figcaption.textContent=item.caption;
 figure.append(h,trigger,figcaption);
 return figure;
}
function render(id){
 const item=book.get(id),reading=document.getElementById("lessonReading"),deep=document.getElementById("deepReading");
 if(!item||!reading)return;
 reading.querySelectorAll(".lesson-pictorial").forEach(x=>x.remove());
 if(deep)deep.querySelectorAll(".pictorial-deep-link").forEach(x=>x.remove());
 const sections=reading.querySelectorAll("article");
 if(!sections.length)return;
 const anchor=sections[Math.min(item.section,sections.length-1)];
 anchor.appendChild(drawFigure(item));
 if(deep&&deep.querySelector(".deep-lesson")){
  const button=document.createElement("button");button.type="button";button.className="pictorial-deep-link";
  button.textContent="View the labelled "+item.title.toLowerCase()+" diagram";
  button.addEventListener("click",()=>{
   document.getElementById("pictorial-"+id)?.scrollIntoView({behavior:"smooth",block:"center"});
  });
  deep.querySelector(".deep-lesson").appendChild(button);
 }
}
document.addEventListener("agsa:coursebook-module",e=>{
 const id=e.detail?.moduleId;
 if(book.get(id))queueMicrotask(()=>render(id));
});
document.addEventListener("DOMContentLoaded",()=>{
 const id=new URL(location.href).searchParams.get("module");
 const first=window.AGSACompleteCoursebook?.modules[0]?.id;
 render(book.get(id)?id:first);
});
})();
