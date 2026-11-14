/* Live Academy Coursebook screen using owner's approved original plate.
   The design is a genuine lesson interface: navigation, quizzes, chapter notes,
   speech and records remain the existing accessible DOM, not flattened pixels. */
(()=>{"use strict";
const SOURCE="assets/lecture-visuals/illustrated-cessna-structures-lecture.webp";
const byId=id=>document.getElementById(id);
function buildPlate(){
 const figure=document.createElement("figure");figure.className="original-coursebook-plate";
 figure.setAttribute("aria-label","Original Aircraft Structure and Controls Coursebook illustration");
 const link=document.createElement("a");link.className="original-plate-link";link.href=SOURCE;
 link.target="_blank";link.rel="noopener noreferrer";
 link.setAttribute("aria-label","Open original full-size Aircraft Structure and Controls Coursebook");
 const viewport=document.createElement("span");viewport.className="original-plate-viewport";
 const image=document.createElement("img");image.src=SOURCE;image.decoding="async";image.loading="eager";
 image.alt="Original illustrated Academy aircraft lesson: large annotated Cessna trainer, wing control surfaces, three axes of movement, cockpit controls, key points and quick check.";
 viewport.appendChild(image);link.appendChild(viewport);
 const caption=document.createElement("figcaption");
 caption.textContent="Original Academy lesson design · Large Cessna teaching plate · Select the picture to see the full illustration.";
 figure.append(link,caption);return figure;
}
function install(){
 const sidebar=document.querySelector(".gold-sidebar");
 const reading=byId("lessonReading");
 const controls=document.querySelector(".quick-controls");
 const notice=document.querySelector(".notice-compact");
 if(!sidebar||!reading||!controls||!notice)return;
 const moduleList=byId("moduleList");
 const objectives=document.querySelector(".objectives-panel");
 const gallery=document.querySelector(".supplementary-links");
 if(objectives)sidebar.appendChild(objectives);
 if(gallery)sidebar.appendChild(gallery);
 const tools=document.createElement("details");tools.className="lesson-tools-collapse";
 const summary=document.createElement("summary");summary.textContent="Course options, progress and accreditation information";
 tools.appendChild(summary);tools.appendChild(controls);tools.appendChild(notice);
 sidebar.appendChild(tools);
 // The original section-navigation element must stay outside #lessonReading,
 // because the core module switch replaces its children on every selection.
 function show(id){
  document.documentElement.dataset.courseModule=id;
  reading.querySelectorAll(".original-coursebook-plate").forEach(node=>node.remove());
  if(id==="aircraft")reading.prepend(buildPlate());
  // Restore a clean study start after choosing a different subject.
 }
 document.addEventListener("agsa:coursebook-module",event=>{
  const id=event.detail?.moduleId;
  if(id)queueMicrotask(()=>show(id));
 });
 const current=new URL(location.href).searchParams.get("module");
 show(current||"aircraft");
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
else install();
})();