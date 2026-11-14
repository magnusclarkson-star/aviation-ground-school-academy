/* Substantial open-by-default textbook notes alongside the owner's original
 * visual-first teaching design. Never hide paywalled content in these drafts.
 */
(()=>{"use strict";
const model=window.AGSAFullCoursebookChapters,core=window.AGSACompleteCoursebook;
if(!model||!core)return;
const programme=model.validate(core.modules);
const el=(tag,content)=>{const node=document.createElement(tag);if(content!==undefined)node.textContent=String(content);return node};
const $=id=>document.getElementById(id);
const words=text=>String(text).trim().split(/\s+/).filter(Boolean).length;
function termList(terms){
 const dl=el("dl");dl.className="textbook-glossary";
 for(const [term,meaning] of terms){dl.append(el("dt",term),el("dd",meaning))}
 return dl;
}
function workedExample(worked,index){
 const section=el("section");section.className="textbook-worked-case";
 const tag=el("p","WORKED EXAMPLE "+String(index+1).padStart(2,"0"));tag.className="textbook-label";
 const h=el("h5",worked.title);
 const setup=el("p",worked.setup);
 const steps=el("ol");
 worked.steps.forEach(item=>steps.appendChild(el("li",item)));
 const result=el("p",worked.result);result.className="textbook-result";
 section.append(tag,h,setup,steps,result);
 return section;
}
function reviewCard(review){
 const d=el("details");d.className="textbook-selfcheck";
 const summary=el("summary",review.question);
 const answer=el("p",review.answer);
 const footnote=el("p","Ungraded reflection for deeper understanding; official assessment records are separate.");
 footnote.className="textbook-note";
 d.append(summary,answer,footnote);
 return d;
}
function unitSection(unit,index){
 const container=el("section");container.className="academy-textbook-chapter";container.dataset.section=String(index+1);
 const heading=el("div");heading.className="textbook-head";
 heading.append(el("span","DETAILED LECTURE NOTES"),el("h4",unit.heading),
  el("p","Textbook explanation · worked reasoning · technical vocabulary · reflective knowledge check"));
 container.appendChild(heading);
 const prose=el("div");prose.className="textbook-prose";
 unit.paragraphs.forEach((p,i)=>{const node=el("p",p);if(i===0)node.className="textbook-lead";prose.appendChild(node)});
 container.appendChild(prose);
 container.appendChild(workedExample(unit.worked,index));
 const glossary=el("div");glossary.className="textbook-terms";
 glossary.append(el("h5","Key technical terms"),termList(unit.terms));
 container.appendChild(glossary);
 const self=el("div");self.className="textbook-recall";
 self.append(el("h5","Check your understanding"),reviewCard(unit.review));
 container.appendChild(self);
 return container;
}
function render(id){
 const module=core.modules.find(x=>x.id===id),units=model.get(id),reading=$("lessonReading");
 if(!module||!units||!reading)return;
 const articles=[...reading.children].filter(x=>x.tagName==="ARTICLE");
 if(articles.length!==3)return;
 reading.querySelectorAll(".academy-textbook-chapter,.textbook-course-intro").forEach(node=>node.remove());
 const overview=el("div");overview.className="textbook-course-intro";
 const count=model.moduleWordCount(id);
 const label=el("p","ACADEMY FULL LECTURE EDITION");label.className="textbook-kicker";
 const h=el("h3","Full teaching notes, examples and practical reasoning");
 const intro=el("p","This chapter includes "+count.toLocaleString()+" words of additional original textbook instruction, three worked examples, six explained technical terms and three reflective questions. Read the complete lesson before relying on a picture or practice score.");
 const print=el("button","Print these teaching notes");print.type="button";print.className="textbook-print";
 print.addEventListener("click",()=>window.print());
 overview.append(label,h,intro,print);
 const cover=reading.querySelector(".visual-manual-cover");
 if(cover)cover.after(overview);else reading.prepend(overview);
 articles.forEach((article,index)=>{
  article.appendChild(unitSection(units[index],index));
 });
 const meta=$("moduleMeta");
 if(meta)meta.textContent=count.toLocaleString()+" words of additional textbook teaching · 3 worked examples · 6 key terms · 3 reflective checks · independent self-study draft";
 // Preserve the existing graded local three-question practice and capstone.
}
document.addEventListener("agsa:coursebook-module",event=>{
 if(model.get(event.detail?.moduleId))queueMicrotask(()=>render(event.detail.moduleId));
});
document.addEventListener("DOMContentLoaded",()=>{
 const query=new URL(location.href).searchParams;
 const id=model.get(query.get("module"))?query.get("module"):null;
 const active=$("moduleTitle")?.textContent||"";
 const fromTitle=core.modules.find(m=>active.includes(m.title))?.id;
 const fallback=core.routes[$("route")?.value]?.[0]||core.modules[0].id;
 render(id||fromTitle||fallback);
});
})();
