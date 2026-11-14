/* The Academy's original, substantial 12-module aviation ground school.
 * Structured textbook narrative independent of unverified student grades and payment.
 */
(function(root){"use strict";
const parts=[root?.AGSALongChaptersA,root?.AGSALongChaptersB,root?.AGSALongChaptersC];
if(parts.some(p=>!p?.chapters))throw Error("A complete set of ground-school textbook chapters is required");
const chapters=Object.freeze(Object.assign({},...parts.map(p=>p.chapters)));
const words=s=>String(s).trim().split(/\s+/).filter(Boolean).length;
function moduleWordCount(id){
 const units=chapters[id]||[];
 return units.reduce((total,u)=>total+words([
  u.heading,...u.paragraphs,u.worked.title,u.worked.setup,...u.worked.steps,u.worked.result,
  ...u.terms.flat(),u.review.question,u.review.answer
 ].join(" ")),0);
}
function validate(modules){
 if(!Array.isArray(modules)||modules.length!==12||Object.keys(chapters).length!==12)
  throw Error("All 12 Academy modules must have long-form textbooks");
 let totalWords=0,totalSections=0,worked=0,glossary=0;
 for(const module of modules){
  const units=chapters[module.id];
  if(!units||units.length!==3||module.sections.length!==3)
   throw Error("Three complete sections required for "+module.id);
  for(const u of units){
   totalSections++;
   if(!u.heading||!Array.isArray(u.paragraphs)||u.paragraphs.length<2||
    u.paragraphs.some(p=>typeof p!=="string"||words(p)<95)||
    !u.worked?.title||!u.worked?.setup||u.worked.steps?.length!==3||
    u.worked.steps.some(s=>words(s)<11)||words(u.worked.result)<13||
    !Array.isArray(u.terms)||u.terms.length!==2||
    u.terms.some(term=>term.length!==2||words(term[1])<10)||
    words(u.review.question)<10||words(u.review.answer)<12)
    throw Error("Chapter lacks textbook depth and worked examples: "+module.id+" / "+u.heading);
   worked++;glossary+=u.terms.length;
  }
  const wordCount=moduleWordCount(module.id);
  if(wordCount<850)throw Error("Insufficient substantial chapter content: "+module.id+" ("+wordCount+" words)");
  totalWords+=wordCount;
 }
 if(totalWords<12000)throw Error("Twelve chapters must provide meaningful long-form content");
 return Object.freeze({modules:12,extendedSections:totalSections,workedExamples:worked,glossaryDefinitions:glossary,words:totalWords,version:"2026-11-14-textbook-1",status:"INSTRUCTOR_REVIEW_REQUIRED"});
}
const api=Object.freeze({chapters,get:id=>chapters[id]||null,moduleWordCount,validate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFullCoursebookChapters=api;
})(typeof window!=="undefined"?window:null);
